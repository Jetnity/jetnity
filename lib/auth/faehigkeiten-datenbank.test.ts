// lib/auth/faehigkeiten-datenbank.test.ts
//
// Wer darf was? Die Antwort steht zwangsläufig an zwei Orten: in der
// Anwendung, die eine Route freigibt, und in der Datenbank, die den Zugriff
// danach zulässt oder nicht.
//
// Bis zum Nachtrag zu Phase 1.4 waren das zwei unabhängige Aussagen. Die
// Anwendung liess den Administrationsbereich ab `moderator` zu, die Policies
// verlangten pauschal `admin`. Eine Moderation kam damit durch den Gate und
// bekam anschliessend eine leere Liste – nicht eine Ablehnung, sondern eine
// leere Liste. Das sieht aus wie „nichts vorgefallen“.
//
// Seitdem gibt es eine gemeinsame Sprache: Fähigkeiten. CAPABILITY_MINIMUM
// nennt je Fähigkeit eine Mindestrolle, die Datenbank bildet dieselbe
// Fähigkeit als `public.darf_<name>()` nach. Dieser Test vergleicht beide
// Listen. Er liest nur Dateien und läuft deshalb in der CI ohne Zugangsdaten.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import {
  CAPABILITIES,
  CAPABILITY_MINIMUM,
  databaseFunctionFor,
  minimumRoleFor,
  rankOf,
  type Capability,
} from '@/lib/auth/roles'

const MIGRATIONEN = join(process.cwd(), 'supabase', 'migrations')

function migrationen(): string {
  return readdirSync(MIGRATIONEN)
    .filter(datei => datei.endsWith('.sql'))
    .sort()
    .map(datei => readFileSync(join(MIGRATIONEN, datei), 'utf8'))
    .join('\n')
}

/**
 * Liest je `darf_…()`-Funktion die Rolle, die sie verlangt.
 *
 * Spätere Migrationen gewinnen: Wird eine Funktion ersetzt, zählt die letzte
 * Fassung – genauso, wie die Datenbank sie nach dem Einspielen kennt.
 */
function faehigkeitenAusDerDatenbank(sql: string): Map<string, string> {
  const gefunden = new Map<string, string>()

  for (const treffer of sql.matchAll(
    /create or replace function public\.(darf_[a-z_]+)\(\)[\s\S]*?as \$\$([\s\S]*?)\$\$/g,
  )) {
    const [, name, koerper] = treffer
    const rolle = koerper.match(/hat_rolle_mindestens\('([a-z]+)'\)/)
    assert.ok(rolle, `public.${name}() prüft keine Rolle über hat_rolle_mindestens()`)
    gefunden.set(name, rolle[1])
  }

  return gefunden
}

describe('Fähigkeiten in Anwendung und Datenbank', () => {
  const sql = migrationen()

  test('jede Fähigkeit hat eine Funktion in der Datenbank', () => {
    const ausDb = faehigkeitenAusDerDatenbank(sql)
    for (const faehigkeit of CAPABILITIES) {
      const name = databaseFunctionFor(faehigkeit)
      assert.ok(
        ausDb.has(name),
        `Für die Fähigkeit ${faehigkeit} fehlt public.${name}() in den Migrationen`,
      )
    }
  })

  test('die Mindestrollen stimmen auf beiden Seiten überein', () => {
    const ausDb = faehigkeitenAusDerDatenbank(sql)
    for (const faehigkeit of CAPABILITIES) {
      const name = databaseFunctionFor(faehigkeit)
      assert.equal(
        ausDb.get(name),
        minimumRoleFor(faehigkeit),
        `${faehigkeit}: Datenbank verlangt ${ausDb.get(name)}, ` +
          `lib/auth/roles.ts verlangt ${minimumRoleFor(faehigkeit)}`,
      )
    }
  })

  test('die Datenbank kennt keine Fähigkeit, die TypeScript nicht kennt', () => {
    const ausDb = [...faehigkeitenAusDerDatenbank(sql).keys()]
    const erwartet = CAPABILITIES.map(databaseFunctionFor)
    assert.deepEqual(ausDb.sort(), [...erwartet].sort())
  })

  test('ein Eingriff verlangt mehr als ein Blick', () => {
    // Die Trennung ist der Grund für die Unterscheidung überhaupt: Lesen ab
    // `moderator`, Eingreifen ab `operator`. Fallen beide zusammen, ist die
    // Rolle `operator` bedeutungslos geworden.
    assert.ok(
      rankOf(minimumRoleFor('betrieb-eingreifen')) > rankOf(minimumRoleFor('betrieb-lesen')),
      'betrieb-eingreifen muss über betrieb-lesen liegen',
    )
  })

  test('jede Mindestrolle lässt den Administrationsbereich überhaupt zu', () => {
    // Eine Fähigkeit unterhalb von `moderator` wäre unerreichbar: Der Gate des
    // Bereichs liesse das Konto gar nicht erst herein.
    for (const faehigkeit of CAPABILITIES) {
      assert.ok(
        rankOf(minimumRoleFor(faehigkeit)) >= rankOf('moderator'),
        `${faehigkeit} liegt unterhalb des Bereichszugangs`,
      )
    }
  })
})

describe('Fähigkeiten sind vollständig belegt', () => {
  test('keine Fähigkeit ohne Mindestrolle', () => {
    for (const faehigkeit of Object.keys(CAPABILITY_MINIMUM) as Capability[]) {
      assert.ok(minimumRoleFor(faehigkeit), `${faehigkeit} hat keine Mindestrolle`)
    }
  })
})
