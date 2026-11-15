import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseCmsCommand } from '../cms/contract'
import { cmsReadback, parseCmsConfirmation, parseCmsRead, parseCmsReceipt } from './responses'
import { CMS_TEST_AT, CMS_TEST_COPY, CMS_TEST_ENTRY, CMS_TEST_ID, CMS_TEST_OTHER, fixtureRead, fixtureReceipt, fixtureRevision } from '@/scripts/admin-cms-editor-2/fixtures'

const query = { entryId: CMS_TEST_ENTRY }
const command = parseCmsCommand({ requestId: CMS_TEST_ID, entryId: CMS_TEST_ENTRY, expectedVersion: '0', action: 'save_draft', payload: CMS_TEST_COPY })!

test('read distinguishes a seeded entry from unavailable and detaches the canonical copy', () => {
  const empty = parseCmsRead(fixtureRead(), query)!
  assert.equal(empty.entry.version, '0'); assert.equal(empty.preview, null)
  assert.equal(parseCmsRead(null, query), null)
  const raw = fixtureRead({ draft: '1' })
  const parsed = parseCmsRead(raw, query)!
  raw.history[0].content.themen.push('strand')
  assert.deepEqual(parsed.preview?.content.themen, ['natur'])
  raw.history[0].content.themen.pop()
})

test('read refuses cross-entry, noncanonical identity, stale pointers and malformed revisions as one batch', () => {
  const mutations: ((raw: ReturnType<typeof fixtureRead>) => unknown)[] = [
    raw => ({ ...raw, extra: true }),
    raw => ({ ...raw, schema: 2 }),
    raw => ({ ...raw, entry: { ...raw.entry, entryId: CMS_TEST_OTHER } }),
    raw => ({ ...raw, entry: { ...raw.entry, name: 'Unbekannt' } }),
    raw => ({ ...raw, entry: { ...raw.entry, locale: 'en' } }),
    raw => ({ ...raw, entry: { ...raw.entry, version: 1 } }),
    raw => ({ ...raw, entry: { ...raw.entry, version: '01' } }),
    raw => ({ ...raw, entry: { ...raw.entry, version: '9223372036854775808' } }),
    raw => ({ ...raw, entry: { ...raw.entry, version: '0' } }),
    raw => ({ ...raw, entry: { ...raw.entry, publishedRevision: '1', publishedAt: null } }),
    raw => ({ ...raw, entry: { ...raw.entry, publishedRevision: '2', publishedAt: CMS_TEST_AT } }),
    raw => ({ ...raw, entry: { ...raw.entry, archived: true, publishedRevision: '1', publishedAt: CMS_TEST_AT } }),
    raw => ({ ...raw, entry: { ...raw.entry, updatedAt: '2026-02-30T12:00:00.123456Z' } }),
    raw => ({ ...raw, preview: null }),
    raw => ({ ...raw, preview: { ...raw.preview, revision: '2' } }),
    raw => ({ ...raw, preview: { ...raw.preview, restoredFromRevision: '1' } }),
    raw => ({ ...raw, preview: { ...raw.preview, createdBy: 'unknown' } }),
    raw => ({ ...raw, preview: { ...raw.preview, content: { ...raw.preview!.content, idea: 'Anderer Inhalt als in der Historie' } } }),
    raw => ({ ...raw, history: [] }),
    raw => ({ ...raw, history: [...raw.history, ...raw.history] }),
    raw => ({ ...raw, history: [fixtureRevision('1', { entryId: CMS_TEST_OTHER })] }),
    raw => ({ ...raw, nextBeforeRevision: '1' }),
    raw => ({ ...raw, preview: { ...raw.preview, content: { ...raw.preview!.content, idea: '<p>Text</p>' } } }),
  ]
  for (const [index, mutate] of mutations.entries()) assert.equal(parseCmsRead(mutate(fixtureRead({ draft: '1' })), query), null, `mutation ${index}`)
})

