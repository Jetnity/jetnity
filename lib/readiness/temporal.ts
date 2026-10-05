// lib/readiness/temporal.ts
//
// Provider-neutrale relative Official Temporal Rules.
// Nur explizite strukturierte Metadaten. Kein Timestamp, keine Notification.
// Frei von Next.

import { landescodeLesen } from '@/lib/readiness/domain'
import { sha256Hex } from '@/lib/readiness/digest'
import {
  civilDateOrdinalLesen, schema2DatenPruefen, schema2Kanonisch,
  type V2BlockReason, type V2LeseErgebnis,
} from '@/lib/readiness/regulierungs-anwendbarkeit'

export const OFFICIAL_TEMPORAL_KIND = 'relative_duration' as const
export type OfficialTemporalKind = typeof OFFICIAL_TEMPORAL_KIND

export const OFFICIAL_TEMPORAL_ANCHORS = [
  'trip_departure',
  'destination_arrival',
  'transit_arrival',
  'border_crossing',
] as const
export type OfficialTemporalAnchor = (typeof OFFICIAL_TEMPORAL_ANCHORS)[number]

export const OFFICIAL_TEMPORAL_RELATIONS = ['before', 'at', 'after'] as const
export type OfficialTemporalRelation = (typeof OFFICIAL_TEMPORAL_RELATIONS)[number]

export const OFFICIAL_TEMPORAL_DUE_SEMANTICS = ['mandatory', 'recommended'] as const
export type OfficialTemporalDueSemantics = (typeof OFFICIAL_TEMPORAL_DUE_SEMANTICS)[number]

/**
 * Technische Safety-Bound, keine fachliche Frist.
 * Offsets darüber gelten als unplausibel und werden verworfen.
 * 2 × 365 × 24 × 60 = 1_051_200 Minuten.
 */
export const OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES = 2 * 365 * 24 * 60

export type OfficialTemporalPunkt = {
  anchor: OfficialTemporalAnchor
  relation: OfficialTemporalRelation
  offsetMinutes: number
}

export type OfficialTemporalDueBy = OfficialTemporalPunkt & {
  semantics: OfficialTemporalDueSemantics
}

export type OfficialTemporalRule = {
  kind: OfficialTemporalKind
  availableFrom: OfficialTemporalPunkt | null
  dueBy: OfficialTemporalDueBy | null
}

function istAnker(wert: unknown): wert is OfficialTemporalAnchor {
  return typeof wert === 'string' && (OFFICIAL_TEMPORAL_ANCHORS as readonly string[]).includes(wert)
}

function istRelation(wert: unknown): wert is OfficialTemporalRelation {
  return typeof wert === 'string' && (OFFICIAL_TEMPORAL_RELATIONS as readonly string[]).includes(wert)
}

function istDueSemantics(wert: unknown): wert is OfficialTemporalDueSemantics {
  return typeof wert === 'string' && (OFFICIAL_TEMPORAL_DUE_SEMANTICS as readonly string[]).includes(wert)
}

function offsetMinutesLesen(wert: unknown, relation: OfficialTemporalRelation): number | null {
  if (typeof wert !== 'number') return null
  if (!Number.isFinite(wert) || !Number.isInteger(wert)) return null
  if (relation === 'at') return wert === 0 ? 0 : null
  if (wert <= 0 || wert > OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES) return null
  return wert
}

function punktLesen(roh: unknown): OfficialTemporalPunkt | null {
  if (!roh || typeof roh !== 'object') return null
  const objekt = roh as { anchor?: unknown; relation?: unknown; offsetMinutes?: unknown }
  if (!istAnker(objekt.anchor) || !istRelation(objekt.relation)) return null
  const offsetMinutes = offsetMinutesLesen(objekt.offsetMinutes, objekt.relation)
  if (offsetMinutes == null) return null
  return {
    anchor: objekt.anchor,
    relation: objekt.relation,
    offsetMinutes,
  }
}

function dueByLesen(roh: unknown): OfficialTemporalDueBy | null {
  if (!roh || typeof roh !== 'object') return null
  const objekt = roh as { semantics?: unknown }
  const punkt = punktLesen(roh)
  if (!punkt || !istDueSemantics(objekt.semantics)) return null
  return { ...punkt, semantics: objekt.semantics }
}

