// Gegen einen isolierten lokalen PostgREST mit dem vollständigen Probeimport.
// Kein Zugriff auf Development/Production; nur 127.0.0.1 ist erlaubt.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { lese } from '@/lib/api/datenbank-lesen'
import { ORT_SPALTEN } from '@/lib/places/abbildung'
import { placesSuchen, type PlacesZeilenLesen } from '@/lib/places/suche-lauf'
import { ortExaktfilter, ortNamensfilter } from '@/lib/places/suche'
import type { OrtRolle } from '@/lib/places/domain'

async function main() {
  const url = new URL(process.env.PLACES_LOCAL_REST ?? 'http://127.0.0.1:55451')
  assert.equal(url.hostname, '127.0.0.1')
  const client = createClient(url.origin, 'local-proof-no-secret', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers)
      headers.delete('authorization')
      return fetch(String(input).replace('/rest/v1/', '/'), { ...init, headers })
    } },
  })
  function leser(rolle: OrtRolle): PlacesZeilenLesen {
    return async (art, filter, limit, landCodes) => {
      const gelesen = await lese(() => {
        let query = client.from('places').select(ORT_SPALTEN)
        if (art === 'land') query = query.eq('typ', 'country')
        else if (art === 'abreise-flughafen') query = query.eq('typ', 'airport')
        else if (rolle === 'abreise') query = query.in('typ', ['city', 'airport'])
        else query = query.neq('typ', 'airport')
        if (landCodes?.length) query = query.in('country_code', [...landCodes])
        return query.or(filter).order('population', { ascending: false, nullsFirst: false }).order('id').limit(limit)
      })
      return gelesen as Awaited<ReturnType<PlacesZeilenLesen>>
    }
  }
  const faelle: Array<{ suche: string; id?: string; rolle?: OrtRolle; land?: string; enthalten?: string }> = [
    { suche: 'Australien', id: 'geonames:2077456' },
    { suche: 'Jervis', enthalten: 'geonames:8335033' },
    { suche: 'Aruba', id: 'geonames:3577279' }, { suche: 'Curaçao', id: 'geonames:7626836' },
    { suche: 'Jersey', id: 'geonames:3042142' }, { suche: 'Antarktis', id: 'geonames:6697173' },
    { suche: 'Tay', enthalten: 'geonames:1220409' }, { suche: 'Taj', enthalten: 'geonames:1668284' },
    { suche: 'Royaume', enthalten: 'geonames:2635167' },
    { suche: 'Schwei', id: 'geonames:2658434' }, { suche: 'Schweiz', id: 'geonames:2658434' },
    { suche: 'Deutschland', id: 'geonames:2921044' }, { suche: 'Frankreich', id: 'geonames:3017382' },
    { suche: 'Japan', id: 'geonames:1861060' }, { suche: 'Peru', id: 'geonames:3932488' },
    { suche: 'Munich', id: 'geonames:2867714' }, { suche: 'München', id: 'geonames:2867714' },
    { suche: 'Paris', id: 'geonames:2988507' }, { suche: 'Paris, Frankreich', id: 'geonames:2988507', land: 'FR' },
    { suche: 'Paris, USA', land: 'US' },
    { suche: 'Zürich', id: 'geonames:2657896', rolle: 'abreise' },
    { suche: 'Zurich', id: 'geonames:2657896', rolle: 'abreise' },
    { suche: 'Bangkok', id: 'geonames:1609350' }, { suche: 'Ubud', id: 'geonames:1622846' },
    { suche: 'Ko Lipe', id: 'geonames:1342638' }, { suche: 'Nusa Penida', id: 'geonames:1631470' },
    { suche: 'St. Gallen', id: 'geonames:2658822' },
    { suche: 'Trinidad und Tobago', id: 'geonames:3573591' },
  ]
  const ergebnisse = []
  for (const fall of faelle) {
    const start = performance.now()
    const ergebnis = await placesSuchen(fall.suche, fall.rolle ?? 'ziel', leser(fall.rolle ?? 'ziel'))
    assert.equal(ergebnis.problem, null, `${fall.suche}: ${JSON.stringify(ergebnis.problem)}`)
    if (fall.id) assert.equal(ergebnis.optionen?.[0]?.id, fall.id, `${fall.suche}: ${JSON.stringify(ergebnis.optionen)}`)
    if (fall.enthalten) assert.ok(ergebnis.optionen?.some((o) => o.id === fall.enthalten), fall.suche)
    if (fall.land) assert.ok(ergebnis.optionen?.length && ergebnis.optionen.every((o) => o.countryCode === fall.land), fall.suche)
    ergebnisse.push({ ...fall, ms: Math.round(performance.now() - start), optionen: ergebnis.optionen })
  }
  for (const suche of ['a+b', 'a[b]', 'a|b', 'a$^b', 'Paris\",typ.eq.airport', 'St. Gallen', 'A (B)', "L'Isle", 'a\\b', 'a\nb']) {
    for (const filter of [ortExaktfilter(suche), ortNamensfilter(suche)]) {
      assert.ok(filter)
      const { error } = await client.from('places').select('id').or(filter).limit(1)
      assert.equal(error, null, `${suche}: ${JSON.stringify(error)}`)
    }
  }
  const { error: schreibfehler } = await client.from('places').insert({ id: 'geonames:0', name: 'forbidden' })
  assert.ok(schreibfehler, 'Anonyme Nutzer dürfen keine Orte schreiben')
  const bericht = { zeit: new Date().toISOString(), umgebung: url.origin, faelle: ergebnisse, filterPruefungen: 20, anonymerSchreibzugriff: 'verweigert' }
  if (process.env.PLACES_EVIDENCE_FILE) writeFileSync(process.env.PLACES_EVIDENCE_FILE, JSON.stringify(bericht, null, 2))
  console.log(JSON.stringify({ faelle: ergebnisse.length, filterPruefungen: 20, maxMs: Math.max(...ergebnisse.map((e) => e.ms)), status: 'PASS' }))
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
