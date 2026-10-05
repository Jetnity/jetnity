// lib/readiness/dokument-formular.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  citizenshipClientRefFuer,
  dokumenteAlsPayload,
  dokumenteAusTraveller,
  dokumenteNachCitizenships,
  neueDokumentClientRef,
} from '@/lib/readiness/dokument-formular'
import type { TripTravellerDocument } from '@/types/trips'

const JETZT = '2026-08-22T10:00:00.000Z'

function dokument(teil: Partial<TripTravellerDocument> & Pick<TripTravellerDocument, 'clientRef'>): TripTravellerDocument {
  return {
    id: teil.id ?? teil.clientRef,
    documentType: 'passport',
    issuingCountryCode: 'US',
    citizenshipClientRef: 'citizenship:RS',
    expiresOn: '2030-01-01',
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

describe('Dokument-Formular', () => {
  test('bestehende Relation und clientRef bleiben beim Laden erhalten', () => {
    const zeilen = dokumenteAusTraveller([
      dokument({ clientRef: 'document:stabil-rs', citizenshipClientRef: 'citizenship:RS' }),
    ])
    assert.equal(zeilen[0]?.clientRef, 'document:stabil-rs')
    assert.equal(zeilen[0]?.citizenshipClientRef, 'citizenship:RS')
    assert.equal(zeilen[0]?.issuingCountryCode, 'US')
  })

  test('Edit/Save erhält Relation und ersetzt clientRef nicht aus Typ/Issuer', () => {
    const payload = dokumenteAlsPayload(
      [
        {
          clientRef: 'document:stabil-rs',
          documentType: 'passport',
          issuingCountryCode: 'DE',
          expiresOn: '2031-01-01',
          citizenshipClientRef: 'citizenship:RS',
        },
      ],
      ['CH', 'RS'],
    )
    assert.equal(payload[0]?.clientRef, 'document:stabil-rs')
    assert.equal(payload[0]?.citizenshipClientRef, 'citizenship:RS')
    assert.equal(payload[0]?.issuingCountryCode, 'DE')
  })

  test('Relation kann bewusst CH → RS geändert oder auf null gesetzt werden', () => {
    const nachRs = dokumenteAlsPayload(
      [
        {
          clientRef: 'document:stabil',
          documentType: 'passport',
          issuingCountryCode: 'US',
          expiresOn: '2030-01-01',
          citizenshipClientRef: 'citizenship:RS',
        },
      ],
      ['CH', 'RS'],
    )
    assert.equal(nachRs[0]?.citizenshipClientRef, 'citizenship:RS')

    const ohne = dokumenteAlsPayload(
      [
        {
          clientRef: 'document:stabil',
          documentType: 'passport',
          issuingCountryCode: 'US',
          expiresOn: '2030-01-01',
          citizenshipClientRef: null,
        },
      ],
      ['CH', 'RS'],
    )
    assert.equal(ohne[0]?.citizenshipClientRef, null)
  })

  test('entfernte Citizenship hinterlässt keine Document-Ref', () => {
    const zeilen = dokumenteNachCitizenships(
      [
        {
          clientRef: 'document:stabil-rs',
          documentType: 'passport',
          issuingCountryCode: 'US',
          expiresOn: '2030-01-01',
          citizenshipClientRef: 'citizenship:RS',
        },
      ],
      ['CH'],
    )
    assert.equal(zeilen[0]?.citizenshipClientRef, null)
    assert.equal(zeilen[0]?.clientRef, 'document:stabil-rs')
  })

  test('zwei Dokumente desselben Typs/Ausstellerlands behalten unterschiedliche clientRefs', () => {
    const erste = neueDokumentClientRef(() => 'aaaa-1111')
    const zweite = neueDokumentClientRef(() => 'bbbb-2222')
    assert.notEqual(erste, zweite)
    const payload = dokumenteAlsPayload(
      [
        {
          clientRef: erste,
          documentType: 'passport',
          issuingCountryCode: 'CH',
          expiresOn: '2030-01-01',
          citizenshipClientRef: null,
        },
        {
          clientRef: zweite,
          documentType: 'passport',
          issuingCountryCode: 'CH',
          expiresOn: '2031-01-01',
          citizenshipClientRef: null,
        },
      ],
      ['CH'],
    )
    assert.equal(payload.length, 2)
    assert.equal(payload[0]?.clientRef, erste)
    assert.equal(payload[1]?.clientRef, zweite)
    assert.notEqual(payload[0]?.clientRef, `document:passport:CH`)
  })

  test('Issuer wird nicht zur Citizenship', () => {
    const payload = dokumenteAlsPayload(
      [
        {
          clientRef: 'document:stabil',
          documentType: 'passport',
          issuingCountryCode: 'US',
          expiresOn: '2030-01-01',
          citizenshipClientRef: null,
        },
      ],
      ['CH'],
    )
    assert.equal(payload[0]?.citizenshipClientRef, null)
    assert.notEqual(payload[0]?.citizenshipClientRef, citizenshipClientRefFuer('US'))
  })
})
