// lib/route/chronologie.ts
//
// Belegte Route-Reihenfolge. Item-Datum+Zeit und Segmentdaten bleiben getrennt.
// Date-only darf eine vorhandene Segmentzeit nicht auf 00:00 degradieren.
//
// departureDate/departureTime sind Ortszeiten des jeweiligen Flughafens.
// Cross-Airport-Wanduhren sind keine absolute Chronologie. Vergleichbar sind:
//   - lokale Zeiten am selben bewiesenen Airport
//   - Kalenderabstände, die ohne Offset-Wissen eindeutig bleiben
//   - eine eindeutige azyklische Airport-Kette, die die deklarierte Reihenfolge bestätigt
// Eine andere eindeutige Kette darf Open-Jaw/Home-Arrival nicht zur Origin-Wahrheit umdrehen.
// Segmente innerhalb eines Legs dürfen bei genau einem kontinuierlichen Hamiltonian
// oder genau einem gemischten Hamiltonian mit same-country Surface-Kante rekonstruiert werden.
// Bekannte IATA-Codes allein beweisen keine Reihenfolge.
// Lexikalische Pfade und Date-Line-Uhrzeiten erfinden keine Business-Truth.

import { tageZwischen } from '@/lib/flights/zeit'
import { landescodeLesen } from '@/lib/readiness/domain'
import type { FlugRouteItinerary, RouteItineraryMitQuelle, RouteSegment } from '@/lib/route/domain'
import { pfadAusItinerary } from '@/lib/route/pfad'
import { iataLesen } from '@/lib/route/referenz'

const SICHERE_KALENDERTAGE = 3

type StartKorn = 'datetime' | 'date'

type StartWert = {
  instant: string
  korn: StartKorn
}

type StartKandidaten = {
  item: StartWert | null
  segment: StartWert | null
}

type Ordnung = 'before' | 'after' | 'unknown'

