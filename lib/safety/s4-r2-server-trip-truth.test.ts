import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { Lesung } from '@/lib/api/datenbank-lesen'
import {
  safetyEvaluationsPruefen,
  safetyIstKontoTripId,
  safetyReiseAufloesen,
  tripAusSafetyAnfrage,
  type SafetyReiseLesen,
} from '@/lib/safety/auswerten'
import { mehrzielreise, safetyFact, testSafetyProvider } from '@/lib/safety/fixtures'
import { safetyContextFingerprint } from '@/lib/safety/fingerprint'
import { safetyAnfrageSchema, safetyVerboteneClientWahrheit } from '@/lib/safety/schema'
import { safetyAnsicht, safetyApiStatus } from '@/lib/safety/status'
import { istKontoKennung } from '@/lib/trips/daten'
import type { Trip, TripTraveller } from '@/types/trips'

const KONTO_TRIP_ID = 'aaaaaaaa-0000-4000-8000-000000000001'
const FREMD_TRIP_ID = 'bbbbbbbb-0000-4000-8000-000000000002'
const GAST_TRIP_ID = `trip-${KONTO_TRIP_ID}`

function reisender(opts: { clientRef: string; codes: string[] }): TripTraveller {
  return {
    id: opts.clientRef,
    clientRef: opts.clientRef,
    label: opts.clientRef,
    residenceCountryCode: null,
    citizenships: opts.codes.map((code) => ({
      id: `${opts.clientRef}-${code}`,
      clientRef: `${opts.clientRef}:cit:${code}`,
      countryCode: code,
      createdAt: '2026-08-21T00:00:00.000Z',
      updatedAt: '2026-08-21T00:00:00.000Z',
    })),
    documents: [],
    createdAt: '2026-08-21T00:00:00.000Z',
    updatedAt: '2026-08-21T00:00:00.000Z',
  }
}

function serverFlorenzReise(): Trip {
  return mehrzielreise({
    id: KONTO_TRIP_ID,
    travellers: 1,
    stages: [
      {
        id: 'stage-server-it',
        position: 1,
        name: 'Florenz',
        countryCode: 'IT',
        placeId: 'geonames:3176959',
        latitude: 43.7696,
        longitude: 11.2558,
        arrivalDate: '2026-09-12',
        departureDate: '2026-09-16',
      },
    ],
    party: [reisender({ clientRef: 'traveller:1', codes: ['CH'] })],
  })
}

function gastAnfrage(teil: Record<string, unknown> = {}) {
  return {
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    stages: [{ id: 'stage-1', name: 'Florenz', countryCode: 'IT' }],
    ...teil,
  }
}

function kontoAnfrage(teil: Record<string, unknown> = {}) {
  return {
    tripId: KONTO_TRIP_ID,
    startDate: '2026-01-01',
    endDate: '2026-01-02',
    stages: [{ id: 'stage-client-th', name: 'Bangkok', countryCode: 'TH' }],
    items: [
      {
        id: 'item-client',
        kind: 'activity' as const,
        title: 'Client-Punkt',
        stageId: 'stage-client-th',
      },
    ],
    ...teil,
  }
}

function reiseLesenMit(ergebnis: Lesung<Trip>): SafetyReiseLesen {
  return async () => ergebnis
}

function quelle(rel: string): string {
  return readFileSync(join(process.cwd(), rel), 'utf8')
}

