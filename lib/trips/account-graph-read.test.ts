// lib/trips/account-graph-read.test.ts
//
// Führt die Produktionsorchestrierung mit injizierten Antworten aus.
// Keine nachgebaute Policy, kein Live-Supabase, keine Schreiboperation.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import type { Leseantwort } from '@/lib/api/datenbank-lesen'
import {
  ACCOUNT_GRAPH_UNVOLLSTAENDIG_MELDUNG,
  accountGraphLesen,
  accountGraphUnvollstaendigProblem,
} from '@/lib/trips/account-graph-read'
import { reiseAus, type ReiseZeile } from '@/lib/trips/abbildung'
import { foundationERelationFehlt } from '@/lib/trips/foundation-e-select'
import { tageEtappenZuordnen } from '@/lib/trips/zuordnung'
import { safetyAnfrageSchema } from '@/lib/safety/schema'
import { safetyEvaluationsPruefen, safetyReiseAufloesen } from '@/lib/safety/auswerten'
import { registryTripUebernahmeOrchestrieren } from '@/lib/traveller/account-registry-trip'
import { REGISTRY_TRIP_COPY } from '@/lib/traveller/account-registry-trip-copy'
import type { TravellerZeile } from '@/lib/readiness/reisende'
import type { Reisegraph } from '@/types/trips'

const JETZT = '2026-09-21T12:00:00.000Z'
const TRIP_ID = '11111111-1111-4111-8111-111111111111'
const FEHLENDE_RELATION = {
  code: 'PGRST200',
  message: "Could not find a relationship between 'trip_travellers' and 'trip_traveller_citizenships'",
}

type GraphZeile = ReiseZeile & {
  trip_stages: []
  trip_days: []
  trip_items: []
  trip_readiness_items: []
  trip_travellers: unknown
}

function reisezeile(abweichung: Partial<ReiseZeile> = {}): ReiseZeile {
  return {
    id: TRIP_ID,
    client_ref: 'trip-1',
    title: 'Tokio',
    origin: 'Zürich',
    start_date: '2026-10-01',
    end_date: '2026-10-08',
    travellers: 2,
    currency: 'CHF',
    budget_amount: '2400.00',
    status: 'draft',
    pace: 'balanced',
    interests: ['culture'],
    travel_wish: null,
    revision: 1,
    last_mutation_id: null,
    created_at: JETZT,
    updated_at: JETZT,
    ...abweichung,
  }
}

function citizenship(id: string, code: string) {
  return {
    id,
    client_ref: `citizenship:${code}`,
    country_code: code,
    created_at: JETZT,
    updated_at: JETZT,
  }
}

function document(
  id: string,
  type: 'passport' | 'national_id',
  issuing: string,
  citizenshipId: string | null = null,
) {
  return {
    id,
    client_ref: `document:${id}`,
    document_type: type,
    issuing_country_code: issuing,
    citizenship_id: citizenshipId,
    expires_on: '2031-01-01',
    created_at: JETZT,
    updated_at: JETZT,
  }
}

function reisender(abweichung: Partial<TravellerZeile> = {}): TravellerZeile {
  return {
    id: 'aaaaaaaa-0000-4000-8000-000000000001',
    client_ref: 'traveller:1',
    label: 'Sasa',
    residence_country_code: 'CH',
    nationality_country_code: 'CH',
    document_type: 'passport',
    document_issuing_country_code: 'CH',
    document_expires_on: '2030-01-01',
    created_at: JETZT,
    updated_at: JETZT,
    ...abweichung,
  }
}

function zeile(party: unknown): GraphZeile {
  return {
    ...reisezeile(),
    trip_stages: [],
    trip_days: [],
    trip_items: [],
    trip_readiness_items: [],
    trip_travellers: party,
  }
}

function antwort(teil: Partial<Leseantwort<GraphZeile>> = {}): Promise<Leseantwort<GraphZeile>> {
  return Promise.resolve({ data: [], error: null, ...teil })
}

function kanonischVollstaendig(): GraphZeile {
  const ch = citizenship('cit-ch', 'CH')
  const de = citizenship('cit-de', 'DE')
  return zeile([
    reisender({
      trip_traveller_citizenships: [ch, de],
      trip_traveller_documents: [
        document('doc-ch', 'passport', 'CH', ch.id),
        document('doc-de', 'national_id', 'DE', de.id),
      ],
    }),
  ])
}

