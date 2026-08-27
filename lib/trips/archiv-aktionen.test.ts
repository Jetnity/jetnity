import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

describe('AP-4 Archiv-Schreibweg bleibt owner-RLS und fail-closed', () => {
  test('ein Server-Action-Pfad mit konto(), Zod und Aktionsergebnis', () => {
    const aktion = quelle('archiv-aktionen.ts')
    assert.match(aktion, /'use server'/)
    assert.match(aktion, /reiseArchivLebenszyklus/)
    assert.match(aktion, /z\.object\(/)
    assert.match(aktion, /z\.string\(\)\.uuid\(\)/)
    assert.match(aktion, /z\.enum\(\['archivieren', 'wiederherstellen'\]\)/)
    assert.match(aktion, /await konto\(\)/)
    assert.match(aktion, /NICHT_ANGEMELDET/)
    assert.match(aktion, /Aktionsergebnis/)
    assert.match(aktion, /revalidatePath\('\/reisen'\)/)
    assert.match(aktion, /revalidatePath\('\/account'\)/)
  })

  test('kein Service Role, kein user_id aus Client-Nutzlast', () => {
    const aktion = quelle('archiv-aktionen.ts')
    assert.equal(aktion.includes('service_role'), false)
    assert.equal(aktion.includes('createServiceRole'), false)
    assert.equal(aktion.includes("eq('user_id'"), false)
    assert.equal(aktion.includes('eq("user_id"'), false)
    assert.match(aktion, /from '@\/lib\/trips\/anlegen'/)
    const anlegen = quelle('anlegen.ts')
    assert.match(anlegen, /auth\.getUser\(\)/)
  })

  test('Read läuft über RLS, Write nur auf die eine sichtbare Reise', () => {
    const aktion = quelle('archiv-aktionen.ts')
    assert.match(aktion, /\.from\('trips'\)/)
    assert.match(aktion, /\.select\('status, metadata'\)/)
    assert.match(aktion, /\.eq\('id', tripId\)/)
    assert.match(aktion, /\.maybeSingle\(\)/)
    assert.match(aktion, /\.update\(\{/)
    assert.match(aktion, /\.eq\('status', plan\.expectedStatus\)/)
    assert.match(aktion, /\.select\('id'\)/)
    assert.match(aktion, /Die Reise hat sich inzwischen geändert/)
    assert.match(aktion, /Diese Reise ist unbekannt/)
  })

  test('ungültige oder unsichtbare UUID und fehlende Anmeldung schreiben nicht', () => {
    const aktion = quelle('archiv-aktionen.ts')
    assert.match(aktion, /if \(!benutzerId\) return \{ ok: false, meldung: NICHT_ANGEMELDET \}/)
    assert.match(aktion, /if \(!data\) return \{ ok: false, meldung: UNBEKANNT \}/)
    assert.match(aktion, /if \(!geschrieben\) return \{ ok: false, meldung: KONFLIKT \}/)
    assert.equal(aktion.includes('status ='), false)
  })
})

describe('AP-4 Gast-Lifecycle bleibt unverändert', () => {
  test('Gastspeicher und Gast-Liste bekommen kein Archiv', () => {
    const speicher = quelle('gastspeicher.ts')
    const gast = readFileSync(join(hier, '../../components/trips/GastReisen.tsx'), 'utf8')
    assert.equal(speicher.includes('account_archive'), false)
    assert.equal(speicher.includes("status: 'archived'"), false)
    assert.equal(speicher.includes('reiseArchivLebenszyklus'), false)
    assert.equal(gast.includes('reiseArchivLebenszyklus'), false)
    assert.equal(gast.includes('KontoReiseArchivAktion'), false)
    assert.equal(gast.includes('Wiederherstellen'), false)
    assert.match(gast, /tripAlsUebersicht/)
  })
})

describe('AP-4 lässt TW7-A-Kartenidentität unangetastet', () => {
  test('Listen-Select trägt weiter trip_stages(name, position) und keine Transit-/Flight-Ziele', () => {
    const daten = quelle('daten.ts')
    const listenSelect = daten.match(/const UEBERSICHT_SPALTEN =[\s\S]*?trip_items\(count\)/)?.[0] ?? ''
    assert.notEqual(listenSelect, '')
    assert.match(listenSelect, /trip_stages\(name, position\)/)
    assert.match(listenSelect, /metadata/)
    assert.equal(daten.includes('trip_stages(count)'), false)
    assert.match(daten, /stageCount: stages\.length/)
    assert.match(daten, /itemCount: anzahl\(zeile\.trip_items\)/)
    assert.match(daten, /archivePreviousStatus: previousStatusAusMetadata/)
    for (const verboten of [
      'place_id',
      'latitude',
      'longitude',
      'country_code',
      'origin_place',
      'destination',
      'flight',
      'transit',
      'itinerary',
    ]) {
      assert.equal(listenSelect.includes(verboten), false, verboten)
    }
  })
})
