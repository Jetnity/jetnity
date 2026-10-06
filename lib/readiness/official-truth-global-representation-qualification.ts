// Pure finite synthetic qualification. No production profile/issuer or registration.
import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import { historical, historicalPinFor, historicalValuesEqual, ownRecord, provenanceCanonical, refused } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { readHistoricalArtifact } from '@/lib/readiness/official-truth-autonomous-provenance-record'

// Complete synthetic public language: no arbitrary strings, unused extension fields or PII regex.
const body = '{"publication":"passport-validity","rule":"valid_on_entry","schema":"synthetic-global-regulation-v1"}'
const binding = Object.freeze({ sourceId: 'example-authority', contentItemId: 'example-passport-rule', contentItemVersion: 1,
  representationId: 'text', representationVersion: 1, identityProfileId: 'example-public-rule', identityProfileVersion: 1 })
const url = 'https://authority.example/global/passport'
const contract = Object.freeze({ schema: 'synthetic-qualification-contract-v1', initialUrl: url, finalUrl: url,
  method: 'GET', credentials: 'omit', contentType: 'application/json', completeResponse: body })
function syntheticPin(name: string) { return historicalPinFor(name, 1, { fixture: name, contract })! }
export const SYNTHETIC_GLOBAL_REPRESENTATION_QUALIFICATION = Object.freeze({
  kind: 'GlobalRepresentationQualificationV1' as const, schemaVersion: 1 as const,
  value: Object.freeze({ binding, itemDefinition: syntheticPin('synthetic-item'), representationDefinition: syntheticPin('synthetic-representation'),
    identityProfileDefinition: syntheticPin('synthetic-profile'), qualificationContract: syntheticPin('synthetic-qualification') }),
})

/** Supplied immutable observations only. A successful fixture verdict has NO live authority. */
export function qualifySyntheticGlobalRepresentation(qualification: unknown, observation: unknown) {
  const q = readHistoricalArtifact('GlobalRepresentationQualificationV1', qualification)
  if (!q.ok || !historicalValuesEqual(q.value, SYNTHETIC_GLOBAL_REPRESENTATION_QUALIFICATION)
    || provenanceCanonical(observation, 65_536) === null) return refused('representation_not_global')
  const row = ownRecord(observation, ['binding', 'requestUrl', 'finalUrl', 'contentType', 'method', 'credentials', 'headers', 'redirects', 'bodyText'])
  if (!row || !historicalValuesEqual(row.binding, binding) || row.requestUrl !== url || row.finalUrl !== url
    || row.contentType !== 'application/json' || row.method !== 'GET' || row.credentials !== 'omit'
    || !historicalValuesEqual(row.headers, {}) || !historicalValuesEqual(row.redirects, [])
    || row.bodyText !== body) return refused('representation_not_global')
  const hash = evidenceQuellenFingerprint(body)
  return hash ? historical({ qualification: q.value, binding, sourceContentHash: hash }) : refused('representation_not_global')
}
