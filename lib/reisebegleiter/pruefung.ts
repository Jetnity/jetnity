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
  | {
      ok: false
      art:
        | 'unbekannter-bezug'
        | 'unbelegte-gewissheit'
        | 'fremdes-amtsvokabular'
        | 'fremde-antwortsprache'
      hinweis: string
    }

// ---------------------------------------------------------------------------
// Die Sprachschranke
// ---------------------------------------------------------------------------
//
// Warum es sie gibt: Die Prüfung unten liest Modalität, Bereich und Vorbehalt
// über deutsche Muster. Eine solche Prüfung ist nur über einer **geschlossenen**
// Sprachfläche vollständig. Solange die Auskunft „in der Sprache der Frage"
// antworten durfte, war die Fläche offen – und „You need a visa." ging durch,
// nicht weil die Regel eine Lücke hatte, sondern weil sie für diesen Satz gar
// nicht zuständig war.
//
// Deshalb ist die Antwortsprache jetzt Teil des Vertrags und nicht des Prompts:
// Der Reisebegleiter antwortet auf **Deutsch**, wie die ganze übrige Jetnity-
// Oberfläche (`COUNTRY_UI_LOCALE`). Das ist keine Produktentscheidung, sondern
// die Rücknahme einer Ausweitung, die dieser Slice selbst eingeführt hatte.
//
// Zwei Schranken sichern das, und jede fängt, was die andere verfehlen kann:
//
//   1. `DEUTSCHE_MARKER` – eine Antwort ohne deutsche Funktionswörter ist keine
//      deutsche Antwort und wird verworfen. Das schliesst **jede** Sprache, die
//      unten nicht aufgezählt ist, einschliesslich der, an die niemand gedacht
//      hat.
//   2. `FREMDES_AMTSVOKABULAR` – amtliche Begriffe der übrigen von Jetnity
//      geführten Sprachen. Sie haben in einer deutschen Antwort keinen
//      legitimen Platz, also kostet ihr Verbot nichts und greift auch dann,
//      wenn Schranke 1 einen gemischtsprachigen Text noch für deutsch hält.
//
// Beide sind Denylists über Wörtern, aber – und das ist der Unterschied zur
// verworfenen Lösung – sie stehen hinter einer geschlossenen Sprachfläche.
// Eine Denylist über einer offenen Fläche ist unvollständig; über einer
// geschlossenen ist sie eine Prüfung.

/**
 * Funktionswörter, die in einem deutschen Satz praktisch unvermeidlich sind.
 *
 * Bewusst Wörter, die sich von ihren englischen Verwandten unterscheiden –
 * `ist` statt `is`, `und` statt `and`, `für`, `eine`, `nicht`.
 */
const DEUTSCHE_MARKER =
  /\b(?:der|die|das|den|dem|des|ein|eine|einen|einem|einer|und|oder|ist|sind|war|waren|nicht|kein|keine|keinen|f[üu]r|mit|von|vom|zum|zur|im|beim|bei|dein|deine|deinen|du|dir|dich|sich|wird|werden|noch|auch|aber|dass|weil|wenn|kann|k[öo]nnte|sollte|hat|haben|habe|als|nach|danach|davor|dabei|deshalb|darum|somit|jedoch|allerdings|bereits|weiterhin|zudem|au[sß]erdem|erneut|wieder|vor|[üu]ber|unter|ohne|schon|nur|sehr|etwa|liegt|liegen|bleibt|bleiben|steht|stehen|gibt|geben|machen|lassen|l[äa]sst|sowie|damit|dazu|daf[üu]r|muss|musst|m[üu]ssen|m[üu]sst|brauchst|braucht|brauchen|ben[öo]tigst|ben[öo]tigt|sein|seine|seinen|ihre|ihren|jede|jeden|jedes|alle|allen|einige|mehrere|dieser|diese|dieses|diesen|dort|hier|dann|zuerst|bitte|gern|mindestens|ausreichend\w*)\b/gi

/** Umlaute und Eszett sind ein eigenes, starkes Signal für deutschen Text. */
const DEUTSCHE_SCHRIFT = /[äöüÄÖÜß]/

/**
 * Amtliches Vokabular der übrigen von Jetnity geführten Sprachen.
 *
 * `COUNTRY_LOCALES` führt neben Deutsch Englisch, Französisch, Italienisch,
 * Spanisch, Portugiesisch und Polnisch. Aufgenommen ist nur, was **kein**
 * deutsches Wort ist: `Visum`, `Pass` und `Visa` stehen deshalb nicht hier,
 * sondern im deutschen Bereichsdetektor weiter unten.
 *
 * Es geht nicht um Vollständigkeit der Sprachen, sondern um den Kern, mit dem
 * sich eine Einreiseanforderung überhaupt behaupten lässt.
 */
