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
} from '@/lib/traveller/account-registry'

const JETZT = '2026-08-28T17:00:00.000Z'
const SNAPSHOT_ZEIT = '2026-08-28T18:00:00.000Z'

const PERSON_ID = '2f1c6d8a-4b21-4a7e-9c11-0d3e8a7b6c55'
const CH_ID = '7a9e2c14-8d33-41b0-a6f2-1c5d9e0b4a10'
const RS_ID = 'b3d10e52-6c44-4f91-8a07-2e6f1d9c8b20'
const PASS_CH_ID = 'c4e21f63-7d55-4092-9b18-3f7a2e0d9c31'
const PASS_RS_ID = 'd5f32074-8e66-41a3-ac29-4a8b3f1e0d42'

function registryRoh(teil: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    authority: ACCOUNT_REGISTRY_AUTHORITY,
    id: PERSON_ID,
    clientRef: 'person:sasa',
    label: 'Sasa',
    residenceCountryCode: 'CH',
    createdAt: JETZT,
    updatedAt: JETZT,
    citizenships: [
      {
        id: CH_ID,
        clientRef: 'citizenship:CH',
        countryCode: 'CH',
        createdAt: JETZT,
        updatedAt: JETZT,
      },
      {
        id: RS_ID,
        clientRef: 'citizenship:RS',
        countryCode: 'RS',
        createdAt: JETZT,
        updatedAt: JETZT,
      },
    ],
    documents: [
      {
        id: PASS_CH_ID,
        clientRef: 'document:passport:CH',
        documentType: 'passport',
        issuingCountryCode: 'CH',
        citizenshipClientRef: 'citizenship:CH',
        expiresOn: '2030-01-01',
        createdAt: JETZT,
        updatedAt: JETZT,
      },
      {
        id: PASS_RS_ID,
        clientRef: 'document:passport:RS',
        documentType: 'passport',
        issuingCountryCode: 'RS',
        citizenshipClientRef: 'citizenship:RS',
        expiresOn: '2029-06-01',
        createdAt: JETZT,
        updatedAt: JETZT,
      },
    ],
    ...teil,
  }
}

function citizenshipen(codes: string[]): Record<string, unknown>[] {
  return codes.map((code, index) => ({
    id: `aaaaaaaa-bbbb-4ccc-8ddd-${String(index + 1).padStart(12, '0')}`,
    clientRef: `citizenship:${code}`,
    countryCode: code,
    createdAt: JETZT,
    updatedAt: JETZT,
  }))
}

function dokumente(teile: Array<Record<string, unknown>>): Record<string, unknown>[] {
  return teile.map((teil, index) => ({
    id: `bbbbbbbb-cccc-4ddd-8eee-${String(index + 1).padStart(12, '0')}`,
    clientRef: `document:${String(teil.documentType ?? 'passport')}:${String(teil.issuingCountryCode ?? 'xx')}`,
    documentType: 'passport',
    issuingCountryCode: 'CH',
    citizenshipClientRef: null,
    expiresOn: '2030-01-01',
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }))
}

