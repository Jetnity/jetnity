import type { Trip } from '@/types/trips'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fixture, conflictFixture } from '@/scripts/direct-trip-editing-1/fixture'
import { tripZeitpruefung } from '@/lib/trips/trip-timeline-temporal-review-1'
import { istKommerziell } from '@/lib/reiseaenderung/geschuetzt'
import { buchungsstatusAnwenden, istGebucht } from '@/lib/trips/buchung'
import { manuellSchema, manuellerEntwurf, vorschauKennungen } from './direct/entwurf'
import { auswirkungen } from './direct/auswirkungen'
import { tripAuditV1 } from '@/lib/trips/trip-audit-v1/audit'
import { bedeutung, fingerprint } from './direct/bestaetigung'
import { manuellVorschau, manuellSpeichern } from './direct/speichern'
import { gastManuellSpeichern } from './direct/gast'
import { gastreiseAendern, gastreiseAnlegen, gastreiseSpeichern, gastPlanpunktAnlegen, gastspeicherLaden, VeralteteFassungFehler } from '@/lib/trips/gastspeicher'
import type { Ort } from '@/lib/places/domain'
import { aenderungAlsNutzlast } from './nutzlast'
import { reiseLesen } from '@/lib/trips/schema'
import { readinessItemLesen } from '@/lib/readiness/schema'
import { itineraryAirportChange } from '@/lib/route/fixtures'
import { reiseDiff } from './diff'
const seed = '817a7ff5-1359-48d8-952c-893932c2b741'
const apply = (input: unknown, trip = fixture()) => {
  const r = manuellerEntwurf(trip, input, vorschauKennungen(seed)); assert(r.ok, !r.ok ? r.meldung : ''); return r
}
test('manual literal budget/wish/interests preserve meaning; no model price stripping', () => {
  const r = apply({ title: 'Reise für CHF 1500', budgetAmount: 0, pace: 'calm', interests: [], travelWish: 'Mein Budget ist CHF 1500.' })
  assert.equal(r.nachher.travelWish, 'Mein Budget ist CHF 1500.'); assert.equal(r.nachher.title, 'Reise für CHF 1500')
  assert.equal(r.nachher.currency, 'CHF'); assert.equal(r.nachher.budgetAmount, 0)
  assert(reiseDiff(fixture(), apply({ interests: [] }).nachher).some(x => x.text.startsWith('Interessen:')))
  assert(reiseDiff(fixture(), apply({ travelWish: 'CHF 1500.' }).nachher).some(x => x.text.includes('CHF 1500.')))
})
for (const [name, input] of Object.entries({ noop: {}, blank: { title: '' }, nullBudget: { budgetAmount: null }, badDate: { startDate: '2026-02-31' }, emptyDate: { startDate: '' },
  decimalDays: { duration: 2.1 }, zeroDays: { duration: 0 }, durationDelta: { duration: 40 }, price: { budgetAmount: 1.001 }, nearPrecision: { budgetAmount: 1.000000000001 }, negative: { budgetAmount: -1 },
  unknown: { travellers: 3 }, graph: { days: [] }, currency: { currency: 'EUR' }, nullWish: { travelWish: null }, blankWish: { travelWish: '' },
  foreign: { stages: [{ id: 'foreign', days: 1 }] }, duplicate: { stages: [{ id: 'stage-1', days: 1 }, { id: 'stage-1', remove: true }] },
  last: { stages: [{ id: 'stage-1', remove: true }, { id: 'stage-2', remove: true }] }, contradictory: { duration: 4, stages: [{ id: 'stage-1', days: 1 }] },
  stageExtra: { stages: [{ id: 'stage-1', days: 1, name: 'Venice' }] } }))
  test(`invalid ${name} cannot produce a proposal`, () => assert.equal(manuellerEntwurf(fixture(), input, vorschauKennungen(seed)).ok, false))
