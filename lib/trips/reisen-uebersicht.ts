// lib/trips/reisen-uebersicht.ts
//
// Eine Zusammenfassung für Meine Reisen, Account-Start und Welt.
// Die Spaltenliste und die Zeilenabbildung leben hier einmal.

import { previousStatusAusMetadata } from '@/lib/account/reise-archiv'
import { TRIP_STATUSES, type TripStatus, type TripSummary, type TripSummaryStage } from '@/types/trips'

/**
 * Spalten der Liste „Meine Reisen“.
 *
 * `trip_stages(name, position, country_code, place_id, latitude, longitude)`
 * trägt die geordnete Zielidentität (TW7-A) plus die kanonischen
 * World-Map-Felder. `stageCount` entsteht aus dieser gelesenen Menge, nicht
 * aus einem zweiten Zähler. Tage und Punkte bleiben Aggregat: PostgREST
 * beantwortet `trip_days(count)` mit `[{ count: 12 }]`. Ohne diese Form wäre
 * die Liste entweder N+1 oder eine eigene View, die dieselbe Zahl ein
 * zweites Mal definiert. Keine Transit- oder Flight-Ziele, keine zweite
 * Konto-Reiseabfrage.
 */
export const UEBERSICHT_SPALTEN =
  'id, title, origin, start_date, end_date, travellers, currency, budget_amount, status, updated_at, metadata, ' +
  'trip_stages(name, position, country_code, place_id, latitude, longitude), trip_days(count), trip_items(count)'

type Anzahl = { count: number }

type UebersichtEtappe = {
  name: string
  position: number
  country_code?: string | null
  place_id?: string | null
  latitude?: number | string | null
  longitude?: number | string | null
}

export type UebersichtZeile = {
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
  metadata: unknown
  trip_stages: UebersichtEtappe[] | null
  trip_days: Anzahl[] | null
  trip_items: Anzahl[] | null
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

function gespeicherterText(wert: string | null | undefined): string | null {
  return typeof wert === 'string' ? wert : null
}

function etappeUebersicht(etappe: UebersichtEtappe): TripSummaryStage {
  return {
    name: etappe.name,
    position: etappe.position,
    countryCode: gespeicherterText(etappe.country_code),
    placeId: gespeicherterText(etappe.place_id),
    latitude: betrag(etappe.latitude ?? null),
    longitude: betrag(etappe.longitude ?? null),
  }
}

export function uebersichtAusZeile(zeile: UebersichtZeile): TripSummary {
  const stages = (Array.isArray(zeile.trip_stages) ? zeile.trip_stages : []).map(etappeUebersicht)
  return {
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
    archivePreviousStatus: previousStatusAusMetadata(zeile.metadata),
    stages,
    stageCount: stages.length,
    dayCount: anzahl(zeile.trip_days),
    itemCount: anzahl(zeile.trip_items),
  }
}

export function uebersichtAusZeilen(zeilen: readonly UebersichtZeile[]): TripSummary[] {
  return zeilen.map(uebersichtAusZeile)
}
