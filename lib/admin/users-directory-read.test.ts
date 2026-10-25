import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { canManageUsers } from '@/lib/auth/roles'
import {
  USERS_DIRECTORY_PAGE_SIZE,
  executeUsersDirectoryRead,
  readUsersDirectory,
  type UsersDirectoryClient,
  type UsersDirectoryResponse,
} from './users-directory-query'

function spy(response: UsersDirectoryResponse) {
  const calls: unknown[][] = []
  const chain = {
    select(columns: string, options: { count: 'exact' }) {
      calls.push(['select', columns, options])
      return chain
    },
    order(column: string, options: { ascending: boolean }) {
      calls.push(['order', column, options])
      return chain
    },
    range(from: number, to: number) {
      calls.push(['range', from, to])
      return chain
    },
    or(expression: string) {
      calls.push(['or', expression])
      return chain
    },
    eq(column: string, value: string) {
      calls.push(['eq', column, value])
      return chain
    },
    then(resolve: (value: UsersDirectoryResponse) => unknown) {
      return Promise.resolve(resolve(response))
    },
  }
  const client: UsersDirectoryClient & { calls: unknown[][] } = {
    calls,
    from(table: string) {
      calls.push(['from', table])
      return chain
    },
  }
  return client
}

describe('Admin-Benutzerverzeichnis Lesereihenfolge', () => {
  test('ein werfender Schutz wird nicht gefangen und der Client bleibt unbenutzt', async () => {
    let opened = 0
    await assert.rejects(
      () =>
        readUsersDirectory({
          guard: async () => {
            throw new Error('guard-denied')
          },
          canManage: canManageUsers,
          loadRaw: async () => ({}),
          openClient: async () => {
            opened += 1
            return spy({ data: [], count: 0, error: null })
          },
        }),
      /guard-denied/,
    )
    assert.equal(opened, 0)
  })

  test('eine fehlende Verwaltung kommt vor dem Rohlesen und vor from', async () => {
    let loaded = 0
    let opened = 0
    const outcome = await readUsersDirectory({
      guard: async () => ({ user: { id: 'actor-1' }, role: 'user' as const }),
      canManage: canManageUsers,
      loadRaw: async () => {
        loaded += 1
        return {}
      },
      openClient: async () => {
        opened += 1
        return spy({ data: [], count: 0, error: null })
      },
    })
    assert.equal(outcome.kind, 'denied')
    assert.equal(loaded, 0)
    assert.equal(opened, 0)
    assert.equal(canManageUsers('user'), false)
  })

  test('ungueltige Adresse oeffnet den Client nicht', async () => {
    let opened = 0
    const outcome = await readUsersDirectory({
      guard: async () => ({ user: { id: 'actor-1' }, role: 'admin' as const }),
      canManage: canManageUsers,
      loadRaw: async () => ({ page: '5001', q: 'anna' }),
      openClient: async () => {
        opened += 1
        return spy({ data: [], count: 0, error: null })
      },
    })
    assert.equal(outcome.kind, 'invalid')
    assert.equal(opened, 0)
  })

  test('eine gueltige Ausfuehrung liest profiles einmal, eine zweite ist ein neuer Aufruf', async () => {
    const client = spy({ data: [{ user_id: 'u1' }], count: 100001, error: null, status: 200 })
    const query = { q: 'anna', page: 5000, role: 'operator' as const, status: null }
    const first = await executeUsersDirectoryRead(client, query)
    const second = await executeUsersDirectoryRead(client, query)
    const from = client.calls.filter((call) => call[0] === 'from')
    assert.equal(from.length, 2)
    assert.deepEqual(from[0], ['from', 'profiles'])
    assert.deepEqual(client.calls[1], [
      'select',
      'user_id, email, display_name, role, status, created_at, last_seen_at',
      { count: 'exact' },
    ])
    assert.deepEqual(client.calls[2], ['order', 'created_at', { ascending: false }])
    assert.deepEqual(client.calls[3], ['order', 'user_id', { ascending: true }])
    assert.deepEqual(client.calls[4], ['range', 99980, 99999])
    assert.equal(first.count, 100001)
    assert.equal(second.count, 100001)
    assert.equal(first.rows.length, 1)
  })

  test('Seite und Helfer fangen den Schutz nicht, die Tabelle behaelt die Aktionsgrenzen', () => {
    const page = readFileSync(new URL('../../app/(admin)/admin/users/page.tsx', import.meta.url), 'utf8')
    const helper = readFileSync(new URL('./users-directory-query.ts', import.meta.url), 'utf8')
    const navigation = readFileSync(new URL('./users-search-navigation.ts', import.meta.url), 'utf8')
    const presentation = readFileSync(new URL('./users-directory-presentation.ts', import.meta.url), 'utf8')
    const table = readFileSync(new URL('../../components/admin/UsersTable.tsx', import.meta.url), 'utf8')
    const actions = readFileSync(new URL('../../app/(admin)/admin/users/actions.ts', import.meta.url), 'utf8')
    assert.equal(page.includes('try'), false)
    assert.equal(helper.includes('try'), false)
    assert.equal(navigation.includes("from '@/app/(admin)/admin/users/actions'"), false)
    assert.equal(presentation.includes("from '@/app/(admin)/admin/users/actions'"), false)
    assert.equal(helper.includes("from '@/app/(admin)/admin/users/actions'"), false)
    assert.match(page, /requireAdminPage\(\{ surface: 'users', capability: 'konten-verwalten' \}\)/)
    assert.match(page, /PAGE_SIZE = 20/)
    assert.equal(USERS_DIRECTORY_PAGE_SIZE, 20)
    assert.match(page, /created_at:\s*profilErstellt\(r\?\.created_at\)/)
    assert.match(page, /last_seen_at:\s*r\?\.last_seen_at\s*\?\?\s*null/)
    assert.equal(page.includes('new Date().toISOString()'), false)
    assert.match(table, /function editable\(u: UserRow\)/)
    assert.match(table, /async function changeRole\(u: UserRow, role: Role\)/)
    assert.match(table, /async function toggleBan\(u: UserRow\)/)
    assert.match(table, /assignable/)
    assert.match(table, /u\.user_id === actorId/)
    assert.match(table, /rankOf\(actorRole\) > rankOf\(u\.role\)/)
    assert.match(actions, /export async function setUserRole/)
    assert.match(actions, /export async function setUserStatus/)
  })
})
