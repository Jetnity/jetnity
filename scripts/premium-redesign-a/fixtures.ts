// scripts/premium-redesign-a/fixtures.ts
//
// Synthetische Gastreisen für die Abnahme von PR A (Premium-Redesign).
// Keine Kundendaten, kein Produktspeicher: Die Reisen entstehen durch denselben
// Gastspeicher-Schreibweg (`gastreiseAblegen`) in einem Speicher im Arbeitsspeicher
// und werden als JSON ausgegeben, das der Browser-Treiber vor dem Laden in den
// localStorage schreibt.
//
// Aufruf: node --import tsx scripts/premium-redesign-a/fixtures.ts <Zielordner>

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { Trip, TripDay, TripItem, TripStage } from '@/types/trips'

const SCHLUESSEL_AKTIV = 'jetnity:reise:v3'

function speicherEinrichten() {
  const daten = new Map<string, string>()
  const speicher = {
    getItem: (schluessel: string) => daten.get(schluessel) ?? null,
    setItem: (schluessel: string, wert: string) => void daten.set(schluessel, wert),
    removeItem: (schluessel: string) => void daten.delete(schluessel),
    key: (index: number) => [...daten.keys()][index] ?? null,
    get length() {
      return daten.size
    },
    clear: () => daten.clear(),
  }
  Object.assign(globalThis, {
    window: { localStorage: speicher, dispatchEvent: () => true, addEventListener: () => undefined },
    localStorage: speicher,
  })
  return daten
}

const JETZT = '2026-11-20T09:00:00.000Z'

