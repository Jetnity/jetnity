// lib/flight-event-provenance/e5b3a-persistenz-vertrag.test.ts
//
// Repo-Vertrag der E5-B3A-Migration. Kein Production-Apply. Keine Fake-Truth.
// Kein App-/API-Write. flugNachweisAusUmgebung() bleibt null.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const DATEI = '20260831190000_trip_item_flight_event_provenance.sql'
const sql = readFileSync(join('supabase/migrations', DATEI), 'utf8')
const sqlOhneKommentare = sql
  .replace(/--[^\n]*/g, '')
  .replace(/'[^']*'/g, "''")
const commercialSql = readFileSync(
  join('supabase/migrations', '20260829140000_trip_item_commercial_provenance.sql'),
  'utf8',
)
const config = readFileSync('supabase/config.toml', 'utf8')
const domain = readFileSync('lib/flights/domain.ts', 'utf8')
const provider = readFileSync('lib/flights/provider.ts', 'utf8')
const nachweis = readFileSync('lib/flights/nachweis.ts', 'utf8')
const eventInstant = readFileSync('lib/flights/airport-event-instant.ts', 'utf8')
const suche = readFileSync('lib/flights/suche.ts', 'utf8')
const clientSicht = readFileSync('lib/flights/client-sicht.ts', 'utf8')
const temporal = readFileSync('lib/readiness/temporal.ts', 'utf8')
const temporalProjection = readFileSync('lib/readiness/temporal-projection.ts', 'utf8')
const readinessProvider = readFileSync('lib/readiness/provider.ts', 'utf8')
const supabaseTypes = readFileSync('types/supabase.ts', 'utf8')

