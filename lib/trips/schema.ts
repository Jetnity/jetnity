// lib/trips/schema.ts
//
// Laufzeitprüfung des Reisemodells.
//
// Drei Quellen liefern Reisedaten, und keine davon ist vertrauenswürdig:
//
//   · der `localStorage` – von Hand editierbar und über Monate gewachsen,
//   · das Formular unter /planen – ein Client,
//   · die Nutzlast der Übernahme ins Konto – derselbe Client, nur später.
//
// Die Bedingungen hier spiegeln die CHECKs aus
// `supabase/migrations/20260817120000_reiseschema.sql`. Das ist bewusst doppelt:
// Die Datenbank ist die letzte Instanz und bleibt es, aber eine Ablehnung dort
// kommt als SQLSTATE zurück, und ein SQLSTATE ist keine Fehlermeldung für
// Reisende. Wer hier scheitert, bekommt einen Satz; wer hier durchkommt, wird
// von der Datenbank nicht mehr überrascht.
//
// Frei von React, Next und Supabase: Beide Seiten – Browser und Server Action –
// benutzen dieselben Schemata, und der Test braucht keine Laufzeit.

import { z } from 'zod'

import {
  TRIP_INTERESTS,
  TRIP_ITEM_KINDS,
  TRIP_PACES,
  TRIP_STATUSES,
  type Trip,
} from '@/types/trips'
import { interesseLesen, tempoLesen } from '@/lib/trips/bezeichnungen'
import { buchungsquelleLesen, buchungsstatusLesen } from '@/lib/trips/buchung'
import { TAGE_MAXIMUM } from '@/lib/trips/tage'

/** Höchstwerte, die auch die Datenbank kennt. An einer Stelle, damit sie gleich bleiben. */
export const GRENZEN = {
  titel: 120,
  ort: 120,
  reisende: 20,
  reisetageJeReise: TAGE_MAXIMUM,
  reisedauerInTagen: 365,
  etappenJeReise: 50,
  punkteJeReise: 1000,
  notiz: 500,
  reisewunsch: 1000,
} as const

/**
 * Ein Kalenderdatum, das es gibt.
 *
 * `^\d{4}-\d{2}-\d{2}$` allein lässt den 31. Februar durch. PostgreSQL nicht –
 * dort wäre es ein `22008` mitten in der Übernahme.
 */
const datum = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum muss die Form JJJJ-MM-TT haben')
  .refine((wert) => {
    const [jahr, monat, tag] = wert.split('-').map(Number)
    const geprueft = new Date(Date.UTC(jahr, monat - 1, tag))
    return (
      geprueft.getUTCFullYear() === jahr &&
      geprueft.getUTCMonth() === monat - 1 &&
      geprueft.getUTCDate() === tag
    )
  }, 'Dieses Datum gibt es nicht')

/** Ortszeit `HH:MM`. Sekunden speichert die Anwendung nicht. */
const uhrzeit = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Uhrzeit muss die Form HH:MM haben')

const waehrung = z.string().regex(/^[A-Z]{3}$/, 'Währung muss ein ISO-4217-Code sein')

const landescode = z.string().regex(/^[A-Z]{2}$/, 'Ländercode muss zwei Grossbuchstaben haben')

const zeitstempel = z.string().min(1).max(40)

/** Ein Titel ohne Rand-Leerzeichen, wie `char_length(btrim(title))` es verlangt. */
const titel = z
  .string()
  .transform((wert) => wert.trim())
  .pipe(z.string().min(1, 'Ein Titel ist nötig').max(GRENZEN.titel))

const optionalerText = (maximum: number) =>
  z
    .string()
    .transform((wert) => wert.trim())
    .pipe(z.string().max(maximum))
    .transform((wert) => (wert === '' ? null : wert))

/**
 * Betrag mit zwei Nachkommastellen, wie `numeric(12, 2)`.
 *
 * Ohne die Obergrenze schlüge ein grosser Betrag erst in der Datenbank auf, als
 * `22003 numeric field overflow`.
 */
const betrag = z
  .number()
  .finite()
  .nonnegative()
  .max(9_999_999_999.99, 'Der Betrag ist zu gross')
  .transform((wert) => Math.round(wert * 100) / 100)

