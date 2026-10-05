import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  beginTransactionRead,
  isTransactionStatus,
  transactionFilterSnapshot,
  transactionFiltersMatch,
  transactionListQuery,
  transactionReadIsCurrent,
  type TransactionReadClock,
} from '@/lib/admin/payments/transaction-read-filter'

describe('transaction list read filter', () => {
  test('all omits status and a blank search omits q', () => {
    const snapshot = transactionFilterSnapshot('   ', 'all')
    assert.deepEqual(snapshot, { q: '', status: 'all' })
    assert.equal(transactionListQuery(snapshot, null), '/api/admin/payments/list')
  })

  test('status change is carried by that snapshot, not by a previous one', () => {
    const previous = transactionFilterSnapshot('', 'all')
    const paid = transactionFilterSnapshot('  ada@example.test  ', 'paid')
    const failed = transactionFilterSnapshot(paid.q, 'failed')

    assert.equal(transactionListQuery(previous, null), '/api/admin/payments/list')
    assert.equal(
      transactionListQuery(paid, null),
      '/api/admin/payments/list?q=ada%40example.test&status=paid',
    )
    assert.equal(
      transactionListQuery(failed, null),
      '/api/admin/payments/list?q=ada%40example.test&status=failed',
    )
    assert.equal(transactionListQuery(paid, null).includes('status=all'), false)
    assert.notEqual(transactionListQuery(paid, null), transactionListQuery(failed, null))
  })

  test('pagination keeps the committed snapshot and adds only the cursor', () => {
    const committed = transactionFilterSnapshot('ada@example.test', 'refunded')
    const cursor = '2026-09-01T10:00:00.000Z'
    const path = transactionListQuery(committed, cursor)
    const params = new URL(path, 'http://127.0.0.1').searchParams

    assert.equal(params.get('q'), 'ada@example.test')
    assert.equal(params.get('status'), 'refunded')
    assert.equal(params.get('cursor'), cursor)
  })

  test('a first page does not keep a previous cursor', () => {
    const snapshot = transactionFilterSnapshot('bao@example.test', 'pending')
    const params = new URL(transactionListQuery(snapshot, null), 'http://127.0.0.1').searchParams
    assert.equal(params.get('cursor'), null)
    assert.equal(params.get('status'), 'pending')
    assert.equal(params.get('q'), 'bao@example.test')
  })

  test('known statuses are the select values', () => {
    for (const status of ['all', 'paid', 'pending', 'failed', 'refunded']) {
      assert.equal(isTransactionStatus(status), true)
    }
    assert.equal(isTransactionStatus('succeeded'), false)
  })

  test('filter equality is the trimmed snapshot', () => {
    const left = transactionFilterSnapshot(' ada ', 'paid')
    const right = transactionFilterSnapshot('ada', 'paid')
    const other = transactionFilterSnapshot('ada', 'failed')
    assert.equal(transactionFiltersMatch(left, right), true)
    assert.equal(transactionFiltersMatch(left, other), false)
  })

  test('an older in-flight read is not authoritative after a newer one starts', () => {
    const clock: TransactionReadClock = { latest: 0 }
    const older = beginTransactionRead(clock)
    const newer = beginTransactionRead(clock)

    assert.equal(transactionReadIsCurrent(clock, older), false)
    assert.equal(transactionReadIsCurrent(clock, newer), true)
    assert.equal(transactionReadIsCurrent(clock, 0), false)

    const third = beginTransactionRead(clock)
    assert.equal(transactionReadIsCurrent(clock, newer), false)
    assert.equal(transactionReadIsCurrent(clock, third), true)
  })
})
