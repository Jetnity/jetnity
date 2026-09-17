// lib/account/besuche-daten.ts
//
// Lesender Zugriff auf die bestätigte Besuchshistorie des angemeldeten Kontos.
// Authenticated-Session plus RLS; kein Service-Role, kein Fremdkonto.
//
// Leer und Fehler bleiben getrennt (ADR-0037): „du hast noch nichts bestätigt“
// und „deine Historie konnte nicht gelesen werden“ dürfen auf der Karte nicht
// gleich aussehen – die erste Aussage ist eine über dein Leben.

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { lese, type Leseantwort, type Lesung } from '@/lib/api/datenbank-lesen'
import type { Besuch } from '@/lib/account/besuche'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

const BESUCH_SPALTEN =
  'id, place_id, place_label, country_code, latitude, longitude, ' +
  'visited_year, visited_month, visited_day, created_at'

type BesuchZeile = Database['public']['Tables']['account_visits']['Row']

export type BesucheLesung = Lesung<Besuch>

function alsAntwort<Zeile>(abfrage: PromiseLike<unknown>): PromiseLike<Leseantwort<Zeile>> {
  return abfrage as PromiseLike<Leseantwort<Zeile>>
}

/**
 * `numeric` kommt je nach PostgREST-Version als Zahl oder als Zeichenkette an.
 * Beides wird gelesen; was keine endliche Zahl ergibt, bleibt unbekannt statt
 * als 0 auf dem Nullmeridian zu landen.
 */
function alsZahl(wert: unknown): number | null {
  if (typeof wert === 'number') return Number.isFinite(wert) ? wert : null
  if (typeof wert === 'string') {
    const zahl = Number(wert)
    return Number.isFinite(zahl) ? zahl : null
  }
  return null
}

function alsGanzzahl(wert: unknown): number | null {
  const zahl = alsZahl(wert)
  return zahl === null ? null : Math.trunc(zahl)
}

export function besuchAusZeile(zeile: BesuchZeile): Besuch {
  return {
    id: zeile.id,
    placeId: zeile.place_id,
    placeLabel: zeile.place_label,
    countryCode: zeile.country_code,
    latitude: alsZahl(zeile.latitude),
    longitude: alsZahl(zeile.longitude),
    jahr: alsGanzzahl(zeile.visited_year),
    monat: alsGanzzahl(zeile.visited_month),
    tag: alsGanzzahl(zeile.visited_day),
    erstelltAm: zeile.created_at,
  }
}

export async function besucheMitClientLaden(
  supabase: SupabaseClient<Database>,
): Promise<BesucheLesung> {
  // Ohne Limit: die Kennzahlen werden aus allen Ereignissen gerechnet, eine
  // Seite ergäbe eine falsche Zahl. Die Obergrenze je Konto steht in der
  // Datenbank und begrenzt diese Abfrage.
  const ergebnis = await lese<BesuchZeile>(() =>
    alsAntwort<BesuchZeile>(
      supabase
        .from('account_visits')
        .select(BESUCH_SPALTEN)
        .order('created_at', { ascending: false })
        .order('id', { ascending: true }),
    ),
  )

  if (ergebnis.problem) return ergebnis
  return { zeilen: ergebnis.zeilen.map(besuchAusZeile), problem: null }
}

export async function besucheLaden(): Promise<BesucheLesung> {
  const supabase = await createServerComponentClient()
  return besucheMitClientLaden(supabase)
}