const tempo = z.unknown().transform((wert, ctx) => {
  const gelesen = tempoLesen(wert)
  if (!gelesen) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Unbekanntes Reisetempo. Erlaubt: ${TRIP_PACES.join(', ')}`,
    })
    return z.NEVER
  }
  return gelesen
})

/**
 * Interessen als Menge.
 *
 * Doppelte Werte fallen heraus, statt eine Ablehnung auszulösen: Der CHECK
 * `trips_interests_eindeutig` verlangt eine Menge, und aus einer Liste eine
 * Menge zu machen ist keine Auslegung, sondern dieselbe Aussage.
 */
const interessen = z
  .array(z.unknown())
  .max(TRIP_INTERESTS.length * 2)
  .transform((werte, ctx) => {
    const gelesen = werte.map(interesseLesen)
    if (gelesen.some((wert) => wert === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Unbekanntes Interesse. Erlaubt: ${TRIP_INTERESTS.join(', ')}`,
      })
      return z.NEVER
    }
    return [...new Set(gelesen as NonNullable<(typeof gelesen)[number]>[])]
  })

// ---------------------------------------------------------------------------
// Der Reisegraph, wie er im Browser liegt
// ---------------------------------------------------------------------------

const planpunktSchema = z.object({
  id: z.string().min(1).max(80),
  dayId: z.string().min(1).max(80).nullable().default(null),
  stageId: z.string().min(1).max(80).nullable().default(null),
  kind: z.enum(TRIP_ITEM_KINDS).default('note'),
  title: titel,
  note: optionalerText(GRENZEN.notiz).nullable().default(null),
  position: z.number().int().min(1).max(500).default(1),
  startsOn: datum.nullable().default(null),
  startsAt: uhrzeit.nullable().default(null),
  endsOn: datum.nullable().default(null),
  endsAt: uhrzeit.nullable().default(null),
  priceAmount: betrag.nullable().default(null),
  priceCurrency: waehrung.nullable().default(null),
  provider: z.string().min(1).max(40).nullable().default(null),
  externalRef: z.string().min(1).max(200).nullable().default(null),
  bookingUrl: z
    .string()
    .url()
    .startsWith('https://', 'Ein Buchungslink muss über HTTPS gehen')
    .max(2048)
    .nullable()
    .default(null),
  bookingStatus: z.unknown().transform(buchungsstatusLesen).default('unconfirmed'),
  bookingSource: z.unknown().transform(buchungsquelleLesen).nullable().default(null),
  bookingConfirmedAt: zeitstempel.nullable().default(null),
})
  .transform((punkt) => {
    const darfBuchen = punkt.kind === 'flight' || punkt.kind === 'stay'
    if (!darfBuchen || punkt.bookingStatus !== 'booked') {
      return {
        ...punkt,
        bookingStatus: 'unconfirmed' as const,
        bookingSource: null,
        bookingConfirmedAt: null,
      }
    }
    return {
      ...punkt,
      bookingSource: 'user' as const,
    }
  })

const reisetagSchema = z.object({
  id: z.string().min(1).max(80),
  stageId: z.string().min(1).max(80).nullable().default(null),
  dayIndex: z.number().int().min(1).max(GRENZEN.reisetageJeReise),
  dayDate: datum.nullable().default(null),
  title: optionalerText(GRENZEN.titel).nullable().default(null),
  items: z.array(planpunktSchema).max(GRENZEN.punkteJeReise).default([]),
})

const etappeSchema = z.object({
  id: z.string().min(1).max(80),
  position: z.number().int().min(1).max(200).default(1),
  name: titel,
  countryCode: landescode.nullable().default(null),
  arrivalDate: datum.nullable().default(null),
  departureDate: datum.nullable().default(null),
  latitude: z.number().min(-90).max(90).nullable().default(null),
  longitude: z.number().min(-180).max(180).nullable().default(null),
  placeId: z.string().min(1).max(80).nullable().default(null),
})

/**
 * Eine vollständige Reise.
 *
 * Auch die Fassung im Browser läuft durch dieses Schema. Was nicht durchkommt,
 * wird verworfen statt halb geladen: Eine Reise mit einem Tag ohne Nummer wäre
 * in der Oberfläche ein Rätsel und in der Übernahme eine Ablehnung.
 */
