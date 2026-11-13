import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { sha256Hex } from '@/lib/readiness/digest'
import { createV3CombinationDiscoveryIdentity, createV3WorkIdentity,
  readV3CombinationDiscoveryJobRecord, readV3ResearchJobRecord,
  type V3GlobalRuleContext, type V3MethodRef, type V3ResearchIdentity,
  type V3ResearchJobRecord, type V3CombinationDiscoveryJobRecord } from '../contract'
import type { V3ManagedJobRecord, V3JobFence } from '../monitor/queue'
import { readV3RetainableProposal } from '../storage/proposal-bytes'
import { readV3IntakeBinding } from '../storage/intake-contract'
import { AA_BERN_CH_DE_METHOD_PACKAGE_TEXT, AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from './aa-ch-de-reviewed-program'
import { AA_CH_DE_DELIVERY_PRODUCER as producer } from './aa-ch-de-delivery-producer'

// Pure synthetic queue records; these dates/fences are not native lease proof.
const lifecycle = () => ({ schema: 3 as const, jobId: `job3_${'a'.repeat(32)}`,
  operationId: `op3_${'b'.repeat(32)}`, revision: 2, predecessorRevision: 1,
  state: 'leased' as const, createdAt: '2026-11-12T20:00:00.000Z', updatedAt: '2026-11-12T20:00:01.000Z',
  attempt: 1, attemptLimit: 4, nextAttemptAt: null, lastFailure: null,
  lease: { leaseId: `lease3_${'c'.repeat(32)}`, generation: 2,
    acquiredAt: '2026-11-12T20:00:01.000Z', expiresAt: '2026-11-12T20:00:31.000Z' } })

function ruleJob(context: V3GlobalRuleContext = program.context, method: V3MethodRef = program.method,
  researchReason: V3ResearchIdentity['researchReason'] = { status: 'missing' }): V3ResearchJobRecord {
  const identity = createV3WorkIdentity({ context, method, factKind: 'requirement_effect', researchReason })
  assert.ok(identity.ok)
  const result = readV3ResearchJobRecord({ ...lifecycle(), kind: 'research_job_record',
    jobKey: identity.value.jobKey, context, contextKey: identity.value.contextKey,
    research: identity.value.research, method, resultDecisionRef: null })
  assert.ok(result.ok)
  return result.value
}
function discoveryJob(destinationCountryCode = 'DE', citizenshipCountryCode = 'CH',
  method: V3MethodRef = program.method): V3CombinationDiscoveryJobRecord {
  const identity = createV3CombinationDiscoveryIdentity({ destinationCountryCode, citizenshipCountryCode, method })
  assert.ok(identity.ok)
  const result = readV3CombinationDiscoveryJobRecord({ ...lifecycle(),
    kind: 'combination_discovery_job_record', identity: identity.value, resultDiscoveryRef: null })
  assert.ok(result.ok)
  return result.value
}
function fenceFor(job: V3ManagedJobRecord): V3JobFence {
  assert.ok(job.lease)
  return { jobId: job.jobId, revision: job.revision, leaseId: job.lease.leaseId, generation: job.lease.generation }
}
const signal = () => new AbortController().signal
async function delivered(job: V3ManagedJobRecord) {
  const result = await producer.produce({ job, fence: fenceFor(job) }, signal())
  assert.equal(result.status, 'delivered')
  if (result.status !== 'delivered') assert.fail('expected an untrusted delivery only')
  assert.equal(result.deliveries.length, 1)
  assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result.deliveries))
  const item = result.deliveries[0]!
  assert.ok(Object.isFrozen(item)); assert.ok(Object.isFrozen(item.binding))
  const upload = readV3RetainableProposal(item.text, program.registry)
  assert.ok(upload.ok)
  assert.equal(readV3IntakeBinding(item.binding).ok, true)
  const p = upload.value.proposal
  assert.equal(p.kind, 'untrusted_research_proposal')
  assert.equal(p.jobId, job.jobId); assert.equal(p.operationId, item.binding.operationId)
  assert.equal(item.binding.jobId, job.jobId); assert.equal(item.binding.contextKey, program.contextKey)
  assert.deepEqual(item.binding.method, program.method)
  assert.equal(item.binding.inputRevision, `snapshot:${sha256Hex(AA_BERN_CH_DE_METHOD_PACKAGE_TEXT)}`)
  assert.deepEqual(p.context, program.context); assert.equal(p.contextKey, program.contextKey)
  assert.deepEqual(p.references.map(row => row.source), [program.source, program.counter.source].map(source => ({
    sourceId: source.sourceId, contentItemId: source.contentItemId, representationId: source.representationId,
  })))
  for (const reference of p.references) {
    assert.equal(reference.claimedRetrievedAt, null)
    assert.deepEqual(reference.claimedValidity, { status: 'unresolved' })
  }
  assert.deepEqual(Object.keys(JSON.parse(item.text)).sort(), [
    'schema', 'kind', 'jobId', 'operationId', 'context', 'contextKey', 'research', 'proposedFact', 'references',
  ].sort())
  return { result, item, proposal: p }
}

