// Isolated native proof only. No hosted Auth, JWT verification or live CMS claim.
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { ENTDECKEN_ZIELE } from '../../../lib/inspiration/explorer-1/katalog'
import { INSPIRATION_ZIELE } from '../../../lib/places/inspiration'
import { OwnedTestLifetime } from '../official-truth-atomic-version-refresh-1/test-lifetime'
import { assertLocalProofEnvironment, startLocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgText, type PgParameter } from '../official-truth-integrated-pilot-1/pg-wire'

export const CMS_TASK_COMMIT = '56037fb4d1c45f9419d3ef720b2b5a52cfda4532'
export const CMS_ACTOR = '11111111-1111-4111-8111-111111111111'
export const CMS_OTHER_ACTOR = '22222222-2222-4222-8222-222222222222'
export const CMS_MISSING_ACTOR = '33333333-3333-4333-8333-333333333333'
const LOGIN = 'cms_native_authenticator'
export const CMS_ENTRIES = INSPIRATION_ZIELE.map((entry) => entry.placeId)
export const CMS_TABLES = ['inspiration_entries_v1', 'inspiration_revisions_v1', 'inspiration_operations_v1'] as const
export type CmsJson = Record<string, unknown>
export type CmsRole = 'anon' | 'authenticated' | 'service_role' | null
export type CmsCommand = { requestId: string; entryId: string; expectedVersion: string; action: string; payload: unknown }

const prerequisites = {
  '20260817100000_rollenmodell.sql': 'f25bf22fe955c28724a19c4984bec3669550c3a353ca6808b43d83d5962a804a',
  '20260817120300_generisches_profil.sql': 'd533f7040466e6aaee051a75099b05e0218139464311eb13aeb3739aebc91da6',
  '20260827170000_admin_aal2_data_plane_alignment.sql': 'ac4faa87bf994a1fcbad2212384cb2308695820b63a57dc41ee9a763515ad934',
} as const
const digest = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex')

function migration(file: keyof typeof prerequisites): string {
  const bytes = readFileSync(new URL('../../../supabase/migrations/' + file, import.meta.url))
  assert.equal(digest(bytes), prerequisites[file], 'canonical authority source drift requires review')
  return bytes.toString('utf8')
}

function exactFunction(source: string, name: string, args = '') {
  const marker = `create or replace function public.${name}(${args})`
  const begin = source.indexOf(marker)
  assert.ok(begin >= 0, `missing canonical function ${name}`)
  assert.equal(source.indexOf(marker, begin + marker.length), -1, `ambiguous canonical function ${name}`)
  const delimiter = source.indexOf('as $$', begin)
  const end = source.indexOf('$$;', delimiter + 5)
  assert.ok(delimiter > begin && end > delimiter)
  return { name, sql: source.slice(begin, end + 3), body: source.slice(delimiter + 5, end) }
}

export function asObject(value: unknown): CmsJson {
  assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value), 'expected JSON object')
  return value as CmsJson
}

export async function jsonQuery(connection: LocalPgConnection, sql: string, parameters: readonly PgParameter[] = []): Promise<CmsJson> {
  const rows = await connection.query(sql, parameters)
  assert.equal(rows.length, 1)
  assert.equal(typeof rows[0]?.result, 'string')
  return asObject(JSON.parse(rows[0]!.result!))
}

export function cmsClaims(changes: Readonly<Record<string, unknown>> = {}): CmsJson {
  return { sub: CMS_ACTOR, role: 'authenticated', aal: 'aal2', ...changes }
}

export function cmsPayload(index = 0): CmsJson {
  const entry = ENTDECKEN_ZIELE[index]
  assert.ok(entry)
  return { beschreibung: entry.beschreibung, idea: entry.idea, themen: [...entry.themen] }
}

export function cmsContent(index = 0, payload = cmsPayload(index)): CmsJson {
  const entry = INSPIRATION_ZIELE[index]
  assert.ok(entry)
  return { entryId: entry.placeId, locale: 'de', name: entry.name, country: entry.country, image: entry.image, ...payload }
}

export function cmsCommand(changes: Partial<CmsCommand> = {}): CmsCommand {
  return { requestId: randomUUID(), entryId: CMS_ENTRIES[0]!, expectedVersion: '0', action: 'save_draft', payload: cmsPayload(), ...changes }
}

export function command(connection: LocalPgConnection, input: CmsCommand): Promise<CmsJson> {
  return jsonQuery(connection, 'SELECT public.admin_cms_inspiration_command_v1($1::pg_catalog.uuid,$2::pg_catalog.text,$3::pg_catalog.int8,$4::pg_catalog.text,$5::pg_catalog.jsonb) AS result', [
    pgText(input.requestId, 2950), pgText(input.entryId), pgText(input.expectedVersion, 20), pgText(input.action),
    pgText(JSON.stringify(input.payload), 3802),
  ])
}

