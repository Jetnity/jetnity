// lib/readiness/official-truth-review-suggestion.test.ts
//
// Hinweisvorschlag nur über ein neu belegtes Prüfpaket und dessen Identität.
// Synthetische .example-Quellen. Keine Annahme, kein Speicher, kein Netz.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { officialTruthRegelReviewPacket } from '@/lib/readiness/official-truth-rule-review-packet'
import { officialTruthRegelReviewPacketFingerprint } from '@/lib/readiness/official-truth-rule-review-fingerprint'
import {
  officialTruthRegelReviewVorschlag,
  type OfficialTruthRegelReviewVorschlagErgebnis,
} from '@/lib/readiness/official-truth-review-suggestion'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { regelScopeAusEvidenceScope, type RegelFaktArt, type RegelScope } from '@/lib/readiness/rule-claims'
import {
  officialTruthRechercheEntscheiden,
  type OfficialTruthRechercheAnfrage,
  type OfficialTruthRechercheGrund,
} from '@/lib/readiness/official-truth-research-request'
import {
  quellenRegistryErstellen,
  type QuellenEingabe,
  type QuellenRegistry,
  type RegistrierteQuelle,
} from '@/lib/readiness/source-registry'
import { type QuellenAbdeckung, type QuellenDeskriptor } from '@/lib/readiness/source-router'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

