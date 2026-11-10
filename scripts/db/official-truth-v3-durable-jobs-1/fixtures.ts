// Fictional test inputs only. Actual M04/S1/MA1 implementations supply persistence.
import assert from 'node:assert/strict'
import { sha256Hex } from '../../../lib/readiness/digest'
import { createV3WorkIdentity, createV3CombinationDiscoveryIdentity, readV3GlobalRuleContext, type V3GlobalRuleContext } from '../../../lib/readiness/official-truth-product-v3/contract'
import { makeSyntheticOriginals, METHOD, id, must } from '../../../lib/readiness/official-truth-product-v3/integration/test-support/originals'
import { makeSyntheticStore } from '../../../lib/readiness/official-truth-product-v3/integration/test-support/store'
import { readV3RetainableProposal } from '../../../lib/readiness/official-truth-product-v3/storage/proposal-bytes'
import type { V3IntakeBinding } from '../../../lib/readiness/official-truth-product-v3/storage/intake-contract'
import type { M04Config, M04DeliveryProducer } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'

export const M04_TEST_BINDING = Object.freeze({ ...METHOD, methodDigest: sha256Hex('m04-fictional-method'), packageDigest: sha256Hex('m04-fictional-package') })
export const M04_TEST_LOGIN = Object.freeze({ jobs: 'ot_m04_jobs', intake: 'ot_m04_intake' })
export const m04Canonical = (v: unknown): string => v === null || typeof v !== 'object' ? JSON.stringify(v)
  : Array.isArray(v) ? '[' + v.map(m04Canonical).join(',') + ']'
    : '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + m04Canonical((v as Record<string, unknown>)[k])).join(',') + '}'

export function m04Fixture(seed: string, options: { count?: number; context?: V3GlobalRuleContext; fixedNow?: string; fail?: boolean } = {}) {
  const originals = makeSyntheticOriginals()
  // Stable fictional legal interval; timestamp freshness still follows the actual
  // per-call clock and original extractor-backed synthetic receipts.
  const extract = originals.extract
  originals.extract = (context, source) => { const v = extract(context, source); return { ...v,
    evidence: { ...v.evidence, legalValidity: { status: 'specified', validFrom: '2000-01-01', validUntil: '2099-12-31' } } } }
  const synthetic = makeSyntheticStore(originals)
  const clock = () => {
    const now = options.fixedNow ?? new Date().toISOString()
    synthetic.control.instant = Date.parse(now); originals.control.retrievedAt = new Date(Date.parse(now) - 1000).toISOString()
    return { now, legalDate: now.slice(0, 10) }
  }
  clock()
  const context = options.context ?? originals.context()
  const identity = must(createV3WorkIdentity({ context, method: METHOD, factKind: 'blank_passport_pages', researchReason: { status: 'missing' } }))
  const discovery = must(createV3CombinationDiscoveryIdentity({ destinationCountryCode: context.scope.destinationCountryCode,
    citizenshipCountryCode: context.scope.citizenship.countryCodes[0], method: METHOD }))
  const ruleInput = { context, method: METHOD, factKind: 'blank_passport_pages', researchReason: { status: 'missing' },
    operationId: id('op3', seed + '-enqueue'), jobId: id('job3', seed + '-cycle'), attemptLimit: 3 }
  const discoveryInput = { destinationCountryCode: discovery.destinationCountryCode, citizenshipCountryCode: discovery.citizenshipCountryCode,
    method: METHOD, operationId: ruleInput.operationId, jobId: ruleInput.jobId, attemptLimit: 3 }
  const claim = (kind: 'rule_research' | 'combination_discovery' = 'rule_research', n = 1) => ({ operationId: id('op3', seed + '-claim-' + n),
    jobKey: kind === 'rule_research' ? identity.jobKey : discovery.jobKey, leaseId: id('lease3', seed + '-lease-' + n), leaseMilliseconds: 30000 })
  function delivery(jobId = ruleInput.jobId, index = 0, overrideContext = context) {
    const work = must(createV3WorkIdentity({ context: overrideContext, method: METHOD, factKind: 'blank_passport_pages', researchReason: { status: 'missing' } }))
    const proposal = { ...originals.proposal(seed + '-proposal-' + index, overrideContext.scope.citizenship.countryCodes[0], jobId, overrideContext.scope.destinationCountryCode),
      context: overrideContext, contextKey: work.contextKey, research: work.research }
    const text = JSON.stringify(proposal, null, 2)
    const binding: V3IntakeBinding = { schema: 3, kind: 'proposal_intake_binding', operationId: proposal.operationId,
      jobId, contextKey: work.contextKey, method: METHOD, runnerId: 'runner3_' + sha256Hex('m04-runner').slice(0, 32),
      deliveryId: 'delivery3_' + sha256Hex(seed + '-' + index).slice(0, 32), inputRevision: 'snapshot:' + sha256Hex('m04-test-originals') }
    const parsed = readV3RetainableProposal(text, originals.registry); assert.equal(parsed.ok, true)
    return { binding, text }
  }
  let producerCalls = 0
  const delivered: ReturnType<typeof delivery>[] = []
  const producer: M04DeliveryProducer = { async produce({ job }, signal) {
    assert.equal(signal.aborted, false); producerCalls++
    if (options.fail) return { status: 'failed', reason: 'unreachable' }
    const count = job.kind === 'research_job_record' ? 1 : options.count ?? 16
    assert.ok(count >= 1 && count <= 16)
    const batch = Array.from({ length: count }, (_, n) => delivery(job.jobId, n, job.kind === 'research_job_record' ? job.context : context))
    delivered.push(...batch)
    return { status: 'delivered', deliveries: batch }
  } }
  const evidence: M04Config['evidence'] = { async inspect(request, signal) { clock(); return synthetic.importPorts.evidence!.inspect(request, signal) },
    async reprove(receipt, request, decision, archive, at, signal) { clock(); return synthetic.importPorts.evidence!.reprove(receipt, request, decision, archive, at, signal) } }
  const history: M04Config['history'] = { async read(key, kind, signal) { clock(); return synthetic.importPorts.history!.read(key, kind, signal) },
    async reprove(receipt, value, signal) { clock(); return synthetic.importPorts.history!.reprove(receipt, value, signal) } }
  return { originals, synthetic, context, identity, discovery, ruleInput, discoveryInput, claim, delivery, delivered,
    producer, evidence, history, clock, producerCalls: () => producerCalls,
    contextWith(predicate: unknown) { return must(readV3GlobalRuleContext({ ...context, conditions: { status: 'specified', expression: { op: 'atomic', predicate } } })) } }
}
