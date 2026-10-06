import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import FlugRoute from '@/components/trips/FlugRoute'
import { routeFactsAusItinerary } from '@/lib/route/ableitung'
import { routeAnzeigeAusFacts } from '@/lib/route/anzeige'
import type { RouteFacts, RouteSegment } from '@/lib/route/domain'
import { itineraryDirekt, itineraryEinTransit } from '@/lib/route/fixtures'
import { manuelleFlugRouteBauen } from '@/lib/trips/flug-manuell'

function direkt(zeiten: Partial<RouteSegment> = {}): RouteFacts {
  const itinerary = itineraryDirekt()
  Object.assign(itinerary.legs[0]!.segments[0]!, zeiten)
  return routeFactsAusItinerary(itinerary)
}

function render(facts: RouteFacts): string {
  return renderToStaticMarkup(createElement(FlugRoute, { facts }))
}

function einmal(html: string, text: string): void {
  assert.equal(html.split(text).length - 1, 1, `Expected exactly one occurrence of ${text}`)
}

function direkterReadback(facts: RouteFacts, erwartet: string): void {
  const vorher = structuredClone(facts)
  const html = render(facts)
  einmal(html, `>${erwartet}</p>`)
  assert.doesNotMatch(html, /<details|<summary|<ol|Segment 1|UTC|GMT|Flugdauer|\d+ h|\d+ min/)
  assert.deepEqual(facts, vorher, 'readback must not mutate route facts')
}

describe('FlugRoute: stored direct-flight local schedule readback', () => {
  test('normal direct flight shows its exact schedule once without a disclosure', () => {
    const facts = direkt()
    direkterReadback(facts, '2026-11-01 09:15 → 2026-11-01 21:40')
    const html = render(facts)
    einmal(html, '09:15')
    einmal(html, '21:40')
    einmal(html, 'Direktflug')
    assert.match(html, /Zürich ZRH → Bangkok BKK/)
  })

  test('Date-Line readback uses stored itinerary even when the legacy arrival summary is null', () => {
    const gespeichert = manuelleFlugRouteBauen([{
      origin: 'NRT', destination: 'LAX',
      departureDate: '2026-11-02', departureTime: '23:30',
      arrivalDate: '2026-11-01', arrivalTime: '12:00',
    }])!
    assert.equal(gespeichert.endsOn, null)
    assert.equal(gespeichert.endsAt, null)
    const facts = routeFactsAusItinerary(gespeichert.routeItinerary)
    direkterReadback(facts, '2026-11-02 23:30 → 2026-11-01 12:00')
    einmal(render(facts), '2026-11-02 23:30')
    einmal(render(facts), '2026-11-01 12:00')
  })

  test('an earlier arrival clock on the same local date is preserved', () => {
    direkterReadback(direkt({ departureTime: '18:00', arrivalTime: '12:00' }),
      '2026-11-01 18:00 → 2026-11-01 12:00')
  })

  const teilzeiten: Array<[string, Partial<RouteSegment>, string]> = [
    ['no departure clock', { departureTime: null }, '2026-11-01 → 2026-11-01 21:40'],
    ['no arrival clock', { arrivalTime: null }, '2026-11-01 09:15 → 2026-11-01'],
    ['no clocks', { departureTime: null, arrivalTime: null }, '2026-11-01 → 2026-11-01'],
    ['only departure', { arrivalDate: null, arrivalTime: null }, '2026-11-01 09:15'],
    ['only arrival', { departureDate: null, departureTime: null }, '2026-11-01 21:40'],
    ['only clocks', { departureDate: null, arrivalDate: null }, '09:15 → 21:40'],
    ['only one clock', { departureDate: null, arrivalDate: null, arrivalTime: null }, '09:15'],
    ['only one date', { departureTime: null, arrivalDate: null, arrivalTime: null }, '2026-11-01'],
    ['no schedule fields', {
      departureDate: null, departureTime: null, arrivalDate: null, arrivalTime: null,
    }, 'Zeiten unbekannt'],
  ]
  for (const [name, zeiten, erwartet] of teilzeiten) {
    test(`${name}: only existing segmentZeit truth is displayed`, () => {
      direkterReadback(direkt(zeiten), erwartet)
    })
  }

  test('a display-only route with no segment facts does not invent a schedule', () => {
    const anzeige = routeAnzeigeAusFacts(direkt())!
    const html = renderToStaticMarkup(createElement(FlugRoute, { anzeige }))
    assert.equal(html,
      '<div class="min-w-0"><p class="text-base font-semibold tracking-[-0.02em] text-brand-800 break-words"><span class="sr-only">Route </span>Zürich ZRH → Bangkok BKK</p><p class="mt-1 text-sm leading-6 text-ink-800">Direktflug</p></div>')
    assert.equal(renderToStaticMarkup(createElement(FlugRoute, {
      anzeige, facts: { ...direkt(), segments: [] },
    })), html)
    assert.equal(renderToStaticMarkup(createElement(FlugRoute)), '')
  })

  test('an explicit direct display still shows exactly one stored segment schedule', () => {
    const facts = direkt()
    const html = renderToStaticMarkup(createElement(FlugRoute, {
      facts, anzeige: routeAnzeigeAusFacts(facts),
    }))
    einmal(html, '2026-11-01 09:15 → 2026-11-01 21:40')
    assert.doesNotMatch(html, /<details/)
  })

  test('multi-segment connection retains its closed disclosure and each schedule only inside it', () => {
    const html = render(routeFactsAusItinerary(itineraryEinTransit()))
    einmal(html, '<details class="mt-2">')
    einmal(html, 'Verbindung im Detail')
    einmal(html, 'aria-label="Flugsegmente"')
    assert.doesNotMatch(html.split('<details')[0]!, /2026-11|09:15|16:40|18:55|07:10/)
    einmal(html, 'Segment 1: Zürich ZRH → Doha DOH')
    einmal(html, 'Segment 2: Doha DOH → Bangkok BKK')
    einmal(html, '2026-11-01 09:15 → 2026-11-01 16:40')
    einmal(html, '2026-11-01 18:55 → 2026-11-02 07:10')
    einmal(html, 'Umstieg in Doha · 2 h 15 min')
    assert.doesNotMatch(html, /<details[^>]*\bopen\b/)
  })

  test('a direct display with multiple segments does not project a single-segment schedule', () => {
    const html = renderToStaticMarkup(createElement(FlugRoute, {
      facts: routeFactsAusItinerary(itineraryEinTransit()),
      anzeige: routeAnzeigeAusFacts(direkt()),
    }))
    assert.doesNotMatch(html, /2026-11|09:15|16:40|18:55|07:10|<details/)
  })
})
