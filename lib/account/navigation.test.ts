import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  ACCOUNT_NAVIGATION,
  accountNavigationAktiv,
  accountNavigationScrollDelta,
} from '@/lib/account/navigation'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

describe('Account-Navigation', () => {
  test('zeigt vorhandene Account-Ziele in der Rail-Reihenfolge', () => {
    assert.deepEqual(
      ACCOUNT_NAVIGATION.map((eintrag) => eintrag.label),
      ['Übersicht', 'Reisen', 'Reisende', 'Einstellungen'],
    )
    assert.deepEqual(
      ACCOUNT_NAVIGATION.map((eintrag) => eintrag.href),
      ['/account', '/reisen', '/account/travellers', '/account/settings'],
    )
  })

  test('legt Übersicht nicht auf Unterseiten', () => {
    assert.equal(accountNavigationAktiv('/account', '/account'), true)
    assert.equal(accountNavigationAktiv('/account/settings', '/account'), false)
    assert.equal(accountNavigationAktiv('/account/security', '/account'), false)
    assert.equal(accountNavigationAktiv('/account/travellers', '/account'), false)
  })

  test('legt Sicherheit unter Einstellungen', () => {
    assert.equal(accountNavigationAktiv('/account/settings', '/account/settings'), true)
    assert.equal(accountNavigationAktiv('/account/security', '/account/settings'), true)
    assert.equal(accountNavigationAktiv('/account', '/account/settings'), false)
  })

  test('kennt Meine Reisen einschliesslich Workspace-Pfaden', () => {
    assert.equal(accountNavigationAktiv('/reisen', '/reisen'), true)
    assert.equal(accountNavigationAktiv('/reisen/abc', '/reisen'), true)
    assert.equal(accountNavigationAktiv('/account', '/reisen'), false)
  })

  test('legt Reisende nur auf die Registry-Route', () => {
    assert.equal(accountNavigationAktiv('/account/travellers', '/account/travellers'), true)
    assert.equal(accountNavigationAktiv('/account/travellers/neu', '/account/travellers'), true)
    assert.equal(accountNavigationAktiv('/account', '/account/travellers'), false)
    assert.equal(accountNavigationAktiv('/account/settings', '/account/travellers'), false)
    assert.equal(accountNavigationAktiv('/reisen', '/account/travellers'), false)
  })

  test('legt Buchungen nicht unter die vier Rail-Punkte und nicht als fünften Tab', () => {
    assert.equal(ACCOUNT_NAVIGATION.length, 4)
    assert.equal(
      ACCOUNT_NAVIGATION.some((eintrag) => eintrag.href === '/account/bookings' || eintrag.label === 'Buchungen'),
      false,
    )
    assert.equal(accountNavigationAktiv('/account/bookings', '/account'), false)
    assert.equal(accountNavigationAktiv('/account/bookings', '/reisen'), false)
    assert.equal(accountNavigationAktiv('/account/bookings', '/account/travellers'), false)
    assert.equal(accountNavigationAktiv('/account/bookings', '/account/settings'), false)
  })

  test('verschiebt den aktiven Tab nur waagrecht und nur wenn er ragt', () => {
    const leiste = { left: 0, width: 200 }
    assert.equal(accountNavigationScrollDelta(leiste, { left: 20, width: 80 }), null)
    assert.equal(accountNavigationScrollDelta(leiste, { left: -40, width: 80 }), -100)
    assert.equal(accountNavigationScrollDelta(leiste, { left: 160, width: 80 }), 100)
  })
})

describe('Account-Navigation Markupvertrag', () => {
  test('bleibt eine einzeilige nativ scrollbare Leiste ohne 2-Spalten-Grid', () => {
    const nav = quelle('../../components/account/AccountNavigation.tsx')
    assert.match(nav, /aria-label="Konto"/)
    assert.match(nav, /aria-current=\{aktiv \? 'page' : undefined\}/)
    assert.match(nav, /min-h-11/)
    assert.match(nav, /flex-nowrap/)
    assert.match(nav, /overflow-x-auto/)
    assert.match(nav, /overscroll-x-contain/)
    assert.equal(nav.includes('touch-pan-x'), false)
    assert.equal(/touch-pan-|touch-none|touch-pinch/.test(nav), false)
    assert.equal(nav.includes('grid-cols-2'), false)
    assert.equal(/\bgrid\b/.test(nav), false)
    assert.equal(/\bflex-wrap\b/.test(nav), false)
    assert.equal(/onTouchStart|onPointerDown|swipe|Swipe/.test(nav), false)
    assert.match(nav, /accountNavigationScrollDelta/)
    assert.match(nav, /scrollBy\(\{ left: delta, behavior: 'auto' \}\)/)
  })
})

describe('Meine Reisen und Account-Navigation', () => {
  test('nutzt denselben Server-Auth-Stand und zeigt die Leiste nur angemeldet', () => {
    const seite = quelle('../../app/(public)/reisen/page.tsx')
    assert.match(seite, /const \{ data \} = await supabase\.auth\.getUser\(\)/)
    assert.match(seite, /const angemeldet = Boolean\(data\.user\)/)
    assert.match(seite, /angemeldet \? <AccountNavigation \/> : null/)
    assert.equal((seite.match(/await supabase\.auth\.getUser\(\)/g) ?? []).length, 1)
    assert.equal(/await\s+\w+\.auth\.getSession\(/.test(seite), false)
    assert.equal(seite.includes('createBrowserClient'), false)
    assert.match(seite, /import AccountNavigation from '@\/components\/account\/AccountNavigation'/)
  })
})
