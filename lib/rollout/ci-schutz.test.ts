import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

const checker = readFileSync(new URL('../../scripts/db/production-pruefen.ts', import.meta.url), 'utf8')
const gateB = readFileSync(new URL('../../scripts/db/gate-b-tw6-bundle.ts', import.meta.url), 'utf8')
const aal2 = readFileSync(new URL('../../scripts/db/aal2-prod-apply.ts', import.meta.url), 'utf8')

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
      assert.equal(kommando.includes('gate-b-tw6-bundle'), false, name)
      assert.equal(kommando.includes('aal2-prod-apply'), false, name)
    }
  })

  test('Production-Schreiben ist ein eigener, manueller Script-Aufruf', () => {
    assert.match(pkg.scripts['airports:importieren'] ?? '', /importieren/)
    assert.match(pkg.scripts['places:importieren'] ?? '', /importieren/)
    assert.match(pkg.scripts['production:pruefen'] ?? '', /production-pruefen/)
    assert.match(pkg.scripts['db:gate-b-tw6-bundle'] ?? '', /gate-b-tw6-bundle/)
    assert.match(pkg.scripts['db:aal2-prod-apply'] ?? '', /aal2-prod-apply/)
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

describe('Gate-B-Playbook schreibt Production nicht still', () => {
  test('Production-Apply bleibt im Script hart blockiert', () => {
    assert.match(gateB, /productionApplyAblehnen/)
    assert.match(gateB, /produktion-blockiert/)
  })
})

describe('AAL2-Einmal-Runner schreibt Production nicht still', () => {
  test('Default ist Probe, Write nur explizit, kein Secret-Log', () => {
    assert.match(aal2, /Lokale Probe fertig/)
    assert.match(aal2, /Kein Datenbank-Write/)
    assert.match(aal2, /--schreiben --produktion --projekt-ref/)
    assert.match(aal2, /keineSecrets/)
    assert.equal(aal2.includes('SUPABASE_ACCESS_TOKEN'), false)
    assert.equal(pkg.scripts['prebuild']?.includes('aal2-prod-apply'), false)
    assert.equal(pkg.scripts['test']?.includes('aal2-prod-apply'), false)
  })
})
