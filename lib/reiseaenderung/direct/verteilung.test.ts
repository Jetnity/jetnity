import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fixture } from '@/scripts/direct-trip-editing-1/fixture'
import { manuellerEntwurf, vorschauKennungen } from './entwurf'
import { manuellVorschau, manuellSpeichern } from './speichern'
import { gastManuellSpeichern } from './gast'
import { auswirkungen } from './auswirkungen'
import { tageVerteilen } from './verteilung'
import { aenderungAlsNutzlast } from '../nutzlast'
import { AENDERUNG_JSON_SCHEMA, KI_AENDERUNG_ARTEN, modellaenderungSchema, reiseaenderungSchema } from '../schema'
import { gastreiseAnlegen, gastspeicherLaden } from '@/lib/trips/gastspeicher'
import type { Ort } from '@/lib/places/domain'
import type { Trip } from '@/types/trips'

const seed = '6f1c2a5e-8d4b-4c3a-9e7f-1a2b3c4d5e6f'

function storage() {
  const map = new Map<string, string>()
  Object.assign(globalThis, { window: { localStorage: {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v) },
    removeItem: (k: string) => map.delete(k),
  } } })
}

const ort = (id: string, name: string, countryCode: string, lat: number, lon: number): Ort => ({
  id, name, source: 'geonames', sourceId: id.slice('geonames:'.length), typ: 'city',
  country: countryCode, countryCode, region: null, lat, lon, iata: null, keywords: null,
})

/** Wie im Erstbesucher-Test: 15 Tage, drei Ziele, Tage noch ohne Ziel. */
function dreiZieleOhneVerteilung(): Trip {
  storage()
  const lissabon = ort('geonames:2267057', 'Lissabon', 'PT', 38.72, -9.14)
  const porto = ort('geonames:2735943', 'Porto', 'PT', 41.15, -8.61)
  const madrid = ort('geonames:3117735', 'Madrid', 'ES', 40.42, -3.7)
  const zuerich = ort('geonames:2657896', 'Zürich', 'CH', 47.37, 8.55)
  return gastreiseAnlegen({
    clientRef: '8a7ff5e1-1359-48d8-952c-893932c2b741', title: 'Portugal und Spanien',
    destination: lissabon.name, destinationPlaceId: lissabon.id, weitereDestinationPlaceIds: [porto.id, madrid.id],
    origin: zuerich.name, originPlaceId: zuerich.id,
    startDate: '2026-05-01', endDate: '2026-05-15', travellers: 2,
    currency: 'CHF', budgetAmount: 3000, pace: 'balanced', interests: [], travelWish: null,
  }, { ziel: lissabon, abreise: zuerich, weitereZiele: [porto, madrid] })
}

const tageJeZiel = (trip: Trip) => trip.stages.map(s => trip.days.filter(d => d.stageId === s.id).length)

test('15 Tage auf drei Ziele verteilen: Reise bleibt 15 Tage, Blöcke folgen der Zielreihenfolge', () => {
  const vorher = dreiZieleOhneVerteilung()
  assert.equal(vorher.days.length, 15)
  assert(vorher.days.every(d => d.stageId === null))
  const [a, b, c] = vorher.stages
  const r = manuellerEntwurf(vorher, { verteilung: [{ id: c!.id, days: 4 }, { id: a!.id, days: 6 }, { id: b!.id, days: 5 }] }, vorschauKennungen(seed))
  assert(r.ok, !r.ok ? r.meldung : '')
  assert.equal(r.nachher.days.length, 15)
  assert.deepEqual(tageJeZiel(r.nachher), [6, 5, 4])
  assert.deepEqual(r.nachher.days.map(d => d.id), vorher.days.map(d => d.id))
  assert.deepEqual(r.nachher.stages.map(s => [s.arrivalDate, s.departureDate]), [
    ['2026-05-01', '2026-05-06'], ['2026-05-07', '2026-05-11'], ['2026-05-12', '2026-05-15'],
  ])
  assert.equal(r.nachher.startDate, vorher.startDate)
  assert.equal(r.nachher.endDate, vorher.endDate)
  assert(r.operationen.every(op => op.art === 'tage_zuordnen'))
  assert.equal(r.operationen.length, 3)
})

