import assert from 'node:assert/strict'
import test from 'node:test'
import { n12Reise, n12Punkt } from '@/lib/trips/n12-chronology-1/fixture'
import { hotelPlanOrte, hotelPosition, hotelKontextVersion } from './hotel-suchkontext'
import { modusAusQuery, modusFuerReise, modusUrl } from './workspace-mode'

function beispiel() {
  const reise = n12Reise()
  const basis = { ...reise.stages[0], id: 'bkk', name: 'Bangkok', latitude: 13.75, longitude: 100.52, placeId: 'geonames:1609350' }
  reise.stages = [basis, { ...basis, id: 'nah', position: 2, name: 'Privater Stopp', placeId: null, latitude: 13.76, longitude: 100.53 },
    { ...basis, id: 'fern', position: 3, latitude: 18.79, longitude: 98.98 }, { ...basis, id: 'ohne', position: 4, latitude: null, longitude: null }]
  reise.days = [{ ...reise.days[0], stageId: 'bkk', items: [
    n12Punkt({ id: 'a', kind: 'activity', title: 'Hotel daneben', stageId: 'bkk', note: 'PRIVATE-NOTIZ', destinationPlaceId: 'geonames:123', destinationName: 'Nicht als Aktivitätskoordinate missbrauchen' }),
    n12Punkt({ id: 'b', kind: 'transfer', title: 'PRIVATE-TITEL', stageId: 'bkk', originPlaceId: 'airport:BKK', originName: 'Bangkok Suvarnabhumi', destinationPlaceId: basis.placeId, destinationName: 'Bangkok' }),
    n12Punkt({ id: 'c', kind: 'transfer', title: 'Fremde Etappe', stageId: 'fern', originPlaceId: 'airport:ZRH', originName: 'Zürich' }),
  ] }]
  reise.ohneTag = [n12Punkt({ id: 'd', kind: 'flight', title: 'Duplicate', stageId: 'bkk', destinationPlaceId: 'airport:BKK', destinationName: 'Bangkok' })]
  return reise
}

test('Nur nahe bekannte Stopps und deduplizierte strukturierte Transportorte; keine Titel oder Notizen', () => {
  const reise = beispiel(), vorher = JSON.stringify(reise)
  const orte = hotelPlanOrte(reise, reise.stages[0])
  assert.deepEqual(orte.map(o => o.key), ['etappe:nah', 'ort:airport:BKK'])
  assert.equal(orte[0].kartenname, 'Reisestopp 2')
  assert.equal(orte[1].latitude, null, 'Referenz wird erst über die bestätigte Ortsquelle aufgelöst')
  assert.doesNotMatch(JSON.stringify(orte), /PRIVATE-|Fremde Etappe|Hotel daneben/)
  assert.equal(JSON.stringify(reise), vorher)
  assert.deepEqual(hotelPlanOrte(reise, { ...reise.stages[0], id: 'fremd' }), [])
  assert.deepEqual(hotelPlanOrte(reise, undefined), [])
})

test('Fehlende und ungültige Koordinaten erzeugen keine POIs; Datumsgrenze ist geografisch korrekt', () => {
  for (const [latitude, longitude] of [[null, 1], [NaN, 1], [1, Infinity], [91, 1], [1, 181]]) assert.equal(hotelPosition({ latitude, longitude }), null)
  const reise = beispiel()
  reise.stages[0].latitude = 0; reise.stages[0].longitude = 179.99
  reise.stages[1].latitude = 0; reise.stages[1].longitude = -179.99
  assert.ok(hotelPlanOrte(reise, reise.stages[0]).some(o => o.key === 'etappe:nah'))
  reise.stages[1].latitude = null
  assert.ok(!hotelPlanOrte(reise, reise.stages[0]).some(o => o.key === 'etappe:nah'))
})

test('Reisekontext wechselt bei entfernten Orten, geänderten Terminen oder Belegung', () => {
  const reise = beispiel(), version = hotelKontextVersion(reise)
  reise.stages[1].longitude = null
  assert.notEqual(hotelKontextVersion(reise), version)
  const danach = hotelKontextVersion(reise)
  reise.travellers += 1
  assert.notEqual(hotelKontextVersion(reise), danach)
})

test('Hotelort bleibt nur mit gültiger Etappe und bekannter Referenz im Unterkunftsreiter erhalten', () => {
  const reise = beispiel()
  const modus = modusAusQuery(new URLSearchParams('ansicht=organisieren&kategorie=unterkunft&etappe=bkk&hotelort=etappe%3Anah'))
  assert.equal(modusFuerReise(modus, reise, reise.ohneTag).hotelOrtKey, 'etappe:nah')
  assert.match(modusUrl('/reisen/id?fremd=bleibt#oben', modus), /fremd=bleibt&ansicht=organisieren.*hotelort=etappe%3Anah#oben$/)
  reise.stages = reise.stages.filter(s => s.id !== 'nah')
  assert.equal(modusFuerReise(modus, reise, reise.ohneTag).hotelOrtKey, undefined)
  for (const query of ['ansicht=plan', 'ansicht=organisieren&kategorie=aktivitaeten&etappe=bkk', 'ansicht=organisieren&kategorie=unterkunft']) {
    assert.equal(modusAusQuery(new URLSearchParams(query + '&hotelort=etappe:nah')).hotelOrtKey, undefined)
  }
  assert.equal(modusAusQuery(new URLSearchParams('ansicht=organisieren&kategorie=unterkunft&etappe=bkk&hotelort=a&hotelort=b')).hotelOrtKey, undefined)
  const fremd = { ...modus, hotelOrtKey: 'etappe:fern' }
  assert.equal(modusFuerReise(fremd, reise, reise.ohneTag).hotelOrtKey, undefined)
})
