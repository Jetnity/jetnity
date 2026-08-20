import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { kommerziellErhalten } from '@/lib/reiseaenderung/geschuetzt'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'

describe('Geschützte kommerzielle Felder', () => {
  test('gleiche Kennung stellt den kommerziellen Punkt vollständig wieder her', () => {
    const vorher = beispielreise()
    const nachher = beispielreise()
    nachher.days[0]!.items[0]!.title = 'Dom von Florenz'
    nachher.days[0]!.items[0]!.kind = 'note'
    nachher.days[0]!.items[0]!.note = 'geändert'
    nachher.days[0]!.items[0]!.startsOn = '2026-10-01'
    nachher.days[0]!.items[0]!.startsAt = '18:00'
    nachher.days[0]!.items[0]!.priceAmount = 999
    nachher.days[0]!.items[0]!.provider = 'evil'

    const geschuetzt = kommerziellErhalten(vorher, nachher)
    const punkt = geschuetzt.days[0]?.items[0]
    assert.equal(punkt?.title, 'Dom')
    assert.equal(punkt?.kind, 'activity')
    assert.equal(punkt?.note, null)
    assert.equal(punkt?.startsOn, '2026-09-12')
    assert.equal(punkt?.startsAt, '09:00')
    assert.equal(punkt?.dayId, 'day-1')
    assert.equal(punkt?.stageId, 'stage-1')
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

  test('ein verschwundener kommerzieller Punkt kehrt auf seinen Tag zurück', () => {
    const vorher = beispielreise()
    const nachher = beispielreise()
    nachher.days[0]!.items = []

    const geschuetzt = kommerziellErhalten(vorher, nachher)
    assert.equal(geschuetzt.ohneTag.some((punkt) => punkt.id === 'item-1'), false)
    const dom = geschuetzt.days[0]?.items.find((punkt) => punkt.id === 'item-1')
    assert.equal(dom?.title, 'Dom')
    assert.equal(dom?.kind, 'activity')
    assert.equal(dom?.startsOn, '2026-09-12')
    assert.equal(dom?.startsAt, '09:00')
    assert.equal(dom?.provider, 'getyourguide')
    assert.equal(dom?.priceAmount, 18)
    assert.equal(dom?.dayId, 'day-1')
    assert.equal(dom?.stageId, 'stage-1')
  })

  test('ein übernommener Flug bleibt gegen Modellmutation geschützt', () => {
    const vorher = beispielreise()
    vorher.days[0]!.items.push({
      id: 'item-flug',
      dayId: 'day-1',
      stageId: 'stage-1',
      kind: 'flight',
      title: 'ZRH → BKK · SWISS',
      note: 'LX180 ZRH 09:15 → BKK 21:40',
      position: 2,
      startsOn: '2026-11-01',
      startsAt: '09:15',
      endsOn: '2026-11-01',
      endsAt: '21:40',
      priceAmount: 892.5,
      priceCurrency: 'CHF',
      provider: 'duffel',
      externalRef: '1:ZRH:BKK:20261101:LX180',
      bookingUrl: null,
    })
    const nachher = structuredClone(vorher)
    const flug = nachher.days[0]!.items.find((punkt) => punkt.id === 'item-flug')
    assert.ok(flug)
    flug.title = 'Geänderter Flug'
    flug.priceAmount = 10
    flug.startsAt = '03:00'
    flug.provider = 'evil'

    const geschuetzt = kommerziellErhalten(vorher, nachher)
    const bleibt = geschuetzt.days[0]?.items.find((punkt) => punkt.id === 'item-flug')
    assert.equal(bleibt?.title, 'ZRH → BKK · SWISS')
    assert.equal(bleibt?.priceAmount, 892.5)
    assert.equal(bleibt?.startsAt, '09:15')
    assert.equal(bleibt?.provider, 'duffel')
    assert.equal(bleibt?.kind, 'flight')
  })

  test('ohne Tag oder Etappe bleibt der kommerzielle Punkt ungeplant und unverändert', () => {
    const vorher = beispielreise()
    const nachher = beispielreise()
    nachher.days = nachher.days.filter((tag) => tag.stageId !== 'stage-1')
    nachher.stages = nachher.stages.filter((etappe) => etappe.id !== 'stage-1')

    const geschuetzt = kommerziellErhalten(vorher, nachher)
    const dom = geschuetzt.ohneTag.find((punkt) => punkt.id === 'item-1')
    assert.equal(geschuetzt.days.some((tag) => tag.items.some((punkt) => punkt.id === 'item-1')), false)
    assert.equal(dom?.title, 'Dom')
    assert.equal(dom?.kind, 'activity')
    assert.equal(dom?.startsOn, '2026-09-12')
    assert.equal(dom?.startsAt, '09:00')
    assert.equal(dom?.provider, 'getyourguide')
    assert.equal(dom?.priceAmount, 18)
    assert.equal(dom?.dayId, null)
    assert.equal(dom?.stageId, null)
  })
})
