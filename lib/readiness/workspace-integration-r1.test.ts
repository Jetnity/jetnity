// lib/readiness/workspace-integration-r1.test.ts
//
// Readiness Workspace Integration R1: keine parallelen groben Duplicate-Karten,
// nur reine Placeholder kompakt. Keine Domain-Mutation. Kein Provider.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { officialLeer, visaModeLesen, type OfficialEvaluation } from '@/lib/readiness/official'
import {
  OFFICIAL_PLACEHOLDER_BLOCK_TITEL,
  officialChecklist,
  officialZeileIstReinerPlaceholder,
} from '@/lib/readiness/official-presentation'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { readinessAnsicht } from '@/lib/readiness/status'
import {
  READINESS_WORKSPACE_DUPLICATE_KINDS,
  readinessWorkspaceIstDuplicateKind,
  readinessWorkspaceSichtbar,
  readinessWorkspaceZaehlung,
} from '@/lib/readiness/workspace-presentation'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { unbestaetigteBuchung } from '@/lib/trips/buchung'
import type { Trip, TripItem, TripReadinessItem, TripTraveller } from '@/types/trips'
import { OFFICIAL_REQUIREMENT_TYPES } from '@/types/trips'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

const JETZT = '2026-08-31T08:00:00.000Z'

function traveller(teil: Partial<TripTraveller> & Pick<TripTraveller, 'clientRef'>): TripTraveller {
  return {
    id: teil.id ?? teil.clientRef,
    label: teil.label ?? `Reisende ${teil.clientRef}`,
    residenceCountryCode: teil.residenceCountryCode ?? null,
    citizenships: teil.citizenships ?? [],
    documents: teil.documents ?? [],
    createdAt: teil.createdAt ?? JETZT,
    updatedAt: teil.updatedAt ?? JETZT,
    ...teil,
  }
}

function passCH(clientRef = 'traveller:1'): TripTraveller {
  return traveller({
    clientRef,
    label: clientRef === 'traveller:1' ? 'Reisende 1' : 'Reisende 2',
    citizenships: [
      {
        id: 'citizenship:CH',
        clientRef: 'citizenship:CH',
        countryCode: 'CH',
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
    ],
  })
}

function leer(
  teil: Partial<OfficialEvaluation> & Pick<OfficialEvaluation, 'requirementType'>,
): OfficialEvaluation {
  return officialLeer({
    travellerClientRef: teil.travellerClientRef ?? 'traveller:1',
    credentialOptionRef: teil.credentialOptionRef ?? 'traveller:1:document:passport:CH',
    destinationCountryCode: teil.destinationCountryCode ?? 'TH',
    transitCountryCode: teil.transitCountryCode ?? null,
    requirementType: teil.requirementType,
    status: teil.status ?? 'unavailable',
    freshness: teil.freshness ?? 'provider_unavailable',
    missingFacts: teil.missingFacts ?? [],
    contextFingerprint: teil.evidence?.contextFingerprint ?? 'off',
  })
}

function konkret(
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
      ruleReference: 'RULE-1',
      contextFingerprint: 'off',
      ...(teil.evidence ?? {}),
    },
  }
}

function matrix(teil: Partial<OfficialEvaluation> = {}): OfficialEvaluation[] {
  return OFFICIAL_REQUIREMENT_TYPES.map((requirementType) =>
    leer({
      requirementType,
      ...teil,
      missingFacts: teil.missingFacts ?? ['nationality'],
      status: teil.status ?? 'insufficient_context',
      freshness: teil.freshness ?? 'provider_unavailable',
    }),
  )
}

function slotsFuer(...clientRefs: string[]) {
  return clientRefs.map((clientRef, index) => ({
    clientRef,
    label: `Reisende ${index + 1}`,
  }))
}

function eintraege(
  evaluations: OfficialEvaluation[],
  party: readonly TripTraveller[] = [passCH()],
  slots = slotsFuer('traveller:1'),
) {
  return officialChecklist({ evaluations, party, slots }).flatMap((gruppe) => gruppe.eintraege)
}

