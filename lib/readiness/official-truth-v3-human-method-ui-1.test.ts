import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { decideAdminAccess } from '@/lib/auth/admin-access'
import { applyAdminAal, parseAalLookup } from '@/lib/auth/admin-aal'
import { adminWriteErlaubt } from '@/lib/auth/admin-write-gate'
import { LOCAL_UNAPPLIED_RPCS, pruefe } from '../../scripts/db/verwendung.mjs'
import {
  HUMAN_METHOD_BODY_BYTES, HUMAN_METHOD_DEV_URL, HUMAN_METHOD_STORAGE_KEY,
  appendHumanOperation, buildHumanCommand, createHumanOperationId, humanRequestHeadersAllowed, humanRpcArguments,
  latestHumanOperation, nextHumanAction, persistHumanJournal, readHumanJournal, readHumanOutcome,
  readHumanReceipt, readHumanRelease, readHumanRequestText,
  type HumanAction, type HumanCommand, type HumanOperation, type HumanRelease, type HumanSnapshot,
} from './official-truth-product-v3/method/human-contract'
import { getHumanRelease } from './official-truth-product-v3/method/human-release'
import { runHumanMethodRequest } from './official-truth-product-v3/method/human-server'

// Synthetic fixtures only. They establish no real Owner, MFA, hosted schema,
// method approval, database execution or public entry-rule evidence.
const ACTOR = '11111111-1111-4111-8111-111111111111'
const OTHER_ACTOR = '22222222-2222-4222-8222-222222222222'
const FIXTURE: HumanRelease = {
  schema: 1, selectionId: 'hmr1_' + '1'.repeat(32), targetUrl: HUMAN_METHOD_DEV_URL,
  methodId: 'fixture_ch_de', revision: 1, methodDigest: 'a'.repeat(64), packageDigest: 'b'.repeat(64),
  predecessorRevision: null, expectedHead: null, approval: { mode: 'until', until: '2026-11-30T23:59:59.999Z' },
  packageVersion: 'Synthetic test package',
  packageHref: 'https://github.com/Jetnity/jetnity/blob/' + 'c'.repeat(40) + '/docs/test-only.md',
  scope: { citizenship: 'CH', destination: 'DE', requirement: 'visa', document: 'ordinary_swiss_passport',
    purpose: 'tourism', windowFrom: '2026-11-12', windowThrough: '2026-11-30', reviewedScope: 'Synthetic source window; not a release.' },
}
const APPROVED: HumanSnapshot = { methodId: FIXTURE.methodId, revision: 1,
  methodDigest: FIXTURE.methodDigest, packageDigest: FIXTURE.packageDigest, epoch: 1,
  status: 'approved', approvalMode: 'until', approvalUntil: '2026-11-30T23:59:59.999Z' }
const REVOKED: HumanSnapshot = { ...APPROVED, epoch: 2, status: 'revoked', approvalMode: null, approvalUntil: null }
const RECORDED_AT = '2026-11-12T16:23:45.123456Z'

function op(action: HumanAction, digit = '1'): HumanOperation {
  return { schema: 1, selectionId: FIXTURE.selectionId, action, operationId: 'maop1_' + digit.repeat(32) }
}

function expectedCommand(action: HumanAction): HumanCommand {
  const base = { schema: 1 as const, operationId: op(action).operationId, methodId: FIXTURE.methodId,
    revision: 1, methodDigest: FIXTURE.methodDigest, packageDigest: FIXTURE.packageDigest }
  if (action === 'stage') return { ...base, action, predecessorRevision: null, expected: null, approval: null }
  if (action === 'approve') return { ...base, action, predecessorRevision: null,
    expected: { revision: null, methodDigest: null, packageDigest: null, epoch: 0, status: null },
    approval: { mode: 'until', until: '2026-11-30T23:59:59.999Z' } }
  return { ...base, action, predecessorRevision: null,
    expected: { revision: 1, methodDigest: FIXTURE.methodDigest, packageDigest: FIXTURE.packageDigest, epoch: 1, status: 'approved' }, approval: null }
}

function receipt(action: HumanAction): Record<string, unknown> {
  return { status: 'recorded', operationId: op(action).operationId, action, command: expectedCommand(action),
    actorId: ACTOR, recordedAt: RECORDED_AT, before: action === 'revoke' ? APPROVED : null,
    after: action === 'stage' ? null : action === 'approve' ? APPROVED : REVOKED }
}

