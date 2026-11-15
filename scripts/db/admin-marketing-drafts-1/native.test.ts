import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { test, type TestContext } from 'node:test'
import { marketingDraftLink, parseMarketingDraftCommand, parseMarketingDraftRead, parseMarketingDraftResult } from '../../../lib/admin/marketing/drafts/contract'
import { OwnedTestLifetime } from '../official-truth-atomic-version-refresh-1/test-lifetime'
import { LocalPgConnection, LocalPgError, pgText } from '../official-truth-integrated-pilot-1/pg-wire'
import {
  MARKETING_ACTOR, MARKETING_OTHER_ACTOR, MARKETING_MISSING_ACTOR, MARKETING_TABLES, MARKETING_TASK_COMMIT,
  asObject, command, createMarketingFixture, identify, marketingClaims, marketingCommand, marketingPayload,
  read, rejectSql, resetActors, snapshot, waitBlocked, type MarketingCommand, type MarketingFixture, type MarketingJson,
} from './fixture'

type Scenario = (fixture: MarketingFixture, lifetime: OwnedTestLifetime, context: TestContext) => Promise<void>
const scenarios: [string, Scenario][] = []
const scenario = (name: string, body: Scenario) => { scenarios.push([name, body]) }
const items = (value: unknown) => { assert.ok(Array.isArray(value)); return value.map(asObject) }
function receipt(value: MarketingJson, input: MarketingCommand) {
  const parsed = parseMarketingDraftResult(value)
  assert.ok(parsed && parsed.action === 'apply', 'actual SQL result must satisfy the consumer contract')
  assert.equal(parsed.receipt.draftId, input.draftId)
  assert.equal(parsed.receipt.requestId, input.requestId)
  assert.equal(parsed.receipt.version, String(BigInt(input.expectedVersion) + 1n))
  assert.equal(parsed.receipt.action, input.action)
  assert.equal(parsed.receipt.actorId, MARKETING_ACTOR)
  assert.ok(marketingDraftLink(parsed.receipt))
  return parsed.receipt
}
function pending<T>(promise: Promise<T>) {
  let finished = false
  const outcome: Promise<PromiseSettledResult<T>> = promise.then(
    value => { finished = true; return { status: 'fulfilled', value } },
    reason => { finished = true; return { status: 'rejected', reason } },
  )
  return { outcome, waiting: () => !finished }
}
function rejected(value: PromiseSettledResult<unknown>, code: string) {
  assert.equal(value.status, 'rejected')
  if (value.status !== 'rejected') assert.fail('expected PostgreSQL rejection')
  assert.ok(value.reason instanceof LocalPgError)
  assert.equal(value.reason.code, code)
}
async function current(connection: LocalPgConnection, draftId: string) {
  const result = await read(connection, { schemaVersion: 1, action: 'get', draftId })
  assert.ok(parseMarketingDraftResult(result))
  return result.draft === null ? null : asObject(result.draft)
}

scenario('catalog, owner, forced RLS and exact public/private privileges', async f => {
  const actor = await f.connect()
  assert.deepEqual(await read(actor), { schemaVersion: 1, action: 'list', items: [], nextCursor: null })
  for (const table of MARKETING_TABLES) {
    const rows = await f.owner.query(`SELECT r.rolname,c.relrowsecurity::text,c.relforcerowsecurity::text
      FROM pg_class c JOIN pg_roles r ON r.oid=c.relowner JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='jetnity_marketing_private' AND c.relname=$1::text`, [pgText(table)])
    assert.deepEqual(rows, [{ rolname: 'postgres', relrowsecurity: 'true', relforcerowsecurity: 'true' }])
  }
  const owners = await f.owner.query(`SELECT p.proname,p.prosecdef::text,r.rolname,r.rolsuper::text,r.rolbypassrls::text,
    (p.proconfig @> ARRAY['search_path=pg_catalog, pg_temp'])::text AS fixed_path
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_roles r ON r.oid=p.proowner
    WHERE (n.nspname='public' AND p.proname LIKE 'admin_marketing_drafts_%') OR n.nspname='jetnity_marketing_private'`)
  assert.ok(owners.length > 2)
  for (const row of owners) {
    assert.equal(row.rolname, 'postgres'); assert.equal(row.rolsuper, 'false'); assert.equal(row.rolbypassrls, 'true')
    assert.equal(row.fixed_path, 'true')
    assert.equal(row.prosecdef, row.proname!.startsWith('admin_marketing_drafts_') || row.proname === 'enforce_chain_v1' ? 'true' : 'false')
  }
  for (const role of ['anon', 'authenticated', 'service_role'] as const) {
    const connection = await f.connect(role)
    for (const table of MARKETING_TABLES) {
      await rejectSql(() => connection.query(`SELECT * FROM jetnity_marketing_private.${table}`), '42501')
      const privileges = await f.owner.query('SELECT has_table_privilege($1::text,$2::text,\'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER\')::text AS allowed',
        [pgText(role), pgText(`jetnity_marketing_private.${table}`)])
      assert.equal(privileges[0]?.allowed, 'false')
    }
    await rejectSql(() => connection.query('SELECT jetnity_marketing_private.actor_v1()'), '42501')
    if (role !== 'authenticated') {
      await rejectSql(() => command(connection, marketingCommand()), '42501')
      await rejectSql(() => read(connection), '42501')
    }
  }
  const policies = await f.owner.query("SELECT count(*)::text AS total FROM pg_policies WHERE schemaname='jetnity_marketing_private'")
  assert.equal(policies[0]?.total, '0', 'private store has no permissive client policy')
})

