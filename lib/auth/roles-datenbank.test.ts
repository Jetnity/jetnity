// lib/auth/roles-datenbank.test.ts
//
// Das Rollenmodell steht an zwei Stellen: in lib/auth/roles.ts und – seit
// Phase 1.4 – in der Datenbank, wo `public.rollenrang(text)` die Grundlage
// jeder Policy ist.
//
// Zwei Quellen für dieselbe Aussage laufen auseinander, sobald jemand nur eine
// davon ändert. Und zwar leise: Die Anwendung ließe jemanden in den
// Administrationsbereich, den die Policies nicht kennen, oder umgekehrt.
//
// Dieser Test liest die Migration und vergleicht sie mit dem TypeScript-Modell.
// Er braucht keine Datenbank und läuft deshalb auch in der CI ohne Zugangsdaten.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { ACCOUNT_STATUSES, DEFAULT_ROLE, ROLES, rankOf, type Role } from '@/lib/auth/roles'

const MIGRATIONEN = join(process.cwd(), 'supabase', 'migrations')

/** Alle Migrationen hintereinander – so wirkt auch eine spätere Änderung. */
function migrationen(): string {
  return readdirSync(MIGRATIONEN)
    .filter(datei => datei.endsWith('.sql'))
    .sort()
    .map(datei => readFileSync(join(MIGRATIONEN, datei), 'utf8'))
    .join('\n')
}

/** Liest die `when 'rolle' then rang`-Paare aus der letzten Fassung von rollenrang(). */
function rangfolgeAusDerDatenbank(sql: string): Map<string, number> {
  const alle = [
    ...sql.matchAll(/create or replace function public\.rollenrang[\s\S]*?as \$\$([\s\S]*?)\$\$/g),
  ]
  assert.ok(alle.length > 0, 'public.rollenrang(text) fehlt in den Migrationen')

  const koerper = alle[alle.length - 1][1]
  const paare = new Map<string, number>()
  for (const treffer of koerper.matchAll(/when\s+'([a-z]+)'\s+then\s+(\d+)/g)) {
    paare.set(treffer[1], Number(treffer[2]))
  }
  assert.ok(paare.size > 0, 'In rollenrang() steht keine einzige Rolle')
  return paare
}

/**
 * Liest die zulässigen Werte aus der letzten Fassung des Statuschecks.
 *
 * Der Name der Bedingung hat sich mit dem Umbenennen der Tabelle geändert
 * (`creator_profiles_status_check` → `profiles_status_check`, ADR-0043).
 * Das Muster deckt beide ab: Der Test soll die letzte Fassung lesen, nicht die
 * letzte Fassung eines bestimmten Namens.
 */
function statusAusDerDatenbank(sql: string): string[] {
  const alle = [
    ...sql.matchAll(/add constraint (?:creator_)?profiles?_status_check\s*check\s*\(([\s\S]*?)\);/g),
  ]
  assert.ok(alle.length > 0, 'Der Statuscheck auf dem Profil fehlt in den Migrationen')

  const bedingung = alle[alle.length - 1][1]
  return [...bedingung.matchAll(/'([a-z]+)'/g)].map(treffer => treffer[1])
}

describe('Rollenmodell in der Datenbank', () => {
  const sql = migrationen()

  test('rollenrang() kennt genau die Rollen aus ROLES', () => {
    const ausDb = rangfolgeAusDerDatenbank(sql)
    assert.deepEqual([...ausDb.keys()].sort(), [...ROLES].sort())
  })

  test('die Ränge stimmen mit rankOf() überein', () => {
    const ausDb = rangfolgeAusDerDatenbank(sql)
    for (const rolle of ROLES) {
      assert.equal(
        ausDb.get(rolle),
        rankOf(rolle),
        `Rang von ${rolle} weicht ab: Datenbank ${ausDb.get(rolle)}, TypeScript ${rankOf(rolle)}`,
      )
    }
  })

  test('der CHECK auf status kennt genau die Werte aus ACCOUNT_STATUSES', () => {
    assert.deepEqual(statusAusDerDatenbank(sql).sort(), [...ACCOUNT_STATUSES].sort())
  })

  test('die Vorgaberolle der Datenbank ist DEFAULT_ROLE', () => {
    const treffer = sql.match(/alter column role set default '([a-z]+)'/)
    assert.ok(treffer, "„alter column role set default“ fehlt in den Migrationen")
    assert.equal(treffer[1], DEFAULT_ROLE)
  })

  test('ein neu angelegtes eigenes Profil bekommt DEFAULT_ROLE', () => {
    // Der Auslöser lehnt beim Anlegen jede andere Rolle ab; die Zeichenkette
    // darin muss dieselbe sein wie die Vorgabe der Spalte.
    const treffer = sql.match(/if new\.role is distinct from '([a-z]+)' then/)
    assert.ok(treffer, 'Die Prüfung beim Anlegen fehlt in den Migrationen')
    assert.equal(treffer[1], DEFAULT_ROLE)
  })

  test('alle Rollen aus ROLES tauchen als Rang auf, keine zusätzliche', () => {
    const ausDb = rangfolgeAusDerDatenbank(sql)
    const unbekannt = [...ausDb.keys()].filter(r => !(ROLES as readonly string[]).includes(r))
    assert.deepEqual(unbekannt, [], `Die Datenbank kennt Rollen, die TypeScript nicht kennt: ${unbekannt}`)
  })
})

describe('Rollen aus der Datenbank sind für TypeScript gültig', () => {
  test('jede Rolle des CHECKs ist ein Role', () => {
    const ausDb = rangfolgeAusDerDatenbank(migrationen())
    for (const rolle of ausDb.keys()) {
      const alsRole = rolle as Role
      assert.equal(rankOf(alsRole), ausDb.get(rolle))
    }
  })
})
