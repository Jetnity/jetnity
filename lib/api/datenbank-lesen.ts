// lib/api/datenbank-lesen.ts
//
// Ein Lesezugriff, der fehlschlägt, darf nicht aussehen wie einer, der nichts
// gefunden hat.
//
// Sechs lesende Admin-Routen umschlossen ihre Abfrage mit `try/catch` und
// lieferten im Fehlerfall `{ rows: [] }` oder eine Null. Das war doppelt
// falsch: `supabase-js` wirft nicht, sondern meldet im Feld `error` – der Fang
// lief also überhaupt nie an –, und selbst wenn er anliefe, wäre eine leere
// Sicherheitsliste die Aussage „nichts vorgefallen“, wo „nicht ermittelbar“
// gemeint ist. Dieselbe Verwechslung steckte in `admin_security_overview`
// („RLS aktiv 0/0 – alle Tabellen geschützt“, ADR-0034).
//
// Die Unterscheidung steht deshalb hier, einmal, statt sechsmal in Routen.
//
// Bewusst frei von Next- und Supabase-Importen: Beide Fälle – Fehler und echte
// Leere – sind so ohne Laufzeit und ohne Datenbank prüfbar.

export type Datenbankfehler = {
  message: string
  /** SQLSTATE der Datenbank oder Fehlercode des Transports. */
  code?: string | null
}

/**
 * Antwort von PostgREST, soweit sie hier zählt.
 *
 * `status` ist 0, wenn die Anfrage die Datenbank gar nicht erreicht hat:
 * `postgrest-js` fängt einen gescheiterten `fetch` selbst ab und baut daraus
 * eine Antwort mit `status: 0`. Ohne dieses Feld wäre ein Netzwerkausfall von
 * einer inhaltlichen Ablehnung nicht zu unterscheiden.
 */
export type Leseantwort<Zeile> = {
  data: Zeile[] | null
  error: Datenbankfehler | null
  status?: number
}

export type Problem = {
  status: 500 | 503
  message: string
}

export type Lesung<Zeile> =
  | { zeilen: Zeile[]; problem: null }
  | { zeilen: null; problem: Problem }

/**
 * SQLSTATE-Klassen, bei denen die Datenbank keine Antwort gegeben hat, statt
 * eine ablehnende zu geben. Sie sagen nichts über die Anfrage aus, nur über
 * den Moment – deshalb 503 und nicht 500.
 */
const VORUEBERGEHEND = new Set([
  '08', // connection_exception
  '53', // insufficient_resources, etwa too_many_connections
  '57', // operator_intervention, etwa query_canceled bei Zeitüberschreitung
  '58', // system_error
])

/**
 * Ordnet eine Ablehnung ein: 503, wenn die Datenbank keine Antwort gegeben hat,
 * sonst 500.
 *
 * Exportiert, weil nicht jeder Lesezugriff durch `lese()` passt. Eine Abfrage
 * mit `head: true` liefert absichtlich `data: null` und nur einen Zähler; sie
 * durch `lese()` zu schicken hiesse, den Zähler als fehlende Daten zu lesen.
 * Server-Komponenten, die so lesen, sollen die Einordnung trotzdem nicht ein
 * zweites Mal formulieren.
 */
export function problemAus(antwort: Leseantwort<unknown>, fehler: Datenbankfehler): Problem {
  const status = antwort.status === 0 || VORUEBERGEHEND.has((fehler.code ?? '').slice(0, 2)) ? 503 : 500

  // Eine Abfrage mit `head: true` schickt HEAD, und eine HEAD-Antwort hat keinen
  // Körper: `postgrest-js` liefert dann `{ message: '' }` ohne SQLSTATE. Am
  // laufenden Branch gemessen – mit entzogenem `select` antwortet dieselbe
  // Abfrage als GET „permission denied for table creator_sessions", als HEAD
  // eine leere Meldung. Der Statuscode ist das Einzige, was bleibt; ihn zu
  // nennen ist ehrlicher als eine leere Zeile.
  const message = fehler.message.trim()
    ? fehler.message
    : `Die Datenbank hat die Abfrage abgelehnt (HTTP ${antwort.status ?? '–'}), ohne eine Begründung mitzusenden.`

  return { status, message }
}

function nachricht(fehler: unknown): string {
  if (fehler instanceof Error) return fehler.message
  return String(fehler)
}

/**
 * Führt eine Leseabfrage aus und trennt drei Ausgänge, die vorher einen
 * einzigen ergaben:
 *
 *   · Die Abfrage lief und lieferte Zeilen – auch keine Zeile ist ein
 *     Ergebnis und bleibt eine leere Liste.
 *   · Die Datenbank hat abgelehnt (fehlendes Recht, fehlende Relation,
 *     fehlerhafte Anfrage). Das ist ein Defekt, kein Zustand: 500.
 *   · Die Datenbank war nicht erreichbar oder hat abgebrochen. Ob es Daten
 *     gäbe, ist unbekannt: 503.
 *
 * Eine Antwort ohne Daten und ohne Fehler ist nach dem Vertrag von PostgREST
 * unmöglich. Sollte sie doch eintreten, wird sie gemeldet und nicht als leeres
 * Ergebnis ausgegeben – genau solche „unmöglichen“ Zweige haben die stillen
 * Entwarnungen erzeugt.
 */
export async function lese<Zeile>(
  abfrage: () => PromiseLike<Leseantwort<Zeile>>,
): Promise<Lesung<Zeile>> {
  let antwort: Leseantwort<Zeile>

  try {
    antwort = await abfrage()
  } catch (fehler) {
    // Hierher führt kein Transportfehler: Den fängt `postgrest-js` ab. Wer
    // hier landet, hat einen Defekt ausgelöst, etwa beim Aufbau des Clients.
    return { zeilen: null, problem: { status: 500, message: nachricht(fehler) } }
  }

  if (antwort.error) {
    return { zeilen: null, problem: problemAus(antwort, antwort.error) }
  }

  if (antwort.data === null) {
    return {
      zeilen: null,
      problem: { status: 500, message: 'Die Abfrage lieferte weder Daten noch einen Fehler.' },
    }
  }

  return { zeilen: antwort.data, problem: null }
}