test('metadata preserves ALL unrelated explicit times, stage/date/place and container facts', () => {
  const before = fixture(); before.days[0].items[0].position = 7
  const after = apply({ title: 'Neuer Titel' }, before).nachher
  assert.deepEqual(after, { ...before, title: 'Neuer Titel' })
})
test('stage duration with repeated city names targets exact ID; explicit item dates survive reindex', () => {
  const before = fixture(), after = apply({ stages: [{ id: 'stage-1', days: 3 }], duration: 5 }).nachher
  assert.equal(after.days.filter(d => d.stageId === 'stage-1').length, 3)
  assert.equal(after.days.filter(d => d.stageId === 'stage-2').length, 2)
  assert.deepEqual(after.days.find(d => d.id === 'day-3')?.items, before.days[2].items)
  assert.equal(after.days.find(d => d.id === 'day-3')?.dayDate, '2026-10-10')
})
test('whole date shift moves both eligible endpoints, preserves nulls and exact protected facts', () => {
  const before = fixture(); before.days[1].items[0].startsOn = null; before.days[1].items[0].endsOn = null
  const after = apply({ startDate: '2026-10-09' }, before).nachher
  assert.equal(after.days[0].items[0].startsOn, '2026-10-11'); assert.equal(after.days[0].items[0].endsOn, '2026-10-12')
  assert.equal(after.days[1].items[0].startsOn, null); assert.deepEqual(after.days[3].items, before.days[3].items)
})
test('flexible to dated leaves explicit point dates unchanged; structural compound once', () => {
  const before = fixture(); before.startDate = null; before.endDate = null; before.days.forEach(d => { d.dayDate = null }); before.stages.forEach(s => { s.arrivalDate = null; s.departureDate = null })
  const after = apply({ title: 'Neu', startDate: '2026-10-08', stages: [{ id: 'stage-1', days: 3 }], duration: 5 }, before).nachher
  assert.equal(after.endDate, '2026-10-12'); assert.equal(after.days[0].items[0].startsOn, before.days[0].items[0].startsOn)
})
test('stage removal keeps every normal point unplanned and the protected booking unchanged', () => {
  const before = fixture(), after = apply({ stages: [{ id: 'stage-2', remove: true }] }).nachher
  const groups = auswirkungen(before, after)
  assert.equal(groups.find(g => g.titel.startsWith('Normale'))?.zeilen.length, 0)
  assert.equal(groups.find(g => g.titel.startsWith('Geschützte'))?.zeilen.length, 1)
  assert.equal(groups.find(g => g.titel.startsWith('Weitere'))?.zeilen.length, 1)
  assert(groups.flatMap(g => g.zeilen).some(x => x.text.includes('Tag 3') && x.text.includes('Planpunkt 3') && x.text.includes('Ungeplant')))
  assert.deepEqual(after.ohneTag.find(p => p.id === 'item-3'), { ...before.days[2].items[0], dayId: null, stageId: null })
  assert.deepEqual(after.ohneTag.find(p => p.id === 'item-4'), { ...before.days[3].items[0], dayId: null, stageId: null })
  assert.equal(new Set(after.ohneTag.map(p => p.id)).size, after.ohneTag.length)
})
test('R1: actual proposed temporal conflict is prospective and preview leaves the original graph unchanged', async () => {
  const before = conflictFixture(), original = structuredClone(before)
  assert(before)
  assert(!tripZeitpruefung(before).pairs.some(p => ['possible_conflict', 'proven_conflict'].includes(p.state)))
  const result = await manuellVorschau(before, { startDate: '2026-10-09' }, seed)
  assert(result.ok)
  const after = result.vorschau.nachher, pairs = tripZeitpruefung(after).pairs
  assert.equal(pairs.length, 1)
  assert.equal(pairs[0].state, 'possible_conflict')
  assert.equal(pairs[0].comparisonBasis, 'civil_only')
  assert.deepEqual(new Set(pairs[0].itemIds), new Set(['item-1', 'fixed-transfer']))
  const rows = auswirkungen(before, after).find(g => g.titel === 'Zeitprüfung des vorgeschlagenen Plans')!.zeilen
  const conflict = rows.find(r => r.id === 'time-0')!
  assert.match(conflict.text, /mögliche Überschneidung im vorgeschlagenen Plan\./)
  assert.doesNotMatch(conflict.text, /gespeichert|bestätigt|nachgewiesene/)
  assert.deepEqual(after.days[0].items[1], original.days[0].items[1])
  assert.deepEqual(before, original)
})
test('duplicate authoritative IDs fail closed', () => { const before = fixture(); before.stages[1].id = before.stages[0].id; assert.equal(manuellerEntwurf(before, { title: 'Neu' }, vorschauKennungen(seed)).ok, false) })
test('readback uses exact stable generated day IDs and all semantic fields, ignoring only row versions', async () => {
  const before = fixture(); const p = await manuellVorschau(before, { duration: 6 }, seed); assert(p.ok)
  let current = before, writes = 0
  const ports = { lesen: async () => current, schreiben: async (trip: typeof before, mutation: string, revision: number) => { writes++; current = { ...trip, revision: revision + 1, lastMutationId: mutation }; return { konflikt: false } } }
  const r = await manuellSpeichern(p.vorschau.anfrage, ports); assert(r.ok); assert.equal(writes, 1)
  assert.deepEqual(r.reise.days, p.vorschau.nachher.days)
  assert((await manuellSpeichern(p.vorschau.anfrage, ports)).ok); assert.equal(writes, 1)
  assert.equal((await manuellSpeichern({ ...p.vorschau.anfrage, eingabe: { duration: 7 } }, ports)).ok, false)
  current = { ...current, title: 'Later', revision: current.revision + 1 }
  assert.equal((await manuellSpeichern(p.vorschau.anfrage, ports)).ok, false)
})
test('lost response is resolved by independent read; failed or mismatched readback remains uncertain and verifiable', async () => {
  for (const mode of ['throw', 'unavailable', 'mismatch'] as const) {
    const before = fixture(), p = await manuellVorschau(before, { title: 'Neu' }, seed); assert(p.ok)
    let current = before, n = 0, reads = 0
    const ports = { lesen: async () => { reads++; if (reads === 2 && mode === 'unavailable') throw Error('network'); return reads === 2 && mode === 'mismatch' ? { ...current, title: 'wrong' } : current },
      schreiben: async (trip: typeof before, mutation: string, revision: number) => { n++; current = { ...trip, lastMutationId: mutation, revision: revision + 1 }; throw Error('response lost') } }
    const r = await manuellSpeichern(p.vorschau.anfrage, ports)
    assert.equal(r.ok, mode === 'throw'); if (!r.ok) assert.equal(r.art, 'ungewiss')
    assert((await manuellSpeichern({ ...p.vorschau.anfrage, nurPruefen: true }, ports)).ok); assert.equal(n, 1)
  }
})
test('client expected graph fingerprint cannot manufacture another committed meaning', async () => {
  const before = fixture(), p = await manuellVorschau(before, { title: 'Neu' }, seed); assert(p.ok)
  let n = 0; const ports = { lesen: async () => before, schreiben: async () => { n++; return { konflikt: false } } }
  assert.equal((await manuellSpeichern({ ...p.vorschau.anfrage, hash: await fingerprint(bedeutung({ ...before, title: 'Forged' })) }, ports)).ok, false)
  assert.equal((await manuellSpeichern({ ...p.vorschau.anfrage, graph: before }, ports)).ok, false); assert.equal(n, 0)
})
function storage() {
  const map = new Map<string, string>(); let broken = false
  Object.assign(globalThis, { window: { localStorage: { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { if (broken) throw Error('full'); map.set(k, v) }, removeItem: (k: string) => map.delete(k) } } })
  return { map, fail: () => { broken = true } }
}

