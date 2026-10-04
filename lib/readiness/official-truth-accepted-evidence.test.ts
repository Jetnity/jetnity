import { r2Registry } from './official-truth-content-identity-r2.test'
// lib/readiness/official-truth-accepted-evidence.test.ts
//
// Annahme nur über den neu gebauten Kandidaten und die bestehende Funktion.
// Synthetische *.example-Quellen. Keine Regel, kein Speicher, kein Netz.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import {
  akzeptierteEvidenceLesen,
  evidenceQuellenFingerprint,
  evidenceSuchschluessel,
} from '@/lib/readiness/evidence'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { regelScopeAusEvidenceScope, type RegelFaktArt, type RegelScope } from '@/lib/readiness/rule-claims'
import {
  officialTruthAkzeptierteEvidenceAusAbruf,
  type OfficialTruthAkzeptierteEvidenceErgebnis,
} from '@/lib/readiness/official-truth-accepted-evidence'
import { officialTruthKandidatEvidenceAusAbruf } from '@/lib/readiness/official-truth-retrieved-candidate-evidence'
import {
  officialTruthRechercheEntscheiden,
  type OfficialTruthRechercheAnfrage,
  type OfficialTruthRechercheGrund,
} from '@/lib/readiness/official-truth-research-request'
import {
  quellenRegistryErstellen,
  quellenUrlAufloesen,
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

const FREMDE_FELDER = [
  'scope',
  'ruleScopeKey',
  'requestKey',
  'sourceId',
  'sourceClass',
  'authorityName',
  'publisherName',
  'canonicalUrl',
  'retrievedAt',
  'sourceSnapshot',
  'sourceContentHash',
  'contentHash',
  'content',
  'result',
  'required',
  'not_required',
  'conditional',
  'optionEligibility',
  'optionMandate',
  'visaMode',
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

type Status = OfficialTruthAkzeptierteEvidenceErgebnis['status']
type KeineWirkung = Extract<Status, 'required' | 'not_required' | 'conditional' | 'accepted' | 'candidate_evidence' | 'retrieved_material'> extends never
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
  return r2Registry(ergebnis.registry, R2_PUBLICATIONS)
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

function huelle(teil?: {
  request?: unknown
  registry?: unknown
  descriptors?: unknown
  sourceId?: unknown
  material?: Record<string, unknown> | null
  extra?: Record<string, unknown>
}): Record<string, unknown> {
  const basis = registry([amt(QUELLE, 'gov.example'), amt(ANDERE, 'interior.example'), anbieter(ANBIETER, 'provider.example')])
  const material =
    teil?.material === null
      ? null
      : { contentType: 'text/plain',
          canonicalUrl: 'https://www.gov.example/rules',
          retrievedAt: ABGERUFEN,
          sourceSnapshot: SNAPSHOT,
          ...teil?.material,
        }
  return {
    request: teil?.request ?? anfrage(),
    registry: teil?.registry ?? basis,
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

function annehmen(eingabe: unknown, extraktion: unknown = null, instant = UHR): OfficialTruthAkzeptierteEvidenceErgebnis {
  return officialTruthAkzeptierteEvidenceAusAbruf(eingabe, uhr(instant), extraktion)
}

function akzeptiert(ergebnis: OfficialTruthAkzeptierteEvidenceErgebnis) {
  assert.equal(ergebnis.status, 'accepted_evidence')
  if (ergebnis.status !== 'accepted_evidence') throw new Error('blockiert')
  return ergebnis.evidence
}

function ohneWirkung(wert: unknown): void {
  const text = JSON.stringify(wert)
  for (const wort of ['not_required', 'optionEligibility', 'optionMandate', 'visaMode', 'trustedRuleFact', 'conditional']) {
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

describe('Official Truth candidate evidence acceptance', () => {
  test('die Annahme läuft nur über den neu gebauten Kandidaten und die bestehende Funktion', () => {
    assert.equal(keineWirkung, true)
    const text = datei('lib/readiness/official-truth-accepted-evidence.ts')
    const evidence = datei('lib/readiness/evidence.ts')
    const bruecke = datei('lib/readiness/official-truth-retrieved-candidate-evidence.ts')
    assert.match(text, /officialTruthKandidatEvidenceAusAbruf\(/)
    assert.match(text, /evidenceKandidatAkzeptieren\(kandidat\.evidence, registry\)/)
    assert.doesNotMatch(text, /regelKandidatAkzeptieren|regelKandidatErstellen|trustedRuleFact/)
    assert.doesNotMatch(text, /lifecycle\s*:\s*'accepted'|validationState\s*:\s*'valid'/)
    assert.doesNotMatch(text, /versionId\s*:|lookupKey\s*:/)
    assert.doesNotMatch(text, /official_truth_store_accepted_v1|official_truth_source_catalog_v1/)
    assert.doesNotMatch(text, /requirementsProviderAus/)
    assert.doesNotMatch(text, /from '@\/lib\/readiness\/(engine|provider|official-truth-store-server|official-truth-source-catalog-server|official-truth-candidate-batch|rule-claims)'/)
    assert.doesNotMatch(text, /supabase|openai|Date\.now|new Date\(|fetch\(|node:fs|node:http|node:net/)
    assert.doesNotMatch(text, /not_required/)
    assert.doesNotMatch(text, /sherpa|timatic|kayak/i)
    assert.match(evidence, /export function evidenceKandidatAkzeptieren/)
    assert.doesNotMatch(evidence, /official-truth-accepted-evidence/)
    assert.doesNotMatch(bruecke, /official-truth-accepted-evidence/)
    for (const relativ of [
      'lib/readiness/official-truth-retrieved-material.ts',
      'lib/readiness/official-truth-research-request.ts',
      'lib/readiness/official-truth-research-source-routing.ts',
      'lib/readiness/rule-claims.ts',
      'lib/readiness/source-registry.ts',
      'lib/readiness/source-router.ts',
    ]) {
      assert.doesNotMatch(datei(relativ), /official-truth-accepted-evidence/, relativ)
    }
    assert.equal(requirementsProviderAus(), null)
  })

  test('gültiger Abruf wird angenommene amtliche Evidence und behält Provenienz und Scope', () => {
    const request = anfrage()
    const eingabe = huelle({ request })
    const vorher = JSON.stringify(eingabe)
    const ergebnis = annehmen(eingabe, null)
    const evidence = akzeptiert(ergebnis)
    const kandidatErgebnis = officialTruthKandidatEvidenceAusAbruf(eingabe, uhr(), null)
    assert.equal(kandidatErgebnis.status, 'candidate_evidence')
    if (kandidatErgebnis.status !== 'candidate_evidence') throw new Error('kandidat')
    const kandidat = kandidatErgebnis.evidence
    const basis = eingabe.registry as QuellenRegistry
    const aufgeloest = quellenUrlAufloesen(basis, 'https://www.gov.example/rules')
    assert.equal(aufgeloest.ok, true)
    if (!aufgeloest.ok) throw new Error('url')
    const zelleGelesen = regelScopeAusEvidenceScope(request.scope)
    assert.equal(zelleGelesen.ok, true)
    if (!zelleGelesen.ok) throw new Error('zelle')
    const schluessel = evidenceSuchschluessel({ ...zelleGelesen.scope, sourceId: QUELLE }, { sourceId: evidence.sourceId, contentItemId: evidence.contentItemId, representationId: evidence.representationId })
    assert.equal(schluessel.ok, true)
    if (!schluessel.ok) throw new Error('schluessel')

    assert.equal(evidence.lifecycle, 'accepted')
    assert.equal(evidence.validationState, 'valid')
    assert.equal(evidence.sourceClass, 'official_authority')
    assert.equal(kandidat.lifecycle, 'candidate')
    assert.equal(kandidat.validationState, 'pending')
    assert.equal(evidence.sourceId, kandidat.sourceId)
    assert.equal(evidence.canonicalUrl, kandidat.canonicalUrl)
    assert.equal(evidence.retrievedAt, kandidat.retrievedAt)
    assert.equal(evidence.sourceContentHash, kandidat.sourceContentHash)
    assert.deepEqual(evidence.scope, kandidat.scope)
    assert.equal(evidence.versionId, kandidat.versionId)
    assert.equal(evidence.previousVersionId, null)
    assert.equal(evidence.lookupKey, kandidat.lookupKey)
    assert.equal(evidence.authorityName, kandidat.authorityName)
    assert.equal(evidence.publisherName, kandidat.publisherName)
    assert.equal(evidence.validFrom, null)
    assert.equal(evidence.validUntil, null)
    assert.equal(evidence.extractionNote, null)
    assert.equal(evidence.sourceId, QUELLE)
    assert.equal(evidence.canonicalUrl, aufgeloest.canonicalUrl)
    assert.equal(evidence.retrievedAt, ABGERUFEN)
    assert.equal(evidence.sourceContentHash, evidenceQuellenFingerprint(SNAPSHOT))
    assert.equal(evidence.lookupKey, schluessel.key)
    assert.deepEqual(evidence.scope, schluessel.scope)
    assert.deepEqual(evidence.scope.citizenship, { mode: 'required', countryCodes: ['CH', 'RS'] })
    if (evidence.scope.credentialOption.mode !== 'option') throw new Error('option')
    assert.equal(evidence.scope.credentialOption.issuingCountryCode, 'CH')
    assert.equal(evidence.scope.credentialOption.relatedCitizenshipCountryCode, 'CH')
    assert.equal(evidence.scope.destinationCountryCode, 'JP')
    assert.equal(evidence.scope.transitCountryCode, null)
    assert.notEqual(evidence.lookupKey, request.ruleScopeKey)
    assert.deepEqual(akzeptierteEvidenceLesen(evidence, basis), evidence)
    assert.equal(akzeptierteEvidenceLesen(kandidat, basis), null)
    assert.equal(JSON.stringify(eingabe), vorher)
    assert.deepEqual(Object.keys(ergebnis).sort(), ['evidence', 'status'])
    ohneWirkung(ergebnis)
  })

  test('Fenster und Notiz bleiben am Kandidaten, die Annahme ändert nur den Stand', () => {
    const eingabe = huelle()
    const extraktion = {
      validFrom: '2026-01-01',
      validUntil: '2026-12-31T00:00:00.000Z',
      extractionNote: '  Bounded synthetic extraction note.  ',
    }
    const vorher = JSON.stringify(extraktion)
    const evidence = akzeptiert(annehmen(eingabe, extraktion))
    const leer = akzeptiert(annehmen(eingabe, {}))
    const kandidatErgebnis = officialTruthKandidatEvidenceAusAbruf(eingabe, uhr(), extraktion)
    assert.equal(kandidatErgebnis.status, 'candidate_evidence')
    if (kandidatErgebnis.status !== 'candidate_evidence') throw new Error('kandidat')
    assert.equal(evidence.validFrom, '2026-01-01')
    assert.equal(evidence.validUntil, '2026-12-31T00:00:00.000Z')
    assert.equal(evidence.extractionNote, 'Bounded synthetic extraction note.')
    assert.equal(evidence.validFrom, kandidatErgebnis.evidence.validFrom)
    assert.equal(evidence.validUntil, kandidatErgebnis.evidence.validUntil)
    assert.equal(evidence.extractionNote, kandidatErgebnis.evidence.extractionNote)
    assert.equal(evidence.sourceContentHash, kandidatErgebnis.evidence.sourceContentHash)
    assert.equal(evidence.canonicalUrl, kandidatErgebnis.evidence.canonicalUrl)
    assert.equal(evidence.retrievedAt, kandidatErgebnis.evidence.retrievedAt)
    assert.deepEqual(evidence.scope, kandidatErgebnis.evidence.scope)
    assert.equal(evidence.lifecycle, 'accepted')
    assert.equal(evidence.validationState, 'valid')
    assert.notEqual(evidence.versionId, leer.versionId)
    assert.equal(evidence.sourceContentHash, leer.sourceContentHash)
    assert.equal(JSON.stringify(extraktion), vorher)
    assert.equal(akzeptiert(annehmen(eingabe, { extractionNote: '   ' })).extractionNote, null)
  })

  test('ein vom Aufrufer gebautes Evidence-Objekt ist keine Eingabe', () => {
    const gebaut = officialTruthKandidatEvidenceAusAbruf(huelle(), uhr(), null)
    assert.equal(gebaut.status, 'candidate_evidence')
    if (gebaut.status !== 'candidate_evidence') throw new Error('kandidat')
    const formen = [
      gebaut.evidence,
      { ...gebaut.evidence, lifecycle: 'accepted', validationState: 'valid' },
      gebaut,
      huelle({ extra: { evidence: gebaut.evidence } }),
    ]
    for (const form of formen) {
      const kand = officialTruthKandidatEvidenceAusAbruf(form, uhr(), null)
      const ann = annehmen(form, null)
      assert.equal(kand.status, 'blocked')
      assert.deepEqual(ann, kand)
      assert.equal(JSON.stringify(ann).includes(gebaut.evidence.sourceContentHash), false)
      assert.equal(JSON.stringify(ann).includes('accepted_evidence'), false)
    }
    assert.equal(gebaut.evidence.lifecycle, 'candidate')
    assert.equal(gebaut.evidence.validationState, 'pending')
  })

  test('ein veränderter Umschlag oder eine verbotene Extraktion scheitert über die Kandidatenbrücke', () => {
    const request = anfrage()
    const eingabe = huelle({ request })
    const hash = evidenceQuellenFingerprint(SNAPSHOT)
    assert.ok(hash)
    const faelle: { name: string; eingabe: unknown; extraktion: unknown; uhrzeit: unknown }[] = [
      {
        name: 'beleg',
        eingabe: {
          status: 'retrieved_material',
          requestKey: request.key,
          ruleScopeKey: request.ruleScopeKey,
          sourceId: QUELLE,
          canonicalUrl: 'https://www.gov.example/rules',
          retrievedAt: ABGERUFEN,
          sourceContentHash: hash,
          material: { contentType: 'text/plain', canonicalUrl: 'https://www.gov.example/rules', retrievedAt: ABGERUFEN, sourceSnapshot: SNAPSHOT },
        },
        extraktion: null,
        uhrzeit: uhr(),
      },
      { name: 'request', eingabe: huelle({ request: { ...request, key: `research-request:v1:${'ab'.repeat(32)}` } }), extraktion: null, uhrzeit: uhr() },
      {
        name: 'scope',
        eingabe: huelle({ request: { ...request, scope: { ...request.scope, destinationCountryCode: 'TH' } } }),
        extraktion: null,
        uhrzeit: uhr(),
      },
      { name: 'hash', eingabe: huelle({ extra: { sourceContentHash: hash } }), extraktion: null, uhrzeit: uhr() },
      { name: 'snapshot', eingabe: huelle({ material: { sourceSnapshot: '' } }), extraktion: null, uhrzeit: uhr() },
      { name: 'zukunft', eingabe: huelle({ material: { retrievedAt: '2026-10-01T12:00:00.001Z' } }), extraktion: null, uhrzeit: uhr() },
      { name: 'uhr', eingabe: huelle(), extraktion: null, uhrzeit: null },
      { name: 'fenster', eingabe, extraktion: { validFrom: '2026-12-31', validUntil: '2026-01-01' }, uhrzeit: uhr() },
      { name: 'extraktion', eingabe, extraktion: { sourceId: 'caller-source' }, uhrzeit: uhr() },
    ]
    for (const fall of faelle) {
      const kand = officialTruthKandidatEvidenceAusAbruf(fall.eingabe, fall.uhrzeit, fall.extraktion)
      const ann = officialTruthAkzeptierteEvidenceAusAbruf(fall.eingabe, fall.uhrzeit, fall.extraktion)
      assert.equal(kand.status, 'blocked', fall.name)
      assert.deepEqual(ann, kand, fall.name)
      assert.equal(JSON.stringify(ann).includes('accepted_evidence'), false, fall.name)
    }
    assert.equal(JSON.stringify(annehmen(huelle({ extra: { sourceContentHash: hash } }), null)).includes(String(hash)), false)
  })

  test('persönliche und entscheidende Extraktion scheitert ohne Echo und ohne Regelwirkung', () => {
    const eingabe = huelle()
    const geheim = 'personal-secret-91f3'
    for (const feld of PERSONEN) {
      const ergebnis = annehmen(eingabe, { [feld]: geheim })
      const kand = officialTruthKandidatEvidenceAusAbruf(eingabe, uhr(), { [feld]: geheim })
      assert.deepEqual(ergebnis, kand, feld)
      assert.deepEqual(ergebnis, { status: 'blocked', reason: 'sensitive_personal_field' }, feld)
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(geheim), false, feld)
      assert.equal(text.includes(feld), false, feld)
    }
    for (const feld of FREMDE_FELDER) {
      const wert = feld === 'result' ? 'not_required' : geheim
      const ergebnis = annehmen(eingabe, { [feld]: wert })
      assert.deepEqual(ergebnis, { status: 'blocked', reason: 'extraction_field_forbidden' }, feld)
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(geheim), false, feld)
      ohneWirkung(ergebnis)
    }
    const verschachtelt = annehmen(eingabe, { extractionNote: { passportNumber: geheim } })
    assert.deepEqual(verschachtelt, { status: 'blocked', reason: 'sensitive_personal_field' })
    assert.equal(JSON.stringify(verschachtelt).includes(geheim), false)
  })

  test('zwei Pässe bleiben zwei Annahmen und behalten beide Staatsbürgerschaften', () => {
    const basis = registry([amt(QUELLE, 'gov.example')])
    const beide = abdeckung({
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
    const schweizer = anfrage()
    const serbische = akzeptiert(annehmen(huelle({ request: serbisch, registry: basis, descriptors: [deskriptor(basis, QUELLE, beide)] })))
    const schweizerische = akzeptiert(annehmen(huelle({ request: schweizer, registry: basis, descriptors: [deskriptor(basis, QUELLE, beide)] })))
    assert.equal(serbische.lifecycle, 'accepted')
    assert.equal(schweizerische.lifecycle, 'accepted')
    assert.equal(serbische.validationState, 'valid')
    assert.equal(schweizerische.validationState, 'valid')
    assert.equal(serbische.sourceClass, 'official_authority')
    assert.equal(schweizerische.sourceClass, 'official_authority')
    assert.notEqual(serbische.lookupKey, schweizerische.lookupKey)
    assert.deepEqual(serbische.scope.citizenship, { mode: 'required', countryCodes: ['CH', 'RS'] })
    assert.deepEqual(schweizerische.scope.citizenship, { mode: 'required', countryCodes: ['CH', 'RS'] })
    if (serbische.scope.credentialOption.mode !== 'option') throw new Error('rs')
    if (schweizerische.scope.credentialOption.mode !== 'option') throw new Error('ch')
    assert.equal(serbische.scope.credentialOption.issuingCountryCode, 'RS')
    assert.equal(schweizerische.scope.credentialOption.issuingCountryCode, 'CH')
    ohneWirkung(serbische)
    ohneWirkung(schweizerische)

    const wohnsitz = anfrage({
      transitCountryCode: 'TH',
      residence: { mode: 'required', countryCode: 'DE' },
    })
    const wohnsitzAbdeckung = abdeckung({
      transitCountryCodes: ['TH'],
      residence: { mode: 'exact', countryCodes: ['DE'] },
    })
    const wohnsitzEvidence = akzeptiert(
      annehmen(huelle({ request: wohnsitz, registry: basis, descriptors: [deskriptor(basis, QUELLE, wohnsitzAbdeckung)] })),
    )
    assert.equal(wohnsitzEvidence.scope.destinationCountryCode, 'JP')
    assert.equal(wohnsitzEvidence.scope.transitCountryCode, 'TH')
    assert.deepEqual(wohnsitzEvidence.scope.residence, { mode: 'required', countryCode: 'DE' })
    assert.deepEqual(wohnsitzEvidence.scope.citizenship, { mode: 'required', countryCodes: ['CH', 'RS'] })
  })

  test('Eingabe und Extraktion bleiben unverändert', () => {
    const eingabe = huelle()
    const extraktion = { extractionNote: '  keep me  ', validFrom: '2026-04-01' }
    const eingabeVorher = JSON.stringify(eingabe)
    const extraktionVorher = JSON.stringify(extraktion)
    const evidence = akzeptiert(annehmen(eingabe, extraktion))
    assert.equal(evidence.extractionNote, 'keep me')
    assert.equal(evidence.lifecycle, 'accepted')
    assert.equal(evidence.validationState, 'valid')
    assert.equal(JSON.stringify(eingabe), eingabeVorher)
    assert.equal(JSON.stringify(extraktion), extraktionVorher)

    const gesperrt = huelle({ extra: { passportNumber: 'personal-secret-91f3' } })
    const gesperrtVorher = JSON.stringify(gesperrt)
    const ergebnis = annehmen(gesperrt, { sourceId: 'caller-source-secret' })
    assert.deepEqual(ergebnis, { status: 'blocked', reason: 'sensitive_personal_field' })
    assert.equal(JSON.stringify(gesperrt), gesperrtVorher)
    assert.equal(JSON.stringify(ergebnis).includes('personal-secret-91f3'), false)
    assert.equal(JSON.stringify(ergebnis).includes('caller-source-secret'), false)
  })
})

// Explicit synthetic v2 publications; no production registration.
const R2_PUBLICATIONS = [
  "https://www.gov.example/rules"
] as const
