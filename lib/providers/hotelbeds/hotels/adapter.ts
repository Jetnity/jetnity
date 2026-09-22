// lib/providers/hotelbeds/hotels/adapter.ts
//
// Pure offline fixture → HotelOption mapping. No HTTP, env, secrets,
// factory registration, live constructor, or commercial-truth mint.
// Incoming fields are read explicitly and never spread.

import { createHash } from 'node:crypto'

import type { GeoPunkt, HotelOption } from '@/lib/hotels/domain'
import { hotelOptionLesen } from '@/lib/hotels/schema'
import {
  HBX_HOTELS_FIXTURE_SCHEMA,
  HBX_HOTELS_PRICING_MODELS,
  HBX_HOTELS_PROVIDER_ID,
  type HbxHotelsFixtureSearchResult,
  type HbxHotelsPricingModel,
} from '@/lib/providers/hotelbeds/hotels/contracts'

const MAX_PREIS = 9_999_999_999.99
const MAX_NAME = 160
const MAX_ZIMMER_NAME = 120
const MAX_RATE_KEY = 4_096
const MAX_ID = 120
const TAG_MS = 86_400_000

/**
 * Same ISO-4217 rule as `lib/hotels/schema.ts` (`waehrung`) and
 * `commercialWaehrungLesen`: trim, uppercase, exactly three A–Z letters.
 * This adapter does not import commercial-provenance.
 */
const WAEHRUNG = /^[A-Z]{3}$/

/**
 * Offset-bearing ISO instant, same surface pattern as `commercialAugenblickMs`,
 * plus real calendar/time reconstruction so Date.parse cannot roll 2026-02-30.
 */
const ISO_AUGENBLICK =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/

type GelesenerKontext = {
  nights: number
  requestedCurrency: string
  pricingModel: HbxHotelsPricingModel
}

function leeresErgebnis(): HbxHotelsFixtureSearchResult {
  return {
    providerId: HBX_HOTELS_PROVIDER_ID,
    evidenceMode: 'fixture',
    options: [],
    partial: false,
  }
}

function alsObjekt(wert: unknown): Record<string, unknown> | null {
  if (wert == null || typeof wert !== 'object' || Array.isArray(wert)) return null
  return wert as Record<string, unknown>
}

function kalenderDatum(wert: unknown): { jahr: number; monat: number; tag: number } | null {
  if (typeof wert !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return null
  const [jahr, monat, tag] = wert.split('-').map(Number)
  const geprueft = new Date(Date.UTC(jahr, monat - 1, tag))
  if (
    geprueft.getUTCFullYear() !== jahr ||
    geprueft.getUTCMonth() !== monat - 1 ||
    geprueft.getUTCDate() !== tag
  ) {
    return null
  }
  return { jahr, monat, tag }
}

function naechteAus(checkIn: unknown, checkOut: unknown): number | null {
  const ankunft = kalenderDatum(checkIn)
  const abreise = kalenderDatum(checkOut)
  if (!ankunft || !abreise) return null
  const ms =
    Date.UTC(abreise.jahr, abreise.monat - 1, abreise.tag) -
    Date.UTC(ankunft.jahr, ankunft.monat - 1, ankunft.tag)
  const naechte = ms / TAG_MS
  if (!Number.isInteger(naechte) || naechte <= 0) return null
  return naechte
}

function waehrungLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const code = wert.trim().toUpperCase()
  return WAEHRUNG.test(code) ? code : null
}

function kontextLesen(wert: unknown): GelesenerKontext | null {
  const objekt = alsObjekt(wert)
  if (!objekt) return null
  const nights = naechteAus(objekt.checkIn, objekt.checkOut)
  const requestedCurrency = waehrungLesen(objekt.requestedCurrency)
  const pricingModel = objekt.pricingModel
  if (
    nights == null ||
    requestedCurrency == null ||
    typeof pricingModel !== 'string' ||
    !(HBX_HOTELS_PRICING_MODELS as readonly string[]).includes(pricingModel)
  ) {
    return null
  }
  return {
    nights,
    requestedCurrency,
    pricingModel: pricingModel as HbxHotelsPricingModel,
  }
}

function hotelCodeLesen(wert: unknown): string | null {
  if (typeof wert === 'number') {
    if (!Number.isSafeInteger(wert) || wert <= 0) return null
    return String(wert)
  }
  if (typeof wert === 'string') {
    const trimmed = wert.trim()
    if (!/^[1-9]\d{0,15}$/.test(trimmed)) return null
    const n = Number(trimmed)
    if (!Number.isSafeInteger(n) || n <= 0) return null
    return String(n)
  }
  return null
}

function nichtLeer(wert: unknown, max: number): string | null {
  if (typeof wert !== 'string') return null
  const trimmed = wert.trim()
  if (!trimmed || trimmed.length > max) return null
  return trimmed
}

/**
 * Opaque rateKey: reject blank/whitespace-only/overlong keys, but never trim
 * before hashing or identity. Leading/trailing bytes are part of the key.
 */
function rateKeyLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  if (wert.length === 0 || wert.length > MAX_RATE_KEY) return null
  if (wert.trim() === '') return null
  return wert
}

