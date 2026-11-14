import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { NextRequest } from 'next/server'
import { LOCAL_UNAPPLIED_RPCS, pruefe } from '../../../../scripts/db/verwendung.mjs'
import { assertTransactionBody, compileCandidate, compileMigrationBody, functionsIn } from '../../../../scripts/db/official-truth-v3-background-guard-1/build.mjs'
import { DEV_GUARD_PATH, DEV_GUARD_REQUEST_BYTES, devGuardReceipt, readDevGuardRequest,
  readDevGuardReview, readDevGuardResult, readDevGuardText } from './guard-contract'

const DEV = 'https://yfvbxvijcorffwxbxahl.supabase.co', ORIGIN = 'https://offline-preview.vercel.app'
const ENV = { VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM', VERCEL_GIT_REPO_OWNER: 'Jetnity',
  VERCEL_GIT_REPO_SLUG: 'jetnity', VERCEL_GIT_COMMIT_REF: 'feat/official-truth-human-method-ui-1-20261112' }
const operation = { schema: 1, intent: 'mutate', action: 'retire_unknown', operationId: 'op3_' + 'a'.repeat(32), selection: 'b'.repeat(64) } as const
const review = { schema: 1, status: 'reviewed', retirement: { status: 'unavailable' }, incident: { status: 'clear',
  selection: 'a'.repeat(64), generation: 0, methodEpoch: 1, proofFinished: null, validUntil: null, canResume: false } } as const
