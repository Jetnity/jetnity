// lib/trips/abbildung.ts
//
// Zwischen den Zeilen der Datenbank und dem Modell der Anwendung.
//
// Die Umschrift ist absichtlich langweilig: snake_case zu camelCase, sonst
// nichts. Jede Umrechnung, die hier stattfände – ein anderer Wertebereich, ein
// anderes Datumsformat, eine berechnete Spalte –, wäre eine zweite Wahrheit
// neben dem Schema.
//
// Zwei Stellen weichen bewusst ab:
//
//   · `numeric` kommt bei PostgREST als Zeichenkette an, wenn der Wert die
//     Genauigkeit von `double` überschreiten könnte. Beträge werden deshalb
//     durch `Number()` gelesen und nicht durchgereicht.
//   · `time` kommt als `HH:MM:SS`. Die Anwendung führt Ortszeiten ohne
//     Sekunden; `HH:MM` ist das, was das Formular schreibt und liest.
//
// Frei von Supabase-Importen, damit der Test keine Datenbank braucht.

import {
  TRIP_INTERESTS,
  TRIP_ITEM_KINDS,
  TRIP_PACES,
  TRIP_STATUSES,
  type Reisegraph,
  type Trip,
  type TripDay,
  type TripInterest,
  type TripItem,
  type TripItemKind,
  type TripPace,
  type TripStage,
  type TripStatus,
} from '@/types/trips'
import { itineraryAusMetadata } from '@/lib/route/metadata'
import type { ReiseNutzlast } from '@/lib/trips/schema'
import { buchungsquelleLesen, buchungsstatusLesen, kannBuchungMarkieren } from '@/lib/trips/buchung'
import {
  leereMobilitaet,
  mobilityEvidenceLesen,
  mobilityModeLesen,
  mobilitaetNormalisieren,
} from '@/lib/trips/mobilitaet-felder'
import {
  leereMietwagen,
  mietwagenNormalisieren,
  rentalEvidenceLesen,
  transmissionLesen,
  vehicleClassLesen,
} from '@/lib/trips/mietwagen-felder'
import { readinessAusZeilen, type ReadinessZeile } from '@/lib/readiness/persistenz'
import { partyAusZeilen, type TravellerZeile } from '@/lib/readiness/reisende'

/** Nur die Spalten, die diese Datei liest. So bleibt sie von der Generierung unabhängig. */
export type ReiseZeile = {
  id: string
  client_ref: string | null
  title: string
  origin: string | null
  origin_place_id?: string | null
  start_date: string | null
  end_date: string | null
  travellers: number
  currency: string
  budget_amount: number | string | null
  status: string
  pace: string
  interests: string[] | null
  travel_wish: string | null
  revision: number | string | null
  last_mutation_id: string | null
  created_at: string
  updated_at: string
}

export type EtappeZeile = {
  id: string
  position: number
  name: string
  country_code: string | null
  arrival_date: string | null
  departure_date: string | null
  latitude: number | string | null
  longitude: number | string | null
  place_id?: string | null
  created_at: string
}

export type TagZeile = {
  id: string
  stage_id: string | null
  day_index: number
  day_date: string | null
  title: string | null
}

export type PunktZeile = {
  id: string
  day_id: string | null
  stage_id: string | null
  kind: string
  title: string
  note: string | null
  position: number
  starts_on: string | null
  starts_at: string | null
  ends_on: string | null
  ends_at: string | null
  price_amount: number | string | null
  price_currency: string | null
  provider: string | null
  external_ref: string | null
  booking_url: string | null
  booking_status?: string | null
  booking_source?: string | null
  booking_confirmed_at?: string | null
  mobility_mode?: string | null
  origin_place_id?: string | null
  destination_place_id?: string | null
  origin_name?: string | null
  destination_name?: string | null
  connection_ref?: string | null
  mobility_changes?: number | string | null
  mobility_evidence?: string | null
  rental_supplier?: string | null
  vehicle_class?: string | null
  transmission?: string | null
  rental_evidence?: string | null
  metadata?: unknown
  created_at: string
}

