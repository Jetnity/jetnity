import assert from 'node:assert/strict'
import { test } from 'node:test'

import { readHistoricalArtifact } from '@/lib/readiness/official-truth-autonomous-provenance-record'
import { officialTruthAbdeckungBewerten } from '@/lib/readiness/official-truth-coverage'
import {
  officialTruthCompositionPhaseA,
  officialTruthCompositionPhaseB,
  officialTruthCompositionZitatePruefen,
} from '@/lib/readiness/official-truth-composition-policy-registry'
import {
  createIntegratedPilotArtifact,
  readIntegratedPilotArtifact,
  readIntegratedPilotReceipt,
  verifyIntegratedPilotBundle,
  verifyLocalIntegratedPilotBundle,
} from '@/lib/readiness/official-truth-integrated-pilot-bundle'
import { decideOfficialTruthSameRequestTrustedFactExtraction } from '@/lib/readiness/official-truth-same-request-extraction-server'
import { decideOfficialTruthSameRequestProof } from '@/lib/readiness/official-truth-same-request-proof-server'
import {
  officialTruthServerHeldEvidenceAnnehmen,
  officialTruthServerHeldMaterialPruefen,
  officialTruthServerHeldRegelKandidat,
  officialTruthServerHeldReviewPacket,
  officialTruthServerHeldReviewReproof,
  officialTruthServerHeldSameRequestMaterial,
} from '@/lib/readiness/official-truth-server-held-source-registry'
import { akzeptierteEvidenceSpeichern, akzeptierteRegelClaimSpeichern } from '@/lib/readiness/official-truth-store-server'
import { prepareOriginals, bindCandidate, reviewCandidate, persistCandidate, readCandidate } from '../../scripts/db/official-truth-original-custody-1/storage'
import { SYNTHETIC_PREFIX, observePilot } from '@/lib/readiness/fixtures/whole-source-current-request-1/harness.test'

