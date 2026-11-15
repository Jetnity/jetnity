import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CmsCommand } from '../cms/contract'
import { CMS_UNAVAILABLE_PORT, type CmsPort, type CmsPortResult } from './port'
import { createCmsEditor } from './state'
import { CMS_TEST_COPY, CMS_TEST_ENTRY, CMS_TEST_ID, CMS_TEST_OTHER, fixtureRead, fixtureReceipt, fixtureRevision } from '@/scripts/admin-cms-editor-2/fixtures'

function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done }); return { promise, resolve } }
async function tick() { for (let i = 0; i < 12; i++) await Promise.resolve() }
const ok = (value: unknown): CmsPortResult => ({ ok: true, value })
const form = () => ({ ...CMS_TEST_COPY, themen: ['natur'] as const })

test('unapplied runtime never yields fake content or a usable write action', async () => {
  const editor = createCmsEditor(CMS_UNAVAILABLE_PORT, CMS_TEST_ENTRY)
  await editor.load(); await editor.send('publish')
  assert.equal(editor.getSnapshot().phase, 'unavailable')
  assert.equal(editor.getSnapshot().snapshot, null)
  assert.equal(editor.getSnapshot().notice, null)
})

test('all four actions require separate commit confirmation and matching readback', async () => {
  let snapshot = fixtureRead(), command!: CmsCommand, uuid = 0
  let confirmation = deferred<CmsPortResult>()
  const calls: CmsCommand[] = []
  const port: CmsPort = {
    async read() { return ok(snapshot) },
    async command(value) { calls.push(value); command = value
      if (value.action === 'save_draft') snapshot = fixtureRead({ draft: '1' })
      if (value.action === 'publish') snapshot = fixtureRead({ version: '2', draft: '1', published: '1' })
      if (value.action === 'archive') snapshot = fixtureRead({ version: '3', draft: '1', archived: true })
      if (value.action === 'restore_draft') snapshot = fixtureRead({ version: '4', draft: '2', revisions: [fixtureRevision('2', { restoredFrom: '1' }), fixtureRevision('1')] })
      return ok(receipt())
    },
    async confirm(id) { assert.equal(id, command.requestId); return confirmation.promise },
  }
  function receipt() { return fixtureReceipt(command, { draft: snapshot.entry.draftRevision!, published: snapshot.entry.publishedRevision,
    archived: snapshot.entry.archived, created: ['save_draft', 'restore_draft'].includes(command.action) ? snapshot.entry.draftRevision : null }) }
  const editor = createCmsEditor(port, CMS_TEST_ENTRY, { uuid: () => `${++uuid}1111111-1111-4111-8111-111111111111` })
  await editor.load(); editor.edit(form())
  for (const [action, notice] of [['save_draft', 'saved'], ['publish', 'published'], ['archive', 'archived'], ['restore_draft', 'restored']] as const) {
    if (action === 'restore_draft') editor.selectRevision('1')
    const pending = editor.send(action); await tick()
    assert.equal(editor.getSnapshot().notice, null, `${action}: command acknowledgement is not success`)
    assert.equal(editor.getSnapshot().phase, 'busy')
    confirmation.resolve(ok(receipt())); await pending
    assert.equal(editor.getSnapshot().notice, notice)
    confirmation = deferred<CmsPortResult>()
  }
  assert.equal(uuid, 4); assert.equal(calls.length, 4)
  assert.equal(editor.getSnapshot().snapshot?.entry.publishedRevision, null)
})