describe('AP-7 Dual-Authority Account-Registry', () => {
  test('zwei Staatsbürgerschaften und zwei Dokumente überleben Lesen und Projektion', () => {
    const roh = registryRoh()
    const registry = accountRegistryTravellerLesen(roh)
    const snapshot = accountRegistryTravellerProjektieren(roh, SNAPSHOT_ZEIT)
    assert.ok(registry)
    assert.ok(snapshot)
    assert.equal(registry.authority, ACCOUNT_REGISTRY_AUTHORITY)
    assert.deepEqual(
      registry.citizenships.map((eintrag) => eintrag.countryCode),
      ['CH', 'RS'],
    )
    assert.deepEqual(
      snapshot.citizenships.map((eintrag) => eintrag.countryCode),
      ['CH', 'RS'],
    )
    assert.deepEqual(
      snapshot.documents.map((eintrag) => eintrag.clientRef),
      ['document:passport:CH', 'document:passport:RS'],
    )
    assert.equal(snapshot.citizenships.length, 2)
    assert.equal(snapshot.documents.length, 2)
  })

  test('Document↔Citizenship ist explizit und Issuer ist keine Staatsbürgerschaft', () => {
    const snapshot = accountRegistryTravellerProjektieren(
      registryRoh({
        documents: dokumente([
          {
            clientRef: 'document:passport:US',
            issuingCountryCode: 'US',
            citizenshipClientRef: 'citizenship:RS',
          },
        ]),
      }),
      SNAPSHOT_ZEIT,
    )
    assert.ok(snapshot)
    assert.equal(snapshot.documents[0]?.issuingCountryCode, 'US')
    assert.equal(snapshot.documents[0]?.citizenshipClientRef, 'citizenship:RS')
    assert.equal(documentCitizenshipCode(snapshot, snapshot.documents[0]!), 'RS')
    assert.deepEqual(
      snapshot.citizenships.map((eintrag) => eintrag.countryCode),
      ['CH', 'RS'],
    )
    assert.equal(
      snapshot.citizenships.some((eintrag) => eintrag.countryCode === 'US'),
      false,
    )
  })

  test('Dokument ohne Citizenship-Relation bleibt explizit unlinked', () => {
    const snapshot = accountRegistryTravellerProjektieren(
      registryRoh({
        documents: dokumente([
          {
            clientRef: 'document:passport:US',
            issuingCountryCode: 'US',
            citizenshipClientRef: null,
          },
        ]),
      }),
      SNAPSHOT_ZEIT,
    )
    assert.ok(snapshot)
    assert.equal(snapshot.documents[0]?.citizenshipClientRef, null)
    assert.equal(documentCitizenshipCode(snapshot, snapshot.documents[0]!), null)
    assert.equal(snapshot.documents[0]?.issuingCountryCode, 'US')
    assert.deepEqual(
      snapshot.citizenships.map((eintrag) => eintrag.countryCode),
      ['CH', 'RS'],
    )
  })

  test('Registry-Quelle und Snapshot sind strukturell unabhängig', () => {
    const roh = registryRoh()
    const registry = accountRegistryTravellerLesen(roh) as AccountRegistryTraveller
    const snapshot = accountRegistryTravellerAlsTripSnapshot(registry, SNAPSHOT_ZEIT)
    assert.ok(snapshot)

    registry.label = 'mutiert'
    registry.residenceCountryCode = 'DE'
    registry.citizenships.push({
      id: 'eeeeeeee-ffff-4aaa-8bbb-000000000099',
      clientRef: 'citizenship:DE',
      countryCode: 'DE',
      createdAt: JETZT,
      updatedAt: JETZT,
    })
    registry.documents[0]!.issuingCountryCode = 'XX'
    registry.documents[0]!.citizenshipClientRef = null
    roh.label = 'roh-mutiert'
    ;(roh.citizenships as Array<Record<string, unknown>>)[0]!.countryCode = 'FR'

    assert.equal(snapshot.label, 'Sasa')
    assert.equal(snapshot.residenceCountryCode, 'CH')
    assert.equal(snapshot.citizenships.length, 2)
    assert.equal(snapshot.citizenships[0]?.countryCode, 'CH')
    assert.equal(snapshot.documents[0]?.issuingCountryCode, 'CH')
    assert.equal(snapshot.documents[0]?.citizenshipClientRef, 'citizenship:CH')
    assert.ok(!('authority' in snapshot))
    assert.notEqual(snapshot.citizenships, registry.citizenships)
    assert.notEqual(snapshot.documents, registry.documents)
    assert.notEqual(snapshot.citizenships[0], registry.citizenships[0])
    assert.notEqual(snapshot.documents[0], registry.documents[0])
  })

  test('Projektion und Lesen mutieren die Quelle nicht', () => {
    const roh = registryRoh()
    const original = structuredClone(roh)
    const snapshot = accountRegistryTravellerProjektieren(roh, SNAPSHOT_ZEIT)
    assert.ok(snapshot)
    snapshot.label = 'snapshot-mutiert'
    snapshot.citizenships.pop()
    snapshot.documents[0]!.issuingCountryCode = 'IT'
    assert.deepEqual(roh, original)
  })

  test('erzeugt keine Default-/Preferred-/Chosen-Credential-Wahl', () => {
    const snapshot = accountRegistryTravellerProjektieren(registryRoh(), SNAPSHOT_ZEIT)
    assert.ok(snapshot)
    assert.equal('chosenCredentialOptionRef' in snapshot, false)
    assert.equal('credentialOptions' in snapshot, false)
    assert.equal('preferredDocument' in snapshot, false)
    assert.equal('defaultCitizenship' in snapshot, false)
    assert.equal('authority' in snapshot, false)
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({ chosenCredentialOptionRef: 'person:sasa:document:passport:CH' }),
      ),
      null,
    )
    assert.equal(accountRegistryTravellerLesen(registryRoh({ credentialOptions: [] })), null)
    assert.equal(accountRegistryTravellerLesen(registryRoh({ defaultPassport: true })), null)
  })

  test('Positionsindex ist keine Personen- oder Dokumentidentität', () => {
    assert.equal(accountRegistryTravellerLesen(registryRoh({ clientRef: 'traveller:1' })), null)
    assert.equal(accountRegistryTravellerLesen(registryRoh({ clientRef: 'traveller:2' })), null)
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          documents: dokumente([{ clientRef: 'document:0' }]),
        }),
      ),
      null,
    )
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          citizenships: [
            {
              id: CH_ID,
              clientRef: 'citizenship[0]',
              countryCode: 'CH',
              createdAt: JETZT,
              updatedAt: JETZT,
            },
          ],
          documents: [],
        }),
      ),
      null,
    )

    const a = accountRegistryTravellerProjektieren(registryRoh(), SNAPSHOT_ZEIT)
    const b = accountRegistryTravellerProjektieren(
      registryRoh({
        citizenships: [
          {
            id: RS_ID,
            clientRef: 'citizenship:RS',
            countryCode: 'RS',
            createdAt: JETZT,
            updatedAt: JETZT,
          },
          {
            id: CH_ID,
            clientRef: 'citizenship:CH',
            countryCode: 'CH',
            createdAt: JETZT,
            updatedAt: JETZT,
          },
        ],
        documents: [
          {
            id: PASS_RS_ID,
            clientRef: 'document:passport:RS',
            documentType: 'passport',
            issuingCountryCode: 'RS',
            citizenshipClientRef: 'citizenship:RS',
            expiresOn: '2029-06-01',
            createdAt: JETZT,
            updatedAt: JETZT,
          },
          {
            id: PASS_CH_ID,
            clientRef: 'document:passport:CH',
            documentType: 'passport',
            issuingCountryCode: 'CH',
            citizenshipClientRef: 'citizenship:CH',
            expiresOn: '2030-01-01',
            createdAt: JETZT,
            updatedAt: JETZT,
          },
        ],
      }),
      SNAPSHOT_ZEIT,
    )
    assert.ok(a)
    assert.ok(b)
    assert.equal(a.clientRef, b.clientRef)
    assert.equal(a.citizenships[0]?.countryCode, 'CH')
    assert.equal(b.citizenships[0]?.countryCode, 'RS')
    assert.deepEqual(
      new Set(a.citizenships.map((eintrag) => eintrag.clientRef)),
      new Set(b.citizenships.map((eintrag) => eintrag.clientRef)),
    )
  })

  test('Limits und Länder-/Dokumentprüfung folgen der kanonischen Trip-Wahrheit', () => {
    assert.equal(TRAVELLER_CONTEXT_GRENZEN.citizenshipsJeTraveller, 8)
    assert.equal(TRAVELLER_CONTEXT_GRENZEN.documentsJeTraveller, 12)
    const zuVieleCitizenships = ['CH', 'RS', 'DE', 'FR', 'IT', 'AT', 'US', 'GB', 'ES']
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          citizenships: citizenshipen(zuVieleCitizenships),
          documents: [],
        }),
      ),
      null,
    )
    const genauAcht = accountRegistryTravellerLesen(
      registryRoh({
        citizenships: citizenshipen(['CH', 'RS', 'DE', 'FR', 'IT', 'AT', 'US', 'GB']),
        documents: [],
      }),
    )
    assert.equal(genauAcht?.citizenships.length, 8)

    const zuVieleDokumente = dokumente(
      Array.from({ length: 13 }, (_, index) => ({
        clientRef: `document:passport:X${index}`,
        issuingCountryCode: 'CH',
      })),
    )
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          documents: zuVieleDokumente,
        }),
      ),
      null,
    )
    assert.equal(accountRegistryTravellerLesen(registryRoh({ residenceCountryCode: 'Schweiz' })), null)
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          documents: dokumente([{ documentType: 'visa', issuingCountryCode: 'CH' }]),
        }),
      ),
      null,
    )
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          documents: dokumente([{ issuingCountryCode: 'USA' }]),
        }),
      ),
      null,
    )
  })

  test('doppelte oder baumelnde Referenzen sind fail-closed', () => {
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          citizenships: [
            {
              id: CH_ID,
              clientRef: 'citizenship:CH',
              countryCode: 'CH',
              createdAt: JETZT,
              updatedAt: JETZT,
            },
            {
              id: RS_ID,
              clientRef: 'citizenship:CH',
              countryCode: 'RS',
              createdAt: JETZT,
              updatedAt: JETZT,
            },
          ],
        }),
      ),
      null,
    )
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          citizenships: citizenshipen(['CH', 'CH']),
        }),
      ),
      null,
    )
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          documents: dokumente([
            { clientRef: 'document:passport:CH', citizenshipClientRef: 'citizenship:DE' },
          ]),
        }),
      ),
      null,
    )
    assert.equal(
      accountRegistryTravellerLesen(
        registryRoh({
          documents: dokumente([
            { clientRef: 'document:passport:CH', citizenshipClientRef: 'citizenship:CH' },
            { clientRef: 'document:passport:CH', issuingCountryCode: 'RS' },
          ]),
        }),
      ),
      null,
    )
    assert.equal(accountRegistryTravellerLesen(registryRoh({ id: 'person:sasa' })), null)
    assert.equal(accountRegistryTravellerLesen(registryRoh({ authority: 'trip_snapshot' })), null)
    assert.equal(accountRegistryTravellerLesen(registryRoh({ nationalityCountryCode: 'CH' })), null)
    assert.equal(accountRegistryTravellerLesen(registryRoh({ dateOfBirth: '1990-01-01' })), null)
    assert.equal(accountRegistryTravellerLesen(registryRoh({ passportNumber: 'X1234567' })), null)
    assert.equal(accountRegistryTravellerLesen(registryRoh({ mrz: 'P<CH...' })), null)
  })

  test('leitet keine Staatsbürgerschaft aus Wohnsitz, Locale oder Issuer ab', () => {
    const ohneCitizenships = accountRegistryTravellerProjektieren(
      registryRoh({
        residenceCountryCode: 'CH',
        citizenships: [],
        documents: dokumente([
          {
            clientRef: 'document:passport:CH',
            issuingCountryCode: 'CH',
            citizenshipClientRef: null,
          },
        ]),
      }),
      SNAPSHOT_ZEIT,
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
    const snapshot = accountRegistryTravellerProjektieren(
      registryRoh({
        citizenships: [],
        documents: [],
      }),
      SNAPSHOT_ZEIT,
    )
    assert.ok(snapshot)
    assert.deepEqual(snapshot.citizenships, [])
    assert.deepEqual(snapshot.documents, [])
    assert.equal('credentialOptions' in snapshot, false)
  })

  test('Snapshot trägt keine Live-Registry-Authority und stempelt eigene Zeiten', () => {
    const registry = accountRegistryTravellerLesen(registryRoh())
    assert.ok(registry)
    const snapshot = accountRegistryTravellerAlsTripSnapshot(registry, SNAPSHOT_ZEIT)
    assert.ok(snapshot)
    assert.equal(registry.createdAt, JETZT)
    assert.equal(snapshot.createdAt, SNAPSHOT_ZEIT)
    assert.equal(snapshot.updatedAt, SNAPSHOT_ZEIT)
    assert.equal(snapshot.citizenships[0]?.createdAt, JETZT)
    assert.equal(snapshot.id, registry.id)
    assert.equal(snapshot.clientRef, registry.clientRef)
    assert.equal(accountRegistryTravellerAlsTripSnapshot(registry, 'heute'), null)
  })
})
