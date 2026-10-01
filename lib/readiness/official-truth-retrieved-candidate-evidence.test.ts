// lib/readiness/official-truth-retrieved-candidate-evidence.test.ts
//
// Kandidat aus bereits belegtem amtlichem Material.
// Synthetische *.example-Quellen. Kein Modell, keine Annahme, kein Speicher.

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
  officialTruthRechercheEntscheiden,
  type OfficialTruthRechercheAnfrage,
  type OfficialTruthRechercheGrund,
} from '@/lib/readiness/official-truth-research-request'
import {
  officialTruthKandidatEvidenceAusAbruf,
  type OfficialTruthKandidatEvidenceErgebnis,
} from '@/lib/readiness/official-truth-retrieved-candidate-evidence'
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

type Status = OfficialTruthKandidatEvidenceErgebnis['status']
type KeineWirkung = Extract<Status, 'required' | 'not_required' | 'conditional' | 'accepted' | 'retrieved_material'> extends never
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
      : {
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

function bauen(eingabe: unknown, extraktion: unknown = null, instant = UHR): OfficialTruthKandidatEvidenceErgebnis {
  return officialTruthKandidatEvidenceAusAbruf(eingabe, uhr(instant), extraktion)
}

function kandidat(ergebnis: OfficialTruthKandidatEvidenceErgebnis) {
  assert.equal(ergebnis.status, 'candidate_evidence')
  if (ergebnis.status !== 'candidate_evidence') throw new Error('blockiert')
  return ergebnis.evidence
}

function grund(ergebnis: OfficialTruthKandidatEvidenceErgebnis): string {
  assert.equal(ergebnis.status, 'blocked')
  if (ergebnis.status !== 'blocked') throw new Error('kandidat')
  return ergebnis.reason
}

describe('Official Truth retrieved material candidate evidence', () => {
  test('der Kandidat ist keine angenommene Wahrheit und der Konstruktor bleibt der bestehende', () => {
    assert.equal(keineWirkung, true)
    const text = datei('lib/readiness/official-truth-retrieved-candidate-evidence.ts')
    const evidence = datei('lib/readiness/evidence.ts')
    assert.match(text, /officialTruthAbgerufenMaterialPruefen\(/)
    assert.match(text, /evidenceKandidatAusModell\(/)
    assert.match(text, /regelScopeAusEvidenceScope\(/)
    assert.doesNotMatch(text, /evidenceKandidatAkzeptieren|regelKandidatAkzeptieren|regelKandidatErstellen/)
    assert.doesNotMatch(text, /versionId\s*:|lookupKey\s*:|lifecycle\s*:\s*'candidate'|validationState\s*:\s*'pending'/)
    assert.doesNotMatch(text, /official_truth_store_accepted_v1|official_truth_source_catalog_v1/)
    assert.doesNotMatch(text, /requirementsProviderAus/)
    assert.doesNotMatch(text, /from '@\/lib\/readiness\/(engine|provider|official-truth-store-server|official-truth-source-catalog-server|official-truth-candidate-batch)'/)
    assert.doesNotMatch(text, /supabase|openai|Date\.now|new Date\(|fetch\(|node:fs|node:http|node:net/)
    assert.doesNotMatch(text, /not_required/)
    assert.doesNotMatch(text, /sherpa|timatic|kayak/i)
    assert.match(evidence, /export function evidenceKandidatAusModell/)
    assert.doesNotMatch(evidence, /official-truth-retrieved-candidate-evidence/)
    for (const relativ of [
      'lib/readiness/official-truth-retrieved-material.ts',
      'lib/readiness/official-truth-research-request.ts',
      'lib/readiness/official-truth-research-source-routing.ts',
      'lib/readiness/rule-claims.ts',
      'lib/readiness/source-registry.ts',
      'lib/readiness/source-router.ts',
    ]) {
      assert.doesNotMatch(datei(relativ), /official-truth-retrieved-candidate-evidence/, relativ)
    }
    assert.equal(requirementsProviderAus(), null)
  })

  test('gültiger Abruf und leere Gültigkeit ergeben candidate/pending Evidence', () => {
    const request = anfrage()
    const eingabe = huelle({ request })
    const vorher = JSON.stringify(eingabe)
    const ergebnis = bauen(eingabe, null)
    const evidence = kandidat(ergebnis)
    const basis = eingabe.registry as QuellenRegistry
    const adresse = 'https://www.gov.example/rules'
    const aufgeloest = quellenUrlAufloesen(basis, adresse)
    assert.equal(aufgeloest.ok, true)
    if (!aufgeloest.ok) throw new Error('url')
    const zelleGelesen = regelScopeAusEvidenceScope(request.scope)
    assert.equal(zelleGelesen.ok, true)
    if (!zelleGelesen.ok) throw new Error('zelle')
    const schluessel = evidenceSuchschluessel({ ...zelleGelesen.scope, sourceId: QUELLE })
    assert.equal(schluessel.ok, true)
    if (!schluessel.ok) throw new Error('schluessel')

    assert.equal(evidence.lifecycle, 'candidate')
    assert.equal(evidence.validationState, 'pending')
    assert.equal(evidence.previousVersionId, null)
    assert.equal(evidence.sourceClass, 'official_authority')
    assert.equal(evidence.sourceId, QUELLE)
    assert.equal(evidence.authorityName, 'Example Border Authority')
    assert.equal(evidence.publisherName, 'Example Border Authority')
    assert.equal(evidence.canonicalUrl, aufgeloest.canonicalUrl)
    assert.equal(evidence.retrievedAt, ABGERUFEN)
    assert.equal(evidence.sourceContentHash, evidenceQuellenFingerprint(SNAPSHOT))
    assert.equal(evidence.validFrom, null)
    assert.equal(evidence.validUntil, null)
    assert.equal(evidence.extractionNote, null)
    assert.equal(evidence.lookupKey, schluessel.key)
    assert.deepEqual(evidence.scope, schluessel.scope)
    assert.equal(zelleGelesen.key, request.ruleScopeKey)
    assert.notEqual(evidence.lookupKey, request.ruleScopeKey)
    assert.equal(evidence.scope.destinationCountryCode, 'JP')
    assert.equal(evidence.scope.transitCountryCode, null)
    assert.deepEqual(evidence.scope.citizenship, { mode: 'required', countryCodes: ['CH', 'RS'] })
    assert.equal(evidence.scope.residence.mode, 'not_applicable')
    if (evidence.scope.credentialOption.mode !== 'option') throw new Error('option')
    assert.equal(evidence.scope.credentialOption.issuingCountryCode, 'CH')
    assert.equal(evidence.scope.credentialOption.relatedCitizenshipCountryCode, 'CH')
    assert.deepEqual(evidence.scope.validity, { mode: 'travel_date', travelDate: '2026-10-01' })
    assert.equal(akzeptierteEvidenceLesen(evidence, basis), null)
    assert.equal(JSON.stringify(ergebnis).includes('not_required'), false)
    assert.equal(JSON.stringify(eingabe), vorher)
    assert.deepEqual(Object.keys(ergebnis).sort(), ['evidence', 'status'])
  })

  test('Notiz und Gültigkeitsfenster bleiben die Werte des bestehenden Konstruktors', () => {
    const eingabe = huelle()
    const extraktion = {
      validFrom: '2026-01-01',
      validUntil: '2026-12-31T00:00:00.000Z',
      extractionNote: '  Bounded synthetic extraction note.  ',
    }
    const vorher = JSON.stringify(extraktion)
    const evidence = kandidat(bauen(eingabe, extraktion))
    const leer = kandidat(bauen(eingabe, {}))
    assert.equal(evidence.validFrom, '2026-01-01')
    assert.equal(evidence.validUntil, '2026-12-31T00:00:00.000Z')
    assert.equal(evidence.extractionNote, 'Bounded synthetic extraction note.')
    assert.equal(evidence.lifecycle, 'candidate')
    assert.equal(evidence.validationState, 'pending')
    assert.equal(evidence.versionId, leer.versionId)
    assert.equal(evidence.sourceContentHash, leer.sourceContentHash)
    assert.equal(leer.validFrom, null)
    assert.equal(leer.validUntil, null)
    assert.equal(leer.extractionNote, null)
    assert.equal(JSON.stringify(extraktion), vorher)
    const leerNotiz = kandidat(bauen(eingabe, { extractionNote: '   ' }))
    assert.equal(leerNotiz.extractionNote, null)
    assert.deepEqual(bauen(eingabe, { validFrom: '2026-12-31', validUntil: '2026-01-01' }), {
      status: 'blocked',
      reason: 'invalid_validity',
    })
    const geheim = 'note-secret-91f3'
    assert.deepEqual(bauen(eingabe, { extractionNote: `${geheim}${'x'.repeat(240)}` }), {
      status: 'blocked',
      reason: 'invalid_context',
    })
    assert.equal(JSON.stringify(bauen(eingabe, { extractionNote: `${geheim}${'x'.repeat(240)}` })).includes(geheim), false)
  })

  test('sourceId und Scope kommen aus Anfrage und Beleg, nicht aus der Extraktion oder einem zweiten sourceId', () => {
    const request = anfrage()
    const mitFremderQuelle = {
      ...request,
      scope: { ...request.scope, sourceId: ANDERE },
    }
    const evidence = kandidat(bauen(huelle({ request: mitFremderQuelle }), { extractionNote: 'cell note' }))
    assert.equal(evidence.sourceId, QUELLE)
    assert.equal(evidence.scope.sourceId, QUELLE)
    assert.equal(JSON.stringify(evidence).includes(ANDERE), false)
    const zelleGelesen = regelScopeAusEvidenceScope(request.scope)
    assert.equal(zelleGelesen.ok, true)
    if (!zelleGelesen.ok) throw new Error('zelle')
    const schluessel = evidenceSuchschluessel({ ...zelleGelesen.scope, sourceId: QUELLE })
    assert.equal(schluessel.ok, true)
    if (!schluessel.ok) throw new Error('schluessel')
    assert.equal(evidence.lookupKey, schluessel.key)
    assert.deepEqual(evidence.scope, schluessel.scope)
    assert.equal(evidence.extractionNote, 'cell note')

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
    const basis = registry([amt(QUELLE, 'gov.example')])
    const serbisch = anfrage({
      credentialOption: {
        mode: 'option',
        documentType: 'passport',
        issuingCountryCode: 'RS',
        relatedCitizenshipCountryCode: 'RS',
      },
    })
    const schweizer = anfrage()
    const serbischeEvidence = kandidat(
      bauen(huelle({ request: serbisch, registry: basis, descriptors: [deskriptor(basis, QUELLE, beide)] })),
    )
    const schweizerEvidence = kandidat(
      bauen(huelle({ request: schweizer, registry: basis, descriptors: [deskriptor(basis, QUELLE, beide)] })),
    )
    assert.notEqual(serbischeEvidence.lookupKey, schweizerEvidence.lookupKey)
    assert.deepEqual(serbischeEvidence.scope.citizenship, { mode: 'required', countryCodes: ['CH', 'RS'] })
    assert.deepEqual(schweizerEvidence.scope.citizenship, { mode: 'required', countryCodes: ['CH', 'RS'] })
    if (serbischeEvidence.scope.credentialOption.mode !== 'option') throw new Error('rs')
    if (schweizerEvidence.scope.credentialOption.mode !== 'option') throw new Error('ch')
    assert.equal(serbischeEvidence.scope.credentialOption.issuingCountryCode, 'RS')
    assert.equal(serbischeEvidence.scope.credentialOption.relatedCitizenshipCountryCode, 'RS')
    assert.equal(schweizerEvidence.scope.credentialOption.issuingCountryCode, 'CH')

    const wohnsitz = anfrage({
      transitCountryCode: 'TH',
      residence: { mode: 'required', countryCode: 'DE' },
    })
    const wohnsitzAbdeckung = abdeckung({
      transitCountryCodes: ['TH'],
      residence: { mode: 'exact', countryCodes: ['DE'] },
    })
    const wohnsitzEvidence = kandidat(
      bauen(huelle({ request: wohnsitz, registry: basis, descriptors: [deskriptor(basis, QUELLE, wohnsitzAbdeckung)] })),
    )
    assert.equal(wohnsitzEvidence.scope.destinationCountryCode, 'JP')
    assert.equal(wohnsitzEvidence.scope.transitCountryCode, 'TH')
    assert.deepEqual(wohnsitzEvidence.scope.residence, { mode: 'required', countryCode: 'DE' })
    assert.deepEqual(wohnsitzEvidence.scope.citizenship, { mode: 'required', countryCodes: ['CH', 'RS'] })
  })

  test('Scope, Quelle, Provenienz, Hash und Entscheidung in der Extraktion sperren ohne Wert', () => {
    const eingabe = huelle()
    const geheim = 'extraction-secret-91f3'
    for (const feld of FREMDE_FELDER) {
      const wert = feld === 'result' ? 'not_required' : feld === 'scope' ? { destinationCountryCode: 'TH', marker: geheim } : geheim
      const ergebnis = bauen(eingabe, { validFrom: null, [feld]: wert })
      assert.deepEqual(ergebnis, { status: 'blocked', reason: 'extraction_field_forbidden' }, feld)
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(geheim), false, feld)
      assert.equal(text.includes('not_required'), false, feld)
      assert.equal(text.includes('TH'), false, feld)
    }
  })

  test('persönliche Extraktionsfelder sperren ohne Echo', () => {
    const eingabe = huelle()
    const geheim = 'personal-secret-91f3'
    for (const feld of PERSONEN) {
      const ergebnis = bauen(eingabe, { [feld]: geheim })
      assert.deepEqual(ergebnis, { status: 'blocked', reason: 'sensitive_personal_field' }, feld)
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(geheim), false, feld)
      assert.equal(text.includes(feld), false, feld)
    }
    const verschachtelt = bauen(eingabe, { extractionNote: { passportNumber: geheim } })
    assert.deepEqual(verschachtelt, { status: 'blocked', reason: 'sensitive_personal_field' })
    assert.equal(JSON.stringify(verschachtelt).includes(geheim), false)
  })

  test('ein veränderter Umschlag scheitert, weil der Abruf neu belegt wird', () => {
    const request = anfrage()
    const hash = evidenceQuellenFingerprint(SNAPSHOT)
    assert.ok(hash)
    const belegObjekt = {
      status: 'retrieved_material',
      requestKey: request.key,
      ruleScopeKey: request.ruleScopeKey,
      sourceId: QUELLE,
      canonicalUrl: 'https://www.gov.example/rules',
      retrievedAt: ABGERUFEN,
      sourceContentHash: hash,
      material: {
        canonicalUrl: 'https://www.gov.example/rules',
        retrievedAt: ABGERUFEN,
        sourceSnapshot: SNAPSHOT,
      },
    }
    assert.deepEqual(bauen(belegObjekt, null), { status: 'blocked', reason: 'provenance_override_forbidden' })
    assert.equal(JSON.stringify(bauen(belegObjekt, null)).includes(String(hash)), false)
    assert.deepEqual(bauen({ status: 'retrieved_material', sourceId: QUELLE }, null), {
      status: 'blocked',
      reason: 'invalid_envelope',
    })

    const verbogen = { ...request, key: `research-request:v1:${'ab'.repeat(32)}` }
    assert.equal(grund(bauen(huelle({ request: verbogen }), null)), 'invalid_request')
    const scope = { ...request.scope, destinationCountryCode: 'TH' }
    assert.equal(grund(bauen(huelle({ request: { ...request, scope } }), null)), 'scope_mismatch')

    assert.deepEqual(bauen(huelle({ extra: { sourceContentHash: hash } }), null), {
      status: 'blocked',
      reason: 'source_fingerprint_override_forbidden',
    })
    assert.equal(JSON.stringify(bauen(huelle({ extra: { sourceContentHash: hash } }), null)).includes(String(hash)), false)
    assert.equal(grund(bauen(huelle({ material: { sourceSnapshot: '' } }), null)), 'invalid_source_snapshot')
    assert.equal(grund(bauen(huelle({ material: { retrievedAt: '2026-10-01T12:00:00.001Z' } }), null)), 'retrieved_at_in_future')
    assert.equal(grund(officialTruthKandidatEvidenceAusAbruf(huelle(), null, null)), 'invalid_validation_clock')
  })

  test('Eingabe und Extraktion bleiben unverändert', () => {
    const eingabe = huelle()
    const extraktion = { extractionNote: '  keep me  ', validFrom: '2026-04-01' }
    const eingabeVorher = JSON.stringify(eingabe)
    const extraktionVorher = JSON.stringify(extraktion)
    const evidence = kandidat(bauen(eingabe, extraktion))
    assert.equal(evidence.extractionNote, 'keep me')
    assert.equal(JSON.stringify(eingabe), eingabeVorher)
    assert.equal(JSON.stringify(extraktion), extraktionVorher)

    const gesperrt = huelle({ extra: { passportNumber: 'personal-secret-91f3' } })
    const gesperrtVorher = JSON.stringify(gesperrt)
    const ergebnis = bauen(gesperrt, { sourceId: 'caller-source-secret' })
    assert.deepEqual(ergebnis, { status: 'blocked', reason: 'sensitive_personal_field' })
    assert.equal(JSON.stringify(gesperrt), gesperrtVorher)
    assert.equal(JSON.stringify(ergebnis).includes('personal-secret-91f3'), false)
    assert.equal(JSON.stringify(ergebnis).includes('caller-source-secret'), false)
  })
})
