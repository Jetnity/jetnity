// lib/readiness/official-truth-research-source-routing.test.ts
//
// Eine bestehende Forschungsanfrage wird auf registrierte Behörden gelegt.
// Synthetische *.example-Quellen. Kein Abruf, keine Wirkung, kein Speicher.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import type { OfficialTruthAbdeckungNeuPruefen } from '@/lib/readiness/official-truth-coverage'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { regelScopeAusEvidenceScope, type RegelFaktArt, type RegelScope } from '@/lib/readiness/rule-claims'
import {
  officialTruthRechercheEntscheiden,
  type OfficialTruthRechercheAnfrage,
  type OfficialTruthRechercheGrund,
} from '@/lib/readiness/official-truth-research-request'
import {
  officialTruthRechercheQuellenRouten,
  type OfficialTruthRechercheRoutenEntscheidung,
} from '@/lib/readiness/official-truth-research-source-routing'
import {
  quellenRegistryErstellen,
  type QuellenEingabe,
  type QuellenRegistry,
  type RegistrierteQuelle,
} from '@/lib/readiness/source-registry'
import { type QuellenAbdeckung, type QuellenDeskriptor } from '@/lib/readiness/source-router'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

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
] as const

type SchluesselTiefe<T> = T extends readonly (infer U)[]
  ? SchluesselTiefe<U>
  : T extends object
    ? { [K in keyof T & string]: K | SchluesselTiefe<T[K]> }[keyof T & string]
    : never

type Personenfeld = (typeof VERBOTEN)[number]
type EntscheidungSauber = Extract<SchluesselTiefe<OfficialTruthRechercheRoutenEntscheidung>, Personenfeld> extends never
  ? true
  : never
type WirkungUnmoeglich = Extract<
  OfficialTruthRechercheRoutenEntscheidung extends { status: infer S } ? S : never,
  'required' | 'not_required' | 'conditional'
> extends never
  ? true
  : never

const entscheidungSauber: EntscheidungSauber = true
const wirkungUnmoeglich: WirkungUnmoeglich = true

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

