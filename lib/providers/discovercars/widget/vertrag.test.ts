import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { CMP_CATEGORIES } from '@/lib/privacy/privacybee-cmp/vertrag'
import { DISCOVERCARS_WIDGET_SANDBOX, discoverCarsDatenschutzErlaubt, discoverCarsWidgetAdresse, discoverCarsWidgetHoehe } from './vertrag'

describe('DiscoverCars offizieller Widget-Vertrag', () => {
  test('fester Anbieter und Partner, nur öffentliche Herkunft, keine Mietvorgaben', () => {
    const href = discoverCarsWidgetAdresse('https://jetnity.com')
    assert.ok(href)
    const url = new URL(href)
    assert.equal(url.origin, 'https://widget.discovercars.com')
    assert.equal(url.pathname, '/de/locations/')
    assert.equal(url.searchParams.get('utm_source'), 'jetnity')
    assert.equal(url.searchParams.get('aff_code'), 'a_aid')
    assert.equal(url.searchParams.get('utm_medium'), 'widget')
    assert.equal(url.searchParams.get('currency'), 'chf')
    assert.equal(url.searchParams.get('widget_origin'), 'https://jetnity.com')
    for (const key of ['aff_value', 'aff_data1', 'aff_data2', 'aff_channel', 'pickup_from', 'pickup_to']) assert.equal(url.searchParams.get(key), '', key)
    assert.equal(new Set(url.searchParams.keys()).size, [...url.searchParams].length)
    assert.equal([...url.searchParams].length, 31)
    assert.doesNotMatch(href, /tripId|reiseId|residence|driverAge|pickup_date|return_date/)
    assert.doesNotMatch(DISCOVERCARS_WIDGET_SANDBOX, /top-navigation|downloads|modals/)
    assert.match(DISCOVERCARS_WIDGET_SANDBOX, /allow-same-origin/)
  })
  test('keine Pfade, Suchparameter, Credentials, fremde Protokolle oder öffentliche HTTP-Herkünfte', () => {
    for (const value of ['https://jetnity.com/', 'https://jetnity.com/trips/private', 'https://jetnity.com?trip=private', 'https://jetnity.com#private', 'https://user:pw@jetnity.com', 'http://jetnity.com', 'javascript:alert(1)', 'null', '']) assert.equal(discoverCarsWidgetAdresse(value), null, value)
    assert.ok(discoverCarsWidgetAdresse('http://127.0.0.1:3420'))
  })
  test('nur bekannte Höhenmeldung vom aktuell eingebetteten Anbieterfenster', () => {
    const source = {} as Window
    const event = { origin: 'https://widget.discovercars.com', source, data: JSON.stringify({ discovercars: true, action: 'heightChange', height: 478 }) }
    assert.equal(discoverCarsWidgetHoehe(event, source), 478)
    for (const change of [{ origin: 'null' }, { origin: 'https://www.discovercars.com' }, { source: {} as Window }, { data: { discovercars: true, action: 'heightChange', height: 478 } }, { data: '{' }, { data: 'a'.repeat(201) }]) assert.equal(discoverCarsWidgetHoehe({ ...event, ...change }, source), null)
    for (const height of [null, '478', -1, 0, 199, 2401, 1e100]) assert.equal(discoverCarsWidgetHoehe({ ...event, data: JSON.stringify({ discovercars: true, action: 'heightChange', height }) }, source), null)
    assert.equal(discoverCarsWidgetHoehe({ ...event, data: JSON.stringify({ discovercars: true, action: 'heightChange', height: 478, url: 'https://evil.example' }) }, source), null)
    assert.equal(discoverCarsWidgetHoehe(event, null), null)
  })
  test('bestehende Ablehnungen, inkonsistente CMP und verlorene API verhindern Anzeigen', () => {
    const consents: Record<string, boolean> = Object.fromEntries(CMP_CATEGORIES.map(category => [category, true]))
    const api = { getAllConsents: () => consents, getConsent: (category: string) => consents[category], hasExplicitConsent: () => true }
    assert.equal(discoverCarsDatenschutzErlaubt(undefined, false), true)
    assert.equal(discoverCarsDatenschutzErlaubt(undefined, true), false)
    assert.equal(discoverCarsDatenschutzErlaubt(null, false), false)
    assert.equal(discoverCarsDatenschutzErlaubt({}, false), false)
    assert.equal(discoverCarsDatenschutzErlaubt(api, true), true)
    consents.ANALYTICS_STORAGE = false
    assert.equal(discoverCarsDatenschutzErlaubt(api, false), false)
    consents.ANALYTICS_STORAGE = true
    assert.equal(discoverCarsDatenschutzErlaubt({ ...api, getConsent: () => false }, false), false)
    assert.equal(discoverCarsDatenschutzErlaubt({ ...api, hasExplicitConsent: () => false }, false), false)
  })
})
