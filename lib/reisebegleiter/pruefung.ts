// lib/reisebegleiter/pruefung.ts
//
// Die zweite Schranke: die Auskunft gegen den Kontext, aus dem sie entstand.
//
// `lib/reisebegleiter/schema.ts` prüft die Form – ein Objekt mit vier Feldern,
// ohne Betrag, ohne Link. Form ist aber keine Aussage. Diese Datei prüft die
// beiden Behauptungen, die ein Modell hier überhaupt machen kann:
//
//   1. einen Bezug auf einen Jetnity-Zustand, den es im Kontext nicht gibt;
//   2. eine Gewissheit, die der Kontext nicht deckt.
//
// ---------------------------------------------------------------------------
// Warum das ein Wortfilter ist – und warum das reicht, aber nicht genügt
// ---------------------------------------------------------------------------
//
// „Nicht als gewiss behaupten" ist eine semantische Eigenschaft, und ein
// deterministischer Test kann Semantik nicht lesen. Was er kann: die Wörter
// verbieten, mit denen eine unbelegte Gewissheit im Deutschen ausgedrückt wird –
// „visumfrei", „kein Visum", „ohne Visum", „garantiert", „amtlich bestätigt".
//
// Das ist bewusst streng und nimmt Fehlalarme in Kauf: Der Satz „Jetnity kann
// nicht bestätigen, dass du ohne Visum einreisen darfst" ist inhaltlich ehrlich
// und fällt trotzdem durch. Deshalb verbieten die Systemregeln in
// `lib/reisebegleiter/regeln.ts` dieselben Wörter ausdrücklich: Ein Modell, das
// sich daran hält, merkt von dieser Datei nichts, und eines, das sie ignoriert,
// liefert keine Auskunft. Der Handel ist Wahrheit gegen Eleganz, und in dieser
// Richtung ist er richtig.
//
// Er ist ausserdem **die zweite** Schranke, nicht die erste. Die erste ist
// struktureller Natur: Das Schema hat kein Feld für eine Anforderung, und den
// Zustand eines Bezugs schreibt nicht das Modell, sondern
// `lib/reisebegleiter/nutzlast.ts`. Was ein Modell nicht formulieren kann, muss
// dieser Filter nicht abfangen.
//
// Nicht erkannt werden Verfügbarkeitsbehauptungen in freier Formulierung –
// dieselbe eingestandene Grenze wie in DECISIONS.md ADR-0054.
//
// Frei von Next, Supabase und `process.env`.

import type { BegleiterBezug } from '@/lib/reisebegleiter/nutzlast'
import type { Modellauskunft } from '@/lib/reisebegleiter/schema'

export type Pruefbefund =
  | { ok: true }
  | { ok: false; art: 'unbekannter-bezug' | 'unbelegte-gewissheit'; hinweis: string }

/**
 * Unbelegte Gewissheit über amtliche Anforderungen.
 *
 * Greift nur, solange der Kontext keine belegte Official-Lage trägt. Sobald
 * eine geprüfte, aktuelle Quelle im Kontext steht, ist eine klare Aussage
 * darüber keine Erfindung mehr, sondern ihr Zweck.
 */
const GEWISSHEITSMUSTER: ReadonlyArray<{ name: string; muster: RegExp }> = [
  { name: 'visumfrei', muster: /\bvis(?:um|a)s?frei\b/i },
  { name: 'kein Visum', muster: /\bkein(?:e|en|es)?\s+vis(?:um|a)\b/i },
  { name: 'ohne Visum', muster: /\bohne\s+vis(?:um|a)\b/i },
  { name: 'keine Impfung', muster: /\bkeine?\s+impf\w*/i },
  { name: 'nicht erforderlich', muster: /\bnicht\s+erforderlich\b/i },
  { name: 'garantiert', muster: /\bgarantiert\b/i },
  { name: 'definitiv', muster: /\bdefinitiv\b/i },
  { name: 'amtlich bestätigt', muster: /\b(?:amtlich|offiziell|beh[öo]rdlich)\s+best[äa]tigt\b/i },
  { name: 'problemlos einreisen', muster: /\b(?:problemlos|sicher|ohne\s+weiteres)\s+einreisen\b/i },
]

/**
 * Behauptungen, die der Kontext nie decken kann.
 *
 * Buchungszustand steht nicht in der akzeptierten Projektion – weder „gebucht"
 * noch „noch nicht gebucht". Beide Sätze sind deshalb erfunden, auch der
 * vorsichtige. Und eine Auskunft, die eine Reiseänderung im Perfekt beschreibt,
 * behauptet eine Persistenz, die dieser Weg nicht hat.
 */
const UNMOEGLICHE_ANSPRUECHE: ReadonlyArray<{ name: string; muster: RegExp }> = [
  { name: 'Buchungszustand', muster: /\bgebucht\b|\bbuchungsbest[äa]tigung\b/i },
  {
    name: 'ausgeführte Änderung',
    muster: /\bich\s+hab(?:e)?\b[^.!?]{0,80}\b(?:ge[äa]ndert|hinzugef[üu]gt|entfernt|gespeichert|eingeplant|verschoben)\b/i,
  },
  { name: 'gespeicherte Änderung', muster: /\b(?:wurde|wurden|ist|sind)\s+(?:bereits\s+)?gespeichert\b/i },
]

function texte(auskunft: Modellauskunft): string[] {
  return [auskunft.antwort, ...auskunft.unsicherheiten, ...auskunft.naechsteSchritte]
}

/**
 * Prüft die Auskunft gegen die Bezüge des Kontexts.
 *
 * `bezuege` ist die Liste aus `begleiternutzlastAus()` – dieselbe, die das
 * Modell als `ref` gesehen hat.
 */
export function auskunftPruefen(
  auskunft: Modellauskunft,
  bezuege: readonly BegleiterBezug[],
): Pruefbefund {
  const bekannt = new Set(bezuege.map((bezug) => bezug.ref))

  for (const ref of auskunft.bezuege) {
    if (!bekannt.has(ref)) {
      return {
        ok: false,
        art: 'unbekannter-bezug',
        hinweis: `Die Auskunft zeigt auf ${ref}; diesen Bezug gibt es im Kontext nicht.`,
      }
    }
  }

  for (const text of texte(auskunft)) {
    const anspruch = UNMOEGLICHE_ANSPRUECHE.find((eintrag) => eintrag.muster.test(text))
    if (anspruch) {
      return {
        ok: false,
        art: 'unbelegte-gewissheit',
        hinweis: `Die Auskunft behauptet ${anspruch.name}; dafür trägt der Kontext keine Wahrheit.`,
      }
    }
  }

  const officialBelegt = bezuege.some((bezug) => bezug.art === 'official' && bezug.belegt)
  if (officialBelegt) return { ok: true }

  for (const text of texte(auskunft)) {
    const gewissheit = GEWISSHEITSMUSTER.find((eintrag) => eintrag.muster.test(text))
    if (gewissheit) {
      return {
        ok: false,
        art: 'unbelegte-gewissheit',
        hinweis: `Die Auskunft benutzt „${gewissheit.name}", ohne dass eine geprüfte amtliche Lage vorliegt.`,
      }
    }
  }

  return { ok: true }
}
