// Executable OFFLINE correction proof for #1139; never a hosted/JWT proof.
// Canonical migrations/runtime stay unchanged. These SQL files have no apply entry.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { findLocalPgBins, startLocalProofCluster } from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgText, type PgRows } from '../../scripts/db/official-truth-integrated-pilot-1/pg-wire'

const ANCHORS: Readonly<Record<string, string>> = {
  "20260815060111_baseline.sql": "429a2f6106cd4dd0f9d4cb031fd03757a359b28b",
  "20260817100000_rollenmodell.sql": "41c9455bbc88a7b5165d4c929b8f86182cda8fd0",
  "20260817100500_rollenwechsel_beim_anlegen.sql": "e6ac1e2a2c28089871ac138f4b4782a8554542ea",
  "20260817120300_generisches_profil.sql": "aa2655aa49bdefdc54bf23052c540ecc59079515",
  "20260827170000_admin_aal2_data_plane_alignment.sql": "4d24d28ff5789a253d0abc6ebd8aa0d6e22a2375",
  "20261002154952_official_truth_owner_reviewer_capability_1.sql": "43a590682f1d3f569f418fb2572b8fb010de9291",
  "20261013184409_official_truth_ch_de_application_pilot_1.sql": "87639107883cb9771ed5b19db68994ba08a6c930",
  "20260817120000_reiseschema.sql": "37bb78ddb919b16bd4cd8e00b0a1445a9718c4ba",
  "20260820010000_reise_stage_revision.sql": "8d8b79a7206bd06bdd6f9fa850be94e46510c12a",
  "20260820060000_reise_graph_revision.sql": "77b34f5c0e9e6c35b10759ea2f43b291888ea16d",
  "20260820080000_reise_tage_eindeutig_aufgeschoben.sql": "938de8c1d333a07ba3313435e65b374bb727a6f8",
  "20260821100000_trip_items_booking_status.sql": "8b68cee2d5b799f797794412d2d0c2461743aaa6",
  "20260822010000_trip_readiness_items.sql": "472362d7f0f29136f206fbabb6ba4b84f7c028fc",
  "20260822020000_trip_travellers.sql": "c5c0b447b78e34e453919fdcbda084a2a25f7912",
  "20260822160000_traveller_context_intelligence.sql": "aa1a617085e72e6f6ababf4fe4cd053fcf242f8c",
  "20260829201500_account_traveller_registry_persistence.sql": "9a485b4f01426edc2f39b1fcffe89a0c21089454"
}
const ROLE = '20260817100000_rollenmodell.sql'
const PROFILE = '20260817120300_generisches_profil.sql'
const TRIGGER = '20260817100500_rollenwechsel_beim_anlegen.sql'
const AAL = '20260827170000_admin_aal2_data_plane_alignment.sql'
const CAPABILITY = '20261002154952_official_truth_owner_reviewer_capability_1.sql'
const PILOT = '20261013184409_official_truth_ch_de_application_pilot_1.sql'
const TRIP_INPUTS = [
  '20260817120000_reiseschema.sql', '20260820010000_reise_stage_revision.sql',
  '20260820060000_reise_graph_revision.sql', '20260820080000_reise_tage_eindeutig_aufgeschoben.sql',
  '20260821100000_trip_items_booking_status.sql', '20260822010000_trip_readiness_items.sql',
  '20260822020000_trip_travellers.sql', '20260822160000_traveller_context_intelligence.sql',
  '20260829201500_account_traveller_registry_persistence.sql',
]
const SOURCES = join(process.cwd(), 'supabase/migrations')
const CANDIDATE = join(process.cwd(), 'scripts/db/official-truth-owner-session-candidate-1')
const source = (name: string) => readFileSync(join(SOURCES, name), 'utf8')
const candidate = (name: string) => readFileSync(join(CANDIDATE, name + '-candidate.sql'), 'utf8')
const quote = (value: string) => `'${value.replaceAll("'", "''")}'`
const OWNER = '11111111-1111-4111-8111-111111111111'
const ADMIN = '22222222-2222-4222-8222-222222222222'
const OTHER = '33333333-3333-4333-8333-333333333333'
const MISSING = '44444444-4444-4444-8444-444444444444'
const SESSION = '55555555-5555-4555-8555-555555555555'
const FOREIGN_SESSION = '66666666-6666-4666-8666-666666666666'
const GRANT = '77777777-7777-4777-8777-777777777777'
const TRIP = '88888888-8888-4888-8888-888888888888'
const fingerprint = 'a'.repeat(64)
const claims = (changes: Record<string, unknown> = {}) => ({ sub: OWNER, role: 'authenticated',
  aal: 'aal2', session_id: SESSION, exp: Math.floor(Date.now() / 1000) + 300, ...changes })
const payload = (operation: 'reserve' | 'recheck' = 'reserve') => ({ operation, tripId: TRIP,
  revision: 1, contextFingerprint: fingerprint, grantId: operation === 'recheck' ? GRANT : null })
