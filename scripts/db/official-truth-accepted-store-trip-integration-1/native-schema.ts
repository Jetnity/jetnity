/** Disposable native infrastructure, never a hosted schema/privilege claim. */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { findLocalPgBins,type LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { sourceAnchors } from './source-anchors'

export const quote=(v:string)=>`'${v.replaceAll("'","''")}'`
export function nativeSql(cluster:LocalProofCluster) {
  const bins=findLocalPgBins();assert(bins,'native PostgreSQL is REQUIRED, never skipped')
  return (statement:string)=>execFileSync(bins.psql,['-X','--no-psqlrc','-Atq','-h',cluster.socket,'-p',String(cluster.port),'-U',cluster.user,
    '-d',cluster.database,'-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose'],{input:statement,encoding:'utf8',stdio:'pipe',timeout:45_000,maxBuffer:24*1024*1024}).trim()
}
const pinnedSource=(path:string)=>{
  const body=readFileSync(path),expected=sourceAnchors[path]
  assert(expected,`unreviewed schema source ${path}`)
  assert.equal(createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex'),expected,`schema drift ${path}`)
  return body.toString('utf8')
}
const source=(name:string)=>pinnedSource(`supabase/migrations/${name}`)
function definition(file:string,name:string,args='') {
  const text=source(file),mark=`create or replace function public.${name}(${args})`,start=text.indexOf(mark)
  assert(start>=0&&text.indexOf(mark,start+1)<0)
  const delimiter=text.indexOf('as $$',start),end=text.indexOf('$$;',delimiter+5)
  assert(delimiter>start&&end>delimiter);return text.slice(start,end+3)
}

const tripSources=[
  '20260817120000_reiseschema.sql','20260820010000_reise_stage_revision.sql','20260820060000_reise_graph_revision.sql',
  '20260820070000_reise_trips_revision.sql','20260820080000_reise_tage_eindeutig_aufgeschoben.sql','20260820120000_places_referenz.sql','20260821100000_trip_items_booking_status.sql',
  '20260821120000_trip_items_mobility.sql','20260821200000_trip_items_rental_car.sql','20260822010000_trip_readiness_items.sql',
  '20260822020000_trip_travellers.sql','20260822160000_traveller_context_intelligence.sql','20260822170000_traveller_context_fk_delete.sql',
  '20260822180000_traveller_context_rereview.sql','20260826220000_trip_day_stage_assignment_source.sql',
  '20260826230000_trip_day_stage_assignment_source_fail_closed.sql','20260826240000_trip_day_stage_assignment_mode.sql',
  '20260828015304_traveller_write_contract_integrity.sql','20260829201500_account_traveller_registry_persistence.sql',
  '20260927230000_reise_graph_kaskade_tiefe.sql',
]
const evidenceSources=[
  '20261001121258_official_truth_private_evidence_store_schema_1.sql','20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql',
  '20261001180549_official_truth_trusted_store_writer_1.sql','20261001193748_official_truth_source_catalog_gateway_1.sql',
  '20261002154952_official_truth_owner_reviewer_capability_1.sql','20261004010705_official_truth_content_identity_2.sql',
  '20261004223959_official_truth_v2_catalog_hardening_1.sql','20261010180000_official_truth_source_fingerprint_protocol_2.sql',
  '20261011111839_official_truth_original_custody_lifecycle_1.sql','20261013184409_official_truth_ch_de_application_pilot_1.sql',
  '20261023153726_official_truth_current_version_lookup_1.sql',
]
export function installNativeSchema(sql:ReturnType<typeof nativeSql>) {
  sql(`create role anon nologin noinherit;create role authenticated nologin noinherit;
    create role service_role nologin noinherit bypassrls;create role postgres nologin noinherit bypassrls nosuperuser;
    create role accepted_fixture_authenticator login noinherit nosuperuser nobypassrls;
    grant authenticated,service_role to accepted_fixture_authenticator;
    create schema auth authorization postgres;revoke all on schema auth from public;
    grant usage on schema auth to authenticated,service_role;
    create type auth.aal_level as enum('aal1','aal2');
    create table auth.users(id uuid primary key,deleted_at timestamptz,banned_until timestamptz,is_anonymous boolean not null default false);
    create table auth.sessions(id uuid primary key,user_id uuid not null references auth.users on delete cascade,not_after timestamptz,aal auth.aal_level);
    alter table auth.users owner to postgres;alter table auth.sessions owner to postgres;
    create function auth.jwt() returns jsonb language sql stable set search_path=pg_catalog as $auth$
      select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $auth$;
    create function auth.uid() returns uuid language sql stable set search_path=pg_catalog as $auth$
      select nullif(auth.jwt()->>'sub','')::uuid $auth$;
    revoke all on function auth.jwt(),auth.uid() from public;grant execute on function auth.jwt(),auth.uid() to authenticated,service_role,postgres;
    create schema private authorization postgres;revoke all on schema private from public;
    grant usage,create on schema public to postgres;
    create schema extensions authorization postgres;create extension pg_trgm with schema extensions;
    create table public.profiles(user_id uuid primary key references auth.users on delete cascade,role text not null,status text not null);
    alter table public.profiles owner to postgres;alter table public.profiles enable row level security;
    create policy own_read on public.profiles for select to authenticated using(user_id=auth.uid());
    create policy own_update on public.profiles for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
    grant select,update on public.profiles to authenticated;`)
  const profile='20260817120300_generisches_profil.sql'
  const constraint=source(profile).match(/alter table public\.profiles\s+add constraint profiles_status_check\s+check\s*\([\s\S]*?\);/)?.[0]
  assert(constraint);sql(constraint)
  for(const [file,name,args] of [
    ['20260817100000_rollenmodell.sql','rollenrang','rolle text'],[profile,'aktuelle_rolle',''],
    ['20260817100000_rollenmodell.sql','hat_rolle_mindestens','minimum text'],
    ['20260827170000_admin_aal2_data_plane_alignment.sql','aktuelles_admin_aal2',''],
  ]) {
    const aclSource=source(name==='aktuelle_rolle'?'20260817100000_rollenmodell.sql':file!)
    const acl=aclSource.split('\n').filter(line=>new RegExp(`^(revoke all|grant execute) on function public\\.${name}\\(`).test(line))
    assert.equal(acl.length,2,`original helper ACL missing ${name}`)
    sql(`set role postgres;${definition(file!,name!,args!)}\n${acl.join('\n')}`)
  }
  sql(`alter table public.profiles add constraint profiles_role_check check(public.rollenrang(role) is not null)`)
  sql(`set role postgres;${definition('20260817100500_rollenwechsel_beim_anlegen.sql','creator_profiles_rollenwechsel_pruefen')}
    alter function public.creator_profiles_rollenwechsel_pruefen() rename to profil_rollenwechsel_pruefen;
    create trigger profiles_rollenwechsel before insert or update on public.profiles for each row execute function public.profil_rollenwechsel_pruefen();`)
  for(const file of tripSources)sql(`set role postgres;${source(file)}`)
  for(const file of evidenceSources)sql(`set role postgres;${source(file)}`)
  // Actual unchanged #1142 guard and ownership. Auth tables above are explicit
  // synthetic infrastructure; this is not managed Auth/JWT target evidence.
  sql(pinnedSource('scripts/db/official-truth-owner-session-candidate-1/authority-candidate.sql'))
  sql(pinnedSource('scripts/db/official-truth-owner-session-candidate-1/pilot-candidate.sql'))
  for(const file of ['storage.sql','url-idna-data.sql','url-codec.sql','semantic-v2.sql'])
    sql(pinnedSource(`scripts/db/official-truth-integrated-pilot-1/${file}`))
  sql(readFileSync('scripts/db/official-truth-accepted-store-trip-integration-1/accepted-store-candidate.sql','utf8'))
}

/** Independent RLS query used by the loopback PostgREST protocol fixture. It
 * neither invokes the privileged own_graph bridge nor filters a supplied owner. */
export const ownTripQuery=`select to_jsonb(t)||jsonb_build_object(
  'trip_stages',(select coalesce(jsonb_agg(to_jsonb(s) order by s.id),'[]') from public.trip_stages s where s.trip_id=t.id),
  'trip_days',(select coalesce(jsonb_agg(to_jsonb(d) order by d.id),'[]') from public.trip_days d where d.trip_id=t.id),
  'trip_items',(select coalesce(jsonb_agg(to_jsonb(i) order by i.id),'[]') from public.trip_items i where i.trip_id=t.id),
  'trip_readiness_items',(select coalesce(jsonb_agg(to_jsonb(r) order by r.id),'[]') from public.trip_readiness_items r where r.trip_id=t.id),
  'trip_travellers',(select coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object(
    'trip_traveller_citizenships',(select coalesce(jsonb_agg(to_jsonb(c) order by c.id),'[]') from public.trip_traveller_citizenships c where c.traveller_id=p.id and c.trip_id=t.id),
    'trip_traveller_documents',(select coalesce(jsonb_agg(to_jsonb(d) order by d.id),'[]') from public.trip_traveller_documents d where d.traveller_id=p.id and d.trip_id=t.id)) order by p.id),'[]') from public.trip_travellers p where p.trip_id=t.id)) as graph
  from public.trips t where t.id=$1::uuid limit 1`
