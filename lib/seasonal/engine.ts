// lib/seasonal/engine.ts
//
// Provider-neutrale Seasonal-Engine.
// Ohne Provider niemals eine Reisezeit-Behauptung. LLM-Felder werden ignoriert.

import {
  SEASONAL_GRENZEN,
  type SeasonalEvidenceStatus,
  type SeasonalEvaluation,
} from '@/lib/seasonal/domain'
import { leereSeasonalEvidence, seasonalFrische } from '@/lib/seasonal/evidence'
import { seasonalContextFingerprint, seasonalFactFingerprint } from '@/lib/seasonal/fingerprint'
import { naechsteAktionAus, seasonalImpactAus } from '@/lib/seasonal/impact'
import { seasonalReisekontext, providerAnfrageAusKontext } from '@/lib/seasonal/kontext'
import { seasonalFactsDeduplizieren } from '@/lib/seasonal/konflikt'
import { seasonalFactNormalisieren, type SeasonalFact } from '@/lib/seasonal/normalisieren'
import { praesentationsklasseAus } from '@/lib/seasonal/praesentation'
import {
  seasonalProviderAus,
  type SeasonalProvider,
  type SeasonalProviderAnfrage,
  type SeasonalProviderFact,
} from '@/lib/seasonal/provider'
import { räumlichZeitlicheRelevanz } from '@/lib/seasonal/relevanz'
import type { Trip } from '@/types/trips'

export type { SeasonalEvaluation } from '@/lib/seasonal/domain'

function leerEvaluation(opts: {
  contextFingerprint: string
  freshness: SeasonalEvaluation['freshness']
  status: SeasonalEvidenceStatus
  reason: string
  factKey?: string
  conflict?: boolean
  checkedEmpty?: boolean
  evidenceClass?: SeasonalEvaluation['evidenceClass']
  acuteRejected?: boolean
}): SeasonalEvaluation {
  const evidenceClass = opts.evidenceClass ?? 'seasonal_pattern'
  const acuteRejected = opts.acuteRejected === true
  return {
    factId: opts.factKey ?? 'seasonal:unavailable',
    factKey: opts.factKey ?? 'unavailable',
    category: 'unknown',
    evidenceClass,
    outcome: 'unknown',
    evidenceStatus: opts.status,
    freshness: opts.freshness,
    relevance: opts.checkedEmpty
      ? 'not_applies'
      : opts.status === 'unavailable'
        ? 'unknown'
        : 'insufficient_context',
    spatialPrecision: 'unknown',
    presentationClass: 'unknown',
    authorityClass: 'unknown',
    affectedRefs: [],
    impact: [],
    reason: opts.reason,
    nextAction: 'observe',
    conflict: opts.conflict === true,
    acuteRejected,
    evidence: leereSeasonalEvidence(),
    contextFingerprint: opts.contextFingerprint,
    factFingerprint: opts.contextFingerprint,
  }
}

