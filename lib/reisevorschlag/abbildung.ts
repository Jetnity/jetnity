// lib/reisevorschlag/abbildung.ts
//
// Aus einem Vorschlag wird eine Reise des Phase-1.5-Modells.
//
// ---------------------------------------------------------------------------
// Zwei Ziele, eine Rechnung
// ---------------------------------------------------------------------------
//
// Ein Gast bekommt einen `Trip` für den `localStorage`, ein Konto eine
// `ReiseNutzlast` für `public.reise_anlegen()`. Beides entsteht hier, aus
// derselben Vorlage. Zwei Abbildungen wären zwei Gelegenheiten, dass eine
// Gastreise nach dem Login andere Tage hat als vorher – genau der Fehler, den
// `lib/trips/tage.ts` für das Formular schon verhindert.
//
// Es entsteht **keine** zweite Persistenz: Der Gastweg endet in
// `gastreiseAusVorschlag()` im bestehenden Gastspeicher, der Kontoweg in
// `public.reise_anlegen()`. Der Vorschlag ist eine Vorlage, kein Speicherort.
//
// ---------------------------------------------------------------------------
// Was hier nicht durchkommt
// ---------------------------------------------------------------------------
//
// `priceAmount`, `priceCurrency`, `provider`, `externalRef`, `bookingUrl`
// bleiben `null`. Das ist keine Vorsichtsmassnahme, sondern die einzige
// mögliche Zuweisung: Der Vorschlag hat diese Felder nicht (ADR-0054). Ein
// Budget landet in `budgetAmount` der Reise – als Ziel, wie im Formular unter
// /planen – und nirgends als Preis eines Planpunkts.
//
// `status` wird nicht gesetzt: Eine neue Reise ist ein Entwurf, und
// `reise_erzeugung_pruefen` in der Datenbank lässt nichts anderes zu.
//
// ---------------------------------------------------------------------------
// Daten rechnet Jetnity, nicht das Modell
// ---------------------------------------------------------------------------
//
// Der Vorschlag trägt genau ein Datum: `startdatum`, und nur wenn der Text einen
// Zeitraum nennt. Alles andere – Reiseende, Datum je Tag, An- und Abreisetag je
// Etappe – folgt daraus mit `reisetageBauen()`. Hätte jeder Tag sein eigenes
// Datum vom Modell, wäre ein doppeltes oder fehlendes darunter, und
// `trip_days_datum_eindeutig` fiele erst bei der Übernahme auf.
//
// Frei von Next, Supabase, `window` und `crypto`: Die Kennungen kommen als
// Funktion herein, damit dieselbe Rechnung im Browser und auf dem Server läuft.

import type { KanonischeOrte } from '@/lib/places/kanon'
import { etappeMitOrt } from '@/lib/places/kanon'
import type { Reisevorschlag } from '@/lib/reisevorschlag/schema'
import type { ReiseNutzlast } from '@/lib/trips/schema'
import { leereMobilitaet } from '@/lib/trips/mobilitaet-felder'
import { reisetageBauen } from '@/lib/trips/tage'
import type { Trip, TripDay, TripItem, TripStage } from '@/types/trips'

const EIN_TAG = 86_400_000

/** Das Datum `versatz` Tage nach `start`, oder `null` ohne Start. */
function datumNach(start: string | null, versatz: number): string | null {
  if (!start) return null
  const zeit = Date.parse(`${start}T00:00:00Z`)
  if (Number.isNaN(zeit)) return null
  return new Date(zeit + versatz * EIN_TAG).toISOString().slice(0, 10)
}

/** Der letzte Reisetag: Start plus Dauer minus eins. Beide Tage eingeschlossen. */
export function reiseende(vorschlag: Reisevorschlag): string | null {
  return datumNach(vorschlag.startdatum, vorschlag.tage.length - 1)
}

/**
 * Die Tage der Reise – mit Datum, wenn der Vorschlag einen Start nennt.
 *
 * Mit Start läuft die Rechnung durch `reisetageBauen()`, also durch dieselbe
 * Funktion wie das Formular. Ohne Start bleibt die Nummer, und `dayDate` ist
 * `null`; das Reiseschema ist dafür gebaut.
 */
function tagesgeruest(vorschlag: Reisevorschlag): { dayIndex: number; dayDate: string | null }[] {
  const ende = reiseende(vorschlag)

  if (vorschlag.startdatum && ende) {
    const gebaut = reisetageBauen(vorschlag.startdatum, ende)
    if (gebaut.length === vorschlag.tage.length) return gebaut
  }

  return vorschlag.tage.map((_, stelle) => ({ dayIndex: stelle + 1, dayDate: null }))
}

/** Die Etappen der Reise. An- und Abreisedatum aus den Tagesnummern. */
function etappen(vorschlag: Reisevorschlag, orte?: KanonischeOrte): Omit<TripStage, 'id'>[] {
  return vorschlag.etappen.map((etappe, stelle) =>
    etappeMitOrt(
      {
        position: stelle + 1,
        name: etappe.name,
        countryCode: etappe.laendercode,
        arrivalDate: datumNach(vorschlag.startdatum, etappe.vonTag - 1),
        departureDate: datumNach(vorschlag.startdatum, etappe.bisTag - 1),
        latitude: null,
        longitude: null,
        placeId: null,
      },
      orte?.stages[stelle] ?? null,
    ),
  )
}