function neuErstellteMehrzielreise() {
  storage()
  const ort = (id: string, name: string, countryCode: string, lat: number, lon: number): Ort => ({
    id, name, source: 'geonames', sourceId: id.slice('geonames:'.length), typ: 'city',
    country: countryCode, countryCode, region: null, lat, lon, iata: null, keywords: null,
  })
  const paris = ort('geonames:2988507', 'Paris', 'FR', 48.85, 2.35)
  const rom = ort('geonames:3169070', 'Rom', 'IT', 41.89, 12.51)
  const zuerich = ort('geonames:2657896', 'Zürich', 'CH', 47.37, 8.55)
  return gastreiseAnlegen({
    clientRef: '417a7ff5-1359-48d8-952c-893932c2b741', title: 'Paris und Rom',
    destination: paris.name, destinationPlaceId: paris.id, weitereDestinationPlaceIds: [rom.id],
    origin: zuerich.name, originPlaceId: zuerich.id,
    startDate: '2026-10-07', endDate: '2026-10-12', travellers: 2,
    currency: 'CHF', budgetAmount: 1200, pace: 'balanced', interests: [], travelWish: null,
  }, { ziel: paris, abreise: zuerich, weitereZiele: [rom] })
}

for (const duration of [5, 7]) {
  test(`Guest create → Dauer ${duration} → speichern → reload bewahrt offene Ziele und Tageszuordnung`, async () => {
    const before = neuErstellteMehrzielreise()
    assert.equal(before.days.length, 6)
    assert.equal(before.dayStageAssignmentMode, 'unassigned')
    const proposed = await manuellVorschau(before, { duration }, seed)
    assert(proposed.ok)
    assert.deepEqual(proposed.vorschau.nachher.stages, before.stages)
    assert(proposed.vorschau.nachher.days.every(d => d.stageId === null))
    const result = await gastManuellSpeichern(proposed.vorschau.anfrage)
    assert(result.ok)
    const readback = gastspeicherLaden().aktiv
    assert(readback)
    assert.deepEqual(readback.stages, before.stages)
    assert.equal(readback.days.length, duration)
    assert(readback.days.every(d => d.stageId === null))
    assert.equal(readback.dayStageAssignmentMode, 'unassigned')
    assert.equal(readback.revision, before.revision + 1)
    assert((await gastManuellSpeichern(proposed.vorschau.anfrage)).ok)
    assert.deepEqual(gastspeicherLaden().aktiv, readback)
  })

  test(`Account-Vorschau und echte RPC-Nutzlast erhalten offene Ziele bei Dauer ${duration}`, async () => {
    const before = neuErstellteMehrzielreise()
    let current = before, writes = 0
    const proposed = await manuellVorschau(before, { duration }, seed, 'account')
    assert(proposed.ok)
    const originalPayload = aenderungAlsNutzlast(before, seed, before.revision)
    assert(originalPayload && typeof originalPayload === 'object' && !Array.isArray(originalPayload))
    const ports = {
      quelle: 'account' as const,
      lesen: async () => current,
      schreiben: async (trip: Trip, mutation: string, revision: number) => {
        const payload = aenderungAlsNutzlast(trip, mutation, revision)
        assert(payload && typeof payload === 'object' && !Array.isArray(payload))
        assert.deepEqual(payload.stages, originalPayload.stages)
        assert(Array.isArray(payload.days))
        assert.equal(payload.days.length, duration)
        for (const day of payload.days) {
          assert(day && typeof day === 'object' && !Array.isArray(day))
          assert.equal(day.stage_id, null)
        }
        writes++
        current = { ...trip, lastMutationId: mutation, revision: revision + 1 }
        return { konflikt: false }
      },
    }
    assert((await manuellSpeichern(proposed.vorschau.anfrage, ports)).ok)
    assert.deepEqual(current.stages, before.stages)
    assert.equal(current.dayStageAssignmentMode, before.dayStageAssignmentMode)
    assert((await manuellSpeichern(proposed.vorschau.anfrage, ports)).ok)
    assert.equal(writes, 1)
  })
}

