// lib/reisebegleiter/pruefung.ts
//
// Die zweite Schranke: die Auskunft gegen den Kontext, aus dem sie entstand.
//
// `lib/reisebegleiter/schema.ts` prüft die Form – ein Objekt mit vier Feldern,
// ohne Betrag, ohne Link. Form ist aber keine Aussage. Diese Datei prüft die
// Behauptungen, die ein Modell hier überhaupt machen kann:
//
//   1. einen Bezug auf einen Jetnity-Zustand, den es im Kontext nicht gibt;
//   2. eine Aussage, die der Kontext nie decken kann (Buchung, Persistenz);
//   3. eine **harte amtliche Aussage** ohne passende geprüfte Grundlage.
//
// ---------------------------------------------------------------------------
// Warum die dritte Prüfung so aussieht, wie sie aussieht
// ---------------------------------------------------------------------------
//
// „Erfinde keine amtliche Anforderung" ist semantisch, und ein
// deterministischer Test liest keine Semantik. Was er lesen kann, sind drei
// Dinge, und ihre Kombination ist der ganze Trick:
//
//   · **Modalität** – sagt der Satz „du musst", „du brauchst", „ist
//     erforderlich", „kein", „ohne"? Ohne Modalität ist es eine Beschreibung
//     und keine Anforderung.
//   · **Bereich** – wovon spricht der Satz: Visum, Transit, Pass, Passgültigkeit,
//     freie Passseiten, Ausweis, Impfung, Gesundheit, Einreiseformular,
//     Versicherung, Rück-/Weiterreise, Buchungsnachweis, finanzielle Mittel –
//     oder von etwas Amtlichem ohne erkennbaren Bereich.
//   · **Vorbehalt** – steht ein „ob", „prüfe", „unklar", „nicht geprüft",
//     „möglicherweise" im Satz? Dann ist es eine Frage oder ein Hinweis und
//     keine Behauptung.
//
// Erst Modalität **und** Bereich **ohne** Vorbehalt ergeben eine harte
// Aussage. Sie darf nur stehen bleiben, wenn die Auskunft eine geprüfte
// amtliche Lage **desselben Bereichs** benennt.
//
// Damit bleibt der Satz erhalten, den ein ehrlicher Assistent schreiben muss –
// „Prüfe deine Passgültigkeit in der Reisevorbereitung", „Ob ein Visum nötig
// ist, ist derzeit nicht geprüft" –, und der Satz fällt, den er nicht schreiben
// darf: „Dein Pass muss sechs Monate gültig sein."
//
// ---------------------------------------------------------------------------
// Was das in dieser Ausbaustufe bedeutet
// ---------------------------------------------------------------------------
//
// Solange kein Requirements-Provider aktiv ist, liefert
// `requirementsLokalFuerReise()` ausschliesslich `provider_unavailable`, und
// **kein** Official-Bezug ist je `belegt`. Diese Prüfung ist deshalb heute
// kein Filter, sondern eine vollständige Sperre gegen amtliche Aussagen. Das
// ist richtig: Jetnity hat keine geprüfte amtliche Wahrheit, also darf der
// Reisebegleiter keine behaupten. Mit einem echten Provider öffnet sich der
// Weg genau dort, wo die Lage tatsächlich geprüft ist.
//
// Die Zuordnung benutzt ausschliesslich die **maschinenlesbare**
// Anforderungsidentität aus `lib/reisebegleiter/nutzlast.ts`, niemals den
// lokalisierten Anzeigetext: Eine Copy-Änderung darf keine
// Wahrheitsentscheidung verschieben.
//
// Nicht erkannt werden Verfügbarkeitsbehauptungen in freier Formulierung –
// dieselbe eingestandene Grenze wie in DECISIONS.md ADR-0054.
//
// Frei von Next, Supabase und `process.env`.

import type { BegleiterBezug, OfficialAnforderung } from '@/lib/reisebegleiter/nutzlast'
import type { Modellauskunft } from '@/lib/reisebegleiter/schema'
import type { OfficialRequirementType } from '@/types/trips'

export type Pruefbefund =
  | { ok: true }
  | { ok: false; art: 'unbekannter-bezug' | 'unbelegte-gewissheit'; hinweis: string }

// ---------------------------------------------------------------------------
// Ansprüche, die der Kontext nie decken kann
// ---------------------------------------------------------------------------

