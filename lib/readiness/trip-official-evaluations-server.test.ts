import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import * as React from 'react'
import ts from 'typescript'

import type ReiseSeite from '@/app/(public)/reisen/[tripId]/page'
import type KontoArbeitsbereich from '@/components/trips/KontoArbeitsbereich'
import type TripWorkspace from '@/components/trips/TripWorkspace'
import { requirementsFuerReise } from '@/lib/readiness/engine'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import { requirementsProviderAus, type RequirementsProvider } from '@/lib/readiness/provider'
import { tripOfficialEvaluationsAuswerten } from '@/lib/readiness/trip-official-evaluations-server'
import { requirementsProviderNachZustand, type ReadinessUmgebung } from '@/lib/readiness/zustand'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { itineraryZweiTransits } from '@/lib/route/fixtures'
import { istKontoKennung } from '@/lib/trips/daten'
import { leseRequestParam } from '@/lib/next/request-api'
import type { Lesung } from '@/lib/api/datenbank-lesen'
import { OFFICIAL_REQUIREMENT_TYPES, type Trip, type TripTraveller } from '@/types/trips'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(import.meta.url)
const HELPER = 'lib/readiness/trip-official-evaluations-server.ts'
const PAGE = 'app/(public)/reisen/[tripId]/page.tsx'
const ACCOUNT = 'components/trips/KontoArbeitsbereich.tsx'
const TRIP_ID = 'aaaaaaaa-0000-4000-8000-000000000001'
const TIME = '2026-10-05T12:00:00.000Z'

// Execute the real module, with an explicit dependency allowlist. Unexpected
// registry, storage, HTTP or provider imports fail instead of reaching a service.
function laden<T>(path: string, dependencies: Record<string, unknown>): T {
  const filename = resolve(root, path)
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const loaded = { exports: {} }
  new Function('require', 'module', 'exports', code)((name: string) => {
    if (name === 'react/jsx-runtime') return require(name)
    assert.ok(Object.hasOwn(dependencies, name), `unexpected dependency: ${name}`)
    return dependencies[name]
  }, loaded, loaded.exports)
  return loaded.exports as T
}

function einfrieren<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) einfrieren(child)
    Object.freeze(value)
  }
  return value
}

function traveller(ref: string, codes: string[]): TripTraveller {
  return {
    id: ref, clientRef: ref, label: null, residenceCountryCode: 'US', createdAt: TIME, updatedAt: TIME,
    citizenships: codes.map(code => ({ id: `${ref}-${code}`, clientRef: `${ref}-${code}`, countryCode: code, createdAt: TIME, updatedAt: TIME })),
    documents: [
      { id: `${ref}-pass`, clientRef: `${ref}-pass`, documentType: 'passport', issuingCountryCode: 'CA', citizenshipClientRef: null, expiresOn: '2031-01-01', createdAt: TIME, updatedAt: TIME },
      { id: `${ref}-id`, clientRef: `${ref}-id`, documentType: 'national_id', issuingCountryCode: 'FR', citizenshipClientRef: codes.includes('FR') ? `${ref}-FR` : null, expiresOn: '2032-02-02', createdAt: TIME, updatedAt: TIME },
    ],
  }
}

function reise(): Trip {
  const basis = beispielreise()
  return beispielreise({
    id: TRIP_ID, startDate: '2026-11-01', endDate: '2026-11-12', travellers: 2,
    party: [traveller('peer-a', ['CH', 'FR']), traveller('peer-b', ['DE', 'IT'])],
    stages: basis.stages.map(stage => ({ ...stage, countryCode: stage.position === 1 ? 'TH' : 'JP' })),
    ohneTag: [{ ...basis.days[0]!.items[0]!, id: 'flight-fixture', dayId: null, kind: 'flight', routeItinerary: itineraryZweiTransits() }],
  })
}

type Helper = { tripOfficialEvaluationsAuswerten: typeof tripOfficialEvaluationsAuswerten }

