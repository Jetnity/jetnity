import { z } from 'zod'
import { immutable, provenanceCanonical } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { regelKandidatErstellen, regelScopeAusEvidenceScope } from '@/lib/readiness/rule-claims'
import { officialTruthRechercheEntscheiden } from '@/lib/readiness/official-truth-research-request'
import { quellenRegistryErstellen } from '@/lib/readiness/source-registry'

const date = z.string().regex(/^20\d{2}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
})
const selection = z.object({
  citizenshipCountryCodes: z.tuple([z.literal('CH')]),
  credentialCount: z.literal(1),
  selectedCredential: z.object({ documentType: z.literal('passport'), documentClass: z.literal('ordinary_passport'),
    issuingCountryCode: z.literal('CH'), relatedCitizenshipCountryCode: z.literal('CH') }).strict(),
  originCountryCode: z.literal('CH'), destinationCountryCode: z.literal('DE'),
  transitCountryCodes: z.tuple([]), directJourney: z.literal(true),
  purpose: z.literal('tourism'), travelDate: date, endDate: date,
  residenceCountryCode: z.literal('CH'),
}).strict().refine(value => value.endDate >= value.travelDate)

/** Non-personal research intent only. These declarations do not verify a
 * traveller, ordinary subclass, route, purpose or source. Never an acceptance
 * envelope: the canonical scope cannot yet encode all those predicates. */
export function chDeVisaResearch(input: unknown) {
  // Existing bounded plain-data scanner runs before Zod/property reads.
  if (provenanceCanonical(input, 2_048) === null) return { ok: false as const, reason: 'invalid_research_scope' as const }
  const parsed = selection.safeParse(input)
  if (!parsed.success) return { ok: false as const, reason: 'unsupported_research_scope' as const }
  const s = parsed.data
  const cell = regelScopeAusEvidenceScope({ destinationCountryCode: s.destinationCountryCode, transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: s.citizenshipCountryCodes },
    credentialOption: { mode: 'option', documentType: s.selectedCredential.documentType,
      issuingCountryCode: s.selectedCredential.issuingCountryCode, relatedCitizenshipCountryCode: s.selectedCredential.relatedCitizenshipCountryCode },
    residence: { mode: 'required', countryCode: s.residenceCountryCode }, requirementType: 'visa',
    validity: { mode: 'travel_date', travelDate: s.travelDate } })
  const empty = quellenRegistryErstellen([])
  if (!cell.ok || !empty.ok) return { ok: false as const, reason: 'canonical_research_refused' as const }
  const request = officialTruthRechercheEntscheiden({ status: 'missing', ruleScopeKey: cell.key, factKind: 'requirement_effect' }, cell.scope)
  const candidate = regelKandidatErstellen({ scope: cell.scope, factKind: 'requirement_effect',
    evidenceQuality: 'research_gap', supportVersionIds: [], proposal: null }, empty.registry)
  if (request.action !== 'research' || !candidate.ok) return { ok: false as const, reason: 'canonical_research_refused' as const }
  return immutable({ ok: true as const, status: 'RESEARCH_GAP' as const, candidate: candidate.kandidat,
    researchRequest: request.request, declaredSelection: s, accepted: false as const,
    validFrom: null, validUntil: null, sourceCheckedAt: null,
    unrepresentedPredicates: ['ordinary_document_subclass', 'purpose', 'direct_route', 'stay_end'] as const })
}
