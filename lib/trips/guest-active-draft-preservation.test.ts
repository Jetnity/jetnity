// lib/trips/guest-active-draft-preservation.test.ts
//
// Residual of completed #517: ordinary load/create must not treat an occupied
// but unusable active v3 key as free capacity. No new storage key, no repair.

import { describe, test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import {
  GAST_CREATE_ERHALTUNG_TEXTE,
  darfCreateModellAufrufen,
  gastCreateBelegungLesen,
  gastCreateJetztPruefen,
} from '@/lib/trips/create-entry'
import {
  GastreiseBestehtFehler,
  GastreiseUnbrauchbarFehler,
  GastspeicherUnlesbarFehler,
  SCHLUESSEL,
  gastreiseAblegen,
  gastreiseAnlegen,
  gastspeicherCreateBelegungLesen,
  gastspeicherLaden,
  kennungErzeugen,
  aktiveGastreiseVorpruefen,
} from '@/lib/trips/gastspeicher'
import type { CreateTripInput } from '@/types/trips'
import type { Trip } from '@/types/trips'

function speicherStellen() {
  const ablage = new Map<string, string>()
  let lesenWirft = false
  const werfendeSchluessel = new Set<string>()
  const schreibvorgaenge: Array<{ art: 'set' | 'remove'; schluessel: string }> = []

  Object.assign(globalThis, {
    window: {
      localStorage: {
        getItem: (schluessel: string) => {
          if (lesenWirft || werfendeSchluessel.has(schluessel)) throw new Error('SecurityError')
          return ablage.get(schluessel) ?? null
        },
        setItem: (schluessel: string, wert: string) => {
          schreibvorgaenge.push({ art: 'set', schluessel })
          ablage.set(schluessel, wert)
        },
        removeItem: (schluessel: string) => {
          schreibvorgaenge.push({ art: 'remove', schluessel })
          ablage.delete(schluessel)
        },
      },
    },
  })

  return {
    ablage,
    schreibvorgaenge,
    lesenWerfen: () => {
      lesenWirft = true
    },
    schluesselWerfen: (schluessel: string) => {
      werfendeSchluessel.add(schluessel)
    },
    roh: (schluessel: string) => ablage.get(schluessel) ?? null,
    setzen: (schluessel: string, wert: unknown) =>
      ablage.set(schluessel, typeof wert === 'string' ? wert : JSON.stringify(wert)),
    snapshot: () => ({
      aktiv: ablage.get(SCHLUESSEL.aktiv) ?? null,
      legacy: ablage.get(SCHLUESSEL.legacy) ?? null,
      warteschlange: ablage.get(SCHLUESSEL.warteschlange) ?? null,
      schreibvorgaenge: schreibvorgaenge.length,
    }),
  }
}

let speicher: ReturnType<typeof speicherStellen>

beforeEach(() => {
  speicher = speicherStellen()
})

function eingabe(abweichung: Partial<CreateTripInput> = {}): CreateTripInput {
  return {
    clientRef: kennungErzeugen('trip'),
    title: 'Japan im Herbst',
    destination: 'Japan',
    destinationPlaceId: 'geonames:1861060',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 4200,
    pace: 'balanced',
    interests: ['culture'],
    travelWish: null,
    ...abweichung,
  }
}

function legacyMini(id: string, title: string, updatedAt: string) {
  return {
    id,
    title,
    destination: title,
    origin: 'Zürich',
    startDate: '2026-09-12',
    endDate: '2026-09-12',
    travelers: 1,
    pace: 'ausgewogen',
    interests: [],
    days: [{ id: 'day-1', date: '2026-09-12', items: [] }],
    createdAt: updatedAt,
    updatedAt,
  }
}

function warteschlangeEintrag(id: string) {
  return {
    id,
    clientRef: id,
    title: 'Wartend',
    origin: null,
    startDate: '2026-09-12',
    endDate: '2026-09-12',
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'balanced',
    interests: [],
    travelWish: null,
    stages: [
      {
        id: 'stage-1',
        position: 1,
        name: 'Paris',
        countryCode: null,
        arrivalDate: null,
        departureDate: null,
        latitude: null,
        longitude: null,
        placeId: null,
      },
    ],
    days: [{ id: 'day-1', dayIndex: 1, dayDate: '2026-09-12', title: null, items: [], stageId: null }],
    ohneTag: [],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  }
}

function assertUnveraendert(vorher: ReturnType<typeof speicher.snapshot>) {
  const danach = speicher.snapshot()
  assert.equal(danach.aktiv, vorher.aktiv)
  assert.equal(danach.legacy, vorher.legacy)
  assert.equal(danach.warteschlange, vorher.warteschlange)
  assert.equal(danach.schreibvorgaenge, vorher.schreibvorgaenge)
}

const DEFEKTE = [
  ['malformedJSON', '{bad-json'],
  ['schemaInvalid', JSON.stringify({ id: 'trip-1', title: 'Halb' })],
  ['emptyString', ''],
  ['jsonNull', 'null'],
  ['primitiveNumber', '42'],
  ['primitiveBool', 'true'],
  ['primitiveString', '"nur-text"'],
] as const

describe('Loader und Create überschreiben ungültige aktive Bytes nicht', () => {
  for (const [name, roh] of DEFEKTE) {
    test(`${name}: Loader und beide Create-APIs schreiben nichts`, () => {
      const legacyRoh = JSON.stringify([legacyMini('trip-alt', 'Barcelona', '2026-08-01T10:00:00.000Z')])
      speicher.setzen(SCHLUESSEL.aktiv, roh)
      speicher.setzen(SCHLUESSEL.legacy, legacyRoh)
      speicher.setzen(SCHLUESSEL.warteschlange, [warteschlangeEintrag('trip-warte')])
      const vorher = speicher.snapshot()

      assert.deepEqual(aktiveGastreiseVorpruefen(), { art: 'ungueltig' })
      assert.equal(gastspeicherLaden().aktiv, null)
      assertUnveraendert(vorher)

      assert.throws(() => gastreiseAnlegen(eingabe()), GastreiseUnbrauchbarFehler)
      assertUnveraendert(vorher)

      assert.throws(
        () =>
          gastreiseAblegen({
            id: 'trip-neu',
            clientRef: 'trip-neu',
            title: 'Neuer Vorschlag',
            origin: 'Zürich',
            originPlaceId: 'geonames:2657896',
            startDate: '2026-09-12',
            endDate: '2026-09-16',
            travellers: 2,
            currency: 'CHF',
            budgetAmount: null,
            status: 'draft',
            pace: 'balanced',
            interests: [],
            travelWish: null,
            revision: 1,
            lastMutationId: null,
            stages: [],
            days: [],
            ohneTag: [],
            createdAt: '2026-09-12T10:00:00.000Z',
            updatedAt: '2026-09-12T10:00:00.000Z',
          } as Trip),
        GastreiseUnbrauchbarFehler,
      )
      assertUnveraendert(vorher)

      const gate = gastCreateJetztPruefen(false)
      assert.equal(gate.erlaubt, false)
      if (gate.erlaubt) throw new Error('unerwartet erlaubt')
      assert.equal(gate.grund, 'ungueltig')
      assert.equal(darfCreateModellAufrufen(gate), false)
      assertUnveraendert(vorher)
    })
  }

  test('getItem-Wurf ist unlesbar und ändert keine Bytes', () => {
    speicher.setzen(SCHLUESSEL.aktiv, '{bad-json')
    speicher.setzen(SCHLUESSEL.legacy, [legacyMini('trip-alt', 'Barcelona', '2026-08-01T10:00:00.000Z')])
    const vorher = speicher.snapshot()
    speicher.lesenWerfen()

    assert.deepEqual(aktiveGastreiseVorpruefen(), { art: 'speicher_unlesbar' })
    assert.equal(gastspeicherLaden().aktiv, null)
    assert.throws(() => gastreiseAnlegen(eingabe()), GastspeicherUnlesbarFehler)
    assert.equal(gastCreateJetztPruefen(false).erlaubt, false)
    assert.equal(speicher.snapshot().schreibvorgaenge, vorher.schreibvorgaenge)
  })

  test('werfender localStorage-Getter blockiert Create ohne Schreibversuch', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {},
    })
    Object.defineProperty(globalThis.window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError')
      },
    })

    assert.deepEqual(aktiveGastreiseVorpruefen(), { art: 'speicher_unlesbar' })
    assert.deepEqual(gastspeicherLaden(), { aktiv: null, warteschlange: [] })
    assert.throws(() => gastreiseAnlegen(eingabe()), GastspeicherUnlesbarFehler)
    const gate = gastCreateJetztPruefen(false)
    assert.equal(gate.erlaubt, false)
    if (gate.erlaubt) throw new Error('unerwartet erlaubt')
    assert.equal(gate.grund, 'speicher_unlesbar')
  })
})