describe('B01 server-owned Official evaluations', () => {
  test('delegates the exact Trip and gated provider, returning the complete array by identity', async () => {
    const snapshot = einfrieren(reise())
    const evaluations = einfrieren(await tripOfficialEvaluationsAuswerten(snapshot))
    const rawProvider: RequirementsProvider = { name: 'raw-test', async evaluate() { assert.fail('ungated execution') } }
    const gatedProvider: RequirementsProvider = { name: 'gated-test', async evaluate() { return [] } }
    const calls: string[] = []
    const helper = laden<Helper>(HELPER, {
      'server-only': {},
      '@/lib/readiness/provider': { requirementsProviderAus() { calls.push('factory'); return rawProvider } },
      '@/lib/readiness/zustand': { requirementsProviderNachZustand(provider: RequirementsProvider) { assert.equal(provider, rawProvider); calls.push('gate'); return gatedProvider } },
      '@/lib/readiness/engine': { async requirementsFuerReise(trip: Trip, provider: RequirementsProvider) {
        assert.equal(trip, snapshot)
        assert.equal(provider, gatedProvider)
        calls.push('engine')
        return evaluations
      } },
    })
    assert.equal(await helper.tripOfficialEvaluationsAuswerten(snapshot), evaluations)
    assert.deepEqual(calls, ['factory', 'gate', 'engine'])
    assert.match(readFileSync(resolve(root, HELPER), 'utf8'), /import 'server-only'/)
  })

  test('current null factory: full peer scope, canonical fail-closed fields, no network or Trip mutation', async (t) => {
    t.mock.method(globalThis, 'fetch', () => { assert.fail('no network with null provider') })
    assert.equal(requirementsProviderAus(), null)
    const snapshot = einfrieren(reise())
    const before = JSON.stringify(snapshot)
    const evaluations = await tripOfficialEvaluationsAuswerten(snapshot)
    assert.deepEqual(evaluations, await requirementsFuerReise(snapshot, null))
    assert.equal(JSON.stringify(snapshot), before)
    const expected = new Set<string>()
    for (const ref of ['peer-a', 'peer-b']) {
      for (const document of ['pass', 'id']) {
        for (const destination of ['JP', 'TH']) {
          for (const type of OFFICIAL_REQUIREMENT_TYPES) {
            for (const transit of type === 'transit' ? ['DE', 'QA'] : [null]) {
              expected.add([ref, `${ref}:${ref}-${document}`, destination, transit, type].join('|'))
            }
          }
        }
      }
    }
    const actual = new Set(evaluations.map(e => [e.travellerClientRef, e.credentialOptionRef, e.destinationCountryCode, e.transitCountryCode, e.requirementType].join('|')))
    assert.equal(evaluations.length, expected.size)
    assert.deepEqual(actual, expected)
    for (const e of evaluations) {
      assert.equal(e.result, 'unknown')
      assert.equal(e.status, 'unavailable')
      assert.equal(e.freshness, 'provider_unavailable')
      assert.equal(e.evidence.provider, null)
      assert.equal(e.action, null)
      assert.equal(e.temporalRule, null)
      assert.match(e.evidence.contextFingerprint, e.travellerClientRef === 'peer-a' ? /\|cit=CH,FR\|/ : /\|cit=DE,IT\|/)
      assert.match(e.evidence.contextFingerprint, /\|orig=CH\|/)
      assert.match(e.evidence.contextFingerprint, /\|start=2026-11-01\|end=2026-11-12\|/)
      if (e.credentialOptionRef?.endsWith('-pass')) assert.match(e.evidence.contextFingerprint, /docs=passport:CA:2031-01-01:\|/)
    }
    const reversed = { ...snapshot, party: snapshot.party!.map(peer => ({ ...peer, citizenships: [...peer.citizenships].reverse(), documents: [...peer.documents].reverse() })).reverse() }
    const ordered = (rows: OfficialEvaluation[]) => rows.map(e => JSON.stringify(e)).sort()
    assert.deepEqual(ordered(await tripOfficialEvaluationsAuswerten(reversed)), ordered(evaluations))
  })

  test('missing citizenship is never inferred from residence or issuing country; absent documents stay absent', async () => {
    const withoutCitizenship = reise()
    withoutCitizenship.party = [traveller('unknown-citizenship', [])]
    withoutCitizenship.travellers = 1
    for (const e of await tripOfficialEvaluationsAuswerten(withoutCitizenship)) {
      assert.equal(e.status, 'insufficient_context')
      assert.ok(e.missingFacts.includes('nationality'))
      assert.match(e.evidence.contextFingerprint, /\|cit=\|/)
      assert.equal(e.result, 'unknown')
    }
    withoutCitizenship.party = [{ ...traveller('no-document', ['CH', 'FR']), documents: [] }]
    for (const e of await tripOfficialEvaluationsAuswerten(withoutCitizenship)) {
      assert.equal(e.credentialOptionRef, 'no-document:none')
      assert.match(e.evidence.contextFingerprint, /\|docs=:::\|/)
    }
  })

  test('a new Trip snapshot recomputes dates, destinations and every remaining peer without cached evaluations', async () => {
    const original = einfrieren(reise())
    const previous = await tripOfficialEvaluationsAuswerten(original)
    const changed = einfrieren({
      ...original, startDate: '2026-12-01', endDate: '2026-12-12', travellers: 1,
      party: original.party!.filter(peer => peer.clientRef === 'peer-b').map(peer => ({
        ...peer, citizenships: peer.citizenships.filter(c => c.countryCode === 'IT'),
        documents: peer.documents.filter(d => d.documentType === 'national_id'),
      })),
      stages: original.stages.map(stage => ({ ...stage, countryCode: 'GB' })),
      ohneTag: [],
    })
    const current = await tripOfficialEvaluationsAuswerten(changed)
    assert.notDeepEqual(current, previous)
    assert.equal(current.length, OFFICIAL_REQUIREMENT_TYPES.length)
    for (const e of current) {
      assert.equal(e.travellerClientRef, 'peer-b')
      assert.equal(e.credentialOptionRef, 'peer-b:peer-b-id')
      assert.equal(e.destinationCountryCode, 'GB')
      assert.equal(e.transitCountryCode, null)
      assert.match(e.evidence.contextFingerprint, /\|cit=IT\|/)
      assert.match(e.evidence.contextFingerprint, /\|orig=\|/)
      assert.match(e.evidence.contextFingerprint, /\|start=2026-12-01\|end=2026-12-12\|/)
    }
  })

  for (const [label, environment] of [
    ['missing flag', {}],
    ['preview disabled', { VERCEL_ENV: 'preview', JETNITY_READINESS_AKTIV: 'false' }],
    ['production hard-off', { VERCEL_ENV: 'production', JETNITY_READINESS_AKTIV: 'true' }],
  ] satisfies Array<[string, ReadinessUmgebung]>) {
    test(`real state gate blocks a supplied test provider: ${label}`, async () => {
      const provider: RequirementsProvider = { name: 'blocked-test', async evaluate() { assert.fail('blocked provider executed') } }
      const helper = laden<Helper>(HELPER, {
        'server-only': {},
        '@/lib/readiness/provider': { requirementsProviderAus: () => provider },
        '@/lib/readiness/zustand': { requirementsProviderNachZustand: (candidate: RequirementsProvider) => requirementsProviderNachZustand(candidate, environment) },
        '@/lib/readiness/engine': { requirementsFuerReise },
      })
      assert.deepEqual(await helper.tripOfficialEvaluationsAuswerten(reise()), await requirementsFuerReise(reise(), null))
    })
  }

  for (const failure of ['throw', 'timeout'] as const) {
    test(`existing engine preserves bounded fail-closed ${failure} semantics`, async () => {
      let calls = 0
      let signal: AbortSignal | undefined
      const provider: RequirementsProvider = { name: 'failure-test', async evaluate(_request, abort) {
        calls += 1
        signal = abort
        if (failure === 'throw') throw new Error('test provider unavailable')
        return new Promise(() => {})
      } }
      const helper = laden<Helper>(HELPER, {
        'server-only': {},
        '@/lib/readiness/provider': { requirementsProviderAus: () => provider },
        '@/lib/readiness/zustand': { requirementsProviderNachZustand: (candidate: RequirementsProvider) => requirementsProviderNachZustand(candidate, { VERCEL_ENV: 'preview', JETNITY_READINESS_AKTIV: 'true' }) },
        '@/lib/readiness/engine': { requirementsFuerReise: (trip: Trip, candidate: RequirementsProvider) => requirementsFuerReise(trip, candidate, { timeoutMs: 5 }) },
      })
      const evaluations = await helper.tripOfficialEvaluationsAuswerten(reise())
      assert.equal(calls, 1)
      assert.ok(signal?.aborted)
      assert.ok(evaluations.length > 0)
      for (const e of evaluations) {
        assert.equal(e.result, 'unknown')
        assert.equal(e.freshness, 'source_temporarily_unavailable')
        assert.equal(e.action, null)
      }
    })
  }
})