function zahl(wert: number | string | null): number | null {
  if (wert === null) return null
  const gelesen = typeof wert === 'number' ? wert : Number(wert)
  return Number.isFinite(gelesen) ? gelesen : null
}

/** `HH:MM:SS` → `HH:MM`. Eine bereits kurze Angabe bleibt, wie sie ist. */
function uhrzeit(wert: string | null): string | null {
  if (!wert) return null
  return /^\d{2}:\d{2}/.test(wert) ? wert.slice(0, 5) : null
}

/**
 * Liest einen Wert aus einem festen Bereich.
 *
 * Die Datenbank sichert den Bereich per CHECK zu; die generierten Typen sagen
 * nur `string`. Statt das mit einer Behauptung zu überbrücken, fällt ein
 * unbekannter Wert auf die Vorgabe zurück – so bleibt eine Reise lesbar, auch
 * wenn eine künftige Migration einen Wert ergänzt, den diese Fassung nicht kennt.
 */
function ausBereich<T extends string>(
  wert: string,
  erlaubt: readonly T[],
  vorgabe: T,
): T {
  return (erlaubt as readonly string[]).includes(wert) ? (wert as T) : vorgabe
}

export function planpunktAus(zeile: PunktZeile): TripItem {
  const bookingStatus = buchungsstatusLesen(zeile.booking_status ?? 'unconfirmed')
  const kind = ausBereich<TripItemKind>(zeile.kind, TRIP_ITEM_KINDS, 'note')
  const gebucht = kannBuchungMarkieren({ kind }) && bookingStatus === 'booked'
  const transfer = kind === 'transfer'
  const mietwagen = kind === 'rental_car'
  const orteErlaubt = transfer || mietwagen
  const mode = transfer ? mobilityModeLesen(zeile.mobility_mode) : null
  const originName = orteErlaubt ? zeile.origin_name ?? null : null
  const destinationName = orteErlaubt ? zeile.destination_name ?? null : null
  const originPlaceId = orteErlaubt ? zeile.origin_place_id ?? null : null
  const destinationPlaceId = orteErlaubt ? zeile.destination_place_id ?? null : null
  const hatMobilitaet = Boolean(mode || (transfer && (originName || destinationName || originPlaceId || destinationPlaceId)))
  const hatMietwagen = Boolean(
    mietwagen &&
      (zeile.rental_supplier ||
        zeile.vehicle_class ||
        zeile.transmission ||
        originName ||
        destinationName ||
        originPlaceId ||
        destinationPlaceId ||
        zeile.starts_on ||
        zeile.ends_on),
  )
  return mietwagenNormalisieren(
    mobilitaetNormalisieren({
      id: zeile.id,
      dayId: zeile.day_id,
      stageId: zeile.stage_id,
      kind,
      title: zeile.title,
      note: zeile.note,
      position: zeile.position,
      startsOn: zeile.starts_on,
      startsAt: uhrzeit(zeile.starts_at),
      endsOn: zeile.ends_on,
      endsAt: uhrzeit(zeile.ends_at),
      priceAmount: zahl(zeile.price_amount),
      priceCurrency: zeile.price_currency,
      provider: zeile.provider,
      externalRef: zeile.external_ref,
      bookingUrl: zeile.booking_url,
      bookingStatus: gebucht ? 'booked' : 'unconfirmed',
      bookingSource: gebucht ? buchungsquelleLesen(zeile.booking_source) ?? 'user' : null,
      bookingConfirmedAt: gebucht ? zeile.booking_confirmed_at ?? null : null,
      mobilityMode: mode,
      originPlaceId,
      destinationPlaceId,
      originName,
      destinationName,
      connectionRef: transfer ? zeile.connection_ref ?? null : null,
      mobilityChanges: transfer ? zahl(zeile.mobility_changes ?? null) : null,
      mobilityEvidence: hatMobilitaet ? 'user' as const : mobilityEvidenceLesen(zeile.mobility_evidence),
      ...(mietwagen
        ? {
            rentalSupplier: zeile.rental_supplier ?? null,
            vehicleClass: vehicleClassLesen(zeile.vehicle_class),
            transmission: transmissionLesen(zeile.transmission),
            rentalEvidence: hatMietwagen ? 'user' as const : rentalEvidenceLesen(zeile.rental_evidence),
          }
        : leereMietwagen()),
      ...(transfer || mietwagen ? {} : leereMobilitaet()),
      routeItinerary: kind === 'flight' ? itineraryAusMetadata(zeile.metadata) : null,
    }),
  )
}

