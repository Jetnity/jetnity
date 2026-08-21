import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { kommerziellErhalten } from '@/lib/reiseaenderung/geschuetzt'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { leereMobilitaet } from '@/lib/trips/mobilitaet-felder'

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
    assert.equal(punkt?.bookingStatus, 'unconfirmed')
  })

  test('ein neues Element darf keinen Buchungsstatus erfinden', () => {
    const vorher = beispielreise()
    const nachher = beispielreise()
    nachher.days[1]!.items.push({
      id: 'item-erfunden',
      dayId: 'day-2',
      stageId: 'stage-1',
      kind: 'flight',
      title: 'Erfundener Flug',
      note: null,
      position: 2,
      startsOn: '2026-09-13',
      startsAt: null,
      endsOn: null,
      endsAt: null,
      priceAmount: null,
      priceCurrency: null,
      provider: null,
      externalRef: null,
      bookingUrl: null,
      bookingStatus: 'booked',
      bookingSource: 'user',
      bookingConfirmedAt: '2026-08-21T10:00:00.000Z',
      ...leereMobilitaet(),
    })

    const geschuetzt = kommerziellErhalten(vorher, nachher)
    const neu = geschuetzt.days[1]?.items.find((punkt) => punkt.id === 'item-erfunden')
    assert.equal(neu?.bookingStatus, 'unconfirmed')
    assert.equal(neu?.bookingSource, null)
    assert.equal(neu?.bookingConfirmedAt, null)
  })

  test('ein gebuchter Punkt ohne Preis bleibt kommerziell geschützt', () => {
    const vorher = beispielreise()
    vorher.days[0]!.items.push({
      id: 'item-nur-status',
      dayId: 'day-1',
      stageId: 'stage-1',
      kind: 'stay',
      title: 'Manuell bestätigt',
      note: null,
      position: 2,
      startsOn: '2026-09-12',
      startsAt: null,
      endsOn: '2026-09-14',
      endsAt: null,
      priceAmount: null,
      priceCurrency: null,
      provider: null,
      externalRef: null,
      bookingUrl: null,
      bookingStatus: 'booked',
      bookingSource: 'user',
      bookingConfirmedAt: '2026-08-21T10:00:00.000Z',
      ...leereMobilitaet(),
    })
    const nachher = structuredClone(vorher)
    nachher.days[0]!.items = nachher.days[0]!.items.filter((punkt) => punkt.id !== 'item-nur-status')
    const erfunden = nachher.days[0]!.items[0]!
    erfunden.bookingStatus = 'booked'
    erfunden.bookingSource = 'user'
    erfunden.bookingConfirmedAt = '2026-08-21T11:00:00.000Z'

    const geschuetzt = kommerziellErhalten(vorher, nachher)
    const bleibt = geschuetzt.days[0]?.items.find((punkt) => punkt.id === 'item-nur-status')
    assert.equal(bleibt?.title, 'Manuell bestätigt')
    assert.equal(bleibt?.bookingStatus, 'booked')
    const original = geschuetzt.days[0]?.items.find((punkt) => punkt.id === 'item-1')
    assert.equal(original?.bookingStatus, 'unconfirmed')
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
    assert.equal(neu?.bookingStatus, 'unconfirmed')
    assert.equal(neu?.bookingSource, null)
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

  test('ein übernommener stay bleibt gegen Modellmutation geschützt', () => {
    const vorher = beispielreise()
    vorher.days[0]!.items.push({
      id: 'item-stay',
      dayId: 'day-1',
      stageId: 'stage-1',
      kind: 'stay',
      title: 'Hotel Eixample · Eixample',
      note: '2026-09-12 bis 2026-09-14',
      position: 2,
      startsOn: '2026-09-12',
      startsAt: null,
      endsOn: '2026-09-14',
      endsAt: null,
      priceAmount: 760,
      priceCurrency: 'CHF',
      provider: 'test-hotel',
      externalRef: 'ref-77',
      bookingUrl: null,
      bookingStatus: 'unconfirmed',
      bookingSource: null,
      bookingConfirmedAt: null,
      ...leereMobilitaet(),
    })
    const nachher = structuredClone(vorher)
    const stay = nachher.days[0]!.items.find((punkt) => punkt.id === 'item-stay')
    assert.ok(stay)
    stay.title = 'Geändertes Hotel'
    stay.kind = 'note'
    stay.priceAmount = 10
    stay.startsOn = '2026-10-01'
    stay.provider = 'evil'
    stay.externalRef = 'hack'
    stay.dayId = 'day-2'

    const geschuetzt = kommerziellErhalten(vorher, nachher)
    const bleibt = geschuetzt.days[0]?.items.find((punkt) => punkt.id === 'item-stay')
    assert.equal(bleibt?.title, 'Hotel Eixample · Eixample')
    assert.equal(bleibt?.kind, 'stay')
    assert.equal(bleibt?.priceAmount, 760)
    assert.equal(bleibt?.startsOn, '2026-09-12')
    assert.equal(bleibt?.provider, 'test-hotel')
    assert.equal(bleibt?.externalRef, 'ref-77')
    assert.equal(bleibt?.dayId, 'day-1')
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
      bookingStatus: 'booked',
      bookingSource: 'user',
      bookingConfirmedAt: '2026-08-21T10:00:00.000Z',
      ...leereMobilitaet(),
    })
    const nachher = structuredClone(vorher)
    const flug = nachher.days[0]!.items.find((punkt) => punkt.id === 'item-flug')
    assert.ok(flug)
    flug.title = 'Geänderter Flug'
    flug.priceAmount = 10
    flug.startsAt = '03:00'
    flug.provider = 'evil'
    flug.bookingStatus = 'unconfirmed'
    flug.bookingSource = null
    flug.bookingConfirmedAt = null

    const geschuetzt = kommerziellErhalten(vorher, nachher)
    const bleibt = geschuetzt.days[0]?.items.find((punkt) => punkt.id === 'item-flug')
    assert.equal(bleibt?.title, 'ZRH → BKK · SWISS')
    assert.equal(bleibt?.priceAmount, 892.5)
    assert.equal(bleibt?.startsAt, '09:15')
    assert.equal(bleibt?.provider, 'duffel')
    assert.equal(bleibt?.kind, 'flight')
    assert.equal(bleibt?.bookingStatus, 'booked')
    assert.equal(bleibt?.bookingSource, 'user')
    assert.equal(bleibt?.bookingConfirmedAt, '2026-08-21T10:00:00.000Z')
  })

  test('eine gebuchte Verbindung bleibt gegen Modellmutation geschützt', () => {
    const vorher = beispielreise()
    vorher.days[0]!.items.push({
      id: 'item-zug',
      dayId: 'day-1',
      stageId: 'stage-1',
      kind: 'transfer',
      title: 'Zürich → Florenz',
      note: 'IC 890',
      position: 2,
      startsOn: '2026-09-12',
      startsAt: '08:10',
      endsOn: '2026-09-12',
      endsAt: '14:40',
      priceAmount: 89,
      priceCurrency: 'CHF',
      provider: null,
      externalRef: null,
      bookingUrl: null,
      bookingStatus: 'booked',
      bookingSource: 'user',
      bookingConfirmedAt: '2026-08-21T10:00:00.000Z',
      mobilityMode: 'rail',
      originPlaceId: 'geonames:2657896',
      destinationPlaceId: 'geonames:3176959',
      originName: 'Zürich',
      destinationName: 'Florenz',
      connectionRef: 'IC 890',
      mobilityChanges: 1,
      mobilityEvidence: 'user',
    })
    const nachher = structuredClone(vorher)
    const zug = nachher.days[0]!.items.find((punkt) => punkt.id === 'item-zug')
    assert.ok(zug)
    zug.title = 'Geänderter Zug'
    zug.priceAmount = 10
    zug.originName = 'Basel'
    zug.mobilityMode = 'bus'
    zug.bookingStatus = 'unconfirmed'
    zug.bookingSource = null
    zug.bookingConfirmedAt = null

    const geschuetzt = kommerziellErhalten(vorher, nachher)
    const bleibt = geschuetzt.days[0]?.items.find((punkt) => punkt.id === 'item-zug')
    assert.equal(bleibt?.title, 'Zürich → Florenz')
    assert.equal(bleibt?.kind, 'transfer')
    assert.equal(bleibt?.priceAmount, 89)
    assert.equal(bleibt?.originName, 'Zürich')
    assert.equal(bleibt?.mobilityMode, 'rail')
    assert.equal(bleibt?.connectionRef, 'IC 890')
    assert.equal(bleibt?.bookingStatus, 'booked')
    assert.equal(bleibt?.bookingSource, 'user')
    assert.equal(bleibt?.bookingConfirmedAt, '2026-08-21T10:00:00.000Z')
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
