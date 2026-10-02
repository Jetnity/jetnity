// lib/readiness/official-truth-store-server.ts
//
// Ruhender, serverseitiger Schreiber für bereits akzeptierte Official Truth.
// Akzeptierte Evidence kommt nur aus officialTruthServerHeldEvidenceAnnehmen.
// Ein freies Evidence-Objekt und eine Aufrufer-Registry sind kein Argument.
// Regel-Claims bleiben der bestehende ruhende Weg über regelKandidatAkzeptieren.
// Diese Datei entscheidet keine Regel neu und fügt keinen neuen Annahmeweg hinzu.
// Der Requirements-Provider bleibt aus. Kein Import. Der Katalogzugriff bleibt
// in der Servergrenze. Dieser Evidence-Weg kann zuerst den servergehaltenen
// Quellenkatalog-RPC nutzen und danach den Speicher-RPC, den Speicher-RPC nur
// nach Beweis.

import 'server-only'

import { createClient } from '@supabase/supabase-js'

import { type EvidenceAtom, type EvidenceVersion } from '@/lib/readiness/evidence'
import { officialTruthServerHeldEvidenceAnnehmen } from '@/lib/readiness/official-truth-server-held-source-registry'
import {
  type OfficialTruthSourceCatalogAbhaengigkeiten,
} from '@/lib/readiness/official-truth-source-catalog-server'
import {
  regelKandidatAkzeptieren,
  regelScopeAusEvidenceScope,
  type AkzeptierteRegelClaim,
  type RegelFakt,
} from '@/lib/readiness/rule-claims'

/**
 * Derselbe Name wie das String-Literal im rpc()-Aufruf. Der Aufruf selbst bleibt
 * literal, damit check:schema-bezug ihn sieht. Die Konstante ist kein zweiter Weg.
 */
export const OFFICIAL_TRUTH_STORE_ACCEPTED_V1 = 'official_truth_store_accepted_v1'

const DIENST_URL = 'NEXT_PUBLIC_SUPABASE_URL'
const DIENST_GEHEIM = 'SUPABASE_SERVICE_ROLE_KEY'

export type OfficialTruthStoreTransport = {
  aufrufen(payload: Readonly<Record<string, unknown>>): Promise<
    { ok: true; antwort: unknown } | { ok: false }
  >
}

export type OfficialTruthStoreAbhaengigkeiten = {
  transport?: OfficialTruthStoreTransport
  env?: Record<string, string | undefined>
  jetzt?: () => string
}

/**
 * Abhängigkeiten des Evidence-Schreibers. `transport` ist der ruhende Speicher.
 * `katalog` ist die servergehaltene Katalogabhängigkeit, keine Anfrageautorität.
 */
export type OfficialTruthEvidenceStoreAbhaengigkeiten = {
  transport?: OfficialTruthStoreTransport
  env?: Record<string, string | undefined>
  katalog?: OfficialTruthSourceCatalogAbhaengigkeiten
}

const AUTORITAET = ['registry', 'sourceClass', 'domains', 'blockedDomains'] as const

export type OfficialTruthStoreErgebnis =
  | {
      ok: true
      operation: 'accepted_evidence'
      outcome: 'inserted' | 'idempotent'
      versionId: string
      ruleScopeKey: string
    }
  | {
      ok: true
      operation: 'accepted_rule_claim'
      outcome: 'inserted' | 'idempotent'
      claimId: string
      ruleScopeKey: string
    }
  | { ok: false; reason: string }

