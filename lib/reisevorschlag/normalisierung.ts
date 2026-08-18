// lib/reisevorschlag/normalisierung.ts
//
// Der freie Text eines Modells, bevor er eine Reise wird.
//
// ---------------------------------------------------------------------------
// Warum Preisangaben verschwinden
// ---------------------------------------------------------------------------
//
// Phase 3 – Amadeus, Hotels, Aktivitäten – gibt es nicht. Bis dahin hat Jetnity
// keine belastbare Herkunft für einen Preis, und ein Satz wie „Flug ab CHF 412“
// ist deshalb keine Auskunft, sondern eine Behauptung mit dem Aussehen einer
// Auskunft. Genau das ist die Sorte Fehler, die teuer wird: Wer ihn liest,
// rechnet damit.
//
// Strukturell ist der Fall schon geschlossen. `lib/reisevorschlag/schema.ts`
// kennt kein Preisfeld, und `additionalProperties: false` macht eines
// unaussprechbar. Bleibt der Weg über den Freitext – ein Titel, eine Notiz, eine
// Annahme. Diese Datei schliesst ihn.
//
// Sie ist die zweite Schranke, nicht die erste: Die Systemregeln in
// `lib/reisevorschlag/regeln.ts` verbieten Preisangaben, und ein Modell, das
// sich daran hält, merkt von dieser Datei nichts. Eine Regel im Prompt ist aber
// eine Bitte. Diese Funktion ist es nicht.
//
// ---------------------------------------------------------------------------
// Was sie nicht kann
// ---------------------------------------------------------------------------
//
// Sie entfernt Beträge mit Währung. „Dieses Hotel ist noch frei“ erkennt sie
// nicht – eine Verfügbarkeitsbehauptung ist ein Satz und kein Muster. Dagegen
// stehen die Systemregeln und die Vorschau, die den Vorschlag ausdrücklich als
// Vorschlag zeigt. Das ist eine bewusste Grenze und in DECISIONS.md ADR-0054
// festgehalten.
//
// Frei von Next, Supabase und `process.env`.

/**
 * Währungen, die in einem europäischen Reisetext vorkommen – als Code, Symbol
 * oder Wort.
 *
 * Die Liste ist nicht vollständig und muss es nicht sein: Sie ist eine Schranke
 * gegen den wahrscheinlichen Fall, nicht ein Beweis über alle Sprachen.
 */
const WAEHRUNGEN =
  'CHF|EUR|USD|GBP|THB|JPY|SEK|NOK|DKK|CZK|PLN|HUF|TRY|AED|Fr\\.?|Franken|Euro|Dollar|Pfund|Baht|Yen|Kronen'

const SYMBOLE = '€|\\$|£|¥|฿'

/** Ziffern mit Tausender- und Dezimaltrennern, wie Menschen sie schreiben. */
const BETRAG = "\\d[\\d'’.,\\u00a0 ]*\\d|\\d"

/** „ab“, „ca.“, „rund“ – die Wörter, die einen Betrag ankündigen und mit ihm fallen. */
const VORSILBE = '(?:ab|ca\\.?|circa|etwa|rund|je|pro Person|~|≈|<|>|≤|≥)?\\s*'

const PREISMUSTER = [
  // CHF 412, ab ca. € 1'200, $50
  new RegExp(`${VORSILBE}(?:${WAEHRUNGEN}|${SYMBOLE})\\s*(?:${BETRAG})`, 'gi'),
  // 412 CHF, 1'200 Euro, 50€
  new RegExp(`${VORSILBE}(?:${BETRAG})\\s*(?:${WAEHRUNGEN}|${SYMBOLE})\\b`, 'gi'),
]

/**
 * Reste, die nach dem Entfernen eines Betrags stehen bleiben.
 *
 * „Flug ab CHF 412 nach Bangkok“ ergibt sonst „Flug nach Bangkok“ mit zwei
 * Leerzeichen, „Transfer (CHF 30)“ ein leeres Klammerpaar, „Abendessen – EUR 40“
 * einen Gedankenstrich am Ende.
 */
const LEERE_KLAMMER = /\(\s*\)|\[\s*\]/g
const RANDZEICHEN = /^[\s\-–—:,;.·|/]+|[\s\-–—:,;·|/]+$/g

/**
 * Steuerzeichen weg, Leerraum vereinheitlicht, Ränder getrimmt.
 *
 * Gilt für jeden Text, der von aussen kommt – aus dem Modell und aus dem
 * Formular. Ein Zeilenumbruch bleibt kein Zeilenumbruch: Titel und Notizen
 * dieser Anwendung sind einzeilig, und ein `\n` in einem Titel ist in der
 * Oberfläche ein unsichtbares Rätsel.
 */
export function ohneSteuerzeichen(wert: string): string {
  return wert
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028\u2029\ufeff]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Entfernt Preisangaben aus einem Text.
 *
 * Nur Beträge **mit** Währung. Eine nackte Zahl bleibt stehen: „Markt mit 100
 * Ständen“, „7 Tage“, „Tempel aus dem 13. Jahrhundert“ sind keine Preise, und
 * eine Regel, die jede Zahl entfernt, würde aus einem Vorschlag Kauderwelsch
 * machen.
 */
export function ohnePreisangabe(wert: string): string {
  let text = wert

  for (const muster of PREISMUSTER) text = text.replace(muster, ' ')

  return text
    .replace(LEERE_KLAMMER, ' ')
    .replace(/\s+/g, ' ')
    .replace(RANDZEICHEN, '')
    .trim()
}

/** Ob ein Text eine Preisangabe enthält. Für Tests und Prüfungen, nicht für den Ablauf. */
export function traegtPreisangabe(wert: string): boolean {
  return PREISMUSTER.some((muster) => {
    muster.lastIndex = 0
    return muster.test(wert)
  })
}