for (const quelle of ['guest', 'account'] as const) {
  for (const eingabe of [{ title: 'Neuer Titel' }, { startDate: '2026-10-09' }]) {
    test(`${quelle}: taglose geschützte Unterkunft bleibt bei ${Object.keys(eingabe)[0]} durch Vorschau und Readback unverändert`, async () => {
      storage()
      const trip = fixture(), protectedItem = { ...trip.days[3].items[0], dayId: null, stageId: trip.stages[0].id }
      trip.days[3].items = []
      trip.ohneTag = [protectedItem]
      const before = gastreiseSpeichern(trip)
      let current = before
      const proposed = await manuellVorschau(before, eingabe, seed, quelle)
      assert(proposed.ok)
      assert.deepEqual(proposed.vorschau.nachher.ohneTag, [protectedItem])
      const result = quelle === 'guest'
        ? await gastManuellSpeichern(proposed.vorschau.anfrage)
        : await manuellSpeichern(proposed.vorschau.anfrage, {
          quelle,
          lesen: async () => current,
          schreiben: async (graph, mutation, revision) => {
            const payload = aenderungAlsNutzlast(graph, mutation, revision)
            assert(payload && typeof payload === 'object' && !Array.isArray(payload))
            assert(Array.isArray(payload.ungeplante))
            const point = payload.ungeplante[0]
            assert(point && typeof point === 'object' && !Array.isArray(point))
            assert.equal(point.day_id, null)
            assert.equal(point.stage_id, protectedItem.stageId)
            current = { ...graph, lastMutationId: mutation, revision: revision + 1 }
            return { konflikt: false }
          },
        })
      assert(result.ok)
      assert.deepEqual(result.reise.ohneTag, [protectedItem])
      assert.deepEqual(quelle === 'guest' ? gastspeicherLaden().aktiv?.ohneTag : current.ohneTag, [protectedItem])
    })
  }
}

test('Guest same-trip real storage, reload, identity equal-revision switch and stale #903 write', async () => {
  storage(); const before = gastreiseSpeichern(fixture()), p = await manuellVorschau(before, { duration: 6 }, seed); assert(p.ok)
  assert((await gastManuellSpeichern(p.vorschau.anfrage)).ok); assert.equal(gastspeicherLaden().aktiv?.days.length, 6)
  assert((await gastManuellSpeichern(p.vorschau.anfrage)).ok)
  const other = gastreiseSpeichern({ ...fixture(), id: 'trip-other' })
  assert.equal((await gastManuellSpeichern(p.vorschau.anfrage)).ok, false); assert.equal(gastspeicherLaden().aktiv?.id, other.id)
  const ops = apply({ title: 'Wrong trip' }).operationen
  assert.throws(() => gastreiseAendern({ tripId: before.id, basisRevision: 1, mutationId: 'equal-revision', operationen: ops }), VeralteteFassungFehler)
  const refreshed = gastreiseSpeichern(before); gastPlanpunktAnlegen(refreshed, { dayId: before.days[0].id, kind: 'note', title: 'Concurrent', note: null, startsAt: null })
  assert.equal((await gastManuellSpeichern(p.vorschau.anfrage)).ok, false); assert(gastspeicherLaden().aktiv?.days[0].items.some(p => p.title === 'Concurrent'))
})
test('Guest full/corrupt storage never claims success', async () => {
  const s = storage(), before = gastreiseSpeichern(fixture()), p = await manuellVorschau(before, { title: 'Neu' }, seed); assert(p.ok)
  s.fail(); const r = await gastManuellSpeichern(p.vorschau.anfrage); assert.equal(r.ok, false); assert.equal(gastspeicherLaden().aktiv?.title, before.title)
  s.map.set('jetnity:reise:v3', '{broken'); assert.equal((await gastManuellSpeichern(p.vorschau.anfrage)).ok, false); assert.equal(s.map.get('jetnity:reise:v3'), '{broken')
})
test('manual strict schema never accepts graph, identity, locations, clearing or unknown properties', () => {
  assert(!manuellSchema.safeParse({ title: 'Neu', originPlaceId: 'airport:ZRH' }).success)
})