function evaluationAusFact(opts: {
  reise: Trip
  fact: SeasonalFact
  contextFingerprint: string
  conflict: boolean
  nowMs: number
}): SeasonalEvaluation {
  if (opts.fact.acuteRejected) {
    return leerEvaluation({
      contextFingerprint: opts.contextFingerprint,
      freshness: opts.fact.sourceTemporarilyUnavailable ? 'source_temporarily_unavailable' : 'never_checked',
      status: opts.fact.sourceTemporarilyUnavailable ? 'unavailable' : 'unknown',
      reason: 'Akute Warnungen gehören zur Safety-Domäne und erscheinen nicht als saisonaler Hinweis.',
      factKey: opts.fact.factKey,
      evidenceClass: 'rejected_acute',
      acuteRejected: true,
    })
  }
  if (opts.fact.sourceTemporarilyUnavailable) {
    return leerEvaluation({
      contextFingerprint: opts.contextFingerprint,
      freshness: 'source_temporarily_unavailable',
      status: 'unavailable',
      reason: 'Die saisonale Quelle ist vorübergehend nicht erreichbar. Es wird keine Reisezeit-Aussage erfunden.',
      factKey: opts.fact.factKey,
    })
  }

  const kontext = seasonalReisekontext(opts.reise)
  const relevanz = räumlichZeitlicheRelevanz(kontext, opts.fact.spatialScope, opts.fact.travelWindow)
  const factFingerprint = seasonalFactFingerprint({
    factKey: opts.fact.factKey,
    category: opts.fact.category,
    evidenceClass: opts.fact.evidenceClass,
    outcome: opts.fact.outcome,
    updatedAt: opts.fact.evidence.updatedAt,
    checkedAt: opts.fact.evidence.checkedAt,
    freshUntil: opts.fact.evidence.freshUntil,
    referencePeriod: opts.fact.evidence.referencePeriod,
    vertrauenswuerdig: opts.fact.vertrauenswuerdig,
    scope: opts.fact.spatialScope,
    travelWindow: opts.fact.travelWindow,
    affectedDomains: opts.fact.affectedDomains,
  })
  const freshness = seasonalFrische({
    storedFingerprint: opts.contextFingerprint,
    currentFingerprint: opts.contextFingerprint,
    checkedAt: opts.fact.evidence.checkedAt,
    freshUntil: opts.fact.evidence.freshUntil,
    nowMs: opts.nowMs,
    hasProvider: true,
  })
  const presentationClass = praesentationsklasseAus({
    relevance: relevanz.relevance,
    freshness,
    outcome: opts.fact.outcome,
    conflict: opts.conflict,
    vertrauenswuerdig: opts.fact.vertrauenswuerdig,
  })
  const impact = seasonalImpactAus({
    kontext,
    relevance: relevanz.relevance,
    precision: relevanz.precision,
    affectedRefs: relevanz.relevance === 'applies' ? relevanz.affectedRefs : [],
    sourceDomains: opts.fact.affectedDomains,
  })
  const evidenceStatus: SeasonalEvidenceStatus =
    freshness === 'current' && opts.fact.vertrauenswuerdig && !opts.conflict
      ? 'current'
      : relevanz.relevance === 'insufficient_context'
        ? 'insufficient_context'
        : 'unknown'

  return {
    factId: `seasonal:${opts.fact.factKey}`,
    factKey: opts.fact.factKey,
    category: opts.fact.category,
    evidenceClass: opts.fact.evidenceClass,
    outcome: opts.fact.outcome,
    evidenceStatus,
    freshness,
    relevance: relevanz.relevance,
    spatialPrecision: relevanz.precision,
    presentationClass,
    authorityClass: opts.fact.evidence.authorityClass,
    affectedRefs: relevanz.relevance === 'applies' ? relevanz.affectedRefs.slice(0, SEASONAL_GRENZEN.maxRefs) : [],
    impact,
    reason: opts.conflict
      ? 'Widersprüchliche belegte saisonale Hinweise. Keine eindeutige Timing-Aussage.'
      : relevanz.reason,
    nextAction: naechsteAktionAus(relevanz.precision, impact, relevanz.relevance),
    conflict: opts.conflict,
    acuteRejected: false,
    evidence: opts.fact.evidence,
    contextFingerprint: opts.contextFingerprint,
    factFingerprint,
  }
}

function evaluationsSortieren(liste: SeasonalEvaluation[]): SeasonalEvaluation[] {
  const rang: Record<SeasonalEvaluation['presentationClass'], number> = {
    timing_check: 0,
    timing_notice: 1,
    information: 2,
    unknown: 3,
  }
  return [...liste].sort(
    (a, b) => rang[a.presentationClass] - rang[b.presentationClass] || a.factKey.localeCompare(b.factKey),
  )
}

