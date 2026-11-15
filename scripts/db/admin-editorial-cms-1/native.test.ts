import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { test, type TestContext } from 'node:test'
import { INSPIRATION_ZIELE } from '../../../lib/places/inspiration'
import { OwnedTestLifetime } from '../official-truth-atomic-version-refresh-1/test-lifetime'
import { LocalPgConnection, LocalPgError, pgText } from '../official-truth-integrated-pilot-1/pg-wire'
import {
  CMS_ACTOR, CMS_OTHER_ACTOR, CMS_MISSING_ACTOR, CMS_ENTRIES, CMS_TABLES, CMS_TASK_COMMIT,
  asObject, cmsClaims, cmsCommand, cmsContent, cmsPayload, command, confirm, createCmsFixture,
  identify, published, readEntry, rejectSql, resetActors, snapshot, waitBlocked,
  type CmsCommand, type CmsFixture, type CmsJson,
} from './fixture'

type Scenario = (fixture: CmsFixture, lifetime: OwnedTestLifetime, context: TestContext) => Promise<void>
const scenarios: [string, Scenario][] = []
const scenario = (name: string, body: Scenario) => { scenarios.push([name, body]) }

function objects(value: unknown): CmsJson[] {
  assert.ok(Array.isArray(value))
  return value.map(asObject)
}

function timestamp(value: unknown): void {
  assert.equal(typeof value, 'string')
  assert.match(value as string, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/)
  assert.ok(Number.isFinite(Date.parse(value as string)))
  assert.equal(new Date(Date.parse(value as string)).toISOString(), (value as string).slice(0, 23) + 'Z')
}

function receipt(value: CmsJson, input: CmsCommand, expected: CmsJson = {}): void {
  assert.deepEqual(Object.keys(value).sort(), [
    'schema', 'status', 'requestId', 'entryId', 'action', 'beforeVersion', 'version',
    'draftRevision', 'publishedRevision', 'archived', 'createdRevision', 'recordedAt',
  ].sort())
  assert.equal(value.schema, 1)
  assert.equal(value.status, 'recorded')
  assert.equal(value.requestId, input.requestId)
  assert.equal(value.entryId, input.entryId)
  assert.equal(value.action, input.action)
  assert.equal(value.beforeVersion, input.expectedVersion)
  assert.equal(value.version, String(BigInt(input.expectedVersion) + 1n))
  for (const field of ['beforeVersion', 'version', 'draftRevision', 'publishedRevision', 'createdRevision']) {
    if (value[field] === null) assert.ok(['draftRevision', 'publishedRevision', 'createdRevision'].includes(field))
    else { assert.equal(typeof value[field], 'string'); assert.match(value[field] as string, /^(0|[1-9][0-9]*)$/) }
  }
  assert.equal(typeof value.archived, 'boolean')
  timestamp(value.recordedAt)
  for (const [key, expectedValue] of Object.entries(expected)) assert.deepEqual(value[key], expectedValue, key)
}

function pending<T>(promise: Promise<T>) {
  let finished = false
  const outcome: Promise<PromiseSettledResult<T>> = promise.then(
    value => { finished = true; return { status: 'fulfilled', value } },
    reason => { finished = true; return { status: 'rejected', reason } },
  )
  return { outcome, waiting: () => !finished }
}

function rejected(outcome: PromiseSettledResult<unknown>, code: string): void {
  assert.equal(outcome.status, 'rejected')
  if (outcome.status !== 'rejected') assert.fail('unexpected successful database operation')
  assert.ok(outcome.reason instanceof LocalPgError)
  assert.equal(outcome.reason.code, code)
}

type LedgerInsert = {
  requestId: string; actorId: string; entryId: string; beforeVersion: string; afterVersion: string
  request: unknown; result: unknown; createdAt: string
}

/** A direct-owner INSERT probe is never a writer available to the application.
 * Its valid baseline is derived from an actual command result and is always
 * rolled back. It isolates table CHECKs from the public command validator. */
function nextLedgerRow(recorded: CmsJson, entryId: string = CMS_ENTRIES[0]!): LedgerInsert {
  const requestId = randomUUID()
  return { requestId, actorId: CMS_ACTOR, entryId, beforeVersion: '1', afterVersion: '2',
    createdAt: String(recorded.recordedAt),
    request: { schema: 1, requestId, actorId: CMS_ACTOR, entryId,
      expectedVersion: '1', action: 'save_draft', payload: cmsPayload() },
    result: { ...recorded, requestId, entryId, beforeVersion: '1', version: '2',
      action: 'save_draft', draftRevision: '2', publishedRevision: null, archived: false, createdRevision: '2' },
  }
}

function insertLedger(connection: LocalPgConnection, row: LedgerInsert) {
  return connection.query(`INSERT INTO jetnity_cms_private.inspiration_operations_v1
    (request_id,actor_id,entry_id,request,result,before_version,after_version,created_at)
    VALUES($1::uuid,$2::uuid,$3::text,$4::jsonb,$5::jsonb,$6::bigint,$7::bigint,$8::timestamptz)`, [
    pgText(row.requestId, 2950), pgText(row.actorId, 2950), pgText(row.entryId),
    pgText(JSON.stringify(row.request), 3802), pgText(JSON.stringify(row.result), 3802),
    pgText(row.beforeVersion, 20), pgText(row.afterVersion, 20), pgText(row.createdAt, 1184),
  ])
}

async function withFixture(context: TestContext, body: Scenario): Promise<void> {
  const lifetime = new OwnedTestLifetime(context.signal)
  lifetime.installConnectOwnership()
  let fixture: CmsFixture | undefined
  let failure: unknown
  let failed = false
  try {
    fixture = await createCmsFixture(lifetime)
    context.diagnostic(JSON.stringify({ schema: 'jetnity.cms.native.v1', taskCommit: CMS_TASK_COMMIT,
      postgres: fixture.cluster.version, sources: fixture.sources, fixtureAuth: true,
      hostedAuthVerified: false, hostedCmsActivated: false }))
    await body(fixture, lifetime, context)
  } catch (error) { failed = true; failure = error }
  try {
    const cleanup = await lifetime.dispose()
    assert.equal(cleanup.pending, 0)
    assert.equal(cleanup.started, cleanup.settled)
    assert.equal(cleanup.connections, cleanup.closed)
    if (fixture) {
      assert.equal(cleanup.stoppedClusters, 1)
      assert.equal(existsSync(fixture.cluster.root), false)
    }
    context.diagnostic(JSON.stringify({ schema: 'jetnity.cms.native.cleanup.v1', ...cleanup }))
  } catch (error) {
    failure = failed ? new AggregateError([failure, error], 'CMS assertion and cleanup both failed') : error
    failed = true
  }
  if (failed) throw failure
}

