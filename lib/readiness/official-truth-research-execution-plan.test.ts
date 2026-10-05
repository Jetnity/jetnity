// lib/readiness/official-truth-research-execution-plan.test.ts
//
// Der Allowlist-Plan nennt nur synthetische *.example-Behörden und ihre
// registrierten Hostnamen. Kein Abruf, keine Wirkung, kein Speicher.

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
  officialTruthRechercheAusfuehrungsplan,
  type OfficialTruthRechercheAusfuehrungsplan,
  type OfficialTruthRechercheQuellenplan,
} from '@/lib/readiness/official-truth-research-execution-plan'
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
type PlanSauber = Extract<SchluesselTiefe<OfficialTruthRechercheAusfuehrungsplan>, Personenfeld> extends never ? true : never
type WirkungUnmoeglich = Extract<
  OfficialTruthRechercheAusfuehrungsplan extends { status: infer S } ? S : never,
  'required' | 'not_required' | 'conditional'
> extends never
  ? true
  : never

const planSauber: PlanSauber = true
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

function bereit(plan: OfficialTruthRechercheAusfuehrungsplan): readonly OfficialTruthRechercheQuellenplan[] {
  assert.equal(plan.status, 'ready')
  if (plan.status !== 'ready') throw new Error('status')
  return plan.sources
}

function text(plan: OfficialTruthRechercheAusfuehrungsplan): string {
  return JSON.stringify(plan)
}