test('four local Guard RPCs require the exact caller and SQL artifact without changing the generated live schema', () => {
  const sourcePath = 'lib/readiness/official-truth-product-v3/runtime/guard-server.ts'
  const sqlPath = 'scripts/db/official-truth-v3-background-guard-1/upgrade-candidate.sql'
  const names = ['official_v3_guard_review_v1', 'official_v3_guard_retire_v1',
    'official_v3_guard_resume_v1', 'official_v3_guard_confirm_v1']
  assert.deepEqual(LOCAL_UNAPPLIED_RPCS.filter(rule => rule.sourcePath === sourcePath), names.map(name => ({ name, sourcePath, sqlPath })))
  const actualSource = readFileSync(sourcePath, 'utf8'), actualSql = readFileSync(sqlPath, 'utf8')
  const check = (path: string, source: string, sql: string | null) => pruefe({
    dateien: [path], lese: () => source,
    typenInhalt: '    Tables: {\n    }\n    Views: {\n    }\n    Functions: {\n    }',
    sqlVorhanden: (path: string) => path === sqlPath && sql !== null,
    sqlInhalt: () => sql ?? '',
  })
  const actual = check(sourcePath, actualSource, actualSql)
  assert.equal(actual.befunde.length, 0)
  assert.deepEqual(actual.lokaleUnapplied.map(row => row.name).sort(), [...names].sort())
  for (const name of names) {
    assert.ok(actualSql.includes('CREATE FUNCTION public.' + name + '('))
    const call = `.rpc(${JSON.stringify(name)})`
    for (const path of ['lib/wrong-caller.ts', sourcePath + '.evil.ts', sourcePath.replace('guard-server', 'guard-server-copy')]) {
      assert.equal(check(path, call, actualSql).befunde[0]?.grund, 'wrong-source')
    }
    assert.equal(check(sourcePath, call, null).befunde[0]?.grund, 'missing-sql')
    assert.equal(check(sourcePath, call, 'CREATE FUNCTION public.unrelated()').befunde[0]?.grund, 'missing-sql')
  }
  const unknown = 'official_v3_guard_unreviewed_v1'
  assert.equal(check(sourcePath, `.rpc(${JSON.stringify(unknown)})`, actualSql).befunde[0]?.name, unknown)
})
test('BG1 assembler selects actual function statements and the fixed PAI EXECUTE block, never catalog text', () => {
  const source = `
-- CREATE FUNCTION public.comment() RETURNS void AS $$ BEGIN END $$ LANGUAGE plpgsql;
/* nested /* catalog */ CREATE FUNCTION public.comment2() RETURNS void AS $$ BEGIN END $$ LANGUAGE plpgsql; */
SELECT 'CREATE FUNCTION public.string() RETURNS void AS $$ BEGIN END $$ LANGUAGE plpgsql;'::text;
DO $inventory$ DECLARE evidence jsonb := $json$ {"definition":"CREATE FUNCTION public.catalog() RETURNS void AS $$ BEGIN END $$ LANGUAGE plpgsql;"}$json$; BEGIN NULL; END $inventory$;
CREATE FUNCTION public.return_wrapper() RETURNS integer LANGUAGE sql RETURN 1;
CREATE FUNCTION public.actual() RETURNS integer LANGUAGE sql AS $body$ SELECT 1 $body$;
`
  const actual = functionsIn(source)
  assert.deepEqual(actual.map(f => f.signature), ['public.actual()'])
  assert.equal(actual[0]!.body, ' SELECT 1 ')
  assert.throws(() => functionsIn("SELECT 'unterminated"))
  const generated = compileCandidate()
  assert.equal(generated, readFileSync(new URL('../../../../scripts/db/official-truth-v3-background-guard-1/upgrade-candidate.sql', import.meta.url), 'utf8'))
  assert.ok(generated.includes("('public.profil_autoritaet_integritaet_pruefen_v1()','b513eca8cc5d7b3981d9b9eb1473428e628410dcb0f4b718290d4cc314756a8d')"))
  assert.equal(generated.includes("('public.aktuelle_rolle()','b513eca8cc5d7b3981d9b9eb1473428e628410dcb0f4b718290d4cc314756a8d')"), false)
})
test('BG1 provider body and standalone share exact guarded core with distinct transaction ownership', () => {
  const standalone = compileCandidate(), provider = compileMigrationBody()
  const target = "SET LOCAL jetnity.bg1_target='dev:yfvbxvijcorffwxbxahl:BG1';\n"
  assert.ok(provider.startsWith(target))
  const core = provider.slice(target.length)
  assert.equal(standalone, 'BEGIN ISOLATION LEVEL READ COMMITTED;\n' + core + 'COMMIT;\n')
  assert.equal(provider, readFileSync(new URL('../../../../scripts/db/official-truth-v3-background-guard-1/provider-migration-body.sql', import.meta.url), 'utf8'))
  assertTransactionBody(core); assertTransactionBody(provider)
  assert.ok(core.includes("current_setting('transaction_isolation') IS DISTINCT FROM 'read committed'"))
  assert.ok(core.includes("current_setting('jetnity.bg1_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:BG1'"))
  assert.equal(core.includes('SET LOCAL jetnity.bg1_target'), false, 'only the provider wrapper selects Dev')
  assert.equal(core.includes('SET TRANSACTION'), false, 'the provider may already have queried migration metadata')
  for (const command of ['BEGIN;', 'START TRANSACTION;', 'COMMIT;', 'END;', 'ROLLBACK;', 'ABORT;',
    "PREPARE TRANSACTION 'fixture';", 'SAVEPOINT fixture;', 'RELEASE SAVEPOINT fixture;',
    'SET TRANSACTION ISOLATION LEVEL READ COMMITTED;', 'SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY;',
    'SET /* nested /* comment */ boundary */ TRANSACTION READ ONLY;', 'SET -- comment\n SESSION CHARACTERISTICS AS TRANSACTION READ ONLY;']) {
    assert.throws(() => assertTransactionBody('SELECT 1;\n' + command), /BG1 body/)
  }
  assertTransactionBody(`-- BEGIN; COMMIT;\n/* ROLLBACK; */ SELECT 'COMMIT;';\nDO $nested$ BEGIN PERFORM 'ROLLBACK;'; END $nested$;`)
  assert.throws(() => assertTransactionBody('SELECT 1; COMMIT'), /complete terminated/)
})
test('BG1 catalog dependency keys and exact function settings match PostgreSQL binder types', () => {
  const generated = compileCandidate()
  assert.equal((generated.match(/\|\|d\.deptype::text,to_jsonb\(d\)/g) ?? []).length, 4, 'both dependency classes before and after the upgrade')
  assert.equal(generated.includes('||d.deptype,to_jsonb(d)'), false)
  const literal = /DECLARE approved jsonb:='((?:[^']|'')*)'::jsonb;/.exec(generated)?.[1]
  assert.ok(literal)
  const approved = JSON.parse(literal.replaceAll("''", "'")) as { functions: { signature: string; config: string[] }[] }
  const configured = approved.functions.filter(f => f.config.some(value => /^(?:timezone|datestyle)=/i.test(value)))
  assert.equal(configured.length, 11)
  for (const f of configured) {
    assert.ok(f.config.includes('TimeZone=UTC'), f.signature)
    assert.ok(f.config.includes('DateStyle=ISO, YMD'), f.signature)
    assert.equal(f.config.some(value => /^(?:timezone|datestyle)=/.test(value)), false, f.signature)
  }
  assert.ok(generated.includes('to_jsonb(p.proconfig) IS DISTINCT FROM f.config'), 'actual catalog comparison remains exact')
})
test('guard contract keeps exact reviewed selection, original operation and absent outcomes distinct', () => {
  assert.ok(readDevGuardRequest(operation)); assert.ok(readDevGuardReview(review))
  for (const extra of [{ sql: 'SELECT 1' }, { ownerId: 'private' }, { target: DEV }, { unknown: true }]) {
    assert.equal(readDevGuardRequest({ ...operation, ...extra }), null)
    assert.equal(readDevGuardReview({ ...review, ...extra }), null)
  }
  assert.equal(readDevGuardReview({ ...review, incident: { ...review.incident, canResume: true } }), null)
  const receipt = { schema: 1, status: 'recorded', action: operation.action, operationId: operation.operationId,
    selection: operation.selection, result: 'unknown_retired', recordedAt: '2026-11-14T01:00:00.000Z' }
  const result = devGuardReceipt(receipt, operation); assert.ok(result); assert.equal(result.status, 'recorded')
  assert.ok(readDevGuardResult(result, operation))
  assert.equal(devGuardReceipt({ ...receipt, selection: 'c'.repeat(64) }, operation), null)
  assert.equal(devGuardReceipt({ ...receipt, result: 'resumed' }, operation), null)
  assert.equal(devGuardReceipt({ schema: 1, status: 'absent' }, operation), null)
  const confirmation = { ...operation, intent: 'confirm' as const }
  assert.equal(devGuardReceipt(receipt, confirmation)?.status, 'confirmed')
  assert.equal(readDevGuardResult(result, confirmation), null)
  const absent = devGuardReceipt({ schema: 1, status: 'absent' }, confirmation)
  assert.ok(absent); assert.equal(absent.status, 'absent'); assert.ok(readDevGuardResult(absent, confirmation))
})
test('bounded UTF-8 request/reply reader joins cancellation and never converts partial bytes to a complete body', async () => {
  const signal = new AbortController().signal
  assert.equal(await readDevGuardText(new Response('x'.repeat(512)).body, signal, 512), 'x'.repeat(512))
  assert.equal(await readDevGuardText(new Response('x'.repeat(513)).body, signal, 512), null)
  assert.equal(await readDevGuardText(new Response(new Uint8Array([255])).body, signal, 512), null)
  let release!: () => void, settled = false, cancelling = false
  const stream = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(new Uint8Array(513)) },
    cancel() { cancelling = true; return new Promise<void>(resolve => { release = resolve }) } })
  const pending = readDevGuardText(stream, signal, 512).finally(() => { settled = true })
  while (!cancelling) await new Promise<void>(resolve => setImmediate(resolve))
  assert.equal(settled, false); release(); assert.equal(await pending, null)
})
test('real Proxy and guard POST check every fixed target and request boundary before Auth or mutation', async t => {
  Object.assign(process.env, ENV); process.env.ADMIN_ALLOWED_EMAILS = ''
  let target: string | undefined = DEV, role = 'owner', aal = 'aal2', user = true, rpcCalls = 0, authCalls = 0, proxyCalls = 0
  let held: Promise<void> | null = null, entered = false, serverThrows = false
  t.mock.method(console, 'warn', () => undefined); t.mock.method(console, 'error', () => undefined)
  t.mock.module('@supabase/ssr', { namedExports: { createServerClient() { proxyCalls++; return { auth: { async getUser() { return { data: { user: null }, error: null } } } } } } })
  t.mock.module(new URL('../../../supabase/server.ts', import.meta.url), { namedExports: {
    getServerSupabaseUrl: () => target,
    async createServerComponentClient() { authCalls++; return {
      auth: { async getUser() { return { data: { user: user ? { id: 'offline-owner' } : null }, error: null } },
        mfa: { async getAuthenticatorAssuranceLevel() { return { data: { currentLevel: aal, nextLevel: 'aal2' }, error: null } } } },
      from() { return { select() { return { eq() { return { async maybeSingle() { return { data: { role }, error: null } } } } } } } },
    } },
  } })
  t.mock.module(new URL('./guard-server.ts', import.meta.url), { namedExports: { async runDevGuardRequest() {
    rpcCalls++; entered = true; if (held) await held
    if (serverThrows) throw Error('PRIVATE_NEVER_RETURN')
    return { value: review, problem: null }
  } } })
  const route = await import('../../../../app/api/internal/readiness/ch-de-owner-guard/route')
  const { proxy } = await import('../../../../proxy')
  assert.equal(route.runtime, 'nodejs'); assert.equal(route.maxDuration, 30); assert.equal('GET' in route, false)
  const body = JSON.stringify({ schema: 1, intent: 'review' })
  function request(value: { body?: BodyInit; url?: string; headers?: HeadersInit; method?: string } = {}) {
    const headers = new Headers({ origin: ORIGIN, 'content-type': 'application/json' })
    for (const [k, v] of new Headers(value.headers)) headers.set(k, v)
    return new NextRequest(value.url ?? ORIGIN + DEV_GUARD_PATH, { method: value.method ?? 'POST', headers,
      body: value.method === 'GET' ? undefined : value.body ?? body })
  }
  async function invoke(req: NextRequest) {
    assert.equal((await proxy(req)).headers.get('x-middleware-next'), '1'); assert.equal(proxyCalls, 0)
    return route.POST(req)
  }
  async function refused(req: NextRequest, status: number) {
    const result = await invoke(req); assert.equal(result.status, status); assert.match(result.headers.get('cache-control')!, /no-store/)
    assert.equal(authCalls, 0); assert.equal(rpcCalls, 0)
  }
  for (const [k, v] of Object.entries(ENV)) {
    delete process.env[k]; await refused(request(), 503)
    process.env[k] = 'wrong'; await refused(request(), 503); process.env[k] = v
  }
  process.env.VERCEL_ENV = 'production'; await refused(request(), 503); process.env.VERCEL_ENV = 'preview'
  for (const wrong of [undefined, DEV + '/', 'https://qscbgcdmivbbnzrcyegn.supabase.co']) { target = wrong; await refused(request(), 503) }
  target = DEV
  for (const value of [request({ headers: { origin: 'https://other.invalid' } }), request({ headers: { 'content-type': 'text/plain' } }),
    request({ url: ORIGIN + DEV_GUARD_PATH + '?extra=1' }), request({ method: 'GET' }), request({ headers: { 'content-encoding': 'gzip' } }),
    request({ headers: { 'content-length': '9999' } }), request({ headers: { 'content-length': '01' } }),
    ...['', 'null', '[]', '{', body + ' ', '{"schema":1,"schema":1,"intent":"review"}', JSON.stringify({ ...operation, sql: 'SELECT 1' }),
      'x'.repeat(DEV_GUARD_REQUEST_BYTES + 1)].map(body => request({ body }))]) await refused(value, 400)
  user = false; assert.equal((await invoke(request())).status, 401); assert.equal(rpcCalls, 0); user = true
  for (const wrong of ['admin', 'moderator', 'user']) { role = wrong; assert.equal((await invoke(request())).status, 403); assert.equal(rpcCalls, 0) }
  role = 'owner'; aal = 'aal1'; assert.equal((await invoke(request())).status, 403); assert.equal(rpcCalls, 0); aal = 'aal2'
  let release!: () => void; held = new Promise<void>(resolve => { release = resolve }); let settled = false
  const pending = invoke(request()).finally(() => { settled = true })
  while (!entered) await new Promise<void>(resolve => setImmediate(resolve))
  assert.equal(settled, false); release(); assert.equal((await pending).status, 200); assert.equal(rpcCalls, 1)
  held = null; serverThrows = true; const failure = await invoke(request())
  assert.equal(failure.status, 503); assert.doesNotMatch(await failure.text(), /PRIVATE_NEVER_RETURN/)
})
