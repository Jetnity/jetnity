// lib/traveller/account-registry-trip-ui.test.ts
//
// AP-7-S4 UI-/Scope-Vertrag: explizite Aktion, Empty ≠ Error, keine Auto-Materialisierung.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { REGISTRY_TRIP_COPY } from '@/lib/traveller/account-registry-trip-copy'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

function dateienUnter(relativ: string): string[] {
  const start = join(wurzel, relativ)
  return readdirSync(start, { withFileTypes: true }).flatMap((eintrag) => {
    const pfad = `${relativ}/${eintrag.name}`
    return eintrag.isDirectory() ? dateienUnter(pfad) : [pfad]
  })
}

const UI_QUELLEN = [
  'components/trips/RegistryReiseUebernahme.tsx',
  'components/trips/KontoArbeitsbereich.tsx',
  'components/trips/Reisevorbereitung.tsx',
  'app/(public)/reisen/[tripId]/page.tsx',
]

const RUNTIME_QUELLEN = [
  ...UI_QUELLEN,
  'lib/traveller/account-registry-trip.ts',
  'lib/traveller/account-registry-trip-copy.ts',
  'lib/readiness/reisende-aktionen.ts',
]

const SENSIBLE_FELDER = [
  'passportNumber',
  'passport_number',
  'documentNumber',
  'document_number',
  'dateOfBirth',
  'date_of_birth',
  'name="mrz"',
  'name="biometric"',
  'type="file"',
]

describe('AP-7-S4 UI-/Scope-Vertrag', () => {
  test('trennt Loading, Empty, Error und Success', () => {
    const ui = quelle('components/trips/RegistryReiseUebernahme.tsx')
    assert.equal(ui.includes('REGISTRY_TRIP_COPY.pending'), true)
    assert.equal(ui.includes('REGISTRY_TRIP_COPY.leerTitel'), true)
    assert.equal(ui.includes('REGISTRY_TRIP_COPY.fehlerTitel'), true)
    assert.equal(ui.includes('REGISTRY_TRIP_COPY.fehler503'), true)
    assert.equal(ui.includes('REGISTRY_TRIP_COPY.erfolg'), true)
    assert.equal(ui.includes('REGISTRY_TRIP_COPY.limit'), true)
    assert.notEqual(REGISTRY_TRIP_COPY.leerTitel, REGISTRY_TRIP_COPY.fehlerTitel)
    assert.notEqual(REGISTRY_TRIP_COPY.pending, REGISTRY_TRIP_COPY.erfolg)
    assert.match(ui, /role="alert"/)
    assert.match(ui, /role="status"/)
  })

  test('Aktion ist explizit und materialisiert nicht beim Laden', () => {
    const ui = quelle('components/trips/RegistryReiseUebernahme.tsx')
    const seite = quelle('app/(public)/reisen/[tripId]/page.tsx')
    const konto = quelle('components/trips/KontoArbeitsbereich.tsx')
    const gast = quelle('components/trips/GastArbeitsbereich.tsx')

    assert.equal(ui.includes('REGISTRY_TRIP_COPY.aktion'), true)
    assert.equal(ui.includes('REGISTRY_TRIP_COPY.bestaetigen'), true)
    assert.equal(ui.includes('REGISTRY_TRIP_COPY.hinweis'), true)
    assert.match(REGISTRY_TRIP_COPY.hinweis, /Kopie nur für diese Reise/)
    assert.equal(seite.includes('registryTravellerInReiseUebernehmen'), false)
    assert.equal(konto.includes('registryTravellerInReiseUebernehmen'), true)
    assert.equal(gast.includes('registryTravellerInReiseUebernehmen'), false)
    assert.equal(gast.includes('RegistryReiseUebernahme'), false)
    assert.match(seite, /if \(!data\.user \|\| !istKontoKennung\(tripId\)\)/)
    assert.match(seite, /const registry = await registryLaden\(\)/)
  })

  test('wählt niemanden und kein Credential voraus', () => {
    const ui = quelle('components/trips/RegistryReiseUebernahme.tsx')
    assert.equal(ui.includes('citizenships[0]'), false)
    assert.equal(ui.includes('documents[0]'), false)
    assert.equal(ui.includes('defaultPassport'), false)
    assert.equal(ui.includes('selected'), false)
    assert.equal(ui.includes('checked'), false)
    assert.equal(ui.includes('type="radio"'), false)
    assert.equal(ui.includes('useState(travellers'), false)
  })

  test('führt keine sensitiven Felder, keine Live-FK und kein Schema ein', () => {
    const runtime = RUNTIME_QUELLEN.map((pfad) => quelle(pfad)).join('\n')
    for (const feld of SENSIBLE_FELDER) {
      assert.equal(runtime.includes(feld), false, `unerlaubtes Feld ${feld}`)
    }
    assert.equal(runtime.includes('createServiceRole'), false)
    assert.equal(runtime.includes('account_traveller_id'), false)
    assert.equal(runtime.includes('registry_traveller_id'), false)
    assert.equal(runtime.includes('from(\'trip_traveller_citizenships\')'), false)
    assert.equal(runtime.includes('from(\'trip_traveller_documents\')'), false)
    assert.equal(
      dateienUnter('supabase/migrations').some((pfad) => pfad.includes('ap7_s4') || pfad.includes('registry_to_trip')),
      false,
    )
  })

  test('Account-Seite lädt Registry erst nach bestehender Konto-Reise', () => {
    const seite = quelle('app/(public)/reisen/[tripId]/page.tsx')
    const gastReturn = seite.indexOf('return <GastArbeitsbereich')
    const registryLoad = seite.indexOf('registryLaden()')
    const kontoRender = seite.indexOf('<KontoArbeitsbereich')
    assert.ok(gastReturn >= 0)
    assert.ok(registryLoad > gastReturn)
    assert.ok(kontoRender > registryLoad)
  })
})