function kalendertag(wert: string | null | undefined): string | null {
  if (!wert || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return null
  const [jahr, monat, tag] = wert.split('-').map(Number)
  const datum = new Date(Date.UTC(jahr ?? 0, (monat ?? 0) - 1, tag ?? 0))
  if (
    datum.getUTCFullYear() !== jahr ||
    datum.getUTCMonth() !== (monat ?? 0) - 1 ||
    datum.getUTCDate() !== tag
  ) {
    return null
  }
  return wert
}

function uhrzeit(wert: string | null | undefined): string | null {
  return wert && /^\d{2}:\d{2}$/.test(wert) ? wert : null
}

function startWert(tag: string | null, zeit: string | null): StartWert | null {
  if (!tag) return null
  if (zeit) return { instant: `${tag}T${zeit}`, korn: 'datetime' }
  return { instant: tag, korn: 'date' }
}

function airportCode(punkt: { airportCode: string | null } | undefined): string | null {
  return iataLesen(punkt?.airportCode ?? null)
}

function beinAnfang(bein: FlugRouteItinerary['legs'][number]): string | null {
  return airportCode(bein.segments[0]?.origin)
}

function beinEnde(bein: FlugRouteItinerary['legs'][number]): string | null {
  const segmente = bein.segments
  return airportCode(segmente[segmente.length - 1]?.destination)
}

function itineraryAnfang(itinerary: FlugRouteItinerary): string | null {
  const erstes = itinerary.legs[0]
  return erstes ? beinAnfang(erstes) : null
}

function startKandidaten(eintrag: {
  startsOn?: string | null
  startsAt?: string | null
  itinerary: FlugRouteItinerary
}): StartKandidaten {
  const erstes = eintrag.itinerary.legs[0]?.segments[0]
  return {
    item: startWert(kalendertag(eintrag.startsOn ?? null), uhrzeit(eintrag.startsAt ?? null)),
    segment: startWert(kalendertag(erstes?.departureDate ?? null), uhrzeit(erstes?.departureTime ?? null)),
  }
}

function vergleichLokal(links: StartWert | null, rechts: StartWert | null): 'before' | 'after' | 'tie' | 'unknown' {
  if (!links || !rechts) return 'unknown'

  const linksTag = links.instant.slice(0, 10)
  const rechtsTag = rechts.instant.slice(0, 10)

  if (links.korn === 'datetime' && rechts.korn === 'datetime') {
    if (links.instant < rechts.instant) return 'before'
    if (links.instant > rechts.instant) return 'after'
    return 'tie'
  }

  if (linksTag !== rechtsTag) return linksTag < rechtsTag ? 'before' : 'after'
  return 'unknown'
}

function vergleichStartSicher(
  links: StartWert | null,
  rechts: StartWert | null,
  gleichesAirport: boolean,
): 'before' | 'after' | 'tie' | 'unknown' {
  if (!links || !rechts) return 'unknown'
  if (gleichesAirport) return vergleichLokal(links, rechts)

  const differenz = tageZwischen(links.instant.slice(0, 10), rechts.instant.slice(0, 10))
  if (differenz === null || Math.abs(differenz) < SICHERE_KALENDERTAGE) return 'unknown'
  return differenz > 0 ? 'before' : 'after'
}

function paarOrdnung(
  links: StartKandidaten,
  rechts: StartKandidaten,
  linksAirport: string | null,
  rechtsAirport: string | null,
): Ordnung {
  const gleich = Boolean(linksAirport && rechtsAirport && linksAirport === rechtsAirport)
  const item = vergleichStartSicher(links.item, rechts.item, gleich)
  const segment = vergleichStartSicher(links.segment, rechts.segment, gleich)
  const itemKlar = item === 'before' || item === 'after'
  const segmentKlar = segment === 'before' || segment === 'after'

  if (itemKlar && segmentKlar && item !== segment) return 'unknown'
  if (itemKlar) return item
  if (segmentKlar) return segment
  return 'unknown'
}

const MAX_SEGMENT_REKONSTRUKTION = 8

function kantenKontinuitaet(vonEnde: string | null, nachStart: string | null): boolean {
  return Boolean(vonEnde && nachStart && vonEnde === nachStart)
}

function eindeutigeIndexKette<T>(
  items: readonly T[],
  ende: (item: T) => string | null,
  anfang: (item: T) => string | null,
): number[] | null {
  const n = items.length
  if (n === 0) return []
  if (n === 1) return [0]
  if (n > MAX_SEGMENT_REKONSTRUKTION) return null

  const kanten: boolean[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => false))
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      if (i === j) continue
      kanten[i]![j] = kantenKontinuitaet(ende(items[i]!), anfang(items[j]!))
    }
  }

  const pfade: number[][] = []
  function suche(genutzt: Set<number>, pfad: number[]): void {
    if (pfade.length > 1) return
    if (pfad.length === n) {
      pfade.push([...pfad])
      return
    }
    for (let index = 0; index < n; index += 1) {
      if (genutzt.has(index)) continue
      const letztes = pfad[pfad.length - 1]
      if (letztes !== undefined && !kanten[letztes]![index]) continue
      genutzt.add(index)
      pfad.push(index)
      suche(genutzt, pfad)
      pfad.pop()
      genutzt.delete(index)
    }
  }
  suche(new Set(), [])
  return pfade.length === 1 ? pfade[0]! : null
}

function deklarierteKetteStimmt<T>(
  items: readonly T[],
  ende: (item: T) => string | null,
  anfang: (item: T) => string | null,
  zeitOrdnung: (links: T, rechts: T) => Ordnung,
): boolean {
  const kette = eindeutigeIndexKette(items, ende, anfang)
  if (!kette || !kette.every((index, position) => index === position)) return false
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (zeitOrdnung(items[i]!, items[j]!) === 'after') return false
    }
  }
  return true
}

function mengeOrdnung(
  zeitTotal: boolean,
  deklariert: boolean,
): 'time' | 'declared' | null {
  if (zeitTotal) return 'time'
  if (deklariert) return 'declared'
  return null
}

function kontinuitaet(vorher: RouteSegment, nachher: RouteSegment): boolean {
  const dest = airportCode(vorher.destination)
  const orig = airportCode(nachher.origin)
  return Boolean(dest && orig && dest === orig)
}

function oberflaechenKante(vorher: RouteSegment, nachher: RouteSegment): boolean {
  const dest = airportCode(vorher.destination)
  const orig = airportCode(nachher.origin)
  if (!dest || !orig || dest === orig) return false
  const destLand = landescodeLesen(vorher.destination.countryCode)
  const origLand = landescodeLesen(nachher.origin.countryCode)
  return Boolean(destLand && origLand && destLand === origLand)
}

