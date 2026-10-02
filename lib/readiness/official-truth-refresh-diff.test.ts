// lib/readiness/official-truth-refresh-diff.test.ts
//
// Auffrischung nur über die erneut bewiesene Annahme und den neuen Beleg.
// Synthetische *.example-Quellen. Keine Regel, kein Speicher, kein Netz.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { evidenceQuellenFingerprint, evidenceVersionenVergleichen } from '@/lib/readiness/evidence'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { regelScopeAusEvidenceScope, type RegelFaktArt, type RegelScope } from '@/lib/readiness/rule-claims'
import { officialTruthAkzeptierteEvidenceAusAbruf } from '@/lib/readiness/official-truth-accepted-evidence'
import {
  officialTruthAkzeptierteEvidenceAuffrischungVergleichen,
  type OfficialTruthAuffrischungErgebnis,
} from '@/lib/readiness/official-truth-refresh-diff'
import { officialTruthAbgerufenMaterialPruefen } from '@/lib/readiness/official-truth-retrieved-material'
import { officialTruthKandidatEvidenceAusAbruf } from '@/lib/readiness/official-truth-retrieved-candidate-evidence'
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

const UHR = '2026-10-02T12:00:00.000Z'
const ABGERUFEN = '2026-10-02T11:00:00.000Z'
const SPAETER = '2026-10-02T11:30:00.000Z'
const SNAPSHOT = 'official page line\nunchanged'
const ANDERS = 'official page line\nchanged wording'
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
  'travellerId',
  'email',
  'fullName',
  'dateOfBirth',
  'healthRecord',
  'scan',
  'biometric',
  'travellerNote',
  'note',
] as const

const ERFOLG_FELDER = [
  'baselineRequestKey',
  'baselineVersionId',
  'contentChanged',
  'laterAnalysisShortCircuit',
  'refreshedRequestKey',
  'ruleChange',
  'ruleScopeKey',
  'sourceId',
  'status',
] as const

const WIRKUNG = ['not_required', 'optionEligibility', 'optionMandate', 'visaMode', 'trustedRuleFact', 'conditional', 'required'] as const

type Status = OfficialTruthAuffrischungErgebnis['status']
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
    validity: { mode: 'travel_date', travelDate: '2026-10-02' },
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

