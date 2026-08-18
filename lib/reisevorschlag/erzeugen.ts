// lib/reisevorschlag/erzeugen.ts
//
// Der Ablauf eines Reisevorschlags, in einer Funktion.
//
//   Freitext prüfen
//     → Modellzustand prüfen        (Kill Switch, Schlüssel, Modellwahl)
//       → Kontingent beanspruchen   (Datenbank, race-safe, fail closed)
//         → Modell aufrufen         (mit Zeitgrenze und Ausgabegrenze)
//           → Nutzung abschliessen  (Ergebnisklasse, Tokens, Kosten)
//             → Antwort prüfen      (JSON, Schema, fachliche Grenzen)
//               → Vorschlag
//
// Jeder Schritt kann scheitern, und jeder Fehlschlag endet in einem Satz für
// Reisende – nie in einem leeren Vorschlag. Das ist die eigentliche Anforderung:
// Ein Modellfehler darf nicht aussehen wie eine geplante Reise ohne Inhalt.
//
// ---------------------------------------------------------------------------
// Warum alles hereingegeben wird
// ---------------------------------------------------------------------------
//
// Diese Datei nimmt Modellzustand, Kontingent und Aufruf als Argumente. Sie
// öffnet keine Verbindung, liest keine Umgebungsvariable und kennt weder
// Supabase noch `fetch`.
//
// Der Grund ist die Prüfbarkeit dieses Ablaufs. Zeitüberschreitung, HTTP 500,
// erschöpftes Kontingent, abgeschnittene Antwort, kaputtes JSON,
// schemawidriger Inhalt: Das sind die Fälle, die in Produktion zählen, und mit
// echten Verbindungen wäre jeder einzelne nur mit einem bezahlten Aufruf
// erreichbar. Die Verdrahtung steht in `lib/reisevorschlag/aktionen.ts` – dort
// und nur dort.
//
// ---------------------------------------------------------------------------
// Die Reihenfolge von Abschluss und Prüfung
// ---------------------------------------------------------------------------
//
// `abschliessen()` läuft **einmal**, mit der Klasse, die am Ende feststeht. Ein
// Aufruf, dessen Antwort das Schema verletzt, wird als `schema` protokolliert
// und nicht als `erfolg` – er hat dasselbe Geld gekostet, und wer später
// nachsieht, warum die Kosten stiegen, soll den Unterschied sehen.
//
// Frei von Next, Supabase und `process.env`.

import type { Modellanfrage, Modellergebnis } from '@/lib/modell/aufruf'
import type { Ergebnisklasse, Modellzustand } from '@/lib/modell/konfiguration'
import type { Tokennutzung } from '@/lib/modell/preise'
import {
  VORSCHLAG_FASSUNG,
  VORSCHLAG_JSON_SCHEMA,
  VORSCHLAG_SCHEMA_NAME,
  modellvorschlagSchema,
  reisebeschreibungSchema,
  type Reisevorschlag,
} from '@/lib/reisevorschlag/schema'
import { systemregeln } from '@/lib/reisevorschlag/regeln'
import { GRENZEN } from '@/lib/trips/schema'

export type Vorschlagsergebnis =
  | { ok: true; vorschlag: Reisevorschlag }
  /** `klasse` ist für Protokoll und Test, `meldung` für den Bildschirm. */
  | { ok: false; meldung: string; klasse: Ergebnisklasse | 'gesperrt' | 'eingabe' }

/**
 * Was der Ablauf von aussen braucht.
 *
 * Nur Ports, keine Umsetzung: Jeder Eintrag ist in der Server Action eine echte
 * Verbindung und im Test eine Funktion, die den interessanten Fall herstellt.
 */
export type Werkzeuge = {
  zustand: Modellzustand
  /** Bucht den Aufruf, bevor er geschieht. Ein Nein ist ein Nein. */
  beanspruchen: () => Promise<{ ok: true; id: string } | { ok: false; meldung: string }>
  abschliessen: (
    id: string,
    klasse: Ergebnisklasse,
    nutzung: Tokennutzung | null,
    laufzeitMs: number,
  ) => Promise<void>
  aufrufen: (anfrage: Modellanfrage) => Promise<Modellergebnis>
  /** Heutiges Datum als `JJJJ-MM-TT`. Steht in den Systemregeln. */
  heute: string
}

const GESPERRT: Record<string, string> = {
  abgeschaltet:
    'Die intelligente Planung ist in dieser Umgebung noch nicht freigegeben. Deine Reise lässt sich unverändert über das Formular planen.',
  'kein-schluessel':
    'Die intelligente Planung ist in dieser Umgebung noch nicht freigegeben. Deine Reise lässt sich unverändert über das Formular planen.',
  'unbekanntes-modell':
    'Die intelligente Planung ist nicht richtig konfiguriert und wurde deshalb nicht ausgeführt. Deine Reise lässt sich unverändert über das Formular planen.',
}

/**
 * Was ein Fehlschlag auf dem Bildschirm bedeutet.
 *
 * Getrennt nach dem, was der Mensch davon hat: Ob es sich lohnt, es gleich noch
 * einmal zu versuchen, ob der Text zu ändern hilft, oder ob heute nichts mehr
 * geht. Ein „Es ist ein Fehler aufgetreten“ beantwortet keine dieser Fragen.
 */
