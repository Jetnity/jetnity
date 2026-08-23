// lib/safety/normalisieren.ts
//
// Untrusted Provider-Zeilen werden strikt normalisiert.
// Unbekannte Felder werden ignoriert, ungültige Zeilen verworfen.

import {
  SAFETY_ADVISORY_CLASSES,
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
  authorityClassLesen,
  authorityLesen,
  factSchluesselLesen,
  isoZeitLesen,
  providerNameLesen,
  quelleUrlLesen,
  safetyEvidenceVertrauenswuerdig,
  sicherheitstextLesen,
  type SafetyEvidence,
} from '@/lib/safety/evidence'
import type { SafetyProviderFact } from '@/lib/safety/provider'
import { scopeIdentitaet, spatialScopeLesen, temporalScopeLesen, type SafetySpatialScope } from '@/lib/safety/scope'

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

export function safetyFactNormalisieren(
  roh: SafetyProviderFact,
  providerNameRoh: string,
  nowMs = Date.now(),
): SafetyFact | null {
  const category = enumLesen(roh.category, SAFETY_EVENT_CATEGORIES)
  const factKey = factSchluesselLesen(roh.factKey)
  if (!category || !factKey) return null
  if (roh.availability === 'temporarily_unavailable') return null

  let nature: (typeof SAFETY_NATURES)[number] = 'acute'
  if (roh.nature != null && roh.nature !== '') {
    const gelesen = enumLesen(roh.nature, SAFETY_NATURES)
    if (!gelesen) return null
    nature = gelesen
  }

  const spatialScope = spatialScopeLesen(roh.spatialScope)
  const temporal = temporalScopeLesen(roh)
  const provider = providerNameLesen(providerNameRoh)
  const checkedAt = isoZeitLesen(roh.checkedAt ?? null)
  const freshUntil = isoZeitLesen(roh.freshUntil ?? null)
  const authority = authorityLesen(roh.authority ?? null)
  const sourceUrlRoh = roh.sourceUrl ?? null
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
    status: enumLesen(roh.status, SAFETY_EVENT_STATUSES) ?? 'unknown',
    nature,
    sourceSeverity: enumLesen(roh.sourceSeverity, SAFETY_SOURCE_SEVERITIES),
    advisoryClass: enumLesen(roh.advisoryClass, SAFETY_ADVISORY_CLASSES),
    spatialScope,
    temporal,
    travellerDependent: roh.travellerDependent === true,
    travellerCitizenshipCodes: [
      ...new Set(
        (roh.travellerCitizenshipCodes ?? [])
          .map((code) => safetyLandescode(code))
          .filter((code): code is string => Boolean(code)),
      ),
    ].sort(),
    evidence: {
      provider,
      authority,
      authorityClass: authorityClassLesen(roh.authorityClass),
      sourceUrl,
      publishedAt: isoZeitLesen(roh.publishedAt ?? null),
      updatedAt: isoZeitLesen(roh.updatedAt ?? null),
      checkedAt,
      freshUntil,
      validFrom: null,
      validUntil: null,
      headline: sicherheitstextLesen(roh.headline, SAFETY_GRENZEN.headline),
      summary: sicherheitstextLesen(roh.summary, SAFETY_GRENZEN.summary),
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
  return a
}
