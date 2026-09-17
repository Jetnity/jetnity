import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  BESUCHE_OHNE_IDENTITAET_TEXT,
  BESUCHE_ZEIT_UNBEKANNT_TEXT,
  besuchAnzeigen,
  besuchKennzahlen,
  besuchZeitText,
  besuchZeitgenauigkeit,
  besucheSortieren,
  besuchteLaender,
  kennzahlText,
  type Besuch,
} from '@/lib/account/besuche'
import {
  BESUCH_MELDUNG,
  besuchAenderungLesen,
  besuchAnlageLesen,
  besuchLoeschungLesen,
  besuchZeitPruefen,
} from '@/lib/account/besuche-eingabe'
import { besuchAusZeile } from '@/lib/account/besuche-daten'
import {
  WELT_BESUCHT_FEHLER_KURZ,
  WELT_BESUCHT_FEHLER_TEXT,
  WELT_BESUCHT_LABEL,
  WELT_BESUCHT_LEER_KURZ,
  weltBesuchtAbleiten,
} from '@/lib/account/welt-ansicht'
import { WELT_ZUSTAND_TEXT, weltLaenderAbleiten } from '@/lib/account/welt-laender'
import { worldMapAbleiten } from '@/lib/account/world-map'
import type { TripSummary } from '@/types/trips'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

const HEUTE = { jahr: 2026, monat: 9, tag: 17 }

function besuch(teil: Partial<Besuch> & Pick<Besuch, 'id'>): Besuch {
  return {
    placeId: null,
    placeLabel: null,
    countryCode: null,
    latitude: null,
    longitude: null,
    jahr: null,
    monat: null,
    tag: null,
    erstelltAm: '2026-09-01T10:00:00.000Z',
    ...teil,
  }
}

function reise(teil: Partial<TripSummary> & Pick<TripSummary, 'id' | 'title'>): TripSummary {
  return {
    origin: null,
    startDate: null,
    endDate: null,
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    updatedAt: '2026-08-01T10:00:00.000Z',
    stages: [],
    dayCount: 0,
    itemCount: 0,
    ...teil,
    stageCount: teil.stageCount ?? teil.stages?.length ?? 0,
  }
}

const GEOMETRIE = {
  PT: { pfade: ['M170 51 L172 51 L172 53 Z'], punkt: null },
  IT: { pfade: ['M192 48 L194 48 L194 51 Z'], punkt: null },
  JP: { pfade: ['M319 54 L321 54 L321 57 Z'], punkt: null },
  SG: { pfade: null, punkt: [283.8, 88.6] as const },
}