export function readEntry(connection: LocalPgConnection, entryId: string = CMS_ENTRIES[0]!, revision: string | null = null,
  before: string | null = null, limit = 20): Promise<CmsJson> {
  return jsonQuery(connection, 'SELECT public.admin_cms_inspiration_read_v1($1::pg_catalog.text,NULLIF($2::pg_catalog.text,\'\')::pg_catalog.int8,NULLIF($3::pg_catalog.text,\'\')::pg_catalog.int8,$4::pg_catalog.int4) AS result',
    [pgText(entryId), pgText(revision ?? ''), pgText(before ?? ''), pgText(String(limit), 23)])
}

export function confirm(connection: LocalPgConnection, requestId: string): Promise<CmsJson> {
  return jsonQuery(connection, 'SELECT public.admin_cms_inspiration_confirm_v1($1::pg_catalog.uuid) AS result', [pgText(requestId, 2950)])
}

export function published(connection: LocalPgConnection): Promise<CmsJson> {
  return jsonQuery(connection, 'SELECT public.cms_inspiration_published_v1() AS result')
}

export async function rejectSql(operation: () => Promise<unknown>, code: string): Promise<void> {
  await assert.rejects(operation, (error: unknown) => error instanceof LocalPgError && error.code === code,
    `expected actual PostgreSQL SQLSTATE ${code}`)
}

export async function snapshot(owner: LocalPgConnection): Promise<unknown> {
  const rows = await owner.query(CMS_TABLES.map((table) =>
    `SELECT '${table}' AS relation,coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb)::text AS contents FROM jetnity_cms_private.${table} t`,
  ).join(' UNION ALL ') + ' ORDER BY relation')
  return rows.map((row) => ({ relation: row.relation, contents: JSON.parse(row.contents!) }))
}

export async function resetActors(owner: LocalPgConnection): Promise<void> {
  await owner.query(`INSERT INTO auth.users(id,deleted_at,is_anonymous) VALUES
    ('${CMS_ACTOR}',NULL,false),('${CMS_OTHER_ACTOR}',NULL,false)
    ON CONFLICT(id) DO UPDATE SET deleted_at=NULL,is_anonymous=false;
    INSERT INTO public.profiles(user_id,role,status) VALUES
    ('${CMS_ACTOR}','owner','active'),('${CMS_OTHER_ACTOR}','admin','active')
    ON CONFLICT(user_id) DO UPDATE SET role=excluded.role,status=excluded.status;`)
}