describe('E5-B3A Flight-Event-Provenance-Migrationsvertrag', () => {
  test('legt eine eigene Occurrence-Relation neben trip_items an', () => {
    assert.match(sql, /create table public\.trip_item_flight_event_provenance/)
    assert.match(sql, /trip_item_id uuid not null/)
    assert.match(sql, /trip_id uuid not null/)
    assert.match(sql, /user_id uuid not null/)
    assert.match(sql, /on delete cascade/)
    assert.match(
      sql,
      /constraint trip_item_flight_event_provenance_identity\s+unique \(trip_item_id, leg_index, segment_index, endpoint\)/,
    )
    assert.match(sql, /constraint trip_item_flight_event_provenance_event_ref\s+unique \(occurrence_event_ref\)/)
    assert.doesNotMatch(sql, /create table public\.\w*history/)
    assert.doesNotMatch(sqlOhneKommentare, /alter table public\.trip_items/)
    assert.doesNotMatch(sqlOhneKommentare, /update public\.trip_items/)
    assert.doesNotMatch(sql, /create table public\.trip_item_commercial_provenance/)
    assert.doesNotMatch(sql, /alter table public\.trip_item_commercial_provenance/)
    assert.doesNotMatch(sql, /set metadata|metadata\s*=/)
    assert.match(sql, /Owner-writable trip_items\.metadata ist keine Provider-Provenance/)
  })

  test('Occurrence-Identität trennt Leg, Segment und Departure/Arrival', () => {
    assert.match(sql, /leg_index smallint not null/)
    assert.match(sql, /segment_index smallint not null/)
    assert.match(sql, /endpoint text not null/)
    assert.match(sql, /check \(endpoint in \('departure', 'arrival'\)\)/)
    assert.match(sql, /occurrence_identity_collision/)
    assert.match(sql, /malformed occurrence identity/)
    assert.doesNotMatch(sql, /unique \(trip_item_id\)/)
  })

  test('IATA ist exakt dreistellig und wird nicht aus einer Zone erraten', () => {
    assert.match(sql, /iata text not null/)
    assert.match(sql, /check \(iata ~ '\^\[A-Z\]\{3\}\$'\)/)
    assert.match(sql, /invalid_iata/)
    assert.doesNotMatch(sql, /from public\.airports/)
    assert.doesNotMatch(sql, /flug_route_punkt_aus_iata/)
  })

  test('lokale Wanduhr, IANA-Zone und Instant bleiben getrennte Fakten', () => {
    assert.match(sql, /local_date date not null/)
    assert.match(sql, /local_time time not null/)
    assert.match(sql, /time_zone text not null/)
    assert.match(sql, /event_instant timestamptz not null/)
    assert.match(sql, /invalid_local_date/)
    assert.match(sql, /invalid_local_time/)
    assert.match(sql, /invalid_time_zone/)
    assert.match(sql, /invalid_event_instant/)
    assert.match(sql, /_absolute_instant_muster text :=/)
    assert.match(
      sql,
      /\^\[0-9\]\{4\}-\[0-9\]\{2\}-\[0-9\]\{2\}T\[0-9\]\{2\}:\[0-9\]\{2\}:\[0-9\]\{2\}/,
    )
    assert.doesNotMatch(sqlOhneKommentare, /AT TIME ZONE/i)
    assert.doesNotMatch(sqlOhneKommentare, /timezone\s*\(/i)
    assert.doesNotMatch(sqlOhneKommentare, /\|\|\s*'Z'/)
    assert.doesNotMatch(sqlOhneKommentare, /local_date::timestamptz|local_time::timestamptz/)
    assert.match(sql, /Kein DST-Resolver, keine IATA-Inferenz/)
    assert.match(sql, /Wird nicht aus local_date\/local_time\/time_zone berechnet/)
  })

  test('Timezone-Syntax lehnt Offset- und Z-Behauptungen ab, ohne zu resolven', () => {
    assert.match(sql, /trip_item_flight_event_provenance_time_zone_syntax/)
    assert.match(sql, /time_zone !~ '\^\[Zz\]\$'/)
    assert.match(sql, /time_zone !~ '\^\[\+-]\[0-9]'/)
    assert.match(sql, /char_length\(time_zone\) between 1 and 64/)
    assert.doesNotMatch(sql, /Intl\.DateTimeFormat/)
    assert.doesNotMatch(sql, /pg_timezone_names/)
  })

  test('Owner-Read, kein anon, kein authenticated Direct-Write', () => {
    assert.match(sql, /enable row level security/)
    assert.match(sql, /policy trip_item_flight_event_provenance_lesen/)
    assert.match(sql, /for select/)
    assert.match(sql, /grant select on table public\.trip_item_flight_event_provenance to authenticated/)
    assert.match(
      sql,
      /revoke all on table public\.trip_item_flight_event_provenance from public, anon, authenticated, service_role/,
    )
    assert.doesNotMatch(sql, /grant insert on table public\.trip_item_flight_event_provenance/)
    assert.doesNotMatch(sql, /grant update on table public\.trip_item_flight_event_provenance/)
    assert.doesNotMatch(sql, /grant delete on table public\.trip_item_flight_event_provenance/)
    assert.match(
      sql,
      /create policy trip_item_flight_event_provenance_lesen\s+on public\.trip_item_flight_event_provenance\s+for select/,
    )
    assert.doesNotMatch(
      sql,
      /create policy \w+\s+on public\.trip_item_flight_event_provenance\s+for (insert|update|delete)/,
    )
    assert.match(sql, /for update;/)
    assert.doesNotMatch(sql, /grant [a-z]+ on table public\.trip_item_flight_event_provenance to anon/)
  })

  test('privilegierter Write ist nicht exponiert und nicht service-role', () => {
    assert.match(sql, /create schema if not exists jetnity_internal/)
    assert.match(sql, /security definer/)
    assert.match(sql, /set search_path = ''/)
    assert.match(sql, /jetnity_internal\.trip_item_flight_event_provenance_schreiben/)
    assert.match(sql, /create role jetnity_flight_event_writer nologin/)
    assert.match(sql, /create role jetnity_flight_event_runtime nologin noinherit/)
    assert.match(sql, /production_write_path_allocated boolean not null default false/)
    assert.match(sql, /production write path unallocated/)
    assert.match(
      sql,
      /revoke all on function jetnity_internal\.trip_item_flight_event_provenance_schreiben\(jsonb\)\s+from public, anon, authenticated, service_role/,
    )
    assert.match(
      sql,
      /grant execute on function jetnity_internal\.trip_item_flight_event_provenance_schreiben\(jsonb\)\s+to jetnity_flight_event_writer/,
    )
    assert.doesNotMatch(
      sql,
      /grant execute on function jetnity_internal\.trip_item_flight_event_provenance_schreiben\(jsonb\)\s+to (authenticated|anon|service_role)/,
    )
    assert.doesNotMatch(config, /schemas = \[[^\]]*jetnity_internal/)
    assert.match(config, /schemas = \["public", "graphql_public"\]/)
  })

  test('Write bindet den kanonischen Vertrag und ist ohne Principal fail-closed', () => {
    assert.match(sql, /jetnity\.flight_event_persistence\.v1/)
    assert.match(sql, /e5b2a_validated_snapshot/)
    assert.match(sql, /unvalidated raw payload reject/)
    assert.match(sql, /null principal reject/)
    assert.match(sql, /non_flight reject/)
    assert.match(sql, /forged source reject/)
    assert.match(sql, /wrong kind\/domain reject/)
    assert.match(sql, /if _uid is null then/)
    assert.match(sql, /if _item\.kind is distinct from 'flight' then/)
    assert.match(sql, /if _item\.user_id is distinct from _uid then/)
    assert.match(sql, /missing_external_ref/)
    assert.doesNotMatch(sql, /if _uid is not null and _item\.user_id is distinct from _uid/)
    assert.match(sql, /KEIN Production-Write-Pfad/)
  })

  test('provider-belegte Occurrence braucht eine konkrete external_ref', () => {
    assert.match(sql, /external_ref text not null/)
    assert.match(
      sql,
      /constraint trip_item_flight_event_provenance_external_ref_laenge\s+check \(char_length\(btrim\(external_ref\)\) between 1 and 200\)/,
    )
    assert.match(sql, /constraint trip_item_flight_event_provenance_provider_source_ref/)
    assert.match(sql, /check \(\s+provider_belegt\s+and char_length\(btrim\(external_ref\)\) between 1 and 200/)
    assert.match(sql, /check \(provider_belegt\)/)
    assert.match(sql, /if _external_ref is null then/)
    assert.match(sql, /missing_external_ref/)
    assert.match(sql, /invalid_external_ref/)
    assert.match(sql, /_provider_id, true, 'persisted_snapshot', _source_label, _external_ref/)
    assert.match(sql, /Ohne konkrete Provider-Source-Referenz external_ref keine belegte Provenance/)
    assert.match(sql, /occurrence_event_ref ist keine Provider-Referenz/)
    assert.doesNotMatch(sql, /external_ref is null or char_length/)
    const rejectAt = sql.search(/missing_external_ref/)
    const deleteAt = sql.search(
      /delete from public\.trip_item_flight_event_provenance\s+where trip_item_id = _item\.id;/,
    )
    assert.ok(rejectAt >= 0 && deleteAt > rejectAt)
  })

  test('Event-Ref entsteht nur im Trusted-Write, nie aus Client-Behauptung', () => {
    assert.match(sql, /occurrence_event_ref is/)
    assert.match(sql, /jetnity\.flight_event\.v1:/)
    assert.match(sql, /_event_ref :=/)
    assert.match(sql, /Niemals aus Client-eventRef übernommen/)
    assert.match(sql, /\(_eingabe \? 'eventRef'\)/)
    assert.match(sql, /\(_occ \? 'eventRef'\)/)
    assert.match(sql, /\(_occ \? 'occurrence_event_ref'\)/)
    assert.doesNotMatch(sql, /_event_ref := nullif/)
    assert.doesNotMatch(sql, /_eingabe ->> 'occurrence_event_ref'/)
    assert.doesNotMatch(sql, /_occ ->> 'event_ref'/)
    assert.doesNotMatch(sql, /_occ ->> 'eventRef'/)
  })

  test('Full-current-snapshot löscht zuerst alle alten Occurrences des Items', () => {
    assert.match(
      sql,
      /delete from public\.trip_item_flight_event_provenance\s+where trip_item_id = _item\.id;/,
    )
    assert.match(sql, /Ein leerer neuer Satz ist gültig und hinterlässt keine stale Zeilen/)
    assert.match(sql, /snapshot_version uuid not null/)
    const deleteAt = sql.search(
      /delete from public\.trip_item_flight_event_provenance\s+where trip_item_id = _item\.id;/,
    )
    const insertAt = sql.search(/insert into public\.trip_item_flight_event_provenance/)
    assert.ok(deleteAt >= 0 && insertAt > deleteAt)
  })

  test('Commercial-Provenance-Sicherheitsprinzip bleibt unberührt und unüberladen', () => {
    assert.match(commercialSql, /create table public\.trip_item_commercial_provenance/)
    assert.match(commercialSql, /jetnity_internal\.trip_item_commercial_provenance_schreiben/)
    assert.doesNotMatch(sql, /price_amount|quoted_currency|affiliate_status/)
    assert.doesNotMatch(sql, /trip_item_commercial_provenance_schreiben/)
    assert.doesNotMatch(sql, /jetnity_commercial_writer/)
    assert.doesNotMatch(sql, /commercial_write_runtime_gate/)
  })
})

describe('E5-B3A Runtime- und Proof-Grenzen bleiben unverändert', () => {
  test('FlugSegment und FlugOption bleiben ohne Timezone/Event-Felder', () => {
    assert.match(domain, /export type FlugSegment = \{/)
    assert.match(domain, /departureDate: string/)
    assert.match(domain, /departureTime: string/)
    assert.match(domain, /arrivalDate: string/)
    assert.match(domain, /arrivalTime: string/)
    assert.doesNotMatch(domain, /timeZone|eventInstant|eventRef|time_zone/)
    assert.match(domain, /export type FlugOption = \{/)
    assert.doesNotMatch(suche, /airportEventInstantEvidence/)
    assert.doesNotMatch(clientSicht, /timeZone|eventInstant|eventRef/)
  })

  test('flugNachweisAusUmgebung und Requirements-Provider bleiben null', () => {
    assert.match(
      nachweis,
      /export function flugNachweisAusUmgebung\(\): FlugNachweis \| null \{\n  return null\n\}/,
    )
    assert.match(
      readinessProvider,
      /export function requirementsProviderAus\(\): RequirementsProvider \| null \{\n  return null\n\}/,
    )
  })

  test('E5-A und der ephemere Event-Instant-Resolver bleiben unverbunden', () => {
    assert.match(temporal, /export const OFFICIAL_TEMPORAL_ANCHORS/)
    assert.match(temporalProjection, /OfficialTemporalEventBinding/)
    assert.doesNotMatch(temporalProjection, /trip_item_flight_event_provenance/)
    assert.doesNotMatch(temporalProjection, /flight_event_persistence/)
    assert.doesNotMatch(eventInstant, /trip_item_flight_event_provenance/)
    assert.doesNotMatch(provider, /trip_item_flight_event_provenance/)
    assert.match(provider, /airportEventInstantEvidence: FlugAirportEventInstantEvidence\[\]/)
  })

  test('erzeugte Supabase-Typen täuschen die unapplied Relation nicht als live vor', () => {
    assert.doesNotMatch(supabaseTypes, /trip_item_flight_event_provenance/)
    assert.match(supabaseTypes, /trip_item_commercial_provenance/)
  })
})