/**
 * Same-Anchor-Position: `before = -offset`, `at = 0`, `after = +offset`.
 * Nur innerhalb desselben Anchors vergleichbar. Unterschiedliche Anchors
 * werden in E4 nicht geordnet – dafür fehlen Event-Timestamps.
 */
function relativePositionMinutes(punkt: OfficialTemporalPunkt): number {
  if (punkt.relation === 'before') return -punkt.offsetMinutes
  if (punkt.relation === 'after') return punkt.offsetMinutes
  return 0
}

function sameAnchorFensterIstMoeglich(
  availableFrom: OfficialTemporalPunkt | null,
  dueBy: OfficialTemporalDueBy | null,
): boolean {
  if (!availableFrom || !dueBy) return true
  if (availableFrom.anchor !== dueBy.anchor) return true
  return relativePositionMinutes(availableFrom) <= relativePositionMinutes(dueBy)
}

/**
 * Fail-closed Parser. Unsupported kinds, Freitext, Marketingwerte,
 * Floats, NaN, Infinity, negative/0 before/after, nonzero at,
 * fehlende dueBy-Semantik, leere Regeln und unmögliche Same-Anchor-
 * Fenster (availableFrom > dueBy) werden null.
 * Liest weder URL, Requirement-Typ, validFrom/validUntil noch LLM-Text.
 */
export function temporalRuleLesen(wert: unknown): OfficialTemporalRule | null {
  if (wert == null || typeof wert !== 'object') return null
  const objekt = wert as {
    kind?: unknown
    availableFrom?: unknown
    dueBy?: unknown
  }
  if (objekt.kind !== OFFICIAL_TEMPORAL_KIND) return null
  const hatAvailable = objekt.availableFrom != null && objekt.availableFrom !== ''
  const hatDue = objekt.dueBy != null && objekt.dueBy !== ''
  if (!hatAvailable && !hatDue) return null
  const availableFrom = hatAvailable ? punktLesen(objekt.availableFrom) : null
  if (hatAvailable && !availableFrom) return null
  const dueBy = hatDue ? dueByLesen(objekt.dueBy) : null
  if (hatDue && !dueBy) return null
  if (!availableFrom && !dueBy) return null
  if (!sameAnchorFensterIstMoeglich(availableFrom, dueBy)) return null
  return {
    kind: OFFICIAL_TEMPORAL_KIND,
    availableFrom,
    dueBy,
  }
}

function temporalRuleSchluessel(regel: OfficialTemporalRule | null | undefined): string {
  if (!regel) return 'null'
  const punkt = (wert: OfficialTemporalPunkt | null) =>
    wert ? `${wert.anchor}|${wert.relation}|${wert.offsetMinutes}` : ''
  const due = regel.dueBy ? `${punkt(regel.dueBy)}|${regel.dueBy.semantics}` : ''
  return `${regel.kind}|from=${punkt(regel.availableFrom)}|due=${due}`
}

export function temporalRulesGleich(
  links: OfficialTemporalRule | null | undefined,
  rechts: OfficialTemporalRule | null | undefined,
): boolean {
  return temporalRuleSchluessel(links) === temporalRuleSchluessel(rechts)
}

export function officialDarfTemporalTragen(evaluation: {
  result: string
  status: string
  freshness: string
}): boolean {
  return (
    evaluation.status === 'current' &&
    evaluation.freshness === 'current' &&
    (evaluation.result === 'required' || evaluation.result === 'conditional')
  )
}

function ankerText(anker: OfficialTemporalAnchor): string {
  if (anker === 'trip_departure') return 'Abreise'
  if (anker === 'destination_arrival') return 'Ankunft'
  if (anker === 'transit_arrival') return 'Transit-Ankunft'
  return 'Grenzübertritt'
}

/**
 * Tage nur ab 4 ganzen Tagen (96 Std.), damit 24/48/72-Stunden-Fenster
 * als Stunden bleiben. Keine Kalenderdaten, keine Uhrzeiten.
 */
function dauerText(minuten: number): string {
  if (minuten % 60 === 0) {
    const stunden = minuten / 60
    if (stunden % 24 === 0 && stunden >= 96) {
      const tage = stunden / 24
      return tage === 1 ? '1 Tag' : `${tage} Tage`
    }
    return `${stunden} Std.`
  }
  return `${minuten} Min.`
}

