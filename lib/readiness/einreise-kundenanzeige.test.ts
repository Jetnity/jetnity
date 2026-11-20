import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import EinreiseKundenanzeige from '@/components/readiness/EinreiseKundenanzeige'

import {
  EINREISE_AMPEL_TEXT,
  EINREISE_WEITERE_THEMEN,
  einreiseAusBesucher,
  einreiseKundenanzeige,
  einreiseUebersicht,
  type EinreiseSlot,
} from '@/lib/readiness/einreise-kundenanzeige'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import type { TripTraveller } from '@/types/trips'

const ZEIT = '2026-11-01T08:00:00.000Z'

function evaluation(teil: Partial<OfficialEvaluation> & Pick<OfficialEvaluation, 'requirementType' | 'result'>): OfficialEvaluation {
  return {
    travellerClientRef: 'traveller:1',
    credentialOptionRef: 'traveller:1:pass-ch',
    destinationCountryCode: 'ID',
    transitCountryCode: null,
    status: 'current',
    freshness: 'current',
    officialClass: 'requirement',
    visaMode: teil.requirementType === 'visa' ? 'unknown' : null,
    missingFacts: [],
    evidence: {
      provider: null,
      authority: 'Auditbehörde',
      sourceUrl: 'https://example.test/quelle',
      checkedAt: ZEIT,
      validFrom: null,
      validUntil: null,
      ruleReference: null,
      contextFingerprint: 'test',
    },
    action: null,
    temporalRule: null,
    ...teil,
  }
}

function person(clientRef: string, label: string, dokument: string): TripTraveller {
  return {
    id: clientRef,
    clientRef,
    label,
    residenceCountryCode: null,
    createdAt: ZEIT,
    updatedAt: ZEIT,
    citizenships: [],
    documents: [{
      id: dokument,
      clientRef: dokument,
      documentType: 'passport',
      issuingCountryCode: dokument.endsWith('rs') ? 'RS' : 'CH',
      citizenshipClientRef: null,
      expiresOn: '2030-01-01',
      createdAt: ZEIT,
      updatedAt: ZEIT,
    }],
  }
}

function slot(traveller: TripTraveller): EinreiseSlot {
  return { clientRef: traveller.clientRef, label: traveller.label ?? 'Reisende', applicable: true, traveller }
}

test('Grün nur bei frischer, ausdrücklicher Visumbefreiung für diesen Pass', () => {
  const reisende = person('traveller:1', 'Reisende 1', 'pass-ch')
  const anzeige = einreiseKundenanzeige({
    evaluations: [evaluation({ requirementType: 'visa', result: 'not_required', visaMode: 'visa_exempt' })],
    party: [reisende],
    slots: [slot(reisende)],
    laender: ['ID'],
  })
  assert.equal(anzeige.paare.length, 1)
  assert.equal(anzeige.paare[0]?.ampel, 'gruen')
  assert.equal(anzeige.paare[0]?.ampelText, EINREISE_AMPEL_TEXT.gruen)
  assert.equal(anzeige.paare[0]?.todos.length, 0)
  assert.equal(anzeige.satz, 'Für die erfassten Reisenden und Pässe ist kein Visum nötig.')
  assert.match(anzeige.standSatz, /Stand 01\.11\.2026/)
  assert.doesNotMatch(anzeige.standSatz, /16\.11\.2026/)
})

test('Nicht erforderlich ohne Visumbefreiung bleibt neutral', () => {
  const reisende = person('traveller:1', 'Reisende 1', 'pass-ch')
  const anzeige = einreiseKundenanzeige({
    evaluations: [evaluation({ requirementType: 'visa', result: 'not_required', visaMode: 'unknown' })],
    party: [reisende],
    slots: [slot(reisende)],
    laender: ['ID'],
  })
  assert.equal(anzeige.paare[0]?.ampel, 'neutral')
  assert.equal(anzeige.satz, 'Die Visumlage ist noch nicht bestätigt.')
})

test('bestätigte Visumpflicht wird orange und ist ein To-do, ohne erfundenen Link', () => {
  const reisende = person('traveller:1', 'Reisende 1', 'pass-ch')
  const anzeige = einreiseKundenanzeige({
    evaluations: [evaluation({
      requirementType: 'visa',
      result: 'required',
      visaMode: 'visa_before_travel',
      action: { kind: 'open_official_action', purpose: 'application', href: 'https://example.test/antrag' },
    })],
    party: [reisende],
    slots: [slot(reisende)],
    laender: ['ID'],
  })
  assert.equal(anzeige.paare[0]?.ampel, 'orange')
  assert.equal(anzeige.paare[0]?.antragHref, 'https://example.test/antrag')
  assert.equal(anzeige.paare[0]?.todos.length, 1)
  assert.equal(anzeige.paare[0]?.todos[0]?.text, EINREISE_AMPEL_TEXT.orange)
})