function registry(eingaben: readonly QuellenEingabe[]): QuellenRegistry {
  const ergebnis = quellenRegistryErstellen(eingaben)
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

function ids(entscheidung: OfficialTruthRechercheRoutenEntscheidung): readonly string[] {
  assert.notEqual(entscheidung.status, 'blocked_invalid')
  if (entscheidung.status === 'blocked_invalid') throw new Error('blockiert')
  return entscheidung.sourceIds
}

describe('Official Truth research source routing', () => {
  test('die Entscheidung trägt keine Personenfelder und keine Einreisewirkung', () => {
    assert.equal(entscheidungSauber, true)
    assert.equal(wirkungUnmoeglich, true)
    assert.equal(VERBOTEN.includes('passportNumber'), true)
    const text = datei('lib/readiness/official-truth-research-source-routing.ts')
    assert.match(text, /official_authority/)
    assert.match(text, /quellenRouten/)
    assert.match(text, /officialTruthRechercheEntscheiden/)
    assert.doesNotMatch(text, /not_required/)
    assert.doesNotMatch(text, /officialTruthAbdeckungBewerten/)
    assert.doesNotMatch(text, /evidenceKandidatAusModell|evidenceKandidatAkzeptieren|regelKandidatAkzeptieren|regelKandidatErstellen/)
    assert.doesNotMatch(text, /official_truth_store_accepted_v1|official_truth_source_catalog_v1/)
    assert.doesNotMatch(text, /requirementsProviderAus|quellenUrlAufloesen/)
    assert.doesNotMatch(text, /from '@\/lib\/readiness\/(engine|provider|official-truth-store-server|official-truth-source-catalog-server|evidence|official-truth-candidate-batch)'/)
    assert.doesNotMatch(text, /supabase|openai|Date\.now|fetch\(|https?:|node:fs|node:http|node:net/)
    assert.doesNotMatch(text, /sherpa|timatic|kayak/i)
    assert.equal(requirementsProviderAus(), null)
  })

  test('eine passende Behörde ist eine zulässige Quelle', () => {
    const basis = registry([amt('example-border-authority', 'gov.example')])
    const request = anfrage()
    const entscheidung = officialTruthRechercheQuellenRouten(request, basis, [deskriptor(basis, 'example-border-authority')])
    assert.equal(entscheidung.status, 'eligible_official_sources')
    assert.deepEqual(ids(entscheidung), ['example-border-authority'])
    if (entscheidung.status !== 'eligible_official_sources') throw new Error('status')
    assert.equal(entscheidung.requestKey, request.key)
    assert.equal(entscheidung.ruleScopeKey, request.ruleScopeKey)
    assert.equal(entscheidung.factKind, 'stay_limit')
    assert.deepEqual(entscheidung.researchReason, { status: 'missing' })
    assert.equal(JSON.stringify(entscheidung).includes('http'), false)
    assert.equal(JSON.stringify(entscheidung).includes('gov.example'), false)
    assert.equal(JSON.stringify(entscheidung).includes('not_required'), false)
  })

  test('ein passender lizenzierter Anbieter allein ergibt keine amtliche Quelle', () => {
    const basis = registry([anbieter('example-licensed-provider', 'provider.example')])
    const entscheidung = officialTruthRechercheQuellenRouten(anfrage(), basis, [deskriptor(basis, 'example-licensed-provider')])
    assert.equal(entscheidung.status, 'no_eligible_official_source')
    assert.deepEqual(ids(entscheidung), [])
    assert.equal(JSON.stringify(entscheidung).includes('example-licensed-provider'), false)
    assert.equal(JSON.stringify(entscheidung).includes('not_required'), false)
  })

  test('aus einer gemischten Registry bleibt nur die Behörde', () => {
    const basis = registry([
      anbieter('example-licensed-provider', 'provider.example'),
      amt('example-border-authority', 'gov.example'),
    ])
    const entscheidung = officialTruthRechercheQuellenRouten(anfrage(), basis, [
      deskriptor(basis, 'example-licensed-provider'),
      deskriptor(basis, 'example-border-authority'),
    ])
    assert.equal(entscheidung.status, 'eligible_official_sources')
    assert.deepEqual(ids(entscheidung), ['example-border-authority'])
    assert.equal(JSON.stringify(entscheidung).includes('licensed'), false)
  })

  test('eine Behörde mit anderem Ziel bleibt ohne Quelle', () => {
    const basis = registry([amt('example-border-authority', 'gov.example')])
    const coverage = abdeckung({ destinationCountryCodes: ['TH'] })
    const entscheidung = officialTruthRechercheQuellenRouten(anfrage(), basis, [deskriptor(basis, 'example-border-authority', coverage)])
    assert.equal(entscheidung.status, 'no_eligible_official_source')
    assert.deepEqual(ids(entscheidung), [])

    const andereAnforderung = abdeckung({ requirementTypes: ['transit'] })
    const anforderung = officialTruthRechercheQuellenRouten(anfrage(), basis, [
      deskriptor(basis, 'example-border-authority', andereAnforderung),
    ])
    assert.equal(anforderung.status, 'no_eligible_official_source')
  })

  test('Ziel und Transit bleiben getrennt', () => {
    const basis = registry([
      amt('example-border-authority', 'gov.example'),
      amt('example-transit-authority', 'transit.example'),
    ])
    const ziel = anfrage()
    const transit = anfrage({ destinationCountryCode: null, transitCountryCode: 'SG' })
    const grenze = deskriptor(basis, 'example-border-authority', abdeckung())
    const umstieg = deskriptor(
      basis,
      'example-transit-authority',
      abdeckung({ destinationCountryCodes: [], transitCountryCodes: ['SG'] }),
    )
    const fuerZiel = officialTruthRechercheQuellenRouten(ziel, basis, [umstieg, grenze])
    const fuerTransit = officialTruthRechercheQuellenRouten(transit, basis, [grenze, umstieg])
    assert.deepEqual(ids(fuerZiel), ['example-border-authority'])
    assert.deepEqual(ids(fuerTransit), ['example-transit-authority'])
    assert.equal(JSON.stringify(fuerZiel).includes('SG'), false)
    assert.equal(JSON.stringify(fuerTransit).includes('JP'), false)
  })

  test('Staatsbürgerschaft und Ausstellerland ersetzen einander nicht', () => {
    const basis = registry([
      amt('example-ch-authority', 'ch.example'),
      amt('example-rs-authority', 'rs.example'),
      amt('example-pair-authority', 'pair.example'),
      amt('example-set-authority', 'set.example'),
    ])
    const schweiz = deskriptor(basis, 'example-ch-authority', abdeckung())
    const serbien = deskriptor(
      basis,
      'example-rs-authority',
      abdeckung({
        citizenship: { mode: 'exact', countryCodes: ['RS'] },
        documents: { mode: 'exact', options: [{ documentType: 'passport', issuingCountryCode: 'RS' }] },
      }),
    )
    const gekreuzt = deskriptor(
      basis,
      'example-pair-authority',
      abdeckung({
        documents: { mode: 'exact', options: [{ documentType: 'passport', issuingCountryCode: 'RS' }] },
      }),
    )
    const fremderAussteller = anfrage({
      credentialOption: {
        mode: 'option',
        documentType: 'passport',
        issuingCountryCode: 'RS',
        relatedCitizenshipCountryCode: 'CH',
      },
    })
    const getrennt = officialTruthRechercheQuellenRouten(fremderAussteller, basis, [schweiz, serbien, gekreuzt])
    assert.deepEqual(ids(getrennt), ['example-pair-authority'])

    const serbischerPass = anfrage({
      credentialOption: {
        mode: 'option',
        documentType: 'passport',
        issuingCountryCode: 'RS',
        relatedCitizenshipCountryCode: 'RS',
      },
    })
    const nurSerbien = officialTruthRechercheQuellenRouten(serbischerPass, basis, [schweiz])
    assert.equal(nurSerbien.status, 'no_eligible_official_source')

    const ohneDokument = anfrage({
      citizenship: { mode: 'required', countryCodes: ['CH', 'RS'] },
      credentialOption: { mode: 'not_applicable' },
    })
    const halbeMenge = deskriptor(
      basis,
      'example-ch-authority',
      abdeckung({
        citizenship: { mode: 'exact', countryCodes: ['CH'] },
        documents: { mode: 'not_applicable' },
      }),
    )
    const volleMenge = deskriptor(
      basis,
      'example-set-authority',
      abdeckung({
        citizenship: { mode: 'exact', countryCodes: ['RS', 'CH'] },
        documents: { mode: 'not_applicable' },
      }),
    )
    const menge = officialTruthRechercheQuellenRouten(ohneDokument, basis, [halbeMenge, volleMenge])
    assert.deepEqual(ids(menge), ['example-set-authority'])

    const wohnsitz = anfrage({ residence: { mode: 'required', countryCode: 'DE' } })
    const wohnsitzQuelle = deskriptor(
      basis,
      'example-ch-authority',
      abdeckung({ residence: { mode: 'exact', countryCodes: ['CH'] } }),
    )
    const wohnsitzTreffer = deskriptor(
      basis,
      'example-set-authority',
      abdeckung({ residence: { mode: 'exact', countryCodes: ['DE'] } }),
    )
    const wohnung = officialTruthRechercheQuellenRouten(wohnsitz, basis, [wohnsitzQuelle, wohnsitzTreffer])
    assert.deepEqual(ids(wohnung), ['example-set-authority'])
  })

  test('eine andere Dokumentoption bleibt ohne Quelle', () => {
    const basis = registry([amt('example-border-authority', 'gov.example')])
    const personalausweis = abdeckung({
      documents: { mode: 'exact', options: [{ documentType: 'national_id', issuingCountryCode: 'CH' }] },
    })
    const andererPass = abdeckung({
      documents: { mode: 'exact', options: [{ documentType: 'passport', issuingCountryCode: 'RS' }] },
    })
    const ausweis = officialTruthRechercheQuellenRouten(anfrage(), basis, [deskriptor(basis, 'example-border-authority', personalausweis)])
    const pass = officialTruthRechercheQuellenRouten(anfrage(), basis, [deskriptor(basis, 'example-border-authority', andererPass)])
    assert.equal(ausweis.status, 'no_eligible_official_source')
    assert.equal(pass.status, 'no_eligible_official_source')
  })

  test('die Reihenfolge ist stabil und unabhängig von der Eingabe', () => {
    const basis = registry([
      amt('example-zeta-authority', 'zeta.example'),
      anbieter('example-licensed-provider', 'provider.example'),
      amt('example-alpha-authority', 'alpha.example'),
    ])
    const alpha = deskriptor(basis, 'example-alpha-authority')
    const zeta = deskriptor(basis, 'example-zeta-authority')
    const lizenziert = deskriptor(basis, 'example-licensed-provider')
    const rueckwaerts = officialTruthRechercheQuellenRouten(anfrage(), basis, [zeta, lizenziert, alpha])
    const vorwaerts = officialTruthRechercheQuellenRouten(anfrage(), basis, [alpha, zeta])
    const doppelt = officialTruthRechercheQuellenRouten(anfrage(), basis, [zeta, alpha, alpha, zeta])
    assert.deepEqual(ids(rueckwaerts), ['example-alpha-authority', 'example-zeta-authority'])
    assert.deepEqual(ids(vorwaerts), ids(rueckwaerts))
    assert.deepEqual(ids(doppelt), ids(rueckwaerts))
    assert.equal(JSON.stringify(rueckwaerts).includes('licensed'), false)
  })

  test('Faktart und Forschungsgrund ändern die Quellen nicht und bleiben Teil der Anfrage', () => {
    const basis = registry([amt('example-border-authority', 'gov.example')])
    const plan = [deskriptor(basis, 'example-border-authority')]
    const luecke = anfrage(undefined, 'stay_limit', { status: 'missing' })
    const neu = anfrage(undefined, 'visa_options', { status: 'recheck_needed', reason: 'max_age_exceeded' })
    const links = officialTruthRechercheQuellenRouten(luecke, basis, plan)
    const rechts = officialTruthRechercheQuellenRouten(neu, basis, plan)
    assert.deepEqual(ids(links), ids(rechts))
    assert.notEqual(luecke.key, neu.key)
    if (links.status === 'blocked_invalid' || rechts.status === 'blocked_invalid') throw new Error('blockiert')
    assert.equal(links.requestKey, luecke.key)
    assert.equal(rechts.requestKey, neu.key)
    assert.equal(links.factKind, 'stay_limit')
    assert.equal(rechts.factKind, 'visa_options')
    assert.deepEqual(links.researchReason, { status: 'missing' })
    assert.deepEqual(rechts.researchReason, { status: 'recheck_needed', reason: 'max_age_exceeded' })
    const gruende: OfficialTruthAbdeckungNeuPruefen[] = ['valid_from_in_future', 'valid_until_elapsed', 'max_age_exceeded']
    for (const reason of gruende) {
      const request = anfrage(undefined, 'stay_limit', { status: 'recheck_needed', reason })
      const entscheidung = officialTruthRechercheQuellenRouten(request, basis, plan)
      assert.deepEqual(ids(entscheidung), ['example-border-authority'])
      if (entscheidung.status === 'blocked_invalid') throw new Error('blockiert')
      assert.deepEqual(entscheidung.researchReason, { status: 'recheck_needed', reason })
    }
  })

  test('ein verfälschter Scope oder eine verfälschte Anfrage wird blockiert', () => {
    const basis = registry([amt('example-border-authority', 'gov.example')])
    const plan = [deskriptor(basis, 'example-border-authority')]
    const request = anfrage()
    const vorher = JSON.stringify(request)

    const anderesZiel = {
      ...request,
      scope: { ...request.scope, destinationCountryCode: 'TH' },
    }
    const ziel = officialTruthRechercheQuellenRouten(anderesZiel, basis, plan)
    assert.deepEqual(ziel, { status: 'blocked_invalid', reason: 'scope_mismatch' })
    assert.equal(JSON.stringify(ziel).includes('TH'), false)

    const andererSchluessel = `${request.key.slice(0, -1)}${request.key.endsWith('a') ? 'b' : 'a'}`
    const schluessel = officialTruthRechercheQuellenRouten({ ...request, key: andererSchluessel }, basis, plan)
    assert.deepEqual(schluessel, { status: 'blocked_invalid', reason: 'invalid_request' })

    const andereFaktart = officialTruthRechercheQuellenRouten({ ...request, factKind: 'visa_options' }, basis, plan)
    assert.deepEqual(andereFaktart, { status: 'blocked_invalid', reason: 'invalid_request' })

    const andereKlasse = officialTruthRechercheQuellenRouten(
      { ...request, evidenceClass: 'licensed_evidence_provider' },
      basis,
      plan,
    )
    assert.deepEqual(andereKlasse, { status: 'blocked_invalid', reason: 'invalid_request' })
    assert.equal(JSON.stringify(andereKlasse).includes('licensed'), false)

    const reisender = officialTruthRechercheQuellenRouten(
      { userId: 'person-1', passportNumber: 'X123', destinationCountryCode: 'JP' },
      basis,
      plan,
    )
    assert.deepEqual(reisender, { status: 'blocked_invalid', reason: 'invalid_request' })
    assert.equal(JSON.stringify(reisender).includes('person-1'), false)
    assert.equal(JSON.stringify(reisender).includes('X123'), false)

    const mitAdresse = officialTruthRechercheQuellenRouten(
      { ...request, scope: { ...request.scope, canonicalUrl: 'https://www.gov.example/visa' } },
      basis,
      plan,
    )
    assert.equal(mitAdresse.status, 'blocked_invalid')
    assert.equal(JSON.stringify(mitAdresse).includes('gov.example'), false)
    assert.equal(JSON.stringify(mitAdresse).includes('https'), false)

    const unregistriert = {
      source: {
        ...plan[0].source,
        publisherName: 'Other Publisher',
      },
      coverage: abdeckung(),
    }
    const fremd = officialTruthRechercheQuellenRouten(request, basis, [unregistriert])
    assert.deepEqual(fremd, { status: 'blocked_invalid', reason: 'invalid_source_plan' })

    const leer = abdeckung({ destinationCountryCodes: [], transitCountryCodes: [] })
    const ungueltig = officialTruthRechercheQuellenRouten(request, basis, [
      deskriptor(basis, 'example-border-authority'),
      deskriptor(basis, 'example-border-authority', leer),
    ])
    assert.deepEqual(ungueltig, { status: 'blocked_invalid', reason: 'invalid_source_plan' })
    assert.equal(JSON.stringify(request), vorher)
  })

  test('fehlende Abdeckung bleibt ohne Quelle und ohne Wirkung', () => {
    const basis = registry([amt('example-border-authority', 'gov.example')])
    const leer = officialTruthRechercheQuellenRouten(anfrage(), basis, [])
    assert.deepEqual(leer.status, 'no_eligible_official_source')
    assert.deepEqual(ids(leer), [])
    assert.equal(JSON.stringify(leer).includes('unknown'), false)
    assert.equal(JSON.stringify(leer).includes('not_required'), false)
    assert.equal('officialResult' in leer, false)
    assert.equal('canonicalUrl' in leer, false)
  })
})
