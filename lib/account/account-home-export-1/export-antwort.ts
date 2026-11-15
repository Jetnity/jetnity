// Prüfung der Export-Antwort im Browser, bevor eine Datei übergeben wird.
//
// Dieselben öffentlichen Vertragswerte wie `lib/account/datenexport.ts`.
// Diese Datei importiert das Servermodul nicht, damit der Client es nicht
// in den Browser zieht.

import { einstellungenText } from '@/lib/localization/einstellungen-texte'
import type { UiSprache } from '@/lib/localization/ui-sprache'

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

const EXPORT_ZEIT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function exportZeitGueltig(wert: unknown): wert is string {
  if (typeof wert !== 'string' || !EXPORT_ZEIT.test(wert)) return false
  const zeit = Date.parse(wert)
  return Number.isFinite(zeit) && new Date(zeit).toISOString() === wert
}

function exportZeileGueltig(zeile: unknown, gesehen: Set<string>): boolean {
  if (!zeile || typeof zeile !== 'object' || Array.isArray(zeile)) return false
  const id = (zeile as { id?: unknown }).id
  if (typeof id !== 'string' || id.length === 0 || id !== id.trim()) return false
  if (gesehen.has(id)) return false
  gesehen.add(id)
  return true
}

export function exportDokumentGueltig(wert: unknown): boolean {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return false
  const dokument = wert as Record<string, unknown>
  if (dokument.schemaVersion !== EXPORT_SCHEMA_VERSION) return false
  if (!exportZeitGueltig(dokument.generatedAt)) return false
  if (!dokument.scope || typeof dokument.scope !== 'object' || Array.isArray(dokument.scope)) return false
  const scope = dokument.scope as Record<string, unknown>
  if (scope.owner !== 'authenticated-session') return false
  if (scope.completeness !== EXPORT_VOLLSTAENDIGKEIT) return false
  if (!Array.isArray(scope.tables) || scope.tables.length !== EXPORT_TABELLEN.length) return false
  for (let index = 0; index < EXPORT_TABELLEN.length; index += 1) {
    if (scope.tables[index] !== EXPORT_TABELLEN[index]) return false
  }
  if (!dokument.data || typeof dokument.data !== 'object' || Array.isArray(dokument.data)) return false
  const data = dokument.data as Record<string, unknown>
  const schluessel = Object.keys(data)
  if (schluessel.length !== EXPORT_TABELLEN.length) return false
  for (const tabelle of EXPORT_TABELLEN) {
    const zeilen = data[tabelle]
    if (!Array.isArray(zeilen)) return false
    const gesehen = new Set<string>()
    for (const zeile of zeilen) {
      if (!exportZeileGueltig(zeile, gesehen)) return false
    }
  }
  return true
}

export function exportGeneratedAt(wert: unknown): string | null {
  if (!exportDokumentGueltig(wert)) return null
  return (wert as { generatedAt: string }).generatedAt
}

export function exportFehlertext(status: number | 'unlesbar' | 'frist' | 'abbruch', sprache: UiSprache = 'de'): string {
  if (status === 401) {
    return einstellungenText(sprache, 'export.unauthenticated')
  }
  if (status === 503) {
    return einstellungenText(sprache, 'export.unavailable')
  }
  if (status === 500) {
    return einstellungenText(sprache, 'export.failed')
  }
  if (status === 'frist') {
    return einstellungenText(sprache, 'export.timeout')
  }
  if (status === 'abbruch') {
    return einstellungenText(sprache, 'export.cancelled')
  }
  if (typeof status === 'number') {
    return einstellungenText(sprache, 'export.httpError')
  }
  return einstellungenText(sprache, 'export.invalid')
}

export const EXPORT_ERFOLG_TEXT = einstellungenText('de', 'export.success')

export function exportErfolgtext(sprache: UiSprache): string {
  return sprache === 'de' ? EXPORT_ERFOLG_TEXT : einstellungenText(sprache, 'export.success')
}

export const EXPORT_FRIST_MS = 30_000
