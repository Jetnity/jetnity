import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ausschnittMitte, etappenVerbindung, laengengradBei, luftlinieText } from './etappen-kartenauswahl'
import type { MapStop } from './trip-map'

function stop(stageId: string, lng?: number): MapStop {
  return {
    stageId,
    index: 0,
    name: 'Gleicher Ortsname',
    position: lng == null ? null : { lat: 0, lng },
    dayIds: [],
  }
}

test('Zuweisung über beide Stage-IDs, inklusive Nullmeridian und identischer Koordinaten', () => {
  const stops = [stop('a', 0), stop('b', 1), stop('c', 0)]
  const pair = etappenVerbindung(stops, { vonId: 'b', nachId: 'a' })
  assert.equal(pair?.von?.stageId, 'b')
  assert.equal(pair?.nach?.stageId, 'a')
  assert.equal(luftlinieText(pair!.km!), '111 km Luftlinie')
  assert.equal(etappenVerbindung(stops, { vonId: 'a', nachId: 'c' })?.km, 0)
})

test('fehlende oder mehrdeutige Etappe ergibt keine Distanz', () => {
  assert.equal(etappenVerbindung([stop('a', 0), stop('b')], { vonId: 'a', nachId: 'b' })?.km, null)
  assert.equal(
    etappenVerbindung([stop('a', 0), stop('a', 2), stop('b', 0)], { vonId: 'a', nachId: 'b' })?.von,
    null,
  )
  assert.equal(etappenVerbindung([stop('a', 0)], { vonId: 'a', nachId: 'a' })?.km, null)
})

test('Datumsgrenze in beiden Richtungen: kurze Linie und beide Endpunkte im gleichen Ausschnitt', () => {
  for (const laengen of [
    [179, -178],
    [-178, 179],
    [-180, 180],
    [8, 0],
    [100, 104],
  ]) {
    const punkte = laengen.map((lng) => ({ lat: 0, lng }))
    const ref = ausschnittMitte(punkte)
    const [a, b] = laengen.map((lng) => laengengradBei(lng, ref))
    assert.ok(Math.abs(b - a) <= 8)
    assert.equal((a + b) / 2, ref)
  }
  assert.equal(ausschnittMitte([]), 0)
  assert.equal(luftlinieText(0.2), 'Unter 1 km Luftlinie')
})