describe('Official Truth research execution allowlist plan', () => {
  test('der Plan trägt keine Personenfelder, keine Adresse und keine Einreisewirkung', () => {
    assert.equal(planSauber, true)
    assert.equal(wirkungUnmoeglich, true)
    assert.equal(VERBOTEN.includes('passportNumber'), true)
    const quelleText = datei('lib/readiness/official-truth-research-execution-plan.ts')
    assert.match(quelleText, /officialTruthRechercheQuellenRouten/)
    assert.match(quelleText, /domaeneNormalisieren/)
    assert.match(quelleText, /official_authority/)
    assert.doesNotMatch(quelleText, /not_required/)
    assert.doesNotMatch(quelleText, /quellenRouten\(/)
    assert.doesNotMatch(quelleText, /officialTruthRechercheEntscheiden/)
    assert.doesNotMatch(quelleText, /evidenceKandidatAusModell|evidenceKandidatAkzeptieren|regelKandidatAkzeptieren|regelKandidatErstellen/)
    assert.doesNotMatch(quelleText, /official_truth_store_accepted_v1|official_truth_source_catalog_v1/)
    assert.doesNotMatch(quelleText, /requirementsProviderAus|quellenUrlAufloesen/)
    assert.match(quelleText, /import type \{ OfficialTruthRechercheGrund \} from '@\/lib\/readiness\/official-truth-research-request'/)
    assert.doesNotMatch(quelleText, /from '@\/lib\/readiness\/(engine|provider|official-truth-store-server|official-truth-source-catalog-server|evidence|official-truth-candidate-batch)'/)
    assert.doesNotMatch(quelleText, /supabase|openai|Date\.now|fetch\(|https?:|node:fs|node:http|node:net/)
    assert.doesNotMatch(quelleText, /sherpa|timatic|kayak/i)
    assert.equal(requirementsProviderAus(), null)
  })

  test('eine passende Behörde ergibt Kennung und registrierte Hostnamen', () => {
    const basis = registry([amt('example-border-authority', ['gov.example'])])
    const request = anfrage()
    const plan = officialTruthRechercheAusfuehrungsplan(request, basis, [deskriptor(basis, 'example-border-authority')])
    assert.deepEqual(bereit(plan), [{ sourceId: 'example-border-authority', domains: ['gov.example'] }])
    if (plan.status !== 'ready') throw new Error('status')
    assert.equal(plan.requestKey, request.key)
    assert.equal(plan.ruleScopeKey, request.ruleScopeKey)
    assert.equal(plan.factKind, 'stay_limit')
    assert.deepEqual(plan.researchReason, { status: 'missing' })
    assert.equal(text(plan).includes('http'), false)
    assert.equal(text(plan).includes('/'), false)
    assert.equal(text(plan).includes('?'), false)
    assert.equal(text(plan).includes('not_required'), false)
    assert.equal('sourceClass' in plan.sources[0], false)
    assert.equal('publisherName' in plan.sources[0], false)

    const neu = anfrage(undefined, 'visa_options', { status: 'recheck_needed', reason: 'max_age_exceeded' })
    const gleicherHost = officialTruthRechercheAusfuehrungsplan(neu, basis, [deskriptor(basis, 'example-border-authority')])
    assert.deepEqual(bereit(gleicherHost), bereit(plan))
    if (gleicherHost.status !== 'ready') throw new Error('status')
    assert.equal(gleicherHost.factKind, 'visa_options')
    assert.equal(gleicherHost.requestKey, neu.key)
    assert.notEqual(gleicherHost.requestKey, plan.requestKey)
  })

  test('zwei Behörden bleiben stabil sortiert', () => {
    const basis = registry([
      amt('example-zeta-authority', ['zeta.example']),
      amt('example-alpha-authority', ['alpha.example']),
    ])
    const alpha = deskriptor(basis, 'example-alpha-authority')
    const zeta = deskriptor(basis, 'example-zeta-authority')
    const rueckwaerts = officialTruthRechercheAusfuehrungsplan(anfrage(), basis, [zeta, alpha])
    const vorwaerts = officialTruthRechercheAusfuehrungsplan(anfrage(), basis, [alpha, zeta])
    const erwartet = [
      { sourceId: 'example-alpha-authority', domains: ['alpha.example'] },
      { sourceId: 'example-zeta-authority', domains: ['zeta.example'] },
    ]
    assert.deepEqual(bereit(rueckwaerts), erwartet)
    assert.deepEqual(bereit(vorwaerts), erwartet)
  })

  test('ein lizenzierter Anbieter allein ergibt keinen Plan', () => {
    const basis = registry([anbieter('example-licensed-provider', 'provider.example')])
    const request = anfrage()
    const plan = officialTruthRechercheAusfuehrungsplan(request, basis, [deskriptor(basis, 'example-licensed-provider')])
    assert.equal(plan.status, 'no_eligible_official_source')
    if (plan.status !== 'no_eligible_official_source') throw new Error('status')
    assert.equal(plan.requestKey, request.key)
    assert.equal(plan.ruleScopeKey, request.ruleScopeKey)
    assert.equal('sources' in plan, false)
    assert.equal(text(plan).includes('example-licensed-provider'), false)
    assert.equal(text(plan).includes('provider.example'), false)
    assert.equal(text(plan).includes('not_required'), false)
  })

  test('aus einer gemischten Registry bleibt nur die Behörde', () => {
    const basis = registry([
      anbieter('example-licensed-provider', 'provider.example'),
      amt('example-border-authority', ['gov.example']),
    ])
    const plan = officialTruthRechercheAusfuehrungsplan(anfrage(), basis, [
      deskriptor(basis, 'example-licensed-provider'),
      deskriptor(basis, 'example-border-authority'),
    ])
    assert.deepEqual(bereit(plan), [{ sourceId: 'example-border-authority', domains: ['gov.example'] }])
    assert.equal(text(plan).includes('example-licensed-provider'), false)
    assert.equal(text(plan).includes('provider.example'), false)
    assert.equal(text(plan).includes('licensed'), false)
  })

  test('eine gesperrte oder verfälschte Registry verwirft den Plan', () => {
    const request = anfrage()
    const gesperrt = registry([amt('example-border-authority', ['gov.example'])], ['gov.example'])
    const gesperrterPlan = officialTruthRechercheAusfuehrungsplan(request, gesperrt, [
      deskriptor(gesperrt, 'example-border-authority'),
    ])
    assert.deepEqual(gesperrterPlan, { status: 'blocked_invalid', reason: 'invalid_source_plan' })
    assert.equal(text(gesperrterPlan).includes('gov.example'), false)

    const unterlabel = registry([amt('example-border-authority', ['sub.gov.example'])], ['gov.example'])
    const unterlabelPlan = officialTruthRechercheAusfuehrungsplan(request, unterlabel, [
      deskriptor(unterlabel, 'example-border-authority'),
    ])
    assert.deepEqual(unterlabelPlan, { status: 'blocked_invalid', reason: 'invalid_source_plan' })
    assert.equal(text(unterlabelPlan).includes('sub.gov.example'), false)
    assert.equal(text(unterlabelPlan).includes('gov.example'), false)
    assert.equal(text(unterlabelPlan).includes('*'), false)

    const kind = registry([amt('example-border-authority', ['gov.example', 'other.example'])], ['blocked.gov.example'])
    const kindPlan = officialTruthRechercheAusfuehrungsplan(request, kind, [deskriptor(kind, 'example-border-authority')])
    assert.deepEqual(kindPlan, { status: 'blocked_invalid', reason: 'invalid_source_plan' })
    assert.equal(text(kindPlan).includes('gov.example'), false)
    assert.equal(text(kindPlan).includes('other.example'), false)
    assert.equal(text(kindPlan).includes('blocked.gov.example'), false)
    assert.equal(text(kindPlan).includes('*'), false)
    assert.equal(text(kindPlan).includes('/'), false)
    assert.equal(text(kindPlan).includes('?'), false)

    const unbeteiligt = registry([amt('example-border-authority', ['gov.example'])], ['other.example'])
    const unbeteiligtPlan = officialTruthRechercheAusfuehrungsplan(request, unbeteiligt, [
      deskriptor(unbeteiligt, 'example-border-authority'),
    ])
    assert.deepEqual(bereit(unbeteiligtPlan), [{ sourceId: 'example-border-authority', domains: ['gov.example'] }])
    assert.equal(text(unbeteiligtPlan).includes('other.example'), false)
    assert.equal(text(unbeteiligtPlan).includes('*'), false)
    assert.equal(text(unbeteiligtPlan).includes('/'), false)
    assert.equal(text(unbeteiligtPlan).includes('?'), false)

    const amtlich = quelle(registry([amt('example-border-authority', ['gov.example'])]), 'example-border-authority')
    const unnormalisiert = {
      ...amtlich,
      domains: ['Gov.Example'],
    }
    const rohRegistry = { sources: [unnormalisiert], blockedDomains: [] }
    const rohPlan = officialTruthRechercheAusfuehrungsplan(request, rohRegistry, [
      { source: unnormalisiert, coverage: abdeckung() },
    ])
    assert.deepEqual(rohPlan, { status: 'blocked_invalid', reason: 'invalid_source_plan' })
    assert.equal(text(rohPlan).includes('Gov.Example'), false)
    assert.equal(text(rohPlan).includes('gov.example'), false)

    const doppelt = { sources: [amtlich, { ...amtlich }], blockedDomains: [] }
    const doppeltPlan = officialTruthRechercheAusfuehrungsplan(request, doppelt, [{ source: amtlich, coverage: abdeckung() }])
    assert.deepEqual(doppeltPlan, { status: 'blocked_invalid', reason: 'invalid_source_plan' })
    assert.equal(text(doppeltPlan).includes('gov.example'), false)

    const wiederholteDomain = { ...amtlich, domains: ['gov.example', 'gov.example'] }
    const wiederholtePlan = officialTruthRechercheAusfuehrungsplan(request, { sources: [wiederholteDomain], blockedDomains: [] }, [
      { source: wiederholteDomain, coverage: abdeckung() },
    ])
    assert.deepEqual(wiederholtePlan, { status: 'blocked_invalid', reason: 'invalid_source_plan' })
    assert.equal(text(wiederholtePlan).includes('gov.example'), false)

    const leereDomain = { ...amtlich, domains: [] }
    const leererPlan = officialTruthRechercheAusfuehrungsplan(request, { sources: [leereDomain], blockedDomains: [] }, [
      { source: leereDomain, coverage: abdeckung() },
    ])
    assert.deepEqual(leererPlan, { status: 'blocked_invalid', reason: 'invalid_source_plan' })

    const liste = registry([amt('example-border-authority', ['gov.example'])])
    const listeTamper = {
      sources: liste.sources,
      blockedDomains: ['not a host'],
    }
    const listePlan = officialTruthRechercheAusfuehrungsplan(request, listeTamper, [
      deskriptor(liste, 'example-border-authority'),
    ])
    assert.deepEqual(listePlan, { status: 'blocked_invalid', reason: 'invalid_source_plan' })
    assert.equal(text(listePlan).includes('gov.example'), false)

    const fremd = officialTruthRechercheAusfuehrungsplan(request, liste, [
      {
        source: { ...deskriptor(liste, 'example-border-authority').source, publisherName: 'Other Publisher' },
        coverage: abdeckung(),
      },
    ])
    assert.deepEqual(fremd, { status: 'blocked_invalid', reason: 'invalid_source_plan' })
  })

  test('mehrere registrierte Hostnamen bleiben normalisiert und sortiert', () => {
    const basis = registry([
      amt('example-border-authority', ['www.border.example', 'border.example', 'notes.border.example']),
    ])
    const plan = officialTruthRechercheAusfuehrungsplan(anfrage(), basis, [deskriptor(basis, 'example-border-authority')])
    assert.deepEqual(bereit(plan), [
      {
        sourceId: 'example-border-authority',
        domains: ['border.example', 'notes.border.example', 'www.border.example'],
      },
    ])

    const geordnet = quelle(basis, 'example-border-authority')
    const verdreht = {
      ...geordnet,
      domains: ['www.border.example', 'border.example', 'notes.border.example'],
    }
    const rohRegistry = { sources: [verdreht], blockedDomains: [] as const }
    const vorher = JSON.stringify(rohRegistry)
    const sortiert = officialTruthRechercheAusfuehrungsplan(anfrage(), rohRegistry, [
      { source: verdreht, coverage: abdeckung() },
    ])
    assert.deepEqual(bereit(sortiert), [
      {
        sourceId: 'example-border-authority',
        domains: ['border.example', 'notes.border.example', 'www.border.example'],
      },
    ])
    assert.equal(JSON.stringify(rohRegistry), vorher)
    assert.deepEqual(verdreht.domains, ['www.border.example', 'border.example', 'notes.border.example'])
  })

  test('eine verfälschte Anfrage wird blockiert und die Eingabe bleibt stehen', () => {
    const basis = registry([amt('example-border-authority', ['gov.example'])])
    const plan = [deskriptor(basis, 'example-border-authority')]
    const request = anfrage()
    const vorherAnfrage = JSON.stringify(request)
    const vorherRegistry = JSON.stringify(basis)
    const vorherPlan = JSON.stringify(plan)

    const anderesZiel = {
      ...request,
      scope: { ...request.scope, destinationCountryCode: 'TH' },
    }
    const ziel = officialTruthRechercheAusfuehrungsplan(anderesZiel, basis, plan)
    assert.deepEqual(ziel, { status: 'blocked_invalid', reason: 'scope_mismatch' })
    assert.equal(text(ziel).includes('TH'), false)

    const andererSchluessel = `${request.key.slice(0, -1)}${request.key.endsWith('a') ? 'b' : 'a'}`
    const schluessel = officialTruthRechercheAusfuehrungsplan({ ...request, key: andererSchluessel }, basis, plan)
    assert.deepEqual(schluessel, { status: 'blocked_invalid', reason: 'invalid_request' })

    const andereKlasse = officialTruthRechercheAusfuehrungsplan(
      { ...request, evidenceClass: 'licensed_evidence_provider' },
      basis,
      plan,
    )
    assert.deepEqual(andereKlasse, { status: 'blocked_invalid', reason: 'invalid_request' })
    assert.equal(text(andereKlasse).includes('licensed'), false)

    const reisender = officialTruthRechercheAusfuehrungsplan(
      { userId: 'person-1', passportNumber: 'X123', destinationCountryCode: 'JP', sourceIds: ['example-border-authority'] },
      basis,
      plan,
    )
    assert.deepEqual(reisender, { status: 'blocked_invalid', reason: 'invalid_request' })
    assert.equal(text(reisender).includes('person-1'), false)
    assert.equal(text(reisender).includes('X123'), false)
    assert.equal(text(reisender).includes('example-border-authority'), false)

    const mitAdresse = {
      ...request,
      scope: { ...request.scope, canonicalUrl: 'https://www.gov.example/visa?q=1' },
    }
    const adresse = officialTruthRechercheAusfuehrungsplan(mitAdresse, basis, plan)
    assert.equal(adresse.status, 'blocked_invalid')
    assert.equal(text(adresse).includes('gov.example'), false)
    assert.equal(text(adresse).includes('https'), false)
    assert.equal(text(adresse).includes('?'), false)

    assert.equal(JSON.stringify(request), vorherAnfrage)
    assert.equal(JSON.stringify(basis), vorherRegistry)
    assert.equal(JSON.stringify(plan), vorherPlan)
  })

  test('eine mitgebrachte Adresse am Deskriptor wird nicht zum Plan', () => {
    const basis = registry([amt('example-border-authority', ['gov.example'])])
    const source = {
      ...quelle(basis, 'example-border-authority'),
      canonicalUrl: 'https://gov.example/visa?q=1',
    }
    const plan = officialTruthRechercheAusfuehrungsplan(anfrage(), basis, [{ source, coverage: abdeckung() }])
    assert.deepEqual(bereit(plan), [{ sourceId: 'example-border-authority', domains: ['gov.example'] }])
    assert.equal(text(plan).includes('https'), false)
    assert.equal(text(plan).includes('/visa'), false)
    assert.equal(text(plan).includes('?'), false)
    assert.equal(text(plan).includes('canonicalUrl'), false)
  })

  test('eine andere Zelle bekommt nicht die Hostnamen der ersten Option', () => {
    const basis = registry([
      amt('example-ch-authority', ['ch.example']),
      amt('example-rs-authority', ['rs.example']),
    ])
    const schweiz = deskriptor(basis, 'example-ch-authority')
    const serbien = deskriptor(
      basis,
      'example-rs-authority',
      abdeckung({
        citizenship: { mode: 'exact', countryCodes: ['RS'] },
        documents: { mode: 'exact', options: [{ documentType: 'passport', issuingCountryCode: 'RS' }] },
      }),
    )
    const schweizerPass = officialTruthRechercheAusfuehrungsplan(anfrage(), basis, [serbien, schweiz])
    assert.deepEqual(bereit(schweizerPass), [{ sourceId: 'example-ch-authority', domains: ['ch.example'] }])
    assert.equal(text(schweizerPass).includes('rs.example'), false)

    const serbischerPass = anfrage({
      credentialOption: {
        mode: 'option',
        documentType: 'passport',
        issuingCountryCode: 'RS',
        relatedCitizenshipCountryCode: 'RS',
      },
    })
    const nurSchweiz = officialTruthRechercheAusfuehrungsplan(serbischerPass, basis, [schweiz])
    assert.equal(nurSchweiz.status, 'no_eligible_official_source')
    assert.equal(text(nurSchweiz).includes('ch.example'), false)
    assert.equal(text(nurSchweiz).includes('not_required'), false)

    const anderesZiel = officialTruthRechercheAusfuehrungsplan(anfrage(), basis, [
      deskriptor(basis, 'example-ch-authority', abdeckung({ destinationCountryCodes: ['TH'] })),
    ])
    assert.equal(anderesZiel.status, 'no_eligible_official_source')
    assert.equal(text(anderesZiel).includes('ch.example'), false)
  })
})
