// lib/account/buchungen-daten.ts
//
// Eine serverseitige Seite bestätigter Buchungen des angemeldeten Kontos.
// Eine Abfrage, kein N+1, kein `user_id`-Filter, kein Service Role, keine Zählung.
//
// RLS bleibt die Ownership-Authority. Empty ≠ Error über `problemAus()`.
// Ein ungültiger Filter oder Cursor fragt die Datenbank nicht.

import 'server-only'

import {
  buchungenAbfrageBauen,
  buchungenAdresse,
  buchungenAnfrageAus,
  buchungenSeiteAusZeilen,
  type BuchungenAnfrage,
  type BuchungenErgebnis,
  type BuchungenRohQuery,
} from '@/lib/account/buchungen-abfrage'
import { problemAus, type Leseantwort, type Problem } from '@/lib/api/datenbank-lesen'
import type { RoheBuchungszeile } from '@/lib/account/buchungen'
import { createServerComponentClient } from '@/lib/supabase/server'

const ABBILDUNGSFEHLER: Problem = {
  status: 500,
  message: 'Mindestens eine bestätigte Buchung konnte nicht sicher gelesen werden.',
}

type BuchungenKette = PromiseLike<Leseantwort<RoheBuchungszeile>> & {
  eq: (spalte: string, wert: string) => BuchungenKette
  in: (spalte: string, werte: readonly string[]) => BuchungenKette
  filter: (spalte: string, operator: string, wert: string) => BuchungenKette
  or: (ausdruck: string) => BuchungenKette
  is: (spalte: string, wert: null) => BuchungenKette
  gt: (spalte: string, wert: string) => BuchungenKette
  order: (spalte: string, optionen: { ascending: boolean; nullsFirst?: boolean }) => BuchungenKette
  limit: (n: number) => BuchungenKette
}

export type BuchungenDatenClient = {
  from: (tabelle: string) => { select: (spalten: string) => BuchungenKette }
}

function lesenFehler(
  anfrage: Extract<BuchungenAnfrage, { ok: true }>,
  status: number,
): BuchungenErgebnis {
  return {
    ok: false,
    grund: 'lesen',
    status,
    filter: anfrage.filter,
    ersteSeite: anfrage.ersteSeite,
    wiederholen: anfrage.wiederholen,
  }
}

function buchungenKetteAnwenden(
  start: { select: (spalten: string) => BuchungenKette },
  abfrage: ReturnType<typeof buchungenAbfrageBauen>,
): BuchungenKette {
  let kette: BuchungenKette = start.select(abfrage.spalten).eq('booking_status', 'booked')
  kette =
    abfrage.kind.op === 'in' ? kette.in('kind', abfrage.kind.werte) : kette.eq('kind', abfrage.kind.wert)
  if (abfrage.archiv?.op === 'in') kette = kette.in('trips.status', abfrage.archiv.werte)
  else if (abfrage.archiv?.op === 'eq') kette = kette.eq('trips.status', abfrage.archiv.wert)
  if (abfrage.titelMuster !== null) kette = kette.filter('title', 'imatch', abfrage.titelMuster)
  if (abfrage.keyset?.op === 'or') kette = kette.or(abfrage.keyset.ausdruck)
  else if (abfrage.keyset?.op === 'null') kette = kette.is('booking_confirmed_at', null).gt('id', abfrage.keyset.id)
  return kette
    .order('booking_confirmed_at', { ascending: false, nullsFirst: false })
    .order('id', { ascending: true })
    .limit(abfrage.limit)
}

export async function buchungenAbfrageSenden(
  client: BuchungenDatenClient,
  abfrage: ReturnType<typeof buchungenAbfrageBauen>,
): Promise<Leseantwort<RoheBuchungszeile>> {
  return buchungenKetteAnwenden(client.from('trip_items'), abfrage)
}

async function seiteLesen(
  anfrage: Extract<BuchungenAnfrage, { ok: true }>,
  client: BuchungenDatenClient,
): Promise<BuchungenErgebnis> {
  let antwort: Leseantwort<RoheBuchungszeile>
  try {
    antwort = await buchungenAbfrageSenden(client, buchungenAbfrageBauen(anfrage.filter, anfrage.cursor))
  } catch {
    return lesenFehler(anfrage, 500)
  }

  if (antwort.error) return lesenFehler(anfrage, problemAus(antwort, antwort.error).status)
  if (antwort.data === null) return lesenFehler(anfrage, 500)

  const seite = buchungenSeiteAusZeilen(antwort.data, anfrage.filter)
  if (!seite.ok) return lesenFehler(anfrage, ABBILDUNGSFEHLER.status)

  return {
    ok: true,
    filter: anfrage.filter,
    fortsetzung: anfrage.cursor !== null,
    buchungen: seite.buchungen,
    weiter: seite.weiter ? buchungenAdresse(anfrage.filter, seite.weiter) : null,
    ersteSeite: anfrage.ersteSeite,
    wiederholen: anfrage.wiederholen,
  }
}

export async function buchungenFuerParameter(
  roh: BuchungenRohQuery,
  client?: BuchungenDatenClient,
): Promise<BuchungenErgebnis> {
  const anfrage = buchungenAnfrageAus(roh)
  if (!anfrage.ok) return anfrage
  const supabase = client ?? ((await createServerComponentClient()) as unknown as BuchungenDatenClient)
  return seiteLesen(anfrage, supabase)
}
