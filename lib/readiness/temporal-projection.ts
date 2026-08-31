// lib/readiness/temporal-projection.ts
//
// E5-A: relative Official Temporal Rules auf explizit gebundene
// absolute Event-Instants projizieren.
//
// Keine zweite Temporal-Domain. Keine Trip-/Route-Suche. Keine
// Country-/first-match-Auswahl. Keine Zeitzonenheuristik.
// Niemals Z an lokale Wanduhrzeiten. Keine implizite Jetzt-Uhr.
// Frei von Next, Safety und Providern.

import {
  OFFICIAL_TEMPORAL_KIND,
  OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES,
  type OfficialTemporalAnchor,
  type OfficialTemporalDueBy,
  type OfficialTemporalDueSemantics,
  type OfficialTemporalPunkt,
  type OfficialTemporalRule,
} from '@/lib/readiness/temporal'

export const OFFICIAL_TEMPORAL_PROJECTION_ISSUES = [
  'missing_anchor',
  'invalid_instant',
  'invalid_projected_window',
] as const
export type OfficialTemporalProjectionIssue = (typeof OFFICIAL_TEMPORAL_PROJECTION_ISSUES)[number]

export type OfficialTemporalEventBinding = {
  eventRef: string
  instant: string
}

export type OfficialTemporalEventBindings = {
  readonly [K in OfficialTemporalAnchor]?: OfficialTemporalEventBinding
}

export type OfficialTemporalProjectedPunkt = {
  instant: string
  anchor: OfficialTemporalAnchor
  eventRef: string
}

export type OfficialTemporalProjectedDueBy = OfficialTemporalProjectedPunkt & {
  semantics: OfficialTemporalDueSemantics
}

export type OfficialTemporalProjectionIssueEintrag = {
  side: 'availableFrom' | 'dueBy' | 'window'
  issue: OfficialTemporalProjectionIssue
  anchor: OfficialTemporalAnchor | null
  eventRef: string | null
}

export type OfficialTemporalActionWindow = {
  availableFrom: OfficialTemporalProjectedPunkt | null
  dueBy: OfficialTemporalProjectedDueBy | null
}

export type OfficialTemporalProjection = {
  availableFrom: OfficialTemporalProjectedPunkt | null
  dueBy: OfficialTemporalProjectedDueBy | null
  actionWindow: OfficialTemporalActionWindow | null
  issues: OfficialTemporalProjectionIssueEintrag[]
}

/** Frische leere Projection pro Aufruf. Kein gemeinsam mutierbares Modul-Singleton. */
function leereProjektion(): OfficialTemporalProjection {
  return {
    availableFrom: null,
    dueBy: null,
    actionWindow: null,
    issues: [],
  }
}

const ABSOLUTER_INSTANT =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/

const MAX_DATE_MS = 8.64e15

function kalenderteileGueltig(jahr: number, monat: number, tag: number): boolean {
  if (!Number.isInteger(jahr) || !Number.isInteger(monat) || !Number.isInteger(tag)) return false
  const geprueft = new Date(Date.UTC(jahr, monat - 1, tag))
  return (
    geprueft.getUTCFullYear() === jahr &&
    geprueft.getUTCMonth() === monat - 1 &&
    geprueft.getUTCDate() === tag
  )
}

function offsetMinutenAus(offset: string): number | null {
  if (offset === 'Z') return 0
  const treffer = /^([+-])(\d{2}):(\d{2})$/.exec(offset)
  if (!treffer) return null
  const stunden = Number(treffer[2])
  const minuten = Number(treffer[3])
  if (!Number.isInteger(stunden) || !Number.isInteger(minuten) || minuten > 59) return null
  const vorzeichen = treffer[1] === '-' ? -1 : 1
  const gesamt = vorzeichen * (stunden * 60 + minuten)
  if (gesamt < -12 * 60 || gesamt > 14 * 60) return null
  return gesamt
}

function utcInstantFormatieren(ms: number): string | null {
  if (!Number.isFinite(ms) || Math.abs(ms) > MAX_DATE_MS) return null
  const datum = new Date(ms)
  if (!Number.isFinite(datum.getTime())) return null
  return datum.toISOString()
}

/**
 * Nur explizite absolute RFC3339/ISO-Instants mit `Z` oder numerischem Offset.
 * Zonenlose Wanduhr, Date-only, Freitext und locale Date-Strings bleiben null.
 * Kein `Date.parse` / `new Date(string)` auf unvalidierten Eingaben.
 */
function absolutenInstantLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const text = wert.trim()
  const treffer = ABSOLUTER_INSTANT.exec(text)
  if (!treffer || treffer[0] !== text) return null
  const jahr = Number(treffer[1])
  const monat = Number(treffer[2])
  const tag = Number(treffer[3])
  const stunde = Number(treffer[4])
  const minute = Number(treffer[5])
  const sekunde = Number(treffer[6])
  if (!kalenderteileGueltig(jahr, monat, tag)) return null
  if (stunde > 23 || minute > 59 || sekunde > 59) return null
  const offsetMinuten = offsetMinutenAus(treffer[8] ?? '')
  if (offsetMinuten == null) return null
  const milli = Number((treffer[7] ?? '0').padEnd(3, '0'))
  const lokalAlsUtc = Date.UTC(jahr, monat - 1, tag, stunde, minute, sekunde, milli)
  if (!Number.isFinite(lokalAlsUtc)) return null
  return utcInstantFormatieren(lokalAlsUtc - offsetMinuten * 60_000)
}

