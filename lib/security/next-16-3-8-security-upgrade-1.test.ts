import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '../..')
const lese = (relativ: string) => readFileSync(join(wurzel, relativ), 'utf8')

describe('Next.js security patch chain (historic 16.4.1, current 16.4.6)', () => {
  test('current exact pins are 16.4.6 without moving React', () => {
    const pkg = JSON.parse(lese('package.json')) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }
    assert.equal(pkg.dependencies.next, '16.4.6')
    assert.equal(pkg.devDependencies['eslint-config-next'], '16.4.6')
    assert.equal(pkg.dependencies.react, '19.2.8')
    assert.equal(pkg.dependencies['react-dom'], '19.2.8')
    assert.equal(pkg.dependencies.next.includes('canary'), false)
    assert.equal(pkg.dependencies.next.includes('16.3.7'), false)
  })

  test('image allowlist stays the three fixed patterns and is not widened', () => {
    const config = lese('next.config.js')
    assert.match(config, /hostname:\s*'oaidalleapiprodscus\.blob\.core\.windows\.net'/)
    assert.match(config, /pathname:\s*'\/\*\*'/)
    assert.match(config, /hostname:\s*supabaseHost/)
    assert.match(config, /pathname:\s*'\/storage\/v1\/object\/public\/\*\*'/)
    assert.match(config, /hostname:\s*'jetnity\.ai'/)
    assert.match(config, /pathname:\s*'\/static\/avatars\/\*\*'/)
    assert.equal(/hostname:\s*['"]\*/.test(config), false)
    assert.equal(config.includes('images.domains'), false)
    assert.equal(config.includes('cacheComponents'), false)
    assert.equal(config.includes('useCache'), false)
  })

  test('16.4.1 native audit remains immutable dated evidence, not falsely rerun on 16.4.6', () => {
    // The October auditor intentionally pins old package and deployment hashes.
    // Keep that report as dated original evidence rather than suppress its
    // failure or rewriting its historical attestation for a new release.
    const report = JSON.parse(lese('docs/evidence/next-16-4-1-security-patch-p1/audit.json')) as {
      slice: string
      pins: { next: string; eslintConfigNext: string }
      inventory: Record<string, string[]>
      failures: string[]
    }
    assert.equal(report.slice, 'next-16-4-1-security-patch-p1')
    assert.equal(report.pins.next, '16.4.1')
    assert.equal(report.pins.eslintConfigNext, '16.4.1')
    assert.deepEqual(report.failures, [])
    for (const kind of ['nextOgImports', 'imageResponse', 'dynamicParams', 'generateStaticParams',
      'useCacheDirectives', 'draftModeCalls', 'metadataImageRoutes', 'catchAllRoutes']) {
      assert.deepEqual(report.inventory[kind], [], kind)
    }
    assert.deepEqual(report.inventory.nextImageImports.slice().sort(), [
      'components/home/HomeHero.tsx',
      'components/home/HomeInspiration.tsx',
      'components/inspiration/explorer-1/Inspirationskarte.tsx',
      'components/layout/Footer.tsx',
      'components/layout/PublicNavbar.tsx',
    ])
  })
})
