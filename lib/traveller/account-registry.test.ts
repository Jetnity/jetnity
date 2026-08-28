// lib/traveller/account-registry.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { TRAVELLER_CONTEXT_GRENZEN } from '@/lib/readiness/domain'
import { documentCitizenshipCode } from '@/lib/readiness/traveller-kontext'
import {
  ACCOUNT_REGISTRY_AUTHORITY,
  accountRegistryTravellerAlsTripSnapshot,
  accountRegistryTravellerLesen,
  accountRegistryTravellerProjektieren,
  type AccountRegistryTraveller,
  type TripSnapshotMaterialisierung,
} from '@/lib/traveller/account-registry'
import type { TripTraveller } from '@/types/trips'

const JETZT = '2026-08-28T17:00:00.000Z'
const SNAPSHOT_ZEIT = '2026-08-28T18:00:00.000Z'

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

const SNAP_PERSON_ID = '11111111-2222-4333-8444-555555555501'
const SNAP_PERSON_REF = '11111111-2222-4333-8444-555555555502'
const SNAP_CH_ID = '22222222-3333-4444-8555-666666666601'
const SNAP_CH_REF = '22222222-3333-4444-8555-666666666602'
const SNAP_RS_ID = '33333333-4444-4555-8666-777777777701'
const SNAP_RS_REF = '33333333-4444-4555-8666-777777777702'
const SNAP_PASS_CH_ID = '44444444-5555-4666-8777-888888888801'
const SNAP_PASS_CH_REF = '44444444-5555-4666-8777-888888888802'
const SNAP_PASS_RS_ID = '55555555-6666-4777-8888-999999999901'
const SNAP_PASS_RS_REF = '55555555-6666-4777-8888-999999999902'

type RegistryIstTrip = AccountRegistryTraveller extends TripTraveller ? true : false
const _registryIstKeinTrip: RegistryIstTrip = false
void _registryIstKeinTrip

type TripIstRegistry = TripTraveller extends AccountRegistryTraveller ? true : false
const _tripIstKeineRegistry: TripIstRegistry = false
void _tripIstKeineRegistry

function compileZeitGrenze(registry: AccountRegistryTraveller): void {
  // @ts-expect-error Registry must not be assignable to TripTraveller
  const _trip: TripTraveller = registry
  void _trip
}

function defaultFacts(teil: Record<string, unknown> = {}): Record<string, unknown> {
  return {
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
    ],
    ...teil,
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
    facts: defaultFacts(facts && typeof facts === 'object' && !Array.isArray(facts) ? (facts as Record<string, unknown>) : {}),
  }
}

function citizenshipen(codes: string[]): Record<string, unknown>[] {
  return codes.map((code, index) => ({
    id: `aaaaaaaa-bbbb-4ccc-8ddd-${String(index + 1).padStart(12, '0')}`,
    clientRef: `aaaaaaaa-cccc-4ddd-8eee-${String(index + 1).padStart(12, '0')}`,
    countryCode: code,
    createdAt: JETZT,
    updatedAt: JETZT,
  }))
}

function dokumente(teile: Array<Record<string, unknown>>): Record<string, unknown>[] {
  return teile.map((teil, index) => ({
    id: `bbbbbbbb-cccc-4ddd-8eee-${String(index + 1).padStart(12, '0')}`,
    clientRef: `bbbbbbbb-dddd-4eee-8fff-${String(index + 1).padStart(12, '0')}`,
    documentType: 'passport',
    issuingCountryCode: 'CH',
    citizenshipClientRef: null,
    expiresOn: '2030-01-01',
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }))
}

