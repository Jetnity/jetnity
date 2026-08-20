import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

const checker = readFileSync(new URL('../../scripts/db/production-pruefen.ts', import.meta.url), 'utf8')

describe('CI und Build beschreiben Production nicht', () => {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
    scripts: Record<string, string>
  }

  test('prebuild, build, test und Hygiene rufen keinen Import auf', () => {
    const automatisch = ['prebuild', 'build', 'test', 'check:setup', 'check:setup:ci']
    for (const name of automatisch) {
      const kommando = pkg.scripts[name] ?? ''
      assert.equal(kommando.includes('importieren'), false, name)
      assert.equal(kommando.includes('production:pruefen'), false, name)
      assert.equal(kommando.includes('--produktion'), false, name)
    }
  })

  test('Production-Schreiben ist ein eigener, manueller Script-Aufruf', () => {
    assert.match(pkg.scripts['airports:importieren'] ?? '', /importieren/)
    assert.match(pkg.scripts['places:importieren'] ?? '', /importieren/)
    assert.match(pkg.scripts['production:pruefen'] ?? '', /production-pruefen/)
  })
})

describe('Production-Check bleibt read-only', () => {
  test('kein mutierender HTTP-Pfad', () => {
    assert.equal(checker.includes('fetch('), false)
    assert.equal(/\bmethod\s*:\s*['"]POST['"]/i.test(checker), false)
    assert.equal(/\bmethod\s*:\s*['"]PUT['"]/i.test(checker), false)
    assert.equal(/\bmethod\s*:\s*['"]PATCH['"]/i.test(checker), false)
    assert.equal(/\bmethod\s*:\s*['"]DELETE['"]/i.test(checker), false)
    assert.equal(checker.includes('projektSchluessel'), false)
  })

  test('kein mutierender SQL-Pfad', () => {
    assert.equal(/\binsert\s+into\b/i.test(checker), false)
    assert.equal(/\bupdate\s+public\./i.test(checker), false)
    assert.equal(/\bdelete\s+from\b/i.test(checker), false)
    assert.equal(/\btruncate\s+table\b/i.test(checker), false)
    assert.equal(/\bdrop\s+table\b/i.test(checker), false)
    assert.match(checker, /role_table_grants/)
    assert.match(checker, /pg_policies/)
    assert.match(checker, /relrowsecurity/)
  })
})
