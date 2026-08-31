// lib/readiness/e4-temporal-rules.test.ts
//
// Entry Requirements E4: relative_duration Temporal-Rule-Contract.
// Kein Timestamp, kein Reminder, kein Provider, kein Default-Pass.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { requirementsAuswerten } from '@/lib/readiness/engine'
import {
  officialLeer,
  officialVisaWiderspruchDegradieren,
  type OfficialEvaluation,
} from '@/lib/readiness/official'
import { officialChecklist } from '@/lib/readiness/official-presentation'
import { requirementsProviderAus, type RequirementsAnfrage, type RequirementsProvider } from '@/lib/readiness/provider'
import {
  OFFICIAL_TEMPORAL_ANCHORS,
  OFFICIAL_TEMPORAL_DUE_SEMANTICS,
  OFFICIAL_TEMPORAL_KIND,
  OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES,
  OFFICIAL_TEMPORAL_RELATIONS,
  officialDarfTemporalTragen,
  officialTemporalTexte,
  temporalRuleLesen,
  temporalRulesGleich,
} from '@/lib/readiness/temporal'
import { OFFICIAL_REQUIREMENT_TYPES } from '@/types/trips'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

const JETZT = '2026-08-31T08:00:00.000Z'
const STUNDEN_72 = 72 * 60
const STUNDEN_24 = 24 * 60

