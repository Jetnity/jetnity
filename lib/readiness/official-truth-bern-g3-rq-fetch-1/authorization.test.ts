import assert from 'node:assert/strict'
import { test } from 'node:test'
import { simulateBernGlobalClaimForOfflineTests, verifyBernGithubPreflight } from './authorization'
import { API, APPROVAL, FIXED_REF, RECEIPT, REF_PATH, RULESET, SHA, githubFixture, reference } from './fixtures/github'

type Fixture = ReturnType<typeof githubFixture>
function changeBody(c: { body: string }, changes: Record<string, unknown>) {
  c.body = JSON.stringify({ ...JSON.parse(c.body), ...changes })
}
async function scenario(f: Fixture) {
  let claims = 0, calls = 0
  const result = await simulateBernGlobalClaimForOfflineTests({ mainSha: SHA, commentId: RECEIPT }, {
    read: f.read, createRef: async (ref, sha) => {
      claims++
      assert.equal(ref, FIXED_REF); assert.equal(sha, SHA)
      if (f.responses.get(REF_PATH)?.status !== 404) return { status: 422, body: {} }
      const body = reference()
      f.responses.set(REF_PATH, { status: 200, body })
      return { status: 201, body }
    }, transport: async () => { calls++ },
  })
  return { result, claims, calls }
}

test('verified preflight alone grants no transport; exact new synthetic 201 wins once', async () => {
  const f = githubFixture()
  assert.deepEqual(await verifyBernGithubPreflight(f.read, { mainSha: SHA, commentId: RECEIPT }),
    { ok: true, mainSha: SHA, commentId: RECEIPT })
  assert.equal(f.calls.some(p => p.includes('/git/refs')), false)
  const first = await scenario(f)
  assert.equal(first.result.ok, true); assert.equal(first.claims, 1); assert.equal(first.calls, 1)
  const second = await scenario(f)
  assert.equal(second.result.ok, false); assert.equal(second.claims, 0); assert.equal(second.calls, 0)
})

