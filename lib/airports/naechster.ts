// lib/airports/naechster.ts
//
// Nächster großer Linienflughafen zu einem Katalogort.
//
// `public.airports` speichert kein `scheduled_service`; `medium` umfasst auch
// Militär- und Sportplätze ohne Linienverkehr (Cascais, Torrejón, Lugano).
// Vorgeschlagen wird deshalb nur `large`, innerhalb eines festen Radius. Ohne
// Treffer bleibt das Feld leer und der Nutzer wählt selbst.
//
// Frei von React, Next und Supabase.

import { iataLesen } from '@/lib/route/referenz'

export const FLUGHAFEN_VORSCHLAG_RADIUS_KM = 120

export type FlughafenKoordinatenZeile = {
  iata: string | null
  name: string
  klasse?: string | null
  lat: number | null
  lon: number | null
}

export type FlughafenVorschlag = { iata: string; name: string; km: number }

const ERDRADIUS_KM = 6371

export function entfernungKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = (grad: number) => (grad * Math.PI) / 180
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2
  return 2 * ERDRADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Grobes Rechteck für die Abfrage; `lon: null` heißt: Längengrad nicht eingrenzen. */
export function suchfenster(ort: { lat: number; lon: number }, radiusKm = FLUGHAFEN_VORSCHLAG_RADIUS_KM) {
  const dLat = radiusKm / 111
  const breite = Math.cos((ort.lat * Math.PI) / 180)
  const dLon = breite > 0.05 ? radiusKm / (111 * breite) : 360
  const lat = { min: Math.max(-90, ort.lat - dLat), max: Math.min(90, ort.lat + dLat) }
  const lon = ort.lon - dLon < -180 || ort.lon + dLon > 180 ? null : { min: ort.lon - dLon, max: ort.lon + dLon }
  return { lat, lon }
}

export function naechsterFlughafen(
  ort: { lat: number; lon: number },
  zeilen: readonly FlughafenKoordinatenZeile[],
  radiusKm = FLUGHAFEN_VORSCHLAG_RADIUS_KM,
): FlughafenVorschlag | null {
  let bester: FlughafenVorschlag | null = null
  for (const zeile of zeilen) {
    const iata = iataLesen(zeile.iata)
    if (!iata || zeile.klasse !== 'large' || zeile.lat === null || zeile.lon === null) continue
    if (!Number.isFinite(zeile.lat) || !Number.isFinite(zeile.lon)) continue
    const km = entfernungKm(ort, { lat: zeile.lat, lon: zeile.lon })
    if (km > radiusKm) continue
    if (!bester || km < bester.km || (km === bester.km && iata < bester.iata)) {
      bester = { iata, name: `${zeile.name} · ${iata}`, km }
    }
  }
  return bester ? { ...bester, km: Math.round(bester.km) } : null
}
