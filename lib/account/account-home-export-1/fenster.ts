// Geladenes Reisefenster der Kontoübersicht und der Weltseite.
//
// `reisenLaden()` liefert höchstens REISEN_LISTE_GRENZE Zeilen, zuletzt
// geändert zuerst. Weniger Zeilen sind die ganze Antwort dieses Lesers.
// Genau die Obergrenze beweist weder, dass das Konto vollständig da ist,
// noch dass weitere Reisen existieren.

import { REISEN_LISTE_GRENZE } from '@/lib/trips/liste-grenze'

export type ReiseFenster =
  | { lage: 'fehler' }
  | { lage: 'vollstaendig'; anzahl: number }
  | { lage: 'grenze'; anzahl: number }

export type NaechsteAnspruch = 'aktiv' | 'kommend' | 'fortsetzen'

export function reiseFensterAus(args: { problem: boolean; anzahl: number }): ReiseFenster {
  if (args.problem) return { lage: 'fehler' }
  if (args.anzahl >= REISEN_LISTE_GRENZE) return { lage: 'grenze', anzahl: args.anzahl }
  return { lage: 'vollstaendig', anzahl: args.anzahl }
}

export function naechsteReiseBezeichnung(lage: NaechsteAnspruch, fenster: ReiseFenster): string {
  if (lage === 'aktiv') return 'Deine Reise läuft gerade.'
  if (fenster.lage === 'grenze') {
    return lage === 'kommend'
      ? 'Nächste Reise in den geladenen Reisen.'
      : 'Zuletzt geänderte offene Reise in den geladenen Reisen.'
  }
  if (lage === 'kommend') return 'Deine nächste Reise.'
  return 'Hier kannst du weiterplanen.'
}

export function fensterHinweis(fenster: ReiseFenster): string {
  if (fenster.lage === 'fehler') {
    return 'Die Reisen dieser Ansicht konnten nicht geladen werden. Weder eine vollständige Liste noch ein Abschneiden ist daraus ablesbar.'
  }
  if (fenster.lage === 'grenze') {
    return `Diese Ansicht enthält die ${fenster.anzahl} zuletzt geänderten Reisen. Ob weitere Reisen gespeichert sind, ist hier nicht geprüft. Geplante Orte und eine nächste Reise gelten nur für diese geladenen Reisen.`
  }
  if (fenster.anzahl === 0) {
    return 'Es sind keine Reisen gespeichert. Diese Ansicht ist nicht abgeschnitten.'
  }
  return `Diese Ansicht hat ${fenster.anzahl} gespeicherte Reisen geladen. Das ist die ganze Antwort dieser Abfrage.`
}

export function weltReichweiteText(fenster: ReiseFenster): string {
  if (fenster.lage === 'fehler') {
    return 'Die Reisen dieser Ansicht konnten nicht geladen werden. Eine Gesamtheit der geplanten Orte ist unbekannt. Unabhängig von Suche und Filter.'
  }
  if (fenster.lage === 'grenze') {
    return `Geplante Orte nur aus den ${fenster.anzahl} zuletzt geänderten Reisen. Ob weitere Reisen existieren, ist nicht geprüft. Besuche folgen der gelesenen Besuchshistorie. Unabhängig von Suche und Filter.`
  }
  return 'Geladene Besuche und die gespeicherten Reisen dieser Abfrage. Unabhängig von Suche und Filter.'
}

export const REISE_SAMMLUNG_HREF = '/reisen' as const
export const REISE_SAMMLUNG_TEXT = 'Zur vollständigen Reiseauswahl'