scenario('actual PG17, committed installation, exact empty references and least-privilege boundaries', async (f) => {
  const version = (await f.owner.query('SHOW server_version_num'))[0]?.server_version_num
  assert.match(version ?? '', /^17\d{4}$/)
  const identities = await f.owner.query('SELECT entry_id,locale,name,country,image,sort_order::text,state_version::text,draft_revision::text,published_revision::text,published_at::text,archived::text,last_request_id::text FROM jetnity_cms_private.inspiration_entries_v1 ORDER BY sort_order')
  assert.deepEqual(identities, INSPIRATION_ZIELE.map((entry, index) => ({
    entry_id: entry.placeId, locale: 'de', name: entry.name, country: entry.country, image: entry.image,
    sort_order: String(index + 1), state_version: '0', draft_revision: null, published_revision: null,
    published_at: null, archived: 'false', last_request_id: null,
  })))
  const tables = await f.owner.query("SELECT c.relname,c.relrowsecurity::text,c.relforcerowsecurity::text,r.rolname AS owner FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_roles r ON r.oid=c.relowner WHERE n.nspname='jetnity_cms_private' AND c.relkind='r' ORDER BY c.relname")
  assert.deepEqual(tables, [...CMS_TABLES].sort().map(relname => ({ relname, relrowsecurity: 'true', relforcerowsecurity: 'true', owner: 'postgres' })))
  const functions = await f.owner.query("SELECT p.proname,p.prosecdef::text,r.rolname AS owner,p.proconfig::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_roles r ON r.oid=p.proowner WHERE n.nspname='public' AND p.proname IN ('admin_cms_inspiration_command_v1','admin_cms_inspiration_read_v1','admin_cms_inspiration_confirm_v1','cms_inspiration_published_v1') ORDER BY p.proname")
  assert.equal(functions.length, 4)
  for (const row of functions) {
    assert.equal(row.prosecdef, 'true'); assert.equal(row.owner, 'postgres')
    assert.match(row.proconfig ?? '', /TimeZone=UTC|timezone=UTC/)
  }
  const paths = await f.owner.query(`SELECT n.nspname || '.' || p.proname AS name,
    (SELECT pg_catalog.substr(setting,13) FROM pg_catalog.unnest(p.proconfig) setting
      WHERE setting LIKE 'search_path=%') AS search_path
    FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='jetnity_cms_private' OR (n.nspname='public' AND p.proname IN
      ('admin_cms_inspiration_command_v1','admin_cms_inspiration_read_v1',
       'admin_cms_inspiration_confirm_v1','cms_inspiration_published_v1'))
    ORDER BY name`)
  assert.equal(paths.length, 18, 'all candidate routines, including private validators and triggers, are inspected')
  for (const row of paths) assert.equal(row.search_path, 'pg_catalog, pg_temp', row.name ?? '')
  for (const role of ['anon', 'authenticated', 'service_role', null] as const) {
    const connection = await f.connect(role)
    for (const table of CMS_TABLES) {
      await rejectSql(() => connection.query(`SELECT * FROM jetnity_cms_private.${table}`), '42501')
      await rejectSql(() => connection.query(`DELETE FROM jetnity_cms_private.${table}`), '42501')
      await rejectSql(() => connection.query(`TRUNCATE jetnity_cms_private.${table}`), '42501')
    }
    await rejectSql(() => connection.query('SELECT jetnity_cms_private.actor_v1()'), '42501')
    await rejectSql(() => connection.query('SET ROLE postgres'), '42501')
    if (role !== 'authenticated') {
      await rejectSql(() => command(connection, cmsCommand()), '42501')
      await rejectSql(() => readEntry(connection), '42501')
      await rejectSql(() => confirm(connection, randomUUID()), '42501')
    }
    if (role === 'anon' || role === 'authenticated') assert.deepEqual(await published(connection), { schema: 1, items: [] })
    else await rejectSql(() => published(connection), '42501')
    connection.close()
  }
  const clientRoles = await f.owner.query("SELECT rolname,rolsuper::text,rolbypassrls::text,rolcreaterole::text FROM pg_roles WHERE rolname IN ('anon','authenticated','cms_native_authenticator') ORDER BY rolname")
  for (const row of clientRoles) assert.deepEqual({ ...row, rolname: '' }, { rolname: '', rolsuper: 'false', rolbypassrls: 'false', rolcreaterole: 'false' })
})

scenario('fresh authenticated first calls ignore controlled temporary uuid/jsonb/text/timestamptz domains', async (f) => {
  const cases = [
    { type: 'uuid', value: CMS_ACTOR, oid: 2950 },
    { type: 'jsonb', value: '{}', oid: 3802 },
    { type: 'text', value: 'probe', oid: 25 },
    { type: 'timestamptz', value: '2026-11-15T00:00:00.000000Z', oid: 1184 },
  ] as const
  for (const [index, probe] of cases.entries()) {
    // connect() only sets the database role and synthetic JWT GUC. This new
    // backend has not parsed or called a candidate/authority routine yet.
    const editor = await f.connect()
    assert.deepEqual(await editor.query('SELECT current_user::pg_catalog.text AS role'), [{ role: 'authenticated' }])
    await editor.query(`CREATE TEMP TABLE cms_native_type_scope(marker pg_catalog.int4);
      CREATE FUNCTION pg_temp.cms_native_type_trap(pg_catalog.text) RETURNS pg_catalog.bool
      LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $$
      BEGIN RAISE EXCEPTION 'synthetic temporary type was evaluated' USING ERRCODE='P7797'; END $$;
      CREATE DOMAIN pg_temp.${probe.type} AS pg_catalog.${probe.type}
      CHECK (pg_temp.cms_native_type_trap(VALUE::pg_catalog.text));`)
    const types = await editor.query(`SELECT
      pg_catalog.to_regtype($1::pg_catalog.text)::pg_catalog.oid::pg_catalog.text AS unqualified,
      pg_catalog.to_regtype($2::pg_catalog.text)::pg_catalog.oid::pg_catalog.text AS temporary,
      pg_catalog.to_regtype($3::pg_catalog.text)::pg_catalog.oid::pg_catalog.text AS builtin`,
    [pgText(probe.type), pgText('pg_temp.' + probe.type), pgText('pg_catalog.' + probe.type)])
    assert.equal(types[0]?.unqualified, types[0]?.temporary, 'the caller actually shadows this type outside the secure routine')
    assert.notEqual(types[0]?.temporary, types[0]?.builtin)
    await rejectSql(() => editor.query(`SELECT $1::pg_temp.${probe.type}`, [pgText(probe.value, probe.oid)]), 'P7797')

    // Actual wrappers use catalog-qualified argument casts. A trap here would
    // therefore identify type resolution inside a candidate, not its test call.
    const request = cmsCommand({ entryId: CMS_ENTRIES[index]!, payload: cmsPayload(index) })
    const saved = await command(editor, request)
    receipt(saved, request, { draftRevision: '1', createdRevision: '1' })
    assert.deepEqual(await confirm(editor, request.requestId), saved)
    assert.deepEqual(asObject((await readEntry(editor, request.entryId)).preview).content, cmsContent(index))
    const publish = cmsCommand({ entryId: request.entryId, expectedVersion: '1', action: 'publish', payload: { revision: '1' } })
    receipt(await command(editor, publish), publish, { publishedRevision: '1', createdRevision: null })
    const item = objects((await published(editor)).items).find(row => row.entryId === request.entryId)
    assert.ok(item)
    assert.deepEqual(item.content, cmsContent(index))
    assert.equal(asObject((await readEntry(editor, request.entryId)).entry).version, '2')
    editor.close()
  }
})

