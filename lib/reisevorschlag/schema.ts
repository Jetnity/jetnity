// lib/reisevorschlag/schema.ts
//
// Was ein Reisevorschlag sein darf.
//
// ---------------------------------------------------------------------------
// Zwei Schemata für dieselbe Sache, und beide sind nötig
// ---------------------------------------------------------------------------
//
// `VORSCHLAG_JSON_SCHEMA` geht mit dem Aufruf an OpenAI. Mit `strict: true`
// garantiert die Plattform, dass die Antwort ihm entspricht: keine fehlende
// Eigenschaft, kein unbekannter Enum-Wert, kein zusätzliches Feld. Das ist eine
// Zusage über die *Form*.
//
// `modellvorschlagSchema` prüft dieselbe Antwort danach ein zweites Mal, hier,
// mit Zod. Das ist keine Doppelarbeit, weil es eine andere Frage beantwortet:
// Ein Titel mit 400 Zeichen, ein Tag mit der Nummer 99 in einer Reise mit sieben
// Tagen und eine Etappe, die am Tag 3 beginnt und am Tag 1 endet, sind alle
// formgerecht und trotzdem keine Reise. Und ein `strict`-Schema ist eine Zusage
// des Anbieters, keine Eigenschaft von Jetnity: Modelloutput bleibt untrusted
// input (AGENTS.md Regel 15, ADR-0053).
//
// Der Umfang beider Seiten wird in `lib/reisevorschlag/schema.test.ts`
// verglichen, damit ein neues Feld nicht auf einer Seite fehlen kann.
//
// ---------------------------------------------------------------------------
// Was in diesem Schema nicht vorkommt – und warum
// ---------------------------------------------------------------------------
//
// Kein `id`, kein `user_id`, kein `status`, kein `provider`, kein
// `booking_url`, kein `price`. Nicht als verbotener Wert, sondern gar nicht:
// `additionalProperties: false` macht sie unaussprechbar. Ein Feld, das es nicht
// gibt, muss nicht gefiltert werden.
//
// Das ist die eigentliche Antwort auf „keine erfundenen Live-Angebote“. Preise,
// Verfügbarkeiten und Anbieter kommen ab Phase 3 von einem Provider; bis dahin
// kann das Modell sie strukturell nicht behaupten. Bleibt der Fall, dass ein
// Preis im Freitext landet („Flug ab CHF 412“) – dafür
// `lib/reisevorschlag/normalisierung.ts`.
//
// ---------------------------------------------------------------------------
// Die Grenzen sind die des Reiseschemas
// ---------------------------------------------------------------------------
//
// Titel, Notiz, Reisende, Etappen: dieselben Zahlen wie in
// `lib/trips/schema.ts`, weil derselbe Reisegraph daraus entsteht. Enger sind
// nur die Zahlen, die der Modellweg selbst begrenzt (Tage, Punkte je Tag): Sie
// bestimmen die Länge der Antwort und damit die Kosten.
//
// Frei von Next, Supabase und `process.env`.

import { z } from 'zod'

import { MODELL_GRENZEN } from '@/lib/modell/konfiguration'
import { GRENZEN } from '@/lib/trips/schema'
import { TRIP_INTERESTS, TRIP_ITEM_KINDS, TRIP_PACES } from '@/types/trips'
import { ohnePreisangabe, ohneSteuerzeichen } from '@/lib/reisevorschlag/normalisierung'

/**
 * Fassung des Vorschlagsformats.
 *
 * Sie steht im Vorschlag selbst und wird beim Übernehmen geprüft. Der Grund ist
 * ein konkreter Ablauf: Ein Vorschlag entsteht im Browser, wird angesehen,
 * vielleicht liegt der Tab eine Stunde offen – und in der Zwischenzeit kann ein
 * Deployment das Format geändert haben. Ein Vorschlag der alten Fassung wird
 * dann abgelehnt statt halb verstanden.
 */
export const VORSCHLAG_FASSUNG = 1

