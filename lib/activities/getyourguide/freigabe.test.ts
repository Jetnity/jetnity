import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { GYG_GRUENDE, anwendungsFreigabe, freigabeIstOffen, geschlosseneFreigabe } from '@/lib/activities/getyourguide/freigabe'

describe('GetYourGuide-Freigabe', () => {
  test('die Anwendung ist der manuelle Widget-Weg und bleibt eingefroren', () => {
    const freigabe = anwendungsFreigabe()
    assert.equal(freigabe.status, 'bereit')
    assert.equal(freigabeIstOffen(freigabe), true)
    assert.equal(anwendungsFreigabe(), freigabe)
    assert.throws(() => {
      ;(freigabe as { status: string }).status = 'geschlossen'
    })
    const geschlossen = geschlosseneFreigabe()
    assert.equal(geschlossen.status, 'geschlossen')
    assert.deepEqual(geschlossen.status === 'geschlossen' ? geschlossen.gruende : [], [...GYG_GRUENDE])
    assert.equal(freigabeIstOffen(geschlossen), false)
  })
})
