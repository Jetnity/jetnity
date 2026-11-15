import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { V3CustomerInformationDetail } from '../customer-information/details'
import { presentV3CustomerDetail } from './customer-detail-presentation'

// Presentation fixtures only, never accepted records or source proofs.
const text = (detail: V3CustomerInformationDetail) => presentV3CustomerDetail(detail).map(row => row.text).join('\n')
const amount = { value: '12.3400', currency: 'CHF', basis: 'per_application' as const }
const officialAction = { source: { sourceId: 'synthetic', contentItemId: 'synthetic-publication', representationId: 'synthetic-original',
  contentItemVersion: 1, representationVersion: 1, identityProfileId: 'synthetic-profile', identityProfileVersion: 1 },
  purpose: 'form' as const, href: 'https://destination.example/synthetic-form' }

test('required and recommended vaccines remain distinct and do not infer null doses, timing or certificates', () => {
  for (const classification of ['required', 'recommended'] as const) {
    const result = text({ kind: 'vaccination_details', classification, vaccines: [{ vaccineLabel: 'Synthetischer Impfstoff',
      diseaseLabel: 'Synthetische Erkrankung', minimumDoses: null, beforeEntry: null, certificateRequired: null }] })
    assert.match(result, classification === 'required' ? /Pflichtimpfung/ : /Empfohlene Impfung/)
    assert.match(result, /Synthetischer Impfstoff · Synthetische Erkrankung/)
    assert.match(result, /Mindestanzahl Dosen: Derzeit nicht verfügbar/)
    assert.match(result, /Zeitabstand vor Einreise: Derzeit nicht verfügbar/)
    assert.match(result, /Impfnachweis: Derzeit nicht verfügbar/)
    assert.doesNotMatch(result, /nicht erforderlich/)
  }
  const exact = text({ kind: 'vaccination_details', classification: 'required', vaccines: [{ vaccineLabel: 'Test', diseaseLabel: 'Test',
    minimumDoses: 2, beforeEntry: { value: 10, unit: 'days' }, certificateRequired: false }] })
  assert.match(exact, /Mindestanzahl Dosen: 2/)
  assert.match(exact, /Zeitabstand vor Einreise: 10 Tage/)
  assert.match(exact, /Impfnachweis nicht erforderlich/)
})

test('health measures retain recommendation versus duty, duration and proof uncertainty', () => {
  const result = text({ kind: 'health_measures', measures: [
    { measure: 'test', classification: 'required', measureLabel: 'Synthetischer Test', duration: null, proofRequired: true },
    { measure: 'quarantine', classification: 'recommended', measureLabel: 'Synthetische Quarantäne', duration: { value: 1, unit: 'days' }, proofRequired: null },
  ] })
  assert.match(result, /Pflicht: Test · Synthetischer Test/)
  assert.match(result, /Empfehlung: Quarantäne/)
  assert.match(result, /Dauer: Derzeit nicht verfügbar/)
  assert.match(result, /Dauer: 1 Tag/)
  assert.match(result, /Nachweispflicht: Derzeit nicht verfügbar/)
})

test('form title, exact currency amount and basis, deadline and official action remain visible', () => {
  const detail: V3CustomerInformationDetail = { kind: 'entry_form_details', formTitle: 'Synthetisches Ankunftsformular',
    completion: 'required', cost: { status: 'specified', amount }, action: officialAction,
    due: { relation: 'before_entry', offset: { value: 3, unit: 'days' } } }
  const rows = presentV3CustomerDetail(detail), output = rows.map(row => row.text).join('\n')
  for (const expected of [/Formularname: Synthetisches Ankunftsformular/, /Formular ist erforderlich/,
    /Formularkosten: 12\.3400 CHF pro Antrag/, /Zeitpunkt: vor der Einreise/, /Zeitlicher Abstand: 3 Tage/]) assert.match(output, expected)
  assert.deepEqual(rows.filter(row => row.href !== null).map(row => row.href), [officialAction.href])
  assert.match(text({ ...detail, cost: { status: 'unavailable' }, action: null, due: null }), /Formularkosten: Derzeit nicht verfügbar/)
  assert.match(text({ ...detail, cost: { status: 'free' } }), /Formularkosten: Kostenlos/)
})

test('fees distinguish an explicit free amount from unknown and retain payment timing', () => {
  const base = { kind: 'fee_details' as const, feeLabel: 'Synthetische Gebühr', purpose: 'arrival' as const,
    paymentTiming: 'unavailable' as const }
  assert.match(text({ ...base, cost: { status: 'free' } }), /Betrag: Kostenlos/)
  assert.match(text({ ...base, cost: { status: 'unavailable' } }), /Betrag: Derzeit nicht verfügbar/)
  assert.match(text({ ...base, cost: { status: 'specified', amount }, paymentTiming: 'on_arrival' }), /Zahlungszeitpunkt: bei Ankunft/)
})