function child(value: Record<string, unknown>, key: string): Record<string, unknown> {
  const nested = value[key]
  assert.ok(nested && typeof nested === 'object' && !Array.isArray(nested))
  return nested as Record<string, unknown>
}

test('production release is closed and cannot dispatch selected work', async () => {
  assert.equal(getHumanRelease(), null)
  const result = await runHumanMethodRequest({ ...op('stage'), intent: 'mutate' }, ACTOR, new AbortController().signal)
  assert.equal(result.status, 'unresolved')
  assert.equal(result.code, 'unselected')
  assert.equal(result.recordedAt, null)
})

test('release permits only exact Dev, full reviewed shape and legal finite transitions', () => {
  assert.ok(readHumanRelease(FIXTURE))
  for (const targetUrl of ['https://qscbgcdmivbbnzrcyegn.supabase.co', HUMAN_METHOD_DEV_URL + '/', 'https://example.invalid']) {
    assert.equal(readHumanRelease({ ...FIXTURE, targetUrl }), null)
  }
  for (const patch of [
    { revision: 0 }, { revision: 2_147_483_648 }, { methodDigest: 'A'.repeat(64) },
    { predecessorRevision: 0 }, { unexpected: true }, { selectionId: '../method' },
    { packageHref: 'https://example.invalid/package' }, { packageHref: FIXTURE.packageHref + '/../secret' },
    { packageHref: FIXTURE.packageHref + '/..' },
    { scope: { ...FIXTURE.scope, destination: 'US' } },
    { scope: { ...FIXTURE.scope, windowFrom: '2026-02-30' } },
    { scope: { ...FIXTURE.scope, windowThrough: '2026-11-11' } },
    { approval: { mode: 'until_revoked', until: FIXTURE.approval.until } },
    { approval: { mode: 'until', until: null } },
  ]) assert.equal(readHumanRelease({ ...FIXTURE, ...patch }), null)
  for (const until of ['0000-01-01T00:00:00.000Z', '2026-02-30T00:00:00.000Z', '2026-11-12T24:00:00.000Z',
    '2026-11-12T00:00:00Z', '2026-11-12T00:00:00.000000Z', '2026-11-12T00:00:00.000+00:00', 'infinity']) {
    assert.equal(readHumanRelease({ ...FIXTURE, approval: { mode: 'until', until } }), null)
  }
  assert.ok(readHumanRelease({ ...FIXTURE, approval: { mode: 'until', until: '0001-01-01T00:00:00.000Z' } }))
  assert.ok(readHumanRelease({ ...FIXTURE, approval: { mode: 'until', until: '9999-12-31T23:59:59.999Z' } }))
  assert.ok(readHumanRelease({ ...FIXTURE, expectedHead: { ...APPROVED, epoch: 2_147_483_645 } }))
  assert.equal(readHumanRelease({ ...FIXTURE, expectedHead: { ...APPROVED, epoch: 2_147_483_646 } }), null)
  assert.equal(readHumanRelease({ ...FIXTURE, expectedHead: { ...APPROVED, epoch: 0 } }), null)
  assert.equal(readHumanRelease({ ...FIXTURE, expectedHead: { ...REVOKED, approvalMode: 'until_revoked' } }), null)
})

test('all four HMT argument selections retain exact nulls and original expected state', () => {
  for (const action of ['stage', 'approve', 'revoke'] as const) {
    assert.deepEqual(buildHumanCommand(FIXTURE, op(action)), expectedCommand(action))
  }
  const base = { p_operation_id: op('stage').operationId, p_method_id: FIXTURE.methodId, p_revision: 1,
    p_method_digest: FIXTURE.methodDigest, p_package_digest: FIXTURE.packageDigest }
  const stage = humanRpcArguments(expectedCommand('stage'))
  assert.deepEqual(stage.args, { ...base, p_predecessor_revision: null })
  assert.deepEqual(stage.confirm, { ...base, p_action: 'stage', p_predecessor_revision: null,
    p_expected_revision: null, p_expected_method_digest: null, p_expected_package_digest: null,
    p_expected_epoch: null, p_expected_status: null, p_approval_mode: null, p_approval_until: null })
  const approve = humanRpcArguments(expectedCommand('approve'))
  assert.deepEqual(approve.args, { ...base, p_expected_revision: null, p_expected_method_digest: null,
    p_expected_package_digest: null, p_expected_epoch: 0, p_expected_status: null,
    p_approval_mode: 'until', p_approval_until: '2026-11-30T23:59:59.999Z' })
  assert.deepEqual(approve.confirm, { ...approve.args, p_action: 'approve', p_predecessor_revision: null })
  const revoke = humanRpcArguments(expectedCommand('revoke'))
  assert.deepEqual(revoke.args, { ...base, p_expected_epoch: 1 })
  assert.deepEqual(revoke.confirm, { ...base, p_action: 'revoke', p_predecessor_revision: null,
    p_expected_revision: 1, p_expected_method_digest: FIXTURE.methodDigest, p_expected_package_digest: FIXTURE.packageDigest,
    p_expected_epoch: 1, p_expected_status: 'approved', p_approval_mode: null, p_approval_until: null })
  assert.equal(buildHumanCommand(FIXTURE, { ...op('stage'), selectionId: 'hmr1_' + '2'.repeat(32) }), null)
})

