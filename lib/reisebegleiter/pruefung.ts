// lib/reisebegleiter/pruefung.ts
//
// Die zweite Schranke: die Auskunft gegen den Kontext, aus dem sie entstand.
//
// ---------------------------------------------------------------------------
// Was sieben Runden gekostet haben und was daraus geworden ist
// ---------------------------------------------------------------------------
//
// Sechs Fassungen haben versucht, erfundene amtliche Wahrheit in der Prosa des
// Modells zu **erkennen**: deutsche Modalitäts- und Bereichsmuster, dann
// mehrsprachige Verbotslisten, dann eine Spracherkennung, dann eine
// Erlaubnisliste über dem Wortschatz. Jede war widerlegbar, und am Ende wurden
// die Gegenbeispiele beliebig – `Ein Visum ist notwendig.` aus lauter
// erlaubten Wörtern, `V I S U M ist P F L I C H T.` aus lauter erlaubten
// Buchstaben, ein Etappenname `No visa is required`, der den Wortschatz selbst
// erweiterte.
//
// Der Fehler war nicht die jeweilige Liste, sondern die Annahme, man könne
// Prosa prüfen, in der amtliche Aussagen überhaupt vorkommen dürfen. Deshalb
// sind die beiden Sorten Inhalt jetzt **getrennte Kanäle**:
//
//   · **Prosa** – `antwort`, `unsicherheiten`, `naechsteSchritte`. Ihr
//     Wortschatz (`lib/reisebegleiter/wortschatz.ts`) enthält **kein**
//     amtliches Vokabular und wird von keiner Eingabe erweitert. Ohne
//     Gegenstand gibt es keine amtliche Aussage.
//   · **Amtliche Lagen** – `amtlicheHinweise`. Das Modell wählt Bezug und
//     Aussageschlüssel aus einer geschlossenen Liste; den Satz schreibt Jetnity
//     (`lib/reisebegleiter/aussagen.ts`), und die Aussage muss zum geprüften
//     Zustand des Bezugs passen.
//
// Damit ist „kann Modellprosa eine amtliche Anforderung erfinden?" keine Frage
// über Texte mehr, sondern eine über Typen – und die Antwort steht im
// Wortschatz, nicht in einem Muster.
//
// ---------------------------------------------------------------------------
// Warum die Bereichsmuster hier stehen bleiben
// ---------------------------------------------------------------------------
//
// `BEREICHE` ist **keine Laufzeitschranke mehr**. Es ist die Definition dessen,
// was als amtliche Anforderung gilt – die geschlossene
// `OFFICIAL_REQUIREMENT_TYPES`-Taxonomie in Wortform. Sein einziger Leser ist
// `lib/reisebegleiter/wortschatz.test.ts`: Dort wird jeder geführte Wortstamm
// und jedes Paar daraus gegen diese Muster geprüft. Trifft eines, ist die
// Zusicherung gebrochen, und der Test schlägt an.
//
// Eine Prüfung, die zur Laufzeit nie greifen kann, hier stehen zu lassen, wäre
// das Gegenteil: Sie hat zweimal den Eindruck erzeugt, Prosa werde semantisch
// geprüft, und genau dieser Eindruck war der Befund. Die Muster tragen deshalb
// jetzt ihre wahre Rolle – Spezifikation, nicht Kontrolle.
//
// Nicht erkannt werden Verfügbarkeitsbehauptungen in freier Formulierung –
// dieselbe eingestandene Grenze wie in DECISIONS.md ADR-0054. Preis und Link
// fängt `lib/reisebegleiter/schema.ts`.
//
// Frei von Next, Supabase und `process.env`.

import { AMTLICHE_AUSSAGE_TEXT, passt } from '@/lib/reisebegleiter/aussagen'
import type { BegleiterBezug, OfficialAnforderung } from '@/lib/reisebegleiter/nutzlast'
import type { Modellauskunft } from '@/lib/reisebegleiter/schema'
import { unbelegteWoerter } from '@/lib/reisebegleiter/wortschatz'
import type { OfficialRequirementType } from '@/types/trips'