function scopeSpalten(scope: EvidenceAtom): Record<string, unknown> {
  const citizenship = scope.citizenship
  const option = scope.credentialOption
  const residence = scope.residence
  const validity = scope.validity
  return {
    destination_country_code: scope.destinationCountryCode,
    transit_country_code: scope.transitCountryCode,
    citizenship_mode: citizenship.mode,
    citizenship_country_codes: citizenship.mode === 'required' ? [...citizenship.countryCodes] : [],
    credential_option_mode: option.mode,
    document_type: option.mode === 'option' ? option.documentType : null,
    issuing_country_code: option.mode === 'option' ? option.issuingCountryCode : null,
    related_citizenship_country_code: option.mode === 'option' ? option.relatedCitizenshipCountryCode : null,
    residence_mode: residence.mode,
    residence_country_code: residence.mode === 'required' ? residence.countryCode : null,
    requirement_type: scope.requirementType,
    validity_mode: validity.mode,
    travel_date: validity.mode === 'travel_date' ? validity.travelDate : null,
  }
}

function faktSpalten(fact: RegelFakt): Record<string, unknown> {
  if (fact.kind === 'requirement_effect') {
    return { effect: fact.effect, visa_mode: fact.visaMode }
  }
  if (fact.kind === 'visa_options') {
    return {
      options: fact.options.map((option, index) => ({
        ordinal: index + 1,
        visa_mode: option.visaMode,
        eligibility: option.eligibility,
        mandate: option.mandate,
      })),
    }
  }
  if (fact.kind === 'stay_limit') {
    return {
      per_visit_value: fact.perVisit ? fact.perVisit.value : null,
      per_visit_unit: fact.perVisit ? fact.perVisit.unit : null,
      rolling_maximum_value: fact.rollingWindow ? fact.rollingWindow.maximum.value : null,
      rolling_maximum_unit: fact.rollingWindow ? fact.rollingWindow.maximum.unit : null,
      rolling_within_value: fact.rollingWindow ? fact.rollingWindow.within.value : null,
      rolling_within_unit: fact.rollingWindow ? fact.rollingWindow.within.unit : null,
      initial_grant_value: fact.initialGrant ? fact.initialGrant.value : null,
      initial_grant_unit: fact.initialGrant ? fact.initialGrant.unit : null,
      extension_requires_application: fact.extension ? fact.extension.requiresApplication : null,
      extension_maximum_total_value: fact.extension ? fact.extension.maximumTotal.value : null,
      extension_maximum_total_unit: fact.extension ? fact.extension.maximumTotal.unit : null,
      border_discretion: fact.borderDiscretion,
    }
  }
  if (fact.kind === 'passport_validity') {
    return {
      semantics: fact.semantics,
      duration_value: fact.duration ? fact.duration.value : null,
      duration_unit: fact.duration ? fact.duration.unit : null,
    }
  }
  if (fact.kind === 'blank_passport_pages') {
    return { minimum_pages: fact.minimumPages }
  }
  if (fact.kind === 'transit_conditions') {
    return {
      paths: fact.paths.map((path, index) => ({
        ordinal: index + 1,
        crosses_border_control: path.crossesBorderControl,
        leaves_transit_area: path.leavesTransitArea,
        transit_airport_codes: path.transitAirportCodes ? [...path.transitAirportCodes] : null,
        max_transit_duration_minutes: path.maxTransitDurationMinutes,
        arrival_mode: path.arrivalMode,
        departure_mode: path.departureMode,
        third_country_required: path.thirdCountryRequired,
        same_flight_required: path.sameFlightRequired,
        onward_ticket_required: path.onwardTicketRequired,
      })),
    }
  }
  if (fact.kind === 'official_actions') {
    return {
      actions: fact.actions.map((action, index) => ({
        ordinal: index + 1,
        action_source_id: action.actionSourceId,
        purpose: action.purpose,
        href: action.href,
        visa_mode: action.visaMode,
      })),
    }
  }
  const regel = fact.rule
  return {
    temporal_kind: regel.kind,
    available_from_anchor: regel.availableFrom ? regel.availableFrom.anchor : null,
    available_from_relation: regel.availableFrom ? regel.availableFrom.relation : null,
    available_from_offset_minutes: regel.availableFrom ? regel.availableFrom.offsetMinutes : null,
    due_by_anchor: regel.dueBy ? regel.dueBy.anchor : null,
    due_by_relation: regel.dueBy ? regel.dueBy.relation : null,
    due_by_offset_minutes: regel.dueBy ? regel.dueBy.offsetMinutes : null,
    due_by_semantics: regel.dueBy ? regel.dueBy.semantics : null,
  }
}

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  const prototyp = Object.getPrototypeOf(wert)
  if (prototyp !== Object.prototype && prototyp !== null) return null
  return wert as Record<string, unknown>
}

