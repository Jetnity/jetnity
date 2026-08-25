// lib/trips/attention.ts
//
// TW-4 Attention-Layer. Reine Presentation-Aggregation über vorhandene
// maschinenlesbare Ableitungen (ADR-0165). Keine Persistenz, kein LLM-Score,
// kein zweiter Lifecycle.
//
// Safety/Seasonal: vorhandene provider-neutrale, side-effect-freie lokale
// Evaluation wird im Produktpfad wiederverwendet. Fehlende Prop allein ist
// nicht clean und nicht automatisch unavailable.

import { fehlendeFaktenFuerReise } from '@/lib/readiness/party'
import { readinessAnsicht } from '@/lib/readiness/status'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import { safetyLokalFuerReise } from '@/lib/safety/engine'
import type { SafetyEvaluation } from '@/lib/safety/domain'
import { safetyAnsicht } from '@/lib/safety/status'
import { seasonalLokalFuerReise } from '@/lib/seasonal/engine'
import type { SeasonalEvaluation } from '@/lib/seasonal/domain'
import { seasonalAnsicht } from '@/lib/seasonal/status'
import { bereichStatus, type Arbeitsbereich, type BereichLage } from '@/lib/trips/arbeitsbereich'
import type { Trip, TripItem } from '@/types/trips'

export type AttentionLeerstand =
  | 'nichts_dringend_geprueft'
  | 'noch_nicht_geprueft'
  | 'noch_nicht_pruefbar'
  | 'pruefung_nicht_verfuegbar'

export type AttentionEbene = 'reise' | 'etappe' | 'tag' | 'item' | 'person'

export type AttentionSchwere = 'blockierend' | 'bald' | 'hinweis'

export type AttentionLage =
  | 'known_gap'
  | 'unknown'
  | 'stale'
  | 'unavailable'
  | 'warning'
  | 'error'
  | 'insufficient_context'
  | 'ungeprueft'

export type AttentionAktion = {
  art: 'bereich'
  bereich: Arbeitsbereich
}

export type AttentionPunkt = {
  id: string
  ebene: AttentionEbene
  signal: string
  schwere: AttentionSchwere
  lage: AttentionLage
  titel: string
  aktion: AttentionAktion | null
}

export type AttentionOrchestrierung = {
  safety: 'angebunden' | 'nicht_ausgefuehrt'
  seasonal: 'angebunden' | 'nicht_ausgefuehrt'
}

export type AttentionAbleitung = {
  leerstand: AttentionLeerstand
  orchestrierung: AttentionOrchestrierung
  punkte: AttentionPunkt[]
  sichtbar: AttentionPunkt[]
  weitere: AttentionPunkt[]
}

const ATTENTION_SICHTBAR_LIMIT = 3

const SCHWERE_RANG: Record<AttentionSchwere, number> = {
  blockierend: 0,
  bald: 1,
  hinweis: 2,
}

const SIGNAL_RANG: Record<string, number> = {
  'safety.critical_warning': 0,
  'safety.important_notice': 1,
  'safety.error': 2,
  'coverage.fluege': 3,
  'coverage.unterkunft': 4,
  'readiness.stale': 5,
  'official.insufficient_context': 6,
  'official.stale': 7,
  'seasonal.timing_check': 8,
  'seasonal.timing_notice': 9,
  'seasonal.error': 10,
  'safety.unavailable': 11,
  'seasonal.unavailable': 12,
  'safety.ungeprueft': 13,
  'seasonal.ungeprueft': 14,
}

type AttentionEingabe = {
  reise: Trip
  ohneTag?: readonly TripItem[]
  safetyEvaluations?: SafetyEvaluation[]
  seasonalEvaluations?: SeasonalEvaluation[]
  officialEvaluations?: OfficialEvaluation[]
  orchestriereSafety?: boolean
  orchestriereSeasonal?: boolean
  sichtbarLimit?: number
}

function safetyQuelle(
  reise: Trip,
  evaluations: SafetyEvaluation[] | undefined,
  orchestriere: boolean,
): { liste: SafetyEvaluation[] | undefined; ausgefuehrt: boolean } {
  if (evaluations !== undefined) return { liste: evaluations, ausgefuehrt: true }
  if (orchestriere) return { liste: safetyLokalFuerReise(reise), ausgefuehrt: true }
  return { liste: undefined, ausgefuehrt: false }
}