const Guest = () => null
const Account = () => null
const Workspace = () => null
const NOT_FOUND = new Error('test 404')
type AccountProps = React.ComponentProps<typeof KontoArbeitsbereich>

function pageTest(options: {
  auth?: boolean
  load?: () => Promise<Lesung<Trip>>
  evaluate?: typeof tripOfficialEvaluationsAuswerten
} = {}) {
  const events: string[] = []
  const snapshot = einfrieren(reise())
  const evaluations: OfficialEvaluation[][] = []
  // Registry advertises a different traveller/citizenship/document; it must
  // reach only the explicit adoption UI, never the evaluation helper.
  const registryDisplay = [{ id: 'registry-only', label: null, citizenshipCountryCodes: ['US'], residenceCountryCode: 'CA', documents: [{ documentType: 'passport', issuingCountryCode: 'US' }] }]
  const page = laden<{ default: typeof ReiseSeite }>(PAGE, {
    'next/navigation': { notFound() { events.push('404'); throw NOT_FOUND } },
    'lucide-react': { AlertCircle: () => null },
    '@/lib/next/request-api': { leseRequestParam },
    '@/lib/seo/index-grenze': { NICHT_INDEXIEREN: {} },
    '@/lib/supabase/server': { async createServerComponentClient() { return { auth: { async getUser() { events.push('auth'); return { data: { user: options.auth === false ? null : { id: 'owner-test' } } } } } } } },
    '@/lib/trips/daten': { istKontoKennung, async reiseLaden(id: string) {
      assert.ok(events.includes('auth'))
      assert.equal(id, TRIP_ID)
      events.push('load')
      const result = options.load ? await options.load() : { zeilen: [snapshot], problem: null }
      events.push('loaded')
      return result
    } },
    '@/lib/readiness/trip-official-evaluations-server': { async tripOfficialEvaluationsAuswerten(trip: Trip) {
      assert.ok(events.includes('loaded'))
      assert.equal(trip, snapshot)
      events.push('evaluate')
      const rows = await (options.evaluate ?? tripOfficialEvaluationsAuswerten)(trip)
      evaluations.push(rows)
      return rows
    } },
    '@/lib/traveller/account-registry-daten': { async registryLaden() { events.push('registry'); return { zeilen: registryDisplay, problem: null } } },
    '@/lib/traveller/account-registry-trip': { registryTripAnzeigenAus: (rows: unknown) => rows },
    '@/components/trips/GastArbeitsbereich': { default: Guest },
    '@/components/trips/KontoArbeitsbereich': { default: Account },
  })
  return { ...page, events, snapshot, evaluations, registryDisplay }
}

