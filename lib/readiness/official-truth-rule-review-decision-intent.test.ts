// lib/readiness/official-truth-rule-review-decision-intent.test.ts
//
// Entscheidungsabsicht nur über ein neu belegtes Prüfpaket und dessen Identität.
// Synthetische .example-Quellen. Keine Annahme, kein Speicher, kein Netz.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { officialTruthRegelReviewPacket } from '@/lib/readiness/official-truth-rule-review-packet'
import { officialTruthRegelReviewPacketFingerprint } from '@/lib/readiness/official-truth-rule-review-fingerprint'
import {
  officialTruthRegelReviewEntscheidungsabsicht,
  type OfficialTruthRegelReviewEntscheidungsErgebnis,
} from '@/lib/readiness/official-truth-rule-review-decision-intent'
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
const AUFENTHALT = {
  kind: 'stay_limit',
  perVisit: { value: 30, unit: 'days' },
  rollingWindow: null,
  initialGrant: null,
  extension: null,
  borderDiscretion: 'fixed',
} as const
const GEHEIM = 'personal-secret-91f3'
const MARKER = 'TRUSTED-MARKER-SHOULD-NOT-ECHO'
const FREITEXT = 'Ada Beispiel passport XC-44821 born 1984-03-17'
const AUSGABE = ['status', 'reviewPacketKey', 'ruleScopeKey', 'factKind', 'decision'] as const
const SCHLUESSEL = /^review-packet:v1:[a-f0-9]{64}$/
const ZUSTAENDE = ['needs_more_evidence', 'reject_candidate', 'proceed_to_trusted_fact_entry'] as const

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
  'comment',
  'freeText',
  'passport_number',
  'traveller_note',
] as const

