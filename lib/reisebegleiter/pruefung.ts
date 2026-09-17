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

import type { BegleiterBezug, OfficialAnforderung } from '@/lib/reisebegleiter/nutzlast'
import type { Modellauskunft } from '@/lib/reisebegleiter/schema'

export type Pruefbefund =
  | { ok: true }
  | { ok: false; art: 'unbekannter-bezug' | 'unbelegte-gewissheit'; hinweis: string }

/**
 * Unbelegte Gewissheit über amtliche Anforderungen.
 *
 * Eine Gewissheit ist an die amtliche Lage gebunden, auf die sich die Auskunft
 * **beruft** – und zwar an die, über die sie spricht. Zwei Stufen:
 *
 * 1. Es genügt nicht, dass irgendwo im Kontext eine geprüfte Lage steht. Sonst
 *    würde eine beliebige aktuelle Prüfung den Satz „kein Visum erforderlich"
 *    freischalten, obwohl die Visumslage unbekannt ist.
 * 2. Es genügt auch nicht, dass die Auskunft *irgendeine* geprüfte Lage nennt.
 *    Eine aktuelle Impfanforderung sagt nichts über das Visum. Wer sie als
 *    Beleg für „kein Visum erforderlich" durchgehen lässt, wertet eine
 *    Wahrheitsklasse mit einer fremden auf.
 *
 * Beides ist dieselbe verbotene Aufwertung von `unknown` zu `not_required`,
 * einmal über die Reise und einmal über den Anforderungstyp.
 *
 * `getragenVon` ist deshalb ein Prädikat über die **maschinenlesbare**
 * Anforderungsidentität aus `lib/reisebegleiter/nutzlast.ts`, nicht über den
 * Anzeigetext. `null` heisst: Diese Formulierung lässt sich keiner Anforderung
 * zuordnen und wird immer abgelehnt – „garantiert" kann nichts belegen.
 */
type Gewissheitsmuster = {
  name: string
  muster: RegExp
  getragenVon: ((anforderung: OfficialAnforderung) => boolean) | null
}

const zielVisum = (anforderung: OfficialAnforderung): boolean =>
  anforderung.scope === 'destination' && anforderung.requirementType === 'visa'

const transitVisum = (anforderung: OfficialAnforderung): boolean =>
  anforderung.scope === 'transit' &&
  (anforderung.requirementType === 'transit' || anforderung.requirementType === 'visa')

const impfung = (anforderung: OfficialAnforderung): boolean =>
  anforderung.requirementType === 'vaccination'

const gesundheit = (anforderung: OfficialAnforderung): boolean =>
  anforderung.requirementType === 'vaccination' ||
  anforderung.requirementType === 'health' ||
  anforderung.requirementType === 'health_document'

const reisegenehmigung = (anforderung: OfficialAnforderung): boolean =>
  anforderung.requirementType === 'electronic_travel_authorization'

const GEWISSHEITSMUSTER: ReadonlyArray<Gewissheitsmuster> = [
  // Transit zuerst benannt, damit klar ist, dass „Transitvisum" ein eigener
  // Bereich ist. Die Muster überschneiden sich nicht: In „Transitvisum" steht
  // vor „vis" ein Wortzeichen, an dem `\b` der Zielvisum-Muster nicht greift.
  {
    name: 'kein Transitvisum',
    muster: /\b(?:kein(?:e|en|es)?|ohne)\s+transit[-\s]?vis(?:um|a)\b|\btransit[-\s]?vis(?:um|a)s?frei\b/i,
    getragenVon: transitVisum,
  },
  { name: 'visumfrei', muster: /\bvis(?:um|a)s?frei\b/i, getragenVon: zielVisum },
  { name: 'kein Visum', muster: /\bkein(?:e|en|es)?\s+vis(?:um|a)\b/i, getragenVon: zielVisum },
  { name: 'ohne Visum', muster: /\bohne\s+vis(?:um|a)\b/i, getragenVon: zielVisum },
  {
    name: 'keine elektronische Reisegenehmigung',
    muster: /\b(?:kein(?:e|en|es)?|ohne)\s+(?:eTA\b|elektronische\w*\s+reisegenehmigung)/i,
    getragenVon: reisegenehmigung,
  },
  { name: 'keine Impfung', muster: /\bkeine?\s+impf\w*/i, getragenVon: impfung },
  {
    name: 'keine Gesundheitsanforderung',
    muster: /\b(?:kein(?:e|en|es)?|ohne)\s+(?:gesundheits\w+|attest|[äa]rztliche\w*\s+\w+)/i,
    getragenVon: gesundheit,
  },
  // Ab hier: nicht zuordenbar. Eine Anforderung, die sie belegen könnte, gibt
  // es nicht – „nicht erforderlich" sagt nicht, was nicht erforderlich ist.
  { name: 'nicht erforderlich', muster: /\bnicht\s+erforderlich\b/i, getragenVon: null },
  { name: 'garantiert', muster: /\bgarantiert\b/i, getragenVon: null },
  { name: 'definitiv', muster: /\bdefinitiv\b/i, getragenVon: null },
  {
    name: 'amtlich bestätigt',
    muster: /\b(?:amtlich|offiziell|beh[öo]rdlich)\s+best[äa]tigt\b/i,
    getragenVon: null,
  },
  {
    name: 'problemlos einreisen',
    muster: /\b(?:problemlos|sicher|ohne\s+weiteres)\s+einreisen\b/i,
    getragenVon: null,
  },
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

  // Alle Gewissheiten, nicht nur die erste: Ein Text kann mehrere enthalten,
  // und jede braucht ihren eigenen Beleg.
  const gewissheiten = GEWISSHEITSMUSTER.filter((eintrag) =>
    texte(auskunft).some((text) => eintrag.muster.test(text)),
  )

  if (gewissheiten.length === 0) return { ok: true }

  // Ab hier steht mindestens eine Gewissheit im Text. Sie darf nur bestehen
  // bleiben, wenn die Auskunft die amtliche Lage, auf die sie sich stützt,
  // benennt – und wenn keine der benannten Lagen ihr widerspricht.
  const gezeigt = new Set(auskunft.bezuege)
  const benannt = bezuege.filter((bezug) => bezug.art === 'official' && gezeigt.has(bezug.ref))

  const widerspruch = benannt.find((bezug) => !bezug.belegt)
  if (widerspruch) {
    return {
      ok: false,
      art: 'unbelegte-gewissheit',
      hinweis: `Die Auskunft benutzt „${gewissheiten[0].name}" und zeigt zugleich auf ${widerspruch.ref}, dessen amtliche Lage nicht geprüft ist.`,
    }
  }

  for (const gewissheit of gewissheiten) {
    const getragenVon = gewissheit.getragenVon
    if (!getragenVon) {
      return {
        ok: false,
        art: 'unbelegte-gewissheit',
        hinweis: `Die Auskunft benutzt „${gewissheit.name}"; diese Formulierung lässt sich keiner geprüften Anforderung zuordnen.`,
      }
    }

    const traeger = benannt.find(
      (bezug) => bezug.belegt && bezug.anforderung != null && getragenVon(bezug.anforderung),
    )

    if (!traeger) {
      return {
        ok: false,
        art: 'unbelegte-gewissheit',
        hinweis: `Die Auskunft benutzt „${gewissheit.name}", ohne eine dazu passende geprüfte amtliche Anforderung zu benennen.`,
      }
    }
  }

  return { ok: true }
}