describe('B01 authenticated page and account handoff', () => {
  test('loads first, evaluates the exact loaded snapshot, forwards every evaluation separately from registry', async () => {
    const page = pageTest()
    const result = await page.default({ params: Promise.resolve({ tripId: TRIP_ID }) })
    assert.ok(React.isValidElement<AccountProps>(result))
    assert.equal(result.type, Account)
    assert.equal(result.props.reise, page.snapshot)
    assert.equal(result.props.officialEvaluations, page.evaluations.at(-1))
    assert.equal(result.props.registry?.travellers, page.registryDisplay)
    assert.deepEqual(page.events, ['auth', 'load', 'loaded', 'evaluate', 'registry'])
    assert.ok(result.props.officialEvaluations.every(e => e.travellerClientRef !== 'registry-only'))
  })

  test('does not evaluate while the authenticated loader is pending', async () => {
    let release!: (value: { zeilen: Trip[]; problem: null }) => void
    const pending = new Promise<{ zeilen: Trip[]; problem: null }>(resolve => { release = resolve })
    const page = pageTest({ load: () => pending })
    const render = page.default({ params: Promise.resolve({ tripId: TRIP_ID }) })
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(page.events, ['auth', 'load'])
    release({ zeilen: [page.snapshot], problem: null })
    await render
    assert.ok(page.events.includes('evaluate'))
  })

  for (const reason of ['missing', 'foreign UUID hidden by RLS']) {
    test(`${reason}: identical 404 with no evaluation or registry read`, async () => {
      const page = pageTest({ load: async () => ({ zeilen: [], problem: null }) })
      await assert.rejects(page.default({ params: Promise.resolve({ tripId: TRIP_ID }) }), error => error === NOT_FOUND)
      assert.deepEqual(page.events, ['auth', 'load', 'loaded', '404'])
    })
  }

  for (const status of [500, 503] as const) {
    test(`loader error ${status}: existing error UI, no evaluation`, async () => {
      const page = pageTest({ load: async () => ({ zeilen: null, problem: { status, message: 'test database error' } }) })
      const result = await page.default({ params: Promise.resolve({ tripId: TRIP_ID }) })
      assert.ok(React.isValidElement(result))
      assert.equal(result.type, 'main')
      assert.deepEqual(page.events, ['auth', 'load', 'loaded'])
    })
  }

  for (const [auth, tripId] of [[false, TRIP_ID], [true, `trip-${TRIP_ID}`], [true, 'invalid']] as const) {
    test(`guest boundary (${auth}, ${tripId}): no account, evaluation or registry calls`, async () => {
      const page = pageTest({ auth })
      const result = await page.default({ params: Promise.resolve({ tripId }) })
      assert.ok(React.isValidElement<{ tripId: string }>(result))
      assert.equal(result.type, Guest)
      assert.deepEqual(result.props, { tripId })
      assert.deepEqual(page.events, ['auth'])
    })
  }

  test('account forwards arrays losslessly on repeated renders; existing mutation callbacks refresh', async () => {
    let refreshes = 0
    const writes: unknown[] = []
    const dependencies: Record<string, unknown> = {
      react: { ...React, useState: (initial: unknown) => [initial, () => {}] },
      'next/navigation': { useRouter: () => ({ refresh() { refreshes += 1 } }) },
      'lucide-react': { Cloud: () => null, Trash2: () => null },
      '@/lib/traveller/account-registry-trip': { registryTripUebernahmeGesperrt: () => false },
      '@/lib/readiness/reisende-aktionen': {
        async travellerEntfernen(payload: unknown) { writes.push(payload); return { ok: true } },
      },
      '@/lib/trips/aktionen': {
        async unterkunftZeitraumSetzen(payload: unknown) { writes.push(payload); return { ok: true } },
      },
    }
    for (const domain of ['activities', 'flights', 'hotels', 'mobility', 'rental-cars', 'readiness']) dependencies[`@/lib/${domain}/aktionen`] = {}
    for (const component of ['RegistryReiseUebernahme', 'AktivitaetenBereich', 'MobilitaetBereich', 'FlugSuche', 'HotelBereich', 'ReiseAenderung', 'Reisebegleiter']) dependencies[`@/components/trips/${component}`] = { default: () => null }
    dependencies['@/components/trips/TripWorkspace'] = { default: Workspace }
    const account = laden<{ default: typeof KontoArbeitsbereich }>(ACCOUNT, dependencies)
    const snapshot = einfrieren(reise())
    const rows = einfrieren(await tripOfficialEvaluationsAuswerten(snapshot))
    const render = (evaluations: OfficialEvaluation[]) => {
      const result = account.default({ reise: snapshot, ohneTag: snapshot.ohneTag ?? [], officialEvaluations: evaluations, registry: { problem: null, travellers: [] } })
      assert.ok(React.isValidElement<React.ComponentProps<typeof TripWorkspace>>(result))
      assert.equal(result.type, Workspace)
      assert.equal(result.props.officialEvaluations, evaluations)
      assert.equal(result.props.reise, snapshot)
      return result.props
    }
    const props = render(rows)
    render([])
    render(rows)
    assert.deepEqual(writes, [])
    await props.onTravellerEntfernen!('peer-a')
    await props.onUnterkunftZeitraum!('stay-fixture', '2026-11-01', '2026-11-03')
    assert.equal(refreshes, 2)
    assert.deepEqual(writes, [{ tripId: TRIP_ID, clientRef: 'peer-a' }, { tripId: TRIP_ID, itemId: 'stay-fixture', startsOn: '2026-11-01', endsOn: '2026-11-03' }])
  })

  test('no Guest Official wiring, persistence or credential/evaluation shortcut in the new handoff', () => {
    const guest = readFileSync(resolve(root, 'components/trips/GastArbeitsbereich.tsx'), 'utf8')
    assert.doesNotMatch(guest, /officialEvaluations|tripOfficialEvaluations|requirementsFuerReise|requirementsProvider|\/api\/readiness\/requirements/)
    for (const path of [HELPER, PAGE, ACCOUNT]) {
      const source = readFileSync(resolve(root, path), 'utf8')
      assert.doesNotMatch(source, /(?:documents|citizenships|party|officialEvaluations|evaluations)\s*\[\s*0\s*\]|\.at\(0\)/)
      assert.doesNotMatch(source, /\/api\/readiness\/requirements|localStorage|sessionStorage|JSON\.stringify\(officialEvaluations/)
    }
  })
})
