import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { oeffentlicheFehlerId } from './oeffentliche-fehler-id'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')
const KONSTANTE_FALLBACKS = ['#unbekannt', '#unknown', '#n/a', '#fallback', '#error']

describe('Öffentliche Fehler-ID bleibt digest-first und instanzstabil', () => {
  test('Digest ist die bevorzugte Support-ID', () => {
    assert.equal(oeffentlicheFehlerId('abc123', ':r0:'), '#abc123')
    assert.equal(oeffentlicheFehlerId('  digest-9  ', ':r1:'), '#digest-9')
  })

  test('ohne Digest entsteht eine nicht-konstante ID je Instanz', () => {
    const erste = oeffentlicheFehlerId(undefined, ':r0:')
    const zweite = oeffentlicheFehlerId(undefined, ':r1:')
    const gleiche = oeffentlicheFehlerId(undefined, ':r0:')

    assert.equal(erste, '#r0')
    assert.equal(gleiche, erste)
    assert.notEqual(erste, zweite)
    assert.equal(oeffentlicheFehlerId('', ':R7j:'), '#R7j')
    assert.equal(oeffentlicheFehlerId('   ', ':r2:'), '#r2')

    for (const verboten of KONSTANTE_FALLBACKS) {
      assert.notEqual(erste, verboten)
      assert.notEqual(zweite, verboten)
    }
  })

  test('leere Instanz ohne Digest ist kein stiller Konstanten-Fallback', () => {
    assert.throws(() => oeffentlicheFehlerId(undefined, ''), /Instanzkennung fehlt/)
    assert.throws(() => oeffentlicheFehlerId(undefined, ':::'), /Instanzkennung fehlt/)
  })

  test('error.tsx nutzt useId und keinen unreinen oder konstanten Fallback', () => {
    const quelle = readFileSync(join(wurzel, 'app/(public)/error.tsx'), 'utf8')
    assert.match(quelle, /oeffentlicheFehlerId\(/)
    assert.match(quelle, /React\.useId\(/)
    assert.equal(/Date\.now\s*\(/.test(quelle), false)
    assert.equal(/Math\.random\s*\(/.test(quelle), false)
    assert.equal(/#unbekannt/.test(quelle), false)
    assert.equal(/['"`]unbekannt['"`]/.test(quelle), false)
  })
})