function punktLesen(lat: unknown, lon: unknown): GeoPunkt | null {
  if (typeof lat !== 'number' || typeof lon !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null
  return { lat, lon }
}

function betragLesen(wert: unknown): number | null {
  if (typeof wert !== 'number' || !Number.isFinite(wert) || wert < 0 || wert > MAX_PREIS) {
    return null
  }
  return Math.round(wert * 100) / 100
}

function retrievedAtLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const match = ISO_AUGENBLICK.exec(wert)
  if (!match) return null
  const jahr = Number(match[1])
  const monat = Number(match[2])
  const tag = Number(match[3])
  const stunde = Number(match[4])
  const minute = Number(match[5])
  const sekunde = Number(match[6])
  if (stunde > 23 || minute > 59 || sekunde > 59) return null
  const kalender = new Date(Date.UTC(jahr, monat - 1, tag))
  if (
    kalender.getUTCFullYear() !== jahr ||
    kalender.getUTCMonth() !== monat - 1 ||
    kalender.getUTCDate() !== tag
  ) {
    return null
  }
  if (match[7] !== 'Z') {
    const vorzeichen = match[7][0]
    const [offsetStunden, offsetMinuten] = match[7].slice(1).split(':').map(Number)
    if (
      (vorzeichen !== '+' && vorzeichen !== '-') ||
      offsetStunden > 14 ||
      offsetMinuten > 59
    ) {
      return null
    }
  }
  if (!Number.isFinite(Date.parse(wert))) return null
  return wert
}

function zimmerNameLesen(roomName: unknown, roomCode: unknown): string | null {
  const name = typeof roomName === 'string' ? roomName.trim() : ''
  if (name) return name.length <= MAX_ZIMMER_NAME ? name : null
  const code = typeof roomCode === 'string' ? roomCode.trim() : ''
  if (code) return code.length <= MAX_ZIMMER_NAME ? code : null
  return null
}

function steuernLesen(wert: unknown): boolean | null {
  return typeof wert === 'boolean' ? wert : null
}

function displayPreis(
  offer: Record<string, unknown>,
  pricingModel: HbxHotelsPricingModel,
): number | null {
  if (pricingModel === 'unknown') return null
  if (offer.packaging !== false) return null
  if (pricingModel === 'net' && offer.hotelMandatory !== true) return null
  return betragLesen(offer.sellingRate)
}

function opaqueRateDigest(rateKey: string): string {
  return createHash('sha256').update(rateKey, 'utf8').digest('hex').slice(0, 32)
}

function optionBauen(
  offer: unknown,
  kontext: GelesenerKontext,
): HotelOption | null {
  const roh = alsObjekt(offer)
  if (!roh) return null
  const hotelCode = hotelCodeLesen(roh.hotelCode)
  const hotelName = nichtLeer(roh.hotelName, MAX_NAME)
  const rateKey = rateKeyLesen(roh.rateKey)
  const punkt = punktLesen(roh.latitude, roh.longitude)
  const currency = waehrungLesen(roh.currency)
  const retrievedAt = retrievedAtLesen(roh.retrievedAt)
  if (!hotelCode || !hotelName || !rateKey || !punkt || !currency || !retrievedAt) {
    return null
  }
  if (currency !== kontext.requestedCurrency) return null
  const preisGesamt = displayPreis(roh, kontext.pricingModel)
  if (preisGesamt == null) return null
  const preisProNacht = preisGesamt / kontext.nights
  if (!Number.isFinite(preisProNacht) || preisProNacht < 0 || preisProNacht > MAX_PREIS) {
    return null
  }
  const zimmerName = zimmerNameLesen(roh.roomName, roh.roomCode)
  if (
    typeof roh.roomName === 'string' &&
    roh.roomName.trim() &&
    roh.roomName.trim().length > MAX_ZIMMER_NAME
  ) {
    return null
  }
  if (
    zimmerName == null &&
    typeof roh.roomCode === 'string' &&
    roh.roomCode.trim() &&
    roh.roomCode.trim().length > MAX_ZIMMER_NAME
  ) {
    return null
  }

  const id = `hbx:${hotelCode}:${opaqueRateDigest(rateKey)}`
  if (id.length > MAX_ID) return null

  const gebaut: HotelOption = {
    id,
    provider: HBX_HOTELS_PROVIDER_ID,
    externalRef: hotelCode,
    name: hotelName,
    punkt,
    quartierName: null,
    adresse: null,
    sterne: null,
    bewertung: null,
    bewertungenAnzahl: null,
    preisGesamt,
    preisProNacht: Math.round(preisProNacht * 100) / 100,
    preisWaehrung: currency,
    steuernEnthalten: steuernLesen(roh.taxesAllIncluded),
    stornierbar: null,
    stornierungBis: null,
    fruehstueckEnthalten: null,
    zimmerName,
  }

  return hotelOptionLesen(gebaut)
}

function normalisieren(input: unknown, context: unknown): HbxHotelsFixtureSearchResult {
  const kontext = kontextLesen(context)
  const fixture = alsObjekt(input)
  if (!kontext || !fixture) return leeresErgebnis()
  if (fixture.schema !== HBX_HOTELS_FIXTURE_SCHEMA) return leeresErgebnis()
  if (!Array.isArray(fixture.offers)) return leeresErgebnis()

  const options: HotelOption[] = []
  const gesehen = new Set<string>()
  let verworfen = 0

  for (const offer of fixture.offers) {
    const option = optionBauen(offer, kontext)
    if (!option || gesehen.has(option.id)) {
      verworfen += 1
      continue
    }
    gesehen.add(option.id)
    options.push(option)
  }

  return {
    providerId: HBX_HOTELS_PROVIDER_ID,
    evidenceMode: 'fixture',
    options,
    partial: options.length > 0 && verworfen > 0,
  }
}

/**
 * Offline-only adapter foundation. Invalid top-level/context/schema returns
 * an empty fixture result instead of throwing. Never a live/trusted constructor.
 */
export function hbxHotelsFixtureNormalisieren(
  input: unknown,
  context: unknown,
): HbxHotelsFixtureSearchResult {
  try {
    return normalisieren(input, context)
  } catch {
    return leeresErgebnis()
  }
}
