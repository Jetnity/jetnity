// lib/account/world-map.ts
//
// Presentation-Derivation für die Account-Weltkarte. Keine persistierte
// Besuchshistorie, kein Geocoding, keine Länder- oder Koordinaten-Erschliessung.
// Eine geplante Etappe ist kein Besuch.

import { countryCodeNormalisieren, landAnzeigeText } from '@/lib/country/darstellung'
import type { Problem } from '@/lib/api/datenbank-lesen'
import type { TripStatus, TripSummary, TripSummaryStage } from '@/types/trips'

export const WORLD_MAP_TITEL = 'Deine Welt'
const WORLD_MAP_UNTERSCHEIDUNG =
  'Diese Karte zeigt Orte, die in deinen Jetnity-Reisen geplant sind. Ein geplanter Ort ist kein Nachweis, dass du dort warst.'
const WORLD_MAP_GEPLANT_LABEL = 'In Jetnity geplant'
const WORLD_MAP_BESUCHT_LABEL = 'Besucht bestätigt'
export const WORLD_MAP_BESUCHT_TEXT =
  'Bestätigte Besuchshistorie ist in Jetnity noch nicht erfasst. Ein vergangenes Datum, eine archivierte Reise oder ein Reise-Status gelten nicht als Besuch.'
/**
 * Kurzform für die Legende. Sie sagt, dass die Historie fehlt – nicht, dass sie
 * leer wäre. Eine Zahl wäre hier eine Behauptung über Wirklichkeit.
 */
export const WORLD_MAP_BESUCHT_KURZ = 'Noch nicht erfasst'
export const WORLD_MAP_LEER_TEXT =
  'Noch keine geplanten Reiseziele in deinem Konto. Die Karte bleibt leer, bis gespeicherte Etappen existieren.'
/** Kurzform für die Legende, damit der leere Zustand nicht doppelt dasteht. */
export const WORLD_MAP_GEPLANT_LEER_KURZ = 'Noch keine geplanten Orte'
export const WORLD_MAP_FEHLER_TEXT =
  'Deine Weltkarte konnte nicht gelesen werden, weil deine Reisen gerade nicht geladen werden konnten.'
export const WORLD_MAP_OHNE_KOORDINATEN_TEXT =
  'Ohne gespeicherte Koordinaten – nicht auf der Karte.'
export const WORLD_MAP_OHNE_LAND_TEXT = 'Kein gespeicherter Ländercode'
const WORLD_MAP_ZIEL_OHNE_NAME = 'Reiseziel'

export const WORLD_MAP_VIEWBOX = { width: 360, height: 180 } as const

export type WorldMapLage = 'fehler' | 'leer' | 'geplant'
export type WorldMapBesuchtLage = 'nicht_erfasst'

export type WorldMapHerkunft = {
  tripId: string
  tripTitle: string
  tripStatus: TripStatus
  tripStartDate: string | null
  tripEndDate: string | null
  stagePosition: number
  stageName: string
}

/**
 * Eine Reise, die diesen Ort beisteuert. Status und Zeitraum stammen aus der
 * bereits geladenen Reiseübersicht – keine zweite Abfrage, keine Ableitung.
 */
export type WorldMapReise = {
  tripId: string
  tripTitle: string
  tripStatus: TripStatus
  startDate: string | null
  endDate: string | null
}

export type WorldMapOrt = {
  schluessel: string
  placeId: string | null
  name: string
  countryCode: string | null
  countryLabel: string | null
  latitude: number | null
  longitude: number | null
  geplottet: boolean
  x: number | null
  y: number | null
  herkuenfte: readonly WorldMapHerkunft[]
  /**
   * Unique trips that contribute this canonical place, keyed by tripId
   * (never by title). Order is deterministic, not a semantic primary.
   */
  reisen: readonly WorldMapReise[]
}

export type WorldMapAbleitung = {
  lage: WorldMapLage
  titel: string
  unterscheidung: string
  geplantLabel: string
  besuchtLabel: string
  besuchtLage: WorldMapBesuchtLage
  besuchtText: string
  besuchtKurz: string
  leerText: string
  fehlerText: string
  zusammenfassung: string
  /** Kurzform der geplanten Lage für die Legende. */
  geplantKurz: string
  laenderText: string
  laenderCodes: readonly string[]
  orte: readonly WorldMapOrt[]
  geplottet: number
  ungeplottet: number
}

