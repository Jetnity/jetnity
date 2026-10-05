import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '../..')
const lese = (relativ: string) => readFileSync(join(wurzel, relativ), 'utf8')

describe('Next.js 16.3.8 security upgrade 1', () => {
  test('exact pins stay on 16.3.8 without moving React', () => {
    const pkg = JSON.parse(lese('package.json')) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }
    assert.equal(pkg.dependencies.next, '16.3.8')
    assert.equal(pkg.devDependencies['eslint-config-next'], '16.3.8')
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

  test('audit script reports no runtime advisory prerequisites and exits 0', () => {
    const run = spawnSync(process.execPath, ['scripts/next-16-3-8-security-upgrade-1-audit.mjs'], {
      cwd: wurzel,
      encoding: 'utf8',
    })
    assert.equal(run.status, 0, run.stderr || run.stdout)
    const report = JSON.parse(run.stdout) as {
      pins: { next: string; eslintConfigNext: string }
      inventory: {
        nextOgImports: string[]
        imageResponse: string[]
        dynamicParams: string[]
        generateStaticParams: string[]
        useCacheDirectives: string[]
        draftModeCalls: string[]
        metadataImageRoutes: string[]
        catchAllRoutes: string[]
        nextImageImports: string[]
      }
      failures: string[]
    }
    assert.equal(report.pins.next, '16.3.8')
    assert.equal(report.pins.eslintConfigNext, '16.3.8')
    assert.deepEqual(report.failures, [])
    assert.deepEqual(report.inventory.nextOgImports, [])
    assert.deepEqual(report.inventory.imageResponse, [])
    assert.deepEqual(report.inventory.dynamicParams, [])
    assert.deepEqual(report.inventory.generateStaticParams, [])
    assert.deepEqual(report.inventory.useCacheDirectives, [])
    assert.deepEqual(report.inventory.draftModeCalls, [])
    assert.deepEqual(report.inventory.metadataImageRoutes, [])
    assert.deepEqual(report.inventory.catchAllRoutes, [])
    assert.deepEqual(report.inventory.nextImageImports.sort(), [
      'components/home/HomeHero.tsx',
      'components/home/HomeInspiration.tsx',
      'components/layout/Footer.tsx',
      'components/layout/PublicNavbar.tsx',
    ])
  })
})
