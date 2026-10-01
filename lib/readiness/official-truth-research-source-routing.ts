// lib/readiness/official-truth-research-source-routing.ts
//
// Verbindet eine bestehende Forschungsanfrage mit dem vorhandenen Quellen-Router.
// Die Anfrage bleibt die Anfrage. Diese Datei ruft keine Quelle auf, speichert
// nichts und bewertet keine Einreisewirkung. Eine passende Behörde wird genannt.
// Keine passende Behörde bleibt ohne Quelle. Ein lizenzierter Anbieter wird
// dadurch keine Behörde und kann diese Anfrage nicht erfüllen.

import type { OfficialTruthAbdeckungNeuPruefen } from '@/lib/readiness/official-truth-coverage'
import {
  officialTruthRechercheEntscheiden,
  type OfficialTruthRechercheAnfrage,
  type OfficialTruthRechercheGrund,
} from '@/lib/readiness/official-truth-research-request'
import { REGEL_FAKT_ARTEN, REGEL_SCOPE_PRAEFIX, regelScopeAusEvidenceScope, type RegelFaktArt, type RegelScope } from '@/lib/readiness/rule-claims'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'
import { quellenRouten, type QuellenDeskriptor } from '@/lib/readiness/source-router'

const ANFRAGE_FELDER = ['key', 'ruleScopeKey', 'factKind', 'scope', 'researchReason', 'evidenceClass'] as const
const ANFRAGE_KEY = /^research-request:v1:[a-f0-9]{64}$/
const REGEL_KEY = new RegExp(`^${REGEL_SCOPE_PRAEFIX}[a-f0-9]{64}$`)
const EVIDENZ_KLASSE = 'official_authority' as const

/**
 * Dieselbe geschlossene Menge wie die Forschungsanfrage.
 * Ein unbekannter Grund ist keine Anfrage und wird nicht geroutet.
 */
const NEU_PRUEFEN = {
  valid_from_in_future: true,
  valid_until_elapsed: true,
  max_age_exceeded: true,
} as const satisfies Record<OfficialTruthAbdeckungNeuPruefen, true>

export type OfficialTruthRechercheRoutenSperrgrund = 'invalid_request' | 'scope_mismatch' | 'invalid_source_plan'

/**
 * Eine Routenentscheidung für genau eine bereits gebaute Forschungsanfrage.
 * `sourceIds` ist stabile Sortierung, keine Präferenz und keine Abrufliste.
 * Faktart und Forschungsgrund bleiben an der Anfrage. Sie ändern die Abdeckung nicht.
 */
export type OfficialTruthRechercheRoutenEntscheidung =
  | {
      status: 'eligible_official_sources' | 'no_eligible_official_source'
      sourceIds: readonly string[]
      requestKey: string
      ruleScopeKey: string
      factKind: RegelFaktArt
      researchReason: OfficialTruthRechercheGrund
    }
  | {
      status: 'blocked_invalid'
      reason: OfficialTruthRechercheRoutenSperrgrund
    }

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  return wert as Record<string, unknown>
}

function genaueSchluessel(satz: Record<string, unknown>, erlaubt: readonly string[]): boolean {
  const namen = Object.keys(satz)
  return namen.length === erlaubt.length && erlaubt.every((name) => Object.hasOwn(satz, name))
}

function istFaktArt(wert: unknown): wert is RegelFaktArt {
  return typeof wert === 'string' && (REGEL_FAKT_ARTEN as readonly string[]).includes(wert)
}

function istNeuPruefen(wert: unknown): wert is OfficialTruthAbdeckungNeuPruefen {
  return typeof wert === 'string' && Object.hasOwn(NEU_PRUEFEN, wert)
}

function sperre(reason: OfficialTruthRechercheRoutenSperrgrund): OfficialTruthRechercheRoutenEntscheidung {
  return Object.freeze({ status: 'blocked_invalid', reason })
}

function grundLesen(wert: unknown): OfficialTruthRechercheGrund | null {
  const satz = datensatz(wert)
  if (!satz) return null
  if (satz.status === 'missing' && genaueSchluessel(satz, ['status'])) return { status: 'missing' }
  if (satz.status === 'recheck_needed' && genaueSchluessel(satz, ['status', 'reason']) && istNeuPruefen(satz.reason)) {
    return { status: 'recheck_needed', reason: satz.reason }
  }
  return null
}

