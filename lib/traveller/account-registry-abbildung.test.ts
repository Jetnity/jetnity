import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  registryTravellerAusZeile,
  registryTravellersAusZeilen,
  registryZeitKanonisieren,
} from '@/lib/traveller/account-registry-abbildung'

const TRAVELLER_ID = '2f1c6d8a-4b21-4a7e-9c11-0d3e8a7b6c55'
const TRAVELLER_REF = '3a2d7e9b-5c32-4b8f-ad22-1e4f9b8c7d66'
const CH_ID = '7a9e2c14-8d33-41b0-a6f2-1c5d9e0b4a10'
const CH_REF = '8b0f3d25-9e44-42c1-b703-2d6e0f1c5b21'
const RS_ID = 'b3d10e52-6c44-4f91-8a07-2e6f1d9c8b20'
const RS_REF = 'c4e21f63-7d55-4092-9b18-3f7a2e0d9c31'
const PASS_ID = 'd5f32074-8e66-41a3-ac29-4a8b3f1e0d42'
const PASS_REF = 'e6a43185-9f77-42b4-bd3a-5b9c4a2f1e53'

function zeile(teil: Record<string, unknown> = {}) {
  return {
    id: TRAVELLER_ID,
    client_ref: TRAVELLER_REF,
    label: 'Sasa',
    residence_country_code: 'CH',
    created_at: '2026-08-29T10:00:00+00:00',
    updated_at: '2026-08-29T10:00:00.123456+00:00',
    account_traveller_citizenships: [
      {
        id: RS_ID,
        client_ref: RS_REF,
        country_code: 'RS',
        created_at: '2026-08-29T10:01:00+00:00',
        updated_at: '2026-08-29T10:01:00+00:00',
      },
      {
        id: CH_ID,
        client_ref: CH_REF,
        country_code: 'CH',
        created_at: '2026-08-29T10:00:30+00:00',
        updated_at: '2026-08-29T10:00:30+00:00',
      },
    ],
    account_traveller_documents: [
      {
        id: PASS_ID,
        client_ref: PASS_REF,
        document_type: 'passport',
        issuing_country_code: 'DE',
        citizenship_id: CH_ID,
        expires_on: '2028-01-01',
        created_at: '2026-08-29T10:02:00+00:00',
        updated_at: '2026-08-29T10:02:00+00:00',
      },
    ],
    ...teil,
  }
}

describe('Account-Registry Abbildung', () => {
  test('kanonisiert Postgres-Zeiten auf den Domain-Vertrag', () => {
    assert.equal(registryZeitKanonisieren('2026-08-29T10:00:00+00:00'), '2026-08-29T10:00:00.000Z')
    assert.equal(registryZeitKanonisieren('kein-datum'), null)
  })

  test('bildet citizenship_id auf clientRef ab und hält Issuer getrennt', () => {
    const traveller = registryTravellerAusZeile(zeile())
    assert.ok(traveller)
    assert.equal(traveller.authority, 'account_registry')
    assert.deepEqual(
      traveller.facts.citizenships.map((eintrag) => eintrag.countryCode),
      ['CH', 'RS'],
    )
    assert.equal(traveller.facts.documents[0]?.issuingCountryCode, 'DE')
    assert.equal(traveller.facts.documents[0]?.citizenshipClientRef, CH_REF)
    assert.notEqual(traveller.facts.documents[0]?.issuingCountryCode, 'CH')
  })

  test('bildet gelöschte Citizenship-Zuordnung als null ab', () => {
    const traveller = registryTravellerAusZeile(
      zeile({
        account_traveller_documents: [
          {
            id: PASS_ID,
            client_ref: PASS_REF,
            document_type: 'passport',
            issuing_country_code: 'DE',
            citizenship_id: null,
            expires_on: '2028-01-01',
            created_at: '2026-08-29T10:02:00+00:00',
            updated_at: '2026-08-29T10:02:00+00:00',
          },
        ],
      }),
    )
    assert.ok(traveller)
    assert.equal(traveller.facts.documents[0]?.citizenshipClientRef, null)
    assert.equal(traveller.facts.documents[0]?.issuingCountryCode, 'DE')
  })

  test('scheitert fail-closed bei verwaister Citizenship-Relation', () => {
    assert.equal(
      registryTravellerAusZeile(
        zeile({
          account_traveller_documents: [
            {
              id: PASS_ID,
              client_ref: PASS_REF,
              document_type: 'passport',
              issuing_country_code: 'DE',
              citizenship_id: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
              expires_on: null,
              created_at: '2026-08-29T10:02:00+00:00',
              updated_at: '2026-08-29T10:02:00+00:00',
            },
          ],
        }),
      ),
      null,
    )
  })

  test('gibt die ganze Liste als Fehler auf, statt eine Zeile zu verwerfen', () => {
    assert.equal(registryTravellersAusZeilen([zeile(), { id: 'kaputt' }]), null)
    const liste = registryTravellersAusZeilen([zeile()])
    assert.ok(liste)
    assert.equal(liste.length, 1)
  })
})