scenario('fresh persisted role, active account and current AAL2 on reads, writes and replay', async (f, _lifetime, context) => {
  const allowed = await f.connect(), input = marketingCommand()
  await command(allowed, input)
  const deny = async (claims: MarketingJson = marketingClaims()) => {
    const connection = await f.connect('authenticated', claims)
    const before = await snapshot(f.owner)
    await rejectSql(() => read(connection), '42501')
    await rejectSql(() => command(connection, input), '42501')
    await rejectSql(() => command(connection, marketingCommand()), '42501')
    assert.deepEqual(await snapshot(f.owner), before)
    connection.close()
  }
  for (const role of ['moderator', 'operator', 'admin', 'owner']) await context.test(`permits active ${role} with AAL2`, async () => {
    await f.owner.query('UPDATE public.profiles SET role=$1::text WHERE user_id=$2::uuid', [pgText(role), pgText(MARKETING_ACTOR, 2950)])
    const connection = await f.connect()
    await command(connection, marketingCommand()); await read(connection); connection.close()
  })
  for (const role of ['user', 'creator']) await context.test(`rejects persisted ${role} despite forged metadata`, async () => {
    await f.owner.query('UPDATE public.profiles SET role=$1::text WHERE user_id=$2::uuid', [pgText(role), pgText(MARKETING_ACTOR, 2950)])
    await deny(marketingClaims({ user_metadata: { role: 'owner', is_admin: true }, app_metadata: { role: 'owner' }, admin_break_glass: true }))
  })
  await resetActors(f.owner)
  for (const aal of ['aal1', 'aal3', null, 2, '', { aal: 'aal2' }]) await context.test(`rejects current assurance ${JSON.stringify(aal)}`, () => deny(marketingClaims({ aal })))
  for (const status of ['pending', 'blocked', 'inactive']) await context.test(`rejects persisted status ${status}`, async () => {
    await f.owner.query('UPDATE public.profiles SET status=$1::text WHERE user_id=$2::uuid', [pgText(status), pgText(MARKETING_ACTOR, 2950)])
    await deny(); await resetActors(f.owner)
  })
  for (const change of [{ sub: MARKETING_MISSING_ACTOR }, { sub: null }, { sub: 'malformed' }, { role: 'service_role' }, { role: null }]) {
    await deny(marketingClaims(change))
  }
  await f.owner.query('DELETE FROM public.profiles WHERE user_id=$1::uuid', [pgText(MARKETING_ACTOR, 2950)])
  await deny(); await resetActors(f.owner)
  for (const field of ['deleted_at', 'is_anonymous']) {
    await f.owner.query(`UPDATE auth.users SET ${field}=${field === 'deleted_at' ? 'clock_timestamp()' : 'true'} WHERE id=$1::uuid`, [pgText(MARKETING_ACTOR, 2950)])
    await deny(); await resetActors(f.owner)
  }
})