function punkt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'kind' | 'title'>): TripItem {
  return {
    dayId: null,
    stageId: null,
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

function tage(start: string, ende: string, etappen: TripStage[]): TripDay[] {
  const ergebnis: TripDay[] = []
  const anfang = Date.parse(`${start}T00:00:00Z`)
  const schluss = Date.parse(`${ende}T00:00:00Z`)
  for (let zeit = anfang, index = 1; zeit <= schluss; zeit += 86_400_000, index++) {
    const datum = new Date(zeit).toISOString().slice(0, 10)
    const etappe =
      etappen.find((e) => e.arrivalDate! <= datum && datum < e.departureDate!) ?? etappen[etappen.length - 1]!
    ergebnis.push({ id: `tag-${index}`, stageId: etappe.id, dayIndex: index, dayDate: datum, title: null, items: [] })
  }
  return ergebnis
}

function thailandReise(): Trip {
  const etappen: TripStage[] = [
    { id: 'etappe-bkk', position: 1, name: 'Bangkok', countryCode: 'TH', arrivalDate: '2026-12-01', departureDate: '2026-12-05', latitude: 13.7563, longitude: 100.5018, placeId: 'geonames:1609350' },
    { id: 'etappe-chang', position: 2, name: 'Ko Chang', countryCode: 'TH', arrivalDate: '2026-12-05', departureDate: '2026-12-12', latitude: 12.0, longitude: 102.35, placeId: 'geonames:1611309' },
    { id: 'etappe-phuket', position: 3, name: 'Phuket', countryCode: 'TH', arrivalDate: '2026-12-12', departureDate: '2026-12-25', latitude: 7.8804, longitude: 98.3923, placeId: 'geonames:1151254' },
  ]
  const reisetage = tage('2026-12-01', '2026-12-25', etappen)
  const flug = punkt({
    id: 'punkt-flug', kind: 'flight', title: 'Zürich → Bangkok', dayId: 'tag-1', stageId: 'etappe-bkk',
    startsOn: '2026-12-01', startsAt: '11:25', priceAmount: 1260, priceCurrency: 'CHF', provider: 'duffel',
    originName: 'Zürich', destinationName: 'Bangkok',
  })
  const hotelBkk = punkt({
    id: 'punkt-bkk', kind: 'stay', title: 'Hotel am Fluss, Bangkok', dayId: 'tag-1', stageId: 'etappe-bkk',
    startsOn: '2026-12-01', endsOn: '2026-12-05', priceAmount: 640, priceCurrency: 'CHF',
    bookingStatus: 'booked', bookingSource: 'user', bookingConfirmedAt: JETZT,
  })
  const hotelChang = punkt({
    id: 'punkt-chang', kind: 'stay', title: 'Strandresort, Ko Chang', dayId: 'tag-5', stageId: 'etappe-chang',
    startsOn: '2026-12-05', endsOn: '2026-12-12', priceAmount: 1120, priceCurrency: 'CHF',
  })
  const hotelPhuket = punkt({
    id: 'punkt-phuket', kind: 'stay', title: 'Bungalow, Phuket', dayId: 'tag-12', stageId: 'etappe-phuket',
    startsOn: '2026-12-12', endsOn: '2026-12-25', priceAmount: 1980, priceCurrency: 'CHF',
  })
  const aktivitaet = punkt({
    id: 'punkt-wat', kind: 'activity', title: 'Wat Pho und Tempelviertel', dayId: 'tag-3', stageId: 'etappe-bkk',
    startsOn: '2026-12-03', startsAt: '09:30', priceAmount: 45, priceCurrency: 'CHF', note: 'Frühmorgens, vor der Hitze.',
  })
  const zuordnung: Record<string, TripItem[]> = {
    'tag-1': [flug, hotelBkk],
    'tag-3': [aktivitaet],
    'tag-5': [hotelChang],
    'tag-12': [hotelPhuket],
  }
  return {
    id: 'trip-synth-thailand',
    clientRef: 'trip-synth-thailand',
    title: 'Thailand-Rundreise',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-12-01',
    endDate: '2026-12-25',
    travellers: 3,
    currency: 'CHF',
    budgetAmount: 4800,
    status: 'draft',
    pace: 'balanced',
    interests: ['culture', 'nature'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: etappen,
    days: reisetage.map((tag) => ({ ...tag, items: zuordnung[tag.id] ?? [] })),
    ohneTag: [],
    dayStageAssignmentMode: 'explicit',
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

function lissabonReise(): Trip {
  const etappen: TripStage[] = [
    { id: 'etappe-lis', position: 1, name: 'Lissabon', countryCode: 'PT', arrivalDate: '2026-12-10', departureDate: '2026-12-14', latitude: 38.7223, longitude: -9.1393, placeId: 'geonames:2267057' },
  ]
  return {
    id: 'trip-synth-lissabon',
    clientRef: 'trip-synth-lissabon',
    title: 'Lissabon im Dezember',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-12-10',
    endDate: '2026-12-14',
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'balanced',
    interests: ['culture'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: etappen,
    days: tage('2026-12-10', '2026-12-14', etappen),
    ohneTag: [],
    dayStageAssignmentMode: 'single_destination',
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

/**
 * Datumsprobe (Work-Endtest 27.11.2026): Zürich → Zermatt mit Ankunft am 19. Dezember 2026.
 * Ohne gespeicherte Bahnfahrt nennt die Reiseprüfung die offenen Abschnitte samt Datum
 * («Zürich → Zermatt · 19. Dez.», «Zermatt → Zürich · 26. Dez.»); mit `mitBahn` gibt es eine
 * datierte Bahnfahrt und einen Mietwagen, der Befund zur Hinfahrt steht dann mitten im Satz
 * («… · 19. Dez. Im Plan ist eine Bodenverbindung …»).
 */
function zermattReise(mitBahn: boolean): Trip {
  const etappen: TripStage[] = [
    { id: 'etappe-zrh', position: 1, name: 'Zürich', countryCode: 'CH', arrivalDate: '2026-12-18', departureDate: '2026-12-19', latitude: 47.3769, longitude: 8.5417, placeId: 'geonames:2657896' },
    { id: 'etappe-zermatt', position: 2, name: 'Zermatt', countryCode: 'CH', arrivalDate: '2026-12-19', departureDate: '2026-12-26', latitude: 46.0207, longitude: 7.7491, placeId: 'geonames:2657928' },
  ]
  const reisetage = tage('2026-12-18', '2026-12-26', etappen)
  const bahn = punkt({
    id: 'punkt-bahn', kind: 'transfer', title: 'Zürich → Zermatt', dayId: 'tag-2', stageId: 'etappe-zermatt',
    startsOn: '2026-12-19', startsAt: '08:07', mobilityMode: 'rail',
    originPlaceId: 'geonames:2657896', destinationPlaceId: 'geonames:2657928',
    originName: 'Zürich', destinationName: 'Zermatt',
  })
  const hotel = punkt({
    id: 'punkt-hotel', kind: 'stay', title: 'Chalet Matterhorn, Zermatt', dayId: 'tag-2', stageId: 'etappe-zermatt',
    startsOn: '2026-12-19', endsOn: '2026-12-26', priceAmount: 2240, priceCurrency: 'CHF',
  })
  const ski = punkt({
    id: 'punkt-ski', kind: 'activity', title: 'Skitag Gornergrat', dayId: 'tag-3', stageId: 'etappe-zermatt',
    startsOn: '2026-12-20', startsAt: '09:00', priceAmount: 96, priceCurrency: 'CHF',
  })
  const mietwagen = punkt({
    id: 'punkt-miet', kind: 'rental_car', title: 'Mietwagen Visp', dayId: 'tag-2', stageId: 'etappe-zermatt',
    startsOn: '2026-12-19', endsOn: '2026-12-26', rentalSupplier: 'Europcar', vehicleClass: 'compact',
    transmission: 'automatic', rentalEvidence: 'user',
  })
  const zuordnung: Record<string, TripItem[]> = {
    'tag-2': mitBahn ? [bahn, hotel, mietwagen] : [hotel],
    'tag-3': [ski],
  }
  return {
    id: mitBahn ? 'trip-synth-zermatt-bahn' : 'trip-synth-zermatt',
    clientRef: mitBahn ? 'trip-synth-zermatt-bahn' : 'trip-synth-zermatt',
    title: 'Zermatt im Winter',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-12-18',
    endDate: '2026-12-26',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 3000,
    status: 'draft',
    pace: 'calm',
    interests: ['nature'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: etappen,
    days: reisetage.map((tag) => ({ ...tag, items: zuordnung[tag.id] ?? [] })),
    ohneTag: [],
    dayStageAssignmentMode: 'explicit',
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

/**
 * Bestehende Reise (Work-Nachtest 28.11.2026: «27. Dez..» bei der Graz-Reise): Zürich → Graz,
 * Ankunft am 27. Dezember 2026, mit Flug, Bahn, Unterkunft, Mietwagen und Aktivitäten und mit
 * Einträgen, die in älteren Ständen anders gespeichert wurden (Titel, Namen, Datum ohne Uhrzeit).
 * `jahreswechsel` verlängert den Aufenthalt bis in den Januar, `ohneBeschriftung` lässt die
 * Ortsnamen der Verbindungen weg (so liegen manche gespeicherten Reisen vor).
 */
function grazReise(variante: 'gleiches-jahr' | 'jahreswechsel' | 'ohne-namen'): Trip {
  const ende = variante === 'jahreswechsel' ? '2027-01-03' : '2026-12-31'
  const etappen: TripStage[] = [
    { id: 'etappe-graz', position: 1, name: 'Graz', countryCode: 'AT', arrivalDate: '2026-12-27', departureDate: ende, latitude: 47.0707, longitude: 15.4395, placeId: 'geonames:2778067' },
  ]
  const reisetage = tage('2026-12-27', ende, etappen)
  const namen = variante === 'ohne-namen' ? {} : { originName: 'Zürich', destinationName: 'Graz' }
  const flug = punkt({
    id: 'punkt-flug', kind: 'flight', title: 'Zürich → Graz', dayId: 'tag-1', stageId: 'etappe-graz',
    startsOn: '2026-12-27', startsAt: '07:15', endsOn: '2026-12-27', endsAt: '08:40', priceAmount: 189, priceCurrency: 'CHF', provider: 'duffel',
    ...namen,
  })
  const hotel = punkt({
    id: 'punkt-hotel', kind: 'stay', title: 'Altstadthotel Graz', dayId: 'tag-1', stageId: 'etappe-graz',
    startsOn: '2026-12-27', endsOn: ende, priceAmount: 640, priceCurrency: 'CHF',
  })
  const bahn = punkt({
    id: 'punkt-bahn', kind: 'transfer', title: 'Flughafen Graz → Hauptbahnhof', dayId: 'tag-1', stageId: 'etappe-graz',
    startsOn: '2026-12-27', startsAt: '09:10', mobilityMode: 'rail',
  })
  const mietwagen = punkt({
    id: 'punkt-miet', kind: 'rental_car', title: 'Mietwagen Graz', dayId: 'tag-1', stageId: 'etappe-graz',
    startsOn: '2026-12-27', endsOn: ende, rentalSupplier: 'Sixt', vehicleClass: 'compact',
    transmission: 'manual', rentalEvidence: 'user',
  })
  const schlossberg = punkt({
    id: 'punkt-schlossberg', kind: 'activity', title: 'Schlossberg und Uhrturm', dayId: 'tag-2', stageId: 'etappe-graz',
    startsOn: '2026-12-28', startsAt: '10:00', priceAmount: 0, priceCurrency: 'CHF',
  })
  const advent = punkt({
    id: 'punkt-advent', kind: 'activity', title: 'Winterzauber am Hauptplatz', dayId: 'tag-1', stageId: 'etappe-graz',
    startsOn: '2026-12-27', startsAt: '18:30', priceAmount: 25, priceCurrency: 'CHF',
  })
  const zuordnung: Record<string, TripItem[]> = {
    'tag-1': [flug, hotel, bahn, mietwagen, advent],
    'tag-2': [schlossberg],
  }
  return {
    id: `trip-synth-graz-${variante}`,
    clientRef: `trip-synth-graz-${variante}`,
    title: 'Graz zum Jahreswechsel',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-12-27',
    endDate: ende,
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 2500,
    status: 'draft',
    pace: 'calm',
    interests: ['culture'],
    travelWish: null,
    revision: 3,
    lastMutationId: null,
    stages: etappen,
    days: reisetage.map((tag) => ({ ...tag, items: zuordnung[tag.id] ?? [] })),
    ohneTag: [],
    dayStageAssignmentMode: 'single_destination',
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

/**
 * Bestehende Mehrziel-Reise im Stil der W1-Konto-Reise (Wien, dann Graz), Beginn am 27. Dezember:
 * keine gespeicherte Anreise, keine Verbindung zwischen den Zielen, eine Unterkunft nur in Graz.
 * Die Reiseprüfung nennt damit jeden Befundtyp mit Datum (Flug, Verbindung, fehlende Nächte).
 */
function wienGrazReise(): Trip {
  const etappen: TripStage[] = [
    { id: 'etappe-wien', position: 1, name: 'Wien', countryCode: 'AT', arrivalDate: '2026-12-27', departureDate: '2026-12-29', latitude: 48.2082, longitude: 16.3738, placeId: 'geonames:2761369' },
    { id: 'etappe-graz', position: 2, name: 'Graz', countryCode: 'AT', arrivalDate: '2026-12-29', departureDate: '2027-01-02', latitude: 47.0707, longitude: 15.4395, placeId: 'geonames:2778067' },
  ]
  const reisetage = tage('2026-12-27', '2027-01-02', etappen)
  const hotel = punkt({
    id: 'punkt-hotel', kind: 'stay', title: 'Altstadthotel Graz', dayId: 'tag-3', stageId: 'etappe-graz',
    startsOn: '2026-12-29', endsOn: '2027-01-02', priceAmount: 520, priceCurrency: 'CHF',
  })
  const konzert = punkt({
    id: 'punkt-konzert', kind: 'activity', title: 'Neujahrskonzert', dayId: 'tag-1', stageId: 'etappe-wien',
    startsOn: '2026-12-27', startsAt: '19:30', priceAmount: 80, priceCurrency: 'CHF',
  })
  const zuordnung: Record<string, TripItem[]> = { 'tag-1': [konzert], 'tag-3': [hotel] }
  return {
    id: 'trip-synth-wien-graz',
    clientRef: 'trip-synth-wien-graz',
    title: 'Wien und Graz',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-12-27',
    endDate: '2027-01-02',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'balanced',
    interests: ['culture'],
    travelWish: null,
    revision: 5,
    lastMutationId: null,
    stages: etappen,
    days: reisetage.map((tag) => ({ ...tag, items: zuordnung[tag.id] ?? [] })),
    ohneTag: [],
    dayStageAssignmentMode: 'explicit',
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

/** Kostenprobe: lange Titel, grosse Beträge in zwei Währungen, Posten ohne Preis, Budget überschritten. */
function kostenReise(): Trip {
  const etappen: TripStage[] = [
    { id: 'etappe-tyo', position: 1, name: 'Tokio', countryCode: 'JP', arrivalDate: '2027-03-02', departureDate: '2027-03-12', latitude: 35.6762, longitude: 139.6503, placeId: 'geonames:1850147' },
  ]
  const reisetage = tage('2027-03-02', '2027-03-12', etappen)
  const flug = punkt({
    id: 'punkt-flug', kind: 'flight', title: 'Zürich → Tokio Haneda, Business Class, Hin- und Rückflug', dayId: 'tag-1', stageId: 'etappe-tyo',
    startsOn: '2027-03-02', startsAt: '13:05', priceAmount: 1234567.89, priceCurrency: 'CHF', provider: 'duffel',
    originName: 'Zürich', destinationName: 'Tokio',
  })
  const hotel = punkt({
    id: 'punkt-hotel', kind: 'stay', title: 'Unterkunft Shinjuku mit sehr langem Hausnamen und Zusatzbezeichnung', dayId: 'tag-1', stageId: 'etappe-tyo',
    startsOn: '2027-03-02', endsOn: '2027-03-12', priceAmount: 123456.78, priceCurrency: 'CHF',
    bookingStatus: 'booked', bookingSource: 'user', bookingConfirmedAt: JETZT,
  })
  const bahn = punkt({
    id: 'punkt-bahn', kind: 'activity', title: 'Rail Pass 21 Tage', dayId: 'tag-2', stageId: 'etappe-tyo',
    startsOn: '2027-03-03', priceAmount: 1234567, priceCurrency: 'JPY',
  })
  const essen = punkt({
    id: 'punkt-essen', kind: 'activity', title: 'Kochkurs Tsukiji', dayId: 'tag-4', stageId: 'etappe-tyo',
    startsOn: '2027-03-05', priceAmount: 9999999.99, priceCurrency: 'JPY', bookingStatus: 'booked', bookingSource: 'user', bookingConfirmedAt: JETZT,
  })
  const ohnePreis = punkt({ id: 'punkt-park', kind: 'activity', title: 'Spaziergang durch den Shinjuku Gyoen', dayId: 'tag-5', stageId: 'etappe-tyo', startsOn: '2027-03-06' })
  const zuordnung: Record<string, TripItem[]> = {
    'tag-1': [flug, hotel],
    'tag-2': [bahn],
    'tag-4': [essen],
    'tag-5': [ohnePreis],
  }
  return {
    id: 'trip-synth-kosten',
    clientRef: 'trip-synth-kosten',
    title: 'Tokio mit grossen Beträgen',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2027-03-02',
    endDate: '2027-03-12',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 1000000,
    status: 'draft',
    pace: 'balanced',
    interests: ['culture'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: etappen,
    days: reisetage.map((tag) => ({ ...tag, items: zuordnung[tag.id] ?? [] })),
    ohneTag: [],
    dayStageAssignmentMode: 'single_destination',
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

async function main() {
  const ziel = process.argv[2]
  if (!ziel) throw new Error('Zielordner fehlt.')
  mkdirSync(ziel, { recursive: true })
  const { gastreiseAblegen } = await import('@/lib/trips/gastspeicher')
  for (const [name, bauen] of [['thailand', thailandReise], ['lissabon', lissabonReise], ['kosten', kostenReise], ['zermatt', () => zermattReise(false)], ['zermatt-bahn', () => zermattReise(true)], ['graz', () => grazReise('gleiches-jahr')], ['graz-jahreswechsel', () => grazReise('jahreswechsel')], ['graz-ohne-namen', () => grazReise('ohne-namen')], ['wien-graz', wienGrazReise]] as const) {
    const daten = speicherEinrichten()
    const reise = gastreiseAblegen(bauen())
    const roh = daten.get(SCHLUESSEL_AKTIV)
    if (!roh) throw new Error(`Gastspeicher lieferte keine Reise für ${name}.`)
    writeFileSync(join(ziel, `${name}.json`), JSON.stringify({ id: reise.id, schluessel: SCHLUESSEL_AKTIV, roh }, null, 2))
    console.log(`${name}: ${reise.id} (${reise.days.length} Tage, ${reise.stages.length} Etappen)`)
  }
}

void main()
