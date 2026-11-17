// AT whole-original V2 mechanical handoff, strictly RESEARCH_ONLY.
// A caller-provided HTTP record is never a native source-custody receipt.
// Legal extraction, V3 method authority, BG1 and accepted visitor results are NOT issued here.
import 'server-only'
import { createHash } from 'node:crypto'
import { bindAtOfficialRetrieval, type AtRetrievalInput } from '../official-truth-at-source-reader/bind'
import { AT_OFFICIAL_PUBLICATIONS } from '../official-truth-at-source-reader/publications'
import { AT_V3_METHOD_PREPARATION } from './at-v3-method-preparation'

export type AtWholeSourceV2 =
  | Readonly<{status: 'quarantined'; disposition: 'RESEARCH_ONLY'; publisherAuthority: 'not_issued';
     methodAuthorized: false; acceptedFactCount: 0; importable: false; originalCount: 3;
     originals: readonly Readonly<{sourceId: string; url: string; byteLength: number; sha256: string;
        retrievedAt: string; editorialEdition: string | null}>[] }>
  | Readonly<{status: 'unavailable'; reason: 'missing_or_duplicate_source'|'source_framing_or_length'
    |'source_identity_or_version'; acceptedFactCount: 0; importable: false}>

const limit = 524288
const reject = (reason: Extract<AtWholeSourceV2,{status:'unavailable'}>['reason']): AtWholeSourceV2 =>
  Object.freeze({status:'unavailable',reason,acceptedFactCount:0,importable:false})

function exactByteDigest(body: Uint8Array): string {
  return createHash('sha256').update(body).digest('hex')
}

/** Requires *all* three exact full original byte bodies, never a subset or excerpt.
 * Inputs remain untrusted: their transport provenance is independently checked by
 * the code-owned reader and its held issuance before any future V3 acceptance. */
export function inspectAtWholeSourceV2(input: readonly AtRetrievalInput[]): AtWholeSourceV2 {
  if (!Array.isArray(input) || input.length !== AT_OFFICIAL_PUBLICATIONS.length
    || new Set(input.map(value => value?.publicationId)).size !== AT_OFFICIAL_PUBLICATIONS.length) {
    return reject('missing_or_duplicate_source')
  }
  const result: Extract<AtWholeSourceV2,{status:'quarantined'}>['originals'][number][] = []
  for (let index=0; index<AT_OFFICIAL_PUBLICATIONS.length;index++) {
    const publication=AT_OFFICIAL_PUBLICATIONS[index]!
    const pin=AT_V3_METHOD_PREPARATION.sourcePins[index]!
    const raw=input[index]
    if (!raw || raw.publicationId!==publication.id || pin.publicationId!==publication.id
      || raw.requestUrl!==publication.url || raw.finalUrl!==publication.url
      || !(raw.body instanceof Uint8Array)
      || raw.body.byteLength<1 || raw.body.byteLength>limit
      || raw.body.byteLength!==pin.originalBytes) return reject('source_framing_or_length')
    const bound=bindAtOfficialRetrieval(raw)
    if (bound.status!=='bound' || bound.sha256!==pin.originalSha256
      || exactByteDigest(raw.body)!==pin.originalSha256
      || bound.byteLength!==pin.originalBytes || bound.requestUrl!==pin.url) return reject('source_identity_or_version')
    const version=bound.versionObservation
    if (publication.id==='bmi-visa-nationality-matrix'
      ? version.status!=='single_observed_token' || version.token!=='6.11.2026'
      : version.status!=='absent') return reject('source_identity_or_version')
    result.push(Object.freeze({sourceId:publication.id,url:publication.url,
      byteLength:bound.byteLength,sha256:bound.sha256,retrievedAt:bound.retrievedAt,
      editorialEdition:pin.observedEdition}))
  }
  return Object.freeze({status:'quarantined',disposition:'RESEARCH_ONLY',
    publisherAuthority:'not_issued',methodAuthorized:false,acceptedFactCount:0,
    importable:false,originalCount:3,originals:Object.freeze(result)})
}
