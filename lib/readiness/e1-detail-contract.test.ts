// lib/readiness/e1-detail-contract.test.ts
//
// Entry Requirements Detail Contract E1:
// First-Class blank_passport_pages / financial_means und strukturierter Visa-Modus.
// Kein Provider, keine UI, keine Deadline, keine Hard Truth aus Fehlern.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { entscheidungenGleich } from '@/lib/readiness/entscheidung'
import { officialFingerprint, requirementsAuswerten } from '@/lib/readiness/engine'
import {
  OFFICIAL_VISA_MODES,
  officialLeer,
  officialVisaWiderspruchDegradieren,
  visaModeLesen,
  visaResultUndModusWidersprechen,
  type OfficialVisaMode,
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
  requirementType: (typeof OFFICIAL_REQUIREMENT_TYPES)[number]
  result?: 'required' | 'not_required' | 'conditional' | 'unknown'
  visaMode?: unknown
  credentialOptionRef?: string
  officialClass?: 'requirement' | 'unknown'
}) {
  return {
    travellerClientRef: 'traveller:1',
    credentialOptionRef: teil.credentialOptionRef ?? 'traveller:1:document:passport:CH',
    destinationCountryCode: 'TH',
    requirementType: teil.requirementType,
    result: teil.result ?? ('required' as const),
    officialClass: teil.officialClass ?? ('requirement' as const),
    visaMode: teil.visaMode as OfficialVisaMode | string | null | undefined,
    authority: 'Test',
    sourceUrl: 'https://example.test/entry',
    checkedAt: JETZT,
    validUntil: '2026-12-31',
  }
}

function providerAus(
  zeilen: ReturnType<typeof zeile>[],
): RequirementsProvider {
  return {
    name: 'e1-double',
    async evaluate() {
      return zeilen
    },
  }
}

async function auswerten(zeilen: ReturnType<typeof zeile>[]) {
  return requirementsAuswerten(anfrage, providerAus(zeilen), null, { now: JETZT })
}

