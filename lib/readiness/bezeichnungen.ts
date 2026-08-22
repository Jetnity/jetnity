// lib/readiness/bezeichnungen.ts
//
// Was Reisende lesen. Keine irreführende Erfolgssprache.

import type { ReadinessKind, ReadinessUserStatus } from '@/types/trips'
import type { OfficialRequirementStatus, ReadinessCurrentness } from '@/lib/readiness/domain'

export const READINESS_ART_BEZEICHNUNG: Record<ReadinessKind, string> = {
  entry_check: 'Einreisebedingungen',
  visa_check: 'Visum',
  travel_document_check: 'Reisedokument',
  insurance_check: 'Versicherung',
  ticket_confirmation_check: 'Ticket',
  booking_confirmation_check: 'Buchungsbestätigung',
  preparation: 'Vorbereitung',
}

export const READINESS_GRUPPE: Record<ReadinessKind, 'einreise' | 'dokumente' | 'versicherung' | 'bestaetigung' | 'sonstiges'> = {
  entry_check: 'einreise',
  visa_check: 'einreise',
  travel_document_check: 'dokumente',
  insurance_check: 'versicherung',
  ticket_confirmation_check: 'bestaetigung',
  booking_confirmation_check: 'bestaetigung',
  preparation: 'sonstiges',
}

export const READINESS_GRUPPE_TITEL = {
  einreise: 'Einreise und Visum',
  dokumente: 'Reisedokumente',
  versicherung: 'Versicherung',
  bestaetigung: 'Tickets und Buchungsbestätigungen',
  sonstiges: 'Weitere Vorbereitung',
} as const

export function nutzerstandText(status: ReadinessUserStatus, currentness: ReadinessCurrentness): string {
  if (currentness === 'stale') return 'Erneut prüfen'
  if (currentness === 'not_applicable') return 'Nicht mehr aktuell'
  if (status === 'done') return 'Von dir erledigt'
  if (status === 'skipped') return 'Von dir als nicht relevant markiert'
  return 'Offen'
}

export function officialStatusText(status: OfficialRequirementStatus): string {
  if (status === 'unavailable') return 'Nicht verfügbar'
  if (status === 'insufficient_context') return 'Noch nicht offiziell geprüft'
  return 'Noch nicht offiziell geprüft'
}

export const SENSITIVE_HINWEIS =
  'Keine Passnummern, Ausweisdaten, Geburtsdaten oder andere sensible Daten eintragen.'

export const MEHRERE_REISENDE_HINWEIS =
  'Diese Reise hat mehrere Reisende. Ohne individuelle Angaben gilt ein Häkchen nicht für alle.'