function hatAutoritaet(satz: Record<string, unknown> | null): boolean {
  if (!satz) return false
  return AUTORITAET.some((name) => Object.hasOwn(satz, name))
}

function evidencePayload(evidence: EvidenceVersion, ruleScopeKey: string): Record<string, unknown> {
  return {
    operation: 'accepted_evidence',
    evidence: {
      version_id: evidence.versionId,
      previous_version_id: evidence.previousVersionId,
      lifecycle: evidence.lifecycle,
      validation_state: evidence.validationState,
      source_id: evidence.sourceId,
      canonical_url: evidence.canonicalUrl,
      retrieved_at: evidence.retrievedAt,
      source_content_hash: evidence.sourceContentHash,
      valid_from: evidence.validFrom,
      valid_until: evidence.validUntil,
      lookup_key: evidence.lookupKey,
      extraction_note: evidence.extractionNote,
      rule_scope_key: ruleScopeKey,
      ...scopeSpalten(evidence.scope),
    },
  }
}

function claimPayload(claim: AkzeptierteRegelClaim, acceptedAt: string): Record<string, unknown> {
  return {
    operation: 'accepted_rule_claim',
    accepted_at: acceptedAt,
    claim: {
      rule_scope_key: claim.key,
      fact_kind: claim.factKind,
      evidence_quality: claim.evidenceQuality,
      lifecycle: claim.lifecycle,
      validation_state: claim.validationState,
      ...scopeSpalten(claim.scope),
      support_version_ids: [...claim.supportVersionIds],
      fact: faktSpalten(claim.fact),
    },
  }
}

