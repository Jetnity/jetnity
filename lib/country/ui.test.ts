import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

const CONTROL = 'components/country/LandFeld.tsx'
const ACCOUNT = [
  'components/account/AccountReisende.tsx',
  'components/account/AccountReisendeKarte.tsx',
]
const TRIP = 'components/trips/Reisevorbereitung.tsx'

describe('TA-CUX1 Country-Control UI-Vertrag', () => {
  test('LandFeld ist native Select plus Filter und keine Custom-Combobox', () => {
    const control = quelle(CONTROL)
    assert.equal(control.includes('<select'), true)
    assert.equal(control.includes('role="searchbox"'), true)
    assert.equal(control.includes('role="combobox"'), false)
    assert.equal(control.includes('role="listbox"'), false)
    assert.equal(control.includes('touch-pan-x'), false)
    assert.equal(control.includes('min-h-11'), true)
    assert.equal(control.includes("event.key === 'Enter'"), true)
    assert.equal(control.includes('landAuswahlUebernehmen'), true)
    assert.equal(control.includes('navigator.language'), false)
    assert.equal(control.includes('navigator.geolocation'), false)
    assert.equal(control.includes('Intl.DateTimeFormat'), false)
  })

  test('Account-Registry zeigt keine ISO-2-Freitextfelder mehr', () => {
    const oberflaeche = ACCOUNT.map((pfad) => quelle(pfad)).join('\n')
    assert.equal(oberflaeche.includes('LandFeld'), true)
    assert.equal(oberflaeche.includes('ISO-2'), false)
    assert.equal(oberflaeche.includes('maxLength={2}'), false)
    assert.equal(oberflaeche.includes('placeholder="z. B. CH"'), false)
    assert.equal(oberflaeche.includes('landAnzeigeText'), true)
    assert.equal(oberflaeche.includes('landPraefixText'), true)
    assert.equal(oberflaeche.includes('citizenships[0]'), false)
    assert.equal(oberflaeche.includes('documents[0]'), false)
    assert.equal(oberflaeche.includes('primaryCitizenship'), false)
    assert.equal(oberflaeche.includes('defaultCitizenship'), false)
  })

  test('Reisevorbereitung nutzt dasselbe LandFeld und keine ISO-2-Freitexte', () => {
    const ui = quelle(TRIP)
    assert.equal(ui.includes('LandFeld'), true)
    assert.equal(ui.includes('ISO-2'), false)
    assert.equal(ui.includes('placeholder="z. B. CH"'), false)
    assert.equal(ui.includes('maxLength={2}'), false)
    assert.equal(ui.includes('touch-pan-x'), false)
    assert.equal(ui.includes('citizenships[0]'), false)
    assert.equal(ui.includes('documents[0]'), false)
    assert.equal(ui.includes('landAnzeigeText'), true)
    assert.equal(ui.includes('landPraefixText'), true)
    assert.equal(ui.includes('dokumenteAlsPayload'), true)
    assert.equal(ui.includes('citizenshipClientRefFuer'), true)
    assert.equal(ui.includes('dokumentAblaufGegenReise'), true)
  })
})