/**
 * Buchungszustand steht nicht in der akzeptierten Projektion – weder „gebucht"
 * noch „noch nicht gebucht". Beide Sätze sind erfunden, auch der vorsichtige.
 * Und eine Auskunft, die eine Reiseänderung im Perfekt beschreibt, behauptet
 * eine Persistenz, die dieser Weg nicht hat.
 */
const UNMOEGLICHE_ANSPRUECHE: ReadonlyArray<{ name: string; muster: RegExp }> = [
  { name: 'Buchungszustand', muster: /\bgebucht\b|\bbuchungsbest[äa]tigung\b/i },
  {
    name: 'ausgeführte Änderung',
    muster: /\bich\s+hab(?:e)?\b[^.!?]{0,80}\b(?:ge[äa]ndert|hinzugef[üu]gt|entfernt|gespeichert|eingeplant|verschoben)\b/i,
  },
  { name: 'gespeicherte Änderung', muster: /\b(?:wurde|wurden|ist|sind)\s+(?:bereits\s+)?gespeichert\b/i },
]

/**
 * Gewissheit ohne erkennbaren Gegenstand.
 *
 * Diese Worte sagen nicht, worüber sie sprechen, und lassen sich deshalb
 * keiner Anforderung zuordnen. Sie fallen immer durch – auch dann, wenn die
 * Auskunft eine geprüfte Lage benennt: Was „garantiert" sein soll, steht in
 * keinem Feld, das sich prüfen liesse.
 */
const NICHT_BINDBAR: ReadonlyArray<{ name: string; muster: RegExp }> = [
  { name: 'nicht erforderlich', muster: /\bnicht\s+erforderlich\b/i },
  { name: 'garantiert', muster: /\bgarantiert\b/i },
  { name: 'definitiv', muster: /\bdefinitiv\b/i },
  {
    name: 'amtlich bestätigt',
    muster: /\b(?:amtlich|offiziell|beh[öo]rdlich)\s+best[äa]tigt\b/i,
  },
  {
    name: 'problemlos einreisen',
    muster: /\b(?:problemlos|sicher|ohne\s+weiteres)\s+einreisen\b/i,
  },
]

// ---------------------------------------------------------------------------
// Harte amtliche Aussagen
// ---------------------------------------------------------------------------

/** Der Satz verlangt etwas. */
const PFLICHTWORT =
  /\b(?:brauchst|braucht|brauchen|ben[öo]tigst|ben[öo]tigt|ben[öo]tigen|muss|musst|m[üu]ssen|m[üu]sst|erforderlich|vorgeschrieben|verpflichtend|obligatorisch|zwingend|nachweisen|nachzuweisen|vorlegen|vorzulegen|mitf[üu]hren)\b|pflicht/i

/** Der Satz stellt etwas frei. */
const BEFREIUNGSWORT =
  /\b(?:kein|keine|keinen|keiner|keines|keinerlei|ohne|entf[äa]llt|entfallen|befreit)\b|\w+frei\b/i

/**
 * Der Satz fragt, prüft oder schränkt ein – und behauptet damit nichts.
 *
 * Bewusst nur epistemische Vorbehalte. „kannst" gehört nicht dazu: „Du kannst
 * ohne Visum einreisen" ist eine Erlaubnis und damit sehr wohl eine
 * Behauptung.
 */
const VORBEHALT =
  /\bob\b|pr[üu]f|\bkl[äa]r|unklar|ungekl[äa]rt|\bnicht\s+belegt\b|\bnicht\s+best[äa]tig\w*|m[öo]glicherweise|eventuell|unter\s+umst[äa]nden|vielleicht|\bggf\b|gegebenenfalls|\bfalls\b|\bsofern\b|voraussichtlich|in\s+der\s+regel|[üu]blicherweise|typischerweise/i

type Anforderungsbereich = {
  name: string
  /** Wovon der Satz spricht. */
  muster: RegExp
  /** Welche Anforderungstypen eine harte Aussage darüber belegen können. */
  traegerTypen: ReadonlyArray<OfficialRequirementType>
  /** Zusätzliche Bedingung an die Anforderung, etwa der Geltungsbereich. */
  zusatz?: (anforderung: OfficialAnforderung) => boolean
}

