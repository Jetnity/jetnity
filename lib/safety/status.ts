// lib/safety/status.ts
//
// Abgeleitete Ansicht. Ohne übergebene Evaluations keine permanente Karte.
// Nur checked-clean darf als sachliche «keine aktuelle Warnung» erscheinen.

import type { SafetyEvaluation, SafetyPresentationClass } from '@/lib/safety/domain'
import { safetyLokalFuerReise } from '@/lib/safety/engine'
import type { Trip } from '@/types/trips'

const SAFETY_CHECK_STATES = [
  'checked_clean',
  'has_warnings',
  'unavailable',
  'unknown',
] as const
export type SafetyCheckState = (typeof SAFETY_CHECK_STATES)[number]

export type SafetySummary = {
  critical: number
  important: number
  information: number
  unknown: number
  unavailable: boolean
  complete: boolean
  checkState: SafetyCheckState
  sichtbar: boolean
}

export type SafetyView = {
  evaluations: SafetyEvaluation[]
  sichtbare: SafetyEvaluation[]
  summary: SafetySummary
}

function zaehlen(evaluations: readonly SafetyEvaluation[], klasse: SafetyPresentationClass): number {
  return evaluations.filter((eintrag) => eintrag.presentationClass === klasse && eintrag.relevance === 'affected').length
}

function hatAktuelleWarnung(liste: readonly SafetyEvaluation[]): boolean {
  return liste.some(
    (eintrag) =>
      eintrag.relevance === 'affected' &&
      (eintrag.presentationClass === 'critical_warning' ||
        eintrag.presentationClass === 'important_notice' ||
        eintrag.presentationClass === 'information'),
  )
}

function checkStateAus(liste: readonly SafetyEvaluation[], vorhanden: boolean): SafetyCheckState {
  if (hatAktuelleWarnung(liste)) return 'has_warnings'
  if (liste.length === 0) return vorhanden ? 'unknown' : 'unavailable'
  if (liste.length === 1 && liste[0]?.factKey === 'checked_empty') return 'checked_clean'
  if (
    liste.some(
      (eintrag) =>
        eintrag.freshness === 'provider_unavailable' ||
        eintrag.freshness === 'source_temporarily_unavailable' ||
        eintrag.evidenceStatus === 'unavailable',
    )
  ) {
    return 'unavailable'
  }
  if (
    liste.some(
      (eintrag) =>
        eintrag.conflict ||
        eintrag.freshness === 'never_checked' ||
        eintrag.freshness === 'stale' ||
        eintrag.freshness === 'recheck_needed' ||
        eintrag.evidenceStatus === 'unknown' ||
        eintrag.evidenceStatus === 'insufficient_context' ||
        eintrag.relevance === 'insufficient_context' ||
        eintrag.relevance === 'unknown',
    )
  ) {
    return 'unknown'
  }
  return 'checked_clean'
}

export function safetyAnsicht(reise: Trip, evaluations?: SafetyEvaluation[]): SafetyView {
  const liste = evaluations ?? safetyLokalFuerReise(reise)
  const vorhanden = evaluations !== undefined
  const checkState = checkStateAus(liste, vorhanden)
  const complete = !liste.some((eintrag) => eintrag.factKey === 'partial_invalid')
  const sichtbare = vorhanden
    ? liste.filter((eintrag) => {
        if (eintrag.seasonalRejected) return false
        if (eintrag.factKey === 'checked_empty') return false
        if (eintrag.relevance === 'not_affected' && !eintrag.conflict) return false
        return true
      })
    : []

  return {
    evaluations: liste,
    sichtbare,
    summary: {
      critical: zaehlen(liste, 'critical_warning'),
      important: zaehlen(liste, 'important_notice'),
      information: zaehlen(liste, 'information'),
      unknown: liste.filter((eintrag) => eintrag.presentationClass === 'unknown').length,
      unavailable: checkState === 'unavailable',
      complete,
      checkState,
      sichtbar: vorhanden && sichtbare.length > 0,
    },
  }
}

export function safetyApiStatus(summary: SafetySummary): 'ok' | 'unavailable' | 'unknown' {
  if (summary.checkState === 'unavailable') return 'unavailable'
  if (summary.checkState === 'unknown') return 'unknown'
  if (!summary.complete) return 'unknown'
  return 'ok'
}
