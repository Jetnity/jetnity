// lib/traveller/account-registry-trip.test.ts
//
// AP-7-S4: S1-Projektion im Runtime-Pfad, frische Identitäten, fail-closed.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { travellerAlsPayload } from '@/lib/readiness/reisende'
import {
  ACCOUNT_REGISTRY_AUTHORITY,
  accountRegistryTravellerLesen,
  type AccountRegistryTraveller,
} from '@/lib/traveller/account-registry'
import {
  registryTravellerAlsFrischenTripSnapshot,
  registryTripAnzeigeAus,
  registryTripAnzeigenAus,
  registryTripAnzeigeName,
  registryTripEintragSuchen,
  registryTripLimitErreicht,
  registryTripUebernahmeEingabeLesen,
  tripSnapshotMaterialisierungErzeugen,
} from '@/lib/traveller/account-registry-trip'
import { REGISTRY_TRIP_COPY } from '@/lib/traveller/account-registry-trip-copy'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

const JETZT = '2026-08-30T10:00:00.000Z'
const SNAPSHOT_ZEIT = '2026-08-30T11:00:00.000Z'

const PERSON_ID = '2f1c6d8a-4b21-4a7e-9c11-0d3e8a7b6c55'
const PERSON_REF = '3a2d7e9b-5c32-4b8f-ad22-1e4f9b8c7d66'
const CH_ID = '7a9e2c14-8d33-41b0-a6f2-1c5d9e0b4a10'
const CH_REF = '8b0f3d25-9e44-42c1-b703-2d6e0f1c5b21'
const RS_ID = 'b3d10e52-6c44-4f91-8a07-2e6f1d9c8b20'
const RS_REF = 'c4e21f63-7d55-4092-9b18-3f7a2e0d9c31'
const PASS_CH_ID = 'd5f32074-8e66-41a3-ac29-4a8b3f1e0d42'
const PASS_CH_REF = 'e6a43185-9f77-42b4-bd3a-5b9c4a2f1e53'
const PASS_RS_ID = 'f7b54296-0a88-43c5-8e4b-6c0d5b3a2f64'
const PASS_RS_REF = '08c653a7-1b99-44d6-8f5c-7d1e6c4b3a75'
const ID_REF = '19d764b8-2caa-45e7-906d-8e2f7d5c4b86'
const ID_REF_CLIENT = '2ae875c9-3dbb-46f8-a17e-9f3a8e6d5c97'

const REGISTRY_IDENTITAETEN = [
  PERSON_ID,
  PERSON_REF,
  CH_ID,
  CH_REF,
  RS_ID,
  RS_REF,
  PASS_CH_ID,
  PASS_CH_REF,
  PASS_RS_ID,
  PASS_RS_REF,
  ID_REF,
  ID_REF_CLIENT,
]

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

function registryRoh(teil: Record<string, unknown> = {}): Record<string, unknown> {
  const { facts, ...oben } = teil
  return {
    authority: ACCOUNT_REGISTRY_AUTHORITY,
    id: PERSON_ID,
    clientRef: PERSON_REF,
    createdAt: JETZT,
    updatedAt: JETZT,
    ...oben,
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
        {
          id: RS_ID,
          clientRef: RS_REF,
          countryCode: 'RS',
          createdAt: JETZT,
          updatedAt: JETZT,
        },
      ],
      documents: [
        {
          id: PASS_CH_ID,
          clientRef: PASS_CH_REF,
          documentType: 'passport',
          issuingCountryCode: 'CH',
          citizenshipClientRef: CH_REF,
          expiresOn: '2030-01-01',
          createdAt: JETZT,
          updatedAt: JETZT,
        },
        {
          id: PASS_RS_ID,
          clientRef: PASS_RS_REF,
          documentType: 'passport',
          issuingCountryCode: 'RS',
          citizenshipClientRef: RS_REF,
          expiresOn: '2029-06-01',
          createdAt: JETZT,
          updatedAt: JETZT,
        },
        {
          id: ID_REF,
          clientRef: ID_REF_CLIENT,
          documentType: 'national_id',
          issuingCountryCode: 'DE',
          citizenshipClientRef: null,
          expiresOn: null,
          createdAt: JETZT,
          updatedAt: JETZT,
        },
      ],
      ...(facts && typeof facts === 'object' && !Array.isArray(facts) ? facts : {}),
    },
  }
}