const definitions = [
  { name: 'rollenrang', args: 'rolle text', file: ROLE },
  { name: 'aktuelle_rolle', args: '', file: PROFILE },
  { name: 'hat_rolle_mindestens', args: 'minimum text', file: ROLE },
  { name: 'aktuelles_admin_aal2', args: '', file: AAL },
  { name: 'darf_official_truth_freigeben', args: '', file: CAPABILITY },
] as const

function exactFunction(sql: string, name: string, args = ''): string {
  const marker = 'create or replace function public.' + name + '(' + args + ')'
  const start = sql.indexOf(marker)
  assert.ok(start >= 0, 'missing anchored function ' + name)
  assert.equal(sql.indexOf(marker, start + marker.length), -1, 'ambiguous anchored function')
  const delimiter = sql.indexOf('as $$', start)
  const end = sql.indexOf('$$;', delimiter + 5)
  assert.ok(delimiter > start && end > delimiter)
  return sql.slice(start, end + 3)
}

function assertSourceAnchors(): void {
  for (const [file, hash] of Object.entries(ANCHORS)) {
    const bytes = Buffer.from(source(file))
    assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), hash,
      file + ': source drift requires explicit candidate re-review')
  }
  const files = readdirSync(SOURCES).filter(name => name.endsWith('.sql')).sort()
  // Conservative DDL selection guard, not a complete SQL interpreter or ACL replay.
  const guardedDefinitions = [...definitions,
    { name: 'official_truth_application_pilot_run_v1', file: PILOT },
    { name: 'profil_rollenwechsel_pruefen', file: PROFILE }]
  for (const target of guardedDefinitions) {
    const identifier = `(?:(?:public|"public")\\s*\\.\\s*)?(?:${target.name}|"${target.name}")\\s*\\(`
    for (const file of files.filter(name => name > target.file)) {
      const sql = source(file).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\r\n]*/g, ' ')
      assert.doesNotMatch(sql, new RegExp(`\\bcreate\\s+(?:or\\s+replace\\s+)?function\\s+${identifier}|\\b(?:alter|drop)\\s+function\\b[^;]*${identifier}`, 'i'),
        target.name + ': later DDL requires re-review')
    }
  }
  for (const file of files.filter(name => name > PROFILE)) {
    const sql = source(file).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\r\n]*/g, ' ')
    assert.doesNotMatch(sql, /\b(?:alter|drop)\s+(?:table|trigger)\b[^;]*\bprofiles\b|\bcreate\s+(?:or\s+replace\s+)?(?:constraint\s+)?trigger\b[^;]*\bprofiles\b/i,
      'later profile/trigger DDL requires re-review')
  }
  for (const file of files.filter(name => name > PILOT)) {
    const sql = source(file).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\r\n]*/g, ' ')
    assert.doesNotMatch(sql, /\b(?:create|alter|drop)\s+table\b[^;]*\bofficial_truth_application_pilot_grants\b/i,
      'later pilot-grant DDL requires re-review')
  }
}

const postLock = `  if not found then return null; end if;
  -- Source ownership/revision check occurred before a possible grant wait.
  -- Revalidate and hold that trip row; contention is a fail-closed error.
  perform t.id from public.trips t where t.id=(payload->>'tripId')::uuid
    and t.user_id=uid and t.revision=(payload->>'revision')::integer for share nowait;
  if not found then return null; end if;
  perform jetnity_ot_auth.require_current_owner_session_v1();
  if not g.enabled or clock_timestamp()>=g.expires_at then return null; end if;`

test('Official Truth owner-session candidate: exact current source and finite pilot changes', () => {
  assertSourceAnchors()
  for (const target of definitions) exactFunction(source(target.file), target.name, target.args)
  const original = exactFunction(source(PILOT), 'official_truth_application_pilot_run_v1', 'payload jsonb')
  const expected = original.replace("set search_path='' as $$", () => "set search_path='' set lock_timeout='3s' as $$")
    .replace('  if not found or not g.enabled or clock_timestamp()>=g.expires_at then return null; end if;', postLock)
  assert.notEqual(expected, original)
  assert.equal(exactFunction(candidate('pilot'), 'official_truth_application_pilot_run_v1', 'payload jsonb'), expected)
  assert.match(source(PROFILE), /alter function public\.creator_profiles_rollenwechsel_pruefen\(\) rename to profil_rollenwechsel_pruefen;/)
  assert.match(source('20260815060111_baseline.sql'), /ADD CONSTRAINT "creator_profiles_user_id_fkey" FOREIGN KEY \("user_id"\) REFERENCES "auth"\."users"\("id"\) ON DELETE CASCADE;/)
})