function dienstTransport(env: Record<string, string | undefined>): OfficialTruthStoreTransport | null {
  const url = env[DIENST_URL]?.trim()
  const geheim = env[DIENST_GEHEIM]?.trim()
  if (!url || !geheim) return null

  const erzeugt = createClient(url, geheim, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  return {
    async aufrufen(payload) {
      const { data, error } = await erzeugt.rpc('official_truth_store_accepted_v1', {
        payload: { ...payload },
      })
      if (error) return { ok: false }
      return { ok: true, antwort: data }
    },
  }
}

function transportAus(
  deps: { transport?: OfficialTruthStoreTransport; env?: Record<string, string | undefined> } | undefined,
): OfficialTruthStoreTransport | null {
  if (deps?.transport) return deps.transport
  return dienstTransport(deps?.env ?? process.env)
}

function katalogAbhaengigkeit(
  deps: OfficialTruthEvidenceStoreAbhaengigkeiten | undefined,
): OfficialTruthSourceCatalogAbhaengigkeiten | undefined {
  if (!deps) return undefined
  if (deps.katalog) {
    const transport = deps.katalog.transport
    const env = deps.katalog.env
    return {
      ...(transport ? { transport } : {}),
      ...(env ? { env } : {}),
    }
  }
  if (deps.env) return { env: deps.env }
  return undefined
}

function ausgang(operation: string, antwort: unknown, ruleScopeKey: string, versionId: string | null): OfficialTruthStoreErgebnis {
  if (!antwort || typeof antwort !== 'object' || Array.isArray(antwort)) return { ok: false, reason: 'store_failed' }
  const satz = antwort as Record<string, unknown>
  if (satz.ok !== true || satz.operation !== operation) return { ok: false, reason: 'store_failed' }
  if (satz.outcome !== 'inserted' && satz.outcome !== 'idempotent') return { ok: false, reason: 'store_failed' }
  if (operation === 'accepted_evidence') {
    if (satz.version_id !== versionId || typeof versionId !== 'string') return { ok: false, reason: 'store_failed' }
    return {
      ok: true,
      operation: 'accepted_evidence',
      outcome: satz.outcome,
      versionId,
      ruleScopeKey,
    }
  }
  if (typeof satz.claim_id !== 'number' && typeof satz.claim_id !== 'string') return { ok: false, reason: 'store_failed' }
  return {
    ok: true,
    operation: 'accepted_rule_claim',
    outcome: satz.outcome,
    claimId: String(satz.claim_id),
    ruleScopeKey,
  }
}

/**
 * Beweist akzeptierte Evidence neu aus dem registryfreien Abruf und speichert
 * nur dieses zurückgegebene Objekt plus den davon abgeleiteten rule_scope_key.
 * Hash, Version, Lebenszyklus und Lookup kommen nicht aus dem Aufruf.
 */
export async function akzeptierteEvidenceSpeichern(
  umschlag: unknown,
  uhr: unknown,
  extraktion: unknown,
  abhaengigkeiten?: OfficialTruthEvidenceStoreAbhaengigkeiten,
): Promise<OfficialTruthStoreErgebnis> {
  if (hatAutoritaet(datensatz(abhaengigkeiten)) || hatAutoritaet(datensatz(abhaengigkeiten?.katalog))) {
    return { ok: false, reason: 'caller_authority_forbidden' }
  }
  const angenommen = await officialTruthServerHeldEvidenceAnnehmen(
    umschlag,
    uhr,
    extraktion,
    katalogAbhaengigkeit(abhaengigkeiten),
  )
  if (angenommen.status !== 'accepted_evidence') return { ok: false, reason: angenommen.reason }
  const evidence = angenommen.evidence
  const scope = regelScopeAusEvidenceScope(evidence.scope)
  if (!scope.ok) return { ok: false, reason: scope.reason }
  const transport = transportAus(abhaengigkeiten)
  if (!transport) return { ok: false, reason: 'store_not_configured' }
  let antwort: { ok: true; antwort: unknown } | { ok: false }
  try {
    antwort = await transport.aufrufen(evidencePayload(evidence, scope.key))
  } catch {
    return { ok: false, reason: 'store_failed' }
  }
  if (!antwort.ok) return { ok: false, reason: 'store_failed' }
  return ausgang('accepted_evidence', antwort.antwort, scope.key, evidence.versionId)
}

/**
 * Nimmt einen Regel-Kandidaten über regelKandidatAkzeptieren an und speichert
 * nur den zurückgegebenen Claim. Stützen sind dessen versionIds. Die Quellenklasse
 * löst das Gateway aus der schon gespeicherten Evidence auf.
 */
export async function akzeptierteRegelClaimSpeichern(
  eingabe: unknown,
  abhaengigkeiten?: OfficialTruthStoreAbhaengigkeiten,
): Promise<OfficialTruthStoreErgebnis> {
  const angenommen = regelKandidatAkzeptieren(eingabe)
  if (!angenommen.ok) return { ok: false, reason: angenommen.reason }
  const transport = transportAus(abhaengigkeiten)
  if (!transport) return { ok: false, reason: 'store_not_configured' }
  const jetzt = abhaengigkeiten?.jetzt ?? (() => new Date().toISOString())
  let antwort: { ok: true; antwort: unknown } | { ok: false }
  try {
    antwort = await transport.aufrufen(claimPayload(angenommen.claim, jetzt()))
  } catch {
    return { ok: false, reason: 'store_failed' }
  }
  if (!antwort.ok) return { ok: false, reason: 'store_failed' }
  return ausgang('accepted_rule_claim', antwort.antwort, angenommen.claim.key, null)
}