scenario('commit, fresh-connection reload, immutable history, archive and restore', async f => {
  const connection = await f.connect(), input = marketingCommand()
  const first = receipt(await command(connection, input), input)
  connection.close()
  const fresh = await f.connect()
  assert.deepEqual(await current(fresh, input.draftId), first)
  const save = marketingCommand({ draftId: input.draftId, expectedVersion: '1', action: 'save', payload: marketingPayload({ label: 'Spring', channel: 'instagram' }) })
  const second = receipt(await command(fresh, save), save)
  assert.ok(second.savedAt > first.savedAt)
  const archive = marketingCommand({ draftId: input.draftId, expectedVersion: '2', action: 'archive', payload: {} })
  assert.equal(receipt(await command(fresh, archive), archive).state, 'archived')
  await rejectSql(() => command(fresh, marketingCommand({ draftId: input.draftId, expectedVersion: '3', action: 'save' })), 'P4093')
  const restore = marketingCommand({ draftId: input.draftId, expectedVersion: '3', action: 'restore', payload: { revision: '1' } })
  const restored = receipt(await command(fresh, restore), restore)
  assert.equal(restored.state, 'draft'); assert.equal(restored.restoredFrom, '1'); assert.deepEqual(restored.payload, first.payload)
  const history = await read(fresh, { schemaVersion: 1, action: 'history', draftId: input.draftId, limit: 2 })
  assert.ok(parseMarketingDraftResult(history)); assert.equal(history.nextCursor, '3')
  assert.deepEqual(items(history.items).map(row => row.version), ['4', '3'])
  const earlier = await read(fresh, { schemaVersion: 1, action: 'history', draftId: input.draftId, cursor: '3', limit: 2 })
  assert.deepEqual(items(earlier.items), [second, first]); assert.equal(earlier.nextCursor, null)
  const replay = await command(fresh, input)
  assert.equal(replay.replayed, true); assert.deepEqual(replay.receipt, first)
  assert.deepEqual(await current(fresh, input.draftId), restored, 'old receipt is not current state and never overwrites it')
  for (const table of MARKETING_TABLES) {
    await rejectSql(() => f.owner.query(`DELETE FROM jetnity_marketing_private.${table} WHERE draft_id=$1::uuid`, [pgText(input.draftId, 2950)]), '23514')
  }
  for (const table of ['revisions_v1', 'operations_v1']) {
    await rejectSql(() => f.owner.query(`UPDATE jetnity_marketing_private.${table} SET actor_id=actor_id WHERE draft_id=$1::uuid`, [pgText(input.draftId, 2950)]), '23514')
  }
})

scenario('closed JSON protocol and SQL/TypeScript URL-domain parity', async (f, _lifetime, context) => {
  const actor = await f.connect()
  for (const destination of ['home', 'planning', 'inspiration']) for (const channel of ['newsletter', 'instagram', 'partner', 'qr']) {
    await context.test(`${destination}/${channel}`, async () => {
      const input = marketingCommand({ payload: marketingPayload({ destination, channel, contentId: `cnt-${randomUUID()}` }) })
      assert.ok(parseMarketingDraftCommand(input)); receipt(await command(actor, input), input)
    })
  }
  const input = marketingCommand()
  const invalid = [null, true, [], {}, { ...input, schemaVersion: '1' }, { ...input, actorId: MARKETING_OTHER_ACTOR },
    { ...input, action: 'send' }, { ...input, expectedVersion: 0 }, { ...input, expectedVersion: '00' },
    { ...input, expectedVersion: '9223372036854775808' }, { ...input, requestId: 'not-a-uuid' },
    ...[{ label: '' }, { label: ' untrimmed' }, { label: 'ends\uFEFF' }, { label: 'control\ncharacter' },
      { label: 'control\u0085character' }, { label: '🌍'.repeat(81) }, { channel: 'email' }, { destination: 'https://evil.test' },
      { contentId: `cmp-${randomUUID()}` }, { url: 'https://jetnity.com' }, { email: 'private@example.test' }]
      .map(change => ({ ...input, payload: marketingPayload(change) })),
  ]
  const before = await snapshot(f.owner)
  for (const value of invalid) { assert.equal(parseMarketingDraftCommand(value), null); await rejectSql(() => command(actor, value), '22023') }
  assert.deepEqual(await snapshot(f.owner), before)
  const validUnicode = marketingCommand({ payload: marketingPayload({ label: '🌍'.repeat(80) }) })
  receipt(await command(actor, validUnicode), validUnicode)
  for (const request of [{ schemaVersion: 1, action: 'list', limit: 0 }, { schemaVersion: 1, action: 'list', limit: 51 },
    { schemaVersion: 1, action: 'list', cursor: null }, { schemaVersion: 1, action: 'list', state: 'published' },
    { schemaVersion: 1, action: 'get', draftId: input.draftId, extra: true },
    { schemaVersion: 1, action: 'history', draftId: input.draftId, cursor: '01' },
    { schemaVersion: 1, action: 'list', cursor: { draftId: input.draftId, savedAt: '2026-02-30T00:00:00.000001Z' } }]) {
    assert.equal(parseMarketingDraftRead(request), null); await rejectSql(() => read(actor, request), '22023')
  }
})