function hamiltonPfade(
  segmente: readonly RouteSegment[],
  kante: (vorher: RouteSegment, nachher: RouteSegment) => boolean,
): number[][] {
  const pfade: number[][] = []
  const n = segmente.length
  if (n === 0 || n > MAX_SEGMENT_REKONSTRUKTION) return pfade

  function suche(genutzt: Set<number>, pfad: number[]): void {
    if (pfad.length === n) {
      pfade.push([...pfad])
      return
    }
    for (let index = 0; index < n; index += 1) {
      if (genutzt.has(index)) continue
      const letztes = pfad[pfad.length - 1]
      if (letztes !== undefined && !kante(segmente[letztes]!, segmente[index]!)) continue
      genutzt.add(index)
      pfad.push(index)
      suche(genutzt, pfad)
      pfad.pop()
      genutzt.delete(index)
    }
  }

  suche(new Set(), [])
  return pfade
}

function kontinuierlichePfade(segmente: readonly RouteSegment[]): number[][] {
  return hamiltonPfade(segmente, kontinuitaet)
}

function mischPfade(segmente: readonly RouteSegment[]): number[][] {
  return hamiltonPfade(
    segmente,
    (vorher, nachher) => kontinuitaet(vorher, nachher) || oberflaechenKante(vorher, nachher),
  )
}

function eindeutigeSegmentKette(segmente: readonly RouteSegment[]): number[] | null {
  if (segmente.length <= 1) return segmente.map((_, index) => index)
  if (segmente.length > MAX_SEGMENT_REKONSTRUKTION) return null
  const pfade = kontinuierlichePfade(segmente)
  if (pfade.length === 1) return pfade[0]!
  if (pfade.length > 1) return null
  const misch = mischPfade(segmente)
  return misch.length === 1 ? misch[0]! : null
}

export function segmenteOrdnungBewiesen(segmente: readonly RouteSegment[]): boolean {
  return eindeutigeSegmentKette(segmente) !== null
}

function segmenteKanonisieren(segmente: readonly RouteSegment[]): RouteSegment[] {
  const kette = eindeutigeSegmentKette(segmente)
  if (!kette) return [...segmente]
  return kette.map((index) => segmente[index]!)
}

function paarRelationenKonsistent<T>(
  items: readonly T[],
  ordnung: (links: T, rechts: T) => Ordnung,
): boolean {
  const n = items.length
  if (n <= 1) return true
  const nachfolger: number[][] = Array.from({ length: n }, () => [])
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const vergleich = ordnung(items[i]!, items[j]!)
      if (vergleich === 'unknown') return false
      if (vergleich === 'before') nachfolger[i]!.push(j)
      else nachfolger[j]!.push(i)
    }
  }
  const farbe = new Array<number>(n).fill(0)
  function dfs(knoten: number): boolean {
    farbe[knoten] = 1
    for (const next of nachfolger[knoten]!) {
      if (farbe[next] === 1) return true
      if (farbe[next] === 0 && dfs(next)) return true
    }
    farbe[knoten] = 2
    return false
  }
  for (let i = 0; i < n; i += 1) {
    if (farbe[i] === 0 && dfs(i)) return false
  }
  return true
}

function beinStart(bein: FlugRouteItinerary['legs'][number]): StartWert | null {
  const erstes = bein.segments[0]
  return startWert(kalendertag(erstes?.departureDate ?? null), uhrzeit(erstes?.departureTime ?? null))
}

function beinPaarOrdnung(
  links: FlugRouteItinerary['legs'][number],
  rechts: FlugRouteItinerary['legs'][number],
): Ordnung {
  const kandidatenLinks: StartKandidaten = { item: null, segment: beinStart(links) }
  const kandidatenRechts: StartKandidaten = { item: null, segment: beinStart(rechts) }
  return paarOrdnung(kandidatenLinks, kandidatenRechts, beinAnfang(links), beinAnfang(rechts))
}

function beineOrdnungQuelle(
  beine: readonly FlugRouteItinerary['legs'][number][],
): 'time' | 'declared' | null {
  return mengeOrdnung(
    paarRelationenKonsistent(beine, beinPaarOrdnung),
    deklarierteKetteStimmt(beine, beinEnde, beinAnfang, beinPaarOrdnung),
  )
}

