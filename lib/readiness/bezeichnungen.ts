// lib/readiness/bezeichnungen.ts
//
// Was Reisende lesen. Keine irreführende Erfolgssprache.

import type { ReadinessKind, ReadinessUserStatus } from '@/types/trips'
import type { OfficialRequirementStatus, ReadinessCurrentness } from '@/lib/readiness/domain'
import type { OfficialEvaluation, OfficialFreshness } from '@/lib/readiness/official'

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

export function officialFreshnessText(freshness: OfficialFreshness): string {
  if (freshness === 'current') return 'Offizielle Anforderungen wurden geprüft'
  if (freshness === 'recheck_needed' || freshness === 'stale') return 'Offizielle Anforderungen erneut prüfen'
  if (freshness === 'source_temporarily_unavailable') return 'Offizielle Quelle derzeit nicht erreichbar'
  if (freshness === 'never_checked') return 'Offizielle Anforderungen noch nicht geprüft'
  return 'Automatische Einreiseprüfung derzeit nicht verfügbar'
}

export function officialPruefungAusLage(
  lagen: readonly {
    freshness: OfficialFreshness
    status: string
    missingFacts: readonly string[]
  }[],
): string {
  if (lagen.some((eintrag) => eintrag.freshness === 'source_temporarily_unavailable')) {
    return officialFreshnessText('source_temporarily_unavailable')
  }
  if (lagen.some((eintrag) => eintrag.freshness === 'stale' || eintrag.freshness === 'recheck_needed')) {
    return officialFreshnessText('stale')
  }
  const fehlenAngaben = lagen.some(
    (eintrag) => eintrag.status === 'insufficient_context' || eintrag.missingFacts.length > 0,
  )
  const providerFehlt = lagen.length > 0 && lagen.every((eintrag) => eintrag.freshness === 'provider_unavailable')
  if (fehlenAngaben && providerFehlt) {
    return 'Für die automatische Prüfung fehlen noch Angaben · Automatische Einreiseprüfung derzeit nicht verfügbar'
  }
  if (fehlenAngaben) return 'Für die automatische Prüfung fehlen noch Angaben'
  if (lagen.some((eintrag) => eintrag.freshness === 'current')) {
    return officialFreshnessText('current')
  }
  if (lagen.some((eintrag) => eintrag.freshness === 'never_checked')) {
    return officialFreshnessText('never_checked')
  }
  return officialFreshnessText('provider_unavailable')
}

export function officialPruefungAusEvaluations(evaluations: readonly OfficialEvaluation[]): string {
  return officialPruefungAusLage(evaluations)
}

export function officialListeHinweis(evaluations: readonly OfficialEvaluation[]): string {
  if (evaluations.length === 0) return 'Noch keine prüfbaren offiziellen Anforderungen.'
  return `${officialPruefungAusEvaluations(evaluations)}. Unterschiedliche Reisende werden getrennt bewertet.`
}

export const SENSITIVE_HINWEIS =
  'Keine Passnummern, Ausweisdaten, Geburtsdaten oder andere sensible Daten eintragen.'

export const MEHRERE_REISENDE_HINWEIS =
  'Diese Reise hat mehrere Reisende. Ohne individuelle Angaben gilt ein Häkchen nicht für alle.'