test('fraud warning gives the exact stated kind and no invented suspect website', () => {
  const rows = presentV3CustomerDetail({ kind: 'fraud_warning', warning: 'imitation_website', officialAction })
  assert.match(rows[0].text, /nachgeahmten Behördenwebseiten/)
  assert.equal(rows[1].href, officialAction.href)
  const withoutAction = text({ kind: 'fraud_warning', warning: 'excessive_fees', officialAction: null })
  assert.match(withoutAction, /überhöhten Gebühren/)
  assert.match(withoutAction, /Amtlicher Link zum Erledigen: Derzeit nicht verfügbar/)
})

test('ticket and financial requirements preserve alternatives, proof forms and unknown minimum', () => {
  assert.equal(text({ kind: 'ticket_details', effect: 'required', ticket: 'return_or_onward' }), 'Rückreise- oder Weiterreiseticket erforderlich')
  const result = text({ kind: 'financial_means_details', effect: 'required', minimum: null, acceptedProofs: [] })
  assert.match(result, /Mindestbetrag: Derzeit nicht verfügbar/)
  assert.match(result, /Anerkannte Nachweise: Derzeit nicht verfügbar/)
  assert.match(text({ kind: 'financial_means_details', effect: 'required', minimum: { ...amount, basis: 'per_day' },
    acceptedProofs: ['bank_statement', 'sponsorship'] }), /12\.3400 CHF pro Tag[\s\S]*Kontoauszug, Kostenübernahme/)
})

test('minors and consent retain the exact age boundary, documents and unknown formalities', () => {
  const minor = text({ kind: 'minor_travel_details', appliesBelowAge: 18, documents: ['own_travel_document', 'parental_consent'] })
  assert.match(minor, /unter 18 Jahren/)
  assert.match(minor, /eigenes Reisedokument/)
  const consent = text({ kind: 'parental_consent_details', effect: 'required', signatories: 'non_travelling_legal_guardian',
    notarisationRequired: null, translationRequired: false, officialForm: null })
  assert.match(consent, /nicht mitreisende sorgeberechtigte Person/)
  assert.match(consent, /Notarielle Beglaubigung: Derzeit nicht verfügbar/)
  assert.match(consent, /Übersetzung nicht erforderlich/)
  assert.match(consent, /Amtliches Formular zur Einverständniserklärung: Derzeit nicht verfügbar/)
})

test('customs preserves category, disposition and units without inventing allowances or action links', () => {
  const result = text({ kind: 'customs_details', category: 'medicines', disposition: 'permit_required',
    allowance: null, monetaryThreshold: null, officialAction: null })
  assert.match(result, /Zollkategorie: Medikamente/)
  assert.match(result, /Bewilligung erforderlich/)
  assert.match(result, /Mengenangabe: Derzeit nicht verfügbar/)
  assert.match(result, /Geldbetrag: Derzeit nicht verfügbar/)
  assert.match(text({ kind: 'customs_details', category: 'alcohol', disposition: 'allowance',
    allowance: { value: '1.5', unit: 'litres' }, monetaryThreshold: null, officialAction: null }), /Mengenangabe: 1\.5 l/)
})

test('document alternatives and dual nationality never pick a default passport', () => {
  assert.match(text({ kind: 'document_alternative_details', acceptedDocument: 'national_id', replacesPassport: true, documentClass: 'ordinary' }),
    /Identitätskarte[\s\S]*kann den Reisepass ersetzen/)
  const result = text({ kind: 'dual_national_details', destinationNationalityHeld: true, entryDocument: 'destination_passport', departureDocument: null })
  assert.match(result, /zusätzlicher Staatsangehörigkeit des Ziellandes/)
  assert.match(result, /Einreisedokument: Reisepass des Ziellandes/)
  assert.match(result, /Ausreisedokument: Derzeit nicht verfügbar/)
})

test('change notice keeps announced and effective dates distinct and does not equate a version with a change', () => {
  const result = text({ kind: 'change_notice', changedOn: '2026-11-15', effectiveFrom: '2027-01-01', change: 'fee_changed',
    changedTopic: 'Synthetische Formulargebühr', priorRuleReference: null, announcement: null })
  assert.match(result, /Änderungsdatum: 2026-11-15/)
  assert.match(result, /Wirksam ab: 2027-01-01/)
  assert.match(result, /Amtliche Bekanntmachung: Derzeit nicht verfügbar/)
})
