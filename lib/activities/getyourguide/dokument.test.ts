import { createHash } from 'node:crypto'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { landName } from '@/lib/country/darstellung'
import {
  GYG_ANALYZER_SRC,
  GYG_ANZAHL,
  GYG_CMP,
  GYG_HOEHE_HASH,
  GYG_HOEHE_SKRIPT,
  GYG_LOCALE,
  GYG_MARKE_HREF,
  GYG_PARTNER_ID,
  GYG_SANDBOX,
  GYG_WIDGET_HREF,
  embedAntwort,
  embedDokument,
  embedGerahmt,
  embedPfad,
  suchparameterLesen,
} from '@/lib/activities/getyourguide/dokument'
import { gygHoeheAnnehmen } from '@/lib/activities/getyourguide/renderer'
import { suchanfrageText, suchkonfigurationBauen } from '@/lib/activities/getyourguide/suche'

function anfrage(suche: string, kopf: Record<string, string> = {}): Request {
  return new Request(`https://jetnity.test/embed/getyourguide${suche}`, { headers: kopf })
}

const RAHMEN = {
  'sec-fetch-dest': 'iframe',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'same-origin',
}

describe('GetYourGuide-Einbettungsdokument', () => {
  test('eine Stadt ausserhalb der Work-Beispiele wird eine Suche ohne Kennung', () => {
    const suche = suchkonfigurationBauen({ umfang: 'stadt', name: 'Lissabon', countryCode: 'PT' })
    assert.ok(suche)
    if (!suche) return
    assert.equal(suche.land, landName('PT', 'de'))
    assert.equal(suchanfrageText(suche), `Lissabon ${suche.land}`)
    assert.equal(JSON.stringify(suche).includes('oeffentlicheKennung'), false)
    assert.equal(JSON.stringify(suche).includes('geonames:'), false)
    assert.equal(embedPfad(suche), '/embed/getyourguide?umfang=stadt&code=PT&name=Lissabon')
    const gelesen = suchparameterLesen('?umfang=stadt&code=PT&name=Lissabon')
    assert.deepEqual(gelesen, suche)
  })

  test('Land, Insel und Region behalten den Typ nur in der Konfiguration', () => {
    const land = suchkonfigurationBauen({ umfang: 'land', name: 'Stadtname', countryCode: 'PT' })
    const insel = suchkonfigurationBauen({ umfang: 'insel', name: 'Kreta', countryCode: 'GR' })
    const region = suchkonfigurationBauen({
      umfang: 'region',
      name: 'Lissabon',
      countryCode: 'pt',
    })
    assert.equal(land?.name, landName('PT', 'de'))
    assert.equal(land && suchanfrageText(land), land?.land)
    assert.equal(insel?.umfang, 'insel')
    assert.equal(insel && suchanfrageText(insel), `Kreta ${insel.land}`)
    assert.equal(region?.countryCode, 'PT')
    assert.equal(region?.umfang, 'region')
    assert.notEqual(region?.umfang, 'stadt')
  })

  test('private Kennungen, Adressen und unbekannte Länder werden keine Suche', () => {
    assert.equal(
      suchkonfigurationBauen({
        umfang: 'stadt',
        name: 'Lissabon trip-gyg-1',
        countryCode: 'PT',
        gesperrt: ['trip-gyg-1'],
      }),
      null,
    )
    assert.equal(suchkonfigurationBauen({ umfang: 'stadt', name: 'https://example.test', countryCode: 'PT' }), null)
    assert.equal(suchkonfigurationBauen({ umfang: 'stadt', name: 'geonames:2267057', countryCode: 'PT' }), null)
    assert.equal(suchkonfigurationBauen({ umfang: 'stadt', name: 'Lissabon', countryCode: 'XX' }), null)
    assert.equal(suchkonfigurationBauen({ umfang: 'stadt', name: 'Lissabon<script>', countryCode: 'PT' }), null)
    const suche = suchkonfigurationBauen({ umfang: 'region', name: 'Alentejo', countryCode: 'PT' })
    assert.equal(suche?.name, 'Alentejo')
    assert.equal(JSON.stringify(suche).includes('admin1'), false)
  })

  test('das gerahmte Dokument enthält Analyzer, Partner und die neutrale Marke genau einmal', () => {
    const suche = suchparameterLesen('?umfang=stadt&code=PT&name=Lissabon')
    assert.ok(suche)
    if (!suche) return
    const html = embedDokument(suche)
    assert.equal(html.split(GYG_ANALYZER_SRC).length - 1, 1)
    assert.equal(html.split('data-gyg-partner-id="2MQHT6Z"').length - 1, 2)
    assert.match(html, new RegExp(`data-gyg-q="${suchanfrageText(suche)}"`))
    assert.match(html, new RegExp(`data-gyg-cmp="${GYG_CMP}"`))
    assert.match(html, new RegExp(`data-gyg-locale-code="${GYG_LOCALE}"`))
    assert.match(html, new RegExp(`data-gyg-number-of-items="${GYG_ANZAHL}"`))
    assert.match(html, new RegExp(`data-gyg-href="${GYG_WIDGET_HREF}"`))
    assert.match(html, new RegExp(`href="${GYG_MARKE_HREF}"`))
    assert.equal(html.includes('Panama+City'), false)
    assert.equal(html.includes('lc=811'), false)
    assert.equal(html.includes('partner_id='), false)
    assert.equal(GYG_PARTNER_ID, '2MQHT6Z')
  })

  test('ein direkt geöffnetes oder ungültiges Dokument lädt nichts Externes', async () => {
    const direkt = embedAntwort(anfrage('?umfang=stadt&code=PT&name=Lissabon'))
    assert.equal(direkt.status, 200)
    const direktHtml = await direkt.text()
    assert.equal(direktHtml.includes('<script'), false)
    assert.equal(direktHtml.includes(GYG_ANALYZER_SRC), false)
    assert.equal(direktHtml.includes('Lissabon'), false)
    assert.match(direktHtml, /nur nach dem Anzeigen/)
    assert.equal(direkt.headers.get('referrer-policy'), 'no-referrer')
    assert.match(direkt.headers.get('x-robots-tag') ?? '', /noindex/)
    assert.match(direkt.headers.get('content-security-policy') ?? '', /frame-ancestors 'self'/)
    assert.match(direkt.headers.get('content-security-policy') ?? '', new RegExp(`sandbox ${GYG_SANDBOX}`))
    assert.equal((direkt.headers.get('content-security-policy') ?? '').includes('allow-same-origin'), false)

    const fremd = embedAntwort(
      anfrage('?umfang=stadt&code=PT&name=Lissabon', {
        'sec-fetch-dest': 'iframe',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'cross-site',
      }),
    )
    assert.equal((await fremd.text()).includes('<script'), false)
    assert.equal(embedGerahmt(anfrage('', RAHMEN)), true)

    const aktiv = embedAntwort(anfrage('?umfang=land&code=IS', RAHMEN))
    assert.equal(aktiv.status, 200)
    const aktivHtml = await aktiv.text()
    assert.equal(aktivHtml.split(GYG_ANALYZER_SRC).length - 1, 1)
    assert.match(aktivHtml, new RegExp(`data-gyg-q="${landName('IS', 'de')}"`))
    assert.equal(aktiv.headers.get('cache-control'), 'private, no-store')
    assert.equal((aktiv.headers.get('content-security-policy') ?? '').includes('allow-same-origin'), false)
    assert.equal(aktivHtml.split(GYG_HOEHE_SKRIPT).length - 1, 1)
    assert.equal(createHash('sha256').update(GYG_HOEHE_SKRIPT).digest('base64'), GYG_HOEHE_HASH.slice('sha256-'.length))
    assert.equal((aktiv.headers.get('content-security-policy') ?? '').includes(`'${GYG_HOEHE_HASH}'`), true)
    assert.equal((aktiv.headers.get('content-security-policy') ?? '').includes("'unsafe-inline'"), true)
    assert.equal((aktiv.headers.get('content-security-policy') ?? '').includes('script-src \'unsafe-inline\''), false)
  })

  test('die Höhennachricht akzeptiert nur den eigenen undurchsichtigen Rahmen', () => {
    const fenster = {}
    const rahmen = { contentWindow: fenster, style: { height: '' } } as unknown as HTMLIFrameElement
    const gueltig = { quelle: 'jetnity-gyg-rahmen', art: 'hoehe', px: 1171 }
    assert.equal(gygHoeheAnnehmen(rahmen, { origin: 'null', source: fenster as MessageEventSource, data: gueltig }), true)
    assert.equal(rahmen.style.height, '1171px')
    assert.equal(gygHoeheAnnehmen(rahmen, { origin: 'https://widget.getyourguide.com', source: fenster as MessageEventSource, data: gueltig }), false)
    assert.equal(gygHoeheAnnehmen(rahmen, { origin: 'null', source: {} as MessageEventSource, data: gueltig }), false)
    assert.equal(gygHoeheAnnehmen(rahmen, { origin: 'null', source: fenster as MessageEventSource, data: { ...gueltig, tour: 1 } }), false)
    assert.equal(gygHoeheAnnehmen(rahmen, { origin: 'null', source: fenster as MessageEventSource, data: { ...gueltig, px: 2401 } }), false)
    assert.equal(gygHoeheAnnehmen(rahmen, { origin: 'null', source: fenster as MessageEventSource, data: { ...gueltig, px: Number.NaN } }), false)
    assert.equal(rahmen.style.height, '1171px')
  })

  test('doppelte, übergrosse und fremde Parameter laden den Analyzer nicht', async () => {
    const faelle = [
      '?umfang=stadt&umfang=land&code=PT&name=Lissabon',
      '?umfang=stadt&code=PT&name=Lissabon&partner=ANDERER',
      '?umfang=stadt&code=PT&name=Lissabon&data-gyg-partner-id=ANDERER',
      '?umfang=land&code=PT&name=Lissabon',
      '?umfang=stadt&code=PT',
      '?umfang=stadt&code=PT&name=' + 'A'.repeat(400),
      '?umfang=stadt&code=NOPE&name=Lissabon',
      '?umfang=stadt&code=PT&name=%3Cscript%3E',
      `?${'umfang=stadt&code=PT&name=Lissabon&'.repeat(40)}`,
    ]
    for (const suche of faelle) {
      const antwort = embedAntwort(anfrage(suche, RAHMEN))
      assert.equal(antwort.status, 400, suche)
      assert.equal((await antwort.text()).includes(GYG_ANALYZER_SRC), false, suche)
    }
  })
})
