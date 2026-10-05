import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { COUNTRY_COPY, landUnbekanntLabel } from '@/lib/country/copy'
import {
  COUNTRY_LOCALES,
  countryCodeNormalisieren,
  katalogLaenderSortiert,
  landAnzeigeText,
  landAuswahlUebernehmen,
  landDarstellung,
  landFlagge,
  landName,
  landOptionLabel,
  landPraefixText,
  landSucheTrifft,
} from '@/lib/country/darstellung'
import { ISO_3166_1_ALPHA2, istKatalogLand } from '@/lib/country/katalog'

describe('Shared Country Foundation', () => {
  test('CH und HR liefern deutsche Namen plus Flaggen-Label', () => {
    const schweiz = landDarstellung('CH', 'de')
    assert.equal(schweiz.art, 'katalog')
    assert.equal(schweiz.code, 'CH')
    assert.equal(schweiz.name, 'Schweiz')
    assert.equal(schweiz.flagge, '🇨🇭')
    assert.equal(schweiz.label, '🇨🇭 Schweiz')
    assert.equal(landOptionLabel('CH', 'de'), '🇨🇭 Schweiz')

    const kroatien = landDarstellung('hr', 'de')
    assert.equal(kroatien.art, 'katalog')
    assert.equal(kroatien.code, 'HR')
    assert.equal(kroatien.name, 'Kroatien')
    assert.equal(kroatien.flagge, '🇭🇷')
    assert.equal(kroatien.label, '🇭🇷 Kroatien')
  })

  test('Locale-Parameter deckt de/en/fr/it/es/pt/pl für CH und HR ab', () => {
    const ch = {
      de: 'Schweiz',
      en: 'Switzerland',
      fr: 'Suisse',
      it: 'Svizzera',
      es: 'Suiza',
      pt: 'Suíça',
      pl: 'Szwajcaria',
    } as const
    const hr = {
      de: 'Kroatien',
      en: 'Croatia',
      fr: 'Croatie',
      it: 'Croazia',
      es: 'Croacia',
      pt: 'Croácia',
      pl: 'Chorwacja',
    } as const

    for (const locale of COUNTRY_LOCALES) {
      assert.equal(landName('CH', locale), ch[locale], `CH/${locale}`)
      assert.equal(landName('HR', locale), hr[locale], `HR/${locale}`)
      assert.notEqual(landName('CH', locale), 'CH')
      assert.notEqual(landName('HR', locale), 'HR')
    }
  })

  test('Sortierung und Suche sind deterministisch', () => {
    const de = katalogLaenderSortiert('de')
    const en = katalogLaenderSortiert('en')
    assert.deepEqual(de, katalogLaenderSortiert('de'))
    assert.deepEqual(en, katalogLaenderSortiert('en'))
    assert.equal(de.includes('AT') && de.includes('CH') && de.includes('DE'), true)
    assert.ok(de.indexOf('AT') < de.indexOf('CH'), 'Österreich vor Schweiz')
    assert.ok(de.indexOf('DE') < de.indexOf('FR'), 'Deutschland vor Frankreich')

    assert.equal(landSucheTrifft('HR', 'kroat', 'de'), true)
    assert.equal(landSucheTrifft('HR', 'KROATIEN', 'de'), true)
    assert.equal(landSucheTrifft('CH', 'schweiz', 'de'), true)
    assert.equal(landSucheTrifft('CH', 'ch', 'de'), true)
    assert.equal(landSucheTrifft('DE', 'kroat', 'de'), false)
    assert.equal(landSucheTrifft('CH', '', 'de'), true)
  })

  test('normalisiert Kleinbuchstaben nur am Contract-Rand', () => {
    assert.equal(countryCodeNormalisieren('ch'), 'CH')
    assert.equal(countryCodeNormalisieren(' Hr '), 'HR')
    assert.equal(countryCodeNormalisieren('c h'), null)
    assert.equal(countryCodeNormalisieren('CHE'), null)
    assert.equal(countryCodeNormalisieren(''), null)
    assert.equal(landDarstellung('ch', 'de').code, 'CH')
  })

  test('lehnt ungültige und unerwartete Codes als neue Katalogländer ab', () => {
    assert.equal(istKatalogLand('XX'), false)
    assert.equal(istKatalogLand('EU'), false)
    assert.equal(istKatalogLand('XK'), false)
    assert.equal(istKatalogLand('CH'), true)
    assert.equal(ISO_3166_1_ALPHA2.length, 249)
    assert.equal(new Set(ISO_3166_1_ALPHA2).size, 249)

    assert.equal(landAuswahlUebernehmen('CH', ''), 'CH')
    assert.equal(landAuswahlUebernehmen('ch', ''), 'CH')
    assert.equal(landAuswahlUebernehmen('XX', ''), '')
    assert.equal(landAuswahlUebernehmen('XX', 'XX'), 'XX')
    assert.equal(landAuswahlUebernehmen('EU', 'CH'), 'CH')
    assert.equal(landAuswahlUebernehmen('', 'CH'), '')
    assert.equal(landFlagge('XX'), null)
    assert.equal(landFlagge('CH'), '🇨🇭')
  })

  test('fällt ohne Intl.DisplayNames deterministisch und ohne Crash zurück', () => {
    const ohneAnzeige = { of() { throw new Error('DisplayNames fehlt') } }
    assert.equal(landName('CH', 'de', ohneAnzeige), 'CH')
    assert.equal(landOptionLabel('CH', 'de', ohneAnzeige), '🇨🇭 CH')
    assert.equal(landDarstellung('CH', 'de', null).label, '🇨🇭 CH')
    assert.equal(landDarstellung('CH', 'de', { of: () => undefined }).label, '🇨🇭 CH')
  })

  test('leerer Wert bleibt leer und erzeugt kein Defaultland', () => {
    assert.deepEqual(landDarstellung('', 'de'), {
      art: 'leer',
      code: null,
      name: null,
      flagge: null,
      label: '',
    })
    assert.deepEqual(landDarstellung(null, 'de'), {
      art: 'leer',
      code: null,
      name: null,
      flagge: null,
      label: '',
    })
    assert.equal(landAnzeigeText(null), '')
    assert.equal(landAuswahlUebernehmen('', ''), '')
    assert.equal(landPraefixText('Wohnsitz', null), 'Wohnsitz')
  })

  test('unerwartete persistierte Codes bleiben ehrlich und unverändert', () => {
    const unbekannt = landDarstellung('XX', 'de')
    assert.equal(unbekannt.art, 'unbekannt')
    assert.equal(unbekannt.code, 'XX')
    assert.equal(unbekannt.flagge, null)
    assert.equal(unbekannt.label, landUnbekanntLabel('XX'))
    assert.equal(unbekannt.label.includes('Schweiz'), false)
    assert.equal(landPraefixText('Wohnsitz', 'XX'), `Wohnsitz ${landUnbekanntLabel('XX')}`)
    assert.equal(landPraefixText('Wohnsitz', 'CH'), 'Wohnsitz 🇨🇭 Schweiz')
    assert.match(COUNTRY_COPY.bestehendHinweis, /kein bekanntes Land/)
  })
})