const anfrage: RequirementsAnfrage = {
  originCountryCode: 'CH',
  destinationCountryCodes: ['TH'],
  transitCountryCodes: ['SG', 'QA'],
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

const arrivalCard72h = {
  kind: OFFICIAL_TEMPORAL_KIND,
  availableFrom: {
    anchor: 'destination_arrival' as const,
    relation: 'before' as const,
    offsetMinutes: STUNDEN_72,
  },
  dueBy: {
    anchor: 'destination_arrival' as const,
    relation: 'at' as const,
    offsetMinutes: 0,
    semantics: 'mandatory' as const,
  },
}

function zeile(teil: {
  requirementType?: (typeof OFFICIAL_REQUIREMENT_TYPES)[number]
  result?: 'required' | 'not_required' | 'conditional' | 'unknown' | 'insufficient_context'
  visaMode?: unknown
  credentialOptionRef?: string
  destinationCountryCode?: string
  transitCountryCode?: string | null
  sourceUrl?: string | null
  authority?: string | null
  checkedAt?: string | null
  validFrom?: string | null
  validUntil?: string | null
  availability?: 'ok' | 'temporarily_unavailable'
  missingFacts?: Array<'nationality' | 'travel_dates'>
  temporalRule?: unknown
}) {
  return {
    travellerClientRef: 'traveller:1',
    credentialOptionRef: teil.credentialOptionRef ?? 'traveller:1:document:passport:CH',
    destinationCountryCode: teil.destinationCountryCode ?? 'TH',
    transitCountryCode: teil.transitCountryCode,
    requirementType: teil.requirementType ?? ('entry_form' as const),
    result: teil.result ?? ('required' as const),
    officialClass: 'requirement' as const,
    visaMode: teil.visaMode as string | null | undefined,
    authority: teil.authority === undefined ? 'Test' : teil.authority,
    sourceUrl: teil.sourceUrl === undefined ? 'https://example.test/entry' : teil.sourceUrl,
    checkedAt: teil.checkedAt === undefined ? JETZT : teil.checkedAt,
    validFrom: teil.validFrom,
    validUntil: teil.validUntil === undefined ? '2026-12-31' : teil.validUntil,
    availability: teil.availability,
    missingFacts: teil.missingFacts,
    temporalRule: teil.temporalRule,
  }
}

function providerAus(zeilen: ReturnType<typeof zeile>[]): RequirementsProvider {
  return {
    name: 'e4-double',
    async evaluate() {
      return zeilen
    },
  }
}

async function auswerten(zeilen: ReturnType<typeof zeile>[]) {
  return requirementsAuswerten(anfrage, providerAus(zeilen), null, { now: JETZT })
}

function finden(
  evaluations: OfficialEvaluation[],
  teil: {
    requirementType?: OfficialEvaluation['requirementType']
    credentialOptionRef?: string
    transitCountryCode?: string | null
  } = {},
) {
  return evaluations.find(
    (eintrag) =>
      eintrag.requirementType === (teil.requirementType ?? 'entry_form') &&
      eintrag.credentialOptionRef === (teil.credentialOptionRef ?? 'traveller:1:document:passport:CH') &&
      (teil.transitCountryCode === undefined || eintrag.transitCountryCode === teil.transitCountryCode),
  )
}

function timingTexteVon(evaluation: OfficialEvaluation | undefined): string[] {
  if (!evaluation) return []
  return officialChecklist({
    evaluations: [evaluation],
    party: [],
    slots: [{ clientRef: 'traveller:1', label: 'Reisende 1' }],
  }).flatMap((gruppe) => gruppe.eintraege.flatMap((eintrag) => eintrag.timingTexte))
}

describe('Entry Requirements E4 – Temporal-Rule-Contract', () => {
  test('1. 72h-before-destination-arrival availableFrom wird korrekt normalisiert', async () => {
    const gelesen = temporalRuleLesen(arrivalCard72h)
    assert.equal(gelesen?.kind, 'relative_duration')
    assert.equal(gelesen?.availableFrom?.anchor, 'destination_arrival')
    assert.equal(gelesen?.availableFrom?.relation, 'before')
    assert.equal(gelesen?.availableFrom?.offsetMinutes, STUNDEN_72)
    assert.equal(gelesen?.dueBy?.relation, 'at')
    assert.equal(gelesen?.dueBy?.offsetMinutes, 0)
    assert.equal(gelesen?.dueBy?.semantics, 'mandatory')

    const evaluation = finden(await auswerten([zeile({ temporalRule: arrivalCard72h })]))
    assert.equal(evaluation?.result, 'required')
    assert.equal(evaluation?.status, 'current')
    assert.deepEqual(evaluation?.temporalRule, gelesen)
    assert.deepEqual(timingTexteVon(evaluation), [
      'Ab 72 Std. vor Ankunft möglich',
      'Pflichtfrist: spätestens bei Ankunft',
    ])
  })

  test('2. at + 0 akzeptiert, at + nonzero verworfen', () => {
    assert.deepEqual(
      temporalRuleLesen({
        kind: 'relative_duration',
        dueBy: { anchor: 'destination_arrival', relation: 'at', offsetMinutes: 0, semantics: 'mandatory' },
      })?.dueBy,
      { anchor: 'destination_arrival', relation: 'at', offsetMinutes: 0, semantics: 'mandatory' },
    )
    assert.equal(
      temporalRuleLesen({
        kind: 'relative_duration',
        dueBy: { anchor: 'destination_arrival', relation: 'at', offsetMinutes: 15, semantics: 'mandatory' },
      }),
      null,
    )
    assert.equal(
      temporalRuleLesen({
        kind: 'relative_duration',
        availableFrom: { anchor: 'border_crossing', relation: 'at', offsetMinutes: -1 },
      }),
      null,
    )
  })

  test('3. before/after mit 0/negativ/Fraction/NaN/Infinity verworfen', () => {
    const basis = { kind: 'relative_duration' as const, availableFrom: { anchor: 'trip_departure', relation: 'before' } }
    for (const offset of [0, -1, -72, 72.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '72', null]) {
      assert.equal(
        temporalRuleLesen({
          ...basis,
          availableFrom: { ...basis.availableFrom, offsetMinutes: offset },
        }),
        null,
        `offset ${String(offset)}`,
      )
    }
    assert.equal(
      temporalRuleLesen({
        kind: 'relative_duration',
        availableFrom: { anchor: 'trip_departure', relation: 'after', offsetMinutes: 0 },
      }),
      null,
    )
    assert.equal(
      temporalRuleLesen({
        kind: 'relative_duration',
        availableFrom: { anchor: 'trip_departure', relation: 'after', offsetMinutes: STUNDEN_24 },
      })?.availableFrom?.offsetMinutes,
      STUNDEN_24,
    )
    assert.equal(
      temporalRuleLesen({
        kind: 'relative_duration',
        availableFrom: {
          anchor: 'destination_arrival',
          relation: 'before',
          offsetMinutes: OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES + 1,
        },
      }),
      null,
    )
    assert.equal(
      temporalRuleLesen({
        kind: 'relative_duration',
        availableFrom: {
          anchor: 'destination_arrival',
          relation: 'before',
          offsetMinutes: OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES,
        },
      })?.availableFrom?.offsetMinutes,
      OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES,
    )
  })

  test('4. mandatory und recommended bleiben unterscheidbar', () => {
    const mandatory = temporalRuleLesen({
      kind: 'relative_duration',
      dueBy: { anchor: 'destination_arrival', relation: 'at', offsetMinutes: 0, semantics: 'mandatory' },
    })
    const recommended = temporalRuleLesen({
      kind: 'relative_duration',
      dueBy: {
        anchor: 'trip_departure',
        relation: 'before',
        offsetMinutes: STUNDEN_24,
        semantics: 'recommended',
      },
    })
    assert.equal(mandatory?.dueBy?.semantics, 'mandatory')
    assert.equal(recommended?.dueBy?.semantics, 'recommended')
    assert.equal(temporalRulesGleich(mandatory, recommended), false)
    assert.deepEqual(officialTemporalTexte(mandatory), ['Pflichtfrist: spätestens bei Ankunft'])
    assert.deepEqual(officialTemporalTexte(recommended), ['Empfohlen bis: 24 Std. vor Abreise'])
    assert.equal(
      temporalRuleLesen({
        kind: 'relative_duration',
        dueBy: { anchor: 'destination_arrival', relation: 'at', offsetMinutes: 0 },
      }),
      null,
    )
    assert.equal(
      temporalRuleLesen({
        kind: 'relative_duration',
        dueBy: { anchor: 'destination_arrival', relation: 'at', offsetMinutes: 0, semantics: 'optional' },
      }),
      null,
    )
  })

  test('5. malformed/unsupported Timing verändert gültige Requirement-Hard-Truth nicht', async () => {
    const ungueltig = [
      '72 hours before arrival',
      { kind: 'calendar_day', availableFrom: { anchor: 'destination_arrival', relation: 'before', offsetMinutes: STUNDEN_72 } },
      { kind: 'absolute_timestamp', dueBy: '2026-09-12T10:00:00.000Z' },
      { kind: 'relative_duration' },
      { kind: 'relative_duration', availableFrom: { anchor: 'airport_checkin', relation: 'before', offsetMinutes: 180 } },
      { kind: 'relative_duration', availableFrom: { anchor: 'destination_arrival', relation: 'around', offsetMinutes: 60 } },
    ]
    for (const temporalRule of ungueltig) {
      const evaluation = finden(await auswerten([zeile({ result: 'required', temporalRule })]))
      assert.equal(evaluation?.result, 'required', String(temporalRule))
      assert.equal(evaluation?.status, 'current', String(temporalRule))
      assert.equal(evaluation?.freshness, 'current', String(temporalRule))
      assert.equal(evaluation?.temporalRule, null, String(temporalRule))
      assert.deepEqual(timingTexteVon(evaluation), [])
    }
  })

  test('6. not_required trägt nie Timing', async () => {
    const evaluation = finden(
      await auswerten([zeile({ result: 'not_required', temporalRule: arrivalCard72h })]),
    )
    assert.equal(evaluation?.result, 'not_required')
    assert.equal(evaluation?.status, 'current')
    assert.equal(evaluation?.temporalRule, null)
    assert.deepEqual(timingTexteVon(evaluation), [])
  })

  test('7. stale/recheck/unavailable/insufficient-context trägt nie Timing', async () => {
    const recheck = finden(
      await auswerten([
        zeile({
          temporalRule: arrivalCard72h,
          checkedAt: '2026-08-30T08:00:00.000Z',
        }),
      ]),
    )
    assert.equal(recheck?.freshness, 'recheck_needed')
    assert.notEqual(recheck?.status, 'current')
    assert.equal(recheck?.temporalRule, null)

    const sourceDown = finden(
      await auswerten([
        zeile({
          temporalRule: arrivalCard72h,
          availability: 'temporarily_unavailable',
        }),
      ]),
    )
    assert.equal(sourceDown?.freshness, 'source_temporarily_unavailable')
    assert.equal(sourceDown?.temporalRule, null)

    const missing = finden(
      await auswerten([
        zeile({
          temporalRule: arrivalCard72h,
          result: 'insufficient_context',
          missingFacts: ['nationality'],
        }),
      ]),
    )
    assert.equal(missing?.status, 'insufficient_context')
    assert.equal(missing?.temporalRule, null)

    const leer = officialLeer({
      requirementType: 'entry_form',
      contextFingerprint: 'off-e4-leer',
    })
    assert.equal(leer.temporalRule, null)
    assert.equal(officialDarfTemporalTragen({ result: 'required', status: 'current', freshness: 'stale' }), false)
    assert.equal(officialDarfTemporalTragen({ result: 'required', status: 'unknown', freshness: 'current' }), false)
    assert.equal(officialDarfTemporalTragen({ result: 'unknown', status: 'current', freshness: 'current' }), false)
  })

  test('8. Visa-Conflict-Degradation löscht Timing', async () => {
    const visa = finden(
      await auswerten([
        zeile({
          requirementType: 'visa',
          result: 'required',
          visaMode: 'visa_exempt',
          temporalRule: arrivalCard72h,
        }),
      ]),
      { requirementType: 'visa' },
    )
    assert.equal(visa?.result, 'unknown')
    assert.equal(visa?.visaMode, 'unknown')
    assert.notEqual(visa?.status, 'current')
    assert.equal(visa?.temporalRule, null)

    const direkt = officialVisaWiderspruchDegradieren({
      ...officialLeer({ requirementType: 'visa', contextFingerprint: 'off-e4-widerspruch' }),
      result: 'required',
      status: 'current',
      freshness: 'current',
      officialClass: 'requirement',
      visaMode: 'visa_exempt',
      temporalRule: temporalRuleLesen(arrivalCard72h),
    })
    assert.equal(direkt.result, 'unknown')
    assert.equal(direkt.temporalRule, null)
  })

  test('9. Duplicate gleiche Entscheidung + widersprüchliches Timing → Requirement bleibt, Timing null', async () => {
    const andereFrist = {
      kind: 'relative_duration' as const,
      availableFrom: {
        anchor: 'destination_arrival' as const,
        relation: 'before' as const,
        offsetMinutes: STUNDEN_24,
      },
    }
    const evaluation = finden(
      await auswerten([
        zeile({ temporalRule: arrivalCard72h }),
        zeile({ temporalRule: andereFrist }),
      ]),
    )
    assert.equal(evaluation?.result, 'required')
    assert.equal(evaluation?.status, 'current')
    assert.equal(evaluation?.freshness, 'current')
    assert.equal(evaluation?.temporalRule, null)
    assert.deepEqual(timingTexteVon(evaluation), [])
  })

  test('10. Duplicate gleiche Entscheidung + identisches Timing → Timing bleibt', async () => {
    const evaluation = finden(
      await auswerten([
        zeile({ temporalRule: { ...arrivalCard72h } }),
        zeile({
          temporalRule: {
            dueBy: arrivalCard72h.dueBy,
            kind: arrivalCard72h.kind,
            availableFrom: arrivalCard72h.availableFrom,
          },
        }),
      ]),
    )
    assert.equal(evaluation?.result, 'required')
    assert.deepEqual(evaluation?.temporalRule, temporalRuleLesen(arrivalCard72h))
  })

  test('11. Duplicate-Reihenfolge/Permutation verändert Ergebnis nicht', async () => {
    const andereFrist = {
      kind: 'relative_duration' as const,
      dueBy: {
        anchor: 'trip_departure' as const,
        relation: 'before' as const,
        offsetMinutes: STUNDEN_24,
        semantics: 'recommended' as const,
      },
    }
    const vorwaerts = finden(await auswerten([zeile({ temporalRule: arrivalCard72h }), zeile({ temporalRule: andereFrist })]))
    const rueckwaerts = finden(
      await auswerten([zeile({ temporalRule: andereFrist }), zeile({ temporalRule: arrivalCard72h })]),
    )
    assert.equal(vorwaerts?.result, 'required')
    assert.equal(rueckwaerts?.result, 'required')
    assert.equal(vorwaerts?.temporalRule, null)
    assert.equal(rueckwaerts?.temporalRule, null)

    const nullZuerst = finden(await auswerten([zeile({}), zeile({ temporalRule: arrivalCard72h })]))
    const wertZuerst = finden(await auswerten([zeile({ temporalRule: arrivalCard72h }), zeile({})]))
    assert.equal(nullZuerst?.result, 'required')
    assert.equal(wertZuerst?.result, 'required')
    assert.equal(nullZuerst?.temporalRule, null)
    assert.equal(wertZuerst?.temporalRule, null)

    const identischA = finden(
      await auswerten([zeile({ temporalRule: arrivalCard72h }), zeile({ temporalRule: arrivalCard72h })]),
    )
    const identischB = finden(
      await auswerten([zeile({ temporalRule: arrivalCard72h }), zeile({ temporalRule: { ...arrivalCard72h } })]),
    )
    assert.deepEqual(identischA?.temporalRule, identischB?.temporalRule)
    assert.equal(identischA?.temporalRule?.availableFrom?.offsetMinutes, STUNDEN_72)
  })

  test('12. Multi-Citizenship/Multi-Document: Timing bleibt exakt credential-spezifisch', async () => {
    const rsTiming = {
      kind: 'relative_duration' as const,
      dueBy: {
        anchor: 'trip_departure' as const,
        relation: 'before' as const,
        offsetMinutes: STUNDEN_24,
        semantics: 'recommended' as const,
      },
    }
    const evaluations = await auswerten([
      zeile({
        credentialOptionRef: 'traveller:1:document:passport:CH',
        temporalRule: arrivalCard72h,
      }),
      zeile({
        credentialOptionRef: 'traveller:1:document:passport:RS',
        temporalRule: rsTiming,
      }),
    ])
    const ch = finden(evaluations, { credentialOptionRef: 'traveller:1:document:passport:CH' })
    const rs = finden(evaluations, { credentialOptionRef: 'traveller:1:document:passport:RS' })
    assert.equal(ch?.result, 'required')
    assert.equal(rs?.result, 'required')
    assert.equal(ch?.temporalRule?.availableFrom?.offsetMinutes, STUNDEN_72)
    assert.equal(rs?.temporalRule?.dueBy?.semantics, 'recommended')
    assert.equal(temporalRulesGleich(ch?.temporalRule, rs?.temporalRule), false)
    assert.notEqual(ch?.credentialOptionRef, rs?.credentialOptionRef)
  })

  test('13. Transit-Timing bleibt am exakten Transit-Country-Scope', async () => {
    const sgTiming = {
      kind: 'relative_duration' as const,
      availableFrom: {
        anchor: 'transit_arrival' as const,
        relation: 'before' as const,
        offsetMinutes: STUNDEN_24,
      },
    }
    const qaTiming = {
      kind: 'relative_duration' as const,
      dueBy: {
        anchor: 'transit_arrival' as const,
        relation: 'at' as const,
        offsetMinutes: 0,
        semantics: 'mandatory' as const,
      },
    }
    const evaluations = await auswerten([
      zeile({
        requirementType: 'transit',
        transitCountryCode: 'SG',
        temporalRule: sgTiming,
      }),
      zeile({
        requirementType: 'transit',
        transitCountryCode: 'QA',
        temporalRule: qaTiming,
      }),
    ])
    const sg = finden(evaluations, { requirementType: 'transit', transitCountryCode: 'SG' })
    const qa = finden(evaluations, { requirementType: 'transit', transitCountryCode: 'QA' })
    assert.equal(sg?.transitCountryCode, 'SG')
    assert.equal(qa?.transitCountryCode, 'QA')
    assert.equal(sg?.temporalRule?.availableFrom?.anchor, 'transit_arrival')
    assert.equal(qa?.temporalRule?.dueBy?.anchor, 'transit_arrival')
    assert.equal(temporalRulesGleich(sg?.temporalRule, qa?.temporalRule), false)
    assert.deepEqual(timingTexteVon(sg), ['Ab 24 Std. vor Transit-Ankunft möglich'])
    assert.deepEqual(timingTexteVon(qa), ['Pflichtfrist: spätestens bei Transit-Ankunft'])
  })

  test('14. Presentation zeigt Timing nur aus temporalRule, niemals aus validFrom/URL/Typ', async () => {
    const ohneRegel = finden(
      await auswerten([
        zeile({
          validFrom: '2026-09-09',
          validUntil: '2026-09-12T10:00:00.000Z',
          sourceUrl: 'https://example.test/apply-72h-before-arrival',
        }),
      ]),
    )
    assert.equal(ohneRegel?.result, 'required')
    assert.equal(ohneRegel?.evidence.validFrom, '2026-09-09')
    assert.equal(ohneRegel?.temporalRule, null)
    assert.deepEqual(timingTexteVon(ohneRegel), [])

    const staleMitRegel: OfficialEvaluation = {
      ...officialLeer({ requirementType: 'entry_form', contextFingerprint: 'off-e4-stale' }),
      result: 'required',
      status: 'current',
      freshness: 'stale',
      officialClass: 'requirement',
      temporalRule: temporalRuleLesen(arrivalCard72h),
    }
    assert.deepEqual(timingTexteVon(staleMitRegel), [])
    assert.deepEqual(officialTemporalTexte(null), [])

    const engine = quelle('lib/readiness/engine.ts')
    const presentation = quelle('lib/readiness/official-presentation.ts')
    const temporal = quelle('lib/readiness/temporal.ts')
    const ui = quelle('components/trips/Reisevorbereitung.tsx')
    for (const datei of [engine, presentation, temporal, ui]) {
      assert.equal(datei.includes('evaluations[0]'), false)
      assert.equal(datei.includes('documents[0]'), false)
    }
    assert.equal(ui.includes('timingTexte'), true)
    assert.equal(presentation.includes('officialTemporalTexte'), true)
    assert.equal(temporal.includes('validFrom'), true)
    assert.match(temporal, /Liest weder URL, Requirement-Typ, validFrom\/validUntil/)
    assert.doesNotMatch(officialTemporalTexte(temporalRuleLesen(arrivalCard72h)).join(' '), /\d{4}-\d{2}-\d{2}|UTC|:\d{2}/)
  })

  test('15. requirementsProviderAus() bleibt null', () => {
    assert.equal(requirementsProviderAus(), null)
  })

  test('geschlossene Taxonomie und Safety-Bound sind vollständig', () => {
    assert.deepEqual([...OFFICIAL_TEMPORAL_ANCHORS], [
      'trip_departure',
      'destination_arrival',
      'transit_arrival',
      'border_crossing',
    ])
    assert.deepEqual([...OFFICIAL_TEMPORAL_RELATIONS], ['before', 'at', 'after'])
    assert.deepEqual([...OFFICIAL_TEMPORAL_DUE_SEMANTICS], ['mandatory', 'recommended'])
    assert.equal(OFFICIAL_TEMPORAL_KIND, 'relative_duration')
    assert.equal(OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES, 2 * 365 * 24 * 60)
    assert.equal(officialDarfTemporalTragen({ result: 'conditional', status: 'current', freshness: 'current' }), true)
  })
})
