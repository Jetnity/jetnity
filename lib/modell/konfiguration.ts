// lib/modell/konfiguration.ts
//
// Ob und wie Jetnity ein kostenpflichtiges Modell aufruft.
//
// ---------------------------------------------------------------------------
// Fail closed
// ---------------------------------------------------------------------------
//
// Es gibt genau einen Weg zu einem kostenpflichtigen Aufruf, und er ist
// standardmässig zu. Drei Dinge müssen zusammenkommen, sonst antwortet die
// Funktion mit einem Grund und ruft nichts auf:
//
//   · `JETNITY_MODELL_AKTIV` ist ausdrücklich eingeschaltet (Kill Switch),
//   · `OPENAI_API_KEY` liegt in der Serverumgebung,
//   · `JETNITY_MODELL_NAME` benennt ein Modell mit bekanntem Preis.
//
// Eine fehlende Variable ist damit kein Fehler zur Laufzeit, sondern der
// Normalzustand einer Umgebung, in der die Funktion nicht laufen soll. Genau
// dieser Zustand gilt in Production, solange sie nicht freigegeben ist.
//
// ---------------------------------------------------------------------------
// Warum die Grenzen im Code stehen und nicht in der Umgebung
// ---------------------------------------------------------------------------
//
// Dieselben Zahlen stehen ein zweites Mal in
// `supabase/migrations/20260818040000_modellnutzung.sql`, weil die Datenbank
// sie durchsetzt und nicht dieser Code. Zwei Orte sind schon einer zu viel; ein
// dritter in Form von Umgebungsvariablen wäre die Garantie, dass sie
// auseinanderlaufen – und eine Schranke, die in der Umgebung höher steht als in
// der Datenbank, ist keine.
//
// `lib/modell/grenzen-datenbank.test.ts` vergleicht beide Seiten bei jedem
// `npm test`, ohne Datenbank, allein aus dem Migrations-SQL.
//
// Aus der Umgebung kommt deshalb nur, was eine Umgebung unterscheiden darf: ob
// die Funktion läuft, mit welchem Modell und mit welchem Denkaufwand.

import { MODELLE, type Modellname } from '@/lib/modell/preise'

/**
 * Denkaufwand des Modells.
 *
 * Die API kennt zusätzlich `high`, `xhigh` und `max`. Jetnity lässt sie nicht
 * zu, und der Grund ist nicht Sparsamkeit: `max_output_tokens` begrenzt die
 * Ausgabe **einschliesslich** der Denk-Tokens. Ein Aufruf, der sein ganzes
 * Ausgabebudget im Denken verbraucht, endet als `incomplete` – bezahlt, ohne
 * einen Vorschlag geliefert zu haben. Für eine strukturierte Ausgabe mit
 * festem Schema ist das ein schlechter Handel.
 */
export const DENKAUFWAENDE = ['none', 'low', 'medium'] as const
export type Denkaufwand = (typeof DENKAUFWAENDE)[number]

/**
 * Die Grenzen jedes Modellwegs. Dieselben Zahlen wie in der Migration.
 *
 * Sie sind bewusst niedrig. Der Weg ist in Production nicht freigegeben, und
 * eine Grenze, die erst bei der Aktivierung gesetzt wird, ist bis dahin keine.
 */
export const MODELL_GRENZEN = {
  /** Länge der Reisebeschreibung. Über `GRENZEN.reisewunsch` (1000) hinaus, weil ein Mensch mehr schreibt, als am Ende gespeichert wird. */
  eingabeZeichen: 2000,

  /**
   * Obergrenze der Ausgabe, einschliesslich Denk-Tokens.
   *
   * Gemessen an dem, was ein voller Vorschlag braucht: 30 Tage mit je vier
   * Planpunkten in strengem JSON liegen bei etwa 3000 Tokens. Der Rest ist
   * Spielraum für das Denken.
   */
  ausgabeTokens: 6000,

  /** Obergrenze der Eingabe für die Kostenreservierung – Systemregeln plus Freitext. */
  eingabeTokensSchaetzung: 2600,

  /** Abbruch des Aufrufs. Muss unter `maxDuration` der aufrufenden Seite bleiben. */
  timeoutMs: 40_000,

  /** Aufrufe je Kennung (Konto oder Gastkennung) und Stunde. */
  jeKennungStunde: 4,

  /** Aufrufe je Kennung und Tag. */
  jeKennungTag: 8,

  /**
   * Aufrufe aller Gäste zusammen und Tag.
   *
   * Eine Gastkennung ist ein Cookie und damit wechselbar. Dieses Kontingent ist
   * die Antwort darauf: Gäste teilen sich einen Topf, der kleiner ist als der
   * gesamte, und rotierende Kennungen können deshalb das Kontingent der
   * angemeldeten Konten nicht aufbrauchen.
   */
  gaesteTag: 24,

  /**
   * Aufrufe insgesamt und Tag.
   *
   * Diese Zahl ist die belastbare Zusage über die Tageskosten, denn sie wirkt
   * auf der Reservierung – also bevor Geld ausgegeben wird. Sie ist so gewählt,
   * dass sie den Kostendeckel unten allein einhält:
   * 38 × 77 200 µ$ = 2 933 600 µ$ < 3 000 000 µ$.
   */
  gesamtTag: 38,

  /**
   * Kostendeckel für alle Aufrufe eines Tages, in Mikrodollar.
   *
   * 3 000 000 µ$ = 3.00 USD je Tag, also höchstens etwa 90 USD im Monat und
   * damit innerhalb der Leitlinie aus AGENTS.md Regel 18.
   *
   * Er ist die zweite Schranke und nicht die erste: Er greift, wenn ein Aufruf
   * mehr kostet als geschätzt – etwa nach einem Wechsel auf ein teureres
   * Modell, bei dem niemand `gesamtTag` nachgezogen hat.
   */
  kostenTagMikroUsd: 3_000_000,
} as const