scenario('complete draft, publish, edit, archive and restore lifecycle uses the existing editorial copy', async (f) => {
  const editor = await f.connect(), visitor = await f.connect('anon', {})
  const initial = await readEntry(editor)
  assert.equal(asObject(initial.entry).version, '0')
  assert.equal(initial.preview, null)
  assert.deepEqual(initial.history, [])
  assert.equal(initial.nextBeforeRevision, null)
  let request = cmsCommand()
  receipt(await command(editor, request), request, { draftRevision: '1', publishedRevision: null, createdRevision: '1', archived: false })
  let view = await readEntry(editor)
  const first = asObject(view.preview)
  assert.deepEqual(first.content, cmsContent())
  assert.equal(first.createdBy, CMS_ACTOR)
  assert.equal(first.restoredFromRevision, null)
  timestamp(first.createdAt)
  assert.deepEqual(await published(visitor), { schema: 1, items: [] })
  request = cmsCommand({ expectedVersion: '1', action: 'publish', payload: { revision: '1' } })
  receipt(await command(editor, request), request, { draftRevision: '1', publishedRevision: '1', createdRevision: null })
  const publication = objects((await published(visitor)).items)[0]!
  timestamp(publication.publishedAt)
  assert.deepEqual(publication.content, cmsContent())
  assert.equal(publication.publishedAt, asObject((await readEntry(editor)).entry).publishedAt)
  const edited = { ...cmsPayload(), beschreibung: 'Eine ausdrücklich geänderte redaktionelle Reiseidee.' }
  request = cmsCommand({ expectedVersion: '2', payload: edited })
  receipt(await command(editor, request), request, { draftRevision: '2', publishedRevision: '1', createdRevision: '2' })
  assert.deepEqual(objects((await published(visitor)).items), [publication], 'draft editing must not change the published snapshot or its actual publication time')
  request = cmsCommand({ expectedVersion: '3', action: 'publish', payload: { revision: '2' } })
  receipt(await command(editor, request), request, { publishedRevision: '2', createdRevision: null })
  assert.deepEqual(objects((await published(visitor)).items)[0]!.content, cmsContent(0, edited))
  request = cmsCommand({ expectedVersion: '4', action: 'archive', payload: {} })
  receipt(await command(editor, request), request, { draftRevision: '2', publishedRevision: null, createdRevision: null, archived: true })
  assert.deepEqual(await published(visitor), { schema: 1, items: [] })
  assert.equal(asObject((await readEntry(editor)).entry).publishedAt, null)
  request = cmsCommand({ expectedVersion: '5', action: 'restore_draft', payload: { revision: '1' } })
  receipt(await command(editor, request), request, { draftRevision: '3', publishedRevision: null, createdRevision: '3', archived: false })
  view = await readEntry(editor)
  assert.equal(asObject(view.preview).restoredFromRevision, '1')
  assert.deepEqual(asObject(view.preview).content, first.content)
  assert.deepEqual(objects(view.history).map(row => row.revision), ['3', '2', '1'])
  assert.deepEqual(await published(visitor), { schema: 1, items: [] }, 'restore creates a draft; it does not republish')
  request = cmsCommand({ expectedVersion: '6', action: 'publish', payload: { revision: '3' } })
  receipt(await command(editor, request), request, { publishedRevision: '3', createdRevision: null })
  assert.deepEqual(objects((await published(visitor)).items)[0]!.content, first.content)
  assert.equal(asObject((await readEntry(editor)).entry).version, '7')
})

scenario('global request identity binds actor, entry, action, original CAS and every payload field', async (f) => {
  const editor = await f.connect(), other = await f.connect('authenticated', cmsClaims({ sub: CMS_OTHER_ACTOR }))
  const original = cmsCommand(), first = await command(editor, original)
  await command(editor, cmsCommand({ expectedVersion: '1', payload: { ...cmsPayload(), idea: 'Eine zweite Idee' } }))
  const before = await snapshot(f.owner)
  assert.deepEqual(await command(editor, original), first, 'exact replay precedes the now-stale CAS check')
  assert.deepEqual(await confirm(editor, original.requestId), first)
  assert.deepEqual(await confirm(other, original.requestId), { schema: 1, status: 'unknown', requestId: original.requestId })
  const variants: CmsCommand[] = [
    { ...original, expectedVersion: '1' }, { ...original, entryId: CMS_ENTRIES[1]! },
    { ...original, action: 'archive', payload: {} },
    { ...original, action: 'publish', payload: { revision: '1' } },
    { ...original, payload: { ...cmsPayload(), beschreibung: 'Andere Beschreibung' } },
    { ...original, payload: { ...cmsPayload(), idea: 'Andere Idee' } },
    { ...original, payload: { ...cmsPayload(), themen: ['natur'] } },
  ]
  for (const variant of variants) await rejectSql(() => command(editor, variant), 'P4092')
  await rejectSql(() => command(other, original), 'P4092')
  assert.deepEqual(await snapshot(f.owner), before)
  const binding = (await f.owner.query('SELECT request::text FROM jetnity_cms_private.inspiration_operations_v1 WHERE request_id=$1::uuid', [pgText(original.requestId, 2950)]))[0]?.request
  assert.deepEqual(JSON.parse(binding!), { schema: 1, requestId: original.requestId, actorId: CMS_ACTOR,
    entryId: original.entryId, expectedVersion: '0', action: 'save_draft', payload: original.payload })
})

scenario('two actual same-entry writers serialize and exactly one stale CAS loses', async (f, lifetime) => {
  const winner = await f.connect(), loser = await f.connect('authenticated', cmsClaims({ sub: CMS_OTHER_ACTOR }))
  const held = await identify(f, winner), waiting = await identify(f, loser)
  const first = cmsCommand(), second = cmsCommand({ payload: { ...cmsPayload(), idea: 'Zweiter konkurrierender Entwurf' } })
  await winner.query('BEGIN')
  const accepted = await command(winner, first)
  const job = pending(lifetime.run(() => command(loser, second)))
  await waitBlocked(f, lifetime, waiting, held, job.waiting)
  await winner.query('COMMIT')
  rejected(await job.outcome, 'P4091')
  assert.deepEqual(await confirm(winner, first.requestId), accepted)
  assert.deepEqual(await confirm(loser, second.requestId), { schema: 1, status: 'unknown', requestId: second.requestId })
  const view = await readEntry(winner)
  assert.equal(asObject(view.entry).version, '1')
  assert.deepEqual(asObject(view.preview).content, cmsContent())
  assert.equal(objects(view.history).length, 1)
})

scenario('same-entry concurrent identical replay succeeds once; a different binding loses without mutation', async (f, lifetime) => {
  for (const [index, identical] of [true, false].entries()) {
    const firstClient = await f.connect(), secondClient = await f.connect()
    const holder = await identify(f, firstClient), waiter = await identify(f, secondClient)
    const first = cmsCommand({ entryId: CMS_ENTRIES[index]!, payload: cmsPayload(index) })
    const second = identical ? { ...first } : { ...first, payload: { ...cmsPayload(index), idea: 'Eine andere Bindung' } }
    await firstClient.query('BEGIN')
    const firstReceipt = await command(firstClient, first)
    const job = pending(lifetime.run(() => command(secondClient, second)))
    await waitBlocked(f, lifetime, waiter, holder, job.waiting)
    await firstClient.query('COMMIT')
    const outcome = await job.outcome
    if (identical) {
      assert.equal(outcome.status, 'fulfilled')
      if (outcome.status === 'fulfilled') assert.deepEqual(outcome.value, firstReceipt)
    } else rejected(outcome, 'P4092')
    const view = await readEntry(firstClient, first.entryId)
    assert.equal(asObject(view.entry).version, '1')
    assert.equal(objects(view.history).length, 1)
    const count = (await f.owner.query('SELECT count(*)::text AS n FROM jetnity_cms_private.inspiration_operations_v1 WHERE request_id=$1::uuid', [pgText(first.requestId, 2950)]))[0]?.n
    assert.equal(count, '1')
    firstClient.close(); secondClient.close()
  }
})

scenario('cross-entry same-ID race rolls back the losing entry, revision and deferred receipt pointer', async (f, lifetime) => {
  const a = await f.connect(), b = await f.connect()
  const holder = await identify(f, a), waiter = await identify(f, b)
  const first = cmsCommand(), second = { ...first, entryId: CMS_ENTRIES[1]!, payload: cmsPayload(1) }
  await a.query('BEGIN')
  await command(a, first)
  const job = pending(lifetime.run(() => command(b, second)))
  await waitBlocked(f, lifetime, waiter, holder, job.waiting)
  await a.query('COMMIT')
  rejected(await job.outcome, 'P4092')
  const untouched = await readEntry(a, second.entryId)
  assert.equal(asObject(untouched.entry).version, '0')
  assert.equal(untouched.preview, null)
  assert.deepEqual(untouched.history, [])
  const counts = await f.owner.query('SELECT (SELECT count(*) FROM jetnity_cms_private.inspiration_revisions_v1)::text AS revisions,(SELECT count(*) FROM jetnity_cms_private.inspiration_operations_v1)::text AS operations')
  assert.deepEqual(counts, [{ revisions: '1', operations: '1' }])
})

