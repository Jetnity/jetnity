// lib/readiness/temporal.ts
//
// Provider-neutrale relative Official Temporal Rules.
// Nur explizite strukturierte Metadaten. Kein Timestamp, keine Notification.
// Frei von Next.

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
 * Fail-closed Parser. Unsupported kinds, Freitext, Marketingwerte,
 * Floats, NaN, Infinity, negative/0 before/after, nonzero at,
 * fehlende dueBy-Semantik und leere Regeln werden null.
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
  return {
    kind: OFFICIAL_TEMPORAL_KIND,
    availableFrom,
    dueBy,
  }
}

export function temporalRuleSchluessel(regel: OfficialTemporalRule | null | undefined): string {
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
