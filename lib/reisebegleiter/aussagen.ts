// lib/reisebegleiter/aussagen.ts
//
// Der einzige Kanal, über den eine Auskunft etwas über eine amtliche Lage
// sagen darf – und er besteht nicht aus Sprache.
//
// ---------------------------------------------------------------------------
// Warum getrennte Kanäle
// ---------------------------------------------------------------------------
//
// Sechs Fassungen haben versucht, erfundene amtliche Wahrheit im Freitext des
// Modells zu **erkennen**: deutsche Muster, mehrsprachige Verbotslisten, eine
// Spracherkennung, zuletzt eine Erlaubnisliste über dem Wortschatz. Jede war
// widerlegbar, und die Gegenbeispiele wurden zum Schluss beliebig: `Ein Visum
// ist notwendig.` aus lauter erlaubten Wörtern; `V I S U M ist P F L I C H T.`
// aus lauter erlaubten Einzelbuchstaben; ein Etappenname `No visa is required`,
// der den Wortschatz selbst erweitert.
//
// Der gemeinsame Fehler war nicht die jeweilige Liste. Es war die Annahme, dass
// man Prosa prüfen kann, in der amtliche Aussagen **überhaupt vorkommen
// dürfen**. Diese Annahme ist hier aufgegeben:
//
//   · **Prosa** (`antwort`, `unsicherheiten`, `naechsteSchritte`) darf über die
//     Reise sprechen – Etappen, Tage, Plan, nächste Schritte in Jetnity. Ihr
//     Wortschatz (`lib/reisebegleiter/wortschatz.ts`) enthält **kein**
//     amtliches Vokabular. Ohne Gegenstand gibt es keine amtliche Aussage;
//     `lib/reisebegleiter/wortschatz.test.ts` prüft das gegen die
//     Bereichsmuster selbst.
//   · **Amtliche Lagen** laufen über diesen Kanal: Das Modell *wählt* eine
//     Aussage aus der geschlossenen Liste unten und nennt den Bezug, auf den
//     sie sich bezieht. Den Satz schreibt Jetnity, nicht das Modell.
//
// Damit ist die Frage „kann Modellprosa eine amtliche Anforderung erfinden?"
// nicht mehr eine Frage über Texte, sondern eine über Typen: Es gibt kein
// Freitextfeld, in dem eine amtliche Anforderung ausdrückbar wäre, und der
// typisierte Kanal lässt nur Aussagen zu, die zum geprüften Zustand passen.
//
// ---------------------------------------------------------------------------
// Warum die Aussagen an den Zustand gebunden sind
// ---------------------------------------------------------------------------
//
// Eine geschlossene Liste allein genügt nicht: `geprueft_nicht_erforderlich`
// wäre sonst ein Schlüssel, mit dem sich `unknown` zu `not_required` erklären
// liesse. Jede Aussage nennt deshalb unten die Bedingung, unter der sie zum
// Bezug passt, und `passt()` prüft sie gegen die Projektion. Eine Aussage ohne
// passenden Zustand verwirft die Auskunft.
//
// Frei von Next, Supabase und `process.env`.

import type { OfficialAnforderung } from '@/lib/reisebegleiter/nutzlast'

export const AMTLICHE_AUSSAGEN = [
  'nicht_geprueft',
  'angaben_fehlen',
  'quelle_nicht_erreichbar',
  'erneut_pruefen',
  'geprueft_erforderlich',
  'geprueft_nicht_erforderlich',
  'geprueft_bedingt',
] as const

export type AmtlicheAussage = (typeof AMTLICHE_AUSSAGEN)[number]

/**
 * Die Sätze, die Jetnity dazu schreibt.
 *
 * Sie stehen hier und nicht im Modell. Ein Modell, das den Satz nicht
 * formulieren darf, kann ihn nicht verfälschen – dieselbe Begründung wie beim
 * angezeigten Zustand eines Bezugs.
 */
export const AMTLICHE_AUSSAGE_TEXT: Record<AmtlicheAussage, string> = {
  nicht_geprueft: 'Diese amtliche Lage ist derzeit nicht geprüft.',
  angaben_fehlen: 'Für die Prüfung dieser Lage fehlen noch Angaben.',
  quelle_nicht_erreichbar: 'Die offizielle Quelle für diese Lage ist derzeit nicht erreichbar.',
  erneut_pruefen: 'Diese Lage wurde geprüft, sollte aber erneut geprüft werden.',
  geprueft_erforderlich: 'Geprüft: Diese Anforderung besteht.',
  geprueft_nicht_erforderlich: 'Geprüft: Diese Anforderung besteht nicht.',
  geprueft_bedingt: 'Geprüft: Diese Anforderung besteht unter Bedingungen.',
}

/**
 * Ob eine gewählte Aussage zum geprüften Zustand des Bezugs passt.
 *
 * `belegt` heisst: aktuelle, erreichbare Quelle und ein bestimmtes Ergebnis
 * (`lib/reisebegleiter/nutzlast.ts`). Die drei `geprueft_*`-Aussagen setzen das
 * voraus **und** das passende Ergebnis; die übrigen setzen das Gegenteil
 * voraus, denn „nicht geprüft" über eine geprüfte Lage ist genauso falsch wie
 * umgekehrt.
 */
export function passt(
  aussage: AmtlicheAussage,
  anforderung: OfficialAnforderung,
  belegt: boolean,
): boolean {
  switch (aussage) {
    case 'geprueft_erforderlich':
      return belegt && anforderung.ergebnis === 'required'
    case 'geprueft_nicht_erforderlich':
      return belegt && anforderung.ergebnis === 'not_required'
    case 'geprueft_bedingt':
      return belegt && anforderung.ergebnis === 'conditional'
    case 'angaben_fehlen':
      return !belegt && anforderung.fehlendeAngaben
    case 'quelle_nicht_erreichbar':
      return (
        !belegt &&
        (anforderung.frische === 'provider_unavailable' ||
          anforderung.frische === 'source_temporarily_unavailable')
      )
    case 'erneut_pruefen':
      return (
        !belegt && (anforderung.frische === 'recheck_needed' || anforderung.frische === 'stale')
      )
    case 'nicht_geprueft':
      return !belegt
  }
}
