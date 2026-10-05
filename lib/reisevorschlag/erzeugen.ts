// lib/reisevorschlag/erzeugen.ts
//
// Der Ablauf eines Reisevorschlags, in einer Funktion.
//
//   Freitext prüfen
//     → Modellzustand prüfen        (Kill Switch, Schlüssel, geroutetes Modell)
//       → Kontingent beanspruchen   (Datenbank, race-safe, fail closed)
//         → Modell aufrufen         (Sol 120 s, Terra/Luna 90 s)
//           → Nutzung abschliessen  (Ergebnisklasse, Tokens, Kosten)
//             → Antwort prüfen      (JSON, Schema, fachliche Grenzen)
//               → bei Sol-Fehler genau ein Terra-Versuch
//                 → harte Vorgaben prüfen, höchstens eine Korrektur
//                   → Vorschlag, offene Verletzungen als warnungen
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
// `abschliessen()` läuft **einmal je Aufruf**, mit der Klasse, die für diesen
// Aufruf feststeht. Ein Aufruf, dessen Antwort das Schema verletzt, wird als
// `schema` protokolliert und nicht als `erfolg`. Ein Sol-Fehler darf genau
// einen Terra-Versuch auslösen – keine Schleife. Eine klare Vorgabeverletzung
// darf genau eine Korrektur auslösen, danach bleiben offene Punkte sichtbar.
//
// Frei von Next, Supabase und `process.env`.

import type { Modellanfrage, Modellergebnis } from '@/lib/modell/aufruf'
import type { Denkaufwand, Ergebnisklasse, Modellzustand } from '@/lib/modell/konfiguration'
import type { Modellname, Tokennutzung } from '@/lib/modell/preise'
import {
  VORSCHLAG_FASSUNG,
  VORSCHLAG_JSON_SCHEMA,
  VORSCHLAG_SCHEMA_NAME,
  modellvorschlagSchema,
  reisebeschreibungSchema,
  type Reisevorschlag,
} from '@/lib/reisevorschlag/schema'
import { systemregeln } from '@/lib/reisevorschlag/regeln'
import { korrekturtext, vorgabenAus, vorgabenPruefen } from '@/lib/reisevorschlag/vorgaben'
import { GRENZEN } from '@/lib/trips/schema'

export type Vorschlagsergebnis =
  | { ok: true; vorschlag: Reisevorschlag; warnungen: string[] }
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

const FALLBACK_KLASSEN = [
  'zeitueberschreitung',
  'netz',
  'anbieter-5xx',
  'abgeschnitten',
] as const satisfies readonly Ergebnisklasse[]

function terraNachziehen(
  klasse: Ergebnisklasse | 'gesperrt' | 'eingabe',
): klasse is (typeof FALLBACK_KLASSEN)[number] {
  return (FALLBACK_KLASSEN as readonly string[]).includes(klasse)
}

function alsVorschlag(
  roh: unknown,
  reisewunsch: string,
): Reisevorschlag | null {
  const geprueft = modellvorschlagSchema.safeParse(roh)
  if (!geprueft.success) return null
  return {
    ...geprueft.data,
    fassung: VORSCHLAG_FASSUNG,
    reisewunsch: reisewunsch.slice(0, GRENZEN.reisewunsch) || null,
  }
}

async function einmalPlanen(
  modell: Modellname,
  aufwand: Denkaufwand,
  nutzertext: string,
  werkzeuge: Werkzeuge,
): Promise<
  | { ok: true; vorschlag: Reisevorschlag }
  | { ok: false; klasse: Ergebnisklasse | 'gesperrt'; meldung: string }
> {
  const gebucht = await werkzeuge.beanspruchen(modell)
  if (!gebucht.ok) return { ok: false, klasse: 'gesperrt', meldung: gebucht.meldung }

  const ergebnis = await werkzeuge.aufrufen({
    modell,
    aufwand,
    systemregeln: systemregeln(werkzeuge.heute),
    nutzertext,
    schemaName: VORSCHLAG_SCHEMA_NAME,
    jsonSchema: VORSCHLAG_JSON_SCHEMA,
  })

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

  const vorschlag = alsVorschlag(roh, nutzertext)
  if (!vorschlag) {
    await beenden('schema')
    return { ok: false, klasse: 'schema', meldung: MELDUNGEN.schema }
  }

  await beenden('erfolg')
  return { ok: true, vorschlag }
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

  let modell = werkzeuge.zustand.modell
  const aufwand = werkzeuge.zustand.aufwand

  let geplant = await einmalPlanen(modell, aufwand, beschreibung.data, werkzeuge)

  // Ein Sol-Fehler bekommt genau einen Terra-Versuch. Keine Schleife.
  if (!geplant.ok && terraNachziehen(geplant.klasse) && modell === 'gpt-5.6-sol') {
    const fallback = await einmalPlanen('gpt-5.6-terra', aufwand, beschreibung.data, werkzeuge)
    if (fallback.ok) {
      geplant = fallback
      modell = 'gpt-5.6-terra'
    } else {
      return fallback
    }
  }

  if (!geplant.ok) return geplant

  const vorgaben = vorgabenAus(beschreibung.data)
  const verstoesse = vorgabenPruefen(geplant.vorschlag, vorgaben)
  if (verstoesse.length === 0) {
    return { ok: true, vorschlag: geplant.vorschlag, warnungen: [] }
  }

  const korrektur = await einmalPlanen(
    modell,
    aufwand,
    korrekturtext(beschreibung.data, verstoesse),
    werkzeuge,
  )
  if (!korrektur.ok) {
    return {
      ok: true,
      vorschlag: geplant.vorschlag,
      warnungen: verstoesse.map((verstoss) => verstoss.meldung),
    }
  }

  const erneut = vorgabenPruefen(korrektur.vorschlag, vorgaben)
  return {
    ok: true,
    vorschlag: korrektur.vorschlag,
    warnungen: erneut.map((verstoss) => verstoss.meldung),
  }
}
