import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'

import { ActivityProviderFehler } from '@/lib/activities/provider'
import { activitiesSuchen } from '@/lib/activities/suche'
import { activityRateLeeren } from '@/lib/activities/rate-limit'
import { activityZustand } from '@/lib/activities/zustand'
import type { Ort } from '@/lib/places/domain'
import { readViatorAffiliateRedirect } from '@/lib/providers/viator/activities/affiliate'
import { activityOptionAusViatorProdukt, viatorActivityProvider, viatorKalenderLaden, viatorLivePruefen, viatorProduktLaden, viatorZielCacheLeeren, viatorZielFehlerMelden } from '@/lib/providers/viator/activities/anbinden'
import { parseViatorProductDetail } from '@/lib/providers/viator/activities/content'
import { buildViatorSandboxCall } from '@/lib/providers/viator/activities/request'
import { parseViatorSchedule } from '@/lib/providers/viator/activities/schedule'
import { viatorOrtAufloesen, viatorKatalogLesen } from '@/lib/providers/viator/activities/destination'
import { viatorStartzeiten } from '@/lib/providers/viator/activities/kalender'
import type { ProviderHttpClient, ProviderHttpRequest } from '@/lib/server/providers/core'

const KATALOG = {
  destinations: [
    { destinationId: 20, name: 'Thailand', type: 'COUNTRY', parentDestinationId: null, countryCode: 'FR', lookupId: '20' },
    { destinationId: 343, name: 'Bangkok', type: 'CITY', parentDestinationId: 20, lookupId: '6.20.343', countryCode: 'US', center: { latitude: 13.75, longitude: 100.5 } },
    { destinationId: 344, name: 'Chiang Mai', type: 'CITY', parentDestinationId: 20, center: { latitude: 18.79, longitude: 98.98 } },
    { destinationId: 51, name: 'France', type: 'COUNTRY', parentDestinationId: null },
    { destinationId: 479, name: 'Paris', type: 'CITY', parentDestinationId: 51, center: { latitude: 48.86, longitude: 2.35 } },
    { destinationId: 8, name: 'United States', type: 'COUNTRY', parentDestinationId: null },
    { destinationId: 901, name: 'Paris', type: 'CITY', parentDestinationId: 8, center: { latitude: 33.66, longitude: -95.55 } },
  ],
}

const ZIELE = 'https://api.sandbox.viator.com/partner/destinations'

function anfrage(teil: Partial<{ name: string; countryCode: string; latitude: number; longitude: number; placeId: string }> = {}) {
  return {
    destinationPlaceId: teil.placeId ?? 'place-1',
    destinationName: teil.name ?? 'Bangkok',
    dayDate: '2026-11-02',
    participants: 2,
    currency: 'CHF',
    budgetAmount: null,
    interests: [],
    pace: null,
    countryCode: teil.countryCode ?? 'TH',
    latitude: teil.latitude ?? 13.75,
    longitude: teil.longitude ?? 100.5,
  }
}
const KEY = 'sandbox-key-do-not-leak'
const NOW = Date.parse('2026-10-28T12:00:00.000Z')
const URL = 'https://www.viator.com/tours/Example/Fixture/d1-10001P1?pid=P00000000&medium=api'
const IMAGE = 'https://hare-media-cdn.tripadvisor.com/media/attractions-splice-spp-720x480/06/71/ef/dc.jpg'

function httpFor(routes: Record<string, unknown>): { client: ProviderHttpClient; calls: string[] } {
  const calls: string[] = []
  const client: ProviderHttpClient = async (request: ProviderHttpRequest) => {
    calls.push(request.url)
    const body = routes[request.url]
    const encoded = new TextEncoder().encode(JSON.stringify(body ?? {}))
    return {
      status: 200,
      headers: { get: () => null },
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(encoded)
          controller.close()
        },
      }),
    }
  }
  return { client, calls }
}

const env = { VIATOR_SANDBOX_CALLS: 'true', VIATOR_SANDBOX_API_KEY: KEY, VERCEL_ENV: 'preview' }
const product = {
  productCode: '10001P1',
  title: 'Fixture walking tour',
  description: 'Eine kurze Beschreibung.',
  duration: { fixedDurationInMinutes: 90 },
  pricing: { summary: { fromPrice: 40 }, currency: 'EUR' },
  productUrl: URL,
  images: [{ isCover: true, variants: [{ url: IMAGE, width: 720, height: 480 }] }],
  reviews: { combinedAverageRating: 4.5, totalReviews: 4, sources: [{ text: 'SECRET REVIEW BODY' }] },
  viatorUniqueContent: { text: 'UNIQUE CONTENT SHOULD NOT LEAK' },
  productOptions: [{ productOptionCode: 'TG1', title: 'Morgentour' }],
  pricingInfo: {
    ageBands: [{ ageBand: 'ADULT', startAge: 18, endAge: 99, minTravelersPerBooking: 1, maxTravelersPerBooking: 9 }],
  },
}

