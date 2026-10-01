// lib/readiness/official-truth-retrieved-material.test.ts
//
// Beleg für bereits abgerufenes amtliches Material.
// Synthetische *.example-Quellen. Kein Abruf, keine Wirkung, kein Speicher.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { regelScopeAusEvidenceScope, type RegelFaktArt, type RegelScope } from '@/lib/readiness/rule-claims'
import {
  officialTruthRechercheEntscheiden,
  type OfficialTruthRechercheAnfrage,
  type OfficialTruthRechercheGrund,
} from '@/lib/readiness/official-truth-research-request'
import {
  officialTruthAbgerufenMaterialPruefen,
  type OfficialTruthAbgerufenBeleg,
  type OfficialTruthAbrufErgebnis,
} from '@/lib/readiness/official-truth-retrieved-material'
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

const VERBOTEN = [
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
] as const

type SchluesselTiefe<T> = T extends readonly (infer U)[]
  ? SchluesselTiefe<U>
  : T extends object
    ? { [K in keyof T & string]: K | SchluesselTiefe<T[K]> }[keyof T & string]
    : never

type Personenfeld = (typeof VERBOTEN)[number]
type BelegSauber = Extract<SchluesselTiefe<OfficialTruthAbgerufenBeleg>, Personenfeld> extends never ? true : never
type WirkungUnmoeglich = Extract<
  OfficialTruthAbrufErgebnis extends { status: infer S } ? S : never,
  'required' | 'not_required' | 'conditional' | 'candidate' | 'accepted'
> extends never
  ? true
  : never

const belegSauber: BelegSauber = true
const wirkungUnmoeglich: WirkungUnmoeglich = true

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
  const material = teil?.material === null
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
    descriptors: teil?.descriptors ?? [deskriptor(basis, QUELLE), deskriptor(basis, ANDERE, abdeckung({ destinationCountryCodes: ['TH'] })), deskriptor(basis, ANBIETER)],
    sourceId: teil && 'sourceId' in teil ? teil.sourceId : QUELLE,
    material,
    ...teil?.extra,
  }
}

function pruefen(eingabe: unknown, instant = UHR): OfficialTruthAbrufErgebnis {
  return officialTruthAbgerufenMaterialPruefen(eingabe, uhr(instant))
}

function beleg(ergebnis: OfficialTruthAbrufErgebnis): OfficialTruthAbgerufenBeleg {
  assert.equal(ergebnis.status, 'retrieved_material')
  if (ergebnis.status !== 'retrieved_material') throw new Error('blockiert')
  return ergebnis
}

function grund(ergebnis: OfficialTruthAbrufErgebnis): string {
  assert.equal(ergebnis.status, 'blocked')
  if (ergebnis.status !== 'blocked') throw new Error('beleg')
  return ergebnis.reason
}

