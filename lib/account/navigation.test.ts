import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { ACCOUNT_NAVIGATION, accountNavigationAktiv } from '@/lib/account/navigation'

describe('Account-Navigation', () => {
  test('zeigt nur vorhandene AP-1-Ziele', () => {
    assert.deepEqual(
      ACCOUNT_NAVIGATION.map((eintrag) => eintrag.href),
      ['/account', '/reisen', '/account/settings'],
    )
  })

  test('legt Übersicht nicht auf Unterseiten', () => {
    assert.equal(accountNavigationAktiv('/account', '/account'), true)
    assert.equal(accountNavigationAktiv('/account/settings', '/account'), false)
    assert.equal(accountNavigationAktiv('/account/security', '/account'), false)
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
})