function relativText(punkt: OfficialTemporalPunkt): string {
  const anker = ankerText(punkt.anchor)
  if (punkt.relation === 'at') return `bei ${anker}`
  const dauer = dauerText(punkt.offsetMinutes)
  if (punkt.relation === 'before') return `${dauer} vor ${anker}`
  return `${dauer} nach ${anker}`
}

export function officialTemporalTexte(regel: OfficialTemporalRule | null | undefined): string[] {
  if (!regel) return []
  const texte: string[] = []
  if (regel.availableFrom) {
    if (regel.availableFrom.relation === 'at') {
      texte.push(`Möglich ${relativText(regel.availableFrom)}`)
    } else {
      texte.push(`Ab ${relativText(regel.availableFrom)} möglich`)
    }
  }
  if (regel.dueBy) {
    const relativ = relativText(regel.dueBy)
    if (regel.dueBy.semantics === 'mandatory') {
      texte.push(`Pflichtfrist: spätestens ${relativ}`)
    } else {
      texte.push(`Empfohlen bis: ${relativ}`)
    }
  }
  return texte
}

// Eigenständiger Schema-2-Vertrag; relative_duration und UI-Projektion bleiben v1.
export type EventDeadlineV2 = {
  schema: 2
  kind: 'event_deadline'
  action: 'stay_extension_application'
  reference: { event: 'current_stay_permission_expiry'; countryCode: string }
  relation: 'before'
  semantics: 'mandatory' | 'recommended'
}
export type PermissionExpiryContextV2 = {
  schema: 2
  visitCountryCode: string
  permissionState: 'unknown' | 'not_yet_granted' | 'recorded'
  expiry: {
    value: { kind: 'instant'; at: string } | { kind: 'civil_date'; on: string }
    provenance: 'user_asserted'
  } | null
}
export type TemporalObservationV2 = { referenceTime: string }
export type TemporalGapV2 = 'permission_event_missing' | 'permission_expiry' | 'permission_expiry_precision' | 'reference_time_missing'
export type EventDeadlineAuswertungV2 =
  | { status: 'window_evaluated'; window: 'open' | 'closed'; binding: 'context_asserted'; missingFacts: readonly [] }
  | { status: 'insufficient_context'; window: null; binding: null; missingFacts: readonly TemporalGapV2[] }
  | { status: 'blocked'; window: null; binding: null; missingFacts: readonly []; reason: V2BlockReason }

function temporalSatzV2(roh: unknown, keys: readonly string[]): Record<string, unknown> | null {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return null
  const s = roh as Record<string, unknown>
  return Object.keys(s).length === keys.length && keys.every((k) => Object.hasOwn(s, k)) ? s : null
}

function utcInstantV2(wert: unknown): wert is string {
  if (typeof wert !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(wert)) return false
  return civilDateOrdinalLesen(wert.slice(0, 10)) !== null && Number(wert.slice(11, 13)) < 24
    && Number(wert.slice(14, 16)) < 60 && Number(wert.slice(17, 19)) < 60
}

export function eventDeadlineV2Lesen(roh: unknown): V2LeseErgebnis<EventDeadlineV2> {
  const start = schema2DatenPruefen(roh)
  if (start) return { ok: false, reason: start }
  const s = temporalSatzV2(roh, ['schema', 'kind', 'action', 'reference', 'relation', 'semantics'])
  if (!s) return { ok: false, reason: 'invalid_fact' }
  if (s.schema !== 2) return { ok: false, reason: 'unsupported_version' }
  const r = temporalSatzV2(s.reference, ['event', 'countryCode'])
  const country = landescodeLesen(r?.countryCode)
  if (s.kind !== 'event_deadline' || s.action !== 'stay_extension_application'
    || s.relation !== 'before' || !istDueSemantics(s.semantics)
    || r?.event !== 'current_stay_permission_expiry' || !country) return { ok: false, reason: 'invalid_fact' }
  return { ok: true, wert: { schema: 2, kind: 'event_deadline', action: 'stay_extension_application',
    reference: { event: 'current_stay_permission_expiry', countryCode: country }, relation: 'before', semantics: s.semantics } }
}