/** Grenzen, die nur für einen Vorschlag gelten. Die übrigen kommen aus `GRENZEN`. */
export const VORSCHLAG_GRENZEN = {
  /**
   * Tage je Vorschlag.
   *
   * Das Reiseschema lässt 366 zu. Ein Vorschlag bleibt deutlich darunter, und
   * zwar aus zwei Gründen: Die Antwort muss in `MODELL_GRENZEN.ausgabeTokens`
   * passen, und eine Reise über ein halbes Jahr Tag für Tag vorzuschlagen wäre
   * keine Planung, sondern eine Aufzählung.
   */
  tage: 30,
  etappen: 8,
  punkteJeTag: 5,
  annahmen: 4,
  annahme: 160,
  /** Die kürzeste Beschreibung, aus der sich etwas lesen lässt. */
  freitextMinimum: 12,
  freitextMaximum: MODELL_GRENZEN.eingabeZeichen,
} as const

// ---------------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------------

/**
 * Freier Text aus dem Modell.
 *
 * Drei Schritte, immer in dieser Reihenfolge: Steuerzeichen weg, Preisangaben
 * weg, dann die Längenprüfung. Umgekehrt gemessen wäre die Grenze die des
 * Rohtexts und nicht die des gespeicherten.
 */
const modelltext = (maximum: number) =>
  z
    .string()
    .transform((wert) => ohnePreisangabe(ohneSteuerzeichen(wert)))
    .pipe(z.string().max(maximum))

const pflichttext = (maximum: number) =>
  modelltext(maximum).pipe(z.string().min(1, 'Ein Titel ist nötig'))

/** Optionaler Text: leer nach der Bereinigung ist `null` und kein leerer String. */
const kanntext = (maximum: number) =>
  z
    .string()
    .nullable()
    .transform((wert) => (wert === null ? '' : ohnePreisangabe(ohneSteuerzeichen(wert))))
    .pipe(z.string().max(maximum))
    .transform((wert) => (wert === '' ? null : wert))

/**
 * Text des Nutzers, nicht des Modells.
 *
 * Steuerzeichen fallen weg, Preisangaben bleiben stehen – und das ist der
 * Unterschied zu `kanntext()`. „Maximal CHF 3'000“ ist im Satz eines Nutzers
 * keine Behauptung über einen Marktpreis, sondern seine eigene Angabe über sein
 * Budget. Sie zu entfernen wäre kein Schutz, sondern der Verlust des Wunsches,
 * um den es geht; dasselbe Feld nimmt über das Formular unter /planen jeden Satz
 * an, den ein Mensch dort schreibt.
 */
const nutzertext = (maximum: number) =>
  z
    .string()
    .nullable()
    .transform((wert) => (wert === null ? '' : ohneSteuerzeichen(wert)))
    .pipe(z.string().max(maximum))
    .transform((wert) => (wert === '' ? null : wert))

const isoDatum = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((wert) => {
    const [jahr, monat, tag] = wert.split('-').map(Number)
    const geprueft = new Date(Date.UTC(jahr, monat - 1, tag))
    return (
      geprueft.getUTCFullYear() === jahr &&
      geprueft.getUTCMonth() === monat - 1 &&
      geprueft.getUTCDate() === tag
    )
  }, 'Dieses Datum gibt es nicht')

const uhrzeit = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)

const punktSchema = z.object({
  art: z.enum(TRIP_ITEM_KINDS),
  titel: pflichttext(GRENZEN.titel),
  notiz: kanntext(GRENZEN.notiz),
  /** Ortszeit, ohne Zeitzone – wie `trip_items.starts_at`. */
  beginn: uhrzeit.nullable(),
})

const tagSchema = z.object({
  nummer: z.number().int().min(1).max(VORSCHLAG_GRENZEN.tage),
  titel: kanntext(GRENZEN.titel),
  punkte: z.array(punktSchema).min(1).max(VORSCHLAG_GRENZEN.punkteJeTag),
})

const etappeSchema = z.object({
  name: pflichttext(GRENZEN.titel),
  laendercode: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .nullable(),
  vonTag: z.number().int().min(1).max(VORSCHLAG_GRENZEN.tage),
  bisTag: z.number().int().min(1).max(VORSCHLAG_GRENZEN.tage),
})

// ---------------------------------------------------------------------------
// Der Vorschlag, wie das Modell ihn liefert
// ---------------------------------------------------------------------------