test('new IDs cannot collide with surviving authoritative days', () => {
  const before = fixture(); before.days[0].id = `${seed.slice(0,24)}000000000001`;before.days[0].items.forEach(p=>p.dayId=before.days[0].id)
  assert.equal(manuellerEntwurf(before,{duration:5},vorschauKennungen(seed)).ok,false)
})
test('multiline manual wish preserves literal meaning without model normalization', () => {
  assert.equal(apply({travelWish:'CHF 1200.\nNatur und Kultur.'}).nachher.travelWish,'CHF 1200.\nNatur und Kultur.')
})
test('stage removal keeps a linked preparation on the preserved plan point', () => {
  const before=fixture();before.readinessItems=[readinessItemLesen({id:'preparation-linked',clientRef:'preparation-linked',tripItemId:'item-3',kind:'preparation',title:'Synthetische Vorbereitung',userStatus:'open',contextFingerprint:'synthetic',createdAt:before.createdAt,updatedAt:before.updatedAt})!]
  const result=manuellerEntwurf(before,{stages:[{id:'stage-2',remove:true}]},vorschauKennungen(seed),'account')
  assert.equal(result.ok,true)
  if(!result.ok)return
  assert.equal(result.nachher.ohneTag.some(p => p.id === 'item-3'), true)
  assert.equal(result.nachher.readinessItems?.[0]?.tripItemId, 'item-3')
  assert.equal(result.nachher.readinessItems?.[0]?.title, 'Synthetische Vorbereitung')
  assert.equal(result.nachher.readinessItems?.[0]?.userStatus, 'open')
})

test('canonical protected route facts survive metadata and date changes exactly',()=>{
 const before=fixture();before.days[3].items[0]={...before.days[3].items[0],kind:'flight',routeItinerary:itineraryAirportChange()}
 const canonical=reiseLesen(before)!;assert(canonical)
 const after=apply({title:'Neue Reise',startDate:'2026-10-10'},canonical).nachher
 assert.deepEqual(after.days[3].items,canonical.days[3].items);assert.equal(after.originPlaceId,before.originPlaceId)
})

test('manual stop inserts owned days and an optional pin, survives readback and retry', async () => {
  let current = fixture()
  const existing = current.stages.map(stage => stage.id)
  const req = { neuerStopp: { name: 'Ayutthaya', tage: 2, nachEtappeId: existing[0], position: { lat: 14.35, lng: 100.57 } } }
  const proposed = await manuellVorschau(current, req, seed, 'account')
  assert(proposed.ok)
  let writes = 0
  const ports = {
    quelle: 'account' as const,
    lesen: async () => current,
    schreiben: async (trip: Trip, mutation: string, revision: number) => {
      writes++
      current = { ...trip, lastMutationId: mutation, revision: revision + 1 }
      return { konflikt: false }
    },
  }
  const result = await manuellSpeichern(proposed.vorschau.anfrage, ports)
  assert(result.ok)
  const stop = current.stages.find(s => s.name === 'Ayutthaya')!
  assert.equal(stop.position, 2)
  assert.deepEqual([stop.latitude,stop.longitude,stop.placeId], [14.35,100.57,null])
  assert.equal(current.days.filter(d => d.stageId === stop.id).length, 2)
  assert.equal((await manuellSpeichern(proposed.vorschau.anfrage, ports)).ok, true)
  assert.equal(writes, 1)
  assert.equal(manuellerEntwurf(current, { neuerStopp: { ...req.neuerStopp, nachEtappeId: 'fremd' } }, vorschauKennungen(seed)).ok, false)
  assert.equal(manuellerEntwurf(current, { neuerStopp: { ...req.neuerStopp, position: { lat: 91,lng: 0 } } }, vorschauKennungen(seed)).ok,false)
})

