import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MARKETING_KANAELE, MARKETING_ZIELE } from '../links'
import { marketingDraftLink, parseMarketingDraftCommand, parseMarketingDraftRead, parseMarketingDraftResult } from './contract'

const draftId = '11111111-1111-4111-8111-111111111111'
const requestId = '22222222-2222-4222-8222-222222222222'
const payload = { label: 'Winter Zürich 🌍', destination: 'planning', channel: 'newsletter', contentId: null }
const create = { schemaVersion: 1, requestId, draftId, expectedVersion: '0', action: 'create', payload }
const revision = { draftId, requestId, actorId: requestId, version: '1', action: 'create', state: 'draft',
  payload, savedAt: '2026-11-15T12:34:56.123456Z', restoredFrom: null }
const applied = { schemaVersion: 1, action: 'apply', receipt: revision, replayed: false }

for (const destination of MARKETING_ZIELE) for (const channel of MARKETING_KANAELE) {
  test(`draft contract reuses closed URL truth: ${destination}/${channel}`, () => {
    const command = parseMarketingDraftCommand({ ...create, payload: { ...payload, destination, channel } })
    assert.ok(command)
    const url = new URL(marketingDraftLink({ ...revision, payload: { ...payload, destination, channel } })!)
    assert.equal(url.origin, 'https://jetnity.com')
    assert.equal(url.searchParams.get('utm_campaign'), `cmp-${draftId}`)
    assert.equal(url.searchParams.size, 3)
    assert.equal(url.href.includes('Winter'), false)
  })
}

test('commands keep IDs and exact bigint versions; archive and restore stay internal', () => {
  assert.deepEqual(parseMarketingDraftCommand(create), create)
  for (const version of ['1', '9007199254740993', '9223372036854775807']) {
    const save = { ...create, expectedVersion: version, action: 'save' }
    assert.deepEqual(parseMarketingDraftCommand(save), save)
    const restore = { ...save, action: 'restore', payload: { revision: version } }
    assert.deepEqual(parseMarketingDraftCommand(restore), restore)
    assert.ok(parseMarketingDraftCommand({ ...save, action: 'archive', payload: {} }))
  }
  assert.ok(parseMarketingDraftCommand({ ...create, payload: { ...payload, label: '🌍'.repeat(80), contentId: `cnt-${requestId}` } }))
  for (const version of [0, 1, '', '-1', '01', '1.0', '1e2', '9223372036854775808']) {
    assert.equal(parseMarketingDraftCommand({ ...create, expectedVersion: version }), null)
  }
  for (const change of [
    { actorId: draftId }, { extra: true }, { schemaVersion: '1' }, { action: 'publish' }, { action: 'send' },
    { requestId: 'ABCDEFAB-1111-4111-8111-111111111111' }, { draftId: `cmp-${draftId}` }, { action: 'save' },
    { expectedVersion: '1' }, { action: 'archive', expectedVersion: '1', payload: { url: 'https://evil.test' } },
    { action: 'restore', expectedVersion: '1', payload: { revision: '2' } },
  ]) assert.equal(parseMarketingDraftCommand({ ...create, ...change }), null)
})

test('payload rejects arbitrary URL/query/identities, whitespace, controls and invalid markers', () => {
  for (const change of [
    { label: '' }, { label: ' x' }, { label: 'x\uFEFF' }, { label: 'a\nb' }, { label: 'x\u0085' },
    { label: '\ud800' }, { label: '🌍'.repeat(81) }, { destination: 'https://evil.test' }, { destination: '/planen' },
    { channel: 'email' }, { contentId: '' }, { contentId: undefined }, { contentId: `cmp-${draftId}` },
    { email: 'somebody@example.test' }, { url: 'https://jetnity.com' }, { query: { utm_campaign: 'someone' } },
  ]) assert.equal(parseMarketingDraftCommand({ ...create, payload: { ...payload, ...change } }), null)
  const missing = { label: payload.label, destination: payload.destination, channel: payload.channel }
  assert.equal(parseMarketingDraftCommand({ ...create, payload: missing }), null)
})

test('detached snapshots never invoke input accessors, coercions or array getters', () => {
  const source = structuredClone(create)
  const copy = parseMarketingDraftCommand(source)
  source.payload.label = 'changed'
  assert.equal(copy?.payload && 'label' in copy.payload && copy.payload.label, payload.label)
  let invoked = 0
  const getter = { ...create, get payload() { invoked++; return payload } }
  assert.equal(parseMarketingDraftCommand(getter), null)
  const coercion = { toString() { invoked++; return 'create' } }
  assert.equal(parseMarketingDraftResult({ ...applied, receipt: { ...revision, action: coercion } }), null)
  const array = [revision]
  Object.defineProperty(array, '0', { enumerable: true, get() { invoked++; return revision } })
  assert.equal(parseMarketingDraftResult({ schemaVersion: 1, action: 'list', items: array, nextCursor: null }), null)
  const revoked = Proxy.revocable({}, {}); revoked.revoke()
  for (const value of [new Proxy({}, { ownKeys() { throw Error('hostile') } }), revoked.proxy, [], new Date(), Object.create(create)]) {
    assert.equal(parseMarketingDraftCommand(value), null)
    assert.equal(parseMarketingDraftRead(value), null)
    assert.equal(parseMarketingDraftResult(value), null)
    assert.equal(marketingDraftLink(value), null)
  }
  const hidden = { ...create }; Object.defineProperty(hidden, 'action', { value: 'create', enumerable: false })
  assert.equal(parseMarketingDraftCommand(hidden), null)
  assert.equal(parseMarketingDraftCommand({ ...create, [Symbol('extra')]: true }), null)
  assert.equal(invoked, 0)
})