export function permissionExpiryKontextV2Lesen(roh: unknown): V2LeseErgebnis<PermissionExpiryContextV2> {
  const start = schema2DatenPruefen(roh)
  if (start) return { ok: false, reason: start }
  const s = temporalSatzV2(roh, ['schema', 'visitCountryCode', 'permissionState', 'expiry'])
  if (!s) return { ok: false, reason: 'invalid_fact' }
  if (s.schema !== 2) return { ok: false, reason: 'unsupported_version' }
  const country = landescodeLesen(s.visitCountryCode)
  if (!country || (s.permissionState !== 'unknown' && s.permissionState !== 'not_yet_granted' && s.permissionState !== 'recorded')) return { ok: false, reason: 'invalid_fact' }
  if (s.permissionState !== 'recorded' && s.expiry !== null) return { ok: false, reason: 'context_conflict' }
  let expiry: PermissionExpiryContextV2['expiry'] = null
  if (s.expiry !== null) {
    const e = temporalSatzV2(s.expiry, ['value', 'provenance'])
    if (!e) return { ok: false, reason: 'invalid_fact' }
    if (e.provenance !== 'user_asserted') return { ok: false, reason: 'provenance_not_authorized' }
    const instant = temporalSatzV2(e.value, ['kind', 'at'])
    const civil = temporalSatzV2(e.value, ['kind', 'on'])
    if (instant?.kind === 'instant' && utcInstantV2(instant.at)) expiry = { value: { kind: 'instant', at: instant.at }, provenance: 'user_asserted' }
    else if (civil?.kind === 'civil_date' && civilDateOrdinalLesen(civil.on) !== null) expiry = { value: { kind: 'civil_date', on: civil.on as string }, provenance: 'user_asserted' }
    else return { ok: false, reason: 'invalid_fact' }
  }
  return { ok: true, wert: { schema: 2, visitCountryCode: country, permissionState: s.permissionState, expiry } }
}

export function eventDeadlineV2Fingerprint(roh: EventDeadlineV2): string {
  const r = eventDeadlineV2Lesen(roh)
  if (!r.ok) throw new Error(r.reason)
  return `official-temporal:v2:${sha256Hex(schema2Kanonisch(r.wert))}`
}

/** Der zukünftige vertrauenswürdige Caller bindet genau einen aktuellen Permit
 * an genau diesen Visit/diese Option. null am Kontext meldet fehlendes Binding.
 * Keine Uhr, keine Filing-Behauptung, keine Interpretation einer Visa-Expiry. */
export function eventDeadlineV2Auswerten(regel: unknown, kontext: unknown, observation: unknown): EventDeadlineAuswertungV2 {
  const block = (reason: V2BlockReason): EventDeadlineAuswertungV2 => ({ status: 'blocked', window: null, binding: null, missingFacts: [], reason })
  const gap = (code: TemporalGapV2): EventDeadlineAuswertungV2 => ({ status: 'insufficient_context', window: null, binding: null, missingFacts: [code] })
  const start = schema2DatenPruefen(regel, kontext, observation)
  if (start) return block(start)
  const r = eventDeadlineV2Lesen(regel)
  if (!r.ok) return block(r.reason)
  if (kontext === null) return block('binding_missing')
  const k = permissionExpiryKontextV2Lesen(kontext)
  if (!k.ok) return block(k.reason)
  if (r.wert.reference.countryCode !== k.wert.visitCountryCode) return block('scope_mismatch')
  // Ein nicht-null malformed Observation-Objekt ist niemals eine Missing-Antwort.
  const o = observation === null ? null : temporalSatzV2(observation, ['referenceTime'])
  if (observation !== null && (!o || !utcInstantV2(o.referenceTime))) return block('invalid_fact')
  if (k.wert.permissionState !== 'recorded') return gap('permission_event_missing')
  if (!k.wert.expiry) return gap('permission_expiry')
  if (k.wert.expiry.value.kind === 'civil_date') return gap('permission_expiry_precision')
  if (!o) return gap('reference_time_missing')
  // Strikte, gleichlange validierte UTC-Strings haben dieselbe Ordnung wie ihre
  // Instants. Kein Date.parse-Rollover, keine Date.now()- oder TZ-Abhängigkeit.
  return { status: 'window_evaluated', window: (o.referenceTime as string) < k.wert.expiry.value.at ? 'open' : 'closed',
    binding: 'context_asserted', missingFacts: [] }
}