export function etappeAus(zeile: EtappeZeile): TripStage {
  return {
    id: zeile.id,
    position: zeile.position,
    name: zeile.name,
    countryCode: zeile.country_code,
    arrivalDate: zeile.arrival_date,
    departureDate: zeile.departure_date,
    latitude: zahl(zeile.latitude),
    longitude: zahl(zeile.longitude),
    placeId: zeile.place_id ?? null,
  }
}

/**
 * Setzt eine Reise aus ihren vier Tabellen zusammen.
 *
 * Die Sortierung geschieht hier und nicht in der Abfrage: Ein Planpunkt hängt
 * an einem Tag, und die Zuordnung ist dieselbe Rechnung, egal ob PostgREST oder
 * die Anwendung sie macht. Ein Punkt ohne Tag – etwa nach dem Löschen eines
 * Tages, `on delete set null` – landet in `ohneTag`.
 */
export function reiseAus(
  reise: ReiseZeile,
  etappen: EtappeZeile[],
  tage: TagZeile[],
  punkte: PunktZeile[],
  readiness: ReadinessZeile[] = [],
  party: TravellerZeile[] = [],
): Reisegraph {
  const alle = [...punkte]
    .sort(
      (a, b) =>
        a.position - b.position ||
        a.created_at.localeCompare(b.created_at) ||
        a.id.localeCompare(b.id),
    )
    .map(planpunktAus)

  const jeTag = new Map<string, TripItem[]>()
  const ohneTag: TripItem[] = []

  for (const punkt of alle) {
    if (!punkt.dayId) {
      ohneTag.push(punkt)
      continue
    }
    const liste = jeTag.get(punkt.dayId)
    if (liste) liste.push(punkt)
    else jeTag.set(punkt.dayId, [punkt])
  }

  const geordneteTage: TripDay[] = [...tage]
    .sort((a, b) => a.day_index - b.day_index)
    .map((zeile) => ({
      id: zeile.id,
      stageId: zeile.stage_id,
      dayIndex: zeile.day_index,
      dayDate: zeile.day_date,
      title: zeile.title,
      items: jeTag.get(zeile.id) ?? [],
    }))

  const geordneteEtappen = [...etappen]
    .sort(
      (a, b) =>
        a.position - b.position ||
        a.created_at.localeCompare(b.created_at) ||
        a.id.localeCompare(b.id),
    )
    .map(etappeAus)

  return {
    id: reise.id,
    clientRef: reise.client_ref,
    title: reise.title,
    origin: reise.origin,
    originPlaceId: reise.origin_place_id ?? null,
    startDate: reise.start_date,
    endDate: reise.end_date,
    travellers: reise.travellers,
    currency: reise.currency,
    budgetAmount: zahl(reise.budget_amount),
    status: ausBereich<TripStatus>(reise.status, TRIP_STATUSES, 'draft'),
    pace: ausBereich<TripPace>(reise.pace, TRIP_PACES, 'balanced'),
    interests: (reise.interests ?? []).filter((wert): wert is TripInterest =>
      (TRIP_INTERESTS as readonly string[]).includes(wert),
    ),
    travelWish: reise.travel_wish,
    revision: Math.max(1, Math.trunc(zahl(reise.revision) ?? 1)),
    lastMutationId: reise.last_mutation_id,
    stages: geordneteEtappen,
    days: geordneteTage,
    createdAt: reise.created_at,
    updatedAt: reise.updated_at,
    ohneTag,
    party: partyAusZeilen(party),
    readinessItems: readinessAusZeilen(readiness, partyAusZeilen(party)),
  }
}