scenario('one CAS winner, observed database wait and no partial losing revision', async (f, lifetime) => {
  const a = await f.connect(), b = await f.connect(), input = marketingCommand()
  await command(a, input)
  await a.query('BEGIN')
  const first = marketingCommand({ draftId: input.draftId, expectedVersion: '1', action: 'save' })
  await command(a, first)
  const bId = await identify(f, b), aId = await identify(f, a)
  const losing = pending(command(b, marketingCommand({ draftId: input.draftId, expectedVersion: '1', action: 'save' })))
  await waitBlocked(f, lifetime, bId, aId, losing.waiting)
  await a.query('COMMIT')
  rejected(await losing.outcome, 'P4091')
  assert.equal((await current(b, input.draftId))?.version, '2')
  assert.equal(items((await read(b, { schemaVersion: 1, action: 'history', draftId: input.draftId })).items).length, 2)
})

scenario('concurrent duplicate create, exact retry and global request-ID collision binding', async (f, lifetime) => {
  const a = await f.connect(), b = await f.connect(), input = marketingCommand()
  await a.query('BEGIN'); const first = await command(a, input)
  const aId = await identify(f, a), bId = await identify(f, b)
  const duplicate = pending(command(b, input))
  await waitBlocked(f, lifetime, bId, aId, duplicate.waiting); await a.query('COMMIT')
  const replay = await duplicate.outcome
  assert.equal(replay.status, 'fulfilled')
  if (replay.status !== 'fulfilled') assert.fail('duplicate create did not replay')
  assert.equal(replay.value.replayed, true); assert.deepEqual(replay.value.receipt, first.receipt)
  const before = await snapshot(f.owner)
  for (const change of [{ draftId: randomUUID() }, { payload: marketingPayload({ label: 'different' }) }, { expectedVersion: '1', action: 'save' }]) {
    await rejectSql(() => command(b, { ...input, ...change }), 'P4092')
  }
  const otherActor = await f.connect('authenticated', marketingClaims({ sub: MARKETING_OTHER_ACTOR }))
  await rejectSql(() => command(otherActor, input), 'P4092')
  assert.deepEqual(await snapshot(f.owner), before)
  const competing = marketingCommand(), differentDraft = { ...competing, draftId: randomUUID() }
  await a.query('BEGIN'); await command(a, competing)
  const conflict = pending(command(b, differentDraft))
  await waitBlocked(f, lifetime, bId, aId, conflict.waiting); await a.query('COMMIT')
  rejected(await conflict.outcome, 'P4092')
  assert.equal(await current(b, differentDraft.draftId), null)
})

scenario('lost acknowledgement is recovered only by exact durable replay', async f => {
  const connection = await f.connect(), input = marketingCommand()
  // The server committed. Deliberately discard the received application result,
  // then close the transport; this models uncertainty, not a fabricated commit.
  await command(connection, input); connection.close()
  const successor = await f.connect(), replay = await command(successor, input)
  assert.equal(replay.replayed, true); receipt(replay, input)
  assert.equal(items((await read(successor, { schemaVersion: 1, action: 'history', draftId: input.draftId })).items).length, 1)
})

scenario('role/status/account withdrawal while waiting is rechecked after the actual draft lock', async (f, lifetime, context) => {
  for (const field of ['role', 'status', 'deleted_at', 'is_anonymous']) await context.test(field, async () => {
    await resetActors(f.owner)
    const writer = await f.connect(), input = marketingCommand()
    await command(writer, input)
    const holder = await LocalPgConnection.connect(f.cluster), revoker = await LocalPgConnection.connect(f.cluster)
    await holder.query('BEGIN')
    await holder.query('SELECT draft_id FROM jetnity_marketing_private.drafts_v1 WHERE draft_id=$1::uuid FOR UPDATE', [pgText(input.draftId, 2950)])
    const holderId = await identify(f, holder), writerId = await identify(f, writer)
    const attempt = pending(command(writer, marketingCommand({ draftId: input.draftId, expectedVersion: '1', action: 'save' })))
    await waitBlocked(f, lifetime, writerId, holderId, attempt.waiting)
    if (field === 'role' || field === 'status') await revoker.query(`UPDATE public.profiles SET ${field}=$1::text WHERE user_id=$2::uuid`,
      [pgText(field === 'role' ? 'user' : 'blocked'), pgText(MARKETING_ACTOR, 2950)])
    else await revoker.query(`UPDATE auth.users SET ${field}=${field === 'deleted_at' ? 'clock_timestamp()' : 'true'} WHERE id=$1::uuid`, [pgText(MARKETING_ACTOR, 2950)])
    await holder.query('COMMIT'); rejected(await attempt.outcome, '42501')
    await resetActors(f.owner)
    assert.equal((await current(writer, input.draftId))?.version, '1')
    writer.close(); holder.close(); revoker.close()
  })
})