test('all recorded receipts validate actor, complete command and exact transition snapshots', () => {
  for (const action of ['stage', 'approve', 'revoke'] as const) {
    const valid = receipt(action)
    assert.deepEqual(readHumanReceipt(valid, FIXTURE, op(action), ACTOR), valid)
    assert.equal(readHumanReceipt(valid, FIXTURE, op(action), OTHER_ACTOR), null)
    assert.equal(readHumanReceipt({ ...valid, actorId: OTHER_ACTOR }, FIXTURE, op(action), ACTOR), null)
    assert.equal(readHumanReceipt({ ...valid, operationId: op(action, '2').operationId }, FIXTURE, op(action), ACTOR), null)
    assert.equal(readHumanReceipt({ ...valid, action: 'other' }, FIXTURE, op(action), ACTOR), null)
    assert.equal(readHumanReceipt({ ...valid, status: 'confirmed' }, FIXTURE, op(action), ACTOR), null)
    assert.equal(readHumanReceipt({ ...valid, extra: true }, FIXTURE, op(action), ACTOR), null)
    for (const key of Object.keys(valid)) {
      const bad = structuredClone(valid); delete bad[key]
      assert.equal(readHumanReceipt(bad, FIXTURE, op(action), ACTOR), null, 'missing receipt ' + key)
    }
    for (const key of Object.keys(child(valid, 'command'))) {
      const bad = structuredClone(valid); delete child(bad, 'command')[key]
      assert.equal(readHumanReceipt(bad, FIXTURE, op(action), ACTOR), null, 'missing command ' + key)
    }
    for (const [key, value] of Object.entries({ schema: 2, operationId: op(action, '2').operationId,
      action: 'unknown', methodId: 'other_method', revision: 2, methodDigest: 'c'.repeat(64),
      packageDigest: 'd'.repeat(64), predecessorRevision: 9, expected: {}, approval: {}, extra: true })) {
      const bad = structuredClone(valid); child(bad, 'command')[key] = value
      assert.equal(readHumanReceipt(bad, FIXTURE, op(action), ACTOR), null, 'wrong command ' + key)
    }
    for (const side of ['before', 'after']) {
      if (valid[side] === null) {
        assert.equal(readHumanReceipt({ ...valid, [side]: APPROVED }, FIXTURE, op(action), ACTOR), null)
        continue
      }
      assert.equal(readHumanReceipt({ ...valid, [side]: null }, FIXTURE, op(action), ACTOR), null)
      for (const [key, value] of Object.entries(child(valid, side))) {
        const missing = structuredClone(valid); delete child(missing, side)[key]
        assert.equal(readHumanReceipt(missing, FIXTURE, op(action), ACTOR), null, side + ' missing ' + key)
        const wrong = structuredClone(valid); child(wrong, side)[key] = value === null ? 'unexpected' : null
        assert.equal(readHumanReceipt(wrong, FIXTURE, op(action), ACTOR), null, side + ' wrong ' + key)
      }
      const extra = structuredClone(valid); child(extra, side).extra = true
      assert.equal(readHumanReceipt(extra, FIXTURE, op(action), ACTOR), null)
    }
    for (const recordedAt of ['2026-11-12T16:23:45.123Z', '2026-02-30T16:23:45.123456Z',
      '0000-01-01T00:00:00.000000Z', '2026-11-12T16:23:45.123456+00:00', 'infinity']) {
      assert.equal(readHumanReceipt({ ...valid, recordedAt }, FIXTURE, op(action), ACTOR), null)
    }
  }
  const getter = { ...receipt('stage') }
  Object.defineProperty(getter, 'actorId', { enumerable: true, get: () => ACTOR })
  assert.equal(readHumanReceipt(getter, FIXTURE, op('stage'), ACTOR), null)
})

