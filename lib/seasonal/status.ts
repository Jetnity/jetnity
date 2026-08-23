// lib/seasonal/status.ts
//
// Abgeleitete Ansicht. Ohne übergebene Evaluations keine permanente Karte.
// Unknown/unavailable darf nie wie «gute Reisezeit» klingen.

import type { SeasonalEvaluation, SeasonalPresentationClass } from '@/lib/seasonal/domain'
import { seasonalLokalFuerReise } from '@/lib/seasonal/engine'
import type { Trip } from '@/types/trips'

const SEASONAL_CHECK_STATES = [
  'checked_empty',
  'has_timing',
  'unavailable',
  'unknown',
] as const
export type SeasonalCheckState = (typeof SEASONAL_CHECK_STATES)[number]

export type SeasonalSummary = {
  timingCheck: number
  timingNotice: number
  information: number
  unknown: number
  unavailable: boolean
  complete: boolean
  checkState: SeasonalCheckState
  sichtbar: boolean
}

export type SeasonalView = {
  evaluations: SeasonalEvaluation[]
  sichtbare: SeasonalEvaluation[]
  summary: SeasonalSummary
}

function zaehlen(evaluations: readonly SeasonalEvaluation[], klasse: SeasonalPresentationClass): number {
  return evaluations.filter((eintrag) => eintrag.presentationClass === klasse && eintrag.relevance === 'applies').length
}

function hatTiming(liste: readonly SeasonalEvaluation[]): boolean {
  return liste.some(
    (eintrag) =>
      eintrag.relevance === 'applies' &&
      (eintrag.presentationClass === 'timing_check' ||
        eintrag.presentationClass === 'timing_notice' ||
        eintrag.presentationClass === 'information'),
  )
}

function istAbgewieseneAcute(eintrag: SeasonalEvaluation): boolean {
  return (
    eintrag.acuteRejected ||
    eintrag.evidenceClass === 'rejected_acute' ||
    eintrag.factKey === 'acute_rejected'
  )
}

function nurAbgewieseneAcute(liste: readonly SeasonalEvaluation[]): boolean {
  return liste.length > 0 && liste.every(istAbgewieseneAcute)
}

function entscheidungsrelevant(eintrag: SeasonalEvaluation): boolean {
  if (istAbgewieseneAcute(eintrag)) return false
  if (eintrag.factKey === 'checked_empty') return false
  if (eintrag.relevance === 'not_applies' && !eintrag.conflict) return false
  return true
}

function istQuelleWeg(eintrag: SeasonalEvaluation): boolean {
  if (!entscheidungsrelevant(eintrag)) return false
  return (
    eintrag.freshness === 'provider_unavailable' ||
    eintrag.freshness === 'source_temporarily_unavailable' ||
    eintrag.evidenceStatus === 'unavailable'
  )
}

function istWahrheitsluecke(eintrag: SeasonalEvaluation): boolean {
  if (!entscheidungsrelevant(eintrag) || istQuelleWeg(eintrag)) return false
  return (
    eintrag.conflict ||
    eintrag.factKey === 'partial_invalid' ||
    eintrag.freshness === 'never_checked' ||
    eintrag.freshness === 'stale' ||
    eintrag.freshness === 'recheck_needed' ||
    eintrag.evidenceStatus === 'unknown' ||
    eintrag.evidenceStatus === 'insufficient_context' ||
    eintrag.relevance === 'insufficient_context' ||
    eintrag.relevance === 'unknown'
  )
}

function checkStateAus(liste: readonly SeasonalEvaluation[], vorhanden: boolean): SeasonalCheckState {
  if (liste.length === 0) return vorhanden ? 'unknown' : 'unavailable'
  if (liste.length === 1 && liste[0]?.factKey === 'checked_empty') return 'checked_empty'
  if (nurAbgewieseneAcute(liste)) return 'unknown'
  if (liste.some(istWahrheitsluecke)) return 'unknown'
  if (hatTiming(liste)) return 'has_timing'
  if (liste.some(istQuelleWeg)) return 'unavailable'
  return 'checked_empty'
}

export function seasonalAnsicht(reise: Trip, evaluations?: SeasonalEvaluation[]): SeasonalView {
  const liste = evaluations ?? seasonalLokalFuerReise(reise)
  const vorhanden = evaluations !== undefined
  const checkState = checkStateAus(liste, vorhanden)
  const complete =
    !liste.some((eintrag) => istWahrheitsluecke(eintrag) || istQuelleWeg(eintrag)) &&
    !nurAbgewieseneAcute(liste)
  const sichtbare = vorhanden
    ? liste.filter((eintrag) => {
        if (istAbgewieseneAcute(eintrag)) return false
        if (eintrag.factKey === 'checked_empty') return false
        if (eintrag.relevance === 'not_applies' && !eintrag.conflict) return false
        return true
      })
    : []

  return {
    evaluations: liste,
    sichtbare,
    summary: {
      timingCheck: zaehlen(liste, 'timing_check'),
      timingNotice: zaehlen(liste, 'timing_notice'),
      information: zaehlen(liste, 'information'),
      unknown: liste.filter((eintrag) => eintrag.presentationClass === 'unknown').length,
      unavailable: checkState === 'unavailable',
      complete,
      checkState,
      sichtbar: vorhanden && sichtbare.length > 0,
    },
  }
}

export function seasonalApiStatus(summary: SeasonalSummary): 'ok' | 'unavailable' | 'unknown' {
  if (summary.checkState === 'unavailable') return 'unavailable'
  if (summary.checkState === 'unknown') return 'unknown'
  if (!summary.complete) return 'unknown'
  return 'ok'
}
