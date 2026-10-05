// lib/admin/ladezustand.ts
//
// Was aus einer Antwort des Servers wird, bevor die Oberfläche sie zeigt.
//
// ADR-0037 hat die Serverseite geordnet: 200 mit leerer Liste, 500 bei einer
// Ablehnung der Datenbank, 503 bei einem Ausfall. Die Oberfläche gab das nur
// zum Teil weiter. `TransactionsCard` und `WebhooksCard` warfen bei `!res.ok`
// eine Ausnahme in ein `finally` ohne `catch` – niemand fing sie, der Zustand
// blieb auf der leeren Liste stehen, und die Tabelle sagte „Keine
// Transaktionen". Im Zahlungsbereich heisst das: es gab keine Zahlung.
//
// Diese Datei trifft die Unterscheidung einmal, damit sie nicht in vier Karten
// vier Formen hat. Bewusst frei von React, Next und `fetch`: Beide Fälle –
// Fehler und echte Leere – sind so ohne Laufzeit und ohne Netz prüfbar
// (`lib/admin/ladezustand.test.ts`).

import type { Problem } from '@/lib/api/datenbank-lesen'

export type Fehler = {
  /** Was angezeigt wird. Die Meldung des Servers, wenn er eine schickt. */
  meldung: string
  /**
   * Hat ein zweiter Versuch Sinn?
   *
   * Die Unterscheidung ist nicht kosmetisch, sie steht in ADR-0037: 503 heisst
   * „ob es Daten gäbe, ist unbekannt", 500 heisst „die Datenbank hat
   * geantwortet und abgelehnt". Nur beim ersten lohnt das Wiederholen.
   */
  wiederholbar: boolean
}

export type Ladung<T> = { daten: T; fehler: null } | { daten: null; fehler: Fehler }

/**
 * Dieselbe Anzeige für die Ansichten, die serverseitig lesen.
 *
 * Die Startseite der Administration und die Benutzerverwaltung fragen die
 * Datenbank direkt, ohne Route dazwischen; sie sahen die Ablehnung also nie als
 * HTTP-Status. Statt daraus eine zweite Auslegung zu machen, kommt die
 * Einordnung aus `problemAus()` in `lib/api/datenbank-lesen.ts` – derselben
 * Stelle, die auch die Routen benutzen.
 */
export function ausProblem(problem: Problem): Fehler {
  return { meldung: problem.message, wiederholbar: problem.status === 503 }
}

/** So viel von `Response`, wie hier zählt – damit der Test kein `fetch` braucht. */
export type Antwortartig = {
  ok: boolean
  status: number
  json: () => Promise<unknown>
}

const OHNE_VERBINDUNG = 'Der Server ist nicht erreichbar.'
const UNVERSTAENDLICH = 'Die Antwort des Servers war nicht lesbar.'

/**
 * Die Meldung des Servers, wenn er eine schickt.
 *
 * `problemAntwort()` sendet `message`; die älteren Routen und `requireAdminApi`
 * senden teils `error`. Beide werden gelesen, statt sie durch einen
 * freundlicheren Text zu ersetzen – im Administrationsbereich liest sie
 * jemand, der etwas damit anfangen kann.
 */
function meldungAus(koerper: unknown, status: number): string {
  if (koerper && typeof koerper === 'object') {
    const o = koerper as Record<string, unknown>
    for (const feld of ['message', 'error'] as const) {
      const wert = o[feld]
      if (typeof wert === 'string' && wert.trim()) return wert.trim()
    }
  }

  if (status === 401) return 'Nicht angemeldet.'
  if (status === 403) return 'Für diese Ansicht fehlt die Berechtigung.'
  return `Der Server antwortete mit Status ${status}.`
}

/**
 * Führt eine Anfrage aus und trennt drei Ausgänge, die vorher einen einzigen
 * ergaben:
 *
 *   · Die Anfrage lief und der Server hat geantwortet – null Zeilen sind ein
 *     Ergebnis und bleiben eines.
 *   · Der Server hat abgelehnt (4xx/5xx). Das ist keine Aussage über die
 *     Daten, sondern ihre Abwesenheit.
 *   · Die Anfrage kam nicht an. Ein zweiter Versuch kann helfen.
 *
 * `deute` bekommt den Körper der Antwort und formt ihn. Wirft es, gilt die
 * Antwort als unlesbar – besser als ein halb gefüllter Zustand.
 */
export async function lade<T>(
  anfrage: () => Promise<Antwortartig>,
  deute: (koerper: unknown) => T,
): Promise<Ladung<T>> {
  let antwort: Antwortartig

  try {
    antwort = await anfrage()
  } catch {
    // `fetch` wirft nur, wenn die Anfrage nicht angekommen ist. Die Meldung des
    // Browsers („Failed to fetch") sagt der Bedienerin nichts und wird deshalb
    // nicht durchgereicht.
    return { daten: null, fehler: { meldung: OHNE_VERBINDUNG, wiederholbar: true } }
  }

  let koerper: unknown = null
  let lesbar = true

  try {
    koerper = await antwort.json()
  } catch {
    lesbar = false
  }

  if (!antwort.ok) {
    return {
      daten: null,
      fehler: {
        meldung: lesbar ? meldungAus(koerper, antwort.status) : meldungAus(null, antwort.status),
        // 503 ist der Ausfall: nicht erreichbar, abgebrochen, Verbindungen
        // erschöpft. 500 ist die Ablehnung – dieselbe Anfrage scheitert wieder.
        wiederholbar: antwort.status === 503,
      },
    }
  }

  if (!lesbar) {
    return { daten: null, fehler: { meldung: UNVERSTAENDLICH, wiederholbar: true } }
  }

  try {
    return { daten: deute(koerper), fehler: null }
  } catch {
    return { daten: null, fehler: { meldung: UNVERSTAENDLICH, wiederholbar: false } }
  }
}

/**
 * Liest ein Feld, das eine Liste sein soll.
 *
 * Fehlt es oder ist es keine Liste, ist das ein Fehler und keine leere Liste –
 * genau die Verwechslung, die `data.rows ?? []` in den Karten erzeugt hat.
 */
export function liste<T>(koerper: unknown, feld: string): T[] {
  const wert = koerper && typeof koerper === 'object' ? (koerper as Record<string, unknown>)[feld] : undefined
  if (!Array.isArray(wert)) throw new Error(`Feld ${feld} fehlt in der Antwort`)
  return wert as T[]
}

/** Liest das Feld, mit dem die Routen ihre Fortsetzung angeben. */
export function fortsetzung(koerper: unknown): string | null {
  const wert = koerper && typeof koerper === 'object' ? (koerper as Record<string, unknown>).next_cursor : null
  return typeof wert === 'string' && wert ? wert : null
}