function materialisierungFuer(
  registry: AccountRegistryTraveller,
  jetzt = SNAPSHOT_ZEIT,
): TripSnapshotMaterialisierung {
  const citizenships: Record<string, { id: string; clientRef: string }> = {}
  for (const [index, citizenship] of registry.facts.citizenships.entries()) {
    citizenships[citizenship.clientRef] =
      citizenship.clientRef === CH_REF
        ? { id: SNAP_CH_ID, clientRef: SNAP_CH_REF }
        : citizenship.clientRef === RS_REF
          ? { id: SNAP_RS_ID, clientRef: SNAP_RS_REF }
          : {
              id: `ccccccc1-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
              clientRef: `ccccccc2-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
            }
  }
  const documents: Record<string, { id: string; clientRef: string }> = {}
  for (const [index, document] of registry.facts.documents.entries()) {
    documents[document.clientRef] =
      document.clientRef === PASS_CH_REF
        ? { id: SNAP_PASS_CH_ID, clientRef: SNAP_PASS_CH_REF }
        : document.clientRef === PASS_RS_REF
          ? { id: SNAP_PASS_RS_ID, clientRef: SNAP_PASS_RS_REF }
          : {
              id: `ddddddd1-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
              clientRef: `ddddddd2-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
            }
  }
  return {
    jetzt,
    traveller: { id: SNAP_PERSON_ID, clientRef: SNAP_PERSON_REF },
    citizenships,
    documents,
  }
}

function projektieren(roh: Record<string, unknown>, jetzt = SNAPSHOT_ZEIT): TripTraveller | null {
  const registry = accountRegistryTravellerLesen(roh)
  if (!registry) return null
  return accountRegistryTravellerProjektieren(roh, materialisierungFuer(registry, jetzt))
}

