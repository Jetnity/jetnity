// lib/readiness/official-truth-refresh-diff.test.ts
//
// Refresh-Vergleich nur über den neu belegten Abruf und die bestehende
// Vergleichsfunktion. Synthetische *.example-Quellen. Keine Regel, kein
// Speicher, kein Netz.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import {
  akzeptierteEvidenceLesen,
  evidenceKandidatAkzeptieren,
  evidenceKandidatAusModell,
  evidenceQuellenFingerprint,
  evidenceVersionenVergleichen,
  type EvidenceVersion,
} from '@/lib/readiness/evidence'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { regelScopeAusEvidenceScope, type RegelFaktArt, type RegelScope } from '@/lib/readiness/rule-claims'
import { officialTruthAkzeptierteEvidenceAusAbruf } from '@/lib/readiness/official-truth-accepted-evidence'
import { officialTruthKandidatEvidenceAusAbruf } from '@/lib/readiness/official-truth-retrieved-candidate-evidence'
import { officialTruthAbgerufenMaterialPruefen } from '@/lib/readiness/official-truth-retrieved-material'
import {
  officialTruthAkzeptierteEvidenceAktualisierungVergleichen,
  type OfficialTruthAktualisierungVergleichErgebnis,
} from '@/lib/readiness/official-truth-refresh-diff'
import {
  officialTruthRechercheEntscheiden,
  type OfficialTruthRechercheAnfrage,
  type OfficialTruthRechercheGrund,
} from '@/lib/readiness/official-truth-research-request'
import { quellenRegistryErstellen, type QuellenEingabe, type QuellenRegistry, type RegistrierteQuelle } from '@/lib/readiness/source-registry'
import { type QuellenAbdeckung, type QuellenDeskriptor } from '@/lib/readiness/source-router'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

const UHR = '2026-10-01T12:00:00.000Z'
const ABGERUFEN = '2026-10-01T11:00:00.000Z'
const SNAPSHOT = 'official page line\nunchanged'
const ANDERS = 'official page line\nchanged'
const QUELLE = 'example-border-authority'
const ANDERE = 'example-interior-authority'
const ANBIETER = 'example-licensed-provider'
const URL = 'https://www.gov.example/rules'
const GEHEIM = 'personal-secret-91f3'

const PERSONEN = [
  'passportNumber',
  'documentNumber',
  'mrz',
  'userId',
  'accountId',
  'tripId',
  'email',
  'fullName',
  'dateOfBirth',
  'healthRecord',
  'scan',
  'travellerNote',
  'note',
] as const

const WIRKUNG_SCHLUESSEL = new Set([
  'result',
  'required',
  'not_required',
  'conditional',
  'optionEligibility',
  'optionMandate',
  'visaMode',
  'trustedRuleFact',
])

type Status = OfficialTruthAktualisierungVergleichErgebnis['status']
type KeineWirkung = Extract<Status, 'required' | 'not_required' | 'conditional' | 'accepted' | 'candidate_evidence' | 'retrieved_material' | 'accepted_evidence'> extends never
  ? true
  : never

const keineWirkung: KeineWirkung = true

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
  factKind: RegelFaktArt = 'stay_limit',
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

function registry(eingaben: readonly QuellenEingabe[], blockedDomains?: readonly string[]): QuellenRegistry {
  const ergebnis = quellenRegistryErstellen(eingaben, blockedDomains ? { blockedDomains } : undefined)
  if (!ergebnis.ok) throw new Error(ergebnis.reason)
  return ergebnis.registry
}