scenario('accepted write SHARE locks serialize a later role withdrawal until commit', async (f, lifetime) => {
  const writer = await f.connect(), revoker = await LocalPgConnection.connect(f.cluster), input = marketingCommand()
  await writer.query('BEGIN'); await command(writer, input)
  const writerId = await identify(f, writer), revokerId = await identify(f, revoker)
  const revoke = pending(revoker.query('UPDATE public.profiles SET role=\'user\' WHERE user_id=$1::uuid', [pgText(MARKETING_ACTOR, 2950)]))
  await waitBlocked(f, lifetime, revokerId, writerId, revoke.waiting)
  await writer.query('COMMIT'); assert.equal((await revoke.outcome).status, 'fulfilled')
  await rejectSql(() => read(writer), '42501')
  await rejectSql(() => command(writer, input), '42501')
  await resetActors(f.owner); assert.equal((await current(writer, input.draftId))?.version, '1')
})

scenario('rollback and deferred constraints reject incomplete or mismatched durable history', async f => {
  const actor = await f.connect(), transient = marketingCommand(), before = await snapshot(f.owner)
  await actor.query('BEGIN'); receipt(await command(actor, transient), transient); await actor.query('ROLLBACK')
  assert.equal(await current(actor, transient.draftId), null); assert.deepEqual(await snapshot(f.owner), before)
  const orphan = randomUUID()
  await f.owner.query('BEGIN')
  await f.owner.query('INSERT INTO jetnity_marketing_private.drafts_v1(draft_id,version) VALUES($1::uuid,1)', [pgText(orphan, 2950)])
  await assert.rejects(() => f.owner.query('COMMIT'), (error: unknown) => error instanceof LocalPgError && ['23503','23514'].includes(error.code))
  await f.owner.query('ROLLBACK'); assert.deepEqual(await snapshot(f.owner), before)
  const input = marketingCommand(); await command(actor, input)
  const saved = await snapshot(f.owner), invalid = marketingCommand({ draftId: input.draftId, expectedVersion: '1', action: 'save', payload: marketingPayload({ label: 'bound label' }) })
  await f.owner.query('BEGIN')
  await f.owner.query(`INSERT INTO jetnity_marketing_private.operations_v1(request_id,draft_id,version,actor_id,request,saved_at)
    SELECT $1::uuid,$2::uuid,2,$3::uuid,$4::jsonb,saved_at+interval '1 microsecond' FROM jetnity_marketing_private.revisions_v1 WHERE draft_id=$2::uuid AND version=1`,
    [pgText(invalid.requestId,2950),pgText(input.draftId,2950),pgText(MARKETING_ACTOR,2950),pgText(JSON.stringify(invalid),3802)])
  await f.owner.query(`INSERT INTO jetnity_marketing_private.revisions_v1(draft_id,version,request_id,actor_id,action,state,payload,saved_at)
    SELECT draft_id,2,$1::uuid,actor_id,'save','draft',payload,saved_at+interval '1 microsecond'
    FROM jetnity_marketing_private.revisions_v1 WHERE draft_id=$2::uuid AND version=1`, [pgText(invalid.requestId,2950),pgText(input.draftId,2950)])
  await f.owner.query('UPDATE jetnity_marketing_private.drafts_v1 SET version=2 WHERE draft_id=$1::uuid', [pgText(input.draftId,2950)])
  await rejectSql(() => f.owner.query('COMMIT'), '23514'); await f.owner.query('ROLLBACK')
  assert.deepEqual(await snapshot(f.owner), saved)
  const readback = await f.owner.query(readFileSync(new URL('./readback.sql', import.meta.url),'utf8'))
  assert.equal(readback[0]?.invalid_chains, '0')
  for (const field of ['private_tables_closed','no_client_policies','wrappers_closed','internal_functions_closed']) assert.equal(readback[0]?.[field],'true')
})

