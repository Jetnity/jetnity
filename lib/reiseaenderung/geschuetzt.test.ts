import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { kommerziellErhalten } from '@/lib/reiseaenderung/geschuetzt'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'

describe('Geschützte kommerzielle Felder', () => {
  test('gleiche Kennung behält Preis und Anbieter', () => {
    const vorher = beispielreise()
    const nachher = beispielreise()
    nachher.days[0]!.items[0]!.title = 'Dom von Florenz'
    nachher.days[0]!.items[0]!.priceAmount = 999
    nachher.days[0]!.items[0]!.provider = 'evil'

    const geschuetzt = kommerziellErhalten(vorher, nachher)
    const punkt = geschuetzt.days[0]?.items[0]
    assert.equal(punkt?.title, 'Dom von Florenz')
    assert.equal(punkt?.priceAmount, 18)
    assert.equal(punkt?.provider, 'getyourguide')
    assert.equal(punkt?.bookingUrl, 'https://example.com/dom')
  })

  test('eine neue Kennung bleibt ohne Handelsfelder', () => {
    const vorher = beispielreise()
    const nachher = beispielreise()
    nachher.days[1]!.items.push({
      ...nachher.days[0]!.items[0]!,
      id: 'item-neu',
      title: 'Gelato',
      priceAmount: 12,
      provider: 'gyg',
    })

    const geschuetzt = kommerziellErhalten(vorher, nachher)
    const neu = geschuetzt.days[1]?.items.find((punkt) => punkt.id === 'item-neu')
    assert.equal(neu?.priceAmount, null)
    assert.equal(neu?.provider, null)
    assert.equal(neu?.bookingUrl, null)
  })
})
