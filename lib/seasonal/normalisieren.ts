// lib/seasonal/normalisieren.ts
//
// Untrusted Provider-Zeilen werden strikt normalisiert.
// Unbekannte Felder werden ignoriert, ungültige Zeilen verworfen.
// Reference Period ist Metadatum, kein Travel Window.

import {
  SEASONAL_ABGEWIESENE_KLASSEN,
  SEASONAL_AUTHORITY_CLASSES,
  SEASONAL_CATEGORIES,
  SEASONAL_EVIDENCE_CLASSES,
  SEASONAL_GRENZEN,
  SEASONAL_IMPACT_DOMAINS,
  SEASONAL_OUTCOMES,
  enumLesen,
  type SeasonalCategory,
  type SeasonalEvidenceClass,
  type SeasonalImpactDomain,
  type SeasonalOutcome,
} from '@/lib/seasonal/domain'
import {
  authorityLesen,
  factSchluesselLesen,
  providerNameLesen,
  quelleUrlLesen,
  seasonalEvidenceVertrauenswuerdig,
  sicherheitstextLesen,
  type SeasonalEvidence,
} from '@/lib/seasonal/evidence'
import {
  referencePeriodLesen,
  travelWindowIdentitaet,
  travelWindowLesen,
  type SeasonalTravelWindow,
} from '@/lib/seasonal/fenster'
import { isoZeitLesen, zeitMs } from '@/lib/seasonal/kalender'
import { scopeIdentitaet, spatialScopeLesen, type SeasonalSpatialScope } from '@/lib/seasonal/scope'

export type SeasonalFact = {
  factKey: string
  category: SeasonalCategory
  evidenceClass: SeasonalEvidenceClass
  outcome: SeasonalOutcome
  spatialScope: SeasonalSpatialScope
  travelWindow: SeasonalTravelWindow
  affectedDomains: SeasonalImpactDomain[]
  evidence: SeasonalEvidence
  vertrauenswuerdig: boolean
  acuteRejected: boolean
  sourceTemporarilyUnavailable: boolean
}

function optionalesFeld<T>(
  wert: unknown,
  lesen: (eingabe: unknown) => T | null,
): { ok: true; wert: T | null } | { ok: false } {
  if (wert == null || wert === '') return { ok: true, wert: null }
  const gelesen = lesen(wert)
  return gelesen == null ? { ok: false } : { ok: true, wert: gelesen }
}

function betroffeneDomainsLesen(wert: unknown): SeasonalImpactDomain[] | null {
  if (wert == null) return []
  if (!Array.isArray(wert)) return null
  const liste: SeasonalImpactDomain[] = []
  for (const eintrag of wert) {
    const domain = enumLesen(eintrag, SEASONAL_IMPACT_DOMAINS)
    if (!domain) return null
    liste.push(domain)
  }
  return [...new Set(liste)].sort()
}