export async function createCmsFixture(lifetime: OwnedTestLifetime) {
  assertLocalProofEnvironment()
  assert.ok(!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'native CMS proof must not receive a hosted public configuration')
  const role = migration('20260817100000_rollenmodell.sql')
  const profile = migration('20260817120300_generisches_profil.sql')
  const aal = migration('20260827170000_admin_aal2_data_plane_alignment.sql')
  const authority = [exactFunction(role, 'rollenrang', 'rolle text'), exactFunction(profile, 'aktuelle_rolle'),
    exactFunction(role, 'hat_rolle_mindestens', 'minimum text'), exactFunction(aal, 'aktuelles_admin_aal2'),
    exactFunction(aal, 'darf_inhalte_moderieren')]
  const sources = ['schema-candidate.sql', 'functions-candidate.sql'].map((name) => {
    const sql = readFileSync(new URL('./' + name, import.meta.url), 'utf8')
    return { name, sql, sha256: digest(sql) }
  })
  const cluster = lifetime.startCluster(startLocalProofCluster)
  assert.match(cluster.version, /^postgres \(PostgreSQL\) 17\./, 'actual PostgreSQL 17 is mandatory; no fallback or skip')
  const owner = await LocalPgConnection.connect(cluster)
  await owner.query(`CREATE ROLE postgres NOLOGIN NOINHERIT NOSUPERUSER BYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
    CREATE ROLE anon NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS;
    CREATE ROLE authenticated NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS;
    CREATE ROLE service_role NOLOGIN NOINHERIT NOSUPERUSER BYPASSRLS;
    CREATE ROLE ${LOGIN} LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
    GRANT anon,authenticated,service_role TO ${LOGIN};
    GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role,postgres;
    GRANT CREATE ON SCHEMA public TO postgres;
    GRANT CREATE ON DATABASE postgres TO postgres;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,deleted_at timestamptz,is_anonymous boolean NOT NULL DEFAULT false);
    CREATE TABLE public.profiles(user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,role text NOT NULL,status text NOT NULL);
    ALTER TABLE public.profiles OWNER TO postgres;
    -- Synthetic claim primitives, not the real hosted Auth implementation.
    -- Explicit catalog types keep the adversarial temp-domain test focused on
    -- candidate functions instead of accidentally testing a fixture cast.
    CREATE FUNCTION auth.jwt() RETURNS pg_catalog.jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $$
      SELECT coalesce(nullif(pg_catalog.current_setting('request.jwt.claims',true),''),'{}')::pg_catalog.jsonb $$;
    CREATE FUNCTION auth.uid() RETURNS pg_catalog.uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $$
      SELECT nullif(auth.jwt()->>'sub','')::pg_catalog.uuid $$;
    REVOKE ALL ON FUNCTION auth.jwt(),auth.uid() FROM PUBLIC;
    GRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role,postgres;
    GRANT EXECUTE ON FUNCTION auth.jwt(),auth.uid() TO anon,authenticated,service_role,postgres;
    GRANT SELECT,UPDATE(id) ON auth.users TO postgres;
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY cms_native_own_profile ON public.profiles FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
    GRANT SELECT ON public.profiles TO authenticated;
    -- Reproduce the existing public service-role defaults so explicit candidate
    -- revocation is tested even against inherited installation privileges.
    ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;
    ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
    ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;`)
  for (const definition of authority) await owner.query(definition.sql)
  await owner.query(`ALTER FUNCTION public.rollenrang(text) OWNER TO postgres;
    ALTER FUNCTION public.aktuelle_rolle() OWNER TO postgres;
    ALTER FUNCTION public.hat_rolle_mindestens(text) OWNER TO postgres;
    ALTER FUNCTION public.aktuelles_admin_aal2() OWNER TO postgres;
    ALTER FUNCTION public.darf_inhalte_moderieren() OWNER TO postgres;
    REVOKE ALL ON FUNCTION public.rollenrang(text),public.aktuelle_rolle(),public.hat_rolle_mindestens(text),
      public.aktuelles_admin_aal2(),public.darf_inhalte_moderieren() FROM PUBLIC,anon;
    GRANT EXECUTE ON FUNCTION public.rollenrang(text),public.aktuelle_rolle(),public.hat_rolle_mindestens(text),
      public.aktuelles_admin_aal2(),public.darf_inhalte_moderieren() TO authenticated,service_role;`)
  await resetActors(owner)
  // Both candidate files are actually committed as their production owner;
  // neither candidate is allowed to hide a second transaction boundary.
  await owner.query('BEGIN; SET LOCAL ROLE postgres;\n' + sources.map((source) => source.sql).join('\n') + '\nCOMMIT;')
  for (const definition of authority) {
    const rows = await owner.query('SELECT p.prosrc,r.rolname AS owner FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_roles r ON r.oid=p.proowner WHERE n.nspname=\'public\' AND p.proname=$1::text', [pgText(definition.name)])
    assert.equal(rows.length, 1)
    assert.equal(rows[0]!.prosrc, definition.body, 'candidate must retain actual canonical authority implementation')
    assert.equal(rows[0]!.owner, 'postgres')
  }
  const connect = async (databaseRole: CmsRole = 'authenticated', claims = cmsClaims()) => {
    lifetime.check()
    const connection = await LocalPgConnection.connect(cluster, LOGIN)
    if (databaseRole !== null) {
      assert.ok(['anon', 'authenticated', 'service_role'].includes(databaseRole))
      await connection.query('SET ROLE ' + databaseRole)
    }
    await connection.query('SELECT pg_catalog.set_config(\'request.jwt.claims\',$1::pg_catalog.text,false)', [pgText(JSON.stringify(claims))])
    return connection
  }
  return { cluster, owner, connect, sources: sources.map(({ name, sha256 }) => ({ name, sha256 })) }
}

export type CmsFixture = Awaited<ReturnType<typeof createCmsFixture>>

export async function identify(fixture: CmsFixture, connection: LocalPgConnection) {
  const pid = (await connection.query('SELECT pg_backend_pid()::text AS pid'))[0]?.pid
  assert.match(pid ?? '', /^[1-9][0-9]*$/)
  const birth = (await fixture.owner.query('SELECT backend_start::text AS birth FROM pg_stat_activity WHERE pid=$1::integer', [pgText(pid!, 23)]))[0]?.birth
  assert.ok(birth)
  return { pid: pid!, birth }
}

export async function waitBlocked(fixture: CmsFixture, lifetime: OwnedTestLifetime, waiter: { pid: string; birth: string },
  holder: { pid: string; birth: string }, pending: () => boolean): Promise<void> {
  const until = performance.now() + 3_000
  while (performance.now() < until) {
    const rows = await fixture.owner.query(`SELECT a.state,a.wait_event_type,
      ($3::integer=ANY(pg_blocking_pids(a.pid)))::text AS blocked_by_holder,
      EXISTS(SELECT 1 FROM pg_locks l WHERE l.pid=a.pid AND NOT l.granted)::text AS ungranted
      FROM pg_stat_activity a WHERE a.pid=$1::integer AND a.backend_start=$2::timestamptz
      AND EXISTS(SELECT 1 FROM pg_stat_activity h WHERE h.pid=$3::integer AND h.backend_start=$4::timestamptz)`,
    [pgText(waiter.pid, 23), pgText(waiter.birth), pgText(holder.pid, 23), pgText(holder.birth)])
    if (rows[0]?.state === 'active' && rows[0].wait_event_type === 'Lock'
      && rows[0].blocked_by_holder === 'true' && rows[0].ungranted === 'true') {
      assert.equal(pending(), true, 'caller must still be waiting when revocation or commit is applied')
      return
    }
    assert.equal(pending(), true, 'caller ended before the required database wait was observed')
    await lifetime.wait(15)
  }
  assert.fail('no actual PostgreSQL lock wait observed for the exact owned backend identities')
}