/**
 * Die Bereiche, geordnet von speziell nach allgemein.
 *
 * Je Satz gilt der **erste** Treffer. Deshalb steht „freie Passseiten" vor
 * „Passgültigkeit" und beides vor „Reisepass": Ein Satz über freie Seiten im
 * Pass spricht nicht über die Gültigkeit, und eine geprüfte Passpflicht belegt
 * keine Sechsmonatsregel.
 *
 * Der letzte Eintrag ist der Auffangbereich: amtlicher Zusammenhang ohne
 * erkennbaren Gegenstand. Er fällt auf `other_entry_requirement` und damit in
 * aller Regel durch – was der vorgesehene Ausgang ist.
 */
const BEREICHE: readonly Anforderungsbereich[] = [
  {
    name: 'Transit',
    muster: /\btransit\w*|\bzwischenlandung\w*|\bumsteige\w*/i,
    traegerTypen: ['transit', 'visa'],
    zusatz: (anforderung) => anforderung.scope === 'transit',
  },
  {
    name: 'elektronische Reisegenehmigung',
    muster: /\beta\b|\besta\b|\belektronische\w*\s+reisegenehmigung|\breisegenehmigung\w*/i,
    traegerTypen: ['electronic_travel_authorization'],
  },
  {
    name: 'Visum',
    muster: /\bvis(?:um|a)\w*/i,
    traegerTypen: ['visa'],
    zusatz: (anforderung) => anforderung.scope === 'destination',
  },
  {
    name: 'freie Passseiten',
    muster: /\bpassseiten?\b|\b(?:freie|leere|unbedruckte)\s+seiten?\b/i,
    traegerTypen: ['blank_passport_pages'],
  },
  {
    name: 'Passgültigkeit',
    muster: /\bpassg[üu]ltigkeit\w*|\b(?:reise)?pass\w*\b[^.!?;:]{0,60}\bg[üu]ltig\w*|\bg[üu]ltig\w*[^.!?;:]{0,60}\b(?:reise)?pass\w*\b/i,
    traegerTypen: ['passport_validity'],
  },
  {
    name: 'Ausweisdokument',
    muster: /\bpersonalausweis\w*|\bidentit[äa]ts(?:dokument|nachweis)\w*|\bausweisdokument\w*/i,
    traegerTypen: ['identity_document', 'passport'],
  },
  {
    name: 'Reisepass',
    muster: /\breisepass\w*|\bpass\b|\bp[äa]sse\b|\bpasses\b/i,
    traegerTypen: ['passport', 'identity_document'],
  },
  {
    name: 'Impfung',
    muster: /impf\w*|geimpft|vakzin\w*/i,
    traegerTypen: ['vaccination'],
  },
  {
    name: 'Gesundheitsdokument',
    muster: /\bgesundheits(?:dokument|formular|erkl[äa]rung|pass)\w*/i,
    traegerTypen: ['health_document', 'health'],
  },
  {
    name: 'Gesundheitsanforderung',
    muster: /\bgesundheit\w*|\battest\w*|\b[äa]rztlich\w*|\bquarant[äa]ne\w*|\btest(?:pflicht|nachweis)\w*/i,
    traegerTypen: ['health', 'health_document', 'vaccination'],
  },
  {
    name: 'Einreiseformular',
    muster: /\beinreise(?:formular|anmeldung|karte|registrierung|erkl[äa]rung)\w*|\bregistrierungsformular\w*/i,
    traegerTypen: ['entry_form'],
  },
  {
    name: 'Versicherung',
    muster: /versicher\w*/i,
    traegerTypen: ['insurance'],
  },
  {
    name: 'Rück- oder Weiterreise',
    muster: /\br[üu]ckflug\w*|\br[üu]ckreise\w*|\br[üu]ckfahrkarte\w*|\bweiterreise\w*|\bweiterflug\w*|\bonward\b/i,
    traegerTypen: ['onward_or_return_ticket'],
  },
  {
    name: 'Buchungs- oder Reisenachweis',
    muster: /\bbuchungsnachweis\w*|\breisenachweis\w*|\bunterkunftsnachweis\w*|\bhotelnachweis\w*|\breisebest[äa]tigung\w*/i,
    traegerTypen: ['booking_or_travel_document'],
  },
  {
    name: 'finanzielle Mittel',
    muster: /\bfinanzielle\w*\s+mittel\w*|\bfinanzmittel\w*|\bmindestbetrag\w*|\bausreichende\w*\s+mittel\w*|\bbargeld\w*|\bzahlungsf[äa]higkeit\w*/i,
    traegerTypen: ['financial_means'],
  },
  {
    // Auffangbereich. Amtlicher Zusammenhang, aber kein benennbarer Gegenstand.
    name: 'sonstige Einreiseanforderung',
    muster:
      /\beinreis\w*|\bamtlich\w*|\bbeh[öo]rd\w*|\boffiziell\w*|\bvorschrift\w*|\bbestimmung\w*|\bgesetzlich\w*|\bgrenzkontroll\w*|\bzoll\w*|\berforderlich\b|\bvorgeschrieben\b|pflicht/i,
    traegerTypen: ['other_entry_requirement'],
  },
]

