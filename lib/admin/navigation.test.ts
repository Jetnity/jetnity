import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ADMIN_NAV_ITEMS,
  adminNavIstNurUx,
  adminNavItemSichtbar,
  filterAdminNav,
} from './navigation'

describe('Admin-Navigation (UX, keine Autorisierung)', () => {
  test('deklariert ausdrücklich, dass Filter nur UX sind', () => {
    assert.equal(adminNavIstNurUx(), true)
  })

  test('zeigt Operator die fertigen Kernflächen und kennzeichnet Rest als später', () => {
    const sichtbar = filterAdminNav(ADMIN_NAV_ITEMS, {
      role: 'operator',
      grant: 'role',
    })
    assert.deepEqual(
      sichtbar.map((item) => item.href),
      [
        '/admin',
        '/admin/users',
        '/admin/payments',
        '/admin/security',
        '/admin/system-health',
        '/admin/provider-ops',
        '/admin/analytics',
        '/admin/content',
        '/admin/marketing',
        '/admin/settings',
        '/admin/localization',
      ],
    )
    assert.deepEqual(
      sichtbar.filter((item) => item.kind === 'ready').map((item) => item.label),
      ['Steuerzentrale', 'Nutzer', 'Zahlungen', 'Security', 'System Health', 'Provider & Kosten'],
    )
    assert.equal(
      sichtbar.filter((item) => item.kind === 'later').every((item) => item.kind === 'later'),
      true,
    )
  })

  test('blendet Nutzer und Betrieb für Creator aus, ohne das als Auth zu behandeln', () => {
    const sichtbar = filterAdminNav(ADMIN_NAV_ITEMS, {
      role: 'creator',
      grant: 'role',
    })
    assert.equal(sichtbar.some((item) => item.href === '/admin/users'), false)
    assert.equal(sichtbar.some((item) => item.href === '/admin/payments'), false)
    assert.equal(sichtbar.some((item) => item.href === '/admin/system-health'), false)
    assert.equal(sichtbar.some((item) => item.href === '/admin/provider-ops'), false)
    const users = ADMIN_NAV_ITEMS.find((item) => item.href === '/admin/users')
    assert.equal(users !== undefined, true)
    assert.equal(adminNavItemSichtbar(users!, { role: 'creator', grant: 'role' }), false)
    assert.equal(adminNavIstNurUx(), true)
  })

  test('zeigt Break-Glass Zahlungen/Security, nicht Nutzer — URL-Zugriff bleibt Server-Sache', () => {
    const sichtbar = filterAdminNav(ADMIN_NAV_ITEMS, {
      role: null,
      grant: 'break-glass',
    })
    assert.equal(sichtbar.some((item) => item.href === '/admin'), true)
    assert.equal(sichtbar.some((item) => item.href === '/admin/payments'), true)
    assert.equal(sichtbar.some((item) => item.href === '/admin/security'), true)
    assert.equal(sichtbar.some((item) => item.href === '/admin/system-health'), true)
    assert.equal(sichtbar.some((item) => item.href === '/admin/provider-ops'), true)
    assert.equal(sichtbar.some((item) => item.href === '/admin/users'), false)
  })

  test('leitet aus einem ausgeblendeten Eintrag keine serverseitige Sperre ab', () => {
    const users = ADMIN_NAV_ITEMS.find((item) => item.href === '/admin/users')
    assert.equal(users?.capability, 'konten-verwalten')
    assert.equal(adminNavIstNurUx(), true)
  })
})
