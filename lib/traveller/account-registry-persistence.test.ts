// lib/traveller/account-registry-persistence.test.ts
//
// Repo-Vertrag für AP-7-S2. Live-RLS/FK/Limit-Verhalten wird zusätzlich auf
// dem Supabase-Development-Branch adversariell geprüft.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const DATEI = '20260829201500_account_traveller_registry_persistence.sql'
const sql = readFileSync(join('supabase/migrations', DATEI), 'utf8')

function tabellenDefinition(name: string): string {
  const definition = sql.match(
    new RegExp(`create table public\\.${name}\\s*\\(([\\s\\S]*?)\\n\\);`),
  )?.[1]

  assert.ok(definition, `CREATE TABLE für ${name} muss vollständig definiert sein`)
  return definition
}

describe('AP-7-S2 Account Traveller Registry Persistenzvertrag', () => {
  test('legt genau die additive Dual-Authority-Registry ohne Trip-Live-Link an', () => {
    assert.match(sql, /create table public\.account_travellers/)
    assert.match(sql, /create table public\.account_traveller_citizenships/)
    assert.match(sql, /create table public\.account_traveller_documents/)
    assert.doesNotMatch(sql, /alter table public\.trip_traveller/)
    assert.doesNotMatch(sql, /trip_id\s+uuid/)
    assert.doesNotMatch(sql, /account_traveller_id[^\n]*references public\.account_travellers/)
    assert.doesNotMatch(sql, /backfill|insert into public\.account_travellers\s+select/i)
  })

  test('bindet Parent und Children an denselben Owner und dieselbe Traveller-Identität', () => {
    assert.match(sql, /foreign key \(user_id\)\s+references auth\.users \(id\)\s+on delete cascade/s)
    assert.match(sql, /unique \(id, user_id\)/)
    assert.match(
      sql,
      /foreign key \(traveller_id, user_id\)\s+references public\.account_travellers \(id, user_id\)/s,
    )
    assert.match(sql, /unique \(id, traveller_id, user_id\)/)
    assert.match(
      sql,
      /foreign key \(citizenship_id, traveller_id, user_id\)\s+references public\.account_traveller_citizenships \(id, traveller_id, user_id\)\s+on delete set null \(citizenship_id\)/s,
    )
  })

  test('erzwingt 8 Citizenships und 12 Documents auch bei UPDATE/Reparenting', () => {
    const funktion = sql.match(
      /create or replace function public\.account_traveller_kinder_limit_pruefen\(\)[\s\S]*?\n\$\$;/,
    )?.[0]

    assert.ok(funktion, 'Limitfunktion muss vollständig in der Migration definiert sein')
    assert.match(funktion, /security\s+invoker/i)
    assert.match(funktion, /for\s+no\s+key\s+update/i)
    assert.match(funktion, />\s*8\s+then/i)
    assert.match(funktion, />\s*12\s+then/i)
    assert.match(sql, /after\s+insert\s+or\s+update\s+on\s+public\.account_traveller_citizenships/i)
    assert.match(sql, /after\s+insert\s+or\s+update\s+on\s+public\.account_traveller_documents/i)
    assert.doesNotMatch(sql, /create\s+trigger\s+account_travellers[^;]*limit/i)
  })

  test('RLS ist owner-only; anon bleibt ohne Rechte', () => {
    for (const table of [
      'account_travellers',
      'account_traveller_citizenships',
      'account_traveller_documents',
    ]) {
      assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`))
      assert.match(sql, new RegExp(`revoke all on table public\\.${table} from anon`))
      assert.match(
        sql,
        new RegExp(`grant select, insert, update, delete on table public\\.${table} to authenticated`),
      )
    }
    assert.match(sql, /user_id = \(select auth\.uid\(\)\)/)
    assert.doesNotMatch(sql, /darf_konten_verwalten|service_role|security definer/i)
  })

  test('Registry speichert nur datensparsame Dokument-Metadaten ohne Default Credential', () => {
    const ddl = [
      tabellenDefinition('account_travellers'),
      tabellenDefinition('account_traveller_citizenships'),
      tabellenDefinition('account_traveller_documents'),
    ].join('\n')

    assert.match(ddl, /document_type text not null/)
    assert.match(ddl, /issuing_country_code text/)
    assert.match(ddl, /citizenship_id uuid/)
    assert.match(ddl, /expires_on date/)
    assert.doesNotMatch(
      ddl,
      /passport_number|passnummer|document_number|serial_number|mrz|scan_url|biometric|date_of_birth|birth_date|health_data|primary_citizenship|default_passport|preferred_document/i,
    )
  })
})