export const reiseSchema = z
  .object({
    id: z.string().min(1).max(80),
    clientRef: z.string().min(1).max(64).nullable().default(null),
    title: titel,
    origin: optionalerText(GRENZEN.ort).nullable().default(null),
    originPlaceId: z.string().min(1).max(80).nullable().default(null),
    startDate: datum.nullable().default(null),
    endDate: datum.nullable().default(null),
    travellers: z.number().int().min(1).max(GRENZEN.reisende).default(1),
    currency: waehrung.default('CHF'),
    budgetAmount: betrag.nullable().default(null),
    status: z.enum(TRIP_STATUSES).default('draft'),
    pace: tempo,
    interests: interessen.default([]),
    travelWish: optionalerText(GRENZEN.reisewunsch).nullable().default(null),
    revision: z.number().int().min(1).max(1_000_000_000).default(1),
    lastMutationId: z.string().min(1).max(64).nullable().default(null),
    stages: z.array(etappeSchema).max(GRENZEN.etappenJeReise).default([]),
    days: z.array(reisetagSchema).max(GRENZEN.reisetageJeReise).default([]),
    ohneTag: z.array(planpunktSchema).max(GRENZEN.punkteJeReise).default([]),
    createdAt: zeitstempel,
    updatedAt: zeitstempel,
  })
  .superRefine((reise, ctx) => {
    if (reise.startDate && reise.endDate) {
      if (reise.endDate < reise.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: 'Die Rückreise liegt vor der Abreise',
        })
      } else if (tageZwischen(reise.startDate, reise.endDate) > GRENZEN.reisedauerInTagen) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: `Eine Reise dauert höchstens ${GRENZEN.reisedauerInTagen} Tage`,
        })
      }
    }

    // `trip_days_index_eindeutig` und `trip_days_datum_eindeutig` in der
    // Datenbank. Während `reise_aendern()` sind sie aufgeschoben; am Ende des
    // Schreibens und in Zod gelten sie sofort. Zwei Tage mit derselben Nummer
    // wären dort ein `23505`.
    pruefeEindeutig(
      reise.days.map((tag) => tag.dayIndex),
      ctx,
      ['days'],
      'Zwei Tage tragen dieselbe Nummer',
    )
    pruefeEindeutig(
      reise.days.map((tag) => tag.dayDate).filter((wert): wert is string => wert !== null),
      ctx,
      ['days'],
      'Zwei Tage tragen dasselbe Datum',
    )

    const punkte =
      reise.days.reduce((summe, tag) => summe + tag.items.length, 0) + reise.ohneTag.length
    if (punkte > GRENZEN.punkteJeReise) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['days'],
        message: `Eine Reise trägt höchstens ${GRENZEN.punkteJeReise} Planpunkte`,
      })
    }

    const etappenKennungen = new Set(reise.stages.map((etappe) => etappe.id))
    for (const [stelle, tag] of reise.days.entries()) {
      if (tag.stageId && !etappenKennungen.has(tag.stageId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['days', stelle, 'stageId'],
          message: 'Dieser Tag verweist auf eine unbekannte Etappe',
        })
      }
      for (const [ort, punkt] of tag.items.entries()) {
        if (punkt.stageId && !etappenKennungen.has(punkt.stageId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['days', stelle, 'items', ort, 'stageId'],
            message: 'Dieser Planpunkt verweist auf eine unbekannte Etappe',
          })
        }
      }
    }
    for (const [ort, punkt] of reise.ohneTag.entries()) {
      if (punkt.stageId && !etappenKennungen.has(punkt.stageId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ohneTag', ort, 'stageId'],
          message: 'Dieser Planpunkt verweist auf eine unbekannte Etappe',
        })
      }
    }
  })

export type GepruefteReise = z.infer<typeof reiseSchema>

function pruefeEindeutig(
  werte: (string | number)[],
  ctx: z.RefinementCtx,
  path: (string | number)[],
  meldung: string,
) {
  if (new Set(werte).size !== werte.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path, message: meldung })
  }
}

