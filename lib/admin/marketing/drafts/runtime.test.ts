import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { applyDraft, confirmDraft, readDrafts, type DraftDatabase } from './operations'
import { DraftController } from './controller'
import { parseMarketingDraftCommand, type MarketingDraftCommand, type MarketingDraftRevision } from './contract'
import { confirmationHistory, draftRecoveryFromUrl, draftRecoveryUrl, parseDraftConfirm, type DraftApply, type DraftConfirmation, type DraftOutcome, type DraftPort } from './runtime-contract'
import { createDraftTransport } from './transport'
import { draftHttpFailure, draftRequestHeadersAllowed, readDraftBody } from './http'
import { MARKETING_DRAFT_TEXT } from './texts'

const draftId = '11111111-1111-4111-8111-111111111111'
const requestId = '22222222-2222-4222-8222-222222222222'
const actorId = '33333333-3333-4333-8333-333333333333'
const payload = { label: 'Synthetic campaign', destination: 'planning' as const, channel: 'newsletter' as const, contentId: null }
const command = parseMarketingDraftCommand({ schemaVersion: 1, action: 'create', draftId, requestId, expectedVersion: '0', payload })!
const identity = { draftId, requestId, expectedVersion: '0' }
const receipt: MarketingDraftRevision = { draftId, requestId, actorId, action: 'create', state: 'draft', version: '1', payload, savedAt: '2026-11-16T01:02:03.123456Z', restoredFrom: null }
const applied: DraftApply = { schemaVersion: 1, action: 'apply', receipt, replayed: false }
const read = { schemaVersion: 1 as const, action: 'get' as const, draft: receipt }
const list = { schemaVersion: 1 as const, action: 'list' as const, items: [receipt], nextCursor: null }
const history = { schemaVersion: 1 as const, action: 'history' as const, draftId, items: [receipt], nextCursor: null }
const emptyList = { ...list, items: [] }
function database(overrides: Partial<DraftDatabase> = {}): DraftDatabase {
  return { read: async query => ({ data: query.action === 'get' ? read : query.action === 'list' ? list : history, error: null }),
    apply: async () => ({ data: applied, error: null }), ...overrides }
}
function port(overrides: Partial<DraftPort> = {}): DraftPort {
  return { read: async query => ({ ok: true, value: query.action === 'list' ? emptyList : query.action === 'get' ? read : history }),
    apply: async () => ({ ok: true, value: applied }),
    confirm: async () => ({ ok: true, value: { status: 'confirmed', receipt, current: receipt } }), ...overrides }
}
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done }); return { promise, resolve } }

test('read adapter validates the exact resource/cursor and never turns a database error into an empty list', async () => {
  assert.equal((await readDrafts(database(), { schemaVersion: 1, action: 'list' })).ok, true)
  assert.deepEqual(await readDrafts(database({ read: async () => ({ data: [], error: { code: '42501' } }) }), { schemaVersion: 1, action: 'list' }), { ok: false, code: 'forbidden' })
  assert.deepEqual(await readDrafts(database({ read: async () => ({ data: { ...read, draft: { ...receipt, draftId: requestId } }, error: null }) }), { schemaVersion: 1, action: 'get', draftId }), { ok: false, code: 'unavailable' })
  let called = false
  assert.deepEqual(await readDrafts(database({ read: async () => { called = true; throw Error('private'); } }), { schemaVersion: 1, action: 'list', limit: 51 }), { ok: false, code: 'invalid' })
  assert.equal(called, false)
})

test('apply validates exact actor, request, version and payload; backend text is never exposed', async () => {
  assert.deepEqual(await applyDraft(database(), command, actorId), { ok: true, value: applied })
  for (const replacement of [{ actorId: requestId }, { requestId: draftId }, { payload: { ...payload, label: 'other' } }]) {
    const db = database({ apply: async () => ({ data: { ...applied, receipt: { ...receipt, ...replacement } }, error: null }) })
    assert.deepEqual(await applyDraft(db, command, actorId), { ok: false, code: 'unknown' })
  }
  const db = database({ apply: async () => { throw Error('raw backend credentials'); } })
  assert.deepEqual(await applyDraft(db, command, actorId), { ok: false, code: 'unknown' })
  assert.deepEqual(await applyDraft(database({ apply: async () => ({ data: null, error: { code: 'P4091' } }) }), command, actorId), { ok: false, code: 'conflict' })
})