const FREMDES_AMTSVOKABULAR: RegExp =
  new RegExp(
    [
      // Visum / Reisegenehmigung
      'visado', 'visti', 'visto', 'wiz[aęy]', 'wizow\\w*',
      // Pass / Ausweis
      'passport\\w*', 'passeport\\w*', 'passaporto', 'pasaporte', 'paszport\\w*',
      'identity\\s+(?:card|document)', "carte\\s+d'identit", 'documento\\s+de\\s+identidad',
      // Impfung / Gesundheit
      'vaccinat\\w*', 'vaccin\\w*', 'vacun\\w*', 'vacina\\w*', 'szczepien\\w*',
      'health\\s+(?:certificate|declaration|requirement)', 'certificat\\s+sanitaire',
      // Versicherung
      'insurance', 'assurance\\s+\\w+', 'assicurazione', 'seguro\\s+de\\s+viaje', 'ubezpieczen\\w*',
      // Einreiseformular / Registrierung
      'entry\\s+form', "formulaire\\s+d'entr", 'modulo\\s+di\\s+ingresso', 'formulario\\s+de\\s+entrada',
      // Rück-/Weiterreise, Nachweise
      'onward\\s+\\w+', 'return\\s+ticket', 'billet\\s+de\\s+retour', 'biglietto\\s+di\\s+ritorno',
      'proof\\s+of\\s+\\w+', 'sufficient\\s+funds', 'financial\\s+means',
      // amtliche Rahmung
      'entry\\s+requirement\\w*', 'immigration\\s+\\w+', 'border\\s+control',
      'is\\s+required', 'are\\s+required', 'not\\s+required', 'you\\s+(?:need|must)\\b',
      'obligatoire', 'obbligatorio', 'obligatorio', 'wymagan\\w*',
    ]
      .map((eintrag) => `\\b(?:${eintrag})`)
      .join('|'),
    'i',
  )

function deutscheSignale(text: string): number {
  const treffer = text.match(DEUTSCHE_MARKER)
  const woerter = treffer ? new Set(treffer.map((wort) => wort.toLowerCase())).size : 0
  return woerter + (DEUTSCHE_SCHRIFT.test(text) ? 1 : 0)
}

/**
 * Ob die Antwort als deutscher Text durchgeht.
 *
 * Kurze Einträge – „Reisedokument ergänzen." – tragen naturgemäss kein
 * Funktionswort. Die Schranke gilt deshalb für die eigentliche Antwort und
 * skaliert mit ihrer Länge, statt Listeneinträge zu bestrafen.
 */
function istDeutscheAntwort(antwort: string): boolean {
  const signale = deutscheSignale(antwort)
  return antwort.length >= 40 ? signale >= 2 : signale >= 1
}

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
    // Eine Aussage über die **Herkunft** der Wahrheit, nicht über eine
    // Anforderung. Ob eine Lage geprüft ist, sagt allein Jetnity über
    // `belegt`; ein Modell, das es behauptet, hebt `unknown` auf `current`.
    // „noch nicht geprüft" und „geprüfte Lage" bleiben unberührt: Dort steht
    // etwas zwischen dem Hilfsverb und dem Partizip, bzw. es ist flektiert.
    name: 'als geprüft ausgegeben',
    muster:
      /\b(?:amtlich|offiziell|beh[öo]rdlich)\s+gepr[üu]ft\b|\bgilt\s+als\s+gepr[üu]ft\b|\b(?:ist|sind|wurde|wurden)\s+(?:amtlich\s+|offiziell\s+|beh[öo]rdlich\s+)?gepr[üu]ft\b/i,
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

  // Die Sprachschranke steht vor allem anderen: Was die deutschen Muster unten
  // nicht lesen können, dürfen sie auch nicht durchlassen.
  for (const text of texte(auskunft)) {
    const fremd = FREMDES_AMTSVOKABULAR.exec(text)
    if (fremd) {
      return {
        ok: false,
        art: 'fremdes-amtsvokabular',
        hinweis: `Die Auskunft benutzt fremdsprachiges amtliches Vokabular („${fremd[0]}"); die Antwortsprache dieses Wegs ist Deutsch.`,
      }
    }
  }

  if (!istDeutscheAntwort(auskunft.antwort)) {
    return {
      ok: false,
      art: 'fremde-antwortsprache',
      hinweis:
        'Die Antwort ist nicht als deutscher Text erkennbar; über einer offenen Sprachfläche ist die amtliche Prüfung unten nicht vollständig.',
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