test('existing revoked head and maximum permitted epochs remain exact through approval and revoke', () => {
  const head: HumanSnapshot = { ...REVOKED, epoch: 2_147_483_645 }
  const next: HumanRelease = { ...FIXTURE, revision: 2, predecessorRevision: 1, expectedHead: head,
    methodDigest: 'c'.repeat(64), approval: { mode: 'until_revoked', until: null } }
  assert.ok(readHumanRelease(next))
  const after: HumanSnapshot = { methodId: next.methodId, revision: 2, methodDigest: next.methodDigest,
    packageDigest: next.packageDigest, epoch: 2_147_483_646, status: 'approved', approvalMode: 'until_revoked', approvalUntil: null }
  const command = buildHumanCommand(next, op('approve'))
  assert.ok(command && command.action === 'approve')
  assert.deepEqual(command.expected, { revision: 1, methodDigest: head.methodDigest, packageDigest: head.packageDigest,
    epoch: 2_147_483_645, status: 'revoked' })
  const approved = { ...receipt('approve'), command, before: head, after }
  assert.ok(readHumanReceipt(approved, next, op('approve'), ACTOR))
  assert.equal(readHumanReceipt({ ...approved, before: { ...head, epoch: head.epoch - 1 } }, next, op('approve'), ACTOR), null)
  const revoked = { ...receipt('revoke'), command: buildHumanCommand(next, op('revoke')), before: after,
    after: { ...after, epoch: 2_147_483_647, status: 'revoked', approvalMode: null, approvalUntil: null } }
  assert.ok(readHumanReceipt(revoked, next, op('revoke'), ACTOR))
  const stage = { ...receipt('stage'), command: buildHumanCommand(next, op('stage')), before: head, after: head }
  assert.ok(readHumanReceipt(stage, next, op('stage'), ACTOR))
  assert.equal(readHumanReceipt({ ...stage, after: null }, next, op('stage'), ACTOR), null)
})

test('expired approvals remain confirmable history, without accepting changed original expiry', () => {
  const old: HumanRelease = { ...FIXTURE, approval: { mode: 'until', until: '2020-01-01T00:00:00.000Z' } }
  const historical = { ...receipt('approve'), command: buildHumanCommand(old, op('approve')),
    after: { ...APPROVED, approvalUntil: old.approval.until } }
  assert.ok(readHumanReceipt(historical, old, op('approve'), ACTOR))
  assert.equal(readHumanReceipt(historical, FIXTURE, op('approve'), ACTOR), null)
  const absent = { status: 'absent', operationId: op('approve').operationId }
  assert.deepEqual(readHumanReceipt(absent, FIXTURE, op('approve'), ACTOR), absent)
  assert.equal(readHumanReceipt({ ...absent, actorId: ACTOR }, FIXTURE, op('approve'), ACTOR), null)
  assert.equal(readHumanReceipt({ ...absent, operationId: op('approve', '2').operationId }, FIXTURE, op('approve'), ACTOR), null)
})

test('canonical closed request rejects duplicate, escaped, foreign authority and oversized input', () => {
  const raw = JSON.stringify({ ...op('stage'), intent: 'mutate' })
  assert.ok(readHumanRequestText(raw))
  for (const bad of [raw + ' ', raw.replace('"schema":1', '"schema":1,"schema":1'),
    raw.replace('"schema"', '"\\u0073chema"'), raw.replace('"mutate"', '"retry"'),
    JSON.stringify({ ...op('stage'), intent: 'mutate', targetUrl: HUMAN_METHOD_DEV_URL }),
    JSON.stringify({ ...op('stage'), intent: 'mutate', actorId: ACTOR, aal: 'aal2', approved: true }),
    JSON.stringify({ ...op('stage'), intent: 'mutate', methodDigest: FIXTURE.methodDigest }),
    'x'.repeat(HUMAN_METHOD_BODY_BYTES + 1), '😀'.repeat(2049), 'null', '[]']) assert.equal(readHumanRequestText(bad), null)
  const url = 'https://review-branch.vercel.app/api/admin/official-truth/method'
  assert.equal(humanRequestHeadersAllowed(url, 'https://review-branch.vercel.app', 'application/json'), true)
  assert.equal(humanRequestHeadersAllowed(url, 'https://review-branch.vercel.app', 'application/json; charset=utf-8'), true)
  for (const origin of [null, 'null', '', 'https://evil.invalid', 'https://review-branch.vercel.app/',
    'https://review-branch.vercel.app https://evil.invalid']) assert.equal(humanRequestHeadersAllowed(url, origin, 'application/json'), false)
  for (const type of [null, 'text/plain', 'application/json; charset=latin1', 'multipart/form-data']) {
    assert.equal(humanRequestHeadersAllowed(url, 'https://review-branch.vercel.app', type), false)
  }
  assert.equal(humanRequestHeadersAllowed('http://review-branch.vercel.app/api', 'http://review-branch.vercel.app', 'application/json'), false)
})

