import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

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
