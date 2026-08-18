// lib/modell/aufruf.ts
//
// Der eine Aufruf an OpenAI. Serverseitig, ohne SDK, mit Abbruch.
//
// ---------------------------------------------------------------------------
// Warum `fetch` und nicht das SDK
// ---------------------------------------------------------------------------
//
// Phase 1.1b hat das Paket `openai` entfernt. Es wieder aufzunehmen, um einen
// einzigen Endpunkt zu erreichen, wäre eine Abhängigkeit für dreissig Zeilen –
// und sie brächte ihre eigene Zeitsteuerung, ihre eigenen Wiederholungen und
// ihre eigene Fehlerdarstellung mit, an einer Stelle, an der Jetnity beides
// selbst bestimmen muss: Ein Aufruf ohne harte Obergrenze für Dauer und Ausgabe
// ist ein Aufruf ohne Kostenkontrolle (AGENTS.md Regel 17).
//
// ---------------------------------------------------------------------------
// Structured Outputs
// ---------------------------------------------------------------------------
//
// Der Aufruf geht an die Responses API und schickt das JSON-Schema im Feld
// `text.format` mit `strict: true`. Damit garantiert die Plattform die
// Schemakonformität der Antwort – nicht der Prompt.
//
// Das ersetzt die Prüfung nicht. Ein Schema sagt, welche Felder vorkommen, nicht
// ob ihr Inhalt zu Jetnity passt: Ein Ländercode `XX`, ein Tag mit der Nummer
// 400 oder ein Titel mit 300 Zeichen sind schemakonform und trotzdem falsch.
// Die zweite Instanz ist `lib/reisevorschlag/schema.ts`.
//
// Quelle: https://developers.openai.com/api/docs/guides/structured-outputs
// (Responses API, Stand 18. August 2026)
//
// ---------------------------------------------------------------------------
// Was hier nicht passiert
// ---------------------------------------------------------------------------
//
// Kein Logging der Anfrage oder der Antwort. Kein Wiederholen: Ein zweiter
// Versuch ist ein zweiter bezahlter Aufruf, und diese Entscheidung gehört dem
// Menschen vor dem Bildschirm, nicht einer Schleife. Und `store: false` – die
// Reisebeschreibung soll nicht auf der Gegenseite liegen bleiben.
//
// Das Lesen der Antwort steht in `lib/modell/antwort.ts`. Hier bleibt nur, was
// eine Serverumgebung braucht: der Schlüssel, `fetch` und die Uhr.

import 'server-only'

import { rohergebnisAus, type Rohergebnis } from '@/lib/modell/antwort'
import { MODELL_GRENZEN, type Denkaufwand } from '@/lib/modell/konfiguration'
import type { Modellname } from '@/lib/modell/preise'

const ENDPUNKT = 'https://api.openai.com/v1/responses'

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

export type Modellergebnis = Rohergebnis & { laufzeitMs: number }

/**
 * Ruft das Modell auf und gibt seinen Rohtext zurück – geparst wird woanders.
 *
 * Der Schlüssel wird hier gelesen und nirgends weitergegeben. Fehlt er, ist das
 * ein Programmierfehler und kein Laufzeitzustand: `modellZustand()` hätte den
 * Weg vorher geschlossen.
 */
export async function modellAufrufen(anfrage: Modellanfrage): Promise<Modellergebnis> {
  const schluessel = process.env.OPENAI_API_KEY?.trim()
  const beginn = Date.now()

  if (!schluessel) {
    return {
      ok: false,
      klasse: 'netz',
      hinweis: 'OPENAI_API_KEY fehlt in der Serverumgebung.',
      nutzung: null,
      laufzeitMs: 0,
    }
  }

  // Eigener Controller statt `AbortSignal.timeout()`: Nur so lässt sich
  // hinterher sagen, ob die Zeit abgelaufen ist oder die Verbindung abgebrochen
  // wurde. Beides erreicht `fetch` als `AbortError`.
  const controller = new AbortController()
  let abgelaufen = false
  const uhr = setTimeout(() => {
    abgelaufen = true
    controller.abort()
  }, MODELL_GRENZEN.timeoutMs)

  try {
    const antwort = await fetch(ENDPUNKT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${schluessel}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: anfrage.modell,
        // Die Systemregeln stehen als eigene Nachricht mit der Rolle `system`,
        // der Freitext als eigene mit `user`. Beides in einen String zu
        // verketten wäre die Einladung, Regeln durch Eingaben zu überschreiben.
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
      }),
      signal: controller.signal,
      cache: 'no-store',
    })

    const roh: unknown = await antwort.json().catch(() => null)
    return { ...rohergebnisAus(antwort.status, roh), laufzeitMs: Date.now() - beginn }
  } catch (fehler) {
    const laufzeitMs = Date.now() - beginn

    // Ein Abbruch nach Ablauf der Uhr ist ein anderer Vorgang als ein
    // Netzwerkfehler: Der Aufruf lief und wird womöglich berechnet, während ein
    // gescheiterter Verbindungsaufbau nichts kostet.
    if (abgelaufen) {
      return {
        ok: false,
        klasse: 'zeitueberschreitung',
        hinweis: `Kein Ergebnis innerhalb von ${MODELL_GRENZEN.timeoutMs} ms.`,
        nutzung: null,
        laufzeitMs,
      }
    }

    return {
      ok: false,
      klasse: 'netz',
      // Nur der Name. Die Meldung eines `fetch`-Fehlers kann die Ziel-URL und
      // damit im Zweifel mehr enthalten, als in ein Protokoll gehört.
      hinweis: `Der Aufruf scheiterte (${fehler instanceof Error ? fehler.name : 'unbekannt'}).`,
      nutzung: null,
      laufzeitMs,
    }
  } finally {
    clearTimeout(uhr)
  }
}
