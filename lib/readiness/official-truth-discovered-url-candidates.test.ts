// lib/readiness/official-truth-discovered-url-candidates.test.ts
//
// URL-Kandidatinnen gegen synthetische *.example-Behörden.
// Keine Suche, kein Abruf, keine Wirkung, kein Speicher.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { requirementsProviderAus } from '@/lib/readiness/provider'
import { regelScopeAusEvidenceScope, type RegelFaktArt, type RegelScope } from '@/lib/readiness/rule-claims'
import {
  officialTruthRechercheEntscheiden,
  type OfficialTruthRechercheAnfrage,
  type OfficialTruthRechercheGrund,
} from '@/lib/readiness/official-truth-research-request'
import {
  officialTruthEntdeckteUrlKandidatenPruefen,
  type OfficialTruthUrlKandidat,
  type OfficialTruthUrlKandidatenErgebnis,
} from '@/lib/readiness/official-truth-discovered-url-candidates'
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

const QUELLE = 'example-border-authority'
const ANDERE = 'example-interior-authority'
const DRITTE = 'example-zeta-authority'
const ANBIETER = 'example-licensed-provider'
const ADRESSE = 'https://www.gov.example/rules'

const VERBOTEN = [
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
] as const

type SchluesselTiefe<T> = T extends readonly (infer U)[]
  ? SchluesselTiefe<U>
  : T extends object
    ? { [K in keyof T & string]: K | SchluesselTiefe<T[K]> }[keyof T & string]
    : never

type Personenfeld = (typeof VERBOTEN)[number]
type KandidatSauber = Extract<SchluesselTiefe<OfficialTruthUrlKandidat>, Personenfeld> extends never ? true : never
type WirkungUnmoeglich = Extract<
  OfficialTruthUrlKandidatenErgebnis extends { status: infer S } ? S : never,
  'required' | 'not_required' | 'conditional' | 'candidate' | 'accepted'
> extends never
  ? true
  : never
type NurPaar = keyof OfficialTruthUrlKandidat extends 'sourceId' | 'canonicalUrl' ? true : never

const kandidatSauber: KandidatSauber = true
const wirkungUnmoeglich: WirkungUnmoeglich = true
const nurPaar: NurPaar = true