test('write ACK, absent reply, reload and double submission never unlock a replacement write', () => {
  const empty = readHumanJournal(null, FIXTURE.selectionId)
  assert.ok(empty)
  const pending = appendHumanOperation(empty, null, 'stage', op('stage').operationId)
  assert.ok(pending)
  assert.equal(nextHumanAction(pending, null), null)
  assert.equal(appendHumanOperation(pending, null, 'stage', op('stage', '2').operationId), null)
  assert.equal(appendHumanOperation(pending, null, 'approve', op('approve', '2').operationId), null)
  const ack = { schema: 1, intent: 'mutate', operation: op('stage'), status: 'recorded', recordedAt: RECORDED_AT, code: null }
  assert.ok(readHumanOutcome(ack, op('stage'), 'mutate'))
  assert.equal(readHumanOutcome({ ...ack, status: 'confirmed' }, op('stage'), 'mutate'), null)
  assert.equal(readHumanOutcome(ack, op('stage'), 'confirm'), null)
  const absent = { ...ack, intent: 'confirm', status: 'absent', recordedAt: null }
  assert.ok(readHumanOutcome(absent, op('stage'), 'confirm'))
  assert.equal(readHumanOutcome({ ...absent, intent: 'mutate' }, op('stage'), 'mutate'), null)
  const reopened = readHumanJournal(JSON.stringify(pending), FIXTURE.selectionId)
  assert.deepEqual(reopened, pending)
  assert.ok(reopened)
  assert.deepEqual(latestHumanOperation(reopened), op('stage'))
  assert.equal(nextHumanAction(reopened, null), null)
  const confirmation = readHumanOutcome({ ...ack, intent: 'confirm', status: 'confirmed' }, op('stage'), 'confirm')
  assert.ok(confirmation)
  assert.equal(nextHumanAction(reopened, confirmation.operation), 'approve')
  const approve = appendHumanOperation(reopened, confirmation.operation, 'approve', op('approve', '2').operationId)
  assert.ok(approve)
  assert.equal(nextHumanAction(approve, confirmation.operation), null)
  assert.equal(appendHumanOperation(reopened, confirmation.operation, 'approve', op('stage').operationId), null)
  assert.equal(readHumanOutcome({ ...ack, actorId: ACTOR }, op('stage'), 'mutate'), null)
  assert.equal(readHumanOutcome({ ...ack, status: 'unresolved', recordedAt: null, code: {} }, op('stage'), 'mutate'), null)
})

test('recovery storage is bounded, exact and nonsecret; failed persistence refuses mutation readiness', () => {
  const empty = readHumanJournal(null, FIXTURE.selectionId)
  assert.ok(empty)
  const journal = appendHumanOperation(empty, null, 'stage', op('stage').operationId)
  assert.ok(journal)
  let value: string | null = null
  const storage = { getItem: (key: string) => key === HUMAN_METHOD_STORAGE_KEY ? value : null,
    setItem: (key: string, next: string) => { assert.equal(key, HUMAN_METHOD_STORAGE_KEY); value = next } }
  assert.equal(persistHumanJournal(storage, journal), true)
  assert.deepEqual(readHumanJournal(value, FIXTURE.selectionId), journal)
  assert.equal(persistHumanJournal({ getItem: () => null, setItem: () => { throw Error('storage unavailable') } }, journal), false)
  assert.equal(persistHumanJournal({ getItem: () => 'different', setItem: () => undefined }, journal), false)
  for (const raw of ['x'.repeat(2049), JSON.stringify({ ...journal, confirmed: true }),
    JSON.stringify({ ...journal, actorId: ACTOR }), JSON.stringify({ ...journal, stage: { ...journal.stage, token: 'forbidden' } }),
    JSON.stringify({ ...journal, stage: null, approve: op('approve') }), JSON.stringify({ ...journal, approve: op('approve') }),
    JSON.stringify(journal) + ' ', JSON.stringify(journal).replace('"schema":1', '"schema":1,"schema":1')]) {
    assert.equal(readHumanJournal(raw, FIXTURE.selectionId), null)
  }
  assert.equal(readHumanJournal(JSON.stringify(journal), 'hmr1_' + '2'.repeat(32)), null)
  const generated = createHumanOperationId()
  assert.match(generated, /^maop1_[0-9a-f]{32}$/)
})

