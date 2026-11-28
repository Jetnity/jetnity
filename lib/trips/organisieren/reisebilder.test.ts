import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { reiseFoto } from './katalog'
import { nenntNurLand } from './reisebilder'

const paris = { name: 'Paris', countryCode: 'FR', placeId: 'geonames:2988507' }

describe('Einheitliche zielgebundene Reisefotos', () => {
  it('verwendet für Paris in Karte, Kopf und Etappe dieselbe echte Aufnahme', () => {
    assert.equal(reiseFoto(paris), '/images/organisieren/paris.jpg')
    assert.equal(reiseFoto(paris, true), reiseFoto(paris))
    assert.equal(reiseFoto({ ...paris, name: 'Meine Städtereise' }), reiseFoto(paris))
    assert.equal(reiseFoto({ ...paris, countryCode: null }), reiseFoto(paris))
  })

  it('ersetzt unbekannte oder widersprüchliche Ortskennungen nicht durch Namensraten', () => {
    const neutral = '/images/organisieren/reiseatlas.webp'
    assert.equal(reiseFoto(), neutral)
    assert.equal(reiseFoto({ ...paris, placeId: 'geonames:4717560', countryCode: 'US' }), neutral)
    assert.equal(reiseFoto({ ...paris, countryCode: 'US' }), neutral)
    assert.equal(reiseFoto({ ...paris, placeId: 'unbekannt' }), neutral)
    assert.equal(reiseFoto({ ...paris, name: 'Unbekannt', placeId: null }), neutral)
    assert.equal(reiseFoto({ name: 'Zofingen', countryCode: 'CH', placeId: 'geonames:2657915' }), neutral)
  })

  it('erkennt Altbestände nur mit ausdrücklichem passenden Land', () => {
    assert.equal(reiseFoto({ ...paris, name: '  PARIS  ', placeId: null }), reiseFoto(paris))
    assert.equal(reiseFoto({ ...paris, placeId: null, countryCode: null }), reiseFoto())
    assert.equal(reiseFoto({ ...paris, placeId: null, countryCode: 'US' }), reiseFoto())
    assert.equal(reiseFoto({ name: 'Lisboa', placeId: null, countryCode: 'PT' }), '/images/organisieren/lisbon-commons.jpg')
    assert.equal(reiseFoto({ name: 'Koh  Chang', placeId: null, countryCode: 'TH' }), '/images/organisieren/chang.webp')
  })

  it('bewahrt wiederholte Ziele und verwendet je Etappe das passende Motiv', () => {
    const route = [paris, { name: 'Bangkok', countryCode: 'TH', placeId: 'geonames:1609350' }, paris]
    const bilder = route.map((etappe) => reiseFoto(etappe))
    assert.equal(bilder[0], bilder[2])
    assert.notEqual(bilder[0], bilder[1])
    assert.equal(reiseFoto(route[1], true), bilder[1])
  })

  it('zeigt für ein Land ohne konkreten Ort kein Stadtfoto', () => {
    const neutral = '/images/organisieren/reiseatlas.webp'
    const thailand = { name: 'Thailand', countryCode: 'TH', placeId: 'geonames:1605651' }
    const bangkok = { name: 'Bangkok', countryCode: 'TH', placeId: 'geonames:1609350' }
    assert.equal(reiseFoto(thailand), neutral)
    assert.equal(reiseFoto({ ...thailand, placeId: null }), neutral)
    assert.equal(reiseFoto({ name: ' THAILAND ', countryCode: 'TH', placeId: null }), neutral)
    assert.notEqual(reiseFoto(bangkok), neutral)
  })

  it('erkennt eine reine Länderetappe nur mit passendem Land', () => {
    assert.equal(nenntNurLand({ name: 'Thailand', countryCode: 'TH', placeId: null }), true)
    assert.equal(nenntNurLand({ name: 'Switzerland', countryCode: 'CH', placeId: null }), true)
    assert.equal(nenntNurLand({ name: 'Schweiz', countryCode: 'CH', placeId: null }), true)
    assert.equal(nenntNurLand({ name: 'Thailand', countryCode: 'FR', placeId: null }), false)
    assert.equal(nenntNurLand({ name: 'Thailand', countryCode: null, placeId: null }), false)
    assert.equal(nenntNurLand({ name: 'Bangkok', countryCode: 'TH', placeId: null }), false)
    assert.equal(nenntNurLand({ name: '  ', countryCode: 'TH', placeId: null }), false)
    assert.equal(nenntNurLand(undefined), false)
  })
})
