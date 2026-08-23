// lib/safety/status.ts
//
// Abgeleitete Ansicht. Ohne übergebene Evaluations keine permanente Karte.

import type { SafetyEvaluation, SafetyPresentationClass } from '@/lib/safety/domain'
import { safetyLokalFuerReise } from '@/lib/safety/engine'
import type { Trip } from '@/types/trips'

export type SafetySummary = {
  critical: number
  important: number
  information: number
  unknown: number
  unavailable: boolean
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

export function safetyAnsicht(reise: Trip, evaluations?: SafetyEvaluation[]): SafetyView {
  const liste = evaluations ?? safetyLokalFuerReise(reise)
  const vorhanden = evaluations !== undefined
  const unavailable = liste.every(
    (eintrag) => eintrag.freshness === 'provider_unavailable' || eintrag.evidenceStatus === 'unavailable',
  )
  const sichtbare = vorhanden
    ? liste.filter((eintrag) => {
        if (eintrag.seasonalRejected) return false
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
      unavailable,
      sichtbar: vorhanden && sichtbare.length > 0,
    },
  }
}
