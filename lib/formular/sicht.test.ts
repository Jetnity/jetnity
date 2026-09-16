import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { feldInSichtNehmen, scrollVerhalten } from '@/lib/formular/sicht'

describe('Scrollverhalten', () => {
  test('bleibt weich, wenn keine Reduced-Motion-Praeferenz vorliegt', () => {
    assert.equal(scrollVerhalten(null), 'smooth')
    assert.equal(scrollVerhalten({ matches: false }), 'smooth')
  })

  test('wird instant, wenn Reduced Motion aktiv ist', () => {
    assert.equal(scrollVerhalten({ matches: true }), 'auto')
  })
})

describe('Erstes Fehlerfeld in Sicht nehmen', () => {
  test('scrollt zum Feld und setzt den Fokus, ohne nachzuspringen', () => {
    const aufrufe: unknown[] = []
    const ziel = {
      scrollIntoView(init?: ScrollIntoViewOptions) {
        aufrufe.push(['scroll', init])
      },
      focus(options?: FocusOptions) {
        aufrufe.push(['focus', options])
      },
    }

    assert.equal(feldInSichtNehmen(ziel), true)
    assert.deepEqual(aufrufe, [
      ['scroll', { block: 'center', inline: 'nearest', behavior: scrollVerhalten() }],
      ['focus', { preventScroll: true }],
    ])
  })

  test('ohne Element geschieht nichts', () => {
    assert.equal(feldInSichtNehmen(null), false)
    assert.equal(feldInSichtNehmen(undefined), false)
  })
})