function traegt(bereich: Anforderungsbereich, anforderung: OfficialAnforderung): boolean {
  if (!bereich.traegerTypen.includes(anforderung.requirementType)) return false
  return bereich.zusatz ? bereich.zusatz(anforderung) : true
}

function saetze(text: string): string[] {
  return text
    .split(/(?<=[.!?;:])\s+/)
    .map((satz) => satz.trim())
    .filter((satz) => satz.length > 0)
}

function texte(auskunft: Modellauskunft): string[] {
  return [auskunft.antwort, ...auskunft.unsicherheiten, ...auskunft.naechsteSchritte]
}

/**
 * Die Bereiche, über die die Auskunft eine harte Aussage macht.
 *
 * Ein Satz zählt höchstens einmal, mit seinem speziellsten Bereich. Mehrere
 * Sätze können mehrere Bereiche ergeben, und jeder braucht dann seinen eigenen
 * Beleg.
 */
function harteAussagen(auskunft: Modellauskunft): Anforderungsbereich[] {
  const gefunden: Anforderungsbereich[] = []

  for (const text of texte(auskunft)) {
    for (const satz of saetze(text)) {
      if (VORBEHALT.test(satz)) continue
      if (!PFLICHTWORT.test(satz) && !BEFREIUNGSWORT.test(satz)) continue

      const bereich = BEREICHE.find((eintrag) => eintrag.muster.test(satz))
      if (bereich && !gefunden.includes(bereich)) gefunden.push(bereich)
    }
  }

  return gefunden
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

  for (const text of texte(auskunft)) {
    const gewissheit = NICHT_BINDBAR.find((eintrag) => eintrag.muster.test(text))
    if (gewissheit) {
      return {
        ok: false,
        art: 'unbelegte-gewissheit',
        hinweis: `Die Auskunft benutzt „${gewissheit.name}"; diese Formulierung lässt sich keiner geprüften Anforderung zuordnen.`,
      }
    }
  }

  const aussagen = harteAussagen(auskunft)
  if (aussagen.length === 0) return { ok: true }

  // Ab hier steht mindestens eine harte amtliche Aussage im Text. Sie darf nur
  // bestehen bleiben, wenn die Auskunft die amtliche Lage, auf die sie sich
  // stützt, benennt – und wenn keine der benannten Lagen ihr widerspricht.
  const gezeigt = new Set(auskunft.bezuege)
  const benannt = bezuege.filter((bezug) => bezug.art === 'official' && gezeigt.has(bezug.ref))

  const widerspruch = benannt.find((bezug) => !bezug.belegt)
  if (widerspruch) {
    return {
      ok: false,
      art: 'unbelegte-gewissheit',
      hinweis: `Die Auskunft macht eine Aussage über ${aussagen[0].name} und zeigt zugleich auf ${widerspruch.ref}, dessen amtliche Lage nicht geprüft ist.`,
    }
  }

  for (const bereich of aussagen) {
    const traeger = benannt.find(
      (bezug) => bezug.belegt && bezug.anforderung != null && traegt(bereich, bezug.anforderung),
    )

    if (!traeger) {
      return {
        ok: false,
        art: 'unbelegte-gewissheit',
        hinweis: `Die Auskunft macht eine Aussage über ${bereich.name}, ohne eine dazu passende geprüfte amtliche Anforderung zu benennen.`,
      }
    }
  }

  return { ok: true }
}

/**
 * Nur für den Vollständigkeitsnachweis in `pruefung.test.ts`.
 *
 * Er prüft, dass jeder Anforderungstyp der geschlossenen Taxonomie von
 * mindestens einem Bereich getragen werden kann – sonst gäbe es eine amtliche
 * Anforderung, über die niemand etwas sagen dürfte, oder schlimmer: eine, über
 * die jeder alles sagen dürfte.
 */
export const BEREICHE_FUER_TEST = BEREICHE
