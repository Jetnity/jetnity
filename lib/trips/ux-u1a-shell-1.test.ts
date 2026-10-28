import assert from 'node:assert/strict'
import test from 'node:test'

import {
  UX_U1A_DESKTOP_AB_PX,
  UX_U1A_PHONE_BIS_PX,
  UX_U1A_ROOT_GROSS_PX,
  UX_U1A_SCHMAL_BIS_PX,
  UX_U1A_TASTATUR_AB_PX,
  UX_U1A_VIER_TABS_AB_PX,
  UX_U1A_ZOOM_AB,
  shellBrowserZoom,
  shellNavLage,
  shellRootSchriftPx,
  shellTastaturOffen,
  type ShellMessung,
} from '@/lib/trips/ux-u1a-shell-1'

const normal: ShellMessung = {
  viewportBreite: 390,
  rootSchriftPx: 16,
  browserZoom: 1,
  tastatur: false,
}

test('320px, grosse Wurzelschrift, Browserzoom und Tastatur fallen getrennt in den Fluss', () => {
  assert.equal(shellNavLage({ ...normal, viewportBreite: 280, detailOffen: false }), 'flow')
  assert.equal(shellNavLage({ ...normal, viewportBreite: UX_U1A_SCHMAL_BIS_PX, detailOffen: false }), 'flow')
  assert.equal(shellNavLage({ ...normal, viewportBreite: UX_U1A_SCHMAL_BIS_PX + 1, detailOffen: false }), 'flow')
  assert.equal(shellNavLage({ ...normal, viewportBreite: UX_U1A_VIER_TABS_AB_PX - 1, detailOffen: false }), 'flow')
  assert.equal(shellNavLage({ ...normal, viewportBreite: 390, rootSchriftPx: UX_U1A_ROOT_GROSS_PX, detailOffen: false }), 'flow')
  assert.equal(shellNavLage({ ...normal, viewportBreite: UX_U1A_PHONE_BIS_PX, rootSchriftPx: UX_U1A_ROOT_GROSS_PX, detailOffen: false }), 'flow')
  assert.equal(shellNavLage({ ...normal, viewportBreite: 1440, rootSchriftPx: UX_U1A_ROOT_GROSS_PX - 0.1, detailOffen: false }), 'sticky')
  assert.equal(shellNavLage({ ...normal, viewportBreite: 1440, browserZoom: UX_U1A_ZOOM_AB, detailOffen: false }), 'flow')
  assert.equal(shellNavLage({ ...normal, viewportBreite: 1440, browserZoom: UX_U1A_ZOOM_AB - 0.01, detailOffen: false }), 'sticky')
  assert.equal(shellNavLage({ ...normal, tastatur: true, detailOffen: false }), 'flow')
  assert.equal(shellNavLage({ ...normal, viewportBreite: 1440, tastatur: true, detailOffen: false }), 'flow')
})

test('gewöhnliches Telefon nutzt die untere Leiste, ab 768 kleben die Tabs', () => {
  for (const breite of [360, 390, 430, 767]) {
    assert.equal(shellNavLage({ ...normal, viewportBreite: breite, detailOffen: false }), 'bottom')
  }
  for (const breite of [UX_U1A_PHONE_BIS_PX, UX_U1A_DESKTOP_AB_PX, 1440]) {
    assert.equal(shellNavLage({ ...normal, viewportBreite: breite, detailOffen: false }), 'sticky')
  }
  assert.equal(shellNavLage({ ...normal, viewportBreite: 390, detailOffen: true }), 'flow')
  assert.equal(shellNavLage({ ...normal, viewportBreite: UX_U1A_DESKTOP_AB_PX - 24, detailOffen: true }), 'flow')
  assert.equal(shellNavLage({ ...normal, viewportBreite: UX_U1A_DESKTOP_AB_PX, detailOffen: true }), 'sticky')
})

test('Zoom aus der sichtbaren Skala ist nicht die Wurzelschrift', () => {
  assert.equal(shellBrowserZoom({ innerWidth: 390, outerWidth: 390, visualScale: 2 }), 2)
  assert.equal(shellBrowserZoom({ innerWidth: 1000, outerWidth: 2000, visualScale: 1 }), 2)
  assert.equal(shellBrowserZoom({ innerWidth: 1000, outerWidth: 1040, visualScale: 1 }), 1)
  assert.equal(shellBrowserZoom({ innerWidth: 390, outerWidth: 0, visualScale: 1 }), 1)
  assert.equal(shellBrowserZoom({ innerWidth: 390, outerWidth: 0, visualScale: null }), 1)
  assert.equal(shellRootSchriftPx('32px'), 32)
  assert.equal(shellRootSchriftPx('16px'), 16)
  assert.equal(shellRootSchriftPx(''), 16)
})

test('die Tastatur zählt nur, wenn die sichtbare Höhe deutlich unter der Layout-Höhe liegt', () => {
  assert.equal(shellTastaturOffen({ innerHeight: 800, visualHeight: 800 - UX_U1A_TASTATUR_AB_PX - 20, visualOffsetTop: 0 }), true)
  assert.equal(shellTastaturOffen({ innerHeight: 800, visualHeight: 800 - UX_U1A_TASTATUR_AB_PX, visualOffsetTop: 0 }), false)
  assert.equal(shellTastaturOffen({ innerHeight: 800, visualHeight: 640, visualOffsetTop: 80 }), false)
  assert.equal(shellTastaturOffen({ innerHeight: 800, visualHeight: null, visualOffsetTop: 0 }), false)
})