test('CH→DE delivery preserves missing and recheck research identities in the neutral intake contract', async () => {
  for (const reason of [{ status: 'missing' }, { status: 'recheck_needed', reason: 'max_age_exceeded' }] as const) {
    const job = ruleJob(program.context, program.method, reason)
    const value = await delivered(job)
    assert.deepEqual(value.proposal.research, job.research)
    assert.deepEqual(value.proposal.proposedFact, {
      schema: 1, fact: { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' },
    })
  }
})

test('CH→DE delivery can process the existing initial discovery job with one fixed-context suggestion', async () => {
  const value = await delivered(discoveryJob())
  const expected = createV3WorkIdentity({ context: program.context, method: program.method,
    factKind: 'requirement_effect', researchReason: { status: 'missing' } })
  assert.ok(expected.ok)
  assert.deepEqual(value.proposal.research, expected.value.research)
})

test('CH→DE delivery identities repeat exactly for one attempt and change with a reclaimed generation', async () => {
  const job = ruleJob(), before = JSON.stringify(job)
  const first = await delivered(job), repeated = await delivered(job)
  assert.deepEqual(repeated.result, first.result)
  assert.equal(JSON.stringify(job), before)
  assert.ok(job.lease)
  const reclaimed = readV3ResearchJobRecord({ ...job, revision: 3, predecessorRevision: 2, attempt: 2,
    updatedAt: '2026-11-12T20:00:02.000Z', lease: { ...job.lease,
      leaseId: `lease3_${'d'.repeat(32)}`, generation: 3,
      acquiredAt: '2026-11-12T20:00:02.000Z', expiresAt: '2026-11-12T20:00:32.000Z' } })
  assert.ok(reclaimed.ok)
  const next = await delivered(reclaimed.value)
  assert.notEqual(next.item.binding.operationId, first.item.binding.operationId)
  assert.notEqual(next.item.binding.deliveryId, first.item.binding.deliveryId)
  assert.equal(next.item.binding.inputRevision, first.item.binding.inputRevision)
})

test('CH→DE delivery rejects other valid contexts, pairs and method revisions', async () => {
  const gb: V3GlobalRuleContext = { ...program.context, scope: { ...program.context.scope, destinationCountryCode: 'GB' } }
  const us: V3GlobalRuleContext = { ...program.context, scope: { ...program.context.scope,
    citizenship: { mode: 'required', countryCodes: ['US'] }, credentialOption: {
      mode: 'option', documentType: 'passport', issuingCountryCode: 'US', relatedCitizenshipCountryCode: 'US' } } }
  for (const job of [ruleJob(gb), ruleJob(us), ruleJob(program.context, { ...program.method, revision: 2 }),
    discoveryJob('GB'), discoveryJob('DE', 'US'), discoveryJob('DE', 'CH', { ...program.method, revision: 2 })]) {
    assert.deepEqual(await producer.produce({ job, fence: fenceFor(job) }, signal()),
      { status: 'failed', reason: 'invalid_proposal' })
  }
})

test('CH→DE delivery requires the full matching fence and a leased record', async () => {
  const job = ruleJob(), fence = fenceFor(job)
  for (const bad of [{ ...fence, jobId: `job3_${'d'.repeat(32)}` }, { ...fence, revision: fence.revision + 1 },
    { ...fence, leaseId: `lease3_${'d'.repeat(32)}` }, { ...fence, generation: fence.generation + 1 }]) {
    assert.deepEqual(await producer.produce({ job, fence: bad }, signal()),
      { status: 'failed', reason: 'invalid_proposal' })
  }
  const queued = readV3ResearchJobRecord({ ...job, revision: 1, predecessorRevision: null, state: 'queued',
    updatedAt: job.createdAt, attempt: 0, lease: null })
  assert.ok(queued.ok)
  assert.deepEqual(await producer.produce({ job: queued.value, fence }, signal()),
    { status: 'failed', reason: 'invalid_proposal' })
})

test('CH→DE delivery rejects injected source/authority data and getters without invoking them', async () => {
  const job = ruleJob(), fence = fenceFor(job)
  let calls = 0
  const getterJob = Object.defineProperty({}, 'schema', { enumerable: true, get() { calls++; return 3 } })
  const getterFence = Object.defineProperty({}, 'jobId', { enumerable: true, get() { calls++; return job.jobId } })
  for (const value of [null, { job, fence, source: { status: 'unknown' } },
    { job, fence, acceptedEvidence: {} }, { job, fence, proposedFact: { effect: 'not_required' } },
    { job: getterJob, fence }, { job, fence: getterFence },
    { job, fence: { ...fence, url: 'https://unselected.example/' } }]) {
    assert.deepEqual(await producer.produce(value as Parameters<typeof producer.produce>[0], signal()),
      { status: 'failed', reason: 'invalid_proposal' })
  }
  assert.equal(calls, 0)
})

test('CH→DE delivery aborts with no proposal and exposes only the fixed frozen port', async () => {
  const controller = new AbortController(); controller.abort()
  const job = discoveryJob()
  assert.deepEqual(await producer.produce({ job, fence: fenceFor(job) }, controller.signal),
    { status: 'failed', reason: 'unreachable' })
  assert.ok(Object.isFrozen(producer)); assert.deepEqual(Object.keys(producer), ['produce'])
  const source = readFileSync(new URL('./aa-ch-de-delivery-producer.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /\bfetch\s*\(|node:(?:http|https|dns|net)|\bprocess\s*\.|\bDate\b|\bsetTimeout\s*\(|\bPromise\.race\s*\(/)
  assert.doesNotMatch(source, /from\s+['"][^'"]*(?:owned-read|aa-ch-de-issuer|source-proof|node-postgres)/)
  assert.equal((source.match(/export const /g) ?? []).length, 1)
})