test('unknown outcome retains exact intent and retry never mints another ID', async () => {
  let snapshot = fixtureRead(), last!: CmsCommand, attempts = 0, ids = 0
  const calls: CmsCommand[] = []
  const port: CmsPort = {
    async read() { return ok(snapshot) },
    async command(command) { attempts++; calls.push(command); last = command
      if (attempts === 1) return { ok: false, code: 'timeout' }
      snapshot = fixtureRead({ draft: '1' }); return ok(fixtureReceipt(command, { draft: '1', created: '1' })) },
    async confirm() { return attempts === 1 ? ok({ schema: 1, status: 'unknown', requestId: last.requestId }) : ok(fixtureReceipt(last, { draft: '1', created: '1' })) },
  }
  const editor = createCmsEditor(port, CMS_TEST_ENTRY, { uuid: () => { ids++; return CMS_TEST_ID } })
  await editor.load(); editor.edit(form()); await editor.send('save_draft'); await editor.reconcile()
  assert.equal(editor.getSnapshot().phase, 'unconfirmed'); assert.equal(editor.getSnapshot().notice, null)
  await editor.load(CMS_TEST_OTHER); editor.edit({ ...form(), idea: 'Changed while uncertain' }); await editor.send('save_draft')
  assert.equal(editor.getSnapshot().entryId, CMS_TEST_ENTRY)
  assert.equal(editor.getSnapshot().form.idea, CMS_TEST_COPY.idea)
  await editor.retry()
  assert.equal(ids, 1); assert.equal(calls[0], calls[1]); assert.ok(Object.isFrozen(calls[0].payload))
  assert.equal(editor.getSnapshot().notice, 'saved')
})

test('a UI deadline cannot unlock a still-running write or turn a late ACK into success', async () => {
  const transport = deferred<CmsPortResult>(); let command!: CmsCommand, writes = 0
  const port: CmsPort = { async read() { return ok(fixtureRead()) },
    async command(value) { command = value; writes++; return transport.promise }, async confirm() { return ok({ schema: 1, status: 'unknown', requestId: command.requestId }) } }
  const editor = createCmsEditor(port, CMS_TEST_ENTRY, { uuid: () => CMS_TEST_ID, timeoutMs: 5 })
  await editor.load(); editor.edit(form()); await editor.send('save_draft')
  assert.equal(editor.getSnapshot().phase, 'unconfirmed'); assert.equal(editor.getSnapshot().pending?.transportOpen, true)
  await editor.retry(); assert.equal(writes, 1)
  transport.resolve(ok(fixtureReceipt(command, { draft: '1', created: '1' }))); await tick()
  assert.equal(editor.getSnapshot().pending?.transportOpen, false); assert.equal(editor.getSnapshot().notice, null)
})

test('CAS preserves unsaved text and requires explicit discard before loading newer state', async () => {
  let reads = 0
  const port: CmsPort = { async read() { reads++; return ok(fixtureRead()) }, async command() { return { ok: false, code: 'conflict' } }, async confirm() { throw new Error('unexpected confirm') } }
  const editor = createCmsEditor(port, CMS_TEST_ENTRY, { uuid: () => CMS_TEST_ID })
  await editor.load(); editor.edit(form()); await editor.send('save_draft'); await editor.load()
  assert.equal(editor.getSnapshot().phase, 'conflict'); assert.equal(editor.getSnapshot().form.idea, CMS_TEST_COPY.idea); assert.equal(reads, 1)
  await editor.discardAndReload(); assert.equal(reads, 2); assert.equal(editor.getSnapshot().dirty, false)
})

test('late selection responses cannot replace another entry', async () => {
  const first = deferred<CmsPortResult>()
  const port: CmsPort = { async read(query) { return query.entryId === CMS_TEST_ENTRY ? first.promise : ok(fixtureRead({ entryId: CMS_TEST_OTHER })) },
    async command() { throw new Error('unexpected write') }, async confirm() { throw new Error('unexpected confirm') } }
  const editor = createCmsEditor(port, CMS_TEST_ENTRY)
  const pending = editor.load(); await tick(); await editor.load(CMS_TEST_OTHER)
  first.resolve(ok(fixtureRead({ draft: '1' }))); await pending
  assert.equal(editor.getSnapshot().snapshot?.entry.entryId, CMS_TEST_OTHER)
})