const MELDUNGEN: Record<Ergebnisklasse, string> = {
  erfolg: '',
  zeitueberschreitung:
    'Der Vorschlag hat zu lange gedauert und wurde abgebrochen. Bitte versuche es noch einmal – gern mit einer etwas kürzeren Beschreibung.',
  netz: 'Der Vorschlag konnte nicht erstellt werden, weil die Verbindung abgebrochen ist. Bitte versuche es in einem Moment erneut.',
  'anbieter-4xx':
    'Die intelligente Planung ist gerade nicht verfügbar. Deine Reise lässt sich unverändert über das Formular planen.',
  'anbieter-5xx':
    'Die intelligente Planung ist gerade überlastet. Bitte versuche es in einigen Minuten erneut.',
  verweigert:
    'Aus dieser Beschreibung liess sich keine Reise erstellen. Beschreibe bitte, wohin es gehen soll, wie lange und mit wie vielen Personen.',
  abgeschnitten:
    'Der Vorschlag ist zu lang geworden und blieb unvollständig. Bitte beschreibe eine kürzere Reise oder weniger Ziele.',
  'ungueltige-antwort':
    'Der Vorschlag war nicht verwertbar. Bitte versuche es noch einmal oder plane die Reise über das Formular.',
  schema:
    'Der Vorschlag passte nicht zu einer Jetnity-Reise und wurde verworfen. Bitte versuche es noch einmal oder plane die Reise über das Formular.',
}

/** Liest die Modellantwort. `null`, wenn schon `JSON.parse` scheitert. */
function alsObjekt(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

/**
 * Erzeugt einen Reisevorschlag aus einer freien Beschreibung.
 *
 * Der Vorschlag wird nicht gespeichert. Er geht in die Vorschau, und erst eine
 * ausdrückliche Freigabe legt ihn ab (`vorschlagUebernehmen()`,
 * `gastreiseAblegen()`).
 */
export async function reisevorschlagErzeugen(
  freitext: unknown,
  werkzeuge: Werkzeuge,
): Promise<Vorschlagsergebnis> {
  const beschreibung = reisebeschreibungSchema.safeParse(typeof freitext === 'string' ? freitext : '')
  if (!beschreibung.success) {
    return {
      ok: false,
      klasse: 'eingabe',
      meldung: beschreibung.error.issues[0]?.message ?? 'Bitte beschreibe deine Reise.',
    }
  }

  // Kill Switch, Schlüssel, Modellwahl – vor dem Kontingent. Ein Aufruf, der
  // nicht stattfindet, soll kein Kontingent verbrauchen.
  if (!werkzeuge.zustand.aktiv) {
    return {
      ok: false,
      klasse: 'gesperrt',
      meldung: GESPERRT[werkzeuge.zustand.grund] ?? GESPERRT.abgeschaltet,
    }
  }

  const gebucht = await werkzeuge.beanspruchen()
  if (!gebucht.ok) return { ok: false, klasse: 'gesperrt', meldung: gebucht.meldung }

  const ergebnis = await werkzeuge.aufrufen({
    modell: werkzeuge.zustand.modell,
    aufwand: werkzeuge.zustand.aufwand,
    systemregeln: systemregeln(werkzeuge.heute),
    nutzertext: beschreibung.data,
    schemaName: VORSCHLAG_SCHEMA_NAME,
    jsonSchema: VORSCHLAG_JSON_SCHEMA,
  })

  // Ab hier ist der Aufruf bezahlt. Jeder Ausgang schliesst die Nutzung ab, und
  // zwar genau einmal – auch der Erfolg.
  const beenden = (klasse: Ergebnisklasse) =>
    werkzeuge.abschliessen(gebucht.id, klasse, ergebnis.nutzung, ergebnis.laufzeitMs)

  if (!ergebnis.ok) {
    await beenden(ergebnis.klasse)
    return { ok: false, klasse: ergebnis.klasse, meldung: MELDUNGEN[ergebnis.klasse] }
  }

  const roh = alsObjekt(ergebnis.text)
  if (roh === null) {
    await beenden('ungueltige-antwort')
    return { ok: false, klasse: 'ungueltige-antwort', meldung: MELDUNGEN['ungueltige-antwort'] }
  }

  // Die zweite Instanz. `strict: true` hat die Form zugesagt, nicht den Inhalt.
  const geprueft = modellvorschlagSchema.safeParse(roh)
  if (!geprueft.success) {
    await beenden('schema')
    return { ok: false, klasse: 'schema', meldung: MELDUNGEN.schema }
  }

  await beenden('erfolg')

  return {
    ok: true,
    vorschlag: {
      ...geprueft.data,
      fassung: VORSCHLAG_FASSUNG,
      // Der Reisewunsch ist der Text des Nutzers, geprüft und bereinigt – nicht
      // das, was das Modell daraus gemacht hat. Er wird beim Übernehmen zu
      // `trips.travel_wish` und ist auf `GRENZEN.reisewunsch` gekürzt, weil die
      // Beschreibung länger sein darf als das gespeicherte Feld.
      reisewunsch: beschreibung.data.slice(0, GRENZEN.reisewunsch) || null,
    },
  }
}
