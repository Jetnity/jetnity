// lib/reisebegleiter/pruefung.ts
//
// Die zweite Schranke: die Auswahl des Modells gegen den Stand, aus dem sie
// entstand.
//
// ---------------------------------------------------------------------------
// Was hier nicht mehr steht, und warum das der Fix ist
// ---------------------------------------------------------------------------
//
// Sieben Fassungen dieser Datei haben Freitext geprüft: deutsche Modalitäts-
// und Bereichsmuster, mehrsprachige Verbotslisten, eine Spracherkennung, eine
// Erlaubnisliste über dem Wortschatz, zuletzt eine Erlaubnisliste ohne amtliche
// Substantive. Jede wurde widerlegt, und die letzte brauchte kein exotisches
// Beispiel – nur `Du musst ein gültiges Reisedokument haben.` aus vier
// gewöhnlichen, geführten Wörtern.
//
// Der Fehler war jedes Mal derselbe und lag nicht in der Liste: Jede Fassung
// behauptete, **kein aus ihrer Wortmenge bildbarer Satz** sei eine amtliche
// Aussage. Das ist eine Aussage über einen unendlichen Satzraum aus einem
// endlichen Wortschatz. Sprache komponiert; so eine Behauptung ist nicht
// belegbar, nur wiederholt widerlegbar.
//
// Also gibt es keinen Freitext mehr zu prüfen. `lib/reisebegleiter/schema.ts`
// hat kein Textfeld; das Modell wählt Schlüssel aus geschlossenen Katalogen,
// und jeden Satz schreibt Jetnity. Diese Datei prüft damit nur noch **drei
// Dinge**, alle gegen berechnete Wahrheit und keines gegen Sprache:
//
//   1. Zeigt die Auskunft auf Bezüge, die es gibt?
//   2. Steht jeder gewählte Befund im Angebot, das Jetnity für diese Reise
//      berechnet hat? (`lib/reisebegleiter/befunde.ts`)
//   3. Passt jede amtliche Aussage zum geprüften Zustand ihres Bezugs?
//      (`lib/reisebegleiter/aussagen.ts`)
//
// Die früheren Prüfungen auf Preis, Link, Buchungszustand, behauptete Änderung
// und erfundene amtliche Anforderung sind nicht gelockert – sie sind
// gegenstandslos: Es gibt kein Feld, in dem sich eines davon formulieren
// liesse. Was unaussprechbar ist, braucht keine Prüfung.
//
// Frei von Next, Supabase und `process.env`.

import { AMTLICHE_AUSSAGE_TEXT, passt } from '@/lib/reisebegleiter/aussagen'
import {
  befundEintrag,
  befundMarke,
  type Befundangebot,
} from '@/lib/reisebegleiter/befunde'
import type { BegleiterBezug } from '@/lib/reisebegleiter/nutzlast'
import type { Modellauskunft } from '@/lib/reisebegleiter/schema'

export type Pruefbefund =
  | { ok: true }
  | {
      ok: false
      art: 'unbekannter-bezug' | 'unpassende-amtliche-aussage' | 'nicht-angebotener-befund'
      hinweis: string
    }

/**
 * Prüft die Auswahl gegen Bezüge und Angebot.
 *
 * `bezuege` und `angebot` stammen beide aus dem Server – dieselben Listen, die
 * das Modell in der Nutzlast gesehen hat.
 */
export function auskunftPruefen(
  auskunft: Modellauskunft,
  bezuege: readonly BegleiterBezug[],
  angebot: readonly Befundangebot[],
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

  // Der Katalog: Gewählt werden darf nur, was Jetnity vorher als zutreffend
  // berechnet hat. Damit kann die Auskunft auch keine *wahre* Aussage an die
  // falsche Etappe hängen – das Paar muss stimmen, nicht nur der Schlüssel.
  const angeboten = new Set(angebot.map((eintrag) => befundMarke(eintrag.schluessel, eintrag.ref)))

  for (const befund of auskunft.befunde) {
    if (befund.ref !== null && !bekannt.has(befund.ref)) {
      return {
        ok: false,
        art: 'unbekannter-bezug',
        hinweis: `Die Auskunft wählt ${befund.schluessel} zu ${befund.ref}; diesen Bezug gibt es im Kontext nicht.`,
      }
    }

    const eintrag = befundEintrag(befund.schluessel)
    if ((eintrag.bezugsart === null) !== (befund.ref === null)) {
      return {
        ok: false,
        art: 'nicht-angebotener-befund',
        hinweis: `„${eintrag.text}" gehört ${eintrag.bezugsart === null ? 'zur Reise als Ganzes und nimmt keinen Bezug' : `zu einem Bezug der Art ${eintrag.bezugsart}`}.`,
      }
    }

    if (!angeboten.has(befundMarke(befund.schluessel, befund.ref))) {
      return {
        ok: false,
        art: 'nicht-angebotener-befund',
        hinweis: `„${eintrag.text}" trifft auf diese Reise nicht zu${befund.ref === null ? '' : ` (${befund.ref})`}.`,
      }
    }
  }

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

  return { ok: true }
}