function amt(sourceId: string, domain: string): QuellenEingabe {
  return {
    sourceId,
    sourceClass: 'official_authority',
    publisherName: 'Example Border Authority',
    authorityName: 'Example Border Authority',
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

function deskriptor(basis: QuellenRegistry, sourceId: string, coverage: QuellenAbdeckung = abdeckung()): QuellenDeskriptor {
  return { source: quelle(basis, sourceId), coverage }
}

function basisRegistry(): QuellenRegistry {
  return registry([amt(QUELLE, 'gov.example'), amt(ANDERE, 'interior.example'), anbieter(ANBIETER, 'provider.example')])
}

function huelle(teil?: {
  request?: unknown
  registry?: unknown
  descriptors?: unknown
  sourceId?: unknown
  material?: Record<string, unknown> | null
  extra?: Record<string, unknown>
}): Record<string, unknown> {
  const basis = (teil?.registry as QuellenRegistry | undefined) ?? basisRegistry()
  const material =
    teil?.material === null
      ? null
      : {
          canonicalUrl: URL,
          retrievedAt: ABGERUFEN,
          sourceSnapshot: SNAPSHOT,
          ...teil?.material,
        }
  return {
    request: teil?.request ?? anfrage(),
    registry: basis,
    descriptors:
      teil?.descriptors ??
      [
        deskriptor(basis, QUELLE),
        deskriptor(basis, ANDERE, abdeckung({ destinationCountryCodes: ['TH'] })),
        deskriptor(basis, ANBIETER),
      ],
    sourceId: teil && 'sourceId' in teil ? teil.sourceId : QUELLE,
    material,
    ...teil?.extra,
  }
}

function bestehendAus(eingabe: unknown = huelle(), extraktion: unknown = null): EvidenceVersion {
  const ergebnis = officialTruthAkzeptierteEvidenceAusAbruf(eingabe, uhr(), extraktion)
  assert.equal(ergebnis.status, 'accepted_evidence')
  if (ergebnis.status !== 'accepted_evidence') throw new Error('annahme')
  return ergebnis.evidence
}

function vergleichen(bestehend: unknown, eingabe: unknown = huelle(), instant = UHR) {
  return officialTruthAkzeptierteEvidenceAktualisierungVergleichen(bestehend, eingabe, uhr(instant))
}

function erfolg(ergebnis: OfficialTruthAktualisierungVergleichErgebnis) {
  assert.notEqual(ergebnis.status, 'blocked')
  if (ergebnis.status === 'blocked') throw new Error('blockiert')
  return ergebnis
}

function ohneWirkung(wert: unknown): void {
  const text = JSON.stringify(wert)
  for (const wort of ['not_required', 'optionEligibility', 'optionMandate', 'visaMode', 'trustedRuleFact', 'conditional', 'candidate_evidence', 'accepted_evidence']) {
    assert.equal(text.includes(wort), false, wort)
  }
  const stapel = [wert]
  while (stapel.length > 0) {
    const aktuell = stapel.pop()
    if (!aktuell || typeof aktuell !== 'object') continue
    if (Array.isArray(aktuell)) {
      stapel.push(...aktuell)
      continue
    }
    for (const [name, kind] of Object.entries(aktuell)) {
      assert.equal(WIRKUNG_SCHLUESSEL.has(name), false, name)
      stapel.push(kind)
    }
  }
}

function ohneQuelle(wert: unknown, geheim = GEHEIM): void {
  const text = JSON.stringify(wert)
  assert.equal(text.includes(SNAPSHOT), false)
  assert.equal(text.includes(ANDERS), false)
  assert.equal(text.includes(URL), false)
  assert.equal(text.includes('https://'), false)
  assert.equal(text.includes('gov.example'), false)
  assert.equal(text.includes(geheim), false)
  const hash = evidenceQuellenFingerprint(SNAPSHOT)
  const anderer = evidenceQuellenFingerprint(ANDERS)
  assert.ok(hash)
  assert.ok(anderer)
  assert.equal(text.includes(String(hash)), false)
  assert.equal(text.includes(String(anderer)), false)
}

describe('Official Truth accepted Evidence refresh diff', () => {
  test('der Vergleich läuft nur über den neu belegten Abruf und die bestehende Vergleichsfunktion', () => {
    assert.equal(keineWirkung, true)
    const text = datei('lib/readiness/official-truth-refresh-diff.ts')
    const evidence = datei('lib/readiness/evidence.ts')
    const body = text.slice(text.indexOf('export function officialTruthAkzeptierteEvidenceAktualisierungVergleichen'))
    const abruf = body.indexOf('officialTruthAbgerufenMaterialPruefen(')
    const registryLesen = body.indexOf('registryAusUmschlag(')
    const lesen = body.indexOf('akzeptierteEvidenceLesen(')
    const klasse = body.indexOf("sourceClass !== 'official_authority'")
    const quelleGleich = body.indexOf('gelesen.sourceId !== beleg.sourceId')
    const scope = body.indexOf('regelScopeAusEvidenceScope(')
    const vergleich = body.indexOf('evidenceVersionenVergleichen(gelesen, { sourceContentHash: beleg.sourceContentHash })')
    assert.ok(abruf >= 0 && registryLesen > abruf && lesen > registryLesen)
    assert.ok(klasse > lesen && quelleGleich > klasse && scope > quelleGleich && vergleich > scope)
    assert.match(evidence, /export function akzeptierteEvidenceLesen/)
    assert.match(evidence, /export function evidenceVersionenVergleichen/)
    assert.doesNotMatch(text, /regelKandidatAkzeptieren|regelKandidatErstellen|trustedRuleFact/)
    assert.doesNotMatch(text, /evidenceKandidatAkzeptieren|evidenceKandidatAusModell/)
    assert.doesNotMatch(text, /officialTruthKandidatEvidenceAusAbruf|officialTruthAkzeptierteEvidenceAusAbruf/)
    assert.doesNotMatch(text, /lifecycle\s*:\s*'accepted'|validationState\s*:\s*'valid'/)
    assert.doesNotMatch(text, /(?<![A-Za-z])versionId\s*:|(?<![A-Za-z])lookupKey\s*:/)
    assert.doesNotMatch(text, /sourceContentHash\s*!==|sourceContentHash\s*===/)
    assert.doesNotMatch(text, /official_truth_store_accepted_v1|official_truth_source_catalog_v1/)
    assert.doesNotMatch(text, /requirementsProviderAus/)
    assert.doesNotMatch(text, /from '@\/lib\/readiness\/(engine|provider|official-truth-store-server|official-truth-source-catalog-server|official-truth-candidate-batch|official-truth-accepted-evidence|official-truth-retrieved-candidate-evidence|official-truth-research-request|official-truth-research-source-routing|source-router)'/)
    assert.doesNotMatch(text, /supabase|openai|Date\.now|new Date\(|fetch\(|node:fs|node:http|node:net/)
    assert.doesNotMatch(text, /not_required/)
    assert.doesNotMatch(text, /sherpa|timatic|kayak/i)
    assert.doesNotMatch(evidence, /official-truth-refresh-diff/)
    for (const relativ of [
      'lib/readiness/official-truth-retrieved-material.ts',
      'lib/readiness/official-truth-retrieved-candidate-evidence.ts',
      'lib/readiness/official-truth-accepted-evidence.ts',
      'lib/readiness/rule-claims.ts',
      'lib/readiness/source-registry.ts',
      'lib/readiness/source-router.ts',
    ]) {
      assert.doesNotMatch(datei(relativ), /official-truth-refresh-diff/, relativ)
    }
    assert.equal(requirementsProviderAus(), null)
  })

  test('derselbe Quellentext bleibt unverändert und schaltet nur die spätere Analyse kurz', () => {
    const request = anfrage()
    const eingabe = huelle({ request })
    const bestehend = bestehendAus(eingabe, {
      validFrom: '2026-01-01',
      validUntil: '2026-12-31T00:00:00.000Z',
      extractionNote: '  Bounded synthetic extraction note.  ',
    })
    const normalisiert = huelle({
      request,
      registry: eingabe.registry,
      descriptors: eingabe.descriptors,
      material: { sourceSnapshot: 'official page line\r\nunchanged' },
    })
    const vorherBestehend = JSON.stringify(bestehend)
    const vorherEingabe = JSON.stringify(normalisiert)
    const ergebnis = erfolg(vergleichen(bestehend, normalisiert))
    const beleg = officialTruthAbgerufenMaterialPruefen(normalisiert, uhr())
    assert.equal(beleg.status, 'retrieved_material')
    if (beleg.status !== 'retrieved_material') throw new Error('beleg')
    const hashes = evidenceVersionenVergleichen(bestehend, { sourceContentHash: beleg.sourceContentHash })
    assert.deepEqual(hashes, {
      ok: true,
      contentChanged: false,
      ruleChange: 'not_asserted',
      laterAnalysisShortCircuit: true,
    })
    assert.equal(ergebnis.status, 'unchanged_source_content')
    assert.equal(ergebnis.existingVersionId, bestehend.versionId)
    assert.equal(ergebnis.requestKey, request.key)
    assert.equal(ergebnis.requestKey, beleg.requestKey)
    assert.equal(ergebnis.ruleScopeKey, request.ruleScopeKey)
    assert.equal(ergebnis.ruleScopeKey, beleg.ruleScopeKey)
    assert.equal(ergebnis.sourceId, QUELLE)
    assert.equal(ergebnis.sourceId, beleg.sourceId)
    assert.equal(ergebnis.contentChanged, false)
    assert.equal(ergebnis.laterAnalysisShortCircuit, true)
    assert.equal(ergebnis.ruleChange, 'not_asserted')
    assert.equal(ergebnis.contentChanged, hashes.ok && hashes.contentChanged)
    assert.equal(ergebnis.laterAnalysisShortCircuit, hashes.ok && hashes.laterAnalysisShortCircuit)
    assert.equal(ergebnis.ruleChange, hashes.ok ? hashes.ruleChange : '')
    assert.deepEqual(Object.keys(ergebnis).sort(), [
      'contentChanged',
      'existingVersionId',
      'laterAnalysisShortCircuit',
      'requestKey',
      'ruleChange',
      'ruleScopeKey',
      'sourceId',
      'status',
    ])
    assert.equal(JSON.stringify(bestehend), vorherBestehend)
    assert.equal(JSON.stringify(normalisiert), vorherEingabe)
    assert.equal(bestehend.extractionNote, 'Bounded synthetic extraction note.')
    ohneWirkung(ergebnis)
    ohneQuelle(ergebnis, 'Bounded synthetic extraction note.')
    assert.equal(JSON.stringify(ergebnis).includes('Bounded synthetic extraction note.'), false)
    assert.equal(JSON.stringify(ergebnis).includes(ABGERUFEN), false)
  })

  test('ein geänderter Quellentext bleibt eine Inhaltsänderung ohne Regelwechsel und ohne neue Version', () => {
    const request = anfrage()
    const eingabe = huelle({ request })
    const bestehend = bestehendAus(eingabe)
    const geaendert = huelle({
      request,
      registry: eingabe.registry,
      descriptors: eingabe.descriptors,
      material: { sourceSnapshot: ANDERS },
    })
    const neu = bestehendAus(geaendert)
    const ergebnis = erfolg(vergleichen(bestehend, geaendert))
    const beleg = officialTruthAbgerufenMaterialPruefen(geaendert, uhr())
    assert.equal(beleg.status, 'retrieved_material')
    if (beleg.status !== 'retrieved_material') throw new Error('beleg')
    const hashes = evidenceVersionenVergleichen(bestehend, { sourceContentHash: beleg.sourceContentHash })
    assert.equal(hashes.ok, true)
    if (!hashes.ok) throw new Error('vergleich')
    assert.equal(ergebnis.status, 'changed_source_content')
    assert.equal(ergebnis.contentChanged, true)
    assert.equal(ergebnis.laterAnalysisShortCircuit, false)
    assert.equal(ergebnis.ruleChange, 'not_asserted')
    assert.equal(ergebnis.contentChanged, hashes.contentChanged)
    assert.equal(ergebnis.laterAnalysisShortCircuit, hashes.laterAnalysisShortCircuit)
    assert.equal(ergebnis.ruleChange, hashes.ruleChange)
    assert.equal(ergebnis.existingVersionId, bestehend.versionId)
    assert.notEqual(ergebnis.existingVersionId, neu.versionId)
    assert.equal(ergebnis.requestKey, request.key)
    assert.equal(ergebnis.ruleScopeKey, request.ruleScopeKey)
    assert.equal(ergebnis.sourceId, QUELLE)
    assert.equal(JSON.stringify(ergebnis).includes('lookupKey'), false)
    ohneWirkung(ergebnis)
    ohneQuelle(ergebnis)
  })

  test('Kandidat und nicht angenommene Evidence scheitern, lizenzierte Annahme auch', () => {
    const eingabe = huelle()
    const basis = eingabe.registry as QuellenRegistry
    const kandidat = officialTruthKandidatEvidenceAusAbruf(eingabe, uhr(), null)
    assert.equal(kandidat.status, 'candidate_evidence')
    if (kandidat.status !== 'candidate_evidence') throw new Error('kandidat')
    assert.equal(akzeptierteEvidenceLesen(kandidat.evidence, basis), null)
    assert.deepEqual(vergleichen(kandidat.evidence, eingabe), { status: 'blocked', reason: 'existing_evidence_not_accepted' })
    assert.equal(kandidat.evidence.lifecycle, 'candidate')
    assert.equal(kandidat.evidence.validationState, 'pending')

    const angenommen = bestehendAus(eingabe)
    for (const teil of [
      { lifecycle: 'candidate' as const },
      { validationState: 'pending' as const },
      { validationState: 'rejected' as const },
      { lifecycle: 'superseded' as const },
    ]) {
      const rohEvidence = { ...angenommen, ...teil }
      assert.equal(akzeptierteEvidenceLesen(rohEvidence, basis), null)
      assert.deepEqual(vergleichen(rohEvidence, eingabe), { status: 'blocked', reason: 'existing_evidence_not_accepted' })
    }

    const request = anfrage()
    const lizenziert = evidenceKandidatAusModell(
      { scope: { ...request.scope, sourceId: ANBIETER } },
      {
        canonicalUrl: 'https://www.provider.example/rules',
        retrievedAt: ABGERUFEN,
        sourceSnapshot: SNAPSHOT,
      },
      basis,
    )
    assert.equal(lizenziert.ok, true)
    if (!lizenziert.ok) throw new Error('lizenz')
    const lizenziertAngenommen = evidenceKandidatAkzeptieren(lizenziert.evidence, basis)
    assert.equal(lizenziertAngenommen.ok, true)
    if (!lizenziertAngenommen.ok) throw new Error('lizenzannahme')
    assert.equal(lizenziertAngenommen.evidence.sourceClass, 'licensed_evidence_provider')
    assert.deepEqual(akzeptierteEvidenceLesen(lizenziertAngenommen.evidence, basis), lizenziertAngenommen.evidence)
    const lizenzErgebnis = vergleichen(lizenziertAngenommen.evidence, eingabe)
    assert.deepEqual(lizenzErgebnis, { status: 'blocked', reason: 'existing_source_not_official_authority' })
    ohneQuelle(lizenzErgebnis, 'provider.example')
    assert.equal(JSON.stringify(lizenzErgebnis).includes('provider.example'), false)
  })

  test('andere Quelle und andere Regelzelle scheitern, ohne den Quellentext gleichzusetzen', () => {
    const request = anfrage()
    const basis = basisRegistry()
    const beide = abdeckung({ destinationCountryCodes: ['JP', 'TH'] })
    const amtlich = [deskriptor(basis, QUELLE, beide), deskriptor(basis, ANDERE, beide)]
    const bestehend = bestehendAus(huelle({ request, registry: basis, descriptors: amtlich }))
    const andereQuelle = huelle({
      request,
      registry: basis,
      descriptors: amtlich,
      sourceId: ANDERE,
      material: { canonicalUrl: 'https://www.interior.example/rules' },
    })
    const andereBeleg = officialTruthAbgerufenMaterialPruefen(andereQuelle, uhr())
    assert.equal(andereBeleg.status, 'retrieved_material')
    if (andereBeleg.status !== 'retrieved_material') throw new Error('andere')
    assert.equal(andereBeleg.sourceId, ANDERE)
    assert.equal(andereBeleg.ruleScopeKey, request.ruleScopeKey)
    assert.deepEqual(vergleichen(bestehend, andereQuelle), { status: 'blocked', reason: 'source_id_mismatch' })

    const thailand = anfrage({ destinationCountryCode: 'TH' })
    const andereZelle = huelle({ request: thailand, registry: basis, descriptors: amtlich })
    const zellenBeleg = officialTruthAbgerufenMaterialPruefen(andereZelle, uhr())
    assert.equal(zellenBeleg.status, 'retrieved_material')
    if (zellenBeleg.status !== 'retrieved_material') throw new Error('zelle')
    assert.equal(zellenBeleg.sourceId, QUELLE)
    assert.notEqual(zellenBeleg.ruleScopeKey, request.ruleScopeKey)
    assert.deepEqual(vergleichen(bestehend, andereZelle), { status: 'blocked', reason: 'scope_mismatch' })

    const deckung = abdeckung({
      citizenship: { mode: 'exact', countryCodes: ['CH', 'RS'] },
      documents: {
        mode: 'exact',
        options: [
          { documentType: 'passport', issuingCountryCode: 'CH' },
          { documentType: 'passport', issuingCountryCode: 'RS' },
        ],
      },
    })
    const serbisch = anfrage({
      credentialOption: {
        mode: 'option',
        documentType: 'passport',
        issuingCountryCode: 'RS',
        relatedCitizenshipCountryCode: 'RS',
      },
    })
    const serbischeHuelle = huelle({ request: serbisch, registry: basis, descriptors: [deskriptor(basis, QUELLE, deckung)] })
    const serbischBeleg = officialTruthAbgerufenMaterialPruefen(serbischeHuelle, uhr())
    assert.equal(serbischBeleg.status, 'retrieved_material')
    assert.deepEqual(vergleichen(bestehend, serbischeHuelle), { status: 'blocked', reason: 'scope_mismatch' })
    assert.deepEqual(bestehend.scope.citizenship, { mode: 'required', countryCodes: ['CH', 'RS'] })
    if (bestehend.scope.credentialOption.mode !== 'option') throw new Error('option')
    assert.equal(bestehend.scope.credentialOption.issuingCountryCode, 'CH')

    const wohnsitz = anfrage({
      transitCountryCode: 'TH',
      residence: { mode: 'required', countryCode: 'DE' },
    })
    const wohnsitzHuelle = huelle({
      request: wohnsitz,
      registry: basis,
      descriptors: [
        deskriptor(
          basis,
          QUELLE,
          abdeckung({ transitCountryCodes: ['TH'], residence: { mode: 'exact', countryCodes: ['DE'] } }),
        ),
      ],
    })
    assert.equal(officialTruthAbgerufenMaterialPruefen(wohnsitzHuelle, uhr()).status, 'retrieved_material')
    assert.deepEqual(vergleichen(bestehend, wohnsitzHuelle), { status: 'blocked', reason: 'scope_mismatch' })
    assert.equal(bestehend.scope.destinationCountryCode, 'JP')
    assert.equal(bestehend.scope.transitCountryCode, null)
  })

  test('ein veränderter Umschlag scheitert über den Abrufbeleg und übernimmt keinen fremden Hash', () => {
    const request = anfrage()
    const eingabe = huelle({ request })
    const bestehend = bestehendAus(eingabe)
    const hash = evidenceQuellenFingerprint(SNAPSHOT)
    assert.ok(hash)
    const belegObjekt = {
      status: 'retrieved_material',
      requestKey: request.key,
      ruleScopeKey: request.ruleScopeKey,
      sourceId: QUELLE,
      canonicalUrl: URL,
      retrievedAt: ABGERUFEN,
      sourceContentHash: hash,
      material: { canonicalUrl: URL, retrievedAt: ABGERUFEN, sourceSnapshot: SNAPSHOT },
    }
    const vergleichObjekt = {
      ok: true,
      contentChanged: false,
      ruleChange: 'not_asserted',
      laterAnalysisShortCircuit: true,
    }
    const faelle: { name: string; eingabe: unknown; uhrzeit: unknown }[] = [
      { name: 'beleg', eingabe: belegObjekt, uhrzeit: uhr() },
      { name: 'vergleich', eingabe, uhrzeit: uhr() },
      {
        name: 'request',
        eingabe: huelle({ request: { ...request, key: `research-request:v1:${'ab'.repeat(32)}` } }),
        uhrzeit: uhr(),
      },
      {
        name: 'scope',
        eingabe: huelle({ request: { ...request, scope: { ...request.scope, destinationCountryCode: 'TH' } } }),
        uhrzeit: uhr(),
      },
      { name: 'hash', eingabe: huelle({ extra: { sourceContentHash: hash } }), uhrzeit: uhr() },
      { name: 'snapshot', eingabe: huelle({ material: { sourceSnapshot: '' } }), uhrzeit: uhr() },
      { name: 'zukunft', eingabe: huelle({ material: { retrievedAt: '2026-10-01T12:00:00.001Z' } }), uhrzeit: uhr() },
      { name: 'uhr', eingabe: huelle(), uhrzeit: null },
    ]
    for (const fall of faelle) {
      const links = fall.name === 'vergleich' ? vergleichObjekt : bestehend
      const beleg = officialTruthAbgerufenMaterialPruefen(fall.eingabe, fall.uhrzeit)
      const ergebnis = officialTruthAkzeptierteEvidenceAktualisierungVergleichen(links, fall.eingabe, fall.uhrzeit)
      if (fall.name === 'vergleich') {
        assert.equal(beleg.status, 'retrieved_material', fall.name)
        assert.deepEqual(ergebnis, { status: 'blocked', reason: 'existing_evidence_not_accepted' }, fall.name)
      } else {
        assert.equal(beleg.status, 'blocked', fall.name)
        assert.deepEqual(ergebnis, beleg, fall.name)
      }
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes('unchanged_source_content'), false, fall.name)
      assert.equal(text.includes('changed_source_content'), false, fall.name)
      assert.equal(text.includes(String(hash)), false, fall.name)
      assert.equal(text.includes(URL), false, fall.name)
      assert.equal(text.includes(SNAPSHOT), false, fall.name)
    }
  })

  test('persönliche Werte und Quellenreste erscheinen weder bei Erfolg noch bei Sperre', () => {
    const eingabe = huelle()
    const bestehend = bestehendAus(eingabe)
    for (const feld of PERSONEN) {
      const ergebnis = vergleichen({ ...bestehend, [feld]: GEHEIM }, eingabe)
      assert.deepEqual(ergebnis, { status: 'blocked', reason: 'sensitive_personal_field' }, feld)
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(GEHEIM), false, feld)
      assert.equal(text.includes(feld), false, feld)
    }
    const verschachtelt = vergleichen(
      { ...bestehend, scope: { ...bestehend.scope, citizenship: { ...bestehend.scope.citizenship, passportNumber: GEHEIM } } },
      eingabe,
    )
    assert.deepEqual(verschachtelt, { status: 'blocked', reason: 'sensitive_personal_field' })
    assert.equal(JSON.stringify(verschachtelt).includes(GEHEIM), false)

    const notiz = { ...bestehend, extractionNote: GEHEIM, previousVersionId: GEHEIM }
    const notizErgebnis = erfolg(vergleichen(notiz, eingabe))
    assert.equal(notizErgebnis.status, 'unchanged_source_content')
    ohneQuelle(notizErgebnis)

    const version = vergleichen({ ...bestehend, versionId: GEHEIM }, eingabe)
    assert.deepEqual(version, { status: 'blocked', reason: 'existing_evidence_not_accepted' })
    assert.equal(JSON.stringify(version).includes(GEHEIM), false)

    const umschlag = huelle({ extra: { passportNumber: GEHEIM } })
    const umschlagVorher = JSON.stringify(umschlag)
    const gesperrt = vergleichen(bestehend, umschlag)
    assert.deepEqual(gesperrt, { status: 'blocked', reason: 'sensitive_personal_field' })
    assert.equal(JSON.stringify(umschlag), umschlagVorher)
    assert.equal(JSON.stringify(gesperrt).includes(GEHEIM), false)
    assert.equal(JSON.stringify(gesperrt).includes('passportNumber'), false)
    ohneWirkung(gesperrt)
    ohneWirkung(notizErgebnis)
  })

  test('Eingabeobjekte bleiben unverändert', () => {
    const eingabe = huelle()
    const bestehend = bestehendAus(eingabe)
    const eingabeVorher = JSON.stringify(eingabe)
    const bestehendVorher = JSON.stringify(bestehend)
    const gleich = vergleichen(bestehend, eingabe)
    assert.equal(gleich.status, 'unchanged_source_content')
    assert.equal(JSON.stringify(eingabe), eingabeVorher)
    assert.equal(JSON.stringify(bestehend), bestehendVorher)

    const geaendert = huelle({ material: { sourceSnapshot: ANDERS } })
    const geaendertVorher = JSON.stringify(geaendert)
    const anders = vergleichen(bestehend, geaendert)
    assert.equal(anders.status, 'changed_source_content')
    assert.equal(JSON.stringify(geaendert), geaendertVorher)
    assert.equal(JSON.stringify(bestehend), bestehendVorher)
  })
})