function beideDokumente(): QuellenAbdeckung {
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

function standardRegistry(): QuellenRegistry {
  return registry([amt(QUELLE, 'gov.example'), amt(ANDERE, 'interior.example'), anbieter(ANBIETER, 'provider.example')])
}

function paket(basis: QuellenRegistry, material?: Record<string, unknown>): Record<string, unknown> {
  return huelle({
    registry: basis,
    descriptors: basis.sources.map((source) =>
      deskriptor(
        basis,
        source.sourceId,
        source.sourceId === ANDERE ? abdeckung({ destinationCountryCodes: ['TH'] }) : abdeckung(),
      ),
    ),
    material,
  })
}

function huelle(teil?: {
  request?: unknown
  registry?: unknown
  descriptors?: unknown
  sourceId?: unknown
  material?: Record<string, unknown> | null
  extra?: Record<string, unknown>
}): Record<string, unknown> {
  const basis = standardRegistry()
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

function vergleichen(
  basis: unknown = huelle(),
  extraktion: unknown = null,
  neu: unknown = huelle(),
  basisZeit: unknown = uhr(),
  neuZeit: unknown = uhr(),
): OfficialTruthAuffrischungErgebnis {
  return officialTruthAkzeptierteEvidenceAuffrischungVergleichen(basis, basisZeit, extraktion, neu, neuZeit)
}

function erfolg(ergebnis: OfficialTruthAuffrischungErgebnis) {
  assert.notEqual(ergebnis.status, 'blocked')
  if (ergebnis.status === 'blocked') throw new Error('blockiert')
  assert.deepEqual(Object.keys(ergebnis).sort(), [...ERFOLG_FELDER])
  assert.equal(ergebnis.ruleChange, 'not_asserted')
  assert.equal(ergebnis.laterAnalysisShortCircuit, !ergebnis.contentChanged)
  assert.equal(ergebnis.sourceId, QUELLE)
  return ergebnis
}

function ohneLeak(wert: unknown, extra: readonly string[] = []): void {
  const text = JSON.stringify(wert)
  for (const wort of [...WIRKUNG, URL, SNAPSHOT, ANDERS, GEHEIM, 'canonicalUrl', 'sourceSnapshot', 'sourceContentHash', 'lookupKey', 'https://', '.example']) {
    assert.equal(text.includes(wort), false, wort)
  }
  const hash = evidenceQuellenFingerprint(SNAPSHOT)
  const anderer = evidenceQuellenFingerprint(ANDERS)
  assert.ok(hash)
  assert.ok(anderer)
  assert.equal(text.includes(hash), false)
  assert.equal(text.includes(anderer), false)
  for (const wort of extra) assert.equal(text.includes(wort), false, wort)
}

function kopf(text: string): string {
  const start = text.indexOf('export function officialTruthAkzeptierteEvidenceAuffrischungVergleichen')
  const ende = text.indexOf('): OfficialTruthAuffrischungErgebnis', start)
  assert.ok(start >= 0 && ende > start)
  return text.slice(start, ende)
}

describe('Official Truth accepted Evidence refresh diff', () => {
  test('der Vergleich beweist die Annahme neu und benutzt nur die bestehende Vergleichsfunktion', () => {
    assert.equal(keineWirkung, true)
    const text = datei('lib/readiness/official-truth-refresh-diff.ts')
    const signatur = kopf(text)
    assert.equal(officialTruthAkzeptierteEvidenceAuffrischungVergleichen.length, 5)
    assert.match(signatur, /basisUmschlag: unknown/)
    assert.match(signatur, /basisUhr: unknown/)
    assert.match(signatur, /extraktion: unknown/)
    assert.match(signatur, /neuUmschlag: unknown/)
    assert.match(signatur, /neuUhr: unknown/)
    assert.doesNotMatch(signatur, /EvidenceVersion|bestehend|sourceContentHash/)
    assert.doesNotMatch(text, /\bbestehend\b/)
    assert.match(text, /officialTruthAkzeptierteEvidenceAusAbruf\(basisUmschlag, basisUhr, extraktion\)/)
    assert.match(text, /officialTruthAbgerufenMaterialPruefen\(neuUmschlag, neuUhr\)/)
    assert.match(
      text,
      /evidenceVersionenVergleichen\(angenommen\.evidence, \{ sourceContentHash: neuBeleg\.sourceContentHash \}\)/,
    )
    const seite = text.indexOf("sperre('different_official_page')")
    const registryVergleich = text.indexOf("sperre('different_source_registry')")
    const inhalt = text.lastIndexOf('evidenceVersionenVergleichen(angenommen.evidence, { sourceContentHash: neuBeleg.sourceContentHash })')
    assert.ok(seite > 0 && registryVergleich > seite && inhalt > registryVergleich)
    assert.doesNotMatch(text, /quellenRegistryErstellen|quellenUrlAufloesen|source-registry|source-router|official-truth-server-held|official-truth-source-catalog/)
    assert.doesNotMatch(text, /evidenceKandidatAkzeptieren|evidenceKandidatAusModell|regelKandidatAkzeptieren|regelKandidatErstellen/)
    assert.doesNotMatch(text, /lifecycle\s*:|validationState\s*:|versionId\s*:|lookupKey\s*:/)
    assert.doesNotMatch(text, /not_required|requirementsProviderAus|official_truth_store_accepted_v1|official_truth_source_catalog_v1/)
    assert.doesNotMatch(text, /supabase|openai|Date\.now|new Date\(|fetch\(|node:fs|node:http|node:net/)
    assert.doesNotMatch(text, /from '@\/lib\/readiness\/(engine|provider|official-truth-store-server|official-truth-source-catalog-server|official-truth-candidate-batch)'/)
    assert.doesNotMatch(text, /sherpa|timatic|kayak/i)
    for (const relativ of [
      'lib/readiness/official-truth-retrieved-material.ts',
      'lib/readiness/official-truth-retrieved-candidate-evidence.ts',
      'lib/readiness/official-truth-accepted-evidence.ts',
      'lib/readiness/evidence.ts',
      'lib/readiness/rule-claims.ts',
      'lib/readiness/source-registry.ts',
      'lib/readiness/source-router.ts',
    ]) {
      assert.doesNotMatch(datei(relativ), /official-truth-refresh-diff/, relativ)
    }
    assert.equal(requirementsProviderAus(), null)
  })

  test('gleicher normalisierter Quellentext bleibt unverändert und schaltet die spätere Analyse kurz', () => {
    const request = anfrage()
    const basis = huelle({ request })
    const neu = huelle({
      request,
      material: { sourceSnapshot: 'official page line\r\nunchanged', retrievedAt: SPAETER },
    })
    const vorherBasis = JSON.stringify(basis)
    const vorherNeu = JSON.stringify(neu)
    const ergebnis = vergleichen(basis, null, neu)
    const entscheidung = erfolg(ergebnis)
    const angenommen = officialTruthAkzeptierteEvidenceAusAbruf(basis, uhr(), null)
    const beleg = officialTruthAbgerufenMaterialPruefen(neu, uhr())
    assert.equal(angenommen.status, 'accepted_evidence')
    assert.equal(beleg.status, 'retrieved_material')
    if (angenommen.status !== 'accepted_evidence' || beleg.status !== 'retrieved_material') throw new Error('beleg')
    const vergleich = evidenceVersionenVergleichen(angenommen.evidence, { sourceContentHash: beleg.sourceContentHash })
    assert.equal(vergleich.ok, true)
    if (!vergleich.ok) throw new Error('vergleich')
    assert.equal(entscheidung.status, 'unchanged_source_content')
    assert.equal(entscheidung.contentChanged, false)
    assert.equal(entscheidung.laterAnalysisShortCircuit, true)
    assert.equal(entscheidung.ruleChange, 'not_asserted')
    assert.equal(entscheidung.contentChanged, vergleich.contentChanged)
    assert.equal(entscheidung.laterAnalysisShortCircuit, vergleich.laterAnalysisShortCircuit)
    assert.equal(entscheidung.ruleChange, vergleich.ruleChange)
    assert.equal(entscheidung.baselineVersionId, angenommen.evidence.versionId)
    assert.equal(entscheidung.baselineRequestKey, request.key)
    assert.equal(entscheidung.refreshedRequestKey, beleg.requestKey)
    assert.equal(entscheidung.ruleScopeKey, request.ruleScopeKey)
    assert.equal(entscheidung.ruleScopeKey, beleg.ruleScopeKey)
    assert.notEqual(entscheidung.baselineVersionId, angenommen.evidence.sourceContentHash)
    assert.equal(JSON.stringify(basis), vorherBasis)
    assert.equal(JSON.stringify(neu), vorherNeu)
    assert.equal(Object.isFrozen(ergebnis), true)
    ohneLeak(ergebnis)
  })

  test('ein anderer normalisierter Quellentext ist geändert und bestätigt keine Regel', () => {
    const basis = huelle()
    const neu = huelle({ material: { sourceSnapshot: ANDERS } })
    const ergebnis = vergleichen(basis, { extractionNote: '  Bounded synthetic extraction note.  ' }, neu)
    const entscheidung = erfolg(ergebnis)
    const angenommen = officialTruthAkzeptierteEvidenceAusAbruf(basis, uhr(), {
      extractionNote: '  Bounded synthetic extraction note.  ',
    })
    const beleg = officialTruthAbgerufenMaterialPruefen(neu, uhr())
    assert.equal(angenommen.status, 'accepted_evidence')
    assert.equal(beleg.status, 'retrieved_material')
    if (angenommen.status !== 'accepted_evidence' || beleg.status !== 'retrieved_material') throw new Error('beleg')
    const vergleich = evidenceVersionenVergleichen(angenommen.evidence, { sourceContentHash: beleg.sourceContentHash })
    assert.equal(vergleich.ok, true)
    if (!vergleich.ok) throw new Error('vergleich')
    assert.equal(entscheidung.status, 'changed_source_content')
    assert.equal(entscheidung.contentChanged, true)
    assert.equal(entscheidung.laterAnalysisShortCircuit, false)
    assert.equal(entscheidung.ruleChange, 'not_asserted')
    assert.equal(entscheidung.baselineVersionId, angenommen.evidence.versionId)
    assert.equal(entscheidung.contentChanged, vergleich.contentChanged)
    assert.equal(entscheidung.ruleChange, vergleich.ruleChange)
    const leerzeichen = vergleichen(basis, null, huelle({ material: { sourceSnapshot: `${SNAPSHOT} ` } }))
    assert.equal(leerzeichen.status, 'changed_source_content')
    if (leerzeichen.status !== 'changed_source_content') throw new Error('leerzeichen')
    assert.equal(leerzeichen.ruleChange, 'not_asserted')
    assert.equal(leerzeichen.laterAnalysisShortCircuit, false)
    ohneLeak(ergebnis)
    ohneLeak(leerzeichen)
  })

  test('eine andere Faktart bleibt dieselbe Zelle und wird nicht zur Regelbestätigung', () => {
    const basisAnfrage = anfrage(undefined, 'stay_limit')
    const neuAnfrage = anfrage(undefined, 'passport_validity', { status: 'recheck_needed', reason: 'max_age_exceeded' })
    assert.equal(basisAnfrage.ruleScopeKey, neuAnfrage.ruleScopeKey)
    assert.notEqual(basisAnfrage.key, neuAnfrage.key)
    const ergebnis = vergleichen(huelle({ request: basisAnfrage }), null, huelle({ request: neuAnfrage }))
    const entscheidung = erfolg(ergebnis)
    assert.equal(entscheidung.status, 'unchanged_source_content')
    assert.equal(entscheidung.baselineRequestKey, basisAnfrage.key)
    assert.equal(entscheidung.refreshedRequestKey, neuAnfrage.key)
    assert.notEqual(entscheidung.baselineRequestKey, entscheidung.refreshedRequestKey)
    assert.equal(entscheidung.ruleScopeKey, basisAnfrage.ruleScopeKey)
    assert.equal(entscheidung.ruleChange, 'not_asserted')
    assert.equal(entscheidung.contentChanged, false)
    assert.equal(entscheidung.laterAnalysisShortCircuit, true)
    ohneLeak(ergebnis, ['stay_limit', 'passport_validity', 'max_age_exceeded'])
  })

  test('kein Parameter nimmt eine EvidenceVersion an und ein erfundenes Objekt beeinflusst den Vergleich nicht', () => {
    const basis = huelle()
    const angenommen = officialTruthAkzeptierteEvidenceAusAbruf(basis, uhr(), null)
    assert.equal(angenommen.status, 'accepted_evidence')
    if (angenommen.status !== 'accepted_evidence') throw new Error('annahme')
    const hash = angenommen.evidence.sourceContentHash
    const erfunden = {
      ...angenommen.evidence,
      versionId: `evidence-version:v1:${'ab'.repeat(16)}`,
      sourceContentHash: hash,
      lifecycle: 'accepted',
      validationState: 'valid',
    }
    const formen = [
      erfunden,
      { bestehend: erfunden, neu: huelle({ material: { sourceSnapshot: ANDERS } }) },
      angenommen,
      huelle({ extra: { evidence: erfunden, bestehend: erfunden, sourceContentHash: hash } }),
    ]
    for (const form of formen) {
      const ergebnis = vergleichen(form, null, huelle({ material: { sourceSnapshot: ANDERS } }))
      assert.equal(ergebnis.status, 'blocked', JSON.stringify(ergebnis))
      ohneLeak(ergebnis, [hash, erfunden.versionId])
    }
    const mitHash = huelle({ material: { sourceSnapshot: ANDERS }, extra: { sourceContentHash: hash } })
    const hashErgebnis = vergleichen(basis, null, mitHash)
    assert.deepEqual(hashErgebnis, officialTruthAbgerufenMaterialPruefen(mitHash, uhr()))
    assert.equal(hashErgebnis.status, 'blocked')
    if (hashErgebnis.status !== 'blocked') throw new Error('hash')
    assert.equal(hashErgebnis.reason, 'source_fingerprint_override_forbidden')
    ohneLeak(hashErgebnis, [hash])
    const echt = vergleichen(basis, null, huelle({ material: { sourceSnapshot: ANDERS } }))
    assert.equal(echt.status, 'changed_source_content')
    if (echt.status !== 'changed_source_content') throw new Error('echt')
    assert.equal(echt.baselineVersionId, angenommen.evidence.versionId)
    assert.notEqual(echt.baselineVersionId, erfunden.versionId)
    ohneLeak(echt, [hash, erfunden.versionId])
  })

  test('ein ungültiger Basisumschlag scheitert über die Annahmebrücke', () => {
    const hash = evidenceQuellenFingerprint(SNAPSHOT)
    assert.ok(hash)
    const faelle = [
      null,
      [],
      huelle({ material: null }),
      huelle({ extra: { sourceContentHash: hash } }),
      huelle({ material: { sourceSnapshot: '' } }),
      huelle({ request: { key: 'caller-request' } }),
    ]
    for (const eingabe of faelle) {
      const ergebnis = vergleichen(eingabe, null, huelle())
      const annahme = officialTruthAkzeptierteEvidenceAusAbruf(eingabe, uhr(), null)
      assert.deepEqual(ergebnis, annahme)
      assert.equal(ergebnis.status, 'blocked')
      ohneLeak(ergebnis, hash ? [hash] : [])
    }
  })

  test('eine ungültige oder nur kandidatenhafte Basisextraktion scheitert über die Annahmebrücke', () => {
    const basis = huelle()
    const gebaut = officialTruthKandidatEvidenceAusAbruf(basis, uhr(), null)
    assert.equal(gebaut.status, 'candidate_evidence')
    if (gebaut.status !== 'candidate_evidence') throw new Error('kandidat')
    const faelle: { name: string; eingabe: unknown; extraktion: unknown }[] = [
      { name: 'fremd', eingabe: basis, extraktion: { sourceId: 'caller-source' } },
      { name: 'wirkung', eingabe: basis, extraktion: { result: 'not_required' } },
      { name: 'fenster', eingabe: basis, extraktion: { validFrom: '2026-12-31', validUntil: '2026-01-01' } },
      { name: 'kandidat', eingabe: gebaut.evidence, extraktion: null },
      { name: 'huelle', eingabe: gebaut, extraktion: null },
    ]
    for (const fall of faelle) {
      const ergebnis = vergleichen(fall.eingabe, fall.extraktion, huelle())
      const annahme = officialTruthAkzeptierteEvidenceAusAbruf(fall.eingabe, uhr(), fall.extraktion)
      assert.deepEqual(ergebnis, annahme, fall.name)
      assert.equal(ergebnis.status, 'blocked', fall.name)
      ohneLeak(ergebnis, ['caller-source', 'not_required'])
    }
    assert.equal(gebaut.evidence.lifecycle, 'candidate')
    assert.equal(gebaut.evidence.validationState, 'pending')
  })

  test('eine lizenzierte Basis scheitert über den vertrauenswürdigen Abruf', () => {
    const basis = standardRegistry()
    const eingabe = huelle({
      registry: basis,
      sourceId: ANBIETER,
      descriptors: [deskriptor(basis, ANBIETER)],
      material: { canonicalUrl: 'https://www.provider.example/rules' },
    })
    const ergebnis = vergleichen(eingabe, null, huelle())
    const annahme = officialTruthAkzeptierteEvidenceAusAbruf(eingabe, uhr(), null)
    const beleg = officialTruthAbgerufenMaterialPruefen(eingabe, uhr())
    assert.deepEqual(ergebnis, annahme)
    assert.deepEqual(beleg, annahme)
    assert.deepEqual(ergebnis, { status: 'blocked', reason: 'source_not_official_authority' })
    ohneLeak(ergebnis, ['provider.example'])

    const amtlich = huelle()
    const lizenziert = vergleichen(amtlich, null, eingabe)
    assert.deepEqual(lizenziert, officialTruthAbgerufenMaterialPruefen(eingabe, uhr()))
    assert.deepEqual(lizenziert, { status: 'blocked', reason: 'source_not_official_authority' })
    assert.equal(officialTruthAkzeptierteEvidenceAusAbruf(amtlich, uhr(), null).status, 'accepted_evidence')
    ohneLeak(lizenziert, ['provider.example'])
  })

  test('eine andere amtliche Quelle und eine andere Regelzelle scheitern geschlossen', () => {
    const basisRegistry = standardRegistry()
    const gemeinsame = [
      deskriptor(basisRegistry, QUELLE),
      deskriptor(basisRegistry, ANDERE),
    ]
    const basis = huelle({ registry: basisRegistry, descriptors: gemeinsame })
    const andereQuelle = huelle({
      registry: basisRegistry,
      descriptors: gemeinsame,
      sourceId: ANDERE,
      material: { canonicalUrl: 'https://www.interior.example/rules' },
    })
    const quelle = vergleichen(basis, null, andereQuelle)
    assert.deepEqual(quelle, { status: 'blocked', reason: 'different_official_source' })
    assert.equal(officialTruthAbgerufenMaterialPruefen(andereQuelle, uhr()).status, 'retrieved_material')
    ohneLeak(quelle, ['interior.example', ANDERE])

    const thailand = anfrage({ destinationCountryCode: 'TH' })
    const andereZelle = huelle({
      request: thailand,
      descriptors: [deskriptor(basisRegistry, QUELLE, abdeckung({ destinationCountryCodes: ['TH'] }))],
    })
    const zelleErgebnis = vergleichen(basis, null, andereZelle)
    assert.deepEqual(zelleErgebnis, { status: 'blocked', reason: 'different_rule_scope' })
    assert.equal(officialTruthAbgerufenMaterialPruefen(andereZelle, uhr()).status, 'retrieved_material')
    assert.notEqual(thailand.ruleScopeKey, anfrage().ruleScopeKey)
    ohneLeak(zelleErgebnis, [thailand.ruleScopeKey, 'TH'])

    const dokumente = beideDokumente()
    const serbisch = anfrage({
      credentialOption: {
        mode: 'option',
        documentType: 'passport',
        issuingCountryCode: 'RS',
        relatedCitizenshipCountryCode: 'RS',
      },
    })
    const schweizer = anfrage()
    const pass = vergleichen(
      huelle({ request: schweizer, registry: basisRegistry, descriptors: [deskriptor(basisRegistry, QUELLE, dokumente)] }),
      null,
      huelle({ request: serbisch, registry: basisRegistry, descriptors: [deskriptor(basisRegistry, QUELLE, dokumente)] }),
    )
    assert.deepEqual(pass, { status: 'blocked', reason: 'different_rule_scope' })
    assert.notEqual(serbisch.ruleScopeKey, schweizer.ruleScopeKey)
    ohneLeak(pass)

    const getauscht = anfrage({
      citizenship: { mode: 'required', countryCodes: ['CH', 'RS'] },
    })
    assert.equal(getauscht.ruleScopeKey, schweizer.ruleScopeKey)
    const reihenfolge = vergleichen(
      huelle({ request: schweizer, registry: basisRegistry, descriptors: [deskriptor(basisRegistry, QUELLE, dokumente)] }),
      null,
      huelle({ request: getauscht, registry: basisRegistry, descriptors: [deskriptor(basisRegistry, QUELLE, dokumente)] }),
    )
    const gleich = erfolg(reihenfolge)
    assert.equal(gleich.status, 'unchanged_source_content')
    assert.equal(gleich.ruleScopeKey, schweizer.ruleScopeKey)
    assert.equal(gleich.ruleChange, 'not_asserted')
    ohneLeak(reihenfolge)
  })

  test('ein veränderter neuer Umschlag scheitert über die Belegprüfung', () => {
    const basis = huelle()
    const hash = evidenceQuellenFingerprint(SNAPSHOT)
    assert.ok(hash)
    const faelle: { name: string; eingabe: unknown; zeit: unknown; grund: string }[] = [
      { name: 'hash', eingabe: huelle({ extra: { sourceContentHash: hash } }), zeit: uhr(), grund: 'source_fingerprint_override_forbidden' },
      { name: 'tracking', eingabe: huelle({ material: { canonicalUrl: `${URL}?utm_source=mail` } }), zeit: uhr(), grund: 'tracking_parameter' },
      { name: 'zukunft', eingabe: huelle({ material: { retrievedAt: '2026-10-02T12:00:00.001Z' } }), zeit: uhr(), grund: 'retrieved_at_in_future' },
      { name: 'uhr', eingabe: huelle(), zeit: null, grund: 'invalid_validation_clock' },
      { name: 'leer', eingabe: huelle({ material: { sourceSnapshot: '' } }), zeit: uhr(), grund: 'invalid_source_snapshot' },
      { name: 'person', eingabe: huelle({ extra: { passportNumber: GEHEIM } }), zeit: uhr(), grund: 'sensitive_personal_field' },
    ]
    for (const fall of faelle) {
      const ergebnis = vergleichen(basis, null, fall.eingabe, uhr(), fall.zeit)
      assert.deepEqual(ergebnis, officialTruthAbgerufenMaterialPruefen(fall.eingabe, fall.zeit), fall.name)
      assert.deepEqual(ergebnis, { status: 'blocked', reason: fall.grund }, fall.name)
      ohneLeak(ergebnis, [hash, GEHEIM, 'utm_source', 'passportNumber'])
    }
  })

  test('Erfolg und Fehler enthalten keine Adresse, keinen Text, keinen Hash und keinen privaten Wert', () => {
    const basis = huelle()
    const extraktion = { extractionNote: 'Bounded synthetic extraction note.' }
    const gleich = vergleichen(basis, extraktion, huelle({ material: { sourceSnapshot: SNAPSHOT.replace('\n', '\r\n') } }))
    const anders = vergleichen(basis, extraktion, huelle({ material: { sourceSnapshot: ANDERS } }))
    const gesperrt = vergleichen(huelle({ extra: { email: GEHEIM, canonicalUrl: `${URL}?fbclid=click` } }), { passportNumber: GEHEIM }, huelle())
    assert.equal(gleich.status, 'unchanged_source_content')
    assert.equal(anders.status, 'changed_source_content')
    assert.deepEqual(gesperrt, { status: 'blocked', reason: 'sensitive_personal_field' })
    ohneLeak(gleich, ['Bounded synthetic extraction note.', 'fbclid'])
    ohneLeak(anders, ['Bounded synthetic extraction note.'])
    ohneLeak(gesperrt, ['fbclid', 'email', 'passportNumber'])
    for (const feld of PERSONEN) {
      const imUmschlag = vergleichen(huelle({ extra: { [feld]: GEHEIM } }), null, huelle())
      const inDerExtraktion = vergleichen(basis, { [feld]: GEHEIM }, huelle())
      assert.deepEqual(imUmschlag, { status: 'blocked', reason: 'sensitive_personal_field' }, feld)
      assert.deepEqual(inDerExtraktion, { status: 'blocked', reason: 'sensitive_personal_field' }, feld)
      ohneLeak(imUmschlag, [feld])
      ohneLeak(inDerExtraktion, [feld])
    }
  })

  test('Eingaben bleiben unverändert und der Erfolg trägt keine Regelwirkung', () => {
    const basis = huelle()
    const neu = huelle({ material: { sourceSnapshot: 'official page line\r\nunchanged' } })
    const extraktion = { validFrom: '2026-01-01', extractionNote: '  keep me  ' }
    const basisVorher = JSON.stringify(basis)
    const neuVorher = JSON.stringify(neu)
    const extraktionVorher = JSON.stringify(extraktion)
    const ergebnis = vergleichen(basis, extraktion, neu)
    const entscheidung = erfolg(ergebnis)
    assert.equal(entscheidung.status, 'unchanged_source_content')
    assert.equal(JSON.stringify(basis), basisVorher)
    assert.equal(JSON.stringify(neu), neuVorher)
    assert.equal(JSON.stringify(extraktion), extraktionVorher)
    assert.equal(Object.isFrozen(basis), false)
    const text = JSON.stringify(ergebnis)
    for (const wort of WIRKUNG) assert.equal(text.includes(wort), false, wort)
    assert.equal(text.includes('keep me'), false)
  })

  test('dieselbe Quelle und dieselbe Zelle auf einer anderen kanonischen Seite bleiben gesperrt', () => {
    const basis = huelle()
    const basisBeleg = officialTruthAbgerufenMaterialPruefen(basis, uhr())
    assert.equal(basisBeleg.status, 'retrieved_material')
    if (basisBeleg.status !== 'retrieved_material') throw new Error('basis')
    const seiten = [
      'https://other.gov.example/other-page',
      'https://gov.example/rules',
      'https://www.gov.example/rules/',
      'https://www.gov.example/other',
    ]
    for (const canonicalUrl of seiten) {
      for (const sourceSnapshot of [SNAPSHOT, ANDERS]) {
        const neu = huelle({ material: { canonicalUrl, sourceSnapshot } })
        const neuBeleg = officialTruthAbgerufenMaterialPruefen(neu, uhr())
        assert.equal(neuBeleg.status, 'retrieved_material', canonicalUrl)
        if (neuBeleg.status !== 'retrieved_material') throw new Error('neu')
        assert.equal(neuBeleg.sourceId, basisBeleg.sourceId)
        assert.equal(neuBeleg.ruleScopeKey, basisBeleg.ruleScopeKey)
        assert.equal(neuBeleg.sourceContentHash === basisBeleg.sourceContentHash, sourceSnapshot === SNAPSHOT)
        assert.notEqual(neuBeleg.canonicalUrl, basisBeleg.canonicalUrl)
        const ergebnis = vergleichen(basis, null, neu)
        assert.deepEqual(ergebnis, { status: 'blocked', reason: 'different_official_page' }, canonicalUrl)
        ohneLeak(ergebnis, [canonicalUrl, 'other.gov.example', 'gov.example'])
      }
    }
  })

  test('gleichwertige URL-Normalisierung bleibt dieselbe amtliche Seite', () => {
    const basis = huelle()
    for (const canonicalUrl of ['https://WWW.GOV.EXAMPLE/rules', 'https://www.gov.example:443/rules', '  https://www.gov.example/rules  ']) {
      const neu = huelle({ material: { canonicalUrl, sourceSnapshot: 'official page line\r\nunchanged' } })
      const basisBeleg = officialTruthAbgerufenMaterialPruefen(basis, uhr())
      const neuBeleg = officialTruthAbgerufenMaterialPruefen(neu, uhr())
      assert.equal(basisBeleg.status, 'retrieved_material', canonicalUrl)
      assert.equal(neuBeleg.status, 'retrieved_material', canonicalUrl)
      if (basisBeleg.status !== 'retrieved_material' || neuBeleg.status !== 'retrieved_material') throw new Error('beleg')
      assert.equal(neuBeleg.canonicalUrl, basisBeleg.canonicalUrl)
      assert.equal(neuBeleg.canonicalUrl, URL)
      const entscheidung = erfolg(vergleichen(basis, null, neu))
      assert.equal(entscheidung.status, 'unchanged_source_content')
      assert.equal(entscheidung.contentChanged, false)
      assert.equal(entscheidung.ruleChange, 'not_asserted')
      ohneLeak(entscheidung)
    }

    const mitSlash = huelle({ material: { canonicalUrl: 'https://www.gov.example/rules/' } })
    const punkt = huelle({ material: { canonicalUrl: 'https://www.gov.example/rules/.' } })
    const slashBeleg = officialTruthAbgerufenMaterialPruefen(mitSlash, uhr())
    const punktBeleg = officialTruthAbgerufenMaterialPruefen(punkt, uhr())
    assert.equal(slashBeleg.status, 'retrieved_material')
    assert.equal(punktBeleg.status, 'retrieved_material')
    if (slashBeleg.status !== 'retrieved_material' || punktBeleg.status !== 'retrieved_material') throw new Error('slash')
    assert.equal(punktBeleg.canonicalUrl, slashBeleg.canonicalUrl)
    assert.equal(punktBeleg.canonicalUrl, 'https://www.gov.example/rules/')
    const gleich = erfolg(vergleichen(mitSlash, null, punkt))
    assert.equal(gleich.status, 'unchanged_source_content')
    assert.equal(gleich.ruleChange, 'not_asserted')
    ohneLeak(gleich)
  })

  test('unabhängig gebaute gleiche Registries bleiben dieselbe Identität', () => {
    const grenzeZuerst: QuellenEingabe = {
      sourceId: QUELLE,
      sourceClass: 'official_authority',
      publisherName: 'Example Border Authority',
      authorityName: 'Example Border Authority',
      domains: ['border.example', 'gov.example'],
    }
    const grenzeDanach: QuellenEingabe = { ...grenzeZuerst, domains: ['gov.example', 'border.example'] }
    const innen = amt(ANDERE, 'interior.example')
    const lizenz = anbieter(ANBIETER, 'provider.example')
    const links = registry([grenzeZuerst, innen, lizenz], ['z.example', 'a.example'])
    const rechts = registry([lizenz, innen, grenzeDanach], ['a.example', 'z.example'])
    assert.notEqual(links, rechts)
    assert.notEqual(links.sources, rechts.sources)
    assert.notEqual(links.blockedDomains, rechts.blockedDomains)
    const basis = paket(links)
    const gleich = erfolg(vergleichen(basis, null, paket(rechts, { sourceSnapshot: 'official page line\r\nunchanged' })))
    assert.equal(gleich.status, 'unchanged_source_content')
    assert.equal(gleich.contentChanged, false)
    assert.equal(gleich.ruleChange, 'not_asserted')
    const geaendert = erfolg(vergleichen(basis, null, paket(rechts, { sourceSnapshot: ANDERS })))
    assert.equal(geaendert.status, 'changed_source_content')
    assert.equal(geaendert.contentChanged, true)
    assert.equal(geaendert.laterAnalysisShortCircuit, false)
    assert.equal(geaendert.ruleChange, 'not_asserted')
    ohneLeak(gleich)
    ohneLeak(geaendert, ['border.example'])
  })

  test('eine andere Registry-Identität bleibt gesperrt, auch bei gleichem Quellentext', () => {
    const basisRegistry = standardRegistry()
    const basis = paket(basisRegistry)
    const basisBeleg = officialTruthAbgerufenMaterialPruefen(basis, uhr())
    assert.equal(basisBeleg.status, 'retrieved_material')
    if (basisBeleg.status !== 'retrieved_material') throw new Error('basis')
    const amtlich = [amt(QUELLE, 'gov.example'), amt(ANDERE, 'interior.example'), anbieter(ANBIETER, 'provider.example')] as const
    const faelle: { name: string; registry: QuellenRegistry; grund: 'different_source_registry' | 'source_not_official_authority' | 'unregistered_domain' | 'blocked_domain' | 'invalid_source_plan' }[] = [
      {
        name: 'publisher',
        registry: registry([{ ...amt(QUELLE, 'gov.example'), publisherName: 'Other Border Publisher' }, amt(ANDERE, 'interior.example'), anbieter(ANBIETER, 'provider.example')]),
        grund: 'different_source_registry',
      },
      {
        name: 'authority',
        registry: registry([{ ...amt(QUELLE, 'gov.example'), authorityName: 'Other Border Office' }, amt(ANDERE, 'interior.example'), anbieter(ANBIETER, 'provider.example')]),
        grund: 'different_source_registry',
      },
      {
        name: 'klasse-andere',
        registry: registry([
          amt(QUELLE, 'gov.example'),
          { sourceId: ANDERE, sourceClass: 'licensed_evidence_provider', publisherName: 'Example Interior Publisher', domains: ['interior.example'] },
          anbieter(ANBIETER, 'provider.example'),
        ]),
        grund: 'different_source_registry',
      },
      {
        name: 'klasse-quelle',
        registry: registry([
          { sourceId: QUELLE, sourceClass: 'licensed_evidence_provider', publisherName: 'Example Border Authority', domains: ['gov.example'] },
          amt(ANDERE, 'interior.example'),
          anbieter(ANBIETER, 'provider.example'),
        ]),
        grund: 'source_not_official_authority',
      },
      {
        name: 'domain',
        registry: registry([{ ...amt(QUELLE, 'gov.example'), domains: ['gov.example', 'border.example'] }, amt(ANDERE, 'interior.example'), anbieter(ANBIETER, 'provider.example')]),
        grund: 'different_source_registry',
      },
      {
        name: 'domain-weg',
        registry: registry([amt(QUELLE, 'other.example'), amt(ANDERE, 'interior.example'), anbieter(ANBIETER, 'provider.example')]),
        grund: 'unregistered_domain',
      },
      {
        name: 'blocked',
        registry: registry(amtlich, ['blocked.example']),
        grund: 'different_source_registry',
      },
      {
        name: 'blocked-seite',
        registry: registry(amtlich, ['gov.example']),
        grund: 'blocked_domain',
      },
      {
        name: 'neue-quelle',
        registry: registry([amt(QUELLE, 'gov.example'), amt(ANDERE, 'interior.example'), amt('example-extra-authority', 'extra.example'), anbieter(ANBIETER, 'provider.example')]),
        grund: 'different_source_registry',
      },
    ]
    for (const fall of faelle) {
      for (const sourceSnapshot of [SNAPSHOT, ANDERS]) {
        const neu = paket(fall.registry, { sourceSnapshot })
        const ergebnis = vergleichen(basis, null, neu)
        if (fall.grund === 'different_source_registry') {
          const beleg = officialTruthAbgerufenMaterialPruefen(neu, uhr())
          assert.equal(beleg.status, 'retrieved_material', fall.name)
          if (beleg.status !== 'retrieved_material') throw new Error(fall.name)
          assert.equal(beleg.sourceId, basisBeleg.sourceId, fall.name)
          assert.equal(beleg.ruleScopeKey, basisBeleg.ruleScopeKey, fall.name)
          assert.equal(beleg.canonicalUrl, basisBeleg.canonicalUrl, fall.name)
          assert.deepEqual(ergebnis, { status: 'blocked', reason: 'different_source_registry' }, `${fall.name}:${sourceSnapshot}`)
        } else {
          assert.deepEqual(ergebnis, officialTruthAbgerufenMaterialPruefen(neu, uhr()), fall.name)
          assert.deepEqual(ergebnis, { status: 'blocked', reason: fall.grund }, `${fall.name}:${sourceSnapshot}`)
        }
        assert.notEqual(ergebnis.status, 'unchanged_source_content', fall.name)
        assert.notEqual(ergebnis.status, 'changed_source_content', fall.name)
        ohneLeak(ergebnis, ['Other Border', 'blocked.example', 'extra.example', 'other.example', 'border.example'])
      }
    }

    const veraendert = registry([{ ...amt(QUELLE, 'gov.example'), authorityName: 'Other Border Office' }, amt(ANDERE, 'interior.example'), anbieter(ANBIETER, 'provider.example')])
    const alt = huelle({
      registry: veraendert,
      descriptors: [
        deskriptor(basisRegistry, QUELLE),
        deskriptor(basisRegistry, ANDERE, abdeckung({ destinationCountryCodes: ['TH'] })),
        deskriptor(basisRegistry, ANBIETER),
      ],
    })
    const plan = vergleichen(basis, null, alt)
    assert.deepEqual(plan, officialTruthAbgerufenMaterialPruefen(alt, uhr()))
    assert.deepEqual(plan, { status: 'blocked', reason: 'invalid_source_plan' })
    ohneLeak(plan, ['Other Border'])

    const kopie: QuellenRegistry = {
      blockedDomains: basisRegistry.blockedDomains.map((domain) => domain),
      sources: basisRegistry.sources.map((quelle) => ({
        authorityName: quelle.authorityName,
        domains: quelle.domains.map((domain) => domain),
        publisherName: quelle.publisherName,
        sourceClass: quelle.sourceClass,
        sourceId: quelle.sourceId,
      })),
    }
    assert.notEqual(kopie, basisRegistry)
    assert.notEqual(kopie.sources[0], basisRegistry.sources[0])
    const gleich = erfolg(vergleichen(basis, null, paket(kopie, { sourceSnapshot: SNAPSHOT.replace('\n', '\r\n') })))
    assert.equal(gleich.status, 'unchanged_source_content')
    assert.equal(gleich.ruleChange, 'not_asserted')
    ohneLeak(gleich)

    const gedreht: QuellenRegistry = {
      sources: [...basisRegistry.sources].reverse().map((quelle) => ({
        sourceId: quelle.sourceId,
        sourceClass: quelle.sourceClass,
        publisherName: quelle.publisherName,
        authorityName: quelle.authorityName,
        domains: [...quelle.domains],
      })),
      blockedDomains: [...basisRegistry.blockedDomains],
    }
    assert.notEqual(gedreht.sources[0]?.sourceId, basisRegistry.sources[0]?.sourceId)
    const reihenfolge = vergleichen(basis, null, paket(gedreht))
    assert.equal(officialTruthAbgerufenMaterialPruefen(paket(gedreht), uhr()).status, 'retrieved_material')
    assert.deepEqual(reihenfolge, { status: 'blocked', reason: 'different_source_registry' })
    ohneLeak(reihenfolge)

    const mitDomaenen = registry(
      [{ ...amt(QUELLE, 'gov.example'), domains: ['gov.example', 'border.example'] }, amt(ANDERE, 'interior.example'), anbieter(ANBIETER, 'provider.example')],
      ['a.example', 'z.example'],
    )
    const domaenenGedreht: QuellenRegistry = {
      sources: mitDomaenen.sources.map((quelle) => ({
        sourceId: quelle.sourceId,
        sourceClass: quelle.sourceClass,
        publisherName: quelle.publisherName,
        authorityName: quelle.authorityName,
        domains: [...quelle.domains].reverse(),
      })),
      blockedDomains: [...mitDomaenen.blockedDomains].reverse(),
    }
    const domaenen = vergleichen(paket(mitDomaenen), null, paket(domaenenGedreht, { sourceSnapshot: SNAPSHOT }))
    assert.equal(officialTruthAbgerufenMaterialPruefen(paket(domaenenGedreht), uhr()).status, 'retrieved_material')
    assert.deepEqual(domaenen, { status: 'blocked', reason: 'different_source_registry' })
    ohneLeak(domaenen, ['border.example'])

    const erweitert = {
      sources: basisRegistry.sources,
      blockedDomains: basisRegistry.blockedDomains,
      trust: true,
    }
    const fremd = huelle({
      registry: erweitert,
      descriptors: [
        deskriptor(basisRegistry, QUELLE),
        deskriptor(basisRegistry, ANDERE, abdeckung({ destinationCountryCodes: ['TH'] })),
        deskriptor(basisRegistry, ANBIETER),
      ],
    })
    assert.equal(officialTruthAbgerufenMaterialPruefen(fremd, uhr()).status, 'retrieved_material')
    const extra = vergleichen(basis, null, fremd)
    assert.deepEqual(extra, { status: 'blocked', reason: 'different_source_registry' })
    ohneLeak(extra, ['trust'])

    const andereSeite = registry([{ ...amt(QUELLE, 'gov.example'), publisherName: 'Other Border Publisher' }, amt(ANDERE, 'interior.example'), anbieter(ANBIETER, 'provider.example')])
    const beides = vergleichen(basis, null, paket(andereSeite, { canonicalUrl: 'https://other.gov.example/other-page', sourceSnapshot: SNAPSHOT }))
    assert.deepEqual(beides, { status: 'blocked', reason: 'different_official_page' })
    ohneLeak(beides, ['other.gov.example'])
  })
})
