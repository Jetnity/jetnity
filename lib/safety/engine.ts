// lib/safety/engine.ts
//
// Provider-neutrale Safety-Engine.
// Ohne Provider niemals eine Warnung. LLM-Felder in der Anfrage werden ignoriert.

import { travellerSlots } from '@/lib/readiness/party'
import { citizenshipCodesAus } from '@/lib/readiness/traveller-kontext'
import {
  SAFETY_GRENZEN,
  type SafetyEvidenceStatus,
  type SafetyEvaluation,
} from '@/lib/safety/domain'
import { leereSafetyEvidence, safetyFrische } from '@/lib/safety/evidence'
import { safetyEventFingerprint, safetyContextFingerprint } from '@/lib/safety/fingerprint'
import { naechsteAktionAus, safetyImpactAus } from '@/lib/safety/impact'
import { safetyReisekontext, providerAnfrageAusKontext } from '@/lib/safety/kontext'
import { safetyFactsDeduplizieren } from '@/lib/safety/konflikt'
import { safetyFactNormalisieren, type SafetyFact } from '@/lib/safety/normalisieren'
import { praesentationsklasseAus } from '@/lib/safety/praesentation'
import { safetyProviderAus, type SafetyProvider, type SafetyProviderFact } from '@/lib/safety/provider'
import { räumlichZeitlicheRelevanz } from '@/lib/safety/relevanz'
import type { Trip } from '@/types/trips'

export type { SafetyEvaluation } from '@/lib/safety/domain'

function leerEvaluation(opts: {
  contextFingerprint: string
  freshness: SafetyEvaluation['freshness']
  status: SafetyEvidenceStatus
  reason: string
  factKey?: string
  conflict?: boolean
  checkedEmpty?: boolean
}): SafetyEvaluation {
  return {
    factId: opts.factKey ?? 'safety:unavailable',
    factKey: opts.factKey ?? 'unavailable',
    category: 'unknown',
    eventStatus: 'unknown',
    evidenceStatus: opts.status,
    freshness: opts.freshness,
    relevance: opts.checkedEmpty
      ? 'not_affected'
      : opts.status === 'unavailable'
        ? 'unknown'
        : 'insufficient_context',
    spatialPrecision: 'unknown',
    presentationClass: 'unknown',
    sourceSeverity: null,
    advisoryClass: null,
    authorityClass: 'unknown',
    affectedRefs: [],
    impact: [],
    reason: opts.reason,
    nextAction: 'observe',
    conflict: opts.conflict === true,
    seasonalRejected: false,
    evidence: leereSafetyEvidence(opts.contextFingerprint),
    contextFingerprint: opts.contextFingerprint,
    eventFingerprint: opts.contextFingerprint,
  }
}

function travellerRelevant(reise: Trip, fact: SafetyFact): 'ok' | 'insufficient' | 'skip' {
  if (!fact.travellerDependent) return 'ok'
  if (fact.travellerCitizenshipCodes.length === 0) return 'insufficient'
  const slots = travellerSlots(reise).filter((slot) => slot.applicable)
  if (slots.length === 0) return 'insufficient'
  let unvollstaendig = false
  for (const slot of slots) {
    const codes = slot.traveller ? citizenshipCodesAus(slot.traveller) : []
    if (codes.some((code) => fact.travellerCitizenshipCodes.includes(code))) return 'ok'
    if (!slot.traveller || codes.length === 0) unvollstaendig = true
  }
  return unvollstaendig ? 'insufficient' : 'skip'
}