describe('Besucht entsteht nur durch ausdrückliche Bestätigung', () => {
  test('vergangene, geplante und archivierte Reisen erzeugen keinen Besuch', () => {
    const vergangen = ['draft', 'planned', 'booked', 'archived'] as const
    const welt = worldMapAbleiten({
      problem: null,
      reisen: vergangen.map((status, stelle) =>
        reise({
          id: `trip-${status}`,
          title: status,
          status,
          startDate: '2001-01-01',
          endDate: '2001-01-10',
          stages: [
            {
              name: 'Lissabon',
              position: 1,
              countryCode: 'PT',
              placeId: 'geonames:2267057',
              latitude: 38.72 + stelle,
              longitude: -9.14,
            },
          ],
        }),
      ),
    })

    const besucht = weltBesuchtAbleiten({ besuche: [], problem: null })

    assert.equal(welt.laenderCodes.includes('PT'), true)
    assert.equal(besucht.lage, 'leer')
    assert.equal(besucht.kennzahlen.ereignisse, 0)
    assert.equal(besucht.laenderCodes.length, 0)

    const laender = weltLaenderAbleiten({
      besucht: besucht.laenderCodes,
      geplant: welt.laenderCodes,
      geometrie: GEOMETRIE,
    })
    assert.deepEqual(
      laender.flaechen.map((flaeche) => `${flaeche.code}:${flaeche.zustand}`),
      ['PT:geplant'],
    )
  })

  test('die Besuchsableitung liest den Reisegraphen nicht einmal', () => {
    for (const datei of ['besuche.ts', 'welt-ansicht.ts', 'besuche-daten.ts']) {
      const text = quelle(datei)
      for (const verboten of [
        "from('trips')",
        "from('trip_stages')",
        'reisenLaden',
        'TripSummary',
        '@/lib/trips/',
        '@/lib/account/world-map',
      ]) {
        assert.equal(text.includes(verboten), false, `${datei}: ${verboten}`)
      }
    }
  })

  test('der Schreibweg fasst keine Reisezeile an', () => {
    const aktionen = quelle('besuche-aktionen.ts')
    // Geschrieben wird nur die eigene Historie. `places` wird ausschliesslich
    // gelesen, um die behauptete Ortsreferenz zu prüfen.
    const tabellen = [
      ...new Set([...aktionen.matchAll(/\.from\('([a-z_]+)'\)/g)].map((treffer) => treffer[1])),
    ].sort()
    assert.deepEqual(tabellen, ['account_visits', 'places'])
    assert.equal(/\.from\('places'\)[\s\S]{0,200}\.(insert|update|delete|upsert)\(/.test(aktionen), false)
  })
})

describe('Wiederholte Besuche bleiben unterscheidbare Ereignisse', () => {
  const dreimalLissabon = [
    besuch({
      id: 'b1',
      placeId: 'geonames:2267057',
      placeLabel: 'Lissabon',
      countryCode: 'PT',
      jahr: 2012,
      monat: 7,
      tag: 14,
    }),
    besuch({
      id: 'b2',
      placeId: 'geonames:2267057',
      placeLabel: 'Lissabon',
      countryCode: 'PT',
      jahr: 2019,
    }),
    besuch({
      id: 'b3',
      placeId: 'geonames:2267057',
      placeLabel: 'Lissabon',
      countryCode: 'PT',
    }),
  ]

  test('drei Aufenthalte sind drei Ereignisse, ein Ort und ein Land', () => {
    const kennzahlen = besuchKennzahlen(dreimalLissabon)
    assert.equal(kennzahlen.ereignisse, 3)
    assert.equal(kennzahlen.orte, 1)
    assert.equal(kennzahlen.laender, 1)
  })

  test('jede Wiederholung trägt ihre Nummer, älteste zuerst gezählt', () => {
    const zeilen = besuchAnzeigen(dreimalLissabon)
    assert.equal(zeilen.length, 3)
    assert.deepEqual(
      zeilen.map((zeile) => zeile.wiederholungText),
      ['Besuch 3 von 3', 'Besuch 2 von 3', 'Besuch 1 von 3'],
    )
    assert.deepEqual(
      zeilen.map((zeile) => zeile.id),
      ['b2', 'b1', 'b3'],
    )
  })

  test('ein einzelner Besuch trägt keine Zählung', () => {
    const zeilen = besuchAnzeigen([dreimalLissabon[0] as Besuch])
    assert.equal(zeilen[0]?.wiederholungText, null)
  })

  test('zwei Orte desselben Landes sind zwei Orte und ein Land', () => {
    const kennzahlen = besuchKennzahlen([
      besuch({ id: 'a', placeId: 'geonames:2267057', placeLabel: 'Lissabon', countryCode: 'PT' }),
      besuch({ id: 'b', placeId: 'geonames:2735943', placeLabel: 'Porto', countryCode: 'PT' }),
    ])
    assert.equal(kennzahlen.orte, 2)
    assert.equal(kennzahlen.laender, 1)
  })

  test('ein Besuch ohne Ländercode erhöht die Länderzahl nicht', () => {
    const kennzahlen = besuchKennzahlen([
      besuch({ id: 'a', placeId: 'geonames:1', placeLabel: 'Irgendwo', countryCode: null }),
      besuch({ id: 'b', placeId: 'geonames:2', placeLabel: 'Lissabon', countryCode: 'PT' }),
    ])
    assert.equal(kennzahlen.laender, 1)
    assert.equal(kennzahlen.orte, 2)
    assert.equal(kennzahlen.ohneLand, 1)
    assert.equal(besuchteLaender([besuch({ id: 'a', countryCode: null, placeId: 'geonames:1' })]).length, 0)
  })

  test('ein Land ohne Ort zählt als Land, nicht als Ort', () => {
    const kennzahlen = besuchKennzahlen([besuch({ id: 'a', countryCode: 'MA' })])
    assert.equal(kennzahlen.laender, 1)
    assert.equal(kennzahlen.orte, 0)
    assert.equal(kennzahlen.ereignisse, 1)
  })
})

describe('Zeitangaben bleiben so genau, wie sie erinnert wurden', () => {
  test('jede Stufe hat ihre eigene Lesart', () => {
    assert.equal(besuchZeitgenauigkeit({ jahr: null, monat: null, tag: null }), 'unbekannt')
    assert.equal(besuchZeitgenauigkeit({ jahr: 2004, monat: null, tag: null }), 'jahr')
    assert.equal(besuchZeitgenauigkeit({ jahr: 2004, monat: 5, tag: null }), 'monat')
    assert.equal(besuchZeitgenauigkeit({ jahr: 2004, monat: 5, tag: 9 }), 'tag')
  })

  test('ein unbekannter Zeitpunkt wird nicht zum 1. Januar', () => {
    assert.equal(besuchZeitText({ jahr: null, monat: null, tag: null }), BESUCHE_ZEIT_UNBEKANNT_TEXT)
    assert.equal(besuchZeitText({ jahr: 2004, monat: null, tag: null }), '2004')
    assert.equal(besuchZeitText({ jahr: 2004, monat: 5, tag: null }), 'Mai 2004')
    assert.equal(besuchZeitText({ jahr: 2004, monat: 5, tag: 9 }), '9. Mai 2004')
    assert.equal(besuchZeitText({ jahr: 2004, monat: null, tag: null }).includes('1.'), false)
  })

  test('undatierte Besuche stehen am Ende, nicht bei "sehr alt"', () => {
    const sortiert = besucheSortieren([
      besuch({ id: 'ohne' }),
      besuch({ id: 'alt', jahr: 1998 }),
      besuch({ id: 'neu', jahr: 2024, monat: 3 }),
    ])
    assert.deepEqual(
      sortiert.map((eintrag) => eintrag.id),
      ['neu', 'alt', 'ohne'],
    )
  })

  test('ein Monat ohne Jahr und ein Tag ohne Monat werden abgewiesen', () => {
    assert.deepEqual(besuchZeitPruefen({ jahr: null, monat: 5, tag: null }, HEUTE), {
      ok: false,
      meldung: BESUCH_MELDUNG.monatOhneJahr,
    })
    assert.deepEqual(besuchZeitPruefen({ jahr: 2004, monat: null, tag: 9 }, HEUTE), {
      ok: false,
      meldung: BESUCH_MELDUNG.tagOhneMonat,
    })
  })

  test('der 30. Februar ist kein Datum', () => {
    assert.deepEqual(besuchZeitPruefen({ jahr: 2023, monat: 2, tag: 30 }, HEUTE), {
      ok: false,
      meldung: BESUCH_MELDUNG.datumUngueltig,
    })
    assert.equal(besuchZeitPruefen({ jahr: 2024, monat: 2, tag: 29 }, HEUTE).ok, true)
  })

  test('ein Besuch kann nicht in der Zukunft liegen', () => {
    assert.deepEqual(besuchZeitPruefen({ jahr: 2027, monat: null, tag: null }, HEUTE), {
      ok: false,
      meldung: BESUCH_MELDUNG.jahrBereich,
    })
    assert.deepEqual(besuchZeitPruefen({ jahr: 2026, monat: 12, tag: null }, HEUTE), {
      ok: false,
      meldung: BESUCH_MELDUNG.datumZukunft,
    })
    assert.equal(besuchZeitPruefen({ jahr: 2026, monat: 9, tag: 17 }, HEUTE).ok, true)
    assert.equal(besuchZeitPruefen({ jahr: 2026, monat: null, tag: null }, HEUTE).ok, true)
  })
})

describe('Die Eingabe trägt Referenzen, niemals Geografie', () => {
  test('ein Ort ohne Land und ein Land ohne Ort sind beide gültig', () => {
    const mitOrt = besuchAnlageLesen(
      { placeId: 'geonames:2267057', countryCode: null, jahr: null, monat: null, tag: null },
      HEUTE,
    )
    assert.equal(mitOrt.ok, true)
    assert.equal(mitOrt.ok && mitOrt.wert.placeId, 'geonames:2267057')

    const nurLand = besuchAnlageLesen(
      { placeId: null, countryCode: 'PT', jahr: 2010, monat: null, tag: null },
      HEUTE,
    )
    assert.equal(nurLand.ok, true)
    assert.equal(nurLand.ok && nurLand.wert.countryCode, 'PT')
  })

  test('ohne Ort und ohne Land entsteht kein Besuch', () => {
    assert.deepEqual(
      besuchAnlageLesen({ placeId: null, countryCode: null, jahr: 2010, monat: null, tag: null }, HEUTE),
      { ok: false, meldung: BESUCH_MELDUNG.ohneZiel },
    )
  })

  test('ein Ländercode ausserhalb des Katalogs wird nicht übernommen', () => {
    assert.deepEqual(
      besuchAnlageLesen({ placeId: null, countryCode: 'XX', jahr: null, monat: null, tag: null }, HEUTE),
      { ok: false, meldung: BESUCH_MELDUNG.landUnbekannt },
    )
  })

  test('zu einem Ort wird kein mitgeschicktes Land übernommen', () => {
    const gemischt = besuchAnlageLesen(
      { placeId: 'geonames:2267057', countryCode: 'FR', jahr: null, monat: null, tag: null },
      HEUTE,
    )
    assert.equal(gemischt.ok, true)
    // Lissabon liegt nicht in Frankreich, und das Formular darf es auch nicht
    // behaupten: der Ländercode zum Ort kommt aus `public.places`.
    assert.equal(gemischt.ok && gemischt.wert.countryCode, null)
  })

  test('die Eingabe kennt kein Feld für Name oder Koordinaten', () => {
    const eingabe = quelle('besuche-eingabe.ts')
    for (const verboten of ['latitude', 'longitude', 'placeLabel', 'place_label', 'name:']) {
      assert.equal(eingabe.includes(verboten), false, verboten)
    }
    const formular = quelle('../../components/account/AccountBesuchFormular.tsx')
    assert.match(formular, /placeId: wert\.ort\?\.id \?\? null/)
    assert.equal(formular.includes('latitude'), false)
    assert.equal(formular.includes('longitude'), false)
  })

  test('eine Änderung braucht eine eigene Id, eine Löschung nur sie', () => {
    const ohneId = besuchAenderungLesen(
      { placeId: 'geonames:1', countryCode: null, jahr: null, monat: null, tag: null },
      HEUTE,
    )
    assert.equal(ohneId.ok, false)
    const gueltig = besuchAenderungLesen(
      {
        id: '11111111-1111-4111-8111-111111111111',
        placeId: 'geonames:1',
        countryCode: null,
        jahr: null,
        monat: null,
        tag: null,
      },
      HEUTE,
    )
    assert.equal(gueltig.ok, true)
    assert.equal(besuchLoeschungLesen({ id: 'kein-uuid' }).ok, false)
    assert.equal(besuchLoeschungLesen({ id: '11111111-1111-4111-8111-111111111111' }).ok, true)
  })
})

describe('Der Schreibweg bleibt eigenes Konto, ohne Service-Role', () => {
  const aktionen = quelle('besuche-aktionen.ts')

  test('jede Aktion prüft die Anmeldung und schreibt die eigene user_id', () => {
    assert.match(aktionen, /'use server'/)
    assert.equal((aktionen.match(/await konto\(\)/g) ?? []).length, 3)
    assert.equal((aktionen.match(/BESUCH_MELDUNG\.nichtAngemeldet/g) ?? []).length, 3)
    assert.match(aktionen, /\.insert\(\{ user_id: benutzerId, \.\.\.zeile\.wert \}\)/)
    assert.match(aktionen, /supabase\.auth\.getUser\(\)/)
    assert.equal(/auth\.getSession\(/.test(aktionen), false)
  })

  test('kein Service-Role und kein Fremdkonto-Schlüssel', () => {
    for (const verboten of [
      'SERVICE_ROLE',
      'service_role',
      'createClient(',
      'createBrowserClient',
    ]) {
      assert.equal(aktionen.includes(verboten), false, verboten)
    }
    const daten = quelle('besuche-daten.ts')
    assert.match(daten, /import 'server-only'/)
    assert.equal(daten.includes('SERVICE_ROLE'), false)
  })

  test('Ändern und Widerrufen melden einen leeren Treffer als nicht gefunden', () => {
    assert.equal((aktionen.match(/BESUCH_MELDUNG\.nichtGefunden/g) ?? []).length, 2)
    assert.equal((aktionen.match(/\.select\('id'\)/g) ?? []).length, 2)
    // Kein eigener Owner-Filter im Code: über das Eigentum entscheidet RLS.
    assert.equal(/\.eq\('user_id'/.test(aktionen), false)
  })

  test('Flughäfen werden nicht als besuchter Ort übernommen', () => {
    assert.match(aktionen, /ort\.typ === 'airport'/)
  })
})

describe('Kennzahlen werden gerechnet, nie gespeichert', () => {
  test('keine Spalte und kein Feld trägt einen Zähler', () => {
    const migration = readFileSync(
      join(hier, '../../supabase/migrations/20260917120000_account_visits.sql'),
      'utf8',
    )
    const spalten = [
      ...(migration
        .slice(migration.indexOf('create table public.account_visits'))
        .split('constraint')[0] ?? ''
      ).matchAll(/^ {2}([a-z_]+) /gm),
    ].map((treffer) => treffer[1])
    assert.equal(spalten.includes('id'), true, 'Spaltenliste nicht gefunden')
    for (const spalte of spalten) {
      assert.equal(
        /(^|_)(count|counter|anzahl|summe|total)(_|$)/.test(spalte ?? ''),
        false,
        `Spalte ${spalte} sieht nach einem Zähler aus`,
      )
    }
    const daten = quelle('besuche-daten.ts')
    assert.equal(daten.includes('head: true'), false)
  })

  test('die Kennzahl ist ein Satz, kein Punktestand', () => {
    assert.equal(kennzahlText(1, 1), '1 Land · 1 Ort')
    assert.equal(kennzahlText(3, 7), '3 Länder · 7 Orte')
    const leer = weltBesuchtAbleiten({ besuche: [], problem: null })
    assert.equal(leer.kurz, WELT_BESUCHT_LEER_KURZ)
    assert.equal(/\d/.test(leer.kurz), false)
  })
})

describe('Leer und Fehler bleiben zwei Aussagen', () => {
  test('ein Lesefehler erscheint nicht als leere Historie', () => {
    const fehler = weltBesuchtAbleiten({
      besuche: [],
      problem: { status: 503, message: 'unavailable' },
    })
    const leer = weltBesuchtAbleiten({ besuche: [], problem: null })
    assert.equal(fehler.lage, 'fehler')
    assert.equal(leer.lage, 'leer')
    assert.notEqual(fehler.kurz, leer.kurz)
    // Die Kurzform sagt nicht „null“, sondern „unbekannt“, und sie wiederholt
    // den ganzen Satz nicht, der direkt daneben steht.
    assert.equal(fehler.kurz, WELT_BESUCHT_FEHLER_KURZ)
    assert.equal(/\d/.test(fehler.kurz), false)
    assert.equal(fehler.fehlerText, WELT_BESUCHT_FEHLER_TEXT)
    assert.equal(leer.fehlerText, null)
    assert.equal(fehler.label, WELT_BESUCHT_LABEL)
  })

  test('die bestätigte Seite überlebt einen Ausfall der geplanten Seite', () => {
    const welt = worldMapAbleiten({ problem: { status: 500, message: 'x' }, reisen: [] })
    const besucht = weltBesuchtAbleiten({
      besuche: [besuch({ id: 'a', countryCode: 'PT', placeId: 'geonames:1', placeLabel: 'Lissabon' })],
      problem: null,
    })
    assert.equal(welt.lage, 'fehler')
    assert.equal(besucht.lage, 'erfasst')
    const laender = weltLaenderAbleiten({
      besucht: besucht.laenderCodes,
      geplant: welt.laenderCodes,
      geometrie: GEOMETRIE,
    })
    assert.deepEqual(
      laender.flaechen.map((flaeche) => `${flaeche.code}:${flaeche.zustand}`),
      ['PT:besucht'],
    )
  })

  test('eine Zeile mit fehlender Identität wird sichtbar, nicht erfunden', () => {
    const zeilen = besuchAnzeigen([besuch({ id: 'a' })])
    assert.equal(zeilen[0]?.titel, BESUCHE_OHNE_IDENTITAET_TEXT)
    assert.equal(zeilen[0]?.zeitText, BESUCHE_ZEIT_UNBEKANNT_TEXT)
  })

  test('numerische Spalten werden auch als Zeichenkette gelesen, nie als Null geraten', () => {
    const zeile = besuchAusZeile({
      id: 'a',
      user_id: 'u',
      place_id: 'geonames:1',
      place_label: 'Lissabon',
      country_code: 'PT',
      latitude: '38.722300' as unknown as number,
      longitude: '-9.139300' as unknown as number,
      visited_year: 2012,
      visited_month: null,
      visited_day: null,
      created_at: '2026-09-01T10:00:00.000Z',
      updated_at: '2026-09-01T10:00:00.000Z',
    })
    assert.equal(zeile.latitude, 38.7223)
    assert.equal(zeile.longitude, -9.1393)

    const kaputt = besuchAusZeile({
      id: 'b',
      user_id: 'u',
      place_id: null,
      place_label: null,
      country_code: 'PT',
      latitude: 'keine Zahl' as unknown as number,
      longitude: null,
      visited_year: null,
      visited_month: null,
      visited_day: null,
      created_at: '2026-09-01T10:00:00.000Z',
      updated_at: '2026-09-01T10:00:00.000Z',
    })
    assert.equal(kaputt.latitude, null)
  })
})

describe('Besucht und geplant überschreiben einander nicht', () => {
  test('dasselbe Land trägt beide Zustände', () => {
    const laender = weltLaenderAbleiten({
      besucht: ['PT', 'IT'],
      geplant: ['PT', 'JP'],
      geometrie: GEOMETRIE,
    })
    assert.deepEqual(
      laender.flaechen.map((flaeche) => `${flaeche.code}:${flaeche.zustand}`),
      ['IT:besucht', 'JP:geplant', 'PT:beides'],
    )
  })

  test('jeder Zustand hat ein Wort, nicht nur eine Farbe', () => {
    assert.deepEqual(Object.keys(WELT_ZUSTAND_TEXT).sort(), ['beides', 'besucht', 'geplant'])
    assert.equal(WELT_ZUSTAND_TEXT.beides, 'Besucht und geplant')
    const zustaende = quelle('../../components/account/WeltZustaende.tsx')
    // Der überlagerte Zustand ist die Summe der beiden anderen, keine dritte
    // Farbe: gleiche Füllung wie besucht, gleiche Schraffur wie geplant.
    assert.match(zustaende, /beides: 'fill-brand-800\/45'/)
    assert.match(zustaende, /besucht: 'fill-brand-800\/45'/)
    assert.match(zustaende, /beides: true/)
    assert.match(zustaende, /geplant: true/)
    assert.match(zustaende, /besucht: false/)
    assert.match(zustaende, /WELT_ZUSTAND_TEXT\[flaeche\.zustand\]/)
  })

  test('ein Land ohne zeichenbare Fläche bekommt eine Marke statt Schweigen', () => {
    const laender = weltLaenderAbleiten({ besucht: ['SG'], geplant: [], geometrie: GEOMETRIE })
    assert.equal(laender.flaechen[0]?.pfad, null)
    assert.deepEqual(laender.flaechen[0]?.punkt, { x: 283.8, y: 88.6 })
    assert.equal(laender.ohneFlaeche.length, 1)
  })

  test('ein Ländercode ohne jede Kartografie bleibt in Kennzahl und Liste', () => {
    const laender = weltLaenderAbleiten({ besucht: ['AQ'], geplant: [], geometrie: GEOMETRIE })
    assert.equal(laender.flaechen.length, 1)
    assert.equal(laender.flaechen[0]?.pfad, null)
    assert.equal(laender.flaechen[0]?.punkt, null)
    assert.equal(laender.ohneFlaeche.length, 1)
  })

  test('neutrale Länder kommen in der Zustandsebene nicht vor', () => {
    const laender = weltLaenderAbleiten({ besucht: [], geplant: [], geometrie: GEOMETRIE })
    assert.deepEqual(laender.flaechen, [])
    assert.deepEqual(laender.ohneFlaeche, [])
  })
})
