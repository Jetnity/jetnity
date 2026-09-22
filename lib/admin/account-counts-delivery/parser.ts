import {
  ADMIN_ACCOUNT_COUNTS_DEFINITION_VERSION,
  ADMIN_ACCOUNT_COUNTS_MAX_SIGNED_BIGINT,
  ADMIN_ACCOUNT_COUNTS_MAX_SIGNED_BIGINT_TEXT,
  ADMIN_ACCOUNT_COUNTS_RESULT_KEYS,
  ADMIN_ACCOUNT_COUNTS_WINDOW_US,
  type AdminAccountCountsMeasures,
} from '@/lib/admin/account-counts-delivery/contract'

const DECIMAL_COUNT = /^\d+$/
const PG_TIMESTAMPTZ =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})$/

const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const

export type AdminAccountCountsParseResult =
  | { ok: true; measures: AdminAccountCountsMeasures }
  | { ok: false; reason: 'invalid' }

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return DAYS_IN_MONTH[month] ?? 0
}

function exactDecimalCount(value: unknown, minimum: bigint): string | null {
  if (typeof value !== 'string') return null
  if (!DECIMAL_COUNT.test(value)) return null
  if (value.length > 1 && value.startsWith('0')) return null
  if (value.length > ADMIN_ACCOUNT_COUNTS_MAX_SIGNED_BIGINT_TEXT.length) return null
  if (
    value.length === ADMIN_ACCOUNT_COUNTS_MAX_SIGNED_BIGINT_TEXT.length &&
    value > ADMIN_ACCOUNT_COUNTS_MAX_SIGNED_BIGINT_TEXT
  ) {
    return null
  }
  let parsed: bigint
  try {
    parsed = BigInt(value)
  } catch {
    return null
  }
  if (parsed < minimum || parsed > ADMIN_ACCOUNT_COUNTS_MAX_SIGNED_BIGINT) return null
  return value
}

function parseExplicitZoneOffsetUs(offset: string): bigint | null {
  if (offset === 'Z') return 0n
  const sign = offset.startsWith('-') ? -1n : 1n
  const hours = Number(offset.slice(1, 3))
  const minutes = Number(offset.slice(4, 6))
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null
  if (hours > 15) return null
  if (minutes > 59) return null
  return sign * (BigInt(hours) * 3600n + BigInt(minutes) * 60n) * 1_000_000n
}

function parsePgTimestamptz(value: unknown): { original: string; utcUs: bigint } | null {
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

function oneRow(payload: unknown): Record<string, unknown> | null {
  if (Array.isArray(payload)) {
    if (payload.length !== 1) return null
    return asRecord(payload[0])
  }
  return asRecord(payload)
}

export function parseAdminAccountCountsPayload(payload: unknown): AdminAccountCountsParseResult {
  const row = oneRow(payload)
  if (!row) return { ok: false, reason: 'invalid' }

  const keys = Object.keys(row)
  if (keys.length !== ADMIN_ACCOUNT_COUNTS_RESULT_KEYS.length) return { ok: false, reason: 'invalid' }
  if (ADMIN_ACCOUNT_COUNTS_RESULT_KEYS.some((key) => !keys.includes(key))) {
    return { ok: false, reason: 'invalid' }
  }

  if (row.definition_version !== ADMIN_ACCOUNT_COUNTS_DEFINITION_VERSION) {
    return { ok: false, reason: 'invalid' }
  }

  const present = exactDecimalCount(row.present_registered_accounts, 1n)
  const windowed = exactDecimalCount(row.created_in_prior_30_days, 0n)
  const measuredAt = parsePgTimestamptz(row.measured_at)
  const windowStart = parsePgTimestamptz(row.window_start)
  if (!present || !windowed || !measuredAt || !windowStart) {
    return { ok: false, reason: 'invalid' }
  }

  const presentN = BigInt(present)
  const windowN = BigInt(windowed)
  if (windowN > presentN) return { ok: false, reason: 'invalid' }

  if (windowStart.utcUs >= measuredAt.utcUs) return { ok: false, reason: 'invalid' }
  if (measuredAt.utcUs - windowStart.utcUs !== ADMIN_ACCOUNT_COUNTS_WINDOW_US) {
    return { ok: false, reason: 'invalid' }
  }

  return {
    ok: true,
    measures: {
      presentRegisteredAccounts: present,
      createdInPrior30Days: windowed,
      measuredAt: measuredAt.original,
      windowStart: windowStart.original,
      definitionVersion: ADMIN_ACCOUNT_COUNTS_DEFINITION_VERSION,
    },
  }
}