function evaluationAusFact(opts: {
  reise: Trip
  fact: SafetyFact
  contextFingerprint: string
  conflict: boolean
  nowMs: number
}): SafetyEvaluation {
  const kontext = safetyReisekontext(opts.reise)
  const relevanz = räumlichZeitlicheRelevanz(
    kontext,
    opts.fact.spatialScope,
    opts.fact.temporal.start,
    opts.fact.temporal.end,
    opts.fact.status,
  )
  const traveller = travellerRelevant(opts.reise, opts.fact)
  const relevance =
    traveller === 'insufficient'
      ? 'insufficient_context'
      : traveller === 'skip'
        ? 'not_affected'
        : relevanz.relevance
  const eventFingerprint = safetyEventFingerprint({
    factKey: opts.fact.factKey,
    category: opts.fact.category,
    status: opts.fact.status,
    nature: opts.fact.nature,
    updatedAt: opts.fact.evidence.updatedAt,
    checkedAt: opts.fact.evidence.checkedAt,
    validFrom: opts.fact.temporal.start,
    validUntil: opts.fact.temporal.end,
    freshUntil: opts.fact.evidence.freshUntil,
    sourceSeverity: opts.fact.sourceSeverity,
    advisoryClass: opts.fact.advisoryClass,
    travellerDependent: opts.fact.travellerDependent,
    travellerCitizenshipCodes: opts.fact.travellerCitizenshipCodes,
    vertrauenswuerdig: opts.fact.vertrauenswuerdig,
    scope: opts.fact.spatialScope,
  })
  const freshness = safetyFrische({
    storedFingerprint: opts.contextFingerprint,
    currentFingerprint: opts.contextFingerprint,
    checkedAt: opts.fact.evidence.checkedAt,
    freshUntil: opts.fact.evidence.freshUntil,
    nowMs: opts.nowMs,
    hasProvider: true,
  })
  const presentationClass = praesentationsklasseAus({
    relevance,
    freshness,
    eventStatus: opts.fact.status,
    sourceSeverity: opts.fact.sourceSeverity,
    advisoryClass: opts.fact.advisoryClass,
    category: opts.fact.category,
    conflict: opts.conflict,
    vertrauenswuerdig: opts.fact.vertrauenswuerdig,
  })
  const impact = safetyImpactAus({
    kontext,
    relevance,
    precision: relevanz.precision,
    affectedRefs: relevance === 'affected' ? relevanz.affectedRefs : [],
  })
  const evidenceStatus: SafetyEvidenceStatus =
    freshness === 'current' && opts.fact.vertrauenswuerdig && !opts.conflict
      ? 'current'
      : relevance === 'insufficient_context'
        ? 'insufficient_context'
        : 'unknown'

  return {
    factId: `safety:${opts.fact.factKey}`,
    factKey: opts.fact.factKey,
    category: opts.fact.category,
    eventStatus: opts.fact.status,
    evidenceStatus,
    freshness,
    relevance,
    spatialPrecision: relevanz.precision,
    presentationClass,
    sourceSeverity: opts.fact.sourceSeverity,
    advisoryClass: opts.fact.advisoryClass,
    authorityClass: opts.fact.evidence.authorityClass,
    affectedRefs: relevance === 'affected' ? relevanz.affectedRefs.slice(0, SAFETY_GRENZEN.maxRefs) : [],
    impact,
    reason:
      opts.conflict
        ? 'Widersprüchliche belegte Hinweise zur selben Lage. Keine eindeutige Warn- oder Entwarnentscheidung.'
        : traveller === 'insufficient'
          ? 'Der Hinweis wäre travellerabhängig, es fehlen aber belastbare Staatsbürgerschaften.'
        : relevanz.reason,
    nextAction: naechsteAktionAus(relevanz.precision, impact, relevance),
    conflict: opts.conflict,
    seasonalRejected: opts.fact.nature === 'seasonal_pattern',
    evidence: opts.fact.evidence,
    contextFingerprint: opts.contextFingerprint,
    eventFingerprint,
  }
}

function evaluationsSortieren(liste: SafetyEvaluation[]): SafetyEvaluation[] {
  const rang: Record<SafetyEvaluation['presentationClass'], number> = {
    critical_warning: 0,
    important_notice: 1,
    information: 2,
    unknown: 3,
  }
  return [...liste].sort(
    (a, b) => rang[a.presentationClass] - rang[b.presentationClass] || a.factKey.localeCompare(b.factKey),
  )
}