test('Teilverteilung lässt die letzten Tage ohne Ziel, zu viele Tage verlängern nichts', () => {
  const vorher = dreiZieleOhneVerteilung()
  const [a, b, c] = vorher.stages
  const teil = manuellerEntwurf(vorher, { verteilung: [{ id: a!.id, days: 5 }, { id: b!.id, days: 5 }, { id: c!.id, days: 3 }] }, vorschauKennungen(seed))
  assert(teil.ok)
  assert.equal(teil.nachher.days.length, 15)
  assert.deepEqual(tageJeZiel(teil.nachher), [5, 5, 3])
  assert.deepEqual(teil.nachher.days.slice(-2).map(d => d.stageId), [null, null])

  const zuViel = manuellerEntwurf(vorher, { verteilung: [{ id: a!.id, days: 10 }, { id: b!.id, days: 5 }, { id: c!.id, days: 5 }] }, vorschauKennungen(seed))
  assert.equal(zuViel.ok, false)
  if (!zuViel.ok) {
    assert.equal(zuViel.feld, 'verteilung')
    assert.match(zuViel.meldung, /15 Tage, verteilt sind 20/)
  }
})

test('Verteilung braucht jedes Ziel genau einmal und mischt sich nicht mit Daueränderungen', () => {
  const vorher = dreiZieleOhneVerteilung()
  const [a, b, c] = vorher.stages
  const voll = [{ id: a!.id, days: 5 }, { id: b!.id, days: 5 }, { id: c!.id, days: 5 }]
  for (const eingabe of [
    { verteilung: voll.slice(0, 2) },
    { verteilung: [...voll.slice(0, 2), { id: a!.id, days: 5 }] },
    { verteilung: [...voll.slice(0, 2), { id: 'fremd', days: 5 }] },
    { verteilung: voll, duration: 20 },
    { verteilung: voll, stages: [{ id: a!.id, days: 6 }] },
    { verteilung: [{ id: a!.id, days: -1 }, ...voll.slice(1)] },
    { verteilung: [{ id: a!.id, days: 1.5 }, ...voll.slice(1)] },
  ]) assert.equal(manuellerEntwurf(vorher, eingabe, vorschauKennungen(seed)).ok, false, JSON.stringify(eingabe))
  assert(manuellerEntwurf(vorher, { verteilung: voll, duration: 15 }, vorschauKennungen(seed)).ok)
})

test('Unveränderte Verteilung ist keine Änderung; Grunddaten daneben bleiben möglich', () => {
  const vorher = fixture()
  const gleich = vorher.stages.map(s => ({ id: s.id, days: vorher.days.filter(d => d.stageId === s.id).length }))
  const leer = manuellerEntwurf(vorher, { verteilung: gleich }, vorschauKennungen(seed))
  assert.equal(leer.ok, false)
  const titel = manuellerEntwurf(vorher, { verteilung: gleich, title: 'Neu' }, vorschauKennungen(seed))
  assert(titel.ok)
  assert.deepEqual(titel.nachher, { ...vorher, title: 'Neu' })
})

test('Normale Planpunkte folgen ihrem Tag, geschützte Buchungen wechseln nie still ihr Ziel', () => {
  const vorher = fixture()
  const [eins, zwei] = vorher.stages
  // Tag 3 wechselt von Ziel 2 zu Ziel 1; sein normaler Planpunkt folgt.
  const r = manuellerEntwurf(vorher, { verteilung: [{ id: eins!.id, days: 3 }, { id: zwei!.id, days: 1 }] }, vorschauKennungen(seed))
  assert(r.ok, !r.ok ? r.meldung : '')
  const tag3 = r.nachher.days.find(d => d.id === 'day-3')!
  assert.equal(tag3.stageId, eins!.id)
  assert.equal(tag3.items[0]?.stageId, eins!.id)
  assert.deepEqual(r.nachher.days.find(d => d.id === 'day-4')?.items, vorher.days[3]!.items)
  assert(auswirkungen(vorher, r.nachher).flatMap(g => g.zeilen).length > 0)

  // Tag 4 trägt die gebuchte Unterkunft von Ziel 2 und darf nicht zu Ziel 1 wandern.
  const geschuetzt = tageVerteilen(vorher, [{ id: eins!.id, days: 4 }, { id: zwei!.id, days: 0 }])
  assert.equal(geschuetzt.ok, false)
  if (!geschuetzt.ok) assert.match(geschuetzt.meldung, /Tag 4 enthält eine gebuchte oder bepreiste Leistung/)
})

