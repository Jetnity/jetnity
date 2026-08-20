// lib/activities/domain.ts
//
// Provider-unabhängige Aktivitätsdomäne für Jetnity.
// Provider-SDKs, Next, Supabase und Umgebungsvariablen gehören nicht hierher.
//
// Grundprinzip: Eine Aktivität ist dann gut, wenn sie zur konkreten Reise
// und zum konkreten Reisetag passt – nicht als beliebige Ticketliste.

export type GeoPunkt = {
  lat: number
  lon: number
}

export const ACTIVITY_SUCHE_GRENZEN = {
  teilnehmer: { min: 1, max: 20 },
  angebote: 40,
  empfohleneOptionen: 5,
  timeoutMs: 12_000,
  maxAnfrageBytes: 16_384,
} as const

export function activityZielKennungAus(etappe: {
  id: string
  placeId: string | null | undefined
}): string {
  const ort = etappe.placeId?.trim()
  return ort ? ort : `stage:${etappe.id}`
}

/**
 * Verfügbarkeitsfakt, getrennt vom statischen Inhalt.
 * Ohne Quelle bleibt das Feld null – kein erfundener Timeslot.
 */
export type ActivityTimeslot = {
  startsOn: string
  startsAt: string
  endsOn: string | null
  endsAt: string | null
}

export type ActivitySuchanfrage = {
  destinationPlaceId: string
  destinationName: string
  dayDate: string | null
  participants: number
  currency: string
  budgetAmount: number | null
  interests: ReadonlyArray<string>
  pace: 'calm' | 'balanced' | 'intense' | null
}

/**
 * Kommerzielle Aktivitätsfakten, normalisiert aus einem Suchanbieter.
 * Keine Affiliate-/Booking-URL: Suche und Monetarisierung bleiben getrennt.
 */
export type ActivityOption = {
  id: string
  provider: string
  externalRef: string
  title: string
  description: string | null
  locationName: string | null
  punkt: GeoPunkt | null
  /** Typische Dauer, wenn die Quelle sie trägt. Kein erfundenes Fenster. */
  dauerMinuten: number | null
  timeslot: ActivityTimeslot | null
  preis: number | null
  preisWaehrung: string | null
  bewertung: number | null
  bewertungenAnzahl: number | null
  stornierbar: boolean | null
  kategorien: string[]
  tags: string[]
}

export type ActivityKonflikt = 'ueberschneidung' | 'frei' | 'unbekannt'

/**
 * Jetnity-Kontext wird unabhängig vom Provider angereichert.
 * Fehlende Werte bleiben null; Ranking darf nichts erfinden.
 */
export type ActivityKontext = {
  interessenFit: number | null
  zeitFit: number | null
  konflikt: ActivityKonflikt
  preisFit: number | null
  dauerFit: number | null
  lageFit: number | null
}

export type ActivityKandidat = ActivityOption & {
  context: ActivityKontext
}

export const ACTIVITY_MARKEN = ['jetnity', 'best_value', 'best_rating', 'flexible', 'compact'] as const
export type ActivityMarke = (typeof ACTIVITY_MARKEN)[number]

export type BewerteteActivityOption = ActivityKandidat & {
  score: number
  labels: ActivityMarke[]
  reasons: string[]
}

export type ActivitySuchStatus =
  | 'ok'
  | 'partial'
  | 'empty'
  | 'unavailable'
  | 'timeout'
  | 'error'
  | 'invalid'
  | 'rate_limited'

/**
 * Was für den Tageskontext tatsächlich belegt ist.
 * Fehlende Werte bleiben unbekannt; die UI darf daraus keine Scheingenauigkeit machen.
 */
export type ActivityEvidenz = {
  hatOrt: boolean
  hatKoordinaten: boolean
  hatTag: boolean
  hatDatum: boolean
  hatBestehendePunkte: boolean
  hatBelastbareZeiten: boolean
  hatInteressen: boolean
  hatBudget: boolean
}

export const LEERE_ACTIVITY_EVIDENZ: ActivityEvidenz = {
  hatOrt: false,
  hatKoordinaten: false,
  hatTag: false,
  hatDatum: false,
  hatBestehendePunkte: false,
  hatBelastbareZeiten: false,
  hatInteressen: false,
  hatBudget: false,
}

export type ActivitySuchergebnis = {
  status: ActivitySuchStatus
  message: string
  coverageNote: string
  evidenz: ActivityEvidenz
  options: BewerteteActivityOption[]
}

export const ACTIVITY_MARKE_TEXT: Record<ActivityMarke, string> = {
  jetnity: 'Jetnity empfiehlt',
  best_value: 'Best Value',
  best_rating: 'Beste Bewertung',
  flexible: 'Flexibel',
  compact: 'Kurz und gut integrierbar',
}

export const ACTIVITY_ABDECKUNGSHINWEIS =
  'Die Aktivitätensuche zeigt verfügbare Angebote unseres jeweils angebundenen Datenpartners. Jetnitys Empfehlung bewertet die Passung zu Reise und Reisetag und ist keine provisionsgetriebene Rangliste.'

export const ACTIVITY_ZEIT_HINWEIS =
  'Jetnity beurteilt Zeitkonflikte nur bei lokalen HH:MM-Angaben am selben Kalendertag. Fehlende Zeiten gelten nicht als konfliktfrei. Mehrtägige Optionen und Zeitzonen aus Koordinaten werden in dieser Phase nicht unterstützt.'
