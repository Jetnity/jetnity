/** Controlled in-memory negative evidence; never edits the real checkout or installation. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { collect, validate } from './audit.mjs'

const actual = collect()
test('actual installed graph and unchanged historical control pass', () => {
  assert.deepEqual(validate(actual), [])
})

const cases = [
  ['stale manifest pin', s => { s.pkg.dependencies.next = '16.3.8' }, 'next manifest pin drift'],
  ['stale root lock pin', s => { s.lock.packages[''].dependencies.next = '16.3.8' }, 'root lock dependencies drift'],
  ['stale Next lock', s => { s.lock.packages['node_modules/next'].version = '16.3.8' }, 'next locked pin drift'],
  ['stale eslint-config-next install', s => { s.installed['node_modules/eslint-config-next'].version = '16.3.8' }, 'eslint-config-next installed pin drift'],
  ['Next prerelease', s => { s.lock.packages['node_modules/next'].version = '16.4.1-canary.1' }, 'node_modules/next non-stable version'],
  ['vulnerable Sharp', s => { s.lock.packages['node_modules/sharp'].version = '0.35.4' }, 'node_modules/sharp below Sharp floor'],
  ['Sharp prerelease', s => { s.lock.packages['node_modules/sharp'].version = '0.35.5-rc.1' }, 'node_modules/sharp below Sharp floor'],
  ['stale Linux native on Mac too', s => { s.lock.packages['node_modules/@img/sharp-linux-x64'].version = '0.35.4' }, 'node_modules/@img/sharp-linux-x64 below Sharp floor'],
  ['missing locked Linux binary', s => { delete s.lock.packages['node_modules/@img/sharp-linux-x64'] }, 'node_modules/sharp optional native graph mismatch: @img/sharp-linux-x64'],
  ['native declaration mismatch', s => { s.lock.packages['node_modules/sharp'].optionalDependencies['@img/sharp-linux-x64'] = '0.35.4' }, 'node_modules/sharp optional native graph mismatch: @img/sharp-linux-x64'],
  ['nested vulnerable binary', s => { s.lock.packages['node_modules/next/node_modules/@img/sharp-linux-x64'] = { ...s.lock.packages['node_modules/@img/sharp-linux-x64'], version: '0.35.4' } }, 'node_modules/next/node_modules/@img/sharp-linux-x64 below Sharp floor'],
  ['stale libvips', s => { s.lock.packages['node_modules/@img/sharp-libvips-linux-x64'].version = '1.3.3' }, 'node_modules/@img/sharp-libvips-linux-x64 below separate libvips package floor'],
  ['missing installed host binding', s => { delete s.installed[`node_modules/${s.runtime.native}`] }, 'host native binding missing'],
  ['stale installed host binding', s => { s.installed[`node_modules/${s.runtime.native}`].version = '0.35.4' }, `node_modules/${actual.runtime.native} installed provenance mismatch`],
  ['stale hidden installation lock', s => { s.installLock.packages['node_modules/sharp'].version = '0.35.4' }, 'node_modules/sharp installed provenance mismatch'],
  ['loaded vulnerable Sharp', s => { s.runtime.versions.sharp = '0.35.4' }, 'loaded Sharp version drift'],
  ['alternate native resolution', s => { s.runtime.nativeEntry = 'outside/sharp.node' }, 'host native binding resolution drift'],
  ['alternate loaded binary', s => { s.runtime.nativeBinary = 'outside/sharp.node' }, 'loaded native binary provenance drift'],
  ['unofficial registry', s => { s.lock.packages['node_modules/next'].resolved = 'https://invalid.example/next.tgz' }, 'node_modules/next registry provenance missing'],
  ['wrong published integrity', s => { s.lock.packages['node_modules/next'].integrity = 'sha512-AAAA' }, 'node_modules/next published integrity mismatch'],
  ['unexpected historical success', s => { s.historical.status = 0 }, 'historical audit unexpected process result'],
  ['historical process error', s => { s.historical.error = true }, 'historical audit unexpected process result'],
  ['historical stderr', s => { s.historical.stderrEmpty = false }, 'historical audit unexpected process result'],
  ['extra historical failure', s => { s.historical.report.failures.push('wildcard image hostname is forbidden') }, 'historical audit unexpected failures'],
  ['missing historical mismatch', s => { s.historical.report.failures.pop() }, 'historical audit unexpected failures'],
  ['changed historical executable', s => { s.protectedBlobs['scripts/next-16-3-8-security-upgrade-1-audit.mjs'] = 'altered' }, 'historical audit/config/deployment blob drift'],
  ['changed config bytes', s => { s.protectedBlobs['next.config.js'] = 'altered' }, 'historical audit/config/deployment blob drift'],
  ['widened host', s => { s.historical.report.remotePatterns[0].hostname = '*' }, 'historical remotePatterns drift'],
  ['cache enabled', s => { s.historical.report.deployment.cacheComponents = true }, 'historical deployment drift'],
  ['use-cache source', s => { s.historical.report.inventory.useCacheDirectives.push('lib/example.ts') }, 'historical inventory drift'],
  ['new catch-all route', s => { s.historical.report.inventory.catchAllRoutes.push('app/[...path]') }, 'historical inventory drift'],
  ['changed action body', s => { s.serverActions['app/auth/sign-out.ts'] = 'altered' }, 'server action source inventory drift'],
  ['React pin drift', s => { s.pkg.dependencies.react = '19.2.9' }, 'react manifest pin drift'],
  ['override drift', s => { s.pkg.overrides['simple-swizzle'] = '0.2.3' }, 'package override drift'],
  ['Node line drift', s => { s.runtime.node = '20.9.0' }, 'Node 22 compatibility contract drift'],
  ['missing historical report', s => { s.historical.report = null }, 'audit input missing or malformed'],
  ['missing lock', s => { s.lock = null }, 'audit input missing or malformed'],
]
for (const [name, mutate, expected] of cases) test(`fail closed: ${name}`, () => {
  const snapshot = structuredClone(actual)
  mutate(snapshot)
  assert.ok(validate(snapshot).includes(expected), `${name}: expected ${expected}`)
})
