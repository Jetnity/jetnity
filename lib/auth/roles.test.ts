// lib/auth/roles.test.ts
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  ACCOUNT_STATUSES,
  ROLES,
  assignableRoles,
  canAccessAdminArea,
  canAssignRole,
  canManageUsers,
  hasAtLeast,
  isAccountStatus,
  isRole,
  parseRole,
  rankOf,
  ROLE_LABELS,
  type Role,
} from '@/lib/auth/roles'

describe('Rollenmodell', () => {
  test('jede Rolle hat einen eindeutigen Rang und eine Beschriftung', () => {
    const ranks = ROLES.map(rankOf)
    assert.equal(new Set(ranks).size, ROLES.length, 'Ränge müssen eindeutig sein')
    for (const role of ROLES) {
      assert.equal(typeof ROLE_LABELS[role], 'string')
      assert.ok(ROLE_LABELS[role].length > 0)
    }
  })

  test('die Rangfolge ist aufsteigend definiert', () => {
    assert.ok(rankOf('user') < rankOf('creator'))
    assert.ok(rankOf('creator') < rankOf('moderator'))
    assert.ok(rankOf('moderator') < rankOf('operator'))
    assert.ok(rankOf('operator') < rankOf('admin'))
    assert.ok(rankOf('admin') < rankOf('owner'))
  })

  test('hasAtLeast vergleicht anhand des Rangs', () => {
    assert.equal(hasAtLeast('admin', 'moderator'), true)
    assert.equal(hasAtLeast('moderator', 'moderator'), true)
    assert.equal(hasAtLeast('creator', 'moderator'), false)
  })

  test('parseRole normalisiert und weist Unbekanntes ab', () => {
    assert.equal(parseRole('Admin'), 'admin')
    assert.equal(parseRole('  owner  '), 'owner')
    assert.equal(parseRole('superadmin'), null)
    assert.equal(parseRole(''), null)
    assert.equal(parseRole(null), null)
    assert.equal(parseRole(undefined), null)
    assert.equal(parseRole(42), null)
    // Wichtig: kein stiller Rückfall auf eine Standardrolle.
    assert.equal(parseRole('admin '), 'admin')
  })

  test('isRole und isAccountStatus prüfen streng', () => {
    assert.equal(isRole('operator'), true)
    assert.equal(isRole('Operator'), false)
    assert.equal(isRole('root'), false)
    for (const status of ACCOUNT_STATUSES) assert.equal(isAccountStatus(status), true)
    assert.equal(isAccountStatus('gesperrt'), false)
  })
})

describe('Zugang zum Administrationsbereich', () => {
  test('erst ab Moderation', () => {
    assert.equal(canAccessAdminArea('user'), false)
    assert.equal(canAccessAdminArea('creator'), false)
    assert.equal(canAccessAdminArea('moderator'), true)
    assert.equal(canAccessAdminArea('operator'), true)
    assert.equal(canAccessAdminArea('admin'), true)
    assert.equal(canAccessAdminArea('owner'), true)
  })

  test('Kontoverwaltung deckt sich mit dem Bereichszugang', () => {
    for (const role of ROLES) {
      assert.equal(canManageUsers(role), canAccessAdminArea(role), `Rolle ${role}`)
    }
  })
})

describe('Rollenvergabe', () => {
  const assign = (
    actorRole: Role,
    currentTargetRole: Role,
    nextRole: Role,
    ids: { actorId: string; targetId: string } = { actorId: 'a', targetId: 'b' },
  ) => canAssignRole({ actorRole, currentTargetRole, nextRole, ...ids })

  test('niemand ändert die eigene Rolle – auch der Owner nicht', () => {
    for (const role of ROLES) {
      assert.equal(
        assign(role, role, 'owner', { actorId: 'same', targetId: 'same' }),
        false,
        `Rolle ${role} darf sich nicht selbst ändern`,
      )
    }
  })

  test('eine Moderation kann sich nicht zur Administration befördern', () => {
    // Genau die Lücke, die vor Phase 1.3 offen war: geprüft wurde nur die
    // Owner-Rolle und ein Selbst-Downgrade.
    assert.equal(assign('moderator', 'moderator', 'admin', { actorId: 'm', targetId: 'm' }), false)
  })

  test('eine Moderation kann auch fremden Konten keine höhere Rolle geben', () => {
    assert.equal(assign('moderator', 'user', 'admin'), false)
    assert.equal(assign('moderator', 'user', 'operator'), false)
    assert.equal(assign('moderator', 'user', 'moderator'), false)
    assert.equal(assign('moderator', 'user', 'creator'), true)
  })

  test('eine Administration ernennt keine zweite Administration', () => {
    assert.equal(assign('admin', 'user', 'admin'), false)
    assert.equal(assign('admin', 'user', 'owner'), false)
    assert.equal(assign('admin', 'user', 'operator'), true)
  })

  test('höhere oder gleichrangige Konten sind unantastbar', () => {
    assert.equal(assign('admin', 'owner', 'user'), false)
    assert.equal(assign('admin', 'admin', 'user'), false)
    assert.equal(assign('operator', 'admin', 'user'), false)
    assert.equal(assign('admin', 'operator', 'user'), true)
  })

  test('der Owner darf jede fremde Rolle setzen', () => {
    for (const target of ROLES) {
      for (const next of ROLES) {
        assert.equal(assign('owner', target, next), true, `${target} → ${next}`)
      }
    }
  })

  test('ohne Verwaltungsrecht ist jede Vergabe ausgeschlossen', () => {
    for (const actor of ['user', 'creator'] as const) {
      for (const next of ROLES) {
        assert.equal(assign(actor, 'user', next), false, `${actor} → ${next}`)
      }
    }
  })

  test('assignableRoles deckt sich mit canAssignRole', () => {
    for (const actor of ROLES) {
      const list = assignableRoles(actor)
      for (const next of ROLES) {
        const erlaubt = assign(actor, 'user', next)
        // `user` als bisherige Rolle ist der günstigste Fall; was hier nicht
        // erlaubt ist, darf auch nicht im Auswahlfeld stehen.
        if (!list.includes(next)) {
          assert.equal(erlaubt, false, `${actor} bietet ${next} nicht an, erlaubt es aber`)
        }
      }
    }
  })

  test('das Auswahlfeld einer Administration enthält keine Administration', () => {
    const list = assignableRoles('admin')
    assert.equal(list.includes('admin'), false)
    assert.equal(list.includes('owner'), false)
    assert.equal(list.includes('operator'), true)
    assert.deepEqual(assignableRoles('user'), [])
    assert.deepEqual(assignableRoles('owner'), [...ROLES])
  })
})