/** Stabile Occurrence-Identität. Whitespace-only ist keine Identität; kein Trim/Rewrite. */
function eventRefLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  if (wert.trim().length === 0) return null
  return wert
}

function bindingLesen(roh: OfficialTemporalEventBinding | undefined): {
  eventRef: string | null
  instant: string | null
  vorhanden: boolean
} {
  if (!roh || typeof roh !== 'object') {
    return { eventRef: null, instant: null, vorhanden: false }
  }
  return {
    vorhanden: true,
    eventRef: eventRefLesen(roh.eventRef),
    instant: absolutenInstantLesen(roh.instant),
  }
}

function punktIstAnwendbar(punkt: OfficialTemporalPunkt): boolean {
  if (!Number.isInteger(punkt.offsetMinutes) || !Number.isFinite(punkt.offsetMinutes)) return false
  if (punkt.relation === 'at') return punkt.offsetMinutes === 0
  return punkt.offsetMinutes > 0 && punkt.offsetMinutes <= OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES
}

function verschiebungMinuten(punkt: OfficialTemporalPunkt): number | null {
  if (!punktIstAnwendbar(punkt)) return null
  if (punkt.relation === 'before') return -punkt.offsetMinutes
  if (punkt.relation === 'after') return punkt.offsetMinutes
  return 0
}

function seiteProjizieren(
  punkt: OfficialTemporalPunkt | OfficialTemporalDueBy,
  bindings: OfficialTemporalEventBindings,
  side: 'availableFrom' | 'dueBy',
): {
  punkt: OfficialTemporalProjectedPunkt | null
  issue: OfficialTemporalProjectionIssueEintrag | null
} {
  const binding = bindingLesen(bindings[punkt.anchor])
  if (!binding.vorhanden || !binding.eventRef) {
    return {
      punkt: null,
      issue: {
        side,
        issue: 'missing_anchor',
        anchor: punkt.anchor,
        eventRef: null,
      },
    }
  }
  if (!binding.instant) {
    return {
      punkt: null,
      issue: {
        side,
        issue: 'invalid_instant',
        anchor: punkt.anchor,
        eventRef: binding.eventRef,
      },
    }
  }
  const verschiebung = verschiebungMinuten(punkt)
  const basisMs = Date.parse(binding.instant)
  if (verschiebung == null || !Number.isFinite(basisMs)) {
    return {
      punkt: null,
      issue: {
        side,
        issue: 'invalid_instant',
        anchor: punkt.anchor,
        eventRef: binding.eventRef,
      },
    }
  }
  const projiziert = utcInstantFormatieren(basisMs + verschiebung * 60_000)
  if (!projiziert) {
    return {
      punkt: null,
      issue: {
        side,
        issue: 'invalid_instant',
        anchor: punkt.anchor,
        eventRef: binding.eventRef,
      },
    }
  }
  return {
    punkt: {
      instant: projiziert,
      anchor: punkt.anchor,
      eventRef: binding.eventRef,
    },
    issue: null,
  }
}

function instantMs(wert: string): number | null {
  const ms = Date.parse(wert)
  return Number.isFinite(ms) ? ms : null
}

/**
 * Projiziert eine E4-Regel nur aus explizit gebundenen absoluten Instants.
 * Der Core sucht keine Occurrence und rät keine Zone.
 */
export function temporalRuleProjizieren(
  regel: OfficialTemporalRule | null | undefined,
  bindings: OfficialTemporalEventBindings,
): OfficialTemporalProjection {
  if (!regel || regel.kind !== OFFICIAL_TEMPORAL_KIND) return leereProjektion()
  if (!regel.availableFrom && !regel.dueBy) return leereProjektion()

  const issues: OfficialTemporalProjectionIssueEintrag[] = []
  let availableFrom: OfficialTemporalProjectedPunkt | null = null
  let dueBy: OfficialTemporalProjectedDueBy | null = null

  if (regel.availableFrom) {
    const seite = seiteProjizieren(regel.availableFrom, bindings, 'availableFrom')
    availableFrom = seite.punkt
    if (seite.issue) issues.push(seite.issue)
  }
  if (regel.dueBy) {
    const seite = seiteProjizieren(regel.dueBy, bindings, 'dueBy')
    dueBy = seite.punkt
      ? { ...seite.punkt, semantics: regel.dueBy.semantics }
      : null
    if (seite.issue) issues.push(seite.issue)
  }

  if (availableFrom && dueBy) {
    const von = instantMs(availableFrom.instant)
    const bis = instantMs(dueBy.instant)
    if (von == null || bis == null || von > bis) {
      return {
        availableFrom,
        dueBy,
        actionWindow: null,
        issues: [
          ...issues,
          {
            side: 'window',
            issue: 'invalid_projected_window',
            anchor: null,
            eventRef: null,
          },
        ],
      }
    }
    return {
      availableFrom,
      dueBy,
      actionWindow: { availableFrom, dueBy },
      issues,
    }
  }

  if (!availableFrom && !dueBy) {
    return { availableFrom: null, dueBy: null, actionWindow: null, issues }
  }

  return {
    availableFrom,
    dueBy,
    actionWindow: { availableFrom, dueBy },
    issues,
  }
}
