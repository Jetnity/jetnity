import {
  isViatorAgeBand,
  type ViatorAgeBand,
  type ViatorAgeBandRule,
  type ViatorPaxMixItem,
} from '@/lib/providers/viator/activities/contracts'
import { asRecord } from '@/lib/providers/viator/activities/guard'

function integerIn(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) return null
  return value
}

export function readViatorAgeBands(value: unknown): { ok: true; bands: ViatorAgeBandRule[] } | { ok: false; reason: 'malformed_age_bands' } {
  if (value == null) return { ok: true, bands: [] }
  if (!Array.isArray(value)) return { ok: false, reason: 'malformed_age_bands' }
  const bands: ViatorAgeBandRule[] = []
  for (const item of value) {
    const record = asRecord(item)
    if (!record || typeof record.ageBand !== 'string' || !isViatorAgeBand(record.ageBand)) {
      return { ok: false, reason: 'malformed_age_bands' }
    }
    const startAge = integerIn(record.startAge, 0, 120)
    const endAge = integerIn(record.endAge, 0, 120)
    const minTravelersPerBooking = integerIn(record.minTravelersPerBooking, 0, 99)
    const maxTravelersPerBooking = integerIn(record.maxTravelersPerBooking, 0, 99)
    if (
      startAge == null ||
      endAge == null ||
      minTravelersPerBooking == null ||
      maxTravelersPerBooking == null ||
      startAge > endAge ||
      minTravelersPerBooking > maxTravelersPerBooking
    ) {
      return { ok: false, reason: 'malformed_age_bands' }
    }
    if (bands.some((band) => band.ageBand === record.ageBand)) return { ok: false, reason: 'malformed_age_bands' }
    bands.push({
      ageBand: record.ageBand,
      startAge,
      endAge,
      minTravelersPerBooking,
      maxTravelersPerBooking,
    })
  }
  return { ok: true, bands }
}

export function paxMatchesAgeBands(
  paxMix: readonly ViatorPaxMixItem[],
  bands: readonly ViatorAgeBandRule[],
): { ok: true } | { ok: false; reason: 'nonmatching_age_band' | 'band_limit' | 'unit_pricing_mix' | 'missing_product_age_bands' } {
  if (bands.length === 0) return { ok: false, reason: 'missing_product_age_bands' }
  const travelerOnly = bands.length === 1 && bands[0]?.ageBand === 'TRAVELER'
  const requestedTraveler = paxMix.some((item) => item.ageBand === 'TRAVELER')
  if (requestedTraveler && (!travelerOnly || paxMix.length !== 1)) {
    return { ok: false, reason: 'unit_pricing_mix' }
  }
  if (!requestedTraveler && travelerOnly) return { ok: false, reason: 'nonmatching_age_band' }

  for (const item of paxMix) {
    const band = bands.find((candidate) => candidate.ageBand === item.ageBand)
    if (!band) return { ok: false, reason: 'nonmatching_age_band' }
    if (item.numberOfTravelers < band.minTravelersPerBooking) return { ok: false, reason: 'band_limit' }
    if (item.numberOfTravelers > band.maxTravelersPerBooking) return { ok: false, reason: 'band_limit' }
  }

  for (const band of bands) {
    if (band.minTravelersPerBooking <= 0) continue
    const item = paxMix.find((candidate) => candidate.ageBand === band.ageBand)
    if (!item || item.numberOfTravelers < band.minTravelersPerBooking) return { ok: false, reason: 'band_limit' }
  }

  return { ok: true }
}

export function ageBandName(value: string): ViatorAgeBand | null {
  return isViatorAgeBand(value) ? value : null
}
