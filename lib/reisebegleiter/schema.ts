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
// ---------------------------------------------------------------------------
// Und deshalb hat es überhaupt kein Freitextfeld mehr
// ---------------------------------------------------------------------------
//
// Sieben Fassungen haben Freitext des Modells zu prüfen versucht. Die achte
// Widerlegung brauchte nur gewöhnliche Wörter – `Du musst ein gültiges
// Reisedokument haben.` –, weil jede dieser Fassungen behauptete, kein aus
// ihrer Wortmenge bildbarer Satz sei eine amtliche Aussage. Das ist eine
// Behauptung über einen unendlichen Satzraum, und Sprache komponiert.
//
// `antwort`, `unsicherheiten` und `naechsteSchritte` sind deshalb **entfernt**.
// Das Modell wählt Schlüssel aus geschlossenen Katalogen
// (`lib/reisebegleiter/befunde.ts`, `lib/reisebegleiter/aussagen.ts`) und nennt
// den Bezug; jeden Satz schreibt Jetnity. Der Satz oben ist nicht abgelehnt –
// es gibt kein Feld, in das er passt. Diese Zusicherung ist am Typ ablesbar und
// wird in `lib/reisebegleiter/schema.test.ts` genau dort abgelesen, statt über
// einen Satzraum argumentiert zu werden.
//
// Auf vorhandene Jetnity-Zustände zeigt das Modell über `bezuege` – und zwar
// nur mit den Kennungen, die es im Kontext bekommen hat. Den *Zustand* dieser
// Bezüge schreibt das Modell nicht; er wird in `lib/reisebegleiter/nutzlast.ts`
// aus der akzeptierten Projektion abgeleitet und von der Oberfläche angezeigt.
// Ein Modell, das den Zustand nicht formulieren darf, kann ihn nicht verfälschen.
//
// Betrag und Link brauchen hier keine eigene Prüfung mehr: Ohne Freitextfeld
// gibt es keine Stelle, an der das Modell einen schreiben könnte. Die frühere
// Ablehnung (statt Entfernung, anders als in `lib/reisevorschlag/schema.ts`)
// ist damit gegenstandslos geworden, nicht gelockert.
//
// Frei von Next, Supabase und `process.env`.

import { z } from 'zod'

import { MODELL_GRENZEN } from '@/lib/modell/konfiguration'
import { AMTLICHE_AUSSAGEN } from '@/lib/reisebegleiter/aussagen'
import { BEFUND_SCHLUESSEL } from '@/lib/reisebegleiter/befunde'
import { ohneSteuerzeichen } from '@/lib/reisevorschlag/normalisierung'

export const BEGLEITER_FASSUNG = 1

export const BEGLEITER_SCHEMA_NAME = 'jetnity_reisebegleiter'

export const BEGLEITER_GRENZEN = {
  /** Kürzeste brauchbare Frage. Kürzer ist keine Frage, sondern ein Tippfehler. */
  frageMinimum: 8,
  /** Dieselbe Obergrenze wie jeder andere Freitext an ein Modell. */
  frageMaximum: MODELL_GRENZEN.eingabeZeichen,

  /** Wie viele Katalogaussagen eine Auskunft höchstens auswählen darf. */
  befunde: 10,
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
 * Ein Link in einem Text.
 *
 * Auch `www.` und ein nacktes `beispiel.example/pfad` zählen: Der Zweck ist
 * nicht, URLs zu erkennen, sondern zu verhindern, dass generierter oder
 * nutzergeschriebener Text wie eine belegte Quelle aussieht. Gebraucht wird das
 * noch in `lib/reisebegleiter/nutzlast.ts`, das linkverdächtigen Freitext aus
 * der Projektion abzieht, bevor das Modell ihn sieht.
 */
const LINKMUSTER = /(?:\bhttps?:\/\/|\bwww\.|\b[a-z0-9-]+\.(?:com|net|org|ch|de|at|io|gov|int)\b)/i

export function traegtLink(wert: string): boolean {
  return LINKMUSTER.test(wert)
}

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
  /**
   * Die Auswahl aus dem Jetnity-Katalog: Schlüssel plus Bezug, kein Text.
   *
   * Zulässig ist nur, was `angeboteneBefunde()` für diese Reise berechnet hat;
   * `lib/reisebegleiter/pruefung.ts` prüft das Paar gegen das Angebot.
   */
  befunde: z
    .array(
      z.strictObject({
        schluessel: z.enum(BEFUND_SCHLUESSEL),
        ref: bezugKennung.nullable(),
      }),
    )
    .max(BEGLEITER_GRENZEN.befunde),
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
  required: ['befunde', 'bezuege', 'amtlicheHinweise'],
  properties: {
    befunde: {
      type: 'array',
      maxItems: BEGLEITER_GRENZEN.befunde,
      description:
        'Deine Antwort. Du schreibst keine Sätze, du wählst aus: Nimm aus angebot im Reisekontext die Aussagen, die zur Frage passen, und ordne sie. Jeden Satz dazu schreibt Jetnity. Ein Paar aus schluessel und ref, das nicht im angebot steht, verwirft die Auskunft.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['schluessel', 'ref'],
        properties: {
          schluessel: { type: 'string', enum: [...BEFUND_SCHLUESSEL] },
          ref: {
            type: ['string', 'null'],
            description: 'Der Bezug aus dem angebot, oder null bei Aussagen über die ganze Reise.',
          },
        },
      },
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
