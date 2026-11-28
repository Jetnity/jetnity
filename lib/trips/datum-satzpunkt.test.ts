// lib/trips/datum-satzpunkt.test.ts
//
// «Ein Punkt bleibt ein Punkt.» Work-Nachtest 28.11.2026: «27. Dez..» stand bei der bestehenden
// Graz-Reise nicht nur in der Reiseprüfung, sondern auch auf «Meine Reisen»
// («Hier hast du zuletzt weitergeplant · 27. Dez. – 31. Dez..»). Beide Stellen hatten dieselbe
// Ursache: `Intl.DateTimeFormat('de-CH', { month: 'short' })` liefert «Dez.» mit eigenem
// Abkürzungspunkt, und die Satzbildung hängte einen zweiten an.
//
// Drei Prüfungen, die nicht von Beispielreisen abhängen:
//  1. Quelle: jede Satzbildung, in der ein Datumsausdruck unmittelbar vor einem Punkt steht,
//     ist bekannt und endet auf eine Ziffer (Jahr, Tageszahl) – oder läuft über `mitSatzpunkt`.
//  2. Anzeige: der echte Einstieg «Meine Reisen» aus echten Datenbankzeilen, alle zwölf Monate.
//  3. Gespeicherte Reisen: Datenbankzeilen → echte Abbildung → alle Textbildner, wobei jedes
//     Datumsetikett mit Abkürzungspunkt unsichtbar markiert wird. Ein zweiter Punkt direkt
//     hinter der Markierung findet jede Stelle, gleich welcher Formatierer sie baut.

import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as ts from 'typescript'

import PersoenlicherReiseeinstieg from '@/components/account/PersoenlicherReiseeinstieg'
import { mobilitaetsAbdeckung } from '@/lib/mobility/kanten'
import { twelveGoKantenFuerReise } from '@/lib/providers/twelve-go/affiliate/kanten'
import { etappenAgenda } from '@/lib/trips/etappen-tagesagenda'
import { reiseAus, type EtappeZeile, type PunktZeile, type ReiseZeile, type TagZeile } from '@/lib/trips/abbildung'
import { chronologischeLaeufe, laufUntertitel } from '@/lib/trips/n12-chronology-1/laeufe'
import { organisierenBestand } from '@/lib/trips/organisieren/bestand'
import { uebersichtAusZeile, type UebersichtZeile } from '@/lib/trips/reisen-uebersicht'
import { tripAuditV1 } from '@/lib/trips/trip-audit-v1/audit'
import { uebersichtAbleiten } from '@/lib/trips/uebersicht'
import { routeModell } from '@/lib/trips/ux-u1c-route-design-alignment-1/route'
import { mietwagenBestand } from '@/lib/rental-cars/bestand'
import type { Trip } from '@/types/trips'

const MARKE = '\u2063'
const MARKIERT_DOPPELT = /\u2063\.[.!?]/
const KURZMONAT_DOPPELT = /\b(?:Jan|Feb|Apr|Aug|Sept|Okt|Nov|Dez)\u2063?\.\./
const MONATE = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'] as const

/**
 * Satzbildungen, in denen ein Datumsausdruck unmittelbar vor einem Punkt steht und deren Datum
 * nachweislich auf eine Ziffer endet. Jeder Eintrag nennt, warum der Punkt dort nie doppelt ist.
 */
const ZIFFERNENDE_SATZBILDUNGEN: Readonly<Record<string, string>> = {
  'components/admin/payments/PaymentsCenter.tsx::date.slice(8,10)': 'Achsenbeschriftung «TT.MM.» aus Ziffern, kein Monatsname',
  'components/admin/payments/PaymentsCenter.tsx::date.slice(5,7)': 'Achsenbeschriftung «TT.MM.» aus Ziffern, kein Monatsname',
  'components/trips/organisieren/omio/OmioVergleich.tsx::datumText(werte.stand)': 'datumText trägt das Jahr: «19. Dez. 2026»',
  'lib/account/world-map-ansicht.ts::NUR_TAG_FORMAT.format(start)': 'Tageszahl vor «.–», das Ende trägt das Jahr',
  'lib/trips/n12-chronology-1/laeufe.ts::startDatum': 'datumMitWochentag trägt das Jahr: «Sa, 19. Dez. 2026»',
  'lib/trips/ux-u1c-route-design-alignment-1/route.ts::sichtbar': 'Ein Tag ist «19. Dez. 2026» mit Jahr (etappenZeitraumAnzeigen)',
}