describe('Fehlender aktiver Schlüssel behält Migration, Idempotenz und One-Trip', () => {
  test('fehlend plus gültiges Legacy wird weiterhin übernommen', () => {
    speicher.setzen(SCHLUESSEL.legacy, [legacyMini('trip-alt', 'Barcelona', '2026-08-01T10:00:00.000Z')])
    assert.deepEqual(aktiveGastreiseVorpruefen(), { art: 'fehlend' })
    assert.equal(gastspeicherLaden().aktiv?.title, 'Barcelona')
    assert.equal(speicher.roh(SCHLUESSEL.legacy), null)
  })

  test('gültige aktive Reise blockiert ein zweites Anlegen', () => {
    const erste = gastreiseAnlegen(eingabe({ title: 'Erste' }))
    const roh = speicher.roh(SCHLUESSEL.aktiv)
    assert.throws(() => gastreiseAnlegen(eingabe({ title: 'Zweite' })), GastreiseBestehtFehler)
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), roh)
    assert.equal(gastspeicherLaden().aktiv?.id, erste.id)
  })

  test('Ablegen mit derselben Kennung bleibt idempotent', () => {
    const erste = gastreiseAnlegen(eingabe({ clientRef: 'trip-gleich', title: 'Gleich' }))
    const zweite = gastreiseAblegen({ ...erste, title: 'Sollte nicht gewinnen' })
    assert.equal(zweite.id, erste.id)
    assert.equal(zweite.title, 'Gleich')
  })

  test('leerer Speicher darf unter dem bestehenden Vertrag anlegen', () => {
    assert.deepEqual(aktiveGastreiseVorpruefen(), { art: 'fehlend' })
    const reise = gastreiseAnlegen(eingabe({ title: 'Neu' }))
    assert.equal(reise.title, 'Neu')
    assert.deepEqual(aktiveGastreiseVorpruefen(), { art: 'gueltig' })
  })
})