test('Gast: Vorschau, Speichern und Neuladen bewahren 15 Tage und die Verteilung', async () => {
  const vorher = dreiZieleOhneVerteilung()
  const [a, b, c] = vorher.stages
  const p = await manuellVorschau(vorher, { verteilung: [{ id: a!.id, days: 5 }, { id: b!.id, days: 5 }, { id: c!.id, days: 5 }] }, seed)
  assert(p.ok, !p.ok ? p.meldung : '')
  const gespeichert = await gastManuellSpeichern(p.vorschau.anfrage)
  assert(gespeichert.ok, !gespeichert.ok ? gespeichert.meldung : '')
  const neu = gastspeicherLaden().aktiv
  assert(neu)
  assert.equal(neu.days.length, 15)
  assert.deepEqual(tageJeZiel(neu), [5, 5, 5])
  assert.equal(neu.revision, vorher.revision + 1)
  assert.deepEqual(neu.days, p.vorschau.nachher.days)
})

test('Konto: derselbe Entwurf wird serverseitig neu berechnet und als Graph mit Tageszielen geschrieben', async () => {
  const vorher = { ...dreiZieleOhneVerteilung(), dayStageAssignmentMode: 'unassigned' as const }
  const [a, b, c] = vorher.stages
  const p = await manuellVorschau(vorher, { verteilung: [{ id: a!.id, days: 7 }, { id: b!.id, days: 4 }, { id: c!.id, days: 4 }] }, seed, 'account')
  assert(p.ok)
  let current: Trip = vorher, nutzlast: unknown = null
  const r = await manuellSpeichern(p.vorschau.anfrage, {
    quelle: 'account',
    lesen: async () => current,
    schreiben: async (trip, mutation, revision) => {
      nutzlast = aenderungAlsNutzlast(trip, mutation, revision)
      current = { ...trip, revision: revision + 1, lastMutationId: mutation }
      return { konflikt: false }
    },
  })
  assert(r.ok)
  assert.deepEqual(tageJeZiel(r.reise), [7, 4, 4])
  assert.equal(r.reise.days.length, 15)
  assert.equal(r.reise.dayStageAssignmentMode, 'unassigned')
  const tage = (nutzlast as { days: Array<{ stage_id: string | null }> }).days
  assert.equal(tage.length, 15)
  assert.equal(tage.filter(d => d.stage_id === a!.id).length, 7)
})

test('KI darf keine Tagesverteilung vorschlagen', () => {
  assert.equal((KI_AENDERUNG_ARTEN as readonly string[]).includes('tage_zuordnen'), false)
  const art = AENDERUNG_JSON_SCHEMA.properties.operationen.items.properties.art.enum as readonly string[]
  assert.equal(art.includes('tage_zuordnen'), false)
  const op = { art: 'tage_zuordnen', etappeId: 's', tagId: 'd1', punktId: null, nachEtappeId: null, nachTagId: 'd2',
    name: null, laendercode: null, titel: null, notiz: null, beginn: null, punktArt: null, tageDelta: null, tage: null,
    reisende: null, budgetziel: null, tempo: null, interessen: null, reisewunsch: null, abreiseort: null, startdatum: null }
  const vorschlag = { zusammenfassung: 'Tage verteilen', annahmen: [], warnungen: [], operationen: [op] }
  assert.equal(modellaenderungSchema.safeParse(vorschlag).success, false)
  assert.equal(reiseaenderungSchema.safeParse({ ...vorschlag, fassung: 1 }).success, false)
})
