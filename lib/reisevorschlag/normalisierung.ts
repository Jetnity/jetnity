// lib/reisevorschlag/normalisierung.ts
//
// Der freie Text eines Modells, bevor er eine Reise wird.
//
// ---------------------------------------------------------------------------
// Warum Preisangaben verschwinden
// ---------------------------------------------------------------------------
//
// Phase 3 – echte Flug-, Hotel- und Aktivitätspreise – war hier noch nicht angebunden. Bis dahin hat Jetnity
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

/**
 * Eine Währungsangabe.
 *
 * Ein Wort braucht eine Wortgrenze davor, damit „Fr“ nicht in „Fresko“ trifft;
 * ein Symbol darf keine haben, weil `\b` neben `€` je nach Nachbarzeichen
 * bedeutet, was niemand erwartet. Dahinter steht `(?!\w)` statt `\b` – aus
 * demselben Grund: Nach `€` und nach `Fr.` gibt es kein Wortzeichen, an dem eine
 * Grenze hängen könnte, und mit `\b` fiel „12,50 €" durch.
 */
const WAEHRUNG = `(?:\\b(?:${WAEHRUNGEN})(?!\\w)|(?:${SYMBOLE}))`

/**
 * Ziffern mit Tausender- und Dezimaltrennern, wie Menschen sie schreiben.
 *
 * Das abschliessende `.-` gehört dazu: „45.- Fr.“ ist in der Schweiz die
 * gewöhnliche Schreibweise eines Preises, und ohne diesen Teil bliebe der Betrag
 * stehen, während die Währung verschwindet.
 */
const BETRAG = "\\d[\\d'’.,\\u00a0 ]*\\d(?:\\.[-–])?|\\d(?:\\.[-–])?"

/**
 * „ab“, „ca.“, „rund“ – die Wörter, die einen Betrag ankündigen und mit ihm
 * fallen.
 *
 * Mehrfach wiederholbar, weil sie sich häufen: „ab rund 1200 Baht“ liest sich
 * ohne „ab rund“ richtig und mit halb entferntem Vorlauf falsch.
 */
const VORSILBE = '(?:(?:ab|ca\\.?|circa|etwa|rund|je|für|pro Person|~|≈|<|>|≤|≥)\\s*){0,3}'

const PREISMUSTER = [
  // CHF 412, ab ca. € 1'200, $50
  new RegExp(`${VORSILBE}${WAEHRUNG}\\s*(?:${BETRAG})`, 'gi'),
  // 412 CHF, 1'200 Euro, 50€, 45.- Fr.
  new RegExp(`${VORSILBE}(?:${BETRAG})\\s*${WAEHRUNG}`, 'gi'),
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
 * Ein Trennzeichen, das durch die Entfernung an ein Wort gerutscht ist.
 *
 * „Hotel 89 EUR/Nacht“ ergibt sonst „Hotel /Nacht“. Der Lookahead auf ein
 * Nicht-Leerzeichen ist der Unterschied zu einem echten Gedankenstrich: „Zürich –
 * Bangkok“ hat hinter dem Strich ein Leerzeichen und bleibt unangetastet.
 */
const VERWAISTES_TRENNZEICHEN = /\s[-–—:,;·|/]+(?=\S)/g

/**
 * Ein Leerzeichen, das vor einem Satzzeichen stehen geblieben ist.
 *
 * „Flug CHF 412, Hotel …“ ergibt sonst „Flug , Hotel …“.
 */
const LUECKE_VOR_SATZZEICHEN = /\s+(?=[,;:.!?])/g

/**
 * Steuerzeichen weg, Leerraum vereinheitlicht, Ränder getrimmt.
 *
 * Gilt für jeden Text, der von aussen kommt – aus dem Modell und aus dem
 * Formular. Ein Zeilenumbruch bleibt kein Zeilenumbruch: Titel und Notizen
 * dieser Anwendung sind einzeilig, und ein `\n` in einem Titel ist in der
 * Oberfläche ein unsichtbares Rätsel.
 */
export function ohneSteuerzeichen(wert: string): string {
  return (
    wert
      .normalize('NFC')
      // Zeichen ohne Breite fallen weg statt zu einem Leerzeichen zu werden. Sonst
      // machte ein `\u200b` mitten in „Bangkok" aus dem Wort zwei.
      .replace(/[\u200b-\u200f\u2060\ufeff]/g, '')
      .replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
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
    .replace(VERWAISTES_TRENNZEICHEN, ' ')
    .replace(LUECKE_VOR_SATZZEICHEN, '')
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
