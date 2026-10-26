import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { anwendungsFreigabe } from '@/lib/activities/getyourguide/freigabe'
import {
  ANWENDUNGS_NAHT,
  GETYOURGUIDE_ANWENDUNGS_ABBILDUNG,
  bezugIstOeffentlich,
  gygLadenErlaubt,
  oeffentlichenBezugBauen,
  type GygZielabbildung,
} from '@/lib/activities/getyourguide/widget'

const ABBILDUNG: readonly GygZielabbildung[] = [
  { art: 'ort', ortId: 'geonames:1609350', typ: 'city', kennung: 'synthetic-public:bangkok-city' },
  { art: 'ort', ortId: 'geonames:1609350', typ: 'region', kennung: 'synthetic-public:nicht-die-stadt' },
  { art: 'land', countryCode: 'PA', kennung: 'synthetic-public:panama' },
  { art: 'ort', ortId: 'geonames:9003703443', typ: 'city', kennung: 'synthetic-public:panama-city' },
]

describe('GetYourGuide-Abbildung', () => {
  test('die Anwendungsnaht ist leer und geschlossen', () => {
    assert.equal(ANWENDUNGS_NAHT.herkunft, 'anwendung')
    assert.equal(ANWENDUNGS_NAHT.orteLesen, null)
    assert.equal(ANWENDUNGS_NAHT.renderer, null)
    assert.equal(ANWENDUNGS_NAHT.abbildung, GETYOURGUIDE_ANWENDUNGS_ABBILDUNG)
    assert.equal(GETYOURGUIDE_ANWENDUNGS_ABBILDUNG.length, 0)
    assert.equal(anwendungsFreigabe().status, 'geschlossen')
    assert.equal(gygLadenErlaubt('bereit', 'mount'), false)
    assert.equal(gygLadenErlaubt('bereit', 'hover'), false)
    assert.equal(gygLadenErlaubt('bereit', 'wechsel'), false)
    assert.equal(gygLadenErlaubt('geschlossen', 'aktion'), false)
    assert.equal(gygLadenErlaubt('bereit', 'aktion'), true)
  })

  test('nur eine passende öffentliche Kennung wird ein Bezug', () => {
    const stadt = oeffentlichenBezugBauen(
      { art: 'ort', ortId: 'geonames:1609350', typ: 'city' },
      ABBILDUNG,
      ['trip-gyg-1'],
    )
    assert.equal(stadt?.umfang, 'stadt')
    assert.equal(stadt?.oeffentlicheKennung, 'synthetic-public:bangkok-city')
    const region = oeffentlichenBezugBauen({ art: 'ort', ortId: 'geonames:1609350', typ: 'region' }, ABBILDUNG)
    assert.equal(region?.oeffentlicheKennung, 'synthetic-public:nicht-die-stadt')
    const land = oeffentlichenBezugBauen({ art: 'land', countryCode: 'PA' }, ABBILDUNG)
    assert.equal(land?.umfang, 'land')
    assert.equal(land?.oeffentlicheKennung, 'synthetic-public:panama')
    assert.equal(
      oeffentlichenBezugBauen({ art: 'land', countryCode: 'PA' }, [
        ...ABBILDUNG,
        { art: 'land', countryCode: 'PA', kennung: 'synthetic-public:panama-zweite' },
      ]),
      null,
    )
    assert.equal(oeffentlichenBezugBauen({ art: 'land', countryCode: 'PA' }, []), null)
  })

  test('private Kennungen und Adressen werden kein Bezug', () => {
    assert.equal(
      oeffentlichenBezugBauen({ art: 'land', countryCode: 'PA' }, [
        { art: 'land', countryCode: 'PA', kennung: 'synthetic-public:trip-gyg-1' },
      ], ['trip-gyg-1']),
      null,
    )
    assert.equal(
      oeffentlichenBezugBauen({ art: 'land', countryCode: 'PA' }, [
        { art: 'land', countryCode: 'PA', kennung: 'https://widget.example/panama' },
      ]),
      null,
    )
    const bezug = oeffentlichenBezugBauen({ art: 'land', countryCode: 'PA' }, ABBILDUNG)
    assert.equal(bezugIstOeffentlich(bezug), true)
    assert.equal(bezugIstOeffentlich({ ...bezug, tripId: 'trip-gyg-1' }), false)
    assert.equal(bezugIstOeffentlich({ anbieter: 'getyourguide', umfang: 'land' }), false)
  })
})