scenario('bounded list/history pagination, filtering and exact microsecond cursor comparisons', async f => {
  const actor = await f.connect(), records: MarketingJson[] = []
  for (let index = 0; index < 7; index++) records.push(asObject((await command(actor, marketingCommand())).receipt))
  const visited: string[] = []; let cursor: unknown = undefined
  do {
    const page = await read(actor, { schemaVersion: 1, action: 'list', limit: 2, ...(cursor ? { cursor } : {}) })
    assert.ok(parseMarketingDraftResult(page)); assert.ok(items(page.items).length <= 2)
    visited.push(...items(page.items).map(row => String(row.draftId))); cursor = page.nextCursor
  } while (cursor)
  assert.deepEqual(visited, records.toReversed().map(row => row.draftId))
  const latest = records.at(-1)!, exactCursor = { savedAt: latest.savedAt, draftId: latest.draftId }
  const exactPage = await read(actor, { schemaVersion: 1, action: 'list', cursor: exactCursor })
  assert.equal(items(exactPage.items).some(row => row.draftId === latest.draftId), false)
  const after = await f.owner.query('SELECT jetnity_marketing_private.timestamp_v1($1::timestamptz+interval \'1 microsecond\') AS time', [pgText(String(latest.savedAt),1184)])
  const afterPage = await read(actor, { schemaVersion: 1, action: 'list', cursor: { ...exactCursor, savedAt: after[0]!.time } })
  assert.equal(items(afterPage.items)[0]?.draftId, latest.draftId)
  const archive = marketingCommand({ draftId: String(latest.draftId), action: 'archive', expectedVersion: '1', payload: {} })
  await command(actor, archive)
  const archived = await read(actor, { schemaVersion: 1, action: 'list', state: 'archived' })
  assert.deepEqual(items(archived.items).map(row => row.draftId), [latest.draftId])
  assert.equal(items((await read(actor, { schemaVersion: 1, action: 'list', state: 'draft' })).items).length, 6)
})

scenario('fresh backend ignores adversarial temporary types and names', async f => {
  const actor = await f.connect()
  await actor.query(`CREATE TEMP TABLE marketing_temp_bootstrap(id integer);
    CREATE DOMAIN pg_temp.uuid AS pg_catalog.uuid CHECK (false);
    CREATE DOMAIN pg_temp.jsonb AS pg_catalog.jsonb CHECK (false);
    CREATE DOMAIN pg_temp.text AS pg_catalog.text CHECK (false);
    CREATE DOMAIN pg_temp.bigint AS pg_catalog.int8 CHECK (false);
    CREATE DOMAIN pg_temp.timestamptz AS pg_catalog.timestamptz CHECK (false);
    SET search_path=pg_temp,public;`)
  const input = marketingCommand()
  receipt(await command(actor, input), input)
  assert.equal((await current(actor, input.draftId))?.version, '1')
})

async function withFixture(context: TestContext, body: Scenario) {
  const lifetime = new OwnedTestLifetime(context.signal)
  lifetime.installConnectOwnership()
  let fixture: MarketingFixture | undefined; let failure: unknown; let cleanup: Awaited<ReturnType<OwnedTestLifetime['dispose']>> | undefined
  try {
    fixture = await createMarketingFixture(lifetime)
    context.diagnostic(JSON.stringify({ schema: 'jetnity.marketing.native.source.v1', taskCommit: MARKETING_TASK_COMMIT, sources: fixture.sources }))
    await body(fixture,lifetime,context)
  } catch (error) { failure = error }
  finally {
    try { cleanup = await lifetime.dispose() } catch (error) { failure = failure ? new AggregateError([failure,error]) : error }
  }
  if (failure) throw failure
  assert.ok(fixture && cleanup)
  assert.equal(cleanup.pending,0); assert.equal(cleanup.started,cleanup.settled); assert.equal(cleanup.connections,cleanup.closed)
  assert.equal(cleanup.stoppedClusters,1); assert.equal(existsSync(fixture.cluster.root),false)
}

// Every scenario gets a real isolated PostgreSQL17 lifetime; all group failures
// are collected. There is no optional skip, hosted configuration or local fallback.
test('Admin marketing drafts: mandatory isolated PostgreSQL17 proof', { timeout: 900_000 }, async context => {
  for (const [name,body] of scenarios) await context.test(name,{ timeout: 60_000 },child => withFixture(child,body))
})