test('bounded closed read envelopes preserve full microsecond cursor precision', () => {
  const cursor = { savedAt: revision.savedAt, draftId }
  assert.deepEqual(parseMarketingDraftRead({ schemaVersion: 1, action: 'list' }), { schemaVersion: 1, action: 'list', limit: 20 })
  assert.deepEqual(parseMarketingDraftRead({ schemaVersion: 1, action: 'list', limit: 50, cursor, state: 'archived' }),
    { schemaVersion: 1, action: 'list', limit: 50, cursor, state: 'archived' })
  assert.ok(parseMarketingDraftRead({ schemaVersion: 1, action: 'get', draftId }))
  assert.ok(parseMarketingDraftRead({ schemaVersion: 1, action: 'history', draftId, cursor: '9007199254740993' }))
  for (const change of [{ limit: 0 }, { limit: 51 }, { limit: '20' }, { limit: 1.5 }, { limit: undefined },
    { draftId }, { state: null }, { state: 'published' }, { cursor: null }, { unknown: true }]) {
    assert.equal(parseMarketingDraftRead({ schemaVersion: 1, action: 'list', ...change }), null)
  }
  for (const savedAt of ['2026-02-30T00:00:00.000000Z', '2026-11-15T12:34:56.123Z', '2026-11-15T12:34:56.123456+00:00', '0000-01-01T00:00:00.000000Z']) {
    assert.equal(parseMarketingDraftRead({ schemaVersion: 1, action: 'list', cursor: { ...cursor, savedAt } }), null)
  }
})

test('receipt validates state/action/history identity without treating replay as fresh state', () => {
  assert.deepEqual(parseMarketingDraftResult(applied), applied)
  assert.deepEqual(parseMarketingDraftResult({ ...applied, replayed: true }), { ...applied, replayed: true })
  assert.equal(marketingDraftLink(revision), `https://jetnity.com/planen?utm_source=newsletter&utm_medium=email&utm_campaign=cmp-${draftId}`)
  for (const change of [{ action: 'publish' }, { version: '2' }, { state: 'archived' }, { restoredFrom: '1' },
    { savedAt: 'yesterday' }, { actorId: 'unverified' }, { url: 'https://evil.test' }, { version: 1 }]) {
    assert.equal(parseMarketingDraftResult({ ...applied, receipt: { ...revision, ...change } }), null)
  }
  const restored = { ...revision, version: '2', action: 'restore', restoredFrom: '1' }
  assert.ok(parseMarketingDraftResult({ ...applied, receipt: restored }))
  assert.equal(parseMarketingDraftResult({ ...applied, receipt: { ...restored, restoredFrom: '2' } }), null)
  assert.deepEqual(parseMarketingDraftResult({ schemaVersion: 1, action: 'get', draft: null }), { schemaVersion: 1, action: 'get', draft: null })
  assert.equal(parseMarketingDraftResult({ schemaVersion: 1, action: 'get', draft: undefined }), null)
})

test('read results reject mismatched cursors, duplicate drafts, unordered history and hostile arrays', () => {
  const second = { ...revision, draftId: requestId, savedAt: '2026-11-15T12:34:56.123457Z' }
  const list = { schemaVersion: 1, action: 'list', items: [second, revision], nextCursor: { savedAt: revision.savedAt, draftId } }
  assert.deepEqual(parseMarketingDraftResult(list), list)
  for (const items of [[revision, second], [revision, revision], Array(1), Object.assign([revision], { extra: true })]) {
    assert.equal(parseMarketingDraftResult({ ...list, items }), null)
  }
  assert.equal(parseMarketingDraftResult({ ...list, nextCursor: { savedAt: second.savedAt, draftId } }), null)
  assert.equal(parseMarketingDraftResult({ ...list, items: [], nextCursor: list.nextCursor }), null)
  const later = { ...revision, version: '2', action: 'save', requestId: draftId, savedAt: '2026-11-15T12:34:56.123457Z' }
  const history = { schemaVersion: 1, action: 'history', draftId, items: [later, revision], nextCursor: '1' }
  assert.deepEqual(parseMarketingDraftResult(history), history)
  assert.equal(parseMarketingDraftResult({ ...history, items: [revision, later] }), null)
  assert.equal(parseMarketingDraftResult({ ...history, draftId: requestId }), null)
  assert.equal(parseMarketingDraftResult({ ...history, nextCursor: '2' }), null)
  const parsed = parseMarketingDraftResult(list)
  list.items[0]!.payload.label = 'Changed after parsing'
  assert.equal(parsed && 'items' in parsed && parsed.items[0]!.payload.label, 'Winter Zürich 🌍')
})
