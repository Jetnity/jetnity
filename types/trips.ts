// types/trips.ts
//
// Das Reisemodell der Anwendung.
//
// Es hat genau eine Form, egal wo die Reise liegt: Eine Gastreise im
// `localStorage` und eine Reise im Konto sind dasselbe `Trip`. Nur die Kennung
// unterscheidet sich – lokal `trip-<uuid>`, im Konto eine UUID der Datenbank.
// Dadurch arbeitet der Reise-Arbeitsbereich auf einem Typ und nicht auf zwei,
// und die Übernahme ins Konto ist eine Frage der Ablage, nicht der Struktur.
//
// **Feldnamen in Englisch.** Sie stehen eins zu eins zu den Spalten aus
// `supabase/migrations/20260817120000_reiseschema.sql`; ein Mapper ist damit
// eine Umschrift von snake_case nach camelCase und keine Übersetzung, in der
// sich ein Feld verlieren kann. Die Wertebereiche – `calm`, `culture`, `stay` –
// sind ebenfalls die der Datenbank. Was Reisende lesen, steht an einer Stelle:
// `lib/trips/bezeichnungen.ts`.

/** Reisetempo. Werte wie in `trips.pace`. */
export const TRIP_PACES = ['calm', 'balanced', 'intense'] as const
export type TripPace = (typeof TRIP_PACES)[number]

/** Interessen. Werte wie in `trips.interests`. */
export const TRIP_INTERESTS = [
  'culture',
  'nature',
  'food',
  'beach',
  'adventure',
  'wellness',
] as const
export type TripInterest = (typeof TRIP_INTERESTS)[number]

/** Zustand einer Reise. Werte wie in `trips.status`. */
export const TRIP_STATUSES = ['draft', 'planned', 'booked', 'archived'] as const
export type TripStatus = (typeof TRIP_STATUSES)[number]

/** Art eines Planpunkts. Werte wie in `trip_items.kind`. */
export const TRIP_ITEM_KINDS = ['flight', 'stay', 'activity', 'transfer', 'note'] as const
export type TripItemKind = (typeof TRIP_ITEM_KINDS)[number]

/**
 * Woher eine Reise kommt.
 *
 * Der Unterschied ist für die Oberfläche wesentlich: Eine Gastreise liegt nur
 * auf diesem Gerät und ist mit dem Browserspeicher verloren. Das darf niemand
 * erst nach dem Verlust erfahren.
 */
export type TripSource = 'guest' | 'account'

/** Ein Planpunkt: Flug, Unterkunft, Aktivität, Transfer oder freie Notiz. */
export type TripItem = {
  id: string
  /** Tag, an dem der Punkt hängt. `null`, solange er nicht eingeplant ist. */
  dayId: string | null
  /** Etappe, an der der Punkt hängt – etwa eine Unterkunft über mehrere Nächte. */
  stageId: string | null
  kind: TripItemKind
  title: string
  note: string | null
  position: number
  startsOn: string | null
  /** Ortszeit `HH:MM`, absichtlich ohne Zeitzone. */
  startsAt: string | null
  endsOn: string | null
  endsAt: string | null
  priceAmount: number | null
  priceCurrency: string | null
  /** Anbieterkennung für Phase 3, etwa `amadeus`. */
  provider: string | null
  externalRef: string | null
  bookingUrl: string | null
}

/**
 * Ein Reisetag.
 *
 * `dayIndex` ist die verbindliche Reihenfolge, `dayDate` das optionale
 * Kalenderdatum: Eine Reiseidee hat Tage, bevor sie Daten hat.
 */
export type TripDay = {
  id: string
  dayIndex: number
  dayDate: string | null
  title: string | null
  items: TripItem[]
}

/** Eine Etappe: ein Aufenthalt an einem Ort. Mehrere Ziele sind mehrere Etappen. */
export type TripStage = {
  id: string
  position: number
  name: string
  countryCode: string | null
  arrivalDate: string | null
  departureDate: string | null
  latitude: number | null
  longitude: number | null
}

export type Trip = {
  id: string
  /**
   * Die Kennung, unter der der Client diese Reise angelegt hat.
   *
   * Bei einer Gastreise gleich `id`. Bei einer Reise im Konto die Kennung, mit
   * der sie angelegt wurde – als Gastentwurf im Browser oder als Formular unter
   * /planen. Sie trägt die Idempotenz von `public.reise_anlegen()`
   * (`unique (user_id, client_ref)`).
   */
  clientRef: string | null
  title: string
  origin: string | null
  startDate: string | null
  endDate: string | null
  travellers: number
  /** ISO 4217, etwa `CHF`. */
  currency: string
  budgetAmount: number | null
  status: TripStatus
  pace: TripPace
  interests: TripInterest[]
  travelWish: string | null
  stages: TripStage[]
  days: TripDay[]
  createdAt: string
  updatedAt: string
}

/**
 * Eine Reise in der Liste „Meine Reisen“.
 *
 * Ohne Etappen, Tage und Planpunkte, aber mit ihrer Anzahl: Die Liste zeigt
 * „12 Tage · 8 Punkte“ und soll dafür nicht den ganzen Reisegraphen laden.
 */
export type TripSummary = {
  id: string
  title: string
  origin: string | null
  startDate: string | null
  endDate: string | null
  travellers: number
  currency: string
  budgetAmount: number | null
  status: TripStatus
  updatedAt: string
  stageCount: number
  dayCount: number
  itemCount: number
}

/**
 * Die Angaben, aus denen eine neue Reise entsteht – das Formular unter /planen.
 *
 * `clientRef` gehört dazu und ist keine technische Beigabe: Sie entscheidet, ob
 * ein zweiter Anlauf dieselbe Reise ergibt oder eine zweite. Beide Ablagen
 * benutzen sie – im Browser als Kennung des Entwurfs, in der Datenbank als
 * `trips.client_ref`.
 */
export type CreateTripInput = {
  clientRef: string
  title: string
  destination: string
  origin: string
  startDate: string
  endDate: string
  travellers: number
  currency: string
  budgetAmount: number | null
  pace: TripPace
  interests: TripInterest[]
  travelWish: string | null
}
