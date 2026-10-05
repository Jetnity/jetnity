import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  ADMIN_ACCOUNT_COUNTS_REQUIRED_CALLER_STATUS,
  applyAccountCountsCallerStatus,
  decideAccountCountsCallerStatus,
  loadOwnAccountCountsCallerStatus,
} from '@/lib/admin/account-counts-delivery/caller-status'

describe('Admin account-counts caller status', () => {
  test('permits only exactly active and denies banned/disabled/pending/unknown/missing', () => {
    assert.equal(ADMIN_ACCOUNT_COUNTS_REQUIRED_CALLER_STATUS, 'active')
    assert.deepEqual(decideAccountCountsCallerStatus({ ok: true, status: 'active' }), {
      allowed: true,
      grant: 'role',
    })
    for (const status of ['banned', 'disabled', 'pending', 'unknown', 'ACTIVE', 'Active', ' ']) {
      assert.deepEqual(
        decideAccountCountsCallerStatus({ ok: true, status }),
        { allowed: false, kind: 'forbidden' },
        status,
      )
    }
    assert.deepEqual(decideAccountCountsCallerStatus({ ok: false, reason: 'missing' }), {
      allowed: false,
      kind: 'forbidden',
    })
    assert.deepEqual(decideAccountCountsCallerStatus({ ok: false, reason: 'unknown' }), {
      allowed: false,
      kind: 'forbidden',
    })
    assert.deepEqual(decideAccountCountsCallerStatus({ ok: false, reason: 'failed' }), {
      allowed: false,
      kind: 'failed',
    })
  })

  test('own-status lookup maps empty, null, missing and thrown reads fail-closed', async () => {
    assert.deepEqual(
      await loadOwnAccountCountsCallerStatus(async () => ({ data: { status: 'active' }, error: null })),
      { ok: true, status: 'active' },
    )
    assert.deepEqual(
      await loadOwnAccountCountsCallerStatus(async () => ({ data: { status: 'banned' }, error: null })),
      { ok: true, status: 'banned' },
    )
    assert.deepEqual(
      await loadOwnAccountCountsCallerStatus(async () => ({ data: null, error: null })),
      { ok: false, reason: 'missing' },
    )
    assert.deepEqual(
      await loadOwnAccountCountsCallerStatus(async () => ({ data: { status: null }, error: null })),
      { ok: false, reason: 'unknown' },
    )
    assert.deepEqual(
      await loadOwnAccountCountsCallerStatus(async () => ({ data: { status: '' }, error: null })),
      { ok: false, reason: 'unknown' },
    )
    assert.deepEqual(
      await loadOwnAccountCountsCallerStatus(async () => ({
        data: { status: 'active' },
        error: { message: 'lookup exploded' },
      })),
      { ok: false, reason: 'failed' },
    )
    assert.deepEqual(
      await loadOwnAccountCountsCallerStatus(async () => {
        throw new Error('client exploded')
      }),
      { ok: false, reason: 'failed' },
    )
  })

  test('does not look up status for denied or break-glass access', async () => {
    let lookups = 0
    const loadStatus = async () => {
      lookups += 1
      return { ok: true, status: 'active' } as const
    }
    assert.deepEqual(
      await applyAccountCountsCallerStatus({ allowed: false, kind: 'forbidden' }, 'user-1', loadStatus),
      { allowed: false, kind: 'forbidden' },
    )
    assert.deepEqual(
      await applyAccountCountsCallerStatus({ allowed: false, kind: 'failed' }, 'user-1', loadStatus),
      { allowed: false, kind: 'failed' },
    )
    assert.deepEqual(
      await applyAccountCountsCallerStatus({ allowed: true, grant: 'break-glass' }, 'user-1', loadStatus),
      { allowed: true, grant: 'break-glass' },
    )
    assert.equal(lookups, 0)
  })

  test('role-backed active caller proceeds; blocked or failed lookup does not', async () => {
    const seen: string[] = []
    const loadStatus = async (userId: string) => {
      seen.push(userId)
      if (userId === 'active-user') return { ok: true, status: 'active' } as const
      if (userId === 'throw-user') throw new Error('status lookup exploded')
      if (userId === 'fail-user') return { ok: false, reason: 'failed' } as const
      return { ok: true, status: 'banned' } as const
    }

    assert.deepEqual(
      await applyAccountCountsCallerStatus({ allowed: true, grant: 'role' }, 'active-user', loadStatus),
      { allowed: true, grant: 'role' },
    )
    assert.deepEqual(
      await applyAccountCountsCallerStatus({ allowed: true, grant: 'role' }, 'banned-user', loadStatus),
      { allowed: false, kind: 'forbidden' },
    )
    assert.deepEqual(
      await applyAccountCountsCallerStatus({ allowed: true, grant: 'role' }, 'fail-user', loadStatus),
      { allowed: false, kind: 'failed' },
    )
    assert.deepEqual(
      await applyAccountCountsCallerStatus({ allowed: true, grant: 'role' }, 'throw-user', loadStatus),
      { allowed: false, kind: 'failed' },
    )
    assert.deepEqual(
      await applyAccountCountsCallerStatus({ allowed: true, grant: 'role' }, '', loadStatus),
      { allowed: false, kind: 'failed' },
    )
    assert.deepEqual(
      await applyAccountCountsCallerStatus({ allowed: true, grant: 'role' }, null, loadStatus),
      { allowed: false, kind: 'failed' },
    )
    assert.deepEqual(seen, ['active-user', 'banned-user', 'fail-user', 'throw-user'])
  })

  test('same verified caller is re-evaluated on each request', async () => {
    const sequence = ['active', 'banned', 'active']
    let index = 0
    const loadStatus = async (userId: string) => {
      assert.equal(userId, 'same-user')
      return { ok: true, status: sequence[index++] ?? 'missing' } as const
    }
    const first = await applyAccountCountsCallerStatus({ allowed: true, grant: 'role' }, 'same-user', loadStatus)
    const blocked = await applyAccountCountsCallerStatus({ allowed: true, grant: 'role' }, 'same-user', loadStatus)
    const restored = await applyAccountCountsCallerStatus({ allowed: true, grant: 'role' }, 'same-user', loadStatus)
    assert.deepEqual(first, { allowed: true, grant: 'role' })
    assert.deepEqual(blocked, { allowed: false, kind: 'forbidden' })
    assert.deepEqual(restored, { allowed: true, grant: 'role' })
    assert.equal(index, 3)
  })
})