describe('Entry Requirements Detail Contract E1 – Taxonomie', () => {
  test('blank_passport_pages und financial_means sind First-Class-Typen', () => {
    assert.equal(OFFICIAL_REQUIREMENT_TYPES.includes('blank_passport_pages'), true)
    assert.equal(OFFICIAL_REQUIREMENT_TYPES.includes('financial_means'), true)
    assert.notEqual('blank_passport_pages', 'other_entry_requirement')
    assert.notEqual('financial_means', 'other_entry_requirement')
    assert.equal(
      OFFICIAL_REQUIREMENT_TYPES.filter((typ) => typ === 'blank_passport_pages' || typ === 'financial_means').length,
      2,
    )
  })

  test('eTA bleibt eigener Typ und ist kein Visa-Modus', () => {
    assert.equal(OFFICIAL_REQUIREMENT_TYPES.includes('electronic_travel_authorization'), true)
    assert.equal((OFFICIAL_VISA_MODES as readonly string[]).includes('electronic_travel_authorization'), false)
    assert.equal((OFFICIAL_VISA_MODES as readonly string[]).includes('eta'), false)
    assert.equal((OFFICIAL_VISA_MODES as readonly string[]).includes('eTA'), false)
  })

  test('Visa-Modus-Taxonomie ist geschlossen und vollständig', () => {
    assert.deepEqual([...OFFICIAL_VISA_MODES], [
      'visa_exempt',
      'visa_on_arrival',
      'electronic_visa',
      'visa_before_travel',
      'unknown',
    ])
  })

  test('visaModeLesen: ungültig/fehlend wird unknown, nicht-Visa wird null', () => {
    assert.equal(visaModeLesen('visa', 'visa_on_arrival'), 'visa_on_arrival')
    assert.equal(visaModeLesen('visa', 'visa_exempt'), 'visa_exempt')
    assert.equal(visaModeLesen('visa', 'electronic_visa'), 'electronic_visa')
    assert.equal(visaModeLesen('visa', 'visa_before_travel'), 'visa_before_travel')
    assert.equal(visaModeLesen('visa', 'unknown'), 'unknown')
    assert.equal(visaModeLesen('visa', 'visa_free'), 'unknown')
    assert.equal(visaModeLesen('visa', 'eTA'), 'unknown')
    assert.equal(visaModeLesen('visa', ''), 'unknown')
    assert.equal(visaModeLesen('visa', null), 'unknown')
    assert.equal(visaModeLesen('visa', 1), 'unknown')
    assert.equal(visaModeLesen('electronic_travel_authorization', 'electronic_visa'), null)
    assert.equal(visaModeLesen('blank_passport_pages', 'visa_on_arrival'), null)
    assert.equal(visaModeLesen('financial_means', 'visa_exempt'), null)
    assert.equal(visaModeLesen('passport', 'visa_before_travel'), null)
    assert.equal(visaModeLesen('other_entry_requirement', 'unknown'), null)
  })

  test('officialLeer trägt Visa-Modus nur am Typ visa', () => {
    const visa = officialLeer({
      requirementType: 'visa',
      contextFingerprint: 'off-e1-visa',
    })
    const seiten = officialLeer({
      requirementType: 'blank_passport_pages',
      contextFingerprint: 'off-e1-pages',
    })
    assert.equal(visa.visaMode, 'unknown')
    assert.equal(seiten.visaMode, null)
    assert.equal(visa.result, 'unknown')
    assert.equal(seiten.result, 'unknown')
  })

  test('requirementsProviderAus bleibt null', () => {
    assert.equal(requirementsProviderAus(), null)
  })

  test('visaResultUndModusWidersprechen: Pflichtpaare widersprechen, conditional nicht', () => {
    assert.equal(visaResultUndModusWidersprechen('visa', 'required', 'visa_exempt'), true)
    assert.equal(visaResultUndModusWidersprechen('visa', 'not_required', 'visa_on_arrival'), true)
    assert.equal(visaResultUndModusWidersprechen('visa', 'not_required', 'electronic_visa'), true)
    assert.equal(visaResultUndModusWidersprechen('visa', 'not_required', 'visa_before_travel'), true)
    assert.equal(visaResultUndModusWidersprechen('visa', 'not_required', 'visa_exempt'), false)
    assert.equal(visaResultUndModusWidersprechen('visa', 'required', 'visa_on_arrival'), false)
    assert.equal(visaResultUndModusWidersprechen('visa', 'required', 'electronic_visa'), false)
    assert.equal(visaResultUndModusWidersprechen('visa', 'required', 'visa_before_travel'), false)
    assert.equal(visaResultUndModusWidersprechen('visa', 'required', 'unknown'), false)
    assert.equal(visaResultUndModusWidersprechen('visa', 'not_required', 'unknown'), false)
    assert.equal(visaResultUndModusWidersprechen('visa', 'conditional', 'visa_exempt'), false)
    assert.equal(visaResultUndModusWidersprechen('visa', 'conditional', 'visa_on_arrival'), false)
    assert.equal(visaResultUndModusWidersprechen('visa', 'conditional', 'electronic_visa'), false)
    assert.equal(visaResultUndModusWidersprechen('visa', 'conditional', 'visa_before_travel'), false)
    assert.equal(visaResultUndModusWidersprechen('visa', 'unknown', 'visa_exempt'), false)
    assert.equal(visaResultUndModusWidersprechen('blank_passport_pages', 'required', 'visa_exempt'), false)
    const widerspruch = officialVisaWiderspruchDegradieren({
      ...officialLeer({ requirementType: 'visa', contextFingerprint: 'off-e1-widerspruch' }),
      result: 'required',
      status: 'current',
      freshness: 'current',
      officialClass: 'requirement',
      visaMode: 'visa_exempt',
      action: { kind: 'open_official_source', href: 'https://example.test/visa' },
    })
    assert.equal(widerspruch.result, 'unknown')
    assert.equal(widerspruch.visaMode, 'unknown')
    assert.equal(widerspruch.status, 'unknown')
    assert.notEqual(widerspruch.status, 'current')
    assert.equal(widerspruch.freshness, 'recheck_needed')
    assert.equal(widerspruch.action, null)
  })
})

