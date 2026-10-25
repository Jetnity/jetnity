import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { USERS_DIRECTORY_MAX_PAGE } from './users-directory-query'
import {
  USERS_SEARCH_DEBOUNCE_MS,
  buildUsersListHref,
  normalizeUserSearch,
  userSearchEditChangesFilter,
  userSearchHrefCarriesDraft,
  usersListHrefFromParams,
  usersListHrefMatches,
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

  test('erkennt die eigene Suchbestaetigung und einen neueren Entwurf', () => {
    const bob = buildUsersListHref('q=anna&page=3&source=support', { q: 'bob', page: 1 })
    const same = usersListHrefFromParams('source=support&page=1&q=bob')
    assert.equal(usersListHrefMatches(bob, same), true)
    assert.equal(usersListHrefMatches(bob, '/admin/users?q=bobby&page=1&source=support'), false)
    assert.equal(usersListHrefMatches('/admin/users', '/admin/users?page=1'), false)
    assert.equal(usersListHrefMatches('/admin/users?page=%201%20', '/admin/users?page=1'), false)
    assert.equal(userSearchHrefCarriesDraft(bob, 'bob'), true)
    assert.equal(userSearchHrefCarriesDraft(bob, ' bobby '), false)
    assert.equal(userSearchHrefCarriesDraft(bob, 'anna'), false)
  })

  test('Rolle und Status bleiben, werden gesetzt oder geloescht, fremde Schluessel bleiben', () => {
    const preserved = new URLSearchParams(
      buildUsersListHref('q=anna&page=2&role=admin&status=banned&source=support', { q: 'berta', page: 1 }).split('?')[1],
    )
    assert.equal(preserved.get('role'), 'admin')
    assert.equal(preserved.get('status'), 'banned')
    assert.equal(preserved.get('source'), 'support')
    assert.equal(preserved.get('q'), 'berta')

    const set = new URLSearchParams(
      buildUsersListHref('source=support&page=4', { q: 'anna', page: 1, role: 'operator', status: 'pending' }).split('?')[1],
    )
    assert.equal(set.get('role'), 'operator')
    assert.equal(set.get('status'), 'pending')
    assert.equal(set.get('source'), 'support')

    const removed = new URLSearchParams(
      buildUsersListHref('q=anna&role=admin&status=banned&ref=case-7', {
        q: 'anna',
        page: 1,
        role: null,
        status: '',
      }).split('?')[1],
    )
    assert.equal(removed.get('role'), null)
    assert.equal(removed.get('status'), null)
    assert.equal(removed.get('ref'), 'case-7')
    assert.equal(removed.get('q'), 'anna')
  })

  test('eine Seite ueber 5000 wird auf die erreichbare Obergrenze geklemmt', () => {
    const href = buildUsersListHref('q=anna&source=support', { q: 'anna', page: USERS_DIRECTORY_MAX_PAGE + 1 })
    assert.equal(new URLSearchParams(href.split('?')[1]).get('page'), String(USERS_DIRECTORY_MAX_PAGE))
    assert.equal(USERS_DIRECTORY_MAX_PAGE, 5000)
    assert.equal(href.includes('page=5001'), false)
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