export function safetyAusFacts(
  reise: Trip,
  providerFacts: readonly unknown[],
  providerName: string | null,
  opts: { nowMs?: number; roh?: unknown } = {},
): SafetyEvaluation[] {
  if (opts.roh && typeof opts.roh === 'object') {
    const behauptung = opts.roh as { llmResult?: unknown; officialResult?: unknown; safetyResult?: unknown }
    void behauptung.llmResult
    void behauptung.officialResult
    void behauptung.safetyResult
  }

  const contextFingerprint = safetyContextFingerprint(reise)
  if (!providerName) {
    return [
      leerEvaluation({
        contextFingerprint,
        freshness: 'provider_unavailable',
        status: 'unavailable',
        reason: 'Kein Safety-Provider aktiv. Es wird keine Lage erfunden.',
      }),
    ]
  }

  const nowMs = opts.nowMs ?? Date.now()
  if (providerFacts.length > SAFETY_GRENZEN.maxFacts) {
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
      return safetyFactNormalisieren(zeile, providerName, nowMs)
    } catch {
      return null
    }
  })
  const valide = normalisiert.filter((fact): fact is SafetyFact => Boolean(fact))
  const ungueltig = providerFacts.length - valide.length
  const facts = valide.filter((fact) => fact.nature !== 'seasonal_pattern')
  if (facts.length === 0) {
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
    return [
      leerEvaluation({
        contextFingerprint,
        freshness: 'current',
        status: 'current',
        reason:
          'Im geprüften Reiseausschnitt liegen keine belastbaren akuten Safety-Hinweise vor. Das ist keine Entwarnung.',
        factKey: 'checked_empty',
        checkedEmpty: true,
      }),
    ]
  }

  const menge = safetyFactsDeduplizieren(facts)
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
        reason: 'Widersprüchliche belegte Hinweise zur selben Lage. Keine eindeutige Warn- oder Entwarnentscheidung.',
        factKey: key,
        conflict: true,
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

async function safetyProviderAbrufen(
  provider: SafetyProvider,
  anfrage: ReturnType<typeof providerAnfrageAusKontext>,
  timeoutMs: number,
): Promise<
  | { ok: true; facts: SafetyProviderFact[] }
  | { ok: false; art: 'timeout' | 'throw' | 'malformed' }
> {
  const stopper = new AbortController()
  const timer = setTimeout(() => stopper.abort(), timeoutMs)
  const onAbort = () => {
    /* AbortSignal bricht den Adapter ab; die Race-Ablehnung folgt separat. */
  }
  stopper.signal.addEventListener('abort', onAbort, { once: true })
  try {
    const zeilen = await new Promise<SafetyProviderFact[]>((resolve, reject) => {
      const timeoutFehler = Object.assign(new Error('safety-timeout'), { name: 'SafetyProviderTimeout' })
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
    if (fehler && typeof fehler === 'object' && 'name' in fehler && fehler.name === 'SafetyProviderTimeout') {
      return { ok: false, art: 'timeout' }
    }
    return { ok: false, art: 'throw' }
  } finally {
    clearTimeout(timer)
    stopper.abort()
    stopper.signal.removeEventListener('abort', onAbort)
  }
}

export async function safetyAuswerten(
  reise: Trip,
  provider: SafetyProvider | null = safetyProviderAus(),
  roh: unknown = null,
  nowMs = Date.now(),
  timeoutMs: number = SAFETY_GRENZEN.providerTimeoutMs,
): Promise<SafetyEvaluation[]> {
  const contextFingerprint = safetyContextFingerprint(reise)
  if (!provider) return safetyAusFacts(reise, [], null, { nowMs, roh })
  const kontext = safetyReisekontext(reise)
  const gelesen = await safetyProviderAbrufen(
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
              ? 'Die Safety-Quelle hat nicht rechtzeitig geantwortet. Es wird keine Lage erfunden.'
              : 'Die Safety-Quelle ist vorübergehend nicht erreichbar. Es wird keine Lage erfunden.',
      }),
    ]
  }
  return safetyAusFacts(reise, gelesen.facts, provider.name, { nowMs, roh })
}

export function safetyLokalFuerReise(reise: Trip): SafetyEvaluation[] {
  return safetyAusFacts(reise, [], null)
}
