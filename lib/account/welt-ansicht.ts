// lib/account/welt-ansicht.ts
//
// Die bestätigte Seite der Account-Weltkarte: was der Kontoinhaber selbst als
// besucht bestätigt hat.
//
// Getrennt von `world-map.ts`, und das ist der Punkt. Dort steht, was geplant
// ist; hier, was war. Keine Ableitung führt von der einen Seite zur anderen –
// weder rechnet ein vergangenes Reisedatum einen Besuch aus, noch macht ein
// bestätigter Besuch aus einer Reise eine Vergangenheit.
//
// Drei Lagen, nicht zwei: `leer` heisst „du hast noch nichts bestätigt“,
// `fehler` heisst „deine Historie konnte nicht gelesen werden“. Beides als
// leere Liste zu zeigen wäre eine falsche Aussage über ein Leben.

import {
  besuchAnzeigen,
  besuchKennzahlen,
  besuchteLaender,
  kennzahlText,
  type Besuch,
  type BesuchAnzeige,
  type BesuchKennzahlen,
} from '@/lib/account/besuche'
import type { Problem } from '@/lib/api/datenbank-lesen'

export type BesuchtLage = 'fehler' | 'leer' | 'erfasst'

export const WELT_BESUCHT_LABEL = 'Besucht'

/**
 * Der Satz, der verhindert, dass die Karte mehr behauptet, als sie weiss. Er
 * steht sichtbar an der Karte, nicht nur in der Dokumentation.
 */
export const WELT_BESUCHT_TEXT =
  'Besucht ist nur, was du hier ausdrücklich bestätigt hast – auch Reisen von vor Jetnity. Ein vergangenes Datum, eine archivierte Reise oder ein Reise-Status gelten nicht als Besuch.'

/**
 * Kurzform ohne Zahl. Eine „0“ wäre hier ein Spielstand, keine Auskunft: wer
 * noch nichts eingetragen hat, war deswegen nirgends gewesen.
 */
export const WELT_BESUCHT_LEER_KURZ = 'Noch keine Besuche bestätigt'

export const WELT_BESUCHT_FEHLER_TEXT =
  'Deine bestätigten Besuche konnten nicht gelesen werden. Die Karte zeigt deshalb keinen Besuchsstand – nicht, dass keiner besteht.'

/**
 * Kurzform des Ausfalls. Sie steht dort, wo sonst die Zahl stünde, und sagt
 * das Gegenteil einer Zahl: dass gerade keine bekannt ist. Der ganze Satz
 * steht daneben im Hinweis und muss hier nicht ein zweites Mal stehen.
 */
export const WELT_BESUCHT_FEHLER_KURZ = 'Gerade nicht lesbar'

export type WeltBesuchtAnsicht = {
  lage: BesuchtLage
  label: string
  /** `N Länder · M Orte`, der Leertext oder der Fehlertext. Nie eine Null. */
  kurz: string
  text: string
  fehlerText: string | null
  kennzahlen: BesuchKennzahlen
  /** ISO-3166-1-alpha-2 der bestätigt besuchten Länder. Basis der Füllung. */
  laenderCodes: readonly string[]
  eintraege: readonly BesuchAnzeige[]
  /** Besuche ohne gespeicherten Ländercode, als lesbarer Hinweis. */
  ohneLandHinweis: string | null
}

const KEINE_KENNZAHLEN: BesuchKennzahlen = {
  laender: 0,
  orte: 0,
  ereignisse: 0,
  ohneLand: 0,
}

function ohneLandHinweis(anzahl: number): string | null {
  if (anzahl === 0) return null
  if (anzahl === 1) {
    return '1 Besuch hat keinen gespeicherten Ländercode und zählt deshalb nicht als Land.'
  }
  return `${anzahl} Besuche haben keinen gespeicherten Ländercode und zählen deshalb nicht als Land.`
}

export function weltBesuchtAbleiten({
  besuche,
  problem,
}: {
  besuche: readonly Besuch[]
  problem: Problem | null
}): WeltBesuchtAnsicht {
  if (problem) {
    return {
      lage: 'fehler',
      label: WELT_BESUCHT_LABEL,
      kurz: WELT_BESUCHT_FEHLER_KURZ,
      text: WELT_BESUCHT_TEXT,
      fehlerText: WELT_BESUCHT_FEHLER_TEXT,
      kennzahlen: KEINE_KENNZAHLEN,
      laenderCodes: [],
      eintraege: [],
      ohneLandHinweis: null,
    }
  }

  if (besuche.length === 0) {
    return {
      lage: 'leer',
      label: WELT_BESUCHT_LABEL,
      kurz: WELT_BESUCHT_LEER_KURZ,
      text: WELT_BESUCHT_TEXT,
      fehlerText: null,
      kennzahlen: KEINE_KENNZAHLEN,
      laenderCodes: [],
      eintraege: [],
      ohneLandHinweis: null,
    }
  }

  const kennzahlen = besuchKennzahlen(besuche)

  return {
    lage: 'erfasst',
    label: WELT_BESUCHT_LABEL,
    kurz: kennzahlText(kennzahlen.laender, kennzahlen.orte),
    text: WELT_BESUCHT_TEXT,
    fehlerText: null,
    kennzahlen,
    laenderCodes: besuchteLaender(besuche),
    eintraege: besuchAnzeigen(besuche),
    ohneLandHinweis: ohneLandHinweis(kennzahlen.ohneLand),
  }
}
