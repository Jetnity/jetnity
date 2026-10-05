// lib/reiseaenderung/erzeugen.ts
//
// Der Ablauf einer Reiseänderung, in einer Funktion.
//
//   Änderungswunsch prüfen
//     → Modellzustand prüfen
//       → Kontingent beanspruchen   (gemeinsam mit reisevorschlag)
//         → Modell aufrufen
//           → Nutzung abschliessen
//             → Operationen prüfen
//               → auf die vertrauenswürdige Reise anwenden
//                 → Ergebnis erneut als Reise prüfen
//
// Speichert nichts. Die Vorschau lebt im Browser, bis jemand übernimmt.
//
// Frei von Next, Supabase und `process.env`.

import type { Modellanfrage, Modellergebnis } from '@/lib/modell/aufruf'
import type { Denkaufwand, Ergebnisklasse, Modellzustand } from '@/lib/modell/konfiguration'
import type { Modellname, Tokennutzung } from '@/lib/modell/preise'
import { operationenAnwenden, type KennungFn } from '@/lib/reiseaenderung/anwenden'
import { reiseDiff, type DiffEintrag } from '@/lib/reiseaenderung/diff'
import { aenderungsregeln } from '@/lib/reiseaenderung/regeln'
import {
  AENDERUNG_FASSUNG,
  AENDERUNG_JSON_SCHEMA,
  AENDERUNG_SCHEMA_NAME,
  aenderungstextSchema,
  modellaenderungSchema,
  type Reiseaenderung,
} from '@/lib/reiseaenderung/schema'
import { reiseFuerModell } from '@/lib/reiseaenderung/snapshot'
import type { Reisegraph } from '@/types/trips'

export type Aenderungsvorschau = {
  aenderung: Reiseaenderung
  vorher: Reisegraph
  nachher: Reisegraph
  diff: DiffEintrag[]
  mutationId: string
  basisRevision: number
}

export type Aenderungsergebnis =
  | { ok: true; vorschau: Aenderungsvorschau }
  | { ok: false; meldung: string; klasse: Ergebnisklasse | 'gesperrt' | 'eingabe' }

export type Aenderungswerkzeuge = {
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
  kennung: KennungFn
  mutationId: string
}

const GESPERRT: Record<string, string> = {
  abgeschaltet:
    'Die intelligente Planung ist in dieser Umgebung noch nicht freigegeben. Die Reise bleibt unverändert.',
  'kein-schluessel':
    'Die intelligente Planung ist in dieser Umgebung noch nicht freigegeben. Die Reise bleibt unverändert.',
  'unbekanntes-modell':
    'Die intelligente Planung ist nicht richtig konfiguriert und wurde deshalb nicht ausgeführt.',
}

const MELDUNGEN: Record<Ergebnisklasse, string> = {
  erfolg: '',
  zeitueberschreitung:
    'Die Änderung hat zu lange gedauert und wurde abgebrochen. Bitte versuche es noch einmal – gern mit einem kürzeren Wunsch.',
  netz: 'Die Änderung konnte nicht erstellt werden, weil die Verbindung abgebrochen ist. Bitte versuche es in einem Moment erneut.',
  'anbieter-4xx':
    'Die intelligente Planung ist gerade nicht verfügbar. Deine Reise bleibt unverändert.',
  'anbieter-5xx':
    'Die intelligente Planung ist gerade überlastet. Bitte versuche es in einigen Minuten erneut.',
  verweigert:
    'Aus diesem Wunsch liess sich keine Änderung ableiten. Beschreibe bitte konkreter, was sich ändern soll.',
  abgeschnitten:
    'Die Änderung ist zu umfangreich geworden und blieb unvollständig. Bitte beschreibe einen kleineren Schritt.',
  'ungueltige-antwort':
    'Die Änderung war nicht verwertbar. Bitte versuche es noch einmal.',
  schema:
    'Die Änderung passte nicht zur bestehenden Reise und wurde verworfen. Bitte formuliere den Wunsch anders.',
}

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

async function einmalAendern(
  modell: Modellname,
  aufwand: Denkaufwand,
  nutzertext: string,
  reise: Reisegraph,
  werkzeuge: Aenderungswerkzeuge,
): Promise<
  | { ok: true; aenderung: Reiseaenderung }
  | { ok: false; klasse: Ergebnisklasse | 'gesperrt'; meldung: string }
> {
  const gebucht = await werkzeuge.beanspruchen(modell)
  if (!gebucht.ok) return { ok: false, klasse: 'gesperrt', meldung: gebucht.meldung }

  const ergebnis = await werkzeuge.aufrufen({
    modell,
    aufwand,
    systemregeln: aenderungsregeln(werkzeuge.heute, reiseFuerModell(reise)),
    nutzertext,
    schemaName: AENDERUNG_SCHEMA_NAME,
    jsonSchema: AENDERUNG_JSON_SCHEMA,
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

  const geprueft = modellaenderungSchema.safeParse(roh)
  if (!geprueft.success) {
    await beenden('schema')
    return { ok: false, klasse: 'schema', meldung: MELDUNGEN.schema }
  }

  await beenden('erfolg')
  return {
    ok: true,
    aenderung: { ...geprueft.data, fassung: AENDERUNG_FASSUNG },
  }
}

export async function reiseaenderungErzeugen(
  freitext: unknown,
  reise: Reisegraph,
  werkzeuge: Aenderungswerkzeuge,
): Promise<Aenderungsergebnis> {
  const wunsch = aenderungstextSchema.safeParse(typeof freitext === 'string' ? freitext : '')
  if (!wunsch.success) {
    return {
      ok: false,
      klasse: 'eingabe',
      meldung: wunsch.error.issues[0]?.message ?? 'Bitte beschreibe, was sich ändern soll.',
    }
  }

  if (!werkzeuge.zustand.aktiv) {
    return {
      ok: false,
      klasse: 'gesperrt',
      meldung: GESPERRT[werkzeuge.zustand.grund] ?? GESPERRT.abgeschaltet,
    }
  }

  let modell = werkzeuge.zustand.modell
  const aufwand = werkzeuge.zustand.aufwand

  let geplant = await einmalAendern(modell, aufwand, wunsch.data, reise, werkzeuge)

  if (!geplant.ok && terraNachziehen(geplant.klasse) && modell === 'gpt-5.6-sol') {
    const fallback = await einmalAendern('gpt-5.6-terra', aufwand, wunsch.data, reise, werkzeuge)
    if (fallback.ok) {
      geplant = fallback
      modell = 'gpt-5.6-terra'
    } else {
      return fallback
    }
  }

  if (!geplant.ok) return geplant

  const angewandt = operationenAnwenden(reise, geplant.aenderung.operationen, werkzeuge.kennung)
  if (!angewandt.ok) {
    return { ok: false, klasse: 'schema', meldung: angewandt.fehler.meldung }
  }

  const diff = reiseDiff(reise, angewandt.reise)
  if (diff.length === 0) {
    return {
      ok: false,
      klasse: 'schema',
      meldung: 'Aus diesem Wunsch ergibt sich keine Änderung an der Reise.',
    }
  }

  return {
    ok: true,
    vorschau: {
      aenderung: geplant.aenderung,
      vorher: reise,
      nachher: angewandt.reise,
      diff,
      mutationId: werkzeuge.mutationId,
      basisRevision: reise.revision,
    },
  }
}
