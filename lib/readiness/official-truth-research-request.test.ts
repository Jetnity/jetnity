// lib/readiness/official-truth-research-request.test.ts
//
// Forschungsanfrage aus Abdeckung und bestehendem Scope.
// Eine Lücke wird keine Wirkung. Ein ungültiger Zustand wird nicht erforscht.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { officialTruthAbdeckungBewerten, type OfficialTruthAbdeckung, type OfficialTruthAbdeckungNeuPruefen } from '@/lib/readiness/official-truth-coverage'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { REGEL_FAKT_ARTEN, regelScopeAusEvidenceScope, type RegelFaktArt, type RegelScope } from '@/lib/readiness/rule-claims'
import {
  officialTruthRechercheEntscheiden,
  type OfficialTruthRechercheAnfrage,
  type OfficialTruthRechercheEntscheidung,
} from '@/lib/readiness/official-truth-research-request'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')
const REFERENZ = '2026-10-01T12:00:00.000Z'
const ABGERUFEN = '2026-09-01T12:00:00.000Z'

const VERBOTEN = [
  'passportNumber',
  'documentNumber',
  'mrz',
  'scan',
  'documentScan',
  'biometric',
  'biometrics',
  'healthRecord',
  'dateOfBirth',
  'birthDate',
  'fullName',
  'email',
  'userId',
  'accountId',
  'extractionNote',
  'travellerNote',
] as const

type SchluesselTiefe<T> = T extends readonly (infer U)[]
  ? SchluesselTiefe<U>
  : T extends object
    ? { [K in keyof T & string]: K | SchluesselTiefe<T[K]> }[keyof T & string]
    : never

type Personenfeld = (typeof VERBOTEN)[number]
type AnfrageSauber = Extract<SchluesselTiefe<OfficialTruthRechercheAnfrage>, Personenfeld> extends never ? true : never
type EntscheidungSauber = Extract<SchluesselTiefe<OfficialTruthRechercheEntscheidung>, Personenfeld> extends never ? true : never
type ScopeSauber = Extract<SchluesselTiefe<RegelScope>, Personenfeld> extends never ? true : never
type KlasseFest = OfficialTruthRechercheAnfrage['evidenceClass'] extends 'official_authority' ? true : never
type WirkungUnmoeglich = Extract<OfficialTruthRechercheEntscheidung['action'], 'required' | 'not_required' | 'conditional'> extends never
  ? true
  : never

const anfrageSauber: AnfrageSauber = true
const entscheidungSauber: EntscheidungSauber = true
const scopeSauber: ScopeSauber = true
const klasseFest: KlasseFest = true
const wirkungUnmoeglich: WirkungUnmoeglich = true

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