test('confirmation binds exact actor/op/version then reads current state; missing evidence remains unresolved', async () => {
  const calls: string[] = []
  const db = database({ read: async query => { calls.push(query.action); return { data: query.action === 'history' ? history : read, error: null } } })
  assert.deepEqual(await confirmDraft(db, identity, actorId), { ok: true, value: { status: 'confirmed', receipt, current: receipt } })
  assert.deepEqual(calls, ['history', 'get'])
  for (const item of [null, { ...receipt, actorId: draftId }, { ...receipt, requestId: draftId }]) {
    const incomplete = database({ read: async () => ({ data: { ...history, items: item ? [item] : [] }, error: null }) })
    assert.deepEqual(await confirmDraft(incomplete, identity, actorId), { ok: true, value: { status: 'unresolved' } })
  }
  const later = { ...receipt, action: 'save' as const, requestId: draftId, version: '2', payload: { ...payload, label: 'Later edit' } }
  const advanced = database({ read: async query => ({ data: query.action === 'history' ? history : { ...read, draft: later }, error: null }) })
  const confirmed = await confirmDraft(advanced, identity, actorId)
  assert.equal(confirmed.ok && confirmed.value.status === 'confirmed' && confirmed.value.current.version, '2')
  const forbidden = database({ read: async query => query.action === 'history' ? { data: history, error: null } : { data: null, error: { code: '42501' } } })
  assert.deepEqual(await confirmDraft(forbidden, identity, actorId), { ok: false, code: 'forbidden' })
})

test('reload identity has only opaque IDs and canonical bigint; confirmation selects one exact historical version', () => {
  const url = draftRecoveryUrl('https://jetnity.example/admin/marketing?existing=1#section', identity)
  assert.equal(url.includes(payload.label), false)
  assert.deepEqual(draftRecoveryFromUrl(`https://jetnity.example${url}`), identity)
  const duplicate = new URL(`https://jetnity.example${url}`)
  duplicate.searchParams.append('campaignDraft', draftId)
  assert.equal(draftRecoveryFromUrl(duplicate.href), null)
  assert.equal(draftRecoveryUrl(`https://jetnity.example${url}`, null), '/admin/marketing?existing=1#section')
  assert.equal(parseDraftConfirm({ ...identity, token: 'secret' }), null)
  assert.equal(parseDraftConfirm({ ...identity, expectedVersion: '9223372036854775807' }), null)
  assert.deepEqual(confirmationHistory(identity), { schemaVersion: 1, action: 'history', draftId, limit: 1, cursor: '2' })
  assert.deepEqual(confirmationHistory({ ...identity, expectedVersion: '9223372036854775806' }), { schemaVersion: 1, action: 'history', draftId, limit: 1 })
})

test('controller never declares an ACK saved, prevents duplicates and retries the identical uncertain command', async () => {
  const ack = deferred<DraftOutcome<DraftApply>>()
  const sent: MarketingDraftCommand[] = [], remembered: unknown[] = []
  let confirmed: DraftConfirmation = { status: 'unresolved' }
  let uuidCount = 0
  const controller = new DraftController(port({ apply: async input => { sent.push(input); return sent.length === 1 ? ack.promise : { ok: false, code: 'rate_limit' } },
    confirm: async () => ({ ok: true, value: confirmed }) }), () => ++uuidCount === 1 ? draftId : requestId, input => { remembered.push(input) })
  await controller.start(); controller.newDraft(); controller.edit(payload)
  const saving = controller.save(); await controller.save()
  assert.equal(sent.length, 1); assert.deepEqual(remembered, [identity]); assert.equal(controller.snapshot().notice, null)
  ack.resolve({ ok: true, value: applied }); await saving
  assert.equal(controller.snapshot().notice, 'unresolved'); assert.ok(controller.snapshot().pending)
  await controller.retry(); assert.deepEqual(sent[1], sent[0]); assert.ok(controller.snapshot().pending)
  const later = { ...receipt, action: 'save' as const, requestId: draftId, version: '2' }
  confirmed = { status: 'confirmed', receipt, current: later }
  await controller.confirm()
  assert.equal(controller.snapshot().pending, null); assert.equal(controller.snapshot().notice, 'confirmed_later')
  assert.equal(controller.snapshot().current?.version, '2'); assert.equal(remembered.at(-1), null)
})

test('reloaded uncertainty is read-only and cannot replay missing payload; failed recovery keeps all writes locked', async () => {
  let mutations = 0
  const controller = new DraftController(port({ apply: async () => { mutations++; return { ok: true, value: applied } },
    confirm: async () => ({ ok: true, value: { status: 'unresolved' } }) }), () => requestId, () => undefined)
  await controller.start(identity); await controller.retry(); controller.newDraft(); await controller.save(); await controller.discard()
  assert.equal(mutations, 0); assert.equal(controller.snapshot().pending?.command, null); assert.equal(controller.blocked(), true)
})