export type Pruefbefund =
  | { ok: true }
  | {
      ok: false
      art:
        | 'unbekannter-bezug'
        | 'unpassende-amtliche-aussage'
        | 'unbelegtes-wort'
        | 'unmoeglicher-anspruch'
      hinweis: string
    }

/**
 * Ansprüche, die der Kontext nie decken kann.
 *
 * Buchungszustand steht nicht in der akzeptierten Projektion, und eine
 * Auskunft, die eine Reiseänderung im Perfekt beschreibt, behauptet eine
 * Persistenz, die dieser Weg nicht hat. Beides ist mit geführten Wörtern
 * formulierbar und braucht deshalb eine eigene Prüfung.
 */
const UNMOEGLICHE_ANSPRUECHE: ReadonlyArray<{ name: string; muster: RegExp }> = [
  {
    name: 'ausgeführte Änderung',
    muster:
      /\bich\s+hab(?:e)?\b[^.!?]{0,80}\b(?:ge[äa]ndert|hinzugef[üu]gt|entfernt|gespeichert|eingeplant|verschoben)\b/i,
  },
  {
    name: 'gespeicherte Änderung',
    muster: /\b(?:wurde|wurden|ist|sind)\s+(?:bereits\s+)?gespeichert\b/i,
  },
]

// ---------------------------------------------------------------------------
// Spezifikation: was als amtliche Anforderung gilt
// ---------------------------------------------------------------------------

type Anforderungsbereich = {
  name: string
  muster: RegExp
  traegerTypen: ReadonlyArray<OfficialRequirementType>
  zusatz?: (anforderung: OfficialAnforderung) => boolean
}

/**
 * Die amtlichen Anforderungsbereiche in Wortform, geordnet von speziell nach
 * allgemein.
 *
 * Kein Laufzeitpfad liest diese Muster. Sie sind der Prüfstein für den
 * Wortschatz: Kein geführtes Wort und kein Paar daraus darf einen dieser
 * Bereiche treffen, denn dann könnte Prosa eine amtliche Anforderung benennen.
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
    muster:
      /\bpassg[üu]ltigkeit\w*|\b(?:reise)?pass\w*\b[^.!?;:]{0,60}\bg[üu]ltig\w*|\bg[üu]ltig\w*[^.!?;:]{0,60}\b(?:reise)?pass\w*\b/i,
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
    muster:
      /\bgesundheit\w*|\battest\w*|\b[äa]rztlich\w*|\bquarant[äa]ne\w*|\btest(?:pflicht|nachweis)\w*/i,
    traegerTypen: ['health', 'health_document', 'vaccination'],
  },
  {
    name: 'Einreiseformular',
    muster:
      /\beinreise(?:formular|anmeldung|karte|registrierung|erkl[äa]rung)\w*|\bregistrierungsformular\w*/i,
    traegerTypen: ['entry_form'],
  },
  {
    name: 'Versicherung',
    muster: /versicher\w*/i,
    traegerTypen: ['insurance'],
  },
  {
    name: 'Rück- oder Weiterreise',
    muster:
      /\br[üu]ckflug\w*|\br[üu]ckreise\w*|\br[üu]ckfahrkarte\w*|\bweiterreise\w*|\bweiterflug\w*|\bonward\b/i,
    traegerTypen: ['onward_or_return_ticket'],
  },
  {
    name: 'Buchungs- oder Reisenachweis',
    muster:
      /\bbuchungsnachweis\w*|\breisenachweis\w*|\bunterkunftsnachweis\w*|\bhotelnachweis\w*|\breisebest[äa]tigung\w*/i,
    traegerTypen: ['booking_or_travel_document'],
  },
  {
    name: 'finanzielle Mittel',
    muster:
      /\bfinanzielle\w*\s+mittel\w*|\bfinanzmittel\w*|\bmindestbetrag\w*|\bausreichende\w*\s+mittel\w*|\bbargeld\w*|\bzahlungsf[äa]higkeit\w*/i,
    traegerTypen: ['financial_means'],
  },
  {
    name: 'sonstige Einreiseanforderung',
    muster:
      /\beinreis\w*|\bamtlich\w*|\bbeh[öo]rd\w*|\boffiziell\w*|\bvorschrift\w*|\bbestimmung\w*|\bgesetzlich\w*|\bgrenzkontroll\w*|\bzoll\w*|\berforderlich\b|\bvorgeschrieben\b|pflicht/i,
    traegerTypen: ['other_entry_requirement'],
  },
]