describe('Official Truth retrieved material receipt', () => {
  test('der Beleg trägt keine Personenfelder und keinen Wirkungsstatus', () => {
    assert.equal(belegSauber, true)
    assert.equal(wirkungUnmoeglich, true)
    const text = datei('lib/readiness/official-truth-retrieved-material.ts')
    assert.match(text, /officialTruthRechercheQuellenRouten/)
    assert.match(text, /quellenUrlAufloesen/)
    assert.match(text, /evidenceQuellenFingerprint/)
    assert.doesNotMatch(text, /evidenceKandidatAusModell|evidenceKandidatAkzeptieren|regelKandidatAkzeptieren|regelKandidatErstellen/)
    assert.doesNotMatch(text, /official_truth_store_accepted_v1|official_truth_source_catalog_v1/)
    assert.doesNotMatch(text, /requirementsProviderAus/)
    assert.doesNotMatch(text, /from '@\/lib\/readiness\/(engine|provider|official-truth-store-server|official-truth-source-catalog-server|official-truth-candidate-batch)'/)
    assert.doesNotMatch(text, /supabase|openai|Date\.now|fetch\(|node:fs|node:http|node:net/)
    assert.doesNotMatch(text, /not_required/)
    assert.doesNotMatch(text, /sherpa|timatic|kayak/i)
    assert.equal(requirementsProviderAus(), null)
  })

  test('amtliche Quelle, registrierte URL und gültige Zeit ergeben einen Beleg', () => {
    const request = anfrage()
    const eingabe = huelle({ request })
    const vorher = JSON.stringify(eingabe)
    const ergebnis = beleg(pruefen(eingabe))
    const adresse = 'https://www.gov.example/rules'
    const aufgeloest = quellenUrlAufloesen(eingabe.registry as QuellenRegistry, adresse)
    assert.equal(aufgeloest.ok, true)
    if (!aufgeloest.ok) throw new Error('url')
    assert.equal(ergebnis.requestKey, request.key)
    assert.equal(ergebnis.ruleScopeKey, request.ruleScopeKey)
    assert.equal(ergebnis.sourceId, QUELLE)
    assert.equal(ergebnis.canonicalUrl, aufgeloest.canonicalUrl)
    assert.equal(ergebnis.retrievedAt, ABGERUFEN)
    assert.equal(ergebnis.sourceContentHash, evidenceQuellenFingerprint(SNAPSHOT))
    assert.deepEqual(ergebnis.material, {
      canonicalUrl: aufgeloest.canonicalUrl,
      retrievedAt: ABGERUFEN,
      sourceSnapshot: SNAPSHOT,
    })
    assert.equal(JSON.stringify(ergebnis).includes('not_required'), false)
    assert.equal(JSON.stringify(ergebnis).includes('candidate'), false)
    assert.equal(JSON.stringify(eingabe), vorher)
  })

  test('ein lizenzierter Anbieter bleibt blockiert', () => {
    const ergebnis = pruefen(huelle({
      sourceId: ANBIETER,
      material: { canonicalUrl: 'https://www.provider.example/rules' },
    }))
    assert.equal(grund(ergebnis), 'source_not_official_authority')
    assert.equal(JSON.stringify(ergebnis).includes(ANBIETER), false)
    assert.equal(JSON.stringify(ergebnis).includes('not_required'), false)
  })

  test('eine nicht zulässige Behörde bleibt blockiert', () => {
    const ergebnis = pruefen(huelle({
      sourceId: ANDERE,
      material: { canonicalUrl: 'https://www.interior.example/rules' },
    }))
    assert.equal(grund(ergebnis), 'source_not_eligible')
    assert.equal(JSON.stringify(ergebnis).includes('interior.example'), false)
  })

  test('eine URL einer anderen registrierten Quelle bleibt blockiert', () => {
    const ergebnis = pruefen(huelle({
      sourceId: QUELLE,
      material: { canonicalUrl: 'https://www.interior.example/rules' },
    }))
    const basis = registry([amt(QUELLE, 'gov.example'), amt(ANDERE, 'interior.example')])
    const beide = pruefen(huelle({
      registry: basis,
      descriptors: [deskriptor(basis, QUELLE), deskriptor(basis, ANDERE)],
      sourceId: QUELLE,
      material: { canonicalUrl: 'https://www.interior.example/rules' },
    }))
    assert.equal(grund(ergebnis), 'url_source_mismatch')
    assert.equal(grund(beide), 'url_source_mismatch')
    assert.equal(JSON.stringify(beide).includes('interior.example'), false)
  })

  test('unregistrierte, gesperrte, lokale, unsichere und Credential-URLs bleiben blockiert', () => {
    const geheim = 'credential-secret-91f3'
    const basis = registry([amt(QUELLE, 'gov.example')], ['blocked.example'])
    const faelle = [
      ['https://evil.example/rules', 'unregistered_domain'],
      ['https://www.blocked.example/rules', 'blocked_domain'],
      ['https://localhost/rules', 'invalid_url'],
      ['https://intranet.local/rules', 'invalid_url'],
      ['http://www.gov.example/rules', 'insecure_scheme'],
      [`https://user:${geheim}@www.gov.example/rules`, 'credentials'],
    ] as const
    for (const [canonicalUrl, reason] of faelle) {
      const ergebnis = pruefen(huelle({
        registry: basis,
        descriptors: [deskriptor(basis, QUELLE)],
        material: { canonicalUrl },
      }))
      assert.equal(grund(ergebnis), reason, canonicalUrl.startsWith('https://user:') ? 'credentials' : canonicalUrl)
      assert.equal(JSON.stringify(ergebnis).includes(geheim), false)
      assert.equal(JSON.stringify(ergebnis).includes('user:'), false)
    }
  })

  test('Tracking-Parameter werden ohne Wert zurückgewiesen', () => {
    const geheim = 'tracking-secret-91f3'
    const namen = ['utm_source', 'UTM_MEDIUM', 'gclid', 'GCLID', 'dclid', 'fbclid', 'Fbclid', 'msclkid', 'gbraid', 'wbraid', 'mc_cid', 'mc_eid']
    for (const name of namen) {
      const ergebnis = pruefen(huelle({
        material: { canonicalUrl: `https://www.gov.example/rules?${name}=${geheim}&lang=en` },
      }))
      assert.equal(grund(ergebnis), 'tracking_parameter', name)
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(geheim), false, name)
      assert.equal(text.includes(name), false, name)
      assert.equal(text.includes('utm_'), false, name)
    }
  })

  test('funktionale lang- und ref-Parameter bleiben erlaubt', () => {
    const adresse = 'https://www.gov.example/rules?lang=en&ref=portal'
    const ergebnis = beleg(pruefen(huelle({ material: { canonicalUrl: adresse } })))
    const aufgeloest = quellenUrlAufloesen(huelle().registry as QuellenRegistry, adresse)
    assert.equal(aufgeloest.ok, true)
    if (!aufgeloest.ok) throw new Error('url')
    assert.equal(ergebnis.canonicalUrl, aufgeloest.canonicalUrl)
    assert.equal(ergebnis.canonicalUrl.includes('lang=en'), true)
    assert.equal(ergebnis.canonicalUrl.includes('ref=portal'), true)
    assert.equal(ergebnis.material.canonicalUrl, ergebnis.canonicalUrl)
  })

  test('zukünftige, ungültige und nicht-Z-Zeiten scheitern an der injizierten Uhr', () => {
    const ungueltig = [
      '2026-10-01T12:00:00.001Z',
      '2026-10-01T12:00:00+00:00',
      '2026-10-01T12:00:00.000z',
      '2026-10-01',
      ` ${ABGERUFEN}`,
      '2023-02-29T00:00:00.000Z',
      '2026-10-01T24:00:00.000Z',
      '',
      null,
    ]
    for (const retrievedAt of ungueltig) {
      const ergebnis = pruefen(huelle({ material: { retrievedAt: retrievedAt as string } }))
      const reason = retrievedAt === '2026-10-01T12:00:00.001Z' ? 'retrieved_at_in_future' : 'invalid_retrieved_at'
      assert.equal(grund(ergebnis), reason, String(retrievedAt))
    }
    assert.equal(beleg(pruefen(huelle({ material: { retrievedAt: UHR } }))).retrievedAt, UHR)
    assert.equal(beleg(pruefen(huelle({ material: { retrievedAt: '2024-02-29T00:00:00.000Z' } }))).retrievedAt, '2024-02-29T00:00:00.000Z')
    assert.equal(grund(officialTruthAbgerufenMaterialPruefen(huelle(), null)), 'invalid_validation_clock')
    assert.equal(grund(officialTruthAbgerufenMaterialPruefen(huelle(), () => new Date(Number.NaN))), 'invalid_validation_clock')
    assert.equal(grund(officialTruthAbgerufenMaterialPruefen(huelle(), () => { throw new Error('clock') })), 'invalid_validation_clock')
    assert.equal(JSON.stringify(pruefen(huelle({ material: { retrievedAt: '2026-10-01T12:00:00.001Z' } }))).includes('12:00:00.001'), false)
  })

  test('leerer und zu großer Quellentext scheitert ohne Inhaltsecho', () => {
    const geheim = 'snapshot-secret-91f3'
    const leer = pruefen(huelle({ material: { sourceSnapshot: '' } }))
    assert.equal(grund(leer), 'invalid_source_snapshot')
    const gross = pruefen(huelle({ material: { sourceSnapshot: `${geheim}${'x'.repeat(65_537)}` } }))
    assert.equal(grund(gross), 'invalid_source_snapshot')
    assert.equal(JSON.stringify(gross).includes(geheim), false)
    const grenze = 'y'.repeat(65_536)
    const gehalten = beleg(pruefen(huelle({ material: { sourceSnapshot: grenze } })))
    assert.equal(gehalten.sourceContentHash, evidenceQuellenFingerprint(grenze))
    assert.equal(gehalten.material.sourceSnapshot, grenze)
  })

  test('ein mitgelieferter Hash oder eine zweite Provenienz wird abgelehnt', () => {
    const hash = evidenceQuellenFingerprint(SNAPSHOT)
    assert.ok(hash)
    for (const feld of ['sourceContentHash', 'contentHash', 'content'] as const) {
      const imMaterial = pruefen(huelle({ material: { [feld]: hash } }))
      assert.equal(grund(imMaterial), 'source_fingerprint_override_forbidden', feld)
      assert.equal(JSON.stringify(imMaterial).includes(String(hash)), false, feld)
    }
    for (const feld of ['sourceContentHash', 'contentHash', 'content', 'sourceSnapshot'] as const) {
      const imUmschlag = pruefen(huelle({ extra: { [feld]: hash } }))
      assert.equal(grund(imUmschlag), 'source_fingerprint_override_forbidden', feld)
      assert.equal(JSON.stringify(imUmschlag).includes(String(hash)), false, feld)
    }
    for (const feld of ['canonicalUrl', 'retrievedAt'] as const) {
      const ergebnis = pruefen(huelle({ extra: { [feld]: feld === 'canonicalUrl' ? 'https://www.gov.example/rules' : ABGERUFEN } }))
      assert.equal(grund(ergebnis), 'provenance_override_forbidden', feld)
      assert.equal(JSON.stringify(ergebnis).includes('gov.example'), false, feld)
    }
    const route = pruefen(huelle({ extra: { sourceIds: [QUELLE] } }))
    assert.equal(grund(route), 'invalid_envelope')
  })

  test('persönliche Schlüssel werden ohne Wert zurückgewiesen', () => {
    const geheim = 'personal-secret-91f3'
    for (const feld of VERBOTEN) {
      const ergebnis = pruefen(huelle({ extra: { [feld]: geheim } }))
      assert.equal(grund(ergebnis), 'sensitive_personal_field', feld)
      assert.equal(JSON.stringify(ergebnis).includes(geheim), false, feld)
      assert.equal(JSON.stringify(ergebnis).includes(feld), false, feld)
    }
    const notiz = pruefen(huelle({ material: { travellerNote: geheim } }))
    assert.equal(grund(notiz), 'sensitive_personal_field')
    assert.equal(JSON.stringify(notiz).includes(geheim), false)
  })

  test('eine veränderte Anfrage wird neu belegt und nicht aus einer mitgebrachten Route übernommen', () => {
    const request = anfrage()
    const verbogen = { ...request, key: `research-request:v1:${'ab'.repeat(32)}` }
    assert.equal(grund(pruefen(huelle({ request: verbogen }))), 'invalid_request')
    const scope = { ...request.scope, destinationCountryCode: 'TH' }
    assert.equal(grund(pruefen(huelle({ request: { ...request, scope } }))), 'scope_mismatch')
    assert.equal(grund(pruefen(huelle({ registry: { sources: [] } }))), 'invalid_source_plan')
    assert.equal(grund(pruefen(null)), 'invalid_envelope')
  })

  test('der Umschlag bleibt bei einer Sperre unverändert', () => {
    const eingabe = huelle({ material: { canonicalUrl: 'https://www.gov.example/rules?gclid=tracking-secret-91f3' } })
    const vorher = JSON.stringify(eingabe)
    const ergebnis = pruefen(eingabe)
    assert.equal(grund(ergebnis), 'tracking_parameter')
    assert.equal(JSON.stringify(eingabe), vorher)
    assert.equal(JSON.stringify(ergebnis).includes('tracking-secret-91f3'), false)
  })

  test('Zeilenenden ändern den gespeicherten Text nicht und den Fingerprint nur nach der bestehenden Regel', () => {
    const text = 'official page line\r\nunchanged'
    const ergebnis = beleg(pruefen(huelle({ material: { sourceSnapshot: text } })))
    assert.equal(ergebnis.material.sourceSnapshot, text)
    assert.equal(ergebnis.sourceContentHash, evidenceQuellenFingerprint(text))
    assert.equal(ergebnis.sourceContentHash, evidenceQuellenFingerprint(SNAPSHOT))
  })
})
