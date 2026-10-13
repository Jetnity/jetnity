// Disposable local databases only. Never accepts a URL or hosted connection.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fixtureTrip, fixtureUserId } from './fixtures'
export const pilotMigration='20261013184409_official_truth_ch_de_application_pilot_1.sql'
export const tripMigrations=['20260817120000_reiseschema.sql','20260820010000_reise_stage_revision.sql','20260820060000_reise_graph_revision.sql','20260820080000_reise_tage_eindeutig_aufgeschoben.sql','20260820120000_places_referenz.sql','20260820130000_reise_aendern_places.sql','20260821100000_trip_items_booking_status.sql','20260822010000_trip_readiness_items.sql','20260822020000_trip_travellers.sql','20260822160000_traveller_context_intelligence.sql','20260829201500_account_traveller_registry_persistence.sql']
const read=(name:string)=>readFileSync(`supabase/migrations/${name}`,'utf8')
export const quote=(value:string)=>`'${value.replaceAll("'","''")}'`
export function localSchema(sql:(text:string)=>string, includePlaces=true) {
  sql('create schema private; revoke all on schema private from public;')
  if(includePlaces)sql('create schema extensions; create extension pg_trgm with schema extensions;')
  for(const file of tripMigrations) {
    if (!includePlaces && ['20260820120000_places_referenz.sql','20260820130000_reise_aendern_places.sql'].includes(file)) continue
    sql(read(file))
  }
  // Minimal synthetic profile rows, not a second deployed profile schema. The
  // three actual capability prerequisites are copied verbatim from their SQL.
  sql('create table public.profiles(user_id uuid primary key references auth.users(id),role text); alter table public.profiles enable row level security; create policy own on public.profiles for select to authenticated using(user_id=auth.uid()); grant select on public.profiles to authenticated;')
  for(const [file,fn] of [
    ['20260817100000_rollenmodell.sql','rollenrang'],['20260817120300_generisches_profil.sql','aktuelle_rolle'],
    ['20260817100000_rollenmodell.sql','hat_rolle_mindestens'],['20260827170000_admin_aal2_data_plane_alignment.sql','aktuelles_admin_aal2'],
  ]) {const statement=read(file!).match(new RegExp(`create or replace function public\\.${fn}\\([\\s\\S]*?\\$\\$;`))?.[0];assert(statement);sql(statement)}
  sql(read('20261002154952_official_truth_owner_reviewer_capability_1.sql'))
  sql(read(pilotMigration))
}
export function seedTrip(sql:(text:string)=>string,userId=fixtureUserId) {
  const t=fixtureTrip(false),p=t.party![0]!,c=p.citizenships[0]!,d=p.documents[0]!,s=t.stages[0]!
  sql(`insert into public.profiles values (${quote(userId)},'owner');
    insert into public.trips(id,user_id,title,origin,start_date,end_date,travellers,metadata) values(${quote(t.id)},${quote(userId)},${quote(t.title)},'Zürich','2026-11-01','2026-11-08',1,'{"preserved":"synthetic"}');
    insert into public.trip_stages(id,trip_id,user_id,name,position,country_code) values(${quote(s.id)},${quote(t.id)},${quote(userId)},'Berlin',1,'DE');
    insert into public.trip_travellers(id,trip_id,user_id,client_ref,label) values(${quote(p.id)},${quote(t.id)},${quote(userId)},${quote(p.clientRef)},${quote(p.label!)});
    insert into public.trip_traveller_citizenships(id,trip_id,user_id,traveller_id,client_ref,country_code) values(${quote(c.id)},${quote(t.id)},${quote(userId)},${quote(p.id)},${quote(c.clientRef)},'CH');
    insert into public.trip_traveller_documents(id,trip_id,user_id,traveller_id,client_ref,document_type,issuing_country_code,citizenship_id,expires_on) values(${quote(d.id)},${quote(t.id)},${quote(userId)},${quote(p.id)},${quote(d.clientRef)},'passport','CH',${quote(c.id)},'2030-01-01');`)
}
