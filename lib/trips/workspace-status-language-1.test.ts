// lib/trips/workspace-status-language-1.test.ts
//
// VUX-3 display-string invariants. States, counts, identities, actions and
// commercial protection stay on the existing canonical derivations.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { mobilitaetsAbdeckung } from '@/lib/mobility/kanten'
import { istKommerziell } from '@/lib/reiseaenderung/geschuetzt'
import { attentionAbleiten } from '@/lib/trips/attention'
import { bereichStatus } from '@/lib/trips/arbeitsbereich'
import {
  DETAIL_LAGE_TEXT,
  gapDetailAbleiten,
  gapEyebrowText,
  gapNebenzeile,
} from '@/lib/trips/detail'
import { flugAbdeckung } from '@/lib/trips/flug-abdeckung'
import { unterkunftAbdeckung } from '@/lib/trips/naechte-abdeckung'
import { uebersichtAbleiten } from '@/lib/trips/uebersicht'
import type { Trip, TripItem, TripTraveller } from '@/types/trips'

const JETZT = '2026-08-21T00:00:00.000Z'
const HEUTE = '2026-08-24'

const VERBOTENE_ANZEIGE = [
  'Anbieter folgt',
  'Pflichtlücke',
  'vollständig bestimmbar',
  'noch nicht bestimmbar',
  'Lage noch nicht',
  'Zeitliche Lage noch nicht bestimmbar',
  'Flugabdeckung',
  'Unterkunftsabdeckung',
]

function punkt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'kind' | 'title'>): TripItem {
  return {
    dayId: 'day-1',
    stageId: 'stage-1',
    note: null,
    position: 1,
    startsOn: null,
    startsAt: null,
    endsOn: null,
    endsAt: null,
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    bookingStatus: 'unconfirmed',
    bookingSource: null,
    bookingConfirmedAt: null,
    mobilityMode: null,
    originPlaceId: null,
    destinationPlaceId: null,
    originName: null,
    destinationName: null,
    connectionRef: null,
    mobilityChanges: null,
    mobilityEvidence: null,
    rentalSupplier: null,
    vehicleClass: null,
    transmission: null,
    rentalEvidence: null,
    ...teil,
  }
}