const modellvorschlagRoh = z.object({
  titel: pflichttext(GRENZEN.titel),
  abreiseort: kanntext(GRENZEN.ort),
  reisende: z.number().int().min(1).max(GRENZEN.reisende),
  waehrung: z.string().regex(/^[A-Z]{3}$/),
  /**
   * Das Budgetziel des Nutzers, nicht ein geschätzter Gesamtpreis.
   *
   * Es steht hier, weil der Nutzer es genannt hat („maximal CHF 3'000“), und
   * wird nach `trips.budget_amount` abgebildet – dasselbe Feld, das das Formular
   * unter /planen füllt. Kein Planpunkt bekommt daraus einen Preis.
   */
  budgetziel: z.number().finite().nonnegative().max(1_000_000).nullable(),
  tempo: z.enum(TRIP_PACES),
  interessen: z.array(z.enum(TRIP_INTERESTS)).max(TRIP_INTERESTS.length),
  /**
   * Nur, wenn der Text einen konkreten Zeitraum nennt.
   *
   * Sonst `null`, und die Reise hat Tage ohne Datum. Das Reiseschema ist
   * absichtlich dafür gebaut (`trips.start_date` ist optional): Eine Reiseidee
   * hat eine Dauer, bevor sie ein Datum hat.
   */
  startdatum: isoDatum.nullable(),
  /**
   * Annahmen, die das Modell treffen musste.
   *
   * Sie stehen in der Vorschau, damit eine Annahme als Annahme erkennbar ist
   * und nicht als Erkenntnis aus dem Text. Gespeichert werden sie nicht
   * (ADR-0055).
   */
  annahmen: z.array(modelltext(VORSCHLAG_GRENZEN.annahme)).max(VORSCHLAG_GRENZEN.annahmen),
  etappen: z.array(etappeSchema).min(1).max(VORSCHLAG_GRENZEN.etappen),
  tage: z.array(tagSchema).min(1).max(VORSCHLAG_GRENZEN.tage),
})

/**
 * Die fachlichen Bedingungen, die eine Form allein nicht ausdrückt.
 *
 * Sie sind kein Feinschliff. Ohne sie entstünde aus einem formgerechten
 * Vorschlag ein Reisegraph, den `public.reise_anlegen()` ablehnt – mitten in der
 * Übernahme, nachdem der Nutzer freigegeben hat.
 */
function stimmigkeitPruefen(
  vorschlag: z.infer<typeof modellvorschlagRoh>,
  ctx: z.RefinementCtx,
) {
  const tage = vorschlag.tage.length

  // `trip_days_index_eindeutig` in der Datenbank verlangt Eindeutigkeit; die
  // Oberfläche verlangt zusätzlich eine Reihe ohne Lücke. Ein Vorschlag mit den
  // Tagen 1, 2, 4 wäre eine Reise mit einem unerklärten Loch.
  const erwartet = Array.from({ length: tage }, (_, stelle) => stelle + 1)
  const gefunden = vorschlag.tage.map((tag) => tag.nummer)
  if (gefunden.some((nummer, stelle) => nummer !== erwartet[stelle])) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tage'],
      message: 'Die Tage sind nicht von 1 an durchnummeriert',
    })
  }

  const punkte = vorschlag.tage.reduce((summe, tag) => summe + tag.punkte.length, 0)
  if (punkte > GRENZEN.punkteJeReise) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tage'],
      message: `Eine Reise trägt höchstens ${GRENZEN.punkteJeReise} Planpunkte`,
    })
  }

  // Etappen müssen die Reise abdecken, in der Reihenfolge und ohne Überlappung.
  // Zwei Etappen am selben Tag hiessen zwei Aufenthaltsorte gleichzeitig.
  let letzterTag = 0
  for (const [stelle, etappe] of vorschlag.etappen.entries()) {
    if (etappe.bisTag < etappe.vonTag) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['etappen', stelle],
        message: 'Eine Etappe endet vor ihrem Beginn',
      })
      return
    }
    if (etappe.vonTag !== letzterTag + 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['etappen', stelle],
        message: 'Die Etappen bilden keine lückenlose Reihenfolge',
      })
      return
    }
    letzterTag = etappe.bisTag
  }

  if (letzterTag !== tage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['etappen'],
      message: 'Die Etappen decken nicht alle Reisetage ab',
    })
  }
}

