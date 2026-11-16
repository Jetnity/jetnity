import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  appendRefundJournalPage, parseRefundJournalPage, parseRefundJournalQuery, parseRefundJournalRows,
  refundJournalAmount, refundJournalCursor, refundJournalFilter, refundJournalTime, refundJournalUrl,
  type RefundJournalRow,
} from './refund-journal'

const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const row = (n = 30, time = '2026-11-15T10:00:00.123456+00:00'): RefundJournalRow => ({
  id: id(n), payment_id: 'payment-A', amount_chf: '10.2300', reason: null, created_at: time,
})
const query = { paymentId: 'payment-A', cursor: null }
const page = (rows: RefundJournalRow[], more = false) => ({
  rows, payment_id: 'payment-A', loaded_at: '2026-11-15T11:00:00Z',
  next_cursor: more ? refundJournalCursor(rows.at(-1)!, 'payment-A') : null,
})

test('journal preserves original microseconds and binds each cursor to its exact filter', () => {
  const token = refundJournalCursor(row(), 'payment-A')
  const params = new URL(refundJournalUrl('payment-A', token), 'https://journal.invalid').searchParams
  assert.deepEqual(parseRefundJournalQuery(params), { paymentId: 'payment-A', cursor: { id: id(30), created_at: row().created_at } })
  assert.match(token, /123456\+00:00/)
  params.set('payment_id', 'payment-B')
  assert.throws(() => parseRefundJournalQuery(params))
  assert.deepEqual(parseRefundJournalQuery(new URLSearchParams()), { paymentId: '', cursor: null })
})

test('invalid, duplicate and oversized query values are rejected without constructing a query', () => {
  for (const params of [
    new URLSearchParams('payment_id=A&payment_id=B'), new URLSearchParams('cursor=x&cursor=y'),
    new URLSearchParams({ cursor: '' }), new URLSearchParams({ cursor: '{' }),
    new URLSearchParams({ payment_id: 'x'.repeat(201) }), new URLSearchParams({ payment_id: 'a\nb' }),
    new URLSearchParams({ cursor: 'x'.repeat(1801) }),
  ]) assert.throws(() => parseRefundJournalQuery(params))
  for (const [time, uuid] of [
    ['2026-02-30T10:00:00Z', id(30)], ['2026-11-15T24:00:00Z', id(30)],
    ['2026-11-15T10:00:00.1234567Z', id(30)], ['2026-11-15', id(30)],
    ['2026-11-15T10:00:00Z),id.gt.0', id(30)], ['2026-11-15T10:00:00Z', 'bad-uuid'],
  ]) assert.throws(() => parseRefundJournalQuery(new URLSearchParams({ cursor: JSON.stringify([1, '', time, uuid]) })))
  assert.equal(refundJournalFilter('  invoice,(eq.test) + ä  '), 'invoice,(eq.test) + ä')
})

test('the keyset includes tied timestamps and smaller microseconds without truncation', () => {
  const first = Array.from({ length: 25 }, (_, n) => row(50 - n))
  const before = parseRefundJournalPage(page(first, true), query)
  const nextQuery = parseRefundJournalQuery(new URL(refundJournalUrl('payment-A', before.next_cursor), 'https://journal.invalid').searchParams)
  const next = parseRefundJournalPage(page([row(25), row(99, '2026-11-15T10:00:00.123455+00:00')]), nextQuery)
  const merged = appendRefundJournalPage(before, next)
  assert.equal(merged.rows.length, 27)
  assert.equal(new Set(merged.rows.map(r => r.id)).size, 27)
  assert.equal(merged.rows.at(-1)!.created_at, '2026-11-15T10:00:00.123455+00:00')
  assert.equal(merged.next_cursor, null)
  assert.equal(appendRefundJournalPage(before, page([])).rows.length, 25)
})

test('wrong order, duplicate identities, wrong filter and invalid pages never become empty success', () => {
  for (const values of [null, {}, [row(1), row(2)], [row(), row()], [{ ...row(), amount_chf: 10.23 }],
    [{ ...row(), reason: 1 }], [{ ...row(), payment_id: 'payment-B' }], [{ ...row(), created_at: 'invalid' }]]) {
    assert.throws(() => parseRefundJournalRows(values, query))
  }
  assert.throws(() => parseRefundJournalPage(page([row()], true), query))
  assert.throws(() => parseRefundJournalPage({ ...page([]), payment_id: 'payment-B' }, query))
  assert.throws(() => parseRefundJournalPage({ ...page([]), loaded_at: null }, query))
  const first = parseRefundJournalPage(page(Array.from({ length: 25 }, (_, n) => row(50 - n)), true), query)
  assert.throws(() => appendRefundJournalPage(first, page([row(26)])))
  assert.throws(() => appendRefundJournalPage(first, { ...page([row(1)]), payment_id: 'payment-B' }))
})

test('equivalent timezone representations retain their microsecond/UUID ordering', () => {
  assert.equal(parseRefundJournalRows([row(2, '2026-11-15T11:00:00.123456+01:00'), row(1)], query).length, 2)
  assert.throws(() => parseRefundJournalRows([row(1), row(2, '2026-11-15T11:00:00.123456+01:00')], query))
  assert.match(refundJournalTime('2026-11-15T11:00:00+01:00'), /10:00:00 UTC/)
})

test('decimal formatting never rounds large or malformed legacy amounts', () => {
  assert.deepEqual(refundJournalAmount('10.2300'), { text: '10.23 CHF', valid: true })
  assert.deepEqual(refundJournalAmount('0.01'), { text: '0.01 CHF', valid: true })
  assert.equal(refundJournalAmount('9007199254740993.01').text.replaceAll('’', '').replaceAll("'", ''), '9007199254740993.01 CHF')
  for (const raw of ['0', '0.00', '-1.00', '10.2301', 'NaN', 'Infinity', '1e3', ' 1.00', '9'.repeat(161)]) {
    assert.deepEqual(refundJournalAmount(raw), { text: raw, valid: false })
    assert.equal(parseRefundJournalRows([{ ...row(), amount_chf: raw }], query)[0].amount_chf, raw)
  }
})