function reisender(teil: Partial<TripTraveller> & Pick<TripTraveller, 'id' | 'clientRef'>): TripTraveller {
  return {
    label: null,
    residenceCountryCode: null,
    citizenships: [],
    documents: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function reise(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-status-language-1',
    clientRef: 'trip-status-language-1',
    title: 'Bali',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 3500,
    status: 'draft',
    pace: 'calm',
    interests: ['beach'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [
      {
        id: 'stage-1',
        position: 1,
        name: 'Ubud',
        countryCode: 'ID',
        arrivalDate: '2026-09-12',
        departureDate: '2026-09-16',
        latitude: null,
        longitude: null,
        placeId: 'geonames:1650535',
      },
    ],
    days: [
      {
        id: 'day-1',
        stageId: 'stage-1',
        dayIndex: 1,
        dayDate: '2026-09-12',
        title: null,
        items: [],
      },
    ],
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function gebuchterHinflug(): TripItem {
  return punkt({
    id: 'flug-hin',
    kind: 'flight',
    title: 'ZRH → DPS',
    dayId: null,
    startsOn: '2026-09-12',
    bookingStatus: 'booked',
    bookingSource: 'user',
    bookingConfirmedAt: JETZT,
    priceAmount: 890,
    priceCurrency: 'CHF',
    provider: 'duffel',
    externalRef: 'off_1',
  })
}

function anzeigeTexte(sicht: {
  fortschrittText: string
  lageText: string
  abdeckungen: readonly { text: string }[]
  planText: string
}): string {
  return [sicht.fortschrittText, sicht.lageText, sicht.planText, ...sicht.abdeckungen.map((eintrag) => eintrag.text)].join(
    '\n',
  )
}

function ohneVerbot(text: string) {
  for (const verboten of VERBOTENE_ANZEIGE) {
    assert.equal(text.includes(verboten), false, `unerlaubte Anzeige: ${verboten} in ${text}`)
  }
  assert.equal(text.includes('Anbieter folgt'), false)
}

describe('bekannte Lagen bleiben unterscheidbar', () => {
  test('known-open behauptet Auswahl-Lücke, unknown tut das nicht', () => {
    const offen = reise()
    const unklarFlug = reise({ origin: null, originPlaceId: null, startDate: null, endDate: null })
    const unklarHotel = reise({
      startDate: null,
      endDate: null,
      stages: [
        {
          ...reise().stages[0]!,
          arrivalDate: null,
          departureDate: null,
        },
      ],
    })

    const flugOffen = flugAbdeckung(offen)
    const flugUnklar = flugAbdeckung(unklarFlug)
    assert.equal(flugOffen.bestimmbar, true)
    assert.equal(flugOffen.abschnitte.every((abschnitt) => abschnitt.status === 'open'), true)
    assert.equal(flugOffen.zusammenfassung, 'Noch kein Flug ausgewählt')
    assert.equal(flugUnklar.bestimmbar, false)
    assert.equal(flugUnklar.zusammenfassung, 'Flugstand noch unklar')
    assert.equal(flugUnklar.zusammenfassung.includes('ausgewählt'), false)
    assert.equal(flugUnklar.zusammenfassung.includes('noch nicht gewählt'), false)

    const hotelOffen = unterkunftAbdeckung(offen)
    const hotelUnklar = unterkunftAbdeckung(unklarHotel)
    assert.equal(hotelOffen.bekannt, true)
    assert.equal(hotelOffen.zusammenfassung, 'Noch keine Unterkunft ausgewählt')
    assert.equal(hotelUnklar.bekannt, false)
    assert.equal(hotelUnklar.zusammenfassung, 'Unterkunftsstand noch unklar')
    assert.equal(hotelUnklar.zusammenfassung.includes('ausgewählt'), false)

    const mobilOffen = mobilitaetsAbdeckung(offen)
    const mobilUnklar = mobilitaetsAbdeckung(unklarFlug)
    assert.equal(mobilOffen.bestimmbar, true)
    assert.equal(mobilOffen.zusammenfassung, 'Noch keine Verbindung geplant')
    assert.equal(mobilUnklar.bestimmbar, false)
    assert.equal(mobilUnklar.zusammenfassung, 'Verbindungsstand noch unklar')
    assert.equal(mobilUnklar.zusammenfassung.includes('geplant'), false)
  })

  test('gebucht, ausgewählt, teilweise und nicht nötig bleiben eigene Texte', () => {
    const hin = gebuchterHinflug()
    const rueck = punkt({
      id: 'flug-rueck',
      kind: 'flight',
      title: 'DPS → ZRH',
      dayId: null,
      startsOn: '2026-09-16',
    })
    const teilweise = flugAbdeckung(reise({ ohneTag: [hin] }), [hin])
    const voll = flugAbdeckung(reise({ ohneTag: [hin, rueck] }), [hin, rueck])
    assert.equal(teilweise.abschnitte[0]?.status, 'booked')
    assert.equal(teilweise.abschnitte[1]?.status, 'open')
    assert.equal(teilweise.zusammenfassung, 'Hinflug gebucht · Rückflug offen')
    assert.equal(voll.abschnitte[0]?.status, 'booked')
    assert.equal(voll.abschnitte[1]?.status, 'selected')
    assert.equal(voll.zusammenfassung, 'Hinflug gebucht · Rückflug ausgewählt')
    assert.notEqual(teilweise.zusammenfassung, voll.zusammenfassung)

    const keineStrecke = flugAbdeckung(
      reise({
        origin: 'Zürich',
        originPlaceId: 'geonames:2657896',
        stages: [
          {
            id: 'stage-1',
            position: 1,
            name: 'Zürich',
            countryCode: 'CH',
            arrivalDate: '2026-09-12',
            departureDate: '2026-09-16',
            latitude: null,
            longitude: null,
            placeId: 'geonames:2657896',
          },
        ],
      }),
    )
    assert.equal(keineStrecke.zusammenfassung, 'Kein Flugabschnitt erforderlich')
    assert.notEqual(keineStrecke.zusammenfassung, voll.zusammenfassung)
    assert.notEqual(keineStrecke.zusammenfassung, 'Noch kein Flug ausgewählt')
  })

  test('Nachtzahlen und gebucht/gewählt bleiben erhalten', () => {
    const hotel = punkt({
      id: 'stay-1',
      kind: 'stay',
      title: 'Ubud Inn',
      startsOn: '2026-09-12',
      endsOn: '2026-09-14',
    })
    const gebucht = punkt({
      id: 'stay-2',
      kind: 'stay',
      title: 'Seminyak',
      startsOn: '2026-09-14',
      endsOn: '2026-09-16',
      bookingStatus: 'booked',
      bookingSource: 'user',
      bookingConfirmedAt: JETZT,
    })
    const teilweise = unterkunftAbdeckung(reise({ days: [{ ...reise().days[0]!, items: [hotel] }] }))
    const gemischt = unterkunftAbdeckung(reise({ days: [{ ...reise().days[0]!, items: [hotel, gebucht] }] }))
    assert.equal(teilweise.naechteAbgedeckt, 2)
    assert.equal(teilweise.naechteGesamt, 4)
    assert.equal(teilweise.zusammenfassung, '2/4 Nächte abgedeckt')
    assert.equal(gemischt.naechteAbgedeckt, 4)
    assert.equal(gemischt.naechteGebucht, 2)
    assert.match(gemischt.zusammenfassung, /4\/4 Nächte abgedeckt/)
    assert.match(gemischt.zusammenfassung, /2 gebucht/)
  })
})

describe('Übersicht und Attention nutzen dieselben kanonischen Texte', () => {
  test('unbestimmte Übersicht zählt nicht als erledigt und bleibt unsicher', () => {
    const flug = punkt({ id: 'flug-1', kind: 'flight', title: 'ZRH–DPS', dayId: null })
    const aktuell = reise({ ohneTag: [flug] })
    const sicht = uebersichtAbleiten(aktuell, [flug], HEUTE)
    const fluege = sicht.abdeckungen.find((eintrag) => eintrag.bereich === 'fluege')
    assert.equal(fluege?.lage, 'unbestimmt')
    assert.equal(fluege?.text, flugAbdeckung(aktuell, [flug]).zusammenfassung)
    assert.match(sicht.fortschrittText, /noch unklar/)
    assert.equal(sicht.fortschrittText.includes('ausgewählt'), false)
    assert.equal(sicht.fortschrittText.includes('vorhanden'), false)
    ohneVerbot(anzeigeTexte(sicht))
  })

  test('leere bekannte Reise bleibt „noch nichts ausgewählt“, nicht unklar', () => {
    const sicht = uebersichtAbleiten(reise(), [], HEUTE)
    assert.equal(sicht.fortschrittText, 'Noch nichts ausgewählt')
    assert.deepEqual(
      sicht.abdeckungen.map((eintrag) => eintrag.lage),
      ['offen', 'offen', 'offen', 'offen'],
    )
    ohneVerbot(anzeigeTexte(sicht))
  })

  test('Coverage-Titel folgt der bestehenden Lage, nicht einer zweiten Ableitung', () => {
    const leer = attentionAbleiten({
      reise: reise(),
      orchestriereSafety: false,
      orchestriereSeasonal: false,
    })
    const flugOffen = leer.punkte.find((eintrag) => eintrag.signal === 'coverage.fluege')
    const hotelOffen = leer.punkte.find((eintrag) => eintrag.signal === 'coverage.unterkunft')
    assert.equal(flugOffen?.lage, 'known_gap')
    assert.equal(flugOffen?.titel, 'Flugstrecke noch offen')
    assert.equal(hotelOffen?.titel, 'Unterkunftsnächte fehlen noch')
    assert.deepEqual(flugOffen?.aktion, { art: 'bereich', bereich: 'fluege' })

    const unklar = attentionAbleiten({
      reise: reise({
        origin: null,
        originPlaceId: null,
        startDate: null,
        endDate: null,
        stages: [{ ...reise().stages[0]!, arrivalDate: null, departureDate: null }],
      }),
      orchestriereSafety: false,
      orchestriereSeasonal: false,
    })
    const flugUnklar = unklar.punkte.find((eintrag) => eintrag.signal === 'coverage.fluege')
    const hotelUnklar = unklar.punkte.find((eintrag) => eintrag.signal === 'coverage.unterkunft')
    assert.equal(flugUnklar?.lage, 'unknown')
    assert.equal(flugUnklar?.titel, 'Flugstand noch unklar')
    assert.equal(hotelUnklar?.titel, 'Unterkunftsstand noch unklar')
    assert.equal(flugUnklar?.titel.includes('ausgewählt'), false)
    assert.equal(flugUnklar?.titel.includes('Anbieter folgt'), false)

    const hin = gebuchterHinflug()
    const teilweise = attentionAbleiten({
      reise: reise({ ohneTag: [hin] }),
      ohneTag: [hin],
      orchestriereSafety: false,
      orchestriereSeasonal: false,
    })
    assert.equal(teilweise.punkte.find((eintrag) => eintrag.signal === 'coverage.fluege')?.titel, 'Flüge nur teilweise geplant')
  })
})

describe('Gap-Anzeige ohne bestätigte Lücke für unknown/optional', () => {
  test('known-open Flug bleibt Pflichtpunkt, unknown nicht als Lücke beschriftet', () => {
    const offen = gapDetailAbleiten(reise(), [], 'fluege')
    const unklar = gapDetailAbleiten(
      reise({ origin: null, originPlaceId: null, startDate: null, endDate: null }),
      [],
      'fluege',
    )
    assert.equal(offen.lage, 'offen')
    assert.equal(offen.istPflichtLuecke, true)
    assert.equal(offen.sucheAnbietbar, true)
    assert.equal(gapEyebrowText(offen), 'Noch offen')
    assert.equal(gapNebenzeile(offen), 'Noch offen')
    assert.match(offen.naechsterSchritt, /ausdrücklich/)

    assert.equal(unklar.lage, 'unbestimmt')
    assert.equal(unklar.istPflichtLuecke, true)
    assert.equal(unklar.sucheAnbietbar, true)
    assert.equal(gapEyebrowText(unklar), 'Noch unklar')
    assert.equal(gapNebenzeile(unklar), 'Noch unklar')
    assert.match(unklar.naechsterSchritt, /Prüfe Reisedaten/)
    assert.equal(unklar.naechsterSchritt.includes('Anbieter folgt'), false)
    assert.equal(gapEyebrowText(unklar).includes('Lücke'), false)
  })

  test('Aktivitäten bleiben optional und erzeugen keine Pflichtlücke', () => {
    const gap = gapDetailAbleiten(reise(), [], 'aktivitaeten')
    assert.equal(gap.lage, 'offen')
    assert.equal(gap.istPflichtLuecke, false)
    assert.equal(gapEyebrowText(gap), 'Optional')
    assert.match(gapNebenzeile(gap), /kein Pflichtpunkt/)
    assert.match(gap.naechsterSchritt, /freiwillig/)
    assert.equal(gap.sucheAnbietbar, true)
  })

  test('Mobilität ohne Live-Suche und ohne covered-by-flight-Erfindung', () => {
    const gap = gapDetailAbleiten(reise(), [], 'mobilitaet')
    assert.equal(gap.lage, 'offen')
    assert.equal(gap.coveredByFlight, false)
    assert.equal(gap.sucheAnbietbar, false)
    assert.equal(gapEyebrowText(gap), 'Noch offen')
    assert.match(gap.naechsterSchritt, /Live-Suche für Verbindungen gibt es hier nicht/)

    const mitFlug = gapDetailAbleiten(
      reise({
        ohneTag: [punkt({ id: 'flug-hin', kind: 'flight', title: 'Zürich → Ubud', dayId: null, startsOn: '2026-09-12' })],
      }),
      [punkt({ id: 'flug-hin', kind: 'flight', title: 'Zürich → Ubud', dayId: null, startsOn: '2026-09-12' })],
      'mobilitaet',
    )
    assert.equal(mitFlug.coveredByFlight, false)
    assert.equal(mitFlug.lage, 'unbestimmt')
    assert.equal(gapEyebrowText(mitFlug), 'Noch unklar')
  })

  test('covered-by-flight Anzeige bleibt Hinweis, nicht bestätigte Lücke', () => {
    const felder = {
      domain: 'mobilitaet' as const,
      lage: 'belegt' as const,
      istPflichtLuecke: false,
      coveredByFlight: true,
    }
    assert.equal(gapEyebrowText(felder), 'Hinweis')
    assert.match(gapNebenzeile(felder), /kein Pflichtpunkt/)
    assert.match(gapNebenzeile(felder), /durch den vorhandenen Flug abgedeckt/)
    assert.notEqual(gapEyebrowText(felder), 'Lücke')
  })

  test('DETAIL_LAGE_TEXT hält die vier Lagen auseinander', () => {
    assert.equal(DETAIL_LAGE_TEXT.offen, 'Noch offen')
    assert.equal(DETAIL_LAGE_TEXT.teilweise, 'Nur teilweise geplant')
    assert.equal(DETAIL_LAGE_TEXT.belegt, 'Kein bekannter offener Punkt')
    assert.equal(DETAIL_LAGE_TEXT.unbestimmt, 'Noch unklar')
    assert.equal(new Set(Object.values(DETAIL_LAGE_TEXT)).size, 4)
  })
})

describe('SL-R1/SL-R2: no-needed belegt behauptet keinen Bestand', () => {
  function gleicheStadtReise(teil: Partial<Trip> = {}): Trip {
    return reise({
      title: 'Zürich',
      origin: 'Zürich',
      originPlaceId: 'geonames:2657896',
      stages: [
        {
          id: 'stage-1',
          position: 1,
          name: 'Zürich',
          countryCode: 'CH',
          arrivalDate: '2026-09-12',
          departureDate: '2026-09-16',
          latitude: null,
          longitude: null,
          placeId: 'geonames:2657896',
        },
      ],
      ...teil,
    })
  }

  test('zero-item gleiche Stadt behält no-needed-Summaries und neutrale Anzeige', () => {
    const aktuell = gleicheStadtReise()
    const sicht = uebersichtAbleiten(aktuell, [], HEUTE)
    const fluege = sicht.abdeckungen.find((eintrag) => eintrag.bereich === 'fluege')
    const mobilitaet = sicht.abdeckungen.find((eintrag) => eintrag.bereich === 'mobilitaet')
    const unterkunft = sicht.abdeckungen.find((eintrag) => eintrag.bereich === 'unterkunft')
    const aktivitaeten = sicht.abdeckungen.find((eintrag) => eintrag.bereich === 'aktivitaeten')
    const kanonisch = bereichStatus(aktuell, [])

    assert.deepEqual(
      kanonisch.map((eintrag) => ({ bereich: eintrag.bereich, lage: eintrag.lage, anzahl: eintrag.anzahl })),
      [
        { bereich: 'fluege', lage: 'belegt', anzahl: 0 },
        { bereich: 'unterkunft', lage: 'offen', anzahl: 0 },
        { bereich: 'aktivitaeten', lage: 'offen', anzahl: 0 },
        { bereich: 'mobilitaet', lage: 'belegt', anzahl: 0 },
      ],
    )
    assert.equal(fluege?.lage, 'belegt')
    assert.equal(fluege?.anzahl, 0)
    assert.equal(fluege?.text, 'Kein Flugabschnitt erforderlich')
    assert.equal(mobilitaet?.lage, 'belegt')
    assert.equal(mobilitaet?.anzahl, 0)
    assert.equal(mobilitaet?.text, 'Keine Verbindung erforderlich')
    assert.equal(unterkunft?.lage, 'offen')
    assert.equal(aktivitaeten?.lage, 'offen')
    assert.equal(sicht.fortschrittText, '2 von 4 Bereichen ohne bekannten offenen Punkt · 2 noch offen')
    assert.equal(sicht.fortschrittText.includes('vorhanden'), false)
    assert.equal(sicht.fortschrittText.includes('Wesentliche Bereiche'), false)

    const flugGap = gapDetailAbleiten(aktuell, [], 'fluege')
    const mobilGap = gapDetailAbleiten(aktuell, [], 'mobilitaet')
    assert.equal(flugGap.lage, 'belegt')
    assert.equal(flugGap.istPflichtLuecke, false)
    assert.equal(flugGap.sucheAnbietbar, true)
    assert.equal(flugGap.text, 'Kein Flugabschnitt erforderlich')
    assert.equal(gapEyebrowText(flugGap), 'Kein offener Punkt')
    assert.equal(gapNebenzeile(flugGap), 'Kein bekannter offener Punkt · kein Pflichtpunkt')
    assert.equal(gapEyebrowText(flugGap).includes('Vorhanden'), false)
    assert.equal(gapNebenzeile(flugGap).includes('Vorhanden'), false)
    assert.match(flugGap.naechsterSchritt, /Stand prüfen/)
    assert.equal(flugGap.naechsterSchritt.includes('vorhandene Einträge'), false)

    assert.equal(mobilGap.lage, 'belegt')
    assert.equal(mobilGap.istPflichtLuecke, false)
    assert.equal(mobilGap.coveredByFlight, false)
    assert.equal(mobilGap.sucheAnbietbar, false)
    assert.equal(mobilGap.text, 'Keine Verbindung erforderlich')
    assert.equal(gapEyebrowText(mobilGap), 'Kein offener Punkt')
    assert.equal(gapNebenzeile(mobilGap), 'Kein bekannter offener Punkt · kein Pflichtpunkt')
    assert.equal(mobilGap.naechsterSchritt, 'Kein bekannter offener Punkt. Eine Live-Suche für Verbindungen gibt es hier nicht.')
    assert.equal(mobilGap.naechsterSchritt.includes('Eine Suche startet'), false)
    assert.equal(mobilGap.naechsterSchritt.includes('vorhandene Einträge'), false)
    assert.equal(mobilGap.naechsterSchritt.includes('vorhandenen Einträge'), false)
    ohneVerbot(anzeigeTexte(sicht))
  })

  test('alle belegt bleibt inventarneutral und kein trip-ready Claim', () => {
    const hotel = punkt({
      id: 'stay-zh',
      kind: 'stay',
      title: 'Zürich Inn',
      startsOn: '2026-09-12',
      endsOn: '2026-09-16',
    })
    const aktivitaet = punkt({
      id: 'act-zh',
      kind: 'activity',
      title: 'Seeufer',
    })
    const aktuell = gleicheStadtReise({
      days: [{ ...reise().days[0]!, items: [hotel, aktivitaet] }],
    })
    const sicht = uebersichtAbleiten(aktuell, [], HEUTE)
    assert.deepEqual(
      sicht.abdeckungen.map((eintrag) => eintrag.lage),
      ['belegt', 'belegt', 'belegt', 'belegt'],
    )
    assert.equal(sicht.fortschrittText, 'Keine bekannten offenen Punkte')
    assert.equal(sicht.fortschrittText.includes('vorhanden'), false)
    assert.equal(sicht.fortschrittText.includes('bereit'), false)
    assert.equal(sicht.fortschrittText.includes('gebucht'), false)
  })
})

describe('nicht-textliche Ausgänge bleiben kanonisch', () => {
  test('bereichStatus-Lagen und Zählungen ändern sich nicht durch neue Texte', () => {
    const hin = gebuchterHinflug()
    const hotel = punkt({
      id: 'stay-1',
      kind: 'stay',
      title: 'Ubud Inn',
      startsOn: '2026-09-12',
      endsOn: '2026-09-14',
    })
    const status = bereichStatus(
      reise({
        ohneTag: [hin],
        days: [{ ...reise().days[0]!, items: [hotel] }],
      }),
      [hin],
    )
    assert.deepEqual(
      status.map((eintrag) => ({ bereich: eintrag.bereich, lage: eintrag.lage, anzahl: eintrag.anzahl })),
      [
        { bereich: 'fluege', lage: 'teilweise', anzahl: 1 },
        { bereich: 'unterkunft', lage: 'teilweise', anzahl: 1 },
        { bereich: 'aktivitaeten', lage: 'offen', anzahl: 0 },
        { bereich: 'mobilitaet', lage: 'unbestimmt', anzahl: 0 },
      ],
    )
  })

  test('item.date_mismatch und kommerzieller Schutz bleiben unverändert', () => {
    const geschuetzt = punkt({
      id: 'act-1',
      kind: 'activity',
      title: 'Reisterrassen',
      startsOn: '2026-09-12',
      priceAmount: 40,
      priceCurrency: 'CHF',
      provider: 'getyourguide',
    })
    assert.equal(istKommerziell(geschuetzt), true)
    const aktuell = reise({
      days: [
        {
          id: 'day-1',
          stageId: 'stage-1',
          dayIndex: 1,
          dayDate: '2026-09-19',
          title: null,
          items: [geschuetzt],
        },
      ],
    })
    const sicht = attentionAbleiten({
      reise: aktuell,
      orchestriereSafety: false,
      orchestriereSeasonal: false,
    })
    const abweichung = sicht.punkte.find((eintrag) => eintrag.signal === 'item.date_mismatch')
    assert.ok(abweichung)
    assert.equal(abweichung.id, 'item.date_mismatch:act-1')
    assert.equal(abweichung.ebene, 'item')
    assert.equal(abweichung.lage, 'stale')
    assert.equal(abweichung.schwere, 'bald')
    assert.equal(abweichung.aktion, null)
    assert.match(abweichung.titel, /Reisterrassen/)
    assert.match(abweichung.titel, /12\. Sept\. 2026/)
    assert.match(abweichung.titel, /19\. Sept\. 2026/)
    assert.equal(abweichung.titel.includes('startsOn'), false)
  })

  test('Official/Safety-Titel werden nicht mit Coverage-Vokabular überschrieben', () => {
    const sicht = attentionAbleiten({
      reise: reise({
        party: [reisender({ id: 't1', clientRef: 'traveller:1' })],
      }),
      orchestriereSafety: false,
      orchestriereSeasonal: false,
    })
    const official = sicht.punkte.find((eintrag) => eintrag.signal.startsWith('official.'))
    assert.ok(official)
    assert.match(official.titel, /Offizielle/)
    assert.equal(official.titel.includes('Flugstand'), false)
    assert.equal(official.titel.includes('bestimmbar'), false)
    const safety = sicht.punkte.find((eintrag) => eintrag.signal === 'safety.ungeprueft')
    assert.equal(safety?.titel, 'Sicherheit noch nicht geprüft')
  })
})
