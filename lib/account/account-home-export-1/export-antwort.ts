// Prüfung der Export-Antwort im Browser, bevor eine Datei übergeben wird.
//
// Dieselben öffentlichen Vertragswerte wie `lib/account/datenexport.ts`.
// Diese Datei importiert das Servermodul nicht, damit der Client es nicht
// in den Browser zieht.

export const EXPORT_SCHEMA_VERSION = 'jetnity.account-export.v1' as const
export const EXPORT_VOLLSTAENDIGKEIT = 'jetnity-owned-account-travel-rows' as const
export const EXPORT_TABELLEN = [
  'profiles',
  'account_travellers',
  'account_traveller_citizenships',
  'account_traveller_documents',
  'account_visits',
  'trips',
  'trip_stages',
  'trip_days',
  'trip_items',
  'trip_travellers',
  'trip_traveller_citizenships',
  'trip_traveller_documents',
  'trip_readiness_items',
] as const

export type ExportTabelle = (typeof EXPORT_TABELLEN)[number]

export function exportDateiName(generatedAt: string): string {
  const tag = generatedAt.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tag)) return 'jetnity-account-export.json'
  return `jetnity-account-export-${tag}.json`
}

export function exportDokumentGueltig(wert: unknown): boolean {
  if (!wert || typeof wert !== 'object') return false
  const dokument = wert as Record<string, unknown>
  if (dokument.schemaVersion !== EXPORT_SCHEMA_VERSION) return false
  if (typeof dokument.generatedAt !== 'string' || dokument.generatedAt.length === 0) return false
  if (!dokument.scope || typeof dokument.scope !== 'object') return false
  const scope = dokument.scope as Record<string, unknown>
  if (scope.owner !== 'authenticated-session') return false
  if (scope.completeness !== EXPORT_VOLLSTAENDIGKEIT) return false
  if (!Array.isArray(scope.tables) || scope.tables.length !== EXPORT_TABELLEN.length) return false
  for (let index = 0; index < EXPORT_TABELLEN.length; index += 1) {
    if (scope.tables[index] !== EXPORT_TABELLEN[index]) return false
  }
  if (!dokument.data || typeof dokument.data !== 'object') return false
  const data = dokument.data as Record<string, unknown>
  const schluessel = Object.keys(data)
  if (schluessel.length !== EXPORT_TABELLEN.length) return false
  for (const tabelle of EXPORT_TABELLEN) {
    if (!Array.isArray(data[tabelle])) return false
  }
  return true
}

export function exportGeneratedAt(wert: unknown): string | null {
  if (!exportDokumentGueltig(wert)) return null
  return (wert as { generatedAt: string }).generatedAt
}

export function exportFehlertext(status: number | 'unlesbar' | 'frist' | 'abbruch'): string {
  if (status === 401) {
    return 'Du bist für den Export nicht angemeldet. Es wurde nichts heruntergeladen. Du bleibst in den Einstellungen.'
  }
  if (status === 503) {
    return 'Der Export ist gerade nicht erreichbar. Es wurde nichts heruntergeladen.'
  }
  if (status === 500) {
    return 'Der Export konnte nicht gelesen werden. Es wurde nichts heruntergeladen.'
  }
  if (status === 'frist') {
    return 'Der Export hat zu lange gedauert und wurde abgebrochen. Es wurde nichts heruntergeladen. Ein neuer Versuch startet nur, wenn du ihn ausdrücklich auslöst.'
  }
  if (status === 'abbruch') {
    return 'Der Export wurde abgebrochen. Es wurde nichts heruntergeladen.'
  }
  if (typeof status === 'number') {
    return 'Der Export hat keine verwendbare Datei geliefert. Es wurde nichts heruntergeladen.'
  }
  return 'Die Antwort war keine gültige Exportdatei. Es wurde nichts heruntergeladen.'
}

export const EXPORT_ERFOLG_TEXT =
  'Die Datei wurde dem Browser zum Speichern übergeben. Jetnity prüft nicht, ob das Betriebssystem sie gespeichert hat. Die Tabellen wurden nacheinander gelesen und sind keine einzelne atomare Momentaufnahme. Das ist kein vollständiger rechtlicher Datenauszug und keine Kontolöschung.'

export const EXPORT_FRIST_MS = 30_000
