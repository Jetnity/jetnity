import type { UiSprache } from './ui-sprache'

const de = {
  'adminRead.snapshotPrefix': 'Momentaufnahme vom',
  'adminRead.timezone': 'Zürich',
  'adminRead.snapshotHint': 'Keine automatische Aktualisierung. Status und Zahlen können inzwischen abweichen.',
  'adminRead.refresh': 'Ansicht aktualisieren',
  'adminRead.refreshFailed': 'Die Aktualisierung ist fehlgeschlagen.',
  'adminRead.loadFailed': 'Diese Ansicht konnte nicht geladen werden.',
  'adminRead.retryHint': 'Ein zweiter Versuch kann helfen.',
  'adminRead.staleHint': 'Die angezeigten Daten sind älter.',
  'adminRead.retry': 'Erneut versuchen',
} as const

export type AdminLeseTextSchluessel = keyof typeof de

const en: Record<AdminLeseTextSchluessel, string> = {
  'adminRead.snapshotPrefix': 'Snapshot from',
  'adminRead.timezone': 'Zurich',
  'adminRead.snapshotHint': 'No automatic refresh. Status and figures may have changed since this snapshot.',
  'adminRead.refresh': 'Refresh view',
  'adminRead.refreshFailed': 'The refresh failed.',
  'adminRead.loadFailed': 'This view could not be loaded.',
  'adminRead.retryHint': 'Trying again may help.',
  'adminRead.staleHint': 'The displayed data is older.',
  'adminRead.retry': 'Try again',
}

export const ADMIN_LESE_TEXTE: Readonly<Record<UiSprache, Readonly<Record<AdminLeseTextSchluessel, string>>>> = { de, en }
// Catalog coverage is limited to the framing reached from the translated
// analytics route. Optional stale/retry-action props do not translate callers
// that still use the German default.
export const ADMIN_LESE_SCHLUESSEL = [
  'adminRead.snapshotPrefix', 'adminRead.timezone', 'adminRead.snapshotHint',
  'adminRead.refresh', 'adminRead.loadFailed', 'adminRead.retryHint',
] as const satisfies readonly AdminLeseTextSchluessel[]
