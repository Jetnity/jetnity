// lib/readiness/bezeichnungen.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  officialFreshnessText,
  officialListeHinweis,
  officialPruefungAusLage,
} from '@/lib/readiness/bezeichnungen'

describe('Official-Copy folgt Status und Freshness', () => {
  test('Provider unavailable bleibt ehrlich', () => {
    assert.match(
      officialPruefungAusLage([{ freshness: 'provider_unavailable', status: 'unavailable', missingFacts: [] }]),
      /Automatische Einreiseprüfung derzeit nicht verfügbar/,
    )
  })

  test('Missing Facts statt nur unavailable', () => {
    assert.match(
      officialPruefungAusLage([
        { freshness: 'provider_unavailable', status: 'insufficient_context', missingFacts: ['nationality'] },
      ]),
      /fehlen noch Angaben/,
    )
  })

  test('current Evidence behauptet nicht unavailable', () => {
    const text = officialPruefungAusLage([{ freshness: 'current', status: 'current', missingFacts: [] }])
    assert.equal(text, officialFreshnessText('current'))
    assert.doesNotMatch(text, /nicht verfügbar/)
    assert.doesNotMatch(text, /Reise ist bereit|reisebereit/i)
  })

  test('stale und recheck fordern erneute Prüfung', () => {
    assert.match(officialPruefungAusLage([{ freshness: 'stale', status: 'unknown', missingFacts: [] }]), /erneut prüfen/)
    assert.match(
      officialPruefungAusLage([{ freshness: 'recheck_needed', status: 'unknown', missingFacts: [] }]),
      /erneut prüfen/,
    )
  })

  test('temporär unavailable nennt die Quelle', () => {
    assert.match(
      officialPruefungAusLage([
        { freshness: 'source_temporarily_unavailable', status: 'unknown', missingFacts: [] },
      ]),
      /nicht erreichbar/,
    )
  })

  test('Listenhinweis folgt current Evidence und behauptet keinen fehlenden Provider', () => {
    const text = officialListeHinweis([
      {
        travellerClientRef: 'traveller:1',
        destinationCountryCode: 'TH',
        transitCountryCode: null,
        requirementType: 'visa',
        result: 'required',
        status: 'current',
        freshness: 'current',
        officialClass: 'requirement',
        missingFacts: [],
        evidence: {
          provider: 'test',
          authority: 'Test',
          sourceUrl: 'https://example.test/visa',
          checkedAt: '2026-08-22T08:00:00.000Z',
          validFrom: null,
          validUntil: null,
          ruleReference: null,
          contextFingerprint: 'off',
        },
        action: { kind: 'open_official_source', href: 'https://example.test/visa' },
      },
    ])
    assert.match(text, /geprüft/)
    assert.doesNotMatch(text, /nicht verfügbar|Ohne Provider/i)
  })
})