export function seasonalFactNormalisieren(
  roh: unknown,
  providerNameRoh: string,
  nowMs = Date.now(),
): SeasonalFact | null {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return null
  const zeile = roh as Record<string, unknown>
  const category = enumLesen(zeile.category, SEASONAL_CATEGORIES)
  const factKey = factSchluesselLesen(zeile.factKey)
  if (!category || !factKey) return null
  if (zeile.availability != null && zeile.availability !== '') {
    if (zeile.availability === 'temporarily_unavailable') {
      return {
        factKey,
        category,
        evidenceClass: 'seasonal_pattern',
        outcome: 'unknown',
        spatialScope: { kind: 'insufficient' },
        travelWindow: { kind: 'insufficient' },
        affectedDomains: [],
        evidence: {
          provider: providerNameLesen(providerNameRoh),
          authority: null,
          authorityClass: 'unknown',
          sourceUrl: null,
          publishedAt: null,
          updatedAt: null,
          checkedAt: null,
          freshUntil: null,
          headline: null,
          summary: null,
          referencePeriod: null,
        },
        vertrauenswuerdig: false,
        acuteRejected: false,
        sourceTemporarilyUnavailable: true,
      }
    }
    if (zeile.availability !== 'ok') return null
  }

  if (zeile.evidenceClass != null && zeile.evidenceClass !== '') {
    if (enumLesen(zeile.evidenceClass, SEASONAL_ABGEWIESENE_KLASSEN)) {
      return {
        factKey,
        category,
        evidenceClass: 'seasonal_pattern',
        outcome: 'unknown',
        spatialScope: { kind: 'insufficient' },
        travelWindow: { kind: 'insufficient' },
        affectedDomains: [],
        evidence: {
          provider: providerNameLesen(providerNameRoh),
          authority: null,
          authorityClass: 'unknown',
          sourceUrl: null,
          publishedAt: null,
          updatedAt: null,
          checkedAt: null,
          freshUntil: null,
          headline: null,
          summary: null,
          referencePeriod: null,
        },
        vertrauenswuerdig: false,
        acuteRejected: true,
        sourceTemporarilyUnavailable: false,
      }
    }
  }

  const evidenceClass =
    zeile.evidenceClass == null || zeile.evidenceClass === ''
      ? 'seasonal_pattern'
      : enumLesen(zeile.evidenceClass, SEASONAL_EVIDENCE_CLASSES)
  if (!evidenceClass) return null

  const outcome =
    zeile.outcome == null || zeile.outcome === ''
      ? 'unknown'
      : enumLesen(zeile.outcome, SEASONAL_OUTCOMES)
  if (!outcome) return null

  const freshUntil = optionalesFeld(zeile.freshUntil, isoZeitLesen)
  const checkedAtFeld = optionalesFeld(zeile.checkedAt, isoZeitLesen)
  const publishedAt = optionalesFeld(zeile.publishedAt, isoZeitLesen)
  const updatedAt = optionalesFeld(zeile.updatedAt, isoZeitLesen)
  const authorityClass = optionalesFeld(zeile.authorityClass, (wert) =>
    enumLesen(wert, SEASONAL_AUTHORITY_CLASSES),
  )
  if (!freshUntil.ok || !checkedAtFeld.ok || !publishedAt.ok || !updatedAt.ok || !authorityClass.ok) {
    return null
  }
  if (freshUntil.wert && checkedAtFeld.wert && zeitMs(freshUntil.wert) < zeitMs(checkedAtFeld.wert)) {
    return null
  }

  const spatialScope = spatialScopeLesen(zeile.spatialScope)
  const travelWindow = travelWindowLesen(zeile.travelWindow)
  if (travelWindow.kind === 'insufficient') return null
  const referencePeriod = zeile.referencePeriod == null ? null : referencePeriodLesen(zeile.referencePeriod)
  if (zeile.referencePeriod != null && !referencePeriod) return null
  const affectedDomains = betroffeneDomainsLesen(zeile.affectedDomains)
  if (!affectedDomains) return null

  const provider = providerNameLesen(providerNameRoh)
  const checkedAt = checkedAtFeld.wert
  const authority = authorityLesen(zeile.authority ?? null)
  if (zeile.sourceUrl != null && zeile.sourceUrl !== '' && typeof zeile.sourceUrl !== 'string') {
    return null
  }
  const sourceUrlRoh = zeile.sourceUrl ?? null
  const sourceUrl = quelleUrlLesen(sourceUrlRoh)
  const vertrauenswuerdig = seasonalEvidenceVertrauenswuerdig({
    provider,
    checkedAt,
    authority,
    sourceUrl,
    sourceUrlRoh,
    nowMs,
  })

  return {
    factKey,
    category,
    evidenceClass,
    outcome,
    spatialScope,
    travelWindow,
    affectedDomains,
    evidence: {
      provider,
      authority,
      authorityClass: authorityClass.wert ?? 'unknown',
      sourceUrl,
      publishedAt: publishedAt.wert,
      updatedAt: updatedAt.wert,
      checkedAt,
      freshUntil: freshUntil.wert,
      headline: sicherheitstextLesen(zeile.headline, SEASONAL_GRENZEN.headline),
      summary: sicherheitstextLesen(zeile.summary, SEASONAL_GRENZEN.summary),
      referencePeriod,
    },
    vertrauenswuerdig,
    acuteRejected: false,
    sourceTemporarilyUnavailable: false,
  }
}

export function entscheidungsSignatur(fact: SeasonalFact): string {
  return [
    fact.category,
    fact.evidenceClass,
    fact.outcome,
    scopeIdentitaet(fact.spatialScope),
    travelWindowIdentitaet(fact.travelWindow),
    fact.affectedDomains.join(','),
  ].join('|')
}

export function evidenceBevorzugen(a: SeasonalFact, b: SeasonalFact): SeasonalFact {
  if (a.vertrauenswuerdig !== b.vertrauenswuerdig) return a.vertrauenswuerdig ? a : b
  const aCheck = a.evidence.checkedAt ?? ''
  const bCheck = b.evidence.checkedAt ?? ''
  if (aCheck !== bCheck) return aCheck > bCheck ? a : b
  const aUrl = a.evidence.sourceUrl ?? ''
  const bUrl = b.evidence.sourceUrl ?? ''
  if (aUrl !== bUrl) return aUrl < bUrl ? a : b
  const aUpdated = a.evidence.updatedAt ?? ''
  const bUpdated = b.evidence.updatedAt ?? ''
  if (aUpdated !== bUpdated) return aUpdated > bUpdated ? a : b
  const aFresh = a.evidence.freshUntil ?? ''
  const bFresh = b.evidence.freshUntil ?? ''
  if (aFresh !== bFresh) return aFresh < bFresh ? a : b
  return a.factKey <= b.factKey ? a : b
}
