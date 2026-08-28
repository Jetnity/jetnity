import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')
const lese = (relativ: string) => readFileSync(join(wurzel, relativ), 'utf8')

describe('Next-16-S2 Framework-Vertrag', () => {
  const pkg = JSON.parse(lese('package.json')) as {
    scripts: Record<string, string>
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
  }

  test('Framework-Linie ist Next 16.3.3 plus kompatible 19.2/ESLint/TS-Linie', () => {
    assert.equal(pkg.dependencies.next, '16.3.3')
    assert.equal(pkg.dependencies.react, '19.2.8')
    assert.equal(pkg.dependencies['react-dom'], '19.2.8')
    assert.equal(pkg.devDependencies['eslint-config-next'], '16.3.3')
    assert.equal(pkg.devDependencies.eslint, '9.39.5')
    assert.match(pkg.devDependencies.typescript, /^5\./)
    assert.match(pkg.devDependencies['@types/react'], /^19\.2\./)
    assert.match(pkg.devDependencies['@types/react-dom'], /^19\.2\./)
  })

  test('lint nutzt ESLint CLI und Flat Config, nicht next lint', () => {
    assert.equal(pkg.scripts.lint, 'eslint .')
    assert.equal(pkg.scripts.lint.includes('next lint'), false)
    assert.equal(existsSync(join(wurzel, '.eslintrc.json')), false)
    assert.equal(existsSync(join(wurzel, '.eslintrc.js')), false)
    const flat = lese('eslint.config.mjs')
    assert.match(flat, /eslint-config-next\/core-web-vitals/)
    assert.match(flat, /eslint-config-next\/typescript/)
    assert.match(flat, /\.next\/\*\*/)
    assert.match(flat, /out\/\*\*/)
    assert.match(flat, /build\/\*\*/)
    assert.match(flat, /next-env\.d\.ts/)
    assert.match(flat, /eslint-config-next\/core-web-vitals/)
    assert.equal(flat.includes("'off'") && /react-hooks\/set-state-in-effect['"]:\s*['"]off['"]/.test(flat), false)
    assert.equal(flat.includes("'react-hooks/set-state-in-effect': 'warn'"), true)
    assert.equal(flat.includes("'@typescript-eslint/no-explicit-any': 'warn'"), true)
  })

  test('Next Config bleibt ohne Cache Components, PPR und React Compiler', () => {
    const config = lese('next.config.js')
    assert.match(config, /typedRoutes:\s*true/)
    assert.equal(config.includes('experimental: {'), true)
    assert.equal(/experimental:\s*\{[\s\S]*typedRoutes/.test(config), false)
    assert.equal(config.includes('cacheComponents'), false)
    assert.equal(config.includes('experimental_ppr'), false)
    assert.equal(config.includes('reactCompiler'), false)
    assert.equal(config.includes('--webpack'), false)
    assert.match(config, /optimizePackageImports:\s*\['lucide-react'\]/)
  })

  test('Admin-Login nutzt React-19 useActionState, nicht useFormState', () => {
    const login = lese('app/(public)/admin/login/page.tsx')
    assert.match(login, /import \{ useActionState \} from 'react'/)
    assert.match(login, /useActionState<AuthState, FormData>\(signInWithPasswordAction/)
    assert.match(login, /useActionState<AuthState, FormData>\(sendMagicLinkAction/)
    assert.equal(login.includes('useFormState'), false)
    assert.match(login, /useFormStatus/)
  })
})
