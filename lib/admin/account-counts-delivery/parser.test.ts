import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { parseAdminAccountCountsPayload } from '@/lib/admin/account-counts-delivery/parser'
import { ADMIN_ACCOUNT_COUNTS_DEFINITION_VERSION } from '@/lib/admin/account-counts-delivery/contract'

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

  test('preserves canonical decimal strings above MAX_SAFE_INTEGER', () => {
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
