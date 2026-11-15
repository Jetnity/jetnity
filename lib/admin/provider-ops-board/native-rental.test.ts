import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ProviderOpsAnsicht } from '@/components/admin/provider-ops/ProviderOpsBoard'
import { deuteProviderOps } from '@/lib/admin/operations-report-validation'
import { rentalAccess } from '@/lib/providers/discovercars/search/server'
import { rentalCarZustand } from '@/lib/rental-cars/zustand'
import { bewerteProviderOps, wendeEvidenceAlterAn, type NativeRentalConfigurationSnapshot } from './bewertung'
import { PROVIDER_OPS_BOARD_AUDIT_BERICHT } from './fixtures'
import { nativeRentalConfiguration } from './native-rental'
import { leereProviderOpsBoardCache, sammleProviderOpsBoard } from './sammeln'
import { NATIVE_RENTAL_CHECK_ID, providerOpsKarteIstGruen } from './typen'

const NOW = Date.parse('2026-11-15T10:00:00Z')
const SYNTHETIC_KEY = 'synthetic-only-rental-key-20261115'

function report(kind: NativeRentalConfigurationSnapshot['kind']) {
  const result = structuredClone(PROVIDER_OPS_BOARD_AUDIT_BERICHT)
  result.items[0] = bewerteProviderOps([], NOW, { kind })
  return result
}

test('native configuration follows the actual flag and trimmed 23/24-character boundary', () => {
  for (const flag of [undefined, '', '0', 'true', ' 1 ', '1']) {
    for (const key of [undefined, '', '   ', 'x'.repeat(23), ` ${'x'.repeat(23)} `, 'x'.repeat(24), ` ${'x'.repeat(24)} `]) {
      for (const environment of ['preview', 'production']) {
        const env = { JETNITY_DISCOVERCARS_SEARCH_ENABLED: flag, DISCOVERCARS_API_KEY: key, VERCEL_ENV: environment }
        const actual = nativeRentalConfiguration(env)
        assert.equal(actual.kind === 'configured', rentalAccess(env) !== null)
        assert.equal(actual.kind, flag !== '1' ? 'disabled' : key?.trim().length && key.trim().length >= 24 ? 'configured' : 'not_configured')
        assert.deepEqual(Object.keys(actual), ['kind'])
      }
    }
  }
})

test('native gate disagreement with the old S1 switch is visible instead of relabelled', () => {
  const env = { VERCEL_ENV: 'production', JETNITY_RENTAL_CAR_AKTIV: 'true', JETNITY_DISCOVERCARS_SEARCH_ENABLED: '1', DISCOVERCARS_API_KEY: SYNTHETIC_KEY }
  assert.deepEqual(rentalCarZustand(env, true), { aktiv: false, grund: 'production' })
  assert.deepEqual(nativeRentalConfiguration(env), { kind: 'configured' })
  const check = report('configured').items[0].checks![0]
  assert.equal(check.id, NATIVE_RENTAL_CHECK_ID)
  assert.equal(check.status, 'configured')
  assert.equal(providerOpsKarteIstGruen(check), false)
  assert.equal(providerOpsKarteIstGruen({ ...check, status: 'available' }), false)
  assert.equal(report('configured').items[0].status, 'foundation_only')
})

test('configuration and rendered report never serialize a key or perform a provider request', () => {
  const network = mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected provider request') })
  try {
    const observation = nativeRentalConfiguration({ JETNITY_DISCOVERCARS_SEARCH_ENABLED: '1', DISCOVERCARS_API_KEY: SYNTHETIC_KEY })
    const result = report(observation.kind)
    const html = renderToStaticMarkup(createElement(ProviderOpsAnsicht, { bericht: result }))
    for (const value of [JSON.stringify(observation), JSON.stringify(result), html]) assert.equal(value.includes(SYNTHETIC_KEY), false)
    assert.equal(network.mock.callCount(), 0)
  } finally { network.mock.restore() }
})

