// lib/providers/twelve-go/widget/ansicht.ts
//
// Texte und Aktionen. Die Besucherfläche kennt nur den geschlossenen Hinweis.
// Die Prüfhnaht zeigt die Einwilligung, ohne ein Skript einzusetzen.

import type { TwelveGoWidgetZustand } from '@/lib/providers/twelve-go/widget/entscheidung'

export type TwelveGoWidgetAktion = 'ablehnen' | 'einwilligen' | 'schliessen' | 'erneut'

export const TWELVE_GO_WIDGET_AKTIONSTEXT: Record<TwelveGoWidgetAktion, string> = {
  ablehnen: 'Formular nicht laden',
  einwilligen: 'Allgemeines Formular nach Hinweis laden',
  schliessen: 'Formular schliessen',
  erneut: 'Hinweis erneut zeigen',
}

export type TwelveGoWidgetAnsicht = {
  marker: 'consent-blocked' | 'wahl' | 'abgelehnt' | 'wartet' | 'sichtbar' | 'zurueckgezogen' | 'fehler'
  text: string
  aktionen: readonly TwelveGoWidgetAktion[]
  skript: 'keins' | 'allgemein'
}

const GESCHLOSSEN =
  'Das allgemeine Suchformular von 12Go bleibt aus. Es startet hier erst nach einer eigenen Einwilligung und einer getrennten Einbettung. Bis dahin bleiben die Links der Weg. Eine Beispielstrecke wird nicht vorausgefüllt.'

const WAHL =
  'Wenn du zustimmst, lädt dein Browser das allgemeine Suchformular von 12Go. Dabei können Verbindungen, Cookies und lokaler Speicher bei 12Go und weiteren Diensten entstehen. Jetnity überträgt keine Reisedaten. Angebote, Tickets und Zahlung bleiben bei 12Go. Ablehnen lässt das Formular aus; die Links bleiben.'

const ABGELEHNT = 'Das Formular bleibt aus. Die Links zu 12Go bleiben nutzbar.'
const WARTET = 'Das Formular ist noch nicht eingesetzt.'
const SICHTBAR =
  'Das Formular stammt von 12Go. Schliessen entfernt es nur hier. Bereits gesendete Anfragen und gespeicherte Daten bei 12Go löscht das nicht.'
const ZURUECK = 'Das Formular ist hier geschlossen. Was 12Go bereits empfangen oder gespeichert hat, bleibt dort.'
const FEHLER = 'Das Formular konnte nicht angezeigt werden. Die Links bleiben nutzbar.'

export function twelveGoWidgetBesucherAnsicht(): TwelveGoWidgetAnsicht {
  return { marker: 'consent-blocked', text: GESCHLOSSEN, aktionen: [], skript: 'keins' }
}

export function twelveGoWidgetPruefAnsicht(zustand: TwelveGoWidgetZustand, ausfuehrbar: boolean): TwelveGoWidgetAnsicht {
  if (ausfuehrbar !== true) return twelveGoWidgetBesucherAnsicht()
  switch (zustand.phase) {
    case 'wahl':
      return { marker: 'wahl', text: WAHL, aktionen: ['ablehnen', 'einwilligen'], skript: 'keins' }
    case 'abgelehnt':
      return { marker: 'abgelehnt', text: ABGELEHNT, aktionen: ['erneut'], skript: 'keins' }
    case 'wartet':
      return { marker: 'wartet', text: WARTET, aktionen: ['schliessen'], skript: 'keins' }
    case 'sichtbar':
      return {
        marker: 'sichtbar',
        text: SICHTBAR,
        aktionen: ['schliessen'],
        skript: zustand.skript === 'allgemein' ? 'allgemein' : 'keins',
      }
    case 'zurueckgezogen':
      return { marker: 'zurueckgezogen', text: ZURUECK, aktionen: ['erneut'], skript: 'keins' }
    case 'fehler':
      return { marker: 'fehler', text: FEHLER, aktionen: ['erneut'], skript: 'keins' }
    case 'blockiert':
      return twelveGoWidgetBesucherAnsicht()
  }
}