/** Position der Etappe, die den Reisetag `nummer` trägt – 1-basiert. */
function etappenpositionFuerTag(vorschlag: Reisevorschlag, nummer: number): number {
  const stelle = vorschlag.etappen.findIndex(
    (etappe) => nummer >= etappe.vonTag && nummer <= etappe.bisTag,
  )
  return stelle >= 0 ? stelle + 1 : 1
}

/**
 * Der Vorschlag als Nutzlast für `public.reise_anlegen()`.
 *
 * Der Ausschnitt ist der, den die Funktion liest – nicht mehr. Was sie nicht
 * liest, mitzuschicken wäre die Behauptung, es käme an (`lib/trips/schema.ts`).
 */
export function vorschlagAlsNutzlast(
  vorschlag: Reisevorschlag,
  clientRef: string,
  orte?: KanonischeOrte,
): ReiseNutzlast {
  const geruest = tagesgeruest(vorschlag)

  return {
    client_ref: clientRef,
    title: vorschlag.titel,
    origin: vorschlag.abreiseort,
    origin_place_id: orte?.origin?.id ?? null,
    start_date: vorschlag.startdatum,
    end_date: reiseende(vorschlag),
    travellers: vorschlag.reisende,
    currency: vorschlag.waehrung,
    budget_amount: vorschlag.budgetziel,
    pace: vorschlag.tempo,
    interests: vorschlag.interessen,
    travel_wish: vorschlag.reisewunsch,
    stages: etappen(vorschlag, orte).map((etappe) => ({
      position: etappe.position,
      name: etappe.name,
      country_code: etappe.countryCode,
      arrival_date: etappe.arrivalDate,
      departure_date: etappe.departureDate,
      latitude: etappe.latitude,
      longitude: etappe.longitude,
      place_id: etappe.placeId,
    })),
    days: vorschlag.tage.map((tag, stelle) => ({
      day_index: geruest[stelle].dayIndex,
      day_date: geruest[stelle].dayDate,
      title: tag.titel,
      stage_position: etappenpositionFuerTag(vorschlag, tag.nummer),
      items: tag.punkte.map((punkt, position) => ({
        kind: punkt.art,
        title: punkt.titel,
        note: punkt.notiz,
        position: position + 1,
        starts_on: null,
        starts_at: punkt.beginn,
        ends_on: null,
        ends_at: null,
        price_amount: null,
        price_currency: null,
        provider: null,
        external_ref: null,
        booking_url: null,
        booking_status: 'unconfirmed' as const,
        booking_confirmed_at: null,
        mobility_mode: null,
        origin_place_id: null,
        destination_place_id: null,
        origin_name: null,
        destination_name: null,
        connection_ref: null,
        mobility_changes: null,
        rental_supplier: null,
        vehicle_class: null,
        transmission: null,
        route_itinerary: null,
      })),
    })),
    ungeplante: [],
  }
}

/**
 * Der Vorschlag als vollständige Reise – die Fassung für den Gastspeicher.
 *
 * `kennung` liefert die lokalen Kennungen (`trip-…`, `day-…`, `item-…`). Sie
 * kommt von aussen, weil `crypto.randomUUID()` im Browser lebt und diese Datei
 * ohne Browserbezug bleiben soll.
 *
 * Die Rückgabe ist noch nicht geprüft. Wer sie ablegt, schickt sie durch
 * `reiseLesen()` – so wie jeder andere Weg in den Gastspeicher.
 */
export function vorschlagAlsReise(
  vorschlag: Reisevorschlag,
  clientRef: string,
  kennung: (prefix: string) => string,
  jetzt: string,
  orte?: KanonischeOrte,
): Trip {
  const geruest = tagesgeruest(vorschlag)
  const stufen = etappen(vorschlag, orte).map((etappe) => ({ ...etappe, id: kennung('stage') }))

  const tage: TripDay[] = vorschlag.tage.map((tag, stelle) => {
    const tagId = kennung('day')
    const datum = geruest[stelle].dayDate
    const etappe = stufen[etappenpositionFuerTag(vorschlag, tag.nummer) - 1] ?? stufen[0] ?? null
    const stageId = etappe?.id ?? null

    const punkte: TripItem[] = tag.punkte.map((punkt, position) => ({
      id: kennung('item'),
      dayId: tagId,
      stageId,
      kind: punkt.art,
      title: punkt.titel,
      note: punkt.notiz,
      position: position + 1,
      startsOn: datum,
      startsAt: punkt.beginn,
      endsOn: null,
      endsAt: null,
      priceAmount: null,
      priceCurrency: null,
      provider: null,
      externalRef: null,
      bookingUrl: null,
      bookingStatus: 'unconfirmed',
      bookingSource: null,
      bookingConfirmedAt: null,
      ...leereMobilitaet(),
    }))

    return {
      id: tagId,
      stageId,
      dayIndex: geruest[stelle].dayIndex,
      dayDate: datum,
      title: tag.titel,
      items: punkte,
    }
  })

  return {
    id: clientRef,
    clientRef,
    title: vorschlag.titel,
    origin: vorschlag.abreiseort,
    originPlaceId: orte?.origin?.id ?? null,
    startDate: vorschlag.startdatum,
    endDate: reiseende(vorschlag),
    travellers: vorschlag.reisende,
    currency: vorschlag.waehrung,
    budgetAmount: vorschlag.budgetziel,
    status: 'draft',
    pace: vorschlag.tempo,
    interests: vorschlag.interessen,
    travelWish: vorschlag.reisewunsch,
    revision: 1,
    lastMutationId: null,
    stages: stufen,
    days: tage,
    ohneTag: [],
    createdAt: jetzt,
    updatedAt: jetzt,
  }
}