export function seasonalAusFacts(
  reise: Trip,
  providerFacts: readonly unknown[],
  providerName: string | null,
  opts: { nowMs?: number; roh?: unknown } = {},
): SeasonalEvaluation[] {
  if (opts.roh && typeof opts.roh === 'object') {
    const behauptung = opts.roh as { llmResult?: unknown; officialResult?: unknown; seasonalResult?: unknown }
    void behauptung.llmResult
    void behauptung.officialResult
    void behauptung.seasonalResult
  }

  const contextFingerprint = seasonalContextFingerprint(reise)
  if (!providerName) {
    return [
      leerEvaluation({
        contextFingerprint,
        freshness: 'provider_unavailable',
        status: 'unavailable',
        reason: 'Kein Seasonal-Provider aktiv. Es wird keine Reisezeit-Aussage erfunden.',
      }),
    ]
  }

  const nowMs = opts.nowMs ?? Date.now()
  if (providerFacts.length > SEASONAL_GRENZEN.maxFacts) {
    return [
      leerEvaluation({
        contextFingerprint,
        freshness: 'never_checked',
        status: 'unknown',
        reason: 'Die Providerantwort enthält zu viele Zeilen und wurde verworfen.',
      }),
    ]
  }

  const normalisiert = providerFacts.map((zeile) => {
    try {
      return seasonalFactNormalisieren(zeile, providerName, nowMs)
    } catch {
      return null
    }
  })
  const valide = normalisiert.filter((fact): fact is SeasonalFact => Boolean(fact))
  const acute = valide.filter((fact) => fact.acuteRejected)
  const temporarily = valide.filter((fact) => fact.sourceTemporarilyUnavailable && !fact.acuteRejected)
  const saisonal = valide.filter((fact) => !fact.acuteRejected && !fact.sourceTemporarilyUnavailable)
  const ungueltig = providerFacts.length - valide.length

  if (saisonal.length === 0) {
    if (ungueltig > 0) {
      return [
        leerEvaluation({
          contextFingerprint,
          freshness: 'never_checked',
          status: 'unknown',
          reason: 'Die Providerantwort war ungültig und wurde verworfen.',
        }),
      ]
    }
    if (acute.length > 0) {
      const acuteUnavailable = acute.some((fact) => fact.sourceTemporarilyUnavailable)
      return [
        leerEvaluation({
          contextFingerprint,
          freshness: acuteUnavailable ? 'source_temporarily_unavailable' : 'never_checked',
          status: acuteUnavailable ? 'unavailable' : 'unknown',
          reason: 'Akute Warnungen gehören zur Safety-Domäne und erscheinen nicht als saisonaler Hinweis.',
          factKey: 'acute_rejected',
          evidenceClass: 'rejected_acute',
          acuteRejected: true,
        }),
      ]
    }
    if (temporarily.length > 0) {
      return [
        leerEvaluation({
          contextFingerprint,
          freshness: 'source_temporarily_unavailable',
          status: 'unavailable',
          reason: 'Die saisonale Quelle ist vorübergehend nicht erreichbar. Es wird keine Reisezeit-Aussage erfunden.',
          factKey: temporarily[0]?.factKey,
        }),
      ]
    }
    return [
      leerEvaluation({
        contextFingerprint,
        freshness: 'current',
        status: 'current',
        reason:
          'Im geprüften Ausschnitt wurden keine belastbaren relevanten saisonalen Hinweise geliefert. Das ist keine Aussage, dass die Reisezeit optimal ist.',
        factKey: 'checked_empty',
        checkedEmpty: true,
      }),
    ]
  }

  const menge = seasonalFactsDeduplizieren(saisonal)
  const evaluations = menge.facts.map((fact) =>
    evaluationAusFact({
      reise,
      fact,
      contextFingerprint,
      conflict: false,
      nowMs,
    }),
  )
  for (const key of [...menge.konflikte].sort()) {
    evaluations.push(
      leerEvaluation({
        contextFingerprint,
        freshness: 'recheck_needed',
        status: 'unknown',
        reason: 'Widersprüchliche belegte saisonale Hinweise. Keine eindeutige Timing-Aussage.',
        factKey: key,
        conflict: true,
      }),
    )
  }
  if (temporarily.length > 0) {
    evaluations.push(
      leerEvaluation({
        contextFingerprint,
        freshness: 'source_temporarily_unavailable',
        status: 'unavailable',
        reason: 'Die saisonale Quelle ist vorübergehend nicht erreichbar. Es wird keine Reisezeit-Aussage erfunden.',
        factKey: temporarily[0]?.factKey,
      }),
    )
  }
  for (const fact of acute) {
    evaluations.push(
      evaluationAusFact({
        reise,
        fact,
        contextFingerprint,
        conflict: false,
        nowMs,
      }),
    )
  }
  if (ungueltig > 0) {
    evaluations.push(
      leerEvaluation({
        contextFingerprint,
        freshness: 'never_checked',
        status: 'unknown',
        reason: 'Ein Teil der Providerantwort war ungültig und wurde verworfen. Die Prüfung ist unvollständig.',
        factKey: 'partial_invalid',
      }),
    )
  }
  return evaluationsSortieren(evaluations)
}

