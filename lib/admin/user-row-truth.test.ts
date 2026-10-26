import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { DEFAULT_ROLE } from '@/lib/auth/roles'
import {
  banToggleTarget,
  displayedStoredRole,
  displayedStoredStatus,
  displayedStoredUserId,
  isDispatchableUserId,
  mutationBlockReason,
} from './user-row-truth'

describe('angezeigte Kontenzeile', () => {
  test('eine unbekannte Rolle wird nicht zur Vorgaberolle', () => {
    assert.equal(displayedStoredRole('nope'), null)
    assert.equal(displayedStoredRole(''), null)
    assert.equal(displayedStoredRole(null), null)
    assert.notEqual(displayedStoredRole('nope'), DEFAULT_ROLE)
    assert.equal(displayedStoredRole('ADMIN'), 'admin')
  })

  test('ein unbekannter Status wird nicht aktiv', () => {
    assert.equal(displayedStoredStatus('Active'), null)
    assert.equal(displayedStoredStatus('archived'), null)
    assert.equal(displayedStoredStatus(null), null)
    assert.equal(displayedStoredStatus('banned'), 'banned')
  })

  test('nur eine stabile Kennung darf eine Änderung auslösen', () => {
    assert.equal(displayedStoredUserId(null), '')
    assert.equal(displayedStoredUserId(12), '')
    assert.equal(isDispatchableUserId(''), false)
    assert.equal(isDispatchableUserId('  ada  '), false)
    assert.equal(isDispatchableUserId('bad id'), false)
    assert.equal(isDispatchableUserId('synthetic-user-1'), true)
  })

  test('Sperren bleibt die bisherige Umschaltung', () => {
    assert.equal(banToggleTarget('banned'), 'active')
    assert.equal(banToggleTarget('active'), 'banned')
    assert.equal(banToggleTarget('pending'), 'banned')
    assert.equal(banToggleTarget('disabled'), 'banned')
  })

  test('eigene, gleichrangige und unbekannte Zeilen bleiben nicht ausführbar', () => {
    assert.equal(mutationBlockReason({
      userId: 'self', role: 'admin', status: 'active', actorId: 'self', actorRole: 'owner',
    }), 'self')
    assert.equal(mutationBlockReason({
      userId: 'peer', role: 'admin', status: 'active', actorId: 'actor', actorRole: 'admin',
    }), 'rank')
    assert.equal(mutationBlockReason({
      userId: 'lower', role: 'creator', status: 'pending', actorId: 'actor', actorRole: 'admin',
    }), null)
  })
})
