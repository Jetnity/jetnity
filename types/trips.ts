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
export const TRIP_ITEM_KINDS = ['flight', 'stay', 'activity', 'transfer', 'rental_car', 'note'] as const
export type TripItemKind = (typeof TRIP_ITEM_KINDS)[number]

/**
 * Fachliche Mobilitätsart eines Transfer-Planpunkts.
 * Keine eigenen Top-Level-`kind`-Werte: Bahn, Bus, Fähre und Transfer
 * bleiben `trip_items.kind = transfer`.
 */
export const MOBILITY_MODES = ['rail', 'bus', 'ferry', 'transfer'] as const
export type MobilityMode = (typeof MOBILITY_MODES)[number]

/**
 * Herkunft strukturierter Mobilitätsfakten.
 * In dieser Foundation nur `user`. Eine Providerbestätigung kommt später
 * serverseitig; der Browser darf sie nicht behaupten.
 */
export const MOBILITY_EVIDENCES = ['user'] as const
export type MobilityEvidence = (typeof MOBILITY_EVIDENCES)[number]

/**
 * Fahrzeugklasse nur wenn der Nutzer sie kennt oder ein Provider sie später
 * liefert. Keine ACRISS-Behauptung und kein erfundener Standard.
 */
export const VEHICLE_CLASSES = [
  'economy',
  'compact',
  'intermediate',
  'fullsize',
  'suv',
  'van',
  'luxury',
] as const
export type VehicleClass = (typeof VEHICLE_CLASSES)[number]

export const TRANSMISSIONS = ['automatic', 'manual'] as const
export type Transmission = (typeof TRANSMISSIONS)[number]

/**
 * Herkunft strukturierter Mietwagenfakten.
 * In dieser Foundation nur `user`. Eine Providerbestätigung kommt später
 * serverseitig; der Browser darf sie nicht behaupten.
 */
export const RENTAL_EVIDENCES = ['user'] as const
export type RentalEvidence = (typeof RENTAL_EVIDENCES)[number]

/**
 * Fachliche Art eines Reisevorbereitungs-Checks.
 * Eigene Domäne, kein `trip_items.kind`.
 */
export const READINESS_KINDS = [
  'entry_check',
  'visa_check',
  'travel_document_check',
  'insurance_check',
  'ticket_confirmation_check',
  'booking_confirmation_check',
  'preparation',
] as const
export type ReadinessKind = (typeof READINESS_KINDS)[number]

/**
 * Nutzer-Vorbereitungsstand. Keine offizielle Visa-/Einreisebestätigung.
 */
export const READINESS_USER_STATUSES = ['open', 'done', 'skipped'] as const
export type ReadinessUserStatus = (typeof READINESS_USER_STATUSES)[number]

/**
 * Herkunft der User-Evidence. In Foundation C nur `user`.
 * Der Browser darf keine offizielle Quelle behaupten.
 */
export const READINESS_EVIDENCES = ['user'] as const
export type ReadinessEvidence = (typeof READINESS_EVIDENCES)[number]

/**
 * Persistierter Nutzer-Vorbereitungsstand einer Reise.
 *
 * Speichert ausdrücklich keine offizielle Anforderungswahrheit.
 * `contextFingerprint` macht alte Checks nach einer relevanten
 * Reiseänderung als veraltet erkennbar.
 */
export type TripReadinessItem = {
  id: string
  /** Idempotente Client-Identität. Gast und Konto teilen dieselbe Form. */
  clientRef: string
  kind: ReadinessKind
  userStatus: ReadinessUserStatus
  evidence: ReadinessEvidence
  /** ISO-3166-1-alpha-2, nur wenn wirklich bekannt. Kein freies Label. */
  countryCode: string | null
  /** Zugehöriger Planpunkt derselben Reise, sonst `null`. */
  tripItemId: string | null
  /** Nur bei `preparation`. Keine Pass-, Ausweis- oder Gesundheitsdaten. */
  title: string | null
  contextFingerprint: string
  createdAt: string
  updatedAt: string
}

/**
 * Buchungsstatus eines Planpunkts. Werte wie in `trip_items.booking_status`.
 *
 * Ein gespeicherter Punkt ist damit nicht automatisch gebucht. `unconfirmed`
 * ist ausgewählt/geplant. `booked` nur nach ausdrücklicher Bestätigung.
 */
export const TRIP_ITEM_BOOKING_STATUSES = ['unconfirmed', 'booked'] as const
export type TripItemBookingStatus = (typeof TRIP_ITEM_BOOKING_STATUSES)[number]

/**
 * Wer den Buchungsstatus gesetzt hat. Werte wie in `trip_items.booking_source`.
 *
 * In dieser Phase nur `user`. Eine vertrauenswürdige Provider-Quelle kommt
 * später serverseitig; der Browser darf sie nicht behaupten.
 */
