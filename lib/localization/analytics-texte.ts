import type { UiSprache } from './ui-sprache'

const de = {
  'analytics.eyebrow': 'Administration',
  'analytics.title': 'Reiseaktivität',
  'analytics.intro': 'Wie viele Reisen in Jetnity angelegt wurden – als Gesamtzahlen, ohne private Reiseinhalte.',
  'analytics.unavailable': 'Für diese Sitzung sind keine Betriebszahlen verfügbar. Das ist keine Aussage über die Zahl der Reisen.',
  'analytics.metricsTitle': 'Gespeicherte Reisen',
  'analytics.metricsHint': 'Der Zeitraum von 30 Tagen läuft rückwärts ab der Abfrage. Die Auswahl darunter verändert diese Kennzahlen nicht.',
  'analytics.total': 'Reisen insgesamt',
  'analytics.last30Days': 'Neue Reisen · letzte 30 Tage',
  'analytics.accounts30Days': 'Konten mit neuer Reise · letzte 30 Tage',
  'analytics.seriesTitle': 'Neue Reisen je Kalendertag',
  'analytics.period': 'Letzte {days} Tage einschliesslich heute',
  'analytics.rangeLabel': 'Zeitraum der Reiseauswertung',
  'analytics.range': '{days} Tage',
  'analytics.invalidRange': 'Der angefragte Zeitraum ist nicht gültig. Angezeigt werden 30 Tage.',
  'analytics.seriesSummary': 'neue Reisen vom {from} bis {to}',
  'analytics.seriesSummary.one': 'neue Reise vom {from} bis {to}',
  'analytics.chartLabel': 'Neue Reisen je Tag; genaue Werte in der Tabelle Tageswerte',
  'analytics.dayLabel': '{date}: {count} Reisen',
  'analytics.dayLabel.one': '{date}: {count} Reise',
  'analytics.zero': 'In diesem Zeitraum wurden keine neuen Reisen erfasst.',
  'analytics.showDays': 'Tageswerte anzeigen',
  'analytics.daysLabel': 'Tageswerte',
  'analytics.tableCaption': 'Alle gelieferten Tageswerte der Reiseauswertung',
  'analytics.day': 'Tag',
  'analytics.newTrips': 'Neue Reisen',
  'analytics.dayBoundary': 'Die Tagesgrenzen stammen aus der Datenbank. Der heutige Tag ist noch nicht abgeschlossen. Kalendertage und das rollierende 30-Tage-Fenster sind unterschiedliche Zeiträume.',
  'analytics.sourceTitle': 'Quelle und Bedeutung',
  'analytics.source': 'Quelle: gespeicherte Jetnity-Reisen, gelesen über die bestehenden geschützten Betriebsaggregate. Gastreisen, die nur auf einem Gerät liegen, werden nicht mitgezählt. Gelöschte Reisen sind nicht mehr enthalten.',
  'analytics.limits': 'Konten mit neuer Reise sind keine Gesamtzahl registrierter Konten und keine Besucherstatistik. Umsatz, Buchungen und Conversion werden aus diesen Zahlen nicht abgeleitet. Kennzahlen und Tagesreihe werden getrennt abgefragt.',
} as const

export type AnalyticsTextSchluessel = keyof typeof de

const en: Record<AnalyticsTextSchluessel, string> = {
  'analytics.eyebrow': 'Administration',
  'analytics.title': 'Trip activity',
  'analytics.intro': 'How many trips have been created in Jetnity — aggregate figures without private trip details.',
  'analytics.unavailable': 'Operational figures are unavailable for this session. This says nothing about the number of trips.',
  'analytics.metricsTitle': 'Stored trips',
  'analytics.metricsHint': 'The 30-day period runs backwards from the query. The selection below does not change these figures.',
  'analytics.total': 'Total trips',
  'analytics.last30Days': 'New trips · last 30 days',
  'analytics.accounts30Days': 'Accounts with a new trip · last 30 days',
  'analytics.seriesTitle': 'New trips per calendar day',
  'analytics.period': 'Last {days} days, including today',
  'analytics.rangeLabel': 'Trip analytics period',
  'analytics.range': '{days} days',
  'analytics.invalidRange': 'The requested period is invalid. Showing 30 days.',
  'analytics.seriesSummary': 'new trips from {from} to {to}',
  'analytics.seriesSummary.one': 'new trip from {from} to {to}',
  'analytics.chartLabel': 'New trips per day; exact figures in the Daily figures table',
  'analytics.dayLabel': '{date}: {count} trips',
  'analytics.dayLabel.one': '{date}: {count} trip',
  'analytics.zero': 'No new trips were recorded in this period.',
  'analytics.showDays': 'Show daily figures',
  'analytics.daysLabel': 'Daily figures',
  'analytics.tableCaption': 'All supplied daily figures for trip analytics',
  'analytics.day': 'Day',
  'analytics.newTrips': 'New trips',
  'analytics.dayBoundary': 'Day boundaries come from the database. Today is not yet complete. Calendar days and the rolling 30-day window are different periods.',
  'analytics.sourceTitle': 'Source and meaning',
  'analytics.source': 'Source: stored Jetnity trips, read through the existing protected operational aggregates. Guest trips stored only on a device are not counted. Deleted trips are no longer included.',
  'analytics.limits': 'Accounts with a new trip are neither the total number of registered accounts nor visitor statistics. Revenue, bookings and conversion are not derived from these figures. Metrics and the daily series are queried separately.',
}

export const ANALYTICS_TEXTE: Readonly<Record<UiSprache, Readonly<Record<AnalyticsTextSchluessel, string>>>> = { de, en }
export const ANALYTICS_SCHLUESSEL = Object.keys(de) as AnalyticsTextSchluessel[]

/** Plain text substitution only; stored dates/counts never become HTML or new facts. */
export function analyticsText(
  sprache: UiSprache,
  key: AnalyticsTextSchluessel,
  werte: Readonly<Record<string, string | number>> = {},
): string {
  return ANALYTICS_TEXTE[sprache][key].replace(/\{(\w+)\}/g, (platzhalter, name: string) =>
    Object.hasOwn(werte, name) ? String(werte[name]) : platzhalter,
  )
}
