// lib/commercial-provenance/s5b-persistenz-vertrag.test.ts
//
// Repo-Vertrag der S5-B-Migration. Kein Production-Apply. Keine Fake-Truth.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const DATEI = '20260829140000_trip_item_commercial_provenance.sql'
const sql = readFileSync(join('supabase/migrations', DATEI), 'utf8')

describe('S5-B Persistenz-Migrationsvertrag', () => {
  test('legt die Option-C-Relation mit 1:1-Slot und Cascade an', () => {
    assert.match(sql, /create table public\.trip_item_commercial_provenance/)
    assert.match(sql, /trip_item_id uuid primary key/)
    assert.match(sql, /on delete cascade/)
    assert.match(sql, /domain in \('flights', 'hotels', 'activities', 'mobility', 'rental_cars'\)/)
    assert.doesNotMatch(
      sql,
      /constraint trip_item_commercial_provenance_domain_werte\s+check \(domain in \([^)]*note/,
    )
    assert.match(sql, /source_kind = 'persisted_snapshot'/)
    assert.match(sql, /persistenz = 'snapshot'/)
    assert.doesNotMatch(sql, /freshness_status|commercial_status|currency_status|darf_als_current/)
    assert.doesNotMatch(sql, /unique \([^)]*provider_id[^)]*external_ref/)
    assert.doesNotMatch(sql, /create table public\.\w*history/)
  })

  test('Owner-Read, kein anon, kein authenticated Direct-Write', () => {
    assert.match(sql, /enable row level security/)
    assert.match(sql, /policy trip_item_commercial_provenance_lesen/)
    assert.match(sql, /for select/)
    assert.match(sql, /grant select on table public\.trip_item_commercial_provenance to authenticated/)
    assert.match(
      sql,
      /revoke all on table public\.trip_item_commercial_provenance from public, anon, authenticated, service_role/,
    )
    assert.doesNotMatch(sql, /grant insert on table public\.trip_item_commercial_provenance/)
    assert.doesNotMatch(sql, /grant update on table public\.trip_item_commercial_provenance/)
    assert.doesNotMatch(sql, /grant delete on table public\.trip_item_commercial_provenance/)
    assert.doesNotMatch(sql, /for insert/)
    assert.doesNotMatch(sql, /for update/)
    assert.doesNotMatch(sql, /for delete/)
  })

  test('privilegierter Write ist nicht exponiert und nicht service-role', () => {
    assert.match(sql, /create schema if not exists jetnity_internal/)
    assert.match(sql, /security definer/)
    assert.match(sql, /set search_path = ''/)
    assert.match(sql, /jetnity_internal\.trip_item_commercial_provenance_schreiben/)
    assert.match(sql, /create role jetnity_commercial_writer nologin/)
    assert.match(sql, /create role jetnity_commercial_runtime nologin noinherit/)
    assert.match(sql, /production_write_path_allocated boolean not null default false/)
    assert.match(
      sql,
      /revoke all on function jetnity_internal\.trip_item_commercial_provenance_schreiben\(jsonb\)\s+from public, anon, authenticated, service_role/,
    )
    assert.match(
      sql,
      /grant execute on function jetnity_internal\.trip_item_commercial_provenance_schreiben\(jsonb\)\s+to jetnity_commercial_writer/,
    )
    assert.doesNotMatch(
      sql,
      /grant execute on function jetnity_internal\.trip_item_commercial_provenance_schreiben\(jsonb\)\s+to (authenticated|anon|service_role)/,
    )
    assert.doesNotMatch(sql, /schemas = \[[^\]]*jetnity_internal/)
  })

  test('Write bindet den kanonischen Persistenzvertrag und ist ohne Principal fail-closed', () => {
    assert.match(sql, /jetnity\.commercial_persistence\.v1/)
    assert.match(sql, /s5a_validated_snapshot/)
    assert.match(sql, /unvalidated raw payload reject/)
    assert.match(sql, /null principal reject/)
    assert.match(sql, /note reject/)
    assert.match(sql, /forged actor reject/)
    assert.match(sql, /forged source reject/)
    assert.match(sql, /wrong kind\/domain reject/)
    assert.match(sql, /refresh_identity_mismatch/)
    assert.match(sql, /if _uid is null then/)
    assert.doesNotMatch(sql, /if _uid is not null and _item\.user_id is distinct from _uid/)
    assert.match(sql, /KEIN Production-Write-Pfad/)
  })

  test('Flight-Guard-Trigger bleibt und die Matrix schließt Stay/Activity/Transfer/Rental/Note', () => {
    assert.match(sql, /create trigger trip_items_flug_handelsfelder_schuetzen/)
    assert.match(sql, /new\.kind in \('flight', 'stay', 'activity', 'note'\)/)
    assert.match(sql, /new\.kind in \('transfer', 'rental_car'\)/)
    assert.match(sql, /reise_anlegen/)
    assert.match(sql, /in \('transfer', 'rental_car'\)/)
  })
})
