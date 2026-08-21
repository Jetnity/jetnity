#!/usr/bin/env node
// scripts/trip-workspace-ui-audit.mjs
//
// WebKit-/Chromium-Audit der mobilen Trip-Workspace-Informationsarchitektur.
// Fixtures nur hier und im sessionStorage des Harness, nie im Produktspeicher.

import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { chromium, webkit } from 'playwright'

const PORT = process.env.AUDIT_PORT || '3460'
const BASIS = `http://127.0.0.1:${PORT}`
const PFAD = '/ui-audit/trip-workspace'
const BERICHT = process.env.AUDIT_REPORT || '/opt/cursor/artifacts/trip_workspace_ui_audit.json'
const SPEICHER = 'jetnity:ui-audit:workspace'

const BREITEN = [
  { name: '280', width: 280, height: 760 },
  { name: '320', width: 320, height: 760 },
  { name: '360', width: 360, height: 780 },
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 860 },
  { name: '768', width: 768, height: 1024 },
  { name: '844x390', width: 844, height: 390 },
  { name: '1280', width: 1280, height: 800 },
]

const TAB_ID = {
  Übersicht: 'uebersicht',
  Flüge: 'fluege',
  Unterkunft: 'unterkunft',
  Aktivitäten: 'aktivitaeten',
  Mobilität: 'mobilitaet',
}

const TAB_NACHWEIS = {
  Übersicht: 'Deine Reise auf einen Blick',
  Flüge: 'Verbindungen für diese Reise',
  Unterkunft: 'Die Hotelsuche ist in dieser Umgebung nicht verfügbar.',
  Aktivitäten: 'Passende Aktivitäten werden vorbereitet.',
  Mobilität: 'Bahn, Bus, Fähre und Transfer',
}

const TAB_SEQUENZEN = [
  ['Übersicht', 'Flüge', 'Unterkunft', 'Aktivitäten', 'Mobilität', 'Übersicht'],
  ['Mobilität', 'Aktivitäten', 'Unterkunft', 'Flüge', 'Übersicht'],
  ['Aktivitäten', 'Mobilität', 'Flüge', 'Unterkunft', 'Aktivitäten'],
]

const TABWECHSEL_BREITEN = BREITEN.filter((breite) => breite.name === '390' || breite.name === '430')

const JETZT = '2026-08-21T10:00:00.000Z'

function etappe(teil = {}) {
  return {
    id: 'stage-1',
    position: 1,
    name: 'Bali',
    countryCode: 'ID',
    arrivalDate: '2026-09-12',
    departureDate: '2026-09-16',
    latitude: -8.4095,
    longitude: 115.1889,
    placeId: 'geonames:1650535',
    ...teil,
  }
}