function gleicherGrund(links: OfficialTruthRechercheGrund, rechts: OfficialTruthRechercheGrund): boolean {
  if (links.status !== rechts.status) return false
  if (links.status === 'missing') return true
  return rechts.status === 'recheck_needed' && links.reason === rechts.reason
}

function grundKopieren(grund: OfficialTruthRechercheGrund): OfficialTruthRechercheGrund {
  if (grund.status === 'recheck_needed') return Object.freeze({ status: 'recheck_needed', reason: grund.reason })
  return Object.freeze({ status: 'missing' })
}

/**
 * Die Anfrage muss dieselbe Zelle sein, die der bestehende Vertrag bauen würde.
 * Der Schlüssel bleibt in jenem Modul. Hier wird er nicht nachgerechnet.
 */
function anfrageBelegen(wert: unknown): { ok: true; request: OfficialTruthRechercheAnfrage } | { ok: false; reason: 'invalid_request' | 'scope_mismatch' } {
  const satz = datensatz(wert)
  if (!satz || !genaueSchluessel(satz, ANFRAGE_FELDER)) return { ok: false, reason: 'invalid_request' }
  if (typeof satz.key !== 'string' || !ANFRAGE_KEY.test(satz.key)) return { ok: false, reason: 'invalid_request' }
  if (typeof satz.ruleScopeKey !== 'string' || !REGEL_KEY.test(satz.ruleScopeKey)) return { ok: false, reason: 'invalid_request' }
  if (!istFaktArt(satz.factKind) || satz.evidenceClass !== EVIDENZ_KLASSE) return { ok: false, reason: 'invalid_request' }
  const grund = grundLesen(satz.researchReason)
  if (!grund) return { ok: false, reason: 'invalid_request' }

  const abdeckung =
    grund.status === 'missing'
      ? { status: 'missing' as const, ruleScopeKey: satz.ruleScopeKey, factKind: satz.factKind }
      : { status: 'recheck_needed' as const, ruleScopeKey: satz.ruleScopeKey, factKind: satz.factKind, reason: grund.reason }
  const entschieden = officialTruthRechercheEntscheiden(abdeckung, satz.scope as RegelScope)
  if (entschieden.action !== 'research') {
    if (entschieden.action === 'blocked_invalid' && entschieden.reason === 'research_scope_mismatch') {
      return { ok: false, reason: 'scope_mismatch' }
    }
    return { ok: false, reason: 'invalid_request' }
  }

  const request = entschieden.request
  if (request.key !== satz.key || request.factKind !== satz.factKind || request.evidenceClass !== EVIDENZ_KLASSE) {
    return { ok: false, reason: 'invalid_request' }
  }
  if (request.ruleScopeKey !== satz.ruleScopeKey || !gleicherGrund(request.researchReason, grund)) {
    return { ok: false, reason: 'invalid_request' }
  }
  return { ok: true, request }
}

function planLesen(
  registry: unknown,
  deskriptoren: unknown,
): { ok: true; registry: QuellenRegistry; deskriptoren: readonly QuellenDeskriptor[] } | { ok: false } {
  const satz = datensatz(registry)
  if (!satz || !Array.isArray(satz.sources) || !Array.isArray(satz.blockedDomains)) return { ok: false }
  for (const quelle of satz.sources) {
    const eintrag = datensatz(quelle)
    if (!eintrag || typeof eintrag.sourceId !== 'string' || typeof eintrag.sourceClass !== 'string' || !Array.isArray(eintrag.domains)) {
      return { ok: false }
    }
  }
  if (!Array.isArray(deskriptoren)) return { ok: false }
  for (const eintrag of deskriptoren) {
    const deskriptor = datensatz(eintrag)
    if (!deskriptor) return { ok: false }
    const source = datensatz(deskriptor.source)
    const coverage = datensatz(deskriptor.coverage)
    if (!source || !Array.isArray(source.domains) || !coverage) return { ok: false }
    if (!Array.isArray(coverage.destinationCountryCodes) || !Array.isArray(coverage.transitCountryCodes)) return { ok: false }
    if (!Array.isArray(coverage.requirementTypes) || !datensatz(coverage.citizenship) || !datensatz(coverage.residence)) {
      return { ok: false }
    }
    if (!datensatz(coverage.documents)) return { ok: false }
  }
  return {
    ok: true,
    registry: registry as QuellenRegistry,
    deskriptoren: deskriptoren as readonly QuellenDeskriptor[],
  }
}