function registry(): AccountRegistryTraveller {
  const gelesen = accountRegistryTravellerLesen(registryRoh())
  assert.ok(gelesen)
  return gelesen
}

function snapshotIdentitaeten(snapshot: {
  id: string
  clientRef: string
  citizenships: readonly { id: string; clientRef: string }[]
  documents: readonly { id: string; clientRef: string }[]
}): string[] {
  return [
    snapshot.id,
    snapshot.clientRef,
    ...snapshot.citizenships.flatMap((eintrag) => [eintrag.id, eintrag.clientRef]),
    ...snapshot.documents.flatMap((eintrag) => [eintrag.id, eintrag.clientRef]),
  ]
}

describe('AP-7-S4 Registry→Trip Materialisierung', () => {
  test('Runtime-Pfad verwendet die S1-Projektion und keine First-Item-Semantik', () => {
    const runtime = [
      'lib/traveller/account-registry-trip.ts',
      'lib/readiness/reisende-aktionen.ts',
      'lib/traveller/account-registry-daten.ts',
    ]
      .map((pfad) => quelle(pfad))
      .join('\n')

    assert.match(runtime, /accountRegistryTravellerProjektieren/)
    assert.match(runtime, /registryTravellerAlsFrischenTripSnapshot/)
    assert.match(runtime, /registryTripUebernahmeOrchestrieren/)
    assert.equal(runtime.includes('citizenships[0]'), false)
    assert.equal(runtime.includes('documents[0]'), false)
    assert.equal(runtime.includes('defaultPassport'), false)
    assert.equal(runtime.includes('defaultCitizenship'), false)
    assert.equal(runtime.includes('preferredDocument'), false)
    assert.equal(runtime.includes('chosenCredential'), false)
    assert.equal(runtime.includes('selectedCredential'), false)
    assert.equal(runtime.includes('primaryCitizenship'), false)
    assert.equal(runtime.includes('createServiceRole'), false)
    assert.equal(runtime.includes('SERVICE_ROLE'), false)
  })

  test('Eingabe ist nur tripId + registryTravellerId und fail-closed', () => {
    const tripId = '11111111-2222-4333-8444-555555555501'
    const registryTravellerId = PERSON_ID
    assert.deepEqual(registryTripUebernahmeEingabeLesen({ tripId, registryTravellerId }), {
      tripId,
      registryTravellerId,
    })
    assert.equal(registryTripUebernahmeEingabeLesen({ tripId, registryTravellerId, extra: true }), null)
    assert.equal(registryTripUebernahmeEingabeLesen({ tripId, registryTravellerId: 'traveller:1' }), null)
    assert.equal(registryTripUebernahmeEingabeLesen({ tripId: 'traveller:1', registryTravellerId }), null)
    assert.equal(registryTripUebernahmeEingabeLesen({ tripId }), null)
    assert.equal(registryTripUebernahmeEingabeLesen(null), null)
  })

  test('projiziert über S1 mit frischen, disjunkten Identitäten', () => {
    const quelleRegistry = registry()
    const snapshot = registryTravellerAlsFrischenTripSnapshot(quelleRegistry, {
      jetzt: SNAPSHOT_ZEIT,
      zufall: zufallAb(100),
    })
    assert.ok(snapshot)
    const identitaeten = snapshotIdentitaeten(snapshot)
    assert.equal(new Set(identitaeten).size, identitaeten.length)
    for (const wert of identitaeten) {
      assert.equal(REGISTRY_IDENTITAETEN.includes(wert), false, wert)
    }
    assert.equal(snapshot.createdAt, SNAPSHOT_ZEIT)
    assert.equal(snapshot.updatedAt, SNAPSHOT_ZEIT)
    assert.equal(snapshot.label, 'Sasa')
    assert.equal(snapshot.residenceCountryCode, 'CH')
  })

  test('erhält Multi-Citizenship, Multi-Document, Issuer≠Citizenship und nullable Relation', () => {
    const snapshot = registryTravellerAlsFrischenTripSnapshot(registry(), {
      jetzt: SNAPSHOT_ZEIT,
      zufall: zufallAb(200),
    })
    assert.ok(snapshot)
    assert.equal(snapshot.citizenships.length, 2)
    assert.deepEqual(
      snapshot.citizenships.map((eintrag) => eintrag.countryCode).sort(),
      ['CH', 'RS'],
    )
    assert.equal(snapshot.documents.length, 3)

    const ch = snapshot.citizenships.find((eintrag) => eintrag.countryCode === 'CH')
    const rs = snapshot.citizenships.find((eintrag) => eintrag.countryCode === 'RS')
    assert.ok(ch)
    assert.ok(rs)

    const passCh = snapshot.documents.find(
      (eintrag) => eintrag.documentType === 'passport' && eintrag.issuingCountryCode === 'CH',
    )
    const passRs = snapshot.documents.find(
      (eintrag) => eintrag.documentType === 'passport' && eintrag.issuingCountryCode === 'RS',
    )
    const nationalId = snapshot.documents.find((eintrag) => eintrag.documentType === 'national_id')
    assert.ok(passCh)
    assert.ok(passRs)
    assert.ok(nationalId)
    assert.equal(passCh.citizenshipClientRef, ch.clientRef)
    assert.equal(passRs.citizenshipClientRef, rs.clientRef)
    assert.equal(nationalId.citizenshipClientRef, null)
    assert.equal(passCh.issuingCountryCode, 'CH')
    assert.notEqual(nationalId.issuingCountryCode, 'CH')
    assert.equal(nationalId.issuingCountryCode, 'DE')
    assert.equal(passCh.expiresOn, '2030-01-01')
    assert.equal(nationalId.expiresOn, null)
  })

  test('erneute Materialisierung erzeugt einen neuen unabhängigen Snapshot', () => {
    const quelleRegistry = registry()
    const erstes = registryTravellerAlsFrischenTripSnapshot(quelleRegistry, {
      jetzt: SNAPSHOT_ZEIT,
      zufall: zufallAb(300),
    })
    const zweites = registryTravellerAlsFrischenTripSnapshot(quelleRegistry, {
      jetzt: '2026-08-30T12:00:00.000Z',
      zufall: zufallAb(400),
    })
    assert.ok(erstes)
    assert.ok(zweites)
    const ersteIds = new Set(snapshotIdentitaeten(erstes))
    for (const wert of snapshotIdentitaeten(zweites)) {
      assert.equal(ersteIds.has(wert), false, wert)
    }
    assert.equal(erstes.clientRef === PERSON_REF, false)
    assert.equal(zweites.clientRef === PERSON_REF, false)
  })

  test('Write-Payload enthält keine Registry-Identitäten und kein sensibles Feld', () => {
    const snapshot = registryTravellerAlsFrischenTripSnapshot(registry(), {
      jetzt: SNAPSHOT_ZEIT,
      zufall: zufallAb(500),
    })
    assert.ok(snapshot)
    const payload = travellerAlsPayload(snapshot)
    const roh = JSON.stringify(payload)
    for (const wert of REGISTRY_IDENTITAETEN) {
      assert.equal(roh.includes(wert), false, wert)
    }
    assert.equal(roh.includes('passportNumber'), false)
    assert.equal(roh.includes('mrz'), false)
    assert.equal(roh.includes('dateOfBirth'), false)
    assert.equal(payload.citizenships.length, 2)
    assert.equal(payload.documents.length, 3)
    assert.equal(
      payload.documents.some((eintrag) => eintrag.citizenshipClientRef == null),
      true,
    )
  })

  test('fehlende, ungültige oder kollidierende Quelle scheitert geschlossen', () => {
    assert.equal(
      registryTravellerAlsFrischenTripSnapshot(null, { jetzt: SNAPSHOT_ZEIT, zufall: zufallAb(1) }),
      null,
    )
    assert.equal(
      registryTravellerAlsFrischenTripSnapshot(registryRoh({ authority: 'trip_snapshot' }), {
        jetzt: SNAPSHOT_ZEIT,
        zufall: zufallAb(1),
      }),
      null,
    )
    assert.equal(
      registryTravellerAlsFrischenTripSnapshot(registryRoh({ facts: { label: 'Reisepass X1234567' } }), {
        jetzt: SNAPSHOT_ZEIT,
        zufall: zufallAb(1),
      }),
      null,
    )
    assert.equal(
      registryTravellerAlsFrischenTripSnapshot(registry(), {
        jetzt: 'heute',
        zufall: zufallAb(1),
      }),
      null,
    )
    assert.equal(
      registryTravellerAlsFrischenTripSnapshot(registry(), {
        jetzt: SNAPSHOT_ZEIT,
        zufall: () => PERSON_ID,
      }),
      null,
    )
    assert.equal(
      tripSnapshotMaterialisierungErzeugen(registry(), {
        jetzt: SNAPSHOT_ZEIT,
        zufall: () => 'traveller:1',
      }),
      null,
    )
  })

  test('Anzeige listet alle Fakten gleichrangig und ohne Child-Identitäten', () => {
    const anzeige = registryTripAnzeigeAus(registry())
    assert.equal(anzeige.id, PERSON_ID)
    assert.deepEqual(anzeige.citizenshipCountryCodes, ['CH', 'RS'])
    assert.equal(anzeige.documents.length, 3)
    assert.deepEqual(
      anzeige.documents.map((eintrag) => `${eintrag.documentType}:${eintrag.issuingCountryCode ?? ''}`),
      ['national_id:DE', 'passport:CH', 'passport:RS'],
    )
    assert.equal(JSON.stringify(anzeige).includes(CH_REF), false)
    assert.equal(JSON.stringify(anzeige).includes(PASS_CH_REF), false)
    assert.equal(registryTripAnzeigeName(null), REGISTRY_TRIP_COPY.ohneBezeichnung)
    assert.equal(registryTripAnzeigenAus([registry()]).length, 1)
  })

  test('sucht den explizit gewählten Registry-Eintrag, ohne still zu deduplizieren', () => {
    const sasa = registry()
    const zweite = accountRegistryTravellerLesen(
      registryRoh({
        id: '9f0c1d2e-3a44-4b55-8c66-7d8e9f0a1b22',
        clientRef: '0a1d2e3f-4b55-4c66-8d77-8e9f0a1b2c33',
        facts: { label: 'Alex' },
      }),
    )
    assert.ok(zweite)
    assert.equal(registryTripEintragSuchen([sasa, zweite], PERSON_ID)?.facts.label, 'Sasa')
    assert.equal(registryTripEintragSuchen([sasa, zweite], zweite.id)?.facts.label, 'Alex')
    assert.equal(registryTripEintragSuchen([sasa], zweite.id), null)
    assert.equal(registryTripEintragSuchen([sasa, sasa], PERSON_ID), null)
  })

  test('Trip-Slot-Limit ist vor dem Write erkennbar', () => {
    assert.equal(registryTripLimitErreicht(19), false)
    assert.equal(registryTripLimitErreicht(20), true)
    assert.equal(registryTripLimitErreicht(21), true)
  })
})
