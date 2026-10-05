// lib/safety/normalisieren.ts
//
// Untrusted Provider-Zeilen werden strikt normalisiert.
// Unbekannte Felder werden ignoriert, ungültige Zeilen verworfen.

import {
  SAFETY_ADVISORY_CLASSES,
  SAFETY_AUTHORITY_CLASSES,
  SAFETY_EVENT_CATEGORIES,
  SAFETY_EVENT_STATUSES,
  SAFETY_GRENZEN,
  SAFETY_NATURES,
  SAFETY_SOURCE_SEVERITIES,
  enumLesen,
  safetyLandescode,
  type SafetyEventCategory,
  type SafetyEventStatus,
  type SafetyNature,
} from '@/lib/safety/domain'
import {
  authorityLesen,
  factSchluesselLesen,
  isoDatumLesen,
  isoZeitLesen,
  providerNameLesen,
  quelleUrlLesen,
  safetyEvidenceVertrauenswuerdig,
  sicherheitstextLesen,
  zeitMs,
  type SafetyEvidence,
} from '@/lib/safety/evidence'
import { scopeIdentitaet, spatialScopeLesen, type SafetySpatialScope } from '@/lib/safety/scope'

export type SafetyFact = {
  factKey: string
  category: SafetyEventCategory
  status: SafetyEventStatus
  nature: SafetyNature
  sourceSeverity: import('@/lib/safety/domain').SafetySourceSeverity | null
  advisoryClass: import('@/lib/safety/domain').SafetyAdvisoryClass | null
  spatialScope: SafetySpatialScope
  temporal: { start: string | null; end: string | null }
  travellerDependent: boolean
  travellerCitizenshipCodes: string[]
  evidence: SafetyEvidence
  vertrauenswuerdig: boolean
}

function optionalesFeld<T>(
  wert: unknown,
  lesen: (eingabe: unknown) => T | null,
): { ok: true; wert: T | null } | { ok: false } {
  if (wert == null || wert === '') return { ok: true, wert: null }
  const gelesen = lesen(wert)
  return gelesen == null ? { ok: false } : { ok: true, wert: gelesen }
}

export function safetyFactNormalisieren(
  roh: unknown,
  providerNameRoh: string,
  nowMs = Date.now(),
): SafetyFact | null {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return null
  const zeile = roh as Record<string, unknown>
  const category = enumLesen(zeile.category, SAFETY_EVENT_CATEGORIES)
  const factKey = factSchluesselLesen(zeile.factKey)
  if (!category || !factKey) return null
  if (zeile.availability === 'temporarily_unavailable') return null

  let nature: (typeof SAFETY_NATURES)[number] = 'acute'
  if (zeile.nature != null && zeile.nature !== '') {
    const gelesen = enumLesen(zeile.nature, SAFETY_NATURES)
    if (!gelesen) return null
    nature = gelesen
  }

  const validFrom = optionalesFeld(zeile.validFrom, isoDatumLesen)
  const validUntil = optionalesFeld(zeile.validUntil, isoDatumLesen)
  const freshUntil = optionalesFeld(zeile.freshUntil, isoZeitLesen)
  const checkedAtFeld = optionalesFeld(zeile.checkedAt, isoZeitLesen)
  const sourceSeverity = optionalesFeld(zeile.sourceSeverity, (wert) =>
    enumLesen(wert, SAFETY_SOURCE_SEVERITIES),
  )
  const advisoryClass = optionalesFeld(zeile.advisoryClass, (wert) =>
    enumLesen(wert, SAFETY_ADVISORY_CLASSES),
  )
  const authorityClass = optionalesFeld(zeile.authorityClass, (wert) =>
    enumLesen(wert, SAFETY_AUTHORITY_CLASSES),
  )
  if (
    !validFrom.ok ||
    !validUntil.ok ||
    !freshUntil.ok ||
    !checkedAtFeld.ok ||
    !sourceSeverity.ok ||
    !advisoryClass.ok ||
    !authorityClass.ok
  ) {
    return null
  }
  if (validFrom.wert && validUntil.wert && zeitMs(validFrom.wert) > zeitMs(validUntil.wert)) {
    return null
  }

  let status: (typeof SAFETY_EVENT_STATUSES)[number] = 'unknown'
  if (zeile.status != null && zeile.status !== '') {
    const gelesen = enumLesen(zeile.status, SAFETY_EVENT_STATUSES)
    if (!gelesen) return null
    status = gelesen
  }

  if (zeile.travellerDependent != null && typeof zeile.travellerDependent !== 'boolean') {
    return null
  }
  if (zeile.travellerCitizenshipCodes != null && !Array.isArray(zeile.travellerCitizenshipCodes)) {
    return null
  }

  const spatialScope = spatialScopeLesen(zeile.spatialScope)
  const temporal = { start: validFrom.wert, end: validUntil.wert }
  const provider = providerNameLesen(providerNameRoh)
  const checkedAt = checkedAtFeld.wert
  const authority = authorityLesen(zeile.authority ?? null)
  const sourceUrlRoh = zeile.sourceUrl ?? null
  const sourceUrl = quelleUrlLesen(sourceUrlRoh)
  const vertrauenswuerdig = safetyEvidenceVertrauenswuerdig({
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
    status,
    nature,
    sourceSeverity: sourceSeverity.wert,
    advisoryClass: advisoryClass.wert,
    spatialScope,
    temporal,
    travellerDependent: zeile.travellerDependent === true,
    travellerCitizenshipCodes: [
      ...new Set(
        (Array.isArray(zeile.travellerCitizenshipCodes) ? zeile.travellerCitizenshipCodes : [])
          .map((code) => safetyLandescode(code))
          .filter((code): code is string => Boolean(code)),
      ),
    ].sort(),
    evidence: {
      provider,
      authority,
      authorityClass: authorityClass.wert ?? 'unknown',
      sourceUrl,
      publishedAt: isoZeitLesen(zeile.publishedAt ?? null),
      updatedAt: isoZeitLesen(zeile.updatedAt ?? null),
      checkedAt,
      freshUntil: freshUntil.wert,
      validFrom: null,
      validUntil: null,
      headline: sicherheitstextLesen(zeile.headline, SAFETY_GRENZEN.headline),
      summary: sicherheitstextLesen(zeile.summary, SAFETY_GRENZEN.summary),
    },
    vertrauenswuerdig,
  }
}

export function entscheidungsSignatur(fact: SafetyFact): string {
  return [
    fact.category,
    fact.status,
    fact.nature,
    fact.sourceSeverity ?? '',
    fact.advisoryClass ?? '',
    scopeIdentitaet(fact.spatialScope),
    fact.temporal.start ?? '',
    fact.temporal.end ?? '',
    fact.evidence.freshUntil ?? '',
    fact.travellerDependent ? 'traveller' : 'trip',
    fact.travellerCitizenshipCodes.join(','),
  ].join('|')
}

export function evidenceBevorzugen(a: SafetyFact, b: SafetyFact): SafetyFact {
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