describe('AP-7 Dual-Authority Account-Registry', () => {
  test('zwei Staatsbürgerschaften und zwei Dokumente überleben Lesen und Projektion', () => {
    const roh = registryRoh()
    const registry = accountRegistryTravellerLesen(roh)
    assert.ok(registry)
    compileZeitGrenze(registry)
    const snapshot = accountRegistryTravellerProjektieren(roh, materialisierungFuer(registry))
    assert.ok(snapshot)
    assert.equal(registry.authority, ACCOUNT_REGISTRY_AUTHORITY)
    assert.deepEqual(
      registry.facts.citizenships.map((eintrag) => eintrag.countryCode),
      ['CH', 'RS'],
    )
    assert.deepEqual(
      snapshot.citizenships.map((eintrag) => eintrag.countryCode),
      ['CH', 'RS'],
    )
    assert.deepEqual(
      snapshot.documents.map((eintrag) => eintrag.clientRef),
      [SNAP_PASS_CH_REF, SNAP_PASS_RS_REF],
    )
    assert.equal(snapshot.citizenships.length, 2)
    assert.equal(snapshot.documents.length, 2)
  })

  test('Document↔Citizenship bleibt nach Remapping explizit und Issuer ist keine Staatsbürgerschaft', () => {
    const roh = registryRoh({
      facts: {
        documents: dokumente([
          {
            issuingCountryCode: 'US',
            citizenshipClientRef: RS_REF,
          },
        ]),
      },
    })
    const snapshot = projektieren(roh)
    assert.ok(snapshot)
    assert.equal(snapshot.documents[0]?.issuingCountryCode, 'US')
    assert.equal(snapshot.documents[0]?.citizenshipClientRef, SNAP_RS_REF)
    assert.equal(documentCitizenshipCode(snapshot, snapshot.documents[0]!), 'RS')
    assert.deepEqual(
      snapshot.citizenships.map((eintrag) => eintrag.countryCode),
      ['CH', 'RS'],
    )
    assert.equal(
      snapshot.citizenships.some((eintrag) => eintrag.countryCode === 'US'),
      false,
    )
    assert.notEqual(snapshot.documents[0]?.citizenshipClientRef, RS_REF)
  })

  test('Dokument ohne Citizenship-Relation bleibt explizit unlinked', () => {
    const snapshot = projektieren(
      registryRoh({
        facts: {
          documents: dokumente([
            {
              issuingCountryCode: 'US',
              citizenshipClientRef: null,
            },
          ]),
        },
      }),
    )
    assert.ok(snapshot)
    assert.equal(snapshot.documents[0]?.citizenshipClientRef, null)
    assert.equal(documentCitizenshipCode(snapshot, snapshot.documents[0]!), null)
    assert.equal(snapshot.documents[0]?.issuingCountryCode, 'US')
  })

  test('Registry-Quelle und Snapshot sind strukturell unabhängig', () => {
    const roh = registryRoh()
    const registry = accountRegistryTravellerLesen(roh)
    assert.ok(registry)
    const snapshot = accountRegistryTravellerAlsTripSnapshot(registry, materialisierungFuer(registry))
    assert.ok(snapshot)

    const mutierbar = {
      ...registry,
      facts: {
        ...registry.facts,
        citizenships: [...registry.facts.citizenships],
        documents: registry.facts.documents.map((eintrag) => ({ ...eintrag })),
      },
    }
    mutierbar.facts = {
      ...mutierbar.facts,
      label: 'mutiert',
      residenceCountryCode: 'DE',
      citizenships: [
        ...mutierbar.facts.citizenships,
        {
          id: 'eeeeeeee-ffff-4aaa-8bbb-000000000099',
          clientRef: 'eeeeeeee-ffff-4aaa-8bbb-000000000098',
          countryCode: 'DE',
          createdAt: JETZT,
          updatedAt: JETZT,
        },
      ],
    }
    mutierbar.facts.documents[0]!.issuingCountryCode = 'XX'
    mutierbar.facts.documents[0]!.citizenshipClientRef = null
    roh.facts = { label: 'roh-mutiert' }

    assert.equal(snapshot.label, 'Sasa')
    assert.equal(snapshot.residenceCountryCode, 'CH')
    assert.equal(snapshot.citizenships.length, 2)
    assert.equal(snapshot.citizenships[0]?.countryCode, 'CH')
    assert.equal(snapshot.documents[0]?.issuingCountryCode, 'CH')
    assert.equal(snapshot.documents[0]?.citizenshipClientRef, SNAP_CH_REF)
    assert.ok(!('authority' in snapshot))
    assert.ok(!('facts' in snapshot))
    assert.notEqual(snapshot.citizenships, registry.facts.citizenships)
    assert.notEqual(snapshot.documents, registry.facts.documents)
  })

  test('Projektion und Lesen mutieren die Quelle nicht', () => {
    const roh = registryRoh()
    const original = structuredClone(roh)
    const snapshot = projektieren(roh)
    assert.ok(snapshot)
    snapshot.label = 'snapshot-mutiert'
    snapshot.citizenships.pop()
    snapshot.documents[0]!.issuingCountryCode = 'IT'
    assert.deepEqual(roh, original)
  })

  test('erzeugt keine Default-/Preferred-/Chosen-Credential-Wahl', () => {
    const snapshot = projektieren(registryRoh())
    assert.ok(snapshot)
    assert.equal('chosenCredentialOptionRef' in snapshot, false)
    assert.equal('credentialOptions' in snapshot, false)
    assert.equal('preferredDocument' in snapshot, false)
    assert.equal('defaultCitizenship' in snapshot, false)
    assert.equal('authority' in snapshot, false)
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({ chosenCredentialOptionRef: `${PERSON_REF}:${PASS_CH_REF}` }),
      ),
      null,
    )
    assert.equal(accountRegistryTravellerLesen(registryRoh({ credentialOptions: [] })), null)
    assert.equal(accountRegistryTravellerLesen(registryRoh({ defaultPassport: true })), null)
  })

  test('Positions- und faktische Refs sind keine Registry-Identität', () => {
    assert.equal(accountRegistryTravellerLesen(registryRoh({ clientRef: 'traveller:1' })), null)
    assert.equal(accountRegistryTravellerLesen(registryRoh({ clientRef: 'person:0' })), null)
    assert.equal(accountRegistryTravellerLesen(registryRoh({ clientRef: 'person:sasa' })), null)
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          facts: {
            documents: dokumente([{ clientRef: 'document:passport:CH' }]),
          },
        }),
      ),
      null,
    )
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          facts: {
            citizenships: [
              {
                id: CH_ID,
                clientRef: 'citizenship:CH',
                countryCode: 'CH',
                createdAt: JETZT,
                updatedAt: JETZT,
              },
            ],
            documents: [],
          },
        }),
      ),
      null,
    )

    const a = projektieren(registryRoh())
    const b = projektieren(
      registryRoh({
        facts: {
          citizenships: [
            {
              id: RS_ID,
              clientRef: RS_REF,
              countryCode: 'RS',
              createdAt: JETZT,
              updatedAt: JETZT,
            },
            {
              id: CH_ID,
              clientRef: CH_REF,
              countryCode: 'CH',
              createdAt: JETZT,
              updatedAt: JETZT,
            },
          ],
          documents: [
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
              id: PASS_CH_ID,
              clientRef: PASS_CH_REF,
              documentType: 'passport',
              issuingCountryCode: 'CH',
              citizenshipClientRef: CH_REF,
              expiresOn: '2030-01-01',
              createdAt: JETZT,
              updatedAt: JETZT,
            },
          ],
        },
      }),
    )
    assert.ok(a)
    assert.ok(b)
    assert.equal(a.clientRef, SNAP_PERSON_REF)
    assert.equal(b.clientRef, SNAP_PERSON_REF)
    assert.notEqual(a.clientRef, PERSON_REF)
    assert.equal(a.citizenships[0]?.countryCode, 'CH')
    assert.equal(b.citizenships[0]?.countryCode, 'RS')
    assert.deepEqual(
      new Set(a.citizenships.map((eintrag) => eintrag.clientRef)),
      new Set(b.citizenships.map((eintrag) => eintrag.clientRef)),
    )
  })

  test('zwei Pässe gleichen Typs und Ausstellerlandes bleiben unterscheidbar', () => {
    const passA = '9a8b7c6d-5e4f-4012-8a3b-1c2d3e4f5a60'
    const passB = '9a8b7c6d-5e4f-4012-8a3b-1c2d3e4f5a61'
    const roh = registryRoh({
      facts: {
        documents: dokumente([
          {
            id: '9a8b7c6d-5e4f-4012-8a3b-1c2d3e4f5a70',
            clientRef: passA,
            documentType: 'passport',
            issuingCountryCode: 'CH',
            citizenshipClientRef: CH_REF,
            expiresOn: '2030-01-01',
          },
          {
            id: '9a8b7c6d-5e4f-4012-8a3b-1c2d3e4f5a71',
            clientRef: passB,
            documentType: 'passport',
            issuingCountryCode: 'CH',
            citizenshipClientRef: CH_REF,
            expiresOn: '2031-01-01',
          },
        ]),
      },
    })
    const registry = accountRegistryTravellerLesen(roh)
    assert.ok(registry)
    assert.equal(registry.facts.documents.length, 2)
    assert.equal(registry.facts.documents[0]?.issuingCountryCode, 'CH')
    assert.equal(registry.facts.documents[1]?.issuingCountryCode, 'CH')
    assert.notEqual(registry.facts.documents[0]?.clientRef, registry.facts.documents[1]?.clientRef)
    const snapshot = accountRegistryTravellerProjektieren(roh, materialisierungFuer(registry))
    assert.ok(snapshot)
    assert.equal(snapshot.documents.length, 2)
    assert.notEqual(snapshot.documents[0]?.clientRef, snapshot.documents[1]?.clientRef)
    assert.notEqual(snapshot.documents[0]?.clientRef, passA)
    assert.equal(snapshot.documents[0]?.expiresOn, '2030-01-01')
    assert.equal(snapshot.documents[1]?.expiresOn, '2031-01-01')
  })

  test('Limits und Länder-/Dokumentprüfung folgen der kanonischen Trip-Wahrheit', () => {
    assert.equal(TRAVELLER_CONTEXT_GRENZEN.citizenshipsJeTraveller, 8)
    assert.equal(TRAVELLER_CONTEXT_GRENZEN.documentsJeTraveller, 12)
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          facts: {
            citizenships: citizenshipen(['CH', 'RS', 'DE', 'FR', 'IT', 'AT', 'US', 'GB', 'ES']),
            documents: [],
          },
        }),
      ),
      null,
    )
    const genauAcht = accountRegistryTravellerLesen(
      registryRoh({
        facts: {
          citizenships: citizenshipen(['CH', 'RS', 'DE', 'FR', 'IT', 'AT', 'US', 'GB']),
          documents: [],
        },
      }),
    )
    assert.equal(genauAcht?.facts.citizenships.length, 8)
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          facts: {
            documents: dokumente(
              Array.from({ length: 13 }, () => ({
                issuingCountryCode: 'CH',
              })),
            ),
          },
        }),
      ),
      null,
    )
    assert.equal(
      accountRegistryTravellerLesen(registryRoh({ facts: { residenceCountryCode: 'Schweiz' } })),
      null,
    )
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          facts: {
            documents: dokumente([{ documentType: 'visa', issuingCountryCode: 'CH' }]),
          },
        }),
      ),
      null,
    )
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          facts: {
            documents: dokumente([{ issuingCountryCode: 'USA' }]),
          },
        }),
      ),
      null,
    )
  })

  test('doppelte oder baumelnde Referenzen sind fail-closed', () => {
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          facts: {
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
                clientRef: CH_REF,
                countryCode: 'RS',
                createdAt: JETZT,
                updatedAt: JETZT,
              },
            ],
          },
        }),
      ),
      null,
    )
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          facts: { citizenships: citizenshipen(['CH', 'CH']) },
        }),
      ),
      null,
    )
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          facts: {
            documents: dokumente([
              { citizenshipClientRef: 'aaaaaaaa-cccc-4ddd-8eee-000000000099' },
            ]),
          },
        }),
      ),
      null,
    )
    assert.equal(accountRegistryTravellerLesen(registryRoh({ id: 'person:sasa' })), null)
    assert.equal(accountRegistryTravellerLesen(registryRoh({ nationalityCountryCode: 'CH' })), null)
    assert.equal(accountRegistryTravellerLesen(registryRoh({ dateOfBirth: '1990-01-01' })), null)
    assert.equal(accountRegistryTravellerLesen(registryRoh({ passportNumber: 'X1234567' })), null)
    assert.equal(accountRegistryTravellerLesen(registryRoh({ mrz: 'P<CH...' })), null)
  })

  test('Authority ist Pflicht und TripTraveller-Form wird nicht zur Registry befördert', () => {
    const { authority: _authority, ...ohneAuthority } = registryRoh()
    void _authority
    assert.equal(accountRegistryTravellerLesen(ohneAuthority), null)
    assert.equal(accountRegistryTravellerLesen(registryRoh({ authority: 'trip_snapshot' })), null)
    assert.equal(accountRegistryTravellerLesen(registryRoh({ authority: '' })), null)
    assert.equal(
      accountRegistryTravellerLesen({
        id: PERSON_ID,
        clientRef: PERSON_REF,
        label: 'Sasa',
        residenceCountryCode: 'CH',
        citizenships: [],
        documents: [],
        createdAt: JETZT,
        updatedAt: JETZT,
      }),
      null,
    )
  })

  test('leitet keine Staatsbürgerschaft aus Wohnsitz, Locale oder Issuer ab', () => {
    const ohneCitizenships = projektieren(
      registryRoh({
        facts: {
          residenceCountryCode: 'CH',
          citizenships: [],
          documents: dokumente([
            {
              issuingCountryCode: 'CH',
              citizenshipClientRef: null,
            },
          ]),
        },
      }),
    )
    assert.ok(ohneCitizenships)
    assert.deepEqual(ohneCitizenships.citizenships, [])
    assert.equal(ohneCitizenships.residenceCountryCode, 'CH')
    assert.equal(ohneCitizenships.documents[0]?.issuingCountryCode, 'CH')
    assert.equal(ohneCitizenships.documents[0]?.citizenshipClientRef, null)
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          locale: 'de-CH',
          language: 'de',
          departureCountryCode: 'CH',
        }),
      ),
      null,
    )
  })

  test('leere Citizenships/Dokumente bleiben fehlende Fakten, kein Default', () => {
    const snapshot = projektieren(
      registryRoh({
        facts: {
          citizenships: [],
          documents: [],
        },
      }),
    )
    assert.ok(snapshot)
    assert.deepEqual(snapshot.citizenships, [])
    assert.deepEqual(snapshot.documents, [])
    assert.equal('credentialOptions' in snapshot, false)
  })

  test('Snapshot bekommt trip-eigene Identität und eigene Zeiten, nicht Registry-Metadaten', () => {
    const registry = accountRegistryTravellerLesen(registryRoh())
    assert.ok(registry)
    const snapshot = accountRegistryTravellerAlsTripSnapshot(registry, materialisierungFuer(registry))
    assert.ok(snapshot)
    assert.equal(registry.createdAt, JETZT)
    assert.equal(registry.facts.citizenships[0]?.createdAt, JETZT)
    assert.equal(snapshot.createdAt, SNAPSHOT_ZEIT)
    assert.equal(snapshot.updatedAt, SNAPSHOT_ZEIT)
    assert.equal(snapshot.citizenships[0]?.createdAt, SNAPSHOT_ZEIT)
    assert.equal(snapshot.citizenships[0]?.updatedAt, SNAPSHOT_ZEIT)
    assert.equal(snapshot.documents[0]?.createdAt, SNAPSHOT_ZEIT)
    assert.equal(snapshot.documents[0]?.updatedAt, SNAPSHOT_ZEIT)
    assert.notEqual(snapshot.id, registry.id)
    assert.notEqual(snapshot.clientRef, registry.clientRef)
    assert.equal(snapshot.id, SNAP_PERSON_ID)
    assert.equal(snapshot.clientRef, SNAP_PERSON_REF)
    assert.equal(
      accountRegistryTravellerAlsTripSnapshot(registry, {
        ...materialisierungFuer(registry),
        jetzt: 'heute',
      }),
      null,
    )
    assert.equal(
      accountRegistryTravellerAlsTripSnapshot(registry, {
        ...materialisierungFuer(registry),
        traveller: { id: PERSON_ID, clientRef: SNAP_PERSON_REF },
      }),
      null,
    )
    assert.equal(
      accountRegistryTravellerAlsTripSnapshot(registry, {
        ...materialisierungFuer(registry),
        traveller: { id: SNAP_PERSON_ID, clientRef: PERSON_REF },
      }),
      null,
    )
  })

  test('fehlende oder unvollständige Materialisierung ist fail-closed und nicht wanduhrabhängig', () => {
    const registry = accountRegistryTravellerLesen(registryRoh())
    assert.ok(registry)
    assert.equal(
      accountRegistryTravellerAlsTripSnapshot(registry, {
        traveller: { id: SNAP_PERSON_ID, clientRef: SNAP_PERSON_REF },
        citizenships: {},
        documents: {},
      }),
      null,
    )
    assert.equal(
      accountRegistryTravellerAlsTripSnapshot(registry, {
        ...materialisierungFuer(registry),
        citizenships: {},
      }),
      null,
    )
    assert.equal(
      accountRegistryTravellerAlsTripSnapshot(registry, {
        ...materialisierungFuer(registry),
        documents: {
          ...materialisierungFuer(registry).documents,
          'ffffffff-ffff-4fff-8fff-ffffffffffff': { id: SNAP_PASS_CH_ID, clientRef: SNAP_PASS_CH_REF },
        },
      }),
      null,
    )
  })
})
