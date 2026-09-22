import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { parseAdminAccountCountsPayload } from '@/lib/admin/account-counts-delivery/parser'
import {
  ADMIN_ACCOUNT_COUNTS_DEFINITION_VERSION,
  ADMIN_ACCOUNT_COUNTS_MAX_SIGNED_BIGINT_TEXT,
  ADMIN_ACCOUNT_COUNTS_WINDOW_MS,
  ADMIN_ACCOUNT_COUNTS_WINDOW_US,
} from '@/lib/admin/account-counts-delivery/contract'

const VALID = {
  present_registered_accounts: '12',
  created_in_prior_30_days: '0',
  measured_at: '2026-09-22T12:00:00.000Z',
  window_start: '2026-08-23T12:00:00.000Z',
  definition_version: ADMIN_ACCOUNT_COUNTS_DEFINITION_VERSION,
}

describe('Admin account-counts lossless parser', () => {
  test('accepts one valid row including a genuine window of 0', () => {
    const parsed = parseAdminAccountCountsPayload(VALID)
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.equal(parsed.measures.presentRegisteredAccounts, '12')
    assert.equal(parsed.measures.createdInPrior30Days, '0')
    assert.equal(parsed.measures.measuredAt, VALID.measured_at)
    assert.equal(parsed.measures.windowStart, VALID.window_start)
  })

  test('preserves canonical decimal strings above MAX_SAFE_INTEGER and the signed-bigint maximum', () => {
    const huge = '9007199254740993'
    const parsed = parseAdminAccountCountsPayload({
      ...VALID,
      present_registered_accounts: huge,
      created_in_prior_30_days: huge,
    })
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.equal(parsed.measures.presentRegisteredAccounts, huge)
    assert.equal(parsed.measures.createdInPrior30Days, huge)
    assert.equal(Number(huge) > Number.MAX_SAFE_INTEGER, true)
    assert.notEqual(String(Number(huge)), huge)

    const max = parseAdminAccountCountsPayload({
      ...VALID,
      present_registered_accounts: ADMIN_ACCOUNT_COUNTS_MAX_SIGNED_BIGINT_TEXT,
      created_in_prior_30_days: ADMIN_ACCOUNT_COUNTS_MAX_SIGNED_BIGINT_TEXT,
    })
    assert.equal(max.ok, true)
    if (!max.ok) return
    assert.equal(max.measures.presentRegisteredAccounts, ADMIN_ACCOUNT_COUNTS_MAX_SIGNED_BIGINT_TEXT)
  })

  test('accepts leap-day, non-UTC offset and equal-microsecond 720-hour windows', () => {
    const leap = parseAdminAccountCountsPayload({
      ...VALID,
      measured_at: '2024-02-29T15:30:00+01:00',
      window_start: '2024-01-30T15:30:00+01:00',
    })
    assert.equal(leap.ok, true)
    if (leap.ok) {
      assert.equal(leap.measures.measuredAt, '2024-02-29T15:30:00+01:00')
      assert.equal(leap.measures.windowStart, '2024-01-30T15:30:00+01:00')
    }

    assert.equal(ADMIN_ACCOUNT_COUNTS_WINDOW_US, BigInt(ADMIN_ACCOUNT_COUNTS_WINDOW_MS) * 1000n)

    const micros = parseAdminAccountCountsPayload({
      ...VALID,
      measured_at: '2026-09-22T12:00:00.123456Z',
      window_start: '2026-08-23T12:00:00.123456Z',
    })
    assert.equal(micros.ok, true)
    if (micros.ok) {
      assert.equal(micros.measures.measuredAt, '2026-09-22T12:00:00.123456Z')
    }
  })

  test('rejects impossible calendar dates, excess precision and English month-name timestamps', () => {
    assert.equal(
      parseAdminAccountCountsPayload({
        ...VALID,
        measured_at: '2026-02-30T12:00:00Z',
        window_start: '2026-01-31T12:00:00Z',
      }).ok,
      false,
    )
    assert.equal(
      parseAdminAccountCountsPayload({
        ...VALID,
        measured_at: '2026-09-22T12:00:00.000001Z',
        window_start: '2026-08-23T12:00:00.000000Z',
      }).ok,
      false,
    )
    assert.equal(
      parseAdminAccountCountsPayload({
        ...VALID,
        measured_at: '2026-09-22T12:00:00.0000001Z',
        window_start: '2026-08-23T12:00:00.0000001Z',
      }).ok,
      false,
    )
    assert.equal(
      parseAdminAccountCountsPayload({
        ...VALID,
        measured_at: 'September 22, 2026 12:00:00Z',
        window_start: 'August 23, 2026 12:00:00Z',
      }).ok,
      false,
    )
    assert.equal(
      parseAdminAccountCountsPayload({
        ...VALID,
        measured_at: '2026-09-22 12:00:00Z',
      }).ok,
      false,
    )
    assert.equal(
      parseAdminAccountCountsPayload({
        ...VALID,
        measured_at: '2026-09-22T12:00:00+99:00',
      }).ok,
      false,
    )
  })

  test('rejects counts outside the nonnegative signed-bigint producer range before conversion', () => {
    assert.equal(
      parseAdminAccountCountsPayload({
        ...VALID,
        present_registered_accounts: '9223372036854775808',
      }).ok,
      false,
    )
    assert.equal(
      parseAdminAccountCountsPayload({
        ...VALID,
        present_registered_accounts: '1'.repeat(40),
      }).ok,
      false,
    )
  })

  test('rejects numbers, missing/multirow/extra fields, bad version and precision-losing shapes', () => {
    assert.equal(parseAdminAccountCountsPayload([]).ok, false)
    assert.equal(parseAdminAccountCountsPayload([VALID, VALID]).ok, false)
    assert.equal(parseAdminAccountCountsPayload({ ...VALID, extra: 'no' }).ok, false)
    assert.equal(
      parseAdminAccountCountsPayload({
        ...VALID,
        definition_version: 'jetnity.admin-account-counts.v0',
      }).ok,
      false,
    )
    assert.equal(
      parseAdminAccountCountsPayload({
        ...VALID,
        present_registered_accounts: 12,
      }).ok,
      false,
    )
    assert.equal(
      parseAdminAccountCountsPayload({
        ...VALID,
        present_registered_accounts: 9007199254740993,
      }).ok,
      false,
    )
    assert.equal(
      parseAdminAccountCountsPayload({
        ...VALID,
        present_registered_accounts: '0',
      }).ok,
      false,
    )
    assert.equal(
      parseAdminAccountCountsPayload({
        ...VALID,
        created_in_prior_30_days: '13',
      }).ok,
      false,
    )
    assert.equal(
      parseAdminAccountCountsPayload({
        ...VALID,
        present_registered_accounts: '01',
      }).ok,
      false,
    )
  })

  test('rejects timestamps without an explicit zone or a wrong 720-hour interval', () => {
    assert.equal(
      parseAdminAccountCountsPayload({
        ...VALID,
        measured_at: '2026-09-22T12:00:00',
      }).ok,
      false,
    )
    assert.equal(
      parseAdminAccountCountsPayload({
        ...VALID,
        window_start: '2026-08-23T11:00:00.000Z',
      }).ok,
      false,
    )
    assert.equal(
      parseAdminAccountCountsPayload({
        ...VALID,
        window_start: '2026-09-23T12:00:00.000Z',
      }).ok,
      false,
    )
  })
})