scenario('publish/save races enforce CAS in both winner orders without publishing a stale draft', async (f, lifetime) => {
  for (const [index, publishWins] of [false, true].entries()) {
    const holderClient = await f.connect(), waitingClient = await f.connect()
    const entryId = CMS_ENTRIES[index]!
    await command(holderClient, cmsCommand({ entryId, payload: cmsPayload(index) }))
    const save = cmsCommand({ entryId, expectedVersion: '1', payload: { ...cmsPayload(index), idea: 'Neuer konkurrierender Entwurf' } })
    const publish = cmsCommand({ entryId, expectedVersion: '1', action: 'publish', payload: { revision: '1' } })
    const holder = await identify(f, holderClient), waiter = await identify(f, waitingClient)
    await holderClient.query('BEGIN')
    await command(holderClient, publishWins ? publish : save)
    const job = pending(lifetime.run(() => command(waitingClient, publishWins ? save : publish)))
    await waitBlocked(f, lifetime, waiter, holder, job.waiting)
    await holderClient.query('COMMIT')
    rejected(await job.outcome, 'P4091')
    const entry = asObject((await readEntry(holderClient, entryId)).entry)
    assert.equal(entry.version, '2')
    assert.equal(entry.draftRevision, publishWins ? '1' : '2')
    assert.equal(entry.publishedRevision, publishWins ? '1' : null)
    holderClient.close(); waitingClient.close()
  }
})

scenario('publish/archive races enforce CAS in both winner orders and archive has no public content', async (f, lifetime) => {
  for (const [index, archiveWins] of [false, true].entries()) {
    const a = await f.connect(), b = await f.connect(), entryId = CMS_ENTRIES[index]!
    await command(a, cmsCommand({ entryId, payload: cmsPayload(index) }))
    const publish = cmsCommand({ entryId, expectedVersion: '1', action: 'publish', payload: { revision: '1' } })
    const archive = cmsCommand({ entryId, expectedVersion: '1', action: 'archive', payload: {} })
    const holder = await identify(f, a), waiter = await identify(f, b)
    await a.query('BEGIN')
    await command(a, archiveWins ? archive : publish)
    const job = pending(lifetime.run(() => command(b, archiveWins ? publish : archive)))
    await waitBlocked(f, lifetime, waiter, holder, job.waiting)
    await a.query('COMMIT')
    rejected(await job.outcome, 'P4091')
    const entry = asObject((await readEntry(a, entryId)).entry)
    assert.equal(entry.version, '2')
    assert.equal(entry.archived, archiveWins)
    assert.equal(entry.publishedRevision, archiveWins ? null : '1')
    const publicIds = objects((await published(b)).items).map(item => item.entryId)
    assert.equal(publicIds.includes(entryId), !archiveWins)
    a.close(); b.close()
  }
})

scenario('discarded committed response is recovered exactly; a genuinely terminated pre-commit backend leaves no operation', async (f, lifetime) => {
  const lostResponseRequest = cmsCommand()
  const first = await f.connect()
  await first.query('BEGIN')
  await command(first, lostResponseRequest) // Deliberately discard the application result.
  await first.query('COMMIT')
  first.close()
  const reconnect = await f.connect()
  const durable = await confirm(reconnect, lostResponseRequest.requestId)
  receipt(durable, lostResponseRequest, { version: '1', createdRevision: '1' })
  const beforeReplay = await snapshot(f.owner)
  assert.deepEqual(await command(reconnect, lostResponseRequest), durable)
  assert.deepEqual(await snapshot(f.owner), beforeReplay)

  const abandoned = await f.connect(), identity = await identify(f, abandoned)
  const uncommitted = cmsCommand({ entryId: CMS_ENTRIES[1]!, payload: cmsPayload(1) })
  await abandoned.query('BEGIN')
  await command(abandoned, uncommitted)
  const terminated = await f.owner.query('SELECT pg_terminate_backend(pid,1000)::text AS terminated FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz', [pgText(identity.pid, 23), pgText(identity.birth)])
  assert.deepEqual(terminated, [{ terminated: 'true' }])
  abandoned.close()
  const until = performance.now() + 3_000
  let absent = false
  while (performance.now() < until) {
    absent = (await f.owner.query('SELECT count(*)::text AS n FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz', [pgText(identity.pid, 23), pgText(identity.birth)]))[0]?.n === '0'
    if (absent) break
    await lifetime.wait(15)
  }
  assert.equal(absent, true)
  assert.deepEqual(await snapshot(f.owner), beforeReplay)
  assert.deepEqual(await confirm(reconnect, uncommitted.requestId), { schema: 1, status: 'unknown', requestId: uncommitted.requestId })
  receipt(await command(reconnect, uncommitted), uncommitted, { createdRevision: '1' })
})

scenario('actual connection termination while blocked cannot become a delayed write after the lock is released', async (f, lifetime) => {
  const holder = await LocalPgConnection.connect(f.cluster), waiter = await f.connect()
  const heldIdentity = await identify(f, holder), waitingIdentity = await identify(f, waiter)
  const request = cmsCommand(), before = await snapshot(f.owner)
  await holder.query('BEGIN')
  await holder.query('SELECT entry_id FROM jetnity_cms_private.inspiration_entries_v1 WHERE entry_id=$1::text FOR UPDATE', [pgText(request.entryId)])
  const job = pending(lifetime.run(() => command(waiter, request)))
  await waitBlocked(f, lifetime, waitingIdentity, heldIdentity, job.waiting)
  const result = await f.owner.query('SELECT pg_terminate_backend(pid,1000)::text AS terminated FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz', [pgText(waitingIdentity.pid, 23), pgText(waitingIdentity.birth)])
  assert.deepEqual(result, [{ terminated: 'true' }])
  const outcome = await job.outcome
  assert.equal(outcome.status, 'rejected')
  if (outcome.status === 'rejected') {
    assert.ok(outcome.reason instanceof LocalPgError)
    assert.ok(['57P01', 'connection_closed', 'connection_state'].includes(outcome.reason.code))
  }
  await holder.query('COMMIT')
  assert.deepEqual(await snapshot(f.owner), before)
  assert.deepEqual(await confirm(await f.connect(), request.requestId), { schema: 1, status: 'unknown', requestId: request.requestId })
})

scenario('only real persisted moderator/operator/admin/owner capability with AAL2 authorizes a write', async (f) => {
  for (const [index, role] of ['moderator', 'operator', 'admin', 'owner'].entries()) {
    await f.owner.query('UPDATE public.profiles SET role=$1::text WHERE user_id=$2::uuid', [pgText(role), pgText(CMS_ACTOR, 2950)])
    const connection = await f.connect()
    const request = cmsCommand({ entryId: CMS_ENTRIES[index]!, payload: cmsPayload(index) })
    receipt(await command(connection, request), request)
    connection.close()
  }
})

