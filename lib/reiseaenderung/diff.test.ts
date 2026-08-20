import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { reiseDiff } from '@/lib/reiseaenderung/diff'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'

describe('Der Vorher/Nachher-Diff', () => {
  test('Reisende und Tempo erscheinen als Stammdaten', () => {
    const nachher = beispielreise({ travellers: 3, pace: 'calm' })
    const texte = reiseDiff(beispielreise(), nachher).map((eintrag) => eintrag.text)
    assert.ok(texte.some((text) => text.includes('Reisende: 2 → 3')))
    assert.ok(texte.some((text) => /Tempo:/.test(text)))
  })

  test('unveränderte Reisen ergeben eine leere Liste', () => {
    const reise = beispielreise()
    assert.deepEqual(reiseDiff(reise, reise), [])
  })

  test('entfernte Etappen werden genannt', () => {
    const nachher = beispielreise({
      stages: beispielreise().stages.filter((etappe) => etappe.id === 'stage-1'),
      days: beispielreise().days.filter((tag) => tag.stageId === 'stage-1'),
    })
    assert.ok(reiseDiff(beispielreise(), nachher).some((eintrag) => eintrag.text === 'Entfernt: Rom'))
  })
})
