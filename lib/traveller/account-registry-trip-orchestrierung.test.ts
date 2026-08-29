// lib/traveller/account-registry-trip-orchestrierung.test.ts
//
// AP-7-S4 Review-Fix: Write-/Auth-Orchestrierung fail-closed, kein stilles Ersetzen.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { PARTY_GRENZEN } from '@/lib/readiness/party'
import {
  ACCOUNT_REGISTRY_AUTHORITY,
  accountRegistryTravellerLesen,
  type AccountRegistryTraveller,
} from '@/lib/traveller/account-registry'
import {
  registryTripUebernahmeOrchestrieren,
  type RegistryTripOrchestrierungKontext,
  type RegistryTripPartyPayload,
  type RegistryTripRegistryLesung,
  type RegistryTripReiseLesung,
} from '@/lib/traveller/account-registry-trip'
import { REGISTRY_TRIP_COPY } from '@/lib/traveller/account-registry-trip-copy'
import type { TripTraveller } from '@/types/trips'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

const JETZT = '2026-08-30T11:00:00.000Z'
const TRIP_ID = '11111111-2222-4333-8444-555555555501'
const PERSON_ID = '2f1c6d8a-4b21-4a7e-9c11-0d3e8a7b6c55'
const PERSON_REF = '3a2d7e9b-5c32-4b8f-ad22-1e4f9b8c7d66'
const CH_ID = '7a9e2c14-8d33-41b0-a6f2-1c5d9e0b4a10'
const CH_REF = '8b0f3d25-9e44-42c1-b703-2d6e0f1c5b21'
const FREMD_ID = '9f0c1d2e-3a44-4b55-8c66-7d8e9f0a1b22'
const BENUTZER = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'

const BESTEHEND: TripTraveller = {
  id: 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff',
  clientRef: 'traveller:1',
  label: 'Bereits in der Reise',
  residenceCountryCode: 'CH',
  citizenships: [],
  documents: [],
  createdAt: JETZT,
  updatedAt: JETZT,
}

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

function zufallAb(start: number): () => string {
  let n = start
  return () => {
    n += 1
    return `aaaaaaaa-bbbb-4ccc-8d00-${n.toString(16).padStart(12, '0')}`
  }
}

function registry(): AccountRegistryTraveller {
  const gelesen = accountRegistryTravellerLesen({
    authority: ACCOUNT_REGISTRY_AUTHORITY,
    id: PERSON_ID,
    clientRef: PERSON_REF,
    createdAt: JETZT,
    updatedAt: JETZT,
    facts: {
      label: 'Sasa',
      residenceCountryCode: 'CH',
      citizenships: [
        {
          id: CH_ID,
          clientRef: CH_REF,
          countryCode: 'CH',
          createdAt: JETZT,
          updatedAt: JETZT,
        },
      ],
      documents: [],
    },
  })
  assert.ok(gelesen)
  return gelesen
}

function eingabe(teil: Record<string, unknown> = {}) {
  return { tripId: TRIP_ID, registryTravellerId: PERSON_ID, ...teil }
}

function kontext(teil: {
  benutzerId?: string | null
  reise?: RegistryTripReiseLesung
  registry?: RegistryTripRegistryLesung
  write?: { ok: true } | { ok: false; meldung: string }
  party?: TripTraveller[]
}): {
  aufrufe: {
    reiseLesen: string[]
    registryLesen: string[]
    partySchreiben: Array<{ tripId: string; party: readonly RegistryTripPartyPayload[] }>
  }
  orchestrierung: RegistryTripOrchestrierungKontext
} {
  const aufrufe = {
    reiseLesen: [] as string[],
    registryLesen: [] as string[],
    partySchreiben: [] as Array<{ tripId: string; party: readonly RegistryTripPartyPayload[] }>,
  }

  return {
    aufrufe,
    orchestrierung: {
      eingabe: eingabe(),
      benutzerId: teil.benutzerId === undefined ? BENUTZER : teil.benutzerId,
      reiseLesen: async (tripId) => {
        aufrufe.reiseLesen.push(tripId)
        return (
          teil.reise ?? {
            problem: null,
            reise: { party: teil.party ?? [BESTEHEND] },
          }
        )
      },
      registryLesen: async (id) => {
        aufrufe.registryLesen.push(id)
        return teil.registry ?? { problem: null, zeilen: [registry()] }
      },
      partySchreiben: async (tripId, party) => {
        aufrufe.partySchreiben.push({ tripId, party })
        return teil.write ?? { ok: true }
      },
      jetzt: JETZT,
      zufall: zufallAb(700),
    },
  }
}

