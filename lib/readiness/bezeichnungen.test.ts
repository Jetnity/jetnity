// lib/readiness/bezeichnungen.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  officialActionZweckText,
  officialFreshnessText,
  officialListeHinweis,
  officialPruefungAusLage,
  officialTravellerErgebnisText,
} from '@/lib/readiness/bezeichnungen'
import { visaModeLesen, type OfficialEvaluation } from '@/lib/readiness/official'

function evaluation(teil: Partial<OfficialEvaluation> & Pick<OfficialEvaluation, 'result' | 'status' | 'freshness'>): OfficialEvaluation {
  const requirementType = teil.requirementType ?? 'visa'
  return {
    travellerClientRef: 'traveller:1',
    destinationCountryCode: 'TH',
    transitCountryCode: null,
    requirementType,
    officialClass: 'requirement',
    missingFacts: [],
    evidence: {
      provider: 'test',
      authority: 'Test',
      sourceUrl: null,
      checkedAt: '2026-08-22T08:00:00.000Z',
      validFrom: null,
      validUntil: null,
      ruleReference: null,
      contextFingerprint: 'off',
    },
    action: null,
    temporalRule: null,
    ...teil,
    visaMode: visaModeLesen(requirementType, teil.visaMode),
  }
}

describe('Official-Copy folgt Status und Freshness', () => {
  test('Action-Labels kommen nur aus strukturiertem Zweck', () => {
    assert.equal(officialActionZweckText('application'), 'Offiziellen Antrag öffnen')
    assert.equal(officialActionZweckText('form'), 'Offizielles Formular öffnen')
    assert.equal(officialActionZweckText('appointment'), 'Offiziellen Termin öffnen')
    assert.equal(officialActionZweckText('information'), 'Offizielle Information öffnen')
    assert.doesNotMatch(officialActionZweckText('application'), /Apply now|Jetzt beantragen|eVisa/i)
  })

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
        visaMode: 'unknown',
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
        action: { kind: 'open_official_action', purpose: 'information', href: 'https://example.test/visa' },
        temporalRule: null,
      },
    ])
    assert.match(text, /geprüft/)
    assert.doesNotMatch(text, /nicht verfügbar|Ohne Provider/i)
  })

  test('Traveller-Ergebnis unterscheidet required, not_required und conditional', () => {
    assert.match(officialTravellerErgebnisText([evaluation({ result: 'required', status: 'current', freshness: 'current' })]), /erforderlich/)
    assert.equal(
      officialTravellerErgebnisText([evaluation({ result: 'not_required', status: 'current', freshness: 'current' })]),
      'Offiziell nicht erforderlich',
    )
    assert.equal(
      officialTravellerErgebnisText([evaluation({ result: 'conditional', status: 'current', freshness: 'current' })]),
      'Offiziell bedingt',
    )
    assert.equal(
      officialTravellerErgebnisText([
        evaluation({ result: 'unknown', status: 'insufficient_context', freshness: 'never_checked', missingFacts: ['residence'] }),
      ]),
      'Für die Prüfung fehlen noch Angaben',
    )
    assert.equal(
      officialTravellerErgebnisText([
        evaluation({ result: 'unknown', status: 'unavailable', freshness: 'provider_unavailable' }),
      ]),
      'Noch nicht automatisch geprüft',
    )
    assert.doesNotMatch(
      officialTravellerErgebnisText([evaluation({ result: 'not_required', status: 'current', freshness: 'current' })]),
      /ungeprüft|Reise ist bereit/i,
    )
  })
})
