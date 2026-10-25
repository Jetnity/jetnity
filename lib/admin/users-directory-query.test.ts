import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { textSuchfilter } from '@/lib/api/suchfilter'
import {
  USERS_DIRECTORY_MAX_PAGE,
  USERS_DIRECTORY_PAGE_SIZE,
  USERS_DIRECTORY_Q_MAX,
  decideUsersDirectoryRead,
  executeUsersDirectoryRead,
  normalizeDirectoryCount,
  usersDirectoryLiveMatchesQuery,
  usersDirectoryQueryKey,
  usersDirectoryRange,
  type UsersDirectoryClient,
  type UsersDirectoryQuery,
  type UsersDirectoryResponse,
} from './users-directory-query'

type Call = unknown[]

function spy(response: UsersDirectoryResponse) {
  const calls: Call[] = []
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
  const client: UsersDirectoryClient & { calls: Call[] } = {
    calls,
    from(table: string) {
      calls.push(['from', table])
      return chain
    },
  }
  return client
}

const empty: UsersDirectoryResponse = { data: [], count: 0, error: null, status: 200 }

function queryOf(raw: unknown): UsersDirectoryQuery {
  const decision = decideUsersDirectoryRead(raw)
  assert.equal(decision.kind, 'query')
  if (decision.kind !== 'query') throw new Error('unreachable')
  return decision.query
}

