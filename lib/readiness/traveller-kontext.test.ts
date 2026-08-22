// lib/readiness/traveller-kontext.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  credentialOptionsAus,
  partyCredentialFingerprint,
  travellerCredentialFingerprint,
  travellerLegacyLesen,
} from '@/lib/readiness/traveller-kontext'

const JETZT = '2026-08-22T10:00:00.000Z'

describe('Traveller-Kontext', () => {
  test('liest Legacy-Singularform verlustfrei', () => {
    const gelesen = travellerLegacyLesen({
      id: 'traveller:1',
      clientRef: 'traveller:1',
      label: 'Sasa',
      nationalityCountryCode: 'CH',
      residenceCountryCode: 'CH',
      documentType: 'passport',
      documentIssuingCountryCode: 'CH',
      documentExpiresOn: '2030-01-01',
      createdAt: JETZT,
      updatedAt: JETZT,
    })
    assert.ok(gelesen)
    assert.equal(gelesen.citizenships[0]?.countryCode, 'CH')
    assert.equal(gelesen.documents[0]?.documentType, 'passport')
    assert.equal(gelesen.documents[0]?.issuingCountryCode, 'CH')
    assert.equal(gelesen.residenceCountryCode, 'CH')
  })

  test('dedupliziert Staatsbürgerschaften deterministisch', () => {
    const gelesen = travellerLegacyLesen({
      clientRef: 'traveller:1',
      citizenships: [
        { clientRef: 'citizenship:RS', countryCode: 'RS', createdAt: JETZT, updatedAt: JETZT },
        { clientRef: 'citizenship:CH', countryCode: 'CH', createdAt: JETZT, updatedAt: JETZT },
        { clientRef: 'citizenship:CH-2', countryCode: 'CH', createdAt: JETZT, updatedAt: JETZT },
      ],
      createdAt: JETZT,
      updatedAt: JETZT,
    })
    assert.deepEqual(
      gelesen?.citizenships.map((eintrag) => eintrag.countryCode),
      ['CH', 'RS'],
    )
  })

  test('Fingerprint ist unabhängig von Array-Reihenfolge', () => {
    const a = travellerLegacyLesen({
      clientRef: 'traveller:1',
      citizenships: [
        { clientRef: 'citizenship:CH', countryCode: 'CH', createdAt: JETZT, updatedAt: JETZT },
        { clientRef: 'citizenship:RS', countryCode: 'RS', createdAt: JETZT, updatedAt: JETZT },
      ],
      documents: [
        {
          clientRef: 'document:passport:CH',
          documentType: 'passport',
          issuingCountryCode: 'CH',
          expiresOn: '2030-01-01',
          createdAt: JETZT,
          updatedAt: JETZT,
        },
        {
          clientRef: 'document:passport:RS',
          documentType: 'passport',
          issuingCountryCode: 'RS',
          expiresOn: '2029-01-01',
          createdAt: JETZT,
          updatedAt: JETZT,
        },
      ],
      createdAt: JETZT,
      updatedAt: JETZT,
    })
    const b = travellerLegacyLesen({
      clientRef: 'traveller:1',
      citizenships: [
        { clientRef: 'citizenship:RS', countryCode: 'RS', createdAt: JETZT, updatedAt: JETZT },
        { clientRef: 'citizenship:CH', countryCode: 'CH', createdAt: JETZT, updatedAt: JETZT },
      ],
      documents: [
        {
          clientRef: 'document:passport:RS',
          documentType: 'passport',
          issuingCountryCode: 'RS',
          expiresOn: '2029-01-01',
          createdAt: JETZT,
          updatedAt: JETZT,
        },
        {
          clientRef: 'document:passport:CH',
          documentType: 'passport',
          issuingCountryCode: 'CH',
          expiresOn: '2030-01-01',
          createdAt: JETZT,
          updatedAt: JETZT,
        },
      ],
      createdAt: JETZT,
      updatedAt: JETZT,
    })
    assert.equal(travellerCredentialFingerprint(a!), travellerCredentialFingerprint(b!))
  })

  test('Add/Remove Citizenship ändert den Fingerprint, Traveller B bleibt isoliert', () => {
    const a = travellerLegacyLesen({
      clientRef: 'traveller:1',
      nationalityCountryCode: 'CH',
      createdAt: JETZT,
      updatedAt: JETZT,
    })
    const a2 = travellerLegacyLesen({
      clientRef: 'traveller:1',
      citizenships: [
        { clientRef: 'citizenship:CH', countryCode: 'CH', createdAt: JETZT, updatedAt: JETZT },
        { clientRef: 'citizenship:RS', countryCode: 'RS', createdAt: JETZT, updatedAt: JETZT },
      ],
      createdAt: JETZT,
      updatedAt: JETZT,
    })
    const b = travellerLegacyLesen({
      clientRef: 'traveller:2',
      nationalityCountryCode: 'CH',
      createdAt: JETZT,
      updatedAt: JETZT,
    })
    assert.notEqual(travellerCredentialFingerprint(a!), travellerCredentialFingerprint(a2!))
    assert.notEqual(travellerCredentialFingerprint(a!), travellerCredentialFingerprint(b!))
    assert.notEqual(
      partyCredentialFingerprint([a!, b!]),
      partyCredentialFingerprint([a2!, b!]),
    )
  })

  test('erfindet kein Dokument aus einer Staatsbürgerschaft', () => {
    const traveller = travellerLegacyLesen({
      clientRef: 'traveller:1',
      nationalityCountryCode: 'CH',
      createdAt: JETZT,
      updatedAt: JETZT,
    })
    const optionen = credentialOptionsAus(traveller!)
    assert.equal(optionen.length, 1)
    assert.equal(optionen[0]?.document, null)
    assert.equal(optionen[0]?.optionRef, 'traveller:1:none')
  })
})