function version(zeichen: string): string {
  return `ev1_${zeichen.repeat(32)}`
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

function fehlend(key: string, factKind: RegelFaktArt = 'stay_limit'): OfficialTruthAbdeckung {
  return { status: 'missing', ruleScopeKey: key, factKind }
}

function aktuell(key: string, factKind: RegelFaktArt = 'stay_limit', ids: readonly string[] = [version('a')]): OfficialTruthAbdeckung {
  return { status: 'current', ruleScopeKey: key, factKind, supportVersionIds: ids }
}

function neu(
  key: string,
  reason: OfficialTruthAbdeckungNeuPruefen,
  factKind: RegelFaktArt = 'stay_limit',
): OfficialTruthAbdeckung {
  return { status: 'recheck_needed', ruleScopeKey: key, factKind, reason }
}

function anfrageVon(entscheidung: OfficialTruthRechercheEntscheidung): OfficialTruthRechercheAnfrage {
  assert.equal(entscheidung.action, 'research')
  if (entscheidung.action !== 'research') throw new Error('keine anfrage')
  return entscheidung.request
}

describe('Official Truth research request contract', () => {
  test('Personenfelder, Freitext und Anforderungswirkungen sind im Vertrag nicht ausdrückbar', () => {
    assert.equal(anfrageSauber, true)
    assert.equal(entscheidungSauber, true)
    assert.equal(scopeSauber, true)
    assert.equal(klasseFest, true)
    assert.equal(wirkungUnmoeglich, true)
    const text = quelle('lib/readiness/official-truth-research-request.ts')
    assert.doesNotMatch(text, /not_required/)
    assert.doesNotMatch(text, /officialTruthAbdeckungBewerten/)
    assert.doesNotMatch(text, /evidenceKandidatAkzeptieren|regelKandidatAkzeptieren/)
    assert.doesNotMatch(text, /official_truth_store_accepted_v1|official_truth_source_catalog_v1/)
    assert.doesNotMatch(text, /requirementsProviderAus/)
    assert.doesNotMatch(text, /from '@\/lib\/readiness\/(engine|provider|official-truth-store-server|official-truth-source-catalog-server)'/)
    assert.doesNotMatch(text, /supabase|openai|Date\.now|fetch\(|https?:|node:fs|node:http/)
    assert.doesNotMatch(text, /sherpa|timatic|kayak|licensed_evidence_provider/i)
    assert.equal(requirementsProviderAus(), null)
  })

  test('die Kennungsmenge bleibt an den bestehenden Claim-Vertrag gebunden', () => {
    const claims = quelle('lib/readiness/rule-claims.ts')
    const modul = quelle('lib/readiness/official-truth-research-request.ts')
    const start = claims.indexOf('const PERSONEN_SCHLUESSEL = new Set([')
    const ende = claims.indexOf('])', start)
    const schluessel = [...claims.slice(start, ende).matchAll(/'([^']+)'/g)].map((treffer) => treffer[1])
    assert.ok(schluessel.length >= 30)
    for (const name of schluessel) assert.equal(modul.includes(`'${name}'`), true, name)
    for (const name of ['extractionNote', 'travellerNote', 'note', 'documentScan', 'scan']) {
      assert.equal(modul.includes(`'${name}'`), true, name)
    }
    assert.equal(modul.includes('const VERSION_ID = /^ev1_[a-f0-9]{32}$/'), true)
    assert.equal(quelle('lib/readiness/official-truth-coverage.ts').includes('const VERSION_ID = /^ev1_[a-f0-9]{32}$/'), true)
    assert.equal(REGEL_FAKT_ARTEN.includes('stay_limit'), true)
  })

  test('current ergibt keine Forschungsanfrage', () => {
    const basis = zelle()
    const entscheidung = officialTruthRechercheEntscheiden(aktuell(basis.key), basis.scope)
    assert.deepEqual(entscheidung, { action: 'none', reason: 'current' })
    assert.equal('request' in entscheidung, false)
    assert.equal(JSON.stringify(entscheidung).includes('not_required'), false)
    const gedreht = officialTruthRechercheEntscheiden(aktuell(basis.key, 'stay_limit', [version('b'), version('a')]), basis.scope)
    assert.deepEqual(gedreht, entscheidung)
  })

  test('missing ergibt eine begrenzte Forschungsanfrage', () => {
    const basis = zelle()
    const request = anfrageVon(officialTruthRechercheEntscheiden(fehlend(basis.key), basis.scope))
    assert.equal(request.ruleScopeKey, basis.key)
    assert.equal(request.factKind, 'stay_limit')
    assert.deepEqual(request.researchReason, { status: 'missing' })
    assert.equal(request.evidenceClass, 'official_authority')
    assert.match(request.key, /^research-request:v1:[a-f0-9]{64}$/)
    assert.equal('sourceId' in request.scope, false)
    assert.equal(JSON.stringify(request).includes('not_required'), false)
    assert.equal(JSON.stringify(request).includes('http'), false)
    assert.deepEqual(request.scope, basis.scope)
  })

  test('recheck_needed behält den genauen Grund und kollidiert nicht mit missing', () => {
    const basis = zelle()
    const gruende: OfficialTruthAbdeckungNeuPruefen[] = ['valid_from_in_future', 'valid_until_elapsed', 'max_age_exceeded']
    const missing = anfrageVon(officialTruthRechercheEntscheiden(fehlend(basis.key), basis.scope))
    const schluessel = new Set<string>([missing.key])
    for (const reason of gruende) {
      const request = anfrageVon(officialTruthRechercheEntscheiden(neu(basis.key, reason), basis.scope))
      assert.deepEqual(request.researchReason, { status: 'recheck_needed', reason })
      assert.equal(schluessel.has(request.key), false, reason)
      schluessel.add(request.key)
    }
    assert.equal(schluessel.size, 4)
  })

  test('invalid bleibt blockiert und wird nicht zu einer Lücke oder einer Anfrage', () => {
    const basis = zelle()
    const abdeckung: OfficialTruthAbdeckung = {
      status: 'invalid',
      ruleScopeKey: basis.key,
      factKind: 'stay_limit',
      reason: 'claim_not_accepted',
    }
    const entscheidung = officialTruthRechercheEntscheiden(abdeckung, basis.scope)
    assert.deepEqual(entscheidung, {
      action: 'blocked_invalid',
      reason: 'claim_not_accepted',
      ruleScopeKey: basis.key,
      factKind: 'stay_limit',
    })
    assert.equal('request' in entscheidung, false)
    assert.equal(JSON.stringify(entscheidung).includes('missing'), false)

    const andere = zelle({ destinationCountryCode: 'TH' })
    const trotzAnderemScope = officialTruthRechercheEntscheiden(abdeckung, andere.scope)
    assert.deepEqual(trotzAnderemScope, entscheidung)
    assert.equal(JSON.stringify(trotzAnderemScope).includes('TH'), false)

    const rohUngueltig = officialTruthAbdeckungBewerten({
      ruleScopeKey: basis.key,
      factKind: 'stay_limit',
      claim: null,
      support: [],
      referenceTime: 'gestern',
    })
    assert.equal(rohUngueltig.status, 'invalid')
    const ausVertrag = officialTruthRechercheEntscheiden(rohUngueltig, basis.scope)
    assert.equal(ausVertrag.action, 'blocked_invalid')
    if (ausVertrag.action === 'blocked_invalid') assert.equal(ausVertrag.reason, 'invalid_reference_time')
  })

  test('eine Wirkung wird nicht aus einer Lücke abgeleitet', () => {
    const basis = zelle()
    const alsWirkung = {
      status: 'not_required',
      ruleScopeKey: basis.key,
      factKind: 'stay_limit',
    } as OfficialTruthAbdeckung
    const entscheidung = officialTruthRechercheEntscheiden(alsWirkung, basis.scope)
    assert.equal(entscheidung.action, 'blocked_invalid')
    if (entscheidung.action === 'blocked_invalid') assert.equal(entscheidung.reason, 'coverage_unreadable')
    assert.equal(JSON.stringify(entscheidung).includes('not_required'), false)

    const mitWirkung = {
      ...fehlend(basis.key),
      effect: 'not_required',
    } as OfficialTruthAbdeckung
    const extra = officialTruthRechercheEntscheiden(mitWirkung, basis.scope)
    assert.equal(extra.action, 'blocked_invalid')
    if (extra.action === 'blocked_invalid') assert.equal(extra.reason, 'unexpected_fields')
    assert.equal('request' in extra, false)
    assert.equal(JSON.stringify(extra).includes('not_required'), false)
  })

  test('dieselbe kanonische Zelle und derselbe Grund ergeben denselben Schlüssel', () => {
    const links = zelle()
    const rechts = regelScopeAusEvidenceScope({
      sourceId: 'example-border-authority',
      validity: { travelDate: '2026-10-01', mode: 'travel_date' },
      requirementType: 'visa',
      residence: { mode: 'not_applicable' },
      credentialOption: {
        relatedCitizenshipCountryCode: 'CH',
        issuingCountryCode: 'ch',
        documentType: 'passport',
        mode: 'option',
      },
      citizenship: { countryCodes: ['RS', 'ch'], mode: 'required' },
      transitCountryCode: null,
      destinationCountryCode: 'jp',
    })
    assert.equal(rechts.ok, true)
    if (!rechts.ok) throw new Error('scope')
    const erste = anfrageVon(officialTruthRechercheEntscheiden(fehlend(links.key), links.scope))
    const zweite = anfrageVon(officialTruthRechercheEntscheiden(fehlend(rechts.key), rechts.scope))
    assert.equal(links.key, rechts.key)
    assert.equal(erste.key, zweite.key)
    assert.deepEqual(erste, zweite)
    assert.deepEqual(zweite.scope.citizenship, { mode: 'required', countryCodes: ['CH', 'RS'] })
    assert.equal(zweite.scope.destinationCountryCode, 'JP')
    const nochmal = anfrageVon(officialTruthRechercheEntscheiden(fehlend(links.key), links.scope))
    assert.deepEqual(nochmal, erste)
  })

  test('unterschiedliche Staatsbürgerschaft, Dokumente, Ziel und Transit kollidieren nicht', () => {
    const basis = zelle()
    const varianten = [
      basis,
      zelle({ destinationCountryCode: 'TH' }),
      zelle({ transitCountryCode: 'SG' }),
      zelle({ destinationCountryCode: null, transitCountryCode: 'JP' }),
      zelle({
        citizenship: { mode: 'required', countryCodes: ['DE'] },
        credentialOption: {
          mode: 'option',
          documentType: 'passport',
          issuingCountryCode: 'DE',
          relatedCitizenshipCountryCode: 'DE',
        },
      }),
      zelle({
        credentialOption: {
          mode: 'option',
          documentType: 'national_id',
          issuingCountryCode: 'CH',
          relatedCitizenshipCountryCode: 'CH',
        },
      }),
      zelle({
        credentialOption: {
          mode: 'option',
          documentType: 'passport',
          issuingCountryCode: 'RS',
          relatedCitizenshipCountryCode: 'RS',
        },
      }),
      zelle({
        credentialOption: {
          mode: 'option',
          documentType: 'passport',
          issuingCountryCode: 'CH',
          relatedCitizenshipCountryCode: null,
        },
      }),
      zelle({ residence: { mode: 'required', countryCode: 'DE' } }),
      zelle({ requirementType: 'transit' }),
      zelle({ validity: { mode: 'travel_date', travelDate: '2026-11-01' } }),
      zelle({ requirementType: 'health' }),
    ]
    const schluessel = varianten.map((eintrag) => anfrageVon(officialTruthRechercheEntscheiden(fehlend(eintrag.key), eintrag.scope)).key)
    assert.equal(new Set(schluessel).size, varianten.length)
    const fakten = ['stay_limit', 'visa_options', 'transit_conditions'] as const
    const faktSchluessel = fakten.map((factKind) => anfrageVon(officialTruthRechercheEntscheiden(fehlend(basis.key, factKind), basis.scope)).key)
    assert.equal(new Set(faktSchluessel).size, fakten.length)
  })

  test('keine Staatsbürgerschaft, kein Pass und kein Transit werden ergänzt', () => {
    const aussteller = zelle({
      citizenship: { mode: 'not_applicable' },
      credentialOption: {
        mode: 'option',
        documentType: 'passport',
        issuingCountryCode: 'CH',
        relatedCitizenshipCountryCode: null,
      },
    })
    const ausAnfrage = anfrageVon(officialTruthRechercheEntscheiden(fehlend(aussteller.key), aussteller.scope))
    assert.deepEqual(ausAnfrage.scope.citizenship, { mode: 'not_applicable' })
    assert.equal(ausAnfrage.scope.credentialOption.mode, 'option')
    if (ausAnfrage.scope.credentialOption.mode === 'option') {
      assert.equal(ausAnfrage.scope.credentialOption.relatedCitizenshipCountryCode, null)
      assert.equal(ausAnfrage.scope.credentialOption.issuingCountryCode, 'CH')
    }
    const wohnsitz = zelle({
      citizenship: { mode: 'not_applicable' },
      credentialOption: { mode: 'not_applicable' },
      residence: { mode: 'required', countryCode: 'DE' },
    })
    const wohnsitzAnfrage = anfrageVon(officialTruthRechercheEntscheiden(fehlend(wohnsitz.key), wohnsitz.scope))
    assert.deepEqual(wohnsitzAnfrage.scope.citizenship, { mode: 'not_applicable' })
    assert.deepEqual(wohnsitzAnfrage.scope.residence, { mode: 'required', countryCode: 'DE' })
    assert.notEqual(aussteller.key, wohnsitz.key)

    const ziel = zelle()
    const nurZiel = anfrageVon(officialTruthRechercheEntscheiden(fehlend(ziel.key), ziel.scope))
    assert.equal(nurZiel.scope.destinationCountryCode, 'JP')
    assert.equal(nurZiel.scope.transitCountryCode, null)
    const transit = zelle({ transitCountryCode: 'SG' })
    assert.notEqual(ziel.key, transit.key)

    const basis = zelle()
    const ohneDokument = { ...roh() }
    delete ohneDokument.credentialOption
    const block = officialTruthRechercheEntscheiden(fehlend(basis.key), ohneDokument as RegelScope)
    assert.equal(block.action, 'blocked_invalid')
    if (block.action === 'blocked_invalid') assert.equal(block.reason, 'invalid_scope')
    assert.equal('request' in block, false)
    assert.equal(JSON.stringify(block).includes('passport'), false)

    const flughafen = { ...roh(), transitAirportCodes: ['NRT'] }
    const flughafenBlock = officialTruthRechercheEntscheiden(fehlend(basis.key), flughafen as RegelScope)
    assert.equal(flughafenBlock.action, 'blocked_invalid')
    if (flughafenBlock.action === 'blocked_invalid') assert.equal(flughafenBlock.reason, 'unexpected_fields')
    assert.equal(JSON.stringify(flughafenBlock).includes('NRT'), false)

    const beide = zelle()
    const pass = anfrageVon(officialTruthRechercheEntscheiden(fehlend(beide.key), beide.scope))
    const ausweis = zelle({
      credentialOption: {
        mode: 'option',
        documentType: 'national_id',
        issuingCountryCode: 'RS',
        relatedCitizenshipCountryCode: 'RS',
      },
    })
    const ausweisAnfrage = anfrageVon(officialTruthRechercheEntscheiden(fehlend(ausweis.key), ausweis.scope))
    assert.notEqual(pass.key, ausweisAnfrage.key)
    if (pass.scope.citizenship.mode === 'required' && ausweisAnfrage.scope.citizenship.mode === 'required') {
      assert.deepEqual(pass.scope.citizenship.countryCodes, ['CH', 'RS'])
      assert.deepEqual(ausweisAnfrage.scope.citizenship.countryCodes, ['CH', 'RS'])
    }
    assert.equal(JSON.stringify(pass).includes('primary'), false)
    assert.equal(JSON.stringify(ausweisAnfrage).includes('preferred'), false)
  })

  test('Personen- und Freitextfelder werden abgelehnt und nicht in das Ergebnis übernommen', () => {
    const basis = zelle()
    for (const feld of VERBOTEN) {
      const geheim = `geheim-${feld}-wert`
      const entscheidung = officialTruthRechercheEntscheiden(fehlend(basis.key), { ...basis.scope, [feld]: geheim } as RegelScope)
      assert.equal(entscheidung.action, 'blocked_invalid', feld)
      if (entscheidung.action === 'blocked_invalid') {
        assert.equal(entscheidung.reason, 'personal_identifier_forbidden', feld)
        assert.equal(entscheidung.ruleScopeKey, basis.key, feld)
      }
      assert.equal('request' in entscheidung, false, feld)
      assert.equal(JSON.stringify(entscheidung).includes(geheim), false, feld)
    }
    const verschachtelt = officialTruthRechercheEntscheiden(aktuell(basis.key), {
      ...basis.scope,
      citizenship: { ...basis.scope.citizenship, passportNumber: 'C12345678' },
    } as RegelScope)
    assert.equal(verschachtelt.action, 'blocked_invalid')
    assert.equal(JSON.stringify(verschachtelt).includes('C12345678'), false)

    const url = officialTruthRechercheEntscheiden(fehlend(basis.key), {
      ...roh(),
      canonicalUrl: 'https://secret.example/path',
    } as RegelScope)
    assert.equal(url.action, 'blocked_invalid')
    if (url.action === 'blocked_invalid') assert.equal(url.reason, 'unexpected_fields')
    assert.equal(JSON.stringify(url).includes('secret.example'), false)
    assert.equal(JSON.stringify(url).includes('https://'), false)
  })

  test('ein abweichender Scope wird nicht still erforscht', () => {
    const links = zelle()
    const rechts = zelle({ destinationCountryCode: 'TH' })
    const entscheidung = officialTruthRechercheEntscheiden(fehlend(links.key), rechts.scope)
    assert.equal(entscheidung.action, 'blocked_invalid')
    if (entscheidung.action === 'blocked_invalid') {
      assert.equal(entscheidung.reason, 'research_scope_mismatch')
      assert.equal(entscheidung.ruleScopeKey, links.key)
    }
    assert.equal(JSON.stringify(entscheidung).includes('TH'), false)

    const kaputt = officialTruthRechercheEntscheiden(aktuell(links.key, 'stay_limit', []), links.scope)
    assert.equal(kaputt.action, 'blocked_invalid')
    if (kaputt.action === 'blocked_invalid') assert.equal(kaputt.reason, 'coverage_unreadable')
  })

  test('die echte Abdeckung wird übernommen und nicht neu bewertet', () => {
    const basis = zelle()
    const luecke = officialTruthAbdeckungBewerten({
      ruleScopeKey: basis.key,
      factKind: 'visa_options',
      claim: null,
      support: [],
      referenceTime: REFERENZ,
    })
    assert.equal(luecke.status, 'missing')
    const request = anfrageVon(officialTruthRechercheEntscheiden(luecke, basis.scope))
    assert.equal(request.factKind, 'visa_options')
    assert.deepEqual(request.researchReason, { status: 'missing' })

    const id = version('c')
    const frisch = officialTruthAbdeckungBewerten({
      ruleScopeKey: basis.key,
      factKind: 'visa_options',
      claim: {
        lifecycle: 'accepted',
        validationState: 'valid',
        ruleScopeKey: basis.key,
        factKind: 'visa_options',
        supportVersionIds: [id],
      },
      support: [
        {
          versionId: id,
          ruleScopeKey: basis.key,
          lifecycle: 'accepted',
          validationState: 'valid',
          retrievedAt: ABGERUFEN,
          validFrom: null,
          validUntil: null,
          sourceId: 'example-border-authority',
        },
      ],
      referenceTime: REFERENZ,
    })
    assert.equal(frisch.status, 'current')
    assert.deepEqual(officialTruthRechercheEntscheiden(frisch, basis.scope), { action: 'none', reason: 'current' })

    const alt = officialTruthAbdeckungBewerten({
      ruleScopeKey: basis.key,
      factKind: 'visa_options',
      claim: {
        lifecycle: 'accepted',
        validationState: 'valid',
        ruleScopeKey: basis.key,
        factKind: 'visa_options',
        supportVersionIds: [id],
      },
      support: [
        {
          versionId: id,
          ruleScopeKey: basis.key,
          lifecycle: 'accepted',
          validationState: 'valid',
          retrievedAt: ABGERUFEN,
          validFrom: null,
          validUntil: '2026-09-01',
          sourceId: 'example-border-authority',
        },
      ],
      referenceTime: REFERENZ,
    })
    assert.equal(alt.status, 'recheck_needed')
    if (alt.status !== 'recheck_needed') throw new Error('recheck')
    const erneut = anfrageVon(officialTruthRechercheEntscheiden(alt, basis.scope))
    assert.deepEqual(erneut.researchReason, { status: 'recheck_needed', reason: alt.reason })
  })

  test('die Eingabe wird nicht verändert', () => {
    const codes = ['RS', 'CH']
    const eingabe = roh({ citizenship: { mode: 'required', countryCodes: codes } })
    const gelesen = regelScopeAusEvidenceScope(eingabe)
    assert.equal(gelesen.ok, true)
    if (!gelesen.ok) throw new Error('scope')
    const coverage = fehlend(gelesen.key)
    const davor = JSON.stringify({ coverage, scope: gelesen.scope, codes })
    officialTruthRechercheEntscheiden(coverage, gelesen.scope)
    assert.equal(JSON.stringify({ coverage, scope: gelesen.scope, codes }), davor)
    assert.deepEqual(codes, ['RS', 'CH'])
  })
})