describe('Admin-Benutzerverzeichnis Abfrage', () => {
  test('fehlende Parameter sind Seite 1 ohne Filter', () => {
    assert.deepEqual(queryOf(undefined), { q: '', page: 1, role: null, status: null })
    assert.deepEqual(queryOf({}), { q: '', page: 1, role: null, status: null })
    const key = usersDirectoryQueryKey(queryOf({}))
    assert.equal(key, '1\n\n\n')
  })

  test('leere und umgebende Zeichen sind kein Filter, ein einzelnes Array ist skalar', () => {
    assert.deepEqual(queryOf({ q: '  anna  ', role: '  ', status: [''], page: ['2'] }), {
      q: 'anna',
      page: 2,
      role: null,
      status: null,
    })
  })

  test('kanonische Rolle und Status werden exakt uebernommen, Admin nicht', () => {
    assert.deepEqual(queryOf({ role: 'operator', status: 'pending' }), {
      q: '',
      page: 1,
      role: 'operator',
      status: 'pending',
    })
    const admin = decideUsersDirectoryRead({ role: 'Admin' })
    assert.equal(admin.kind, 'invalid')
    if (admin.kind === 'invalid') assert.equal(admin.reason, 'invalid-role')
  })

  test('ungueltige Seiten bauen keinen Bereich, 5000 schon', () => {
    for (const page of ['', ' ', '0', '01', '1.5', '1e2', '+1', '-1', 'NaN', 'Infinity', '5001']) {
      const decision = decideUsersDirectoryRead({ page, q: 'anna', source: 'support' })
      assert.equal(decision.kind, 'invalid', page)
      if (decision.kind !== 'invalid') continue
      assert.equal('range' in decision, false)
      assert.equal(decision.recovery.includes('page=5001'), false)
      const params = new URLSearchParams(decision.recovery.split('?')[1])
      assert.equal(params.get('page'), '1')
      assert.equal(params.get('q'), 'anna')
      assert.equal(params.get('source'), 'support')
      const nummer = Number(params.get('page'))
      assert.equal(nummer >= 1 && nummer <= USERS_DIRECTORY_MAX_PAGE, true)
    }
    assert.deepEqual(usersDirectoryRange(5000), { from: 99980, to: 99999 })
    assert.equal(decideUsersDirectoryRead({ page: '5000' }).kind, 'query')
  })

  test('der erste Fehler in der Reihenfolge q, page, role, status bleibt der Grund', () => {
    const decision = decideUsersDirectoryRead({
      q: 'x'.repeat(USERS_DIRECTORY_Q_MAX + 1),
      page: '0',
      role: 'Admin',
      status: 'nope',
    })
    assert.equal(decision.kind, 'invalid')
    if (decision.kind === 'invalid') assert.equal(decision.reason, 'oversized-q')
  })

  test('wiederholte und nicht-skalare Parameter sind ungueltig, auch bei gleichen Werten', () => {
    assert.equal(decideUsersDirectoryRead({ q: ['anna', 'anna'] }).kind, 'invalid')
    assert.equal(decideUsersDirectoryRead(new URLSearchParams('page=1&page=1')).kind, 'invalid')
    const zahl = decideUsersDirectoryRead({ page: 2 })
    assert.equal(zahl.kind, 'invalid')
    if (zahl.kind === 'invalid') assert.equal(zahl.reason, 'non-scalar')
    const rolle = decideUsersDirectoryRead({ role: ['admin', 'admin'] })
    if (rolle.kind === 'invalid') assert.equal(rolle.reason, 'repeated')
  })

  test('eine gueltige Abfrage schreibt Seite 20, beide Sortierungen, die Spalten und eq nur fuer kanonische Werte', async () => {
    const client = spy(empty)
    const query = queryOf({ q: '', page: '3', role: 'admin', status: 'active' })
    await executeUsersDirectoryRead(client, query)
    assert.deepEqual(client.calls[0], ['from', 'profiles'])
    assert.deepEqual(client.calls[1], [
      'select',
      'user_id, email, display_name, role, status, created_at, last_seen_at',
      { count: 'exact' },
    ])
    assert.deepEqual(client.calls[2], ['order', 'created_at', { ascending: false }])
    assert.deepEqual(client.calls[3], ['order', 'user_id', { ascending: true }])
    assert.deepEqual(client.calls[4], ['range', 40, 59])
    assert.deepEqual(client.calls[5], ['eq', 'role', 'admin'])
    assert.deepEqual(client.calls[6], ['eq', 'status', 'active'])
    assert.equal(client.calls.some((call) => call[0] === 'or'), false)
    assert.equal(USERS_DIRECTORY_PAGE_SIZE, 20)
  })

  test('textSuchfilter ist das or-Argument fuer Komma, Anfuehrung, Prozent, Unterstrich und mueller', async () => {
    const q = 'a,b"100%_müller'
    const client = spy({ data: [], count: 1, error: null })
    await executeUsersDirectoryRead(client, { q, page: 1, role: null, status: null })
    const or = client.calls.find((call) => call[0] === 'or')
    assert.equal(or?.[1], textSuchfilter(['display_name', 'email'], q))
  })

  test('Zaehler bleiben wahr: null, 0 und 100001', () => {
    assert.equal(normalizeDirectoryCount(null), null)
    assert.equal(normalizeDirectoryCount(undefined), null)
    assert.equal(normalizeDirectoryCount('20'), null)
    assert.equal(normalizeDirectoryCount(1.5), null)
    assert.equal(normalizeDirectoryCount(Number.NaN), null)
    assert.equal(normalizeDirectoryCount(Number.POSITIVE_INFINITY), null)
    assert.equal(normalizeDirectoryCount(-1), null)
    assert.equal(normalizeDirectoryCount(0), 0)
    assert.equal(normalizeDirectoryCount(100001), 100001)
  })

  test('ein Fehler und Daten ohne Fehler werden nicht zu einer leeren Liste, eine leere Antwort bleibt leer', async () => {
    const fehler = await executeUsersDirectoryRead(spy({ data: null, error: { message: 'permission denied', code: '42501' }, status: 403 }), {
      q: '',
      page: 1,
      role: null,
      status: null,
    })
    assert.equal(fehler.error?.message, 'permission denied')
    assert.equal(fehler.count, null)
    const leer = await executeUsersDirectoryRead(spy({ data: null, error: null, status: 200 }), {
      q: '',
      page: 1,
      role: null,
      status: null,
    })
    assert.equal(leer.error?.message, 'Die Abfrage lieferte weder Daten noch einen Fehler.')
    const keine = await executeUsersDirectoryRead(spy(empty), { q: '', page: 1, role: null, status: null })
    assert.equal(keine.error, null)
    assert.equal(keine.count, 0)
    assert.deepEqual(keine.rows, [])
  })

  test('eine ungueltige Entscheidung enthaelt keinen Bereich', () => {
    const decision = decideUsersDirectoryRead({ page: '5001' })
    assert.equal(decision.kind, 'invalid')
    assert.equal('range' in decision, false)
  })

  test('dieselbe gueltige Abfrage trifft auch ohne Seite und mit umgebender Seite, ungueltige Formen nicht', () => {
    const first = { q: '', page: 1, role: null, status: null }
    const anna = { q: 'anna', page: 1, role: null, status: null }
    assert.equal(usersDirectoryLiveMatchesQuery(new URLSearchParams(''), first), true)
    assert.equal(usersDirectoryLiveMatchesQuery(new URLSearchParams('q=anna'), anna), true)
    assert.equal(usersDirectoryLiveMatchesQuery(new URLSearchParams('page=1'), first), true)
    const padded = new URLSearchParams()
    padded.append('page', ' 1 ')
    assert.equal(usersDirectoryLiveMatchesQuery(padded, first), true)
    assert.equal(usersDirectoryLiveMatchesQuery(new URLSearchParams('page=1&page=1'), first), false)
    assert.equal(usersDirectoryLiveMatchesQuery(new URLSearchParams('page=5001'), first), false)
    assert.equal(usersDirectoryLiveMatchesQuery(new URLSearchParams('page=nope'), first), false)
    assert.equal(usersDirectoryLiveMatchesQuery(new URLSearchParams('page=2'), first), false)
    assert.equal(usersDirectoryLiveMatchesQuery(new URLSearchParams('q=berta'), anna), false)
    assert.equal(usersDirectoryLiveMatchesQuery({ page: ['1', '2'] }, first), false)
    assert.equal(usersDirectoryLiveMatchesQuery({ page: 1 }, first), false)
  })
})
