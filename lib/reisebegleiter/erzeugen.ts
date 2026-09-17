// lib/reisebegleiter/erzeugen.ts
//
// Der Ablauf einer Assistant-Auskunft, in einer Funktion.
//
//   Frage prüfen
//     → Modellzustand prüfen
//       → Nutzlast aus der akzeptierten Projektion formen (Reissleine)
//         → Eingabegrösse prüfen
//           → Kontingent beanspruchen   (gemeinsam mit den beiden anderen Funktionen)
//             → Modell aufrufen
//               → Nutzung abschliessen
//                 → JSON lesen
//                   → Schema prüfen
//                     → Auskunft gegen den Kontext prüfen
//
// Speichert nichts, ändert nichts, buchte nichts. Was herauskommt, ist ein
// Vorschlag im Browser – und bleibt einer.
//
// ---------------------------------------------------------------------------
// Ein Versuch, kein zweiter
// ---------------------------------------------------------------------------
//
// `lib/reiseaenderung/erzeugen.ts` zieht bei einem Fehlschlag auf Sol einmal
// Terra nach. Das ist dort vertretbar: Eine Änderung ist ein Vorgang, den der
// Nutzer angestossen hat und dessen Ergebnis er sieht. Eine Auskunft ist es
// nicht wert. Ein zweiter Versuch ist ein zweiter bezahlter Aufruf, und diese
// Entscheidung gehört dem Menschen vor dem Bildschirm. Es gibt hier deshalb
// keine Wiederholung, keinen Modellwechsel und kein Ausweichen in eine andere
// semantische Modellfunktion.
//
// Frei von Next, Supabase und `process.env`.

import type { Modellanfrage, Modellergebnis } from '@/lib/modell/aufruf'
import type { Ergebnisklasse, Modellzustand } from '@/lib/modell/konfiguration'
import type { Modellname, Tokennutzung } from '@/lib/modell/preise'
import {
  ASSISTANT_TRUTH_CONTEXT_VERSION,
  type AssistantTruthContext,
} from '@/lib/reisebegleiter/kontext'
import { AMTLICHE_AUSSAGE_TEXT, type AmtlicheAussage } from '@/lib/reisebegleiter/aussagen'
import { begleiternutzlastAus, type BegleiterBezug } from '@/lib/reisebegleiter/nutzlast'
import { auskunftPruefen } from '@/lib/reisebegleiter/pruefung'
import { begleiterregeln } from '@/lib/reisebegleiter/regeln'
import {
  BEGLEITER_FASSUNG,
  BEGLEITER_GRENZEN,
  BEGLEITER_JSON_SCHEMA,
  BEGLEITER_SCHEMA_NAME,
  begleiterfrageSchema,
  modellauskunftSchema,
} from '@/lib/reisebegleiter/schema'

/**
 * Was der Reisebegleiter liefert.
 *
 * `wahrheitsklasse` steht im Wert und nicht nur in der Oberfläche: Eine
 * Auskunft, die irgendwann irgendwo gespeichert oder weitergegeben würde, trägt
 * ihre Klasse mit sich.
 */
export type Begleiterauskunft = {
  fassung: typeof BEGLEITER_FASSUNG
  wahrheitsklasse: 'generated_suggestion'
  kontextFassung: typeof ASSISTANT_TRUTH_CONTEXT_VERSION
  antwort: string
  unsicherheiten: string[]
  naechsteSchritte: string[]
  /** Nur die Bezüge, auf die die Auskunft zeigt – mit dem Zustand aus Jetnity. */
  bezuege: BegleiterBezug[]
  /**
   * Amtliche Lagen, die die Auskunft anspricht – mit dem Satz, den **Jetnity**
   * dazu schreibt. Das Modell hat nur Bezug und Aussageschlüssel gewählt.
   */
  amtlicheHinweise: Array<{
    ref: string
    aussage: AmtlicheAussage
    titel: string
    text: string
  }>
}

export type Begleiterergebnis =
  | { ok: true; auskunft: Begleiterauskunft }
  | { ok: false; meldung: string; klasse: Ergebnisklasse | 'gesperrt' | 'eingabe' }

export type Begleiterwerkzeuge = {
  zustand: Modellzustand
  beanspruchen: (
    modell: Modellname,
  ) => Promise<{ ok: true; id: string } | { ok: false; meldung: string }>
  abschliessen: (
    id: string,
    klasse: Ergebnisklasse,
    nutzung: Tokennutzung | null,
    laufzeitMs: number,
  ) => Promise<void>
  aufrufen: (anfrage: Modellanfrage) => Promise<Modellergebnis>
  heute: string
}

const GESPERRT: Record<string, string> = {
  abgeschaltet:
    'Der Reisebegleiter ist in dieser Umgebung noch nicht freigegeben. Deine Reise bleibt unverändert.',
  'kein-schluessel':
    'Der Reisebegleiter ist in dieser Umgebung noch nicht freigegeben. Deine Reise bleibt unverändert.',
  'unbekanntes-modell':
    'Der Reisebegleiter ist nicht richtig konfiguriert und wurde deshalb nicht ausgeführt.',
}

const KONTEXT_ZU_GROSS =
  'Diese Reise ist für den Reisebegleiter dieser Ausbaustufe zu umfangreich. Er wurde deshalb nicht ausgeführt.'

const KONTEXT_UNZULAESSIG =
  'Der Reisebegleiter wurde nicht ausgeführt, weil der Reisekontext ein unerwartetes Feld enthält.'

