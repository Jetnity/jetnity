import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { auswahlFehlt, reiseortePflicht, zielHref } from '@/lib/places/auswahl'
import { ORT_MELDUNG } from '@/lib/places/pruefen'
import { INSPIRATION_ZIELE } from '@/lib/places/inspiration'
import { istOrtId } from '@/lib/places/domain'

describe('Gemeinsame Ortsauswahl', () => {
  test('nur eingetippter Text ohne Treffer ist kein Reiseziel', () => {
    assert.equal(auswahlFehlt('Test', null, 'ziel'), ORT_MELDUNG.zielFehlt)
    assert.equal(auswahlFehlt('Mordor', undefined, 'ziel'), ORT_MELDUNG.zielFehlt)
    assert.equal(auswahlFehlt('abcxyz', null, 'ziel'), ORT_MELDUNG.zielFehlt)
  })

  test('eine bestätigte Auswahl gilt', () => {
    assert.equal(auswahlFehlt('Bali', { id: 'geonames:1650535', name: 'Bali' }, 'ziel'), null)
    assert.equal(auswahlFehlt('Zürich', { id: 'geonames:2657896', name: 'Zürich' }, 'abreise'), null)
    assert.equal(auswahlFehlt('ZRH', { id: 'airport:ZRH', name: 'Zürich' }, 'abreise'), null)
  })

  test('eine manipulierte ID wird schon in der Auswahlregel abgelehnt', () => {
    assert.equal(auswahlFehlt('Bali', { id: 'mordor', name: 'Bali' }, 'ziel'), ORT_MELDUNG.zielUnbekannt)
    assert.equal(auswahlFehlt('ZRH', { id: 'airport:xxx', name: 'ZRH' }, 'abreise'), ORT_MELDUNG.abreiseUnbekannt)
  })

  test('Startseite und /planen prüfen Ziel und Abreise mit derselben Regel', () => {
    assert.equal(
      reiseortePflicht({
        destination: 'Test',
        destinationPlaceId: null,
        origin: 'Zürich',
        originPlaceId: 'geonames:2657896',
      }),
      ORT_MELDUNG.zielFehlt,
    )
    assert.equal(
      reiseortePflicht({
        destination: 'Bali',
        destinationPlaceId: 'geonames:1650535',
        origin: 'Zürich',
        originPlaceId: 'geonames:2657896',
      }),
      null,
    )
  })

  test('ohne bestätigte Ziel-ID entsteht kein Planungs-Link', () => {
    assert.equal(zielHref(null), null)
    assert.equal(zielHref({ id: 'Test', name: 'Test' }), null)
    assert.equal(zielHref({ id: 'geonames:1650535', name: 'Bali' }), '/planen?zielId=geonames%3A1650535')
  })

  test('Inspirationskarten tragen echte GeoNames-IDs, keine erfundenen Orte', () => {
    for (const ziel of INSPIRATION_ZIELE) {
      assert.equal(istOrtId(ziel.placeId), true, ziel.name)
    }
  })
})