test('fehlender Antragslink wird nicht ersetzt', () => {
  const reisende = person('traveller:1', 'Reisende 1', 'pass-ch')
  const anzeige = einreiseKundenanzeige({
    evaluations: [evaluation({ requirementType: 'visa', result: 'required', visaMode: 'electronic_visa' })],
    party: [reisende],
    slots: [slot(reisende)],
    laender: ['ID'],
  })
  assert.equal(anzeige.paare[0]?.ampel, 'orange')
  assert.equal(anzeige.paare[0]?.antragHref, null)
})

test('ein visumfreier Pass macht das Zielland nicht für alle frei', () => {
  const erste = person('traveller:1', 'Reisende 1', 'pass-ch')
  const zweite = person('traveller:2', 'Reisende 2', 'pass-de')
  const anzeige = einreiseKundenanzeige({
    evaluations: [evaluation({ requirementType: 'visa', result: 'not_required', visaMode: 'visa_exempt' })],
    party: [erste, zweite],
    slots: [slot(erste), slot({ ...zweite, documents: [{ ...zweite.documents[0]!, clientRef: 'pass-de' }] })],
    laender: ['ID'],
  })
  const lichter = anzeige.paare.map((paar) => paar.ampel)
  assert.deepEqual(lichter, ['gruen', 'neutral'])
  assert.equal(einreiseUebersicht(anzeige)[0]?.ampel, 'neutral')
  assert.notEqual(anzeige.satz, 'Für die erfassten Reisenden und Pässe ist kein Visum nötig.')
})

test('zwei getrennte Pässe bleiben getrennte Zeilen', () => {
  const reisende = person('traveller:1', 'Reisende 1', 'pass-ch')
  reisende.documents.push({
    ...reisende.documents[0]!,
    id: 'pass-rs',
    clientRef: 'pass-rs',
    issuingCountryCode: 'RS',
  })
  const anzeige = einreiseKundenanzeige({
    evaluations: [evaluation({ requirementType: 'visa', result: 'not_required', visaMode: 'visa_exempt' })],
    party: [reisende],
    slots: [slot(reisende)],
    laender: ['ID'],
  })
  assert.equal(anzeige.paare.length, 2)
  assert.equal(anzeige.paare.filter((paar) => paar.ampel === 'gruen').length, 1)
  assert.equal(anzeige.paare.filter((paar) => paar.ampel === 'neutral').length, 1)
})

test('widersprüchliche Visa-Aussagen bleiben neutral', () => {
  const reisende = person('traveller:1', 'Reisende 1', 'pass-ch')
  const anzeige = einreiseKundenanzeige({
    evaluations: [
      evaluation({ requirementType: 'visa', result: 'not_required', visaMode: 'visa_exempt' }),
      evaluation({ requirementType: 'visa', result: 'required', visaMode: 'visa_before_travel' }),
    ],
    party: [reisende],
    slots: [slot(reisende)],
    laender: ['ID'],
  })
  assert.equal(anzeige.paare[0]?.ampel, 'neutral')
})

test('abgelaufene Befreiung wird nicht grün und setzt nicht das heutige Datum', () => {
  const reisende = person('traveller:1', 'Reisende 1', 'pass-ch')
  const anzeige = einreiseKundenanzeige({
    evaluations: [evaluation({
      requirementType: 'visa',
      result: 'not_required',
      visaMode: 'visa_exempt',
      freshness: 'stale',
      evidence: {
        provider: null,
        authority: null,
        sourceUrl: null,
        checkedAt: null,
        validFrom: null,
        validUntil: '2020-01-01',
        ruleReference: null,
        contextFingerprint: 'alt',
      },
    })],
    party: [reisende],
    slots: [slot(reisende)],
    laender: ['ID'],
  })
  assert.equal(anzeige.paare[0]?.ampel, 'neutral')
  assert.match(anzeige.standSatz, /Stand derzeit nicht verfügbar/)
  assert.equal(anzeige.paare[0]?.ungeprueft.includes('Einreise und Aufenthalt'), true)
  assert.equal(anzeige.paare[0]?.ungeprueft.includes('Visum'), false)
  assert.equal(anzeige.paare[0]?.platzhalter, true)
})

test('leere Themen stehen in genau einer Liste und erfinden keine Pflicht', () => {
  const anzeige = einreiseKundenanzeige({
    evaluations: [],
    party: [],
    slots: [],
    laender: ['JP'],
  })
  assert.equal(anzeige.paare.length, 1)
  assert.equal(anzeige.paare[0]?.ampel, 'neutral')
  assert.equal(anzeige.paare[0]?.themen.length, 0)
  assert.equal(anzeige.paare[0]?.ungeprueft.includes('Grenze und besondere Situationen'), true)
  assert.equal(anzeige.paare[0]?.ungeprueft.includes('Zoll'), false)
  assert.ok((anzeige.paare[0]?.ungeprueft.length ?? 0) <= 6)
  assert.equal(EINREISE_WEITERE_THEMEN.length > 0, true)
  assert.doesNotMatch(anzeige.paare[0]?.ungeprueft.join(' '), /erforderlich|visumfrei/i)
})

