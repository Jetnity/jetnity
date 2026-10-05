import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { ADMIN_NAV_ITEMS } from './navigation'
import {
  ADMIN_NAV_SEARCH_ALIASES,
  ADMIN_NAV_SEARCH_QUERY_MAX,
  adminNavSearchHaystack,
  adminNavSearchOptionId,
  clampAdminNavSearchIndex,
  filterAdminNavSearch,
  isAdminNavSearchShortcut,
  matchAdminNavSearch,
  normalizeAdminNavSearchQuery,
  readyAdminNavItems,
  resolveAdminNavSearchHref,
  leseVerfuegbaresSichtfeld,
  optionIstErreichbar,
  optionIstImListenfenster,
  optionIstImSichtfeld,
  retainAdminNavSearchHref,
  scrollDeltaToReveal,
  stepAdminNavSearchHref,
} from './navigation-search'

const OPERATOR = { role: 'operator' as const, grant: 'role' as const }
const CREATOR = { role: 'creator' as const, grant: 'role' as const }
const BREAK_GLASS = { role: null, grant: 'break-glass' as const }

describe('Admin-Navigationssuche (lokal, allowlist)', () => {
  test('normalisiert Leerzeichen und Grossschreibung, kuerzt lange Eingaben vorhersagbar', () => {
    assert.equal(normalizeAdminNavSearchQuery('  Kosten  '), 'kosten')
    assert.equal(normalizeAdminNavSearchQuery('PROVIDER'), 'provider')
    assert.equal(normalizeAdminNavSearchQuery('\tZahlungen\n'), 'zahlungen')
    const lang = 'x'.repeat(ADMIN_NAV_SEARCH_QUERY_MAX + 40)
    const gefiltert = filterAdminNavSearch(ADMIN_NAV_ITEMS, OPERATOR, lang)
    assert.deepEqual(gefiltert, [])
    assert.equal(normalizeAdminNavSearchQuery(lang).slice(0, ADMIN_NAV_SEARCH_QUERY_MAX).length, ADMIN_NAV_SEARCH_QUERY_MAX)
  })

  test('leere Query liefert nur ready-Flaechen der Sitzung, keine later-Platzhalter', () => {
    const operator = filterAdminNavSearch(ADMIN_NAV_ITEMS, OPERATOR, '   ')
    assert.deepEqual(
      operator.map((item) => item.href),
      [
        '/admin',
        '/admin/users',
        '/admin/payments',
        '/admin/security',
        '/admin/system-health',
        '/admin/provider-ops',
      ],
    )
    assert.equal(operator.every((item) => item.kind === 'ready'), true)
    assert.equal(operator.some((item) => item.href === '/admin/analytics'), false)

    const creator = filterAdminNavSearch(ADMIN_NAV_ITEMS, CREATOR, '')
    assert.deepEqual(creator.map((item) => item.href), ['/admin'])

    const notzugang = filterAdminNavSearch(ADMIN_NAV_ITEMS, BREAK_GLASS, '')
    assert.equal(notzugang.some((item) => item.href === '/admin/users'), false)
    assert.equal(notzugang.some((item) => item.href === '/admin/payments'), true)
    assert.equal(notzugang.some((item) => item.href === '/admin/provider-ops'), true)
  })

  test('Alias Kosten trifft Provider & Kosten, Satzzeichen bleiben wörtlich ohne Treffer', () => {
    const alias = filterAdminNavSearch(ADMIN_NAV_ITEMS, OPERATOR, 'Kosten')
    assert.deepEqual(alias.map((item) => item.href), ['/admin/provider-ops'])
    assert.ok(ADMIN_NAV_SEARCH_ALIASES['/admin/provider-ops']?.includes('kosten'))

    const satzzeichen = filterAdminNavSearch(ADMIN_NAV_ITEMS, OPERATOR, '???')
    assert.deepEqual(satzzeichen, [])
    const mitAusrufezeichen = filterAdminNavSearch(ADMIN_NAV_ITEMS, OPERATOR, 'kosten!')
    assert.deepEqual(mitAusrufezeichen, [])
  })

  test('Creator und Break-Glass eskalieren nicht über die bestehende UX-Filterung', () => {
    assert.equal(filterAdminNavSearch(ADMIN_NAV_ITEMS, CREATOR, 'nutzer').length, 0)
    assert.equal(filterAdminNavSearch(ADMIN_NAV_ITEMS, CREATOR, 'kosten').length, 0)
    assert.equal(filterAdminNavSearch(ADMIN_NAV_ITEMS, BREAK_GLASS, 'users').length, 0)
    assert.equal(filterAdminNavSearch(ADMIN_NAV_ITEMS, BREAK_GLASS, 'Nutzer').length, 0)
    const bereit = readyAdminNavItems(ADMIN_NAV_ITEMS, BREAK_GLASS)
    assert.equal(bereit.some((item) => item.href === '/admin/users'), false)
  })

  test('later-Eintraege matchen nie, auch wenn das Label in der Query steht', () => {
    const later = ADMIN_NAV_ITEMS.find((item) => item.href === '/admin/analytics')
    assert.equal(later !== undefined, true)
    assert.equal(matchAdminNavSearch(later!, 'analytics'), false)
    assert.equal(filterAdminNavSearch(ADMIN_NAV_ITEMS, OPERATOR, 'analytics').length, 0)
    assert.equal(filterAdminNavSearch(ADMIN_NAV_ITEMS, OPERATOR, 'content').length, 0)
  })

  test('Ziel kommt nur aus der Allowlist, nie aus der Query', () => {
    const allow = readyAdminNavItems(ADMIN_NAV_ITEMS, OPERATOR)
    assert.equal(resolveAdminNavSearchHref('/admin/users', allow), '/admin/users')
    assert.equal(resolveAdminNavSearchHref('/admin/analytics', allow), null)
    assert.equal(resolveAdminNavSearchHref('https://evil.example/admin/users', allow), null)
    assert.equal(resolveAdminNavSearchHref('javascript:alert(1)', allow), null)
    assert.equal(resolveAdminNavSearchHref('/admin/users?next=https://evil.example', allow), null)
    assert.equal(resolveAdminNavSearchHref('/konto', allow), null)
    assert.equal(resolveAdminNavSearchHref('/admin/users', readyAdminNavItems(ADMIN_NAV_ITEMS, CREATOR)), null)
  })

  test('Auswahl bleibt am gleichen href, wenn der Filter die Liste kuerzt', () => {
    const alle = filterAdminNavSearch(ADMIN_NAV_ITEMS, OPERATOR, '')
    const gehalten = retainAdminNavSearchHref('/admin/security', alle)
    assert.equal(gehalten, '/admin/security')
    const nachFilter = filterAdminNavSearch(ADMIN_NAV_ITEMS, OPERATOR, 'zahl')
    assert.equal(retainAdminNavSearchHref('/admin/security', nachFilter), '/admin/payments')
    assert.equal(retainAdminNavSearchHref('/admin/security', []), null)
    assert.equal(stepAdminNavSearchHref('/admin', alle, 1), '/admin/users')
    assert.equal(stepAdminNavSearchHref('/admin/users', alle, -1), '/admin')
    assert.equal(clampAdminNavSearchIndex(9, 6), 5)
    assert.equal(clampAdminNavSearchIndex(0, 0), -1)
    assert.match(adminNavSearchHaystack(alle[0]!), /steuerzentrale/)
    assert.match(adminNavSearchOptionId('/admin/users'), /admin-nav-search-option/)
  })

  test('scrollt nur so weit, dass die aktive Zeile vollständig im Listenfenster liegt', () => {
    assert.equal(scrollDeltaToReveal(200, 450, 430, 474), 24)
    assert.equal(scrollDeltaToReveal(200, 450, 180, 220), -20)
    assert.equal(scrollDeltaToReveal(200, 450, 210, 250), 0)
    assert.equal(optionIstImListenfenster(200, 450, 430, 474), false)
    assert.equal(optionIstImListenfenster(200, 450, 210, 250), true)
  })

  test('Erreichbarkeit schneidet Listenfenster mit viewport/visualViewport', () => {
    const layout = leseVerfuegbaresSichtfeld({ innerWidth: 390, innerHeight: 500, visualViewport: null })
    assert.deepEqual(layout, { top: 0, left: 0, right: 390, bottom: 500, width: 390, height: 500 })
    const visuell = leseVerfuegbaresSichtfeld({
      innerWidth: 390,
      innerHeight: 800,
      visualViewport: { width: 390, height: 500, offsetTop: 0, offsetLeft: 0 },
    })
    assert.equal(visuell.height, 500)
    assert.equal(visuell.bottom, 500)

    // TL R2 repro at 390x500 / 200% text: option inside list, outside viewport 500.
    assert.equal(optionIstImListenfenster(454, 704, 616, 704), true)
    assert.equal(optionIstImSichtfeld(0, 500, 616, 704), false)
    assert.equal(optionIstErreichbar(454, 704, 0, 500, 616, 704), false)

    assert.equal(optionIstErreichbar(280, 476, 0, 500, 388, 476), true)
    assert.equal(optionIstImSichtfeld(0, 500, 12, 56), true)
    assert.equal(optionIstImSichtfeld(0, 500, 480, 560), false)
  })

  test('Shortcut ist nur Cmd/Ctrl+K ohne Shift/Alt', () => {
    assert.equal(isAdminNavSearchShortcut({ key: 'k', metaKey: true, ctrlKey: false, altKey: false, shiftKey: false }), true)
    assert.equal(isAdminNavSearchShortcut({ key: 'K', metaKey: false, ctrlKey: true, altKey: false, shiftKey: false }), true)
    assert.equal(isAdminNavSearchShortcut({ key: 'k', metaKey: true, ctrlKey: false, altKey: false, shiftKey: true }), false)
    assert.equal(isAdminNavSearchShortcut({ key: 'b', metaKey: true, ctrlKey: false, altKey: false, shiftKey: true }), false)
    assert.equal(isAdminNavSearchShortcut({ key: 'k', metaKey: false, ctrlKey: false, altKey: false, shiftKey: false }), false)
    assert.equal(
      isAdminNavSearchShortcut({ key: 'k', metaKey: true, ctrlKey: false, altKey: false, shiftKey: false, isComposing: true }),
      false,
    )
  })
})
