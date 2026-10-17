// Development Places Search QA Unblock 1 — D0 offline diagnosis.
//
// Rein synthetische Zeilen, keine Production- oder Development-Wahrheit.
// Die Anfragen laufen durch den echten `postgrest-js`-Encoder; nur die
// Datenbank ist durch eine lokale ILIKE/IMATCH-Auswertung ersetzt.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { createClient } from '@supabase/supabase-js'

import { lese, type Lesung } from '@/lib/api/datenbank-lesen'
import { ORT_SPALTEN, type OrtZeile } from '@/lib/places/abbildung'
import type { OrtRolle } from '@/lib/places/domain'
import { placesSuchen } from '@/lib/places/suche-lauf'

const SYNTHETISCHER_HOST = 'synthetic.invalid'

function zeile(teil: Partial<OrtZeile> & Pick<OrtZeile, 'id' | 'name' | 'typ'>): OrtZeile {
  return {
    source: 'geonames',
    source_id: teil.id.replace(/^geonames:/, ''),
    country: null,
    country_code: null,
    region: null,
    lat: 0,
    lon: 0,
    iata: null,
    keywords: null,
    ...teil,
  }
}

const KATALOG: OrtZeile[] = [
  zeile({
    id: 'geonames:9100001',
    name: 'Japan',
    typ: 'country',
    country: 'Japan',
    country_code: 'JP',
    keywords: 'Japan, Nippon, Nihon, Japon',
  }),
  zeile({ id: 'geonames:9100002', name: 'Tokyo', typ: 'city', country: 'Japan', country_code: 'JP', keywords: 'Tokyo, Tokio' }),
  zeile({
    id: 'geonames:9100003',
    name: 'Zürich',
    typ: 'city',
    country: 'Switzerland',
    country_code: 'CH',
    region: 'Zurich',
    keywords: 'Zurich, Zuerich, Zurigo',
  }),
  zeile({
    id: 'geonames:9100004',
    name: 'Zürich Kreis 1',
    typ: 'city',
    country: 'Switzerland',
    country_code: 'CH',
    region: 'Zurich',
  }),
  zeile({
    id: 'geonames:9100005',
    name: 'Lake Zurich',
    typ: 'city',
    country: 'United States',
    country_code: 'US',
    region: 'Illinois',
    keywords: 'Lake Zurich',
  }),
  {
    id: 'airport:ZRH',
    source: 'ourairports',
    source_id: 'ZRH',
    name: 'Zürich Airport',
    typ: 'airport',
    country: 'Switzerland',
    country_code: 'CH',
    region: 'Zurich',
    lat: 0,
    lon: 0,
    iata: 'ZRH',
    keywords: 'Zurich, Kloten',
  },
]

function likeRegex(muster: string): RegExp {
  let quelle = ''
  for (const zeichen of muster) {
    if (zeichen === '%' || zeichen === '*') quelle += '.*'
    else if (zeichen === '_') quelle += '.'
    else quelle += zeichen.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${quelle}$`, 'isu')
}

function posixRegex(muster: string): RegExp {
  return new RegExp(muster.replace(/\[\[:space:\]\]/g, '\\s'), 'iu')
}

function teileOhneZitat(liste: string): string[] {
  const teile: string[] = []
  let aktuell = ''
  let zitat = false
  for (const zeichen of liste) {
    if (zeichen === '"') zitat = !zitat
    if (zeichen === ',' && !zitat) {
      teile.push(aktuell)
      aktuell = ''
    } else {
      aktuell += zeichen
    }
  }
  teile.push(aktuell)
  return teile
}

function bedingung(ausdruck: string): (zeile: OrtZeile) => boolean {
  const ersterPunkt = ausdruck.indexOf('.')
  const zweiterPunkt = ausdruck.indexOf('.', ersterPunkt + 1)
  const feld = ausdruck.slice(0, ersterPunkt) as keyof OrtZeile
  const op = ausdruck.slice(ersterPunkt + 1, zweiterPunkt)
  let wert = ausdruck.slice(zweiterPunkt + 1)
  if (wert.startsWith('"') && wert.endsWith('"')) wert = wert.slice(1, -1)
  const lesen = (z: OrtZeile) => {
    const inhalt = z[feld]
    return typeof inhalt === 'string' ? inhalt : null
  }
  if (op === 'eq') return (z) => lesen(z) === wert
  if (op === 'ilike') {
    const regex = likeRegex(wert)
    return (z) => {
      const inhalt = lesen(z)
      return inhalt !== null && regex.test(inhalt)
    }
  }
  if (op === 'imatch') {
    const regex = posixRegex(wert)
    return (z) => {
      const inhalt = lesen(z)
      return inhalt !== null && regex.test(inhalt)
    }
  }
  throw new Error(`Unerwarteter PostgREST-Operator im Diagnosepfad: ${op}`)
}

type Mitschnitt = { host: string; pfad: string; methode: string }

type Antwortart = 'katalog' | 'leer' | 'abgelehnt' | 'netz'

function synthetischerClient(art: Antwortart, mitschnitt: Mitschnitt[]) {
  const fetchSynthetisch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(input instanceof Request ? input.url : String(input))
    mitschnitt.push({ host: url.host, pfad: url.pathname, methode: init?.method ?? 'GET' })
    if (art === 'netz') throw new TypeError('fetch failed')
    if (art === 'abgelehnt') {
      return new Response(JSON.stringify({ code: '42501', message: 'permission denied for table places' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    }
    let zeilen = art === 'leer' ? [] : [...KATALOG]
    for (const [schluessel, wert] of url.searchParams) {
      if (schluessel === 'select' || schluessel === 'limit') continue
      if (schluessel === 'or') {
        const oder = teileOhneZitat(wert.slice(1, -1)).map(bedingung)
        zeilen = zeilen.filter((z) => oder.some((pruefen) => pruefen(z)))
        continue
      }
      const pruefen = bedingung(`${schluessel}.${wert}`)
      zeilen = zeilen.filter(pruefen)
    }
    const limit = Number(url.searchParams.get('limit') ?? zeilen.length)
    return new Response(JSON.stringify(zeilen.slice(0, limit)), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
  return createClient(`https://${SYNTHETISCHER_HOST}`, 'synthetic-anon-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: fetchSynthetisch },
  })
}