const LEERE_ABLEITUNG = {
  titel: WORLD_MAP_TITEL,
  unterscheidung: WORLD_MAP_UNTERSCHEIDUNG,
  geplantLabel: WORLD_MAP_GEPLANT_LABEL,
  besuchtLabel: WORLD_MAP_BESUCHT_LABEL,
  besuchtLage: 'nicht_erfasst' as const,
  besuchtText: WORLD_MAP_BESUCHT_TEXT,
  besuchtKurz: WORLD_MAP_BESUCHT_KURZ,
  leerText: WORLD_MAP_LEER_TEXT,
  fehlerText: WORLD_MAP_FEHLER_TEXT,
}

export function weltOrtDomId(schluessel: string): string {
  return `welt-ort-${schluessel.replace(/[^a-zA-Z0-9_-]/g, '_')}`
}

export function istGueltigeKarteKoordinate(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean {
  return (
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

export function weltKarteProjektion(latitude: number, longitude: number): { x: number; y: number } {
  return {
    x: longitude + 180,
    y: 90 - latitude,
  }
}

function kanonischerPlaceId(wert: string | null | undefined): string | null {
  if (wert == null || typeof wert !== 'string') return null
  const getrimmt = wert.trim()
  return getrimmt.length > 0 ? getrimmt : null
}

function gespeicherterName(wert: string): string {
  const getrimmt = wert.trim()
  return getrimmt.length > 0 ? getrimmt : WORLD_MAP_ZIEL_OHNE_NAME
}

function gespeicherterCountryCode(wert: string | null | undefined): string | null {
  if (wert == null || typeof wert !== 'string') return null
  const getrimmt = wert.trim()
  return getrimmt.length > 0 ? getrimmt : null
}

function eindeutigeOrtReisen(herkuenfte: readonly WorldMapHerkunft[]): WorldMapReise[] {
  const gesehen = new Set<string>()
  const reisen: WorldMapReise[] = []
  for (const herkunft of herkuenfte) {
    if (gesehen.has(herkunft.tripId)) continue
    gesehen.add(herkunft.tripId)
    reisen.push({
      tripId: herkunft.tripId,
      tripTitle: herkunft.tripTitle,
      tripStatus: herkunft.tripStatus,
      startDate: herkunft.tripStartDate,
      endDate: herkunft.tripEndDate,
    })
  }
  return reisen
}

function vergleichText(links: string, rechts: string): number {
  const vergleich = links.localeCompare(rechts, 'de', { sensitivity: 'base' })
  return vergleich !== 0 ? vergleich : links.localeCompare(rechts)
}

function herkunftSort(links: WorldMapHerkunft, rechts: WorldMapHerkunft): number {
  return (
    vergleichText(links.tripId, rechts.tripId) ||
    links.stagePosition - rechts.stagePosition ||
    vergleichText(links.stageName, rechts.stageName)
  )
}

function ortSort(links: WorldMapOrt, rechts: WorldMapOrt): number {
  const landLinks = links.countryCode ?? '\uFFFF'
  const landRechts = rechts.countryCode ?? '\uFFFF'
  return (
    vergleichText(landLinks, landRechts) ||
    vergleichText(links.name, rechts.name) ||
    vergleichText(links.herkuenfte[0]?.tripTitle ?? '', rechts.herkuenfte[0]?.tripTitle ?? '') ||
    vergleichText(links.schluessel, rechts.schluessel)
  )
}

function laenderText(codes: readonly string[]): string {
  if (codes.length === 0) {
    return 'Keine gespeicherten Ländercodes bei den geplanten Etappen.'
  }
  if (codes.length === 1) {
    return '1 Land aus gespeichertem Ländercode.'
  }
  return `${codes.length} Länder aus gespeicherten Ländercodes.`
}

function orteWort(anzahl: number): string {
  return anzahl === 1 ? '1 Ort' : `${anzahl} Orte`
}

function zusammenfassung(geplottet: number, ungeplottet: number): string {
  if (geplottet === 0 && ungeplottet === 0) return WORLD_MAP_LEER_TEXT
  // Eine Null ist hier keine Information, sondern Rauschen in einer engen Zeile.
  if (ungeplottet === 0) return `${orteWort(geplottet)} auf der Karte`
  if (geplottet === 0) return `${orteWort(ungeplottet)} ohne gespeicherte Koordinaten`
  const liste =
    ungeplottet === 1
      ? '1 ohne gespeicherte Koordinaten'
      : `${ungeplottet} ohne gespeicherte Koordinaten`
  return `${orteWort(geplottet)} auf der Karte · ${liste}`
}

function etappenEinerReise(
  reise: TripSummary,
): readonly (TripSummaryStage & { reise: TripSummary; index: number })[] {
  return reise.stages.map((etappe, index) => ({ ...etappe, reise, index }))
}

function herkunftAus(
  etappe: TripSummaryStage & { reise: TripSummary; index: number },
): WorldMapHerkunft {
  return {
    tripId: etappe.reise.id,
    tripTitle: etappe.reise.title,
    tripStatus: etappe.reise.status,
    tripStartDate: etappe.reise.startDate,
    tripEndDate: etappe.reise.endDate,
    stagePosition: etappe.position,
    stageName: etappe.name.trim(),
  }
}

function ortAusGruppe(
  schluessel: string,
  placeId: string | null,
  gruppe: readonly (TripSummaryStage & { reise: TripSummary; index: number })[],
): WorldMapOrt {
  const herkuenfte = [...gruppe].map(herkunftAus).sort(herkunftSort)

  const sortiert = [...gruppe].sort((links, rechts) =>
    herkunftSort(herkunftAus(links), herkunftAus(rechts)),
  )

  const nameQuelle = sortiert.find((etappe) => etappe.name.trim().length > 0)
  const landQuelle = sortiert.find((etappe) => gespeicherterCountryCode(etappe.countryCode))
  const koordinateQuelle = sortiert.find((etappe) =>
    istGueltigeKarteKoordinate(etappe.latitude, etappe.longitude),
  )
  const countryCode = gespeicherterCountryCode(landQuelle?.countryCode ?? null)
  const latitude = koordinateQuelle?.latitude ?? null
  const longitude = koordinateQuelle?.longitude ?? null
  const geplottet = istGueltigeKarteKoordinate(latitude, longitude)
  const projektion =
    geplottet && latitude !== null && longitude !== null
      ? weltKarteProjektion(latitude, longitude)
      : null

  return {
    schluessel,
    placeId,
    name: gespeicherterName(nameQuelle?.name ?? ''),
    countryCode,
    countryLabel: countryCode ? landAnzeigeText(countryCode) : null,
    latitude: geplottet ? latitude : null,
    longitude: geplottet ? longitude : null,
    geplottet,
    x: projektion?.x ?? null,
    y: projektion?.y ?? null,
    herkuenfte,
    reisen: eindeutigeOrtReisen(herkuenfte),
  }
}

export function worldMapAbleiten({
  problem,
  reisen,
}: {
  problem: Problem | null
  reisen: readonly TripSummary[]
}): WorldMapAbleitung {
  if (problem) {
    return {
      ...LEERE_ABLEITUNG,
      lage: 'fehler',
      zusammenfassung: WORLD_MAP_FEHLER_TEXT,
      geplantKurz: WORLD_MAP_FEHLER_TEXT,
      laenderText: WORLD_MAP_FEHLER_TEXT,
      laenderCodes: [],
      orte: [],
      geplottet: 0,
      ungeplottet: 0,
    }
  }

  const etappen = reisen.flatMap(etappenEinerReise)
  if (etappen.length === 0) {
    return {
      ...LEERE_ABLEITUNG,
      lage: 'leer',
      zusammenfassung: WORLD_MAP_LEER_TEXT,
      geplantKurz: WORLD_MAP_GEPLANT_LEER_KURZ,
      laenderText: 'Keine gespeicherten Ländercodes bei den geplanten Etappen.',
      laenderCodes: [],
      orte: [],
      geplottet: 0,
      ungeplottet: 0,
    }
  }

  const gruppen = new Map<string, (TripSummaryStage & { reise: TripSummary; index: number })[]>()
  for (const etappe of etappen) {
    const placeId = kanonischerPlaceId(etappe.placeId)
    const schluessel = placeId
      ? `place:${placeId}`
      : `stage:${etappe.reise.id}:${etappe.position}:${etappe.index}`
    const bisher = gruppen.get(schluessel)
    if (bisher) bisher.push(etappe)
    else gruppen.set(schluessel, [etappe])
  }

  const orte = [...gruppen.entries()]
    .map(([schluessel, gruppe]) =>
      ortAusGruppe(schluessel, kanonischerPlaceId(gruppe[0]?.placeId ?? null), gruppe),
    )
    .sort(ortSort)

  const geplottet = orte.filter((ort) => ort.geplottet).length
  const ungeplottet = orte.length - geplottet
  const laenderCodes = [
    ...new Set(
      orte
        .map((ort) => countryCodeNormalisieren(ort.countryCode) ?? null)
        .filter((code): code is string => code !== null),
    ),
  ].sort(vergleichText)

  return {
    ...LEERE_ABLEITUNG,
    lage: 'geplant',
    zusammenfassung: zusammenfassung(geplottet, ungeplottet),
    geplantKurz: zusammenfassung(geplottet, ungeplottet),
    laenderText: laenderText(laenderCodes),
    laenderCodes,
    orte,
    geplottet,
    ungeplottet,
  }
}