for (const kind of ['disabled', 'not_configured', 'configured', 'unknown'] as const) {
  test(`native ${kind} has a visible first-render reason without a green health claim`, () => {
    const result = report(kind)
    const check = result.items[0].checks![0]
    const html = renderToStaticMarkup(createElement(ProviderOpsAnsicht, { bericht: result }))
    const visible = html.replace(/<details\b[\s\S]*?<\/details>/g, '')
    assert.ok(visible.includes(check.summary))
    assert.match(visible, /Direkte Mietwagensuche/)
    const row = visible.match(/<li[^>]*data-ops-check="native-rental-search"[\s\S]*?<\/li>/)?.[0]
    assert.ok(row)
    assert.match(row, /data-ops-green="false"/)
    if (kind === 'configured') {
      assert.match(row, /Schlüsselgültigkeit, Provider-Erreichbarkeit, Kontingent und Angebote wurden nicht geprüft/)
      assert.doesNotMatch(row, /Belegte Test-Capability|Verfügbar \(belegte Capability\)/)
    }
  })
}

test('configured JSON roundtrip is confined to the native rental subcheck', () => {
  const good = report('configured')
  assert.deepEqual(deuteProviderOps(JSON.parse(JSON.stringify(good))), good)
  for (const variant of ['parent', 'other-check', 'other-parent', 'wrong-parent-disabled', 'duplicate', 'extra-secret', 'bad-status', 'native-available', 'native-foundation'] as const) {
    const bad = structuredClone(good)
    const check = bad.items[0].checks![0]
    if (variant === 'parent') Object.assign(bad.items[0], { status: 'configured' })
    if (variant === 'other-check') check.id = 'domain-flights'
    if (variant === 'other-parent') { bad.items[2].checks = [check]; bad.items[0].checks = [] }
    if (variant === 'wrong-parent-disabled') { bad.items[2].checks = [{ ...check, status: 'disabled' }]; bad.items[0].checks = [] }
    if (variant === 'duplicate') bad.items[0].checks!.push({ ...check })
    if (variant === 'extra-secret') Object.assign(check, { secret: SYNTHETIC_KEY })
    if (variant === 'bad-status') Object.assign(check, { status: 'healthy' })
    if (variant === 'native-available') check.status = 'available'
    if (variant === 'native-foundation') check.status = 'foundation_only'
    assert.throws(() => deuteProviderOps(bad), variant)
  }
})

test('an observation failure stays unknown and does not disclose its exception or suppress usage', async () => {
  leereProviderOpsBoardCache()
  const result = await sammleProviderOpsBoard({
    nowMs: () => NOW, vercelEnv: () => 'preview', domainZustaende: () => [],
    nativeRentalConfiguration: () => { throw new Error(SYNTHETIC_KEY) },
    liesModelUsage: async () => ({ ok: true, zeilen: 0, kostenMikroUsd: 0, juengsteCreatedAt: null }),
  })
  assert.equal(result.items[0].checks![0].status, 'unknown')
  assert.equal(result.items.find(item => item.id === 'model-usage')?.status, 'empty')
  assert.equal(JSON.stringify(result).includes(SYNTHETIC_KEY), false)
  assert.deepEqual(result.writeActions, [])
})

test('cached configuration retains its observation time and age; a later read observes changes', async () => {
  leereProviderOpsBoardCache()
  let now = NOW
  let kind: NativeRentalConfigurationSnapshot['kind'] = 'configured'
  let reads = 0
  const deps = {
    nowMs: () => now, vercelEnv: () => 'preview', domainZustaende: () => [],
    nativeRentalConfiguration: () => { reads++; return { kind } },
    liesModelUsage: async () => ({ ok: true as const, zeilen: 0, kostenMikroUsd: 0, juengsteCreatedAt: null }),
  }
  const first = await sammleProviderOpsBoard(deps)
  kind = 'disabled'
  now += 5_000
  const cached = await sammleProviderOpsBoard(deps)
  assert.equal(reads, 1)
  assert.equal(cached.checkedAt, first.checkedAt)
  assert.equal(cached.items[0].checks![0].status, 'configured')
  assert.equal(cached.items[0].checks![0].freshness.ageMs, 5_000)
  const stale = wendeEvidenceAlterAn(cached.items[0], NOW + 60_001)
  assert.equal(stale.checks![0].freshness.state, 'stale')
  assert.equal(providerOpsKarteIstGruen(stale.checks![0]), false)
  now = NOW + 30_001
  const next = await sammleProviderOpsBoard(deps)
  assert.equal(reads, 2)
  assert.equal(next.checkedAt, new Date(now).toISOString())
  assert.equal(next.items[0].checks![0].status, 'disabled')
})