function graphAus(zeile: GraphZeile): Reisegraph {
  const graph = reiseAus(
    zeile,
    zeile.trip_stages ?? [],
    zeile.trip_days ?? [],
    zeile.trip_items ?? [],
    zeile.trip_readiness_items ?? [],
    Array.isArray(zeile.trip_travellers) ? zeile.trip_travellers : [],
  )
  const zugeordnet = tageEtappenZuordnen(graph)
  return { ...zugeordnet, ohneTag: graph.ohneTag }
}

async function lesen(
  kanonisch: () => PromiseLike<Leseantwort<GraphZeile>>,
  fallback: () => PromiseLike<Leseantwort<GraphZeile>>,
  mapper: (zeile: GraphZeile) => Reisegraph = graphAus,
) {
  return accountGraphLesen({ kanonisch, fallback, mapper })
}

function problemIstUnvollstaendig(lesung: Awaited<ReturnType<typeof lesen>>) {
  assert.equal(lesung.zeilen, null)
  assert.deepEqual(lesung.problem, accountGraphUnvollstaendigProblem())
  assert.equal(lesung.problem?.status, 500)
  assert.equal(lesung.problem?.message, ACCOUNT_GRAPH_UNVOLLSTAENDIG_MELDUNG)
  assert.equal(lesung.problem?.message.includes('trip_traveller'), false)
  assert.equal(lesung.problem?.message.includes('PGRST'), false)
  assert.equal(lesung.problem?.message.includes('relation'), false)
}

describe('Account-Graph-Read – kanonisch vollständig', () => {
  test('mehrere Staatsbürgerschaften, Dokumente und Zuordnungen bleiben unverändert', async () => {
    let mapperAufrufe = 0
    const kanonisch = kanonischVollstaendig()
    const lesung = await lesen(
      () => antwort({ data: [kanonisch] }),
      () => {
        throw new Error('Fallback darf bei kanonischem Erfolg nicht laufen')
      },
      (zeile) => {
        mapperAufrufe += 1
        return graphAus(zeile)
      },
    )
    assert.equal(lesung.problem, null)
    assert.equal(lesung.zeilen?.length, 1)
    assert.equal(mapperAufrufe, 1)
    const party = lesung.zeilen?.[0]?.party ?? []
    assert.equal(party.length, 1)
    assert.deepEqual(
      party[0]?.citizenships.map((eintrag) => eintrag.countryCode),
      ['CH', 'DE'],
    )
    const passport = party[0]?.documents.find((eintrag) => eintrag.documentType === 'passport')
    const nationalId = party[0]?.documents.find((eintrag) => eintrag.documentType === 'national_id')
    assert.equal(party[0]?.documents.length, 2)
    assert.equal(passport?.issuingCountryCode, 'CH')
    assert.equal(passport?.citizenshipClientRef, 'citizenship:CH')
    assert.equal(nationalId?.issuingCountryCode, 'DE')
    assert.equal(nationalId?.citizenshipClientRef, 'citizenship:DE')
  })

  test('kanonisch leere Party und autoritative leere Children bleiben leer', async () => {
    const leerParty = await lesen(
      () => antwort({ data: [zeile([])] }),
      () => {
        throw new Error('Fallback darf nicht laufen')
      },
    )
    assert.equal(leerParty.problem, null)
    assert.deepEqual(leerParty.zeilen?.[0]?.party, [])

    const leerChildren = zeile([
      reisender({
        nationality_country_code: 'CH',
        document_type: 'passport',
        document_issuing_country_code: 'CH',
        trip_traveller_citizenships: [],
        trip_traveller_documents: [],
      }),
    ])
    const lesung = await lesen(
      () => antwort({ data: [leerChildren] }),
      () => {
        throw new Error('Fallback darf nicht laufen')
      },
    )
    assert.equal(lesung.problem, null)
    assert.equal(lesung.zeilen?.[0]?.party?.[0]?.citizenships.length, 0)
    assert.equal(lesung.zeilen?.[0]?.party?.[0]?.documents.length, 0)
  })
})