test('real pure guard policies reject AAL1, role mismatch and break-glass writes (mock inputs)', () => {
  const user = { id: ACTOR, email: 'owner@example.invalid' }, allowlist = new Set<string>()
  const owner = decideAdminAccess({ user, lookup: { status: 'ok', role: 'owner' }, allowlist, capability: 'official-truth-freigeben' })
  assert.deepEqual(applyAdminAal(owner, parseAalLookup({ currentLevel: 'aal1', nextLevel: 'aal2' })), { allowed: false, denial: 'aal2-required' })
  assert.deepEqual(applyAdminAal(owner, { status: 'failed', reason: 'mock unavailable' }), { allowed: false, denial: 'aal-lookup-failed' })
  assert.deepEqual(applyAdminAal(owner, { status: 'ok', currentLevel: 'aal2' }), { allowed: true, role: 'owner', grant: 'role' })
  assert.equal(decideAdminAccess({ user, lookup: { status: 'ok', role: 'admin' }, allowlist, capability: 'official-truth-freigeben' }).allowed, false)
  const fallback = decideAdminAccess({ user, lookup: { status: 'unknown' }, allowlist: new Set([user.email]), capability: 'official-truth-freigeben' })
  assert.ok(fallback.allowed)
  assert.equal(fallback.grant, 'break-glass')
  assert.equal(adminWriteErlaubt({ grant: fallback.grant }).erlaubt, false)
})

test('four local wrappers require the exact caller and actual SQL source; unknown names stay refused', () => {
  const sourcePath = 'lib/readiness/official-truth-product-v3/method/human-server.ts'
  const sqlPath = 'scripts/db/official-truth-v3-human-method-transport-1/install-candidate.sql'
  const names = ['official_v3_method_stage_draft_v1', 'official_v3_method_approve_v1',
    'official_v3_method_revoke_v1', 'official_v3_method_confirm_operation_v1']
  assert.deepEqual(LOCAL_UNAPPLIED_RPCS.filter(rule => rule.sourcePath === sourcePath), names.map(name => ({ name, sourcePath, sqlPath })))
  const actualSource = readFileSync(sourcePath, 'utf8'), actualSql = readFileSync(sqlPath, 'utf8')
  const check = (path: string, source: string, sql: string | null) => pruefe({
    dateien: [path], lese: () => source,
    typenInhalt: '    Tables: {\n    }\n    Views: {\n    }\n    Functions: {\n    }',
    sqlVorhanden: (path: string) => path === sqlPath && sql !== null,
    sqlInhalt: () => sql ?? '',
  })
  const accepted = check(sourcePath, actualSource, actualSql)
  assert.equal(accepted.befunde.length, 0)
  assert.deepEqual(accepted.lokaleUnapplied.map(item => item.name).sort(), [...names].sort())
  for (const name of names) {
    const call = `.rpc(${JSON.stringify(name)})`
    assert.equal(check('lib/wrong-caller.ts', call, actualSql).befunde[0]?.grund, 'wrong-source')
    assert.equal(check(sourcePath, call, null).befunde[0]?.grund, 'missing-sql')
    assert.equal(check(sourcePath, call, 'create function public.unrelated()').befunde[0]?.grund, 'missing-sql')
  }
  const unknown = ['unreviewed', 'human', 'wrapper'].join('_')
  assert.equal(check(sourcePath, `.rpc(${JSON.stringify(unknown)})`, actualSql).befunde[0]?.name, unknown)
})
