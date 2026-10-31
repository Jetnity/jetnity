import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'

import { activityOptionFuerUebernahme } from '@/lib/activities/suchlebenszyklus'
import { activitySucheAntwortLesen } from '@/lib/activities/client-anfrage'
import { activitiesSuchen } from '@/lib/activities/suche'
import { activityZustand } from '@/lib/activities/zustand'
import type { Ort } from '@/lib/places/domain'
import { POST as detailPost } from '@/app/api/activities/viator/detail/route'
import { POST as schedulePost } from '@/app/api/activities/viator/schedule/route'
import { POST as checkPost } from '@/app/api/activities/viator/check/route'
import { viatorActivityProvider, viatorLivePruefen, viatorProduktLaden, viatorZielCacheLeeren } from '@/lib/providers/viator/activities/anbinden'
import { parseViatorSearch } from '@/lib/providers/viator/activities/content'
import { buildViatorSandboxCall } from '@/lib/providers/viator/activities/request'
import { createViatorProductionTestClient, createViatorSandboxClient } from '@/lib/providers/viator/activities/sandbox'
import { VIATOR_PRODUCTION_QUELLE_OFFEN, viatorProductionAusUmgebung } from '@/lib/providers/viator/activities/produktion'
import type { ProviderHttpClient } from '@/lib/server/providers/core'

const KEY = 'sandbox-key-do-not-leak'
const PRODUCTION_KEY = 'production-key-do-not-leak'
const NOW = Date.parse('2026-10-31T12:00:00.000Z')
const URL = 'https://www.viator.com/tours/Example/Fixture/d1-10001P1?pid=P00000000&medium=api'
const env = {
  VIATOR_SANDBOX_CALLS: 'true',
  VIATOR_SANDBOX_API_KEY: KEY,
  VERCEL_ENV: 'preview',
  JETNITY_ACTIVITY_AKTIV: 'true',
}

function jsonAntwort(status: number, body: unknown): ProviderHttpClient {
  const encoded = new TextEncoder().encode(JSON.stringify(body))
  return async () => ({
    status,
    headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null) },
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(encoded)
        controller.close()
      },
    }),
  })
}