test('catalog stops are resolved on preview and write and cannot import caller-supplied place data', async () => {
  const before = fixture()
  let current = before
  let writes = 0
  let reads = 0
  const { ort, request } = katalogStopp(before)
  const lesen = async () => { reads++; return { ok: true as const, wert: ort } }
  const probe = await manuellVorschau(before, request, seed, 'account', lesen)
  assert(probe.ok)
  assert.equal(reads, 1)
  const neu = probe.vorschau.nachher.stages.find(s => s.placeId === ort.id)!
  assert.deepEqual([neu.name,neu.countryCode,neu.latitude,neu.longitude], [ort.name,ort.countryCode,ort.lat,ort.lon])
  assert.equal(neu.position,2)
  assert.equal(probe.vorschau.nachher.days.length,before.days.length+2)
  assert.deepEqual(probe.vorschau.anfrage.eingabe,request)
  const ports = { quelle: 'account' as const, ortLesen: lesen, lesen: async () => current,
    schreiben: async (t: Trip, mutation: string, rev: number) => {
      current = {...t, revision: rev+1, lastMutationId:mutation}; writes++; return {konflikt:false}
    } }
  const spoofed = {...probe.vorschau.anfrage, eingabe: {neuerStopp:{...request.neuerStopp, countryCode:'US', name:'Spoof', position:{lat:4,lng:8}}}}
  assert.equal((await manuellSpeichern(spoofed,ports)).ok,false)
  assert.equal(reads,1)
  assert.equal((await manuellSpeichern(probe.vorschau.anfrage,{...ports,ortLesen:async()=>({ok:true,wert:{...ort,lon:0}})})).ok,false)
  assert.equal((await manuellSpeichern(probe.vorschau.anfrage,{...ports,ortLesen:async()=>({ok:false,grund:'ausfall',meldung:'nicht erreichbar'})})).ok,false)
  assert.equal(writes,0)
  assert((await manuellSpeichern(probe.vorschau.anfrage,ports)).ok)
  assert.equal(reads,2)
  assert((await manuellSpeichern(probe.vorschau.anfrage,{...ports,ortLesen:async()=>{throw Error('should not read on replay')}})).ok)
  assert.equal(writes,1)
})

test('guest persists confirmed catalog facts, handles unresolved, foreign and wrong-role results, and still supports free stops', async()=>{
  storage()
  const before = gastreiseSpeichern(fixture())
  const {ort,request}=katalogStopp(before)
  const lesen = async()=>({ok:true as const,wert:ort})
  assert.equal((await manuellVorschau(before,request,seed,'guest',async()=>({ok:false,grund:'unbekannt',meldung:'Unbekannt'}))).ok,false)
  assert.equal((await manuellVorschau(before,request,seed,'guest',async()=>({ok:true,wert:{...ort,id:'geonames:2'}}))).ok,false)
  assert.equal((await manuellVorschau(before,request,seed,'guest',async()=>({ok:true,wert:{...ort,typ:'airport'}}))).ok,false)
  const p=await manuellVorschau(before,request,seed,'guest',lesen); assert(p.ok)
  const saved=await gastManuellSpeichern(p.vorschau.anfrage,lesen); assert(saved.ok)
  assert(gastspeicherLaden().aktiv?.stages.some(s=>s.placeId===ort.id && s.latitude===ort.lat && s.countryCode===ort.countryCode))
  assert((await gastManuellSpeichern(p.vorschau.anfrage)).ok)
  const free = {neuerStopp:{name:'Picknickplatz',position:{lat:45,lng:8},nachEtappeId:null,tage:1}}
  const draft=await manuellVorschau(saved.reise,free,'c5236669-7251-42f2-a533-74e008979aea','guest',()=>assert.fail('free stop need not access catalog')); assert(draft.ok)
  const inserted=draft.vorschau.nachher.stages.at(-1)!
  assert.deepEqual([inserted.name,inserted.placeId,inserted.countryCode,inserted.latitude,inserted.longitude],['Picknickplatz',null,null,45,8])
})

function katalogStopp(before: Trip) {
  const ort: import('@/lib/places/domain').Ort = { id:'geonames:1621177', source:'geonames', sourceId:'1621177', name:'Ayutthaya', typ:'city', country:'Thailand', countryCode:'TH', region:null, lat:14.35, lon:100.57, iata:null, keywords:null }
  return {ort,request:{neuerStopp:{ortId:ort.id,nachEtappeId:before.stages[0].id,tage:2}}}
}


/**
 * W2 regression base: six explicit, unbooked/booked plan points on four
 * calendar days. This is a deterministic fixture, not browser evidence.
 * It reuses the authoritative direct-preview, impact and write primitives.
 */
function w2SechsTagespunkte(): Trip {
  const reise = fixture()
  // Synthetic, test-owned fixture ONLY: no Supabase write, no supplier reference,
  // no price or external checkout. "booked" is ONLY a user-maintained marker.
  // The label must prevent a browser tester from mistaking this for a real reservation.
  const aufenthalt = reise.days[3].items[0]
  Object.assign(aufenthalt, {
    title: 'W2-TEST: Unterkunft (nur markiert, keine echte Buchung)',
    provider: null, externalRef: null, bookingUrl: null,
    priceAmount: null, priceCurrency: null,
    bookingStatus: 'booked', bookingSource: 'user',
    bookingConfirmedAt: '2026-10-01T10:00:00.000Z',
  })
  const normal = reise.days[0].items[0]
  reise.days[1].items.push({
    ...normal, id: 'w2-visit-5', dayId: 'day-2', stageId: 'stage-1',
    title: 'Museumsbesuch', position: 2,
    startsOn: '2026-10-08', endsOn: '2026-10-08',
    startsAt: '11:00', endsAt: '12:00',
  })
  reise.days[3].items.push({
    ...normal, id: 'w2-return-6', dayId: 'day-4', stageId: 'stage-2',
    title: 'Rückreise (ungebucht)', position: 2,
    startsOn: '2026-10-10', endsOn: '2026-10-10',
    startsAt: '18:00', endsAt: '19:00',
  })
  assert.equal(reise.days.flatMap(tag => tag.items).length, 6)
  return reise
}