describe('Viator native seam', () => {
  test('missing key and production do not call the network', async () => {
    viatorZielCacheLeeren()
    const http = httpFor({})
    const missing = await viatorProduktLaden('10001P1', { env: {}, http: http.client })
    assert.equal(missing.status, 'unavailable')
    const production = await viatorProduktLaden('10001P1', {
      env: { ...env, VERCEL_ENV: 'production' },
      http: http.client,
    })
    assert.equal(production.status, 'unavailable')
    assert.deepEqual(http.calls, [])
    assert.equal(viatorActivityProvider({ env: {} }), null)
  })

  test('an unrecognized environment does not call Viator', async () => {
    viatorZielCacheLeeren()
    const http = httpFor({
      [ZIELE]: KATALOG,
      'https://api.sandbox.viator.com/partner/products/search': { products: [product] },
    })
    const schluessel = { VIATOR_SANDBOX_CALLS: 'true', VIATOR_SANDBOX_API_KEY: KEY }
    const verweigert = [undefined, '', ' ', 'staging', 'production', 'production ', 'Production', 'preview ', 'Preview', 'development ']
    for (const wert of verweigert) {
      const umgebung = wert === undefined ? schluessel : { ...schluessel, VERCEL_ENV: wert }
      assert.equal(viatorActivityProvider({ env: umgebung, http: http.client, nowMs: NOW }), null, JSON.stringify(wert))
      const detail = await viatorProduktLaden('10001P1', { env: umgebung, http: http.client, nowMs: NOW })
      const kalender = await viatorKalenderLaden('10001P1', { env: umgebung, http: http.client, nowMs: NOW })
      const live = await viatorLivePruefen(
        { productCode: '10001P1', currency: 'CHF', travelDate: '2026-11-02', paxMix: [{ ageBand: 'ADULT', numberOfTravelers: 1 }] },
        { env: umgebung, http: http.client, nowMs: NOW },
      )
      assert.equal(detail.status, 'unavailable', JSON.stringify(wert))
      assert.equal(kalender.status, 'unavailable', JSON.stringify(wert))
      assert.equal(live.status, 'unavailable', JSON.stringify(wert))
    }
    const ohneFlag = await viatorProduktLaden('10001P1', { env: { VERCEL_ENV: 'development' }, http: http.client, nowMs: NOW })
    const ohneKey = await viatorProduktLaden('10001P1', {
      env: { VERCEL_ENV: 'preview', VIATOR_SANDBOX_CALLS: 'true' },
      http: http.client,
      nowMs: NOW,
    })
    assert.equal(ohneFlag.status, 'unavailable')
    assert.equal(ohneKey.status, 'unavailable')
    assert.deepEqual(http.calls, [])
    const entwicklung = httpFor({
      [ZIELE]: KATALOG,
      'https://api.sandbox.viator.com/partner/products/search': { products: [product] },
    })
    const provider = viatorActivityProvider({
      env: { ...schluessel, VERCEL_ENV: 'development' },
      http: entwicklung.client,
      nowMs: NOW,
    })
    assert.ok(provider)
    const treffer = await provider.suchen(anfrage())
    assert.equal(treffer.options[0]?.externalRef, '10001P1')
    assert.equal(entwicklung.calls.includes(ZIELE), true)
    assert.equal(entwicklung.calls.includes('https://api.sandbox.viator.com/partner/products/search'), true)
  })

  test('a failed destination catalog records one redacted server diagnostic', { timeout: 30_000 }, async () => {
    const canary = 'CANARY-ZIEL-GEHEIMNIS'
    const reiseId = 'trip-canary-9'
    const zeilen: string[] = []
    const vorher = console.error
    console.error = (...teile: unknown[]) => {
      zeilen.push(teile.map((teil) => (typeof teil === 'string' ? teil : JSON.stringify(teil))).join(' '))
    }
    const lesen = () =>
      zeilen.flatMap((zeile) => {
        try {
          const wert = JSON.parse(zeile) as Record<string, unknown>
          return wert.ereignis === 'viator_ziel_fehlgeschlagen' ? [wert] : []
        } catch {
          return []
        }
      })
    const strom = (status: number, roh: string) =>
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(roh))
          controller.close()
        },
      })
    const antwort = (status: number, roh: string): ProviderHttpClient => async () => ({
      status,
      headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null) },
      body: strom(status, roh),
    })
    const erwarten = async (
      http: ProviderHttpClient,
      klasse: string,
      transportKind: string | null,
      status: number | null,
      meldung: string,
      art: string,
      bodyReason: string | null,
    ) => {
      viatorZielCacheLeeren()
      const vorherAnzahl = lesen().length
      const provider = viatorActivityProvider({ env, http, nowMs: NOW })
      assert.ok(provider)
      await assert.rejects(
        () => provider.suchen(anfrage()),
        (fehler: unknown) => {
          assert.ok(fehler instanceof ActivityProviderFehler)
          assert.equal(fehler.art, art)
          assert.equal(fehler.message, meldung)
          return true
        },
      )
      const ereignisse = lesen().slice(vorherAnzahl)
      assert.equal(ereignisse.length, 1)
      const ereignis = ereignisse[0]!
      assert.deepEqual(Object.keys(ereignis).sort(), ['bodyReason', 'ereignis', 'klasse', 'operation', 'reason', 'status', 'transportKind'])
      assert.equal(ereignis.operation, 'destinations')
      assert.equal(ereignis.klasse, klasse)
      assert.equal(ereignis.transportKind, transportKind)
      assert.equal(ereignis.status, status)
      assert.equal(ereignis.reason, klasse === 'catalog_schema' ? 'malformed_response' : 'transport')
      assert.equal(ereignis.bodyReason, bodyReason)
    }
    try {
      const allgemein = 'Die Viator-Ziele konnten nicht gelesen werden.'
      viatorZielCacheLeeren()
      activityRateLeeren()
      const gastHttp = antwort(401, `{"message":"${canary}","trip":"${reiseId}"}`)
      const providerGast = viatorActivityProvider({ env, http: gastHttp, nowMs: NOW })
      const bangkok: Ort = {
        id: 'geonames:1609350',
        source: 'geonames',
        sourceId: '1609350',
        name: 'Bangkok',
        typ: 'city',
        country: 'Thailand',
        countryCode: 'TH',
        region: null,
        lat: 13.75,
        lon: 100.5,
        iata: null,
        keywords: null,
      }
      const gast = await activitiesSuchen(
        {
          stage: { id: 'stage-1', name: 'Bangkok', placeId: bangkok.id, countryCode: 'TH', latitude: 13.75, longitude: 100.5 },
          day: { id: 'day-1', dayDate: '2026-11-02', stageId: 'stage-1' },
          trip: {
            startDate: '2026-11-02',
            endDate: '2026-11-05',
            travellers: 2,
            currency: 'CHF',
            budgetAmount: null,
            interests: [],
            pace: 'balanced',
          },
          items: [],
        },
        {
          zustand: activityZustand({ JETNITY_ACTIVITY_AKTIV: 'true' }, true),
          provider: providerGast,
          kennung: 'viator-ziel-diagnose',
          ortLesen: (id: string) => (id === bangkok.id ? bangkok : null),
        },
      )
      assert.equal(gast.koerper.status, 'error')
      assert.equal(gast.koerper.message, allgemein)
      assert.equal(JSON.stringify(gast).includes('viator_ziel_fehlgeschlagen'), false)
      assert.equal(JSON.stringify(gast).includes(canary), false)
      assert.equal(lesen().length, 1)
      assert.equal(lesen()[0]?.klasse, 'http_denied')
      assert.equal(lesen()[0]?.transportKind, 'authentication')
      assert.equal(lesen()[0]?.status, 401)
      assert.equal(lesen()[0]?.bodyReason, null)
      await erwarten(antwort(403, `{"message":"${canary}"}`), 'http_denied', 'authorization', 403, allgemein, 'error', null)
      await erwarten(antwort(429, `{"message":"${canary}"}`), 'rate_limited', 'rate_limited', 429, 'Viator begrenzt gerade die Anfragen.', 'unavailable', null)
      await erwarten(antwort(500, `{"message":"${canary}"}`), 'http_denied', 'provider_5xx', 500, allgemein, 'error', null)
      await erwarten(async () => {
        throw new Error(`${canary} ${reiseId}`)
      }, 'network', 'network_error', null, allgemein, 'error', null)
      await erwarten(antwort(200, `{not-json ${canary}`), 'transport_body', 'malformed_response', 200, allgemein, 'error', 'invalid_json')
      await erwarten(
        antwort(200, JSON.stringify({ destinations: [{ name: canary, trip: reiseId }], productUrl: 'https://www.viator.com/tours/secret' })),
        'catalog_schema',
        null,
        null,
        allgemein,
        'error',
        null,
      )
      viatorZielCacheLeeren()
      const erfolg = httpFor({
        [ZIELE]: KATALOG,
        'https://api.sandbox.viator.com/partner/products/search': { products: [product] },
      })
      const provider = viatorActivityProvider({ env, http: erfolg.client, nowMs: NOW })
      const treffer = await provider!.suchen(anfrage())
      assert.equal(treffer.options[0]?.externalRef, '10001P1')
      assert.equal(lesen().length, 7)
      const gesperrt = httpFor({})
      for (const wert of ['production', 'staging', undefined] as const) {
        const umgebung = wert === undefined
          ? { VIATOR_SANDBOX_CALLS: 'true', VIATOR_SANDBOX_API_KEY: KEY }
          : { ...env, VERCEL_ENV: wert }
        assert.equal(viatorActivityProvider({ env: umgebung, http: gesperrt.client, nowMs: NOW }), null)
      }
      assert.deepEqual(gesperrt.calls, [])
      assert.equal(lesen().length, 7)
      viatorZielCacheLeeren()
      const haengen: ProviderHttpClient = async (request) => {
        await new Promise((_resolve, reject) => {
          const abbruch = () => {
            const fehler = new Error(canary)
            fehler.name = 'AbortError'
            reject(fehler)
          }
          if (request.signal.aborted) abbruch()
          else request.signal.addEventListener('abort', abbruch, { once: true })
        })
        return antwort(200, '{}')(request)
      }
      await erwarten(haengen, 'timeout', 'timeout', null, 'Die Viator-Ziele haben zu lange gebraucht.', 'timeout', null)
      const text = zeilen.join('\n')
      assert.equal(text.includes(canary), false)
      for (const satz of [
        'Provider response exceeded the body size limit.',
        'Provider response body could not be read.',
        'Provider JSON response was empty.',
        'Provider response was not JSON.',
        'Provider response was not valid JSON.',
        'Provider response was malformed.',
      ]) {
        assert.equal(text.includes(satz), false, satz)
      }
      assert.equal(text.includes(reiseId), false)
      assert.equal(text.includes(KEY), false)
      assert.equal(text.includes('viator.com/tours'), false)
      assert.equal(text.includes('exp-api-key'), false)
    } finally {
      console.error = vorher
      viatorZielCacheLeeren()
    }
  })

  test('a throwing diagnostic sink keeps the guest destination message', async () => {
    viatorZielCacheLeeren()
    activityRateLeeren()
    const canary = 'CANARY-LOG-SINK'
    const aufrufe: string[] = []
    const http: ProviderHttpClient = async (request) => {
      aufrufe.push(request.url)
      const roh = new TextEncoder().encode(`{"secret":"${canary}"}`)
      return {
        status: 401,
        headers: { get: () => null },
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(roh)
            controller.close()
          },
        }),
      }
    }
    const provider = viatorActivityProvider({ env, http, nowMs: NOW })
    const bangkok: Ort = {
      id: 'geonames:1609350',
      source: 'geonames',
      sourceId: '1609350',
      name: 'Bangkok',
      typ: 'city',
      country: 'Thailand',
      countryCode: 'TH',
      region: null,
      lat: 13.75,
      lon: 100.5,
      iata: null,
      keywords: null,
    }
    const vorher = console.error
    let versuche = 0
    console.error = () => {
      versuche += 1
      throw new Error(`${canary} trip-canary-9`)
    }
    try {
      const gast = await activitiesSuchen(
        {
          stage: { id: 'stage-1', name: 'Bangkok', placeId: bangkok.id, countryCode: 'TH', latitude: 13.75, longitude: 100.5 },
          day: { id: 'day-1', dayDate: '2026-11-02', stageId: 'stage-1' },
          trip: {
            startDate: '2026-11-02',
            endDate: '2026-11-05',
            travellers: 2,
            currency: 'CHF',
            budgetAmount: null,
            interests: [],
            pace: 'balanced',
          },
          items: [],
        },
        {
          zustand: activityZustand({ JETNITY_ACTIVITY_AKTIV: 'true' }, true),
          provider,
          kennung: 'viator-ziel-diagnose-sink',
          ortLesen: (id: string) => (id === bangkok.id ? bangkok : null),
        },
      )
      assert.equal(gast.koerper.status, 'error')
      assert.equal(gast.koerper.message, 'Die Viator-Ziele konnten nicht gelesen werden.')
      assert.notEqual(gast.koerper.message, 'Die Aktivitätensuche ist fehlgeschlagen.')
      assert.equal(aufrufe.length, 1)
      assert.equal(aufrufe[0]?.endsWith('/partner/destinations'), true)
      assert.equal(versuche, 1)
      const text = JSON.stringify(gast)
      assert.equal(text.includes(canary), false)
      assert.equal(text.includes('trip-canary-9'), false)
      assert.equal(text.includes(KEY), false)
    } finally {
      console.error = vorher
      viatorZielCacheLeeren()
    }
    assert.equal(console.error, vorher)
  })

  test('destinations body failures keep a closed reason and one call', async () => {
    viatorZielCacheLeeren()
    activityRateLeeren()
    const allgemein = 'Die Viator-Ziele konnten nicht gelesen werden.'
    const rohSaetze = [
      'Provider response exceeded the body size limit.',
      'Provider response body could not be read.',
      'Provider JSON response was empty.',
      'Provider response was not JSON.',
      'Provider response was not valid JSON.',
      'Provider response was malformed.',
    ]
    const zeilen: string[] = []
    const vorher = console.error
    console.error = (...teile: unknown[]) => {
      zeilen.push(teile.map((teil) => (typeof teil === 'string' ? teil : JSON.stringify(teil))).join(' '))
    }
    const lesen = () =>
      zeilen.flatMap((zeile) => {
        try {
          const wert = JSON.parse(zeile) as Record<string, unknown>
          return wert.ereignis === 'viator_ziel_fehlgeschlagen' ? [wert] : []
        } catch {
          return []
        }
      })
    const bangkok: Ort = {
      id: 'geonames:1609350',
      source: 'geonames',
      sourceId: '1609350',
      name: 'Bangkok',
      typ: 'city',
      country: 'Thailand',
      countryCode: 'TH',
      region: null,
      lat: 13.75,
      lon: 100.5,
      iata: null,
      keywords: null,
    }
    const reise = {
      stage: { id: 'stage-1', name: 'Bangkok', placeId: bangkok.id, countryCode: 'TH', latitude: 13.75, longitude: 100.5 },
      day: { id: 'day-1', dayDate: '2026-11-02', stageId: 'stage-1' },
      trip: {
        startDate: '2026-11-02',
        endDate: '2026-11-05',
        travellers: 2,
        currency: 'CHF',
        budgetAmount: null,
        interests: [],
        pace: 'balanced' as const,
      },
      items: [],
    }
    const textStrom = (text: string) =>
      new ReadableStream<Uint8Array>({
        start(controller) {
          if (text.length > 0) controller.enqueue(new TextEncoder().encode(text))
          controller.close()
        },
      })
    const pruefen = async (
      name: string,
      http: ProviderHttpClient,
      calls: string[],
      bodyReason: string | null,
      klasse: string,
      canary: string,
    ) => {
      viatorZielCacheLeeren()
      const vorherAnzahl = lesen().length
      const provider = viatorActivityProvider({ env, http, nowMs: NOW })
      assert.ok(provider, name)
      const gast = await activitiesSuchen(reise, {
        zustand: activityZustand({ JETNITY_ACTIVITY_AKTIV: 'true' }, true),
        provider,
        kennung: `viator-body-${name}`,
        ortLesen: (id: string) => (id === bangkok.id ? bangkok : null),
      })
      assert.equal(gast.koerper.status, 'error', name)
      assert.equal(gast.koerper.message, allgemein, name)
      assert.equal(calls.length, 1, name)
      assert.equal(calls[0], ZIELE, name)
      const ereignisse = lesen().slice(vorherAnzahl)
      assert.equal(ereignisse.length, 1, name)
      const ereignis = ereignisse[0]!
      assert.deepEqual(Object.keys(ereignis).sort(), ['bodyReason', 'ereignis', 'klasse', 'operation', 'reason', 'status', 'transportKind'])
      assert.equal(ereignis.klasse, klasse, name)
      assert.equal(ereignis.bodyReason, bodyReason, name)
      assert.equal(ereignis.operation, 'destinations', name)
      const gastText = JSON.stringify(gast)
      const ereignisText = JSON.stringify(ereignis)
      assert.equal(gastText.includes(canary), false, name)
      assert.equal(ereignisText.includes(canary), false, name)
      assert.equal(gastText.includes(KEY), false, name)
      assert.equal(ereignisText.includes(KEY), false, name)
      assert.equal(gastText.includes('bodyReason'), false, name)
      for (const satz of rohSaetze) {
        assert.equal(gastText.includes(satz), false, `${name} ${satz}`)
        assert.equal(ereignisText.includes(satz), false, `${name} ${satz}`)
      }
    }
    const httpMit = (
      body: ReadableStream<Uint8Array> | null,
      header: { contentType?: string | null; contentLength?: string | null; status?: number } = {},
    ) => {
      const calls: string[] = []
      const http: ProviderHttpClient = async (request) => {
        calls.push(request.url)
        return {
          status: header.status ?? 200,
          headers: {
            get: (feld: string) => {
              const name = feld.toLowerCase()
              if (name === 'content-type') return header.contentType === undefined ? 'application/json' : header.contentType
              if (name === 'content-length') return header.contentLength ?? null
              return null
            },
          },
          body,
        }
      }
      return { http, calls }
    }
    try {
      const angekuendigt = httpMit(textStrom('CANARY-SIZE-ANNOUNCED'), { contentLength: '1048577' })
      await pruefen('announced-size', angekuendigt.http, angekuendigt.calls, 'size_limit', 'transport_body', 'CANARY-SIZE-ANNOUNCED')
      const zuGross = new Uint8Array(1_048_577)
      zuGross.set(new TextEncoder().encode('CANARY-SIZE-STREAM'), 0)
      const gestreamt = httpMit(
        new ReadableStream({
          start(controller) {
            controller.enqueue(zuGross)
            controller.close()
          },
        }),
      )
      await pruefen('streamed-size', gestreamt.http, gestreamt.calls, 'size_limit', 'transport_body', 'CANARY-SIZE-STREAM')
      const unlesbar = httpMit(
        new ReadableStream({
          start(controller) {
            controller.error(new Error('CANARY-STREAM-SECRET'))
          },
        }),
      )
      await pruefen('unreadable', unlesbar.http, unlesbar.calls, 'body_unreadable', 'transport_body', 'CANARY-STREAM-SECRET')
      const abbruchCalls: string[] = []
      const abbruch: ProviderHttpClient = async (request) => {
        abbruchCalls.push(request.url)
        const fehler = new Error('CANARY-ABORT')
        fehler.name = 'AbortError'
        throw fehler
      }
      await pruefen('abort', abbruch, abbruchCalls, null, 'aborted', 'CANARY-ABORT')
      const leer = httpMit(textStrom(''))
      await pruefen('empty', leer.http, leer.calls, 'empty_json', 'transport_body', 'CANARY-EMPTY')
      const leerzeichen = httpMit(textStrom('   \n'))
      await pruefen('whitespace', leerzeichen.http, leerzeichen.calls, 'empty_json', 'transport_body', 'CANARY-WHITESPACE')
      const html = httpMit(textStrom('<html>CANARY-HTML'), { contentType: 'text/html' })
      await pruefen('html', html.http, html.calls, 'non_json_media_type', 'transport_body', 'CANARY-HTML')
      const json = httpMit(textStrom('{CANARY-JSON'))
      await pruefen('invalid-json', json.http, json.calls, 'invalid_json', 'transport_body', 'CANARY-JSON')
      const unbekannt = httpMit(textStrom('CANARY-STATUS-99'), { status: 99 })
      await pruefen('unknown-status', unbekannt.http, unbekannt.calls, 'unknown', 'transport_body', 'CANARY-STATUS-99')
      const unbekanntEreignis = lesen().at(-1)!
      assert.equal(unbekanntEreignis.transportKind, 'malformed_response')
      assert.equal(unbekanntEreignis.status, null)
      assert.equal(unbekanntEreignis.reason, 'transport')
      const katalog = httpMit(textStrom(JSON.stringify({ destinations: 'CANARY-CATALOG' })))
      await pruefen('catalog', katalog.http, katalog.calls, null, 'catalog_schema', 'CANARY-CATALOG')
      assert.equal(lesen().at(-1)?.reason, 'malformed_response')
      assert.equal(lesen().at(-1)?.transportKind, null)
      viatorZielCacheLeeren()
      const vorherErfolg = lesen().length
      const erfolg = httpFor({
        [ZIELE]: KATALOG,
        'https://api.sandbox.viator.com/partner/products/search': { products: [product] },
      })
      const provider = viatorActivityProvider({ env, http: erfolg.client, nowMs: NOW })
      const treffer = await provider!.suchen(anfrage())
      assert.equal(treffer.options[0]?.externalRef, '10001P1')
      assert.equal(lesen().length, vorherErfolg)
      assert.equal(erfolg.calls.filter((url) => url === ZIELE).length, 1)
      viatorZielFehlerMelden({
        reason: 'transport',
        transportKind: 'malformed_response',
        status: 200,
        bodyReason: 'size_limit CANARY-ENUM',
      })
      viatorZielFehlerMelden({
        reason: 'transport',
        transportKind: 'authentication',
        status: 401,
        bodyReason: 'size_limit',
      })
      viatorZielFehlerMelden({
        reason: 'malformed_response',
        status: 200,
        bodyReason: 'invalid_json',
      })
      const gefaelscht = lesen().slice(vorherErfolg)
      assert.equal(gefaelscht.length, 3)
      assert.equal(gefaelscht[0]?.bodyReason, null)
      assert.equal(gefaelscht[0]?.klasse, 'transport_body')
      assert.equal(gefaelscht[1]?.bodyReason, null)
      assert.equal(gefaelscht[1]?.klasse, 'http_denied')
      assert.equal(gefaelscht[2]?.bodyReason, null)
      assert.equal(gefaelscht[2]?.klasse, 'catalog_schema')
      const protokoll = zeilen.join('\n')
      assert.equal(protokoll.includes('CANARY-ENUM'), false)
      assert.equal(protokoll.includes('size_limit CANARY-ENUM'), false)
      for (const satz of rohSaetze) assert.equal(protokoll.includes(satz), false)
    } finally {
      console.error = vorher
      viatorZielCacheLeeren()
    }
  })

  test('catalog resolution distinguishes country, repeat visits and ambiguity', async () => {
    const katalog = viatorKatalogLesen(KATALOG)
    assert.ok(katalog)
    assert.equal(katalog!.find((ort) => ort.destinationId === 343)?.lookupId, '6.20.343')
    assert.equal('countryCode' in (katalog!.find((ort) => ort.destinationId === 343) ?? {}), false)
    const bangkok = viatorOrtAufloesen({ name: 'Bangkok', countryCode: 'TH', latitude: 13.75, longitude: 100.5, katalog: katalog! })
    const chiang = viatorOrtAufloesen({ name: 'Chiang Mai', countryCode: 'TH', latitude: 18.79, longitude: 98.98, katalog: katalog! })
    const parisFr = viatorOrtAufloesen({ name: 'Paris', countryCode: 'FR', latitude: 48.86, longitude: 2.35, katalog: katalog! })
    const parisUs = viatorOrtAufloesen({ name: 'Paris', countryCode: 'US', latitude: 33.66, longitude: -95.55, katalog: katalog! })
    const erneut = viatorOrtAufloesen({ name: 'Bangkok', countryCode: 'TH', latitude: 13.75, longitude: 100.5, katalog: katalog! })
    const unklar = viatorOrtAufloesen({ name: 'Paris', katalog: katalog! })
    assert.equal(bangkok.ok && bangkok.destinationId, '343')
    assert.equal(chiang.ok && chiang.destinationId, '344')
    assert.equal(parisFr.ok && parisFr.destinationId, '479')
    assert.equal(parisUs.ok && parisUs.destinationId, '901')
    assert.equal(erneut.ok && erneut.destinationId, '343')
    assert.equal(unklar.ok, false)
    const haengend = viatorKatalogLesen({
      destinations: [{ destinationId: 343, name: 'Bangkok', type: 'CITY', parentDestinationId: 999, lookupId: '999.343' }],
    })
    assert.equal(viatorOrtAufloesen({ name: 'Bangkok', countryCode: 'TH', katalog: haengend! }).ok, false)
    const doppelt = viatorKatalogLesen({
      destinations: [
        { destinationId: 51, name: 'France', type: 'COUNTRY', parentDestinationId: null },
        { destinationId: 1, name: 'Lyon', type: 'CITY', parentDestinationId: 51 },
        { destinationId: 2, name: 'Lyon', type: 'CITY', parentDestinationId: 51 },
      ],
    })
    assert.equal(viatorOrtAufloesen({ name: 'Lyon', countryCode: 'FR', katalog: doppelt! }).ok, false)
    const portugal = viatorKatalogLesen({
      destinations: [
        { destinationId: 55, name: 'Portugal', type: 'COUNTRY', parentDestinationId: null },
        { destinationId: 501, name: 'Lisbon', type: 'CITY', parentDestinationId: 55, center: { latitude: 38.72, longitude: -9.14 } },
        { destinationId: 20, name: 'Thailand', type: 'COUNTRY', parentDestinationId: null },
        { destinationId: 348, name: 'Ko Chang', type: 'ISLAND', parentDestinationId: 20, center: { latitude: 12.0, longitude: 102.3 } },
        { destinationId: 349, name: 'Phuket', type: 'ISLAND', parentDestinationId: 20, center: { latitude: 7.88, longitude: 98.39 } },
        { destinationId: 80, name: 'Panama', type: 'COUNTRY', parentDestinationId: null },
        { destinationId: 801, name: 'Panama City', type: 'CITY', parentDestinationId: 80, center: { latitude: 8.98, longitude: -79.52 } },
      ],
    })
    const kanonLissabon = { namen: ['Lissabon', 'Lisbon', 'Lisboa'], typ: 'city', countryCode: 'PT' }
    const lissabon = viatorOrtAufloesen({ name: 'Lissabon', countryCode: 'PT', latitude: 38.72, longitude: -9.14, katalog: portugal!, kanon: kanonLissabon })
    const lisbon = viatorOrtAufloesen({ name: 'Lisbon', countryCode: 'PT', latitude: 38.72, longitude: -9.14, katalog: portugal!, kanon: kanonLissabon })
    const erneutLissabon = viatorOrtAufloesen({ name: 'Lissabon', countryCode: 'PT', latitude: 38.72, longitude: -9.14, katalog: portugal!, kanon: kanonLissabon })
    const ohneAlias = viatorOrtAufloesen({ name: 'Lissabon', countryCode: 'PT', latitude: 38.72, longitude: -9.14, katalog: portugal! })
    const land = viatorOrtAufloesen({ name: 'Portugal', countryCode: 'PT', katalog: portugal! })
    const koChang = viatorOrtAufloesen({ name: 'Ko Chang', countryCode: 'TH', latitude: 12.0, longitude: 102.3, katalog: portugal! })
    const phuket = viatorOrtAufloesen({ name: 'Phuket', countryCode: 'TH', latitude: 7.88, longitude: 98.39, katalog: portugal! })
    const panama = viatorOrtAufloesen({ name: 'Panama City', countryCode: 'PA', latitude: 8.98, longitude: -79.52, katalog: portugal! })
    const nurLand = viatorOrtAufloesen({ name: 'Panama', countryCode: 'PA', katalog: portugal! })
    assert.equal(ohneAlias.ok, false)
    assert.equal(lissabon.ok && lissabon.destinationId, '501')
    assert.equal(lisbon.ok && lisbon.destinationId, '501')
    assert.equal(erneutLissabon.ok && erneutLissabon.destinationId, '501')
    assert.equal(land.ok, false)
    assert.equal(koChang.ok && koChang.destinationId, '348')
    assert.equal(phuket.ok && phuket.destinationId, '349')
    assert.equal(panama.ok && panama.destinationId, '801')
    assert.equal(nurLand.ok, false)
    const europa = viatorKatalogLesen({
      destinations: [
        { destinationId: 11, name: 'Austria', type: 'COUNTRY', parentDestinationId: null },
        { destinationId: 454, name: 'Vienna', type: 'CITY', parentDestinationId: 11, center: { latitude: 48.2, longitude: 16.37 } },
        { destinationId: 12, name: 'Germany', type: 'COUNTRY', parentDestinationId: null },
        { destinationId: 487, name: 'Munich', type: 'CITY', parentDestinationId: 12, center: { latitude: 48.14, longitude: 11.58 } },
        { destinationId: 20, name: 'Thailand', type: 'COUNTRY', parentDestinationId: null },
        { destinationId: 348, name: 'Koh Chang', type: 'ISLAND', parentDestinationId: 20, center: { latitude: 12.0, longitude: 102.3 } },
        { destinationId: 77, name: 'United States', type: 'COUNTRY', parentDestinationId: null },
        { destinationId: 999, name: 'Test Village', type: 'CITY', parentDestinationId: 77 },
        { destinationId: 55, name: 'Portugal', type: 'COUNTRY', parentDestinationId: null },
        { destinationId: 556, name: 'Portugal', type: 'CITY', parentDestinationId: 55 },
      ],
    })
    assert.equal(viatorOrtAufloesen({ name: 'Wien', countryCode: 'AT', latitude: 48.2, longitude: 16.37, katalog: europa! }).ok, false)
    assert.equal(viatorOrtAufloesen({ name: 'München', countryCode: 'DE', latitude: 48.14, longitude: 11.58, katalog: europa! }).ok, false)
    assert.equal(viatorOrtAufloesen({ name: 'Ko Chang', countryCode: 'TH', latitude: 12.0, longitude: 102.3, katalog: europa! }).ok, false)
    assert.equal(viatorOrtAufloesen({ name: 'Test', countryCode: 'US', katalog: europa! }).ok, false)
    const wien = viatorOrtAufloesen({
      name: 'Wien',
      countryCode: 'AT',
      latitude: 48.2,
      longitude: 16.37,
      katalog: europa!,
      kanon: { namen: ['Wien', 'Vienna'], typ: 'city', countryCode: 'AT' },
    })
    const muenchen = viatorOrtAufloesen({
      name: 'München',
      countryCode: 'DE',
      latitude: 48.14,
      longitude: 11.58,
      katalog: europa!,
      kanon: { namen: ['München', 'Munich'], typ: 'city', countryCode: 'DE' },
    })
    const kohChang = viatorOrtAufloesen({
      name: 'Ko Chang',
      countryCode: 'TH',
      latitude: 12.0,
      longitude: 102.3,
      katalog: europa!,
      kanon: { namen: ['Ko Chang', 'Koh Chang'], typ: 'island', countryCode: 'TH' },
    })
    const landIdentitaet = viatorOrtAufloesen({
      name: 'Portugal',
      countryCode: 'PT',
      katalog: europa!,
      kanon: { namen: ['Portugal'], typ: 'country', countryCode: 'PT' },
    })
    assert.equal(wien.ok && wien.destinationId, '454')
    assert.equal(muenchen.ok && muenchen.destinationId, '487')
    assert.equal(kohChang.ok && kohChang.destinationId, '348')
    assert.equal(landIdentitaet.ok, false)
    const quelle = readFileSync(join(process.cwd(), 'lib/providers/viator/activities/destination.ts'), 'utf8')
    assert.equal(quelle.includes('geonames.tsv'), false)
    assert.equal(quelle.includes('readFileSync'), false)
  })

  test('runtime search loads destinations once and does not guess an unknown city', async () => {
    viatorZielCacheLeeren()
    const http = httpFor({
      [ZIELE]: KATALOG,
      'https://api.sandbox.viator.com/partner/products/search': { products: [product] },
    })
    const provider = viatorActivityProvider({ env, http: http.client, nowMs: NOW })
    const erster = await provider!.suchen(anfrage())
    const zweiter = await provider!.suchen(anfrage())
    assert.equal(erster.options[0]?.externalRef, '10001P1')
    assert.equal(zweiter.options[0]?.externalRef, '10001P1')
    assert.equal(http.calls.filter((url) => url === ZIELE).length, 1)
    const body = http.calls.includes('https://api.sandbox.viator.com/partner/products/search')
    assert.equal(body, true)
    await assert.rejects(() => provider!.suchen(anfrage({ name: 'Atlantis', countryCode: 'TH' })), /kein eindeutiges Viator-Ziel/)
  })

  test('search keeps the supplier currency and drops the affiliate URL from the option', async () => {
    viatorZielCacheLeeren()
    const http = httpFor({
      [ZIELE]: KATALOG,
      'https://api.sandbox.viator.com/partner/products/search': { products: [product] },
    })
    const provider = viatorActivityProvider({ env, http: http.client, nowMs: NOW })
    const treffer = await provider!.suchen(anfrage())
    assert.equal(treffer.options[0]?.preisWaehrung, 'EUR')
    assert.equal(treffer.options[0]?.preisRolle, 'rrp_from')
    assert.equal(treffer.options[0]?.bildUrl, IMAGE)
    assert.equal(JSON.stringify(treffer).includes(URL), false)
    assert.equal(JSON.stringify(treffer).includes('UNIQUE CONTENT'), false)
    assert.equal(JSON.stringify(treffer).includes('SECRET REVIEW'), false)
    const option = activityOptionAusViatorProdukt({
      productCode: '10001P1',
      title: 'Fixture walking tour',
      description: null,
      durationMinutes: null,
      pricing: { amount: 10, currency: 'CHF', priceRole: 'rrp_from', checkoutCurrencyConfirmed: false },
      reviewSummary: null,
      image: null,
      cancellation: { stornierbar: null },
    })
    assert.equal(option?.preisWaehrung, 'CHF')
    assert.equal(option != null && 'productUrl' in option, false)
  })

  test('detail separates rate limit from a generic error and a stale time is rejected', async () => {
    viatorZielCacheLeeren()
    const begrenzt = httpFor({})
    const original = begrenzt.client
    const rateClient: ProviderHttpClient = async (request) => {
      if (request.url.endsWith('/products/10001P1')) {
        return { status: 429, headers: { get: (name) => (name.toLowerCase() === 'retry-after' ? '2' : null) }, body: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('{"code":"TOO_MANY_REQUESTS"}')); c.close() } }) }
      }
      return original(request)
    }
    const rate = await viatorProduktLaden('10001P1', { env, http: rateClient, nowMs: NOW })
    assert.equal(rate.status, 'rate_limited')
    const zeiten = viatorStartzeiten(
      {
        productOptionCode: 'TG1',
        seasons: [{
          startDate: '2026-11-01',
          endDate: '2026-11-30',
          startTimes: ['10:00', '11:00'],
          unavailableDates: [],
          timedEntries: [
            { startTime: '10:00', unavailableDates: ['2026-11-02'] },
            { startTime: '11:00', unavailableDates: [] },
          ],
        }],
      },
      '2026-11-02',
      '2026-10-28',
    )
    assert.deepEqual(zeiten, ['11:00'])
    assert.equal(Array.isArray(zeiten), true)
    const montag = {
      productOptionCode: 'TG1',
      seasons: [{
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        startTimes: ['10:00'],
        unavailableDates: [],
        timedEntries: [{ startTime: '10:00', unavailableDates: [], daysOfWeek: ['MONDAY'] }],
      }],
    }
    assert.deepEqual(viatorStartzeiten(montag, '2026-11-02', '2026-10-28'), ['10:00'])
    assert.deepEqual(viatorStartzeiten(montag, '2026-11-03', '2026-10-28'), [])
    assert.equal(viatorStartzeiten(undefined, '2026-01-01', '2026-10-28'), null)
    const offen = viatorStartzeiten(
      {
        productOptionCode: 'TG1',
        seasons: [{ startDate: '2026-11-01', endDate: null, startTimes: ['09:00'], unavailableDates: [] }],
      },
      '2026-11-02',
      '2026-10-28',
    )
    assert.deepEqual(offen, ['09:00'])
    assert.equal(
      viatorStartzeiten(
        {
          productOptionCode: 'TG1',
          seasons: [{ startDate: '2026-11-01', endDate: null, startTimes: ['09:00'], unavailableDates: [] }],
        },
        '2028-12-01',
        '2026-10-28',
      ),
      null,
    )
  })

  test('a traveller total is not treated as adults and does not request a live check', async () => {
    const http = httpFor({
      'https://api.sandbox.viator.com/partner/products/10001P1': product,
    })
    const ergebnis = await viatorLivePruefen(
      { productCode: '10001P1', participants: 2 },
      { env, http: http.client, nowMs: NOW },
    )
    assert.equal(ergebnis.status, 'invalid')
    assert.equal(ergebnis.availabilityClaim, false)
    assert.equal(http.calls.some((url) => url.includes('/availability/check')), false)
  })

  test('a live check sends a currency, omits invented option codes, and does not treat a schedule as availability', async () => {
    const log: Array<{ url: string; body: string | null }> = []
    const antwort = (wert: unknown) => {
      const encoded = new TextEncoder().encode(JSON.stringify(wert))
      return new ReadableStream({
        start(controller) {
          controller.enqueue(encoded)
          controller.close()
        },
      })
    }
    const mitOption = {
      productCode: '10001P1',
      title: 'Fixture walking tour',
      description: 'Eine kurze Beschreibung.',
      productUrl: URL,
      productOptions: [
        { productOptionCode: 'TG1', title: 'Morgentour' },
        { productOptionCode: 'TG2', title: 'Abendtour' },
      ],
      pricingInfo: {
        ageBands: [{ ageBand: 'ADULT', startAge: 18, endAge: 99, minTravelersPerBooking: 1, maxTravelersPerBooking: 9 }],
      },
    }
    const standard = {
      productCode: '10002P2',
      title: 'Fixture standard tour',
      description: 'Ohne Option.',
      productUrl: URL,
      pricingInfo: mitOption.pricingInfo,
    }
    const kalender = {
      productCode: '10001P1',
      currency: 'EUR',
      bookableItems: [
        {
          productOptionCode: 'TG1',
          seasons: [{
            startDate: '2026-11-01',
            endDate: '2026-11-30',
            pricingRecords: [{ timedEntries: [{ startTime: '10:00' }, { startTime: '11:00' }] }],
          }],
        },
        {
          productOptionCode: 'TG2',
          seasons: [{
            startDate: '2026-11-01',
            endDate: '2026-11-30',
            pricingRecords: [{ timedEntries: [{ startTime: '18:00' }] }],
          }],
        },
      ],
    }
    const standardKalender = {
      productCode: '10002P2',
      currency: 'EUR',
      bookableItems: [{
        productOptionCode: 'DEFAULT',
        seasons: [{
          startDate: '2026-11-01',
          pricingRecords: [{ timedEntries: [{ startTime: '09:00' }] }],
        }],
      }],
    }
    const routes: Record<string, unknown> = {
      'https://api.sandbox.viator.com/partner/products/10001P1': mitOption,
      'https://api.sandbox.viator.com/partner/products/10002P2': standard,
      'https://api.sandbox.viator.com/partner/availability/schedules/10001P1': kalender,
      'https://api.sandbox.viator.com/partner/availability/schedules/10002P2': standardKalender,
    }
    const client: ProviderHttpClient = async (request) => {
      log.push({ url: request.url, body: request.body ?? null })
      if (request.url.endsWith('/availability/check') && request.body) {
        const sent = JSON.parse(request.body) as {
          productCode: string
          travelDate: string
          currency: string
          productOptionCode?: string
          startTime?: string
        }
        return {
          status: 200,
          headers: { get: () => null },
          body: antwort({
            currency: sent.currency,
            productCode: sent.productCode,
            travelDate: sent.travelDate,
            bookableItems: [{
              ...(sent.productOptionCode ? { productOptionCode: sent.productOptionCode } : {}),
              ...(sent.startTime ? { startTime: sent.startTime } : {}),
              available: true,
              totalPrice: { price: { recommendedRetailPrice: 50 } },
            }],
          }),
        }
      }
      return { status: 200, headers: { get: () => null }, body: antwort(routes[request.url] ?? {}) }
    }
    const pax = [{ ageBand: 'ADULT', numberOfTravelers: 1 }]
    const deps = { env, http: client, nowMs: NOW }
    const ohneWaehrung = await viatorLivePruefen(
      { productCode: '10001P1', productOptionCode: 'TG1', travelDate: '2026-11-02', startTime: '10:00', currency: null, paxMix: pax },
      deps,
    )
    assert.equal(ohneWaehrung.status, 'invalid')
    assert.equal(ohneWaehrung.availabilityClaim, false)
    const erfunden = await viatorLivePruefen(
      { productCode: '10001P1', standardProduct: true, travelDate: '2026-11-02', currency: 'CHF', paxMix: pax },
      deps,
    )
    assert.equal(erfunden.status, 'invalid')
    assert.match(erfunden.message, /kein Standardcode/)
    const ohneZeit = await viatorLivePruefen(
      { productCode: '10001P1', productOptionCode: 'TG1', travelDate: '2026-11-02', currency: 'CHF', paxMix: pax },
      deps,
    )
    assert.equal(ohneZeit.status, 'invalid')
    assert.match(ohneZeit.message, /Startzeit/)
    const pruefung = await viatorLivePruefen(
      { productCode: '10001P1', productOptionCode: 'TG1', travelDate: '2026-11-02', startTime: '10:00', currency: 'CHF', paxMix: pax },
      deps,
    )
    assert.equal(pruefung.status, 'ok')
    assert.equal(pruefung.availabilityClaim, true)
    assert.equal(pruefung.value?.price?.currency, 'CHF')
    const standardPruefung = await viatorLivePruefen(
      { productCode: '10002P2', travelDate: '2026-11-02', startTime: '09:00', currency: 'EUR', paxMix: pax },
      deps,
    )
    assert.equal(standardPruefung.status, 'ok')
    assert.equal(standardPruefung.value?.price?.currency, 'EUR')
    const defaultCode = await viatorLivePruefen(
      { productCode: '10002P2', productOptionCode: 'DEFAULT', travelDate: '2026-11-02', startTime: '09:00', currency: 'EUR', paxMix: pax },
      deps,
    )
    assert.equal(defaultCode.status, 'invalid')
    assert.match(defaultCode.message, /keinen Optionscode/)
    const horizont = await viatorLivePruefen(
      { productCode: '10002P2', travelDate: '2028-12-01', currency: 'EUR', paxMix: pax },
      deps,
    )
    assert.equal(horizont.status, 'invalid')
    assert.equal(horizont.availabilityClaim, false)
    const checks = log.filter((eintrag) => eintrag.url.endsWith('/availability/check'))
    assert.equal(checks.length, 2)
    const erste = JSON.parse(checks[0]!.body ?? '{}') as { currency?: string; productOptionCode?: string; startTime?: string }
    const zweite = JSON.parse(checks[1]!.body ?? '{}') as { currency?: string; productOptionCode?: string }
    assert.equal(erste.currency, 'CHF')
    assert.equal(erste.productOptionCode, 'TG1')
    assert.equal(erste.startTime, '10:00')
    assert.equal(zweite.currency, 'EUR')
    assert.equal('productOptionCode' in zweite, false)
    assert.equal(JSON.stringify(zweite).includes('DEFAULT'), false)
    assert.equal(JSON.stringify(zweite).includes('TG1'), false)
  })

  test('the normal search reads the confirmed place by id and does not trust browser aliases', async () => {
    viatorZielCacheLeeren()
    activityRateLeeren()
    const katalog = {
      destinations: [
        { destinationId: 55, name: 'Portugal', type: 'COUNTRY', parentDestinationId: null },
        { destinationId: 501, name: 'Lisbon', type: 'CITY', parentDestinationId: 55, center: { latitude: 38.72, longitude: -9.14 } },
        { destinationId: 11, name: 'Austria', type: 'COUNTRY', parentDestinationId: null },
        { destinationId: 454, name: 'Vienna', type: 'CITY', parentDestinationId: 11, center: { latitude: 48.2, longitude: 16.37 } },
      ],
    }
    const http = httpFor({
      [ZIELE]: katalog,
      'https://api.sandbox.viator.com/partner/products/search': { products: [product] },
    })
    const provider = viatorActivityProvider({ env, http: http.client, nowMs: NOW })
    const lisbon: Ort = {
      id: 'geonames:2267057',
      source: 'geonames',
      sourceId: '2267057',
      name: 'Lisbon',
      typ: 'city',
      country: 'Portugal',
      countryCode: 'PT',
      region: null,
      lat: 38.72,
      lon: -9.14,
      iata: null,
      keywords: 'Lisboa,Lissabon',
    }
    const vienna: Ort = {
      ...lisbon,
      id: 'geonames:2761369',
      sourceId: '2761369',
      name: 'Vienna',
      country: 'Austria',
      countryCode: 'AT',
      lat: 48.2,
      lon: 16.37,
      keywords: 'Wien',
    }
    const bestand = new Map<string, Ort>([[lisbon.id, lisbon], [vienna.id, vienna]])
    const eingabe = (name: string, placeId: string, countryCode: string, latitude: number, longitude: number) => ({
      stage: { id: 'stage-1', name, placeId, countryCode, latitude, longitude },
      day: { id: 'day-1', dayDate: '2026-11-02', stageId: 'stage-1' },
      trip: {
        startDate: '2026-11-02',
        endDate: '2026-11-05',
        travellers: 2,
        currency: 'CHF',
        budgetAmount: null,
        interests: [],
        pace: 'balanced' as const,
      },
      items: [],
    })
    const ports = {
      zustand: activityZustand({ JETNITY_ACTIVITY_AKTIV: 'true' }, true),
      provider,
      kennung: 'viator-kanon-suchweg',
      ortLesen: (id: string) => bestand.get(id) ?? null,
    }
    const lissabon = await activitiesSuchen(eingabe('Lissabon', lisbon.id, 'PT', 38.72, -9.14), ports)
    assert.equal(lissabon.koerper.status, 'ok')
    assert.equal(http.calls.filter((url) => url.endsWith('/products/search')).length, 1)
    const wien = await activitiesSuchen(eingabe('Wien', vienna.id, 'AT', 48.2, 16.37), ports)
    assert.equal(wien.koerper.status, 'ok')
    const ohneLeser = await activitiesSuchen(eingabe('Lissabon', lisbon.id, 'PT', 38.72, -9.14), {
      ...ports,
      kennung: 'viator-ohne-kanon',
      ortLesen: () => null,
    })
    assert.equal(ohneLeser.koerper.status, 'invalid')
    const anderesLand = await activitiesSuchen(eingabe('Lissabon', lisbon.id, 'FR', 38.72, -9.14), {
      ...ports,
      kennung: 'viator-anderes-land',
    })
    assert.equal(anderesLand.koerper.status, 'invalid')
    assert.match(anderesLand.koerper.message, /anderen Land/)
    const suchenVorher = http.calls.filter((url) => url.endsWith('/products/search')).length
    const unbekannt = await activitiesSuchen(eingabe('Lisbon', 'geonames:999999999', 'PT', 38.72, -9.14), {
      ...ports,
      kennung: 'viator-unbekannte-id',
    })
    assert.equal(unbekannt.koerper.status, 'invalid')
    const falscheId = await activitiesSuchen(eingabe('Lisbon', lisbon.id, 'PT', 38.72, -9.14), {
      ...ports,
      kennung: 'viator-falsche-id',
      ortLesen: () => ({ ...lisbon, id: 'geonames:1', sourceId: '1' }),
    })
    assert.equal(falscheId.koerper.status, 'invalid')
    const porto = await activitiesSuchen(eingabe('Porto', lisbon.id, 'PT', 41.15, -8.61), {
      ...ports,
      kennung: 'viator-porto-widerspruch',
    })
    assert.equal(porto.koerper.status, 'invalid')
    assert.match(porto.koerper.message, /passt nicht/)
    assert.equal(http.calls.filter((url) => url.endsWith('/products/search')).length, suchenVorher)
  })

  test('canonical reads wait for an active provider and the rate limit', async () => {
    activityRateLeeren()
    let lesungen = 0
    const werfend = () => {
      lesungen += 1
      throw new Error('reader failed')
    }
    const aus = await activitiesSuchen(
      {
        stage: { id: 'stage-1', name: 'Lissabon', placeId: 'geonames:2267057', countryCode: 'PT', latitude: 38.72, longitude: -9.14 },
        day: { id: 'day-1', dayDate: '2026-11-02', stageId: 'stage-1' },
        trip: { startDate: '2026-11-02', endDate: '2026-11-05', travellers: 2, currency: 'CHF', budgetAmount: null, interests: [], pace: 'balanced' },
        items: [],
      },
      {
        zustand: activityZustand({ JETNITY_ACTIVITY_AKTIV: 'false' }, false),
        provider: null,
        kennung: 'viator-leser-aus',
        ortLesen: werfend,
      },
    )
    assert.equal(aus.koerper.status, 'unavailable')
    assert.equal(lesungen, 0)
    const provider = {
      id: 'viator' as const,
      async suchen() {
        return { options: [], partial: false }
      },
    }
    const fehler = await activitiesSuchen(
      {
        stage: { id: 'stage-1', name: 'Lissabon', placeId: 'geonames:2267057', countryCode: 'PT', latitude: 38.72, longitude: -9.14 },
        day: { id: 'day-1', dayDate: '2026-11-02', stageId: 'stage-1' },
        trip: { startDate: '2026-11-02', endDate: '2026-11-05', travellers: 2, currency: 'CHF', budgetAmount: null, interests: [], pace: 'balanced' },
        items: [],
      },
      {
        zustand: activityZustand({ JETNITY_ACTIVITY_AKTIV: 'true' }, true),
        provider,
        kennung: 'viator-leser-fehler',
        ortLesen: werfend,
      },
    )
    assert.equal(fehler.koerper.status, 'error')
    assert.equal(lesungen, 1)
    let begrenzt = 0
    const ort = {
      id: 'geonames:2267057',
      source: 'geonames' as const,
      sourceId: '2267057',
      name: 'Lisbon',
      typ: 'city' as const,
      country: 'Portugal',
      countryCode: 'PT',
      region: null,
      lat: 38.72,
      lon: -9.14,
      iata: null,
      keywords: 'Lissabon',
    }
    for (let i = 0; i < 9; i += 1) {
      const antwort = await activitiesSuchen(
        {
          stage: { id: 'stage-1', name: 'Lissabon', placeId: ort.id, countryCode: 'PT', latitude: 38.72, longitude: -9.14 },
          day: { id: 'day-1', dayDate: '2026-11-02', stageId: 'stage-1' },
          trip: { startDate: '2026-11-02', endDate: '2026-11-05', travellers: 2, currency: 'CHF', budgetAmount: null, interests: [], pace: 'balanced' },
          items: [],
        },
        {
          zustand: activityZustand({ JETNITY_ACTIVITY_AKTIV: 'true' }, true),
          provider,
          kennung: 'viator-leser-limit',
          ortLesen: () => {
            begrenzt += 1
            return ort
          },
        },
      )
      if (i < 8) assert.notEqual(antwort.koerper.status, 'rate_limited')
      else {
        assert.equal(antwort.httpStatus, 429)
        assert.equal(antwort.koerper.status, 'rate_limited')
      }
    }
    assert.equal(begrenzt, 8)
  })

  test('official underscore product codes pass every Viator path and unsafe tokens do not', () => {
    const code = '2855KENNEDY_TKTS'
    const url = 'https://www.viator.com/tours/Example/Fixture/d1-2855KENNEDY_TKTS?pid=P00000000&medium=api'
    const detail = parseViatorProductDetail(
      { ...product, productCode: code, productUrl: url },
      { source: 'provider_response', retrievedAt: '2026-10-28T12:00:00.000Z', nowMs: NOW },
    )
    assert.equal(detail.ok, true)
    if (!detail.ok) return
    assert.equal(detail.value.products[0]?.productCode, code)
    assert.equal(detail.value.products[0]?.optionenUnaufgeloest, false)
    assert.equal(detail.value.affiliateRedirects[0]?.productUrl, url)
    const link = readViatorAffiliateRedirect({ source: 'provider_response', productCode: '2050_PA', productUrl: url })
    assert.equal(link?.productUrl, url)
    assert.equal(link?.productCode, '2050_PA')
    const detailAufruf = buildViatorSandboxCall('product_detail', { productCode: code, acceptLanguage: 'de-DE' })
    const kalenderAufruf = buildViatorSandboxCall('availability_schedule', { productCode: '2050_PA', acceptLanguage: 'de-DE' })
    assert.equal(detailAufruf.ok && detailAufruf.call.url, `https://api.sandbox.viator.com/partner/products/${code}`)
    assert.equal(kalenderAufruf.ok && kalenderAufruf.call.url, 'https://api.sandbox.viator.com/partner/availability/schedules/2050_PA')
    const plan = parseViatorSchedule(
      { productCode: code, currency: 'EUR', bookableItems: [] },
      { retrievedAt: '2026-10-28T12:00:00.000Z', nowMs: NOW },
    )
    assert.equal(plan.ok && plan.value.productCode, code)
    const pruefung = buildViatorSandboxCall('availability_check', {
      liveCheck: {
        productCode: '2050_PA',
        standardProduct: true,
        travelDate: '2026-11-02',
        currency: 'CHF',
        paxMix: [{ ageBand: 'ADULT', numberOfTravelers: 1 }],
        productAgeBands: [{ ageBand: 'ADULT', startAge: 18, endAge: 99, minTravelersPerBooking: 1, maxTravelersPerBooking: 9 }],
      },
    })
    assert.equal(pruefung.ok, true)
    if (!pruefung.ok) return
    assert.equal(pruefung.call.body?.includes('2050_PA'), true)
    assert.equal(pruefung.call.body?.includes('DEFAULT'), false)
    for (const schlecht of ['2855/KENNEDY', '2050?PA', '2050#PA', '2050%5FPA', '2050 PA', '2050\nPA', 'A', 'A'.repeat(41)]) {
      const abgewiesen = buildViatorSandboxCall('product_detail', { productCode: schlecht })
      assert.equal(abgewiesen.ok, false, schlecht)
      const roh = parseViatorProductDetail(
        { ...product, productCode: schlecht, productUrl: url },
        { source: 'provider_response', retrievedAt: '2026-10-28T12:00:00.000Z', nowMs: NOW },
      )
      assert.equal(roh.ok, true, schlecht)
      if (!roh.ok) return
      assert.equal(roh.value.products.length, 0)
      assert.equal(roh.value.affiliateRedirects.length, 0)
      assert.equal(JSON.stringify(abgewiesen).includes(schlecht), false)
    }
  })

  test('untitled options do not become a standard product or a live check', async () => {
    viatorZielCacheLeeren()
    const url = 'https://www.viator.com/tours/Example/Fixture/d1-10001P1?pid=P00000000&medium=api'
    const unbenannt = { ...product, productOptions: [{ productOptionCode: 'TG1' }, { title: 'ohne Code' }] }
    const gemischt = { ...product, productOptions: [{ productOptionCode: 'TG1' }, { productOptionCode: 'TG2', title: 'Abendtour' }] }
    const http = httpFor({ 'https://api.sandbox.viator.com/partner/products/10001P1': unbenannt })
    const geladen = await viatorProduktLaden('10001P1', { env, http: http.client, nowMs: NOW })
    assert.equal(geladen.status, 'ok')
    assert.equal(geladen.value?.optionenUnaufgeloest, true)
    assert.deepEqual(geladen.value?.productOptionCodes, [])
    assert.equal(geladen.value?.productUrl, url)
    const pruefung = await viatorLivePruefen(
      {
        productCode: '10001P1',
        standardProduct: true,
        travelDate: '2026-11-02',
        currency: 'CHF',
        paxMix: [{ ageBand: 'ADULT', numberOfTravelers: 1 }],
      },
      { env, http: http.client, nowMs: NOW },
    )
    assert.equal(pruefung.status, 'invalid')
    assert.equal(pruefung.availabilityClaim, false)
    assert.equal(http.calls.some((eintrag) => eintrag.includes('/availability/check')), false)
    assert.equal(http.calls.some((eintrag) => eintrag.includes('/availability/schedules')), false)
    const gemischtHttp = httpFor({
      'https://api.sandbox.viator.com/partner/products/10001P1': gemischt,
      'https://api.sandbox.viator.com/partner/availability/schedules/10001P1': {
        productCode: '10001P1',
        currency: 'EUR',
        bookableItems: [{
          productOptionCode: 'TG2',
          seasons: [{ startDate: '2026-11-01', pricingRecords: [{ timedEntries: [{ startTime: '10:00' }] }] }],
        }],
      },
      'https://api.sandbox.viator.com/partner/availability/check': {
        currency: 'CHF',
        productCode: '10001P1',
        travelDate: '2026-11-02',
        bookableItems: [{
          productOptionCode: 'TG2',
          startTime: '10:00',
          available: true,
          totalPrice: { price: { recommendedRetailPrice: 80 } },
        }],
      },
    })
    const sichtbar = await viatorProduktLaden('10001P1', { env, http: gemischtHttp.client, nowMs: NOW })
    assert.equal(sichtbar.value?.optionenUnaufgeloest, true)
    assert.deepEqual(sichtbar.value?.productOptionCodes, ['TG2'])
    const veraltet = await viatorLivePruefen(
      { productCode: '10001P1', productOptionCode: 'TG1', standardProduct: true, travelDate: '2026-11-02', currency: 'CHF', paxMix: [{ ageBand: 'ADULT', numberOfTravelers: 1 }] },
      { env, http: gemischtHttp.client, nowMs: NOW },
    )
    assert.equal(veraltet.status, 'invalid')
    assert.equal(gemischtHttp.calls.some((eintrag) => eintrag.includes('/availability/check')), false)
    const erlaubt = await viatorLivePruefen(
      { productCode: '10001P1', productOptionCode: 'TG2', travelDate: '2026-11-02', startTime: '10:00', currency: 'CHF', paxMix: [{ ageBand: 'ADULT', numberOfTravelers: 1 }] },
      { env, http: gemischtHttp.client, nowMs: NOW },
    )
    assert.equal(erlaubt.status, 'ok', erlaubt.message)
    assert.equal(gemischtHttp.calls.some((eintrag) => eintrag.includes('/availability/check')), true)
  })
})