test('store, bundle, custody, reproof, autonomous and composition paths refuse protocol 3 before transport', async () => {
  const artifacts: unknown[] = []
  for (const bytes of [SYNTHETIC_PREFIX.length, 371_444, 393_216]) {
    const observed = await observePilot(bytes)
    if (!observed.retrieval || observed.retrieval.status !== 'server_owned_official_retrieval') {
      throw new Error(`retrieval ${bytes}`)
    }
    assert.equal(observed.retrieval.sourceFingerprintProtocol, 3)
    assert.equal(Buffer.byteLength(observed.retrieval.sourceSnapshot), bytes)
    artifacts.push(observed.retrieval, observed.packet)
  }
  const real = artifacts[0] as { sourceSnapshot: string; sourceFingerprintProtocol: 3 }
  artifacts.push({ ...real, sourceSnapshot: 'x' })
  for (const body of artifacts) {
    let calls = 0
    const transport = { aufrufen: async () => { calls += 1; return { ok: false as const } } }
    const catalog = { transport }
    const stored = await akzeptierteEvidenceSpeichern(body, () => new Date(), body, { transport })
    const claim = await akzeptierteRegelClaimSpeichern(body, { transport })
    assert.equal(stored.ok, false)
    assert.equal(claim.ok, false)
    assert.equal(calls, 0)

    assert.equal(readIntegratedPilotReceipt(body).ok, false)
    assert.equal(createIntegratedPilotArtifact('cell' as never, 'synthetic-cell', 1, body as never).ok, false)
    assert.equal(readIntegratedPilotArtifact(body as never).ok, false)
    assert.equal(verifyIntegratedPilotBundle(body as never).ok, false)
    assert.equal(verifyLocalIntegratedPilotBundle(body as never).ok, false)
    assert.equal(readHistoricalArtifact('GlobalCellAdmissionV1', body).ok, false)

    const material = await officialTruthServerHeldMaterialPruefen(body, () => new Date(), catalog)
    const evidence = await officialTruthServerHeldEvidenceAnnehmen(body, () => new Date(), body, catalog)
    const review = await officialTruthServerHeldReviewPacket(body, catalog)
    const reproof = await officialTruthServerHeldReviewReproof(body, catalog, () => new Date())
    const same = await officialTruthServerHeldSameRequestMaterial(body, catalog, () => new Date())
    const kandidat = await officialTruthServerHeldRegelKandidat([body], body, catalog)
    assert.equal(material.status, 'blocked')
    assert.equal(evidence.status, 'blocked')
    assert.equal(review.status, 'blocked')
    assert.equal(reproof.status, 'blocked')
    assert.equal(same.status, 'blocked')
    assert.equal(kandidat.ok, false)
    assert.equal(calls, 0)

    let proofCalls = 0
    let retrieveCalls = 0
    const proof = await decideOfficialTruthSameRequestProof(body, {
      loadAuthority: async () => { proofCalls += 1; return { status: 'authorized', grant: 'role', capability: 'official-truth-freigeben' } },
      now: () => { proofCalls += 1; return new Date() },
      catalog,
    } as never)
    const extraction = await decideOfficialTruthSameRequestTrustedFactExtraction(body, {
      loadProof: async () => { proofCalls += 1; return { status: 'blocked', reason: 'invalid_source_snapshot' } },
      retrieve: async () => { retrieveCalls += 1; return { status: 'blocked', reason: 'invalid_request' } },
      extract: () => { retrieveCalls += 1; return { status: 'blocked', reason: 'unexpected_fields' } },
    } as never)
    assert.equal(proof.status, 'blocked')
    assert.equal(extraction.status, 'blocked')
    assert.equal(proofCalls, 0)
    assert.equal(retrieveCalls, 0)

    let reads = 0
    const guarded = { sourceFingerprintProtocol: 3 as const, get supports() { reads += 1; return [] } }
    const phaseA = officialTruthCompositionPhaseA(guarded as never)
    const phaseB = officialTruthCompositionPhaseB({
      sourceFingerprintProtocol: 3,
      freeze: { policyId: 'p', policyVersion: 1, extractorId: 'e', extractorVersion: 1 },
      get supports() { reads += 1; return [] },
    } as never)
    const citations = officialTruthCompositionZitatePruefen(guarded as never)
    assert.equal(phaseA.ok, false)
    if (!phaseA.ok) assert.equal(phaseA.reason, 'representation_not_eligible')
    assert.equal(phaseB.ok, false)
    if (!phaseB.ok) assert.equal(phaseB.reason, 'representation_not_eligible')
    assert.equal(citations.ok, false)
    if (!citations.ok) assert.equal(citations.reason, 'representation_not_eligible')
    assert.equal(reads, 0)

    const coverage = officialTruthAbdeckungBewerten({
      ruleScopeKey: `rule-scope:v1:${'ab'.repeat(32)}`,
      factKind: 'requirement_effect',
      claim: null,
      support: [body],
      referenceTime: 'not-a-time',
    } as never)
    assert.equal(coverage.status, 'invalid')
    if (coverage.status === 'invalid') assert.equal(coverage.reason, 'unexpected_fields')

    assert.throws(() => prepareOriginals(body as never, []), /protocol3_current_request_unsupported/)
    const query = { query: async () => { calls += 1; return [] } }
    await assert.rejects(bindCandidate(query as never, body as never, 'review', 'key', { sequence: '1', eventHash: 'ab' }, 'verify_existing'), /protocol3_current_request_unsupported/)
    await assert.rejects(reviewCandidate(query as never, body as never), /protocol3_current_request_unsupported/)
    await assert.rejects(readCandidate({} as never, query as never, 'fingerprint', 'key', body as never), /protocol3_current_request_unsupported/)
    await assert.rejects(persistCandidate({} as never, { element: 1, array: 1 }, body as never, 'review', 'key', { sequence: '1', eventHash: 'ab' }), /protocol3_current_request_unsupported/)
    assert.equal(calls, 0)
  }
})