// Same safe transition used by the actual UnterkunftBestand button.
// It represents a Dev user's assertion, never a hotel/provider confirmation.
test('W2-Dev-Testunterkunft: selbst markiert, ohne echte Buchung/Preis/Provider', async () => {
  const vor = w2SechsTagespunkte()
  const punkt = vor.days[3].items.find(item => item.id === 'item-4')!
  assert.match(punkt.title, /^W2-TEST: Unterkunft/)
  assert.equal(punkt.kind, 'stay')
  assert.equal(punkt.bookingStatus, 'booked')
  assert.equal(punkt.bookingSource, 'user')
  assert.equal(punkt.provider, null)
  assert.equal(punkt.externalRef, null)
  assert.equal(punkt.bookingUrl, null)
  assert.equal(punkt.priceAmount, null)
  assert.equal(punkt.priceCurrency, null)
  assert.equal(istGebucht(punkt), true)
  assert.equal(istKommerziell(punkt), true, 'Schutz entsteht allein durch den Nutzerstatus, nicht durch einen erfundenen Preis')
  const korrektur = buchungsstatusAnwenden(punkt, false, '2026-10-01T11:00:00.000Z')
  assert(korrektur.ok)
  assert.equal(korrektur.punkt.bookingStatus, 'unconfirmed')
  assert.equal(korrektur.punkt.bookingSource, null)
  assert.equal(korrektur.punkt.bookingConfirmedAt, null)
  const markiert = buchungsstatusAnwenden(korrektur.punkt, true, '2026-10-01T11:05:00.000Z')
  assert(markiert.ok)
  assert.equal(markiert.punkt.bookingStatus, 'booked')
  assert.equal(markiert.punkt.bookingSource, 'user')
  assert.equal(markiert.punkt.provider, null)
  assert.equal(markiert.punkt.bookingUrl, null)
  const v = await manuellVorschau(vor, { startDate: '2026-10-08' }, seed, 'account')
  assert(v.ok)
  const danach = v.vorschau.nachher.days[3].items.find(item => item.id === punkt.id)
  assert.deepEqual(danach, punkt, 'Vorschau bewahrt die reine Dev-Buchungsmarkierung und alte Check-in-/Check-out-Daten')
})

function w2PunktKennungen(reise: Trip): string[] {
  return [...reise.days.flatMap(tag => tag.items), ...reise.ohneTag]
    .map(punkt => punkt.id).sort()
}

test('W2: sechs Tagespunkte – reine Rückreisedatum-Vorschau und Folgen ohne Originaländerung', async () => {
  const vor = w2SechsTagespunkte(), original = structuredClone(vor)
  const v = await manuellVorschau(vor, { startDate: '2026-10-08' }, seed, 'account')
  assert(v.ok)
  const nach = v.vorschau.nachher
  assert.deepEqual(w2PunktKennungen(nach), w2PunktKennungen(original))
  assert.equal(new Set(w2PunktKennungen(nach)).size, 6)
  assert.equal(nach.days.find(tag => tag.id === 'day-4')?.dayDate, '2026-10-11')
  assert.equal(nach.days[3].items.find(punkt => punkt.id === 'w2-return-6')?.startsOn, '2026-10-11')
  assert.deepEqual(nach.days[3].items.find(punkt => punkt.id === 'item-4'),
    original.days[3].items.find(punkt => punkt.id === 'item-4'))
  const folgen = auswirkungen(vor, nach).flatMap(gruppe => gruppe.zeilen.map(zeile => zeile.text)).join('\n')
  assert.match(folgen, /Rückreise \(ungebucht\)/)
  assert.match(folgen, /Geschützt/)
  assert.deepEqual(vor, original) // Abbrechen: only preview; no mutation/no persistence
  assert.equal(vor.revision, original.revision)
})

