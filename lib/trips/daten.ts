// lib/trips/daten.ts
//
// Lesender Zugriff auf die Reisen des angemeldeten Kontos.
//
// Ausschliesslich serverseitig und ausschliesslich über den Anon-Key: Jede
// Abfrage hier läuft als `authenticated` und damit durch die Policies aus
// `20260817120000_reiseschema.sql`. Es gibt in diesem Modul keinen Filter
// `eq('user_id', …)`, und das ist Absicht – wer die Zugehörigkeit im Code
// filtert, hat sie in dem Moment nicht mehr durchgesetzt, in dem er den Filter
// vergisst. RLS filtert immer.
//
// Kein Service-Role-Zugang. Reisen sind privat; eine Rolle, die RLS umgeht,
// hätte hier keine Aufgabe, aber jedes Risiko.
//
// Fehler und Leere bleiben getrennt: `lese()` aus `lib/api/datenbank-lesen.ts`
// unterscheidet „keine Reise“ von „nicht ermittelbar“. Eine leere Liste
// „Meine Reisen“ nach einem Datenbankfehler wäre die falsche Auskunft mit den
// grössten Folgen – sie sieht aus wie Datenverlust.

import 'server-only'

import { lese, type Leseantwort, type Lesung } from '@/lib/api/datenbank-lesen'
import { createServerComponentClient } from '@/lib/supabase/server'
import {
  reiseAus,
  type EtappeZeile,
  type PunktZeile,
  type ReiseZeile,
  type TagZeile,
} from '@/lib/trips/abbildung'
import { TRIP_STATUSES, type Trip, type TripItem, type TripStatus, type TripSummary } from '@/types/trips'

/**
 * Spalten der Liste „Meine Reisen“ – und die eingebetteten Anzahlen ihrer
 * Kinder.
 *
 * PostgREST beantwortet `trip_days(count)` mit `[{ count: 12 }]`, also mit
 * einer Aggregation in der Datenbank statt mit drei weiteren Abfragen. Am
 * laufenden Branch geprüft. Ohne diese Form wäre die Liste entweder N+1
 * Abfragen oder eine eigene View, die dieselbe Zahl ein zweites Mal definiert.
 */
const UEBERSICHT_SPALTEN =
  'id, title, origin, start_date, end_date, travellers, currency, budget_amount, status, updated_at, ' +
  'trip_stages(count), trip_days(count), trip_items(count)'

/**
 * Der Reisegraph einer Reise, wie PostgREST ihn liefert.
 *
 * `ohneTag` trägt Planpunkte, deren Tag entfernt wurde (`on delete set null`).
 * Sie gehören weiter zur Reise und dürfen nicht unsichtbar werden.
 */
export type Reisegraph = Trip & { ohneTag: TripItem[] }

type Anzahl = { count: number }

type UebersichtZeile = {
  id: string
  title: string
  origin: string | null
  start_date: string | null
  end_date: string | null
  travellers: number
  currency: string
  budget_amount: number | string | null
  status: string
  updated_at: string
  trip_stages: Anzahl[] | null
  trip_days: Anzahl[] | null
  trip_items: Anzahl[] | null
}

type GraphZeile = ReiseZeile & {
  trip_stages: EtappeZeile[] | null
  trip_days: TagZeile[] | null
  trip_items: PunktZeile[] | null
}

/**
 * Nimmt einen PostgREST-Aufruf als Antwort dieses Moduls entgegen.
 *
 * Die erzeugten Typen kennen die Form eines eingebetteten Aggregats nicht: Für
 * `trip_days(count)` liefert der Client `SelectQueryError`, weil er die
 * Aggregatfunktion nicht auf eine Spalte zurückführen kann. Die Zeilenform
 * steht deshalb hier als `UebersichtZeile` und `GraphZeile` geschrieben – näher
 * am Schema als eine Behauptung des Clients, und für den Aufrufer geprüft.
 */
function alsAntwort<Zeile>(abfrage: PromiseLike<unknown>): PromiseLike<Leseantwort<Zeile>> {
  return abfrage as PromiseLike<Leseantwort<Zeile>>
}

function anzahl(werte: Anzahl[] | null): number {
  return werte?.[0]?.count ?? 0
}

function betrag(wert: number | string | null): number | null {
  if (wert === null) return null
  const gelesen = typeof wert === 'number' ? wert : Number(wert)
  return Number.isFinite(gelesen) ? gelesen : null
}

function status(wert: string): TripStatus {
  return (TRIP_STATUSES as readonly string[]).includes(wert) ? (wert as TripStatus) : 'draft'
}

/**
 * Alle Reisen des angemeldeten Kontos, neueste Änderung zuerst.
 *
 * Die Sortierung entspricht dem Index `trips_user_id_updated_at_idx`. Die
 * Obergrenze ist eine Vorsichtsmassnahme und keine Produktregel: Ein Konto mit
 * mehr als 200 Reisen braucht Blätterung, und die soll dann bewusst entstehen,
 * nicht als unbemerkt abgeschnittene Liste.
 */
export async function reisenLaden(): Promise<Lesung<TripSummary>> {
  const supabase = createServerComponentClient()

  const ergebnis = await lese<UebersichtZeile>(() =>
    alsAntwort<UebersichtZeile>(
      supabase.from('trips').select(UEBERSICHT_SPALTEN).order('updated_at', { ascending: false }).limit(200),
    ),
  )

  if (ergebnis.problem) return ergebnis

  return {
    problem: null,
    zeilen: ergebnis.zeilen.map((zeile) => ({
      id: zeile.id,
      title: zeile.title,
      origin: zeile.origin,
      startDate: zeile.start_date,
      endDate: zeile.end_date,
      travellers: zeile.travellers,
      currency: zeile.currency,
      budgetAmount: betrag(zeile.budget_amount),
      status: status(zeile.status),
      updatedAt: zeile.updated_at,
      stageCount: anzahl(zeile.trip_stages),
      dayCount: anzahl(zeile.trip_days),
      itemCount: anzahl(zeile.trip_items),
    })),
  }
}

/**
 * Eine Reise des angemeldeten Kontos, vollständig.
 *
 * Eine leere Liste bedeutet: Es gibt sie nicht, oder sie gehört jemand
 * anderem. Die Unterscheidung ist bewusst keine – wer eine fremde Kennung
 * errät, soll nicht erfahren, dass sie existiert.
 */
export async function reiseLaden(id: string): Promise<Lesung<Reisegraph>> {
  const supabase = createServerComponentClient()

  const ergebnis = await lese<GraphZeile>(() =>
    alsAntwort<GraphZeile>(
      supabase.from('trips').select('*, trip_stages(*), trip_days(*), trip_items(*)').eq('id', id).limit(1),
    ),
  )

  if (ergebnis.problem) return ergebnis

  return {
    problem: null,
    zeilen: ergebnis.zeilen.map((zeile) =>
      reiseAus(zeile, zeile.trip_stages ?? [], zeile.trip_days ?? [], zeile.trip_items ?? []),
    ),
  }
}

/**
 * Ob die Kennung aus der Adresszeile eine Reise im Konto sein kann.
 *
 * Eine Gastreise trägt `trip-<uuid>`, eine Reise im Konto die UUID der
 * Datenbank. Ohne diese Unterscheidung ginge jede Gastkennung als Abfrage an
 * PostgREST und käme als `22P02 invalid input syntax for type uuid` zurück –
 * ein Fehler, wo eine Zuordnung gemeint war.
 */
export function istKontoKennung(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}