const bins = findLocalPgBins()
test('Official Truth owner-session candidate native PG: corrected authority and real pilot concurrency',
  { skip: bins ? false : 'native PostgreSQL unavailable; candidate native proof NOT RUN', timeout: 180_000 }, async t => {
    assertSourceAnchors()
    const cluster = startLocalProofCluster()
    const connections: LocalPgConnection[] = []
    const sql = (statement: string, user = cluster.user) => execFileSync(bins!.psql,
      ['-X', '--no-psqlrc', '-Atq', '-h', cluster.socket, '-p', String(cluster.port), '-U', user,
        '-d', cluster.database, '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose'],
      { input: statement, encoding: 'utf8', stdio: 'pipe', timeout: 30_000, maxBuffer: 2_097_152 }).trim()
    const asRole = (statement: string, jwt: unknown = claims(), role = 'authenticated') =>
      sql(`begin; set local role ${role}; set local request.jwt.claims=${quote(JSON.stringify(jwt))}; ${statement}; commit;`)
    const capability = (jwt: unknown = claims(), role = 'authenticated') =>
      asRole('select public.darf_official_truth_freigeben()::text', jwt, role)
    const rpc = (operation: 'reserve' | 'recheck' = 'reserve', jwt: unknown = claims(), role = 'authenticated') =>
      asRole(`select public.official_truth_application_pilot_run_v1(${quote(JSON.stringify(payload(operation)))}::jsonb)`, jwt, role)
    const consumed = () => sql(`select coalesce(consumed_at::text,'UNCONSUMED') from private.official_truth_application_pilot_grants where id='${GRANT}'`)
    const expectState = (run: () => unknown, state: string) => {
      let failure: unknown
      try { run() } catch (error) { failure = error }
      assert.ok(failure, 'expected SQLSTATE ' + state)
      assert.match(String((failure as { stderr?: unknown }).stderr ?? ''), new RegExp('\\b' + state + '\\b'))
    }
    const reset = (used = false) => sql(`
      truncate auth.users cascade;
      insert into auth.users(id) values('${OWNER}'),('${ADMIN}'),('${OTHER}');
      insert into public.profiles(user_id,role,status) values('${OWNER}','owner','active'),('${ADMIN}','admin','active'),('${OTHER}','user','active');
      insert into auth.sessions(id,user_id,aal) values('${SESSION}','${OWNER}','aal2'),('${FOREIGN_SESSION}','${OTHER}','aal2');
      insert into public.trips(id,user_id,title,origin,start_date,end_date,travellers,metadata)
        values('${TRIP}','${OWNER}','SYNTHETIC ONLY','Synthetic','2026-11-01','2026-11-08',1,'{}');
      insert into private.official_truth_application_pilot_grants(id,user_id,trip_id,trip_revision,context_fingerprint,contract_id,contract_digest,approval_reference,enabled,expires_at,consumed_at)
        values('${GRANT}','${OWNER}','${TRIP}',1,'${fingerprint}','synthetic-only','${'b'.repeat(64)}','SYNTHETIC LOCAL FIXTURE',true,clock_timestamp()+interval '2 minutes',${used ? 'clock_timestamp()' : 'null'});`)
    const connect = async () => {
      const connection = await LocalPgConnection.connect(cluster)
      connections.push(connection); return connection
    }
    const beginCaller = async (connection: LocalPgConnection, jwt: unknown = claims(), isolation = 'read committed') => {
      await connection.query('begin isolation level ' + isolation)
      await connection.query('set local role authenticated')
      await connection.query("select set_config('request.jwt.claims',$1,true)", [pgText(JSON.stringify(jwt))])
    }
    const invoke = (connection: LocalPgConnection, operation: 'reserve' | 'recheck') =>
      connection.query('select public.official_truth_application_pilot_run_v1($1::jsonb) as result', [pgText(JSON.stringify(payload(operation)))])
    type Outcome = { rows?: PgRows; error?: unknown }
    const observed = (promise: Promise<PgRows>): Promise<Outcome> => promise.then(rows => ({ rows }), error => ({ error }))
    const assertCode = (outcome: Outcome, code: string) => {
      assert.ok(outcome.error instanceof LocalPgError, 'expected actual PostgreSQL error ' + code)
      assert.equal(outcome.error.code, code)
    }
    const until = async (check: () => Promise<boolean>, message: string, timeout = 2_500) => {
      const limit = performance.now() + timeout
      while (performance.now() < limit) {
        if (await check()) return
        await new Promise<void>(resolve => setTimeout(resolve, 15))
      }
      assert.fail(message)
    }
    try {
      // Synthetic managed-Auth fixture. R4 verified only column metadata, NOT
      // these FK/enum/owner/ACL semantics or real signed JWT authentication.
      sql(`create role anon nologin noinherit; create role authenticated nologin noinherit;
        create role service_role nologin noinherit bypassrls;
        create role postgres nologin noinherit bypassrls nosuperuser;
        create role candidate_authenticator login noinherit nosuperuser nobypassrls;
        grant authenticated to candidate_authenticator;
        create schema auth; revoke all on schema auth from public;
        grant usage on schema auth to authenticated,service_role,postgres;
        create type auth.aal_level as enum('aal1','aal2');
        create table auth.users(id uuid primary key,deleted_at timestamptz,banned_until timestamptz,is_anonymous boolean not null default false);
        create table auth.sessions(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,not_after timestamptz,aal auth.aal_level);
        create function auth.jwt() returns jsonb language sql stable set search_path=pg_catalog as $auth$
          select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $auth$;
        create function auth.uid() returns uuid language sql stable set search_path=pg_catalog as $auth$
          select nullif(auth.jwt()->>'sub','')::uuid $auth$;
        revoke all on function auth.jwt(),auth.uid() from public;
        grant execute on function auth.jwt(),auth.uid() to authenticated,service_role,postgres;
        create schema private; revoke all on schema private from public;
        create table public.profiles(user_id uuid primary key references auth.users(id) on delete cascade,role text not null,status text not null);
        alter table public.profiles enable row level security;
        create policy own_read on public.profiles for select to authenticated using(user_id=auth.uid());
        create policy own_update on public.profiles for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
        grant select,update on public.profiles to authenticated;`)
      const constraint = source(PROFILE).match(/alter table public\.profiles\s+add constraint profiles_status_check\s+check\s*\([\s\S]*?\);/)?.[0]
      assert.ok(constraint); sql(constraint)
      for (const target of definitions) sql(exactFunction(source(target.file), target.name, target.args))
      sql(`alter table public.profiles add constraint profiles_role_check check(public.rollenrang(role) is not null)`)
      for (const file of [ROLE, AAL, CAPABILITY]) {
        const start = file === ROLE ? 'revoke all on function public.rollenrang(text)' : file === AAL
          ? 'revoke all on function public.aktuelles_admin_aal2()' : 'revoke all on function public.darf_official_truth_freigeben()'
        const end = file === ROLE ? 'grant execute on function public.hat_rolle_mindestens(text) to authenticated, service_role;'
          : file === AAL ? 'grant execute on function public.aktuelles_admin_aal2() to authenticated, service_role;'
            : 'grant execute on function public.darf_official_truth_freigeben() to authenticated, service_role;'
        const body = source(file); const from = body.indexOf(start), to = body.indexOf(end, from)
        assert.ok(from >= 0 && to > from); sql(body.slice(from, to + end.length))
      }
      sql(exactFunction(source(TRIGGER), 'creator_profiles_rollenwechsel_pruefen'))
      sql(`alter function public.creator_profiles_rollenwechsel_pruefen() rename to profil_rollenwechsel_pruefen;
        create trigger profiles_rollenwechsel before insert or update on public.profiles for each row execute function public.profil_rollenwechsel_pruefen();`)
      for (const file of TRIP_INPUTS) sql(source(file))
      sql(source(PILOT))
      const originalRole = sql("select pg_get_functiondef('public.aktuelle_rolle()'::regprocedure)")
      const originalCapOwner = sql("select pg_get_userbyid(proowner) from pg_proc where oid='public.darf_official_truth_freigeben()'::regprocedure")
      reset(); sql(`update public.profiles set status='disabled' where user_id='${OWNER}'`)
      assert.equal(capability(), 'true', 'unchanged source must reproduce the known P1 before candidate')
      // Fixture-only privileges for non-superuser proposed function owner. No
      // candidate SQL grants these on any target. Actual target proof is open.
      sql(`grant usage on schema public,private to postgres;
        grant select on auth.users,auth.sessions,public.profiles,public.trips,private.official_truth_application_pilot_grants to postgres;
        grant update(id) on auth.users,auth.sessions,public.trips to postgres;
        grant update(user_id) on public.profiles to postgres;
        grant update(consumed_at) on private.official_truth_application_pilot_grants to postgres;
        grant execute on function public.rollenrang(text),public.aktuelle_rolle(),public.hat_rolle_mindestens(text),public.aktuelles_admin_aal2(),public.darf_official_truth_freigeben() to postgres;`)
      sql(candidate('authority')); sql(candidate('pilot'))
      assert.equal(capability(), 'false', 'candidate must reject the same disabled-owner claims')
      assert.equal(sql("select pg_get_functiondef('public.aktuelle_rolle()'::regprocedure)"), originalRole)
      t.diagnostic('OFFLINE corrected candidate executed against source-derived helpers/pilot; canonical source remains KNOWN P1. Synthetic claims are NOT signed JWT evidence.')

      await t.test('active own Owner succeeds; public invoker/owners/ACLs and direct-entry negatives', () => {
        reset(); assert.equal(capability(), 'true')
        assert.equal(JSON.parse(rpc()).id, GRANT); const used = consumed()
        assert.notEqual(used, 'UNCONSUMED'); assert.equal(rpc(), '')
        assert.equal(JSON.parse(rpc('recheck')).id, GRANT); assert.equal(consumed(), used)
        const meta = JSON.parse(sql(`select json_agg(json_build_object('name',n.nspname||'.'||p.proname,'owner',pg_get_userbyid(p.proowner),'definer',p.prosecdef,'volatility',p.provolatile,'parallel',p.proparallel,'config',p.proconfig) order by p.proname)
          from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.oid in ('public.darf_official_truth_freigeben()'::regprocedure,'public.official_truth_application_pilot_run_v1(jsonb)'::regprocedure,'jetnity_ot_auth.own_active_session_v1()'::regprocedure,'jetnity_ot_auth.require_current_owner_session_v1()'::regprocedure)`)) as { name: string; owner: string; definer: boolean; volatility: string; parallel: string; config: string[] }[]
        for (const entry of meta) {
          assert.equal(entry.parallel, 'u')
          assert.equal(entry.owner, entry.name === 'public.darf_official_truth_freigeben' ? originalCapOwner : 'postgres')
          assert.equal(entry.definer, entry.name !== 'public.darf_official_truth_freigeben')
          assert.equal(entry.volatility, entry.name.includes('require_current') || entry.name.includes('pilot_run') ? 'v' : 's')
          assert.ok(entry.config.includes(entry.name.includes('pilot_run') ? 'search_path=""' : 'search_path=pg_catalog'))
        }
        assert.ok(meta.find(entry => entry.name.includes('pilot_run'))!.config.includes('lock_timeout=3s'))
        assert.equal(sql(`select count(*) from pg_proc p cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
          where p.oid in ('public.darf_official_truth_freigeben()'::regprocedure,'public.official_truth_application_pilot_run_v1(jsonb)'::regprocedure,'jetnity_ot_auth.own_active_session_v1()'::regprocedure,'jetnity_ot_auth.require_current_owner_session_v1()'::regprocedure) and a.grantee=0 and a.privilege_type='EXECUTE'`), '0')
        assert.equal(sql("select rolsuper::text||','||rolcanlogin::text from pg_roles where rolname='postgres'"), 'false,false')
        for (const role of ['anon','authenticated','service_role']) {
          expectState(() => asRole('select * from auth.users', claims(), role), '42501')
          expectState(() => asRole('select * from auth.sessions', claims(), role), '42501')
          expectState(() => asRole('select * from private.official_truth_application_pilot_grants', claims(), role), '42501')
          expectState(() => asRole('select jetnity_ot_auth.require_current_owner_session_v1()', claims(), role), '42501')
          assert.equal(sql(`select has_schema_privilege('${role}','jetnity_ot_auth','CREATE')::text`), 'false')
        }
        expectState(() => capability(claims(), 'anon'), '42501')
        expectState(() => rpc('reserve', claims(), 'anon'), '42501')
        expectState(() => rpc('reserve', claims(), 'service_role'), '42501')
        assert.equal(capability({ role: 'service_role' }, 'service_role'), 'false')
        assert.equal(capability(claims({ role: 'service_role' }), 'service_role'), 'false')
        expectState(() => asRole(`select jetnity_ot_auth.own_active_session_v1('${OTHER}'::uuid)`), '42883')
        // SET ROLE checks session_user; a bootstrap-superuser connection would
        // make this escalation test vacuous even after SET ROLE authenticated.
        const restricted = (statement: string) => sql(`begin; set local role authenticated; ${statement}; commit;`, 'candidate_authenticator')
        assert.equal(restricted("select session_user::text||','||current_user::text"), 'candidate_authenticator,authenticated')
        expectState(() => restricted('set local role postgres'), '42501')
      })

      await t.test('same claims and full status/Auth/session negative matrix block capability and both RPC operations', () => {
        const invalidations = [
          ...['pending','disabled','banned'].map(status => `update public.profiles set status='${status}' where user_id='${OWNER}'`),
          ...['user','creator','moderator','operator','admin'].map(role => `update public.profiles set role='${role}' where user_id='${OWNER}'`),
          `delete from public.profiles where user_id='${OWNER}'`,
          `update auth.users set banned_until=clock_timestamp()+interval '1 day' where id='${OWNER}'`,
          `update auth.users set deleted_at=clock_timestamp() where id='${OWNER}'`,
          `update auth.users set is_anonymous=true where id='${OWNER}'`,
          `delete from auth.sessions where id='${SESSION}'`,
          `update auth.sessions set user_id='${OTHER}' where id='${SESSION}'`,
          `update auth.sessions set not_after=clock_timestamp()-interval '1 second' where id='${SESSION}'`,
          `update auth.sessions set aal='aal1' where id='${SESSION}'`,
          `update auth.sessions set aal=null where id='${SESSION}'`,
        ]
        for (const operation of ['reserve','recheck'] as const) for (const change of invalidations) {
          reset(operation === 'recheck'); const jwt = claims(), before = consumed()
          assert.equal(capability(jwt), 'true'); sql(change); assert.equal(capability(jwt), 'false', change)
          expectState(() => rpc(operation, jwt), '42501'); assert.equal(consumed(), before)
        }
        reset(); const same = claims(); assert.equal(capability(same), 'true')
        sql(`update public.profiles set status='disabled' where user_id='${OWNER}'`); assert.equal(capability(same), 'false')
        sql(`update public.profiles set status='active' where user_id='${OWNER}'`); assert.equal(capability(same), 'true')
        sql(`update auth.users set banned_until=clock_timestamp()-interval '1 second' where id='${OWNER}'`); assert.equal(capability(same), 'true')
        sql(`delete from auth.users where id='${OWNER}'`)
        assert.equal(capability(same), 'false'); expectState(() => rpc('reserve', same), '42501')
        assert.equal(sql(`select (select count(*) from auth.sessions where user_id='${OWNER}')+(select count(*) from public.profiles where user_id='${OWNER}')+(select count(*) from private.official_truth_application_pilot_grants where user_id='${OWNER}')`), '0')
      })

      await t.test('missing/malformed/foreign/expired claims and metadata cannot mint authority', () => {
        reset()
        const changes: Record<string, unknown>[] = [
          { sub: undefined }, { sub: MISSING }, { sub: ADMIN, session_id: FOREIGN_SESSION },
          { session_id: undefined }, { session_id: null }, { session_id: MISSING }, { session_id: FOREIGN_SESSION },
          { session_id: 'not-a-uuid' }, { session_id: [SESSION] },
          { aal: undefined }, { aal: 'aal1' }, { aal: 'unknown' }, { role: undefined }, { role: 'owner' },
          { exp: undefined }, { exp: null }, { exp: '9999999999' }, { exp: -1 }, { exp: 1.5 }, { exp: 0 },
          { exp: Math.floor(Date.now()/1000)-1 }, { exp: { value: 9999999999 } },
          { sub: ADMIN, user_metadata: { role: 'owner', status: 'active' }, app_metadata: { role: 'owner' } },
          { aal: 'aal1', user_metadata: { aal: 'aal2' }, app_metadata: { aal: 'aal2' } },
        ]
        for (const change of changes) {
          const jwt = claims(change); assert.equal(capability(jwt), 'false', JSON.stringify(change))
          expectState(() => rpc('reserve', jwt), '42501'); assert.equal(consumed(), 'UNCONSUMED')
        }
        // Non-vacuous metadata elevation: the downgraded account STILL owns
        // this valid AAL2 session; no foreign-session failure explains denial.
        sql(`update public.profiles set role='admin' where user_id='${OWNER}'`)
        const promotedMetadata = claims({ user_metadata: { role: 'owner' }, app_metadata: { role: 'owner' } })
        assert.equal(capability(promotedMetadata), 'false')
        expectState(() => rpc('reserve', promotedMetadata), '42501')
        assert.equal(consumed(), 'UNCONSUMED')
        reset()
        expectState(() => capability(claims({ sub: 'not-a-uuid' })), '22P02')
        expectState(() => rpc('reserve', claims({ sub: 'not-a-uuid' })), '22P02')
        expectState(() => sql(`update public.profiles set status=null where user_id='${OWNER}'`), '23502')
        expectState(() => sql(`update public.profiles set status='unknown' where user_id='${OWNER}'`), '23514')
      })

      await t.test('real profile trigger is reachable and rejects self-reactivation/self-promotion', () => {
        reset(); sql(`update public.profiles set status='disabled' where user_id='${OWNER}'`)
        assert.equal(asRole(`update public.profiles set status=status where user_id='${OWNER}' returning status`), 'disabled')
        expectState(() => asRole(`update public.profiles set status='active' where user_id='${OWNER}'`), '23514')
        assert.equal(sql(`select status from public.profiles where user_id='${OWNER}'`), 'disabled')
        assert.equal(capability(), 'false')
        expectState(() => asRole(`update public.profiles set role='user' where user_id='${OWNER}'`), '23514')
        assert.equal(asRole(`create temporary table profiles(user_id uuid,role text,status text);
          insert into profiles values('${OWNER}','owner','active'); set local search_path=pg_temp,public;
          select public.darf_official_truth_freigeben()::text`), 'false')
      })

      await t.test('real owner ACL/schema errors propagate and consume no grant', () => {
        reset(); sql('revoke select on auth.users from postgres')
        try {
          expectState(() => capability(), '42501'); expectState(() => rpc(), '42501')
          assert.equal(consumed(), 'UNCONSUMED')
        } finally { sql('grant select on auth.users to postgres') }
        sql('alter table auth.sessions rename to sessions_unavailable')
        try {
          expectState(() => capability(), '42P01'); expectState(() => rpc(), '42P01')
          assert.equal(consumed(), 'UNCONSUMED')
        } finally { sql('alter table auth.sessions_unavailable rename to sessions') }
        assert.equal(capability(), 'true')
      })

      const [locker, caller, observer] = await Promise.all([connect(), connect(), connect()])
      const pid = async (connection: LocalPgConnection) => Number((await connection.query('select pg_backend_pid() as pid'))[0]!.pid)
      const lockerPid = await pid(locker), callerPid = await pid(caller), observerPid = await pid(observer)
      const isBlocked = async (watcher: LocalPgConnection, waiting: number, blocker: number) =>
        (await watcher.query(`select ($1::integer=any(pg_blocking_pids($2::integer)) and exists(
          select 1 from pg_stat_activity where pid=$2::integer and state='active' and wait_event_type='Lock'))::text as blocked`,
        [pgText(String(blocker)), pgText(String(waiting))]))[0]!.blocked === 'true'
      const rollback = (connection: LocalPgConnection) => connection.query('rollback').catch(() => [])
      const blockedGrant = async (operation: 'reserve' | 'recheck',
        change: (connection: LocalPgConnection) => Promise<unknown>, expected: '42501' | null,
        prepare: () => unknown = () => undefined, jwtFactory: () => unknown = claims) => {
        reset(operation === 'recheck'); prepare()
        const jwt = jwtFactory(), before = consumed()
        await locker.query('begin')
        await locker.query(`select id from private.official_truth_application_pilot_grants where id='${GRANT}' for update`)
        await beginCaller(caller, jwt)
        const pending = observed(invoke(caller, operation))
        try {
          // The actual RPC has passed its precheck and is waiting on the exact
          // grant held by locker; elapsed time/Promise.all alone is not proof.
          await until(() => isBlocked(observer, callerPid, lockerPid), 'pilot did not reach observed grant wait')
          await change(observer)
          await locker.query('commit')
          const outcome = await pending
          if (expected) { assertCode(outcome, expected); await rollback(caller) }
          else {
            assert.equal(outcome.error, undefined); assert.equal(outcome.rows?.[0]?.result, null)
            // A successful NULL-return transaction must COMMIT: rolling it
            // back here would hide an erroneous consumed-then-return-NULL write.
            await caller.query('commit')
          }
          assert.equal(consumed(), before, 'revocation/staleness must not consume or change the grant')
        } finally {
          await rollback(locker); await pending; await rollback(caller)
        }
      }

      for (const operation of ['reserve','recheck'] as const) {
        for (const [label, mutation] of [
          ['profile disabled', `update public.profiles set status='disabled' where user_id='${OWNER}'`],
          ['session revoked', `delete from auth.sessions where id='${SESSION}'`],
          ['Auth user banned', `update auth.users set banned_until=clock_timestamp()+interval '1 day' where id='${OWNER}'`],
        ]) {
          await t.test(operation + ': observed grant wait then committed ' + label + ' rejects', async () => {
            await blockedGrant(operation, connection => connection.query(mutation!), '42501')
          })
        }
        await t.test(operation + ': session not_after expires during observed grant wait', async () => {
          await blockedGrant(operation, async connection => {
            await connection.query(`update auth.sessions set not_after=clock_timestamp()+interval '120 milliseconds' where id='${SESSION}'`)
            await until(async () => (await connection.query(`select (clock_timestamp()>=not_after)::text as expired from auth.sessions where id='${SESSION}'`))[0]!.expired === 'true', 'session did not reach expiry')
          }, '42501')
        })
        await t.test(operation + ': numeric JWT exp expires during observed grant wait', async () => {
          let expires = 0
          await blockedGrant(operation, async connection => {
            await until(async () => (await connection.query('select (extract(epoch from clock_timestamp()) >= $1::numeric)::text as expired',
              [pgText(String(expires))]))[0]!.expired === 'true', 'JWT fixture did not reach expiry')
          }, '42501', () => undefined, () => {
            expires = Number(sql('select floor(extract(epoch from clock_timestamp()))+2'))
            return claims({ exp: expires })
          })
        })
        for (const [label, mutation] of [
          ['trip revision', `update public.trips set revision=revision+1 where id='${TRIP}'`],
          ['trip owner', `update public.trips set user_id='${OTHER}' where id='${TRIP}'`],
        ]) {
          await t.test(operation + ': ' + label + ' changed while waiting returns no result', async () => {
            await blockedGrant(operation, connection => connection.query(mutation!), null)
          })
        }
        await t.test(operation + ': grant expiry is checked after observed wait', async () => {
          await blockedGrant(operation, async connection => {
            assert.equal((await connection.query(`select (clock_timestamp()<expires_at)::text as live from private.official_truth_application_pilot_grants where id='${GRANT}'`))[0]!.live, 'true',
              'grant must still be valid AFTER the wait has actually been observed')
            await until(async () => (await connection.query(`select (clock_timestamp()>=expires_at)::text as expired from private.official_truth_application_pilot_grants where id='${GRANT}'`))[0]!.expired === 'true', 'grant did not reach expiry')
          }, null, () => sql(`update private.official_truth_application_pilot_grants set expires_at=clock_timestamp()+interval '1500 milliseconds' where id='${GRANT}'`))
        })
      }

      await t.test('non-key account/session/profile/trip changes conflict with FOR SHARE and fail closed NOWAIT', async () => {
        for (const mutation of [
          `update auth.users set banned_until=clock_timestamp()+interval '1 day' where id='${OWNER}'`,
          `update auth.sessions set not_after=clock_timestamp()-interval '1 second' where id='${SESSION}'`,
          `update public.profiles set status='disabled' where user_id='${OWNER}'`,
          `update public.trips set revision=revision+1 where id='${TRIP}'`,
        ]) {
          reset(); await locker.query('begin'); await locker.query(mutation)
          try {
            // The uncommitted change is invisible to the initial Boolean, but
            // its non-key row lock must block a weaker KEY SHARE implementation.
            assert.equal(capability(), 'true')
            expectState(() => rpc(), '55P03')
          } finally { await rollback(locker) }
          assert.equal(consumed(), 'UNCONSUMED')
        }
      })

      await t.test('grant wait has a real bounded lock timeout and consumes nothing', async () => {
        reset(); await locker.query('begin')
        await locker.query(`select id from private.official_truth_application_pilot_grants where id='${GRANT}' for update`)
        await beginCaller(caller)
        const pending = observed(invoke(caller, 'reserve'))
        try {
          await until(() => isBlocked(observer, callerPid, lockerPid), 'bounded wait was not observed')
          assertCode(await pending, '55P03')
        } finally { await rollback(locker); await pending; await rollback(caller) }
        assert.equal(consumed(), 'UNCONSUMED')
      })

      await t.test('Auth-delete FK cascade inversion aborts the actual RPC instead of deadlocking', async () => {
        reset()
        // Coordinator prelocks the real grant before SET ROLE solely to force
        // the small post-grant/pre-guard interval without modifying the RPC.
        await caller.query('begin')
        await caller.query(`select id from private.official_truth_application_pilot_grants where id='${GRANT}' for update`)
        await caller.query('set local role authenticated')
        await caller.query("select set_config('request.jwt.claims',$1,true)", [pgText(JSON.stringify(claims()))])
        await locker.query('begin')
        const deleting = observed(locker.query(`delete from auth.users where id='${OWNER}'`))
        try {
          await until(() => isBlocked(observer, lockerPid, callerPid), 'Auth-delete cascade did not reach owned grant lock')
          assertCode(await observed(invoke(caller, 'reserve')), '55P03')
          await rollback(caller)
          const deletion = await deleting; assert.equal(deletion.error, undefined)
          await locker.query('commit')
          assert.equal(sql(`select count(*) from auth.users where id='${OWNER}'`), '0')
          assert.equal(sql(`select count(*) from private.official_truth_application_pilot_grants where id='${GRANT}'`), '0')
        } finally { await rollback(caller); await deleting; await rollback(locker) }
      })

      for (const isolation of ['repeatable read','serializable']) {
        await t.test(isolation + ': a stale snapshot fails with serialization error', async () => {
          reset(); await beginCaller(caller, claims(), isolation)
          assert.equal((await caller.query('select public.darf_official_truth_freigeben()::text as allowed'))[0]!.allowed, 'true')
          await observer.query(`update public.profiles set status='disabled' where user_id='${OWNER}'`)
          try { assertCode(await observed(invoke(caller, 'reserve')), '40001') }
          finally { await rollback(caller) }
          assert.equal(consumed(), 'UNCONSUMED')
        })
      }

      await t.test('authority locks survive RPC return until transaction end; later revocation serializes after it', async () => {
        reset(); await beginCaller(caller)
        const accepted = await invoke(caller, 'reserve')
        assert.equal(JSON.parse(accepted[0]!.result!).id, GRANT)
        await locker.query('begin')
        const disabling = observed(locker.query(`update public.profiles set status='disabled' where user_id='${OWNER}'`))
        try {
          await until(() => isBlocked(observer, lockerPid, callerPid), 'post-RPC profile lock did not protect its transaction')
          await caller.query('commit')
          const changed = await disabling; assert.equal(changed.error, undefined)
          await locker.query('commit')
          assert.notEqual(consumed(), 'UNCONSUMED')
          assert.equal(capability(), 'false')
          expectState(() => rpc('recheck'), '42501')
        } finally { await rollback(caller); await disabling; await rollback(locker) }
      })
      assert.ok(observerPid > 0)
      t.diagnostic('Native corrected-candidate status/session/ACL and observed multi-connection wait/expiry/cascade/serialization matrix executed; no hosted deployment or real JWT proof.')

    } finally {
      for (const connection of connections) connection.close()
      cluster.stop()
    }
  })