async function seasonalProviderAbrufen(
  provider: SeasonalProvider,
  anfrage: SeasonalProviderAnfrage,
  timeoutMs: number,
): Promise<
  | { ok: true; facts: SeasonalProviderFact[] }
  | { ok: false; art: 'timeout' | 'throw' | 'malformed' }
> {
  const stopper = new AbortController()
  const timer = setTimeout(() => stopper.abort(), timeoutMs)
  const onAbort = () => {
    /* AbortSignal bricht den Adapter ab; die Race-Ablehnung folgt separat. */
  }
  stopper.signal.addEventListener('abort', onAbort, { once: true })
  try {
    const zeilen = await new Promise<SeasonalProviderFact[]>((resolve, reject) => {
      const timeoutFehler = Object.assign(new Error('seasonal-timeout'), { name: 'SeasonalProviderTimeout' })
      const timeoutId = setTimeout(() => reject(timeoutFehler), timeoutMs)
      provider.evaluate(anfrage, stopper.signal).then(
        (wert) => {
          clearTimeout(timeoutId)
          resolve(wert)
        },
        (fehler) => {
          clearTimeout(timeoutId)
          reject(fehler)
        },
      )
    })
    if (!Array.isArray(zeilen)) return { ok: false, art: 'malformed' }
    return { ok: true, facts: zeilen }
  } catch (fehler) {
    if (fehler && typeof fehler === 'object' && 'name' in fehler && fehler.name === 'SeasonalProviderTimeout') {
      return { ok: false, art: 'timeout' }
    }
    return { ok: false, art: 'throw' }
  } finally {
    clearTimeout(timer)
    stopper.abort()
    stopper.signal.removeEventListener('abort', onAbort)
  }
}

export async function seasonalAuswerten(
  reise: Trip,
  provider: SeasonalProvider | null = seasonalProviderAus(),
  roh: unknown = null,
  nowMs = Date.now(),
  timeoutMs: number = SEASONAL_GRENZEN.providerTimeoutMs,
): Promise<SeasonalEvaluation[]> {
  const contextFingerprint = seasonalContextFingerprint(reise)
  if (!provider) return seasonalAusFacts(reise, [], null, { nowMs, roh })
  const kontext = seasonalReisekontext(reise)
  const gelesen = await seasonalProviderAbrufen(
    provider,
    providerAnfrageAusKontext(kontext, contextFingerprint),
    timeoutMs,
  )
  if (!gelesen.ok) {
    return [
      leerEvaluation({
        contextFingerprint,
        freshness: 'source_temporarily_unavailable',
        status: 'unknown',
        reason:
          gelesen.art === 'malformed'
            ? 'Die Providerantwort war ungültig und wurde verworfen.'
            : gelesen.art === 'timeout'
              ? 'Die Seasonal-Quelle hat nicht rechtzeitig geantwortet. Es wird keine Reisezeit-Aussage erfunden.'
              : 'Die Seasonal-Quelle ist vorübergehend nicht erreichbar. Es wird keine Reisezeit-Aussage erfunden.',
      }),
    ]
  }
  return seasonalAusFacts(reise, gelesen.facts, provider.name, { nowMs, roh })
}

export function seasonalLokalFuerReise(reise: Trip): SeasonalEvaluation[] {
  return seasonalAusFacts(reise, [], null)
}