scenario('role, AAL, inactive status, missing/deleted/anonymous account and forged metadata all deny every Admin entry point', async (f) => {
  const cases: { name: string; setup?: string; claims?: CmsJson }[] = [
    { name: 'user', setup: "UPDATE public.profiles SET role='user'" },
    { name: 'creator', setup: "UPDATE public.profiles SET role='creator'" },
    { name: 'unknown role', setup: "UPDATE public.profiles SET role='unknown'" },
    ...['pending', 'disabled', 'banned', 'unknown'].map(status => ({ name: status, setup: `UPDATE public.profiles SET status='${status}'` })),
    { name: 'missing profile', setup: 'DELETE FROM public.profiles' },
    { name: 'deleted Auth row', setup: 'UPDATE auth.users SET deleted_at=clock_timestamp()' },
    { name: 'anonymous Auth row', setup: 'UPDATE auth.users SET is_anonymous=true' },
    { name: 'absent Auth account', setup: 'DELETE FROM auth.users' },
    { name: 'unknown subject', claims: cmsClaims({ sub: CMS_MISSING_ACTOR }) },
    { name: 'missing subject', claims: cmsClaims({ sub: null }) },
    { name: 'malformed subject', claims: cmsClaims({ sub: 'not-a-uuid' }) },
    ...['aal1', 'aal3', '', null, true, ['aal2']].map(aal => ({ name: `invalid AAL ${JSON.stringify(aal)}`, claims: cmsClaims({ aal }) })),
    { name: 'user metadata is not authority', setup: "UPDATE public.profiles SET role='user'", claims: cmsClaims({ user_metadata: { role: 'owner', aal: 'aal2', status: 'active' } }) },
    { name: 'metadata AAL is not current AAL', claims: cmsClaims({ aal: 'aal1', user_metadata: { aal: 'aal2' } }) },
  ]
  const before = await snapshot(f.owner)
  for (const item of cases) {
    await resetActors(f.owner)
    if (item.setup) await f.owner.query(item.setup + ` WHERE ${item.setup.includes('auth.users') ? 'id' : 'user_id'}='${CMS_ACTOR}'`)
    const connection = await f.connect('authenticated', item.claims ?? cmsClaims())
    await rejectSql(() => command(connection, cmsCommand()), '42501')
    // These values are legal SQL parameter types but invalid CMS input. The
    // caller must be denied before any payload/state classification is exposed.
    await rejectSql(() => command(connection, cmsCommand({ payload: {} })), '42501')
    await rejectSql(() => command(connection, cmsCommand({ action: 'publish', payload: { revision: 1 } })), '42501')
    await rejectSql(() => command(connection, cmsCommand({ requestId: '00000000-0000-0000-0000-000000000000', entryId: 'unknown', expectedVersion: '-1', action: 'unknown', payload: null })), '42501')
    await rejectSql(() => readEntry(connection), '42501')
    await rejectSql(() => readEntry(connection, 'unknown', '0', '0', 0), '42501')
    await rejectSql(() => confirm(connection, randomUUID()), '42501')
    await rejectSql(() => confirm(connection, '00000000-0000-0000-0000-000000000000'), '42501')
    assert.deepEqual(await snapshot(f.owner), before, item.name)
    connection.close()
  }
})

scenario('replay and confirmation recheck current authority instead of using historical success as a grant', async (f) => {
  const editor = await f.connect(), request = cmsCommand()
  await command(editor, request)
  const before = await snapshot(f.owner)
  await f.owner.query("UPDATE public.profiles SET status='disabled' WHERE user_id=$1::uuid", [pgText(CMS_ACTOR, 2950)])
  await rejectSql(() => command(editor, request), '42501')
  await rejectSql(() => confirm(editor, request.requestId), '42501')
  await rejectSql(() => readEntry(editor), '42501')
  assert.deepEqual(await snapshot(f.owner), before)
  const other = await f.connect('authenticated', cmsClaims({ sub: CMS_OTHER_ACTOR }))
  assert.deepEqual(await confirm(other, request.requestId), { schema: 1, status: 'unknown', requestId: request.requestId })
})

scenario('role/status/account revocation during a proved entry-lock wait denies before any mutation', async (f, lifetime) => {
  const changes = [
    "UPDATE public.profiles SET role='user' WHERE user_id=$1::uuid",
    "UPDATE public.profiles SET status='disabled' WHERE user_id=$1::uuid",
    'UPDATE auth.users SET is_anonymous=true WHERE id=$1::uuid',
    'UPDATE auth.users SET deleted_at=clock_timestamp() WHERE id=$1::uuid',
    'DELETE FROM public.profiles WHERE user_id=$1::uuid',
    'DELETE FROM auth.users WHERE id=$1::uuid',
  ]
  for (const change of changes) {
    await resetActors(f.owner)
    const holder = await LocalPgConnection.connect(f.cluster), caller = await f.connect()
    const held = await identify(f, holder), waiting = await identify(f, caller)
    const request = cmsCommand(), before = await snapshot(f.owner)
    await holder.query('BEGIN')
    await holder.query('SELECT entry_id FROM jetnity_cms_private.inspiration_entries_v1 WHERE entry_id=$1::text FOR UPDATE', [pgText(request.entryId)])
    const job = pending(lifetime.run(() => command(caller, request)))
    await waitBlocked(f, lifetime, waiting, held, job.waiting)
    await f.owner.query(change, [pgText(CMS_ACTOR, 2950)])
    assert.equal(job.waiting(), true)
    await holder.query('COMMIT')
    rejected(await job.outcome, '42501')
    assert.deepEqual(await snapshot(f.owner), before, change)
    holder.close(); caller.close()
  }
})

scenario('strict editable payload, scalar/UTF-8 bounds, action and revision validation never silently normalize', async (f) => {
  const editor = await f.connect(), before = await snapshot(f.owner), original = cmsPayload()
  const invalidPayloads: unknown[] = [
    null, [], {}, { ...original, unknown: 'field' }, { ...original, role: 'owner' },
    ...['entryId', 'locale', 'name', 'country', 'image', 'createdBy', 'createdAt'].map(key => ({ ...original, [key]: 'caller-controlled' })),
    ...['', ' ', ' leading', 'trailing ', '\u00a0leading', 'trailing\u2003', '\uFEFF', '<b>text</b>', 'line\nbreak', 'tab\there', '\u007f', '\u0085', 'x'.repeat(801), '😀'.repeat(801)].map(beschreibung => ({ ...original, beschreibung })),
    ...['', ' ', '<tag>', 'x'.repeat(301), '😀'.repeat(301)].map(idea => ({ ...original, idea })),
    { ...original, beschreibung: 4 }, { ...original, idea: false },
    ...[[], ['alle'], ['unknown'], ['natur', 'natur'], ['strand', 'natur'], ['natur', 1], ['stadt-kultur', 'natur', 'strand', 'erholung', 'natur'], 'natur', null].map(themen => ({ ...original, themen })),
  ]
  for (const payload of invalidPayloads) await rejectSql(() => command(editor, cmsCommand({ payload })), '22023')
  // PostgreSQL rejects these Unicode values while parsing the jsonb parameter,
  // before the command's own payload validator can run.
  for (const beschreibung of ['nul\u0000value', '\ud800', '\udfff']) {
    await assert.rejects(() => command(editor, cmsCommand({ payload: { ...original, beschreibung } })),
      (error: unknown) => error instanceof LocalPgError && ['22P02', '22P05'].includes(error.code))
  }
  for (const requestId of ['00000000-0000-0000-0000-000000000000', '11111111-1111-1111-8111-111111111111', '11111111-1111-4111-7111-111111111111']) {
    await rejectSql(() => command(editor, cmsCommand({ requestId })), '22023')
  }
  await rejectSql(() => command(editor, cmsCommand({ entryId: 'geonames:999999999' })), '22023')
  await rejectSql(() => command(editor, cmsCommand({ expectedVersion: '-1' })), '22023')
  await rejectSql(() => command(editor, cmsCommand({ expectedVersion: '9223372036854775808' })), '22003')
  for (const action of ['', 'SAVE_DRAFT', 'delete', 'unknown']) await rejectSql(() => command(editor, cmsCommand({ action })), '22023')
  for (const payload of [{}, { revision: 1 }, { revision: '0' }, { revision: '01' }, { revision: '-1' }, { revision: '9223372036854775808' }, { revision: '1', actorId: CMS_ACTOR }]) {
    await rejectSql(() => command(editor, cmsCommand({ action: 'publish', payload })), '22023')
  }
  await rejectSql(() => command(editor, cmsCommand({ action: 'archive', payload: { revision: '1' } })), '22023')
  assert.deepEqual(await snapshot(f.owner), before)
  const boundary = cmsCommand({ payload: { beschreibung: '😀'.repeat(800), idea: '😀'.repeat(300), themen: ['stadt-kultur', 'natur', 'strand', 'erholung'] } })
  receipt(await command(editor, boundary), boundary)
  assert.deepEqual(asObject((await readEntry(editor)).preview).content, cmsContent(0, asObject(boundary.payload)))
})

