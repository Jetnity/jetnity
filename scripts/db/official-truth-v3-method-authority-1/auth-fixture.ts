// Synthetic native prerequisites only. Never a hosted Auth or signed-JWT proof.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { LocalPgConnection } from '../official-truth-integrated-pilot-1/pg-wire'

export const MA1_AUTH = Object.freeze({
  owner: '11111111-1111-4111-8111-111111111111', other: '22222222-2222-4222-8222-222222222222',
  session: '55555555-5555-4555-8555-555555555555', foreignSession: '66666666-6666-4666-8666-666666666666',
  humanLogin: 'ot_ma1_human', readerLogin: 'ot_ma1_reader', alien: 'ot_ma1_alien',
})
const pins = Object.freeze({
  '20260817100000_rollenmodell.sql': 'f25bf22fe955c28724a19c4984bec3669550c3a353ca6808b43d83d5962a804a',
  '20260817120300_generisches_profil.sql': 'd533f7040466e6aaee051a75099b05e0218139464311eb13aeb3739aebc91da6',
  '20260827170000_admin_aal2_data_plane_alignment.sql': 'ac4faa87bf994a1fcbad2212384cb2308695820b63a57dc41ee9a763515ad934',
  '20261002154952_official_truth_owner_reviewer_capability_1.sql': '635151c127efde6e2953cc14c68e81ecccf10dba545329fe46c09dcdf50996a2',
})
const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')
function source(file: keyof typeof pins): string {
  const bytes = readFileSync(new URL('../../../supabase/migrations/' + file, import.meta.url))
  assert.equal(digest(bytes), pins[file], 'source prerequisite drift requires explicit review')
  return bytes.toString('utf8')
}
function exactFunction(sql: string, name: string, args = ''): string {
  const marker = 'create or replace function public.' + name + '(' + args + ')'
  const start = sql.indexOf(marker)
  assert.ok(start >= 0, 'missing exact function')
  assert.equal(sql.indexOf(marker, start + marker.length), -1, 'ambiguous exact function')
  const delimiter = sql.indexOf('as $$', start), end = sql.indexOf('$$;', delimiter + 5)
  assert.ok(delimiter > start && end > delimiter)
  return sql.slice(start, end + 3)
}

export function ma1Claims(changes: Readonly<Record<string, unknown>> = {}): Readonly<Record<string, unknown>> {
  return Object.freeze({ sub: MA1_AUTH.owner, role: 'authenticated', aal: 'aal2', session_id: MA1_AUTH.session,
    exp: Math.floor(Date.now() / 1000) + 300, ...changes })
}

export async function resetMa1Humans(owner: LocalPgConnection): Promise<void> {
  // Test-owned fixture rows only. MA1 history intentionally has no Auth FK/cascade.
  await owner.query(`TRUNCATE auth.users CASCADE;
    INSERT INTO auth.users(id) VALUES('${MA1_AUTH.owner}'),('${MA1_AUTH.other}');
    INSERT INTO public.profiles(user_id,role,status) VALUES('${MA1_AUTH.owner}','owner','active'),('${MA1_AUTH.other}','owner','active');
    INSERT INTO auth.sessions(id,user_id,aal) VALUES('${MA1_AUTH.session}','${MA1_AUTH.owner}','aal2'),('${MA1_AUTH.foreignSession}','${MA1_AUTH.other}','aal2');`)
}

export async function installMa1AuthFixture(owner: LocalPgConnection): Promise<void> {
  const role = source('20260817100000_rollenmodell.sql'), profile = source('20260817120300_generisches_profil.sql')
  const aal = source('20260827170000_admin_aal2_data_plane_alignment.sql')
  const capability = source('20261002154952_official_truth_owner_reviewer_capability_1.sql')
  const candidate = readFileSync(new URL('../official-truth-owner-session-candidate-1/authority-candidate.sql', import.meta.url))
  assert.equal(digest(candidate), '169c6b02c2776ac163590b1cd6ffb6d43133621c9dc9e31b687f083d2ab4aa50')
  await owner.query(`CREATE ROLE anon NOLOGIN NOINHERIT;
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
    CREATE ROLE postgres NOLOGIN NOINHERIT NOSUPERUSER BYPASSRLS;
    CREATE ROLE ${MA1_AUTH.humanLogin} LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;
    CREATE ROLE ${MA1_AUTH.readerLogin} LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;
    CREATE ROLE ${MA1_AUTH.alien} NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS;
    GRANT authenticated TO ${MA1_AUTH.humanLogin};
    CREATE SCHEMA auth;
    CREATE TYPE auth.aal_level AS ENUM('aal1','aal2','aal3');
    CREATE TABLE auth.users(id uuid PRIMARY KEY,deleted_at timestamptz,banned_until timestamptz,is_anonymous boolean NOT NULL DEFAULT false);
    CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,aal auth.aal_level,not_after timestamptz);
    CREATE TABLE public.profiles(user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,role text NOT NULL,status text NOT NULL);
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
      SELECT COALESCE(NULLIF(pg_catalog.current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
      SELECT NULLIF(auth.jwt()->>'sub','')::uuid $$;
    REVOKE ALL ON FUNCTION auth.jwt(),auth.uid() FROM PUBLIC;
    GRANT USAGE ON SCHEMA auth TO authenticated,service_role,postgres;
    GRANT EXECUTE ON FUNCTION auth.jwt(),auth.uid() TO authenticated,service_role,postgres;
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY ma1_own_profile ON public.profiles FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
    GRANT SELECT ON public.profiles TO authenticated;`)
  for (const statement of [exactFunction(role, 'rollenrang', 'rolle text'), exactFunction(profile, 'aktuelle_rolle'),
    exactFunction(role, 'hat_rolle_mindestens', 'minimum text'), exactFunction(aal, 'aktuelles_admin_aal2'),
    exactFunction(capability, 'darf_official_truth_freigeben')]) await owner.query(statement)
  await owner.query(`REVOKE ALL ON FUNCTION public.rollenrang(text),public.aktuelle_rolle(),public.hat_rolle_mindestens(text),
    public.aktuelles_admin_aal2(),public.darf_official_truth_freigeben() FROM PUBLIC,anon;
    GRANT EXECUTE ON FUNCTION public.rollenrang(text),public.aktuelle_rolle(),public.hat_rolle_mindestens(text),
    public.aktuelles_admin_aal2(),public.darf_official_truth_freigeben() TO authenticated,service_role,postgres;
    GRANT USAGE ON SCHEMA public TO postgres;
    GRANT SELECT ON auth.users,auth.sessions,public.profiles TO postgres;
    GRANT UPDATE(id) ON auth.users,auth.sessions TO postgres;
    GRANT UPDATE(user_id) ON public.profiles TO postgres;`)
  await owner.query(candidate.toString('utf8'))
  await resetMa1Humans(owner)
}
