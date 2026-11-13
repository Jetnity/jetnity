import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { reiseFoto } from './katalog'

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
    assert.equal(reiseFoto({ name: 'Lisboa', placeId: null, countryCode: 'PT' }), '/images/lisbon.jpg')
    assert.equal(reiseFoto({ name: 'Koh  Chang', placeId: null, countryCode: 'TH' }), '/images/organisieren/chang.webp')
  })

  it('bewahrt wiederholte Ziele und verwendet je Etappe das passende Motiv', () => {
    const route = [paris, { name: 'Bangkok', countryCode: 'TH', placeId: 'geonames:1609350' }, paris]
    const bilder = route.map((etappe) => reiseFoto(etappe))
    assert.equal(bilder[0], bilder[2])
    assert.notEqual(bilder[0], bilder[1])
    assert.equal(reiseFoto(route[1], true), bilder[1])
  })
})