const MELDUNGEN: Record<Ergebnisklasse, string> = {
  erfolg: '',
  zeitueberschreitung:
    'Die Antwort hat zu lange gedauert und wurde abgebrochen. Bitte versuche es noch einmal – gern mit einer kürzeren Frage.',
  netz: 'Die Antwort konnte nicht erstellt werden, weil die Verbindung abgebrochen ist. Bitte versuche es in einem Moment erneut.',
  'anbieter-4xx': 'Der Reisebegleiter ist gerade nicht verfügbar. Deine Reise bleibt unverändert.',
  'anbieter-5xx':
    'Der Reisebegleiter ist gerade überlastet. Bitte versuche es in einigen Minuten erneut.',
  verweigert:
    'Auf diese Frage gibt es hier keine Antwort. Bitte formuliere sie als Frage zu dieser Reise.',
  abgeschnitten:
    'Die Antwort ist zu lang geworden und blieb unvollständig. Bitte stelle eine engere Frage.',
  'ungueltige-antwort': 'Die Antwort war nicht verwertbar. Bitte versuche es noch einmal.',
  schema:
    'Die Antwort hielt sich nicht an die Jetnity-Regeln für belegbare Auskünfte und wurde verworfen. Bitte formuliere die Frage anders.',
}

function alsObjekt(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function abgelehnt(
  klasse: Ergebnisklasse | 'gesperrt' | 'eingabe',
  meldung: string,
): Begleiterergebnis {
  return { ok: false, klasse, meldung }
}

export async function begleiterauskunftErzeugen(
  freitext: unknown,
  kontext: AssistantTruthContext,
  werkzeuge: Begleiterwerkzeuge,
): Promise<Begleiterergebnis> {
  const frage = begleiterfrageSchema.safeParse(typeof freitext === 'string' ? freitext : '')
  if (!frage.success) {
    return abgelehnt(
      'eingabe',
      frage.error.issues[0]?.message ?? 'Stelle deine Frage in ein paar Worten.',
    )
  }

  // Vor der Nutzlast und weit vor jedem Aufruf: In einer Umgebung ohne
  // Freigabe entsteht hier gar keine Arbeit.
  if (!werkzeuge.zustand.aktiv) {
    return abgelehnt('gesperrt', GESPERRT[werkzeuge.zustand.grund] ?? GESPERRT.abgeschaltet)
  }

  const nutzlast = begleiternutzlastAus(kontext)
  if (!nutzlast.ok) return abgelehnt('gesperrt', KONTEXT_UNZULAESSIG)

  const systemregeln = begleiterregeln(werkzeuge.heute, nutzlast.nutzlast.kontext)

  // Die Kostenreservierung rechnet mit einer festen Obergrenze der Eingabe
  // (`MODELL_GRENZEN.eingabeTokensSchaetzung`). Der Reisekontext wächst mit der
  // Reise, die Reservierung nicht. Eine Reise oberhalb dieser Grenze bekommt
  // deshalb keine gekürzte Wahrheit, sondern keine Auskunft.
  if (systemregeln.length + frage.data.length > BEGLEITER_GRENZEN.eingabeZeichen) {
    return abgelehnt('gesperrt', KONTEXT_ZU_GROSS)
  }

  const gebucht = await werkzeuge.beanspruchen(werkzeuge.zustand.modell)
  if (!gebucht.ok) return abgelehnt('gesperrt', gebucht.meldung)

  const ergebnis = await werkzeuge.aufrufen({
    modell: werkzeuge.zustand.modell,
    aufwand: werkzeuge.zustand.aufwand,
    systemregeln,
    nutzertext: frage.data,
    schemaName: BEGLEITER_SCHEMA_NAME,
    jsonSchema: BEGLEITER_JSON_SCHEMA,
    ausgabeTokens: BEGLEITER_GRENZEN.ausgabeTokens,
  })

  const beenden = (klasse: Ergebnisklasse) =>
    werkzeuge.abschliessen(gebucht.id, klasse, ergebnis.nutzung, ergebnis.laufzeitMs)

  if (!ergebnis.ok) {
    await beenden(ergebnis.klasse)
    return abgelehnt(ergebnis.klasse, MELDUNGEN[ergebnis.klasse])
  }

  const roh = alsObjekt(ergebnis.text)
  if (roh === null) {
    await beenden('ungueltige-antwort')
    return abgelehnt('ungueltige-antwort', MELDUNGEN['ungueltige-antwort'])
  }

  const geprueft = modellauskunftSchema.safeParse(roh)
  if (!geprueft.success) {
    await beenden('schema')
    return abgelehnt('schema', MELDUNGEN.schema)
  }

  const befund = auskunftPruefen(geprueft.data, nutzlast.nutzlast.bezuege)
  if (!befund.ok) {
    await beenden('schema')
    return abgelehnt('schema', MELDUNGEN.schema)
  }

  await beenden('erfolg')

  const gezeigt = new Set(geprueft.data.bezuege)

  return {
    ok: true,
    auskunft: {
      fassung: BEGLEITER_FASSUNG,
      wahrheitsklasse: 'generated_suggestion',
      kontextFassung: ASSISTANT_TRUTH_CONTEXT_VERSION,
      antwort: geprueft.data.antwort,
      unsicherheiten: geprueft.data.unsicherheiten,
      naechsteSchritte: geprueft.data.naechsteSchritte,
      bezuege: nutzlast.nutzlast.bezuege.filter((bezug) => gezeigt.has(bezug.ref)),
      // Titel und Satz kommen aus Jetnity, nicht aus der Modellantwort.
      amtlicheHinweise: geprueft.data.amtlicheHinweise.map((hinweis) => ({
        ref: hinweis.ref,
        aussage: hinweis.aussage,
        titel:
          nutzlast.nutzlast.bezuege.find((bezug) => bezug.ref === hinweis.ref)?.titel ?? hinweis.ref,
        text: AMTLICHE_AUSSAGE_TEXT[hinweis.aussage],
      })),
    },
  }
}