const UHR = '2026-10-01T12:00:00.000Z'
const ABGERUFEN = '2026-10-01T11:00:00.000Z'
const SNAPSHOT = 'official page line\nunchanged'
const QUELLE = 'example-border-authority'
const ANDERE = 'example-interior-authority'
const ANBIETER = 'example-licensed-provider'
const VORSCHLAG = { kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa' } as const
const GEHEIM = 'personal-secret-91f3'
const MARKER = 'TRUSTED-MARKER-SHOULD-NOT-ECHO'
const FREMDE_ID = 'not-in-packet-91f3'
const FREITEXT = 'Ada Beispiel passport XC-44821 born 1984-03-17'
const AUSGABE = ['status', 'reviewPacketKey', 'ruleScopeKey', 'assessment', 'citedSupportVersionIds', 'reasonCodes']
const SCHLUESSEL = /^review-packet:v1:[a-f0-9]{64}$/

const PERSONEN = [
  'userId',
  'accountId',
  'tripId',
  'travellerId',
  'passportNumber',
  'documentNumber',
  'mrz',
  'biometric',
  'dateOfBirth',
  'healthRecord',
  'email',
  'fullName',
  'phone',
  'scan',
  'travellerNote',
  'note',
  'passport_number',
  'traveller_note',
] as const

function datei(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

function uhr(instant = UHR): () => Date {
  return () => new Date(instant)
}

function roh(teil?: Record<string, unknown>): Record<string, unknown> {
  return {
    destinationCountryCode: 'JP',
    transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['RS', 'CH'] },
    credentialOption: {
      mode: 'option',
      documentType: 'passport',
      issuingCountryCode: 'CH',
      relatedCitizenshipCountryCode: 'CH',
    },
    residence: { mode: 'not_applicable' },
    requirementType: 'visa',
    validity: { mode: 'travel_date', travelDate: '2026-10-01' },
    ...teil,
  }
}

function zelle(teil?: Record<string, unknown>): { scope: RegelScope; key: string } {
  const gelesen = regelScopeAusEvidenceScope(roh(teil))
  assert.equal(gelesen.ok, true)
  if (!gelesen.ok) throw new Error('scope')
  return gelesen
}

function anfrage(
  teil?: Record<string, unknown>,
  factKind: RegelFaktArt = 'requirement_effect',
  grund: OfficialTruthRechercheGrund = { status: 'missing' },
): OfficialTruthRechercheAnfrage {
  const basis = zelle(teil)
  const abdeckung =
    grund.status === 'missing'
      ? { status: 'missing' as const, ruleScopeKey: basis.key, factKind }
      : { status: 'recheck_needed' as const, ruleScopeKey: basis.key, factKind, reason: grund.reason }
  const entscheidung = officialTruthRechercheEntscheiden(abdeckung, basis.scope)
  assert.equal(entscheidung.action, 'research')
  if (entscheidung.action !== 'research') throw new Error('anfrage')
  return entscheidung.request
}

function registry(eingaben: readonly QuellenEingabe[]): QuellenRegistry {
  const ergebnis = quellenRegistryErstellen(eingaben)
  if (!ergebnis.ok) throw new Error(ergebnis.reason)
  return ergebnis.registry
}

function amt(sourceId: string, domain: string, name: string): QuellenEingabe {
  return {
    sourceId,
    sourceClass: 'official_authority',
    publisherName: name,
    authorityName: name,
    domains: [domain],
  }
}

function anbieter(sourceId: string, domain: string): QuellenEingabe {
  return {
    sourceId,
    sourceClass: 'licensed_evidence_provider',
    publisherName: 'Example Licensed Publisher',
    domains: [domain],
  }
}

function standardRegistry(): QuellenRegistry {
  return registry([
    amt(QUELLE, 'gov.example', 'Example Border Authority'),
    amt(ANDERE, 'interior.example', 'Example Interior Authority'),
    anbieter(ANBIETER, 'provider.example'),
  ])
}

function quelle(basis: QuellenRegistry, sourceId: string): RegistrierteQuelle {
  const gefunden = basis.sources.find((eintrag) => eintrag.sourceId === sourceId)
  assert.ok(gefunden)
  return gefunden
}

function abdeckung(teil?: Partial<QuellenAbdeckung>): QuellenAbdeckung {
  return {
    destinationCountryCodes: ['JP'],
    transitCountryCodes: [],
    requirementTypes: ['visa'],
    citizenship: { mode: 'exact', countryCodes: ['CH'] },
    residence: { mode: 'not_applicable' },
    documents: { mode: 'exact', options: [{ documentType: 'passport', issuingCountryCode: 'CH' }] },
    ...teil,
  }
}

function passAbdeckung(): QuellenAbdeckung {
  return abdeckung({
    citizenship: { mode: 'exact', countryCodes: ['CH', 'RS'] },
    documents: {
      mode: 'exact',
      options: [
        { documentType: 'passport', issuingCountryCode: 'CH' },
        { documentType: 'passport', issuingCountryCode: 'RS' },
      ],
    },
  })
}

function deskriptor(basis: QuellenRegistry, sourceId: string, coverage: QuellenAbdeckung = abdeckung()): QuellenDeskriptor {
  return { source: quelle(basis, sourceId), coverage }
}

function beideDeskriptoren(basis: QuellenRegistry, coverage: QuellenAbdeckung = abdeckung()): QuellenDeskriptor[] {
  return [deskriptor(basis, QUELLE, coverage), deskriptor(basis, ANDERE, coverage), deskriptor(basis, ANBIETER, coverage)]
}

function huelle(teil?: {
  request?: unknown
  registry?: QuellenRegistry
  descriptors?: QuellenDeskriptor[]
  sourceId?: string
  material?: Record<string, unknown>
  extra?: Record<string, unknown>
}): Record<string, unknown> {
  const basis = teil?.registry ?? standardRegistry()
  return {
    request: teil?.request ?? anfrage(),
    registry: basis,
    descriptors: teil?.descriptors ?? beideDeskriptoren(basis),
    sourceId: teil?.sourceId ?? QUELLE,
    material: {
      canonicalUrl: 'https://www.gov.example/rules',
      retrievedAt: ABGERUFEN,
      sourceSnapshot: SNAPSHOT,
      ...teil?.material,
    },
    ...teil?.extra,
  }
}

function buendel(
  umschlag: Record<string, unknown> = huelle(),
  extraktion: unknown = null,
  clock: () => Date = uhr(),
): { umschlag: Record<string, unknown>; uhr: () => Date; extraktion: unknown } {
  return { umschlag, uhr: clock, extraktion }
}

function meta(teil?: Record<string, unknown>) {
  return {
    factKind: 'requirement_effect',
    evidenceQuality: 'explicit_primary_statement',
    proposal: VORSCHLAG,
    ...teil,
  }
}

function zweiteStuetze(snapshot: string) {
  const basis = standardRegistry()
  return buendel(
    huelle({
      registry: basis,
      descriptors: beideDeskriptoren(basis),
      sourceId: ANDERE,
      material: { canonicalUrl: 'https://www.interior.example/rules', sourceSnapshot: snapshot },
    }),
  )
}

function paketEingabe(supports: unknown, metadata: unknown = meta()) {
  return { supports, metadata }
}

function finger(supports: unknown, metadata: unknown = meta()) {
  const ergebnis = officialTruthRegelReviewPacketFingerprint(paketEingabe(supports, metadata))
  assert.equal(ergebnis.status, 'rule_review_packet_fingerprint')
  if (ergebnis.status !== 'rule_review_packet_fingerprint') throw new Error('finger')
  return ergebnis
}

function hinweis(
  supports: unknown,
  suggestion: Record<string, unknown>,
  metadata: unknown = meta(),
): OfficialTruthRegelReviewVorschlagErgebnis {
  return officialTruthRegelReviewVorschlag({
    packetInput: paketEingabe(supports, metadata),
    suggestion,
  })
}

function vorschlag(teil?: Record<string, unknown>, ids: readonly string[] = []) {
  return {
    assessment: 'supports_candidate',
    citedSupportVersionIds: [...ids],
    reasonCodes: ['support_text_matches_candidate'],
    ...teil,
  }
}

function offen(ergebnis: OfficialTruthRegelReviewVorschlagErgebnis) {
  assert.equal(ergebnis.status, 'review_suggestion')
  if (ergebnis.status !== 'review_suggestion') throw new Error('blockiert')
  assert.match(ergebnis.reviewPacketKey, SCHLUESSEL)
  assert.deepEqual(Object.keys(ergebnis), AUSGABE)
  assert.deepEqual(ergebnis.citedSupportVersionIds, [...ergebnis.citedSupportVersionIds].sort())
  assert.deepEqual(ergebnis.reasonCodes, [...ergebnis.reasonCodes].sort())
  return ergebnis
}

function ohneStoff(ergebnis: OfficialTruthRegelReviewVorschlagErgebnis, stoff: readonly string[]) {
  const text = JSON.stringify(ergebnis)
  for (const teil of stoff) assert.equal(text.includes(teil), false, teil)
  for (const feld of ['trustedRuleFact', 'lifecycle', 'sourceSnapshot', 'canonicalUrl', 'sourceContentHash', 'proposal']) {
    assert.equal(text.includes(`"${feld}"`), false, feld)
  }
  assert.equal(text.includes('electronic_visa'), false)
}

describe('Official Truth review suggestion contract', () => {
  test('ein gültiger Hinweis bindet an die neu belegte Identität', () => {
    const stuetze = buendel()
    const vorher = JSON.stringify(paketEingabe([stuetze]))
    const identitaet = finger([stuetze])
    const paket = officialTruthRegelReviewPacket(paketEingabe([stuetze]))
    assert.equal(paket.status, 'rule_review_packet')
    if (paket.status !== 'rule_review_packet') return
    const ergebnis = offen(hinweis([stuetze], vorschlag({}, identitaet.supportVersionIds)))
    assert.equal(ergebnis.reviewPacketKey, identitaet.reviewPacketKey)
    assert.equal(ergebnis.ruleScopeKey, identitaet.ruleScopeKey)
    assert.equal(ergebnis.ruleScopeKey, paket.kandidat.key)
    assert.deepEqual(ergebnis.citedSupportVersionIds, identitaet.supportVersionIds)
    assert.deepEqual(ergebnis.reasonCodes, ['support_text_matches_candidate'])
    assert.equal(ergebnis.assessment, 'supports_candidate')
    assert.equal(JSON.stringify(ergebnis).includes('reviewNote'), false)
    ohneStoff(ergebnis, [SNAPSHOT, paket.supports[0]!.canonicalUrl, paket.supports[0]!.sourceContentHash, FREITEXT])
    assert.equal(JSON.stringify(paketEingabe([stuetze])), vorher)
    assert.equal(requirementsProviderAus(), null)

    const ohneFeld = offen(
      hinweis([stuetze], {
        assessment: 'insufficient_evidence',
        citedSupportVersionIds: [],
        reasonCodes: ['support_insufficient_for_claim'],
      }),
    )
    assert.deepEqual(ohneFeld.citedSupportVersionIds, [])
    assert.equal(ohneFeld.assessment, 'insufficient_evidence')
    assert.equal(ohneFeld.reviewPacketKey, identitaet.reviewPacketKey)
    const ohneGrund = offen(
      hinweis([stuetze], {
        assessment: 'needs_human_review',
        citedSupportVersionIds: [],
        reasonCodes: [],
      }),
    )
    assert.deepEqual(ohneGrund.reasonCodes, [])
    assert.equal(ohneGrund.reviewPacketKey, identitaet.reviewPacketKey)
    ohneStoff(ohneGrund, [SNAPSHOT])

    const bewertet = [
      ['contradicts_candidate', 'support_text_conflicts_candidate'],
      ['needs_human_review', 'proposal_requires_human_judgment'],
      ['supports_candidate', 'support_scope_ambiguous'],
    ] as const
    for (const [assessment, code] of bewertet) {
      const fall = offen(
        hinweis([stuetze], {
          assessment,
          citedSupportVersionIds: [...identitaet.supportVersionIds],
          reasonCodes: [code, 'support_stale_or_time_unclear'],
        }),
      )
      assert.equal(fall.assessment, assessment)
      assert.deepEqual(fall.reasonCodes, [code, 'support_stale_or_time_unclear'].sort())
      assert.equal(fall.reviewPacketKey, identitaet.reviewPacketKey)
      ohneStoff(fall, [SNAPSHOT])
    }

    const luecke = offen(
      hinweis(
        [stuetze],
        {
          assessment: 'insufficient_evidence',
          citedSupportVersionIds: [],
          reasonCodes: ['support_insufficient_for_claim'],
        },
        meta({ evidenceQuality: 'research_gap', proposal: null }),
      ),
    )
    assert.notEqual(luecke.reviewPacketKey, identitaet.reviewPacketKey)
    ohneStoff(luecke, ['not_required', 'electronic_visa'])
    assert.equal(JSON.stringify(luecke).includes('accepted'), false)
  })

  test('umgekehrte Stützen behalten Schlüssel und sortierte Zitate', () => {
    const linke = buendel(huelle({ material: { sourceSnapshot: 'grenze links' } }))
    const rechte = zweiteStuetze('innere rechts')
    const metadata = meta({ evidenceQuality: 'composed_from_multiple_primary_sources' })
    const identitaet = finger([linke, rechte], metadata)
    assert.equal(identitaet.supportVersionIds.length, 2)
    const rueckwaerts = [...identitaet.supportVersionIds].reverse()
    assert.notDeepEqual(rueckwaerts, [...identitaet.supportVersionIds])
    const gruende = ['support_sources_conflict', 'support_text_matches_candidate']
    const ergebnis = offen(
      hinweis(
        [rechte, linke],
        {
          assessment: 'needs_human_review',
          citedSupportVersionIds: rueckwaerts,
          reasonCodes: [...gruende].reverse(),
        },
        metadata,
      ),
    )
    assert.equal(ergebnis.reviewPacketKey, identitaet.reviewPacketKey)
    assert.equal(ergebnis.ruleScopeKey, identitaet.ruleScopeKey)
    assert.deepEqual(ergebnis.citedSupportVersionIds, identitaet.supportVersionIds)
    assert.deepEqual(ergebnis.reasonCodes, [...gruende].sort())
    ohneStoff(ergebnis, ['grenze links', 'innere rechts'])
  })

  test('eine fremde oder doppelte Zitierung scheitert geschlossen', () => {
    const stuetze = buendel()
    const identitaet = finger([stuetze])
    const id = identitaet.supportVersionIds[0]!
    const fremd = hinweis([stuetze], vorschlag({ citedSupportVersionIds: [FREMDE_ID] }))
    const doppelt = hinweis([stuetze], vorschlag({ citedSupportVersionIds: [id, id] }))
    const leer = hinweis([stuetze], vorschlag({ citedSupportVersionIds: [''] }))
    const zahl = hinweis([stuetze], vorschlag({ citedSupportVersionIds: [id, 1] }))
    const grundDoppelt = hinweis([stuetze], vorschlag({ reasonCodes: ['support_text_matches_candidate', 'support_text_matches_candidate'] }, [id]))
    for (const ergebnis of [fremd, doppelt, leer, zahl, grundDoppelt]) {
      assert.equal(ergebnis.status, 'blocked')
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(FREMDE_ID), false)
      assert.equal(text.includes(id), false)
      assert.equal(text.includes(identitaet.reviewPacketKey), false)
      assert.equal(text.includes('review_suggestion'), false)
      assert.equal(text.includes(SNAPSHOT), false)
    }
    assert.deepEqual(fremd, { status: 'blocked', reason: 'citation_not_in_packet' })
    assert.deepEqual(doppelt, { status: 'blocked', reason: 'duplicate_citation' })
    assert.deepEqual(leer, { status: 'blocked', reason: 'invalid_support' })
    assert.deepEqual(zahl, { status: 'blocked', reason: 'invalid_support' })
    assert.deepEqual(grundDoppelt, { status: 'blocked', reason: 'duplicate_reason_code' })
  })

  test('unbekannte Bewertung oder unbekannter Grundcode scheitert', () => {
    const stuetze = buendel()
    const id = finger([stuetze]).supportVersionIds[0]!
    const faelle = [
      vorschlag({ assessment: 'accepted' }, [id]),
      vorschlag({ assessment: 'trusted_rule_fact' }, [id]),
      vorschlag({ assessment: ' SUPPORTS_CANDIDATE ' }, [id]),
      vorschlag({ reasonCodes: ['support_text_matches'] }, [id]),
      vorschlag({ reasonCodes: [' support_text_matches_candidate '] }, [id]),
      vorschlag({ reasonCodes: 'support_text_matches_candidate' }, [id]),
      { assessment: 'supports_candidate', citedSupportVersionIds: [id] },
    ]
    for (const suggestion of faelle) {
      const ergebnis = hinweis([stuetze], suggestion)
      assert.equal(ergebnis.status, 'blocked')
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes('review_suggestion'), false)
      assert.equal(text.includes('accepted'), false)
      assert.equal(text.includes(id), false)
      assert.equal(text.includes(SNAPSHOT), false)
    }
    assert.equal(hinweis([stuetze], vorschlag({ assessment: 'accepted' }, [id])).status, 'blocked')
    const unbekannt = hinweis([stuetze], vorschlag({ assessment: 'accepted' }, [id]))
    const grund = hinweis([stuetze], vorschlag({ reasonCodes: ['free_form_fact'] }, [id]))
    assert.deepEqual(unbekannt, { status: 'blocked', reason: 'invalid_assessment' })
    assert.deepEqual(grund, { status: 'blocked', reason: 'invalid_reason_code' })
    assert.equal(JSON.stringify(grund).includes('free_form_fact'), false)
  })

  test('persönliche und geheime Werte scheitern ohne Echo', () => {
    const stuetze = buendel()
    const identitaet = finger([stuetze])
    const basis = vorschlag({}, identitaet.supportVersionIds)
    for (const feld of PERSONEN) {
      const imVorschlag = officialTruthRegelReviewVorschlag({
        packetInput: paketEingabe([stuetze]),
        suggestion: { ...basis, [feld]: GEHEIM },
      })
      const imPaket = officialTruthRegelReviewVorschlag({
        packetInput: paketEingabe([stuetze], meta({ [feld]: GEHEIM })),
        suggestion: basis,
      })
      const imUmschlag = hinweis([buendel(huelle({ extra: { [feld]: GEHEIM } }))], basis)
      for (const ergebnis of [imVorschlag, imPaket, imUmschlag]) {
        assert.equal(ergebnis.status, 'blocked', feld)
        const text = JSON.stringify(ergebnis)
        assert.equal(text.includes(GEHEIM), false, feld)
        assert.equal(text.includes(feld), false, feld)
        assert.equal(text.includes('review_suggestion'), false, feld)
        assert.equal(text.includes(identitaet.reviewPacketKey), false, feld)
      }
    }
    const verschachtelt = officialTruthRegelReviewVorschlag({
      packetInput: paketEingabe([stuetze]),
      suggestion: { ...basis, reviewNote: { passportNumber: GEHEIM } },
    })
    assert.deepEqual(verschachtelt, { status: 'blocked', reason: 'personal_identifier_forbidden' })
    assert.equal(JSON.stringify(verschachtelt).includes(GEHEIM), false)
    assert.equal(JSON.stringify(verschachtelt).includes('passportNumber'), false)
  })

  test('Freitext bleibt draussen, auch wenn er persönlich aussieht', () => {
    const stuetze = buendel()
    const identitaet = finger([stuetze])
    const basis = vorschlag({}, identitaet.supportVersionIds)
    const felder = ['reviewNote', 'summary', 'explanation', 'message', 'annotation', 'comment', 'note', 'freeText'] as const
    for (const feld of felder) {
      const ergebnis = hinweis([stuetze], { ...basis, [feld]: FREITEXT })
      assert.equal(ergebnis.status, 'blocked', feld)
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(FREITEXT), false, feld)
      assert.equal(text.includes('XC-44821'), false, feld)
      assert.equal(text.includes('Ada Beispiel'), false, feld)
      assert.equal(text.includes('1984-03-17'), false, feld)
      assert.equal(text.includes('review_suggestion'), false, feld)
      assert.equal(text.includes(identitaet.reviewPacketKey), false, feld)
      assert.equal(text.includes('reviewNote'), false, feld)
    }
    const leer = hinweis([stuetze], { ...basis, reviewNote: null })
    const imGrund = hinweis([stuetze], vorschlag({ reasonCodes: [FREITEXT] }, identitaet.supportVersionIds))
    const imZitat = hinweis([stuetze], vorschlag({ citedSupportVersionIds: [FREITEXT] }))
    const alsBewertung = hinweis([stuetze], vorschlag({ assessment: FREITEXT }, identitaet.supportVersionIds))
    for (const ergebnis of [leer, imGrund, imZitat, alsBewertung]) {
      assert.equal(ergebnis.status, 'blocked')
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(FREITEXT), false)
      assert.equal(text.includes('XC-44821'), false)
      assert.equal(text.includes('review_suggestion'), false)
      assert.equal(text.includes(identitaet.reviewPacketKey), false)
    }
    assert.deepEqual(leer, { status: 'blocked', reason: 'unexpected_fields' })
    assert.deepEqual(hinweis([stuetze], { ...basis, reviewNote: FREITEXT }), { status: 'blocked', reason: 'unexpected_fields' })
    assert.deepEqual(imGrund, { status: 'blocked', reason: 'invalid_reason_code' })
    assert.deepEqual(imZitat, { status: 'blocked', reason: 'citation_not_in_packet' })
    assert.deepEqual(alsBewertung, { status: 'blocked', reason: 'invalid_assessment' })
  })

  test('mitgeliefertes Paket, Identität, Wahrheitsfakt und Stützlisten scheitern', () => {
    const stuetze = buendel()
    const packetInput = paketEingabe([stuetze])
    const identitaet = finger([stuetze])
    const paket = officialTruthRegelReviewPacket(packetInput)
    assert.equal(paket.status, 'rule_review_packet')
    if (paket.status !== 'rule_review_packet') return
    const suggestion = vorschlag({}, identitaet.supportVersionIds)
    const eingabe = { packetInput, suggestion }
    const felder: Record<string, unknown> = {
      packet: paket,
      fingerprint: identitaet,
      reviewPacketKey: identitaet.reviewPacketKey,
      ruleScopeKey: identitaet.ruleScopeKey,
      supportVersionIds: identitaet.supportVersionIds,
      supports: [stuetze],
      trustedRuleFact: { marker: MARKER, effect: 'not_required' },
    }
    for (const [feld, wert] of Object.entries(felder)) {
      const oben = officialTruthRegelReviewVorschlag({ ...eingabe, [feld]: wert })
      const imVorschlag = officialTruthRegelReviewVorschlag({
        packetInput,
        suggestion: { ...suggestion, [feld]: wert },
      })
      for (const ergebnis of [oben, imVorschlag]) {
        assert.equal(ergebnis.status, 'blocked', feld)
        const text = JSON.stringify(ergebnis)
        assert.equal(text.includes(MARKER), false, feld)
        assert.equal(text.includes(identitaet.reviewPacketKey), false, feld)
        assert.equal(text.includes('not_required'), false, feld)
        assert.equal(text.includes('review_suggestion'), false, feld)
        assert.equal(text.includes(paket.supports[0]!.sourceContentHash), false, feld)
        assert.equal(text.includes(SNAPSHOT), false, feld)
      }
    }
    const alsEingabe = officialTruthRegelReviewVorschlag({ packetInput: paket, suggestion })
    const nurIdentitaet = officialTruthRegelReviewVorschlag({ packetInput: identitaet, suggestion })
    for (const ergebnis of [alsEingabe, nurIdentitaet, officialTruthRegelReviewVorschlag(null)]) {
      assert.equal(ergebnis.status, 'blocked')
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(identitaet.reviewPacketKey), false)
      assert.equal(text.includes(SNAPSHOT), false)
      assert.equal(text.includes('review_suggestion'), false)
    }
  })

  test('eine zweite Credential-Option bleibt ein anderer Hinweis', () => {
    const coverage = passAbdeckung()
    const basis = standardRegistry()
    const schweiz = buendel(
      huelle({
        registry: basis,
        descriptors: beideDeskriptoren(basis, coverage),
        material: { sourceSnapshot: 'pass ch' },
      }),
    )
    const serbien = buendel(
      huelle({
        request: anfrage({
          credentialOption: {
            mode: 'option',
            documentType: 'passport',
            issuingCountryCode: 'RS',
            relatedCitizenshipCountryCode: 'RS',
          },
        }),
        registry: basis,
        descriptors: beideDeskriptoren(basis, coverage),
        sourceId: ANDERE,
        material: { canonicalUrl: 'https://www.interior.example/rules', sourceSnapshot: 'pass rs' },
      }),
    )
    const schweizerIdentitaet = finger([schweiz])
    const serbischIdentitaet = finger([serbien])
    const schweizer = offen(hinweis([schweiz], vorschlag({}, schweizerIdentitaet.supportVersionIds)))
    const serbisch = offen(hinweis([serbien], vorschlag({ assessment: 'contradicts_candidate', reasonCodes: ['support_text_conflicts_candidate'] }, serbischIdentitaet.supportVersionIds)))
    assert.notEqual(schweizer.reviewPacketKey, serbisch.reviewPacketKey)
    assert.notEqual(schweizer.ruleScopeKey, serbisch.ruleScopeKey)
    assert.equal(schweizer.reviewPacketKey, schweizerIdentitaet.reviewPacketKey)
    assert.equal(serbisch.reviewPacketKey, serbischIdentitaet.reviewPacketKey)
    const fremd = hinweis([schweiz], vorschlag({}, serbischIdentitaet.supportVersionIds))
    assert.deepEqual(fremd, { status: 'blocked', reason: 'citation_not_in_packet' })
    assert.equal(JSON.stringify(fremd).includes(serbischIdentitaet.supportVersionIds[0]!), false)
    assert.equal(JSON.stringify(fremd).includes('RS'), false)
    assert.equal(JSON.stringify(fremd).includes('CH'), false)
    const gemeinsam = hinweis([schweiz, serbien], vorschlag())
    assert.deepEqual(gemeinsam, { status: 'blocked', reason: 'scope_mismatch' })
    assert.equal(JSON.stringify(gemeinsam).includes('RS'), false)
    assert.equal(JSON.stringify(gemeinsam).includes('CH'), false)
    ohneStoff(schweizer, ['pass ch'])
    ohneStoff(serbisch, ['pass rs'])
  })

  test('die Eingabe bleibt unverändert', () => {
    const stuetze = buendel()
    const identitaet = finger([stuetze])
    const cited = Object.freeze([...identitaet.supportVersionIds].reverse())
    const codes = Object.freeze(['support_sources_conflict', 'proposal_requires_human_judgment'])
    const suggestion = Object.freeze({
      assessment: 'needs_human_review',
      citedSupportVersionIds: cited,
      reasonCodes: codes,
    })
    const packetInput = paketEingabe([stuetze])
    const eingabe = { packetInput, suggestion }
    const vorher = JSON.stringify(eingabe)
    const ergebnis = offen(officialTruthRegelReviewVorschlag(eingabe))
    assert.equal(JSON.stringify(eingabe), vorher)
    assert.deepEqual(cited, [...identitaet.supportVersionIds].reverse())
    assert.deepEqual(ergebnis.citedSupportVersionIds, identitaet.supportVersionIds)
    assert.deepEqual([...codes], ['support_sources_conflict', 'proposal_requires_human_judgment'])
    assert.equal(JSON.stringify(ergebnis).includes('reviewNote'), false)
  })

  test('der Hinweis ruft nur das Prüfpaket und seine Identität auf', () => {
    const text = datei('lib/readiness/official-truth-review-suggestion.ts')
    const importe = [...text.matchAll(/from '([^']+)'/g)].map((treffer) => treffer[1]).sort()
    assert.deepEqual(importe, [
      '@/lib/readiness/official-truth-rule-review-fingerprint',
      '@/lib/readiness/official-truth-rule-review-packet',
    ])
    assert.match(text, /officialTruthRegelReviewPacket\(/)
    assert.match(text, /officialTruthRegelReviewPacketFingerprint\(/)
    assert.match(text, /packet_fingerprint_mismatch/)
    assert.doesNotMatch(text, /reviewNote|invalid_review_note/)
    assert.doesNotMatch(text, /regelKandidatAkzeptieren|regelKandidatErstellen|trustedRuleFact/)
    assert.doesNotMatch(text, /officialTruthAkzeptierteEvidenceAusAbruf|officialTruthRegelKandidatAusEvidence|officialTruthAbgerufenMaterialPruefen/)
    assert.doesNotMatch(text, /official_truth_store_accepted_v1|official_truth_source_catalog_v1/)
    assert.doesNotMatch(text, /requirementsProviderAus|sha256Hex|evidenceQuellenFingerprint/)
    assert.doesNotMatch(text, /\.sourceSnapshot|\.canonicalUrl|\.sourceContentHash|\.proposal/)
    assert.doesNotMatch(text, /supabase|openai|Date\.now|new Date\(|fetch\(|node:fs|node:http|node:net/i)
    for (const relativ of [
      'lib/readiness/evidence.ts',
      'lib/readiness/digest.ts',
      'lib/readiness/rule-claims.ts',
      'lib/readiness/source-registry.ts',
      'lib/readiness/source-router.ts',
      'lib/readiness/official-truth-retrieved-material.ts',
      'lib/readiness/official-truth-retrieved-candidate-evidence.ts',
      'lib/readiness/official-truth-accepted-evidence.ts',
      'lib/readiness/official-truth-rule-candidate.ts',
      'lib/readiness/official-truth-rule-review-packet.ts',
      'lib/readiness/official-truth-rule-review-fingerprint.ts',
      'lib/readiness/provider.ts',
    ]) {
      assert.doesNotMatch(datei(relativ), /official-truth-review-suggestion/, relativ)
    }
    assert.equal(requirementsProviderAus(), null)
  })
})
