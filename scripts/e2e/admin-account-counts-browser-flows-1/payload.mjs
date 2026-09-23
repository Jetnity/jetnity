#!/usr/bin/env node
// Faithful JS port of lib/admin/account-counts-delivery/parser.ts.
// Used by the browser consumer so node --test does not need tsx.

export const DEFINITION_VERSION = 'jetnity.admin-account-counts.v1'
export const RESULT_KEYS = Object.freeze([
  'present_registered_accounts',
  'created_in_prior_30_days',
  'measured_at',
  'window_start',
  'definition_version',
])
export const WINDOW_HOURS = 720
export const WINDOW_US = BigInt(WINDOW_HOURS) * 3600n * 1_000_000n
export const MAX_SIGNED_BIGINT = 9223372036854775807n
export const MAX_SIGNED_BIGINT_TEXT = '9223372036854775807'

const DECIMAL_COUNT = /^\d+$/
const PG_TIMESTAMPTZ =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})$/
const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function asRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function daysInMonth(year, month) {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return DAYS_IN_MONTH[month] ?? 0
}

function exactDecimalCount(value, minimum) {
  if (typeof value !== 'string') return null
  if (!DECIMAL_COUNT.test(value)) return null
  if (value.length > 1 && value.startsWith('0')) return null
  if (value.length > MAX_SIGNED_BIGINT_TEXT.length) return null
  if (value.length === MAX_SIGNED_BIGINT_TEXT.length && value > MAX_SIGNED_BIGINT_TEXT) {
    return null
  }
  let parsed
  try {
    parsed = BigInt(value)
  } catch {
    return null
  }
  if (parsed < minimum || parsed > MAX_SIGNED_BIGINT) return null
  return value
}

function parseExplicitZoneOffsetUs(offset) {
  if (offset === 'Z') return 0n
  const sign = offset.startsWith('-') ? -1n : 1n
  const hours = Number(offset.slice(1, 3))
  const minutes = Number(offset.slice(4, 6))
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null
  if (hours > 15) return null
  if (minutes > 59) return null
  return sign * (BigInt(hours) * 3600n + BigInt(minutes) * 60n) * 1_000_000n
}

export function parsePgTimestamptz(value) {
  if (typeof value !== 'string' || value.trim() === '') return null
  const match = PG_TIMESTAMPTZ.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])
  const fraction = match[7] ?? ''
  const offset = match[8]
  if (month < 1 || month > 12) return null
  if (day < 1 || day > daysInMonth(year, month)) return null
  if (hour > 23 || minute > 59 || second > 59) return null
  const offsetUs = parseExplicitZoneOffsetUs(offset)
  if (offsetUs === null) return null
  const utcMs = Date.UTC(year, month - 1, day, hour, minute, second)
  if (!Number.isFinite(utcMs)) return null
  const roundTrip = new Date(utcMs)
  if (
    roundTrip.getUTCFullYear() !== year ||
    roundTrip.getUTCMonth() + 1 !== month ||
    roundTrip.getUTCDate() !== day ||
    roundTrip.getUTCHours() !== hour ||
    roundTrip.getUTCMinutes() !== minute ||
    roundTrip.getUTCSeconds() !== second
  ) {
    return null
  }
  const fractionUs = BigInt(fraction.padEnd(6, '0') || '0')
  const localUs = BigInt(utcMs) * 1000n + fractionUs
  return { original: value, utcUs: localUs - offsetUs }
}

function oneRow(payload) {
  if (Array.isArray(payload)) {
    if (payload.length !== 1) return null
    return asRecord(payload[0])
  }
  return asRecord(payload)
}

export function parseAdminAccountCountsPayload(payload) {
  const row = oneRow(payload)
  if (!row) return { ok: false, reason: 'invalid' }
  const keys = Object.keys(row)
  if (keys.length !== RESULT_KEYS.length) return { ok: false, reason: 'invalid' }
  if (RESULT_KEYS.some((key) => !keys.includes(key))) return { ok: false, reason: 'invalid' }
  if (row.definition_version !== DEFINITION_VERSION) return { ok: false, reason: 'invalid' }
  const present = exactDecimalCount(row.present_registered_accounts, 1n)
  const windowed = exactDecimalCount(row.created_in_prior_30_days, 0n)
  const measuredAt = parsePgTimestamptz(row.measured_at)
  const windowStart = parsePgTimestamptz(row.window_start)
  if (!present || !windowed || !measuredAt || !windowStart) return { ok: false, reason: 'invalid' }
  if (BigInt(windowed) > BigInt(present)) return { ok: false, reason: 'invalid' }
  if (windowStart.utcUs >= measuredAt.utcUs) return { ok: false, reason: 'invalid' }
  if (measuredAt.utcUs - windowStart.utcUs !== WINDOW_US) return { ok: false, reason: 'invalid' }
  return {
    ok: true,
    measures: {
      presentRegisteredAccounts: present,
      createdInPrior30Days: windowed,
      measuredAt: measuredAt.original,
      windowStart: windowStart.original,
      definitionVersion: DEFINITION_VERSION,
    },
  }
}

export function isPermittedSuccessShape(payload) {
  return parseAdminAccountCountsPayload(payload).ok === true
}
