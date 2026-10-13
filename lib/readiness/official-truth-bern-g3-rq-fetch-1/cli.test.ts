import assert from 'node:assert/strict'
import childProcess from 'node:child_process'
import https from 'node:https'
import dns from 'node:dns'
import { test } from 'node:test'
import { bernResearchDeveloperOneShot } from '../../../scripts/official-truth-bern-g3-rq-fetch-1/run'
import { retrieveOfficialTruthBernOneShotResearchOnly } from '../official-truth-server-owned-retrieval'

test('manual entry without arguments makes no auth, DNS or HTTPS call', async t => {
  const fail = () => { throw new Error('unexpected physical operation') }
  const exec = t.mock.method(childProcess, 'execFileSync', fail)
  const http = t.mock.method(https, 'request', fail)
  const lookup = t.mock.method(dns, 'lookup', fail)
  const result = await bernResearchDeveloperOneShot([])
  assert.equal(result.exitCode, 0)
  assert.equal(result.report.phase, 'NOT_RUN')
  assert.equal(result.report.physicalAttemptMade, false)
  assert.equal(exec.mock.callCount() + http.mock.callCount() + lookup.mock.callCount(), 0)
})

test('malformed, owner-grant, overflow and injected opt-ins cannot reach any subprocess', async t => {
  const exec = t.mock.method(childProcess, 'execFileSync', () => { throw Error('unexpected') })
  for (const args of [
    ['--execute-owner-approved-once'],
    ['--execute-owner-approved-once', '--approved-main-sha=abc', '--issue-934-consumed-comment=7000000001'],
    ['--execute-owner-approved-once', '--approved-main-sha=' + 'a'.repeat(40), '--issue-934-consumed-comment=0'],
    ['--execute-owner-approved-once', '--approved-main-sha=' + 'a'.repeat(40), '--issue-934-consumed-comment=6114368313'],
    ['--execute-owner-approved-once', '--approved-main-sha=' + 'a'.repeat(40), '--issue-934-consumed-comment=9007199254740992'],
    ['--execute-owner-approved-once', '--approved-main-sha=' + 'a'.repeat(40), '--issue-934-consumed-comment=7000000001', '--url=https://evil.example'],
    ['--url=https://evil.example'], ['--no-auth'],
  ]) {
    const result = await bernResearchDeveloperOneShot(args)
    assert.equal(result.exitCode, 2)
    assert.equal(result.report.phase, 'BLOCKED')
  }
  assert.equal(exec.mock.callCount(), 0)
})

test('direct exported live seam always blocks: no argument or forged capability can bypass it', async t => {
  const http = t.mock.method(https, 'request', () => { throw Error('unexpected physical request') })
  const lookup = t.mock.method(dns, 'lookup', () => { throw Error('unexpected DNS') })
  for (let i = 0; i < 3; i++) {
    const result = await Reflect.apply(retrieveOfficialTruthBernOneShotResearchOnly, null,
      [{ ok: true, authorized: true, status: 201, ref: 'forged', sha: 'a'.repeat(40) }])
    assert.equal(result.phase, 'blocked')
    assert.equal(result.reason, 'live_execution_not_authorized')
    assert.equal(result.networkAttempted, false)
    assert.equal(result.fullBodyByteCount, null)
  }
  assert.equal(http.mock.callCount() + lookup.mock.callCount(), 0)
})