describe('Viator S3 production preparation', () => {
  test('the process production binding stays closed and ignores credentials', () => {
    assert.equal(VIATOR_PRODUCTION_QUELLE_OFFEN, false)
    const geschlossen = viatorProductionAusUmgebung({
      VERCEL_ENV: 'production',
      VIATOR_PRODUCTION_API_KEY: PRODUCTION_KEY,
      VIATOR_SANDBOX_API_KEY: KEY,
      VIATOR_SANDBOX_CALLS: 'true',
      JETNITY_ACTIVITY_AKTIV: 'true',
    } as { VERCEL_ENV: string; VIATOR_PRODUCTION_API_KEY: string })
    assert.equal(geschlossen.ok, false)
    if (!geschlossen.ok) assert.equal(geschlossen.reason, 'source_closed')
    const quelle = readFileSync(join(process.cwd(), 'lib/providers/viator/activities/anbinden.ts'), 'utf8')
    const fabrik = readFileSync(join(process.cwd(), 'lib/activities/factory.ts'), 'utf8')
    assert.equal(quelle.includes('createViatorProductionTestClient'), false)
    assert.equal(fabrik.includes('createViatorProductionTestClient'), false)
    const built = buildViatorSandboxCall('destinations', { origin: 'https://evil.example' })
    assert.equal(built.ok, true)
    if (built.ok) assert.equal(built.call.url, 'https://api.sandbox.viator.com/partner/destinations')
    const falsch = buildViatorSandboxCall('destinations', {}, 'https://evil.example' as 'sandbox')
    assert.equal(falsch.ok, false)
  })

  test('an injected production client uses only the production origin and a required guard', async () => {
    const calls: string[] = []
    const versuche: string[] = []
    const http: ProviderHttpClient = async (request) => {
      calls.push(request.url)
      return jsonAntwort(200, { products: [] })(request)
    }
    const ohneGuard = createViatorProductionTestClient({ credential: PRODUCTION_KEY, http })
    assert.equal(ohneGuard.ok, false)
    if (!ohneGuard.ok) assert.equal(ohneGuard.reason, 'missing_guard')
    const ohneNetz = createViatorProductionTestClient({ credential: PRODUCTION_KEY, guard: { pruefen: async () => ({ kind: 'allowed' }) } })
    assert.equal(ohneNetz.ok, false)
    if (!ohneNetz.ok) assert.equal(ohneNetz.reason, 'network_not_authorized')
    const kurzer = createViatorProductionTestClient({
      credential: 'short',
      http,
      guard: { pruefen: async () => ({ kind: 'allowed' }) },
      aktiv: () => true,
    })
    assert.equal(kurzer.ok, false)
    if (!kurzer.ok) assert.equal(kurzer.reason, 'missing_key')
    assert.equal(calls.length, 0)
    const guard = {
      pruefen: async (eingabe: { operationId: string }) => {
        versuche.push(eingabe.operationId)
        return { kind: 'allowed' }
      },
    }
    const created = createViatorProductionTestClient({ credential: PRODUCTION_KEY, http, nowMs: NOW, guard, aktiv: () => true })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const katalog = await created.client.destinations()
    assert.equal(katalog.ok, false)
    const suche = await created.client.search({ destinationId: '343', currency: 'CHF' })
    assert.equal(suche.ok, true)
    assert.deepEqual(calls, [
      'https://api.viator.com/partner/destinations',
      'https://api.viator.com/partner/products/search',
    ])
    assert.deepEqual(versuche, ['destinations', 'products_search'])
    assert.equal(JSON.stringify(created).includes(PRODUCTION_KEY), false)
    const verweigert = createViatorProductionTestClient({
      credential: PRODUCTION_KEY,
      http: async () => {
        calls.push('leak')
        return jsonAntwort(200, {})( {} as never)
      },
      guard: { pruefen: async () => { throw new Error('CANARY-GUARD') } },
      aktiv: () => true,
    })
    assert.equal(verweigert.ok, true)
    if (!verweigert.ok) return
    const vorher = calls.length
    const fehler = await verweigert.client.destinations()
    assert.equal(fehler.ok, false)
    if (!fehler.ok) {
      assert.equal(fehler.reason, 'transport')
      assert.equal(fehler.transportKind, 'rate_limited')
    }
    assert.equal(calls.length, vorher)
    assert.equal(JSON.stringify(fehler).includes('CANARY-GUARD'), false)
    const unklar = createViatorProductionTestClient({
      credential: PRODUCTION_KEY,
      http: async () => {
        calls.push('malformed')
        return jsonAntwort(200, {})({} as never)
      },
      guard: { pruefen: async () => ({ kind: 'allowed', extra: true }) },
      aktiv: () => true,
    })
    assert.equal(unklar.ok, true)
    if (!unklar.ok) return
    const vorherUnklar = calls.length
    const unklarErgebnis = await unklar.client.search({ destinationId: '343', currency: 'EUR' })
    assert.equal(unklarErgebnis.ok, false)
    assert.equal(calls.length, vorherUnklar)
    const begrenzt = createViatorProductionTestClient({
      credential: PRODUCTION_KEY,
      http: async () => {
        calls.push('limited')
        return jsonAntwort(200, {})({} as never)
      },
      guard: { pruefen: async () => ({ kind: 'rate_limited', retryAfterMs: 1000 }) },
      aktiv: () => true,
    })
    assert.equal(begrenzt.ok, true)
    if (!begrenzt.ok) return
    const vorherBegrenzt = calls.length
    const limit = await begrenzt.client.detail({ productCode: '10001P1' })
    assert.equal(limit.ok, false)
    if (!limit.ok) assert.equal(limit.transportKind, 'rate_limited')
    assert.equal(calls.length, vorherBegrenzt)
    const kette: string[] = []
    const ketteClient = createViatorProductionTestClient({
      credential: PRODUCTION_KEY,
      nowMs: NOW,
      guard: { pruefen: async (eingabe: { operationId: string }) => { kette.push(eingabe.operationId); return { kind: 'allowed' } } },
      aktiv: () => true,
      http: async (request) => {
        calls.push(request.url)
        if (request.url.endsWith('/availability/check')) {
          return jsonAntwort(200, { bookableItems: [] })(request)
        }
        if (request.url.includes('/availability/schedules/')) {
          return jsonAntwort(200, { bookableItems: [] })(request)
        }
        return jsonAntwort(200, { products: [] })(request)
      },
    })
    assert.equal(ketteClient.ok, true)
    if (!ketteClient.ok) return
    await ketteClient.client.detail({ productCode: '10001P1' })
    await ketteClient.client.schedule({ productCode: '10001P1' })
    await ketteClient.client.check({
      liveCheck: {
        productCode: '10001P1',
        standardProduct: true,
        travelDate: '2026-11-02',
        currency: 'CHF',
        paxMix: [{ ageBand: 'ADULT', numberOfTravelers: 1 }],
        productAgeBands: [{ ageBand: 'ADULT', startAge: 18, endAge: 99, minTravelersPerBooking: 1, maxTravelersPerBooking: 9 }],
      },
    })
    assert.deepEqual(kette, ['product_detail', 'availability_schedule', 'availability_check'])
    assert.equal(calls.filter((url) => url.startsWith('https://api.sandbox.viator.com')).length, 0)
    const sandbox = createViatorSandboxClient({
      env: { ...env, VIATOR_API_ORIGIN: 'https://api.viator.com' },
      http: async (request) => {
        calls.push(request.url)
        return jsonAntwort(200, { destinations: [] })(request)
      },
      nowMs: NOW,
    })
    assert.equal(sandbox.ok, true)
    if (!sandbox.ok) return
    await sandbox.client.destinations()
    assert.equal(calls.at(-1), 'https://api.sandbox.viator.com/partner/destinations')
  })

  test('activity shutdown blocks every operation, including a warm client and direct routes', async () => {
    viatorZielCacheLeeren()
    const aufrufe: string[] = []
    const katalog = {
      destinations: [
        { destinationId: 20, name: 'Thailand', type: 'COUNTRY', parentDestinationId: null },
        { destinationId: 343, name: 'Bangkok', type: 'CITY', parentDestinationId: 20, center: { latitude: 13.75, longitude: 100.5 } },
        { destinationId: 55, name: 'Portugal', type: 'COUNTRY', parentDestinationId: null },
        { destinationId: 501, name: 'Lisbon', type: 'CITY', parentDestinationId: 55, center: { latitude: 38.72, longitude: -9.14 } },
      ],
    }
    const product = {
      productCode: '10001P1',
      title: 'Fixture walking tour',
      description: 'Eine kurze Beschreibung.',
      destinations: [{ ref: '501', primary: true }],
      pricing: { summary: { fromPrice: 40 }, currency: 'EUR' },
      productUrl: URL,
      images: [{ isCover: true, variants: [{ url: 'https://hare-media-cdn.tripadvisor.com/media/attractions-splice-spp-720x480/06/71/ef/dc.jpg', width: 720, height: 480 }] }],
    }
    const umgebung = { ...env }
    const http: ProviderHttpClient = async (request) => {
      aufrufe.push(request.url)
      if (request.url.endsWith('/partner/destinations')) return jsonAntwort(200, katalog)(request)
      return jsonAntwort(200, { products: [product] })(request)
    }
    const provider = viatorActivityProvider({ env: umgebung, http, nowMs: NOW })
    assert.ok(provider)
    const treffer = await provider.suchen({
      destinationPlaceId: 'place-1',
      destinationName: 'Bangkok',
      dayDate: '2026-11-02',
      participants: 2,
      currency: 'CHF',
      budgetAmount: null,
      interests: [],
      pace: null,
      countryCode: 'TH',
      latitude: 13.75,
      longitude: 100.5,
    })
    assert.equal(treffer.options[0]?.locationName, 'Lisbon')
    assert.equal(treffer.options[0]?.punkt, null)
    assert.equal(treffer.verweise?.[0]?.productUrl, URL)
    assert.equal(JSON.stringify(treffer.options[0]).includes(URL), false)
    umgebung.JETNITY_ACTIVITY_AKTIV = 'false'
    await assert.rejects(() => provider.suchen({
      destinationPlaceId: 'place-1',
      destinationName: 'Bangkok',
      dayDate: '2026-11-02',
      participants: 2,
      currency: 'CHF',
      budgetAmount: null,
      interests: [],
      pace: null,
      countryCode: 'TH',
      latitude: 13.75,
      longitude: 100.5,
    }))
    const detail = await viatorProduktLaden('10001P1', { env: umgebung, http, nowMs: NOW })
    assert.equal(detail.status, 'unavailable')
    assert.equal(aufrufe.length, 2)
    const vorherFetch = globalThis.fetch
    let netz = 0
    globalThis.fetch = (async () => {
      netz += 1
      throw new Error('network')
    }) as typeof fetch
    const gesichert = {
      VERCEL_ENV: process.env.VERCEL_ENV,
      JETNITY_ACTIVITY_AKTIV: process.env.JETNITY_ACTIVITY_AKTIV,
      VIATOR_SANDBOX_CALLS: process.env.VIATOR_SANDBOX_CALLS,
      VIATOR_SANDBOX_API_KEY: process.env.VIATOR_SANDBOX_API_KEY,
      VIATOR_PRODUCTION_API_KEY: process.env.VIATOR_PRODUCTION_API_KEY,
    }
    process.env.VERCEL_ENV = 'production'
    process.env.JETNITY_ACTIVITY_AKTIV = 'true'
    process.env.VIATOR_SANDBOX_CALLS = 'true'
    process.env.VIATOR_SANDBOX_API_KEY = KEY
    process.env.VIATOR_PRODUCTION_API_KEY = PRODUCTION_KEY
    try {
      const anfrage = (pfad: string, body: unknown) => new Request(`http://127.0.0.1${pfad}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.51' },
        body: JSON.stringify(body),
      })
      const detailAntwort = await detailPost(anfrage('/api/activities/viator/detail', { productCode: '10001P1' }))
      const plan = await schedulePost(anfrage('/api/activities/viator/schedule', { productCode: '10001P1' }))
      const pruefung = await checkPost(anfrage('/api/activities/viator/check', { productCode: '10001P1' }))
      for (const antwort of [detailAntwort, plan, pruefung]) {
        const koerper = await antwort.json() as { status?: string }
        assert.equal(koerper.status, 'unavailable')
      }
      assert.equal(netz, 0)
      assert.equal(activityZustand({ VERCEL_ENV: 'production', JETNITY_ACTIVITY_AKTIV: 'true' }, true).aktiv, false)
    } finally {
      globalThis.fetch = vorherFetch
      process.env.VERCEL_ENV = gesichert.VERCEL_ENV
      process.env.JETNITY_ACTIVITY_AKTIV = gesichert.JETNITY_ACTIVITY_AKTIV
      process.env.VIATOR_SANDBOX_CALLS = gesichert.VIATOR_SANDBOX_CALLS
      process.env.VIATOR_SANDBOX_API_KEY = gesichert.VIATOR_SANDBOX_API_KEY
      process.env.VIATOR_PRODUCTION_API_KEY = gesichert.VIATOR_PRODUCTION_API_KEY
      viatorZielCacheLeeren()
    }
  })

  test('a referral stays bound to the returned product and out of adoption', async () => {
    const option = {
      id: 'viator:10001P1',
      provider: 'viator',
      externalRef: '10001P1',
      title: 'Spaziergang',
      description: null,
      locationName: 'Lisbon',
      punkt: null,
      dauerMinuten: 90,
      timeslot: null,
      preis: 40,
      preisWaehrung: 'EUR',
      bewertung: null,
      bewertungenAnzahl: null,
      stornierbar: null,
      kategorien: [],
      tags: [],
      bildUrl: null,
      preisRolle: 'rrp_from' as const,
      labels: [],
      reasons: [],
      konflikt: 'unbekannt' as const,
      productUrl: URL,
    }
    const uebernahme = activityOptionFuerUebernahme(option)
    assert.equal('productUrl' in uebernahme, false)
    assert.equal(JSON.stringify(uebernahme).includes(URL), false)
    const antwort = activitySucheAntwortLesen({
      status: 'ok',
      message: 'Aktivitäten gefunden.',
      coverageNote: 'Hinweis',
      evidenz: {
        hatOrt: true,
        hatKoordinaten: true,
        hatTag: true,
        hatDatum: true,
        hatBestehendePunkte: false,
        hatBelastbareZeiten: false,
        hatInteressen: false,
        hatBudget: false,
      },
      options: [{ ...option, labels: [], reasons: [], konflikt: 'unbekannt' }],
      viatorVerweise: [
        { externalRef: '10001P1', productUrl: URL },
        { externalRef: '2050_PA', productUrl: URL },
        { externalRef: '10001P1', productUrl: 'javascript:alert(1)' },
        { externalRef: '10001P1', productUrl: 'https://evil.example/tours' },
        { externalRef: '10001P1', productUrl: `${URL} `, commission: true },
      ],
    }, 200)
    assert.deepEqual(antwort.viatorVerweise, [{ externalRef: '10001P1', productUrl: URL }])
    assert.equal(JSON.stringify(antwort.options[0]).includes('productUrl'), false)
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
    viatorZielCacheLeeren()
    const http: ProviderHttpClient = async (request) => {
      if (request.url.endsWith('/partner/destinations')) {
        return jsonAntwort(200, {
          destinations: [
            { destinationId: 55, name: 'Portugal', type: 'COUNTRY', parentDestinationId: null },
            { destinationId: 501, name: 'Lisbon', type: 'CITY', parentDestinationId: 55, center: { latitude: 38.72, longitude: -9.14 } },
            { destinationId: 20, name: 'Thailand', type: 'COUNTRY', parentDestinationId: null },
            { destinationId: 343, name: 'Bangkok', type: 'CITY', parentDestinationId: 20, center: { latitude: 13.75, longitude: 100.5 } },
          ],
        })(request)
      }
      return jsonAntwort(200, {
        products: [{
          productCode: '10001P1',
          title: 'Fixture walking tour',
          destinations: [{ ref: '55', primary: true }, { ref: '501', primary: false }],
          pricing: { summary: { fromPrice: 40 }, currency: 'EUR' },
          productUrl: URL,
        }],
      })(request)
    }
    const provider = viatorActivityProvider({ env, http, nowMs: NOW })
    const gast = await activitiesSuchen({
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
    }, {
      zustand: activityZustand(env, true),
      provider,
      kennung: 'viator-s3-referral',
      ortLesen: (id: string) => (id === bangkok.id ? bangkok : null),
    })
    assert.equal(gast.koerper.options[0]?.locationName, null)
    assert.equal(gast.koerper.viatorVerweise?.[0]?.productUrl, URL)
    assert.equal(gast.koerper.options[0]?.punkt, null)
  })

  test('a flag flipped inside the first response stops the next attempt', async () => {
    viatorZielCacheLeeren()
    const katalog = {
      destinations: [
        { destinationId: 20, name: 'Thailand', type: 'COUNTRY', parentDestinationId: null },
        { destinationId: 343, name: 'Bangkok', type: 'CITY', parentDestinationId: 20, center: { latitude: 13.75, longitude: 100.5 } },
      ],
    }
    const produkt = {
      productCode: '10001P1',
      title: 'Fixture walking tour',
      pricing: { summary: { fromPrice: 40 }, currency: 'EUR' },
      productOptions: [],
      pricingInfo: { ageBands: [{ ageBand: 'ADULT', startAge: 18, endAge: 99, minTravelersPerBooking: 1, maxTravelersPerBooking: 9 }] },
    }
    const suchen = {
      destinationPlaceId: 'place-1',
      destinationName: 'Bangkok',
      dayDate: '2026-11-02',
      participants: 2,
      currency: 'CHF',
      budgetAmount: null,
      interests: [],
      pace: null,
      countryCode: 'TH',
      latitude: 13.75,
      longitude: 100.5,
    }
    const pruefen = async (feld: 'JETNITY_ACTIVITY_AKTIV' | 'VIATOR_SANDBOX_CALLS') => {
      viatorZielCacheLeeren()
      const umgebung = { ...env }
      const aufrufe: string[] = []
      const http: ProviderHttpClient = async (request) => {
        aufrufe.push(request.url)
        umgebung[feld] = 'false'
        if (request.url.endsWith('/partner/destinations')) return jsonAntwort(200, katalog)(request)
        return jsonAntwort(200, { products: [produkt] })(request)
      }
      const provider = viatorActivityProvider({ env: umgebung, http, nowMs: NOW })
      assert.ok(provider, feld)
      await assert.rejects(() => provider.suchen(suchen))
      assert.deepEqual(aufrufe, ['https://api.sandbox.viator.com/partner/destinations'], feld)
      const erneut = await provider.suchen(suchen).catch((fehler: unknown) => fehler)
      assert.ok(erneut instanceof Error, feld)
      assert.deepEqual(aufrufe, ['https://api.sandbox.viator.com/partner/destinations'], feld)
    }
    await pruefen('JETNITY_ACTIVITY_AKTIV')
    await pruefen('VIATOR_SANDBOX_CALLS')
    for (const feld of ['JETNITY_ACTIVITY_AKTIV', 'VIATOR_SANDBOX_CALLS'] as const) {
      viatorZielCacheLeeren()
      const umgebung = { ...env }
      const aufrufe: string[] = []
      const http: ProviderHttpClient = async (request) => {
        aufrufe.push(request.url)
        umgebung[feld] = 'false'
        return jsonAntwort(200, produkt)(request)
      }
      const pruefung = await viatorLivePruefen(
        {
          productCode: '10001P1',
          standardProduct: true,
          travelDate: '2026-11-02',
          currency: 'CHF',
          paxMix: [{ ageBand: 'ADULT', numberOfTravelers: 1 }],
        },
        { env: umgebung, http, nowMs: NOW },
      )
      assert.notEqual(pruefung.status, 'ok', feld)
      assert.equal(aufrufe.length, 1, feld)
      assert.equal(aufrufe[0]?.includes('/partner/products/10001P1'), true, feld)
      assert.equal(aufrufe.some((url) => url.includes('/availability/')), false, feld)
    }
    const wieder = { ...env }
    const ruhe: string[] = []
    const client = createViatorSandboxClient({
      env: wieder,
      nowMs: NOW,
      http: async (request) => {
        ruhe.push(request.url)
        return jsonAntwort(200, katalog)(request)
      },
    })
    assert.equal(client.ok, true)
    if (!client.ok) return
    wieder.JETNITY_ACTIVITY_AKTIV = 'false'
    const zu = await client.client.destinations()
    assert.equal(zu.ok, false)
    wieder.JETNITY_ACTIVITY_AKTIV = 'true'
    wieder.VIATOR_SANDBOX_CALLS = 'false'
    const calls = await client.client.search({ destinationId: '343', currency: 'CHF' })
    assert.equal(calls.ok, false)
    assert.deepEqual(ruhe, [])
    let produktionAn = true
    const produktionAufrufe: string[] = []
    const produktion = createViatorProductionTestClient({
      credential: PRODUCTION_KEY,
      nowMs: NOW,
      aktiv: () => produktionAn,
      guard: { pruefen: async () => ({ kind: 'allowed' }) },
      http: async (request) => {
        produktionAufrufe.push(request.url)
        produktionAn = false
        return jsonAntwort(200, katalog)(request)
      },
    })
    assert.equal(produktion.ok, true)
    if (!produktion.ok) return
    await produktion.client.destinations()
    await produktion.client.search({ destinationId: '343', currency: 'CHF' })
    assert.deepEqual(produktionAufrufe, ['https://api.viator.com/partner/destinations'])
    const ohneAktiv = createViatorProductionTestClient({
      credential: PRODUCTION_KEY,
      http: async () => {
        produktionAufrufe.push('ohne')
        return jsonAntwort(200, katalog)({} as never)
      },
      guard: { pruefen: async () => ({ kind: 'allowed' }) },
    })
    assert.equal(ohneAktiv.ok, false)
    if (!ohneAktiv.ok) assert.equal(ohneAktiv.reason, 'inactive')
    const guardAus: string[] = []
    const verweigert = createViatorProductionTestClient({
      credential: PRODUCTION_KEY,
      aktiv: () => true,
      guard: { pruefen: async () => ({ kind: 'rate_limited', retryAfterMs: 0 }) },
      http: async () => {
        guardAus.push('http')
        return jsonAntwort(200, katalog)({} as never)
      },
    })
    assert.equal(verweigert.ok, true)
    if (!verweigert.ok) return
    const abgewiesen = await verweigert.client.destinations()
    assert.equal(abgewiesen.ok, false)
    if (!abgewiesen.ok) assert.equal(abgewiesen.transportKind, 'rate_limited')
    assert.deepEqual(guardAus, [])
  })

  test('conflicting primary destinations stay unlabeled', () => {
    const kontext = { source: 'provider_response' as const, retrievedAt: '2026-10-31T12:00:00.000Z', nowMs: NOW }
    const produkt = (ziele: unknown[]) => ({
      productCode: '10001P1',
      title: 'Fixture walking tour',
      destinations: ziele,
      pricing: { summary: { fromPrice: 40 }, currency: 'EUR' },
    })
    const lesen = (ziele: unknown[]) => parseViatorSearch({ products: [produkt(ziele)] }, kontext)
    const vorwaerts = lesen([{ ref: '343', primary: true }, { ref: '344', primary: true }])
    const rueckwaerts = lesen([{ ref: '344', primary: true }, { ref: '343', primary: true }])
    assert.equal(vorwaerts.ok && rueckwaerts.ok, true)
    if (!vorwaerts.ok || !rueckwaerts.ok) return
    assert.equal(vorwaerts.value.products[0]?.primaryDestinationId, null)
    assert.equal(rueckwaerts.value.products[0]?.primaryDestinationId, null)
    assert.equal(vorwaerts.value.partial, true)
    assert.equal(rueckwaerts.value.partial, true)
    assert.deepEqual(vorwaerts.value.products[0]?.destinationIds, ['343', '344'])
    assert.deepEqual(rueckwaerts.value.products[0]?.destinationIds, ['344', '343'])
    const gleich = lesen([{ ref: '343', primary: true }, { ref: 343, primary: true }])
    assert.equal(gleich.ok, true)
    if (!gleich.ok) return
    assert.equal(gleich.value.products[0]?.primaryDestinationId, '343')
    assert.equal(gleich.value.partial, false)
    const kaputt = lesen([{ ref: '343', primary: true }, { ref: 'bangkok', primary: true }])
    assert.equal(kaputt.ok, true)
    if (!kaputt.ok) return
    assert.equal(kaputt.value.products[0]?.primaryDestinationId, '343')
    assert.equal(kaputt.value.partial, true)
    assert.deepEqual(kaputt.value.products[0]?.destinationIds, ['343'])
  })

  test('both primary orders stay unlabeled on the search card', async () => {
    viatorZielCacheLeeren()
    const katalog = {
      destinations: [
        { destinationId: 20, name: 'Thailand', type: 'COUNTRY', parentDestinationId: null },
        { destinationId: 343, name: 'Bangkok', type: 'CITY', parentDestinationId: 20, center: { latitude: 13.75, longitude: 100.5 } },
        { destinationId: 344, name: 'Chiang Mai', type: 'CITY', parentDestinationId: 20, center: { latitude: 18.79, longitude: 98.98 } },
      ],
    }
    const suchen = {
      destinationPlaceId: 'place-1',
      destinationName: 'Bangkok',
      dayDate: '2026-11-02',
      participants: 2,
      currency: 'CHF',
      budgetAmount: null,
      interests: [],
      pace: null,
      countryCode: 'TH',
      latitude: 13.75,
      longitude: 100.5,
    }
    for (const ziele of [
      [{ ref: '343', primary: true }, { ref: '344', primary: true }],
      [{ ref: '344', primary: true }, { ref: '343', primary: true }],
    ]) {
      viatorZielCacheLeeren()
      const http: ProviderHttpClient = async (request) => {
        if (request.url.endsWith('/partner/destinations')) return jsonAntwort(200, katalog)(request)
        return jsonAntwort(200, {
          products: [{
            productCode: '10001P1',
            title: 'Fixture walking tour',
            destinations: ziele,
            pricing: { summary: { fromPrice: 40 }, currency: 'EUR' },
          }],
        })(request)
      }
      const provider = viatorActivityProvider({ env, http, nowMs: NOW })
      const treffer = await provider!.suchen(suchen)
      assert.equal(treffer.options[0]?.locationName, null)
      assert.equal(treffer.options[0]?.punkt, null)
      assert.equal(treffer.partial, true)
    }
  })

  test('the process binding re-reads flags, and the guard cannot outrun activation', async () => {
    viatorZielCacheLeeren()
    const katalog = {
      destinations: [
        { destinationId: 20, name: 'Thailand', type: 'COUNTRY', parentDestinationId: null },
        { destinationId: 343, name: 'Bangkok', type: 'CITY', parentDestinationId: 20, center: { latitude: 13.75, longitude: 100.5 } },
      ],
    }
    const produkt = {
      productCode: '10001P1',
      title: 'Fixture walking tour',
      pricing: { summary: { fromPrice: 40 }, currency: 'EUR' },
      productOptions: [],
      pricingInfo: { ageBands: [{ ageBand: 'ADULT', startAge: 18, endAge: 99, minTravelersPerBooking: 1, maxTravelersPerBooking: 9 }] },
    }
    const suchen = {
      destinationPlaceId: 'place-1',
      destinationName: 'Bangkok',
      dayDate: '2026-11-02',
      participants: 2,
      currency: 'CHF',
      budgetAmount: null,
      interests: [],
      pace: null,
      countryCode: 'TH',
      latitude: 13.75,
      longitude: 100.5,
    }
    const gesichert = {
      VERCEL_ENV: process.env.VERCEL_ENV,
      VIATOR_SANDBOX_CALLS: process.env.VIATOR_SANDBOX_CALLS,
      VIATOR_SANDBOX_API_KEY: process.env.VIATOR_SANDBOX_API_KEY,
      JETNITY_ACTIVITY_AKTIV: process.env.JETNITY_ACTIVITY_AKTIV,
    }
    const setzen = (name: keyof typeof gesichert, wert: string | undefined) => {
      if (wert === undefined) delete process.env[name]
      else process.env[name] = wert
    }
    const vorherFetch = globalThis.fetch
    globalThis.fetch = (async () => {
      throw new Error('CANARY-FETCH')
    }) as typeof fetch
    try {
      for (const feld of ['JETNITY_ACTIVITY_AKTIV', 'VIATOR_SANDBOX_CALLS'] as const) {
        viatorZielCacheLeeren()
        process.env.VERCEL_ENV = 'preview'
        process.env.VIATOR_SANDBOX_CALLS = 'true'
        process.env.VIATOR_SANDBOX_API_KEY = KEY
        process.env.JETNITY_ACTIVITY_AKTIV = 'true'
        const aufrufe: string[] = []
        const http: ProviderHttpClient = async (request) => {
          aufrufe.push(request.url)
          process.env[feld] = 'false'
          if (request.url.endsWith('/partner/destinations')) return jsonAntwort(200, katalog)(request)
          if (request.url.includes('/partner/products/10001P1')) return jsonAntwort(200, produkt)(request)
          if (request.url.includes('/availability/')) return jsonAntwort(200, { bookableItems: [] })(request)
          return jsonAntwort(200, { products: [produkt] })(request)
        }
        const provider = viatorActivityProvider({ http, nowMs: NOW })
        assert.ok(provider, feld)
        await assert.rejects(() => provider.suchen(suchen))
        assert.deepEqual(aufrufe, ['https://api.sandbox.viator.com/partner/destinations'], feld)
        process.env.VERCEL_ENV = 'preview'
        process.env.VIATOR_SANDBOX_CALLS = 'true'
        process.env.VIATOR_SANDBOX_API_KEY = KEY
        process.env.JETNITY_ACTIVITY_AKTIV = 'true'
        const pruefung = await viatorLivePruefen(
          {
            productCode: '10001P1',
            standardProduct: true,
            travelDate: '2026-11-02',
            currency: 'CHF',
            paxMix: [{ ageBand: 'ADULT', numberOfTravelers: 1 }],
          },
          { http, nowMs: NOW },
        )
        assert.notEqual(pruefung.status, 'ok', feld)
        assert.equal(aufrufe.length, 2, feld)
        assert.equal(aufrufe[1]?.includes('/partner/products/10001P1'), true, feld)
        assert.equal(aufrufe.some((url) => url.includes('/availability/')), false, feld)
      }
    } finally {
      globalThis.fetch = vorherFetch
      setzen('VERCEL_ENV', gesichert.VERCEL_ENV)
      setzen('VIATOR_SANDBOX_CALLS', gesichert.VIATOR_SANDBOX_CALLS)
      setzen('VIATOR_SANDBOX_API_KEY', gesichert.VIATOR_SANDBOX_API_KEY)
      setzen('JETNITY_ACTIVITY_AKTIV', gesichert.JETNITY_ACTIVITY_AKTIV)
      viatorZielCacheLeeren()
    }
    for (const ziel of ['destinations', 'search'] as const) {
      let an = true
      const aufrufe: string[] = []
      const client = createViatorProductionTestClient({
        credential: PRODUCTION_KEY,
        nowMs: NOW,
        aktiv: () => an,
        guard: {
          pruefen: async () => {
            await Promise.resolve()
            an = false
            return { kind: 'allowed' }
          },
        },
        http: async (request) => {
          aufrufe.push(request.url)
          return jsonAntwort(200, katalog)(request)
        },
      })
      assert.equal(client.ok, true, ziel)
      if (!client.ok) return
      const ergebnis = ziel === 'destinations'
        ? await client.client.destinations()
        : await client.client.search({ destinationId: '343', currency: 'CHF' })
      assert.equal(ergebnis.ok, false, ziel)
      if (!ergebnis.ok) {
        assert.equal(ergebnis.reason, 'transport', ziel)
        assert.equal(ergebnis.transportKind, 'network_error', ziel)
        assert.equal(JSON.stringify(ergebnis).includes('CANARY'), false, ziel)
      }
      assert.deepEqual(aufrufe, [], ziel)
    }
    const geworfen = createViatorProductionTestClient({
      credential: PRODUCTION_KEY,
      aktiv: () => {
        throw new Error('CANARY-AKTIV')
      },
      guard: { pruefen: async () => ({ kind: 'allowed' }) },
      http: async () => {
        throw new Error('CANARY-HTTP')
      },
    })
    assert.equal(geworfen.ok, true)
    if (!geworfen.ok) return
    const still = await geworfen.client.destinations()
    assert.equal(still.ok, false)
    if (!still.ok) assert.equal(still.reason, 'disabled')
    assert.equal(JSON.stringify(still).includes('CANARY-AKTIV'), false)
    let schritt = 0
    const spaet = createViatorProductionTestClient({
      credential: PRODUCTION_KEY,
      nowMs: NOW,
      aktiv: () => {
        schritt += 1
        if (schritt > 1) throw new Error('CANARY-SPAET')
        return true
      },
      guard: { pruefen: async () => ({ kind: 'allowed' }) },
      http: async () => {
        throw new Error('CANARY-HTTP')
      },
    })
    assert.equal(spaet.ok, true)
    if (!spaet.ok) return
    const nachGuard = await spaet.client.search({ destinationId: '343', currency: 'EUR' })
    assert.equal(nachGuard.ok, false)
    if (!nachGuard.ok) assert.equal(nachGuard.transportKind, 'network_error')
    assert.equal(JSON.stringify(nachGuard).includes('CANARY'), false)
  })
})