function punkt(teil) {
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

function tag(index, teil = {}) {
  return {
    id: `day-${index}`,
    stageId: 'stage-1',
    dayIndex: index,
    dayDate: `2026-09-${String(11 + index).padStart(2, '0')}`,
    title: null,
    items: [],
    ...teil,
  }
}

function reise(teil = {}) {
  return {
    id: 'trip-audit-workspace',
    clientRef: 'trip-audit-workspace',
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
    stages: [etappe()],
    days: [tag(1), tag(2), tag(3), tag(4), tag(5)],
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

const HOTEL_UNAVAILABLE = {
  status: 'unavailable',
  message: 'Die Hotelsuche ist in dieser Umgebung nicht verfügbar.',
  coverageNote: 'Kein Hotelprovider.',
  quartier: null,
  evidenz: {
    hatOrt: true,
    hatKoordinaten: true,
    hatZeitraum: true,
    hatReiseanker: false,
    hatWegezeiten: false,
    hatTransferzeiten: false,
    hatPraeferenzprofil: false,
  },
  options: [],
}

const ACTIVITY_UNAVAILABLE = {
  status: 'unavailable',
  message: 'Passende Aktivitäten werden vorbereitet.',
  coverageNote: 'Kein Activity-Provider.',
  evidenz: {
    hatOrt: true,
    hatKoordinaten: true,
    hatTag: true,
    hatDatum: true,
    hatBestehendePunkte: false,
    hatBelastbareZeiten: false,
    hatInteressen: true,
    hatBudget: true,
  },
  options: [],
}

const MOBILITY_UNAVAILABLE = {
  status: 'unavailable',
  message: 'Verbindungen per Bahn, Bus, Fähre oder Transfer werden vorbereitet. Sobald ein Datenpartner angebunden ist, erscheinen hier echte Angebote – ohne erfundene Fahrpläne oder Preise.',
  coverageNote: 'Kein Mobilitätsprovider.',
  evidenz: {
    hatStart: false,
    hatZiel: false,
    hatDatum: false,
    hatModus: false,
  },
  options: [],
}

const RENTAL_UNAVAILABLE = {
  status: 'unavailable',
  message: 'Mietwagenangebote werden vorbereitet. Sobald ein Datenpartner angebunden ist, erscheinen hier echte Fahrzeuge – ohne erfundene Preise, Klassen oder Verfügbarkeiten.',
  coverageNote: 'Kein Mietwagenprovider.',
  evidenz: {
    hatAbholung: false,
    hatRueckgabe: false,
    hatAbholdatum: false,
    hatRueckgabedatum: false,
  },
  options: [],
}

const ZUSTAENDE = {
  'uebersicht-leer': {
    kompakt: '0 Punkte geplant',
    desktop: 'Tagesplan',
    nutzlast: { reise: reise(), mitSuche: true, mitAenderung: true },
  },
  'uebersicht-gefuellt': {
    kompakt: '3 Punkte geplant',
    desktop: 'ZRH–DPS',
    nutzlast: {
      reise: reise({
        days: [
          tag(1, {
            items: [
              punkt({ id: 'flug-1', kind: 'flight', title: 'ZRH–DPS' }),
              punkt({ id: 'hotel-1', kind: 'stay', title: 'Ubud Inn' }),
              punkt({ id: 'act-1', kind: 'activity', title: 'Reisterrassen' }),
            ],
          }),
          tag(2),
        ],
      }),
      mitSuche: true,
    },
  },
  'plan-viele-tage': {
    kompakt: 'Tag 15',
    desktop: 'Tag 15',
    nutzlast: {
      reise: reise({
        startDate: '2026-09-12',
        endDate: '2026-09-26',
        days: Array.from({ length: 15 }, (_, i) => tag(i + 1)),
      }),
    },
  },
  'lange-texte': {
    kompakt: 'Sehr langer Reisetitel ohne Abschneiden für die Mobile-Kopfzeile Bali Ubud Seminyak',
    desktop: 'Sehr langer Reisetitel ohne Abschneiden für die Mobile-Kopfzeile Bali Ubud Seminyak',
    nutzlast: {
      reise: reise({
        title: 'Sehr langer Reisetitel ohne Abschneiden für die Mobile-Kopfzeile Bali Ubud Seminyak',
        stages: [
          etappe({ name: 'Ubud' }),
          {
            id: 'stage-2',
            position: 2,
            name: 'Seminyak mit sehr langem Etappennamen ohne horizontales Abschneiden',
            countryCode: 'ID',
            arrivalDate: '2026-09-16',
            departureDate: '2026-09-20',
            latitude: -8.691,
            longitude: 115.168,
            placeId: null,
          },
        ],
      }),
    },
  },
  gast: {
    kompakt: 'Dieser Entwurf liegt nur in diesem Browser.',
    desktop: 'Dieser Entwurf liegt nur in diesem Browser.',
    nutzlast: { reise: reise(), gastHinweis: true, quelle: 'guest' },
  },
  konto: {
    kompakt: 'Konto gespeichert',
    desktop: 'Konto gespeichert',
    nutzlast: { reise: reise(), quelle: 'account' },
  },
  aenderung: {
    kompakt: 'Dein Änderungswunsch',
    desktop: 'Dein Änderungswunsch',
    oeffneAenderung: true,
    nutzlast: { reise: reise(), mitAenderung: true },
  },
  fluege: {
    kompakt: 'Verbindungen für diese Reise',
    desktop: 'Verbindungen für diese Reise',
    tab: 'Flüge',
    nutzlast: { reise: reise(), mitSuche: true },
  },
  unterkunft: {
    kompakt: 'Die Hotelsuche ist in dieser Umgebung nicht verfügbar.',
    desktop: 'Die Hotelsuche ist in dieser Umgebung nicht verfügbar.',
    tab: 'Unterkunft',
    nutzlast: { reise: reise(), mitSuche: true },
  },
  aktivitaeten: {
    kompakt: 'Passende Aktivitäten werden vorbereitet.',
    desktop: 'Passende Aktivitäten werden vorbereitet.',
    tab: 'Aktivitäten',
    nutzlast: { reise: reise(), mitSuche: true },
  },
  mobilitaet: {
    kompakt: 'Bahn, Bus, Fähre und Transfer',
    desktop: 'Bahn, Bus, Fähre und Transfer',
    tab: 'Mobilität',
    nutzlast: { reise: reise(), anfangsBereich: 'mobilitaet' },
  },
  'ohne-tag': {
    kompakt: 'Offener Punkt',
    desktop: 'Offener Punkt',
    nutzlast: {
      reise: reise({
        ohneTag: [punkt({ id: 'offen-1', kind: 'note', title: 'Offener Punkt', dayId: null })],
      }),
    },
  },
  'plan-punkte': {
    kompakt: 'Sehr langer Planpunkt ohne Abschneiden fuer die Mobile-Tageskarte Tsukiji',
    desktop: 'Sehr langer Planpunkt ohne Abschneiden fuer die Mobile-Tageskarte Tsukiji',
    nutzlast: {
      reise: reise({
        days: [
          tag(1, {
            items: [
              punkt({
                id: 'lang-1',
                kind: 'activity',
                title: 'Sehr langer Planpunkt ohne Abschneiden fuer die Mobile-Tageskarte Tsukiji',
              }),
              punkt({ id: 'p-2', kind: 'note', title: 'Zweiter Punkt', position: 2 }),
              punkt({ id: 'p-3', kind: 'note', title: 'Dritter Punkt', position: 3 }),
            ],
          }),
          tag(2),
        ],
      }),
    },
  },
  'plan-formular': {
    kompakt: 'Ort oder Aktivität',
    desktop: 'Ort oder Aktivität',
    oeffnePunkt: true,
    nutzlast: { reise: reise() },
  },
  'fluege-bestand': {
    kompakt: 'Hinflug gebucht',
    desktop: 'Deine Flüge',
    tab: 'Flüge',
    nutzlast: {
      anfangsBereich: 'fluege',
      reise: reise({
        startDate: '2026-08-30',
        endDate: '2026-09-13',
        stages: [
          etappe({
            arrivalDate: '2026-08-30',
            departureDate: '2026-09-13',
          }),
        ],
        days: [tag(1), tag(2), tag(3), tag(4), tag(5)],
        ohneTag: [
          punkt({
            id: 'flug-hin',
            kind: 'flight',
            title: 'ZRH → DPS · Swiss',
            dayId: null,
            startsOn: '2026-08-30',
            endsOn: '2026-08-31',
            priceAmount: 890,
            priceCurrency: 'CHF',
            provider: 'duffel',
            externalRef: 'off_1',
            bookingStatus: 'booked',
            bookingSource: 'user',
            bookingConfirmedAt: JETZT,
          }),
        ],
      }),
      mitSuche: true,
    },
  },
  'unterkunft-luecken': {
    kompakt: 'Nächte fehlen',
    desktop: 'Nächte-Abdeckung',
    tab: 'Unterkunft',
    nutzlast: {
      anfangsBereich: 'unterkunft',
      reise: reise({
        startDate: '2026-08-30',
        endDate: '2026-09-13',
        stages: [
          etappe({
            arrivalDate: '2026-08-30',
            departureDate: '2026-09-13',
          }),
        ],
        ohneTag: [
          punkt({
            id: 'stay-1',
            kind: 'stay',
            title: 'Ubud Inn',
            dayId: null,
            startsOn: '2026-08-30',
            endsOn: '2026-09-05',
            priceAmount: 800,
            priceCurrency: 'CHF',
            provider: 'test-hotel',
            externalRef: 'stay-1',
          }),
        ],
      }),
      mitSuche: true,
    },
  },
  'uebersicht-gebucht': {
    kompakt: 'Hinflug gebucht · Rückflug offen',
    desktop: 'Tagesplan',
    nutzlast: {
      reise: reise({
        startDate: '2026-08-30',
        endDate: '2026-09-13',
        stages: [
          etappe({
            arrivalDate: '2026-08-30',
            departureDate: '2026-09-13',
          }),
        ],
        ohneTag: [
          punkt({
            id: 'flug-hin',
            kind: 'flight',
            title: 'ZRH → DPS · Swiss',
            dayId: null,
            startsOn: '2026-08-30',
            priceAmount: 890,
            priceCurrency: 'CHF',
            provider: 'duffel',
            externalRef: 'off_1',
            bookingStatus: 'booked',
            bookingSource: 'user',
            bookingConfirmedAt: JETZT,
          }),
        ],
      }),
    },
  },
  'mobilitaet-manuell': {
    kompakt: 'IC 890',
    desktop: 'IC 890',
    tab: 'Mobilität',
    nutzlast: {
      anfangsBereich: 'mobilitaet',
      reise: reise({
        stages: [etappe({ name: 'Lugano', placeId: 'geonames:2659836', arrivalDate: '2026-09-12' })],
        days: [
          tag(1, {
            items: [
              punkt({
                id: 'rail-1',
                kind: 'transfer',
                title: 'Zürich → Lugano',
                mobilityMode: 'rail',
                originName: 'Zürich Hauptbahnhof',
                destinationName: 'Lugano',
                originPlaceId: 'geonames:2657896',
                destinationPlaceId: 'geonames:2659836',
                startsOn: '2026-09-12',
                startsAt: '08:10',
                endsOn: '2026-09-12',
                endsAt: '10:40',
                connectionRef: 'IC 890',
                mobilityChanges: 0,
                mobilityEvidence: 'user',
              }),
            ],
          }),
          tag(2),
        ],
      }),
    },
  },
  'mobilitaet-gebucht': {
    kompakt: 'Gebucht',
    desktop: 'Gebucht',
    tab: 'Mobilität',
    nutzlast: {
      anfangsBereich: 'mobilitaet',
      reise: reise({
        stages: [etappe({ name: 'Lugano', placeId: 'geonames:2659836', arrivalDate: '2026-09-12' })],
        days: [
          tag(1, {
            items: [
              punkt({
                id: 'bus-1',
                kind: 'transfer',
                title: 'Zürich → Lugano',
                mobilityMode: 'bus',
                originName: 'Zürich',
                destinationName: 'Lugano',
                originPlaceId: 'geonames:2657896',
                destinationPlaceId: 'geonames:2659836',
                startsOn: '2026-09-12',
                bookingStatus: 'booked',
                bookingSource: 'user',
                bookingConfirmedAt: JETZT,
                mobilityEvidence: 'user',
              }),
            ],
          }),
        ],
      }),
    },
  },
  'mobilitaet-unbestimmt': {
    kompakt: 'noch nicht vollständig bestimmbar',
    desktop: 'noch nicht vollständig bestimmbar',
    tab: 'Mobilität',
    nutzlast: {
      anfangsBereich: 'mobilitaet',
      reise: reise({
        origin: null,
        originPlaceId: null,
        startDate: null,
        endDate: null,
        stages: [etappe({ arrivalDate: null, departureDate: null, placeId: null })],
        ohneTag: [
          punkt({
            id: 'ferry-offen',
            kind: 'transfer',
            title: 'Fähre ohne Zuordnung',
            dayId: null,
            mobilityMode: 'ferry',
            mobilityEvidence: 'user',
          }),
        ],
      }),
    },
  },
  'mobilitaet-lange-namen': {
    kompakt: 'Bahnhof Zürich Stadelhofen mit sehr langem Stationsnamen ohne Abschneiden',
    desktop: 'Bahnhof Zürich Stadelhofen mit sehr langem Stationsnamen ohne Abschneiden',
    tab: 'Mobilität',
    nutzlast: {
      anfangsBereich: 'mobilitaet',
      reise: reise({
        origin: 'Bahnhof Zürich Stadelhofen mit sehr langem Stationsnamen ohne Abschneiden',
        stages: [
          etappe({
            name: 'Lugano Stazione FFS mit sehr langem Zielnamen ohne horizontales Abschneiden',
            placeId: 'geonames:2659836',
          }),
        ],
        days: [
          tag(1, {
            items: [
              punkt({
                id: 'rail-lang',
                kind: 'transfer',
                title: 'Bahnhof Zürich Stadelhofen mit sehr langem Stationsnamen ohne Abschneiden → Lugano Stazione FFS mit sehr langem Zielnamen ohne horizontales Abschneiden',
                mobilityMode: 'rail',
                originName: 'Bahnhof Zürich Stadelhofen mit sehr langem Stationsnamen ohne Abschneiden',
                destinationName: 'Lugano Stazione FFS mit sehr langem Zielnamen ohne horizontales Abschneiden',
                startsOn: '2026-09-12',
                mobilityEvidence: 'user',
              }),
            ],
          }),
        ],
      }),
    },
  },
  'mietwagen-leer': {
    kompakt: 'Kein Mietwagen eingetragen',
    desktop: 'Kein Mietwagen eingetragen',
    tab: 'Mobilität',
    oeffneMietwagen: true,
    nutzlast: { anfangsBereich: 'mobilitaet', reise: reise() },
  },
  'mietwagen-geplant': {
    kompakt: 'Mietwagen · 12. Sept. – 16. Sept. · geplant',
    desktop: 'Mietwagen · 12. Sept. – 16. Sept. · geplant',
    tab: 'Mobilität',
    oeffneMietwagen: true,
    nutzlast: {
      anfangsBereich: 'mobilitaet',
      reise: reise({
        ohneTag: [
          punkt({
            id: 'car-1',
            kind: 'rental_car',
            title: 'Mietwagen Zürich Flughafen → Lugano',
            dayId: null,
            originName: 'Zürich Flughafen',
            destinationName: 'Lugano',
            startsOn: '2026-09-12',
            startsAt: '09:00',
            endsOn: '2026-09-16',
            endsAt: '18:00',
            rentalEvidence: 'user',
          }),
        ],
      }),
    },
  },
  'mietwagen-gebucht': {
    kompakt: 'Mietwagen · 12. Sept. – 16. Sept. · gebucht',
    desktop: 'Mietwagen · 12. Sept. – 16. Sept. · gebucht',
    tab: 'Mobilität',
    oeffneMietwagen: true,
    nutzlast: {
      anfangsBereich: 'mobilitaet',
      reise: reise({
        ohneTag: [
          punkt({
            id: 'car-booked',
            kind: 'rental_car',
            title: 'Mietwagen Zürich Flughafen → Lugano',
            dayId: null,
            originName: 'Zürich Flughafen',
            destinationName: 'Lugano',
            startsOn: '2026-09-12',
            endsOn: '2026-09-16',
            bookingStatus: 'booked',
            bookingSource: 'user',
            bookingConfirmedAt: JETZT,
            rentalEvidence: 'user',
          }),
        ],
      }),
    },
  },
  'mietwagen-oneway': {
    kompakt: 'One-way',
    desktop: 'One-way',
    tab: 'Mobilität',
    oeffneMietwagen: true,
    nutzlast: {
      anfangsBereich: 'mobilitaet',
      reise: reise({
        ohneTag: [
          punkt({
            id: 'car-ow',
            kind: 'rental_car',
            title: 'Mietwagen Zürich Flughafen → Lugano Zentrum',
            dayId: null,
            originName: 'Zürich Flughafen',
            destinationName: 'Lugano Zentrum',
            originPlaceId: 'geonames:2657896',
            destinationPlaceId: 'geonames:2659836',
            startsOn: '2026-09-12',
            endsOn: '2026-09-16',
            rentalEvidence: 'user',
          }),
        ],
      }),
    },
  },
  'mietwagen-gleiche-station': {
    kompakt: 'Mietwagen Zürich Flughafen',
    desktop: 'Mietwagen Zürich Flughafen',
    tab: 'Mobilität',
    oeffneMietwagen: true,
    nutzlast: {
      anfangsBereich: 'mobilitaet',
      reise: reise({
        ohneTag: [
          punkt({
            id: 'car-same',
            kind: 'rental_car',
            title: 'Mietwagen Zürich Flughafen',
            dayId: null,
            originName: 'Zürich Flughafen',
            destinationName: 'Zürich Flughafen',
            originPlaceId: 'geonames:2657896',
            destinationPlaceId: 'geonames:2657896',
            startsOn: '2026-09-12',
            endsOn: '2026-09-16',
            rentalEvidence: 'user',
          }),
        ],
      }),
    },
  },
  'mietwagen-ohne-uhrzeit': {
    kompakt: '5 Kalendertage Mietzeitraum',
    desktop: '5 Kalendertage Mietzeitraum',
    tab: 'Mobilität',
    oeffneMietwagen: true,
    ohneText: 'One-way',
    nutzlast: {
      anfangsBereich: 'mobilitaet',
      reise: reise({
        ohneTag: [
          punkt({
            id: 'car-date',
            kind: 'rental_car',
            title: 'Mietwagen Zürich → Lugano',
            dayId: null,
            originName: 'Zürich',
            destinationName: 'Lugano',
            startsOn: '2026-09-12',
            endsOn: '2026-09-16',
            rentalEvidence: 'user',
          }),
        ],
      }),
    },
  },
  'mietwagen-lange-namen': {
    kompakt: 'Zürich Flughafen Terminal 2 Abholzone mit sehr langem Stationsnamen ohne Abschneiden',
    desktop: 'Zürich Flughafen Terminal 2 Abholzone mit sehr langem Stationsnamen ohne Abschneiden',
    tab: 'Mobilität',
    oeffneMietwagen: true,
    nutzlast: {
      anfangsBereich: 'mobilitaet',
      reise: reise({
        ohneTag: [
          punkt({
            id: 'car-lang',
            kind: 'rental_car',
            title: 'Mietwagen Zürich Flughafen Terminal 2 Abholzone mit sehr langem Stationsnamen ohne Abschneiden → Lugano Centro Stazione FFS mit sehr langem Zielnamen ohne horizontales Abschneiden',
            dayId: null,
            originName: 'Zürich Flughafen Terminal 2 Abholzone mit sehr langem Stationsnamen ohne Abschneiden',
            destinationName: 'Lugano Centro Stazione FFS mit sehr langem Zielnamen ohne horizontales Abschneiden',
            startsOn: '2026-09-12',
            endsOn: '2026-09-16',
            rentalSupplier: 'Europcar Tessin Filiale mit sehr langem Vermieternamen ohne horizontales Abschneiden',
            rentalEvidence: 'user',
          }),
        ],
      }),
    },
  },
  'mietwagen-unavailable': {
    kompakt: 'Mietwagenangebote werden vorbereitet',
    desktop: 'Mietwagenangebote werden vorbereitet',
    tab: 'Mobilität',
    oeffneMietwagen: true,
    nutzlast: { anfangsBereich: 'mobilitaet', reise: reise(), mitSuche: true },
  },
  'mietwagen-formular': {
    kompakt: 'Bekannten Mietwagen eintragen',
    desktop: 'Bekannten Mietwagen eintragen',
    tab: 'Mobilität',
    oeffneMietwagen: true,
    formularLeer: true,
    nutzlast: { anfangsBereich: 'mobilitaet', reise: reise() },
  },
  'bestand-unbestimmt': {
    kompakt: 'noch nicht vollständig bestimmbar',
    desktop: 'noch nicht vollständig bestimmbar',
    tab: 'Flüge',
    nutzlast: {
      anfangsBereich: 'fluege',
      reise: reise({
        origin: null,
        originPlaceId: null,
        startDate: null,
        endDate: null,
        stages: [etappe({ arrivalDate: null, departureDate: null, placeId: null })],
        ohneTag: [
          punkt({
            id: 'flug-offen',
            kind: 'flight',
            title: 'ZRH → DPS',
            dayId: null,
            startsOn: null,
            priceAmount: 890,
            priceCurrency: 'CHF',
            provider: 'duffel',
            externalRef: 'off_1',
          }),
        ],
      }),
      mitSuche: true,
    },
  },
}

function layoutPruefen(erwartetBereich) {
  const fehler = []
  const seite = document.documentElement
  if (seite.scrollWidth > seite.clientWidth + 1) {
    fehler.push(`Seiten-Overflow ${seite.scrollWidth}>${seite.clientWidth}`)
  }

  const wurzel = document.querySelector('main')
  if (!wurzel) return { ok: false, fehler: ['Workspace-Hauptbereich fehlt'] }

  const knoepfe = [...wurzel.querySelectorAll('button, a')].filter((el) => {
    if (el.closest('[hidden]')) return false
    const box = el.getBoundingClientRect()
    return box.width > 0 && box.height > 0
  })

  for (const knopf of knoepfe) {
    const box = knopf.getBoundingClientRect()
    if (box.height + 0.5 < 44) {
      fehler.push(`Trefferfläche ${Math.round(box.height)}px < 44px (${(knopf.textContent || '').trim().slice(0, 40)})`)
    }
  }

  const nav = document.querySelector('[aria-label="Reisebereiche"]')
  if (nav && window.innerWidth < 1024) {
    const tabs = [...nav.querySelectorAll('button')]
    const labels = tabs.map((el) => (el.textContent || '').trim())
    if (labels.includes('Plan')) fehler.push('separater Plan-Tab')
    if (tabs.length !== 5) fehler.push(`Bereichsnavigation hat ${tabs.length} Ziele`)
    const aktuell = tabs.filter((el) => el.getAttribute('aria-current') === 'page')
    if (aktuell.length !== 1) fehler.push(`aktiver Bereich nicht eindeutig: ${aktuell.length}`)
    const aktiv = aktuell[0]?.textContent?.trim()
    const plan = document.querySelector('[aria-label="Tagesplan"]')
    if (aktiv === 'Übersicht' && (!plan || plan.closest('[hidden]'))) {
      fehler.push('Übersicht ohne sichtbaren Tagesplan')
    }
    if (aktiv && aktiv !== 'Übersicht' && plan && !plan.closest('[hidden]')) {
      fehler.push('Tagesplan ausserhalb der Übersicht sichtbar')
    }

    const bezeichnung = {
      uebersicht: 'Übersicht',
      fluege: 'Flüge',
      unterkunft: 'Unterkunft',
      aktivitaeten: 'Aktivitäten',
      mobilitaet: 'Mobilität',
    }
    const huellen = [...document.querySelectorAll('[data-arbeitsbereich]')]
    const sichtbare = []
    for (const el of huellen) {
      const id = el.getAttribute('data-arbeitsbereich') || '?'
      const display = getComputedStyle(el).display
      const box = el.getBoundingClientRect()
      if (display === 'none') {
        if (box.width > 0.5 || box.height > 0.5) {
          fehler.push(`${id} bleibt im Layout ${Math.round(box.width)}×${Math.round(box.height)}`)
        }
        if (!el.hasAttribute('inert')) fehler.push(`${id} ohne inert`)
      } else {
        sichtbare.push(id)
      }
    }
    if (huellen.length && sichtbare.length !== 1) {
      fehler.push(`sichtbare Hauptbereiche: ${sichtbare.join(', ') || 'keine'}`)
    }
    if (erwartetBereich && sichtbare[0] && sichtbare[0] !== erwartetBereich) {
      fehler.push(`sichtbar ${sichtbare[0]}, erwartet ${erwartetBereich}`)
    }
    if (erwartetBereich && aktiv !== bezeichnung[erwartetBereich]) {
      fehler.push(`Navigation zeigt ${aktiv || 'nichts'}, erwartet ${bezeichnung[erwartetBereich]}`)
    }
  }

  const versteckt = [...document.querySelectorAll('[hidden]')]
  for (const el of versteckt) {
    if (el.parentElement?.closest('[hidden]')) continue
    const stil = getComputedStyle(el)
    if (stil.display !== 'none') {
      const name = el.getAttribute('data-arbeitsbereich') || (el.textContent || '').trim().slice(0, 24)
      fehler.push(`hidden ohne display:none (${name})`)
    }
    const fokus = el.querySelector('button, a, input, textarea, [tabindex]')
    if (fokus && !el.hasAttribute('inert') && stil.display !== 'none') {
      fehler.push('versteckter Bereich bleibt bedienbar')
    }
  }

  const kopf = document.querySelector('header')
  const fokus = document.activeElement
  if (kopf && fokus && wurzel.contains(fokus)) {
    const k = kopf.getBoundingClientRect()
    const f = fokus.getBoundingClientRect()
    if (f.top < k.bottom - 1 && f.bottom > k.top + 1 && getComputedStyle(kopf).position === 'sticky') {
      fehler.push('Fokusziel unter klebender Kopfzeile')
    }
  }

  const planScroller = document.querySelector('[aria-label="Tagesplan"] .overflow-y-auto')
  if (planScroller && window.innerWidth < 1024) {
    fehler.push('vertikaler Tageslisten-Scroller auf Mobile')
  }

  const plan = document.querySelector('[aria-label="Tagesplan"]')
  if (plan && window.innerWidth < 1024 && !plan.closest('[hidden]')) {
    if (plan.getAttribute('data-tagesplan-modul') !== 'ein') {
      fehler.push('Tagesplan ist kein gemeinsames Modul')
    }
    if (plan.querySelector('[aria-label="Gewählter Reisetag"]')) {
      fehler.push('Tagesinhalt als zweite Karte')
    }
    if (plan.scrollWidth > plan.clientWidth + 1) {
      fehler.push(`Tagesplan-Container scrollt horizontal ${plan.scrollWidth}>${plan.clientWidth}`)
    }
    const zeile = plan.querySelector('[aria-label="Reisetage im Plan"]')
    if (zeile && zeile.scrollWidth > zeile.clientWidth + 1) {
      const andere = [...plan.querySelectorAll('*')].filter((el) => {
        if (el === zeile || zeile.contains(el) || el.contains(zeile)) return false
        const stil = getComputedStyle(el)
        return (stil.overflowX === 'auto' || stil.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 1
      })
      if (andere.length) fehler.push('horizontaler Scroll ausserhalb der Tageszeile')
    }
  }

  return { ok: fehler.length === 0, fehler: [...new Set(fehler)].slice(0, 12) }
}

async function serverStarten() {
  const kind = spawn('npm', ['run', 'dev', '--', '-p', PORT, '-H', '127.0.0.1'], {
    env: {
      ...process.env,
      JETNITY_UI_AUDIT: '1',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.audit',
      NEXT_PUBLIC_APP_URL: BASIS,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let bereit = false
  const ausgabe = []
  kind.stdout.on('data', (chunk) => {
    const text = String(chunk)
    ausgabe.push(text)
    if (text.includes('Ready') || text.includes('started')) bereit = true
  })
  kind.stderr.on('data', (chunk) => ausgabe.push(String(chunk)))
  const start = Date.now()
  while (!bereit && Date.now() - start < 90_000) {
    await new Promise((r) => setTimeout(r, 250))
  }
  if (!bereit) {
    kind.kill()
    throw new Error(`Next.js startete nicht:\n${ausgabe.join('')}`)
  }
  return kind
}

async function seiteVorbereiten(page, zustand) {
  const defin = ZUSTAENDE[zustand]
  await page.addInitScript(
    ({ speicher, nutzlast }) => {
      sessionStorage.setItem(speicher, JSON.stringify(nutzlast))
    },
    { speicher: SPEICHER, nutzlast: defin.nutzlast },
  )

  await page.route('**/api/hotels/search', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(HOTEL_UNAVAILABLE),
    })
  })
  await page.route('**/api/activities/search', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ACTIVITY_UNAVAILABLE),
    })
  })
  await page.route('**/api/flights/search', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'unavailable',
        message: 'Die Flugsuche ist in dieser Umgebung nicht verfügbar.',
        coverageNote: 'Kein Flugprovider.',
        options: [],
      }),
    })
  })
  await page.route('**/api/mobility/search', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOBILITY_UNAVAILABLE),
    })
  })
  await page.route('**/api/rental-cars/search', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(RENTAL_UNAVAILABLE),
    })
  })
}