test('Reisende ohne gespeicherte Angaben erscheinen pro Land genau einmal', () => {
  const slots: EinreiseSlot[] = [
    { clientRef: 'traveller:1', label: 'Reisende 1', applicable: true, traveller: null },
    { clientRef: 'traveller:2', label: 'Reisende 2', applicable: true, traveller: null },
  ]
  const ohne = (travellerClientRef: string) => evaluation({
    travellerClientRef,
    credentialOptionRef: `${travellerClientRef}:none`,
    destinationCountryCode: 'TH',
    requirementType: 'visa',
    result: 'unknown',
  })
  const anzeige = einreiseKundenanzeige({
    evaluations: [ohne('traveller:1'), ohne('traveller:2')],
    party: [],
    slots,
    laender: ['TH', 'TH'],
  })
  assert.deepEqual(anzeige.paare.map((paar) => paar.reisende), ['Reisende 1', 'Reisende 2'])
  assert.equal(anzeige.paare.every((paar) => !paar.ungeprueft.includes('Visum')), true)
})

test('eine andere Pass-Option bleibt ohne gespeicherte Angaben eine eigene Karte', () => {
  const anzeige = einreiseKundenanzeige({
    evaluations: [
      evaluation({ credentialOptionRef: 'traveller:1:none', destinationCountryCode: 'TH', requirementType: 'visa', result: 'unknown' }),
      evaluation({ credentialOptionRef: 'traveller:1:pass-ch', destinationCountryCode: 'TH', requirementType: 'visa', result: 'not_required', visaMode: 'visa_exempt' }),
    ],
    party: [],
    slots: [{ clientRef: 'traveller:1', label: 'Reisende 1', applicable: true, traveller: null }],
    laender: ['TH'],
  })
  assert.equal(anzeige.paare.length, 2)
  assert.deepEqual(anzeige.paare.map((paar) => paar.ampel), ['neutral', 'gruen'])
})

test('Besucheransicht erkennt nur den geschlossenen amtlichen Wortlaut', () => {
  const frei = einreiseAusBesucher({
    zielCode: 'DE',
    zielLabel: 'Deutschland',
    zellen: [{
      landCode: 'CH',
      landLabel: 'Schweiz',
      ergebnisse: [{
        status: 'accepted',
        informationTopic: 'visa',
        statements: [{ text: 'Nicht erforderlich · Visumfreie Einreise', when: null, href: null }],
        source: { label: 'Auswärtiges Amt', href: 'https://example.test/aa' },
        checkedAtText: 'Stand vom 02.11.2026, 10:00 UTC',
      }],
    }],
  })
  assert.equal(frei.paare[0]?.ampel, 'gruen')
  assert.match(frei.standSatz, /02\.11\.2026/)
  const offen = einreiseAusBesucher({
    zielCode: 'JP',
    zielLabel: 'Japan',
    zellen: [{ landCode: 'FR', landLabel: 'Frankreich', ergebnisse: [{ status: 'unavailable' }] }],
  })
  assert.equal(offen.paare[0]?.ampel, 'neutral')
  assert.equal(offen.paare[0]?.themen.length, 0)
  assert.match(offen.standSatz, /Stand derzeit nicht verfügbar/)
})

test('CH→DE und ein zweiter Pass bleiben in der Beschriftung getrennt', () => {
  const anzeige = einreiseAusBesucher({
    zielCode: 'DE',
    zielLabel: '🇩🇪 Deutschland',
    zellen: [
      { landCode: 'CH', landLabel: '🇨🇭 Schweiz', ergebnisse: [{ status: 'unavailable' }] },
      { landCode: 'RS', landLabel: '🇷🇸 Serbien', ergebnisse: [{ status: 'unavailable' }] },
    ],
  })
  assert.equal(anzeige.paare.length, 2)
  assert.equal(anzeige.paare[0]?.dokument, 'Schweiz')
  assert.equal(anzeige.paare[0]?.land, 'Deutschland')
  assert.equal(anzeige.paare[1]?.dokument, 'Serbien')
  assert.equal(anzeige.paare[1]?.land, 'Deutschland')
  assert.equal(anzeige.paare[0]?.ampel, 'neutral')
  assert.equal(anzeige.paare[1]?.ampel, 'neutral')
  const html = renderToStaticMarkup(React.createElement(EinreiseKundenanzeige, { anzeige }))
  assert.match(html, /Pass: Schweiz · Ziel: Deutschland/)
  assert.match(html, /Pass: Serbien · Ziel: Deutschland/)
  assert.doesNotMatch(html, /Gewählter Pass/)
  assert.equal(html.split(EINREISE_WEITERE_THEMEN).length - 1, 2)
  assert.doesNotMatch(html, />Zoll</)
})
