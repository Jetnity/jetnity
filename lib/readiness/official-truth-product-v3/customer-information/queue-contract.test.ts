import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createM04SubjectIdentity, readM04Command } from '../jobs/contract'
import { readV3ResearchJobRecord } from '../contract'
import { customerInformationFixture, CUSTOMER_DETAIL_SAMPLES } from './test-support/fixture'

test('CI1 ordinary M04 subject and enqueue command bind topic and stable item exactly like the canonical job reader', () => {
  const detail = CUSTOMER_DETAIL_SAMPLES[13]!
  const fixtures = [customerInformationFixture(detail, 'cash_allowance', 'cash'), customerInformationFixture(detail, 'alcohol_allowance', 'alcohol')]
  const subjects: string[] = []
  for (const f of fixtures) {
    const input = { context: f.context, method: f.method, factKind: 'entry_information', researchReason: { status: 'missing' } }
    const subject = createM04SubjectIdentity('rule_research', input)
    assert.ok(subject, 'M04 must preserve revision 3 topic/item in its own semantic preimage')
    assert.equal(subject.contextKey, f.identity.contextKey)
    assert.equal(subject.jobKey, f.identity.jobKey)
    const semantic = JSON.parse(subject.subjectText).context
    assert.equal(semantic.informationTopic, 'customs')
    assert.equal(semantic.informationItem, 'informationItem' in f.context ? f.context.informationItem : null)
    subjects.push(subject.subjectText)
    const command = readM04Command({ action: 'enqueue', kind: 'rule_research', input: { ...input,
      jobId: f.proposal.jobId, operationId: f.proposal.operationId, attemptLimit: 3 } })
    assert.ok(command)
    assert.equal(command.jobKey, f.identity.jobKey)
    const job = readV3ResearchJobRecord({ schema: 3, kind: 'research_job_record', jobId: f.proposal.jobId,
      operationId: f.proposal.operationId, context: f.context, contextKey: f.identity.contextKey, jobKey: f.identity.jobKey,
      research: f.identity.research, method: f.method, revision: 1, predecessorRevision: null, state: 'queued',
      createdAt: f.synthetic.clock().now, updatedAt: f.synthetic.clock().now, attempt: 0, attemptLimit: 3,
      lease: null, nextAttemptAt: null, lastFailure: null, resultDecisionRef: null })
    assert.ok(job.ok)
    assert.equal(readM04Command({ action: 'enqueue', kind: 'rule_research', input: { ...input,
      factKind: 'requirement_effect', jobId: f.proposal.jobId, operationId: f.proposal.operationId, attemptLimit: 3 } }), null)
  }
  assert.notEqual(subjects[0], subjects[1])
})