async function zustandOeffnen(page, zustand, viewport) {
  const defin = ZUSTAENDE[zustand]
  if (viewport.width < 1024) {
    await page.getByRole('navigation', { name: 'Reisebereiche' }).waitFor({ timeout: 15000 })
  } else {
    await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 15000 })
  }
  if (defin.tab && viewport.width < 1024) {
    await page.getByRole('navigation', { name: 'Reisebereiche' }).getByRole('button', { name: defin.tab, exact: true }).click()
  }
  if (defin.oeffneAenderung && viewport.width < 1024) {
    await page.getByRole('button', { name: 'Reise ändern' }).click()
  }
  if (defin.oeffnePunkt) {
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
  }
  if (defin.oeffneMietwagen) {
    await page.getByRole('tab', { name: 'Mietwagen', exact: true }).click()
  }
}

async function zustandPruefen(browser, name, viewport, zustand) {
  const kontext = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.width <= 430,
  })
  const page = await kontext.newPage()
  await seiteVorbereiten(page, zustand)
  await page.goto(`${BASIS}${PFAD}`, { waitUntil: 'domcontentloaded' })
  const defin = ZUSTAENDE[zustand]
  const nachweis = viewport.width >= 1024 ? defin.desktop : defin.kompakt
  try {
    await zustandOeffnen(page, zustand, viewport)
    // Die kompakte Übersicht bleibt eingehängt und `hidden`. Dieselben
    // Statuszeilen stehen dort und im sichtbaren Bestand. `.first()` würde
    // sonst auf den versteckten Knoten warten.
    await page
      .getByText(nachweis, { exact: false })
      .filter({ visible: true })
      .first()
      .waitFor({ timeout: 15000 })
  } catch {
    await kontext.close()
    return {
      ok: false,
      engine: name,
      viewport: viewport.name,
      zustand,
      fehler: [`Inhaltsnachweis fehlt: «${nachweis}»`],
    }
  }
  const extra = []
  if (defin.ohneText) {
    const sichtbar = await page.getByText(defin.ohneText, { exact: false }).filter({ visible: true }).count()
    if (sichtbar > 0) extra.push(`Unerwarteter Text sichtbar: «${defin.ohneText}»`)
  }
  if (defin.formularLeer) {
    const abholung = await page.locator('label:has-text("Abholung") input').inputValue()
    const rueckgabe = await page.locator('label:has-text("Rückgabe") input').inputValue()
    const abholdatum = await page.locator('label:has-text("Abholdatum") input').inputValue()
    const rueckgabedatum = await page.locator('label:has-text("Rückgabedatum") input').inputValue()
    if (abholung || rueckgabe || abholdatum || rueckgabedatum) {
      extra.push(
        `Manuelles Formular war vorbelegt: Abholung=«${abholung}» Rückgabe=«${rueckgabe}» Abholdatum=«${abholdatum}» Rückgabedatum=«${rueckgabedatum}»`,
      )
    }
  }
  const layout = await page.evaluate(
    layoutPruefen,
    viewport.width < 1024 ? (defin.tab ? TAB_ID[defin.tab] : 'uebersicht') : undefined,
  )
  await kontext.close()
  const fehler = [...layout.fehler, ...extra]
  return {
    ok: fehler.length === 0,
    engine: name,
    viewport: viewport.name,
    zustand,
    fehler,
  }
}

