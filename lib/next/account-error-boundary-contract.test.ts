import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')
const datei = 'app/account/error.tsx'
const KONSTANTE_FALLBACKS = ['#unbekannt', '#unknown', '#n/a', '#fallback', '#error']
const DATEN_UNBERUEHRT = [
  'nicht betroffen',
  'davon nicht betroffen',
  'gespeicherten Reisen sind',
  'Daten sind sicher',
  'Daten bleiben erhalten',
  'unaffected',
]
const OPERATOR_KORRELATION = [
  'nachverfolgbar',
  'korreliert',
  'operator-side',
  'Support findet',
  'wir finden den Fehler',
  'melde diese ID',
  'an den Support',
]

describe('Account-Fehlergrenze existiert und bleibt wahrheits- und sicherheitstreu', () => {
  test('app/account/error.tsx ist eine Client-Fehlergrenze mit Reset und sicherem Ausgang', () => {
    assert.equal(existsSync(join(wurzel, datei)), true)
    const quelle = readFileSync(join(wurzel, datei), 'utf8')

    assert.match(quelle, /^'use client'/m)
    assert.match(quelle, /oeffentlicheFehlerId\(/)
    assert.match(quelle, /React\.useId\(/)
    assert.match(quelle, /reset\s*\(\s*\)/)
    assert.match(quelle, /href=["']\/reisen["']/)
    assert.equal(/href=["']\/account(?:\/[^"']*)?["']/.test(quelle), false)
    assert.match(quelle, /Erneut versuchen/)
    assert.match(quelle, /<main[\s>]/)
    assert.match(quelle, /<h1[\s>]/)
    assert.match(quelle, /min-h-11/)
    assert.match(quelle, /Fehler-ID/)
    assert.match(quelle, /mailto:info@jetnity\.ch/)
    assert.match(quelle, /info@jetnity\.ch/)
  })

  test('Fehler-ID bleibt digest-first und ohne unreinen oder konstanten Fallback', () => {
    const quelle = readFileSync(join(wurzel, datei), 'utf8')
    assert.equal(/Date\.now\s*\(/.test(quelle), false)
    assert.equal(/Math\.random\s*\(/.test(quelle), false)
    for (const verboten of KONSTANTE_FALLBACKS) {
      assert.equal(quelle.includes(verboten), false, verboten)
    }
  })

  test('keine Behauptung, gespeicherte Daten seien unberührt oder die Fehler-ID sei operatorseitig korreliert', () => {
    const quelle = readFileSync(join(wurzel, datei), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    for (const verboten of DATEN_UNBERUEHRT) {
      assert.equal(quelle.toLowerCase().includes(verboten.toLowerCase()), false, verboten)
    }
    for (const verboten of OPERATOR_KORRELATION) {
      assert.equal(quelle.toLowerCase().includes(verboten.toLowerCase()), false, verboten)
    }
  })

  test('Production zeigt keine Rohdetails; Diagnose nur ausserhalb von Production', () => {
    const quelle = readFileSync(join(wurzel, datei), 'utf8')
    assert.equal(/error\.stack/.test(quelle), false)
    assert.match(quelle, /process\.env\.NODE_ENV\s*!==\s*['"]production['"]/)

    const ohneDevDiagnose = quelle
      .replace(
        /if\s*\(\s*process\.env\.NODE_ENV\s*!==\s*['"]production['"]\s*\)\s*\{[\s\S]*?\}/g,
        '',
      )
      .replace(
        /\{process\.env\.NODE_ENV\s*!==\s*['"]production['"]\s*&&\s*\([\s\S]*?\)\}/g,
        '',
      )
    assert.equal(/error\?\.message/.test(ohneDevDiagnose), false)
    assert.equal(/error\.message/.test(ohneDevDiagnose), false)
    assert.equal(/console\.error\s*\(/.test(ohneDevDiagnose), false)
    assert.equal(/console\.error\s*\([\s\S]*?\berror\b/.test(ohneDevDiagnose), false)
  })
})
