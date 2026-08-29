import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { DOKUMENT_LEBENSZYKLUS_COPY } from '@/lib/traveller/dokument-lebenszyklus-copy'
import {
  dokumentAblaufGegenReferenztag,
  dokumentAblaufGegenReise,
  dokumentKontoAblaufText,
  dokumentReiseAblaufText,
} from '@/lib/traveller/dokument-lebenszyklus'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

const UI_QUELLEN = [
  'components/account/AccountReisendeKarte.tsx',
  'lib/traveller/dokument-lebenszyklus-copy.ts',
  'lib/traveller/dokument-lebenszyklus.ts',
]

const VERBOTENE_INFERENZ = [
  'best passport',
  'preferred',
  'chosen',
  'primaryPassport',
  'defaultPassport',
  'gültig für reisen',
  'gültig für die reise',
  'valid for travel',
  'valid passport',
  'visa-free',
  'einreiseberecht',
  'einreise erlaubt',
  'boarding',
  'recommended',
  'bester pass',
  'bevorzugtes dokument',
  'gewähltes dokument',
]

const SCHWELLEN = ['90 Tage', '180 Tage', 'expires soon', 'läuft bald ab', 'in N Tagen']

describe('TA-DL1 UI-/Copy-Vertrag', () => {
  test('Account- und Reise-Texte enthalten keine Wahl-, Visa- oder Einreise-Inferenz', () => {
    const texte = [
      ...Object.values(DOKUMENT_LEBENSZYKLUS_COPY),
      dokumentKontoAblaufText(dokumentAblaufGegenReferenztag('2026-01-01', '2026-08-30')),
      dokumentKontoAblaufText(dokumentAblaufGegenReferenztag('2030-01-01', '2026-08-30')),
      dokumentKontoAblaufText(dokumentAblaufGegenReferenztag(null, '2026-08-30')),
      dokumentReiseAblaufText(dokumentAblaufGegenReise('2026-09-01', '2026-09-10', '2026-09-20')),
      dokumentReiseAblaufText(dokumentAblaufGegenReise('2026-09-15', '2026-09-10', '2026-09-20')),
      dokumentReiseAblaufText(dokumentAblaufGegenReise('2026-09-30', '2026-09-10', '2026-09-20')),
    ].join('\n')

    const oberflaeche = UI_QUELLEN.map((pfad) => quelle(pfad)).join('\n').toLowerCase()
    const gesamt = `${texte}\n${oberflaeche}`

    for (const wort of VERBOTENE_INFERENZ) {
      assert.equal(gesamt.includes(wort), false, `unerlaubte Inferenz: ${wort}`)
    }
    for (const schwelle of SCHWELLEN) {
      assert.equal(gesamt.includes(schwelle.toLowerCase()), false, `unerlaubte Schwelle: ${schwelle}`)
    }
  })

  test('Account-Karte zeigt Ablaufstatus pro Dokument und nicht nur farblich', () => {
    const karte = quelle('components/account/AccountReisendeKarte.tsx')
    assert.equal(karte.includes('documents[0]'), false)
    assert.equal(karte.includes('dokumentAblaufGegenReferenztag'), true)
    assert.equal(karte.includes('dokumentKontoAblaufText'), true)
    assert.equal(karte.includes('role="status"'), true)
    assert.equal(karte.includes('heutigesDatum'), true)
    assert.equal(karte.includes('gültig bis'), false)
    assert.equal(karte.includes('DOKUMENT_LEBENSZYKLUS_COPY.kontoHinweis'), true)
  })

  test('Reisevorbereitung bewertet jedes Dokument unabhängig am Reisezeitraum', () => {
    const ui = quelle('components/trips/Reisevorbereitung.tsx')
    assert.equal(ui.includes('documents[0]'), false)
    assert.equal(ui.includes('dokumentAblaufGegenReise'), true)
    assert.equal(ui.includes('dokumentReiseAblaufText'), true)
    assert.equal(ui.includes('reise.startDate'), true)
    assert.equal(ui.includes('reise.endDate'), true)
    assert.equal(ui.includes('DOKUMENT_LEBENSZYKLUS_COPY.reiseHinweis'), true)
    assert.equal(ui.includes('slot.traveller?.documents'), true)
  })

  test('führt keine persistierte Lifecycle-Spalte und keine Credential-Wahl ein', () => {
    const runtime = [
      'lib/traveller/dokument-lebenszyklus.ts',
      'components/account/AccountReisendeKarte.tsx',
      'components/trips/Reisevorbereitung.tsx',
    ]
      .map((pfad) => quelle(pfad))
      .join('\n')

    assert.equal(runtime.includes('createServiceRole'), false)
    assert.equal(runtime.includes('SERVICE_ROLE'), false)
    assert.equal(runtime.includes('lifecycle_status'), false)
    assert.equal(runtime.includes('primaryCitizenship'), false)
    assert.equal(runtime.includes('chosenCredential'), false)
    assert.equal(runtime.includes('bestPassport'), false)
    assert.equal(/\b90\b/.test(runtime) && runtime.includes('Tage'), false)
  })
})