async function tabwechselPruefen(browser, name, viewport) {
  const kontext = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.width <= 430,
  })
  const page = await kontext.newPage()
  await page.addInitScript(
    ({ speicher, nutzlast }) => sessionStorage.setItem(speicher, JSON.stringify(nutzlast)),
    {
      speicher: SPEICHER,
      nutzlast: {
        reise: reise({
          days: Array.from({ length: 5 }, (_, i) => tag(i + 1)),
        }),
        mitSuche: true,
        mitAenderung: true,
      },
    },
  )
  await page.route('**/api/hotels/search', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(HOTEL_UNAVAILABLE),
    })
  })
  await page.route('**/api/activities/search', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ACTIVITY_UNAVAILABLE),
    })
  })
  await page.route('**/api/flights/search', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'unavailable',
        message: 'Die Flugsuche ist in dieser Umgebung nicht verfügbar.',
        coverageNote: 'Kein Flugprovider.',
        options: [],
      }),
    })
  })
  await page.route('**/api/mobility/search', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOBILITY_UNAVAILABLE),
    })
  })
  await page.route('**/api/rental-cars/search', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(RENTAL_UNAVAILABLE),
    })
  })

  await page.goto(`${BASIS}${PFAD}`, { waitUntil: 'domcontentloaded' })
  const nav = page.getByRole('navigation', { name: 'Reisebereiche' })
  await nav.waitFor({ timeout: 15000 })
  const fehler = []

  for (const sequenz of TAB_SEQUENZEN) {
    for (const tab of sequenz) {
      await nav.getByRole('button', { name: tab, exact: true }).click()
      try {
        await page
          .getByText(TAB_NACHWEIS[tab], { exact: false })
          .filter({ visible: true })
          .first()
          .waitFor({ timeout: 15000 })
      } catch {
        fehler.push(`${sequenz.join('→')}: Inhaltsnachweis fehlt nach «${tab}»`)
        continue
      }
      const layout = await page.evaluate(layoutPruefen, TAB_ID[tab])
      if (!layout.ok) {
        fehler.push(`${sequenz.join('→')} nach «${tab}»: ${layout.fehler.join('; ')}`)
      }
    }
  }

  await kontext.close()
  return {
    ok: fehler.length === 0,
    engine: name,
    viewport: `${viewport.name}-tabwechsel`,
    zustand: 'tabwechsel',
    fehler: [...new Set(fehler)].slice(0, 12),
  }
}

