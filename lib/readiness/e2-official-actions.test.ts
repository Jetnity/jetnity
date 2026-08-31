// lib/readiness/e2-official-actions.test.ts
//
// Entry Requirements E2: Evidence Source ≠ Official Action.
// sourceUrl ist niemals application/form/appointment.
// Ungültige Action-Metadaten ändern keine Requirements-Hard-Truth.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { requirementsAuswerten } from '@/lib/readiness/engine'
import {
  OFFICIAL_ACTION_PURPOSES,
  officialActionPurposeLesen,
  officialAktionAusMetadaten,
  officialAktionAusQuelle,
  officialAktionIstRiskant,
  officialLeer,
  officialVisaWiderspruchDegradieren,
  quelleUrlLesen,
  visaModeLesen,
  type OfficialActionPurpose,
} from '@/lib/readiness/official'
import { requirementsProviderAus, type RequirementsAnfrage, type RequirementsProvider } from '@/lib/readiness/provider'
import { OFFICIAL_REQUIREMENT_TYPES } from '@/types/trips'

const JETZT = '2026-08-31T08:00:00.000Z'

const anfrage: RequirementsAnfrage = {
  originCountryCode: 'CH',
  destinationCountryCodes: ['TH'],
  transitCountryCodes: [],
  startDate: '2026-09-12',
  endDate: '2026-09-16',
  travellers: [
    {
      clientRef: 'traveller:1',
      residenceCountryCode: 'CH',
      citizenshipCountryCodes: ['CH', 'RS'],
      documents: [
        {
          clientRef: 'document:passport:CH',
          documentType: 'passport',
          issuingCountryCode: 'CH',
          expiresOn: '2030-01-01',
          citizenshipCountryCode: 'CH',
        },
        {
          clientRef: 'document:passport:RS',
          documentType: 'passport',
          issuingCountryCode: 'RS',
          expiresOn: '2029-01-01',
          citizenshipCountryCode: 'RS',
        },
      ],
      credentialOptions: [
        {
          optionRef: 'traveller:1:document:passport:CH',
          documentClientRef: 'document:passport:CH',
          documentType: 'passport',
          issuingCountryCode: 'CH',
          expiresOn: '2030-01-01',
          relatedCitizenshipCountryCode: 'CH',
        },
        {
          optionRef: 'traveller:1:document:passport:RS',
          documentClientRef: 'document:passport:RS',
          documentType: 'passport',
          issuingCountryCode: 'RS',
          expiresOn: '2029-01-01',
          relatedCitizenshipCountryCode: 'RS',
        },
      ],
    },
  ],
}

function zeile(teil: {
  requirementType?: (typeof OFFICIAL_REQUIREMENT_TYPES)[number]
  result?: 'required' | 'not_required' | 'conditional' | 'unknown'
  visaMode?: unknown
  credentialOptionRef?: string
  sourceUrl?: string | null
  actionUrl?: string | null
  actionPurpose?: OfficialActionPurpose | string | null
  authority?: string | null
  checkedAt?: string | null
  availability?: 'ok' | 'temporarily_unavailable'
}) {
  return {
    travellerClientRef: 'traveller:1',
    credentialOptionRef: teil.credentialOptionRef ?? 'traveller:1:document:passport:CH',
    destinationCountryCode: 'TH',
    requirementType: teil.requirementType ?? ('visa' as const),
    result: teil.result ?? ('required' as const),
    officialClass: 'requirement' as const,
    visaMode: teil.visaMode as string | null | undefined,
    authority: teil.authority === undefined ? 'Test' : teil.authority,
    sourceUrl: teil.sourceUrl === undefined ? 'https://example.test/entry' : teil.sourceUrl,
    actionUrl: teil.actionUrl,
    actionPurpose: teil.actionPurpose,
    checkedAt: teil.checkedAt === undefined ? JETZT : teil.checkedAt,
    validUntil: '2026-12-31',
    availability: teil.availability,
  }
}

function providerAus(zeilen: ReturnType<typeof zeile>[]): RequirementsProvider {
  return {
    name: 'e2-double',
    async evaluate() {
      return zeilen
    },
  }
}

async function auswerten(zeilen: ReturnType<typeof zeile>[]) {
  return requirementsAuswerten(anfrage, providerAus(zeilen), null, { now: JETZT })
}