/** Nur für den Nachweis in `wortschatz.test.ts`. Kein Laufzeitpfad liest das. */
export const BEREICHE_FUER_TEST = BEREICHE

// ---------------------------------------------------------------------------
// Prüfung
// ---------------------------------------------------------------------------

/**
 * Jedes modellgeschriebene Feld mit seinem Namen.
 *
 * Alle drei sind gleich gefährlich: Eine Behauptung wirkt in einer Liste
 * genauso wie in einem Satz. Frühere Fassungen prüften die Sprache nur an
 * `antwort`; das war ein eigener Umgehungsweg.
 */
function felder(auskunft: Modellauskunft): Array<[string, string]> {
  return [
    ['antwort', auskunft.antwort],
    ...auskunft.unsicherheiten.map((text, stelle): [string, string] => [
      `unsicherheiten[${stelle}]`,
      text,
    ]),
    ...auskunft.naechsteSchritte.map((text, stelle): [string, string] => [
      `naechsteSchritte[${stelle}]`,
      text,
    ]),
  ]
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

  // Der typisierte Kanal: Bezug muss eine amtliche Lage sein, und die gewählte
  // Aussage muss zu ihrem geprüften Zustand passen.
  for (const hinweis of auskunft.amtlicheHinweise) {
    const bezug = bezuege.find((eintrag) => eintrag.ref === hinweis.ref)
    if (!bezug || bezug.art !== 'official' || bezug.anforderung == null) {
      return {
        ok: false,
        art: 'unbekannter-bezug',
        hinweis: `Die Auskunft gibt eine amtliche Aussage zu ${hinweis.ref} ab; das ist keine amtliche Lage im Kontext.`,
      }
    }
    if (!passt(hinweis.aussage, bezug.anforderung, bezug.belegt)) {
      return {
        ok: false,
        art: 'unpassende-amtliche-aussage',
        hinweis: `Die Aussage „${AMTLICHE_AUSSAGE_TEXT[hinweis.aussage]}" passt nicht zum geprüften Zustand von ${hinweis.ref}.`,
      }
    }
  }

  // Die Prosa: jedes Wort geführt. Der Wortschatz kennt kein amtliches
  // Vokabular und wird von keiner Eingabe erweitert.
  for (const [feld, text] of felder(auskunft)) {
    const unbelegt = unbelegteWoerter(text)
    if (unbelegt.length > 0) {
      return {
        ok: false,
        art: 'unbelegtes-wort',
        hinweis: `Das Feld ${feld} benutzt Wörter, die Jetnity nicht führt: ${unbelegt.slice(0, 5).join(', ')}.`,
      }
    }
  }

  for (const [, text] of felder(auskunft)) {
    const anspruch = UNMOEGLICHE_ANSPRUECHE.find((eintrag) => eintrag.muster.test(text))
    if (anspruch) {
      return {
        ok: false,
        art: 'unmoeglicher-anspruch',
        hinweis: `Die Auskunft behauptet ${anspruch.name}; dafür trägt der Kontext keine Wahrheit.`,
      }
    }
  }

  return { ok: true }
}
