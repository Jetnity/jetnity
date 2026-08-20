// lib/rollout/befund.ts
//
// Read-only Bewertung eines Airport-/Places-Rollouts.
// Keine Schreiboperation, keine Seiteneffekte.

import { flugZustand } from '@/lib/flights/zustand'
import { modellZustand } from '@/lib/modell/konfiguration'

export const AIRPORT_PFLICHT = ['ZRH', 'GVA', 'BSL', 'LHR', 'JFK', 'DXB', 'BKK'] as const
export const AIRPORT_PFLICHT_ODER = [['HND', 'NRT']] as const
export const ORT_PFLICHT = ['Bali', 'Thailand', 'Tuscany', 'New York', 'Japan'] as const
export const ORT_PFLICHT_KEYWORD = ['Südtirol'] as const
export const ORT_FANTASIE = ['Test', 'Mordor', 'abcxyz'] as const

export const AIRPORT_ANZAHL = { min: 4_000, max: 8_000, orientierung: 5_332 }
export const PLACE_ANZAHL = { min: 100_000, max: 200_000, orientierung: 124_811 }

export const PHASE31_MIGRATIONEN = [
  '20260820100000_reise_anlegen_handelsfelder.sql',
  '20260820110000_airports_referenz.sql',
  '20260820120000_places_referenz.sql',
  '20260820130000_reise_aendern_places.sql',
] as const

export type RolloutBeobachtung = {
  placesExistiert: boolean
  originPlaceIdExistiert: boolean
  stagePlaceIdExistiert: boolean
  airportAnzahl: number | null
  placeAnzahl: number | null
  airportPflicht: string[]
  airportOder: string[]
  ortPflicht: string[]
  ortKeyword: string[]
  fantasieTreffer: string[]
  airportConstraintVerletzungen: number
  anonKannLesen: boolean | null
  anonKannSchreiben: boolean | null
  reisenOhnePlaceId: number | null
  reisenLesbar: boolean | null
}

export type BefundPunkt = {
  name: string
  ok: boolean
  detail: string
}

export function anzahlIstPlausibel(
  wert: number | null,
  grenze: { min: number; max: number },
): boolean {
  return wert !== null && wert >= grenze.min && wert <= grenze.max
}

export function rolloutBefund(beobachtung: RolloutBeobachtung): {
  ok: boolean
  punkte: BefundPunkt[]
} {
  const punkte: BefundPunkt[] = [
    {
      name: 'public.places vorhanden',
      ok: beobachtung.placesExistiert,
      detail: beobachtung.placesExistiert ? 'Tabelle vorhanden' : 'Tabelle fehlt',
    },
    {
      name: 'Airport-Anzahl plausibel',
      ok: anzahlIstPlausibel(beobachtung.airportAnzahl, AIRPORT_ANZAHL),
      detail:
        beobachtung.airportAnzahl === null
          ? 'nicht lesbar'
          : `${beobachtung.airportAnzahl} (Orientierung ${AIRPORT_ANZAHL.orientierung})`,
    },
    {
      name: 'Place-Anzahl plausibel',
      ok: anzahlIstPlausibel(beobachtung.placeAnzahl, PLACE_ANZAHL),
      detail:
        beobachtung.placeAnzahl === null
          ? 'nicht lesbar'
          : `${beobachtung.placeAnzahl} (Orientierung ${PLACE_ANZAHL.orientierung})`,
    },
    {
      name: 'Pflichtflughäfen',
      ok:
        AIRPORT_PFLICHT.every((code) => beobachtung.airportPflicht.includes(code)) &&
        AIRPORT_PFLICHT_ODER.every((gruppe) =>
          gruppe.some((code) => beobachtung.airportOder.includes(code)),
        ),
      detail: `vorhanden: ${[...beobachtung.airportPflicht, ...beobachtung.airportOder].join(', ') || 'keine'}`,
    },
    {
      name: 'Pflichtorte suchbar',
      ok:
        ORT_PFLICHT.every((name) => beobachtung.ortPflicht.includes(name)) &&
        ORT_PFLICHT_KEYWORD.every((name) => beobachtung.ortKeyword.includes(name)),
      detail: `getroffen: ${[...beobachtung.ortPflicht, ...beobachtung.ortKeyword].join(', ') || 'keine'}`,
    },
    {
      name: 'Fantasieorte ohne kanonischen Treffer',
      ok: beobachtung.fantasieTreffer.length === 0,
      detail:
        beobachtung.fantasieTreffer.length === 0
          ? 'Test, Mordor, abcxyz ohne Treffer'
          : `unerwartet: ${beobachtung.fantasieTreffer.join(', ')}`,
    },
    {
      name: 'Airport-Constraints vor Import',
      ok: beobachtung.airportConstraintVerletzungen === 0,
      detail:
        beobachtung.airportConstraintVerletzungen === 0
          ? 'keine verletzenden historischen Zeilen'
          : `${beobachtung.airportConstraintVerletzungen} Zeilen würden 20260820110000 ablehnen`,
    },
    {
      name: 'RLS: anon liest, schreibt nicht',
      ok: beobachtung.anonKannLesen === true && beobachtung.anonKannSchreiben === false,
      detail: `lesen=${beobachtung.anonKannLesen} schreiben=${beobachtung.anonKannSchreiben}`,
    },
    {
      name: 'Reise ohne Place-ID bleibt ladbar',
      ok:
        beobachtung.originPlaceIdExistiert &&
        beobachtung.stagePlaceIdExistiert &&
        beobachtung.reisenLesbar !== false,
      detail:
        beobachtung.reisenOhnePlaceId === null
          ? 'keine Reisezeilen oder Spalte fehlt'
          : `${beobachtung.reisenOhnePlaceId} Reisen ohne origin_place_id, lesbar=${beobachtung.reisenLesbar}`,
    },
    {
      name: 'Modellweg Production OFF',
      ok: !modellZustand({ JETNITY_MODELL_AKTIV: 'false' }).aktiv,
      detail: 'Kill Switch bleibt aus; diese Prüfung aktiviert ihn nicht',
    },
    {
      name: 'Duffel-Flugsuche Production OFF',
      ok: !flugZustand({
        VERCEL_ENV: 'production',
        JETNITY_FLIGHT_AKTIV: 'true',
        DUFFEL_ACCESS_TOKEN: 'duffel_test_xxxxxxxxxxxxxxxx',
      }).aktiv,
      detail: 'Production ist hart aus, auch mit Test-Token',
    },
  ]

  return { ok: punkte.every((punkt) => punkt.ok), punkte }
}

/** Vor dem Schema: historische Airport-Constraints und Kill Switches. Places dürfen fehlen. */
export function vorabBefund(beobachtung: RolloutBeobachtung): {
  ok: boolean
  punkte: BefundPunkt[]
} {
  const vollständig = rolloutBefund(beobachtung)
  const namen = new Set([
    'Airport-Constraints vor Import',
    'Modellweg Production OFF',
    'Duffel-Flugsuche Production OFF',
  ])
  const punkte = vollständig.punkte.filter((punkt) => namen.has(punkt.name))
  return { ok: punkte.every((punkt) => punkt.ok), punkte }
}