const negatives: [string, (f: Fixture) => void][] = [
  ['wrong repository id', f => { f.repo.id++ }],
  ['wrong repository name', f => { f.repo.full_name = 'attacker/jetnity' }],
  ['organization/custom-role scope unsupported', f => { f.repo.owner.type = 'Organization' }],
  ['wrong immutable owner id', f => { f.receipt.user.id++ }],
  ['owner login alone cannot authorize', f => { f.receipt.user.id = 123 }],
  ['wrong owner login', f => { f.receipt.user.login = 'other' }],
  ['bot author', f => { f.receipt.user.type = 'Bot' }],
  ['wrong association', f => { f.receipt.author_association = 'NONE' }],
  ['wrong comment id', f => { f.receipt.id++ }],
  ['wrong comment API origin', f => { f.receipt.url = 'https://evil.example/comment' }],
  ['wrong issue', f => { f.receipt.issue_url = 'https://api.github.com' + API + '/issues/917' }],
  ['wrong HTML issue URL', f => { f.receipt.html_url = 'https://github.com/Jetnity/jetnity/issues/917#issuecomment-' + RECEIPT }],
  ['edited consumed comment', f => { f.receipt.updated_at = '2026-10-13T12:01:00Z' }],
  ['malformed timestamp', f => { f.receipt.created_at = f.receipt.updated_at = 'unknown' }],
  ['revoked or altered existing PO grant', f => { f.po.body += ' revoked' }],
  ['forged PO author', f => { f.po.user.id++ }],
  ['stale remote main', f => { f.remoteMain.object.sha = 'b'.repeat(40) }],
  ['main reference not commit', f => { f.remoteMain.object.type = 'tag' }],
  ['wrong main ref', f => { f.remoteMain.ref = 'refs/heads/feature' }],
  ['not merged', f => { f.pr.merged = false }],
  ['wrong merged main', f => { f.pr.merge_commit_sha = 'b'.repeat(40) }],
  ['wrong pull branch', f => { f.pr.head.ref = 'other' }],
  ['foreign pull repository', f => { f.pr.head.repo.id++ }],
  ['wrong receipt SHA', f => changeBody(f.receipt, { reviewedMainSha: 'b'.repeat(40) })],
  ['wrong record type', f => changeBody(f.receipt, { recordType: 'G3_RQ_FETCH_1_A_AND_B_APPROVED' })],
  ['wrong phase', f => changeBody(f.receipt, { phase: 'A' })],
  ['wrong source URL', f => changeBody(f.receipt, { sourceUrl: 'https://evil.example/' })],
  ['query added', f => changeBody(f.receipt, { sourceUrl: JSON.parse(f.receipt.body).sourceUrl + '?x=1' })],
  ['more than one GET', f => changeBody(f.receipt, { maximumRequests: 2 })],
  ['wrong method', f => changeBody(f.receipt, { method: 'POST' })],
  ['greater body budget', f => changeBody(f.receipt, { maximumBytes: 131073 })],
  ['greater deadline', f => changeBody(f.receipt, { timeoutMs: 10001 })],
  ['redirect follow', f => changeBody(f.receipt, { followRedirects: true })],
  ['retry permitted', f => changeBody(f.receipt, { retry: true })],
  ['unknown authority fields', f => changeBody(f.receipt, { adminOverride: true })],
  ['missing independent acceptance', f => changeBody(f.receipt, { independentCodeSecurityApproved: false })],
  ['missing postmerge acceptance', f => changeBody(f.receipt, { postmergeVerified: false })],
  ['matching record embedded in untrusted prose', f => { f.receipt.body = 'approved\n' + f.receipt.body }],
  ['matching record embedded in shell stdout', f => { f.receipt.body = 'HTTP/2 200\n' + f.receipt.body }],
  ['duplicate keys', f => { f.receipt.body = f.receipt.body.replace('{', '{"phase":"A",') }],
  ['malformed JSON', f => { f.receipt.body = '{' }],
  ['oversized comment', f => { f.receipt.body += 'x'.repeat(16384) }],
  ['wrong protection actor', f => changeBody(f.approval, { executionActorId: 23456 })],
  ['wrong protection ref', f => changeBody(f.approval, { consumedRef: FIXED_REF + '-2' })],
  ['missing initial unused attestation', f => changeBody(f.approval, { initialUnusedAttested: false })],
  ['no audit evidence review', f => changeBody(f.approval, { availableAuditEvidenceReviewed: false })],
  ['no admin trust acknowledgement', f => changeBody(f.approval, { trustedAdministrationAcknowledged: false })],
  ['protection approved after consumed receipt', f => { f.approval.created_at = f.approval.updated_at = '2026-10-13T12:01:00Z' }],
  ['same consumption/protection comment', f => changeBody(f.receipt, { protectionApprovalCommentId: RECEIPT })],
  ['wrong authenticated actor', f => { f.user.id++ }],
  ['site administrator', f => { f.user.site_admin = true }],
  ['application/unknown actor', f => { f.user.type = 'Bot' }],
  ['admin repository permission', f => { f.repo.permissions.admin = true }],
  ['maintainer repository permission', f => { f.repo.permissions.maintain = true }],
  ['no write permission', f => { f.repo.permissions.push = false }],
  ['unknown permission capability', f => { Object.assign(f.repo.permissions, { edit_repository_rules: true }) }],
  ['account admin behind scoped token', f => { f.permission.role_name = 'admin'; f.permission.permission = 'admin' }],
  ['custom ruleset editor role', f => { f.permission.role_name = 'ruleset-editor' }],
  ['collaborator permission mismatch', f => { f.permission.user.permissions.admin = true }],
  ['wrong collaborator identity', f => { f.permission.user.id++ }],
  ['no effective tag ruleset', f => { f.responses.set(API + '/rulesets?includes_parents=true&per_page=100', { status: 200, body: [] }) }],
  ['ruleset pagination uncertain', f => { f.responses.set(API + '/rulesets?includes_parents=true&per_page=100', { status: 200, body: Array(100).fill(f.ruleset) }) }],
  ['disabled protection', f => { f.ruleset.enforcement = 'disabled' }],
  ['evaluation only', f => { f.ruleset.enforcement = 'evaluate' }],
  ['branch not tag', f => { f.ruleset.target = 'branch' }],
  ['foreign ruleset', f => { f.ruleset.source = 'other/repo' }],
  ['wrong ref', f => { f.ruleset.conditions.ref_name.include = [FIXED_REF + '-other'] }],
  ['wildcard scope', f => { f.ruleset.conditions.ref_name.include = ['refs/tags/*'] }],
  ['exclusion', f => { f.ruleset.conditions.ref_name.exclude = [FIXED_REF] }],
  ['update permitted', f => { f.ruleset.rules = [{ type: 'deletion' }] }],
  ['deletion permitted', f => { f.ruleset.rules = [{ type: 'update' }] }],
  ['initial creation forbidden', f => { f.ruleset.rules.push({ type: 'creation' }) }],
  ['bypass grant', f => { f.ruleset.bypass_actors = [{ actor_id: 12345, bypass_mode: 'always' }] }],
  ['current actor can bypass', f => { f.ruleset.current_user_can_bypass = 'always' }],
  ['already consumed correct SHA', f => { f.responses.set(REF_PATH, { status: 200, body: reference() }) }],
  ['already consumed wrong SHA', f => { f.responses.set(REF_PATH, { status: 200, body: reference('b'.repeat(40)) }) }],
  ['ambiguous absence', f => { f.responses.set(REF_PATH, { status: 404, body: {} }) }],
]
for (const [name, mutate] of negatives) test('deny before claim and transport: ' + name, async () => {
  const f = githubFixture(); mutate(f)
  const result = await scenario(f)
  assert.equal(result.result.ok, false)
  assert.equal(result.claims, 0); assert.equal(result.calls, 0)
  assert.equal(JSON.stringify(result).includes('evil.example'), false)
})

