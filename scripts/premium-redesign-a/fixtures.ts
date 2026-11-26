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

async function main() {
  const ziel = process.argv[2]
  if (!ziel) throw new Error('Zielordner fehlt.')
  mkdirSync(ziel, { recursive: true })
  const { gastreiseAblegen } = await import('@/lib/trips/gastspeicher')
  for (const [name, bauen] of [['thailand', thailandReise], ['lissabon', lissabonReise]] as const) {
    const daten = speicherEinrichten()
    const reise = gastreiseAblegen(bauen())
    const roh = daten.get(SCHLUESSEL_AKTIV)
    if (!roh) throw new Error(`Gastspeicher lieferte keine Reise für ${name}.`)
    writeFileSync(join(ziel, `${name}.json`), JSON.stringify({ id: reise.id, schluessel: SCHLUESSEL_AKTIV, roh }, null, 2))
    console.log(`${name}: ${reise.id} (${reise.days.length} Tage, ${reise.stages.length} Etappen)`)
  }
}

void main()
