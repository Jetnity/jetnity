// lib/providers/discovercars/affiliate/ziel.ts
//
// Reiner Affiliate-Link für DiscoverCars. Zwei geprüfte Konstanten, sonst
// die allgemeine Suche. Kein Netzwerk, kein Widget, keine Reisedaten.
// Attribution und Kontenfreigabe sind hier nicht bewiesen.

export const DISCOVERCARS_GENERISCH_HREF =
  'https://www.discovercars.com/?a_aid=jetnity'

export const DISCOVERCARS_BKK_HREF =
  'https://www.discovercars.com/de/thailand/bangkok/suvarnabhumi-airport-bkk?a_aid=jetnity&currency=chf'

/**
 * Geschlossene Stationsidentität für den einen geprüften BKK-Link.
 *
 * ICAO VTBS plus IATA BKK plus Name plus OurAirports-Typ. Die numerische
 * Id aus der lokalen Flughafen-Fixture ist keine kanonische Id und wird
 * nicht verwendet. Ein Stadtname Bangkok reicht nicht.
 */
export const DISCOVERCARS_BKK_STATION = Object.freeze({
  art: 'flughafen',
  iata: 'BKK',
  icao: 'VTBS',
  name: 'Suvarnabhumi Airport',
  klasse: 'large_airport',
})

const BKK_SCHLUESSEL = ['art', 'iata', 'icao', 'klasse', 'name'] as const

export type DiscoverCarsBkkStation = typeof DISCOVERCARS_BKK_STATION

export type DiscoverCarsAffiliateArt = 'generisch' | 'bkk'

export type DiscoverCarsAffiliateZiel = {
  art: DiscoverCarsAffiliateArt
  href: typeof DISCOVERCARS_GENERISCH_HREF | typeof DISCOVERCARS_BKK_HREF
}

function schluesselGenau(wert: object): boolean {
  const eigene = Object.keys(wert).sort()
  if (eigene.length !== BKK_SCHLUESSEL.length) return false
  return BKK_SCHLUESSEL.every((name, index) => eigene[index] === name)
}

/** Nur das eingefrorene Stationsobjekt. Jede Abweichung ist kein BKK. */
export function discoverCarsIstBkkStation(wert: unknown): wert is DiscoverCarsBkkStation {
  if (wert === null || typeof wert !== 'object') return false
  if (Object.getPrototypeOf(wert) !== Object.prototype) return false
  if (Object.getOwnPropertySymbols(wert).length > 0) return false
  if (!schluesselGenau(wert)) return false
  const satz = wert as Record<string, unknown>
  return (
    satz.art === DISCOVERCARS_BKK_STATION.art &&
    satz.iata === DISCOVERCARS_BKK_STATION.iata &&
    satz.icao === DISCOVERCARS_BKK_STATION.icao &&
    satz.name === DISCOVERCARS_BKK_STATION.name &&
    satz.klasse === DISCOVERCARS_BKK_STATION.klasse
  )
}

function konstantenGueltig(href: string, art: DiscoverCarsAffiliateArt): boolean {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  if (url.username !== '' || url.password !== '') return false
  if (url.port !== '') return false
  if (url.hostname !== 'www.discovercars.com') return false
  if (url.hash !== '') return false
  const paare = [...url.searchParams.entries()]
  const namen = paare.map(([name]) => name)
  if (new Set(namen).size !== namen.length) return false
  const aid = paare.filter(([name]) => name === 'a_aid')
  if (aid.length !== 1 || aid[0]?.[1] !== 'jetnity') return false
  if (art === 'generisch') {
    return url.pathname === '/' && paare.length === 1 && href === DISCOVERCARS_GENERISCH_HREF
  }
  const waehrung = paare.filter(([name]) => name === 'currency')
  return (
    url.pathname === '/de/thailand/bangkok/suvarnabhumi-airport-bkk' &&
    paare.length === 2 &&
    waehrung.length === 1 &&
    waehrung[0]?.[1] === 'chf' &&
    href === DISCOVERCARS_BKK_HREF
  )
}

if (!konstantenGueltig(DISCOVERCARS_GENERISCH_HREF, 'generisch')) {
  throw new Error('DiscoverCars: generische Konstante ist nicht die geprüfte Adresse.')
}
if (!konstantenGueltig(DISCOVERCARS_BKK_HREF, 'bkk')) {
  throw new Error('DiscoverCars: BKK-Konstante ist nicht die geprüfte Adresse.')
}

/**
 * Liefert genau eine der beiden Konstanten.
 * `ausdruecklich` ist die eigene Wahl der Besucherin. `station` muss
 * feldgleich zur geprüften Identität sein. Weitere Felder werden ignoriert
 * und nie in die Adresse geschrieben.
 */
export function discoverCarsAffiliateZiel(eingabe: {
  ausdruecklich: boolean
  station: unknown
}): DiscoverCarsAffiliateZiel {
  if (eingabe.ausdruecklich === true && discoverCarsIstBkkStation(eingabe.station)) {
    return { art: 'bkk', href: DISCOVERCARS_BKK_HREF }
  }
  return { art: 'generisch', href: DISCOVERCARS_GENERISCH_HREF }
}

/**
 * Eine andere Reise löscht die Stationswahl. Dieselbe Reise behält sie nur,
 * wenn sie noch exakt die geprüfte Identität ist.
 */
export function discoverCarsStationNachReisewechsel(
  bisherReiseId: string,
  naechsteReiseId: string,
  station: unknown,
): DiscoverCarsBkkStation | null {
  if (bisherReiseId !== naechsteReiseId) return null
  if (!discoverCarsIstBkkStation(station)) return null
  return DISCOVERCARS_BKK_STATION
}

export function discoverCarsMehrereStationen(stationen: number): boolean {
  return Number.isInteger(stationen) && stationen > 1
}
