// lib/flights/duffel/mapping.ts
//
// Duffel-Angebot → interne FlugOption. Zeiten bleiben lokale Zeichenketten.
//
// Frei von Next und `fetch`.

import {
  FLUG_PROVIDER_DUFFEL,
  type FlugKabine,
  type FlugOption,
  type FlugSegment,
  type FlugTeilstrecke,
} from '@/lib/flights/domain'
import {
  duffelAngebotSchema,
  duffelIataAus,
  type DuffelAngebot,
} from '@/lib/flights/duffel/antwort'
import { betragAusText, dauerAusIso, ortszeitAus } from '@/lib/flights/zeit'

const KABINE_VON_DUFFEL: Record<string, FlugKabine> = {
  economy: 'economy',
  premium_economy: 'premium_economy',
  business: 'business',
  first: 'first',
}

function airlineName(code: string, name: string | undefined): string {
  const gelesen = name?.trim()
  return gelesen && gelesen.length > 0 ? gelesen.slice(0, 80) : code
}

function segmentMappen(
  roh: DuffelAngebot['slices'][number]['segments'][number],
): FlugSegment | null {
  const abflug = ortszeitAus(roh.departing_at)
  const ankunft = ortszeitAus(roh.arriving_at)
  if (!abflug || !ankunft) return null
  const dauer = roh.duration ? dauerAusIso(roh.duration) : null
  const airline = roh.marketing_carrier.iata_code
  const operating = roh.operating_carrier?.iata_code ?? null
  const nummer = roh.marketing_carrier_flight_number.replace(/\s+/g, '')
  if (!nummer) return null

  return {
    origin: duffelIataAus(roh.origin),
    destination: duffelIataAus(roh.destination),
    departureDate: abflug.date,
    departureTime: abflug.time,
    arrivalDate: ankunft.date,
    arrivalTime: ankunft.time,
    airline,
    airlineName: airlineName(airline, roh.marketing_carrier.name),
    operatingAirline: operating,
    operatingAirlineName: operating
      ? airlineName(operating, roh.operating_carrier?.name)
      : null,
    flightNumber: `${airline}${nummer}`.slice(0, 10),
    durationMinutes: dauer ?? 1,
  }
}

function kabineAus(angebot: DuffelAngebot): FlugKabine | null {
  const cabin = angebot.slices[0]?.segments[0]?.passengers?.[0]?.cabin_class
  if (!cabin) return null
  return KABINE_VON_DUFFEL[cabin.toLowerCase()] ?? null
}

function gepackAus(angebot: DuffelAngebot): { checkedBags: number | null } | null {
  const mengen: number[] = []
  for (const slice of angebot.slices) {
    for (const segment of slice.segments) {
      for (const passagier of segment.passengers ?? []) {
        for (const gepack of passagier.baggages ?? []) {
          if (gepack.type === 'checked' && typeof gepack.quantity === 'number') {
            mengen.push(gepack.quantity)
          }
        }
      }
    }
  }
  if (mengen.length === 0) return null
  return { checkedBags: Math.min(...mengen) }
}

function refundableAus(angebot: DuffelAngebot): boolean | null {
  const wert = angebot.conditions?.refund_before_departure?.allowed
  return typeof wert === 'boolean' ? wert : null
}

function brandedAus(angebot: DuffelAngebot): string | null {
  const name = angebot.slices[0]?.fare_brand_name?.trim()
  return name ? name.slice(0, 40) : null
}

function referenz(angebot: DuffelAngebot, option: Omit<FlugOption, 'id' | 'externalRef'>): string {
  const erstes = option.legs[0]?.segments[0]
  const kern = [
    angebot.id,
    erstes?.origin ?? '',
    erstes?.destination ?? '',
    erstes?.departureDate?.replaceAll('-', '') ?? '',
    erstes?.flightNumber ?? '',
    String(option.priceAmount),
    option.priceCurrency,
  ].join(':')
  return kern.slice(0, 200)
}

export function duffelAngebotMappen(roh: unknown): FlugOption | null {
  const geprueft = duffelAngebotSchema.safeParse(roh)
  if (!geprueft.success) return null
  const angebot = geprueft.data

  const preis = betragAusText(angebot.total_amount)
  if (preis === null) return null

  const legs: FlugTeilstrecke[] = []
  for (const slice of angebot.slices) {
    const segments: FlugSegment[] = []
    for (const segment of slice.segments) {
      const gemappt = segmentMappen(segment)
      if (!gemappt) return null
      segments.push(gemappt)
    }
    const dauer = dauerAusIso(slice.duration)
    if (dauer === null) return null
    legs.push({
      segments,
      durationMinutes: dauer,
      stops: Math.max(0, segments.length - 1),
    })
  }

  const owner = angebot.owner?.iata_code
  const leit = owner && /^[A-Z0-9]{2,3}$/.test(owner) ? owner : legs[0]?.segments[0]?.airline
  if (!leit) return null

  const ohneIds = {
    provider: FLUG_PROVIDER_DUFFEL,
    airline: leit,
    airlineName: airlineName(leit, angebot.owner?.name ?? legs[0]?.segments[0]?.airlineName),
    legs,
    durationMinutes: legs.reduce((summe, bein) => summe + bein.durationMinutes, 0),
    stops: legs.reduce((summe, bein) => summe + bein.stops, 0),
    priceAmount: preis,
    priceCurrency: angebot.total_currency,
    cabin: kabineAus(angebot),
    baggage: gepackAus(angebot),
    refundable: refundableAus(angebot),
    fare: (() => {
      const branded = brandedAus(angebot)
      return branded ? { brandedFare: branded } : null
    })(),
  }

  const externalRef = referenz(angebot, ohneIds)
  return {
    ...ohneIds,
    id: `duffel:${externalRef}`.slice(0, 120),
    externalRef,
  }
}

export function duffelAntwortMappen(roh: unknown): {
  options: FlugOption[]
  partial: boolean
  invalid: boolean
} {
  if (!roh || typeof roh !== 'object') return { options: [], partial: false, invalid: true }
  const satz = roh as { data?: { offers?: unknown } }
  if (!Array.isArray(satz.data?.offers)) return { options: [], partial: false, invalid: true }

  const options: FlugOption[] = []
  let verworfen = 0
  for (const eintrag of satz.data.offers) {
    const option = duffelAngebotMappen(eintrag)
    if (option) options.push(option)
    else verworfen += 1
  }

  return {
    options,
    partial: options.length > 0 && verworfen > 0,
    invalid: options.length === 0 && satz.data.offers.length > 0 && verworfen === satz.data.offers.length,
  }
}