function visaCh(
  evaluations: Awaited<ReturnType<typeof requirementsAuswerten>>,
  requirementType: (typeof OFFICIAL_REQUIREMENT_TYPES)[number] = 'visa',
) {
  return evaluations.find(
    (eintrag) =>
      eintrag.requirementType === requirementType &&
      eintrag.credentialOptionRef === 'traveller:1:document:passport:CH',
  )
}

describe('Entry Requirements E2 – Official Action Contract', () => {
  test('Zweck-Taxonomie ist geschlossen und vollständig', () => {
    assert.deepEqual([...OFFICIAL_ACTION_PURPOSES], ['application', 'form', 'appointment', 'information'])
  })

  test('officialActionPurposeLesen verwirft Marketing- und unbekannten Text', () => {
    assert.equal(officialActionPurposeLesen('application'), 'application')
    assert.equal(officialActionPurposeLesen('form'), 'form')
    assert.equal(officialActionPurposeLesen('appointment'), 'appointment')
    assert.equal(officialActionPurposeLesen('information'), 'information')
    assert.equal(officialActionPurposeLesen('Apply now'), null)
    assert.equal(officialActionPurposeLesen('eVisa'), null)
    assert.equal(officialActionPurposeLesen('Application'), null)
    assert.equal(officialActionPurposeLesen(''), null)
    assert.equal(officialActionPurposeLesen(null), null)
    assert.equal(officialActionPurposeLesen(1), null)
  })

  test('sourceUrl allein wird höchstens information, niemals riskant', () => {
    const action = officialAktionAusQuelle('https://example.test/visa')
    assert.equal(action?.kind, 'open_official_action')
    assert.equal(action?.purpose, 'information')
    assert.equal(officialAktionIstRiskant(action), false)
    assert.equal(
      officialAktionAusMetadaten({ sourceUrl: 'https://example.test/visa' })?.purpose,
      'information',
    )
    assert.equal(officialAktionIstRiskant(officialAktionAusMetadaten({ sourceUrl: 'https://example.test/visa' })), false)
  })

  test('explizites application + valide HTTPS Action URL → application Action', async () => {
    const visa = visaCh(
      await auswerten([
        zeile({
          actionPurpose: 'application',
          actionUrl: 'https://immi.example.test/apply',
        }),
      ]),
    )
    assert.equal(visa?.result, 'required')
    assert.equal(visa?.status, 'current')
    assert.equal(visa?.action?.kind, 'open_official_action')
    assert.equal(visa?.action?.purpose, 'application')
    assert.equal(visa?.action?.href, 'https://immi.example.test/apply')
    assert.equal(visa?.evidence.sourceUrl, 'https://example.test/entry')
    assert.notEqual(visa?.action?.href, visa?.evidence.sourceUrl)
  })

  test('explizites form → form Action', async () => {
    const form = visaCh(
      await auswerten([
        zeile({
          requirementType: 'entry_form',
          actionPurpose: 'form',
          actionUrl: 'https://arrival.example.test/form',
        }),
      ]),
      'entry_form',
    )
    assert.equal(form?.result, 'required')
    assert.equal(form?.action?.purpose, 'form')
    assert.equal(form?.action?.href, 'https://arrival.example.test/form')
  })

  test('explizites appointment → appointment Action', async () => {
    const visa = visaCh(
      await auswerten([
        zeile({
          actionPurpose: 'appointment',
          actionUrl: 'https://embassy.example.test/appointments',
        }),
      ]),
    )
    assert.equal(visa?.action?.purpose, 'appointment')
    assert.equal(visa?.action?.href, 'https://embassy.example.test/appointments')
  })

  test('explizites information → information Action', async () => {
    const visa = visaCh(
      await auswerten([
        zeile({
          actionPurpose: 'information',
          actionUrl: 'https://gov.example.test/info',
        }),
      ]),
    )
    assert.equal(visa?.action?.purpose, 'information')
    assert.equal(visa?.action?.href, 'https://gov.example.test/info')
    assert.equal(officialAktionIstRiskant(visa?.action ?? null), false)
  })

  test('sourceUrl ohne explizite Action wird niemals application/form/appointment', async () => {
    for (const typ of ['visa', 'electronic_travel_authorization', 'entry_form', 'passport_validity'] as const) {
      const evaluation = visaCh(await auswerten([zeile({ requirementType: typ })]), typ)
      assert.equal(evaluation?.action?.purpose, 'information', typ)
      assert.equal(evaluation?.action?.href, 'https://example.test/entry', typ)
      assert.notEqual(evaluation?.action?.purpose, 'application', typ)
      assert.notEqual(evaluation?.action?.purpose, 'form', typ)
      assert.notEqual(evaluation?.action?.purpose, 'appointment', typ)
      assert.equal(officialAktionIstRiskant(evaluation?.action ?? null), false, typ)
    }
  })

  test('ungültiger Purpose erzeugt keine riskante Action', async () => {
    const visa = visaCh(
      await auswerten([
        zeile({
          actionPurpose: 'Apply now',
          actionUrl: 'https://immi.example.test/apply',
        }),
      ]),
    )
    assert.equal(visa?.result, 'required')
    assert.equal(visa?.status, 'current')
    assert.notEqual(visa?.action?.purpose, 'application')
    assert.notEqual(visa?.action?.purpose, 'form')
    assert.notEqual(visa?.action?.purpose, 'appointment')
    assert.equal(officialAktionIstRiskant(visa?.action ?? null), false)
  })

  test('valid actionUrl + invalid purpose + sourceUrl null => keine Action', async () => {
    assert.equal(
      officialAktionAusMetadaten({
        actionUrl: 'https://immi.example.test/apply',
        actionPurpose: 'Apply now',
        sourceUrl: null,
      }),
      null,
    )
    const visa = visaCh(
      await auswerten([
        zeile({
          actionPurpose: 'eVisa',
          actionUrl: 'https://immi.example.test/apply',
          sourceUrl: null,
        }),
      ]),
    )
    assert.equal(visa?.action, null)
    assert.equal(visa?.result, 'required')
    assert.equal(visa?.status, 'current')
    assert.equal(visa?.freshness, 'current')
    assert.notEqual(visa?.result, 'not_required')
    assert.notEqual(visa?.result, 'unknown')
  })

  test('valid actionUrl + missing purpose + sourceUrl null => keine Action', async () => {
    assert.equal(
      officialAktionAusMetadaten({
        actionUrl: 'https://immi.example.test/apply',
        sourceUrl: null,
      }),
      null,
    )
    const visa = visaCh(
      await auswerten([
        zeile({
          actionUrl: 'https://immi.example.test/apply',
          sourceUrl: null,
        }),
      ]),
    )
    assert.equal(visa?.action, null)
    assert.equal(visa?.result, 'required')
    assert.equal(visa?.status, 'current')
    assert.equal(visa?.freshness, 'current')
    assert.notEqual(visa?.result, 'not_required')
  })

  test('unvollständige explizite Action + valide sourceUrl bleibt information der sourceUrl', async () => {
    const ausHelper = officialAktionAusMetadaten({
      actionPurpose: 'Apply now',
      actionUrl: 'https://immi.example.test/apply',
      sourceUrl: 'https://example.test/entry',
    })
    assert.equal(ausHelper?.purpose, 'information')
    assert.equal(ausHelper?.href, 'https://example.test/entry')
    assert.notEqual(ausHelper?.href, 'https://immi.example.test/apply')
    const visa = visaCh(
      await auswerten([
        zeile({
          actionPurpose: 'Apply now',
          actionUrl: 'https://immi.example.test/apply',
          sourceUrl: 'https://example.test/entry',
        }),
      ]),
    )
    assert.equal(visa?.action?.purpose, 'information')
    assert.equal(visa?.action?.href, 'https://example.test/entry')
    assert.notEqual(visa?.action?.href, 'https://immi.example.test/apply')
    assert.equal(visa?.evidence.sourceUrl, 'https://example.test/entry')
    assert.equal(visa?.result, 'required')
    assert.equal(visa?.status, 'current')
    assert.equal(visa?.freshness, 'current')
  })

  test('http, Credentials, localhost/.local und malformed URL erzeugen keine Action', () => {
    for (const url of [
      'http://example.test/apply',
      'https://user:pass@example.test/apply',
      'https://localhost/apply',
      'https://immi.local/apply',
      'javascript:alert(1)',
      'not-a-url',
      '',
    ]) {
      assert.equal(quelleUrlLesen(url), null, url)
      assert.equal(
        officialAktionAusMetadaten({ actionPurpose: 'application', actionUrl: url }),
        null,
        url,
      )
      assert.equal(officialAktionIstRiskant(officialAktionAusMetadaten({ actionPurpose: 'application', actionUrl: url })), false, url)
    }
  })

  test('ungültige Action-URL im Engine-Pfad erzeugt keine riskante Action', async () => {
    for (const actionUrl of [
      'http://example.test/apply',
      'https://user:pass@example.test/apply',
      'https://localhost/apply',
      'https://immi.local/apply',
      'javascript:alert(1)',
    ]) {
      const visa = visaCh(
        await auswerten([
          zeile({
            actionPurpose: 'application',
            actionUrl,
          }),
        ]),
      )
      assert.equal(visa?.result, 'required', actionUrl)
      assert.equal(visa?.status, 'current', actionUrl)
      assert.equal(officialAktionIstRiskant(visa?.action ?? null), false, actionUrl)
      assert.equal(visa?.action?.purpose, 'information', actionUrl)
      assert.equal(visa?.action?.href, 'https://example.test/entry', actionUrl)
    }
  })

  test('ungültige Action-Metadaten verändern nicht required/not_required/conditional', async () => {
    const required = visaCh(
      await auswerten([
        zeile({
          result: 'required',
          actionPurpose: 'eVisa',
          actionUrl: 'http://example.test/apply',
        }),
      ]),
    )
    const notRequired = visaCh(
      await auswerten([
        zeile({
          result: 'not_required',
          visaMode: 'visa_exempt',
          actionPurpose: 'Apply now',
          actionUrl: 'https://user:pass@example.test/apply',
        }),
      ]),
    )
    const conditional = visaCh(
      await auswerten([
        zeile({
          result: 'conditional',
          actionPurpose: 12 as never,
          actionUrl: 'not-a-url',
        }),
      ]),
    )
    assert.equal(required?.result, 'required')
    assert.equal(required?.status, 'current')
    assert.notEqual(required?.result, 'not_required')
    assert.equal(notRequired?.result, 'not_required')
    assert.equal(notRequired?.status, 'current')
    assert.notEqual(notRequired?.result, 'required')
    assert.equal(conditional?.result, 'conditional')
    assert.equal(conditional?.status, 'current')
    assert.equal(officialAktionIstRiskant(required?.action ?? null), false)
    assert.equal(officialAktionIstRiskant(notRequired?.action ?? null), false)
    assert.equal(officialAktionIstRiskant(conditional?.action ?? null), false)
  })

  test('stale/unavailable/conflicting Evaluation verliert riskante Action', async () => {
    const stale = visaCh(
      await auswerten([
        zeile({
          actionPurpose: 'application',
          actionUrl: 'https://immi.example.test/apply',
          checkedAt: '2026-08-31T06:00:00.000Z',
        }),
      ]),
    )
    const unavailable = visaCh(
      await auswerten([
        zeile({
          actionPurpose: 'form',
          actionUrl: 'https://arrival.example.test/form',
          availability: 'temporarily_unavailable',
        }),
      ]),
    )
    const konflikt = visaCh(
      await auswerten([
        zeile({
          result: 'required',
          visaMode: 'electronic_visa',
          actionPurpose: 'application',
          actionUrl: 'https://immi.example.test/apply',
        }),
        zeile({
          result: 'not_required',
          visaMode: 'visa_exempt',
          actionPurpose: 'application',
          actionUrl: 'https://immi.example.test/other',
        }),
      ]),
    )
    assert.notEqual(stale?.freshness, 'current')
    assert.notEqual(stale?.status, 'current')
    assert.equal(stale?.action, null)
    assert.equal(unavailable?.freshness, 'source_temporarily_unavailable')
    assert.equal(unavailable?.action, null)
    assert.equal(konflikt?.result, 'unknown')
    assert.equal(konflikt?.action, null)
    assert.equal(officialAktionIstRiskant(stale?.action ?? null), false)
    assert.equal(officialAktionIstRiskant(unavailable?.action ?? null), false)
    assert.equal(officialAktionIstRiskant(konflikt?.action ?? null), false)
  })

  test('zwei Credential-Optionen behalten getrennte Actions', async () => {
    const evaluations = await auswerten([
      zeile({
        credentialOptionRef: 'traveller:1:document:passport:CH',
        result: 'required',
        visaMode: 'electronic_visa',
        actionPurpose: 'application',
        actionUrl: 'https://immi.example.test/ch-apply',
      }),
      zeile({
        credentialOptionRef: 'traveller:1:document:passport:RS',
        result: 'not_required',
        visaMode: 'visa_exempt',
        actionPurpose: 'information',
        actionUrl: 'https://immi.example.test/rs-info',
      }),
    ])
    const visa = evaluations.filter((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(visa.length, 2)
    const ch = visa.find((eintrag) => eintrag.credentialOptionRef === 'traveller:1:document:passport:CH')
    const rs = visa.find((eintrag) => eintrag.credentialOptionRef === 'traveller:1:document:passport:RS')
    assert.equal(ch?.action?.purpose, 'application')
    assert.equal(ch?.action?.href, 'https://immi.example.test/ch-apply')
    assert.equal(ch?.result, 'required')
    assert.equal(rs?.action?.purpose, 'information')
    assert.equal(rs?.action?.href, 'https://immi.example.test/rs-info')
    assert.equal(rs?.result, 'not_required')
    assert.notEqual(ch?.action?.href, rs?.action?.href)
    assert.notEqual(ch?.credentialOptionRef, rs?.credentialOptionRef)
  })

  test('eTA bleibt electronic_travel_authorization und wird nicht eVisa', async () => {
    const eta = visaCh(
      await auswerten([
        zeile({
          requirementType: 'electronic_travel_authorization',
          visaMode: 'electronic_visa',
          actionPurpose: 'application',
          actionUrl: 'https://eta.example.test/apply',
        }),
      ]),
      'electronic_travel_authorization',
    )
    assert.equal(eta?.requirementType, 'electronic_travel_authorization')
    assert.notEqual(eta?.requirementType, 'visa')
    assert.equal(eta?.visaMode, null)
    assert.equal(eta?.action?.purpose, 'application')
    assert.equal(visaModeLesen('electronic_travel_authorization', 'electronic_visa'), null)
  })

  test('bestehende E1 result↔visaMode-Degradierung bleibt intakt und löscht riskante Action', async () => {
    const visa = visaCh(
      await auswerten([
        zeile({
          result: 'required',
          visaMode: 'visa_exempt',
          actionPurpose: 'application',
          actionUrl: 'https://immi.example.test/apply',
        }),
      ]),
    )
    assert.equal(visa?.result, 'unknown')
    assert.equal(visa?.visaMode, 'unknown')
    assert.equal(visa?.status, 'unknown')
    assert.notEqual(visa?.status, 'current')
    assert.equal(visa?.action, null)
    const direkt = officialVisaWiderspruchDegradieren({
      ...officialLeer({ requirementType: 'visa', contextFingerprint: 'off-e2-widerspruch' }),
      result: 'not_required',
      status: 'current',
      freshness: 'current',
      officialClass: 'requirement',
      visaMode: 'visa_before_travel',
      action: { kind: 'open_official_action', purpose: 'application', href: 'https://immi.example.test/apply' },
    })
    assert.equal(direkt.result, 'unknown')
    assert.equal(direkt.visaMode, 'unknown')
    assert.equal(direkt.action, null)
  })

  test('untrusted Evidence trägt keine riskante Action und keine Hard Truth', async () => {
    const visa = visaCh(
      await auswerten([
        zeile({
          authority: null,
          sourceUrl: null,
          actionPurpose: 'application',
          actionUrl: 'https://immi.example.test/apply',
        }),
      ]),
    )
    assert.equal(visa?.result, 'unknown')
    assert.notEqual(visa?.status, 'current')
    assert.equal(visa?.action, null)
  })

  test('Requirement-Typ erfindet keine Antragssituation', async () => {
    const visa = visaCh(await auswerten([zeile({ requirementType: 'visa' })]))
    const eta = visaCh(
      await auswerten([zeile({ requirementType: 'electronic_travel_authorization' })]),
      'electronic_travel_authorization',
    )
    const form = visaCh(await auswerten([zeile({ requirementType: 'entry_form' })]), 'entry_form')
    const seiten = visaCh(await auswerten([zeile({ requirementType: 'blank_passport_pages' })]), 'blank_passport_pages')
    assert.equal(visa?.action?.purpose, 'information')
    assert.equal(eta?.action?.purpose, 'information')
    assert.equal(form?.action?.purpose, 'information')
    assert.equal(seiten?.action?.purpose, 'information')
    assert.equal(officialAktionIstRiskant(visa?.action ?? null), false)
    assert.equal(officialAktionIstRiskant(eta?.action ?? null), false)
    assert.equal(officialAktionIstRiskant(form?.action ?? null), false)
    assert.equal(officialAktionIstRiskant(seiten?.action ?? null), false)
  })

  test('requirementsProviderAus bleibt null', () => {
    assert.equal(requirementsProviderAus(), null)
  })
})
