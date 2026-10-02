// lib/readiness/official-truth-store-server.test.ts
//
// Kanonische Annahme plus ein lokaler PostgreSQL-Nachweis für das Gateway.
// Synthetische *.example-Quellen. Die Wegwerf-Datenbank wird danach gelöscht.
// Kein Development, kein Production, kein Provider.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  evidenceKandidatAkzeptieren,
  evidenceKandidatAusModell,
  type EvidenceVersion,
} from '@/lib/readiness/evidence'
import { officialTruthServerHeldEvidenceAnnehmen } from '@/lib/readiness/official-truth-server-held-source-registry'
import { officialTruthRechercheEntscheiden } from '@/lib/readiness/official-truth-research-request'
import {
  type OfficialTruthSourceCatalogTransport,
} from '@/lib/readiness/official-truth-source-catalog-server'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import {
  regelKandidatErstellen,
  regelScopeAusEvidenceScope,
} from '@/lib/readiness/rule-claims'
import { type QuellenAbdeckung, type QuellenDeskriptor } from '@/lib/readiness/source-router'
import {
  quellenRegistryErstellen,
  quellenUrlAufloesen,
  type QuellenEingabe,
  type QuellenRegistry,
} from '@/lib/readiness/source-registry'
import {
  OFFICIAL_TRUTH_STORE_ACCEPTED_V1,
  akzeptierteEvidenceSpeichern,
  akzeptierteRegelClaimSpeichern,
  type OfficialTruthEvidenceStoreAbhaengigkeiten,
  type OfficialTruthStoreTransport,
} from '@/lib/readiness/official-truth-store-server'

const ROOT = process.cwd()
const MIGRATION_DIR = join(ROOT, 'supabase/migrations')
const WRITER_SUFFIX = '_official_truth_trusted_store_writer_1.sql'
const PG_BIN = '/usr/lib/postgresql/16/bin'
const ABGERUFEN = '2026-10-01T12:00:00.000Z'
const AUDIT = '2026-10-01T12:05:00.000Z'
const SIEBZEHN_FLUGHAFEN = [
  'AAA', 'AAB', 'AAC', 'AAD', 'AAE', 'AAF', 'AAG', 'AAH', 'AAI',
  'AAJ', 'AAK', 'AAL', 'AAM', 'AAN', 'AAO', 'AAP', 'AAQ',
] as const

const OFFICIAL_TABLES = [
  'official_sources',
  'official_source_domains',
  'official_evidence_versions',
  'official_rule_claims',
  'official_rule_claim_support',
  'official_rule_claim_requirement_effect',
  'official_rule_claim_visa_options',
  'official_rule_claim_stay_limit',
  'official_rule_claim_passport_validity',
  'official_rule_claim_blank_pages',
  'official_rule_claim_transit_paths',
  'official_rule_claim_actions',
  'official_rule_claim_temporal_rule',
] as const

type Aufruf = Record<string, unknown>

function quelle(relativ: string): string {
  return readFileSync(join(ROOT, relativ), 'utf8')
}

function eingaben(): QuellenEingabe[] {
  return [
    {
      sourceId: 'example-border-authority',
      sourceClass: 'official_authority',
      publisherName: 'Example Border Authority',
      authorityName: 'Example Border Authority',
      domains: ['gov.example'],
    },
    {
      sourceId: 'example-interior-authority',
      sourceClass: 'official_authority',
      publisherName: 'Example Interior Authority',
      authorityName: 'Example Interior Authority',
      domains: ['interior.example'],
    },
    {
      sourceId: 'example-visa-portal',
      sourceClass: 'official_authority',
      publisherName: 'Example Visa Portal',
      authorityName: 'Example Visa Portal',
      domains: ['visa.example'],
    },
    {
      sourceId: 'example-licensed-provider',
      sourceClass: 'licensed_evidence_provider',
      publisherName: 'Example Licensed Publisher',
      domains: ['provider.example'],
    },
  ]
}

function registry(quellen: readonly QuellenEingabe[] = eingaben()): QuellenRegistry {
  const ergebnis = quellenRegistryErstellen(quellen)
  assert.equal(ergebnis.ok, true)
  if (!ergebnis.ok) throw new Error('registry')
  return ergebnis.registry
}

function katalogZeile(eingabe: QuellenEingabe): Aufruf {
  return {
    source_id: eingabe.sourceId,
    source_class: eingabe.sourceClass,
    publisher_name: eingabe.publisherName,
    authority_name: eingabe.authorityName ?? null,
    domains: [...eingabe.domains],
  }
}

function katalogTransport(quellen: readonly QuellenEingabe[] = eingaben()): OfficialTruthSourceCatalogTransport {
  return {
    async aufrufen(payload) {
      if (payload.operation !== 'read_registry') throw new Error('register_source darf nicht aufgerufen werden')
      return {
        ok: true,
        antwort: { ok: true, operation: 'read_registry', sources: quellen.map(katalogZeile) },
      }
    },
  }
}

function abdeckungFuer(scope: Record<string, unknown>): QuellenAbdeckung {
  const option = scope.credentialOption as {
    documentType: 'passport'
    issuingCountryCode: string
    relatedCitizenshipCountryCode: string
  }
  return {
    destinationCountryCodes: [String(scope.destinationCountryCode)],
    transitCountryCodes: [],
    requirementTypes: [scope.requirementType as QuellenAbdeckung['requirementTypes'][number]],
    citizenship: { mode: 'exact', countryCodes: [option.relatedCitizenshipCountryCode] },
    residence: { mode: 'not_applicable' },
    documents: {
      mode: 'exact',
      options: [{ documentType: option.documentType, issuingCountryCode: option.issuingCountryCode }],
    },
  }
}

function abruf(
  basis: QuellenRegistry,
  sourceId: string,
  host: string,
  snapshot: string,
  scope: Record<string, unknown> = atom(),
  extraktion: unknown = null,
): { umschlag: Record<string, unknown>; uhr: () => Date; extraktion: unknown } {
  const zelle = regelScopeAusEvidenceScope(scope)
  assert.equal(zelle.ok, true)
  if (!zelle.ok) throw new Error('scope')
  const entscheidung = officialTruthRechercheEntscheiden(
    { status: 'missing', ruleScopeKey: zelle.key, factKind: 'requirement_effect' },
    zelle.scope,
  )
  assert.equal(entscheidung.action, 'research')
  if (entscheidung.action !== 'research') throw new Error('anfrage')
  const source = basis.sources.find((eintrag) => eintrag.sourceId === sourceId)
  assert.ok(source)
  const deskriptor: QuellenDeskriptor = { source, coverage: abdeckungFuer(scope) }
  return {
    umschlag: {
      request: entscheidung.request,
      descriptors: [deskriptor],
      sourceId,
      material: {
        canonicalUrl: `https://www.${host}/rules/visa`,
        retrievedAt: ABGERUFEN,
        sourceSnapshot: snapshot,
      },
    },
    uhr: () => new Date(ABGERUFEN),
    extraktion,
  }
}

function evidenceDeps(
  transport?: OfficialTruthStoreTransport,
  quellen: readonly QuellenEingabe[] = eingaben(),
  env?: Record<string, string | undefined>,
): OfficialTruthEvidenceStoreAbhaengigkeiten {
  return {
    ...(transport ? { transport } : {}),
    ...(env ? { env } : {}),
    katalog: { transport: katalogTransport(quellen) },
  }
}

function evidenceAusAbrufSpeichern(
  basis: QuellenRegistry,
  sourceId: string,
  host: string,
  snapshot: string,
  scope: Record<string, unknown> | undefined,
  deps: OfficialTruthEvidenceStoreAbhaengigkeiten,
) {
  const paket = abruf(basis, sourceId, host, snapshot, scope ?? atom())
  return akzeptierteEvidenceSpeichern(paket.umschlag, paket.uhr, paket.extraktion, deps)
}