/** Was das Modell liefern muss. Alles andere ist keine Antwort. */
export const modellvorschlagSchema = modellvorschlagRoh.superRefine(stimmigkeitPruefen)

export type Modellvorschlag = z.infer<typeof modellvorschlagSchema>

// ---------------------------------------------------------------------------
// Der Vorschlag, wie er zwischen Server und Browser liegt
// ---------------------------------------------------------------------------
//
// Er trägt zwei Felder mehr als die Modellantwort, und beide stammen nicht vom
// Modell: die Fassung des Formats und den Freitext des Nutzers. Der Freitext
// wird beim Übernehmen zu `trips.travel_wish` – dem Feld, das genau dafür
// existiert. Ihn durch das Modell zurückzuspiegeln wäre ein Umweg, auf dem er
// sich ändern könnte.
//
// Weil er vom Nutzer stammt, wird er anders behandelt als jeder andere Text
// hier: `nutzertext()` statt `kanntext()`, also ohne das Entfernen von
// Preisangaben. Siehe die Begründung dort.
//
// Dieses Schema ist die Eingangsprüfung von `vorschlagUebernehmen()`. Der
// Vorschlag kommt dort aus dem Browser zurück und ist damit dieselbe Art
// Eingabe wie jede andere: unbekannt.

export const reisevorschlagSchema = modellvorschlagRoh
  .extend({
    fassung: z.literal(VORSCHLAG_FASSUNG),
    reisewunsch: nutzertext(GRENZEN.reisewunsch),
  })
  .superRefine(stimmigkeitPruefen)

export type Reisevorschlag = z.infer<typeof reisevorschlagSchema>

/** Die Reisebeschreibung, wie sie das Formular schickt. */
export const reisebeschreibungSchema = z
  .string()
  .transform(ohneSteuerzeichen)
  .pipe(
    z
      .string()
      .min(
        VORSCHLAG_GRENZEN.freitextMinimum,
        'Beschreibe deine Reise in ein paar Worten – zum Beispiel „7 Tage Thailand ab Zürich, zwei Personen, entspannt“.',
      )
      .max(
        VORSCHLAG_GRENZEN.freitextMaximum,
        `Bitte beschreibe die Reise in höchstens ${VORSCHLAG_GRENZEN.freitextMaximum} Zeichen.`,
      ),
  )

/** Was „Übernehmen“ schickt: der Vorschlag und die Kennung, die ihn idempotent macht. */
export const uebernahmeSchema = z.object({
  clientRef: z.string().min(1).max(64),
  vorschlag: reisevorschlagSchema,
})

// ---------------------------------------------------------------------------
// Das JSON-Schema für die Responses API
// ---------------------------------------------------------------------------
//
// Von Hand geschrieben, nicht aus Zod erzeugt. Ein Erzeuger wäre eine weitere
// Abhängigkeit für eine einzige Struktur, und er müsste dieselbe Einschränkung
// kennen: Die Plattform unterstützt nur einen Teil von JSON Schema. `minLength`
// und `maxLength` gehören nicht dazu – ein unbekanntes Schlüsselwort beantwortet
// die API mit HTTP 400. Längen prüft deshalb Zod, nicht das Schema.
//
// Was hier steht, ist nach der Dokumentation zugelassen: `enum`, `pattern`,
// `format`, `minimum`/`maximum`, `minItems`/`maxItems`, `type: [..., 'null']`
// für optionale Werte. Jede Eigenschaft steht in `required` und jedes Objekt auf
// `additionalProperties: false` – `strict: true` verlangt beides.
//
// Quelle: https://developers.openai.com/api/docs/guides/structured-outputs
// (Abschnitt „Supported schemas“, Stand 18. August 2026)

const HHMM = '^([01][0-9]|2[0-3]):[0-5][0-9]$'

export const VORSCHLAG_SCHEMA_NAME = 'jetnity_reisevorschlag'