describe('AP-7-S4 Write-/Auth-Orchestrierung', () => {
  test('Action-Pfad verdrahtet Auth, Trip-Read, Registry-Read und party_schreiben über die Naht', () => {
    const aktion = quelle('lib/readiness/reisende-aktionen.ts')
    assert.match(aktion, /const \{ supabase, benutzerId \} = await konto\(\)/)
    assert.match(aktion, /registryTripUebernahmeOrchestrieren/)
    assert.match(aktion, /benutzerId,/)
    assert.match(aktion, /reiseLaden/)
    assert.match(aktion, /registryMitClientLaden/)
    assert.match(aktion, /partySchreiben\(supabase, tripId/)
    assert.equal(aktion.includes('createServiceRole'), false)
  })

  test('ohne Anmeldung: fail closed, kein Trip-Read, kein Registry-Read, kein Write', async () => {
    const lauf = kontext({ benutzerId: null })
    const ergebnis = await registryTripUebernahmeOrchestrieren(lauf.orchestrierung)
    assert.equal(ergebnis.ok, false)
    assert.equal(ergebnis.meldung, REGISTRY_TRIP_COPY.nichtAngemeldet)
    assert.deepEqual(lauf.aufrufe.reiseLesen, [])
    assert.deepEqual(lauf.aufrufe.registryLesen, [])
    assert.deepEqual(lauf.aufrufe.partySchreiben, [])
    assert.equal(ergebnis.partySchreiben, 0)
    assert.equal(ergebnis.geschriebenesParty, null)
  })

  test('Trip fehlt: fail closed, kein Registry-Read, kein Write', async () => {
    const lauf = kontext({ reise: { problem: null, reise: null } })
    const ergebnis = await registryTripUebernahmeOrchestrieren(lauf.orchestrierung)
    assert.equal(ergebnis.ok, false)
    assert.equal(ergebnis.meldung, REGISTRY_TRIP_COPY.reiseFehlt)
    assert.deepEqual(lauf.aufrufe.reiseLesen, [TRIP_ID])
    assert.deepEqual(lauf.aufrufe.registryLesen, [])
    assert.deepEqual(lauf.aufrufe.partySchreiben, [])
  })

  test('Trip unauthorized (RLS-leere Menge): fail closed, kein Registry-/Party-Write', async () => {
    const lauf = kontext({ reise: { problem: null, reise: null } })
    const ergebnis = await registryTripUebernahmeOrchestrieren(lauf.orchestrierung)
    assert.equal(ergebnis.ok, false)
    assert.equal(ergebnis.meldung, REGISTRY_TRIP_COPY.reiseFehlt)
    assert.equal(lauf.aufrufe.registryLesen.length, 0)
    assert.equal(lauf.aufrufe.partySchreiben.length, 0)
  })

  test('Registry fehlt: fail closed, kein Write', async () => {
    const lauf = kontext({ registry: { problem: null, zeilen: [] } })
    const ergebnis = await registryTripUebernahmeOrchestrieren(lauf.orchestrierung)
    assert.equal(ergebnis.ok, false)
    assert.equal(ergebnis.meldung, REGISTRY_TRIP_COPY.nichtGefunden)
    assert.deepEqual(lauf.aufrufe.registryLesen, [PERSON_ID])
    assert.equal(lauf.aufrufe.partySchreiben.length, 0)
    assert.equal(ergebnis.geschriebenesParty, null)
  })

  test('Registry unauthorized (fremde/leere RLS-Menge): fail closed, kein Write', async () => {
    const lauf = kontext({
      registry: {
        problem: null,
        zeilen: [],
      },
    })
    const ergebnis = await registryTripUebernahmeOrchestrieren(lauf.orchestrierung)
    assert.equal(ergebnis.ok, false)
    assert.equal(ergebnis.meldung, REGISTRY_TRIP_COPY.nichtGefunden)
    assert.equal(lauf.aufrufe.partySchreiben.length, 0)
  })

  test('Registry invalid (Abbildungsfehler): fail closed, kein Write', async () => {
    const lauf = kontext({
      registry: { problem: { status: 500 }, zeilen: null },
    })
    const ergebnis = await registryTripUebernahmeOrchestrieren(lauf.orchestrierung)
    assert.equal(ergebnis.ok, false)
    assert.equal(ergebnis.meldung, REGISTRY_TRIP_COPY.lesefehler500)
    assert.equal(lauf.aufrufe.partySchreiben.length, 0)
  })

  test('Registry-ID zeigt auf keinen Owner-Eintrag: fail closed, kein Write', async () => {
    const lauf = kontext({
      registry: { problem: null, zeilen: [registry()] },
    })
    const ergebnis = await registryTripUebernahmeOrchestrieren({
      ...lauf.orchestrierung,
      eingabe: { tripId: TRIP_ID, registryTravellerId: FREMD_ID },
    })
    assert.equal(ergebnis.ok, false)
    assert.equal(ergebnis.meldung, REGISTRY_TRIP_COPY.nichtGefunden)
    assert.deepEqual(lauf.aufrufe.registryLesen, [FREMD_ID])
    assert.equal(lauf.aufrufe.partySchreiben.length, 0)
  })

  test('Trip-Slot-Limit ruft party_schreiben nicht auf und liest keine Registry', async () => {
    const voll = Array.from({ length: PARTY_GRENZEN.slots }, (_, index) => ({
      ...BESTEHEND,
      id: `cccccccc-dddd-4eee-8fff-${String(index + 1).padStart(12, '0')}`,
      clientRef: `traveller:${index + 1}`,
    }))
    const lauf = kontext({ party: voll })
    const ergebnis = await registryTripUebernahmeOrchestrieren(lauf.orchestrierung)
    assert.equal(ergebnis.ok, false)
    assert.equal(ergebnis.meldung, REGISTRY_TRIP_COPY.limit)
    assert.deepEqual(lauf.aufrufe.reiseLesen, [TRIP_ID])
    assert.deepEqual(lauf.aufrufe.registryLesen, [])
    assert.deepEqual(lauf.aufrufe.partySchreiben, [])
  })

  test('party_schreiben-Fehler ist ehrlich und kein Success', async () => {
    const lauf = kontext({
      write: { ok: false, meldung: 'Die Reise konnte nicht gespeichert werden. Bitte prüfe deine Angaben.' },
    })
    const ergebnis = await registryTripUebernahmeOrchestrieren(lauf.orchestrierung)
    assert.equal(ergebnis.ok, false)
    assert.equal(ergebnis.meldung, 'Die Reise konnte nicht gespeichert werden. Bitte prüfe deine Angaben.')
    assert.notEqual(ergebnis.meldung, REGISTRY_TRIP_COPY.erfolg)
    assert.equal(lauf.aufrufe.partySchreiben.length, 1)
    assert.equal(ergebnis.geschriebenesParty?.length, 1)
  })

  test('Übernahme schreibt nur den neuen Snapshot und ersetzt bestehende Reisende nicht', async () => {
    const lauf = kontext({ party: [BESTEHEND] })
    const ergebnis = await registryTripUebernahmeOrchestrieren(lauf.orchestrierung)
    assert.equal(ergebnis.ok, true)
    assert.equal(ergebnis.partySchreiben, 1)
    assert.equal(lauf.aufrufe.partySchreiben.length, 1)
    const party = lauf.aufrufe.partySchreiben[0]?.party
    assert.ok(party)
    assert.equal(party.length, 1)
    assert.equal(party.some((item) => item.clientRef === BESTEHEND.clientRef), false)
    assert.equal(party.some((item) => item.clientRef === PERSON_REF), false)
    assert.equal(party[0]?.label, 'Sasa')
    assert.equal(ergebnis.geschriebenesParty?.length, 1)
    assert.notEqual(ergebnis.geschriebenesParty?.[0]?.clientRef, BESTEHEND.clientRef)
  })
})
