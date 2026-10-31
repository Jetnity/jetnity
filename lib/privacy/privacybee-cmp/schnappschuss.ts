// Normalize the documented PrivacyBee read API. Event payloads are not the grant.

import {
  CMP_CATEGORIES,
  CMP_NECESSARY_CATEGORIES,
  CMP_OPTIONAL_CATEGORIES,
  type CmpCategory,
} from '@/lib/privacy/privacybee-cmp/vertrag'

export type CmpConsentMap = Readonly<Record<CmpCategory, boolean>>

export type CmpRead =
  | {
      readonly status: 'unusable'
      readonly reason:
        | 'missing_api'
        | 'malformed'
        | 'unknown_category'
        | 'missing_category'
        | 'non_boolean'
        | 'inconsistent_read'
        | 'inconsistent_necessary'
        | 'no_explicit_consent'
    }
  | {
      readonly status: 'explicit'
      readonly hasExplicitConsent: true
      readonly consents: CmpConsentMap
      readonly optionalSatisfied: boolean
    }

type ReadApi = {
  getConsent: (category: string) => unknown
  getAllConsents: () => unknown
  hasExplicitConsent: () => unknown
}

function isReadApi(value: unknown): value is ReadApi {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.getConsent === 'function' &&
    typeof record.getAllConsents === 'function' &&
    typeof record.hasExplicitConsent === 'function'
  )
}

export function readCmpApi(api: unknown): CmpRead {
  if (!isReadApi(api)) return { status: 'unusable', reason: 'missing_api' }

  let all: unknown
  let explicit: unknown
  try {
    all = api.getAllConsents()
    explicit = api.hasExplicitConsent()
  } catch {
    return { status: 'unusable', reason: 'malformed' }
  }

  if (!all || typeof all !== 'object' || Array.isArray(all)) {
    return { status: 'unusable', reason: 'malformed' }
  }

  const record = all as Record<string, unknown>
  for (const key of Object.keys(record)) {
    if (!(CMP_CATEGORIES as readonly string[]).includes(key)) {
      return { status: 'unusable', reason: 'unknown_category' }
    }
  }

  const consents = {} as Record<CmpCategory, boolean>
  for (const category of CMP_CATEGORIES) {
    if (!Object.prototype.hasOwnProperty.call(record, category)) {
      return { status: 'unusable', reason: 'missing_category' }
    }
    const value = record[category]
    if (typeof value !== 'boolean') return { status: 'unusable', reason: 'non_boolean' }
    let single: unknown
    try {
      single = api.getConsent(category)
    } catch {
      return { status: 'unusable', reason: 'malformed' }
    }
    if (single !== value) return { status: 'unusable', reason: 'inconsistent_read' }
    consents[category] = value
  }

  for (const category of CMP_NECESSARY_CATEGORIES) {
    if (consents[category] !== true) return { status: 'unusable', reason: 'inconsistent_necessary' }
  }

  if (typeof explicit !== 'boolean') return { status: 'unusable', reason: 'malformed' }
  if (explicit !== true) return { status: 'unusable', reason: 'no_explicit_consent' }

  const optionalSatisfied = CMP_OPTIONAL_CATEGORIES.every((category) => consents[category] === true)
  return {
    status: 'explicit',
    hasExplicitConsent: true,
    consents: Object.freeze(consents),
    optionalSatisfied,
  }
}

/** `categories` on ready is an inventory, not a grant list. */
export function readyCategoriesAreInventory(detail: unknown): boolean {
  if (!detail || typeof detail !== 'object') return false
  const categories = (detail as { categories?: unknown }).categories
  return Array.isArray(categories) && categories.every((entry) => typeof entry === 'string')
}
