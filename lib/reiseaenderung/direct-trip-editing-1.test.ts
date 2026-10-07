import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fixture } from '@/scripts/direct-trip-editing-1/fixture'
import { manuellSchema, manuellerEntwurf, vorschauKennungen } from './direct/entwurf'
import { auswirkungen } from './direct/auswirkungen'
import { bedeutung, fingerprint } from './direct/bestaetigung'
import { manuellVorschau, manuellSpeichern } from './direct/speichern'
import { gastManuellSpeichern } from './direct/gast'
import { gastreiseAendern, gastreiseSpeichern, gastPlanpunktAnlegen, gastspeicherLaden, VeralteteFassungFehler } from '@/lib/trips/gastspeicher'
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
test('removal preview lists every normal removed point and preserved unplanned booking exactly once', () => {
  const before = fixture(), after = apply({ stages: [{ id: 'stage-2', remove: true }] }).nachher
  const groups = auswirkungen(before, after)
  assert.equal(groups.find(g => g.titel.startsWith('Normale'))?.zeilen.length, 1)
  assert.equal(groups.find(g => g.titel.startsWith('Geschützte'))?.zeilen.length, 1)
  assert(groups.flatMap(g => g.zeilen).some(x => x.text.includes('Tag 3') && x.text.includes('Planpunkt 3')))
  assert.deepEqual(after.ohneTag[0], { ...before.days[3].items[0], dayId: null, stageId: null })
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
test('existing Account readiness FK limitation is rejected before proposal; no silent dependent cleanup', () => {
  const before=fixture();before.readinessItems=[readinessItemLesen({id:'preparation-linked',clientRef:'preparation-linked',tripItemId:'item-3',kind:'preparation',title:'Synthetische Vorbereitung',userStatus:'open',contextFingerprint:'synthetic',createdAt:before.createdAt,updatedAt:before.updatedAt})!]
  const result=manuellerEntwurf(before,{stages:[{id:'stage-2',remove:true}]},vorschauKennungen(seed),'account')
  assert.equal(result.ok,false);if(!result.ok)assert.match(result.meldung,/verknüpfte Vorbereitungen/)
})

test('canonical protected route facts survive metadata and date changes exactly',()=>{
 const before=fixture();before.days[3].items[0]={...before.days[3].items[0],kind:'flight',routeItinerary:itineraryAirportChange()}
 const canonical=reiseLesen(before)!;assert(canonical)
 const after=apply({title:'Neue Reise',startDate:'2026-10-10'},canonical).nachher
 assert.deepEqual(after.days[3].items,canonical.days[3].items);assert.equal(after.originPlaceId,before.originPlaceId)
})
