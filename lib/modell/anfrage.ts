// lib/modell/anfrage.ts
//
// Was Jetnity an OpenAI schickt – als Wert, nicht als Vorgang.
//
// Die Anfrage steht getrennt vom Aufruf, weil sie zwei Leser hat: die
// Server Action über `lib/modell/aufruf.ts` und den Entwicklungsnachweis
// `scripts/modell/probe.ts`. Beide müssen denselben Körper schicken, sonst sagt
// der Nachweis nichts über den Weg, den ein Reisender nimmt.
//
// Frei von Next, Supabase und `process.env`: Hier liegt kein Schlüssel und kein
// `fetch`. Der Schlüssel wird ausschliesslich in `lib/modell/aufruf.ts` gelesen,
// und diese Datei ist deshalb ohne Serverumgebung lesbar und prüfbar.
//
// Structured Outputs: Das JSON-Schema geht im Feld `text.format` mit
// `strict: true` mit. Damit garantiert die Plattform die Form der Antwort – nicht
// ihren Inhalt. Die zweite Instanz ist `lib/reisevorschlag/schema.ts`.
//
// Quelle: https://developers.openai.com/api/docs/guides/structured-outputs
// (Responses API, Stand 18. August 2026)

import { MODELL_GRENZEN, type Denkaufwand } from '@/lib/modell/konfiguration'
import type { Modellname } from '@/lib/modell/preise'

export const ENDPUNKT = 'https://api.openai.com/v1/responses'

export type Modellanfrage = {
  modell: Modellname
  aufwand: Denkaufwand
  /** Die Systemregeln. Unveränderlich und nicht aus Nutzereingaben zusammengesetzt. */
  systemregeln: string
  /** Der Freitext des Nutzers. Untrusted, und zwar auf beiden Seiten des Aufrufs. */
  nutzertext: string
  schemaName: string
  jsonSchema: unknown
}

/** Der Körper der Anfrage. Reine Umschrift der Anfrage, ohne Nebenwirkung. */
export function anfragekoerper(anfrage: Modellanfrage): string {
  return JSON.stringify({
    model: anfrage.modell,
    // Die Systemregeln stehen als eigene Nachricht mit der Rolle `system`, der
    // Freitext als eigene mit `user`. Beides in einen String zu verketten wäre
    // die Einladung, Regeln durch Eingaben zu überschreiben.
    input: [
      { role: 'system', content: anfrage.systemregeln },
      { role: 'user', content: anfrage.nutzertext },
    ],
    reasoning: { effort: anfrage.aufwand },
    text: {
      format: {
        type: 'json_schema',
        name: anfrage.schemaName,
        strict: true,
        schema: anfrage.jsonSchema,
      },
    },
    max_output_tokens: MODELL_GRENZEN.ausgabeTokens,
    // Die Reisebeschreibung bleibt nicht auf der Gegenseite liegen.
    store: false,
  })
}