function beineHabenEindeutigeOrdnung(beine: readonly FlugRouteItinerary['legs'][number][]): boolean {
  return beineOrdnungQuelle(beine) !== null
}

function itineraryBeineOrdnen(itinerary: FlugRouteItinerary): FlugRouteItinerary {
  const quelle = beineOrdnungQuelle(itinerary.legs)
  if (quelle !== 'time') return itinerary
  return {
    ...itinerary,
    legs: itinerary.legs
      .map((bein, index) => ({ bein, index }))
      .sort((a, b) => {
        const vergleich = beinPaarOrdnung(a.bein, b.bein)
        if (vergleich === 'before') return -1
        if (vergleich === 'after') return 1
        return a.index - b.index
      })
      .map((eintrag) => eintrag.bein),
  }
}

function itineraryFuerWahrheit(itinerary: FlugRouteItinerary): FlugRouteItinerary {
  return itineraryBeineOrdnen({
    ...itinerary,
    legs: itinerary.legs.map((bein) => ({
      segments: segmenteKanonisieren(bein.segments),
    })),
  })
}

function itineraryPaarOrdnung(
  links: { startsOn?: string | null; startsAt?: string | null; itinerary: FlugRouteItinerary },
  rechts: { startsOn?: string | null; startsAt?: string | null; itinerary: FlugRouteItinerary },
): Ordnung {
  return paarOrdnung(
    startKandidaten(links),
    startKandidaten(rechts),
    itineraryAnfang(links.itinerary),
    itineraryAnfang(rechts.itinerary),
  )
}

function itinerariesOrdnungQuelle(
  itineraries: readonly { startsOn?: string | null; startsAt?: string | null; itinerary: FlugRouteItinerary }[],
): 'time' | 'declared' | null {
  return paarRelationenKonsistent(itineraries, itineraryPaarOrdnung) ? 'time' : null
}

export function routeChronologieBewiesen(
  itineraries: readonly { startsOn?: string | null; startsAt?: string | null; itinerary: FlugRouteItinerary }[],
): boolean {
  for (const eintrag of itineraries) {
    for (const bein of eintrag.itinerary.legs) {
      if (!segmenteOrdnungBewiesen(bein.segments)) return false
    }
    if (!beineHabenEindeutigeOrdnung(eintrag.itinerary.legs)) return false
  }
  return itinerariesOrdnungQuelle(itineraries) !== null
}

function itinerariesSortieren<
  T extends Pick<RouteItineraryMitQuelle, 'itinerary'> & {
    startsOn?: string | null
    startsAt?: string | null
  },
>(itineraries: readonly T[], bewiesen: boolean): T[] {
  const zeitSort = bewiesen && itinerariesOrdnungQuelle(itineraries) === 'time'
  return itineraries
    .map((eintrag, index) => ({ eintrag, index }))
    .sort((a, b) => {
      if (zeitSort) {
        const ordnung = itineraryPaarOrdnung(a.eintrag, b.eintrag)
        if (ordnung === 'before') return -1
        if (ordnung === 'after') return 1
        return a.index - b.index
      }
      if (bewiesen) return a.index - b.index
      return pfadAusItinerary(a.eintrag.itinerary).localeCompare(pfadAusItinerary(b.eintrag.itinerary))
    })
    .map((eintrag) => eintrag.eintrag)
}

export function itinerariesWahrheit<
  T extends Pick<RouteItineraryMitQuelle, 'itinerary'> & {
    startsOn?: string | null
    startsAt?: string | null
  },
>(itineraries: readonly T[]): { wahrheit: T[]; bewiesen: boolean } {
  const kanonisch = itineraries.map((eintrag) => ({
    ...eintrag,
    itinerary: itineraryFuerWahrheit(eintrag.itinerary),
  }))
  const bewiesen = routeChronologieBewiesen(kanonisch)
  return {
    wahrheit: itinerariesSortieren(kanonisch, bewiesen),
    bewiesen,
  }
}

export function itinerariesFuerWahrheit<
  T extends Pick<RouteItineraryMitQuelle, 'itinerary'> & {
    startsOn?: string | null
    startsAt?: string | null
  },
>(itineraries: readonly T[]): T[] {
  return itinerariesWahrheit(itineraries).wahrheit
}