function atom(teil?: Record<string, unknown>) {
  return {
    sourceId: 'example-border-authority',
    destinationCountryCode: 'JP',
    transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH', 'RS'] },
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

function kandidat(
  basis: QuellenRegistry,
  sourceId: string,
  host: string,
  snapshot: string,
  scope: Record<string, unknown> = atom(),
): EvidenceVersion {
  const erzeugt = evidenceKandidatAusModell(
    { scope: { ...scope, sourceId } },
    {
      canonicalUrl: `https://www.${host}/rules/visa`,
      retrievedAt: ABGERUFEN,
      sourceSnapshot: snapshot,
    },
    basis,
  )
  assert.equal(erzeugt.ok, true)
  if (!erzeugt.ok) throw new Error('kandidat')
  return erzeugt.evidence
}

function akzeptiert(
  basis: QuellenRegistry,
  sourceId: string,
  host: string,
  snapshot: string,
  scope: Record<string, unknown> = atom(),
): EvidenceVersion {
  const entwurf = kandidat(basis, sourceId, host, snapshot, scope)
  const ergebnis = evidenceKandidatAkzeptieren(entwurf, basis)
  assert.equal(ergebnis.ok, true)
  if (!ergebnis.ok) throw new Error('annahme')
  return ergebnis.evidence
}

function leerPfad(teil?: Record<string, unknown>) {
  return {
    crossesBorderControl: null,
    leavesTransitArea: null,
    transitAirportCodes: null,
    maxTransitDurationMinutes: null,
    arrivalMode: null,
    departureMode: null,
    thirdCountryRequired: null,
    sameFlightRequired: null,
    onwardTicketRequired: null,
    ...teil,
  }
}

function transportAufzeichnen(): { transport: OfficialTruthStoreTransport; aufrufe: Aufruf[] } {
  const aufrufe: Aufruf[] = []
  const transport: OfficialTruthStoreTransport = {
    async aufrufen(payload) {
      aufrufe.push(payload)
      const operation = payload.operation
      if (operation === 'accepted_evidence') {
        const evidence = payload.evidence as { version_id?: string }
        return {
          ok: true,
          antwort: {
            ok: true,
            operation,
            outcome: 'inserted',
            version_id: evidence.version_id,
          },
        }
      }
      return {
        ok: true,
        antwort: { ok: true, operation, outcome: 'inserted', claim_id: 11 },
      }
    },
  }
  return { transport, aufrufe }
}

function claimEingabe(
  basis: QuellenRegistry,
  scope: Record<string, unknown>,
  factKind: string,
  evidenceQuality: string,
  versionen: readonly EvidenceVersion[],
  trustedRuleFact: unknown,
  proposal: unknown = null,
) {
  const erzeugt = regelKandidatErstellen(
    {
      scope,
      factKind,
      evidenceQuality,
      supportVersionIds: versionen.map((eintrag) => eintrag.versionId),
      proposal,
    },
    basis,
  )
  assert.equal(erzeugt.ok, true, erzeugt.ok ? '' : erzeugt.reason)
  if (!erzeugt.ok) throw new Error('kandidat')
  return {
    kandidat: erzeugt.kandidat,
    trustedRuleFact,
    evidenceVersions: versionen,
    registry: basis,
  }
}

function migrationSql(): { name: string; sql: string } {
  const names = readdirSync(MIGRATION_DIR).filter((name) => name.endsWith(WRITER_SUFFIX))
  assert.equal(names.length, 1)
  assert.match(names[0], /^\d{14}_official_truth_trusted_store_writer_1\.sql$/)
  return { name: names[0], sql: readFileSync(join(MIGRATION_DIR, names[0]), 'utf8') }
}

function ohneKommentare(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ')
}

describe('trusted Official Truth accepted-store writer', () => {
  test('nur neu bewiesene Evidence erreicht das Gateway, mit kanonischem rule_scope_key', async () => {
    const basis = registry()
    const paket = abruf(basis, 'example-border-authority', 'gov.example', 'seite alpha')
    const { transport, aufrufe } = transportAufzeichnen()
    const bewiesen = await officialTruthServerHeldEvidenceAnnehmen(
      paket.umschlag,
      paket.uhr,
      paket.extraktion,
      { transport: katalogTransport() },
    )
    assert.equal(bewiesen.status, 'accepted_evidence')
    if (bewiesen.status !== 'accepted_evidence') return
    const gespeichert = await akzeptierteEvidenceSpeichern(
      paket.umschlag,
      paket.uhr,
      paket.extraktion,
      evidenceDeps(transport),
    )
    assert.equal(gespeichert.ok, true)
    if (!gespeichert.ok) return
    assert.equal(gespeichert.operation, 'accepted_evidence')
    assert.equal(gespeichert.versionId, bewiesen.evidence.versionId)
    assert.equal(aufrufe.length, 1)
    const evidence = aufrufe[0]?.evidence as Record<string, unknown>
    const scope = regelScopeAusEvidenceScope(bewiesen.evidence.scope)
    assert.equal(scope.ok, true)
    if (!scope.ok) return
    assert.equal(evidence.rule_scope_key, scope.key)
    assert.equal(gespeichert.ruleScopeKey, scope.key)
    assert.equal(evidence.version_id, bewiesen.evidence.versionId)
    assert.equal(evidence.source_content_hash, bewiesen.evidence.sourceContentHash)
    assert.equal(evidence.lookup_key, bewiesen.evidence.lookupKey)
    assert.equal(evidence.valid_from, bewiesen.evidence.validFrom)
    assert.equal(evidence.valid_until, bewiesen.evidence.validUntil)
    assert.equal(evidence.extraction_note, bewiesen.evidence.extractionNote)
    assert.equal(evidence.canonical_url, bewiesen.evidence.canonicalUrl)
    assert.equal(evidence.retrieved_at, bewiesen.evidence.retrievedAt)
    assert.match(String(evidence.rule_scope_key), /^rule-scope:v1:[a-f0-9]{64}$/)
    assert.notEqual(evidence.rule_scope_key, evidence.lookup_key)
    assert.equal(evidence.lifecycle, 'accepted')
    assert.equal(evidence.validation_state, 'valid')
    assert.deepEqual(evidence.citizenship_country_codes, ['CH', 'RS'])
    assert.equal(evidence.related_citizenship_country_code, 'CH')
    assert.equal(JSON.stringify(aufrufe[0]).includes('source_class'), false)
    assert.equal(JSON.stringify(aufrufe[0]).includes('proposal'), false)
    assert.equal(JSON.stringify(aufrufe[0]).includes('registry'), false)
  })

  test('ein roh akzeptiertes Objekt ist keine zweite Schreib-API', async () => {
    const text = quelle('lib/readiness/official-truth-store-server.ts')
    assert.match(text, /^import 'server-only'$/m)
    assert.match(
      text,
      /export async function akzeptierteEvidenceSpeichern\(\s*umschlag: unknown,\s*uhr: unknown,\s*extraktion: unknown,/,
    )
    assert.match(text, /officialTruthServerHeldEvidenceAnnehmen\(/)
    assert.equal(text.includes('evidenceKandidatAkzeptieren'), false)
    assert.equal(text.includes('QuellenRegistry'), false)
    assert.equal((text.match(/regelKandidatAkzeptieren\(/g) ?? []).length, 1)
    assert.equal((text.match(/officialTruthServerHeldEvidenceAnnehmen\(/g) ?? []).length, 1)
    assert.match(text, /export async function akzeptierteRegelClaimSpeichern/)
    assert.equal(text.includes('export async function storeAccepted'), false)
    assert.equal(text.includes('export function evidencePayload'), false)
    assert.equal(text.includes('export function claimPayload'), false)
    assert.equal(text.includes(".schema('private')"), false)
    assert.equal(text.includes('.schema("private")'), false)
    assert.equal(text.includes('requirementsProviderAus'), false)
    assert.equal(text.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE'), false)
    assert.match(text, /SUPABASE_SERVICE_ROLE_KEY/)
    assert.match(text, /persistSession: false/)
    assert.match(text, /detectSessionInUrl: false/)
    assert.match(text, /autoRefreshToken: false/)
    assert.equal(text.includes(`.rpc('${OFFICIAL_TRUTH_STORE_ACCEPTED_V1}'`), true)
    assert.equal((text.match(/rpc\(OFFICIAL_TRUTH_STORE_ACCEPTED_V1/g) ?? []).length, 0)
    assert.equal(text.includes('retry'), false)
    assert.equal((text.match(/transport\.aufrufen\(/g) ?? []).length, 2)
    assert.equal(requirementsProviderAus(), null)

    const roh = transportAufzeichnen()
    const ergebnis = await akzeptierteRegelClaimSpeichern(
      {
        lifecycle: 'accepted',
        validationState: 'valid',
        factKind: 'requirement_effect',
        fact: { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' },
      },
      { transport: roh.transport },
    )
    assert.equal(ergebnis.ok, false)
    assert.equal(roh.aufrufe.length, 0)
  })

  test('Regel-Claims kommen nur aus regelKandidatAkzeptieren', async () => {
    const basis = registry()
    const belegt = akzeptiert(basis, 'example-border-authority', 'gov.example', 'claim alpha')
    const zweite = akzeptiert(
      basis,
      'example-interior-authority',
      'interior.example',
      'claim beta',
      atom({ sourceId: 'example-interior-authority' }),
    )
    const proposal = { kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa' }
    const trusted = { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' }
    const { transport, aufrufe } = transportAufzeichnen()
    const gespeichert = await akzeptierteRegelClaimSpeichern(
      claimEingabe(basis, belegt.scope, 'requirement_effect', 'explicit_primary_statement', [belegt], trusted, proposal),
      { transport, jetzt: () => AUDIT },
    )
    assert.equal(gespeichert.ok, true)
    if (!gespeichert.ok || gespeichert.operation !== 'accepted_rule_claim') return
    assert.equal(gespeichert.ruleScopeKey, belegt && regelScopeAusEvidenceScope(belegt.scope).ok
      ? (regelScopeAusEvidenceScope(belegt.scope) as { ok: true; key: string }).key
      : '')
    const claim = aufrufe[0]?.claim as Record<string, unknown>
    const fact = claim.fact as Record<string, unknown>
    assert.equal(claim.rule_scope_key, gespeichert.ruleScopeKey)
    assert.deepEqual(claim.support_version_ids, [belegt.versionId])
    assert.equal(fact.effect, 'not_required')
    assert.equal(fact.visa_mode, 'visa_exempt')
    assert.equal(JSON.stringify(aufrufe[0]).includes('electronic_visa'), false)
    assert.equal(JSON.stringify(aufrufe[0]).includes('proposal'), false)
    assert.equal(JSON.stringify(aufrufe[0]).includes('source_class'), false)
    assert.equal(aufrufe[0]?.accepted_at, AUDIT)

    const zusammengesetzt = transportAufzeichnen()
    const beide = await akzeptierteRegelClaimSpeichern(
      claimEingabe(
        basis,
        belegt.scope,
        'requirement_effect',
        'composed_from_multiple_primary_sources',
        [belegt, zweite],
        trusted,
      ),
      { transport: zusammengesetzt.transport, jetzt: () => AUDIT },
    )
    assert.equal(beide.ok, true)
    const stuetzen = (zusammengesetzt.aufrufe[0]?.claim as { support_version_ids: string[] }).support_version_ids
    assert.deepEqual([...stuetzen].sort(), [belegt.versionId, zweite.versionId].sort())

    const gleicheQuelle = transportAufzeichnen()
    const gleiche = await akzeptierteRegelClaimSpeichern(
      claimEingabe(
        basis,
        belegt.scope,
        'requirement_effect',
        'composed_from_multiple_primary_sources',
        [belegt, akzeptiert(basis, 'example-border-authority', 'gov.example', 'gleiche quelle zwei')],
        trusted,
      ),
      { transport: gleicheQuelle.transport },
    )
    assert.equal(gleiche.ok, false)
    if (gleiche.ok) return
    assert.equal(gleiche.reason, 'same_source_composition')
    assert.equal(gleicheQuelle.aufrufe.length, 0)

    for (const qualitaet of ['research_gap', 'unresolved_conflict', 'stale_primary_evidence'] as const) {
      const block = transportAufzeichnen()
      const abgelehnt = await akzeptierteRegelClaimSpeichern(
        claimEingabe(
          basis,
          belegt.scope,
          'requirement_effect',
          qualitaet,
          qualitaet === 'research_gap' ? [] : [belegt],
          trusted,
          qualitaet === 'research_gap' ? null : trusted,
        ),
        { transport: block.transport },
      )
      assert.equal(abgelehnt.ok, false)
      if (!abgelehnt.ok) assert.equal(abgelehnt.reason, 'quality_not_acceptable')
      assert.equal(block.aufrufe.length, 0)
    }
  })

  test('jede Faktart wird auf die passende Tabellenform abgebildet', async () => {
    const basis = registry()
    const visa = akzeptiert(basis, 'example-border-authority', 'gov.example', 'visa-fakt')
    const pass = akzeptiert(
      basis,
      'example-border-authority',
      'gov.example',
      'pass-fakt',
      atom({ requirementType: 'passport_validity' }),
    )
    const seiten = akzeptiert(
      basis,
      'example-border-authority',
      'gov.example',
      'seiten-fakt',
      atom({ requirementType: 'blank_passport_pages' }),
    )
    const transit = akzeptiert(
      basis,
      'example-border-authority',
      'gov.example',
      'transit-fakt',
      atom({ requirementType: 'transit' }),
    )
    const portal = quellenUrlAufloesen(basis, 'https://www.visa.example/apply')
    assert.equal(portal.ok, true)
    if (!portal.ok) return

    const faelle: Array<{ scope: Record<string, unknown>; version: EvidenceVersion; factKind: string; fact: unknown; pruefen: (fact: Record<string, unknown>) => void }> = [
      {
        scope: visa.scope,
        version: visa,
        factKind: 'requirement_effect',
        fact: { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' },
        pruefen: (fact) => {
          assert.equal(fact.effect, 'not_required')
          assert.equal(fact.visa_mode, 'visa_exempt')
        },
      },
      {
        scope: visa.scope,
        version: visa,
        factKind: 'visa_options',
        fact: {
          kind: 'visa_options',
          options: [
            { visaMode: 'electronic_visa', eligibility: 'allowed', mandate: 'not_mandatory' },
            { visaMode: 'visa_exempt', eligibility: 'allowed', mandate: 'not_mandatory' },
          ],
        },
        pruefen: (fact) => {
          const options = fact.options as Array<Record<string, unknown>>
          assert.deepEqual(options.map((option) => option.visa_mode), ['visa_exempt', 'electronic_visa'])
          assert.deepEqual(options.map((option) => option.ordinal), [1, 2])
        },
      },
      {
        scope: visa.scope,
        version: visa,
        factKind: 'stay_limit',
        fact: {
          kind: 'stay_limit',
          perVisit: { value: 90, unit: 'days' },
          rollingWindow: null,
          initialGrant: null,
          extension: null,
          borderDiscretion: 'fixed',
        },
        pruefen: (fact) => {
          assert.equal(fact.per_visit_value, 90)
          assert.equal(fact.per_visit_unit, 'days')
          assert.equal(fact.rolling_maximum_value, null)
          assert.equal(fact.border_discretion, 'fixed')
        },
      },
      {
        scope: pass.scope,
        version: pass,
        factKind: 'passport_validity',
        fact: { kind: 'passport_validity', semantics: 'valid_on_entry' },
        pruefen: (fact) => {
          assert.equal(fact.semantics, 'valid_on_entry')
          assert.equal(fact.duration_value, null)
          assert.equal(fact.duration_unit, null)
        },
      },
      {
        scope: seiten.scope,
        version: seiten,
        factKind: 'blank_passport_pages',
        fact: { kind: 'blank_passport_pages', minimumPages: 2 },
        pruefen: (fact) => assert.equal(fact.minimum_pages, 2),
      },
      {
        scope: transit.scope,
        version: transit,
        factKind: 'transit_conditions',
        fact: {
          kind: 'transit_conditions',
          paths: [leerPfad({ transitAirportCodes: [...SIEBZEHN_FLUGHAFEN] })],
        },
        pruefen: (fact) => {
          const paths = fact.paths as Array<Record<string, unknown>>
          assert.equal(paths.length, 1)
          assert.deepEqual(paths[0]?.transit_airport_codes, [...SIEBZEHN_FLUGHAFEN])
          assert.equal((paths[0]?.transit_airport_codes as string[]).length, 17)
        },
      },
      {
        scope: visa.scope,
        version: visa,
        factKind: 'official_actions',
        fact: {
          kind: 'official_actions',
          actions: [
            {
              actionSourceId: 'example-visa-portal',
              purpose: 'application',
              href: 'https://www.visa.example/apply',
              visaMode: 'electronic_visa',
            },
          ],
        },
        pruefen: (fact) => {
          const actions = fact.actions as Array<Record<string, unknown>>
          assert.equal(actions[0]?.action_source_id, 'example-visa-portal')
          assert.equal(actions[0]?.href, portal.canonicalUrl)
          assert.equal('source_class' in (actions[0] ?? {}), false)
        },
      },
      {
        scope: visa.scope,
        version: visa,
        factKind: 'temporal_rule',
        fact: {
          kind: 'temporal_rule',
          rule: {
            kind: 'relative_duration',
            availableFrom: null,
            dueBy: {
              anchor: 'trip_departure',
              relation: 'before',
              offsetMinutes: 72 * 60,
              semantics: 'mandatory',
            },
          },
        },
        pruefen: (fact) => {
          assert.equal(fact.temporal_kind, 'relative_duration')
          assert.equal(fact.available_from_anchor, null)
          assert.equal(fact.due_by_anchor, 'trip_departure')
          assert.equal(fact.due_by_offset_minutes, 72 * 60)
          assert.equal(fact.due_by_semantics, 'mandatory')
        },
      },
    ]

    for (const fall of faelle) {
      const { transport, aufrufe } = transportAufzeichnen()
      const ergebnis = await akzeptierteRegelClaimSpeichern(
        claimEingabe(basis, fall.scope, fall.factKind, 'explicit_primary_statement', [fall.version], fall.fact),
        { transport, jetzt: () => AUDIT },
      )
      assert.equal(ergebnis.ok, true, fall.factKind)
      const claim = aufrufe[0]?.claim as Record<string, unknown>
      assert.equal(claim.fact_kind, fall.factKind)
      assert.equal(claim.rule_scope_key, (regelScopeAusEvidenceScope(fall.scope) as { ok: true; key: string }).key)
      assert.deepEqual(claim.support_version_ids, [fall.version.versionId])
      fall.pruefen(claim.fact as Record<string, unknown>)
    }
  })

  test('fehlende Dienst-Zugangsdaten schliessen den Weg, ohne den RPC zu rufen', async () => {
    const basis = registry()
    const paket = abruf(basis, 'example-border-authority', 'gov.example', 'kein geheimnis')
    const { transport, aufrufe } = transportAufzeichnen()
    const ohneKatalog = await akzeptierteEvidenceSpeichern(paket.umschlag, paket.uhr, null, {
      transport,
      katalog: {
        env: {
          NEXT_PUBLIC_SUPABASE_URL: '   ',
          SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret-sentinel',
        },
      },
    })
    assert.deepEqual(ohneKatalog, { ok: false, reason: 'catalog_not_configured' })
    assert.equal(JSON.stringify(ohneKatalog).includes('service-role-secret-sentinel'), false)
    assert.equal(aufrufe.length, 0)

    const ohneSpeicher = await akzeptierteEvidenceSpeichern(paket.umschlag, paket.uhr, null, {
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.test',
        NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: 'nicht-verwenden',
      },
      katalog: { transport: katalogTransport() },
    })
    assert.deepEqual(ohneSpeicher, { ok: false, reason: 'store_not_configured' })

    const geworfenTransport = transportAufzeichnen()
    geworfenTransport.transport.aufrufen = async () => {
      throw new Error('netz')
    }
    const geworfen = await akzeptierteEvidenceSpeichern(
      paket.umschlag,
      paket.uhr,
      null,
      evidenceDeps(geworfenTransport.transport),
    )
    assert.deepEqual(geworfen, { ok: false, reason: 'store_failed' })
    assert.equal(geworfenTransport.aufrufe.length, 0)
  })

  test('die Migration ist genau ein Gateway ohne Katalog-Seed', () => {
    const datei = migrationSql()
    const sql = ohneKommentare(datei.sql)
    const koerper = sql.match(/as \$fn\$([\s\S]*)\$fn\$/i)
    assert.ok(koerper)
    const ohneKoerper = sql.replace(/as \$fn\$[\s\S]*\$fn\$/i, ' ')
    assert.equal((sql.match(/\bsecurity\s+definer\b/gi) ?? []).length, 1)
    assert.match(sql, /create function public\.official_truth_store_accepted_v1\(payload jsonb\)/i)
    assert.match(sql, /set search_path = ''/i)
    const evidenceZweig = koerper[1].slice(0, koerper[1].indexOf("operation is distinct from 'accepted_rule_claim'"))
    const ablehnung = evidenceZweig.indexOf('official truth store evidence is not accepted')
    const duplikat = evidenceZweig.indexOf('exact_match := exists')
    const einfuegen = evidenceZweig.search(/insert\s+into\s+private\.official_evidence_versions/i)
    assert.ok(ablehnung > 0)
    assert.ok(duplikat > ablehnung)
    assert.ok(einfuegen > ablehnung)
    assert.match(evidenceZweig, /neu_lifecycle is distinct from 'accepted'/)
    assert.match(evidenceZweig, /neu_validation_state is distinct from 'valid'/)
    assert.doesNotMatch(sql, /\bcreate\s+or\s+replace\s+function\b/i)
    assert.equal((sql.match(/\bcreate\s+function\b/gi) ?? []).length, 1)
    assert.doesNotMatch(ohneKoerper, /\binsert\s+into\b/i)
    assert.doesNotMatch(sql, /\binsert\s+into\s+private\.official_sources\b/i)
    assert.doesNotMatch(sql, /\binsert\s+into\s+private\.official_source_domains\b/i)
    assert.doesNotMatch(sql, /\b(update|delete)\s+/i)
    assert.match(sql, /grant execute on function public\.official_truth_store_accepted_v1\(jsonb\) to service_role/i)
    for (const role of ['public', 'anon', 'authenticated', 'service_role']) {
      assert.match(sql, new RegExp(`revoke all on function public\\.official_truth_store_accepted_v1\\(jsonb\\) from ${role}\\b`, 'i'))
    }
    assert.doesNotMatch(sql, /\bgrant\s+(select|insert|update|delete|all)\b/i)
    assert.doesNotMatch(sql, /\bcreate\s+policy\b/i)
    const config = readFileSync(join(ROOT, 'supabase/config.toml'), 'utf8')
    assert.match(config, /schemas = \["public", "graphql_public"\]/)
    assert.equal(OFFICIAL_TRUTH_STORE_ACCEPTED_V1, 'official_truth_store_accepted_v1')
    assert.equal(datei.name.endsWith(WRITER_SUFFIX), true)
  })
})

type Cluster = {
  aufruf(sql: string, rolle?: string): string
  scheitert(sql: string, rolle?: string): string
  stop(): void
}

function kindlicheUmgebung(home: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, HOME: home }
  for (const schluessel of Object.keys(env)) {
    if (
      schluessel.startsWith('PG') ||
      schluessel.startsWith('SUPABASE') ||
      schluessel === 'DATABASE_URL' ||
      schluessel === 'NEXT_PUBLIC_SUPABASE_URL'
    ) {
      delete env[schluessel]
    }
  }
  return env
}

function clusterStarten(): Cluster {
  const wurzel = mkdtempSync(join(tmpdir(), 'jetnity-official-truth-store-'))
  const dataDir = join(wurzel, 'data')
  const socketDir = join(wurzel, 'sock')
  const home = join(wurzel, 'home')
  const user = process.env.USER || 'ubuntu'
  const env = kindlicheUmgebung(home)
  execFileSync('mkdir', ['-p', socketDir, home])
  const initArgs = ['-D', dataDir, '--username', user, '--auth-local=trust', '--encoding=UTF8']
  try {
    execFileSync(join(PG_BIN, 'initdb'), [...initArgs, '--locale=C.UTF-8'], { env, stdio: 'ignore' })
  } catch {
    execFileSync(join(PG_BIN, 'initdb'), [...initArgs, '--no-locale'], { env, stdio: 'ignore' })
  }
  execFileSync(
    join(PG_BIN, 'pg_ctl'),
    [
      '-D', dataDir,
      '-l', join(wurzel, 'log'),
      '-w',
      'start',
      '-o',
      `-c listen_addresses= -c unix_socket_directories=${socketDir} -c shared_buffers=16MB`,
    ],
    { env, stdio: 'ignore' },
  )

  const basis = [
    join(PG_BIN, 'psql'),
    '-X',
    '--no-psqlrc',
    '-h', socketDir,
    '-U', user,
    '-d', 'postgres',
    '-v', 'ON_ERROR_STOP=1',
  ]

  const lauf = (args: string[], sql?: string) => {
    return execFileSync(basis[0], [...basis.slice(1), ...args], {
      env,
      encoding: 'utf8',
      input: sql,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
  }

  const stop = () => {
    try {
      execFileSync(join(PG_BIN, 'pg_ctl'), ['-D', dataDir, '-m', 'immediate', 'stop'], { env, stdio: 'ignore' })
    } finally {
      rmSync(wurzel, { recursive: true, force: true })
    }
  }

  try {
    lauf(['-c', 'create database official_truth_store_proof'])
    const dateien = [
      '20261001121258_official_truth_private_evidence_store_schema_1.sql',
      '20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql',
      migrationSql().name,
    ]
    lauf(
      ['-d', 'official_truth_store_proof'],
      `
        create role anon nologin noinherit;
        create role authenticated nologin noinherit;
        create role service_role nologin noinherit bypassrls;
        grant usage on schema public to anon, authenticated, service_role;
      `,
    )
    for (const datei of dateien) {
      lauf(['-d', 'official_truth_store_proof', '-f', join(MIGRATION_DIR, datei)])
    }
  } catch (error) {
    stop()
    throw error
  }

  const aufruf = (sql: string, rolle?: string) => {
    const args = ['-d', 'official_truth_store_proof', '-t', '-A']
    if (rolle) args.push('-c', `set role ${rolle}`)
    args.push('-c', sql)
    return lauf(args)
      .split('\n')
      .map((zeile) => zeile.trim())
      .filter((zeile) => zeile.length > 0 && zeile !== 'SET')
      .join('\n')
  }

  const scheitert = (sql: string, rolle?: string) => {
    const args = ['-d', 'official_truth_store_proof']
    if (rolle) args.push('-c', `set role ${rolle}`)
    args.push('-c', sql)
    try {
      lauf(args)
    } catch (error) {
      const fehler = error as { stderr?: string; stdout?: string; message?: string }
      return `${fehler.stderr ?? ''}\n${fehler.stdout ?? ''}\n${fehler.message ?? ''}`
    }
    throw new Error(`erwartet eine Ablehnung: ${sql}`)
  }

  return {
    aufruf,
    scheitert,
    stop() {
      stop()
    },
  }
}

function beweisPayload(evidence: EvidenceVersion): Aufruf {
  const scope = regelScopeAusEvidenceScope(evidence.scope)
  if (!scope.ok) throw new Error('scope')
  const citizenship = evidence.scope.citizenship
  const option = evidence.scope.credentialOption
  const residence = evidence.scope.residence
  const validity = evidence.scope.validity
  return {
    operation: 'accepted_evidence',
    evidence: {
      version_id: evidence.versionId,
      previous_version_id: evidence.previousVersionId,
      lifecycle: evidence.lifecycle,
      validation_state: evidence.validationState,
      source_id: evidence.sourceId,
      canonical_url: evidence.canonicalUrl,
      retrieved_at: evidence.retrievedAt,
      source_content_hash: evidence.sourceContentHash,
      valid_from: evidence.validFrom,
      valid_until: evidence.validUntil,
      lookup_key: evidence.lookupKey,
      extraction_note: evidence.extractionNote,
      rule_scope_key: scope.key,
      destination_country_code: evidence.scope.destinationCountryCode,
      transit_country_code: evidence.scope.transitCountryCode,
      citizenship_mode: citizenship.mode,
      citizenship_country_codes: citizenship.mode === 'required' ? [...citizenship.countryCodes] : [],
      credential_option_mode: option.mode,
      document_type: option.mode === 'option' ? option.documentType : null,
      issuing_country_code: option.mode === 'option' ? option.issuingCountryCode : null,
      related_citizenship_country_code: option.mode === 'option' ? option.relatedCitizenshipCountryCode : null,
      residence_mode: residence.mode,
      residence_country_code: residence.mode === 'required' ? residence.countryCode : null,
      requirement_type: evidence.scope.requirementType,
      validity_mode: validity.mode,
      travel_date: validity.mode === 'travel_date' ? validity.travelDate : null,
    },
  }
}

function claimAusEvidencePayload(
  evidencePayload: Aufruf,
  factKind: string,
  evidenceQuality: string,
  supportIds: readonly string[],
  fact: Record<string, unknown>,
): Aufruf {
  const evidence = evidencePayload.evidence as Record<string, unknown>
  return {
    operation: 'accepted_rule_claim',
    accepted_at: AUDIT,
    claim: {
      rule_scope_key: evidence.rule_scope_key,
      fact_kind: factKind,
      evidence_quality: evidenceQuality,
      lifecycle: 'accepted',
      validation_state: 'valid',
      destination_country_code: evidence.destination_country_code,
      transit_country_code: evidence.transit_country_code,
      citizenship_mode: evidence.citizenship_mode,
      citizenship_country_codes: evidence.citizenship_country_codes,
      credential_option_mode: evidence.credential_option_mode,
      document_type: evidence.document_type,
      issuing_country_code: evidence.issuing_country_code,
      related_citizenship_country_code: evidence.related_citizenship_country_code,
      residence_mode: evidence.residence_mode,
      residence_country_code: evidence.residence_country_code,
      requirement_type: evidence.requirement_type,
      validity_mode: evidence.validity_mode,
      travel_date: evidence.travel_date,
      support_version_ids: [...supportIds],
      fact,
    },
  }
}

function payloadTag(payload: unknown): string {
  const json = JSON.stringify(payload)
  const tag = '$jetnity_payload$'
  if (json.includes(tag)) throw new Error('payload tag')
  return `public.official_truth_store_accepted_v1(${tag}${json}${tag}::jsonb)`
}

function appTexte(): string {
  const texte: string[] = []
  const stapel = [join(ROOT, 'app')]
  while (stapel.length > 0) {
    const ordner = stapel.pop()
    if (!ordner) break
    for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
      const pfad = join(ordner, eintrag.name)
      if (eintrag.isDirectory()) stapel.push(pfad)
      else if (eintrag.name.endsWith('.ts') || eintrag.name.endsWith('.tsx')) texte.push(readFileSync(pfad, 'utf8'))
    }
  }
  return texte.join('\n')
}

function katalogZaehler(quellen: readonly QuellenEingabe[] = eingaben()): {
  transport: OfficialTruthSourceCatalogTransport
  aufrufe: Aufruf[]
} {
  const aufrufe: Aufruf[] = []
  return {
    aufrufe,
    transport: {
      async aufrufen(payload) {
        aufrufe.push({ ...payload })
        if (payload.operation !== 'read_registry') throw new Error('register_source darf nicht aufgerufen werden')
        return {
          ok: true,
          antwort: { ok: true, operation: 'read_registry', sources: quellen.map(katalogZeile) },
        }
      },
    },
  }
}

describe('server-reproved accepted Evidence store entry', () => {
  test('Aufruferautorität und gebaute Evidence erreichen den Speicher nicht', async () => {
    const basis = registry()
    const paket = abruf(basis, 'example-border-authority', 'gov.example', 'angriff alpha')
    const schon = akzeptiert(basis, 'example-border-authority', 'gov.example', 'angriff alpha')
    const felder = ['registry', 'sourceClass', 'domains', 'blockedDomains'] as const

    for (const feld of felder) {
      const wert = feld === 'sourceClass'
        ? 'official_authority'
        : feld === 'registry'
          ? basis
          : ['not-a-government.example']
      const katalog = katalogZaehler()
      const roh = transportAufzeichnen()
      const oben = await akzeptierteEvidenceSpeichern(
        { ...paket.umschlag, [feld]: wert },
        paket.uhr,
        null,
        { transport: roh.transport, katalog: { transport: katalog.transport } },
      )
      assert.deepEqual(oben, { ok: false, reason: 'caller_authority_forbidden' }, feld)
      assert.equal(roh.aufrufe.length, 0, feld)
      assert.equal(katalog.aufrufe.length, 0, feld)

      const imMaterial = katalogZaehler()
      const materialRoh = transportAufzeichnen()
      const material = paket.umschlag.material as Record<string, unknown>
      const imMaterialErgebnis = await akzeptierteEvidenceSpeichern(
        { ...paket.umschlag, material: { ...material, [feld]: wert } },
        paket.uhr,
        null,
        { transport: materialRoh.transport, katalog: { transport: imMaterial.transport } },
      )
      assert.deepEqual(imMaterialErgebnis, { ok: false, reason: 'caller_authority_forbidden' }, feld)
      assert.equal(materialRoh.aufrufe.length, 0, feld)
    }

    const abhaengig = transportAufzeichnen()
    const registryAlsAbhaengigkeit = await akzeptierteEvidenceSpeichern(paket.umschlag, paket.uhr, null, {
      transport: abhaengig.transport,
      katalog: basis as unknown as OfficialTruthEvidenceStoreAbhaengigkeiten['katalog'],
    })
    assert.deepEqual(registryAlsAbhaengigkeit, { ok: false, reason: 'caller_authority_forbidden' })
    assert.equal(abhaengig.aufrufe.length, 0)

    const gebaut = transportAufzeichnen()
    const alsUmschlag = await akzeptierteEvidenceSpeichern(schon, paket.uhr, null, evidenceDeps(gebaut.transport))
    assert.deepEqual(alsUmschlag, { ok: false, reason: 'caller_authority_forbidden' })
    assert.equal(gebaut.aufrufe.length, 0)

    const akzeptiertRoh = transportAufzeichnen()
    const alsExtraktion = await akzeptierteEvidenceSpeichern(
      paket.umschlag,
      paket.uhr,
      schon,
      evidenceDeps(akzeptiertRoh.transport),
    )
    assert.deepEqual(alsExtraktion, { ok: false, reason: 'caller_authority_forbidden' })
    assert.equal(akzeptiertRoh.aufrufe.length, 0)

    const verschachtelt = transportAufzeichnen()
    const mitEvidence = await akzeptierteEvidenceSpeichern(
      { ...paket.umschlag, evidence: schon },
      paket.uhr,
      null,
      evidenceDeps(verschachtelt.transport),
    )
    assert.equal(mitEvidence.ok, false)
    if (mitEvidence.ok) return
    assert.equal(mitEvidence.reason, 'invalid_envelope')
    assert.equal(verschachtelt.aufrufe.length, 0)
  })

  test('Hash, Version und Lookup des Aufrufers überschreiben die bewiesene Evidence nicht', async () => {
    const basis = registry()
    const paket = abruf(basis, 'example-border-authority', 'gov.example', 'hash alpha', atom(), {
      validFrom: '2026-10-01',
      validUntil: null,
      extractionNote: 'Fenster aus der Extraktion',
    })
    const falscherHash = 'a'.repeat(64)
    const falscheVersion = `ev1_${'ab'.repeat(16)}`
    const hashFelder = ['sourceContentHash', 'contentHash', 'content'] as const
    for (const feld of hashFelder) {
      const roh = transportAufzeichnen()
      const oben = await akzeptierteEvidenceSpeichern(
        { ...paket.umschlag, [feld]: falscherHash },
        paket.uhr,
        null,
        evidenceDeps(roh.transport),
      )
      assert.equal(oben.ok, false, feld)
      assert.equal(roh.aufrufe.length, 0, feld)

      const materialRoh = transportAufzeichnen()
      const material = paket.umschlag.material as Record<string, unknown>
      const imMaterial = await akzeptierteEvidenceSpeichern(
        { ...paket.umschlag, material: { ...material, [feld]: falscherHash } },
        paket.uhr,
        null,
        evidenceDeps(materialRoh.transport),
      )
      assert.deepEqual(imMaterial, { ok: false, reason: 'source_fingerprint_override_forbidden' }, feld)
      assert.equal(materialRoh.aufrufe.length, 0, feld)
      assert.equal(JSON.stringify(imMaterial).includes(falscherHash), false)

      const extraktionRoh = transportAufzeichnen()
      const inExtraktion = await akzeptierteEvidenceSpeichern(
        paket.umschlag,
        paket.uhr,
        { validFrom: null, validUntil: null, extractionNote: null, [feld]: falscherHash },
        evidenceDeps(extraktionRoh.transport),
      )
      assert.deepEqual(inExtraktion, { ok: false, reason: 'extraction_field_forbidden' }, feld)
      assert.equal(extraktionRoh.aufrufe.length, 0, feld)
    }

    const overrides = ['versionId', 'lifecycle', 'validationState', 'lookupKey'] as const
    for (const feld of overrides) {
      const roh = transportAufzeichnen()
      const abgelehnt = await akzeptierteEvidenceSpeichern(
        paket.umschlag,
        paket.uhr,
        { validFrom: null, validUntil: null, extractionNote: null, [feld]: falscheVersion },
        evidenceDeps(roh.transport),
      )
      assert.deepEqual(abgelehnt, { ok: false, reason: 'extraction_field_forbidden' }, feld)
      assert.equal(roh.aufrufe.length, 0, feld)
    }

    const { transport, aufrufe } = transportAufzeichnen()
    const deps = {
      ...evidenceDeps(transport),
      versionId: falscheVersion,
      lifecycle: 'candidate',
      validationState: 'pending',
      lookupKey: 'caller-lookup',
      sourceContentHash: falscherHash,
    }
    const gespeichert = await akzeptierteEvidenceSpeichern(
      paket.umschlag,
      paket.uhr,
      paket.extraktion,
      deps,
    )
    assert.equal(gespeichert.ok, true)
    if (!gespeichert.ok || gespeichert.operation !== 'accepted_evidence') return
    const evidence = aufrufe[0]?.evidence as Record<string, unknown>
    assert.notEqual(evidence.version_id, falscheVersion)
    assert.equal(evidence.lifecycle, 'accepted')
    assert.equal(evidence.validation_state, 'valid')
    assert.notEqual(evidence.lookup_key, 'caller-lookup')
    assert.notEqual(evidence.source_content_hash, falscherHash)
    assert.equal(evidence.extraction_note, 'Fenster aus der Extraktion')
    assert.equal(evidence.valid_from, '2026-10-01')
    assert.equal(gespeichert.versionId, evidence.version_id)
    assert.equal(JSON.stringify(aufrufe[0]).includes(falscherHash), false)
    assert.equal(JSON.stringify(aufrufe[0]).includes('caller-lookup'), false)
  })

  test('falsche Domains, Anbieter und Katalogfehler rufen den Speicher nicht', async () => {
    const basis = registry()
    const paket = abruf(basis, 'example-border-authority', 'gov.example', 'domain alpha')
    const material = paket.umschlag.material as Record<string, unknown>
    const falsch = transportAufzeichnen()
    const fake = await akzeptierteEvidenceSpeichern(
      { ...paket.umschlag, material: { ...material, canonicalUrl: 'https://www.not-a-government.example/rules' } },
      paket.uhr,
      null,
      evidenceDeps(falsch.transport),
    )
    assert.deepEqual(fake, { ok: false, reason: 'unregistered_domain' })
    assert.equal(falsch.aufrufe.length, 0)
    assert.equal(JSON.stringify(fake).includes('not-a-government.example'), false)

    const anbieterRoh = transportAufzeichnen()
    const lizenziert = await evidenceAusAbrufSpeichern(
      basis,
      'example-licensed-provider',
      'provider.example',
      'licensed alpha',
      atom({ sourceId: 'example-licensed-provider' }),
      evidenceDeps(anbieterRoh.transport),
    )
    assert.deepEqual(lizenziert, { ok: false, reason: 'source_not_official_authority' })
    assert.equal(anbieterRoh.aufrufe.length, 0)

    const umetikettiert = transportAufzeichnen()
    const quelle = basis.sources.find((eintrag) => eintrag.sourceId === 'example-licensed-provider')
    assert.ok(quelle)
    const relabel = await akzeptierteEvidenceSpeichern(
      {
        ...abruf(basis, 'example-licensed-provider', 'provider.example', 'licensed beta', atom({
          sourceId: 'example-licensed-provider',
        })).umschlag,
        descriptors: [{
          source: { ...quelle, sourceClass: 'official_authority', authorityName: 'Fake Authority' },
          coverage: abdeckungFuer(atom({ sourceId: 'example-licensed-provider' })),
        }],
      },
      paket.uhr,
      null,
      evidenceDeps(umetikettiert.transport),
    )
    assert.deepEqual(relabel, { ok: false, reason: 'invalid_source_plan' })
    assert.equal(umetikettiert.aufrufe.length, 0)

    const katalogLeer = transportAufzeichnen()
    const ohneKatalog = await akzeptierteEvidenceSpeichern(paket.umschlag, paket.uhr, null, {
      transport: katalogLeer.transport,
      env: { NEXT_PUBLIC_SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '' },
    })
    assert.deepEqual(ohneKatalog, { ok: false, reason: 'catalog_not_configured' })
    assert.equal(katalogLeer.aufrufe.length, 0)

    const geworfen = transportAufzeichnen()
    const katalogWurf = await akzeptierteEvidenceSpeichern(paket.umschlag, paket.uhr, null, {
      transport: geworfen.transport,
      katalog: {
        transport: {
          async aufrufen() {
            throw new Error('catalog-sentinel')
          },
        },
      },
    })
    assert.deepEqual(katalogWurf, { ok: false, reason: 'catalog_failed' })
    assert.equal(geworfen.aufrufe.length, 0)
    assert.equal(JSON.stringify(katalogWurf).includes('catalog-sentinel'), false)

    const abrufRoh = transportAufzeichnen()
    const zukunft = await akzeptierteEvidenceSpeichern(
      {
        ...paket.umschlag,
        material: { ...material, retrievedAt: '2026-10-02T00:00:00.000Z' },
      },
      paket.uhr,
      null,
      evidenceDeps(abrufRoh.transport),
    )
    assert.deepEqual(zukunft, { ok: false, reason: 'retrieved_at_in_future' })
    assert.equal(abrufRoh.aufrufe.length, 0)

    const speicherAus = transportAufzeichnen()
    speicherAus.transport.aufrufen = async () => ({ ok: false })
    const transportFehler = await akzeptierteEvidenceSpeichern(
      paket.umschlag,
      paket.uhr,
      null,
      evidenceDeps(speicherAus.transport),
    )
    assert.deepEqual(transportFehler, { ok: false, reason: 'store_failed' })
  })

  test('eingefügte und idempotente Antworten bleiben an die bewiesene Version gebunden', async () => {
    const basis = registry()
    const paket = abruf(basis, 'example-border-authority', 'gov.example', 'idempotent alpha')
    const aufrufe: Aufruf[] = []
    let runde = 0
    const transport: OfficialTruthStoreTransport = {
      async aufrufen(payload) {
        aufrufe.push(payload)
        runde += 1
        const evidence = payload.evidence as { version_id?: string }
        return {
          ok: true,
          antwort: {
            ok: true,
            operation: 'accepted_evidence',
            outcome: runde === 1 ? 'inserted' : 'idempotent',
            version_id: evidence.version_id,
          },
        }
      },
    }
    const erste = await akzeptierteEvidenceSpeichern(paket.umschlag, paket.uhr, null, evidenceDeps(transport))
    const zweite = await akzeptierteEvidenceSpeichern(paket.umschlag, paket.uhr, null, evidenceDeps(transport))
    assert.equal(erste.ok, true)
    assert.equal(zweite.ok, true)
    if (!erste.ok || !zweite.ok || erste.operation !== 'accepted_evidence' || zweite.operation !== 'accepted_evidence') return
    assert.equal(erste.outcome, 'inserted')
    assert.equal(zweite.outcome, 'idempotent')
    assert.equal(erste.versionId, zweite.versionId)
    assert.equal(erste.ruleScopeKey, zweite.ruleScopeKey)

    const falsch = transportAufzeichnen()
    falsch.transport.aufrufen = async (payload) => {
      const evidence = payload.evidence as { version_id?: string }
      return {
        ok: true,
        antwort: {
          ok: true,
          operation: 'accepted_evidence',
          outcome: 'inserted',
          version_id: evidence.version_id === undefined ? 'ev1_missing' : `ev1_${'cd'.repeat(16)}`,
        },
      }
    }
    const abweichend = await akzeptierteEvidenceSpeichern(
      paket.umschlag,
      paket.uhr,
      null,
      evidenceDeps(falsch.transport),
    )
    assert.deepEqual(abweichend, { ok: false, reason: 'store_failed' })
  })

  test('zwei Credential-Optionen bleiben zwei Zellen', async () => {
    const basis = registry()
    const serbisch = atom({
      credentialOption: {
        mode: 'option',
        documentType: 'passport',
        issuingCountryCode: 'RS',
        relatedCitizenshipCountryCode: 'RS',
      },
    })
    const schweizerRoh = transportAufzeichnen()
    const serbischRoh = transportAufzeichnen()
    const gemeinsameSeite = 'gemeinsame amtsseite'
    const schweizer = await evidenceAusAbrufSpeichern(
      basis,
      'example-border-authority',
      'gov.example',
      gemeinsameSeite,
      atom(),
      evidenceDeps(schweizerRoh.transport),
    )
    const serbischeZelle = await evidenceAusAbrufSpeichern(
      basis,
      'example-border-authority',
      'gov.example',
      gemeinsameSeite,
      serbisch,
      evidenceDeps(serbischRoh.transport),
    )
    assert.equal(schweizer.ok, true)
    assert.equal(serbischeZelle.ok, true)
    if (!schweizer.ok || !serbischeZelle.ok) return
    if (schweizer.operation !== 'accepted_evidence' || serbischeZelle.operation !== 'accepted_evidence') return
    assert.notEqual(schweizer.ruleScopeKey, serbischeZelle.ruleScopeKey)
    assert.notEqual(schweizer.versionId, serbischeZelle.versionId)
    const links = schweizerRoh.aufrufe[0]?.evidence as Record<string, unknown>
    const rechts = serbischRoh.aufrufe[0]?.evidence as Record<string, unknown>
    assert.equal(links.issuing_country_code, 'CH')
    assert.equal(links.related_citizenship_country_code, 'CH')
    assert.equal(rechts.issuing_country_code, 'RS')
    assert.equal(rechts.related_citizenship_country_code, 'RS')
    assert.notEqual(links.rule_scope_key, rechts.rule_scope_key)
    assert.notEqual(links.lookup_key, rechts.lookup_key)
    assert.equal(links.source_content_hash, rechts.source_content_hash)
    assert.equal(links.canonical_url, rechts.canonical_url)
    assert.equal(links.retrieved_at, rechts.retrieved_at)
    assert.notEqual(links.version_id, rechts.version_id)
    assert.match(String(links.version_id), /^ev1_[a-f0-9]{32}$/)
    assert.match(String(rechts.version_id), /^ev1_[a-f0-9]{32}$/)

    const passRoh = transportAufzeichnen()
    const passZelle = await evidenceAusAbrufSpeichern(
      basis,
      'example-border-authority',
      'gov.example',
      gemeinsameSeite,
      atom({ requirementType: 'passport_validity' }),
      evidenceDeps(passRoh.transport),
    )
    assert.equal(passZelle.ok, true)
    if (!passZelle.ok || passZelle.operation !== 'accepted_evidence') return
    assert.notEqual(passZelle.versionId, schweizer.versionId)
    assert.match(passZelle.versionId, /^ev1_[a-f0-9]{32}$/)
    const passPayload = passRoh.aufrufe[0]?.evidence as Record<string, unknown>
    assert.equal(passPayload.source_content_hash, links.source_content_hash)
    assert.notEqual(passPayload.version_id, links.version_id)
  })

  test('keine Route und kein neuer Regel-Annahmeweg ruft den Evidence-Schreiber', () => {
    const text = quelle('lib/readiness/official-truth-store-server.ts')
    const evidenceStart = text.indexOf('export async function akzeptierteEvidenceSpeichern')
    const claimStart = text.indexOf('export async function akzeptierteRegelClaimSpeichern')
    assert.ok(evidenceStart > 0)
    assert.ok(claimStart > evidenceStart)
    const evidenceBody = text.slice(evidenceStart, claimStart)
    assert.equal(evidenceBody.includes('regelKandidatAkzeptieren('), false)
    assert.equal(evidenceBody.includes('evidenceKandidatAkzeptieren'), false)
    assert.equal(evidenceBody.includes('officialTruthServerHeldEvidenceAnnehmen('), true)
    const oberflaeche = appTexte()
    assert.equal(oberflaeche.includes('akzeptierteEvidenceSpeichern'), false)
    assert.equal(oberflaeche.includes('official-truth-store-server'), false)
    assert.equal(oberflaeche.includes('officialTruthServerHeldEvidenceAnnehmen'), false)
    assert.equal(requirementsProviderAus(), null)
  })
})

describe('throwaway PostgreSQL proof for the trusted store gateway', () => {
  test('Rollen, Rollback und genaue Duplikate', { timeout: 120_000 }, async () => {
    const cluster = clusterStarten()
    try {
      const summe = OFFICIAL_TABLES.map((name) => `(select count(*) from private.${name})`).join(' + ')
      assert.equal(cluster.aufruf(`select ${summe}`), '0')
      assert.equal(
        cluster.aufruf(`
          select string_agg(n.nspname || '.' || p.proname, ',' order by n.nspname, p.proname)
          from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          where p.prosecdef
        `),
        'public.official_truth_store_accepted_v1',
      )
      assert.equal(cluster.aufruf(`select count(*) from pg_proc where proname = 'official_truth_store_accepted_v1'`), '1')
      const proconfig = cluster.aufruf(`select proconfig::text from pg_proc where proname = 'official_truth_store_accepted_v1'`)
      assert.match(proconfig, /search_path=/)
      assert.equal(proconfig.includes('public'), false)
      const grants = cluster.aufruf(`
        select count(*) from information_schema.role_table_grants
        where table_schema = 'private'
          and table_name like 'official_%'
          and grantee in ('anon', 'authenticated', 'service_role', 'public')
      `)
      assert.equal(grants, '0')
      const funktionRechte = cluster.aufruf(`
        select string_agg(grantee || ':' || privilege_type, ',' order by grantee, privilege_type)
        from information_schema.routine_privileges
        where routine_schema = 'public' and routine_name = 'official_truth_store_accepted_v1'
      `)
      const rechte = funktionRechte.split(',').filter((eintrag) => eintrag.length > 0)
      assert.equal(rechte.includes('service_role:EXECUTE'), true)
      assert.equal(rechte.some((eintrag) => /^(anon|authenticated|public|PUBLIC):/.test(eintrag)), false)
      const owner = cluster.aufruf('select current_user')
      assert.deepEqual(
        rechte.filter((eintrag) => eintrag !== 'service_role:EXECUTE'),
        [`${owner}:EXECUTE`],
      )
      const rls = cluster.aufruf(`
        select string_agg(
          c.relname || ':' || c.relrowsecurity || ':' || c.relforcerowsecurity || ':' ||
          (select count(*) from pg_policy pol where pol.polrelid = c.oid),
          ',' order by c.relname
        )
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'private' and c.relname like 'official_%'
      `)
      for (const name of OFFICIAL_TABLES) {
        assert.equal(rls.includes(`${name}:true:true:0`), true, name)
      }
      const policies = cluster.aufruf(`select count(*) from pg_policy pol join pg_class c on c.oid = pol.polrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'private'`)
      assert.equal(policies, '0')

      const anon = cluster.scheitert(`select ${payloadTag({ operation: 'accepted_evidence' })}`, 'anon')
      assert.match(anon, /permission denied/i)
      const authenticated = cluster.scheitert(`select ${payloadTag({ operation: 'accepted_rule_claim' })}`, 'authenticated')
      assert.match(authenticated, /permission denied/i)
      const schreiben = cluster.scheitert(
        `insert into private.official_sources (source_id, source_class, publisher_name, authority_name) values ('example-border-authority', 'official_authority', 'Example Border Authority', 'Example Border Authority')`,
        'service_role',
      )
      assert.match(schreiben, /permission denied/i)
      const lesen = cluster.scheitert('select count(*) from private.official_evidence_versions', 'service_role')
      assert.match(lesen, /permission denied/i)
      const fremd = cluster.scheitert(`select ${payloadTag({ operation: 'import' })}`, 'service_role')
      assert.match(fremd, /operation is not supported/i)
      assert.equal(cluster.aufruf(`select ${summe}`), '0')

      cluster.aufruf(`
        insert into private.official_sources (source_id, source_class, publisher_name, authority_name) values
          ('example-border-authority', 'official_authority', 'Example Border Authority', 'Example Border Authority'),
          ('example-interior-authority', 'official_authority', 'Example Interior Authority', 'Example Interior Authority'),
          ('example-visa-portal', 'official_authority', 'Example Visa Portal', 'Example Visa Portal'),
          ('example-licensed-provider', 'licensed_evidence_provider', 'Example Licensed Publisher', null);
        insert into private.official_source_domains (source_id, domain) values
          ('example-border-authority', 'gov.example'),
          ('example-interior-authority', 'interior.example'),
          ('example-visa-portal', 'visa.example'),
          ('example-licensed-provider', 'provider.example');
      `)
      assert.equal(cluster.aufruf('select count(*) from private.official_sources'), '4')

      const basis = registry()
      const evidencePayloads: Aufruf[] = []
      const evidenceTransport: OfficialTruthStoreTransport = {
        async aufrufen(payload) {
          evidencePayloads.push(payload)
          const antwort = JSON.parse(cluster.aufruf(`select ${payloadTag(payload)}`, 'service_role')) as {
            outcome: string
            version_id: string
          }
          return { ok: true, antwort: { ok: true, operation: 'accepted_evidence', outcome: antwort.outcome, version_id: antwort.version_id } }
        },
      }
      const deps = evidenceDeps(evidenceTransport)
      const erste = await evidenceAusAbrufSpeichern(
        basis,
        'example-border-authority',
        'gov.example',
        'store alpha',
        undefined,
        deps,
      )
      assert.equal(erste.ok, true)
      if (!erste.ok || erste.operation !== 'accepted_evidence') return
      assert.equal(cluster.aufruf('select count(*) from private.official_sources'), '4')
      assert.equal(cluster.aufruf('select count(*) from private.official_evidence_versions'), '1')
      const vorKandidat = cluster.aufruf(`select ${summe}`)
      const nichtAkzeptiert = structuredClone(evidencePayloads[0]) as {
        evidence: { lifecycle: string; validation_state: string }
      }
      nichtAkzeptiert.evidence.lifecycle = 'candidate'
      nichtAkzeptiert.evidence.validation_state = 'pending'
      const kandidatFehler = cluster.scheitert(`select ${payloadTag(nichtAkzeptiert)}`, 'service_role')
      assert.match(kandidatFehler, /evidence is not accepted/i)
      assert.equal(cluster.aufruf(`select ${summe}`), vorKandidat)
      assert.equal(cluster.aufruf('select count(*) from private.official_evidence_versions'), '1')
      assert.equal(
        cluster.aufruf(`select rule_scope_key || '|' || lifecycle || '|' || validation_state from private.official_evidence_versions`),
        `${erste.ruleScopeKey}|accepted|valid`,
      )
      const zweite = await evidenceAusAbrufSpeichern(
        basis,
        'example-border-authority',
        'gov.example',
        'store alpha',
        undefined,
        deps,
      )
      assert.equal(zweite.ok, true)
      if (!zweite.ok) return
      assert.equal(zweite.outcome, 'idempotent')
      assert.equal(cluster.aufruf('select count(*) from private.official_evidence_versions'), '1')
      const konflikt = structuredClone(evidencePayloads[0]) as { evidence: { extraction_note: string | null } }
      konflikt.evidence.extraction_note = 'anderer Text'
      const konfliktFehler = cluster.scheitert(`select ${payloadTag(konflikt)}`, 'service_role')
      assert.match(konfliktFehler, /conflicting official evidence version/i)
      assert.equal(cluster.aufruf(`select extraction_note is null from private.official_evidence_versions`), 't')

      const claimTransport = (payloads: Aufruf[]): OfficialTruthStoreTransport => ({
        async aufrufen(payload) {
          payloads.push(payload)
          const antwort = JSON.parse(cluster.aufruf(`select ${payloadTag(payload)}`, 'service_role')) as {
            outcome: string
            claim_id: number
          }
          return { ok: true, antwort: { ok: true, operation: 'accepted_rule_claim', outcome: antwort.outcome, claim_id: antwort.claim_id } }
        },
      })

      const visa = akzeptiert(basis, 'example-border-authority', 'gov.example', 'store alpha')
      assert.equal(visa.versionId, erste.versionId)
      const payloads: Aufruf[] = []
      const wirkung = await akzeptierteRegelClaimSpeichern(
        claimEingabe(basis, visa.scope, 'requirement_effect', 'explicit_primary_statement', [visa], {
          kind: 'requirement_effect',
          effect: 'not_required',
          visaMode: 'visa_exempt',
        }),
        { transport: claimTransport(payloads), jetzt: () => AUDIT },
      )
      assert.equal(wirkung.ok, true)
      if (!wirkung.ok || wirkung.operation !== 'accepted_rule_claim') return
      assert.equal(wirkung.outcome, 'inserted')
      const nochmal = await akzeptierteRegelClaimSpeichern(
        claimEingabe(basis, visa.scope, 'requirement_effect', 'explicit_primary_statement', [visa], {
          kind: 'requirement_effect',
          effect: 'not_required',
          visaMode: 'visa_exempt',
        }),
        { transport: claimTransport(payloads), jetzt: () => '2026-10-01T13:00:00.000Z' },
      )
      assert.equal(nochmal.ok, true)
      if (!nochmal.ok || nochmal.operation !== 'accepted_rule_claim') return
      assert.equal(nochmal.outcome, 'idempotent')
      assert.equal(nochmal.claimId, wirkung.claimId)
      assert.equal(cluster.aufruf(`select count(*) from private.official_rule_claims`), '1')
      assert.equal(
        cluster.aufruf(`select to_char(accepted_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') from private.official_rule_claims`),
        '2026-10-01T12:05:00Z',
      )
      const andererFakt = structuredClone(payloads[0]) as { claim: { fact: { effect: string } } }
      andererFakt.claim.fact.effect = 'required'
      const faktKonflikt = cluster.scheitert(`select ${payloadTag(andererFakt)}`, 'service_role')
      assert.match(faktKonflikt, /conflicting official rule claim/i)
      assert.equal(cluster.aufruf(`select effect from private.official_rule_claim_requirement_effect`), 'not_required')

      const optionenPayloads: Aufruf[] = []
      const optionen = await akzeptierteRegelClaimSpeichern(
        claimEingabe(basis, visa.scope, 'visa_options', 'explicit_primary_statement', [visa], {
          kind: 'visa_options',
          options: [
            { visaMode: 'electronic_visa', eligibility: 'allowed', mandate: 'not_mandatory' },
            { visaMode: 'visa_exempt', eligibility: 'allowed', mandate: 'not_mandatory' },
          ],
        }),
        { transport: claimTransport(optionenPayloads), jetzt: () => AUDIT },
      )
      assert.equal(optionen.ok, true)
      assert.equal(
        cluster.aufruf(`select string_agg(visa_mode, ',' order by ordinal) from private.official_rule_claim_visa_options`),
        'visa_exempt,electronic_visa',
      )
      const optionenNochmal = await akzeptierteRegelClaimSpeichern(
        claimEingabe(basis, visa.scope, 'visa_options', 'explicit_primary_statement', [visa], {
          kind: 'visa_options',
          options: [
            { visaMode: 'electronic_visa', eligibility: 'allowed', mandate: 'not_mandatory' },
            { visaMode: 'visa_exempt', eligibility: 'allowed', mandate: 'not_mandatory' },
          ],
        }),
        { transport: claimTransport(optionenPayloads), jetzt: () => '2026-10-01T13:00:00.000Z' },
      )
      assert.equal(optionenNochmal.ok, true)
      if (!optionenNochmal.ok || optionenNochmal.operation !== 'accepted_rule_claim') return
      assert.equal(optionenNochmal.outcome, 'idempotent')
      assert.equal(cluster.aufruf(`select count(*) from private.official_rule_claim_visa_options`), '2')

      const aufenthalt = await akzeptierteRegelClaimSpeichern(
        claimEingabe(basis, visa.scope, 'stay_limit', 'explicit_primary_statement', [visa], {
          kind: 'stay_limit',
          perVisit: { value: 90, unit: 'days' },
          rollingWindow: null,
          initialGrant: null,
          extension: null,
          borderDiscretion: 'fixed',
        }),
        { transport: claimTransport([]), jetzt: () => AUDIT },
      )
      assert.equal(aufenthalt.ok, true)
      assert.equal(cluster.aufruf(`select per_visit_value || per_visit_unit from private.official_rule_claim_stay_limit`), '90days')

      const passScope = atom({ requirementType: 'passport_validity' })
      const passGespeichert = await evidenceAusAbrufSpeichern(
        basis,
        'example-border-authority',
        'gov.example',
        'pass store',
        passScope,
        deps,
      )
      assert.equal(passGespeichert.ok, true)
      const pass = akzeptiert(basis, 'example-border-authority', 'gov.example', 'pass store', atom({ requirementType: 'passport_validity' }))
      const passClaim = await akzeptierteRegelClaimSpeichern(
        claimEingabe(basis, pass.scope, 'passport_validity', 'explicit_primary_statement', [pass], {
          kind: 'passport_validity',
          semantics: 'valid_on_entry',
        }),
        { transport: claimTransport([]), jetzt: () => AUDIT },
      )
      assert.equal(passClaim.ok, true)
      assert.equal(
        cluster.aufruf(`select semantics || ':' || (duration_value is null)::text from private.official_rule_claim_passport_validity`),
        'valid_on_entry:true',
      )

      const seitenScope = atom({ requirementType: 'blank_passport_pages' })
      assert.equal((await evidenceAusAbrufSpeichern(
        basis,
        'example-border-authority',
        'gov.example',
        'seiten store',
        seitenScope,
        deps,
      )).ok, true)
      const seiten = akzeptiert(basis, 'example-border-authority', 'gov.example', 'seiten store', atom({ requirementType: 'blank_passport_pages' }))
      assert.equal((await akzeptierteRegelClaimSpeichern(
        claimEingabe(basis, seiten.scope, 'blank_passport_pages', 'explicit_primary_statement', [seiten], {
          kind: 'blank_passport_pages',
          minimumPages: 2,
        }),
        { transport: claimTransport([]), jetzt: () => AUDIT },
      )).ok, true)
      assert.equal(cluster.aufruf(`select minimum_pages from private.official_rule_claim_blank_pages`), '2')

      const transitScope = atom({ requirementType: 'transit' })
      assert.equal((await evidenceAusAbrufSpeichern(
        basis,
        'example-border-authority',
        'gov.example',
        'transit store',
        transitScope,
        deps,
      )).ok, true)
      const transit = akzeptiert(basis, 'example-border-authority', 'gov.example', 'transit store', atom({ requirementType: 'transit' }))
      const transitClaim = await akzeptierteRegelClaimSpeichern(
        claimEingabe(basis, transit.scope, 'transit_conditions', 'explicit_primary_statement', [transit], {
          kind: 'transit_conditions',
          paths: [leerPfad({ transitAirportCodes: [...SIEBZEHN_FLUGHAFEN] })],
        }),
        { transport: claimTransport([]), jetzt: () => AUDIT },
      )
      assert.equal(transitClaim.ok, true)
      assert.equal(cluster.aufruf(`select cardinality(transit_airport_codes) from private.official_rule_claim_transit_paths`), '17')
      const transitNochmal = await akzeptierteRegelClaimSpeichern(
        claimEingabe(basis, transit.scope, 'transit_conditions', 'explicit_primary_statement', [transit], {
          kind: 'transit_conditions',
          paths: [leerPfad({ transitAirportCodes: [...SIEBZEHN_FLUGHAFEN] })],
        }),
        { transport: claimTransport([]), jetzt: () => '2026-10-01T13:00:00.000Z' },
      )
      assert.equal(transitNochmal.ok, true)
      if (!transitNochmal.ok || transitNochmal.operation !== 'accepted_rule_claim') return
      assert.equal(transitNochmal.outcome, 'idempotent')
      assert.equal(cluster.aufruf(`select count(*) from private.official_rule_claim_transit_paths`), '1')
      assert.equal(cluster.aufruf(`select cardinality(transit_airport_codes) from private.official_rule_claim_transit_paths`), '17')

      const aktion = await akzeptierteRegelClaimSpeichern(
        claimEingabe(basis, visa.scope, 'official_actions', 'explicit_primary_statement', [visa], {
          kind: 'official_actions',
          actions: [
            {
              actionSourceId: 'example-visa-portal',
              purpose: 'application',
              href: 'https://www.visa.example/apply',
              visaMode: 'electronic_visa',
            },
          ],
        }),
        { transport: claimTransport([]), jetzt: () => AUDIT },
      )
      assert.equal(aktion.ok, true)
      assert.equal(
        cluster.aufruf(`select source_class || ':' || action_source_id from private.official_rule_claim_actions`),
        'official_authority:example-visa-portal',
      )

      const zeit = await akzeptierteRegelClaimSpeichern(
        claimEingabe(basis, visa.scope, 'temporal_rule', 'explicit_primary_statement', [visa], {
          kind: 'temporal_rule',
          rule: {
            kind: 'relative_duration',
            availableFrom: null,
            dueBy: { anchor: 'trip_departure', relation: 'before', offsetMinutes: 72 * 60, semantics: 'mandatory' },
          },
        }),
        { transport: claimTransport([]), jetzt: () => AUDIT },
      )
      assert.equal(zeit.ok, true)
      assert.equal(cluster.aufruf(`select due_by_offset_minutes from private.official_rule_claim_temporal_rule`), String(72 * 60))

      const evidenceFuer = (versionId: string): Aufruf => {
        const gefunden = evidencePayloads.find((eintrag) => (eintrag.evidence as { version_id?: string }).version_id === versionId)
        assert.ok(gefunden)
        return gefunden as Aufruf
      }
      const zaehlstand = () => ({
        claims: cluster.aufruf('select count(*) from private.official_rule_claims'),
        visa: cluster.aufruf('select count(*) from private.official_rule_claim_visa_options'),
        support: cluster.aufruf('select count(*) from private.official_rule_claim_support'),
      })

      const nz = atom({ destinationCountryCode: 'NZ' })
      const nzInnenAtom = atom({ destinationCountryCode: 'NZ', sourceId: 'example-interior-authority' })
      assert.equal((await evidenceAusAbrufSpeichern(
        basis,
        'example-border-authority',
        'gov.example',
        'nz border',
        nz,
        deps,
      )).ok, true)
      assert.equal((await evidenceAusAbrufSpeichern(
        basis,
        'example-interior-authority',
        'interior.example',
        'nz interior',
        nzInnenAtom,
        deps,
      )).ok, true)
      const nzVisa = akzeptiert(basis, 'example-border-authority', 'gov.example', 'nz border', nz)
      const nzInnen = akzeptiert(basis, 'example-interior-authority', 'interior.example', 'nz interior', nzInnenAtom)
      const zusammengesetzt = await akzeptierteRegelClaimSpeichern(
        claimEingabe(basis, nzVisa.scope, 'requirement_effect', 'composed_from_multiple_primary_sources', [nzVisa, nzInnen], {
          kind: 'requirement_effect',
          effect: 'conditional',
          visaMode: null,
        }),
        { transport: claimTransport([]), jetzt: () => AUDIT },
      )
      assert.equal(zusammengesetzt.ok, true)
      if (!zusammengesetzt.ok || zusammengesetzt.operation !== 'accepted_rule_claim') return
      assert.match(zusammengesetzt.claimId, /^\d+$/)
      assert.equal(cluster.aufruf(`
        select count(distinct source_id) || ':' || string_agg(distinct source_class, ',')
        from private.official_rule_claim_support
        where claim_id = ${zusammengesetzt.claimId}
      `), '2:official_authority')

      const th = atom({ destinationCountryCode: 'TH' })
      const thGespeichert = await evidenceAusAbrufSpeichern(
        basis,
        'example-border-authority',
        'gov.example',
        'th store',
        th,
        deps,
      )
      assert.equal(thGespeichert.ok, true)
      if (!thGespeichert.ok || thGespeichert.operation !== 'accepted_evidence') return
      const vorLeer = zaehlstand()
      const leer = claimAusEvidencePayload(
        evidenceFuer(thGespeichert.versionId),
        'visa_options',
        'explicit_primary_statement',
        [thGespeichert.versionId],
        { options: [] },
      )
      const trigger = cluster.scheitert(`select ${payloadTag(leer)}`, 'service_role')
      assert.match(trigger, /fact payload/i)
      assert.deepEqual(zaehlstand(), vorLeer)
      assert.equal(cluster.aufruf(`select count(*) from private.official_rule_claim_visa_options`), '2')

      const sg = atom({ destinationCountryCode: 'SG' })
      const sgGespeichert = await evidenceAusAbrufSpeichern(
        basis,
        'example-border-authority',
        'gov.example',
        'sg store',
        sg,
        deps,
      )
      assert.equal(sgGespeichert.ok, true)
      if (!sgGespeichert.ok || sgGespeichert.operation !== 'accepted_evidence') return
      const fehlendeStuetze = `ev1_${'ab'.repeat(16)}`
      const vorStuetze = zaehlstand()
      const ohneStuetze = claimAusEvidencePayload(
        evidenceFuer(sgGespeichert.versionId),
        'requirement_effect',
        'explicit_primary_statement',
        [fehlendeStuetze],
        { effect: 'not_required', visa_mode: 'visa_exempt' },
      )
      const stuetze = cluster.scheitert(`select ${payloadTag(ohneStuetze)}`, 'service_role')
      assert.match(stuetze, /support evidence version is not stored/i)
      assert.deepEqual(zaehlstand(), vorStuetze)
      assert.equal(
        cluster.aufruf(`select count(*) from private.official_rule_claim_support where version_id = '${fehlendeStuetze}'`),
        '0',
      )

      const gemeinsameSeite = 'same official page snapshot'
      const vorZellen = Number(cluster.aufruf('select count(*) from private.official_evidence_versions'))
      const chZelle = await evidenceAusAbrufSpeichern(
        basis,
        'example-border-authority',
        'gov.example',
        gemeinsameSeite,
        atom(),
        deps,
      )
      const rsZelle = await evidenceAusAbrufSpeichern(
        basis,
        'example-border-authority',
        'gov.example',
        gemeinsameSeite,
        atom({
          credentialOption: {
            mode: 'option',
            documentType: 'passport',
            issuingCountryCode: 'RS',
            relatedCitizenshipCountryCode: 'RS',
          },
        }),
        deps,
      )
      assert.equal(chZelle.ok, true)
      assert.equal(rsZelle.ok, true)
      if (!chZelle.ok || !rsZelle.ok || chZelle.operation !== 'accepted_evidence' || rsZelle.operation !== 'accepted_evidence') return
      assert.equal(chZelle.outcome, 'inserted')
      assert.equal(rsZelle.outcome, 'inserted')
      assert.match(chZelle.versionId, /^ev1_[a-f0-9]{32}$/)
      assert.match(rsZelle.versionId, /^ev1_[a-f0-9]{32}$/)
      assert.notEqual(chZelle.versionId, rsZelle.versionId)
      assert.notEqual(chZelle.ruleScopeKey, rsZelle.ruleScopeKey)
      assert.equal(cluster.aufruf('select count(*) from private.official_evidence_versions'), String(vorZellen + 2))
      const chNochmal = await evidenceAusAbrufSpeichern(
        basis,
        'example-border-authority',
        'gov.example',
        gemeinsameSeite,
        atom(),
        deps,
      )
      assert.equal(chNochmal.ok, true)
      if (!chNochmal.ok || chNochmal.operation !== 'accepted_evidence') return
      assert.equal(chNochmal.outcome, 'idempotent')
      assert.equal(chNochmal.versionId, chZelle.versionId)
      assert.equal(cluster.aufruf('select count(*) from private.official_evidence_versions'), String(vorZellen + 2))

      const kr = atom({ destinationCountryCode: 'KR', sourceId: 'example-licensed-provider' })
      const vorLizenz = evidencePayloads.length
      const lizenziert = await evidenceAusAbrufSpeichern(
        basis,
        'example-licensed-provider',
        'provider.example',
        'licensed store',
        kr,
        deps,
      )
      assert.deepEqual(lizenziert, { ok: false, reason: 'source_not_official_authority' })
      assert.equal(evidencePayloads.length, vorLizenz)
      const lokaleLizenz = akzeptiert(
        basis,
        'example-licensed-provider',
        'provider.example',
        'licensed store',
        kr,
      )
      const lizenzPayload = beweisPayload(lokaleLizenz)
      const lizenzAntwort = JSON.parse(cluster.aufruf(`select ${payloadTag(lizenzPayload)}`, 'service_role')) as {
        outcome: string
        version_id: string
      }
      assert.equal(lizenzAntwort.outcome, 'inserted')
      assert.equal(lizenzAntwort.version_id, lokaleLizenz.versionId)
      const vorAnbieter = zaehlstand()
      const lizenziertClaim = claimAusEvidencePayload(
        lizenzPayload,
        'requirement_effect',
        'explicit_primary_statement',
        [lokaleLizenz.versionId],
        { effect: 'not_required', visa_mode: 'visa_exempt', source_class: 'official_authority' },
      )
      const anbieter = cluster.scheitert(`select ${payloadTag(lizenziertClaim)}`, 'service_role')
      assert.match(anbieter, /official_rule_claim_support_source_class/i)
      assert.deepEqual(zaehlstand(), vorAnbieter)
      assert.equal(cluster.aufruf(`select count(*) from private.official_rule_claim_support where source_class = 'licensed_evidence_provider'`), '0')
      assert.equal(cluster.aufruf('select count(*) from private.official_sources'), '4')
      assert.equal(cluster.aufruf('select count(*) from private.official_source_domains'), '4')
    } finally {
      cluster.stop()
    }
  })
})