describe('S4-R2 Safety server-owned Trip Truth', () => {
  test('Konto-UUID-Form bleibt identisch mit istKontoKennung', () => {
    assert.equal(safetyIstKontoTripId(KONTO_TRIP_ID), true)
    assert.equal(istKontoKennung(KONTO_TRIP_ID), true)
    assert.equal(safetyIstKontoTripId(GAST_TRIP_ID), false)
    assert.equal(istKontoKennung(GAST_TRIP_ID), false)
    assert.equal(safetyIstKontoTripId('not-a-trip'), false)
  })

  test('1 Konto-Reise nutzt servergeladene Route/Stages/Items', async () => {
    const geprueft = safetyAnfrageSchema.safeParse(kontoAnfrage())
    assert.equal(geprueft.success, true)
    if (!geprueft.success) throw new Error('Anfrage sollte gültig sein')

    const kontext = await safetyReiseAufloesen(
      geprueft.data,
      reiseLesenMit({ problem: null, zeilen: [serverFlorenzReise()] }),
    )
    assert.equal(kontext.ok, true)
    if (!kontext.ok) throw new Error('Konto-Kontext sollte gelingen')
    assert.equal(kontext.quelle, 'konto')
    assert.equal(kontext.reise.id, KONTO_TRIP_ID)
    assert.equal(kontext.reise.stages[0]?.name, 'Florenz')
    assert.equal(kontext.reise.stages[0]?.countryCode, 'IT')
    assert.equal(
      kontext.reise.stages.some((etappe) => etappe.countryCode === 'TH' || etappe.name === 'Bangkok'),
      false,
    )
    assert.equal(
      kontext.reise.days.flatMap((tag) => tag.items).some((punkt) => punkt.id === 'item-client'),
      false,
    )
  })

  test('2 servergeladene party erreicht die Safety-Auswertung', async () => {
    const geprueft = safetyAnfrageSchema.safeParse({ tripId: KONTO_TRIP_ID })
    assert.equal(geprueft.success, true)
    if (!geprueft.success) throw new Error('Anfrage sollte gültig sein')

    const serverReise = serverFlorenzReise()
    const auswertung = await safetyEvaluationsPruefen(geprueft.data, {
      reiseLesen: reiseLesenMit({ problem: null, zeilen: [serverReise] }),
      provider: testSafetyProvider([
        safetyFact({
          factKey: 'eq-firenze',
          category: 'earthquake',
          travellerDependent: true,
          travellerCitizenshipCodes: ['CH'],
        }),
      ]),
    })
    assert.equal(auswertung.ok, true)
    if (!auswertung.ok) throw new Error('Auswertung sollte gelingen')
    assert.equal(auswertung.quelle, 'konto')
    assert.equal(auswertung.reise.party?.[0]?.citizenships[0]?.countryCode, 'CH')
    assert.equal(auswertung.evaluations[0]?.relevance, 'affected')
    assert.equal(safetyContextFingerprint(auswertung.reise), safetyContextFingerprint(serverReise))
  })

  test('3 Client-Party/Citizenship kann Konto-Wahrheit nicht überschreiben', async () => {
    const roh = {
      ...kontoAnfrage(),
      party: [reisender({ clientRef: 'traveller:1', codes: ['RS'] })],
      citizenships: ['RS'],
      citizenshipCountryCodes: ['RS'],
    }
    const geprueft = safetyAnfrageSchema.safeParse(roh)
    assert.equal(geprueft.success, false)
    assert.deepEqual(safetyVerboteneClientWahrheit(roh).sort(), [
      'citizenshipCountryCodes',
      'citizenships',
      'party',
    ])

    const umgehung = await safetyReiseAufloesen(
      {
        tripId: KONTO_TRIP_ID,
        startDate: '2026-01-01',
        endDate: '2026-01-02',
        stages: [{ id: 'stage-client-th', name: 'Bangkok', countryCode: 'TH', placeId: null, latitude: null, longitude: null, arrivalDate: null, departureDate: null }],
        days: [],
        items: [],
      },
      reiseLesenMit({ problem: null, zeilen: [serverFlorenzReise()] }),
    )
    assert.equal(umgehung.ok, true)
    if (!umgehung.ok) throw new Error('Konto-Kontext sollte gelingen')
    assert.equal(umgehung.reise.party?.[0]?.citizenships[0]?.countryCode, 'CH')
    assert.equal(umgehung.reise.stages[0]?.countryCode, 'IT')
  })

  test('4 fremde/unbekannte Reise bleibt fail-closed ohne Existenz-Orakel', async () => {
    const geprueft = safetyAnfrageSchema.safeParse({ tripId: FREMD_TRIP_ID })
    assert.equal(geprueft.success, true)
    if (!geprueft.success) throw new Error('Anfrage sollte gültig sein')

    const leer = await safetyEvaluationsPruefen(geprueft.data, {
      reiseLesen: reiseLesenMit({ problem: null, zeilen: [] }),
    })
    assert.equal(leer.ok, false)
    if (leer.ok) throw new Error('Leere RLS-Menge muss fehlschlagen')
    assert.equal(leer.art, 'nicht-gefunden')
    assert.equal(leer.status, 404)
    assert.equal(leer.message, 'Diese Reise wurde nicht gefunden.')

    const unbekannt = await safetyEvaluationsPruefen(
      { tripId: KONTO_TRIP_ID, stages: [], days: [], items: [] },
      { reiseLesen: reiseLesenMit({ problem: null, zeilen: [] }) },
    )
    assert.equal(unbekannt.ok, false)
    if (unbekannt.ok) throw new Error('Unbekannte Reise muss fehlschlagen')
    assert.deepEqual(
      { art: unbekannt.art, status: unbekannt.status, message: unbekannt.message },
      { art: leer.art, status: leer.status, message: leer.message },
    )
  })

  test('5 Lese-/DB-Fehler ist von leer/unavailable unterscheidbar', async () => {
    const geprueft = safetyAnfrageSchema.safeParse({ tripId: KONTO_TRIP_ID })
    assert.equal(geprueft.success, true)
    if (!geprueft.success) throw new Error('Anfrage sollte gültig sein')

    const defekt = await safetyEvaluationsPruefen(geprueft.data, {
      reiseLesen: reiseLesenMit({
        zeilen: null,
        problem: { status: 500, message: 'relation trips does not exist' },
      }),
    })
    assert.equal(defekt.ok, false)
    if (defekt.ok) throw new Error('DB-Fehler muss fehlschlagen')
    assert.equal(defekt.art, 'lesen-fehlgeschlagen')
    assert.equal(defekt.status, 500)
    assert.match(defekt.message, /keine Entwarnung/)
    assert.equal(defekt.message.includes('relation trips'), false)

    const voruebergehend = await safetyEvaluationsPruefen(geprueft.data, {
      reiseLesen: reiseLesenMit({
        zeilen: null,
        problem: { status: 503, message: 'connection refused' },
      }),
    })
    assert.equal(voruebergehend.ok, false)
    if (voruebergehend.ok) throw new Error('503 muss fehlschlagen')
    assert.equal(voruebergehend.art, 'lesen-fehlgeschlagen')
    assert.equal(voruebergehend.status, 503)

    const leer = await safetyEvaluationsPruefen(geprueft.data, {
      reiseLesen: reiseLesenMit({ problem: null, zeilen: [] }),
    })
    assert.equal(leer.ok, false)
    if (leer.ok) throw new Error('Leere Menge muss fehlschlagen')
    assert.equal(leer.art, 'nicht-gefunden')
    assert.notEqual(leer.art, defekt.art)
    assert.notEqual(leer.status, defekt.status)
  })

  test('6 Gast kann aus Browser-Citizenship keine travellerabhängige Safety-Wahrheit erzeugen', async () => {
    const roh = gastAnfrage({
      party: [reisender({ clientRef: 'traveller:1', codes: ['CH'] })],
      citizenships: ['CH'],
    })
    const geprueft = safetyAnfrageSchema.safeParse(roh)
    assert.equal(geprueft.success, false)

    const gast = safetyAnfrageSchema.safeParse(gastAnfrage())
    assert.equal(gast.success, true)
    if (!gast.success) throw new Error('Gast-Route sollte gültig sein')
    assert.equal(gast.data.tripId, undefined)
    assert.deepEqual(tripAusSafetyAnfrage(gast.data).party, [])

    const auswertung = await safetyEvaluationsPruefen(gast.data, {
      provider: testSafetyProvider([
        safetyFact({
          factKey: 'eq-firenze',
          category: 'earthquake',
          travellerDependent: true,
          travellerCitizenshipCodes: ['CH'],
        }),
      ]),
    })
    assert.equal(auswertung.ok, true)
    if (!auswertung.ok) throw new Error('Gast-Auswertung sollte gelingen')
    assert.equal(auswertung.quelle, 'gast')
    assert.deepEqual(auswertung.reise.party, [])
    assert.equal(auswertung.evaluations[0]?.relevance, 'insufficient_context')
    assert.notEqual(auswertung.evaluations[0]?.relevance, 'affected')
  })

  test('7 kein Provider bleibt ehrlich unavailable/unknown, nie safe/grün', async () => {
    const gast = safetyAnfrageSchema.safeParse(gastAnfrage())
    assert.equal(gast.success, true)
    if (!gast.success) throw new Error('Gast-Route sollte gültig sein')

    const gastAuswertung = await safetyEvaluationsPruefen(gast.data)
    assert.equal(gastAuswertung.ok, true)
    if (!gastAuswertung.ok) throw new Error('Gast-Auswertung sollte gelingen')
    assert.equal(gastAuswertung.evaluations[0]?.freshness, 'provider_unavailable')
    assert.equal(gastAuswertung.evaluations[0]?.evidenceStatus, 'unavailable')
    assert.equal(gastAuswertung.evaluations[0]?.presentationClass, 'unknown')
    const gastAnsicht = safetyAnsicht(gastAuswertung.reise, gastAuswertung.evaluations)
    assert.equal(gastAnsicht.summary.checkState, 'unavailable')
    assert.equal(safetyApiStatus(gastAnsicht.summary), 'unavailable')
    assert.notEqual(gastAnsicht.summary.checkState, 'has_warnings')

    const konto = await safetyEvaluationsPruefen(
      { tripId: KONTO_TRIP_ID, stages: [], days: [], items: [] },
      { reiseLesen: reiseLesenMit({ problem: null, zeilen: [serverFlorenzReise()] }) },
    )
    assert.equal(konto.ok, true)
    if (!konto.ok) throw new Error('Konto-Auswertung sollte gelingen')
    assert.equal(konto.evaluations[0]?.freshness, 'provider_unavailable')
    const kontoAnsicht = safetyAnsicht(konto.reise, konto.evaluations)
    assert.equal(safetyApiStatus(kontoAnsicht.summary), 'unavailable')
  })

  test('8 kein Service-Role-Trip-Read und Route nutzt reiseLaden', () => {
    const safetyDateien = [
      'lib/safety/auswerten.ts',
      'lib/safety/schema.ts',
      'lib/safety/anfrage.ts',
      'lib/safety/engine.ts',
      'lib/safety/provider.ts',
      'app/api/safety/evaluate/route.ts',
    ]
    for (const datei of safetyDateien) {
      const text = quelle(datei)
      assert.equal(text.includes('service_role'), false, datei)
      assert.equal(text.includes('SERVICE_ROLE'), false, datei)
      assert.equal(text.includes('createAdminClient'), false, datei)
    }
    const route = quelle('app/api/safety/evaluate/route.ts')
    assert.match(route, /reiseLaden/)
    assert.match(route, /reiseLesen:\s*reiseLaden/)
    const auswerten = quelle('lib/safety/auswerten.ts')
    assert.equal(auswerten.includes("from '@/lib/trips/daten'"), false)
  })

  test('9 kein Provider wird aktiviert; Factory bleibt null', async () => {
    const provider = quelle('lib/safety/provider.ts')
    assert.match(provider, /return null/)
    assert.equal(provider.includes('JETNITY_SAFETY_AKTIV'), false)

    const auswertung = await safetyEvaluationsPruefen({
      stages: [],
      days: [],
      items: [],
    })
    assert.equal(auswertung.ok, true)
    if (!auswertung.ok) throw new Error('Leere Gast-Anfrage sollte gelingen')
    assert.equal(auswertung.evaluations[0]?.freshness, 'provider_unavailable')
    assert.equal(auswertung.evaluations[0]?.evidence.authority, null)
  })

  test('Konto-tripId ohne Loader fail-closed, Gast-Kennung lädt nicht', async () => {
    const ohneLoader = await safetyReiseAufloesen({
      tripId: KONTO_TRIP_ID,
      stages: [],
      days: [],
      items: [],
    })
    assert.equal(ohneLoader.ok, false)
    if (ohneLoader.ok) throw new Error('Konto ohne Loader muss fehlschlagen')
    assert.equal(ohneLoader.art, 'lesen-fehlgeschlagen')
    assert.equal(ohneLoader.status, 500)

    let aufrufe = 0
    const gast = await safetyReiseAufloesen(
      {
        tripId: GAST_TRIP_ID,
        startDate: '2026-09-12',
        endDate: '2026-09-16',
        stages: [
          {
            id: 'stage-1',
            name: 'Florenz',
            countryCode: 'IT',
            placeId: null,
            latitude: null,
            longitude: null,
            arrivalDate: null,
            departureDate: null,
          },
        ],
        days: [],
        items: [],
      },
      async () => {
        aufrufe += 1
        return { problem: null, zeilen: [serverFlorenzReise()] }
      },
    )
    assert.equal(aufrufe, 0)
    assert.equal(gast.ok, true)
    if (!gast.ok) throw new Error('Gast-Kennung muss Gastpfad bleiben')
    assert.equal(gast.quelle, 'gast')
    assert.deepEqual(gast.reise.party, [])
    assert.equal(gast.reise.id, 'trip-anfrage')
  })

  test('user_id und Official-Evidence bleiben ohne Wirkung', async () => {
    assert.equal(
      safetyAnfrageSchema.safeParse(kontoAnfrage({ user_id: 'attacker' })).success,
      false,
    )
    assert.equal(
      safetyAnfrageSchema.safeParse(gastAnfrage({ userId: 'attacker' })).success,
      false,
    )

    const geprueft = safetyAnfrageSchema.safeParse(
      gastAnfrage({
        officialResult: 'safe',
        llmResult: 'critical',
        safetyFacts: [{ category: 'earthquake' }],
        evaluations: [{ presentationClass: 'critical_warning' }],
      }),
    )
    assert.equal(geprueft.success, true)
    if (!geprueft.success) throw new Error('Evidence-Felder müssen geparst und verworfen werden')
    const auswertung = await safetyEvaluationsPruefen(geprueft.data)
    assert.equal(auswertung.ok, true)
    if (!auswertung.ok) throw new Error('Auswertung sollte gelingen')
    assert.equal(auswertung.evaluations.every((eintrag) => eintrag.presentationClass === 'unknown'), true)
    assert.equal(auswertung.evaluations.every((eintrag) => eintrag.evidence.authority === null), true)
  })
})
