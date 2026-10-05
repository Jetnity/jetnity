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
// Was hier nicht passiert
// ---------------------------------------------------------------------------
//
// Kein Logging der Anfrage oder der Antwort. Kein Wiederholen: Ein zweiter
// Versuch ist ein zweiter bezahlter Aufruf, und diese Entscheidung gehört dem
// Menschen vor dem Bildschirm, nicht einer Schleife.
//
// Der Körper der Anfrage steht in `lib/modell/anfrage.ts`, das Lesen der Antwort
// in `lib/modell/antwort.ts`. Beide sind ohne Serverumgebung prüfbar. Hier bleibt
// nur, was eine Serverumgebung braucht: der Schlüssel, `fetch` und die Uhr.

import 'server-only'

import { ENDPUNKT, anfragekoerper, type Modellanfrage } from '@/lib/modell/anfrage'
import { rohergebnisAus, type Rohergebnis } from '@/lib/modell/antwort'
import { timeoutMsFuer } from '@/lib/modell/konfiguration'

export type { Modellanfrage }

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
  }, timeoutMsFuer(anfrage.modell))

  try {
    const antwort = await fetch(ENDPUNKT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${schluessel}`,
        'content-type': 'application/json',
      },
      body: anfragekoerper(anfrage),
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
        hinweis: `Kein Ergebnis innerhalb von ${timeoutMsFuer(anfrage.modell)} ms.`,
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
