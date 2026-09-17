// lib/reisebegleiter/schema.ts
//
// Was eine Assistant-Auskunft sein darf – und was sie ausdrücklich nicht ist.
//
// ---------------------------------------------------------------------------
// Generated Suggestion, nichts darüber
// ---------------------------------------------------------------------------
//
// OFFICIAL ≠ PROVIDER ≠ RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.
// Der Reisebegleiter erzeugt die letzte dieser Klassen. Deshalb hat dieses
// Schema kein Feld für eine Anforderung, einen Preis, eine Verfügbarkeit, eine
// Buchung oder eine Quelle: `additionalProperties: false` macht sie
// unaussprechbar, und was unaussprechbar ist, muss später nicht geglaubt werden.
//
// Auf vorhandene Jetnity-Zustände zeigt das Modell über `bezuege` – und zwar
// nur mit den Kennungen, die es im Kontext bekommen hat. Den *Zustand* dieser
// Bezüge schreibt das Modell nicht; er wird in `lib/reisebegleiter/nutzlast.ts`
// aus der akzeptierten Projektion abgeleitet und von der Oberfläche angezeigt.
// Ein Modell, das den Zustand nicht formulieren darf, kann ihn nicht verfälschen.
//
// ---------------------------------------------------------------------------
// Warum Preisangaben und Links abgelehnt und nicht entfernt werden
// ---------------------------------------------------------------------------
//
// `lib/reisevorschlag/schema.ts` entfernt Preisangaben aus Titeln und Notizen,
// weil ein Titel ohne Betrag weiterhin ein Titel ist. Eine Auskunft ist ein
// Satz. Ihm den Betrag herauszuschneiden ergibt einen Satz, der etwas anderes
// behauptet als das Modell geschrieben hat – und den niemand geprüft hat.
// Hier gilt deshalb die andere Richtung: Ein Betrag oder ein Link in einer
// Auskunft ist erfundene Provider- oder Official-Wahrheit, und der Aufruf
// endet als `schema`.
//
// Frei von Next, Supabase und `process.env`.

import { z } from 'zod'

import { MODELL_GRENZEN } from '@/lib/modell/konfiguration'
import { AMTLICHE_AUSSAGEN } from '@/lib/reisebegleiter/aussagen'
import { ohneSteuerzeichen, traegtPreisangabe } from '@/lib/reisevorschlag/normalisierung'

export const BEGLEITER_FASSUNG = 1

export const BEGLEITER_SCHEMA_NAME = 'jetnity_reisebegleiter'

export const BEGLEITER_GRENZEN = {
  /** Kürzeste brauchbare Frage. Kürzer ist keine Frage, sondern ein Tippfehler. */
  frageMinimum: 8,
  /** Dieselbe Obergrenze wie jeder andere Freitext an ein Modell. */
  frageMaximum: MODELL_GRENZEN.eingabeZeichen,

  antwort: 900,
  unsicherheiten: 5,
  unsicherheit: 220,
  schritte: 5,
  schritt: 220,
  bezuege: 8,
  amtlicheHinweise: 8,

  /**
   * Obergrenze der Ausgabe für diesen Weg, einschliesslich Denk-Tokens.
   *
   * Deutlich unter `MODELL_GRENZEN.ausgabeTokens` (6000), und das ist der
   * eigentliche Kostenschutz dieses Slice: Reserviert wird in der Datenbank
   * weiter der schlechteste Fall aus 2600 Eingabe- und 6000 Ausgabetokens.
   * Eine Auskunft von höchstens ~1500 Zeichen braucht davon einen Bruchteil,
   * und die Differenz trägt den Fall, dass der Reisekontext mehr Eingabetokens
   * kostet als die Reservierung annimmt.
   *
   * `lib/reisebegleiter/kosten.test.ts` rechnet das nach, statt es zu behaupten.
   */
  ausgabeTokens: 1600,

  /**
   * Harte Obergrenze für Systemregeln plus Nutzertext, in Zeichen.
   *
   * Sie steht hier, weil der Reisekontext mit der Reise wächst und die
   * Reservierung nicht mitwächst. 24 000 Zeichen sind auch bei pessimistisch
   * gerechneten 2.2 Zeichen je Token noch rund 10 900 Eingabetokens – und
   * damit zusammen mit `ausgabeTokens` unter dem reservierten Betrag.
   * Eine Reise darüber bekommt keine gekürzte Wahrheit, sondern eine ehrliche
   * Ablehnung.
   */
  eingabeZeichen: 24_000,
} as const

/**
 * Ein Link in einer Auskunft.
 *
 * Auch `www.` und ein nacktes `beispiel.example/pfad` zählen: Der Zweck ist
 * nicht, URLs zu erkennen, sondern zu verhindern, dass eine generierte
 * Auskunft wie eine belegte Quelle aussieht.
 */
const LINKMUSTER = /(?:\bhttps?:\/\/|\bwww\.|\b[a-z0-9-]+\.(?:com|net|org|ch|de|at|io|gov|int)\b)/i

export function traegtLink(wert: string): boolean {
  return LINKMUSTER.test(wert)
}

/**
 * Ein Textfeld der Auskunft.
 *
 * Steuerzeichen werden vereinheitlicht – das ist Form und keine Aussage.
 * Betrag und Link werden abgelehnt.
 */