test('read handles bigint precision, an explicit historic preview and the exclusive entry cursor', () => {
  const huge = '9007199254740993'
  assert.equal(parseCmsRead(fixtureRead({ version: huge, draft: huge }), query)?.entry.version, huge)
  const second = fixtureRevision('2'), first = fixtureRevision('1')
  assert.equal(parseCmsRead(fixtureRead({ draft: '2', revisions: [second, first], preview: first }), { ...query, revision: '1' })?.preview?.revision, '1')
  const page = fixtureRead({ draft: '2', revisions: [first], preview: second })
  assert.equal(parseCmsRead(page, { ...query, beforeRevision: '2', limit: 1 })?.history[0].revision, '1')
  assert.equal(parseCmsRead(page, { ...query, beforeRevision: '1' }), null)
  assert.equal(parseCmsRead(fixtureRead({ draft: '1', preview: fixtureRevision('2') }), { ...query, revision: '2' }), null)
  assert.equal(parseCmsRead(fixtureRead({ draft: '2', revisions: [second], before: '2' }), { ...query, limit: 1 })?.nextBeforeRevision, '2')
})

test('accessors, sparse arrays and hostile proxies fail closed without executing getters', () => {
  let calls = 0
  const raw = fixtureRead({ draft: '1' })
  Object.defineProperty(raw, 'preview', { enumerable: true, get() { calls++; throw new Error('accessor') } })
  assert.equal(parseCmsRead(raw, query), null); assert.equal(calls, 0)
  const revoked = Proxy.revocable({}, {}); revoked.revoke()
  assert.equal(parseCmsRead(revoked.proxy, query), null)
  const sparse = fixtureRead({ draft: '1' }); delete sparse.history[0]
  assert.equal(parseCmsRead(sparse, query), null)
  const symbols = fixtureRead(); Object.defineProperty(symbols, Symbol('hidden'), { value: true })
  assert.equal(parseCmsRead(symbols, query), null)
})

test('receipts are bound to the complete expected intent and only matching readback confirms current state', () => {
  const raw = fixtureReceipt(command, { draft: '1', created: '1' })
  const receipt = parseCmsReceipt(raw, command)!
  assert.ok(receipt)
  for (const patch of [{ requestId: '22222222-2222-4222-8222-222222222222' }, { entryId: CMS_TEST_OTHER }, { action: 'publish' },
    { beforeVersion: '1' }, { version: '2' }, { createdRevision: null }, { draftRevision: '0' }, { publishedRevision: '1' }, { archived: true }, { extra: true }]) {
    assert.equal(parseCmsReceipt({ ...raw, ...patch }, command), null)
  }
  const read = parseCmsRead(fixtureRead({ draft: '1' }), query)!
  assert.equal(cmsReadback(read, receipt, command), 'current')
  const differentCopy = parseCmsRead(fixtureRead({ draft: '1', revisions: [fixtureRevision('1', { copy: { ...CMS_TEST_COPY, idea: 'Anderer Text' } })] }), query)!
  assert.equal(cmsReadback(differentCopy, receipt, command), null)
  assert.equal(cmsReadback(parseCmsRead(fixtureRead({ draft: '2' }), query)!, receipt, command), 'changed')
  assert.equal(cmsReadback(parseCmsRead(fixtureRead(), query)!, receipt, command), null)
  assert.deepEqual(parseCmsConfirmation({ schema: 1, status: 'unknown', requestId: command.requestId }, command), { schema: 1, status: 'unknown', requestId: command.requestId })
  assert.equal(parseCmsConfirmation({ schema: 1, status: 'unknown', requestId: CMS_TEST_OTHER }, command), null)
})

test('publish, archive and restore receipts cannot imply the wrong lifecycle effect', () => {
  for (const action of ['publish', 'archive', 'restore_draft'] as const) {
    const cmd = parseCmsCommand({ requestId: CMS_TEST_ID, entryId: CMS_TEST_ENTRY, expectedVersion: '1', action,
      payload: action === 'archive' ? {} : { revision: '1' } })!
    const result = fixtureReceipt(cmd, action === 'restore_draft' ? { draft: '2', created: '2' }
      : action === 'publish' ? { draft: '1', published: '1' } : { draft: '1', archived: true })
    assert.ok(parseCmsReceipt(result, cmd), action)
    assert.equal(parseCmsReceipt({ ...result, archived: !result.archived }, cmd), null, `${action}: archive effect`)
  }
})