function tageZwischen(von: string, bis: string): number {
  const einTag = 86_400_000
  return Math.round((Date.parse(`${bis}T00:00:00Z`) - Date.parse(`${von}T00:00:00Z`)) / einTag)
}

/**
 * Liest eine Reise aus unbekannten Daten.
 *
 * Gibt `null` statt zu werfen: Der Aufrufer liest den Browserspeicher, und ein
 * unbrauchbarer Eintrag darf die Seite nicht abbrechen.
 */
export function reiseLesen(wert: unknown): Trip | null {
  const ergebnis = reiseSchema.safeParse(wert)
  return ergebnis.success ? ergebnis.data : null
}

// ---------------------------------------------------------------------------
// Die Nutzlast von public.reise_anlegen()
// ---------------------------------------------------------------------------
//
// Sie ist keine Umschrift des Reisegraphen, sondern sein Ausschnitt: Was
// `public.reise_anlegen()` liest, steht hier – und nur das. Ein Feld, das die
// Funktion nicht liest, mitzuschicken wäre die Behauptung, es käme an.

const nutzlastPunktSchema = z.object({
  kind: z.enum(TRIP_ITEM_KINDS),
  title: z.string().min(1).max(GRENZEN.titel),
  note: z.string().max(GRENZEN.notiz).nullable(),
  position: z.number().int().min(1).max(500),
  starts_on: datum.nullable().default(null),
  starts_at: uhrzeit.nullable(),
  ends_on: datum.nullable().default(null),
  ends_at: uhrzeit.nullable().default(null),
  price_amount: betrag.nullable().default(null),
  price_currency: waehrung.nullable().default(null),
  provider: z.string().min(1).max(40).nullable().default(null),
  external_ref: z.string().min(1).max(200).nullable().default(null),
  booking_url: z
    .string()
    .url()
    .startsWith('https://', 'Ein Buchungslink muss über HTTPS gehen')
    .max(2048)
    .nullable()
    .default(null),
  booking_status: z.unknown().transform(buchungsstatusLesen).default('unconfirmed'),
  booking_confirmed_at: zeitstempel.nullable().default(null),
})
  .superRefine((punkt, ctx) => {
    if ((punkt.price_amount === null) !== (punkt.price_currency === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price_amount'],
        message: 'Preis und Währung gehören zusammen.',
      })
    }
  })
  .transform((punkt) => {
    const darfBuchen = punkt.kind === 'flight' || punkt.kind === 'stay'
    if (!darfBuchen || punkt.booking_status !== 'booked') {
      return {
        ...punkt,
        booking_status: 'unconfirmed' as const,
        booking_confirmed_at: null,
      }
    }
    return punkt
  })

const nutzlastTagSchema = z.object({
  day_index: z.number().int().min(1).max(GRENZEN.reisetageJeReise),
  day_date: datum.nullable(),
  title: z.string().min(1).max(GRENZEN.titel).nullable(),
  /**
   * Position der Etappe in derselben Nutzlast, 1-basiert.
   *
   * Darüber erhält `trip_days.stage_id` seine Zuordnung, auch ohne Kalenderdatum.
   */
  stage_position: z.number().int().min(1).max(200).nullable().optional().default(null),
  items: z.array(nutzlastPunktSchema).max(GRENZEN.punkteJeReise),
})

const nutzlastEtappeSchema = z.object({
  position: z.number().int().min(1).max(200),
  name: z.string().min(1).max(GRENZEN.titel),
  country_code: landescode.nullable(),
  arrival_date: datum.nullable(),
  departure_date: datum.nullable(),
  latitude: z.number().min(-90).max(90).nullable().optional().default(null),
  longitude: z.number().min(-180).max(180).nullable().optional().default(null),
  place_id: z.string().min(1).max(80).nullable().optional().default(null),
})

/**
 * Was zur Datenbank geht.
 *
 * `status` fehlt absichtlich: Eine neue Reise ist ein Entwurf, und die Funktion
 * setzt `draft` selbst. `user_id` fehlt ebenfalls – sie kommt aus `auth.uid()`.
 * Beides wäre eine Angabe, die der Client machen könnte, und genau deshalb
 * macht er sie nicht.
 */