const FREMDE_FELDER = [
  'candidate',
  'kandidat',
  'proposal',
  'supports',
  'supportVersionIds',
  'supportIds',
  'fingerprint',
  'suggestion',
  'reviewer',
  'reviewerId',
  'user',
  'role',
  'aal',
  'capability',
  'trustedRuleFact',
  'accepted',
  'lifecycle',
  'factKind',
  'authority',
  'grant',
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

function absicht(
  supports: unknown,
  reviewPacketKey: unknown,
  decision: unknown,
  metadata: unknown = meta(),
  extra?: Record<string, unknown>,
): OfficialTruthRegelReviewEntscheidungsErgebnis {
  return officialTruthRegelReviewEntscheidungsabsicht({
    packetInput: paketEingabe(supports, metadata),
    reviewPacketKey,
    decision,
    ...extra,
  })
}

function offen(ergebnis: OfficialTruthRegelReviewEntscheidungsErgebnis) {
  assert.equal(ergebnis.status, 'rule_review_decision_intent')
  if (ergebnis.status !== 'rule_review_decision_intent') throw new Error('blockiert')
  assert.match(ergebnis.reviewPacketKey, SCHLUESSEL)
  assert.deepEqual(Object.keys(ergebnis), [...AUSGABE])
  assert.equal(Object.isFrozen(ergebnis), true)
  return ergebnis
}

function ohneStoff(ergebnis: OfficialTruthRegelReviewEntscheidungsErgebnis, stoff: readonly string[]) {
  const text = JSON.stringify(ergebnis)
  for (const teil of stoff) assert.equal(text.includes(teil), false, teil)
  for (const feld of [
    'trustedRuleFact',
    'lifecycle',
    'sourceSnapshot',
    'canonicalUrl',
    'sourceContentHash',
    'proposal',
    'supportVersionIds',
    'suggestion',
    'accepted',
  ]) {
    assert.equal(text.includes(`"${feld}"`), false, feld)
  }
  assert.equal(text.includes('electronic_visa'), false)
}

describe('Official Truth rule review decision intent contract', () => {
  test('alle drei Zustände binden an das neu belegte Paket', () => {
    const stuetze = buendel()
    const eingabe = paketEingabe([stuetze])
    const vorher = JSON.stringify(eingabe)
    const identitaet = finger([stuetze])
    const paket = officialTruthRegelReviewPacket(eingabe)
    assert.equal(paket.status, 'rule_review_packet')
    if (paket.status !== 'rule_review_packet') return
    for (const decision of ZUSTAENDE) {
      const ergebnis = offen(absicht([stuetze], identitaet.reviewPacketKey, decision))
      assert.equal(ergebnis.decision, decision)
      assert.equal(ergebnis.reviewPacketKey, identitaet.reviewPacketKey)
      assert.equal(ergebnis.ruleScopeKey, identitaet.ruleScopeKey)
      assert.equal(ergebnis.ruleScopeKey, paket.kandidat.key)
      assert.equal(ergebnis.factKind, paket.kandidat.factKind)
      assert.equal(ergebnis.factKind, 'requirement_effect')
      ohneStoff(ergebnis, [SNAPSHOT, paket.supports[0]!.canonicalUrl, paket.supports[0]!.sourceContentHash, ...paket.kandidat.supportVersionIds])
    }
    assert.equal(JSON.stringify(eingabe), vorher)
    assert.equal(requirementsProviderAus(), null)

    const aufenthalt = meta({ factKind: 'stay_limit', proposal: AUFENTHALT })
    const aufenthaltPaket = officialTruthRegelReviewPacket(paketEingabe([stuetze], aufenthalt))
    const aufenthaltId = finger([stuetze], aufenthalt)
    assert.equal(aufenthaltPaket.status, 'rule_review_packet')
    if (aufenthaltPaket.status !== 'rule_review_packet') return
    const abgeleitet = offen(absicht([stuetze], aufenthaltId.reviewPacketKey, 'needs_more_evidence', aufenthalt))
    assert.equal(abgeleitet.factKind, 'stay_limit')
    assert.equal(abgeleitet.factKind, aufenthaltPaket.kandidat.factKind)
    assert.notEqual(abgeleitet.reviewPacketKey, identitaet.reviewPacketKey)
    ohneStoff(abgeleitet, ['days', 'borderDiscretion'])
  })

  test('eine Zusammensetzung aus zwei Behörden darf den Fakteintritt nur erbitten', () => {
    const links = buendel(huelle({ material: { sourceSnapshot: 'qualitaet links' } }))
    const rechts = zweiteStuetze('qualitaet rechts')
    const metadata = meta({ evidenceQuality: 'composed_from_multiple_primary_sources' })
    const identitaet = finger([links, rechts], metadata)
    const paket = officialTruthRegelReviewPacket(paketEingabe([links, rechts], metadata))
    assert.equal(paket.status, 'rule_review_packet')
    if (paket.status !== 'rule_review_packet') return
    const ergebnis = offen(absicht([links, rechts], identitaet.reviewPacketKey, 'proceed_to_trusted_fact_entry', metadata))
    assert.equal(ergebnis.factKind, paket.kandidat.factKind)
    assert.equal(ergebnis.decision, 'proceed_to_trusted_fact_entry')
    ohneStoff(ergebnis, ['qualitaet links', 'qualitaet rechts', ...identitaet.supportVersionIds])
    assert.equal(JSON.stringify(ergebnis).includes('trustedRuleFact'), false)
  })

  test('nicht annehmbare Qualität darf den Fakteintritt nicht erbitten', () => {
    const stuetze = buendel()
    for (const qualitaet of ['research_gap', 'stale_primary_evidence', 'unresolved_conflict'] as const) {
      const metadata = meta({
        evidenceQuality: qualitaet,
        proposal: qualitaet === 'research_gap' ? null : VORSCHLAG,
      })
      const identitaet = finger([stuetze], metadata)
      const paket = officialTruthRegelReviewPacket(paketEingabe([stuetze], metadata))
      assert.equal(paket.status, 'rule_review_packet', qualitaet)
      if (paket.status !== 'rule_review_packet') return
      for (const decision of ['needs_more_evidence', 'reject_candidate'] as const) {
        const ergebnis = offen(absicht([stuetze], identitaet.reviewPacketKey, decision, metadata))
        assert.equal(ergebnis.decision, decision)
        assert.equal(ergebnis.factKind, paket.kandidat.factKind)
        ohneStoff(ergebnis, [qualitaet, SNAPSHOT])
      }
      const weiter = absicht([stuetze], identitaet.reviewPacketKey, 'proceed_to_trusted_fact_entry', metadata)
      assert.deepEqual(weiter, { status: 'blocked', reason: 'quality_not_acceptable' })
      assert.equal(Object.isFrozen(weiter), true)
      const text = JSON.stringify(weiter)
      assert.equal(text.includes(qualitaet), false, qualitaet)
      assert.equal(text.includes(identitaet.reviewPacketKey), false, qualitaet)
      assert.equal(text.includes('rule_review_decision_intent'), false, qualitaet)
      assert.equal(text.includes('electronic_visa'), false, qualitaet)
    }
  })

  test('ein fehlender, falscher oder veralteter Schlüssel scheitert ohne Echo', () => {
    const stuetze = buendel()
    const identitaet = finger([stuetze])
    const falsch = `review-packet:v1:${'ab'.repeat(32)}`
    const leer = ''
    const zusatz = `${identitaet.reviewPacketKey} `
    const klein = identitaet.reviewPacketKey.toUpperCase()
    for (const reviewPacketKey of [falsch, leer, zusatz, klein, null, 1, true, { secret: GEHEIM }]) {
      const ergebnis = absicht([stuetze], reviewPacketKey, 'needs_more_evidence')
      assert.deepEqual(ergebnis, { status: 'blocked', reason: 'review_packet_key_mismatch' })
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(identitaet.reviewPacketKey), false)
      assert.equal(text.includes(falsch), false)
      assert.equal(text.includes(GEHEIM), false)
      assert.equal(text.includes('rule_review_decision_intent'), false)
    }
    const ohne = officialTruthRegelReviewEntscheidungsabsicht({
      packetInput: paketEingabe([stuetze]),
      decision: 'reject_candidate',
    })
    assert.deepEqual(ohne, { status: 'blocked', reason: 'review_packet_key_mismatch' })
    assert.equal(JSON.stringify(ohne).includes(identitaet.reviewPacketKey), false)

    const geaendert = buendel(huelle({ material: { sourceSnapshot: 'changed after the key' } }))
    const veraltet = absicht([geaendert], identitaet.reviewPacketKey, 'reject_candidate')
    assert.deepEqual(veraltet, { status: 'blocked', reason: 'review_packet_key_mismatch' })
    assert.equal(JSON.stringify(veraltet).includes(identitaet.reviewPacketKey), false)
    assert.equal(JSON.stringify(veraltet).includes('changed after the key'), false)
    const neu = finger([geaendert])
    assert.notEqual(neu.reviewPacketKey, identitaet.reviewPacketKey)
    const aktuell = offen(absicht([geaendert], neu.reviewPacketKey, 'reject_candidate'))
    assert.equal(aktuell.reviewPacketKey, neu.reviewPacketKey)
  })

  test('blockierte Paket-Eingaben bleiben blockiert', () => {
    const stuetze = buendel()
    const identitaet = finger([stuetze])
    const faelle = [
      officialTruthRegelReviewEntscheidungsabsicht(null),
      officialTruthRegelReviewEntscheidungsabsicht([]),
      officialTruthRegelReviewEntscheidungsabsicht('needs_more_evidence'),
      absicht([], identitaet.reviewPacketKey, 'needs_more_evidence'),
      absicht([stuetze], identitaet.reviewPacketKey, 'needs_more_evidence', meta({ evidenceQuality: 'research_gap', proposal: VORSCHLAG })),
      officialTruthRegelReviewEntscheidungsabsicht({
        packetInput: officialTruthRegelReviewPacket(paketEingabe([stuetze])),
        reviewPacketKey: identitaet.reviewPacketKey,
        decision: 'reject_candidate',
      }),
      officialTruthRegelReviewEntscheidungsabsicht({
        packetInput: identitaet,
        reviewPacketKey: identitaet.reviewPacketKey,
        decision: 'reject_candidate',
      }),
    ]
    for (const ergebnis of faelle) {
      assert.equal(ergebnis.status, 'blocked')
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(identitaet.reviewPacketKey), false)
      assert.equal(text.includes(SNAPSHOT), false)
      assert.equal(text.includes('electronic_visa'), false)
      assert.equal(text.includes('rule_review_decision_intent'), false)
    }
    assert.deepEqual(absicht([], identitaet.reviewPacketKey, 'needs_more_evidence'), {
      status: 'blocked',
      reason: 'invalid_support',
    })
  })

  test('ungültige Entscheidungen scheitern ohne Echo', () => {
    const stuetze = buendel()
    const identitaet = finger([stuetze])
    const werte = [
      'accepted',
      'approved',
      'continue',
      'ACCEPT',
      'Needs_more_evidence',
      'REJECT_CANDIDATE',
      ' proceed_to_trusted_fact_entry',
      'proceed_to_trusted_fact_entry ',
      'needs_more_evidence\n',
      'reject-candidate',
      'yes',
      '',
      ' ',
      FREITEXT,
      true,
      false,
      null,
      1,
      0,
    ]
    for (const decision of werte) {
      const ergebnis = absicht([stuetze], identitaet.reviewPacketKey, decision)
      assert.deepEqual(ergebnis, { status: 'blocked', reason: 'invalid_decision' })
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(FREITEXT), false)
      assert.equal(text.includes('accepted'), false)
      assert.equal(text.includes('approved'), false)
      assert.equal(text.includes(identitaet.reviewPacketKey), false)
      assert.equal(text.includes('rule_review_decision_intent'), false)
    }
  })

  test('mitgelieferte Autorität, Vorschläge und Paketstoff scheitern ohne Echo', () => {
    const stuetze = buendel()
    const identitaet = finger([stuetze])
    for (const feld of FREMDE_FELDER) {
      const ergebnis = absicht([stuetze], identitaet.reviewPacketKey, 'proceed_to_trusted_fact_entry', meta(), {
        [feld]: MARKER,
      })
      assert.equal(ergebnis.status, 'blocked', feld)
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(MARKER), false, feld)
      assert.equal(text.includes(feld), false, feld)
      assert.equal(text.includes(identitaet.reviewPacketKey), false, feld)
      assert.equal(text.includes('rule_review_decision_intent'), false, feld)
    }
    const vorschlag = officialTruthRegelReviewEntscheidungsabsicht({
      packetInput: paketEingabe([stuetze]),
      reviewPacketKey: identitaet.reviewPacketKey,
      suggestion: {
        assessment: 'supports_candidate',
        citedSupportVersionIds: identitaet.supportVersionIds,
        reasonCodes: ['support_text_matches_candidate'],
      },
    })
    assert.equal(vorschlag.status, 'blocked')
    assert.equal(JSON.stringify(vorschlag).includes('supports_candidate'), false)
    assert.equal(JSON.stringify(vorschlag).includes(identitaet.supportVersionIds[0]!), false)
  })

  test('persönliche und freie Felder scheitern ohne Echo', () => {
    const stuetze = buendel()
    const identitaet = finger([stuetze])
    for (const feld of PERSONEN) {
      const oben = absicht([stuetze], identitaet.reviewPacketKey, 'reject_candidate', meta(), { [feld]: GEHEIM })
      const inMeta = absicht([stuetze], identitaet.reviewPacketKey, 'reject_candidate', meta({ [feld]: GEHEIM }))
      const imUmschlag = absicht(
        [buendel(huelle({ extra: { [feld]: GEHEIM } }))],
        identitaet.reviewPacketKey,
        'reject_candidate',
      )
      for (const ergebnis of [oben, inMeta, imUmschlag]) {
        assert.equal(ergebnis.status, 'blocked', feld)
        const text = JSON.stringify(ergebnis)
        assert.equal(text.includes(GEHEIM), false, feld)
        assert.equal(text.includes(feld), false, feld)
        assert.equal(text.includes(identitaet.reviewPacketKey), false, feld)
        assert.equal(text.includes('rule_review_decision_intent'), false, feld)
      }
    }
    const frei = absicht([stuetze], identitaet.reviewPacketKey, 'reject_candidate', meta(), { note: FREITEXT })
    assert.equal(frei.status, 'blocked')
    assert.equal(JSON.stringify(frei).includes(FREITEXT), false)
    assert.equal(JSON.stringify(frei).includes('XC-44821'), false)
  })

  test('eine zweite Credential-Option bleibt eine andere Absicht', () => {
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
    const schweizerId = finger([schweiz])
    const serbischId = finger([serbien])
    const schweizer = offen(absicht([schweiz], schweizerId.reviewPacketKey, 'needs_more_evidence'))
    const serbisch = offen(absicht([serbien], serbischId.reviewPacketKey, 'reject_candidate'))
    assert.notEqual(schweizer.reviewPacketKey, serbisch.reviewPacketKey)
    assert.notEqual(schweizer.ruleScopeKey, serbisch.ruleScopeKey)
    assert.equal(schweizer.factKind, 'requirement_effect')
    assert.equal(serbisch.factKind, 'requirement_effect')
    const fremd = absicht([schweiz], serbischId.reviewPacketKey, 'proceed_to_trusted_fact_entry')
    assert.deepEqual(fremd, { status: 'blocked', reason: 'review_packet_key_mismatch' })
    assert.equal(JSON.stringify(fremd).includes(serbischId.reviewPacketKey), false)
    assert.equal(JSON.stringify(fremd).includes(schweizerId.reviewPacketKey), false)
    assert.equal(JSON.stringify(fremd).includes('RS'), false)
    assert.equal(JSON.stringify(fremd).includes('CH'), false)
    const gemeinsam = absicht([schweiz, serbien], schweizerId.reviewPacketKey, 'reject_candidate')
    assert.deepEqual(gemeinsam, { status: 'blocked', reason: 'scope_mismatch' })
    assert.equal(JSON.stringify(gemeinsam).includes('RS'), false)
    assert.equal(JSON.stringify(gemeinsam).includes('CH'), false)
    ohneStoff(schweizer, ['pass ch'])
    ohneStoff(serbisch, ['pass rs'])
  })

  test('dieselbe Quelle als Zusammensetzung bleibt für jede Absicht geschlossen', () => {
    const links = buendel(huelle({ material: { sourceSnapshot: 'seite grenze' } }))
    const rechts = buendel(huelle({ material: { sourceSnapshot: 'seite nochmal' } }))
    const metadata = meta({ evidenceQuality: 'composed_from_multiple_primary_sources' })
    for (const decision of ZUSTAENDE) {
      const ergebnis = absicht([links, rechts], MARKER, decision, metadata)
      assert.deepEqual(ergebnis, { status: 'blocked', reason: 'same_source_composition' })
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(MARKER), false)
      assert.equal(text.includes('seite grenze'), false)
      assert.equal(text.includes('rule_review_decision_intent'), false)
    }
  })

  test('die Eingabe bleibt unverändert', () => {
    const stuetze = buendel()
    const identitaet = finger([stuetze])
    const metadata = meta()
    const packetInput = paketEingabe([stuetze], metadata)
    const eingabe = {
      packetInput,
      reviewPacketKey: identitaet.reviewPacketKey,
      decision: 'proceed_to_trusted_fact_entry',
    }
    const vorher = JSON.stringify(eingabe)
    const ergebnis = offen(officialTruthRegelReviewEntscheidungsabsicht(eingabe))
    assert.equal(JSON.stringify(eingabe), vorher)
    assert.equal(ergebnis.reviewPacketKey, identitaet.reviewPacketKey)
    assert.equal(metadata.proposal, VORSCHLAG)
  })

  test('die Absicht ruft nur das Prüfpaket und seine Identität auf', () => {
    const text = datei('lib/readiness/official-truth-rule-review-decision-intent.ts')
    const importe = [...text.matchAll(/from '([^']+)'/g)].map((treffer) => treffer[1]).sort()
    assert.deepEqual(importe, [
      '@/lib/readiness/official-truth-rule-review-fingerprint',
      '@/lib/readiness/official-truth-rule-review-packet',
      '@/lib/readiness/rule-claims',
    ])
    assert.match(text, /import type \{ RegelFaktArt \} from '@\/lib\/readiness\/rule-claims'/)
    assert.doesNotMatch(text, /import\s*\{[^}]*RegelFaktArt[^}]*\}\s*from '@\/lib\/readiness\/rule-claims'/)
    assert.match(text, /officialTruthRegelReviewPacket\(/)
    assert.match(text, /officialTruthRegelReviewPacketFingerprint\(/)
    assert.match(text, /packet_fingerprint_mismatch/)
    assert.match(text, /review_packet_key_mismatch/)
    assert.match(text, /invalid_decision/)
    assert.match(text, /quality_not_acceptable/)
    assert.match(text, /same_source_composition/)
    assert.doesNotMatch(text, /regelKandidatAkzeptieren|regelKandidatErstellen|trustedRuleFact/)
    assert.doesNotMatch(text, /officialTruthAkzeptierteEvidenceAusAbruf|officialTruthRegelKandidatAusEvidence|officialTruthAbgerufenMaterialPruefen/)
    assert.doesNotMatch(text, /officialTruthRegelReviewVorschlag|official-truth-review-suggestion/)
    assert.doesNotMatch(text, /official_truth_store_accepted_v1|official_truth_source_catalog_v1/)
    assert.doesNotMatch(text, /requirementsProviderAus|sha256Hex|evidenceQuellenFingerprint/)
    assert.doesNotMatch(text, /\.sourceSnapshot|\.canonicalUrl|\.sourceContentHash|\.proposal/)
    assert.doesNotMatch(text, /supabase|openai|Date\.now|new Date\(|fetch\(|Math\.random|node:fs|node:http|node:net/i)
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
      'lib/readiness/official-truth-review-suggestion.ts',
      'lib/readiness/provider.ts',
    ]) {
      assert.doesNotMatch(datei(relativ), /official-truth-rule-review-decision-intent/, relativ)
    }
    assert.equal(requirementsProviderAus(), null)
  })
})
