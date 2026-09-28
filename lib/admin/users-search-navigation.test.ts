import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  USERS_SEARCH_DEBOUNCE_MS,
  buildUsersListHref,
  normalizeUserSearch,
  userSearchEditChangesFilter,
  usersListHrefFromParams,
} from './users-search-navigation'

describe('Admin-Benutzersuche Navigation', () => {
  test('normalisiert nur aeussere Leerzeichen und behaelt die bestehende Wartezeit', () => {
    assert.equal(normalizeUserSearch('  anna  '), 'anna')
    assert.equal(normalizeUserSearch('\tanna\n'), 'anna')
    assert.equal(normalizeUserSearch(''), '')
    assert.equal(USERS_SEARCH_DEBOUNCE_MS, 400)
  })

  test('nur ein normalisiert anderer Entwurf ist eine Filteraenderung', () => {
    assert.equal(userSearchEditChangesFilter('anna', '  anna  '), false)
    assert.equal(userSearchEditChangesFilter('anna', 'anna'), false)
    assert.equal(userSearchEditChangesFilter('anna', ''), true)
    assert.equal(userSearchEditChangesFilter('', 'berta'), true)
    assert.equal(userSearchEditChangesFilter('anna', 'berta'), true)
  })

  test('behaelt fremde Parameter und die gewaehlte Seite', () => {
    const href = buildUsersListHref('q=anna&page=3&source=support', { q: 'anna', page: 2 })
    const params = new URLSearchParams(href.split('?')[1])
    assert.equal(params.get('q'), 'anna')
    assert.equal(params.get('page'), '2')
    assert.equal(params.get('source'), 'support')
    assert.equal(href, usersListHrefFromParams(params))
  })

  test('leerer Filter entfernt q und setzt die uebergebene Seite', () => {
    const href = buildUsersListHref('q=anna&page=3&source=support&ref=case-7', { q: '   ', page: 1 })
    const params = new URLSearchParams(href.split('?')[1])
    assert.equal(params.get('q'), null)
    assert.equal(params.get('page'), '1')
    assert.equal(params.get('source'), 'support')
    assert.equal(params.get('ref'), 'case-7')
  })

  test('kodiert Satzzeichen und Unicode ueber URLSearchParams', () => {
    const text = 'müller & co/ñ?'
    const href = buildUsersListHref('page=4&source=support', { q: `  ${text}  `, page: 1 })
    assert.equal(href.includes(' '), false)
    const params = new URLSearchParams(href.split('?')[1])
    assert.equal(params.get('q'), text)
    assert.equal(params.get('page'), '1')
    assert.equal(params.get('source'), 'support')
  })

  test('kodiert Plus, Prozent und Gleichheitszeichen als Filterwert', () => {
    const text = 'a+b 100% c=d'
    const href = buildUsersListHref(new URLSearchParams('source=support'), { q: text, page: 3 })
    const params = new URLSearchParams(href.split('?')[1])
    assert.equal(params.get('q'), text)
    assert.equal(params.get('page'), '3')
    assert.equal(params.get('source'), 'support')
  })

  test('ungueltige Seite wird zu 1, gleiche Adresse bleibt vergleichbar', () => {
    const href = buildUsersListHref('q=anna&source=support', { q: 'anna', page: Number.NaN })
    assert.equal(new URLSearchParams(href.split('?')[1]).get('page'), '1')
    assert.equal(usersListHrefFromParams(''), '/admin/users')
    assert.equal(
      buildUsersListHref('q=anna&page=3&source=support', { q: 'anna', page: 3 }),
      usersListHrefFromParams('q=anna&page=3&source=support'),
    )
  })
})