function seasonalQuelle(
  reise: Trip,
  evaluations: SeasonalEvaluation[] | undefined,
  orchestriere: boolean,
): { liste: SeasonalEvaluation[] | undefined; ausgefuehrt: boolean } {
  if (evaluations !== undefined) return { liste: evaluations, ausgefuehrt: true }
  if (orchestriere) return { liste: seasonalLokalFuerReise(reise), ausgefuehrt: true }
  return { liste: undefined, ausgefuehrt: false }
}

function coverageLage(lage: BereichLage): { schwere: AttentionSchwere; lage: AttentionLage } {
  if (lage === 'unbestimmt') return { schwere: 'bald', lage: 'unknown' }
  return { schwere: 'hinweis', lage: 'known_gap' }
}

function coverageTitel(bereich: 'fluege' | 'unterkunft', lage: BereichLage): string {
  if (bereich === 'fluege') {
    if (lage === 'unbestimmt') return 'Flugabdeckung noch nicht vollständig bestimmbar'
    if (lage === 'teilweise') return 'Flugabdeckung nur teilweise'
    return 'Flugstrecke noch offen'
  }
  if (lage === 'unbestimmt') return 'Unterkunftsabdeckung noch nicht vollständig bestimmbar'
  if (lage === 'teilweise') return 'Unterkunftsnächte nur teilweise abgedeckt'
  return 'Unterkunftsnächte fehlen noch'
}

function punktSortieren(links: AttentionPunkt, rechts: AttentionPunkt): number {
  const schwere = SCHWERE_RANG[links.schwere] - SCHWERE_RANG[rechts.schwere]
  if (schwere !== 0) return schwere
  const signal = (SIGNAL_RANG[links.signal] ?? 50) - (SIGNAL_RANG[rechts.signal] ?? 50)
  if (signal !== 0) return signal
  return links.id.localeCompare(rechts.id)
}

function domainLeerstand(opts: {
  ausgefuehrt: boolean
  checkState?: 'checked_clean' | 'checked_empty' | 'has_warnings' | 'has_timing' | 'unavailable' | 'unknown'
  nichtPruefbar?: boolean
  fehler?: boolean
}): AttentionLeerstand | 'fehler' {
  if (!opts.ausgefuehrt) return 'noch_nicht_geprueft'
  if (opts.fehler) return 'fehler'
  if (opts.nichtPruefbar) return 'noch_nicht_pruefbar'
  if (opts.checkState === 'unavailable') return 'pruefung_nicht_verfuegbar'
  if (opts.checkState === 'unknown') return 'noch_nicht_pruefbar'
  return 'nichts_dringend_geprueft'
}

function gesamtLeerstand(domainen: Array<AttentionLeerstand | 'fehler'>): AttentionLeerstand {
  if (domainen.includes('noch_nicht_geprueft')) return 'noch_nicht_geprueft'
  if (domainen.includes('noch_nicht_pruefbar')) return 'noch_nicht_pruefbar'
  if (domainen.includes('pruefung_nicht_verfuegbar')) return 'pruefung_nicht_verfuegbar'
  return 'nichts_dringend_geprueft'
}

