// lib/trips/lodging-interval-evaluation-1.test.ts
//
// Unabhängiges Nacht-Orakel für kleine Fälle und begrenzte Langstreckenbelege.
// Das Orakel zählt Nächte auf. Der Auswerter darf das nicht.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'

import { gebuchteBuchung, istGebucht, unbestaetigteBuchung } from '@/lib/trips/buchung'
import { naechteHalboffen, unterkunftAbdeckung } from '@/lib/trips/naechte-abdeckung'
import type {
  UnterkunftAbdeckung,
  UnterkunftLuecke,
  UnterkunftZeitraum,
} from '@/lib/trips/naechte-abdeckung'
import { datumVerschieben } from '@/lib/trips/tage'
import type { Trip, TripDay, TripItem, TripStage } from '@/types/trips'

const JETZT = '2026-08-21T00:00:00.000Z'
const EIN_TAG = 86_400_000

function stay(teil: Partial<TripItem> & Pick<TripItem, 'id'>): TripItem {
  return {
    dayId: null,
    stageId: 'stage-1',
    kind: 'stay',
    title: 'Hotel',
    note: null,
    position: 1,
    startsOn: '2026-08-30',
    startsAt: null,
    endsOn: '2026-09-05',
    endsAt: null,
    priceAmount: 800,
    priceCurrency: 'CHF',
    provider: 'test',
    externalRef: 'stay-1',
    bookingUrl: null,
    ...unbestaetigteBuchung(),
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

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name'>): TripStage {
  return {
    position: 1,
    countryCode: 'ID',
    arrivalDate: '2026-08-30',
    departureDate: '2026-09-13',
    latitude: null,
    longitude: null,
    placeId: 'geonames:1650535',
    ...teil,
  }
}

function tag(items: TripItem[]): TripDay {
  return {
    id: 'day-1',
    stageId: 'stage-1',
    dayIndex: 1,
    dayDate: '2026-08-30',
    title: null,
    items,
  }
}

function reise(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Bali',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-08-30',
    endDate: '2026-09-13',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 3500,
    status: 'draft',
    pace: 'calm',
    interests: ['beach'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [etappe({ id: 'stage-1', name: 'Bali' })],
    days: [],
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function nachtDifferenz(start: string, end: string): number {
  return (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / EIN_TAG
}

function datumGueltig(wert: string | null | undefined): wert is string {
  if (!wert || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return false
  const [jahr, monat, tagZahl] = wert.split('-').map(Number)
  const geprueft = new Date(Date.UTC(jahr, monat - 1, tagZahl))
  return (
    geprueft.getUTCFullYear() === jahr &&
    geprueft.getUTCMonth() === monat - 1 &&
    geprueft.getUTCDate() === tagZahl
  )
}

function stayZeitraum(punkt: TripItem): { start: string; end: string } | null {
  if (!datumGueltig(punkt.startsOn) || !datumGueltig(punkt.endsOn)) return null
  if (punkt.startsOn >= punkt.endsOn) return null
  return { start: punkt.startsOn, end: punkt.endsOn }
}

function etappenZeitraum(etappeZeit: TripStage): UnterkunftZeitraum | null {
  if (!datumGueltig(etappeZeit.arrivalDate) || !datumGueltig(etappeZeit.departureDate)) return null
  if (etappeZeit.arrivalDate >= etappeZeit.departureDate) return null
  return {
    start: etappeZeit.arrivalDate,
    end: etappeZeit.departureDate,
    stageId: etappeZeit.id,
    stageName: etappeZeit.name,
  }
}

function reiseZeitraum(graph: Trip): UnterkunftZeitraum | null {
  if (!datumGueltig(graph.startDate) || !datumGueltig(graph.endDate)) return null
  if (graph.startDate >= graph.endDate) return null
  return {
    start: graph.startDate,
    end: graph.endDate,
    stageId: graph.stages.length === 1 ? graph.stages[0]?.id ?? null : null,
    stageName: graph.stages.length === 1 ? graph.stages[0]?.name ?? null : null,
  }
}

function benoetigteZeitraeume(graph: Trip): { bekannt: boolean; zeitraeume: UnterkunftZeitraum[] } {
  const ausEtappen = graph.stages.map(etappenZeitraum)
  if (graph.stages.length > 0 && ausEtappen.every(Boolean)) {
    return {
      bekannt: true,
      zeitraeume: ausEtappen.filter((wert): wert is UnterkunftZeitraum => wert !== null),
    }
  }
  if (graph.stages.length === 0 || graph.stages.length === 1) {
    const fallback = reiseZeitraum(graph)
    if (fallback) return { bekannt: true, zeitraeume: [fallback] }
  }
  if (graph.stages.length > 1 && ausEtappen.some(Boolean) && ausEtappen.some((wert) => wert === null)) {
    return {
      bekannt: false,
      zeitraeume: ausEtappen.filter((wert): wert is UnterkunftZeitraum => wert !== null),
    }
  }
  const fallback = reiseZeitraum(graph)
  if (fallback) return { bekannt: true, zeitraeume: [fallback] }
  return { bekannt: false, zeitraeume: [] }
}

function allePunkte(graph: Trip, ohneTag: readonly TripItem[]): TripItem[] {
  const extra = ohneTag.length > 0 ? ohneTag : graph.ohneTag
  return [...graph.days.flatMap((einTag) => einTag.items), ...extra]
}

/** Alte Spezifikation: jede benötigte Nacht wird einzeln erzeugt. Nur für kleine Fenster. */
function oracleAbdeckung(graph: Trip, ohneTag: readonly TripItem[] = []): UnterkunftAbdeckung {
  const { bekannt, zeitraeume } = benoetigteZeitraeume(graph)
  const benoetigt = new Set<string>()
  for (const zeitraum of zeitraeume) {
    for (const nacht of naechteHalboffen(zeitraum.start, zeitraum.end)) benoetigt.add(nacht)
  }
  const stageByNight = new Map<string, UnterkunftZeitraum>()
  for (const zeitraum of zeitraeume) {
    for (const nacht of naechteHalboffen(zeitraum.start, zeitraum.end)) {
      if (!stageByNight.has(nacht)) stageByNight.set(nacht, zeitraum)
    }
  }

  const deckung = new Map<string, 'booked' | 'selected'>()
  const aufenthalte = allePunkte(graph, ohneTag)
    .filter((punkt) => punkt.kind === 'stay')
    .map((item) => {
      const zeitraum = stayZeitraum(item)
      if (!zeitraum) {
        return {
          item,
          start: item.startsOn,
          end: item.endsOn,
          naechte: null,
          status: 'unknown' as const,
          ausserhalb: false,
        }
      }
      const stayNights = naechteHalboffen(zeitraum.start, zeitraum.end)
      const imZeitraum = stayNights.filter((nacht) => benoetigt.has(nacht))
      const status = istGebucht(item) ? 'booked' as const : 'selected' as const
      for (const nacht of imZeitraum) {
        if (status === 'booked' || deckung.get(nacht) !== 'booked') deckung.set(nacht, status)
      }
      return {
        item,
        start: zeitraum.start,
        end: zeitraum.end,
        naechte: stayNights.length,
        status,
        ausserhalb: benoetigt.size > 0 && imZeitraum.length === 0,
      }
    })

  const offene = [...benoetigt].filter((nacht) => !deckung.has(nacht)).sort()
  const luecken: UnterkunftLuecke[] = []
  if (bekannt && offene.length > 0) {
    let start = offene[0]
    let vorher = offene[0]
    const schliessen = (von: string, letzte: string) => {
      const end = datumVerschieben(letzte, 1)
      if (!end) return
      const zuordnung = stageByNight.get(von)
      luecken.push({
        start: von,
        end,
        naechte: naechteHalboffen(von, end).length,
        stageId: zuordnung?.stageId ?? null,
        stageName: zuordnung?.stageName ?? null,
      })
    }
    for (let i = 1; i < offene.length; i += 1) {
      const aktuell = offene[i]
      const gleicheEtappe = stageByNight.get(start)?.stageId === stageByNight.get(aktuell)?.stageId
      if (datumVerschieben(vorher, 1) === aktuell && gleicheEtappe) {
        vorher = aktuell
        continue
      }
      schliessen(start, vorher)
      start = aktuell
      vorher = aktuell
    }
    schliessen(start, vorher)
  }

  const naechteGebucht = bekannt ? [...deckung.values()].filter((status) => status === 'booked').length : null
  const naechteAusgewaehlt = bekannt ? [...deckung.values()].filter((status) => status === 'selected').length : null
  const kern = {
    bekannt,
    naechteGesamt: bekannt ? benoetigt.size : null,
    naechteAbgedeckt: bekannt ? deckung.size : null,
    naechteGebucht,
    naechteAusgewaehlt,
    zeitraeume,
    luecken: bekannt ? luecken : [],
    aufenthalte,
  }
  return { ...kern, zusammenfassung: zusammenfassung(kern) }
}

function zusammenfassung(abdeckung: Omit<UnterkunftAbdeckung, 'zusammenfassung'>): string {
  if (!abdeckung.bekannt || abdeckung.naechteGesamt === null || abdeckung.naechteAbgedeckt === null) {
    return 'Unterkunftsstand noch unklar'
  }
  if (abdeckung.naechteGesamt === 0) return 'Keine Übernachtung in diesem Zeitraum'
  if (abdeckung.aufenthalte.some((aufenthalt) => aufenthalt.status === 'unknown')) {
    return 'Unterkunftsstand noch unklar'
  }
  if (abdeckung.naechteAbgedeckt === 0 && abdeckung.aufenthalte.length === 0) {
    return 'Noch keine Unterkunft ausgewählt'
  }
  const gebucht = abdeckung.naechteGebucht ?? 0
  const text = `${abdeckung.naechteAbgedeckt}/${abdeckung.naechteGesamt} Nächte abgedeckt`
  if (gebucht > 0 && gebucht === abdeckung.naechteAbgedeckt) return `${text} · gebucht`
  if (gebucht > 0) return `${text} · ${gebucht} gebucht`
  return text
}

function gleich(graph: Trip, ohneTag?: readonly TripItem[]) {
  assert.deepEqual(unterkunftAbdeckung(graph, ohneTag), oracleAbdeckung(graph, ohneTag))
}

function plus(tage: number): string {
  const wert = datumVerschieben('2026-08-30', tage)
  if (!wert) throw new Error('Testdatum fehlt')
  return wert
}

describe('Intervallauswerter gegen das Nacht-Orakel', () => {
  test('überlappend, verschachtelt, angrenzend und getrennt', () => {
    gleich(reise({
      stages: [
        etappe({ id: 'a', name: 'Aussen', arrivalDate: plus(0), departureDate: plus(12) }),
        etappe({ id: 'b', name: 'Innen', position: 2, arrivalDate: plus(3), departureDate: plus(6) }),
      ],
      ohneTag: [
        stay({ id: 'deckend', startsOn: plus(1), endsOn: plus(4) }),
        stay({ id: 'angrenzend', startsOn: plus(4), endsOn: plus(8), position: 2 }),
        stay({ id: 'getrennt', startsOn: plus(10), endsOn: plus(11), position: 3 }),
      ],
    }))
  })

  test('umgekehrte Etappenreihenfolge behält den ersten Besitz', () => {
    gleich(reise({
      stages: [
        etappe({ id: 'spaeter', name: 'Später', position: 1, arrivalDate: plus(5), departureDate: plus(12) }),
        etappe({ id: 'frueher', name: 'Früher', position: 2, arrivalDate: plus(0), departureDate: plus(9) }),
      ],
      ohneTag: [],
    }))
    const ergebnis = unterkunftAbdeckung(reise({
      stages: [
        etappe({ id: 'spaeter', name: 'Später', position: 1, arrivalDate: plus(5), departureDate: plus(12) }),
        etappe({ id: 'frueher', name: 'Früher', position: 2, arrivalDate: plus(0), departureDate: plus(9) }),
      ],
    }))
    assert.deepEqual(ergebnis.luecken.map((luecke) => [luecke.start, luecke.end, luecke.stageName]), [
      [plus(0), plus(5), 'Früher'],
      [plus(5), plus(12), 'Später'],
    ])
  })

  test('gleiche Etappenkennung mit verschiedenen Namen', () => {
    gleich(reise({
      stages: [
        etappe({ id: 'gleich', name: 'Anfang', arrivalDate: plus(0), departureDate: plus(4) }),
        etappe({ id: 'gleich', name: 'Fortsetzung', position: 2, arrivalDate: plus(4), departureDate: plus(10) }),
      ],
      ohneTag: [stay({ id: 'kopf', startsOn: plus(0), endsOn: plus(2) })],
    }))
    const ohneDeckung = unterkunftAbdeckung(reise({
      stages: [
        etappe({ id: 'gleich', name: 'Anfang', arrivalDate: plus(0), departureDate: plus(4) }),
        etappe({ id: 'gleich', name: 'Fortsetzung', position: 2, arrivalDate: plus(4), departureDate: plus(10) }),
      ],
    }))
    assert.equal(ohneDeckung.luecken.length, 1)
    assert.equal(ohneDeckung.luecken[0]?.stageName, 'Anfang')
    assert.equal(ohneDeckung.luecken[0]?.naechte, 10)

    const namenAmLueckenanfang = unterkunftAbdeckung(reise({
      stages: [
        etappe({ id: 'gleich', name: 'Anfang', arrivalDate: plus(0), departureDate: plus(4) }),
        etappe({ id: 'gleich', name: 'Fortsetzung', position: 2, arrivalDate: plus(4), departureDate: plus(10) }),
      ],
      ohneTag: [stay({ id: 'nur-anfang', startsOn: plus(0), endsOn: plus(4) })],
    }))
    assert.equal(namenAmLueckenanfang.luecken.length, 1)
    assert.equal(namenAmLueckenanfang.luecken[0]?.stageName, 'Fortsetzung')
    assert.equal(namenAmLueckenanfang.luecken[0]?.start, plus(4))
  })

  test('gebucht verdrängt ausgewählt, auch bei späterem ausgewähltem Stay', () => {
    gleich(reise({
      ohneTag: [
        stay({ id: 'wahl', startsOn: plus(0), endsOn: plus(8) }),
        stay({
          id: 'buch',
          startsOn: plus(3),
          endsOn: plus(12),
          position: 2,
          ...gebuchteBuchung(JETZT),
        }),
      ],
    }))
    const ergebnis = unterkunftAbdeckung(reise({
      ohneTag: [
        stay({
          id: 'buch-zuerst',
          startsOn: plus(3),
          endsOn: plus(12),
          ...gebuchteBuchung(JETZT),
        }),
        stay({ id: 'wahl-danach', startsOn: plus(0), endsOn: plus(8), position: 2 }),
      ],
    }))
    assert.equal(ergebnis.naechteGebucht, 9)
    assert.equal(ergebnis.naechteAusgewaehlt, 3)
    assert.equal(ergebnis.naechteAbgedeckt, 12)
    assert.match(ergebnis.zusammenfassung, /9 gebucht/)
  })

  test('unbekannte und ungültige Stay-Daten lassen Summen stehen', () => {
    gleich(reise({
      ohneTag: [
        stay({ id: 'leer', startsOn: null, endsOn: null }),
        stay({ id: 'schalt', startsOn: '2027-02-29', endsOn: '2027-03-02', position: 2 }),
        stay({ id: 'form', startsOn: '2026-02-31', endsOn: '2026-03-02', position: 3 }),
        stay({ id: 'kurz', startsOn: '2026-8-30', endsOn: '2026-09-02', position: 4 }),
        stay({ id: 'gleich', startsOn: plus(1), endsOn: plus(1), position: 5 }),
        stay({ id: 'rueckwaerts', startsOn: plus(6), endsOn: plus(2), position: 6 }),
        stay({ id: 'gueltig', startsOn: plus(2), endsOn: plus(5), position: 7 }),
      ],
    }))
    const ergebnis = unterkunftAbdeckung(reise({
      ohneTag: [stay({ id: 'altjahr', startsOn: '0001-01-01', endsOn: '0001-02-01' })],
    }))
    assert.equal(ergebnis.aufenthalte[0]?.status, 'unknown')
    assert.equal(ergebnis.aufenthalte[0]?.naechte, null)
    assert.equal(ergebnis.aufenthalte[0]?.ausserhalb, false)
    assert.deepEqual([ergebnis.aufenthalte[0]?.start, ergebnis.aufenthalte[0]?.end], ['0001-01-01', '0001-02-01'])
    assert.equal(ergebnis.bekannt, true)
    assert.equal(ergebnis.naechteGesamt, 14)
  })

  test('Fallbacks und teilweise bekannte Etappen', () => {
    gleich(reise({ stages: [], startDate: plus(0), endDate: plus(5), ohneTag: [] }))
    gleich(reise({
      stages: [etappe({ id: 'eine', name: 'Eine', arrivalDate: null, departureDate: null })],
      startDate: plus(0),
      endDate: plus(4),
    }))
    const eine = unterkunftAbdeckung(reise({
      stages: [etappe({ id: 'eine', name: 'Eine', arrivalDate: null, departureDate: null })],
      startDate: plus(0),
      endDate: plus(4),
    }))
    assert.equal(eine.zeitraeume[0]?.stageId, 'eine')
    assert.equal(eine.zeitraeume[0]?.stageName, 'Eine')

    gleich(reise({
      stages: [
        etappe({ id: 'kaputt-a', name: 'A', arrivalDate: null, departureDate: null }),
        etappe({ id: 'kaputt-b', name: 'B', position: 2, arrivalDate: '2026-09-40', departureDate: plus(3) }),
      ],
      startDate: plus(1),
      endDate: plus(6),
    }))
    const vieleKaputt = unterkunftAbdeckung(reise({
      stages: [
        etappe({ id: 'kaputt-a', name: 'A', arrivalDate: null, departureDate: null }),
        etappe({ id: 'kaputt-b', name: 'B', position: 2, arrivalDate: null, departureDate: null }),
      ],
      startDate: plus(1),
      endDate: plus(6),
    }))
    assert.equal(vieleKaputt.zeitraeume[0]?.stageId, null)

    gleich(reise({
      stages: [
        etappe({ id: 'ok', name: 'Ok', arrivalDate: plus(0), departureDate: plus(3) }),
        etappe({ id: 'fehlt', name: 'Fehlt', position: 2, arrivalDate: null, departureDate: plus(8) }),
      ],
      startDate: plus(0),
      endDate: plus(20),
      ohneTag: [stay({ id: 'teil', startsOn: plus(0), endsOn: plus(2) })],
    }))
    const gemischt = unterkunftAbdeckung(reise({
      stages: [
        etappe({ id: 'ok', name: 'Ok', arrivalDate: plus(0), departureDate: plus(3) }),
        etappe({ id: 'fehlt', name: 'Fehlt', position: 2, arrivalDate: null, departureDate: plus(8) }),
      ],
      ohneTag: [stay({ id: 'daneben', startsOn: plus(10), endsOn: plus(12) })],
    }))
    assert.equal(gemischt.bekannt, false)
    assert.equal(gemischt.naechteGesamt, null)
    assert.deepEqual(gemischt.luecken, [])
    assert.equal(gemischt.aufenthalte[0]?.status, 'selected')
    assert.equal(gemischt.aufenthalte[0]?.ausserhalb, true)
    assert.equal(gemischt.zusammenfassung, 'Unterkunftsstand noch unklar')
  })

  test('Schaltjahr, Monats- und Jahreswechsel', () => {
    gleich(reise({
      startDate: '2028-02-27',
      endDate: '2028-03-03',
      stages: [etappe({
        id: 'schalt',
        name: 'Schalt',
        arrivalDate: '2028-02-27',
        departureDate: '2028-03-03',
      })],
      ohneTag: [stay({ id: 'schaltstay', startsOn: '2028-02-28', endsOn: '2028-03-01' })],
    }))
    gleich(reise({
      startDate: '2026-12-30',
      endDate: '2027-01-03',
      stages: [etappe({
        id: 'jahr',
        name: 'Jahr',
        arrivalDate: '2026-12-30',
        departureDate: '2027-01-03',
      })],
      ohneTag: [stay({ id: 'jahrstay', startsOn: '2026-12-31', endsOn: '2027-01-02' })],
    }))
  })

  test('ohneTag ersetzt nur bei nicht leerem Argument, Tagespunkte bleiben', () => {
    const imTag = stay({ id: 'tag', startsOn: plus(0), endsOn: plus(2), dayId: 'day-1' })
    const gespeichert = stay({ id: 'speicher', startsOn: plus(2), endsOn: plus(4), position: 2 })
    const explizit = stay({ id: 'explizit', startsOn: plus(4), endsOn: plus(7), position: 3 })
    const graph = reise({
      days: [tag([imTag, stay({ id: 'flug', kind: 'flight', startsOn: plus(0), endsOn: plus(1) })])],
      ohneTag: [gespeichert],
    })
    gleich(graph)
    gleich(graph, [])
    gleich(graph, [explizit])
    const ersetzt = unterkunftAbdeckung(graph, [explizit])
    assert.deepEqual(ersetzt.aufenthalte.map((aufenthalt) => aufenthalt.item.id), ['tag', 'explizit'])
    assert.deepEqual(unterkunftAbdeckung(graph).aufenthalte.map((aufenthalt) => aufenthalt.item.id), ['tag', 'speicher'])
  })

  test('Stay-Etappe filtert die Deckung nicht; Doppelungen bleiben erhalten', () => {
    gleich(reise({
      stages: [
        etappe({ id: 'a', name: 'A', arrivalDate: plus(0), departureDate: plus(4) }),
        etappe({ id: 'b', name: 'B', position: 2, arrivalDate: plus(4), departureDate: plus(8) }),
      ],
      ohneTag: [
        stay({ id: 'fremd', stageId: 'woanders', startsOn: plus(1), endsOn: plus(6) }),
        stay({ id: 'kopie', stageId: 'woanders', startsOn: plus(1), endsOn: plus(6), position: 2 }),
      ],
    }))
    const ergebnis = unterkunftAbdeckung(reise({
      ohneTag: [
        stay({ id: 'eins', startsOn: plus(0), endsOn: plus(3) }),
        stay({ id: 'zwei', startsOn: plus(0), endsOn: plus(3), position: 2 }),
      ],
    }))
    assert.equal(ergebnis.aufenthalte.length, 2)
    assert.equal(ergebnis.naechteAbgedeckt, 3)
  })

  test('teilweise ausserhalb bleibt innen, vollständig ausserhalb nicht', () => {
    gleich(reise({
      ohneTag: [stay({ id: 'rand', startsOn: '2026-08-20', endsOn: plus(3) })],
    }))
    const rand = unterkunftAbdeckung(reise({
      ohneTag: [stay({ id: 'rand', startsOn: '2026-08-20', endsOn: plus(3) })],
    }))
    assert.equal(rand.aufenthalte[0]?.ausserhalb, false)
    assert.equal(rand.aufenthalte[0]?.naechte, nachtDifferenz('2026-08-20', plus(3)))
    assert.equal(rand.naechteAbgedeckt, 3)

    const draussen = unterkunftAbdeckung(reise({
      ohneTag: [stay({ id: 'weg', startsOn: '2026-07-01', endsOn: '2026-07-08' })],
    }))
    assert.equal(draussen.aufenthalte[0]?.ausserhalb, true)
    assert.equal(draussen.aufenthalte[0]?.naechte, 7)
    assert.equal(draussen.naechteAbgedeckt, 0)
  })

  test('Etappenvereinigung lässt Kalenderlöcher aus und ignoriert breitere Reisedaten', () => {
    gleich(reise({
      startDate: plus(0),
      endDate: plus(20),
      stages: [
        etappe({ id: 'links', name: 'Links', arrivalDate: plus(0), departureDate: plus(3) }),
        etappe({ id: 'rechts', name: 'Rechts', position: 2, arrivalDate: plus(6), departureDate: plus(9) }),
      ],
    }))
    const loch = unterkunftAbdeckung(reise({
      startDate: plus(0),
      endDate: plus(20),
      stages: [
        etappe({ id: 'links', name: 'Links', arrivalDate: plus(0), departureDate: plus(3) }),
        etappe({ id: 'rechts', name: 'Rechts', position: 2, arrivalDate: plus(6), departureDate: plus(9) }),
      ],
    }))
    assert.equal(loch.naechteGesamt, 6)
    assert.deepEqual(loch.luecken.map((luecke) => luecke.start), [plus(0), plus(6)])
  })

  test('Eingaben bleiben unverändert', () => {
    const graph = reise({
      stages: [
        etappe({ id: 'b', name: 'B', arrivalDate: plus(4), departureDate: plus(8) }),
        etappe({ id: 'a', name: 'A', position: 2, arrivalDate: plus(0), departureDate: plus(5) }),
      ],
      ohneTag: [
        stay({ id: 's2', startsOn: plus(5), endsOn: plus(7) }),
        stay({ id: 's1', startsOn: plus(0), endsOn: plus(2), position: 2 }),
      ],
    })
    const vorher = JSON.stringify(graph)
    const stufen = graph.stages.map((stufe) => stufe.id)
    Object.freeze(graph)
    Object.freeze(graph.stages)
    Object.freeze(graph.ohneTag)
    for (const stufe of graph.stages) Object.freeze(stufe)
    for (const punkt of graph.ohneTag) Object.freeze(punkt)
    gleich(graph)
    assert.equal(JSON.stringify(graph), vorher)
    assert.deepEqual(graph.stages.map((stufe) => stufe.id), stufen)
  })

  test('kleine deterministische Mischfälle', () => {
    const fenster = [0, 2, 5, 7, 9, 12]
    const paare: [number, number][] = []
    for (let i = 0; i < fenster.length; i += 1) {
      for (let j = i + 1; j < fenster.length; j += 1) paare.push([fenster[i], fenster[j]])
    }
    const auswahl = paare.filter((_, index) => index % 3 === 0).slice(0, 6)
    for (const [a, b] of auswahl) {
      for (const [c, d] of auswahl) {
        gleich(reise({
          stages: [
            etappe({ id: 's', name: a % 2 === 0 ? 'Eins' : 'Zwei', arrivalDate: plus(a), departureDate: plus(b) }),
            etappe({
              id: 's',
              name: 'Andere',
              position: 2,
              arrivalDate: plus(c),
              departureDate: plus(d),
            }),
          ],
          ohneTag: [
            stay({ id: 'x', startsOn: plus(c), endsOn: plus(d) }),
            stay({
              id: 'y',
              startsOn: plus(a),
              endsOn: plus(b),
              position: 2,
              ...(a < c ? gebuchteBuchung(JETZT) : {}),
            }),
          ],
        }))
      }
    }
  })
})

describe('Lange Bereiche bleiben eingabebegrenzt', () => {
  test('Quelle des Auswerters enthält keine Nachtliste', () => {
    const quelle = readFileSync(new URL('./naechte-abdeckung.ts', import.meta.url), 'utf8')
    const auswerter = quelle.slice(quelle.indexOf('function datumGueltig'))
    assert.ok(auswerter.startsWith('function datumGueltig'))
    assert.equal(auswerter.includes('naechteHalboffen'), false)
    assert.equal(auswerter.includes('zeit += EIN_TAG'), false)
    assert.equal(auswerter.includes('new Set'), false)
    assert.equal(auswerter.includes('new Map'), false)
    assert.equal(auswerter.includes('Array.from'), false)
  })

  test('ein weiter Stay über einer kurzen Reise materialisiert keine Nächte', () => {
    const stayStart = '1800-01-01'
    const stayEnd = '2200-01-01'
    const tripStart = '2026-08-30'
    const tripEnd = '2026-09-13'
    const graph = reise({
      startDate: tripStart,
      endDate: tripEnd,
      stages: [etappe({
        id: 'kurz',
        name: 'Kurz',
        arrivalDate: tripStart,
        departureDate: tripEnd,
      })],
      ohneTag: [stay({ id: 'weit', startsOn: stayStart, endsOn: stayEnd })],
    })
    const konstruktionen = datumsKonstruktionen(() => {
      const ergebnis = unterkunftAbdeckung(graph)
      assert.equal(ergebnis.aufenthalte[0]?.naechte, 146097)
      assert.equal(ergebnis.aufenthalte[0]?.naechte, nachtDifferenz(stayStart, stayEnd))
      assert.equal(ergebnis.naechteGesamt, 14)
      assert.equal(ergebnis.naechteAbgedeckt, 14)
      assert.equal(ergebnis.aufenthalte[0]?.ausserhalb, false)
      assert.deepEqual(ergebnis.luecken, [])
      assert.equal(ergebnis.zusammenfassung, '14/14 Nächte abgedeckt')
    })
    assert.ok(konstruktionen < 40, `Date-Konstruktionen ${konstruktionen}`)
  })

  test('teilweise und vollständig ausserhalb bei langem Stay', () => {
    const tripStart = '2026-08-30'
    const tripEnd = '2026-09-13'
    const teilweise = unterkunftAbdeckung(reise({
      startDate: tripStart,
      endDate: tripEnd,
      stages: [etappe({ id: 'kurz', name: 'Kurz', arrivalDate: tripStart, departureDate: tripEnd })],
      ohneTag: [stay({ id: 'bis', startsOn: '1800-01-01', endsOn: '2026-09-05' })],
    }))
    assert.equal(teilweise.aufenthalte[0]?.naechte, nachtDifferenz('1800-01-01', '2026-09-05'))
    assert.equal(teilweise.naechteAbgedeckt, 6)
    assert.equal(teilweise.aufenthalte[0]?.ausserhalb, false)
    assert.deepEqual(teilweise.luecken.map((luecke) => [luecke.start, luecke.end, luecke.naechte]), [
      ['2026-09-05', tripEnd, 8],
    ])

    const draussen = unterkunftAbdeckung(reise({
      startDate: tripStart,
      endDate: tripEnd,
      stages: [etappe({ id: 'kurz', name: 'Kurz', arrivalDate: tripStart, departureDate: tripEnd })],
      ohneTag: [stay({ id: 'historisch', startsOn: '1800-01-01', endsOn: '1801-01-01' })],
    }))
    assert.equal(draussen.aufenthalte[0]?.naechte, nachtDifferenz('1800-01-01', '1801-01-01'))
    assert.equal(draussen.naechteAbgedeckt, 0)
    assert.equal(draussen.naechteGebucht, 0)
    assert.equal(draussen.aufenthalte[0]?.ausserhalb, true)
    assert.equal(draussen.luecken.length, 1)
    assert.equal(draussen.luecken[0]?.naechte, 14)
  })

  test('lange benötigte Etappen, Überlappung und Lücken', () => {
    const graph = reise({
      startDate: '2026-01-01',
      endDate: '2026-01-08',
      stages: [
        etappe({ id: 'a', name: 'Alpha', arrivalDate: '1800-01-01', departureDate: '1900-01-01' }),
        etappe({ id: 'b', name: 'Beta', position: 2, arrivalDate: '1890-01-01', departureDate: '2200-01-01' }),
      ],
      ohneTag: [
        stay({ id: 'wahl', startsOn: '1899-01-01', endsOn: '1901-01-01' }),
        stay({
          id: 'buch',
          startsOn: '1899-06-01',
          endsOn: '1900-06-01',
          position: 2,
          ...gebuchteBuchung(JETZT),
        }),
      ],
    })
    const konstruktionen = datumsKonstruktionen(() => {
      const ergebnis = unterkunftAbdeckung(graph)
      const gesamt = nachtDifferenz('1800-01-01', '2200-01-01')
      const gebucht = nachtDifferenz('1899-06-01', '1900-06-01')
      const gewaehlt = nachtDifferenz('1899-01-01', '1899-06-01') + nachtDifferenz('1900-06-01', '1901-01-01')
      assert.equal(ergebnis.naechteGesamt, gesamt)
      assert.equal(ergebnis.naechteGebucht, gebucht)
      assert.equal(ergebnis.naechteAusgewaehlt, gewaehlt)
      assert.equal(ergebnis.naechteAbgedeckt, gebucht + gewaehlt)
      assert.equal(ergebnis.aufenthalte[0]?.naechte, nachtDifferenz('1899-01-01', '1901-01-01'))
      assert.equal(ergebnis.aufenthalte[1]?.naechte, gebucht)
      assert.deepEqual(
        ergebnis.luecken.map((luecke) => [luecke.start, luecke.end, luecke.stageName]),
        [
          ['1800-01-01', '1899-01-01', 'Alpha'],
          ['1901-01-01', '2200-01-01', 'Beta'],
        ],
      )
      assert.equal(
        ergebnis.luecken[0]!.naechte + ergebnis.luecken[1]!.naechte + (ergebnis.naechteAbgedeckt ?? 0),
        gesamt,
      )
    })
    assert.ok(konstruktionen < 40, `Date-Konstruktionen ${konstruktionen}`)
  })

  test('erste Etappe besitzt die Überlappung auch bei langem Aussenintervall', () => {
    const ergebnis = unterkunftAbdeckung(reise({
      stages: [
        etappe({ id: 'innen', name: 'Innen', arrivalDate: '1900-01-01', departureDate: '1900-06-01' }),
        etappe({ id: 'aussen', name: 'Aussen', position: 2, arrivalDate: '1800-01-01', departureDate: '2200-01-01' }),
      ],
    }))
    assert.equal(ergebnis.naechteGesamt, nachtDifferenz('1800-01-01', '2200-01-01'))
    assert.deepEqual(
      ergebnis.luecken.map((luecke) => [luecke.start, luecke.end, luecke.stageId, luecke.naechte]),
      [
        ['1800-01-01', '1900-01-01', 'aussen', nachtDifferenz('1800-01-01', '1900-01-01')],
        ['1900-01-01', '1900-06-01', 'innen', nachtDifferenz('1900-01-01', '1900-06-01')],
        ['1900-06-01', '2200-01-01', 'aussen', nachtDifferenz('1900-06-01', '2200-01-01')],
      ],
    )
  })

  test('getrennte lange Etappen erzeugen kein Loch als Lücke', () => {
    const ergebnis = unterkunftAbdeckung(reise({
      stages: [
        etappe({ id: 'frueh', name: 'Früh', arrivalDate: '1800-01-01', departureDate: '1800-02-01' }),
        etappe({ id: 'spaet', name: 'Spät', position: 2, arrivalDate: '2200-01-01', departureDate: '2200-02-01' }),
      ],
    }))
    assert.equal(ergebnis.naechteGesamt, 31 + 31)
    assert.equal(ergebnis.luecken.length, 2)
    assert.equal(ergebnis.luecken[0]?.end, '1800-02-01')
    assert.equal(ergebnis.luecken[1]?.start, '2200-01-01')
  })

  test('gültige vierstellige Ränder bleiben vollständig', () => {
    const unten = unterkunftAbdeckung(reise({
      startDate: '0100-01-01',
      endDate: '0100-01-10',
      stages: [etappe({
        id: 'alt',
        name: 'Alt',
        arrivalDate: '0100-01-01',
        departureDate: '0100-01-10',
      })],
      ohneTag: [stay({ id: 'altstay', startsOn: '0100-01-01', endsOn: '0100-01-10' })],
    }))
    assert.equal(unten.naechteGesamt, 9)
    assert.equal(unten.naechteAbgedeckt, 9)
    assert.equal(unten.aufenthalte[0]?.naechte, 9)

    const oben = unterkunftAbdeckung(reise({
      startDate: '9999-12-01',
      endDate: '9999-12-31',
      stages: [etappe({
        id: 'rand',
        name: 'Rand',
        arrivalDate: '9999-12-01',
        departureDate: '9999-12-31',
      })],
      ohneTag: [stay({ id: 'randstay', startsOn: '9999-12-20', endsOn: '9999-12-31' })],
    }))
    assert.equal(oben.naechteGesamt, 30)
    assert.equal(oben.naechteAbgedeckt, 11)
    assert.equal(oben.aufenthalte[0]?.naechte, 11)
    assert.deepEqual(oben.luecken.map((luecke) => [luecke.start, luecke.end, luecke.naechte]), [
      ['9999-12-01', '9999-12-20', 19],
    ])

    const spanne = reise({
      startDate: '2026-08-30',
      endDate: '2026-09-13',
      stages: [etappe({
        id: 'kurz',
        name: 'Kurz',
        arrivalDate: '2026-08-30',
        departureDate: '2026-09-13',
      })],
      ohneTag: [stay({ id: 'spanne', startsOn: '0100-01-01', endsOn: '9999-12-31' })],
    })
    const konstruktionen = datumsKonstruktionen(() => {
      const extrem = unterkunftAbdeckung(spanne)
      assert.equal(extrem.aufenthalte[0]?.naechte, nachtDifferenz('0100-01-01', '9999-12-31'))
      assert.equal(extrem.naechteAbgedeckt, 14)
      assert.equal(extrem.luecken.length, 0)
      assert.equal(extrem.aufenthalte[0]?.ausserhalb, false)
    })
    assert.ok(nachtDifferenz('0100-01-01', '9999-12-31') > 3_000_000)
    assert.ok(konstruktionen < 40, `Date-Konstruktionen ${konstruktionen}`)
  })
})

function datumsKonstruktionen(lauf: () => void): number {
  const Original = globalThis.Date
  let anzahl = 0
  function Gezaehlt(this: Date, ...args: ConstructorParameters<typeof Date>): Date {
    anzahl += 1
    return Reflect.construct(Original, args, new.target ? Gezaehlt : Original)
  }
  Gezaehlt.prototype = Original.prototype
  Gezaehlt.parse = Original.parse
  Gezaehlt.UTC = Original.UTC
  Gezaehlt.now = Original.now
  globalThis.Date = Gezaehlt as unknown as DateConstructor
  try {
    lauf()
    return anzahl
  } finally {
    globalThis.Date = Original
  }
}
