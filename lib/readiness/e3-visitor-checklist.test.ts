// lib/readiness/e3-visitor-checklist.test.ts
//
// Entry Requirements E3: lossless visitor checklist presentation.
// Keine neue Official Truth. Kein Provider. Kein Default-Pass.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { landAnzeigeText } from '@/lib/country/darstellung'
import {
  officialAnforderungTitel,
  officialFehlendeAngabenText,
  OFFICIAL_ANFORDERUNG_BEZEICHNUNG,
  OFFICIAL_VISA_MODUS_BEZEICHNUNG,
} from '@/lib/readiness/bezeichnungen'
import {
  officialChecklist,
  officialCredentialLabel,
  officialEvaluationScopeKey,
  officialOrtText,
  officialPresentationAktionen,
  officialPresentationGruppe,
  officialPruefzeitText,
  officialZeileErgebnisText,
  OFFICIAL_PRAESENTATION_GRUPPE_TITEL,
} from '@/lib/readiness/official-presentation'
import { visaModeLesen, type OfficialEvaluation, type OfficialVisaMode } from '@/lib/readiness/official'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { credentialOptionsAus } from '@/lib/readiness/traveller-kontext'
import type { TripTraveller } from '@/types/trips'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

const JETZT = '2026-08-31T08:00:00.000Z'