const auskunftstext = (maximum: number) =>
  z
    .string()
    .transform((wert) => ohneSteuerzeichen(wert))
    .pipe(
      z
        .string()
        .min(1)
        .max(maximum)
        .refine((wert) => !traegtPreisangabe(wert), {
          message: 'Eine Auskunft trägt keine Preisangabe.',
        })
        .refine((wert) => !traegtLink(wert), {
          message: 'Eine Auskunft trägt keinen Link.',
        }),
    )

/**
 * Eine Bezugskennung, wie `lib/reisebegleiter/nutzlast.ts` sie ausgibt.
 *
 * Die Form ist hier geprüft, die Existenz in `lib/reisebegleiter/pruefung.ts`:
 * Ein formal gültiger Bezug auf etwas, das es im Kontext nicht gibt, ist die
 * häufigste Art, eine Wahrheit zu erfinden.
 */
const bezugKennung = z
  .string()
  .transform((wert) => ohneSteuerzeichen(wert))
  .pipe(z.string().regex(/^[A-Z]{1,2}[0-9]{1,3}$/, 'Diesen Bezug gibt es nicht.'))

/**
 * `.strict()`: Ein unerwartetes Feld ist ein Fehlschlag, kein Grund zum
 * Aufräumen.
 *
 * Das JSON-Schema unten trägt `additionalProperties: false`, und die Plattform
 * setzt das mit `strict: true` durch. Diese Prüfung darf sich darauf trotzdem
 * nicht verlassen: Modelloutput bleibt untrusted input, und ein Vertrag, der
 * nur auf der Gegenseite gilt, ist hier keiner. Ein stilles Entfernen wäre
 * ausserdem die falsche Richtung – ein Modell, das `lagen` oder
 * `visumErforderlich` mitschickt, hat die Regeln nicht verstanden, und eine
 * Auskunft von so einem Modell soll nicht bereinigt, sondern verworfen werden.
 */
const modellauskunftRoh = z.strictObject({
  antwort: auskunftstext(BEGLEITER_GRENZEN.antwort),
  unsicherheiten: z
    .array(auskunftstext(BEGLEITER_GRENZEN.unsicherheit))
    .max(BEGLEITER_GRENZEN.unsicherheiten),
  naechsteSchritte: z
    .array(auskunftstext(BEGLEITER_GRENZEN.schritt))
    .max(BEGLEITER_GRENZEN.schritte),
  bezuege: z.array(bezugKennung).max(BEGLEITER_GRENZEN.bezuege),
  /**
   * Der einzige Kanal für amtliche Lagen. Kein Freitext: Das Modell wählt eine
   * Aussage und nennt den Bezug; den Satz schreibt Jetnity
   * (`lib/reisebegleiter/aussagen.ts`).
   */
  amtlicheHinweise: z
    .array(
      z.strictObject({
        ref: bezugKennung,
        aussage: z.enum(AMTLICHE_AUSSAGEN),
      }),
    )
    .max(BEGLEITER_GRENZEN.amtlicheHinweise),
})

export const modellauskunftSchema = modellauskunftRoh

export type Modellauskunft = z.infer<typeof modellauskunftSchema>

const frage = z
  .string()
  .transform((wert) => ohneSteuerzeichen(wert))
  .pipe(
    z
      .string()
      .min(
        BEGLEITER_GRENZEN.frageMinimum,
        'Stelle deine Frage in ein paar Worten.',
      )
      .max(
        BEGLEITER_GRENZEN.frageMaximum,
        `Bitte stelle die Frage in höchstens ${BEGLEITER_GRENZEN.frageMaximum} Zeichen.`,
      ),
  )

export const begleiterfrageSchema = frage

export const BEGLEITER_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['antwort', 'unsicherheiten', 'naechsteSchritte', 'bezuege', 'amtlicheHinweise'],
  properties: {
    antwort: {
      type: 'string',
      description: `Die Antwort auf die Frage, höchstens ${BEGLEITER_GRENZEN.antwort} Zeichen. Ohne Preis, ohne Link, ohne erfundene amtliche Anforderung.`,
    },
    unsicherheiten: {
      type: 'array',
      maxItems: BEGLEITER_GRENZEN.unsicherheiten,
      items: { type: 'string' },
      description:
        'Was für eine belastbare Antwort fehlt oder im Reisekontext unbekannt, veraltet oder nicht erreichbar ist. Leer nur, wenn wirklich nichts offen ist.',
    },
    naechsteSchritte: {
      type: 'array',
      maxItems: BEGLEITER_GRENZEN.schritte,
      items: { type: 'string' },
      description:
        'Vorgeschlagene nächste Schritte in Jetnity. Vorschläge, keine Ausführung: Die Reise wird dadurch nicht geändert.',
    },
    bezuege: {
      type: 'array',
      maxItems: BEGLEITER_GRENZEN.bezuege,
      items: { type: 'string' },
      description:
        'Kennungen (ref) aus dem Reisekontext, auf die sich die Antwort stützt. Nur vorhandene Kennungen. Keine Kennung erfinden und keinen Zustand dazu behaupten.',
    },
    amtlicheHinweise: {
      type: 'array',
      maxItems: BEGLEITER_GRENZEN.amtlicheHinweise,
      description:
        'Der einzige Weg, etwas über eine amtliche Lage zu sagen. Wähle je Bezug eine Aussage; den Satz dazu schreibt Jetnity. Im Text der Antwort dürfen amtliche Anforderungen nicht vorkommen.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['ref', 'aussage'],
        properties: {
          ref: { type: 'string', description: 'Kennung einer official-Lage aus dem Reisekontext.' },
          aussage: { type: 'string', enum: [...AMTLICHE_AUSSAGEN] },
        },
      },
    },
  },
} as const
