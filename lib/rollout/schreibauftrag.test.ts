import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  anwendenAuftragLesen,
  importAuftragLesen,
  pruefenAuftragLesen,
  refsStimmenUeberein,
} from '@/lib/rollout/schreibauftrag'

const env = { SUPABASE_PROJECT_REF: 'abcdefghijklmnop' }

describe('Schreibauftrag', () => {
  test('ohne Flags bleibt der Import eine Probe', () => {
    assert.deepEqual(importAuftragLesen([], env), { modus: 'probe' })
    assert.deepEqual(importAuftragLesen(['--entwicklung'], env), { modus: 'probe' })
  })

  test('Development-Schreiben braucht beide Flags', () => {
    assert.deepEqual(importAuftragLesen(['--schreiben', '--entwicklung'], env), {
      modus: 'entwicklung',
      bereinigen: false,
    })
    assert.throws(
      () => importAuftragLesen(['--schreiben'], env),
      /--schreiben --entwicklung oder --schreiben --produktion/,
    )
  })

  test('Production-Schreiben braucht Ref-Bestätigung und lehnt Bereinigen ab', () => {
    assert.deepEqual(
      importAuftragLesen(
        ['--schreiben', '--produktion', '--projekt-ref', 'abcdefghijklmnop'],
        env,
      ),
      { modus: 'produktion', bestaetigterRef: 'abcdefghijklmnop' },
    )
    assert.throws(
      () => importAuftragLesen(['--schreiben', '--produktion'], env),
      /exakten Ziel-Project-Ref/,
    )
    assert.throws(
      () =>
        importAuftragLesen(
          ['--schreiben', '--produktion', '--projekt-ref', 'abcdefghijklmnop', '--bereinigen'],
          env,
        ),
      /bereinigt nicht/,
    )
  })

  test('falscher Ref, fehlende Umgebung und Mischflags brechen ab', () => {
    assert.throws(
      () =>
        importAuftragLesen(
          ['--schreiben', '--produktion', '--projekt-ref', 'anderer-ref'],
          env,
        ),
      /stimmt nicht/,
    )
    assert.throws(
      () =>
        importAuftragLesen(['--schreiben', '--produktion', '--projekt-ref', 'abcdefghijklmnop'], {}),
      /SUPABASE_PROJECT_REF fehlt/,
    )
    assert.throws(
      () => importAuftragLesen(['--schreiben', '--entwicklung', '--produktion'], env),
      /schliessen einander aus/,
    )
    assert.equal(refsStimmenUeberein('abc', 'abc'), 'abc')
  })

  test('Anwenden bleibt ohne Production-Flags auf Development', () => {
    assert.deepEqual(anwendenAuftragLesen([], env), { modus: 'entwicklung' })
    assert.deepEqual(
      anwendenAuftragLesen(['--produktion', '--projekt-ref', 'abcdefghijklmnop'], env),
      { modus: 'produktion', bestaetigterRef: 'abcdefghijklmnop' },
    )
  })

  test('der Check hat kein stilles Default-Ziel', () => {
    assert.throws(() => pruefenAuftragLesen([], env), /Kein stilles Default-Ziel/)
    assert.deepEqual(pruefenAuftragLesen(['--entwicklung'], env), { modus: 'entwicklung' })
  })
})