test('history cannot append a page from a newer entry version or another selection', async () => {
  const revisions = Array.from({ length: 20 }, (_, index) => fixtureRevision(String(21 - index)))
  const first = fixtureRead({ draft: '21', revisions, before: '2' })
  const page = deferred<CmsPortResult>()
  const port: CmsPort = { async read(query) {
    if (query.entryId === CMS_TEST_OTHER) return ok(fixtureRead({ entryId: CMS_TEST_OTHER }))
    return query.beforeRevision ? page.promise : ok(first)
  }, async command() { throw new Error('unexpected write') }, async confirm() { throw new Error('unexpected confirm') } }
  const editor = createCmsEditor(port, CMS_TEST_ENTRY)
  await editor.load()
  const pending = editor.moreHistory(); await tick()
  page.resolve(ok(fixtureRead({ version: '22', draft: '21', revisions: [fixtureRevision('1')], preview: fixtureRevision('21') })))
  await pending
  assert.equal(editor.getSnapshot().phase, 'conflict')
  assert.equal(editor.getSnapshot().snapshot?.history.length, 20)
  await editor.load(CMS_TEST_OTHER)
  assert.equal(editor.getSnapshot().snapshot?.history.length, 0)
})

test('confirmed earlier operation is distinguished from a later editorial state', async () => {
  let last!: CmsCommand, reads = 0
  const port: CmsPort = { async read() { return ok(++reads === 1 ? fixtureRead() : fixtureRead({ draft: '2' })) },
    async command(value) { last = value; return ok(fixtureReceipt(value, { draft: '1', created: '1' })) },
    async confirm() { return ok(fixtureReceipt(last, { draft: '1', created: '1' })) } }
  const editor = createCmsEditor(port, CMS_TEST_ENTRY, { uuid: () => CMS_TEST_ID })
  await editor.load(); editor.edit(form()); await editor.send('save_draft')
  assert.equal(editor.getSnapshot().notice, 'recorded_changed')
  assert.equal(editor.getSnapshot().snapshot?.entry.version, '2')
})

test('invalid ACK, revoked authority, rate limit and unavailable confirmation never report success', async () => {
  for (const outcome of ['invalid_ack', 'forbidden', 'rate_limit', 'unavailable_confirm'] as const) {
    let last!: CmsCommand
    const port: CmsPort = { async read() { return ok(fixtureRead()) },
      async command(value) { last = value
        if (outcome === 'invalid_ack') return ok({ status: 'success' })
        if (outcome === 'forbidden' || outcome === 'rate_limit') return { ok: false, code: outcome }
        return ok(fixtureReceipt(value, { draft: '1', created: '1' })) },
      async confirm() { assert.ok(last); return { ok: false, code: 'unavailable' } } }
    const editor = createCmsEditor(port, CMS_TEST_ENTRY, { uuid: () => CMS_TEST_ID })
    await editor.load(); editor.edit(form()); await editor.send('save_draft')
    assert.equal(editor.getSnapshot().notice, null, outcome)
    assert.equal(editor.getSnapshot().dirty, true, outcome)
    if (outcome === 'forbidden') {
      assert.equal(editor.getSnapshot().phase, 'unavailable')
      assert.equal(editor.getSnapshot().snapshot, null)
    }
  }
})