describe('Entry Requirements Detail Contract E1 – Engine', () => {
  test('neue Typen werden ohne Provider fail-closed bewertet, nicht als other_entry_requirement', async () => {
    const evaluations = await requirementsAuswerten(anfrage, null, null, { now: JETZT })
    const seiten = evaluations.filter((eintrag) => eintrag.requirementType === 'blank_passport_pages')
    const mittel = evaluations.filter((eintrag) => eintrag.requirementType === 'financial_means')
    const sonstige = evaluations.filter((eintrag) => eintrag.requirementType === 'other_entry_requirement')
    assert.equal(seiten.length, 2)
    assert.equal(mittel.length, 2)
    assert.equal(sonstige.length, 2)
    for (const evaluation of [...seiten, ...mittel]) {
      assert.equal(evaluation.result, 'unknown')
      assert.notEqual(evaluation.result, 'required')
      assert.notEqual(evaluation.result, 'not_required')
      assert.notEqual(evaluation.result, 'conditional')
      assert.equal(evaluation.visaMode, null)
      assert.equal(evaluation.evidence.provider, null)
    }
  })

  test('trusted Provider-Zeilen für blank_passport_pages und financial_means sind übernehmbar', async () => {
    const evaluations = await auswerten([
      zeile({ requirementType: 'blank_passport_pages', result: 'required' }),
      zeile({ requirementType: 'financial_means', result: 'conditional' }),
    ])
    const seiten = evaluations.find(
      (eintrag) =>
        eintrag.requirementType === 'blank_passport_pages' &&
        eintrag.credentialOptionRef === 'traveller:1:document:passport:CH',
    )
    const mittel = evaluations.find(
      (eintrag) =>
        eintrag.requirementType === 'financial_means' &&
        eintrag.credentialOptionRef === 'traveller:1:document:passport:CH',
    )
    assert.equal(seiten?.result, 'required')
    assert.equal(seiten?.status, 'current')
    assert.equal(seiten?.visaMode, null)
    assert.equal(mittel?.result, 'conditional')
    assert.equal(mittel?.status, 'current')
    assert.equal(mittel?.visaMode, null)
  })

  test('Visa-Modus wird verlustfrei Provider-Zeile → OfficialEvaluation transportiert', async () => {
    const modi = ['visa_exempt', 'visa_on_arrival', 'electronic_visa', 'visa_before_travel'] as const
    for (const modus of modi) {
      const evaluations = await auswerten([
        zeile({
          requirementType: 'visa',
          result: modus === 'visa_exempt' ? 'not_required' : 'required',
          visaMode: modus,
        }),
      ])
      const visa = evaluations.find(
        (eintrag) =>
          eintrag.requirementType === 'visa' &&
          eintrag.credentialOptionRef === 'traveller:1:document:passport:CH',
      )
      assert.equal(visa?.visaMode, modus, modus)
      assert.equal(visa?.status, 'current', modus)
      assert.notEqual(visa?.result, 'unknown', modus)
    }
  })

  test('ungültiger oder fehlender Visa-Modus wird unknown, nicht erfunden', async () => {
    const ungueltig = await auswerten([zeile({ requirementType: 'visa', visaMode: 'visa_free' })])
    const fehlend = await auswerten([zeile({ requirementType: 'visa' })])
    const visaUngueltig = ungueltig.find(
      (eintrag) =>
        eintrag.requirementType === 'visa' &&
        eintrag.credentialOptionRef === 'traveller:1:document:passport:CH',
    )
    const visaFehlend = fehlend.find(
      (eintrag) =>
        eintrag.requirementType === 'visa' &&
        eintrag.credentialOptionRef === 'traveller:1:document:passport:CH',
    )
    assert.equal(visaUngueltig?.visaMode, 'unknown')
    assert.equal(visaFehlend?.visaMode, 'unknown')
    assert.notEqual(visaUngueltig?.visaMode, 'visa_exempt')
    assert.notEqual(visaFehlend?.visaMode, 'visa_before_travel')
  })

  test('nicht-Visa-Zeilen inklusive eTA tragen keinen Visa-Modus als Product Truth', async () => {
    const evaluations = await auswerten([
      zeile({ requirementType: 'electronic_travel_authorization', visaMode: 'electronic_visa' }),
      zeile({ requirementType: 'blank_passport_pages', visaMode: 'visa_on_arrival' }),
      zeile({ requirementType: 'financial_means', visaMode: 'visa_exempt' }),
      zeile({ requirementType: 'passport', visaMode: 'visa_before_travel' }),
    ])
    const eta = evaluations.find((eintrag) => eintrag.requirementType === 'electronic_travel_authorization')
    const seiten = evaluations.find((eintrag) => eintrag.requirementType === 'blank_passport_pages')
    const mittel = evaluations.find((eintrag) => eintrag.requirementType === 'financial_means')
    const pass = evaluations.find((eintrag) => eintrag.requirementType === 'passport')
    const visa = evaluations.find(
      (eintrag) =>
        eintrag.requirementType === 'visa' &&
        eintrag.credentialOptionRef === 'traveller:1:document:passport:CH',
    )
    assert.equal(eta?.requirementType, 'electronic_travel_authorization')
    assert.equal(eta?.visaMode, null)
    assert.equal(seiten?.visaMode, null)
    assert.equal(mittel?.visaMode, null)
    assert.equal(pass?.visaMode, null)
    assert.notEqual(eta?.requirementType, 'visa')
    assert.equal(visa?.visaMode, 'unknown')
  })

  test('untrusted Visa-Zeile setzt keinen konkreten Visa-Modus als Hard Truth', async () => {
    const evaluations = await requirementsAuswerten(
      anfrage,
      {
        name: 'e1-untrusted',
        async evaluate() {
          return [
            {
              ...zeile({ requirementType: 'visa', visaMode: 'visa_on_arrival' }),
              authority: null,
              ruleReference: null,
              sourceUrl: null,
            },
          ]
        },
      },
      null,
      { now: JETZT },
    )
    const visa = evaluations.find(
      (eintrag) =>
        eintrag.requirementType === 'visa' &&
        eintrag.credentialOptionRef === 'traveller:1:document:passport:CH',
    )
    assert.equal(visa?.result, 'unknown')
    assert.notEqual(visa?.status, 'current')
    assert.equal(visa?.visaMode, 'unknown')
    assert.notEqual(visa?.visaMode, 'visa_on_arrival')
  })

  test('widersprüchliche Visa-Modi derselben Option fail-closed ohne Winner-Modus', async () => {
    const evaluations = await auswerten([
      zeile({ requirementType: 'visa', visaMode: 'visa_on_arrival' }),
      zeile({ requirementType: 'visa', visaMode: 'visa_before_travel' }),
    ])
    const visa = evaluations.filter(
      (eintrag) =>
        eintrag.requirementType === 'visa' &&
        eintrag.credentialOptionRef === 'traveller:1:document:passport:CH',
    )
    assert.equal(visa.length, 1)
    assert.equal(visa[0]?.result, 'unknown')
    assert.equal(visa[0]?.visaMode, 'unknown')
    assert.notEqual(visa[0]?.visaMode, 'visa_on_arrival')
    assert.notEqual(visa[0]?.visaMode, 'visa_before_travel')
  })

  test('verschiedene Visa-Modi sind entscheidungsrelevant, Evidence-URLs nicht', () => {
    const basis = officialLeer({
      travellerClientRef: 'traveller:1',
      credentialOptionRef: 'traveller:1:document:passport:CH',
      destinationCountryCode: 'TH',
      requirementType: 'visa',
      contextFingerprint: 'off-e1',
    })
    const ankunft = {
      ...basis,
      result: 'required' as const,
      status: 'current' as const,
      freshness: 'current' as const,
      officialClass: 'requirement' as const,
      visaMode: 'visa_on_arrival' as const,
    }
    const vorher = { ...ankunft, visaMode: 'visa_before_travel' as const }
    const andereUrl = {
      ...ankunft,
      evidence: { ...ankunft.evidence, sourceUrl: 'https://example.test/andere' },
    }
    assert.equal(entscheidungenGleich(ankunft, vorher), false)
    assert.equal(entscheidungenGleich(ankunft, andereUrl), true)
  })

  test('Multi-Credential bleibt getrennt: kein Default-Pass, getrennte Visa-Modi', async () => {
    const evaluations = await auswerten([
      zeile({
        requirementType: 'visa',
        result: 'required',
        visaMode: 'electronic_visa',
        credentialOptionRef: 'traveller:1:document:passport:CH',
      }),
      zeile({
        requirementType: 'visa',
        result: 'not_required',
        visaMode: 'visa_exempt',
        credentialOptionRef: 'traveller:1:document:passport:RS',
      }),
    ])
    const visa = evaluations.filter((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(visa.length, 2)
    const ch = visa.find((eintrag) => eintrag.credentialOptionRef === 'traveller:1:document:passport:CH')
    const rs = visa.find((eintrag) => eintrag.credentialOptionRef === 'traveller:1:document:passport:RS')
    assert.equal(ch?.visaMode, 'electronic_visa')
    assert.equal(ch?.result, 'required')
    assert.equal(rs?.visaMode, 'visa_exempt')
    assert.equal(rs?.result, 'not_required')
    assert.notEqual(ch?.credentialOptionRef, rs?.credentialOptionRef)
    assert.notEqual(visa[0]?.credentialOptionRef, visa[1]?.credentialOptionRef)
  })

  test('Fingerprint bleibt anfrage-seitig: Visa-Modus ändert ihn nicht', () => {
    const basis = {
      travellerClientRef: 'traveller:1',
      credentialOptionRef: 'traveller:1:document:passport:CH',
      citizenshipCountryCodes: ['CH'],
      residenceCountryCode: 'CH',
      documents: [{ documentType: 'passport', issuingCountryCode: 'CH', expiresOn: '2030-01-01' }],
      originCountryCode: 'CH',
      destinationCountryCode: 'TH',
      transitCountryCodes: [] as string[],
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      requirementType: 'visa',
    }
    assert.equal(officialFingerprint(basis), officialFingerprint(basis))
    assert.notEqual(
      officialFingerprint(basis),
      officialFingerprint({ ...basis, requirementType: 'blank_passport_pages' }),
    )
    assert.notEqual(
      officialFingerprint(basis),
      officialFingerprint({ ...basis, requirementType: 'financial_means' }),
    )
  })
})

describe('Entry Requirements Detail Contract E1 – result ↔ visaMode', () => {
  async function visaVon(result: 'required' | 'not_required' | 'conditional', visaMode: unknown) {
    const evaluations = await auswerten([zeile({ requirementType: 'visa', result, visaMode })])
    return evaluations.find(
      (eintrag) =>
        eintrag.requirementType === 'visa' &&
        eintrag.credentialOptionRef === 'traveller:1:document:passport:CH',
    )
  }

  function widerspruchGehalten(
    evaluation:
      | {
          result?: string
          visaMode?: string | null
          status?: string
        }
      | undefined,
  ) {
    assert.equal(evaluation?.result, 'unknown')
    assert.equal(evaluation?.visaMode, 'unknown')
    assert.equal(evaluation?.status, 'unknown')
    assert.notEqual(evaluation?.status, 'current')
    assert.notEqual(evaluation?.result, 'required')
    assert.notEqual(evaluation?.result, 'not_required')
    assert.notEqual(evaluation?.visaMode, 'visa_exempt')
    assert.notEqual(evaluation?.visaMode, 'visa_on_arrival')
    assert.notEqual(evaluation?.visaMode, 'electronic_visa')
    assert.notEqual(evaluation?.visaMode, 'visa_before_travel')
  }

  test('required + visa_exempt ist widersprüchlich und bleibt nicht current', async () => {
    widerspruchGehalten(await visaVon('required', 'visa_exempt'))
  })

  test('not_required + visumpflichtige Modi sind widersprüchlich', async () => {
    for (const modus of ['visa_on_arrival', 'electronic_visa', 'visa_before_travel'] as const) {
      widerspruchGehalten(await visaVon('not_required', modus))
    }
  })

  test('gültige required-Kombinationen bleiben current', async () => {
    for (const modus of ['visa_on_arrival', 'electronic_visa', 'visa_before_travel', 'unknown'] as const) {
      const visa = await visaVon('required', modus)
      assert.equal(visa?.result, 'required', modus)
      assert.equal(visa?.visaMode, modus, modus)
      assert.equal(visa?.status, 'current', modus)
    }
  })

  test('gültige not_required-Kombinationen bleiben current', async () => {
    for (const modus of ['visa_exempt', 'unknown'] as const) {
      const visa = await visaVon('not_required', modus)
      assert.equal(visa?.result, 'not_required', modus)
      assert.equal(visa?.visaMode, modus, modus)
      assert.equal(visa?.status, 'current', modus)
    }
  })

  test('conditional bleibt bei jedem Visa-Modus erlaubt und wird nicht erfunden degradiert', async () => {
    for (const modus of [
      'visa_exempt',
      'visa_on_arrival',
      'electronic_visa',
      'visa_before_travel',
      'unknown',
    ] as const) {
      const visa = await visaVon('conditional', modus)
      assert.equal(visa?.result, 'conditional', modus)
      assert.equal(visa?.visaMode, modus, modus)
      assert.equal(visa?.status, 'current', modus)
    }
  })

  test('Widerspruch auf einer Credential-Option lässt die andere unberührt', async () => {
    const evaluations = await auswerten([
      zeile({
        requirementType: 'visa',
        result: 'required',
        visaMode: 'visa_exempt',
        credentialOptionRef: 'traveller:1:document:passport:CH',
      }),
      zeile({
        requirementType: 'visa',
        result: 'not_required',
        visaMode: 'visa_exempt',
        credentialOptionRef: 'traveller:1:document:passport:RS',
      }),
    ])
    const ch = evaluations.find(
      (eintrag) =>
        eintrag.requirementType === 'visa' &&
        eintrag.credentialOptionRef === 'traveller:1:document:passport:CH',
    )
    const rs = evaluations.find(
      (eintrag) =>
        eintrag.requirementType === 'visa' &&
        eintrag.credentialOptionRef === 'traveller:1:document:passport:RS',
    )
    widerspruchGehalten(ch)
    assert.equal(rs?.result, 'not_required')
    assert.equal(rs?.visaMode, 'visa_exempt')
    assert.equal(rs?.status, 'current')
    assert.notEqual(ch?.credentialOptionRef, rs?.credentialOptionRef)
  })
})