scenario('illegal/no-op transitions and foreign selected revisions fail without altering history', async (f) => {
  const editor = await f.connect()
  await rejectSql(() => command(editor, cmsCommand({ action: 'publish', payload: { revision: '1' } })), 'P4093')
  await rejectSql(() => command(editor, cmsCommand({ action: 'archive', payload: {} })), 'P4093')
  await command(editor, cmsCommand())
  await command(editor, cmsCommand({ expectedVersion: '1', payload: { ...cmsPayload(), idea: 'Zweite Version' } }))
  await command(editor, cmsCommand({ expectedVersion: '2', action: 'publish', payload: { revision: '2' } }))
  let before = await snapshot(f.owner)
  await rejectSql(() => command(editor, cmsCommand({ expectedVersion: '3', action: 'publish', payload: { revision: '2' } })), 'P4093')
  await rejectSql(() => command(editor, cmsCommand({ expectedVersion: '3', action: 'publish', payload: { revision: '1' } })), 'P4093')
  await rejectSql(() => command(editor, cmsCommand({ expectedVersion: '3', action: 'restore_draft', payload: { revision: '99' } })), 'P4041')
  await rejectSql(() => readEntry(editor, CMS_ENTRIES[1]!, '2'), 'P4041')
  await rejectSql(() => command(editor, cmsCommand({ entryId: CMS_ENTRIES[1]!, action: 'restore_draft', payload: { revision: '2' } })), 'P4041')
  assert.deepEqual(await snapshot(f.owner), before)
  await command(editor, cmsCommand({ expectedVersion: '3', action: 'archive', payload: {} }))
  before = await snapshot(f.owner)
  await rejectSql(() => command(editor, cmsCommand({ expectedVersion: '4', payload: cmsPayload() })), 'P4093')
  await rejectSql(() => command(editor, cmsCommand({ expectedVersion: '4', action: 'archive', payload: {} })), 'P4093')
  await rejectSql(() => command(editor, cmsCommand({ expectedVersion: '4', action: 'publish', payload: { revision: '2' } })), 'P4093')
  assert.deepEqual(await snapshot(f.owner), before)
})

scenario('history is immutable even to the installation owner, and a failure after the final entry update rolls back atomically', async (f) => {
  const editor = await f.connect()
  await command(editor, cmsCommand())
  const before = await snapshot(f.owner)
  for (const table of CMS_TABLES) {
    await rejectSql(() => f.owner.query(`DELETE FROM jetnity_cms_private.${table}`), '55000')
    await rejectSql(() => f.owner.query(`TRUNCATE jetnity_cms_private.${table} CASCADE`), '55000')
  }
  await rejectSql(() => f.owner.query("UPDATE jetnity_cms_private.inspiration_entries_v1 SET name='changed'"), '55000')
  await rejectSql(() => f.owner.query('UPDATE jetnity_cms_private.inspiration_entries_v1 SET state_version=state_version'), '55000')
  await rejectSql(() => f.owner.query('UPDATE jetnity_cms_private.inspiration_revisions_v1 SET content=content'), '55000')
  await rejectSql(() => f.owner.query('UPDATE jetnity_cms_private.inspiration_operations_v1 SET result=result'), '55000')
  assert.deepEqual(await snapshot(f.owner), before)
  // The receipt is inserted before the final entry UPDATE so immediate FKs
  // work. Fault after that UPDATE, and verify its revision and receipt already
  // exist inside the transaction before demanding full rollback of all three.
  await f.owner.query(`CREATE FUNCTION public.cms_native_final_update_failure() RETURNS pg_catalog.trigger
    LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM jetnity_cms_private.inspiration_revisions_v1
        WHERE entry_id=NEW.entry_id AND revision=NEW.draft_revision)
        OR NOT EXISTS (SELECT 1 FROM jetnity_cms_private.inspiration_operations_v1
        WHERE entry_id=NEW.entry_id AND request_id=NEW.last_request_id AND after_version=NEW.state_version) THEN
        RAISE EXCEPTION 'synthetic final boundary did not contain all writes' USING ERRCODE='P7799';
      END IF;
      RAISE EXCEPTION 'synthetic final entry update failure' USING ERRCODE='P7798';
    END $$;
    CREATE TRIGGER cms_native_final_update_failure AFTER UPDATE ON jetnity_cms_private.inspiration_entries_v1
    FOR EACH ROW EXECUTE FUNCTION public.cms_native_final_update_failure();`)
  const rejectedRequest = cmsCommand({ expectedVersion: '1' })
  await rejectSql(() => command(editor, rejectedRequest), 'P7798')
  assert.deepEqual(await snapshot(f.owner), before)
  assert.deepEqual(await confirm(editor, rejectedRequest.requestId), { schema: 1, status: 'unknown', requestId: rejectedRequest.requestId })
  await f.owner.query('DROP TRIGGER cms_native_final_update_failure ON jetnity_cms_private.inspiration_entries_v1; DROP FUNCTION public.cms_native_final_update_failure();')
  receipt(await command(editor, rejectedRequest), rejectedRequest)
})

scenario('explicit transaction rollback removes the receipt, revision and state together', async (f) => {
  const editor = await f.connect(), request = cmsCommand(), before = await snapshot(f.owner)
  await editor.query('BEGIN')
  receipt(await command(editor, request), request)
  assert.deepEqual(await snapshot(f.owner), before, 'uncommitted state is not visible from an independent backend')
  await editor.query('ROLLBACK')
  assert.deepEqual(await snapshot(f.owner), before)
  assert.deepEqual(await confirm(editor, request.requestId), { schema: 1, status: 'unknown', requestId: request.requestId })
  receipt(await command(editor, request), request)
})

scenario('every action commits with all cross-table constraints set to immediate', async (f) => {
  const editor = await f.connect()
  await editor.query('BEGIN; SET CONSTRAINTS ALL IMMEDIATE')
  const actions = [
    cmsCommand(),
    cmsCommand({ expectedVersion: '1', action: 'publish', payload: { revision: '1' } }),
    cmsCommand({ expectedVersion: '2', payload: { ...cmsPayload(), idea: 'Neuer Entwurf unter sofortigen Fremdschlüsseln' } }),
    cmsCommand({ expectedVersion: '3', action: 'restore_draft', payload: { revision: '1' } }),
    cmsCommand({ expectedVersion: '4', action: 'archive', payload: {} }),
  ]
  const results: CmsJson[] = []
  for (const input of actions) {
    const result = await command(editor, input)
    receipt(result, input)
    results.push(result)
  }
  assert.equal((await f.owner.query('SELECT state_version::text FROM jetnity_cms_private.inspiration_entries_v1 WHERE entry_id=$1::text', [pgText(CMS_ENTRIES[0]!)]))[0]?.state_version, '0')
  await editor.query('COMMIT')
  const view = await readEntry(editor)
  assert.equal(asObject(view.entry).version, '5')
  assert.equal(asObject(view.entry).archived, true)
  assert.equal(asObject(view.entry).publishedAt, null)
  assert.deepEqual(objects(view.history).map(item => item.revision), ['3', '2', '1'])
  assert.deepEqual(asObject(view.preview).content, cmsContent())
  assert.deepEqual(await published(await f.connect('anon', {})), { schema: 1, items: [] })
  for (const [index, input] of actions.entries()) assert.deepEqual(await confirm(editor, input.requestId), results[index])
})

