// lib/hotels/domain.ts
//
// Provider-unabhängige Hotel- und Quartierdomäne für Jetnity.
// Provider-SDKs, Next, Supabase und Umgebungsvariablen gehören nicht hierher.
//
// Grundprinzip: Zuerst die passende Gegend für die konkrete Reise bestimmen,
// danach wenige passende Hotels in dieser Gegend bewerten.

export type GeoPunkt = {
  lat: number
  lon: number
}

export const HOTEL_SUCHE_GRENZEN = {
  zimmer: { min: 1, max: 8 },
  erwachsene: { min: 1, max: 16 },
  kinder: { min: 0, max: 12 },
  angebote: 40,
  empfohleneOptionen: 5,
  timeoutMs: 12_000,
  maxAnfrageBytes: 16_384,
} as const

/** Ob die sichtbare Gegend nur der Etappenort oder ein echter Vorschlag ist. */
export type QuartierHerkunft = 'etappenort' | 'quartiervorschlag'

/** Wann ein Abflug die letzte Nacht näher an den Abreiseweg rückt. */
export const FRUEHER_ABFLUG_MINUTE = 8 * 60

export type HotelPraeferenzen = {
  budgetProNachtMax: number | null
  mindestSterne: number | null
  fruehstueckBevorzugt: boolean | null
  stornierbarBevorzugt: boolean | null
}

export type QuartierPraeferenzen = {
  ruhe: number | null
  nachtleben: number | null
  essen: number | null
  strand: number | null
  familie: number | null
}

export type ReiseAnker = {
  id: string
  name: string
  punkt: GeoPunkt
  /** Relative Bedeutung für die tatsächliche Reise, 0 bis 1. */
  gewicht: number
}

export type QuartierSuchkontext = {
  destinationPlaceId: string
  destinationName: string
  naechte: number
  reiseAnker: ReiseAnker[]
  budgetProNachtMax: number | null
  praeferenzen: QuartierPraeferenzen
  /** 0 bis 1; erhöht die Relevanz der An-/Abreisewege. */
  transferPrioritaet: {
    anreise: number
    abreise: number
  }
}

export type QuartierKandidat = {
  id: string
  name: string
  herkunft: QuartierHerkunft
  zentrum: GeoPunkt
  /** Geschätzte tägliche Wegezeit zu den bekannten Reiseankern. */
  taeglicheWegeMinuten: number | null
  anreiseTransferMinuten: number | null
  abreiseTransferMinuten: number | null
  gehScore: number | null
  oevScore: number | null
  ruheScore: number | null
  nachtlebenScore: number | null
  essenScore: number | null
  strandScore: number | null
  familieScore: number | null
  typischeNachtPreis: number | null
}

export type BewertetesQuartier = QuartierKandidat & {
  score: number
  reasons: string[]
}

/**
 * Was für die Quartierwahl tatsächlich belegt ist.
 * Fehlende Werte bleiben unbekannt; die UI darf daraus keine Scheingenauigkeit machen.
 */
export type QuartierEvidenz = {
  hatOrt: boolean
  hatKoordinaten: boolean
  hatZeitraum: boolean
  hatReiseanker: boolean
  hatWegezeiten: boolean
  hatTransferzeiten: boolean
  hatPraeferenzprofil: boolean
}

export const LEERE_QUARTIER_EVIDENZ: QuartierEvidenz = {
  hatOrt: false,
  hatKoordinaten: false,
  hatZeitraum: false,
  hatReiseanker: false,
  hatWegezeiten: false,
  hatTransferzeiten: false,
  hatPraeferenzprofil: false,
}

export type HotelSuchanfrage = {
  destinationPlaceId: string
  checkIn: string
  checkOut: string
  rooms: number
  adults: number
  children: number
  currency: string
  quartier: {
    id: string
    name: string
    zentrum: GeoPunkt
  } | null
  preferences: HotelPraeferenzen
}

/**
 * Kommerzielle Hotelfakten, normalisiert aus einem Suchanbieter.
 * Keine Affiliate-/Booking-URL: Suche und Monetarisierung bleiben getrennt.
 */
export type HotelOption = {
  id: string
  provider: string
  externalRef: string
  name: string
  punkt: GeoPunkt
  quartierName: string | null
  adresse: string | null
  sterne: number | null
  bewertung: number | null
  bewertungenAnzahl: number | null
  preisGesamt: number
  preisProNacht: number
  preisWaehrung: string
  steuernEnthalten: boolean | null
  stornierbar: boolean | null
  stornierungBis: string | null
  fruehstueckEnthalten: boolean | null
  zimmerName: string | null
}

/**
 * Jetnity-Kontext wird unabhängig vom Hotelprovider angereichert.
 * Fehlende Werte bleiben null; Ranking darf nichts erfinden.
 */
export type HotelKontext = {
  taeglicheWegeMinuten: number | null
  quartierFitScore: number | null
  ruheScore: number | null
  praeferenzFitScore: number | null
}

export type HotelKandidat = HotelOption & {
  context: HotelKontext
}

export const HOTEL_MARKEN = ['jetnity', 'best_value', 'best_location', 'quiet', 'premium'] as const
export type HotelMarke = (typeof HOTEL_MARKEN)[number]

export type BewerteteHotelOption = HotelKandidat & {
  score: number
  labels: HotelMarke[]
  reasons: string[]
}

export type HotelSuchStatus = 'ok' | 'partial' | 'empty' | 'unavailable' | 'timeout' | 'error' | 'invalid' | 'rate_limited'

export type HotelSuchergebnis = {
  status: HotelSuchStatus
  message: string
  coverageNote: string
  quartier: BewertetesQuartier | null
  evidenz: QuartierEvidenz
  options: BewerteteHotelOption[]
}

export const HOTEL_MARKE_TEXT: Record<HotelMarke, string> = {
  jetnity: 'Jetnity empfiehlt',
  best_value: 'Bestes Preis-Leistungs-Verhältnis',
  best_location: 'Beste Lage',
  quiet: 'Ruhigere Alternative',
  premium: 'Premium-Option',
}

export const HOTEL_ABDECKUNGSHINWEIS =
  'Die Hotelsuche zeigt verfügbare Angebote unseres jeweils angebundenen Hotel-Datenpartners. Jetnitys Empfehlung bewertet die Passung zur gesamten Reise und ist keine provisionsgetriebene Rangliste.'
