import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { Ort } from '@/lib/places/domain'
import { ORT_MELDUNG } from '@/lib/places/pruefen'
import { reisezielIdsLesen, reisezieleAusBestand, weitereZielIdsLesen } from '@/lib/places/reiseziele'
import { GRENZEN } from '@/lib/trips/schema'

function ort(teil: Partial<Ort> & Pick<Ort, 'id' | 'name'>): Ort {
  return {
    source: 'geonames',
    sourceId: teil.id.replace(/^geonames:/, ''),
    typ: teil.typ ?? 'city',
    country: teil.country ?? null,
    countryCode: teil.countryCode ?? 'FR',
    region: null,
    lat: teil.lat ?? 48.85,
    lon: teil.lon ?? 2.35,
    iata: null,
    keywords: null,
    ...teil,
  }
}

const PARIS = ort({ id: 'geonames:2988507', name: 'Paris' })
const ROM = ort({ id: 'geonames:3169070', name: 'Rom', countryCode: 'IT' })

describe('TW6-B Create-Ziele – Places-Evidence', () => {
  test('fehlende weitere IDs bleiben eine leere Liste', () => {
    assert.deepEqual(weitereZielIdsLesen(undefined), { ok: true, ids: [] })
    assert.deepEqual(weitereZielIdsLesen(null), { ok: true, ids: [] })
  })

  test('Paris → Rom → Paris bleibt drei IDs in derselben Reihenfolge', () => {
    const ids = reisezielIdsLesen(PARIS.id, [ROM.id, PARIS.id])
    assert.deepEqual(ids, { ok: true, ids: [PARIS.id, ROM.id, PARIS.id] })
  })

  test('Freitext oder leere Extra-ID scheitert fail-closed', () => {
    assert.equal(reisezielIdsLesen('', []).ok, false)
    assert.equal(reisezielIdsLesen('Paris', []).ok, false)
    assert.equal(weitereZielIdsLesen(['']).ok, false)
    assert.equal(weitereZielIdsLesen(['Rom']).ok, false)
    assert.equal(weitereZielIdsLesen('geonames:3169070').ok, false)
  })

  test('unbekannte oder rollenfremde IDs übernehmen keine Client-Fakten', () => {
    const behauptet = ort({
      id: 'geonames:1',
      name: 'Mordor',
      countryCode: 'XX',
      lat: 1,
      lon: 1,
    })
    const unvollständig = reisezieleAusBestand([PARIS, ROM], [PARIS.id, 'geonames:999999'])
    assert.deepEqual(unvollständig, {
      ok: false,
      meldung: ORT_MELDUNG.zielUnbekannt,
      zielIndex: 1,
    })

    const flughafen = ort({
      id: 'airport:ZRH',
      name: 'Zürich',
      typ: 'airport',
      countryCode: 'CH',
    })
    const rollenfremd = reisezieleAusBestand([flughafen], ['airport:ZRH'])
    assert.equal(rollenfremd.ok, false)
    if (!rollenfremd.ok) assert.equal(rollenfremd.meldung, ORT_MELDUNG.zielUnbekannt)

    const clientFakt = reisezieleAusBestand([PARIS], [behauptet.id])
    assert.equal(clientFakt.ok, false)
  })

  test('Bestand mappt Duplikate zurück, ohne zu deduplizieren', () => {
    const ziele = reisezieleAusBestand([PARIS, ROM], [PARIS.id, ROM.id, PARIS.id])
    assert.equal(ziele.ok, true)
    if (!ziele.ok) return
    assert.deepEqual(
      ziele.ziele.map((eintrag) => eintrag.id),
      [PARIS.id, ROM.id, PARIS.id],
    )
    assert.equal(ziele.ziele[0], ziele.ziele[2])
  })

  test('Maximum+1 weiterer IDs wird abgelehnt', () => {
    const zuViele = Array.from({ length: GRENZEN.etappenJeReise }, (_, index) => `geonames:${2000000 + index}`)
    const ergebnis = weitereZielIdsLesen(zuViele)
    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) assert.match(ergebnis.meldung, /Höchstens 50 Reiseziele/)
  })
})