async function interaktionPruefen(browser, name) {
  const kontext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
  const page = await kontext.newPage()
  let hotel = 0
  let activity = 0
  let mobility = 0
  let rental = 0
  await page.addInitScript(
    ({ speicher, nutzlast }) => sessionStorage.setItem(speicher, JSON.stringify(nutzlast)),
    {
      speicher: SPEICHER,
      nutzlast: {
        reise: reise({
          days: Array.from({ length: 15 }, (_, i) => tag(i + 1)),
        }),
        mitSuche: true,
        mitAenderung: true,
      },
    },
  )
  await page.route('**/api/hotels/search', async (route) => {
    hotel += 1
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(HOTEL_UNAVAILABLE),
    })
  })
  await page.route('**/api/activities/search', async (route) => {
    activity += 1
    const roh = route.request().postData() || '{}'
    const tagId = JSON.parse(roh).day?.id || 'unbekannt'
    await new Promise((r) => setTimeout(r, 250))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...ACTIVITY_UNAVAILABLE, message: `Antwort für ${tagId}` }),
    })
  })
  await page.route('**/api/flights/search', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'unavailable', message: 'aus', options: [] }),
    })
  })
  await page.route('**/api/mobility/search', async (route) => {
    mobility += 1
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOBILITY_UNAVAILABLE),
    })
  })
  await page.route('**/api/rental-cars/search', async (route) => {
    rental += 1
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(RENTAL_UNAVAILABLE),
    })
  })

  await page.goto(`${BASIS}${PFAD}`, { waitUntil: 'domcontentloaded' })
  await page.getByText('Noch kein Flug ausgewählt').waitFor({ timeout: 15000 })
  const nav = page.getByRole('navigation', { name: 'Reisebereiche' })
  const planTab = await nav.getByRole('button', { name: 'Plan', exact: true }).count()
  const tagesplanInUebersicht = await page.getByLabel('Tagesplan').isVisible()
  const einModul = await page.locator('[data-tagesplan-modul="ein"]').count()
  const hotelNachUebersicht = hotel
  const activityNachUebersicht = activity
  const mobilityNachUebersicht = mobility
  const rentalNachUebersicht = rental

  await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
  const formular = await page.getByText('Ort oder Aktivität').isVisible()
  await page.getByRole('button', { name: 'Abbrechen' }).click()

  await page.getByRole('button', { name: /Tag 3/ }).click()
  await nav.getByRole('button', { name: 'Aktivitäten', exact: true }).click()
  await page.getByText('Antwort für day-3', { exact: false }).waitFor({ timeout: 15000 })
  const dritter = page.getByRole('radio').nth(2)
  const checked = await dritter.getAttribute('aria-checked')

  await nav.getByRole('button', { name: 'Übersicht', exact: true }).click()
  await page.getByLabel('Tagesplan').waitFor({ timeout: 15000 })
  const tagDreiZurueck = await page.getByRole('button', { name: /Tag 3/ }).getAttribute('aria-current')
  await page.getByRole('button', { name: /Tag 15/ }).click()
  const tag15 = await page.getByRole('button', { name: /Tag 15/ }).getAttribute('aria-current')
  await page.getByRole('button', { name: /Tag 3/ }).click()

  await nav.getByRole('button', { name: 'Flüge', exact: true }).click()
  await page.getByText('Verbindungen für diese Reise').waitFor({ timeout: 15000 })
  await nav.getByRole('button', { name: 'Übersicht', exact: true }).click()
  const planNachFluege = await page.getByLabel('Tagesplan').isVisible()

  await nav.getByRole('button', { name: 'Unterkunft', exact: true }).click()
  await page.getByText('Die Hotelsuche ist in dieser Umgebung nicht verfügbar.').waitFor({ timeout: 15000 })
  const hotelNachErstbesuch = hotel
  await nav.getByRole('button', { name: 'Übersicht', exact: true }).click()
  await nav.getByRole('button', { name: 'Unterkunft', exact: true }).click()
  await page.waitForTimeout(400)
  const hotelNachZweitemBesuch = hotel

  await nav.getByRole('button', { name: 'Mobilität', exact: true }).click()
  await page.getByText('Bahn, Bus, Fähre und Transfer').waitFor({ timeout: 15000 })
  const mobilityNachErstbesuch = mobility
  const rentalNachVerbindungen = rental
  await page.getByRole('tab', { name: 'Mietwagen', exact: true }).click()
  await page
    .getByText('Nicht jede Reise braucht ein Auto', { exact: false })
    .filter({ visible: true })
    .first()
    .waitFor({ timeout: 15000 })
  const rentalNachErstbesuch = rental
  await page.getByRole('tab', { name: 'Verbindungen', exact: true }).click()
  await page.getByText('Bahn, Bus, Fähre und Transfer').waitFor({ timeout: 15000 })
  await page.getByRole('tab', { name: 'Mietwagen', exact: true }).click()
  await page.waitForTimeout(400)
  const rentalNachZweitemBesuch = rental
  await nav.getByRole('button', { name: 'Übersicht', exact: true }).click()
  await nav.getByRole('button', { name: 'Mobilität', exact: true }).click()
  await page.waitForTimeout(400)
  const mobilityNachZweitemBesuch = mobility

  await nav.getByRole('button', { name: 'Übersicht', exact: true }).click()
  await page.getByRole('button', { name: 'Reise ändern' }).click()
  const fokus = await page.evaluate(() => document.activeElement?.tagName === 'TEXTAREA')
  await page.keyboard.press('Escape')
  const geschlossen = await page.getByRole('button', { name: 'Reise ändern' }).getAttribute('aria-expanded')

  const navScroller = nav.locator('[tabindex="0"]')
  await navScroller.focus()
  await page.keyboard.press('Tab')
  const navFokus = await page.evaluate(() => {
    const el = document.activeElement
    return Boolean(el && el.closest('[aria-label="Reisebereiche"]') && el.matches(':focus-visible'))
  })

  await kontext.close()
  const fehler = []
  if (planTab !== 0) fehler.push('Navigation enthält einen separaten Plan-Tab')
  if (!tagesplanInUebersicht) fehler.push('Übersicht enthält keinen Tagesplan')
  if (einModul !== 1) fehler.push(`Tagesplan nicht als ein Modul: ${einModul}`)
  if (tag15 !== 'date') fehler.push('letzter Reisetag in der Tageszeile nicht erreichbar')
  if (!formular) fehler.push('Punkt hinzufügen öffnete das Formular nicht')
  if (hotelNachUebersicht !== 0) fehler.push(`Hotelsuche startete in der Übersicht: ${hotelNachUebersicht}`)
  if (activityNachUebersicht !== 0) fehler.push(`Aktivitätensuche startete in der Übersicht: ${activityNachUebersicht}`)
  if (mobilityNachUebersicht !== 0) fehler.push(`Mobilitätssuche startete in der Übersicht: ${mobilityNachUebersicht}`)
  if (rentalNachUebersicht !== 0) fehler.push(`Mietwagensuche startete in der Übersicht: ${rentalNachUebersicht}`)
  if (rentalNachVerbindungen !== 0) {
    fehler.push(`Mietwagensuche startete im Verbindungsbereich: ${rentalNachVerbindungen}`)
  }
  if (checked !== 'true') fehler.push('gewählter Tag blieb zwischen Übersicht und Aktivitäten nicht erhalten')
  if (tagDreiZurueck !== 'date') fehler.push('Tagesauswahl in der Übersicht blieb nach Aktivitäten nicht erhalten')
  if (!planNachFluege) fehler.push('Rückkehr von Flügen zeigte den Tagesplan nicht')
  if (hotelNachErstbesuch < 1) fehler.push('Unterkunft löste keine Hotelsuche aus')
  if (hotelNachZweitemBesuch !== hotelNachErstbesuch) {
    fehler.push(`Tabwechsel löste Hotelsuche erneut aus: ${hotelNachErstbesuch} → ${hotelNachZweitemBesuch}`)
  }
  if (mobilityNachErstbesuch < 1) fehler.push('Mobilität löste keine Suche aus')
  if (mobilityNachZweitemBesuch !== mobilityNachErstbesuch) {
    fehler.push(`Tabwechsel löste Mobilitätssuche erneut aus: ${mobilityNachErstbesuch} → ${mobilityNachZweitemBesuch}`)
  }
  if (rentalNachErstbesuch !== 0) {
    fehler.push(`Mietwagen startete eine Suche ohne Nutzeraktion: ${rentalNachErstbesuch}`)
  }
  if (rentalNachZweitemBesuch !== 0) {
    fehler.push(`Unterbereichwechsel löste Mietwagensuche aus: ${rentalNachZweitemBesuch}`)
  }
  if (!fokus) fehler.push('Fokus lag nach Reise ändern nicht im Feld')
  if (geschlossen !== 'false') fehler.push('Escape schloss Reise ändern nicht')
  if (!navFokus) fehler.push('Fokusring der Bereichsnavigation nicht sichtbar')
  if (activity > 6) fehler.push(`Activity-Request-Schleife verdächtig: ${activity}`)
  return {
    ok: fehler.length === 0,
    engine: name,
    viewport: '390-interaktion',
    zustand: 'navigation',
    fehler,
    hotel,
    activity,
  }
}

