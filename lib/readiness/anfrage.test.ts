// lib/readiness/anfrage.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  readinessBegrenztLesen,
  readinessContentLengthUeberschritten,
  readinessHttpHeader,
  readinessInhaltstypOk,
  readinessKoerperLesen,
} from '@/lib/readiness/anfrage'
import { officialRequirementsPruefen, requirementsEvaluationsPruefen } from '@/lib/readiness/anforderungen'
import { readinessAnfrageErlaubt, readinessRateLeeren } from '@/lib/readiness/rate-limit'
import type { RequirementsAnfrage, RequirementsProvider } from '@/lib/readiness/provider'
import { readinessAnforderungAnfrageSchema } from '@/lib/readiness/schema'

describe('Readiness-API-Hülle', () => {
  test('Body-Cap über Content-Length', () => {
    assert.equal(readinessContentLengthUeberschritten('8193'), true)
    assert.equal(readinessContentLengthUeberschritten('100'), false)
  })

  test('Body-Cap beim Lesen', async () => {
    const bytes = new Uint8Array(9000).fill(65)
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes)
        controller.close()
      },
    })
    const gelesen = await readinessBegrenztLesen(body, 100)
    assert.equal(gelesen.ok, false)
    if (!gelesen.ok) assert.equal(gelesen.status, 413)
  })

  test('Antworten sind privat und nicht öffentlich gecacht', () => {
    assert.equal(readinessHttpHeader()['cache-control'], 'private, no-store')
  })

  test('nur application/json', () => {
    assert.equal(readinessInhaltstypOk('application/json'), true)
    assert.equal(readinessInhaltstypOk('text/plain'), false)
  })

  test('ungültiges JSON', () => {
    const gelesen = readinessKoerperLesen('{')
    assert.equal(gelesen.ok, false)
  })

  test('Rate-Limit blockiert nach zu vielen Anfragen', () => {
    readinessRateLeeren()
    let begrenzt = false
    for (let i = 0; i < 25; i += 1) {
      const ergebnis = readinessAnfrageErlaubt('test-ip', () => 1_000)
      if (!ergebnis.ok) {
        begrenzt = true
        assert.ok(ergebnis.retryAfterSec > 0)
        break
      }
    }
    assert.equal(begrenzt, true)
    readinessRateLeeren()
  })

  test('Browser kann official Evidence nicht vortäuschen', async () => {
    const geprueft = readinessAnforderungAnfrageSchema.safeParse({
      destinationCountryCode: 'TH',
      officialResult: 'not_required',
      authority: 'Fake',
    })
    assert.equal(geprueft.success, true)
    const official = officialRequirementsPruefen(geprueft.success ? geprueft.data : {})
    assert.equal(official.result, 'unknown')
    assert.equal(official.authority, null)
    const evaluations = await requirementsEvaluationsPruefen(geprueft.success ? geprueft.data : {})
    assert.ok(evaluations.length > 1)
    assert.ok(evaluations.every((eintrag) => eintrag.result === 'unknown'))
  })

  test('API-Evaluations kollabieren nicht auf den ersten Treffer', async () => {
    const evaluations = await requirementsEvaluationsPruefen({
      destinationCountryCodes: ['TH', 'JP'],
      startDate: '2026-09-12',
      party: [
        { clientRef: 'traveller:1', nationalityCountryCode: 'CH' },
        { clientRef: 'traveller:2', nationalityCountryCode: 'DE' },
      ],
    })
    const visa = evaluations.filter((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(visa.length, 4)
    assert.ok(evaluations.some((eintrag) => eintrag.requirementType === 'passport'))
    assert.ok(evaluations.every((eintrag) => eintrag.result === 'unknown'))
  })

  test('gültiger plus ungültiger Traveller bleibt fail-closed', async () => {
    const geprueft = readinessAnforderungAnfrageSchema.safeParse({
      destinationCountryCode: 'TH',
      party: [
        { clientRef: 'traveller:1', nationalityCountryCode: 'CH' },
        { label: 'ohne-ref' },
      ],
    })
    assert.equal(geprueft.success, false)

    const evaluations = await requirementsEvaluationsPruefen({
      destinationCountryCode: 'TH',
      party: [
        { clientRef: 'traveller:1', nationalityCountryCode: 'CH' },
        { label: 'ohne-ref' },
      ],
    })
    assert.equal(
      evaluations.some((eintrag) => (eintrag.evidence.contextFingerprint ?? '').includes('cit=CH')),
      false,
    )
  })

  test('malformed Citizenship- oder Document-Child bleibt fail-closed', () => {
    assert.equal(
      readinessAnforderungAnfrageSchema.safeParse({
        destinationCountryCode: 'TH',
        party: [
          {
            clientRef: 'traveller:1',
            citizenships: [{ countryCode: 'CH' }, { land: 'RS' }],
          },
        ],
      }).success,
      false,
    )
    assert.equal(
      readinessAnforderungAnfrageSchema.safeParse({
        destinationCountryCode: 'TH',
        party: [
          {
            clientRef: 'traveller:1',
            documents: [
              { documentType: 'passport', issuingCountryCode: 'CH' },
              { documentType: 'pass' },
            ],
          },
        ],
      }).success,
      false,
    )
  })

  test('falsch typisierte Canonical-Children lösen keinen Legacy-Fallback aus', () => {
    const geprueft = readinessAnforderungAnfrageSchema.safeParse({
      destinationCountryCode: 'TH',
      party: [{ clientRef: 'traveller:1', nationalityCountryCode: 'CH', citizenships: 'kaputt' }],
    })
    assert.equal(geprueft.success, false)
  })

  test('überlange oder doppelte Children werden nicht still gekürzt', () => {
    assert.equal(
      readinessAnforderungAnfrageSchema.safeParse({
        destinationCountryCode: 'TH',
        party: [
          {
            clientRef: 'traveller:1',
            citizenships: Array.from({ length: 9 }, (_, index) => ({
              countryCode: `A${index}`,
            })),
          },
        ],
      }).success,
      false,
    )
    assert.equal(
      readinessAnforderungAnfrageSchema.safeParse({
        destinationCountryCode: 'TH',
        party: [
          {
            clientRef: 'traveller:1',
            citizenships: [
              { countryCode: 'CH' },
              { countryCode: 'CH' },
            ],
          },
        ],
      }).success,
      false,
    )
  })

  test('malformed Legacy-Singularfelder bleiben fail-closed und erreichen den Provider nicht', async () => {
    const gesehen: RequirementsAnfrage[] = []
    const provider: RequirementsProvider = {
      name: 'test-double',
      async evaluate(anfrage) {
        gesehen.push(anfrage)
        return []
      },
    }
    const faelle = [
      { clientRef: 'traveller:1', documentType: 'foobar' },
      { clientRef: 'traveller:1', nationalityCountryCode: 'CH', documentExpiresOn: 'kaputt' },
      { clientRef: 'traveller:1', nationalityCountryCode: 'Schweiz' },
      { clientRef: 'traveller:1', residenceCountryCode: 41 },
      { clientRef: 'traveller:1', documentIssuingCountryCode: 'CHH' },
    ]
    for (const party of faelle) {
      assert.equal(
        readinessAnforderungAnfrageSchema.safeParse({
          destinationCountryCode: 'TH',
          party: [party],
        }).success,
        false,
      )
      gesehen.length = 0
      await requirementsEvaluationsPruefen(
        {
          destinationCountryCode: 'TH',
          party: [party],
        },
        provider,
      )
      for (const anfrage of gesehen) {
        for (const traveller of anfrage.travellers) {
          assert.equal(
            traveller.documents.some((document) => (document.documentType as string) === 'foobar'),
            false,
          )
          assert.equal(
            traveller.documents.some((document) => document.expiresOn === 'kaputt'),
            false,
          )
          assert.equal(traveller.citizenshipCountryCodes.includes('Schweiz'), false)
          assert.equal(
            traveller.credentialOptions.some((option) => (option.documentType as string) === 'foobar'),
            false,
          )
        }
      }
    }
  })

  test('Legacy-Form ohne Canonical-Properties bleibt an der API gültig', () => {
    const geprueft = readinessAnforderungAnfrageSchema.safeParse({
      destinationCountryCode: 'TH',
      party: [
        {
          clientRef: 'traveller:1',
          nationalityCountryCode: 'CH',
          residenceCountryCode: 'CH',
          documentType: 'passport',
          documentIssuingCountryCode: 'CH',
          documentExpiresOn: '2030-01-01',
        },
      ],
    })
    assert.equal(geprueft.success, true)
    assert.equal(geprueft.success ? geprueft.data.party[0]?.citizenships[0]?.countryCode : null, 'CH')
    assert.equal(geprueft.success ? geprueft.data.party[0]?.documents[0]?.documentType : null, 'passport')
    assert.equal(geprueft.success ? geprueft.data.party[0]?.documents[0]?.expiresOn : null, '2030-01-01')
  })

  test('malformed Party bleibt fail-closed', () => {
    const geprueft = readinessAnforderungAnfrageSchema.safeParse({
      destinationCountryCode: 'TH',
      party: [null, { clientRef: 'traveller:1', nationalityCountryCode: 'CH' }],
    })
    assert.equal(geprueft.success, false)
  })

  test('Reisendenanzahl ohne Party erzeugt getrennte Slots', async () => {
    const evaluations = await requirementsEvaluationsPruefen({
      destinationCountryCodes: ['TH', 'JP'],
      travellers: 2,
      startDate: '2026-09-12',
    })
    const visa = evaluations.filter((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(visa.length, 4)
    assert.deepEqual(
      [...new Set(visa.map((eintrag) => eintrag.travellerClientRef))].sort(),
      ['traveller:1', 'traveller:2'],
    )
  })
})