function flugGebucht(teil: Partial<TripItem> = {}): TripItem {
  return {
    id: 'flight-1',
    dayId: 'day-1',
    stageId: 'stage-1',
    kind: 'flight',
    title: 'ZRH → BKK',
    note: null,
    position: 1,
    startsOn: '2026-09-12',
    startsAt: '10:00',
    endsOn: '2026-09-12',
    endsAt: '18:00',
    priceAmount: 400,
    priceCurrency: 'CHF',
    provider: null,
    externalRef: null,
    bookingUrl: null,
    ...unbestaetigteBuchung(),
    bookingStatus: 'booked',
    bookingSource: 'user',
    bookingConfirmedAt: JETZT,
    mobilityMode: null,
    originPlaceId: null,
    destinationPlaceId: null,
    originName: null,
    destinationName: null,
    connectionRef: null,
    mobilityChanges: null,
    mobilityEvidence: null,
    rentalSupplier: null,
    vehicleClass: null,
    transmission: null,
    rentalEvidence: null,
    ...teil,
  }
}

function persistiert(
  reise: Trip,
  teil: Partial<TripReadinessItem> & Pick<TripReadinessItem, 'clientRef' | 'kind'>,
): TripReadinessItem {
  return {
    id: teil.clientRef,
    userStatus: 'done',
    evidence: 'user',
    countryCode: teil.kind === 'insurance_check' || teil.kind === 'preparation' ? null : 'IT',
    tripItemId: null,
    title: teil.kind === 'preparation' ? 'Reiseadapter einpacken' : null,
    contextFingerprint: 'v4|test',
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

describe('Readiness Workspace Integration R1', () => {
  test('1. ein Traveller / ein Ziel / kein Provider → keine 15+ Placeholder-Karten', () => {
    const reise = beispielreise({
      travellers: 1,
      party: [traveller({ clientRef: 'traveller:1', label: 'Reisende 1' })],
    })
    const { evaluations } = readinessAnsicht(reise)
    assert.ok(evaluations.length >= 15)
    assert.equal(
      evaluations.every((evaluation) => officialZeileIstReinerPlaceholder(evaluation)),
      true,
    )
    const liste = eintraege(evaluations, reise.party ?? [], slotsFuer('traveller:1'))
    assert.ok(liste.length < 5)
    assert.equal(liste.filter((eintrag) => eintrag.kompakt).length, 1)
    assert.equal(liste.some((eintrag) => eintrag.titel === OFFICIAL_PLACEHOLDER_BLOCK_TITEL), true)
    assert.equal(
      liste.some((eintrag) => eintrag.titel.includes('Elektronische Reisegenehmigung')),
      false,
    )
    assert.equal(requirementsProviderAus(), null)
  })

  test('2. fehlende Staatsangehörigkeit → ein kompakter blocked Scope', () => {
    const evaluations = matrix({ missingFacts: ['nationality'], status: 'insufficient_context' })
    const liste = eintraege(evaluations)
    assert.equal(liste.length, 1)
    assert.equal(liste[0]?.kompakt, true)
    assert.equal(liste[0]?.titel, OFFICIAL_PLACEHOLDER_BLOCK_TITEL)
    assert.match(liste[0]?.ergebnisText ?? '', /Staatsangehörigkeit/)
    assert.doesNotMatch(liste[0]?.ergebnisText ?? '', /eTA|Einreiseformular|Gesundheitsdokument/)
    assert.equal(
      liste.some((eintrag) =>
        ['electronic_travel_authorization', 'entry_form', 'health', 'health_document'].includes(
          eintrag.requirementType ?? '',
        ),
      ),
      false,
    )
  })

  test('3. aktuelle konkrete Visa-Requirement bleibt einzeln sichtbar', () => {
    const visa = konkret({
      requirementType: 'visa',
      result: 'required',
      status: 'current',
      freshness: 'current',
      visaMode: 'electronic_visa',
    })
    const liste = eintraege([visa])
    assert.equal(liste.length, 1)
    assert.equal(liste[0]?.kompakt, false)
    assert.equal(liste[0]?.requirementType, 'visa')
    assert.equal(liste[0]?.titel, 'Visum · E-Visum')
    assert.equal(liste[0]?.ergebnisText, 'Erforderlich')
  })

  test('4. aktuelle Visa + restliche Placeholder → Visa einzeln + ein kompakter Block', () => {
    const visa = konkret({
      requirementType: 'visa',
      result: 'required',
      status: 'current',
      freshness: 'current',
      visaMode: 'electronic_visa',
    })
    const rest = matrix().filter((evaluation) => evaluation.requirementType !== 'visa')
    const liste = eintraege([visa, ...rest])
    assert.equal(liste.filter((eintrag) => eintrag.requirementType === 'visa' && !eintrag.kompakt).length, 1)
    assert.equal(liste.filter((eintrag) => eintrag.kompakt).length, 1)
    assert.equal(liste.length, 2)
    assert.equal(
      liste.some((eintrag) => eintrag.titel === 'Elektronische Reisegenehmigung (eTA)'),
      false,
    )
  })

  test('5. stale / recheck / evidence-bearing Rows bleiben einzeln', () => {
    const stale = konkret({
      requirementType: 'entry_form',
      result: 'required',
      status: 'current',
      freshness: 'stale',
    })
    const recheck = konkret({
      requirementType: 'health',
      result: 'unknown',
      status: 'unknown',
      freshness: 'recheck_needed',
    })
    const sourceDown = konkret({
      requirementType: 'insurance',
      result: 'unknown',
      status: 'unavailable',
      freshness: 'source_temporarily_unavailable',
    })
    const mitAction = konkret({
      requirementType: 'visa',
      result: 'required',
      status: 'current',
      freshness: 'current',
      visaMode: 'electronic_visa',
      action: { kind: 'open_official_action', purpose: 'application', href: 'https://example.test/apply' },
    })
    const mitTiming = konkret({
      requirementType: 'entry_form',
      result: 'required',
      status: 'current',
      freshness: 'current',
      temporalRule: {
        kind: 'relative_duration',
        availableFrom: { anchor: 'destination_arrival', relation: 'before', offsetMinutes: 4320 },
        dueBy: { anchor: 'destination_arrival', relation: 'at', offsetMinutes: 0, semantics: 'mandatory' },
      },
    })
    const liste = eintraege([stale, recheck, sourceDown, mitAction, mitTiming])
    assert.equal(liste.length, 5)
    assert.equal(liste.every((eintrag) => eintrag.kompakt === false), true)
    assert.equal(officialZeileIstReinerPlaceholder(stale), false)
    assert.equal(officialZeileIstReinerPlaceholder(recheck), false)
    assert.equal(officialZeileIstReinerPlaceholder(sourceDown), false)
  })

  test('6. zwei Traveller bleiben getrennt', () => {
    const a = matrix({ travellerClientRef: 'traveller:1' })
    const b = matrix({
      travellerClientRef: 'traveller:2',
      credentialOptionRef: 'traveller:2:document:passport:CH',
    })
    const liste = eintraege(
      [...a, ...b],
      [passCH('traveller:1'), passCH('traveller:2')],
      slotsFuer('traveller:1', 'traveller:2'),
    )
    assert.equal(liste.length, 2)
    assert.equal(liste.every((eintrag) => eintrag.kompakt), true)
    assert.notEqual(liste[0]?.scopeKey, liste[1]?.scopeKey)
    assert.notEqual(liste[0]?.travellerLabel, liste[1]?.travellerLabel)
  })

  test('7. zwei Credential-Optionen bleiben getrennt', () => {
    const pass = matrix({ credentialOptionRef: 'traveller:1:document:passport:CH' })
    const ausweis = matrix({ credentialOptionRef: 'traveller:1:document:national_id:HR' })
    const partei: TripTraveller[] = [
      {
        ...passCH(),
        citizenships: [
          ...passCH().citizenships,
          {
            id: 'citizenship:HR',
            clientRef: 'citizenship:HR',
            countryCode: 'HR',
            createdAt: JETZT,
            updatedAt: JETZT,
          },
        ],
        documents: [
          ...passCH().documents,
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
      },
    ]
    const liste = eintraege([...pass, ...ausweis], partei)
    assert.equal(liste.length, 2)
    assert.equal(new Set(liste.map((eintrag) => eintrag.credentialLabel)).size, 2)
    assert.match(liste.map((eintrag) => eintrag.credentialLabel).join('|'), /Reisepass/)
    assert.match(liste.map((eintrag) => eintrag.credentialLabel).join('|'), /Personalausweis/)
  })

  test('8. Transit-Scope bleibt getrennt', () => {
    const ziel = matrix({ transitCountryCode: null })
    const transit = [
      leer({
        requirementType: 'transit',
        transitCountryCode: 'QA',
        missingFacts: ['nationality'],
        status: 'insufficient_context',
      }),
    ]
    const liste = eintraege([...ziel, ...transit])
    assert.equal(liste.length, 2)
    assert.equal(liste.every((eintrag) => eintrag.kompakt), true)
    assert.equal(liste.some((eintrag) => eintrag.ortText?.includes('Transit')), true)
    assert.equal(
      liste.filter((eintrag) => eintrag.ortText?.includes('Transit')).length,
      1,
    )
  })

  test('9. keine groben Duplicate-Karten in der primären Workspace-Presentation', () => {
    const reise = beispielreise({
      travellers: 1,
      party: [traveller({ clientRef: 'traveller:1', label: 'Reisende 1' })],
    })
    const { items } = readinessAnsicht(reise)
    const duplicate = items.filter((item) => readinessWorkspaceIstDuplicateKind(item.kind))
    assert.ok(duplicate.length >= 4)
    const sichtbar = readinessWorkspaceSichtbar(items)
    assert.equal(sichtbar.some((item) => readinessWorkspaceIstDuplicateKind(item.kind)), false)
    assert.deepEqual([...READINESS_WORKSPACE_DUPLICATE_KINDS], [
      'entry_check',
      'visa_check',
      'travel_document_check',
      'insurance_check',
    ])
    const ui = quelle('components/trips/Reisevorbereitung.tsx')
    assert.equal(ui.includes('readinessWorkspaceSichtbar'), true)
    assert.equal(ui.includes('readinessWorkspaceZusammenfassung'), true)
    assert.doesNotMatch(ui, /const gruppeItems = items\.filter/)
  })

  test('10. Ticket-/Booking-/Custom-Preparation bleiben sichtbar', () => {
    const basis = beispielreise({ travellers: 1, party: [traveller({ clientRef: 'traveller:1' })] })
    const reise = beispielreise({
      travellers: 1,
      party: [traveller({ clientRef: 'traveller:1', label: 'Reisende 1' })],
      ohneTag: [flugGebucht()],
      readinessItems: [persistiert(basis, { clientRef: 'preparation:adapter', kind: 'preparation', userStatus: 'open' })],
    })
    const { items } = readinessAnsicht(reise)
    const sichtbar = readinessWorkspaceSichtbar(items)
    assert.equal(sichtbar.some((item) => item.kind === 'ticket_confirmation_check'), true)
    assert.equal(sichtbar.some((item) => item.kind === 'booking_confirmation_check'), true)
    assert.equal(sichtbar.some((item) => item.kind === 'preparation'), true)
    assert.equal(sichtbar.some((item) => item.kind === 'entry_check'), false)
  })

  test('11. sichtbare persönliche Counts entsprechen sichtbaren persönlichen Items', () => {
    const basis = beispielreise({ travellers: 1 })
    const reise = beispielreise({
      travellers: 1,
      party: [traveller({ clientRef: 'traveller:1' })],
      ohneTag: [flugGebucht()],
      readinessItems: [
        persistiert(basis, { clientRef: 'entry_check:IT:traveller:1', kind: 'entry_check', userStatus: 'done' }),
        persistiert(basis, { clientRef: 'visa_check:IT:traveller:1', kind: 'visa_check', userStatus: 'done' }),
        persistiert(basis, {
          clientRef: 'preparation:adapter',
          kind: 'preparation',
          userStatus: 'open',
        }),
      ],
    })
    const { items, summary } = readinessAnsicht(reise)
    const sichtbar = readinessWorkspaceSichtbar(items)
    const zaehlung = readinessWorkspaceZaehlung(items)
    const sichtbarZaehlbar = sichtbar.filter((item) => item.currentness !== 'not_applicable')
    assert.equal(
      zaehlung.open,
      sichtbarZaehlbar.filter((item) => item.currentness === 'current' && item.userStatus === 'open').length,
    )
    assert.equal(
      zaehlung.done,
      sichtbarZaehlbar.filter((item) => item.currentness === 'current' && item.userStatus === 'done').length,
    )
    assert.equal(
      items.some((item) => item.kind === 'entry_check' && item.userStatus === 'done'),
      true,
    )
    assert.ok(summary.done + summary.stale >= 1)
    assert.equal(zaehlung.done, 0)
    assert.ok(zaehlung.open >= 1)
    assert.equal(
      sichtbar.some((item) => item.kind === 'entry_check' || item.kind === 'visa_check'),
      false,
    )
  })

  test('12. persistierte Legacy-Duplicate-Items bleiben im Domain-Result erhalten', () => {
    const basis = beispielreise({ travellers: 1 })
    const reise = beispielreise({
      travellers: 1,
      party: [traveller({ clientRef: 'traveller:1' })],
      readinessItems: [
        persistiert(basis, {
          clientRef: 'entry_check:IT:traveller:1',
          kind: 'entry_check',
          userStatus: 'done',
        }),
        persistiert(basis, {
          clientRef: 'insurance_check:trip',
          kind: 'insurance_check',
          userStatus: 'skipped',
          countryCode: null,
        }),
      ],
    })
    const { items } = readinessAnsicht(reise)
    assert.equal(items.some((item) => item.kind === 'entry_check' && item.persisted), true)
    assert.equal(items.some((item) => item.kind === 'insurance_check' && item.userStatus === 'skipped'), true)
    assert.equal(readinessWorkspaceSichtbar(items).some((item) => item.kind === 'entry_check'), false)
    const status = quelle('lib/readiness/status.ts')
    const ableitung = quelle('lib/readiness/ableitung.ts')
    const attention = quelle('lib/trips/attention.ts')
    assert.equal(status.includes('readinessWorkspaceSichtbar'), false)
    assert.equal(ableitung.includes('readinessWorkspaceSichtbar'), false)
    assert.equal(attention.includes('readinessWorkspaceSichtbar'), false)
  })

  test('13. E1–E4 Presentation-Invarianten und Factory bleiben unangetastet', () => {
    assert.equal(requirementsProviderAus(), null)
    const presentation = quelle('lib/readiness/official-presentation.ts')
    const ui = quelle('components/trips/Reisevorbereitung.tsx')
    const workspace = quelle('lib/readiness/workspace-presentation.ts')
    for (const datei of [presentation, ui, workspace]) {
      assert.equal(datei.includes('evaluations[0]'), false)
      assert.equal(datei.includes('documents[0]'), false)
      assert.equal(datei.includes('best passport'), false)
      assert.equal(datei.includes('bester Pass'), false)
    }
    const visa = konkret({
      requirementType: 'visa',
      result: 'required',
      status: 'current',
      freshness: 'current',
      visaMode: 'electronic_visa',
      temporalRule: {
        kind: 'relative_duration',
        availableFrom: { anchor: 'destination_arrival', relation: 'before', offsetMinutes: 4320 },
        dueBy: { anchor: 'destination_arrival', relation: 'at', offsetMinutes: 0, semantics: 'mandatory' },
      },
    })
    const liste = eintraege([visa])
    assert.equal(liste[0]?.timingTexte.includes('Ab 72 Std. vor Ankunft möglich'), true)
    assert.equal(liste[0]?.kompakt, false)
  })

  test('Placeholder-Kollaps ist permutationsstabil und ändert keine Engine-Wahrheit', () => {
    const vorwaerts = matrix()
    const rueckwaerts = [...vorwaerts].reverse()
    const vorher = vorwaerts.map((evaluation) => ({
      result: evaluation.result,
      status: evaluation.status,
      freshness: evaluation.freshness,
      requirementType: evaluation.requirementType,
    }))
    const a = eintraege(vorwaerts).map((eintrag) => eintrag.scopeKey)
    const b = eintraege(rueckwaerts).map((eintrag) => eintrag.scopeKey)
    assert.deepEqual(a, b)
    assert.deepEqual(
      vorwaerts.map((evaluation) => ({
        result: evaluation.result,
        status: evaluation.status,
        freshness: evaluation.freshness,
        requirementType: evaluation.requirementType,
      })),
      vorher,
    )
  })

  test('source_temporarily_unavailable ohne Evidence darf kollabieren, mit Evidence nicht', () => {
    const leerSource = leer({
      requirementType: 'health',
      status: 'unavailable',
      freshness: 'source_temporarily_unavailable',
    })
    const mitEvidence = konkret({
      requirementType: 'health',
      result: 'unknown',
      status: 'unavailable',
      freshness: 'source_temporarily_unavailable',
    })
    assert.equal(officialZeileIstReinerPlaceholder(leerSource), true)
    assert.equal(officialZeileIstReinerPlaceholder(mitEvidence), false)
    assert.equal(eintraege([leerSource, ...matrix().filter((e) => e.requirementType !== 'health')]).length, 1)
    assert.equal(eintraege([mitEvidence]).length, 1)
    assert.equal(eintraege([mitEvidence])[0]?.kompakt, false)
  })
})