for (const status of [301, 401, 403, 404, 409, 422, 429, 500, 503]) {
  test('GitHub API status ' + status + ' blocks at every read boundary', async () => {
    for (const path of githubFixture().responses.keys()) {
      if (path === REF_PATH && status === 404) continue
      const f = githubFixture(); f.responses.set(path, { status, body: { message: 'untrusted body' } })
      const result = await scenario(f)
      assert.equal(result.result.ok, false, path)
      assert.equal(result.claims, 0, path); assert.equal(result.calls, 0, path)
    }
  })
}
test('thrown API errors are finite and redacted', async () => {
  const result = await simulateBernGlobalClaimForOfflineTests({ mainSha: SHA, commentId: RECEIPT }, {
    read: async () => { throw Error('secret remote body') },
    createRef: async () => { throw Error('must not claim') }, transport: async () => { throw Error('must not fetch') },
  })
  assert.deepEqual(result, { ok: false, reason: 'github_unverifiable' })
})
for (const status of [200, 202, 204, 301, 403, 409, 422, 429, 500]) {
  test('only newly confirmed 201 wins, rejecting ' + status, async () => {
    let calls = 0, claims = 0
    const f = githubFixture()
    const result = await simulateBernGlobalClaimForOfflineTests({ mainSha: SHA, commentId: RECEIPT }, {
      read: f.read, createRef: async () => { claims++; return { status, body: reference() } },
      transport: async () => { calls++ },
    })
    assert.equal(result.ok, false); assert.equal(claims, 1); assert.equal(calls, 0)
  })
}
for (const [name, mutate] of [
  ['ref', (r: ReturnType<typeof reference>) => { r.ref += '-other' }],
  ['SHA', (r: ReturnType<typeof reference>) => { r.object.sha = 'b'.repeat(40) }],
  ['object type', (r: ReturnType<typeof reference>) => { r.object.type = 'tag' }],
  ['API origin', (r: ReturnType<typeof reference>) => { r.url = 'https://evil.example/' }],
] as const) test('201 with incorrect ' + name + ' blocks', async () => {
  const f = githubFixture(), body = reference(); mutate(body)
  const result = await simulateBernGlobalClaimForOfflineTests({ mainSha: SHA, commentId: RECEIPT }, {
    read: f.read, createRef: async () => ({ status: 201, body }), transport: async () => assert.fail('fetch'),
  })
  assert.deepEqual(result, { ok: false, reason: 'claim_unconfirmed' })
})
for (const [name, mutate] of [
  ['main changed', (f: Fixture) => { f.remoteMain.object.sha = 'b'.repeat(40) }],
  ['actor promoted', (f: Fixture) => { f.permission.role_name = 'admin' }],
  ['ruleset removed', (f: Fixture) => { f.responses.delete(API + '/rulesets/' + RULESET) }],
  ['bypass added', (f: Fixture) => { f.ruleset.bypass_actors.push({ actor_id: 12345 }) }],
  ['receipt changed', (f: Fixture) => { f.receipt.body += '\n' }],
  ['approval revoked', (f: Fixture) => changeBody(f.approval, { initialUnusedAttested: false })],
  ['ref deleted', (f: Fixture) => { f.responses.set(REF_PATH, { status: 404, body: { message: 'Not Found' } }) }],
  ['ref unknown', (f: Fixture) => { f.responses.set(REF_PATH, { status: 503, body: {} }) }],
  ['ref replaced', (f: Fixture) => { f.responses.set(REF_PATH, { status: 200, body: reference('b'.repeat(40)) }) }],
] as const) test('after claim ' + name + ' refuses without retry', async () => {
  const f = githubFixture(); let claims = 0
  const result = await simulateBernGlobalClaimForOfflineTests({ mainSha: SHA, commentId: RECEIPT }, {
    read: f.read, createRef: async () => {
      claims++; f.responses.set(REF_PATH, { status: 200, body: reference() }); mutate(f)
      return { status: 201, body: reference() }
    }, transport: async () => assert.fail('must not fetch'),
  })
  assert.equal(result.ok, false); assert.equal(claims, 1)
})
test('post-claim failed transport consumes the grant in the shared store', async () => {
  const f = githubFixture()
  const result = await simulateBernGlobalClaimForOfflineTests({ mainSha: SHA, commentId: RECEIPT }, {
    read: f.read, createRef: async () => {
      f.responses.set(REF_PATH, { status: 200, body: reference() }); return { status: 201, body: reference() }
    }, transport: async () => { throw Error('timeout or aborted stream') },
  })
  assert.deepEqual(result, { ok: false, reason: 'transport_failed' })
  const second = await scenario(f); assert.equal(second.calls, 0); assert.equal(second.claims, 0)
})
test('missing and caller-selected approval identifiers fail without reads', async () => {
  for (const input of [{ mainSha: 'wrong', commentId: RECEIPT }, { mainSha: SHA, commentId: 6114368313 },
    { mainSha: SHA, commentId: NaN }, { mainSha: SHA, commentId: RECEIPT, ownerId: 123 }]) {
    const f = githubFixture()
    assert.equal((await verifyBernGithubPreflight(f.read, input)).ok, false)
    assert.equal(f.calls.length, 0)
  }
})
test('unknown read timeout denies before claim', { timeout: 8000 }, async () => {
  const result = await simulateBernGlobalClaimForOfflineTests({ mainSha: SHA, commentId: RECEIPT }, {
    read: () => new Promise(() => {}), createRef: async () => assert.fail('claim'), transport: async () => assert.fail('fetch'),
  })
  assert.deepEqual(result, { ok: false, reason: 'github_unverifiable' })
})
test('response timeout after committed claim denies and cannot be replayed', { timeout: 8000 }, async () => {
  const f = githubFixture(); let claims = 0
  const result = await simulateBernGlobalClaimForOfflineTests({ mainSha: SHA, commentId: RECEIPT }, {
    read: f.read, createRef: () => {
      claims++; f.responses.set(REF_PATH, { status: 200, body: reference() }); return new Promise(() => {})
    }, transport: async () => assert.fail('fetch'),
  })
  assert.deepEqual(result, { ok: false, reason: 'github_unverifiable' }); assert.equal(claims, 1)
  const retry = await scenario(f); assert.equal(retry.claims, 0); assert.equal(retry.calls, 0)
})