function traveller(): TripTraveller {
  return {
    id: 'traveller:1',
    clientRef: 'traveller:1',
    label: 'Reisende 1',
    residenceCountryCode: 'DE',
    citizenships: [
      {
        id: 'citizenship:CH',
        clientRef: 'citizenship:CH',
        countryCode: 'CH',
        createdAt: JETZT,
        updatedAt: JETZT,
      },
      {
        id: 'citizenship:HR',
        clientRef: 'citizenship:HR',
        countryCode: 'HR',
        createdAt: JETZT,
        updatedAt: JETZT,
      },
    ],
    documents: [
      {
        id: 'document:passport:CH',
        clientRef: 'document:passport:CH',
        documentType: 'passport',
        issuingCountryCode: 'CH',
        citizenshipClientRef: 'citizenship:CH',
        expiresOn: '2030-01-01',
        createdAt: JETZT,
        updatedAt: JETZT,
      },
      {
        id: 'document:national_id:HR',
        clientRef: 'document:national_id:HR',
        documentType: 'national_id',
        issuingCountryCode: 'HR',
        citizenshipClientRef: 'citizenship:HR',
        expiresOn: '2029-01-01',
        createdAt: JETZT,
        updatedAt: JETZT,
      },
    ],
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

function ev(
  teil: Partial<OfficialEvaluation> &
    Pick<OfficialEvaluation, 'requirementType' | 'result' | 'status' | 'freshness'>,
): OfficialEvaluation {
  const requirementType = teil.requirementType
  return {
    travellerClientRef: 'traveller:1',
    credentialOptionRef: 'traveller:1:document:passport:CH',
    destinationCountryCode: 'TH',
    transitCountryCode: null,
    officialClass: 'requirement',
    missingFacts: [],
    action: null,
    temporalRule: null,
    ...teil,
    requirementType,
    visaMode: visaModeLesen(requirementType, teil.visaMode),
    evidence: {
      provider: 'test',
      authority: 'Test Authority',
      sourceUrl: 'https://example.test/source',
      checkedAt: JETZT,
      validFrom: null,
      validUntil: null,
      ruleReference: null,
      contextFingerprint: 'off',
      ...(teil.evidence ?? {}),
    },
  }
}

function slots() {
  return [{ clientRef: 'traveller:1', label: 'Reisende 1' }]
}

function eintraege(evaluations: OfficialEvaluation[]) {
  return officialChecklist({ evaluations, party: [traveller()], slots: slots() }).flatMap(
    (gruppe) => gruppe.eintraege,
  )
}

function gruppeVon(evaluations: OfficialEvaluation[], id: string) {
  return officialChecklist({ evaluations, party: [traveller()], slots: slots() }).find(
    (gruppe) => gruppe.id === id,
  )
}

describe('Entry Requirements E3 – Visitor Checklist', () => {
  test('1. zwei Credential-Optionen desselben Travellers bleiben getrennt und permutation-stabil', () => {
    const ch = ev({
      requirementType: 'visa',
      result: 'required',
      status: 'current',
      freshness: 'current',
      visaMode: 'electronic_visa',
      credentialOptionRef: 'traveller:1:document:passport:CH',
    })
    const hr = ev({
      requirementType: 'visa',
      result: 'not_required',
      status: 'current',
      freshness: 'current',
      visaMode: 'visa_exempt',
      credentialOptionRef: 'traveller:1:document:national_id:HR',
    })
    const vorwaerts = officialChecklist({
      evaluations: [hr, ch],
      party: [traveller()],
      slots: slots(),
    })
    const rueckwaerts = officialChecklist({
      evaluations: [ch, hr],
      party: [traveller()],
      slots: slots(),
    })
    const keysA = vorwaerts.flatMap((gruppe) => gruppe.eintraege.map((eintrag) => eintrag.scopeKey))
    const keysB = rueckwaerts.flatMap((gruppe) => gruppe.eintraege.map((eintrag) => eintrag.scopeKey))
    assert.deepEqual(keysA, keysB)
    assert.equal(keysA.length, 2)
    assert.notEqual(keysA[0], keysA[1])
    const texte = vorwaerts.flatMap((gruppe) =>
      gruppe.eintraege.map((eintrag) => `${eintrag.credentialLabel}|${eintrag.ergebnisText}|${eintrag.titel}`),
    )
    assert.equal(texte.some((text) => text.includes(landAnzeigeText('CH')) && text.includes('Erforderlich')), true)
    assert.equal(texte.some((text) => text.includes(landAnzeigeText('HR')) && text.includes('Nicht erforderlich')), true)
    assert.equal(
      vorwaerts.some((gruppe) => gruppe.eintraege.length > 1 && gruppe.id === 'vor_abreise'),
      false,
    )
    assert.notEqual(officialPresentationGruppe(ch), officialPresentationGruppe(hr))
  })

  test('2. kein evaluations[0]- oder documents[0]-Fallback in Presentation/UI', () => {
    const presentation = quelle('lib/readiness/official-presentation.ts')
    const ui = quelle('components/trips/Reisevorbereitung.tsx')
    const labels = quelle('lib/readiness/bezeichnungen.ts')
    for (const datei of [presentation, ui, labels]) {
      assert.equal(datei.includes('evaluations[0]'), false)
      assert.equal(datei.includes('documents[0]'), false)
    }
    assert.equal(ui.includes('officialChecklist'), true)
    assert.equal(ui.includes('Offizielle Information öffnen'), false)
  })

  test('3. Visa-Modi sind korrekt beschriftet und gruppiert', () => {
    const faelle: Array<{
      visaMode: OfficialVisaMode
      titel: string
      gruppe: keyof typeof OFFICIAL_PRAESENTATION_GRUPPE_TITEL
    }> = [
      { visaMode: 'visa_exempt', titel: 'Visum · Visumfreie Einreise', gruppe: 'bei_einreise_vor_ort' },
      { visaMode: 'visa_on_arrival', titel: 'Visum · Visa on Arrival', gruppe: 'bei_einreise_vor_ort' },
      { visaMode: 'electronic_visa', titel: 'Visum · E-Visum', gruppe: 'vor_abreise' },
      { visaMode: 'visa_before_travel', titel: 'Visum · Visum vor der Reise', gruppe: 'vor_abreise' },
      { visaMode: 'unknown', titel: 'Visumstatus', gruppe: 'vor_abreise' },
    ]
    for (const fall of faelle) {
      const evaluation = ev({
        requirementType: 'visa',
        result: fall.visaMode === 'visa_exempt' ? 'not_required' : 'required',
        status: 'current',
        freshness: 'current',
        visaMode: fall.visaMode,
      })
      assert.equal(officialAnforderungTitel('visa', fall.visaMode), fall.titel)
      assert.equal(officialPresentationGruppe(evaluation), fall.gruppe)
      const liste = gruppeVon([evaluation], fall.gruppe)
      assert.equal(liste?.eintraege[0]?.titel, fall.titel)
      assert.doesNotMatch(liste?.eintraege[0]?.titel ?? '', /Antrag erledigt|erledigter Antrag/i)
    }
    assert.equal(OFFICIAL_VISA_MODUS_BEZEICHNUNG.unknown, 'Visumstatus')
  })

  test('4. eTA bleibt eigener Requirement-Typ und kein Visa-Modus', () => {
    const eta = ev({
      requirementType: 'electronic_travel_authorization',
      result: 'required',
      status: 'current',
      freshness: 'current',
    })
    assert.equal(eta.visaMode, null)
    assert.equal(officialAnforderungTitel('electronic_travel_authorization', null), 'Elektronische Reisegenehmigung (eTA)')
    assert.equal(officialPresentationGruppe(eta), 'vor_abreise')
    assert.notEqual(officialAnforderungTitel('electronic_travel_authorization', 'electronic_visa'), 'Visum · E-Visum')
    assert.equal((Object.keys(OFFICIAL_VISA_MODUS_BEZEICHNUNG) as string[]).includes('electronic_travel_authorization'), false)
    const titel = eintraege([eta])[0]?.titel
    assert.equal(titel, 'Elektronische Reisegenehmigung (eTA)')
    assert.doesNotMatch(titel ?? '', /Visum ·|Visa-Modus|eVisa/)
  })

  test('5. blank_passport_pages und financial_means haben First-Class-Labels und Gruppen', () => {
    const seiten = ev({
      requirementType: 'blank_passport_pages',
      result: 'required',
      status: 'current',
      freshness: 'current',
    })
    const mittel = ev({
      requirementType: 'financial_means',
      result: 'required',
      status: 'current',
      freshness: 'current',
    })
    assert.equal(OFFICIAL_ANFORDERUNG_BEZEICHNUNG.blank_passport_pages, 'Freie Passseiten')
    assert.equal(OFFICIAL_ANFORDERUNG_BEZEICHNUNG.financial_means, 'Finanzielle Mittel')
    assert.equal(officialPresentationGruppe(seiten), 'dokument_pruefen')
    assert.equal(officialPresentationGruppe(mittel), 'bei_einreise_nachweisen')
    assert.equal(gruppeVon([seiten], 'dokument_pruefen')?.titel, 'Dokument prüfen')
    assert.equal(gruppeVon([mittel], 'bei_einreise_nachweisen')?.titel, 'Bei Einreise / Reise nachweisen')
    assert.notEqual(officialPresentationGruppe(seiten), 'weitere')
    assert.notEqual(officialPresentationGruppe(mittel), 'weitere')
  })

  test('6. Transit landet in Route / Transit und bleibt scoped', () => {
    const transit = ev({
      requirementType: 'transit',
      result: 'required',
      status: 'current',
      freshness: 'current',
      destinationCountryCode: 'TH',
      transitCountryCode: 'QA',
      credentialOptionRef: 'traveller:1:document:passport:CH',
    })
    const gruppe = gruppeVon([transit], 'route_transit')
    assert.equal(gruppe?.titel, 'Route / Transit')
    assert.equal(gruppe?.eintraege.length, 1)
    assert.match(gruppe?.eintraege[0]?.ortText ?? '', /Transit/)
    assert.match(gruppe?.eintraege[0]?.ortText ?? '', new RegExp(landAnzeigeText('QA').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    assert.equal(officialOrtText(transit)?.includes(landAnzeigeText('TH')), true)
    assert.equal(officialEvaluationScopeKey(transit).includes('QA'), true)
    assert.equal(officialEvaluationScopeKey(transit).includes('transit'), true)
  })

  test('7. stale/recheck/unavailable/insufficient_context erzeugen keine aktuelle Hard-Truth-Copy', () => {
    const requiredStale = ev({
      requirementType: 'visa',
      result: 'required',
      status: 'current',
      freshness: 'stale',
      visaMode: 'electronic_visa',
    })
    const notRequiredRecheck = ev({
      requirementType: 'visa',
      result: 'not_required',
      status: 'unknown',
      freshness: 'recheck_needed',
      visaMode: 'visa_exempt',
    })
    const sourceDown = ev({
      requirementType: 'visa',
      result: 'not_required',
      status: 'unavailable',
      freshness: 'source_temporarily_unavailable',
    })
    const providerDown = ev({
      requirementType: 'visa',
      result: 'required',
      status: 'unavailable',
      freshness: 'provider_unavailable',
    })
    const missing = ev({
      requirementType: 'visa',
      result: 'unknown',
      status: 'insufficient_context',
      freshness: 'never_checked',
      missingFacts: ['nationality'],
    })
    const neverChecked = ev({
      requirementType: 'visa',
      result: 'unknown',
      status: 'unknown',
      freshness: 'never_checked',
    })
    const currentUnknown = ev({
      requirementType: 'visa',
      result: 'unknown',
      status: 'current',
      freshness: 'current',
      visaMode: 'unknown',
    })

    assert.equal(officialZeileErgebnisText(requiredStale), 'Erneut prüfen')
    assert.equal(officialZeileErgebnisText(notRequiredRecheck), 'Erneut prüfen')
    assert.equal(officialZeileErgebnisText(sourceDown), 'Offizielle Quelle derzeit nicht erreichbar')
    assert.equal(officialZeileErgebnisText(providerDown), 'Automatische Einreiseprüfung derzeit nicht verfügbar')
    assert.equal(officialZeileErgebnisText(missing), officialFehlendeAngabenText(['nationality']))
    assert.match(officialZeileErgebnisText(missing), /Staatsangehörigkeit/)
    assert.equal(officialZeileErgebnisText(neverChecked), 'Noch nicht offiziell geprüft')
    assert.equal(officialZeileErgebnisText(currentUnknown), 'Noch nicht verlässlich bestimmbar')
    assert.equal(
      officialZeileErgebnisText(
        ev({
          requirementType: 'visa',
          result: 'required',
          status: 'current',
          freshness: 'current',
          visaMode: 'electronic_visa',
        }),
      ),
      'Erforderlich',
    )
    assert.equal(
      officialZeileErgebnisText(
        ev({
          requirementType: 'visa',
          result: 'not_required',
          status: 'current',
          freshness: 'current',
          visaMode: 'visa_exempt',
        }),
      ),
      'Nicht erforderlich',
    )
    assert.equal(
      officialZeileErgebnisText(
        ev({
          requirementType: 'insurance',
          result: 'conditional',
          status: 'current',
          freshness: 'current',
        }),
      ),
      'Bedingt',
    )

    for (const evaluation of [requiredStale, notRequiredRecheck, sourceDown, providerDown, missing, neverChecked]) {
      const text = officialZeileErgebnisText(evaluation)
      assert.doesNotMatch(text, /^Erforderlich$|^Nicht erforderlich$|^Bedingt$/)
      assert.doesNotMatch(text, /nicht erforderlich und aktuell|aktuell nicht erforderlich/i)
    }
  })

  test('8. Action-Labels kommen nur aus strukturiertem Zweck', () => {
    const application = ev({
      requirementType: 'visa',
      result: 'required',
      status: 'current',
      freshness: 'current',
      visaMode: 'electronic_visa',
      action: { kind: 'open_official_action', purpose: 'application', href: 'https://example.test/apply' },
      evidence: {
        provider: 'test',
        authority: 'Test',
        sourceUrl: 'https://example.test/apply',
        checkedAt: JETZT,
        validFrom: null,
        validUntil: null,
        ruleReference: null,
        contextFingerprint: 'off',
      },
    })
    const form = ev({
      requirementType: 'entry_form',
      result: 'required',
      status: 'current',
      freshness: 'current',
      action: { kind: 'open_official_action', purpose: 'form', href: 'https://example.test/form' },
      evidence: {
        provider: 'test',
        authority: 'Test',
        sourceUrl: 'https://example.test/form',
        checkedAt: JETZT,
        validFrom: null,
        validUntil: null,
        ruleReference: null,
        contextFingerprint: 'off',
      },
    })
    const appointment = ev({
      requirementType: 'visa',
      result: 'required',
      status: 'current',
      freshness: 'current',
      visaMode: 'visa_before_travel',
      action: { kind: 'open_official_action', purpose: 'appointment', href: 'https://example.test/apt' },
      evidence: {
        provider: 'test',
        authority: 'Test',
        sourceUrl: 'https://example.test/apt',
        checkedAt: JETZT,
        validFrom: null,
        validUntil: null,
        ruleReference: null,
        contextFingerprint: 'off',
      },
    })
    const information = ev({
      requirementType: 'passport',
      result: 'required',
      status: 'current',
      freshness: 'current',
      action: { kind: 'open_official_action', purpose: 'information', href: 'https://example.test/info' },
      evidence: {
        provider: 'test',
        authority: 'Test',
        sourceUrl: 'https://example.test/info',
        checkedAt: JETZT,
        validFrom: null,
        validUntil: null,
        ruleReference: null,
        contextFingerprint: 'off',
      },
    })
    assert.deepEqual(officialPresentationAktionen(application).map((aktion) => aktion.label), [
      'Offiziellen Antrag öffnen',
    ])
    assert.deepEqual(officialPresentationAktionen(form).map((aktion) => aktion.label), ['Offizielles Formular öffnen'])
    assert.deepEqual(officialPresentationAktionen(appointment).map((aktion) => aktion.label), [
      'Offiziellen Termin öffnen',
    ])
    assert.deepEqual(officialPresentationAktionen(information).map((aktion) => aktion.label), [
      'Offizielle Information öffnen',
    ])
  })

  test('9. Action und Source mit gleicher URL werden nicht dupliziert', () => {
    const gleich = ev({
      requirementType: 'visa',
      result: 'required',
      status: 'current',
      freshness: 'current',
      visaMode: 'electronic_visa',
      action: { kind: 'open_official_action', purpose: 'application', href: 'https://example.test/same' },
      evidence: {
        provider: 'test',
        authority: 'Test',
        sourceUrl: 'https://example.test/same',
        checkedAt: JETZT,
        validFrom: null,
        validUntil: null,
        ruleReference: null,
        contextFingerprint: 'off',
      },
    })
    const verschieden = ev({
      requirementType: 'visa',
      result: 'required',
      status: 'current',
      freshness: 'current',
      visaMode: 'electronic_visa',
      action: { kind: 'open_official_action', purpose: 'application', href: 'https://example.test/apply' },
      evidence: {
        provider: 'test',
        authority: 'Test',
        sourceUrl: 'https://example.test/source',
        checkedAt: JETZT,
        validFrom: null,
        validUntil: null,
        ruleReference: null,
        contextFingerprint: 'off',
      },
    })
    assert.deepEqual(officialPresentationAktionen(gleich), [
      { href: 'https://example.test/same', label: 'Offiziellen Antrag öffnen' },
    ])
    assert.deepEqual(officialPresentationAktionen(verschieden), [
      { href: 'https://example.test/apply', label: 'Offiziellen Antrag öffnen' },
      { href: 'https://example.test/source', label: 'Offizielle Quelle öffnen' },
    ])
    assert.equal(officialPresentationAktionen(verschieden).filter((aktion) => aktion.href === 'https://example.test/apply').length, 1)
  })

  test('10. Credential-Label nutzt nur exakte strukturierte Dokumentdaten', () => {
    const partei = [traveller()]
    const optionen = credentialOptionsAus(partei[0]!)
    assert.equal(optionen.length, 2)

    const pass = officialCredentialLabel(
      { travellerClientRef: 'traveller:1', credentialOptionRef: 'traveller:1:document:passport:CH' },
      partei,
    )
    const ausweis = officialCredentialLabel(
      { travellerClientRef: 'traveller:1', credentialOptionRef: 'traveller:1:document:national_id:HR' },
      partei,
    )
    assert.match(pass, /Reisepass/)
    assert.match(pass, new RegExp(landAnzeigeText('CH').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    assert.match(pass, /Staatsbürgerschaft/)
    assert.match(ausweis, /Personalausweis/)
    assert.match(ausweis, new RegExp(landAnzeigeText('HR').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    assert.notEqual(pass, ausweis)

    assert.equal(
      officialCredentialLabel({ travellerClientRef: 'traveller:1', credentialOptionRef: 'traveller:1:unbekannt' }, partei),
      'Reisedokument-Option',
    )
    assert.equal(
      officialCredentialLabel({ travellerClientRef: 'traveller:9', credentialOptionRef: 'traveller:1:document:passport:CH' }, partei),
      'Reisedokument-Option',
    )
    assert.equal(
      officialCredentialLabel({ travellerClientRef: null, credentialOptionRef: 'traveller:1:document:passport:CH' }, partei),
      'Reisedokument-Option',
    )
    assert.doesNotMatch(pass, /traveller:1:document:passport:CH/)
    assert.doesNotMatch(ausweis, /document:national_id:HR/)
    assert.doesNotMatch(pass, /Residence|Wohnsitz|Deutschland|DE\b/)
    assert.notEqual(partei[0]?.residenceCountryCode, partei[0]?.documents.find((d) => d.clientRef === 'document:passport:CH')?.issuingCountryCode)

    const ohneCitizenship: TripTraveller = {
      ...partei[0]!,
      documents: partei[0]!.documents.map((dokument) =>
        dokument.clientRef === 'document:passport:CH' ? { ...dokument, citizenshipClientRef: null } : dokument,
      ),
    }
    const nurIssuer = officialCredentialLabel(
      { travellerClientRef: 'traveller:1', credentialOptionRef: 'traveller:1:document:passport:CH' },
      [ohneCitizenship],
    )
    assert.match(nurIssuer, /Reisepass/)
    assert.doesNotMatch(nurIssuer, /Staatsbürgerschaft/)
  })

  test('11. Presentation ändert keine Engine-Wahrheit und bleibt lossless', () => {
    const evaluations = [
      ev({
        requirementType: 'visa',
        result: 'required',
        status: 'current',
        freshness: 'current',
        visaMode: 'electronic_visa',
        credentialOptionRef: 'traveller:1:document:passport:CH',
      }),
      ev({
        requirementType: 'transit',
        result: 'conditional',
        status: 'unknown',
        freshness: 'stale',
        destinationCountryCode: 'TH',
        transitCountryCode: 'QA',
        credentialOptionRef: 'traveller:1:document:national_id:HR',
      }),
    ]
    const vorher = evaluations.map((eintrag) => ({
      result: eintrag.result,
      status: eintrag.status,
      freshness: eintrag.freshness,
      visaMode: eintrag.visaMode,
      eligibility: eintrag.optionEligibility,
    }))
    const liste = eintraege(evaluations)
    assert.equal(liste.length, 2)
    assert.deepEqual(
      evaluations.map((eintrag) => ({
        result: eintrag.result,
        status: eintrag.status,
        freshness: eintrag.freshness,
        visaMode: eintrag.visaMode,
        eligibility: eintrag.optionEligibility,
      })),
      vorher,
    )
    assert.equal(new Set(liste.map((eintrag) => eintrag.scopeKey)).size, 2)
  })

  test('12. requirementsProviderAus() bleibt null', () => {
    assert.equal(requirementsProviderAus(), null)
  })

  test('checkedAt ist Jetnity-Prüfzeit, nicht Quellen-Update', () => {
    assert.equal(officialPruefzeitText(JETZT), 'Jetnity-Prüfung 31.08.2026, 08:00 UTC')
    assert.equal(officialPruefzeitText(null), null)
    assert.equal(officialPruefzeitText('Quelle zuletzt aktualisiert'), null)
    assert.doesNotMatch(officialPruefzeitText(JETZT) ?? '', /Quelle zuletzt aktualisiert|lastUpdated/i)
  })

  test('Visa unknown erscheint in Vor Abreise, niemals als erledigter Antrag', () => {
    const unklar = ev({
      requirementType: 'visa',
      result: 'unknown',
      status: 'unknown',
      freshness: 'recheck_needed',
      visaMode: 'unknown',
    })
    const gruppe = gruppeVon([unklar], 'vor_abreise')
    assert.equal(gruppe?.eintraege[0]?.titel, 'Visumstatus')
    assert.equal(gruppe?.eintraege[0]?.ergebnisText, 'Erneut prüfen')
    assert.doesNotMatch(gruppe?.eintraege[0]?.titel ?? '', /Antrag|erledigt/i)
  })

  test('UI-Quelle rendert Gruppen und purpose-spezifische Actions', () => {
    const ui = quelle('components/trips/Reisevorbereitung.tsx')
    assert.equal(ui.includes('officialChecklist'), true)
    assert.equal(ui.includes('data-official-group'), true)
    assert.equal(ui.includes('data-official-requirement-type'), true)
    assert.equal(ui.includes('aktion.label'), true)
    assert.equal(ui.includes('evaluations[0]'), false)
    assert.equal(ui.includes('documents[0]'), false)
    assert.equal(ui.includes('best passport'), false)
    assert.equal(ui.includes('bester Pass'), false)
    assert.doesNotMatch(ui, /90 Tage|6 Monate|2 freie|Proof of Funds|USD 10|deadline/i)
  })

  test('Residual other_entry_requirement landet in Weitere offizielle Anforderungen', () => {
    const sonst = ev({
      requirementType: 'other_entry_requirement',
      result: 'required',
      status: 'current',
      freshness: 'current',
    })
    assert.equal(officialPresentationGruppe(sonst), 'weitere')
    assert.equal(gruppeVon([sonst], 'weitere')?.titel, 'Weitere offizielle Anforderungen')
  })
})