describe('Fehlender aktiver Schlüssel plus gültiges Legacy belegt den Create-Slot ohne Schreiben', () => {
  test('Belegung und Action-Gate sehen den neuesten gültigen Legacy-Entwurf', () => {
    speicher.setzen(SCHLUESSEL.legacy, [
      legacyMini('trip-alt', 'Älter', '2026-07-01T10:00:00.000Z'),
      legacyMini('trip-neu', 'Barcelona', '2026-08-01T10:00:00.000Z'),
    ])
    const vorher = speicher.snapshot()

    assert.deepEqual(aktiveGastreiseVorpruefen(), { art: 'fehlend' })
    const belegt = gastspeicherCreateBelegungLesen()
    assert.equal(belegt.art, 'gueltig')
    if (belegt.art !== 'gueltig') throw new Error('erwartet gueltig')
    assert.equal(belegt.id, 'trip-neu')
    assert.equal(belegt.titel, 'Barcelona')

    const gelesen = gastCreateBelegungLesen()
    assert.equal(gelesen.art, 'gueltig')
    if (gelesen.art !== 'gueltig') throw new Error('erwartet gueltig')
    assert.equal(gelesen.id, 'trip-neu')
    assert.equal(gelesen.titel, 'Barcelona')

    const gate = gastCreateJetztPruefen(false)
    assert.equal(gate.erlaubt, false)
    if (gate.erlaubt) throw new Error('unerwartet erlaubt')
    assert.equal(gate.grund, 'besteht')
    assert.equal(gate.bestehendeId, 'trip-neu')
    assert.equal(darfCreateModellAufrufen(gate), false)
    assertUnveraendert(vorher)
  })

  test('ungültiges Legacy bleibt ein freier Slot und wird nicht aufgeräumt', () => {
    speicher.setzen(SCHLUESSEL.legacy, { title: 'Halb' })
    const vorher = speicher.snapshot()
    assert.equal(gastCreateBelegungLesen().art, 'fehlend')
    assert.equal(gastCreateJetztPruefen(false).erlaubt, true)
    assertUnveraendert(vorher)
  })

  test('gültiges Legacy nach dem ersten Render blockiert den Netzschritt', () => {
    assert.equal(gastCreateJetztPruefen(false).erlaubt, true)
    speicher.setzen(SCHLUESSEL.legacy, [legacyMini('trip-spaeter', 'Lissabon', '2026-08-01T10:00:00.000Z')])
    const danach = gastCreateJetztPruefen(false)
    assert.equal(danach.erlaubt, false)
    if (danach.erlaubt) throw new Error('unerwartet erlaubt')
    assert.equal(danach.grund, 'besteht')
    assert.equal(danach.bestehendeId, 'trip-spaeter')
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), null)
  })

  test('ungültige aktive Bytes plus Legacy bleiben ungueltig und ungeschrieben', () => {
    speicher.setzen(SCHLUESSEL.aktiv, '{bad-json')
    speicher.setzen(SCHLUESSEL.legacy, [legacyMini('trip-alt', 'Barcelona', '2026-08-01T10:00:00.000Z')])
    const vorher = speicher.snapshot()
    assert.equal(gastspeicherCreateBelegungLesen().art, 'ungueltig')
    const gate = gastCreateJetztPruefen(false)
    assert.equal(gate.erlaubt, false)
    if (gate.erlaubt) throw new Error('unerwartet erlaubt')
    assert.equal(gate.grund, 'ungueltig')
    assertUnveraendert(vorher)
  })
})