export const reiseNutzlastSchema = z.object({
  client_ref: z.string().min(1).max(64),
  title: z.string().min(1).max(GRENZEN.titel),
  origin: z.string().min(1).max(GRENZEN.ort).nullable(),
  origin_place_id: z.string().min(1).max(80).nullable().optional().default(null),
  start_date: datum.nullable(),
  end_date: datum.nullable(),
  travellers: z.number().int().min(1).max(GRENZEN.reisende),
  currency: waehrung,
  budget_amount: betrag.nullable(),
  pace: z.enum(TRIP_PACES),
  interests: z.array(z.enum(TRIP_INTERESTS)),
  travel_wish: z.string().max(GRENZEN.reisewunsch).nullable(),
  stages: z.array(nutzlastEtappeSchema).max(GRENZEN.etappenJeReise),
  days: z.array(nutzlastTagSchema).max(GRENZEN.reisetageJeReise),
  ungeplante: z.array(nutzlastPunktSchema).max(GRENZEN.punkteJeReise).default([]),
})

export type ReiseNutzlast = z.infer<typeof reiseNutzlastSchema>

// ---------------------------------------------------------------------------
// Eingaben der Oberfläche
// ---------------------------------------------------------------------------

export const neueReiseSchema = z.object({
  /**
   * Die Kennung, die das Formular je Anlauf erzeugt.
   *
   * Sie trägt die Idempotenz bis in die Datenbank: Ein Doppelklick auf „Reise
   * erstellen" und ein erneut abgeschickter Vorgang nach einer abgebrochenen
   * Antwort schicken dieselbe Kennung und ergeben über
   * `unique (user_id, client_ref)` dieselbe Reise.
   */
  clientRef: z.string().min(1).max(64),
  title: titel,
  destination: titel,
  destinationPlaceId: z
    .string()
    .min(1, 'Bitte wähle ein Reiseziel aus der Liste.')
    .max(80)
    .refine((wert) => /^geonames:\d+$/.test(wert), 'Kein passendes Reiseziel gefunden. Bitte wähle einen Eintrag aus der Liste.'),
  origin: titel,
  originPlaceId: z
    .string()
    .min(1, 'Bitte wähle einen Abreiseort aus der Liste.')
    .max(80)
    .refine((wert) => /^(geonames:\d+|airport:[A-Z]{3})$/.test(wert), 'Dieser Abreiseort ist unbekannt. Bitte wähle einen Eintrag aus der Liste.'),
  startDate: datum,
  endDate: datum,
  travellers: z.number().int().min(1).max(GRENZEN.reisende),
  currency: waehrung.default('CHF'),
  budgetAmount: betrag.nullable().default(null),
  pace: tempo,
  interests: interessen.default([]),
  travelWish: optionalerText(GRENZEN.reisewunsch).nullable().default(null),
})
  .superRefine((reise, ctx) => {
    if (reise.endDate < reise.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'Die Rückreise darf nicht vor der Abreise liegen.',
      })
    }
  })

export type NeueReise = z.infer<typeof neueReiseSchema>

/**
 * Was das Formular „Punkt hinzufügen" liefert.
 *
 * Ohne Kennungen: Der Tag steht in der Oberfläche fest, und ob er lokal
 * (`day-<uuid>`) oder in der Datenbank (UUID) liegt, ist eine Frage der Ablage
 * und nicht der Eingabe. Beide Arbeitsbereiche prüfen deshalb dasselbe.
 */
export const planpunktFormularSchema = z.object({
  kind: z.enum(TRIP_ITEM_KINDS).default('note'),
  title: titel,
  note: optionalerText(GRENZEN.notiz).nullable().default(null),
  startsAt: uhrzeit.nullable().default(null),
})

export type PlanpunktFormular = z.infer<typeof planpunktFormularSchema>

/** Dasselbe Formular, an eine Reise und einen Tag im Konto gebunden. */
export const neuePlanpunktNutzlastSchema = planpunktFormularSchema.extend({
  tripId: z.string().uuid(),
  dayId: z.string().uuid(),
})

/** Die erste Fehlermeldung eines Prüflaufs, für die Anzeige. */
export function ersteMeldung(fehler: z.ZodError): string {
  return fehler.issues[0]?.message ?? 'Die Angaben sind unvollständig.'
}