export const TRIP_ITEM_BOOKING_SOURCES = ['user'] as const
export type TripItemBookingSource = (typeof TRIP_ITEM_BOOKING_SOURCES)[number]

/**
 * Woher eine Reise kommt.
 *
 * Der Unterschied ist für die Oberfläche wesentlich: Eine Gastreise liegt nur
 * auf diesem Gerät und ist mit dem Browserspeicher verloren. Das darf niemand
 * erst nach dem Verlust erfahren.
 */
export type TripSource = 'guest' | 'account'

/** Ein Planpunkt: Flug, Unterkunft, Aktivität, Transfer, Mietwagen oder freie Notiz. */
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
  /** Anbieterkennung für Phase 3, etwa `duffel`. Keine UI-Bindung. */
  provider: string | null
  externalRef: string | null
  bookingUrl: string | null
  /** Ausgewählt/geplant oder ausdrücklich als gebucht bestätigt. */
  bookingStatus: TripItemBookingStatus
  /** `user` nach manueller Bestätigung. `null`, solange unbestätigt. */
  bookingSource: TripItemBookingSource | null
  /** Zeitpunkt der Bestätigung. `null`, solange unbestätigt. */
  bookingConfirmedAt: string | null
  /**
   * Bahn, Bus, Fähre oder allgemeiner Transfer.
   * Nur bei `kind = transfer` gesetzt; sonst und bei Altbestand `null`.
   */
  mobilityMode: MobilityMode | null
  originPlaceId: string | null
  destinationPlaceId: string | null
  originName: string | null
  destinationName: string | null
  /** Zug-/Bus-/Fahrnummer, nur wenn bekannt. */
  connectionRef: string | null
  /** Anzahl Umstiege. `0` = direkt. `null` = unbekannt. */
  mobilityChanges: number | null
  /** `user` bei manueller Erfassung. `null` ohne strukturierte Mobilitätsfakten. */
  mobilityEvidence: MobilityEvidence | null
  /**
   * Vermieter als Nutzerfakt. Nicht der kommerzielle Such-Provider.
   * Nur bei `kind = rental_car` gesetzt.
   */
  rentalSupplier: string | null
  vehicleClass: VehicleClass | null
  transmission: Transmission | null
  /** `user` bei manueller Erfassung. `null` ohne strukturierte Mietwagenfakten. */
  rentalEvidence: RentalEvidence | null
}

/**
 * Ein Reisetag.
 *
 * `dayIndex` ist die verbindliche Reihenfolge, `dayDate` das optionale
 * Kalenderdatum: Eine Reiseidee hat Tage, bevor sie Daten hat.
 *
 * `stageId` bindet den Tag an eine Etappe. Ohne diese Zuordnung wäre eine
 * mehrstufige Reise ohne Kalenderdaten nicht per Sprache änderbar
 * („Florenz einen Tag kürzer“).
 */
export type TripDay = {
  id: string
  /** Etappe, zu der dieser Tag gehört. `null` nur nach dem Entfernen einer Etappe. */
  stageId: string | null
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
  /** Kanonischer Ort. Fehlt beim Altbestand. */
  placeId: string | null
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
  /** Kanonischer Abreiseort. Fehlt beim Altbestand. */
  originPlaceId: string | null
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
  /**
   * Technische Fassung. Steigt bei jeder übernommenen Änderung.
   *
   * Ein Änderungsvorschlag nennt die Fassung, auf der er beruht. Eine neuere
   * Fassung macht den Vorschlag ungültig – zwei offene Tabs überschreiben
   * einander nicht.
   */
  revision: number
  /**
   * Kennung der zuletzt übernommenen Änderung.
   *
   * Retry und Doppelklick mit derselben Kennung ändern die Reise nicht ein
   * zweites Mal.
   */
  lastMutationId: string | null
  stages: TripStage[]
  days: TripDay[]
  /**
   * Planpunkte ohne Tag. Entsteht, wenn ein Tag entfällt (`on delete set null`)
   * oder ein Punkt noch nicht eingeplant ist. Gehört zur Reise, nicht zum
   * letzten Reisetag – Konto und Gast speichern denselben Graphen.
   */
  ohneTag: TripItem[]
  /**
   * Nutzer-Vorbereitungsstand. Fehlt beim Altbestand; dann gilt leer.
   * Offizielle Einreise-/Visa-Wahrheit steht hier bewusst nicht.
   */
  readinessItems?: TripReadinessItem[]
  createdAt: string
  updatedAt: string
}

/** Der vollständige Reisegraph. Seit der Vereinheitlichung identisch mit `Trip`. */
export type Reisegraph = Trip

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
  destinationPlaceId: string
  origin: string
  originPlaceId: string
  startDate: string
  endDate: string
  travellers: number
  currency: string
  budgetAmount: number | null
  pace: TripPace
  interests: TripInterest[]
  travelWish: string | null
}