function datei(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
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

function amt(sourceId: string, domains: readonly string[]): QuellenEingabe {
  return {
    sourceId,
    sourceClass: 'official_authority',
    publisherName: 'Example Border Authority',
    authorityName: 'Example Border Authority',
    domains,
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

function paar(sourceId: string, url: string): { sourceId: string; url: string } {
  return { sourceId, url }
}

function huelle(teil?: {
  request?: unknown
  registry?: unknown
  descriptors?: unknown
  candidates?: unknown
  extra?: Record<string, unknown>
}): Record<string, unknown> {
  const basis = registry([
    amt(QUELLE, ['gov.example']),
    amt(ANDERE, ['interior.example']),
    amt(DRITTE, ['zeta.example']),
    anbieter(ANBIETER, 'provider.example'),
  ])
  return {
    request: teil?.request ?? anfrage(),
    registry: teil?.registry ?? basis,
    descriptors: teil?.descriptors ?? [
      deskriptor(basis, QUELLE),
      deskriptor(basis, DRITTE),
      deskriptor(basis, ANDERE, abdeckung({ destinationCountryCodes: ['TH'] })),
      deskriptor(basis, ANBIETER),
    ],
    candidates: teil && 'candidates' in teil ? teil.candidates : [paar(QUELLE, ADRESSE)],
    ...teil?.extra,
  }
}

function pruefen(eingabe: unknown): OfficialTruthUrlKandidatenErgebnis {
  return officialTruthEntdeckteUrlKandidatenPruefen(eingabe)
}

function bestanden(ergebnis: OfficialTruthUrlKandidatenErgebnis): readonly OfficialTruthUrlKandidat[] {
  assert.equal(ergebnis.status, 'validated_url_candidates')
  if (ergebnis.status !== 'validated_url_candidates') throw new Error('blockiert')
  return ergebnis.candidates
}

function grund(ergebnis: OfficialTruthUrlKandidatenErgebnis): string {
  assert.equal(ergebnis.status, 'blocked')
  if (ergebnis.status !== 'blocked') throw new Error('kandidat')
  return ergebnis.reason
}

function kanonisch(basis: QuellenRegistry, url: string): string {
  const aufgeloest = quellenUrlAufloesen(basis, url)
  assert.equal(aufgeloest.ok, true)
  if (!aufgeloest.ok) throw new Error('url')
  return aufgeloest.canonicalUrl
}

describe('Official Truth discovered URL candidate validator', () => {
  test('das Ergebnis trägt keine Personenfelder, keine Rangfolge und keine Einreisewirkung', () => {
    assert.equal(kandidatSauber, true)
    assert.equal(wirkungUnmoeglich, true)
    assert.equal(nurPaar, true)
    assert.equal(officialTruthEntdeckteUrlKandidatenPruefen.length, 1)
    const text = datei('lib/readiness/official-truth-discovered-url-candidates.ts')
    assert.match(text, /officialTruthRechercheAusfuehrungsplan\(satz\.request, satz\.registry, satz\.descriptors\)/)
    assert.match(text, /quellenUrlAufloesen/)
    assert.match(text, /official_authority/)
    assert.doesNotMatch(text, /satz\.plan|eingabe\.plan|executionPlan/)
    assert.doesNotMatch(text, /quellenRouten\(/)
    assert.doesNotMatch(text, /officialTruthRechercheQuellenRouten|officialTruthRechercheEntscheiden/)
    assert.doesNotMatch(text, /evidenceKandidatAusModell|evidenceKandidatAkzeptieren|regelKandidatAkzeptieren|regelKandidatErstellen/)
    assert.doesNotMatch(text, /official_truth_store_accepted_v1|official_truth_source_catalog_v1/)
    assert.doesNotMatch(text, /requirementsProviderAus/)
    assert.doesNotMatch(text, /from '@\/lib\/readiness\/(engine|provider|evidence|official-truth-store-server|official-truth-source-catalog-server|official-truth-candidate-batch|official-truth-retrieved-material|official-truth-research-request|official-truth-research-source-routing)'/)
    assert.doesNotMatch(text, /supabase|openai|Date\.now|fetch\(|https?:|node:fs|node:http|node:net/)
    assert.doesNotMatch(text, /not_required/)
    assert.doesNotMatch(text, /sherpa|timatic|kayak/i)
    assert.equal(requirementsProviderAus(), null)
  })

  test('eine amtliche URL auf der Hostliste besteht', () => {
    const basis = registry([amt(QUELLE, ['gov.example'])])
    const request = anfrage()
    const eingabe = huelle({
      request,
      registry: basis,
      descriptors: [deskriptor(basis, QUELLE)],
      candidates: [paar(QUELLE, ADRESSE), paar(QUELLE, 'https://portal.gov.example/guide')],
    })
    const vorher = JSON.stringify(eingabe)
    const kandidaten = bestanden(pruefen(eingabe))
    assert.deepEqual(kandidaten, [
      { sourceId: QUELLE, canonicalUrl: kanonisch(basis, 'https://portal.gov.example/guide') },
      { sourceId: QUELLE, canonicalUrl: kanonisch(basis, ADRESSE) },
    ])
    assert.equal(JSON.stringify(eingabe), vorher)
    const ergebnis = pruefen(eingabe)
    if (ergebnis.status !== 'validated_url_candidates') throw new Error('status')
    assert.deepEqual(Object.keys(ergebnis).sort(), ['candidates', 'status'])
    assert.deepEqual(Object.keys(ergebnis.candidates[0]).sort(), ['canonicalUrl', 'sourceId'])
    const text = JSON.stringify(ergebnis)
    assert.equal(text.includes('publisherName'), false)
    assert.equal(text.includes('authorityName'), false)
    assert.equal(text.includes('score'), false)
    assert.equal(text.includes('rank'), false)
    assert.equal(text.includes('not_required'), false)
    assert.equal('domains' in ergebnis.candidates[0], false)

    const andereFaktart = anfrage(undefined, 'visa_options', { status: 'recheck_needed', reason: 'max_age_exceeded' })
    const gleicheHosts = bestanden(pruefen(huelle({
      request: andereFaktart,
      registry: basis,
      descriptors: [deskriptor(basis, QUELLE)],
      candidates: [paar(QUELLE, ADRESSE)],
    })))
    assert.equal(gleicheHosts[0].canonicalUrl, kandidaten[1].canonicalUrl)
  })

  test('zwei Kandidatinnen bleiben nach Kennung und URL sortiert', () => {
    const basis = registry([amt(QUELLE, ['gov.example']), amt(DRITTE, ['zeta.example'])])
    const deskriptoren = [deskriptor(basis, DRITTE), deskriptor(basis, QUELLE)]
    const rueckwaerts = [
      paar(DRITTE, 'https://zeta.example/b'),
      paar(QUELLE, 'https://www.gov.example/b'),
      paar(DRITTE, 'https://zeta.example/a'),
      paar(QUELLE, 'https://gov.example/a'),
    ]
    const vorwaerts = [...rueckwaerts].reverse()
    const erwartet = [
      { sourceId: QUELLE, canonicalUrl: kanonisch(basis, 'https://gov.example/a') },
      { sourceId: QUELLE, canonicalUrl: kanonisch(basis, 'https://www.gov.example/b') },
      { sourceId: DRITTE, canonicalUrl: kanonisch(basis, 'https://zeta.example/a') },
      { sourceId: DRITTE, canonicalUrl: kanonisch(basis, 'https://zeta.example/b') },
    ]
    assert.deepEqual(bestanden(pruefen(huelle({ registry: basis, descriptors: deskriptoren, candidates: rueckwaerts }))), erwartet)
    assert.deepEqual(bestanden(pruefen(huelle({ registry: basis, descriptors: deskriptoren, candidates: vorwaerts }))), erwartet)
  })

  test('ein lizenzierter Anbieter und eine Quelle ausserhalb des Plans scheitern', () => {
    const lizenziert = pruefen(huelle({ candidates: [paar(ANBIETER, 'https://www.provider.example/rules')] }))
    assert.equal(grund(lizenziert), 'licensed_provider')
    assert.equal(JSON.stringify(lizenziert).includes(ANBIETER), false)
    assert.equal(JSON.stringify(lizenziert).includes('provider.example'), false)
    assert.equal(JSON.stringify(lizenziert).includes('not_required'), false)

    const nurLizenz = registry([anbieter(ANBIETER, 'provider.example')])
    const ohneAmt = pruefen(huelle({
      registry: nurLizenz,
      descriptors: [deskriptor(nurLizenz, ANBIETER)],
      candidates: [paar(ANBIETER, 'https://www.provider.example/rules')],
    }))
    assert.equal(grund(ohneAmt), 'no_eligible_official_source')
    assert.equal(JSON.stringify(ohneAmt).includes(ANBIETER), false)
    assert.equal(JSON.stringify(ohneAmt).includes('provider.example'), false)

    const fremd = pruefen(huelle({ candidates: [paar(ANDERE, 'https://www.interior.example/rules')] }))
    assert.equal(grund(fremd), 'source_not_in_plan')
    assert.equal(JSON.stringify(fremd).includes(ANDERE), false)
    assert.equal(JSON.stringify(fremd).includes('interior.example'), false)
  })

  test('eine URL einer anderen Quelle wird nicht umgehängt', () => {
    const ergebnis = pruefen(huelle({ candidates: [paar(QUELLE, 'https://zeta.example/rules')] }))
    assert.equal(grund(ergebnis), 'another_source_url')
    assert.equal(JSON.stringify(ergebnis).includes('zeta.example'), false)
    assert.equal('canonicalUrl' in ergebnis, false)
  })

  test('unregistrierte, gesperrte, lokale, unsichere und Credential-URLs scheitern', () => {
    const geheim = 'credential-secret-91f3'
    const basis = registry([amt(QUELLE, ['gov.example'])], ['blocked.example'])
    const faelle = [
      ['https://evil.example/rules', 'unregistered_domain'],
      ['https://www.blocked.example/rules', 'blocked_domain'],
      ['https://localhost/rules', 'invalid_url'],
      ['https://intranet.local/rules', 'invalid_url'],
      ['http://www.gov.example/rules', 'insecure_scheme'],
      [`https://user:${geheim}@www.gov.example/rules`, 'credentials'],
    ] as const
    for (const [url, reason] of faelle) {
      const ergebnis = pruefen(huelle({
        registry: basis,
        descriptors: [deskriptor(basis, QUELLE)],
        candidates: [paar(QUELLE, url)],
      }))
      assert.equal(grund(ergebnis), reason, url.startsWith('https://user:') ? 'credentials' : url)
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(geheim), false)
      assert.equal(text.includes('user:'), false)
      assert.equal('canonicalUrl' in ergebnis, false)
    }
  })

  test('Tracking-Parameter scheitern ohne Wert und ohne bereinigte URL', () => {
    const geheim = 'tracking-secret-91f3'
    const namen = ['utm_source', 'UTM_MEDIUM', 'gclid', 'GCLID', 'dclid', 'fbclid', 'Fbclid', 'msclkid', 'gbraid', 'wbraid', 'mc_cid', 'mc_eid']
    for (const name of namen) {
      const ergebnis = pruefen(huelle({
        candidates: [paar(QUELLE, `https://www.gov.example/rules?${name}=${geheim}&lang=en`)],
      }))
      assert.equal(grund(ergebnis), 'tracking_parameter', name)
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(geheim), false, name)
      assert.equal(text.includes(name), false, name)
      assert.equal(text.includes('utm_'), false, name)
      assert.equal(text.includes('lang='), false, name)
      assert.equal('canonicalUrl' in ergebnis, false)
    }
  })

  test('funktionale lang- und ref-Parameter bleiben in der kanonischen URL', () => {
    const basis = registry([amt(QUELLE, ['gov.example'])])
    const url = 'https://www.gov.example/rules?lang=en&ref=portal'
    const kandidaten = bestanden(pruefen(huelle({
      registry: basis,
      descriptors: [deskriptor(basis, QUELLE)],
      candidates: [paar(QUELLE, url)],
    })))
    assert.equal(kandidaten[0].canonicalUrl, kanonisch(basis, url))
    assert.equal(kandidaten[0].canonicalUrl.includes('lang=en'), true)
    assert.equal(kandidaten[0].canonicalUrl.includes('ref=portal'), true)
  })

  test('dieselbe kanonische URL wird nicht still verschmolzen', () => {
    const gleich = pruefen(huelle({
      candidates: [paar(QUELLE, ADRESSE), paar(QUELLE, ADRESSE)],
    }))
    assert.equal(grund(gleich), 'duplicate_canonical_url')
    assert.equal(JSON.stringify(gleich).includes('gov.example'), false)

    const andereSchreibweise = pruefen(huelle({
      candidates: [paar(QUELLE, ADRESSE), paar(QUELLE, 'HTTPS://WWW.GOV.EXAMPLE/rules')],
    }))
    assert.equal(grund(andereSchreibweise), 'duplicate_canonical_url')
    assert.equal(JSON.stringify(andereSchreibweise).includes('gov.example'), false)

    const verschiedenePfade = bestanden(pruefen(huelle({
      candidates: [paar(QUELLE, 'https://www.gov.example/b'), paar(QUELLE, 'https://www.gov.example/a')],
    })))
    assert.equal(verschiedenePfade.length, 2)
    assert.equal(verschiedenePfade[0].canonicalUrl.endsWith('/a'), true)
    assert.equal(verschiedenePfade[1].canonicalUrl.endsWith('/b'), true)
  })

  test('mehr als 16 Kandidatinnen scheitern, 16 bleiben stehen', () => {
    const basis = registry([amt(QUELLE, ['gov.example'])])
    const bis = (anzahl: number) => Array.from({ length: anzahl }, (_, index) => paar(QUELLE, `https://www.gov.example/p/${index}`))
    const gehalten = bestanden(pruefen(huelle({
      registry: basis,
      descriptors: [deskriptor(basis, QUELLE)],
      candidates: bis(16),
    })))
    assert.equal(gehalten.length, 16)
    const zuViel = pruefen(huelle({
      registry: basis,
      descriptors: [deskriptor(basis, QUELLE)],
      candidates: bis(17),
    }))
    assert.equal(grund(zuViel), 'too_many_candidates')
    assert.equal(JSON.stringify(zuViel).includes('gov.example'), false)
  })

  test('eine verfälschte Anfrage, Registry oder Deskriptorenliste scheitert über den Plan', () => {
    const basis = registry([amt(QUELLE, ['gov.example'])])
    const request = anfrage()
    const deskriptoren = [deskriptor(basis, QUELLE)]
    const kandidaten = [paar(QUELLE, ADRESSE)]
    const vorher = JSON.stringify(huelle({ request, registry: basis, descriptors: deskriptoren, candidates: kandidaten }))

    const schluessel = pruefen(huelle({
      request: { ...request, key: `${request.key.slice(0, -1)}${request.key.endsWith('a') ? 'b' : 'a'}` },
      registry: basis,
      descriptors: deskriptoren,
      candidates: kandidaten,
    }))
    assert.equal(grund(schluessel), 'invalid_request')
    assert.equal(JSON.stringify(schluessel).includes('gov.example'), false)

    const ziel = pruefen(huelle({
      request: { ...request, scope: { ...request.scope, destinationCountryCode: 'TH' } },
      registry: basis,
      descriptors: deskriptoren,
      candidates: kandidaten,
    }))
    assert.equal(grund(ziel), 'scope_mismatch')
    assert.equal(JSON.stringify(ziel).includes('TH'), false)

    const gesperrt = registry([amt(QUELLE, ['gov.example'])], ['gov.example'])
    const registrySperre = pruefen(huelle({
      registry: gesperrt,
      descriptors: [deskriptor(gesperrt, QUELLE)],
      candidates: kandidaten,
    }))
    assert.equal(grund(registrySperre), 'invalid_source_plan')
    assert.equal(JSON.stringify(registrySperre).includes('gov.example'), false)

    const fremderVerlag = pruefen(huelle({
      registry: basis,
      descriptors: [{
        source: { ...deskriptor(basis, QUELLE).source, publisherName: 'Other Publisher' },
        coverage: abdeckung(),
      }],
      candidates: kandidaten,
    }))
    assert.equal(grund(fremderVerlag), 'invalid_source_plan')

    const mitPlan = pruefen(huelle({
      registry: basis,
      descriptors: [deskriptor(basis, QUELLE, abdeckung({ destinationCountryCodes: ['TH'] }))],
      candidates: kandidaten,
      extra: {
        plan: {
          status: 'ready',
          sources: [{ sourceId: QUELLE, domains: ['gov.example'] }],
        },
      },
    }))
    assert.equal(grund(mitPlan), 'invalid_envelope')
    assert.equal(JSON.stringify(mitPlan).includes('gov.example'), false)
    assert.equal(JSON.stringify(mitPlan).includes('ready'), false)

    const ohnePlanfeld = pruefen(huelle({
      registry: basis,
      descriptors: [deskriptor(basis, QUELLE, abdeckung({ destinationCountryCodes: ['TH'] }))],
      candidates: kandidaten,
    }))
    assert.equal(grund(ohnePlanfeld), 'no_eligible_official_source')
    assert.equal(JSON.stringify(ohnePlanfeld).includes('gov.example'), false)

    const serbischerPass = anfrage({
      credentialOption: {
        mode: 'option',
        documentType: 'passport',
        issuingCountryCode: 'RS',
        relatedCitizenshipCountryCode: 'RS',
      },
    })
    const andereOption = pruefen(huelle({
      request: serbischerPass,
      registry: basis,
      descriptors: deskriptoren,
      candidates: kandidaten,
    }))
    assert.equal(grund(andereOption), 'no_eligible_official_source')
    assert.equal(JSON.stringify(andereOption).includes('gov.example'), false)
    assert.equal(JSON.stringify(andereOption).includes('not_required'), false)

    assert.equal(JSON.stringify(huelle({ request, registry: basis, descriptors: deskriptoren, candidates: kandidaten })), vorher)
    assert.equal(grund(pruefen(null)), 'invalid_envelope')
    assert.equal(grund(pruefen({ status: 'ready', sources: [{ sourceId: QUELLE, domains: ['gov.example'] }] })), 'invalid_envelope')
  })

  test('persönliche Schlüssel und missgestaltete Paare scheitern ohne Wert', () => {
    const geheim = 'personal-secret-91f3'
    for (const feld of VERBOTEN) {
      const ergebnis = pruefen(huelle({ extra: { [feld]: geheim } }))
      assert.equal(grund(ergebnis), 'sensitive_personal_field', feld)
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(geheim), false, feld)
      assert.equal(text.includes(feld), false, feld)
    }
    const imPaar = pruefen(huelle({
      candidates: [{ sourceId: QUELLE, url: ADRESSE, passportNumber: geheim }],
    }))
    assert.equal(grund(imPaar), 'sensitive_personal_field')
    assert.equal(JSON.stringify(imPaar).includes(geheim), false)

    const notiz = pruefen(huelle({ candidates: [{ sourceId: QUELLE, url: ADRESSE, note: geheim }] }))
    assert.equal(grund(notiz), 'sensitive_personal_field')
    assert.equal(JSON.stringify(notiz).includes(geheim), false)

    assert.equal(grund(pruefen(huelle({ candidates: 'https://www.gov.example/rules' }))), 'invalid_candidates')
    assert.equal(grund(pruefen(huelle({ candidates: [{ url: ADRESSE }] }))), 'invalid_candidate')
    assert.equal(grund(pruefen(huelle({ candidates: [{ sourceId: QUELLE }] }))), 'invalid_candidate')
    assert.equal(grund(pruefen(huelle({ candidates: [{ sourceId: 1, url: ADRESSE }] }))), 'invalid_candidate')
    const leer = bestanden(pruefen(huelle({ candidates: [] })))
    assert.deepEqual(leer, [])
  })

  test('eine Sperre lässt die Eingabe unverändert', () => {
    const eingabe = huelle({
      candidates: [paar(QUELLE, 'https://www.gov.example/rules?gclid=tracking-secret-91f3')],
    })
    const vorher = JSON.stringify(eingabe)
    const ergebnis = pruefen(eingabe)
    assert.equal(grund(ergebnis), 'tracking_parameter')
    assert.equal(JSON.stringify(eingabe), vorher)
    assert.equal(JSON.stringify(ergebnis).includes('tracking-secret-91f3'), false)
  })
})
