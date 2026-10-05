// lib/account/buchungen-daten.ts
//
// Eine serverseitige Aggregation bestätigter Buchungen des angemeldeten
// Kontos. Eine Abfrage, kein N+1, kein `user_id`-Filter, kein Service Role.
//
// RLS aus `20260817120000_reiseschema.sql` bleibt die Ownership-Authority:
// `trip_items_lesen` und `trips_lesen` für `authenticated`. Empty ≠ Error
// über `problemAus()`. Kein Write-Pfad.
//
// Vor dem Limit steht eine stabile DB-Ordnung: booking_confirmed_at absteigend,
// fehlende Zeiten zuletzt, danach id. Die 200er-Teilmenge ist damit
// deterministisch. Die Bestätigungszeit bleibt Schnittkriterium und erscheint
// nicht in der UI.

import 'server-only'

import { problemAus, type Lesung, type Leseantwort, type Problem } from '@/lib/api/datenbank-lesen'
import {
  BUCHUNGEN_LISTE_GRENZE,
  buchungenAbgeschnitten,
  buchungenAusZeilen,
  type KontoBuchung,
  type RoheBuchungszeile,
} from '@/lib/account/buchungen'
import { createServerComponentClient } from '@/lib/supabase/server'

/**
 * Nur die für S1 nötigen Spalten. Keine Beträge, Partnerfelder,
 * Deeplinks oder Reisenden-/Dokumentangaben.
 */
const BUCHUNGEN_SPALTEN =
  'id, kind, title, starts_on, starts_at, ends_on, ends_at, booking_status, ' +
  'trips!inner(id, title, status)'

const ABBILDUNGSFEHLER: Problem = {
  status: 500,
  message: 'Mindestens eine bestätigte Buchung konnte nicht sicher gelesen werden.',
}

export type BuchungenLesung = Lesung<KontoBuchung> & { abgeschnitten: boolean }

function alsAntwort<Zeile>(abfrage: PromiseLike<unknown>): PromiseLike<Leseantwort<Zeile> & { count?: number | null }> {
  return abfrage as PromiseLike<Leseantwort<Zeile> & { count?: number | null }>
}

export async function buchungenLaden(): Promise<BuchungenLesung> {
  const supabase = await createServerComponentClient()
  let antwort: Leseantwort<RoheBuchungszeile> & { count?: number | null }

  try {
    antwort = await alsAntwort<RoheBuchungszeile>(
      supabase
        .from('trip_items')
        .select(BUCHUNGEN_SPALTEN, { count: 'exact' })
        .eq('booking_status', 'booked')
        .order('booking_confirmed_at', { ascending: false, nullsFirst: false })
        .order('id', { ascending: true })
        .limit(BUCHUNGEN_LISTE_GRENZE),
    )
  } catch (fehler) {
    const message = fehler instanceof Error ? fehler.message : String(fehler)
    return { zeilen: null, problem: { status: 500, message }, abgeschnitten: false }
  }

  if (antwort.error) {
    return { zeilen: null, problem: problemAus(antwort, antwort.error), abgeschnitten: false }
  }

  if (antwort.data === null) {
    return {
      zeilen: null,
      problem: { status: 500, message: 'Die Abfrage lieferte weder Daten noch einen Fehler.' },
      abgeschnitten: false,
    }
  }

  const abbildung = buchungenAusZeilen(antwort.data)
  if (!abbildung.ok) return { zeilen: null, problem: ABBILDUNGSFEHLER, abgeschnitten: false }

  return {
    zeilen: abbildung.buchungen,
    problem: null,
    abgeschnitten: buchungenAbgeschnitten(antwort.data.length, antwort.count),
  }
}
