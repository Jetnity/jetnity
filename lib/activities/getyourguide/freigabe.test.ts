import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { GYG_GRUENDE, anwendungsFreigabe, freigabeIstOffen } from '@/lib/activities/getyourguide/freigabe'

describe('GetYourGuide-Freigabe', () => {
  test('die Anwendung hat keinen offenen Zweig', () => {
    const freigabe = anwendungsFreigabe()
    assert.deepEqual(freigabe.status === 'geschlossen' ? freigabe.gruende : [], [...GYG_GRUENDE])
    assert.equal(freigabe.status, 'geschlossen')
    assert.equal(freigabeIstOffen(freigabe), false)
    assert.equal(anwendungsFreigabe(), freigabe)
    assert.throws(() => {
      ;(freigabe as { status: string }).status = 'bereit'
    })
  })
})