scenario('direct owner inserts reject every malformed request or receipt and leave no ledger row', async (f, _lifetime, context) => {
  const editor = await f.connect(), first = await command(editor, cmsCommand())
  const template = nextLedgerRow(first), before = await snapshot(f.owner)
  const writer = await LocalPgConnection.connect(f.cluster)
  await writer.query('SET ROLE postgres')
  const forAction = (action: string) => {
    const row = structuredClone(template), request = asObject(row.request), result = asObject(row.result)
    request.action = result.action = action
    if (action === 'publish' || action === 'restore_draft') request.payload = { revision: action === 'publish' ? '2' : '1' }
    if (action === 'publish') { result.publishedRevision = '2'; result.createdRevision = null }
    if (action === 'archive') { request.payload = {}; result.archived = true; result.createdRevision = null }
    return row
  }
  // A passing baseline prevents an unrelated privilege or setup error from
  // making all negative CHECK cases look successful.
  for (const action of ['save_draft', 'publish', 'archive', 'restore_draft']) {
    await writer.query('BEGIN')
    try {
      await insertLedger(writer, forAction(action))
      assert.equal((await writer.query('SELECT count(*)::text AS n FROM jetnity_cms_private.inspiration_operations_v1 WHERE request_id=$1::uuid', [pgText(template.requestId, 2950)]))[0]?.n, '1')
    } finally { await writer.query('ROLLBACK') }
  }
  type Vector = { name: string; action?: string; change: (row: LedgerInsert) => void }
  const vectors: Vector[] = []
  const change = (name: string, mutate: Vector['change'], action?: string) => vectors.push({ name, change: mutate, action })
  for (const field of ['request', 'result'] as const) {
    for (const invalid of [null, [], 'not an object']) change(`${field}: non-object ${JSON.stringify(invalid)}`, row => { row[field] = invalid })
    for (const key of Object.keys(asObject(template[field]))) {
      change(`${field}: missing ${key}`, row => { delete asObject(row[field])[key] })
    }
    change(`${field}: unknown key`, row => { asObject(row[field]).unexpected = true })
    change(`${field}: string schema`, row => { asObject(row[field]).schema = '1' })
    change(`${field}: unsupported schema`, row => { asObject(row[field]).schema = 2 })
  }
  for (const key of ['action', 'actorId', 'entryId', 'expectedVersion', 'requestId']) {
    change(`request: numeric ${key}`, row => { asObject(row.request)[key] = 1 })
  }
  for (const [key, value] of Object.entries({ requestId: randomUUID(), actorId: CMS_OTHER_ACTOR,
    entryId: CMS_ENTRIES[1], expectedVersion: '0', action: 'unknown', payload: {} })) {
    change(`request: wrong ${key} binding`, row => { asObject(row.request)[key] = value })
  }
  change('request: extra editable payload key', row => { asObject(asObject(row.request).payload).unexpected = true })
  change('request: noncanonical expected version', row => { asObject(row.request).expectedVersion = '01' })
  for (const key of ['action', 'beforeVersion', 'entryId', 'recordedAt', 'requestId', 'status', 'version']) {
    change(`result: numeric ${key}`, row => { asObject(row.result)[key] = 1 })
  }
  for (const [key, value] of Object.entries({ requestId: randomUUID(), entryId: CMS_ENTRIES[1],
    beforeVersion: '0', version: '3', status: 'unknown', action: 'publish', recordedAt: '2000-01-01T00:00:00.000000Z' })) {
    change(`result: wrong ${key} binding`, row => { asObject(row.result)[key] = value })
  }
  for (const key of ['draftRevision', 'publishedRevision', 'createdRevision']) {
    for (const value of [2, '0', '02', '9223372036854775808']) {
      change(`result: invalid ${key} ${JSON.stringify(value)}`, row => { asObject(row.result)[key] = value })
    }
  }
  change('result: absent draft represented by JSON null', row => { asObject(row.result).draftRevision = null })
  change('result: draft greater than state version', row => { asObject(row.result).draftRevision = '3'; asObject(row.result).createdRevision = '3' })
  change('result: publication greater than draft', row => { asObject(row.result).publishedRevision = '3' })
  for (const value of [null, 'false', 0]) change(`result: nonboolean archived ${JSON.stringify(value)}`, row => { asObject(row.result).archived = value })
  change('column: actor differs from request', row => { row.actorId = CMS_OTHER_ACTOR })
  change('column: entry differs from request', row => { row.entryId = CMS_ENTRIES[1]! })
  change('column: request ID differs from bound ID', row => { row.requestId = randomUUID() })
  change('column: database time differs from receipt', row => { row.createdAt = '2000-01-01T00:00:00.000000Z' })
  change('column: nonfinite database time', row => { row.createdAt = 'infinity' })
  change('column: state does not advance exactly once', row => { row.afterVersion = '3'; asObject(row.result).version = '3' })
  for (const action of ['save_draft', 'restore_draft']) {
    change(`${action}: archived receipt`, row => { asObject(row.result).archived = true }, action)
    change(`${action}: no created revision`, row => { asObject(row.result).createdRevision = null }, action)
    change(`${action}: created revision differs from draft`, row => { asObject(row.result).createdRevision = '1' }, action)
    change(`${action}: new draft already public`, row => { asObject(row.result).publishedRevision = '2' }, action)
  }
  change('publish: archived receipt', row => { asObject(row.result).archived = true }, 'publish')
  change('publish: creates a revision', row => { asObject(row.result).createdRevision = '2' }, 'publish')
  change('publish: no published revision', row => { asObject(row.result).publishedRevision = null }, 'publish')
  change('publish: published revision is not current draft', row => { asObject(row.result).publishedRevision = '1' }, 'publish')
  change('publish: selected revision differs from publication', row => { asObject(row.request).payload = { revision: '1' } }, 'publish')
  change('archive: not archived', row => { asObject(row.result).archived = false }, 'archive')
  change('archive: retains public pointer', row => { asObject(row.result).publishedRevision = '1' }, 'archive')
  change('archive: creates a revision', row => { asObject(row.result).createdRevision = '2' }, 'archive')
  for (const vector of vectors) {
    await context.test(vector.name, async () => {
      const row = forAction(vector.action ?? 'save_draft')
      vector.change(row)
      await writer.query('BEGIN')
      try { await rejectSql(() => insertLedger(writer, row), '23514') }
      finally { await writer.query('ROLLBACK') }
      assert.deepEqual(await snapshot(f.owner), before)
    })
  }
  assert.deepEqual(await snapshot(f.owner), before)
  context.diagnostic(`CMS_NATIVE_LEDGER_NEGATIVE_VECTORS ${vectors.length}; all inserts use the actual postgres owner and explicit rollback`)
})

scenario('deferred same-entry revision and latest-receipt foreign keys reject invalid state at actual COMMIT', async (f) => {
  const editor = await f.connect()
  await command(editor, cmsCommand())
  await command(editor, cmsCommand({ expectedVersion: '1' }))
  const second = await command(editor, cmsCommand({ entryId: CMS_ENTRIES[1]!, payload: cmsPayload(1) }))
  const template = nextLedgerRow(second, CMS_ENTRIES[1]!), before = await snapshot(f.owner)
  const writer = await LocalPgConnection.connect(f.cluster)
  await writer.query('SET ROLE postgres')
  await writer.query('BEGIN')
  try {
    await insertLedger(writer, template)
    await writer.query(`UPDATE jetnity_cms_private.inspiration_entries_v1
      SET state_version=2,draft_revision=2,last_request_id=$1::uuid,updated_at=clock_timestamp()
      WHERE entry_id=$2::text`, [pgText(template.requestId, 2950), pgText(template.entryId)])
    // Revision 2 exists, but exclusively for the other entry. Every statement
    // above succeeds; the actual deferred COMMIT must refuse the cross-entry link.
    await rejectSql(() => writer.query('COMMIT'), '23503')
  } finally { await writer.query('ROLLBACK') }
  assert.deepEqual(await snapshot(f.owner), before)

  await writer.query('BEGIN')
  try {
    await writer.query(`UPDATE jetnity_cms_private.inspiration_entries_v1
      SET state_version=2,updated_at=clock_timestamp() WHERE entry_id=$1::text`, [pgText(template.entryId)])
    // The existing receipt is real and belongs to this entry, but its version
    // is 1, so it cannot justify state 2.
    await rejectSql(() => writer.query('COMMIT'), '23503')
  } finally { await writer.query('ROLLBACK') }
  assert.deepEqual(await snapshot(f.owner), before)
})

