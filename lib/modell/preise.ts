// lib/modell/preise.ts
//
// Was ein Modellaufruf kostet.
//
// Jetnity ruft ein kostenpflichtiges Modell auf. Damit ist der Preis kein
// Beiwerk, sondern Teil des Vertrags: Ohne ihn lässt sich weder ein Tagesdeckel
// durchsetzen noch nachher sagen, was ein Vorschlag gekostet hat.
//
// ---------------------------------------------------------------------------
// Die Einheit ist Mikrodollar
// ---------------------------------------------------------------------------
//
// 1 USD = 1 000 000 µ$. Ganzzahlig, weil ein Deckel, der über Gleitkommazahlen
// summiert wird, bei genügend vielen Aufrufen nicht mehr derselbe Deckel ist.
// Dieselbe Einheit steht in `public.model_usage.kosten_mikro_usd` (`bigint`).
//
// Die Preise sind ebenfalls in µ$ notiert, und zwar **je eine Million Tokens** –
// genau die Einheit, in der die OpenAI-Preisliste sie nennt. Damit ist ein
// Eintrag hier eine Umschrift und keine Umrechnung, die jemand nachprüfen muss.
//
// Stand der Preise: 18. August 2026, https://developers.openai.com/api/docs/pricing
// (Short-Context-Spalte; Jetnity schickt wenige Tausend Tokens und erreicht die
// Long-Context-Staffel nicht).
//
// Frei von Next, Supabase und `process.env`: Der Test rechnet ohne Laufzeit.

/** Ein Modell, für das ein Preis bekannt ist. Nur diese lässt die Konfiguration zu. */
export const MODELLE = ['gpt-5.6-luna', 'gpt-5.6-terra', 'gpt-5.6-sol'] as const
export type Modellname = (typeof MODELLE)[number]

type Preis = {
  /** µ$ je 1 000 000 Eingabetokens. */
  eingabe: number
  /** µ$ je 1 000 000 Eingabetokens, die aus dem Prompt-Cache kamen. */
  eingabeGecacht: number
  /** µ$ je 1 000 000 Ausgabetokens. Denk-Tokens zählen als Ausgabe. */
  ausgabe: number
}

export const PREISE: Record<Modellname, Preis> = {
  // $0.20 / $0.02 / $1.20
  'gpt-5.6-luna': { eingabe: 200_000, eingabeGecacht: 20_000, ausgabe: 1_200_000 },
  // $2.00 / $0.20 / $12.00
  'gpt-5.6-terra': { eingabe: 2_000_000, eingabeGecacht: 200_000, ausgabe: 12_000_000 },
  // $5.00 / $0.50 / $30.00
  'gpt-5.6-sol': { eingabe: 5_000_000, eingabeGecacht: 500_000, ausgabe: 30_000_000 },
}

const EINE_MILLION = 1_000_000

/** Was die API über einen Aufruf berichtet. Fehlt sie, ist sie `null` – nicht 0. */
export type Tokennutzung = {
  eingabeTokens: number
  /** Teilmenge von `eingabeTokens`, die aus dem Prompt-Cache kam. */
  gecachteTokens: number
  /** Enthält die Denk-Tokens; die API weist sie in `output_tokens` mit aus. */
  ausgabeTokens: number
}

/**
 * Was ein Aufruf gekostet hat, in µ$.
 *
 * Gecachte Eingabetokens werden abgezogen und zum Cache-Preis gerechnet. Ohne
 * diese Trennung wäre der Betrag bei gleichbleibenden Systemregeln – also im
 * Normalfall – dauerhaft zu hoch, und ein Kostendeckel, der zu hoch rechnet,
 * schaltet die Funktion früher ab, als er müsste.
 *
 * Aufgerundet, nicht gerundet: Der Deckel soll den Betrag nie unterschätzen.
 */
export function kostenMikroUsd(modell: Modellname, nutzung: Tokennutzung): number {
  const preis = PREISE[modell]
  const gecacht = Math.min(Math.max(nutzung.gecachteTokens, 0), Math.max(nutzung.eingabeTokens, 0))
  const frisch = Math.max(nutzung.eingabeTokens, 0) - gecacht

  return Math.ceil(
    (frisch * preis.eingabe +
      gecacht * preis.eingabeGecacht +
      Math.max(nutzung.ausgabeTokens, 0) * preis.ausgabe) /
      EINE_MILLION,
  )
}

/**
 * Der schlechteste Fall eines Aufrufs, in µ$.
 *
 * Wird **vor** dem Aufruf auf das Tageskonto gebucht. Der Grund ist ein
 * Wettlauf: Der Kostendeckel summiert abgeschlossene Aufrufe, und zwischen dem
 * Start eines Aufrufs und seinem Ergebnis liegen Sekunden. Zehn gleichzeitige
 * Anfragen sähen ohne diese Reservierung alle denselben Stand und kämen alle
 * durch. Mit ihr ist die Summe zu jedem Zeitpunkt eine Obergrenze; der
 * Abschluss ersetzt die Schätzung durch den echten Betrag.
 *
 * Nichts wird gecacht angenommen: Eine Annahme über den Cache wäre eine
 * Annahme zugunsten der Kosten.
 */
export function reservierungMikroUsd(
  modell: Modellname,
  maxEingabeTokens: number,
  maxAusgabeTokens: number,
): number {
  return kostenMikroUsd(modell, {
    eingabeTokens: maxEingabeTokens,
    gecachteTokens: 0,
    ausgabeTokens: maxAusgabeTokens,
  })
}

/** µ$ als Betrag in USD, für Protokolle und Dokumentation. Nur zur Anzeige. */
export function alsUsd(mikroUsd: number): string {
  return (mikroUsd / EINE_MILLION).toFixed(4)
}