test('W2: sechs Tagespunkte – Übernehmen, Readback, IDs und Revision mit idempotentem Retry', async () => {
  const vor = w2SechsTagespunkte()
  const v = await manuellVorschau(vor, { startDate: '2026-10-08' }, seed, 'account')
  assert(v.ok)
  let aktuell = structuredClone(vor), writes = 0
  const ports = {
    quelle: 'account' as const,
    lesen: async () => aktuell,
    schreiben: async (reise: Trip, mutation: string, revision: number) => {
      writes++
      aktuell = { ...reise, revision: revision + 1, lastMutationId: mutation }
      return { konflikt: false }
    },
  }
  const uebernahme = await manuellSpeichern(v.vorschau.anfrage, ports)
  assert(uebernahme.ok)
  assert.equal(writes, 1)
  assert.equal(uebernahme.reise.id, vor.id)
  assert.equal(uebernahme.reise.revision, vor.revision + 1)
  assert.deepEqual(w2PunktKennungen(uebernahme.reise), w2PunktKennungen(vor))
  assert.deepEqual(uebernahme.reise.days, v.vorschau.nachher.days)
  assert.equal(uebernahme.reise.lastMutationId, aktuell.lastMutationId)
  const wiederholt = await manuellSpeichern(v.vorschau.anfrage, ports)
  assert(wiederholt.ok)
  assert.equal(writes, 1)
  assert.deepEqual(wiederholt.reise, uebernahme.reise)
})

test('W2: konkurrierende Revision verweigert sechs-Punkte-Übernahme ohne Write', async () => {
  const vor = w2SechsTagespunkte()
  const v = await manuellVorschau(vor, { startDate: '2026-10-08' }, seed, 'account')
  assert(v.ok)
  const parallel = { ...structuredClone(vor), title: 'Parallelbearbeitung', revision: vor.revision + 1 }
  let writes = 0
  const antwort = await manuellSpeichern(v.vorschau.anfrage, {
    quelle: 'account',
    lesen: async () => parallel,
    schreiben: async () => { writes++; return { konflikt: false } },
  })
  assert.equal(antwort.ok, false)
  if (!antwort.ok) assert.equal(antwort.art, 'konflikt')
  assert.equal(writes, 0)
  assert.deepEqual(w2PunktKennungen(parallel), w2PunktKennungen(vor))
  assert.equal(parallel.days[3].items.find(punkt => punkt.id === 'w2-return-6')?.startsOn, '2026-10-10')
})


// W2 integration: both read-only snapshots remain separately auditable.
// A preview audit is not provider truth or proof that the changed trip is stored.
test('W2: Audit der sechs Planpunkte vor/nach Vorschau bleibt read-only und ohne Anbieterzusage', async () => {
  const vor = w2SechsTagespunkte(), original = structuredClone(vor)
  const v = await manuellVorschau(vor, { startDate: '2026-10-08' }, seed, 'account')
  assert(v.ok)
  const vorherBericht = tripAuditV1(vor)
  const vorschauBericht = tripAuditV1(v.vorschau.nachher)
  assert.equal(vorherBericht.claimScope, 'stored_plan_only')
  assert.equal(vorschauBericht.claimScope, 'stored_plan_only')
  assert.equal(vorherBericht.tripId, vor.id)
  assert.equal(vorschauBericht.tripId, vor.id)
  assert.deepEqual(vorschauBericht.sections.map(s => s.domain), ['lodging', 'time', 'flights', 'mobility'])
  assert.match(vorschauBericht.notChecked.join('; '), /Anbieter, Preise, Verfügbarkeit/)
  const vorherUnterkunft = vor.days[3].items.find(p => p.id === 'item-4')
  const danachUnterkunft = v.vorschau.nachher.days[3].items.find(p => p.id === 'item-4')
  assert.deepEqual(danachUnterkunft, vorherUnterkunft, 'geschützte Unterkunft bleibt exakt unverändert')
  assert.deepEqual(w2PunktKennungen(v.vorschau.nachher), w2PunktKennungen(vor))
  assert.deepEqual(vor, original, 'weder Vorschau noch Audit schreiben ins Original')
})

test('W2: fremde Reise oder gleiche Revision mit fremdem Inhalt blockieren ohne Write', async () => {
  const vor = w2SechsTagespunkte()
  const v = await manuellVorschau(vor, { startDate: '2026-10-08' }, seed, 'account')
  assert(v.ok)
  let writes = 0
  for (const [fall, aktuell, erwartet] of [
    ['andere Reise', { ...structuredClone(vor), id: 'fremde-reise' }, 'sitzung'],
    ['stiller Inhaltswechsel', { ...structuredClone(vor), title: 'Parallel geändert' }, 'konflikt'],
  ] as const) {
    const antwort = await manuellSpeichern(v.vorschau.anfrage, {
      quelle: 'account',
      lesen: async () => aktuell,
      schreiben: async () => { writes++; return { konflikt: false } },
    })
    assert.equal(antwort.ok, false, fall)
    if (!antwort.ok) assert.equal(antwort.art, erwartet, fall)
    assert.deepEqual(w2PunktKennungen(aktuell), w2PunktKennungen(vor), fall)
  }
  assert.equal(writes, 0)
})