describe('Account-Graph-Read – Legacy-Fallback', () => {
  test('fehlende Child-Relation bleibt erkannt und löst genau einen Fallback aus', () => {
    assert.equal(foundationERelationFehlt(FEHLENDE_RELATION), true)
  })

  test('nichtleeres Legacy-Ergebnis wird Problem, Mapper läuft nicht', async () => {
    let fallbackAufrufe = 0
    let mapperAufrufe = 0
    const legacy = zeile([
      reisender({
        nationality_country_code: 'CH',
        document_type: 'passport',
        document_issuing_country_code: 'CH',
      }),
    ])
    const lesung = await lesen(
      () => antwort({ data: null, error: FEHLENDE_RELATION }),
      () => {
        fallbackAufrufe += 1
        return antwort({ data: [legacy] })
      },
      () => {
        mapperAufrufe += 1
        throw new Error('Mapper darf Legacy-Zeilen nicht sehen')
      },
    )
    assert.equal(fallbackAufrufe, 1)
    assert.equal(mapperAufrufe, 0)
    problemIstUnvollstaendig(lesung)
  })

  test('leerer Fallback bleibt fehlend oder nicht im Eigentum', async () => {
    let mapperAufrufe = 0
    const lesung = await lesen(
      () => antwort({ data: null, error: FEHLENDE_RELATION }),
      () => antwort({ data: [] }),
      () => {
        mapperAufrufe += 1
        throw new Error('Mapper darf leeren Fallback nicht füllen')
      },
    )
    assert.equal(mapperAufrufe, 0)
    assert.equal(lesung.problem, null)
    assert.deepEqual(lesung.zeilen, [])
  })

  test('fehlgeschlagener Fallback bleibt Fehler, kein leerer Erfolg', async () => {
    const lesung = await lesen(
      () => antwort({ data: null, error: FEHLENDE_RELATION }),
      () =>
        antwort({
          data: null,
          error: { code: '42501', message: 'permission denied for table trips' },
        }),
    )
    assert.equal(lesung.zeilen, null)
    assert.equal(lesung.problem?.status, 500)
    assert.match(lesung.problem?.message ?? '', /permission denied/)
    assert.notEqual(lesung.problem?.message, ACCOUNT_GRAPH_UNVOLLSTAENDIG_MELDUNG)
  })
})

describe('Account-Graph-Read – unvollständige kanonische Zeile', () => {
  test('fehlende, nullte oder nicht-array Children scheitern vor dem Mapper', async () => {
    const faelle: unknown[] = [
      undefined,
      null,
      {},
      [reisender({ trip_traveller_citizenships: undefined, trip_traveller_documents: [] })],
      [reisender({ trip_traveller_citizenships: [], trip_traveller_documents: null })],
    ]
    for (const party of faelle) {
      let mapperAufrufe = 0
      const lesung = await lesen(
        () => antwort({ data: [zeile(party)] }),
        () => {
          throw new Error('Fallback darf bei kanonischem Erfolg nicht laufen')
        },
        () => {
          mapperAufrufe += 1
          throw new Error('Mapper darf unvollständige Zeilen nicht sehen')
        },
      )
      assert.equal(mapperAufrufe, 0, `Mapper lief für ${String(party)}`)
      problemIstUnvollstaendig(lesung)
    }
  })

  test('gemischte vollständige und unvollständige Reisende scheitern ohne Filter', async () => {
    let mapperAufrufe = 0
    const gemischt = zeile([
      reisender({
        trip_traveller_citizenships: [citizenship('cit-ch', 'CH')],
        trip_traveller_documents: [document('doc-ch', 'passport', 'CH', 'cit-ch')],
      }),
      reisender({
        id: 'aaaaaaaa-0000-4000-8000-000000000002',
        client_ref: 'traveller:2',
        label: 'Alex',
        trip_traveller_citizenships: [citizenship('cit-fr', 'FR')],
      }),
    ])
    const lesung = await lesen(
      () => antwort({ data: [gemischt] }),
      () => {
        throw new Error('Fallback darf nicht laufen')
      },
      () => {
        mapperAufrufe += 1
        throw new Error('Unvollständige Party darf nicht gefiltert werden')
      },
    )
    assert.equal(mapperAufrufe, 0)
    problemIstUnvollstaendig(lesung)
  })
})

