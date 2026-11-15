import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { refundJournalCursor, refundJournalUrl } from './refund-journal'

const row = (n: number) => ({ id: `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`, payment_id: 'payment-A', amount_chf: '9007199254740993.01', reason: null, created_at: '2026-11-15T10:00:00.123456+00:00' })
type Result = { clients: number; guards: { surface: string; capability: string }[]; calls: { url: string; method: string; signal: boolean }[]; status: number; cache: string; body: Record<string, unknown> }
function run(input: Record<string, unknown>): Result {
  const result = spawnSync(process.execPath, ['--import', './scripts/server-only-test-register.mjs', '--import', './scripts/admin-refund-journal/route-preload.mjs', '--import', 'tsx', './scripts/admin-refund-journal/route-harness.ts'], {
    encoding: 'utf8', timeout: 20_000, env: { ...process.env, REFUND_JOURNAL_PROOF: JSON.stringify(input) },
  })
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`)
  return JSON.parse(result.stdout.trim())
}

test('the actual journal route guards denied callers before creating a client', () => {
  for (const gateStatus of [401, 403]) {
    const result = run({ gateStatus })
    assert.equal(result.status, gateStatus)
    assert.deepEqual(result.guards, [{ surface: 'api/payments/refunds', capability: 'betrieb-lesen' }])
    assert.equal(result.clients, 0); assert.deepEqual(result.calls, [])
    assert.match(result.cache, /private, no-store/)
  }
})

test('invalid input and cross-filter cursor reach no session client or transport', () => {
  for (const query of ['?cursor=bad', '?payment_id=A&payment_id=B', refundJournalUrl('payment-B', refundJournalCursor(row(50), 'payment-A')).split('/refunds')[1]]) {
    const result = run({ query })
    assert.equal(result.status, 400); assert.equal(result.clients, 0); assert.deepEqual(result.calls, [])
  }
})

test('actual SDK transport selects exact decimal text and deterministic bounded keysets', () => {
  const cursor = refundJournalCursor(row(50), 'payment-A')
  const result = run({ query: refundJournalUrl('payment-A', cursor).split('/refunds')[1], rows: Array.from({ length: 26 }, (_, n) => row(49 - n)) })
  assert.equal(result.status, 200)
  assert.equal(result.clients, 1); assert.equal(result.calls.length, 1)
  const url = new URL(result.calls[0].url)
  assert.equal(url.searchParams.get('select'), 'id,payment_id,amount_chf::text,reason,created_at')
  assert.equal(url.searchParams.get('order'), 'created_at.desc,id.desc')
  assert.equal(url.searchParams.get('limit'), '26')
  assert.equal(url.searchParams.get('payment_id'), 'eq.payment-A')
  assert.equal(url.searchParams.get('or'), `(created_at.lt.${row(50).created_at},and(created_at.eq.${row(50).created_at},id.lt.${row(50).id}))`)
  assert.equal(result.calls[0].method, 'GET'); assert.equal(result.calls[0].signal, true)
  const rows = result.body.rows as ReturnType<typeof row>[]
  assert.equal(rows.length, 25); assert.equal(rows[0].amount_chf, '9007199254740993.01')
  assert.equal(result.body.next_cursor, refundJournalCursor(row(25), 'payment-A'))
  assert.match(result.cache, /private, no-store/)
})

test('exact payment IDs with operator characters remain an equality value', () => {
  const filter = 'invoice,(status.eq.paid) + ä'
  const result = run({ query: refundJournalUrl(filter).split('/refunds')[1], rows: [] })
  assert.equal(result.status, 200)
  const params = new URL(result.calls[0].url).searchParams
  assert.equal(params.get('payment_id'), `eq.${filter}`)
  assert.equal(params.has('or'), false)
})

test('empty or exactly full last pages have no invented next page', () => {
  for (const rows of [[], Array.from({ length: 25 }, (_, n) => row(50 - n))]) {
    const result = run({ rows })
    assert.equal(result.status, 200); assert.deepEqual(result.body.rows, rows); assert.equal(result.body.next_cursor, null)
  }
})

test('DB permission loss is a denied API response and never a successful empty page', () => {
  for (const dbStatus of [401, 403, 400]) {
    const result = run({ dbStatus, responseBody: { code: '42501', message: 'private schema detail must not leak' } })
    assert.equal(result.status, dbStatus === 401 ? 401 : 403)
    assert.equal('rows' in result.body, false)
    assert.doesNotMatch(JSON.stringify(result.body), /private schema detail/)
  }
})

test('transient, malformed and invalid data remain failures with no fabricated rows', () => {
  const cases: [Record<string, unknown>, number][] = [
    [{ transportFailure: true }, 503], [{ dbStatus: 503, responseBody: { code: '08006', message: 'private host detail' } }, 503],
    [{ rows: [{ ...row(1), amount_chf: 1.01 }] }, 500], [{ rows: [row(1), row(2)] }, 500],
    ...[408, 429, 502, 503, 504].flatMap(dbStatus => [
      [{ dbStatus, responseBody: { code: 'PGRST003', message: 'private host detail' } }, 503] as [Record<string, unknown>, number],
      [{ dbStatus, responseBody: { message: 'private host detail' } }, 503] as [Record<string, unknown>, number],
    ]),
  ]
  for (const [input, status] of cases) {
    const result = run(input)
    assert.equal(result.status, status); assert.equal('rows' in result.body, false)
    assert.doesNotMatch(JSON.stringify(result.body), /private host detail/)
  }
})