function ablegenEntwurf(): Trip {
  return {
    id: 'trip-neu',
    clientRef: 'trip-neu',
    title: 'Neuer Vorschlag',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'balanced',
    interests: [],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [],
    days: [],
    ohneTag: [],
    createdAt: '2026-09-12T10:00:00.000Z',
    updatedAt: '2026-09-12T10:00:00.000Z',
  } as Trip
}

describe('Aktiver Schlüssel fehlt, Legacy-Lesen wirft – fail closed', () => {
  test('Belegung, Action-Gate und beide Persistenzwege bleiben unlesbar ohne Schreiben', () => {
    assert.deepEqual(aktiveGastreiseVorpruefen(), { art: 'fehlend' })
    const vorher = speicher.snapshot()
    speicher.schluesselWerfen(SCHLUESSEL.legacy)

    assert.deepEqual(aktiveGastreiseVorpruefen(), { art: 'fehlend' })
    assert.equal(gastspeicherCreateBelegungLesen().art, 'speicher_unlesbar')
    assert.equal(gastCreateBelegungLesen().art, 'speicher_unlesbar')

    const gate = gastCreateJetztPruefen(false)
    assert.equal(gate.erlaubt, false)
    if (gate.erlaubt) throw new Error('unerwartet erlaubt')
    assert.equal(gate.grund, 'speicher_unlesbar')
    assert.equal(darfCreateModellAufrufen(gate), false)

    assert.throws(() => gastreiseAnlegen(eingabe()), GastspeicherUnlesbarFehler)
    assert.throws(() => gastreiseAblegen(ablegenEntwurf()), GastspeicherUnlesbarFehler)
    assert.equal(gastspeicherLaden().aktiv, null)
    assertUnveraendert(vorher)
  })

  test('Konto bleibt unabhängig vom werfenden Legacy-Schlüssel', () => {
    speicher.schluesselWerfen(SCHLUESSEL.legacy)
    assert.equal(gastCreateJetztPruefen(true).erlaubt, true)
    assert.equal(gastCreateBelegungLesen().art, 'speicher_unlesbar')
  })

  test('beschädigte Legacy-Bytes bleiben ein freier Slot und unaufgeräumt', () => {
    speicher.setzen(SCHLUESSEL.legacy, '{bad-legacy')
    const vorher = speicher.snapshot()
    assert.equal(gastspeicherCreateBelegungLesen().art, 'fehlend')
    assert.equal(gastCreateJetztPruefen(false).erlaubt, true)
    const reise = gastreiseAnlegen(eingabe({ title: 'Neu trotz Altbytes' }))
    assert.equal(reise.title, 'Neu trotz Altbytes')
    assert.equal(speicher.roh(SCHLUESSEL.legacy), '{bad-legacy')
    assert.equal(vorher.legacy, '{bad-legacy')
  })
})

describe('Action-time Create-Prüfung beobachtet frisch', () => {
  test('ungültig nach dem ersten Render blockiert den Netzschritt', () => {
    assert.equal(gastCreateJetztPruefen(false).erlaubt, true)
    speicher.setzen(SCHLUESSEL.aktiv, '{bad-json')
    const danach = gastCreateJetztPruefen(false)
    assert.equal(danach.erlaubt, false)
    if (danach.erlaubt) throw new Error('unerwartet erlaubt')
    assert.equal(danach.grund, 'ungueltig')
    assert.equal(darfCreateModellAufrufen(danach), false)
  })

  test('Konto prüft den Gastspeicher nicht', () => {
    speicher.setzen(SCHLUESSEL.aktiv, '{bad-json')
    assert.equal(gastCreateJetztPruefen(true).erlaubt, true)
    assert.equal(gastCreateBelegungLesen().art, 'ungueltig')
  })

  test('SSR ohne window autorisiert keinen Gast-Create', () => {
    const vorher = Object.getOwnPropertyDescriptor(globalThis, 'window')
    Reflect.deleteProperty(globalThis, 'window')
    try {
      const gate = gastCreateJetztPruefen(false)
      assert.equal(gate.erlaubt, false)
      if (gate.erlaubt) throw new Error('unerwartet erlaubt')
      assert.equal(gate.grund, 'nicht_beobachtet')
    } finally {
      if (vorher) Object.defineProperty(globalThis, 'window', vorher)
    }
  })

  test('Erhaltungstexte behaupten weder Verlust noch Wiederherstellung', () => {
    const alle = Object.values(GAST_CREATE_ERHALTUNG_TEXTE).join(' ')
    assert.equal(/verloren|wiederherstell|kein Entwurf|safe|recoverable/i.test(alle), false)
  })
})