const DATUMSAUSDRUCK =
  /(wann|datumKurz|zeitraumKurz|etappenZeitraumAnzeigen|planpunktWann|datumMitWochentag|datumMitJahr|aenderungstextLesbar|etappenDatum|kurzesDatum|shortDate|chipDatum|KURZES_DATUM|DATUM_ANZEIGE|DATUM_FORMAT|TAG_MONAT_FORMAT|datumText|zeitraumText|zeitraum|Datum|\bdate\b|dayDate|startsOn|endsOn|startDate|endDate|arrivalDate|departureDate|\.format\()/

function quellDateien(wurzel: string): string[] {
  const dateien: string[] = []
  for (const ordner of ['app', 'components', 'lib']) {
    for (const eintrag of readdirSync(join(wurzel, ordner), { recursive: true, withFileTypes: true })) {
      if (!eintrag.isFile() || !/\.(ts|tsx)$/.test(eintrag.name) || /\.(test|d)\.(ts|tsx)$/.test(eintrag.name)) continue
      dateien.push(join(eintrag.parentPath, eintrag.name))
    }
  }
  return dateien.sort()
}

/** Datumsausdrücke, auf die im Quelltext sofort ein einzelner Punkt folgt. */
function satzpunktNachDatum(wurzel: string): string[] {
  const funde = new Set<string>()
  for (const pfad of quellDateien(wurzel)) {
    const text = readFileSync(pfad, 'utf8')
    const quelle = ts.createSourceFile(pfad, text, ts.ScriptTarget.Latest, true, pfad.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    const datei = pfad.slice(wurzel.length + 1)
    const markiert = new Set<string>()
    const sammeln = (knoten: ts.Node): void => {
      if (ts.isVariableDeclaration(knoten) && ts.isIdentifier(knoten.name) && knoten.initializer && DATUMSAUSDRUCK.test(knoten.initializer.getText(quelle))) {
        markiert.add(knoten.name.text)
      }
      ts.forEachChild(knoten, sammeln)
    }
    sammeln(quelle)
    const verdaechtig = (ausdruck: ts.Node): boolean => {
      if (DATUMSAUSDRUCK.test(ausdruck.getText(quelle))) return true
      let gefunden = false
      const suchen = (knoten: ts.Node): void => {
        if (ts.isIdentifier(knoten) && markiert.has(knoten.text)) gefunden = true
        ts.forEachChild(knoten, suchen)
      }
      suchen(ausdruck)
      return gefunden
    }
    const einzelpunkt = (folge: string) => /^\./.test(folge) && !/^\.\.\./.test(folge)
    const merken = (ausdruck: ts.Node) => funde.add(`${datei}::${ausdruck.getText(quelle).replace(/\s+/g, ' ')}`)
    const besuchen = (knoten: ts.Node): void => {
      if (ts.isTemplateExpression(knoten)) {
        for (const spanne of knoten.templateSpans) {
          if (einzelpunkt(spanne.literal.text) && verdaechtig(spanne.expression)) merken(spanne.expression)
        }
      }
      if (ts.isJsxExpression(knoten) && knoten.expression) {
        const eltern = knoten.parent
        if (ts.isJsxElement(eltern) || ts.isJsxFragment(eltern)) {
          const nach = eltern.children[eltern.children.indexOf(knoten as ts.JsxChild) + 1]
          if (nach && ts.isJsxText(nach) && einzelpunkt(nach.text) && verdaechtig(knoten.expression)) merken(knoten.expression)
        }
      }
      if (
        ts.isBinaryExpression(knoten) &&
        knoten.operatorToken.kind === ts.SyntaxKind.PlusToken &&
        (ts.isStringLiteral(knoten.right) || ts.isNoSubstitutionTemplateLiteral(knoten.right)) &&
        einzelpunkt(knoten.right.text) &&
        verdaechtig(knoten.left)
      ) {
        merken(knoten.left)
      }
      ts.forEachChild(knoten, besuchen)
    }
    besuchen(quelle)
  }
  return [...funde].sort()
}

describe('Quelle: kein Satzpunkt hinter einem Datumsausdruck ohne Ziffernende', () => {
  test('jede Satzbildung mit Datum vor einem Punkt ist bekannt und endet auf eine Ziffer', () => {
    const funde = satzpunktNachDatum(process.cwd())
    const unbekannt = funde.filter((eintrag) => !(eintrag in ZIFFERNENDE_SATZBILDUNGEN))
    assert.deepEqual(
      unbekannt,
      [],
      'Ein Datumsausdruck steht unmittelbar vor einem Punkt. Ein Kurzmonat bringt den Punkt selbst mit («Dez.»): ' +
        'den Satz mit `mitSatzpunkt(...)` abschliessen. Endet das Datum nachweislich auf eine Ziffer, hier mit Begründung eintragen.',
    )
    const veraltet = Object.keys(ZIFFERNENDE_SATZBILDUNGEN).filter((eintrag) => !funde.includes(eintrag))
    assert.deepEqual(veraltet, [], 'Die Liste der Ausnahmen führt eine Stelle, die es nicht mehr gibt')
  })
})

function uebersichtszeile(abweichung: Partial<UebersichtZeile> = {}): UebersichtZeile {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Graz zum Jahreswechsel',
    origin: 'Zürich',
    start_date: '2026-12-27',
    end_date: '2026-12-31',
    travellers: 2,
    currency: 'CHF',
    budget_amount: null,
    status: 'planned',
    updated_at: '2026-11-27T12:00:00.000000Z',
    metadata: null,
    trip_stages: [{ name: 'Graz', position: 1, country_code: 'AT', place_id: 'place:graz', latitude: '47.0707', longitude: '15.4395' }],
    trip_days: [{ count: 5 }],
    trip_items: [{ count: 6 }],
    ...abweichung,
  }
}

function einstiegText(zeile: UebersichtZeile): string {
  const html = renderToStaticMarkup(createElement(PersoenlicherReiseeinstieg, { reisen: [uebersichtAusZeile(zeile)] }))
  const treffer = /<p class="mt-3[^"]*">([\s\S]*?)<\/p>/.exec(html)
  assert.ok(treffer, 'Der Einstieg zeigt den Satz über die zuletzt geplante Reise')
  return treffer[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim()
}

describe('Meine Reisen: «Hier hast du zuletzt weitergeplant · …»', () => {
  test('Graz vom 27. bis 31. Dezember: genau ein Punkt hinter dem Zeitraum', () => {
    const satz = einstiegText(uebersichtszeile())
    assert.equal(satz, 'Hier hast du zuletzt weitergeplant · 27. Dez. – 31. Dez. Öffne deinen Reiseplan und mache dort weiter.')
    assert.doesNotMatch(satz, /\.\./)
  })

  test('Jahreswechsel behält das Jahr und hat ebenfalls genau einen Punkt', () => {
    const satz = einstiegText(uebersichtszeile({ start_date: '2026-12-27', end_date: '2027-01-03' }))
    assert.equal(satz, 'Hier hast du zuletzt weitergeplant · 27. Dez. 2026 – 03. Jan. 2027. Öffne deinen Reiseplan und mache dort weiter.')
  })

  test('ein Tag, nur Beginn und fehlende Daten bleiben ohne doppelten Punkt', () => {
    assert.equal(
      einstiegText(uebersichtszeile({ start_date: '2026-12-27', end_date: '2026-12-27' })),
      'Hier hast du zuletzt weitergeplant · 27. Dez. 2026. Öffne deinen Reiseplan und mache dort weiter.',
    )
    assert.equal(
      einstiegText(uebersichtszeile({ start_date: '2026-12-27', end_date: null })),
      'Hier hast du zuletzt weitergeplant · Ankunft 27. Dez. 2026. Öffne deinen Reiseplan und mache dort weiter.',
    )
    assert.equal(
      einstiegText(uebersichtszeile({ start_date: null, end_date: null })),
      'Hier hast du zuletzt weitergeplant. Öffne deinen Reiseplan und mache dort weiter.',
    )
  })

  test('alle zwölf Monate: nie «..», ausgeschriebene Monate bekommen den Satzpunkt', () => {
    for (const monat of MONATE) {
      const satz = einstiegText(uebersichtszeile({ start_date: `2026-${monat}-04`, end_date: `2026-${monat}-09` }))
      assert.doesNotMatch(satz, /\.\./, `${monat}: ${satz}`)
      assert.match(satz, /[^.]\. Öffne deinen Reiseplan und mache dort weiter\.$/, `${monat}: ${satz}`)
    }
  })
})

const REISE_ID = '11111111-1111-4111-8111-111111111111'
const ETAPPE_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1'
const JETZT = '2026-11-27T12:00:00.000000Z'

function tag(nr: number, datum: string): TagZeile {
  return { id: `dddddddd-dddd-4ddd-8ddd-ddddddddddd${nr}`, stage_id: ETAPPE_ID, day_index: nr, day_date: datum, title: null }
}

function punkt(nr: number, tagNr: number | null, abweichung: Partial<PunktZeile>): PunktZeile {
  return {
    id: `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa${nr}`,
    day_id: tagNr === null ? null : `dddddddd-dddd-4ddd-8ddd-ddddddddddd${tagNr}`,
    stage_id: ETAPPE_ID,
    kind: 'activity',
    title: 'Punkt',
    note: null,
    position: nr,
    starts_on: null,
    starts_at: null,
    ends_on: null,
    ends_at: null,
    price_amount: null,
    price_currency: null,
    provider: null,
    external_ref: null,
    booking_url: null,
    created_at: JETZT,
    ...abweichung,
  }
}

/** Graz am 27. Dezember, so wie die Datenbank es liefert: `date` als ISO, `time` mit Sekunden, `numeric` als Zeichenkette. */
function grazAusZeilen(punkte: PunktZeile[], start = '2026-12-27', ende = '2026-12-31'): Trip {
  const reise: ReiseZeile = {
    id: REISE_ID, client_ref: 'graz', title: 'Graz zum Jahreswechsel', origin: 'Zürich', origin_place_id: 'place:zurich',
    start_date: start, end_date: ende, travellers: 2, currency: 'CHF', budget_amount: '2400.00', status: 'planned',
    pace: 'balanced', interests: ['culture'], travel_wish: null, revision: 3, last_mutation_id: null,
    created_at: JETZT, updated_at: JETZT,
  }
  const etappe: EtappeZeile = {
    id: ETAPPE_ID, position: 1, name: 'Graz', country_code: 'AT', arrival_date: start, departure_date: ende,
    latitude: '47.0707', longitude: '15.4395', place_id: 'place:graz', created_at: JETZT,
  }
  const tage = [tag(1, start), tag(2, '2026-12-28'), tag(3, '2026-12-29'), tag(4, '2026-12-30'), tag(5, ende)]
  return reiseAus(reise, [etappe], tage, punkte) as Trip
}

const GRAZ_MIT_BAHN: PunktZeile[] = [
  punkt(1, 1, {
    kind: 'transfer', title: 'Railjet Zürich–Graz', mobility_mode: 'rail', origin_name: 'Zürich', destination_name: 'Graz',
    origin_place_id: 'place:zurich', destination_place_id: 'place:graz', starts_on: '2026-12-27', starts_at: '07:15:00',
    ends_on: '2026-12-27', ends_at: '15:40:00', mobility_evidence: 'user',
  }),
  punkt(2, 1, { kind: 'stay', title: 'Altstadthotel Graz', starts_on: '2026-12-27', ends_on: '2026-12-31', price_amount: '960.00', price_currency: 'CHF' }),
  punkt(3, 1, { kind: 'rental_car', title: 'Mietwagen Graz', starts_on: '2026-12-28', ends_on: '2026-12-30', origin_name: 'Graz', destination_name: 'Graz' }),
  punkt(4, 2, { kind: 'activity', title: 'Adventmarkt Graz', starts_on: '2026-12-28', starts_at: '17:00:00' }),
]

const GRAZ_OHNE_VERBINDUNG: PunktZeile[] = [
  punkt(2, 1, { kind: 'stay', title: 'Altstadthotel Graz', starts_on: '2026-12-27', ends_on: '2026-12-31' }),
  punkt(5, 3, { kind: 'activity', title: 'Schlossberg', starts_on: '2026-12-29' }),
]

function texteSammeln(wert: unknown, ziel: string[] = [], tiefe = 0): string[] {
  if (tiefe > 10 || wert === null || wert === undefined) return ziel
  if (typeof wert === 'string') ziel.push(wert)
  else if (Array.isArray(wert)) for (const eintrag of wert) texteSammeln(eintrag, ziel, tiefe + 1)
  else if (wert instanceof Map || wert instanceof Set) for (const eintrag of wert.values()) texteSammeln(eintrag, ziel, tiefe + 1)
  else if (typeof wert === 'object') for (const eintrag of Object.values(wert)) texteSammeln(eintrag, ziel, tiefe + 1)
  return ziel
}

function textbildner(reise: Trip): Record<string, string[]> {
  const laeufe = chronologischeLaeufe(reise)
  return {
    reiseprüfung: texteSammeln(tripAuditV1(reise)),
    route: texteSammeln(routeModell(reise)),
    mobilität: texteSammeln(mobilitaetsAbdeckung(reise, reise.ohneTag)),
    zwoelfGo: texteSammeln(twelveGoKantenFuerReise(reise)),
    chronologie: texteSammeln([laeufe, laeufe.gueltig ? laeufe.laeufe.map(laufUntertitel) : []]),
    übersicht: texteSammeln(uebersichtAbleiten(reise, reise.ohneTag, '2026-11-28')),
    tagesagenda: texteSammeln(etappenAgenda(reise.days)),
    mietwagen: texteSammeln(mietwagenBestand(reise, reise.ohneTag)),
    ...Object.fromEntries(
      (['fluege', 'unterkunft', 'aktivitaeten', 'mietwagen', 'verbindungen'] as const).map((kategorie) => [
        `organisieren-${kategorie}`,
        texteSammeln(organisierenBestand(reise, reise.ohneTag, kategorie)),
      ]),
    ),
  }
}

describe('Gespeicherte Reisen aus Datenbankzeilen: kein Textbildner setzt einen zweiten Punkt', () => {
  const originalFormat = Object.getOwnPropertyDescriptor(Intl.DateTimeFormat.prototype, 'format')!

  before(() => {
    Object.defineProperty(Intl.DateTimeFormat.prototype, 'format', {
      configurable: true,
      get(this: Intl.DateTimeFormat) {
        const roh = originalFormat.get!.call(this) as (datum?: Date | number) => string
        return (datum?: Date | number) => {
          const text = roh(datum)
          return text.endsWith('.') ? `${text.slice(0, -1)}${MARKE}.` : text
        }
      },
    })
  })

  after(() => {
    Object.defineProperty(Intl.DateTimeFormat.prototype, 'format', originalFormat)
  })

  const faelle: [string, () => Trip][] = [
    ['Graz am 27. Dezember mit Bahn, Hotel und Mietwagen', () => grazAusZeilen(GRAZ_MIT_BAHN)],
    ['Graz am 27. Dezember ohne gespeicherte Verbindung', () => grazAusZeilen(GRAZ_OHNE_VERBINDUNG)],
    ['Graz über den Jahreswechsel bis 3. Januar', () => grazAusZeilen(GRAZ_MIT_BAHN, '2026-12-27', '2027-01-03')],
    ...MONATE.map((monat): [string, () => Trip] => [
      `Graz im Monat ${monat}`,
      () => grazAusZeilen(
        JSON.parse(JSON.stringify(GRAZ_MIT_BAHN).replaceAll('2026-12-', `2026-${monat}-`)) as PunktZeile[],
        `2026-${monat}-27`,
        `2026-${monat}-30`,
      ),
    ]),
  ]

  for (const [name, bauen] of faelle) {
    test(name, () => {
      const reise = bauen()
      const gruppen = textbildner(reise)
      const alle = Object.values(gruppen).flat()
      const markiert = alle.filter((text) => text.includes(MARKE))
      assert.ok(markiert.length > 0, 'Der Test sieht Datumsetiketten; ohne sie wäre er leer')
      for (const [gruppe, texte] of Object.entries(gruppen)) {
        for (const text of texte) {
          assert.doesNotMatch(text, MARKIERT_DOPPELT, `${gruppe}: ${text}`)
          assert.doesNotMatch(text, KURZMONAT_DOPPELT, `${gruppe}: ${text}`)
          assert.doesNotMatch(text, /(?<!\.)\.\.(?!\.)/, `${gruppe}: ${text}`)
        }
      }
    })
  }

  test('Graz am 27. Dezember: die Reiseprüfung nennt «Zürich → Graz · 27. Dez.» mit genau einem Punkt', () => {
    const texte = textbildner(grazAusZeilen(GRAZ_OHNE_VERBINDUNG))['reiseprüfung'].map((text) => text.replaceAll(MARKE, ''))
    assert.ok(texte.includes('Zürich → Graz · 27. Dez.'), texte.filter((text) => text.includes('Graz')).join(' | '))
  })
})