test('authority withdrawal closes protected UI while preserving operation identity and prevents automatic retry', async () => {
  let denied = false
  const controller = new DraftController(port({ confirm: async () => ({ ok: false, code: 'forbidden' }),
    read: async query => denied ? { ok: false, code: 'forbidden' } : { ok: true, value: query.action === 'list' ? list : query.action === 'get' ? read : history } }), () => requestId, () => undefined)
  await controller.start(); await controller.select(draftId); controller.edit({ label: 'Edit' })
  await controller.save()
  const state = controller.snapshot()
  assert.equal(state.status, 'denied'); assert.equal(state.editor, null); assert.equal(state.current, null)
  assert.deepEqual(state.items, []); assert.deepEqual(state.history, []); assert.ok(state.pending)
  denied = true; await controller.list(); assert.equal(controller.snapshot().status, 'denied')
})

test('first CAS rejection preserves input, requires explicit reload, and cannot be cleared by editing text', async () => {
  let writes = 0
  const controller = new DraftController(port({ read: async query => ({ ok: true, value: query.action === 'list' ? list : query.action === 'get' ? read : history }),
    apply: async () => { writes++; return { ok: false, code: 'conflict' } } }), () => requestId, () => undefined)
  await controller.start(); await controller.select(draftId); controller.edit({ label: 'Pending edit' }); await controller.save()
  assert.equal(controller.snapshot().pending, null); assert.equal(controller.snapshot().dirty, true)
  controller.edit({ label: 'New text' }); await controller.save(); assert.equal(writes, 1)
  await controller.discard(); assert.equal(controller.snapshot().editor?.payload.label, receipt.payload.label)
  assert.equal(controller.snapshot().error, null)
})

test('bounded same-origin JSON rejects foreign origins, oversized bodies and invalid encoding without exposing data', async () => {
  const make = (body: string, headers: Record<string, string> = {}) => new Request('https://preview.example/api/admin/marketing/drafts/apply', { method: 'POST',
    headers: { Origin: 'https://preview.example', 'Sec-Fetch-Site': 'same-origin', 'Content-Type': 'application/json', ...headers }, body })
  assert.equal(draftRequestHeadersAllowed(make('{}')), true)
  assert.equal(draftRequestHeadersAllowed(make('{}', { Origin: 'https://other.example' })), false)
  assert.equal(draftRequestHeadersAllowed(make('{}', { 'Sec-Fetch-Site': 'cross-site' })), false)
  assert.equal(draftRequestHeadersAllowed(make('{}', { 'Content-Type': 'text/plain' })), false)
  assert.deepEqual(await readDraftBody(make(JSON.stringify(command))), command)
  assert.equal(await readDraftBody(make('x'.repeat(4097))), null)
  assert.equal(await readDraftBody(make('{}', { 'Content-Length': '1' })), null)
  const answer = draftHttpFailure('unknown')
  assert.equal(answer.status, 503); assert.match(answer.headers.get('cache-control')!, /no-store/)
  assert.deepEqual(await answer.json(), { ok: false, code: 'unknown' })
})

test('HTTP transport hides data immediately on 403 even if cancellation never settles; malformed login/200 cannot succeed', async () => {
  const denied = createDraftTransport(async () => new Response(new ReadableStream({ cancel() { return new Promise(() => undefined) } }), { status: 403 }))
  const timeout = new Promise<never>((_, reject) => { const t = setTimeout(() => reject(Error('authority result stalled')), 200); t.unref() })
  assert.deepEqual(await Promise.race([denied.read({ schemaVersion: 1, action: 'list', limit: 20 }), timeout]), { ok: false, code: 'forbidden' })
  const wrong = createDraftTransport(async () => new Response('<html>Login</html>', { headers: { 'Content-Type': 'text/html' } }))
  assert.deepEqual(await wrong.apply(command), { ok: false, code: 'unknown' })
})

test('shipped campaign locale keys match and production UI always uses the admitted concrete runtime transport', () => {
  assert.deepEqual(Object.keys(MARKETING_DRAFT_TEXT.de).sort(), Object.keys(MARKETING_DRAFT_TEXT.en).sort())
  assert.ok(Object.values(MARKETING_DRAFT_TEXT.de).every(Boolean)); assert.ok(Object.values(MARKETING_DRAFT_TEXT.en).every(Boolean))
  const page = readFileSync(new URL('../../../../app/(admin)/admin/marketing/page.tsx', import.meta.url), 'utf8')
  assert.match(page, /CampaignDrafts sprache=\{sprache\} enabled=\{isAdminHostedRuntimeEnabled\(\)\}/)
  assert.match(page, /MarketingLinks sprache=\{sprache\}/)
  assert.doesNotMatch(page, /port=|service.role|localStorage|sessionStorage/)
})