export function attentionAbleiten(eingabe: AttentionEingabe): AttentionAbleitung {
  const reise = eingabe.reise
  const ohneTag = eingabe.ohneTag ?? []
  const orchestriereSafety = eingabe.orchestriereSafety !== false
  const orchestriereSeasonal = eingabe.orchestriereSeasonal !== false
  const limit = eingabe.sichtbarLimit ?? ATTENTION_SICHTBAR_LIMIT

  const safety = safetyQuelle(reise, eingabe.safetyEvaluations, orchestriereSafety)
  const seasonal = seasonalQuelle(reise, eingabe.seasonalEvaluations, orchestriereSeasonal)
  const safetySicht = safetyAnsicht(reise, safety.liste)
  const seasonalSicht = seasonalAnsicht(reise, seasonal.liste)
  const readiness = readinessAnsicht(reise, eingabe.officialEvaluations)

  const punkte: AttentionPunkt[] = []
  const domainen: Array<AttentionLeerstand | 'fehler'> = []

  const abdeckungen = bereichStatus(reise, ohneTag)
  for (const eintrag of abdeckungen) {
    if (eintrag.bereich !== 'fluege' && eintrag.bereich !== 'unterkunft') continue
    if (eintrag.lage === 'belegt') continue
    const gewicht = coverageLage(eintrag.lage)
    punkte.push({
      id: `coverage:${eintrag.bereich}`,
      ebene: 'reise',
      signal: `coverage.${eintrag.bereich}`,
      schwere: gewicht.schwere,
      lage: gewicht.lage,
      titel: coverageTitel(eintrag.bereich, eintrag.lage),
      aktion: { art: 'bereich', bereich: eintrag.bereich },
    })
  }

  if (!safety.ausgefuehrt) {
    domainen.push('noch_nicht_geprueft')
    punkte.push({
      id: 'safety:ungeprueft',
      ebene: 'reise',
      signal: 'safety.ungeprueft',
      schwere: 'hinweis',
      lage: 'ungeprueft',
      titel: 'Sicherheit noch nicht geprüft',
      aktion: null,
    })
  } else {
    const safetyFehler = safetySicht.evaluations.some(
      (eintrag) => eintrag.conflict || eintrag.factKey === 'partial_invalid',
    )
    const safetyNichtPruefbar = safetySicht.evaluations.some(
      (eintrag) =>
        eintrag.evidenceStatus === 'insufficient_context' || eintrag.relevance === 'insufficient_context',
    )
    domainen.push(
      domainLeerstand({
        ausgefuehrt: true,
        checkState: safetySicht.summary.checkState,
        nichtPruefbar: safetyNichtPruefbar && safetySicht.summary.checkState === 'unknown',
        fehler: safetyFehler,
      }),
    )

    for (const eintrag of safetySicht.evaluations) {
      if (eintrag.seasonalRejected) continue
      if (eintrag.relevance !== 'affected') continue
      if (eintrag.presentationClass === 'critical_warning') {
        punkte.push({
          id: `safety:${eintrag.factId}`,
          ebene: eintrag.affectedRefs[0]?.kind === 'stage' ? 'etappe' : 'reise',
          signal: 'safety.critical_warning',
          schwere: 'blockierend',
          lage: 'warning',
          titel: 'Sicherheitslage braucht Aufmerksamkeit',
          aktion: null,
        })
      } else if (eintrag.presentationClass === 'important_notice') {
        punkte.push({
          id: `safety:${eintrag.factId}`,
          ebene: 'reise',
          signal: 'safety.important_notice',
          schwere: 'bald',
          lage: 'warning',
          titel: 'Wichtiger Sicherheitshinweis',
          aktion: null,
        })
      }
    }

    if (safetyFehler) {
      punkte.push({
        id: 'safety:error',
        ebene: 'reise',
        signal: 'safety.error',
        schwere: 'bald',
        lage: 'error',
        titel: 'Sicherheitsprüfung ist fehlgeschlagen',
        aktion: null,
      })
    } else if (safetySicht.summary.checkState === 'unavailable') {
      punkte.push({
        id: 'safety:unavailable',
        ebene: 'reise',
        signal: 'safety.unavailable',
        schwere: 'hinweis',
        lage: 'unavailable',
        titel: 'Sicherheitsprüfung derzeit nicht verfügbar',
        aktion: null,
      })
    }
  }

  if (!seasonal.ausgefuehrt) {
    domainen.push('noch_nicht_geprueft')
    punkte.push({
      id: 'seasonal:ungeprueft',
      ebene: 'reise',
      signal: 'seasonal.ungeprueft',
      schwere: 'hinweis',
      lage: 'ungeprueft',
      titel: 'Reisezeit noch nicht geprüft',
      aktion: null,
    })
  } else {
    const seasonalFehler = seasonalSicht.evaluations.some(
      (eintrag) => eintrag.conflict || eintrag.factKey === 'partial_invalid',
    )
    const seasonalNichtPruefbar = seasonalSicht.evaluations.some(
      (eintrag) =>
        eintrag.evidenceStatus === 'insufficient_context' || eintrag.relevance === 'insufficient_context',
    )
    domainen.push(
      domainLeerstand({
        ausgefuehrt: true,
        checkState:
          seasonalSicht.summary.checkState === 'checked_empty'
            ? 'checked_empty'
            : seasonalSicht.summary.checkState,
        nichtPruefbar: seasonalNichtPruefbar && seasonalSicht.summary.checkState === 'unknown',
        fehler: seasonalFehler,
      }),
    )

    for (const eintrag of seasonalSicht.evaluations) {
      if (eintrag.acuteRejected) continue
      if (eintrag.relevance !== 'applies') continue
      if (eintrag.presentationClass === 'timing_check') {
        punkte.push({
          id: `seasonal:${eintrag.factId}`,
          ebene: 'reise',
          signal: 'seasonal.timing_check',
          schwere: 'bald',
          lage: 'warning',
          titel: 'Reisezeit hat eine erhebliche Wirkung',
          aktion: null,
        })
      } else if (eintrag.presentationClass === 'timing_notice') {
        punkte.push({
          id: `seasonal:${eintrag.factId}`,
          ebene: 'reise',
          signal: 'seasonal.timing_notice',
          schwere: 'hinweis',
          lage: 'warning',
          titel: 'Hinweis zur Reisezeit',
          aktion: null,
        })
      }
    }

    if (seasonalFehler) {
      punkte.push({
        id: 'seasonal:error',
        ebene: 'reise',
        signal: 'seasonal.error',
        schwere: 'bald',
        lage: 'error',
        titel: 'Reisezeitprüfung ist fehlgeschlagen',
        aktion: null,
      })
    } else if (seasonalSicht.summary.checkState === 'unavailable') {
      punkte.push({
        id: 'seasonal:unavailable',
        ebene: 'reise',
        signal: 'seasonal.unavailable',
        schwere: 'hinweis',
        lage: 'unavailable',
        titel: 'Reisezeitprüfung derzeit nicht verfügbar',
        aktion: null,
      })
    }
  }

  if (readiness.summary.stale > 0) {
    punkte.push({
      id: 'readiness:stale',
      ebene: 'reise',
      signal: 'readiness.stale',
      schwere: 'bald',
      lage: 'stale',
      titel: 'Vorbereitungspunkte erneut prüfen',
      aktion: { art: 'bereich', bereich: 'uebersicht' },
    })
  }

  const fehlendeFakten = fehlendeFaktenFuerReise({ ...reise, stages: reise.stages })
  const officialNichtPruefbar =
    readiness.summary.officialStatus === 'insufficient_context' ||
    fehlendeFakten.includes('nationality') ||
    fehlendeFakten.includes('destination_country') ||
    fehlendeFakten.includes('travel_dates') ||
    readiness.summary.missingFacts.includes('nationality') ||
    readiness.summary.missingFacts.includes('destination_country') ||
    readiness.summary.missingFacts.includes('travel_dates')

  if (officialNichtPruefbar) {
    domainen.push('noch_nicht_pruefbar')
    punkte.push({
      id: 'official:insufficient_context',
      ebene: 'person',
      signal: 'official.insufficient_context',
      schwere: 'hinweis',
      lage: 'insufficient_context',
      titel: 'Offizielle Prüfung noch nicht möglich',
      aktion: { art: 'bereich', bereich: 'uebersicht' },
    })
  } else if (readiness.summary.officialFreshness === 'stale' || readiness.summary.officialFreshness === 'recheck_needed') {
    domainen.push('nichts_dringend_geprueft')
    punkte.push({
      id: 'official:stale',
      ebene: 'reise',
      signal: 'official.stale',
      schwere: 'bald',
      lage: 'stale',
      titel: 'Offizielle Anforderungen erneut prüfen',
      aktion: { art: 'bereich', bereich: 'uebersicht' },
    })
  } else if (readiness.summary.officialFreshness === 'provider_unavailable' || readiness.summary.officialFreshness === 'source_temporarily_unavailable') {
    domainen.push('pruefung_nicht_verfuegbar')
  } else if (readiness.summary.officialFreshness === 'never_checked') {
    domainen.push('noch_nicht_geprueft')
  } else {
    domainen.push('nichts_dringend_geprueft')
  }

  const geordnet = [...punkte].sort(punktSortieren)
  return {
    leerstand: gesamtLeerstand(domainen),
    orchestrierung: {
      safety: safety.ausgefuehrt ? 'angebunden' : 'nicht_ausgefuehrt',
      seasonal: seasonal.ausgefuehrt ? 'angebunden' : 'nicht_ausgefuehrt',
    },
    punkte: geordnet,
    sichtbar: geordnet.slice(0, limit),
    weitere: geordnet.slice(limit),
  }
}
