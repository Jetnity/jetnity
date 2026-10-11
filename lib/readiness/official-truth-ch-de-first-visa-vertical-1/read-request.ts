import 'server-only'

import { z } from 'zod'
import { credentialOptionsAus } from '@/lib/readiness/traveller-kontext'
import type { Trip } from '@/types/trips'

const ref = z.string().min(1).max(64).regex(/^[a-zA-Z0-9:_-]+$/)
const requestSchema = z.object({
  travellerClientRef: ref,
  credentialOptionRef: z.string().min(1).max(129).regex(/^[a-zA-Z0-9:_-]+$/),
  destinationCountryCode: z.literal('DE'),
  requirementType: z.literal('visa'),
}).strict()

function date(value: unknown): value is string {
  if (typeof value !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function distinct(refs: readonly string[]): boolean {
  return new Set(refs).size === refs.length
}

/** Selection is a lookup request, never an authorization or ordinary-passport
 * assertion. The Trip must come from the existing Auth/RLS loader. This only
 * validates representable prerequisites; `eligible` is deliberately absent.
 * No residence/issuer inference, first-option default or legacy synthesis.
 */
export function chDeVisaReadRequestPruefen(reise: Trip, input: unknown) {
  const fail = (reason: string) => Object.freeze({ ok: false as const, reason })
  if (input === undefined) return fail('explicit_credential_selection_required')
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) return fail('invalid_read_request')
  const fields = Object.getOwnPropertyDescriptors(input)
  const keys = Reflect.ownKeys(fields)
  // Inspect descriptors, never invoke request getters or traverse foreign DTOs.
  if (keys.some(key => typeof key !== 'string' || !('value' in fields[key]!))) return fail('invalid_read_request')
  if (keys.length !== 4 || keys.some(key => !(typeof key === 'string' && Object.hasOwn(requestSchema.shape, key)))) {
    return fail('unsupported_read_request')
  }
  const values = Object.values(fields).map(field => field.value)
  if (values.some(value => typeof value !== 'string' || value.length > 1_024)) return fail('invalid_read_request')
  const parsed = requestSchema.safeParse(Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value])))
  if (!parsed.success) return fail('unsupported_read_request')
  const request = parsed.data
  const party = reise.party
  // These are work bounds, not new domain limits. No truncation on overflow.
  if (!party || party.length === 0 || party.length > 32) return fail('traveller_context_unavailable')
  if (!distinct(party.map(t => t.clientRef))) return fail('ambiguous_traveller_reference')
  const traveller = party.find(t => t.clientRef === request.travellerClientRef)
  if (!traveller) return fail('traveller_not_in_trip')
  if (traveller.documents.length > 32 || traveller.citizenships.length > 32) return fail('credential_context_bound')
  if (!distinct(traveller.documents.map(d => d.clientRef)) || !distinct(traveller.citizenships.map(c => c.clientRef))) {
    return fail('ambiguous_credential_reference')
  }
  if (!traveller.citizenships.some(c => c.countryCode === 'CH')) return fail('ch_citizenship_required')
  const options = credentialOptionsAus(traveller).filter(o => o.optionRef === request.credentialOptionRef)
  if (options.length !== 1 || !options[0]!.document) return fail('selected_credential_not_in_traveller')
  const document = options[0]!.document!
  if (document.documentType !== 'passport' || document.issuingCountryCode !== 'CH'
    || document.citizenshipCountryCode !== 'CH') return fail('linked_ch_passport_required')
  if (!date(reise.startDate) || !date(reise.endDate) || reise.endDate < reise.startDate) return fail('explicit_travel_dates_required')
  if (!reise.stages.length || reise.stages.length > 64 || reise.stages.some(s => s.countryCode !== 'DE')) {
    return fail('single_de_destination_required')
  }
  return Object.freeze({ ok: true as const })
}