/** Warum kein Aufruf zustande kommt. Wird dem Aufrufer genannt, nicht verschluckt. */
export type Abschaltgrund = 'abgeschaltet' | 'kein-schluessel' | 'unbekanntes-modell'

export type Modellzustand =
  | { aktiv: true; modell: Modellname; aufwand: Denkaufwand }
  | { aktiv: false; grund: Abschaltgrund }

/** Das Modell, wenn die Umgebung keines nennt. Begründung in DECISIONS.md ADR-0051. */
export const MODELL_VORGABE: Modellname = 'gpt-5.6-terra'

/** Der Denkaufwand, wenn die Umgebung keinen nennt. */
export const AUFWAND_VORGABE: Denkaufwand = 'low'

/**
 * Nur die vier Variablen, die dieser Weg liest.
 *
 * Nicht `NodeJS.ProcessEnv`: Der Typ verlangt Felder, die hier nichts zu suchen
 * haben, und eine Prüfung, die eine vollständige Umgebung fordert, um vier Werte
 * zu lesen, macht aus einem Test eine Nachbildung der Laufzeit.
 */
export type Modellumgebung = {
  JETNITY_MODELL_AKTIV?: string
  OPENAI_API_KEY?: string
  JETNITY_MODELL_NAME?: string
  JETNITY_MODELL_AUFWAND?: string
}

function prozessumgebung(): Modellumgebung {
  const { JETNITY_MODELL_AKTIV, OPENAI_API_KEY, JETNITY_MODELL_NAME, JETNITY_MODELL_AUFWAND } = process.env
  return { JETNITY_MODELL_AKTIV, OPENAI_API_KEY, JETNITY_MODELL_NAME, JETNITY_MODELL_AUFWAND }
}

function eingeschaltet(wert: string | undefined): boolean {
  // Nur ausdrückliche Zustimmung. `''`, `'0'`, `'false'`, ein Tippfehler und
  // eine fehlende Variable bedeuten alle dasselbe: aus.
  return wert === 'true' || wert === '1'
}

/**
 * Ob ein Modellaufruf zustande kommen darf – und mit welchen Einstellungen.
 *
 * Die Umgebung wird übergeben, damit der Test sie stellen kann, ohne
 * `process.env` zu verändern. Ein Test, der globalen Zustand anfasst, ist von
 * der Reihenfolge der übrigen Tests abhängig.
 */
export function modellZustand(umgebung: Modellumgebung = prozessumgebung()): Modellzustand {
  if (!eingeschaltet(umgebung.JETNITY_MODELL_AKTIV)) return { aktiv: false, grund: 'abgeschaltet' }

  // Nur die Anwesenheit zählt. Der Wert selbst verlässt `lib/modell/aufruf.ts`
  // nicht und steht in keinem Rückgabewert dieses Moduls.
  if (!umgebung.OPENAI_API_KEY?.trim()) return { aktiv: false, grund: 'kein-schluessel' }

  const gewuenscht = umgebung.JETNITY_MODELL_NAME?.trim() || MODELL_VORGABE
  if (!(MODELLE as readonly string[]).includes(gewuenscht)) {
    // Ein unbekanntes Modell hat keinen Preis, und ohne Preis gibt es keinen
    // Kostendeckel. Ein Tippfehler in dieser Variablen darf nicht dazu führen,
    // dass ungezählt Geld ausgegeben wird.
    return { aktiv: false, grund: 'unbekanntes-modell' }
  }

  const aufwand = umgebung.JETNITY_MODELL_AUFWAND?.trim() || AUFWAND_VORGABE
  if (!(DENKAUFWAENDE as readonly string[]).includes(aufwand)) {
    return { aktiv: false, grund: 'unbekanntes-modell' }
  }

  return { aktiv: true, modell: gewuenscht as Modellname, aufwand: aufwand as Denkaufwand }
}

/**
 * Wie ein Aufruf ausgegangen ist.
 *
 * Diese Werte landen in `public.model_usage.ergebnis` und stehen dort als
 * CHECK-Bedingung. Sie sind Fehler**klassen** und keine Fehlermeldungen: Was
 * ein Nutzer liest, steht in `lib/reisevorschlag/erzeugen.ts`, und in einem
 * Kostenprotokoll hat der Wortlaut einer Reisebeschreibung nichts zu suchen.
 */
export const ERGEBNISKLASSEN = [
  'erfolg',
  'zeitueberschreitung',
  'netz',
  'anbieter-4xx',
  'anbieter-5xx',
  'verweigert',
  'abgeschnitten',
  'ungueltige-antwort',
  'schema',
] as const
export type Ergebnisklasse = (typeof ERGEBNISKLASSEN)[number]