async function main() {
  const server = await serverStarten()
  const ergebnisse = []
  const engines = [
    ['webkit', webkit],
    ['chromium', chromium],
  ]
  try {
    for (const [name, typ] of engines) {
      const browser = await typ.launch({ headless: true })
      try {
        for (const viewport of BREITEN) {
          for (const zustand of Object.keys(ZUSTAENDE)) {
            ergebnisse.push(await zustandPruefen(browser, name, viewport, zustand))
          }
        }
        for (const viewport of TABWECHSEL_BREITEN) {
          ergebnisse.push(await tabwechselPruefen(browser, name, viewport))
        }
        ergebnisse.push(await interaktionPruefen(browser, name))
      } finally {
        await browser.close()
      }
    }
  } finally {
    try {
      server.kill('SIGTERM')
    } catch {
      // Next kann sich vom Spawn lösen.
    }
  }

  const fehlgeschlagen = ergebnisse.filter((e) => !e.ok)
  const bericht = {
    kombinationen: ergebnisse.length,
    engines: ['webkit', 'chromium'],
    viewports: BREITEN.map((b) => b.name),
    zustaende: Object.keys(ZUSTAENDE),
    fehlerzahl: fehlgeschlagen.length,
    fehlgeschlagen,
  }
  try {
    writeFileSync(BERICHT, JSON.stringify(bericht, null, 2))
  } catch {
    writeFileSync('trip_workspace_ui_audit.json', JSON.stringify(bericht, null, 2))
  }
  console.log(JSON.stringify(bericht, null, 2))
  try {
    server.kill('SIGTERM')
  } catch {
    // Der Next-Prozess kann sich vom Spawn lösen; der Bericht ist trotzdem fertig.
  }
  process.exit(fehlgeschlagen.length ? 1 : 0)
}

await main()