describe('Account-Graph-Read – andere Fehler bleiben Fehler', () => {
  test('unverwandter kanonischer Fehler löst keinen Fallback aus', async () => {
    let fallbackAufrufe = 0
    const lesung = await lesen(
      () =>
        antwort({
          data: null,
          error: { code: '42501', message: 'permission denied for table trips' },
        }),
      () => {
        fallbackAufrufe += 1
        return antwort({ data: [kanonischVollstaendig()] })
      },
    )
    assert.equal(fallbackAufrufe, 0)
    assert.equal(lesung.zeilen, null)
    assert.equal(lesung.problem?.status, 500)
    assert.match(lesung.problem?.message ?? '', /permission denied/)
  })

  test('null-data ohne Fehler bleibt 500, kein leerer Erfolg', async () => {
    const lesung = await lesen(
      () => antwort({ data: null, error: null }),
      () => {
        throw new Error('Fallback darf nicht laufen')
      },
    )
    assert.equal(lesung.zeilen, null)
    assert.equal(lesung.problem?.status, 500)
    assert.match(lesung.problem?.message ?? '', /weder Daten noch einen Fehler/)
  })

  test('geworfener kanonischer Reader bleibt 500', async () => {
    const lesung = await lesen(
      () => {
        throw new Error('Reader-Aufbau fehlgeschlagen')
      },
      () => {
        throw new Error('Fallback darf nicht laufen')
      },
    )
    assert.equal(lesung.zeilen, null)
    assert.deepEqual(lesung.problem, { status: 500, message: 'Reader-Aufbau fehlgeschlagen' })
  })

  test('geworfener Fallback-Reader bleibt 500', async () => {
    const lesung = await lesen(
      () => antwort({ data: null, error: FEHLENDE_RELATION }),
      () => {
        throw new Error('Fallback-Reader fehlgeschlagen')
      },
    )
    assert.equal(lesung.zeilen, null)
    assert.deepEqual(lesung.problem, { status: 500, message: 'Fallback-Reader fehlgeschlagen' })
  })
})

describe('Account-Graph-Read – ausgeführte injizierbare Verbraucher', () => {
  test('Safety-Aufrufer nutzen den Graph nicht bei Problem', async () => {
    const lesung = await lesen(
      () => antwort({ data: null, error: FEHLENDE_RELATION }),
      () => antwort({ data: [zeile([reisender()])] }),
      () => {
        throw new Error('Mapper darf nicht laufen')
      },
    )
    const geprueft = safetyAnfrageSchema.safeParse({ tripId: TRIP_ID })
    assert.equal(geprueft.success, true)
    if (!geprueft.success) throw new Error('Anfrage sollte gültig sein')

    const kontext = await safetyReiseAufloesen(geprueft.data, async () => lesung)
    assert.equal(kontext.ok, false)
    if (kontext.ok) throw new Error('Safety darf unvollständige Lesung nicht als Reise nehmen')
    assert.equal(kontext.art, 'lesen-fehlgeschlagen')
    assert.equal(kontext.status, 500)
    assert.equal(kontext.message.includes('keine Entwarnung'), true)
    assert.equal(kontext.message.includes('CH'), false)

    const auswertung = await safetyEvaluationsPruefen(geprueft.data, {
      reiseLesen: async () => lesung,
      provider: null,
    })
    assert.equal(auswertung.ok, false)
    if (auswertung.ok) throw new Error('Safety-Auswertung darf nicht mutieren oder auswerten')
    assert.equal(auswertung.art, 'lesen-fehlgeschlagen')
    assert.equal('reise' in auswertung, false)
  })

  test('Registry-Übernahme-Orchestrierung schreibt bei Problem nicht', async () => {
    const lesung = await lesen(
      () => antwort({ data: [zeile([reisender()])] }),
      () => {
        throw new Error('Fallback darf nicht laufen')
      },
      () => {
        throw new Error('Mapper darf nicht laufen')
      },
    )
    assert.equal(lesung.problem?.status, 500)

    const aufrufe = { registryLesen: 0, partySchreiben: 0 }
    const ergebnis = await registryTripUebernahmeOrchestrieren({
      eingabe: {
        tripId: TRIP_ID,
        registryTravellerId: '2f1c6d8a-4b21-4a7e-9c11-0d3e8a7b6c55',
      },
      benutzerId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      reiseLesen: async () => {
        // Dieselbe Abbildung wie registryTravellerInReiseUebernehmen.
        if (lesung.problem) return { problem: lesung.problem, reise: null }
        const reise = lesung.zeilen[0] ?? null
        return { problem: null, reise: reise ? { party: reise.party } : null }
      },
      registryLesen: async () => {
        aufrufe.registryLesen += 1
        return { problem: null, zeilen: [] }
      },
      partySchreiben: async () => {
        aufrufe.partySchreiben += 1
        return { ok: true }
      },
      jetzt: JETZT,
    })
    assert.equal(ergebnis.ok, false)
    assert.equal(ergebnis.meldung, REGISTRY_TRIP_COPY.reiseLesefehler500)
    assert.equal(aufrufe.registryLesen, 0)
    assert.equal(aufrufe.partySchreiben, 0)
    assert.equal(ergebnis.partySchreiben, 0)
  })
})