function alsOrtZeilen(ergebnis: Lesung<unknown>): Lesung<OrtZeile> {
  if (ergebnis.problem) return ergebnis
  return { zeilen: ergebnis.zeilen as OrtZeile[], problem: null }
}

// Muss dem Leser in `app/api/search/places/route.ts` Abfrage für Abfrage entsprechen.
async function routeSuche(raw: string, rolle: OrtRolle, art: Antwortart, mitschnitt: Mitschnitt[] = []) {
  const client = synthetischerClient(art, mitschnitt)
  return placesSuchen(raw, rolle, async (suchart, filter, limit) => {
    if (suchart === 'land') {
      return alsOrtZeilen(
        await lese(() => {
          const anfrage = client.from('places').select(ORT_SPALTEN).eq('typ', 'country')
          return (filter ? anfrage.or(filter) : anfrage).limit(limit)
        }),
      )
    }
    if (suchart === 'abreise-flughafen') {
      return alsOrtZeilen(
        await lese(() =>
          client.from('places').select(ORT_SPALTEN).eq('typ', 'airport').or(filter).limit(limit),
        ),
      )
    }
    return alsOrtZeilen(await lese(() => client.from('places').select(ORT_SPALTEN).or(filter).limit(limit)))
  })
}

describe('Places QA Unblock 1 — D0 synthetischer Diagnosepfad', () => {
  test('T01: Japan ist mit kanonischer Zeile erstes Reiseziel, als Abreise kein Land', async () => {
    const ziel = await routeSuche('Japan', 'ziel', 'katalog')
    assert.equal(ziel.problem, null)
    assert.equal(ziel.optionen?.[0]?.id, 'geonames:9100001')
    assert.equal(ziel.optionen?.[0]?.typ, 'country')
    assert.equal(ziel.optionen?.[0]?.landAliasMatch, true)

    const abreise = await routeSuche('Japan', 'abreise', 'katalog')
    assert.equal(abreise.problem, null)
    assert.ok(abreise.optionen?.every((option) => option.typ !== 'country'))
  })

  test('T02: Zürich, Zurich und zürich liefern Stadt und ZRH als Abreise, ohne Illinois vorn', async () => {
    for (const suche of ['Zürich', 'Zurich', 'zürich']) {
      const abreise = await routeSuche(suche, 'abreise', 'katalog')
      assert.equal(abreise.problem, null)
      const ids = abreise.optionen?.map((option) => option.id) ?? []
      assert.equal(ids[0], 'geonames:9100003', suche)
      assert.ok(ids.includes('airport:ZRH'), suche)
      assert.ok(ids.indexOf('geonames:9100005') === -1 || ids.indexOf('geonames:9100005') > ids.indexOf('airport:ZRH'))
    }
  })

  test('T02: Zürich als Reiseziel liefert die Stadt und keinen Flughafen', async () => {
    const ziel = await routeSuche('Zürich', 'ziel', 'katalog')
    assert.equal(ziel.problem, null)
    assert.equal(ziel.optionen?.[0]?.id, 'geonames:9100003')
    assert.ok(ziel.optionen?.every((option) => option.typ !== 'airport'))
  })

  test('T03: leerer Katalog bleibt ehrlich leer, ohne Problem und ohne Ersatztreffer', async () => {
    for (const [suche, rolle] of [
      ['Japan', 'ziel'],
      ['Zürich', 'abreise'],
      ['Zürich', 'ziel'],
    ] as const) {
      const ergebnis = await routeSuche(suche, rolle, 'leer')
      assert.deepEqual(ergebnis, { optionen: [], problem: null })
    }
  })

  test('T04: abgelehnter Lesezugriff wird 500, Netzausfall 503, nie stilles Leer', async () => {
    const abgelehnt = await routeSuche('Japan', 'ziel', 'abgelehnt')
    assert.equal(abgelehnt.optionen, null)
    assert.equal(abgelehnt.problem?.status, 500)

    const netz = await routeSuche('Zürich', 'abreise', 'netz')
    assert.equal(netz.optionen, null)
    assert.equal(netz.problem?.status, 503)
  })

  test('T08: nur first-party PostgREST-GET auf public.places, kein anderer Host', async () => {
    const mitschnitt: Mitschnitt[] = []
    await routeSuche('Japan', 'ziel', 'katalog', mitschnitt)
    await routeSuche('Zürich', 'abreise', 'katalog', mitschnitt)
    assert.ok(mitschnitt.length > 0)
    for (const eintrag of mitschnitt) {
      assert.deepEqual(eintrag, { host: SYNTHETISCHER_HOST, pfad: '/rest/v1/places', methode: 'GET' })
    }
  })
})
