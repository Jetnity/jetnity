import {
  ADMIN_ACCOUNT_COUNTS_DEFINITION_VERSION,
  ADMIN_ACCOUNT_COUNTS_RESULT_KEYS,
  ADMIN_ACCOUNT_COUNTS_WINDOW_MS,
  type AdminAccountCountsMeasures,
} from '@/lib/admin/account-counts-delivery/contract'

const DECIMAL_COUNT = /^\d+$/
const EXPLICIT_ZONE = /(?:Z|[+-]\d{2}:\d{2})$/

export type AdminAccountCountsParseResult =
  | { ok: true; measures: AdminAccountCountsMeasures }
  | { ok: false; reason: 'invalid' }

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function exactDecimalCount(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (!DECIMAL_COUNT.test(value)) return null
  if (value.length > 1 && value.startsWith('0')) return null
  return value
}

function explicitZoneInstant(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  if (!EXPLICIT_ZONE.test(value)) return null
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return null
  return value
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

  const present = exactDecimalCount(row.present_registered_accounts)
  const windowed = exactDecimalCount(row.created_in_prior_30_days)
  const measuredAt = explicitZoneInstant(row.measured_at)
  const windowStart = explicitZoneInstant(row.window_start)
  if (!present || !windowed || !measuredAt || !windowStart) {
    return { ok: false, reason: 'invalid' }
  }

  let presentN: bigint
  let windowN: bigint
  try {
    presentN = BigInt(present)
    windowN = BigInt(windowed)
  } catch {
    return { ok: false, reason: 'invalid' }
  }
  if (presentN < 1n || windowN > presentN) return { ok: false, reason: 'invalid' }

  const measuredMs = Date.parse(measuredAt)
  const windowMs = Date.parse(windowStart)
  if (windowMs >= measuredMs || measuredMs - windowMs !== ADMIN_ACCOUNT_COUNTS_WINDOW_MS) {
    return { ok: false, reason: 'invalid' }
  }

  return {
    ok: true,
    measures: {
      presentRegisteredAccounts: present,
      createdInPrior30Days: windowed,
      measuredAt,
      windowStart,
      definitionVersion: ADMIN_ACCOUNT_COUNTS_DEFINITION_VERSION,
    },
  }
}
