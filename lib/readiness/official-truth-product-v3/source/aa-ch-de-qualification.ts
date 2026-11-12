import 'server-only'

import { sha256Hex } from '@/lib/readiness/digest'
import { contentEvidenceLookupV3 } from '@/lib/readiness/official-truth-content-identity'
import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import { officialTruthSourceFingerprintProtocol, officialTruthSourceFingerprintV2 } from '@/lib/readiness/official-truth-source-fingerprint-v2'
import { immutable, ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { createV3ContextIdentity, type V3ReadClock, type V3SourceObservationRecord } from '../contract'
import {
  hrs1Canonical, hrs1Clock, hrs1Data, hrs1Method, hrs1Same, hrs1Time, readHrs1Binding,
  type Hrs1Binding, type Hrs1Original,
} from '../result/contract'
import { AA_CH_DE_PUBLICATION, BERN_CH_DE_PUBLICATION, selectedAaChDeQualification,
  type AaChDeQualificationProgram, type AaChDeSemanticResult } from './aa-ch-de-definition'
import type { AaChDeOwnedOriginal } from './aa-ch-de-owned-read'

/** Configuration validation is not a read, source receipt or method approval. */
export function selectedAaChDeProgramForBinding(binding: Hrs1Binding): AaChDeQualificationProgram | null {
  const program = selectedAaChDeQualification()
  if (!program || !hrs1Data(binding) || !readHrs1Binding(binding, program.registry) || !hrs1Same(binding, program.binding)
    || binding.dataMode !== 'official_projection' || binding.qualificationScope !== 'global_context'
    || !Number.isSafeInteger(program.revision) || program.revision < 1
    || program.method.methodId !== 'jetnity-destination-primary-ch-de-visa'
    || !hrs1Same(hrs1Method(binding), program.method) || binding.legalTimeZone !== program.legalTimeZone
    || !hrs1Same(binding.context, program.context) || binding.contextKey !== program.contextKey
    || binding.sources.length !== 2 || !hrs1Same(binding.sources, [program.sourceBinding, program.counter.sourceBinding])
    || !hrs1Same(program.sourceBinding.source, program.source) || program.sourceBinding.role !== 'primary'
    || program.sourceBinding.canonicalUrl !== AA_CH_DE_PUBLICATION.url || program.sourceBinding.contentType !== 'text/html'
    || !hrs1Same(program.counter.sourceBinding.source, program.counter.source) || program.counter.sourceBinding.role !== 'counter'
    || program.counter.sourceBinding.canonicalUrl !== BERN_CH_DE_PUBLICATION.url || program.counter.sourceBinding.contentType !== 'text/html'
    || program.source.contentItemId === program.counter.source.contentItemId
    || !Number.isSafeInteger(program.counterInventory.revision) || program.counterInventory.revision < 1
    || !hrs1Same(program.counterInventory.eligibleRepresentations, [program.counter.source])
    || typeof program.documentIdentity !== 'function' || typeof program.interpret !== 'function'
    || typeof program.counter.documentIdentity !== 'function' || typeof program.counter.interpret !== 'function'
    || typeof program.compare !== 'function') return null
  const identity = createV3ContextIdentity(program.context)
  return identity.ok && identity.value.contextKey === program.contextKey ? program : null
}

export type AaChDeQualifiedData = Readonly<{
  original: Hrs1Original;
  outcome: Readonly<{ status: 'clear'; observation: V3SourceObservationRecord }>
    | Readonly<{ status: 'unclear'; reason: 'ambiguous_statement' | 'unqualified_destination_authority' | 'invalid_or_unknown_validity';
      evidence: V3SourceObservationRecord['evidence'] }>;
}>

/** Pure checked data only. Real origin comes from the issuer's private receipt
 * for the corresponding fixed reader. A DTO call cannot issue HRS custody. */
export function qualifyAaChDeOriginal(raw: AaChDeOwnedOriginal, binding: Hrs1Binding, clock: V3ReadClock): AaChDeQualifiedData | null {
  try {
    const program = selectedAaChDeProgramForBinding(binding)
    if (!program || !hrs1Data(raw) || !ownRecord(raw, ['role','requestUrl','finalUrl','method','redirectCount','httpStatus',
      'contentType','bodyText','bytes','rawDigest','retrievedAt','startedAt']) || !['primary','counter'].includes(raw.role)) return null
    const selected = raw.role === 'primary' ? program : program.counter
    const publication = raw.role === 'primary' ? AA_CH_DE_PUBLICATION : BERN_CH_DE_PUBLICATION
    if (!hrs1Same(clock, hrs1Clock(clock.now, binding.legalTimeZone)) || !hrs1Time(raw.retrievedAt) || !hrs1Time(raw.startedAt)
      || raw.startedAt > raw.retrievedAt || raw.retrievedAt > clock.now || clock.now < binding.activeFrom
      || clock.now >= binding.activeUntilExclusive || Date.parse(clock.now) - Date.parse(raw.retrievedAt) >= binding.sourceMaxAgeMilliseconds
      || raw.requestUrl !== publication.url || raw.finalUrl !== raw.requestUrl || raw.method !== 'GET'
      || raw.redirectCount !== 0 || raw.httpStatus !== 200 || raw.contentType !== 'text/html'
      || typeof raw.bodyText !== 'string' || raw.bytes !== new TextEncoder().encode(raw.bodyText).byteLength
      || raw.bytes < 1 || raw.bytes > publication.maximumBytes || raw.rawDigest !== sha256Hex(raw.bodyText)) return null
    const protocol = officialTruthSourceFingerprintProtocol(raw.bodyText, raw.bytes)
    const fingerprint = protocol === 2
      ? officialTruthSourceFingerprintV2(raw.bodyText, { ...selected.source, canonicalUrl: raw.finalUrl, contentType: raw.contentType })
      : protocol === 1 ? evidenceQuellenFingerprint(raw.bodyText) : null
    const lookup = contentEvidenceLookupV3(binding.context.scope, selected.source)
    if (!protocol || !fingerprint || !lookup.ok) return null
    const interpretation: AaChDeSemanticResult = selected.documentIdentity(raw.bodyText)
      ? selected.interpret(raw.bodyText) : { status: 'unclear', reason: 'unqualified_destination_authority' }
    if (!hrs1Data(interpretation) || !['clear','unclear'].includes(interpretation.status)) return null
    const versionId = 'ev2_' + sha256Hex(hrs1Canonical({ source: selected.source, contextKey: binding.contextKey,
      rawDigest: raw.rawDigest, retrievedAt: raw.retrievedAt, protocol, fingerprint })).slice(0, 32)
    const evidence: V3SourceObservationRecord['evidence'] = {
      versionId, lookupKey: lookup.value.key, source: selected.source, sourceFingerprintProtocol: protocol,
      sourceContentHash: fingerprint, retrievedAt: raw.retrievedAt,
      legalValidity: interpretation.status === 'clear' ? interpretation.legalValidity : { status: 'unresolved' },
    }
    const qualification = { qualificationDigest: selected.sourceBinding.qualificationDigest, source: selected.source,
      contextKey: binding.contextKey, method: program.method, checkedAt: clock.now, role: raw.role }
    const reason = interpretation.status === 'clear' && (interpretation.legalValidity.status !== 'specified'
      || (interpretation.legalValidity.validFrom !== null && interpretation.legalValidity.validFrom > clock.legalDate)
      || (interpretation.legalValidity.validUntil !== null && interpretation.legalValidity.validUntil < clock.legalDate))
      ? 'invalid_or_unknown_validity' as const : interpretation.status === 'unclear' ? interpretation.reason : null
    if (reason !== null) {
      if (!['ambiguous_statement','unqualified_destination_authority','invalid_or_unknown_validity'].includes(reason)) return null
      const ambiguity = { context: binding.context, contextKey: binding.contextKey, evidence, reason }
      const original: Hrs1Original = { observation: null, ambiguity, bodyText: raw.bodyText, rawDigest: raw.rawDigest,
        extraction: { executableDigest: selected.sourceBinding.executableDigest, observation: null, ambiguity }, qualification }
      return immutable({ original, outcome: { status: 'unclear', reason, evidence } })
    }
    if (interpretation.status !== 'clear' || interpretation.fact.fact.kind !== binding.factKind) return null
    const observation: V3SourceObservationRecord = { context: binding.context, contextKey: binding.contextKey,
      fact: interpretation.fact, evidence }
    const original: Hrs1Original = { observation, bodyText: raw.bodyText, rawDigest: raw.rawDigest,
      extraction: { executableDigest: selected.sourceBinding.executableDigest, observation }, qualification }
    return immutable({ original, outcome: { status: 'clear', observation } })
  } catch { return null }
}