/**
 * Eine Zelle, in der Form, die `quellenRouten` schon versteht.
 * Die Felder kommen aus dem belegten Scope. Es wird keine zweite Option ergänzt.
 * `required` ist der bestehende Router-Eingabemodus für eine explizite Dokumentoption.
 */
function routerEingabe(scope: RegelScope): Record<string, unknown> {
  const option = scope.credentialOption
  return {
    destinationCountryCode: scope.destinationCountryCode,
    transitCountryCode: scope.transitCountryCode,
    citizenship: scope.citizenship,
    credentialOptions:
      option.mode === 'not_applicable'
        ? { mode: 'not_applicable' }
        : {
            mode: 'required',
            options: [
              {
                documentType: option.documentType,
                issuingCountryCode: option.issuingCountryCode,
                relatedCitizenshipCountryCode: option.relatedCitizenshipCountryCode,
              },
            ],
          },
    residence: scope.residence,
    requirementType: scope.requirementType,
    validity: scope.validity,
  }
}

function offizielleKennungen(registry: QuellenRegistry): ReadonlySet<string> {
  const ids = new Set<string>()
  for (const quelle of registry.sources) {
    if (quelle.sourceClass === EVIDENZ_KLASSE) ids.add(quelle.sourceId)
  }
  return ids
}

function stabileIds(ids: readonly string[], offiziell: ReadonlySet<string>): string[] {
  const gesehen = new Set<string>()
  const ergebnis: string[] = []
  for (const id of ids) {
    if (!offiziell.has(id) || gesehen.has(id)) continue
    gesehen.add(id)
    ergebnis.push(id)
  }
  ergebnis.sort((links, rechts) => (links < rechts ? -1 : links > rechts ? 1 : 0))
  return ergebnis
}

function treffer(
  sourceIds: readonly string[],
  request: OfficialTruthRechercheAnfrage,
): OfficialTruthRechercheRoutenEntscheidung {
  return Object.freeze({
    status: sourceIds.length > 0 ? 'eligible_official_sources' : 'no_eligible_official_source',
    sourceIds: Object.freeze([...sourceIds]),
    requestKey: request.key,
    ruleScopeKey: request.ruleScopeKey,
    factKind: request.factKind,
    researchReason: grundKopieren(request.researchReason),
  })
}

/**
 * Welche bereits registrierten Behörden diese eine Forschungsanfrage prüfen dürfen.
 * Die Abdeckung entscheidet `quellenRouten`. Diese Funktion behält davon nur
 * `official_authority` und prüft, dass die Zelle dieselbe bleibt.
 * Keine Adresse, keine Reihenfolge als Empfehlung, kein Speicher.
 */
export function officialTruthRechercheQuellenRouten(
  anfrage: unknown,
  registry: unknown,
  deskriptoren: unknown,
): OfficialTruthRechercheRoutenEntscheidung {
  const belegt = anfrageBelegen(anfrage)
  if (!belegt.ok) return sperre(belegt.reason)

  const planEingabe = planLesen(registry, deskriptoren)
  if (!planEingabe.ok) return sperre('invalid_source_plan')

  const plan = quellenRouten(planEingabe.registry, planEingabe.deskriptoren, routerEingabe(belegt.request.scope))
  if (plan.reason !== 'ok' && plan.reason !== 'no_source_coverage') return sperre('invalid_source_plan')
  if (plan.cells.length !== 1) return sperre('invalid_source_plan')

  const zelle = plan.cells[0]
  const gelesen = regelScopeAusEvidenceScope(zelle.atom)
  if (!gelesen.ok || gelesen.key !== belegt.request.ruleScopeKey) return sperre('invalid_source_plan')

  const sourceIds = stabileIds(zelle.sourceIds, offizielleKennungen(planEingabe.registry))
  return treffer(sourceIds, belegt.request)
}