export const VORSCHLAG_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'titel',
    'abreiseort',
    'reisende',
    'waehrung',
    'budgetziel',
    'tempo',
    'interessen',
    'startdatum',
    'annahmen',
    'etappen',
    'tage',
  ],
  properties: {
    titel: {
      type: 'string',
      description: `Titel der Reise, höchstens ${GRENZEN.titel} Zeichen, ohne Preisangabe.`,
    },
    abreiseort: {
      type: ['string', 'null'],
      description: 'Abreiseort, wenn der Text einen nennt. Sonst null.',
    },
    reisende: {
      type: 'integer',
      minimum: 1,
      maximum: GRENZEN.reisende,
      description: 'Anzahl Reisender. 1, wenn der Text keine nennt.',
    },
    waehrung: {
      type: 'string',
      pattern: '^[A-Z]{3}$',
      description: 'ISO-4217-Code der genannten Währung, sonst CHF.',
    },
    budgetziel: {
      type: ['number', 'null'],
      minimum: 0,
      maximum: 1_000_000,
      description:
        'Vom Nutzer genanntes Gesamtbudget als Zielwert. Null, wenn der Text keines nennt. Niemals selbst geschätzt.',
    },
    tempo: { type: 'string', enum: [...TRIP_PACES] },
    interessen: {
      type: 'array',
      maxItems: TRIP_INTERESTS.length,
      items: { type: 'string', enum: [...TRIP_INTERESTS] },
      description: 'Nur Interessen, die aus dem Text hervorgehen.',
    },
    startdatum: {
      type: ['string', 'null'],
      format: 'date',
      description:
        'Erster Reisetag, nur wenn der Text einen konkreten Zeitraum nennt. Sonst null – eine Reise ohne Datum ist zulässig.',
    },
    annahmen: {
      type: 'array',
      maxItems: VORSCHLAG_GRENZEN.annahmen,
      items: { type: 'string' },
      description:
        'Kurze Sätze zu Annahmen, die der Text nicht hergibt (z. B. „Reisezeit als Trockenzeit angenommen“). Leer, wenn keine nötig waren.',
    },
    etappen: {
      type: 'array',
      minItems: 1,
      maxItems: VORSCHLAG_GRENZEN.etappen,
      description:
        'Aufenthaltsorte in Reihenfolge. Lückenlos und ohne Überlappung: Die erste Etappe beginnt an Tag 1, jede weitere am Tag nach der vorigen, die letzte endet am letzten Reisetag.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'laendercode', 'vonTag', 'bisTag'],
        properties: {
          name: { type: 'string', description: 'Ort oder Region.' },
          laendercode: { type: ['string', 'null'], pattern: '^[A-Z]{2}$' },
          vonTag: { type: 'integer', minimum: 1, maximum: VORSCHLAG_GRENZEN.tage },
          bisTag: { type: 'integer', minimum: 1, maximum: VORSCHLAG_GRENZEN.tage },
        },
      },
    },
    tage: {
      type: 'array',
      minItems: 1,
      maxItems: VORSCHLAG_GRENZEN.tage,
      description: 'Ein Eintrag je Reisetag, von 1 an durchnummeriert und ohne Lücke.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['nummer', 'titel', 'punkte'],
        properties: {
          nummer: { type: 'integer', minimum: 1, maximum: VORSCHLAG_GRENZEN.tage },
          titel: { type: ['string', 'null'], description: 'Kurzer Titel des Tages, sonst null.' },
          punkte: {
            type: 'array',
            minItems: 1,
            maxItems: VORSCHLAG_GRENZEN.punkteJeTag,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['art', 'titel', 'notiz', 'beginn'],
              properties: {
                art: { type: 'string', enum: [...TRIP_ITEM_KINDS] },
                titel: { type: 'string', description: 'Was geplant ist. Ohne Preis, ohne Anbieter.' },
                notiz: { type: ['string', 'null'], description: 'Ein Satz Hinweis oder null.' },
                beginn: {
                  type: ['string', 'null'],
                  pattern: HHMM,
                  description: 'Ungefähre Ortszeit HH:MM oder null.',
                },
              },
            },
          },
        },
      },
    },
  },
} as const
