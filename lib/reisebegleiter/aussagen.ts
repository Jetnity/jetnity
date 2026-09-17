// lib/reisebegleiter/aussagen.ts
//
// Der einzige Kanal, über den eine Auskunft etwas über eine amtliche Lage
// sagen darf – und er besteht nicht aus Sprache.
//
// ---------------------------------------------------------------------------
// Wie der Kanal funktioniert
// ---------------------------------------------------------------------------
//
// Das Modell hat kein Feld, in dem es einen Satz schreiben könnte
// (`lib/reisebegleiter/schema.ts`). Es *wählt* stattdessen: eine Aussage aus
// der geschlossenen Liste unten und den Official-Bezug, auf den sie sich
// bezieht. Den Satz schreibt Jetnity.
//
// Damit ist „kann das Modell eine amtliche Anforderung erfinden?" keine Frage
// über Texte, sondern eine über Typen – und die Antwort steht im Schema, nicht
// in einer Prüfung über Formulierungen.
//
// Der zweite Katalog, `lib/reisebegleiter/befunde.ts`, arbeitet genauso, spricht
// aber über Jetnitys **eigenen Datenstand** (Zeitraum, Etappen, Reisende,
// Dokumentstand, Route) und nie über eine amtliche Anforderung.
//
// ---------------------------------------------------------------------------
// Warum die Aussagen an den Zustand gebunden sind
// ---------------------------------------------------------------------------
//
// Eine geschlossene Liste allein genügt nicht: `geprueft_nicht_erforderlich`
// wäre sonst ein Schlüssel, mit dem sich `unknown` zu `not_required` erklären
// liesse. Jede Aussage nennt deshalb unten die Bedingung, unter der sie zum
// Bezug passt, und `passt()` prüft sie gegen die Projektion. Eine Aussage ohne
// passenden Zustand verwirft die Auskunft
// (`lib/reisebegleiter/pruefung.ts`).
//
// ---------------------------------------------------------------------------
// Historie, ausdrücklich nicht der aktuelle Stand
// ---------------------------------------------------------------------------
//
// Sieben frühere Fassungen dieses Slice versuchten, erfundene amtliche
// Wahrheit im **Freitext** des Modells zu erkennen: deutsche Muster,
// mehrsprachige Verbotslisten, eine Spracherkennung, eine Erlaubnisliste über
// einem geführten Wortschatz. Alle sind widerlegt und entfernt – der
// Wortschatz samt Modul ebenso. Der gemeinsame Fehler war nicht die jeweilige
// Liste, sondern die Annahme, man könne Prosa prüfen, in der amtliche Aussagen
// überhaupt vorkommen dürfen. Die Begründung steht in DECISIONS.md ADR-0212
// Punkt 8; hier gilt nur noch der typisierte Weg oben.
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