test('a rejected retry cannot erase an earlier timeout or unknown outcome, or mint a replacement intent', async () => {
  for (const firstOutcome of ['timeout', 'unknown'] as const) {
    for (const rejection of ['rate_limit', 'forbidden', 'unauthenticated', 'conflict', 'request_conflict'] as const) {
      let command!: CmsCommand, writes = 0, ids = 0, recover = false
      const calls: CmsCommand[] = []
      const port: CmsPort = {
        async read() { return ok(recover ? fixtureRead({ draft: '1' }) : fixtureRead()) },
        async command(value) { command = value; calls.push(value)
          if (++writes > 1) return { ok: false, code: rejection }
          return firstOutcome === 'timeout' ? { ok: false, code: 'timeout' } : ok(fixtureReceipt(value, { draft: '1', created: '1' })) },
        async confirm() { return recover ? ok(fixtureReceipt(command, { draft: '1', created: '1' })) : ok({ schema: 1, status: 'unknown', requestId: command.requestId }) },
      }
      const editor = createCmsEditor(port, CMS_TEST_ENTRY, { uuid: () => { ids++; return CMS_TEST_ID } })
      await editor.load(); editor.edit(form()); await editor.send('save_draft'); await editor.retry()
      assert.equal(editor.getSnapshot().pending?.command, calls[0], `${firstOutcome}/${rejection}`)
      assert.equal(editor.getSnapshot().pending?.uncertainOutcome, true)
      assert.equal(calls[0], calls[1]); assert.equal(ids, 1)
      await editor.discardAndReload(); await editor.load(CMS_TEST_OTHER); await editor.send('save_draft')
      assert.equal(editor.getSnapshot().entryId, CMS_TEST_ENTRY); assert.equal(writes, 2); assert.equal(ids, 1)
      assert.equal(editor.getSnapshot().notice, null)
      if (rejection === 'forbidden' || rejection === 'unauthenticated') {
        assert.equal(editor.getSnapshot().phase, 'unavailable'); assert.equal(editor.getSnapshot().snapshot, null)
      }
      recover = true; await editor.reconcile()
      assert.equal(editor.getSnapshot().notice, 'saved'); assert.equal(editor.getSnapshot().pending, null)
    }
  }
})

test('authority loss closes every read boundary and retains unresolved commit identity until reauthorized', async () => {
  for (const deniedAt of ['history', 'confirm', 'readback'] as const) {
    for (const denial of ['forbidden', 'unauthenticated'] as const) {
      let command!: CmsCommand, reads = 0, writes = 0, restored = false
      const revisions = Array.from({ length: 20 }, (_, index) => fixtureRevision(String(21 - index)))
      const port: CmsPort = {
        async read(query) {
          reads++
          if (deniedAt === 'history') return query.beforeRevision ? { ok: false, code: denial } : ok(fixtureRead({ draft: '21', revisions, before: '2' }))
          if (reads === 1) return ok(fixtureRead())
          return deniedAt === 'readback' && !restored ? { ok: false, code: denial } : ok(fixtureRead({ draft: '1' }))
        },
        async command(value) { writes++; command = value; return ok(fixtureReceipt(value, { draft: '1', created: '1' })) },
        async confirm() { return deniedAt === 'confirm' && !restored ? { ok: false, code: denial } : ok(fixtureReceipt(command, { draft: '1', created: '1' })) },
      }
      const editor = createCmsEditor(port, CMS_TEST_ENTRY, { uuid: () => CMS_TEST_ID })
      await editor.load()
      if (deniedAt === 'history') await editor.moreHistory()
      else { editor.edit(form()); await editor.send('save_draft') }
      assert.equal(editor.getSnapshot().phase, 'unavailable', `${deniedAt}/${denial}`)
      assert.equal(editor.getSnapshot().snapshot, null); assert.equal(editor.selectedRevision(), null)
      const before = writes
      editor.edit(form()); await editor.send('publish'); await editor.send('save_draft'); await editor.retry()
      assert.equal(writes, before, 'Closed authority cannot issue a new write or retry')
      if (deniedAt === 'history') assert.equal(editor.getSnapshot().pending, null)
      else {
        assert.equal(editor.getSnapshot().pending?.command, command)
        assert.equal(editor.getSnapshot().pending?.uncertainOutcome, true)
        restored = true; await editor.reconcile()
        assert.equal(editor.getSnapshot().notice, 'saved'); assert.equal(editor.getSnapshot().pending, null)
      }
    }
  }
})