/**
 * Formt eine Reise in die Nutzlast von `public.reise_anlegen()`.
 *
 * Was hier fehlt, fehlt mit Absicht: `status` setzt die Funktion auf `draft`,
 * `user_id` kommt aus `auth.uid()`. Die lokalen Kennungen der Tage und Punkte
 * gehen nicht mit – in der Datenbank hätten sie keine Bedeutung, und die
 * Zuordnung eines Punkts zu seinem Tag läuft über `day_index`.
 */
export function alsNutzlast(reise: Trip): ReiseNutzlast {
  return {
    client_ref: reise.clientRef ?? reise.id,
    title: reise.title,
    origin: reise.origin,
    origin_place_id: reise.originPlaceId,
    start_date: reise.startDate,
    end_date: reise.endDate,
    travellers: reise.travellers,
    currency: reise.currency,
    budget_amount: reise.budgetAmount,
    pace: reise.pace,
    interests: reise.interests,
    travel_wish: reise.travelWish,
    stages: reise.stages.map((etappe, stelle) => ({
      position: etappe.position || stelle + 1,
      name: etappe.name,
      country_code: etappe.countryCode,
      arrival_date: etappe.arrivalDate,
      departure_date: etappe.departureDate,
      latitude: etappe.latitude,
      longitude: etappe.longitude,
      place_id: etappe.placeId,
    })),
    days: reise.days.map((tag, stelle) => {
      const etappe = tag.stageId
        ? reise.stages.find((eintrag) => eintrag.id === tag.stageId)
        : null
      const position =
        etappe?.position ||
        (reise.stages.length === 1 ? 1 : null)

      return {
        day_index: tag.dayIndex || stelle + 1,
        day_date: tag.dayDate,
        title: tag.title,
        stage_position: position,
        items: tag.items.map((punkt, ort) => ({
          kind: punkt.kind,
          title: punkt.title,
          note: punkt.note,
          position: punkt.position || ort + 1,
          starts_on: punkt.startsOn,
          starts_at: punkt.startsAt,
          ends_on: punkt.endsOn,
          ends_at: punkt.endsAt,
          price_amount: punkt.priceAmount,
          price_currency: punkt.priceCurrency,
          provider: punkt.provider,
          external_ref: punkt.externalRef,
          booking_url: punkt.bookingUrl,
          booking_status: punkt.bookingStatus,
          booking_confirmed_at: punkt.bookingConfirmedAt,
          mobility_mode: punkt.mobilityMode,
          origin_place_id: punkt.originPlaceId,
          destination_place_id: punkt.destinationPlaceId,
          origin_name: punkt.originName,
          destination_name: punkt.destinationName,
          connection_ref: punkt.connectionRef,
          mobility_changes: punkt.mobilityChanges,
          rental_supplier: punkt.rentalSupplier,
          vehicle_class: punkt.vehicleClass,
          transmission: punkt.transmission,
          route_itinerary: punkt.kind === 'flight' ? punkt.routeItinerary ?? null : null,
        })),
      }
    }),
    ungeplante: (reise.ohneTag ?? []).map((punkt, ort) => ({
      kind: punkt.kind,
      title: punkt.title,
      note: punkt.note,
      position: punkt.position || ort + 1,
      starts_on: punkt.startsOn,
      starts_at: punkt.startsAt,
      ends_on: punkt.endsOn,
      ends_at: punkt.endsAt,
      price_amount: punkt.priceAmount,
      price_currency: punkt.priceCurrency,
      provider: punkt.provider,
      external_ref: punkt.externalRef,
      booking_url: punkt.bookingUrl,
      booking_status: punkt.bookingStatus,
      booking_confirmed_at: punkt.bookingConfirmedAt,
      mobility_mode: punkt.mobilityMode,
      origin_place_id: punkt.originPlaceId,
      destination_place_id: punkt.destinationPlaceId,
      origin_name: punkt.originName,
      destination_name: punkt.destinationName,
      connection_ref: punkt.connectionRef,
      mobility_changes: punkt.mobilityChanges,
      rental_supplier: punkt.rentalSupplier,
      vehicle_class: punkt.vehicleClass,
      transmission: punkt.transmission,
      route_itinerary: punkt.kind === 'flight' ? punkt.routeItinerary ?? null : null,
    })),
  }
}
