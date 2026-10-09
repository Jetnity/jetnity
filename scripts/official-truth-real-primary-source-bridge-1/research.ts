import { z } from 'zod'
import { regelKandidatErstellen, regelScopeAusEvidenceScope } from '@/lib/readiness/rule-claims'
import { officialTruthRechercheEntscheiden } from '@/lib/readiness/official-truth-research-request'
import { nationalListResearchCatalog } from '../official-truth-integrated-pilot-1/official-source'

const country = z.string().regex(/^[A-Z]{2}$/)
export const selectionSchema = z.object({ citizenship: z.literal('CH'), documentClass: z.literal('ordinary_passport'),
  issuingCountry: country, relatedCitizenship: z.literal('CH').nullable(), destination: z.literal('GB'),
  transitCountry: country.nullable(), residenceCountry: country.nullable(), travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict()

export const SYNTHETIC_SELECTION = Object.freeze({ citizenship: 'CH', documentClass: 'ordinary_passport',
  issuingCountry: 'CH', relatedCitizenship: 'CH', destination: 'GB', transitCountry: null,
  residenceCountry: null, travelDate: '2026-10-10' })

/** Supplied selections are research intent, never inferred facts about a person.
 * Ordinary-passport subclass has no proof in the list or canonical passport atom.
 * Null residence/transit is explicit caller scope, never filled from citizenship. */
export function createGapResearch(selection: unknown) {
  if (selection === null) return { ok: false as const, reason: 'scope_not_selected' as const }
  const parsed = selectionSchema.safeParse(selection)
  if (!parsed.success) return { ok: false as const, reason: 'invalid_scope_selection' as const }
  const s = parsed.data
  const cell = regelScopeAusEvidenceScope({ destinationCountryCode: s.destination, transitCountryCode: s.transitCountry,
    citizenship: { mode: 'required', countryCodes: [s.citizenship] },
    credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: s.issuingCountry,
      relatedCitizenshipCountryCode: s.relatedCitizenship },
    residence: s.residenceCountry === null ? { mode: 'not_applicable' } : { mode: 'required', countryCode: s.residenceCountry },
    requirementType: 'electronic_travel_authorization', validity: { mode: 'travel_date', travelDate: s.travelDate } })
  if (!cell.ok) return { ok: false as const, reason: 'invalid_scope_selection' as const }
  const request = officialTruthRechercheEntscheiden({ status: 'missing', ruleScopeKey: cell.key, factKind: 'requirement_effect' }, cell.scope)
  const candidate = regelKandidatErstellen({ scope: cell.scope, factKind: 'requirement_effect',
    evidenceQuality: 'research_gap', supportVersionIds: [], proposal: null }, nationalListResearchCatalog().registry)
  if (request.action !== 'research' || !candidate.ok) return { ok: false as const, reason: 'canonical_research_refused' as const }
  return { ok: true as const, selection: s, requestKey: request.request.key,
    candidate: candidate.kandidat, documentSubclassProven: false as const }
}

// Observation freshness is a local research policy, NOT legal effectiveness.
// A single selected item does not establish agreement with the unexamined Appendix.
export function observationAge(retrievedAt: string, referenceAt: string): 'research_gap' | 'stale_primary_evidence' | 'invalid_reference_time' {
  const r = Date.parse(retrievedAt), n = Date.parse(referenceAt)
  if (!Number.isFinite(r) || !Number.isFinite(n) || n < r) return 'invalid_reference_time'
  return n - r > 86_400_000 ? 'stale_primary_evidence' : 'research_gap'
}