scenario('exact preview and capped keyset history preserve immutable snapshots and string counters', async (f) => {
  const editor = await f.connect()
  for (let index = 0; index < 55; index++) {
    await command(editor, cmsCommand({ expectedVersion: String(index), payload: { ...cmsPayload(), idea: `Gespeicherte Idee ${index + 1}` } }))
  }
  const first = await readEntry(editor, CMS_ENTRIES[0]!, '17', null, 50)
  assert.equal(asObject(first.entry).version, '55')
  assert.equal(asObject(first.preview).revision, '17')
  assert.equal(asObject(asObject(first.preview).content).idea, 'Gespeicherte Idee 17')
  assert.deepEqual(objects(first.history).map(row => row.revision), Array.from({ length: 50 }, (_, index) => String(55 - index)))
  assert.equal(first.nextBeforeRevision, '6')
  const second = await readEntry(editor, CMS_ENTRIES[0]!, null, String(first.nextBeforeRevision), 50)
  assert.deepEqual(objects(second.history).map(row => row.revision), ['5', '4', '3', '2', '1'])
  assert.equal(second.nextBeforeRevision, null)
  for (const limit of [0, -1, 51]) await rejectSql(() => readEntry(editor, CMS_ENTRIES[0]!, null, null, limit), '22023')
  await rejectSql(() => readEntry(editor, CMS_ENTRIES[0]!, '0'), '22023')
  await rejectSql(() => readEntry(editor, CMS_ENTRIES[0]!, null, '0'), '22023')
  await rejectSql(() => readEntry(editor, CMS_ENTRIES[1]!, '17'), 'P4041')
  assert.deepEqual(await published(await f.connect('anon', {})), { schema: 1, items: [] })
})

scenario('public projection exposes only published snapshots in fixed order and survives author deletion without cascading history', async (f) => {
  const editor = await f.connect(), visitor = await f.connect('anon', {}), user = await f.connect('authenticated', cmsClaims({ sub: CMS_MISSING_ACTOR, aal: 'aal1' }))
  for (const index of [3, 2, 1, 0]) {
    const entryId = CMS_ENTRIES[index]!
    await command(editor, cmsCommand({ entryId, payload: cmsPayload(index) }))
    if (index !== 3) await command(editor, cmsCommand({ entryId, expectedVersion: '1', action: 'publish', payload: { revision: '1' } }))
  }
  const actual = await published(visitor), items = objects(actual.items)
  assert.deepEqual(await published(user), actual)
  assert.deepEqual(items.map(item => item.entryId), CMS_ENTRIES.slice(0, 3))
  for (const [index, item] of items.entries()) {
    assert.deepEqual(Object.keys(item).sort(), ['entryId', 'revision', 'content', 'publishedAt'].sort())
    assert.equal(item.revision, '1')
    assert.deepEqual(item.content, cmsContent(index))
    timestamp(item.publishedAt)
  }
  const before = await snapshot(f.owner)
  await f.owner.query('DELETE FROM auth.users WHERE id=$1::uuid', [pgText(CMS_ACTOR, 2950)])
  assert.deepEqual(await snapshot(f.owner), before, 'global editorial history has no Auth deletion cascade')
  assert.deepEqual(await published(visitor), actual)
  await rejectSql(() => readEntry(editor), '42501')
  const successor = await f.connect('authenticated', cmsClaims({ sub: CMS_OTHER_ACTOR }))
  await command(successor, cmsCommand({ expectedVersion: '2', action: 'archive', payload: {} }))
  await command(successor, cmsCommand({ expectedVersion: '3', action: 'restore_draft', payload: { revision: '1' } }))
  assert.deepEqual(objects((await published(visitor)).items).map(item => item.entryId), CMS_ENTRIES.slice(1, 3))
})

scenario('actual in-flight SQL is closed and every owned resource is removed after assertion failure or parent timeout', async (_f, _lifetime, context) => {
  for (const mode of ['assertion failure', 'parent timeout']) {
    const cancellation = new AbortController()
    const scope = new OwnedTestLifetime(AbortSignal.any([context.signal, cancellation.signal]))
    const originalConnect = LocalPgConnection.connect
    scope.installConnectOwnership()
    const injected = Error(`CMS native injected ${mode}`)
    let inner: CmsFixture | undefined
    let job: ReturnType<typeof pending> | undefined
    let primary: unknown
    let cleanup: Awaited<ReturnType<OwnedTestLifetime['dispose']>> | undefined
    let cleanupFailure: unknown
    try {
      inner = await createCmsFixture(scope)
      const worker = await inner.connect(), identity = await identify(inner, worker)
      job = pending(scope.run(() => worker.query('SELECT pg_sleep(10)')))
      const until = performance.now() + 3_000
      let sleeping = false
      while (performance.now() < until) {
        const rows = await inner.owner.query(`SELECT state,wait_event_type,wait_event FROM pg_stat_activity
          WHERE pid=$1::integer AND backend_start=$2::timestamptz`, [pgText(identity.pid, 23), pgText(identity.birth)])
        sleeping = rows[0]?.state === 'active' && rows[0].wait_event_type === 'Timeout' && rows[0].wait_event === 'PgSleep'
        if (sleeping) break
        assert.equal(job.waiting(), true)
        await scope.wait(15)
      }
      assert.equal(sleeping, true, 'failure injection requires an actual in-flight PostgreSQL query')
      assert.equal(job.waiting(), true)
      if (mode === 'parent timeout') { cancellation.abort(injected); scope.check() }
      throw injected
    } catch (error) { primary = error }
    finally {
      try { cleanup = await scope.dispose() } catch (error) { cleanupFailure = error }
    }
    if (cleanupFailure) throw new AggregateError([primary, cleanupFailure], 'injected failure and cleanup result')
    assert.equal(primary, injected, 'the fixture must reach the intended failure boundary')
    assert.ok(inner && job && cleanup)
    assert.equal((await job.outcome).status, 'rejected', 'pending SQL cannot resolve as success after cancellation')
    assert.equal(cleanup.pending, 0)
    assert.equal(cleanup.started, cleanup.settled)
    assert.equal(cleanup.connections, cleanup.closed)
    assert.equal(cleanup.stoppedClusters, 1)
    assert.equal(existsSync(inner.cluster.root), false)
    assert.equal(LocalPgConnection.connect, originalConnect, 'ownership hooks must return to their parent')
    let lateQueries = 0, lateClusters = 0
    await assert.rejects(() => scope.run(async () => { lateQueries++; return true }))
    assert.throws(() => scope.startCluster(() => { lateClusters++; throw Error('unexpected late acquisition') }))
    assert.equal(lateQueries, 0)
    assert.equal(lateClusters, 0)
    context.diagnostic(JSON.stringify({ schema: 'jetnity.cms.native.failure_cleanup.v1', mode, ...cleanup }))
  }
})

// Each independent group has its own actual PG17 cluster and lifetime. Node's
// awaited subtests report all group failures before the parent finishes.
test('Admin editorial CMS candidate: mandatory isolated PostgreSQL 17 proof', { timeout: 900_000 }, async (context) => {
  for (const [name, body] of scenarios) {
    await context.test(name, { timeout: 60_000 }, child => withFixture(child, body))
  }
})
