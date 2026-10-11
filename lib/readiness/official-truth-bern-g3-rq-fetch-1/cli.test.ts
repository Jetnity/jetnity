import assert from 'node:assert/strict'
import { test } from 'node:test'

import { bernResearchDeveloperOneShot } from '../../../scripts/official-truth-bern-g3-rq-fetch-1/run'

test('manual Bern script never fetches on import or missing arguments', async () => {
  let attempts = 0
  const live = async () => {
    attempts++
    throw Error('unsafe test invocation')
  }
  const result = await bernResearchDeveloperOneShot([], live)
  assert.equal(result.exitCode, 0)
  assert.equal(result.report.phase, 'NOT_RUN')
  assert.equal(result.report.physicalAttemptMade, false)
  assert.equal(attempts, 0)
})

test('all incomplete or injected opt-in arguments fail closed without side effects', async () => {
  let calls = 0
  const live = async () => {
    calls++
    throw Error('should never execute')
  }
  for (const args of [
    ['--execute-owner-approved-once'],
    ['--execute-owner-approved-once', '--approved-main-sha=abc', '--issue-934-consumed-comment=6114368313'],
    ['--execute-owner-approved-once', '--approved-main-sha=' + 'a'.repeat(40), '--issue-934-consumed-comment=0'],
    ['--execute-owner-approved-once', '--approved-main-sha=' + 'a'.repeat(40), '--issue-934-consumed-comment=6114368313', '--url=https://evil.example'],
    ['--url=https://evil.example'],
    ['--no-auth'],
  ]) {
    const result = await bernResearchDeveloperOneShot(args, live)
    assert.equal(result.exitCode, 2)
    assert.equal(result.report.phase, 'BLOCKED')
  }
  assert.equal(calls, 0)
})
