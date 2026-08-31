// lib/flights/airport-event-instant.ts
//
// Lokale Flughafen-Wanduhr + exakte E5-B1R-Timezone-Evidence →
// genau ein kanonischer UTC-Instant oder explizites fail-closed Problem.
//
// Keine IATA-/Ort-/Server-/Browser-Inferenz. Kein `Z` an lokale Strings.
// Kein earlier/later/compatible bei DST-Overlap. Keine Normalisierung
// über eine DST-Lücke. Keine neue Dependency.
//
// Frei von Next und Provider-SDKs.

import { airportTimezoneIdentifierLesen } from '@/lib/flights/airport-timezone'
import type { FlugOption, FlugSegment } from '@/lib/flights/domain'
import type {
  FlugAirportEventInstantEvidence,
  FlugAirportEventInstantIssue,
  FlugAirportEventInstantIssueArt,
  FlugAirportTimezoneEvidence,
} from '@/lib/flights/provider'

type KalenderDatum = { year: number; month: number; day: number }
type Uhrzeit = { hour: number; minute: number }
type LokaleWanduhr = KalenderDatum & Uhrzeit
type LokaleTeile = LokaleWanduhr & { second: number }

const OFFSET_FENSTER_STUNDEN = 36
const ZUSAETZLICHE_OFFSET_MINUTEN = [30, 45, 90, 135] as const

function issueAusEvidence(
  evidence: FlugAirportTimezoneEvidence,
  issue: FlugAirportEventInstantIssueArt,
): FlugAirportEventInstantIssue {
  return {
    optionId: evidence.optionId,
    legIndex: evidence.legIndex,
    segmentIndex: evidence.segmentIndex,
    endpoint: evidence.endpoint,
    iata: evidence.iata,
    timeZone: evidence.timeZone,
    issue,
  }
}

function kalenderDatumLesen(wert: string): KalenderDatum | null {
  const treffer = /^(\d{4})-(\d{2})-(\d{2})$/.exec(wert)
  if (!treffer) return null
  const year = Number(treffer[1])
  const month = Number(treffer[2])
  const day = Number(treffer[3])
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null
  const utc = Date.UTC(year, month - 1, day)
  if (!Number.isFinite(utc)) return null
  const probe = new Date(utc)
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null
  }
  return { year, month, day }
}

function uhrzeitLesen(wert: string): Uhrzeit | null {
  const treffer = /^(\d{2}):(\d{2})$/.exec(wert)
  if (!treffer) return null
  const hour = Number(treffer[1])
  const minute = Number(treffer[2])
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

function formatterFuer(
  cache: Map<string, Intl.DateTimeFormat>,
  timeZone: string,
): Intl.DateTimeFormat | null {
  const vorhanden = cache.get(timeZone)
  if (vorhanden) return vorhanden
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    cache.set(timeZone, formatter)
    return formatter
  } catch {
    return null
  }
}

function zahlAusTeil(teile: Intl.DateTimeFormatPart[], typ: Intl.DateTimeFormatPartTypes): number | null {
  const roh = teile.find((teil) => teil.type === typ)?.value
  if (roh === undefined) return null
  const wert = Number(roh)
  if (!Number.isFinite(wert)) return null
  return wert
}

function lokaleTeileAusUtc(
  utcMs: number,
  timeZone: string,
  cache: Map<string, Intl.DateTimeFormat>,
): LokaleTeile | null {
  if (!Number.isFinite(utcMs)) return null
  const formatter = formatterFuer(cache, timeZone)
  if (!formatter) return null
  let teile: Intl.DateTimeFormatPart[]
  try {
    teile = formatter.formatToParts(new Date(utcMs))
  } catch {
    return null
  }
  const year = zahlAusTeil(teile, 'year')
  const month = zahlAusTeil(teile, 'month')
  const day = zahlAusTeil(teile, 'day')
  const hour = zahlAusTeil(teile, 'hour')
  const minute = zahlAusTeil(teile, 'minute')
  const second = zahlAusTeil(teile, 'second')
  if (
    year === null ||
    month === null ||
    day === null ||
    hour === null ||
    minute === null ||
    second === null
  ) {
    return null
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    return null
  }
  return { year, month, day, hour, minute, second }
}

function offsetMsAus(
  utcMs: number,
  timeZone: string,
  cache: Map<string, Intl.DateTimeFormat>,
): number | null {
  const teile = lokaleTeileAusUtc(utcMs, timeZone, cache)
  if (!teile) return null
  const alsUtc = Date.UTC(teile.year, teile.month - 1, teile.day, teile.hour, teile.minute, teile.second)
  if (!Number.isFinite(alsUtc)) return null
  return alsUtc - utcMs
}

function gleicheWanduhr(teile: LokaleTeile, gewuenscht: LokaleWanduhr): boolean {
  return (
    teile.year === gewuenscht.year &&
    teile.month === gewuenscht.month &&
    teile.day === gewuenscht.day &&
    teile.hour === gewuenscht.hour &&
    teile.minute === gewuenscht.minute &&
    teile.second === 0
  )
}

/**
 * Sammelt endliche, beobachtete Offsets um die als-UTC gelesene Wanduhr.
 * Keine unbegrenzte Suche, keine Abhängigkeit von process.env.TZ.
 */
function offsetsUmWanduhr(
  wanduhr: LokaleWanduhr,
  timeZone: string,
  cache: Map<string, Intl.DateTimeFormat>,
): number[] {
  const alsUtc = Date.UTC(
    wanduhr.year,
    wanduhr.month - 1,
    wanduhr.day,
    wanduhr.hour,
    wanduhr.minute,
    0,
  )
  const offsets = new Set<number>()
  for (let stunde = -OFFSET_FENSTER_STUNDEN; stunde <= OFFSET_FENSTER_STUNDEN; stunde += 1) {
    const offset = offsetMsAus(alsUtc + stunde * 3_600_000, timeZone, cache)
    if (offset !== null) offsets.add(offset)
  }
  for (const minuten of ZUSAETZLICHE_OFFSET_MINUTEN) {
    const offsetPlus = offsetMsAus(alsUtc + minuten * 60_000, timeZone, cache)
    const offsetMinus = offsetMsAus(alsUtc - minuten * 60_000, timeZone, cache)
    if (offsetPlus !== null) offsets.add(offsetPlus)
    if (offsetMinus !== null) offsets.add(offsetMinus)
  }
  return [...offsets]
}

function instantsFuerWanduhr(
  wanduhr: LokaleWanduhr,
  timeZone: string,
  cache: Map<string, Intl.DateTimeFormat>,
): number[] {
  const alsUtc = Date.UTC(
    wanduhr.year,
    wanduhr.month - 1,
    wanduhr.day,
    wanduhr.hour,
    wanduhr.minute,
    0,
  )
  const instants = new Set<number>()
  for (const offset of offsetsUmWanduhr(wanduhr, timeZone, cache)) {
    const kandidat = alsUtc - offset
    const teile = lokaleTeileAusUtc(kandidat, timeZone, cache)
    if (teile && gleicheWanduhr(teile, wanduhr)) {
      instants.add(kandidat)
    }
  }
  return [...instants].sort((a, b) => a - b)
}

function kanonischesUtcIso(utcMs: number): string | null {
  if (!Number.isFinite(utcMs)) return null
  const datum = new Date(utcMs)
  if (datum.getTime() !== utcMs) return null
  const jahr = datum.getUTCFullYear()
  const monat = String(datum.getUTCMonth() + 1).padStart(2, '0')
  const tag = String(datum.getUTCDate()).padStart(2, '0')
  const stunde = String(datum.getUTCHours()).padStart(2, '0')
  const minute = String(datum.getUTCMinutes()).padStart(2, '0')
  const sekunde = String(datum.getUTCSeconds()).padStart(2, '0')
  if (datum.getUTCMilliseconds() !== 0) return null
  return `${jahr}-${monat}-${tag}T${stunde}:${minute}:${sekunde}Z`
}

function segmentFuerEvidence(
  option: FlugOption | undefined,
  evidence: FlugAirportTimezoneEvidence,
): FlugSegment | null {
  if (!option) return null
  if (evidence.optionId !== option.id) return null
  if (!Number.isInteger(evidence.legIndex) || evidence.legIndex < 0) return null
  if (!Number.isInteger(evidence.segmentIndex) || evidence.segmentIndex < 0) return null
  return option.legs[evidence.legIndex]?.segments[evidence.segmentIndex] ?? null
}

function wanduhrFuerEvidence(
  segment: FlugSegment,
  evidence: FlugAirportTimezoneEvidence,
): { iata: string; date: string; time: string } | null {
  if (evidence.endpoint === 'departure') {
    if (evidence.iata !== segment.origin) return null
    return {
      iata: segment.origin,
      date: segment.departureDate,
      time: segment.departureTime,
    }
  }
  if (evidence.endpoint === 'arrival') {
    if (evidence.iata !== segment.destination) return null
    return {
      iata: segment.destination,
      date: segment.arrivalDate,
      time: segment.arrivalTime,
    }
  }
  return null
}

/**
 * Löst vorhandene E5-B1R-Timezone-Evidence gegen die normalisierten Optionen
 * in eindeutige Event-Instants oder explizite Issues auf.
 *
 * Ungültige Evidence verwirft keine Option. Es wird nur über optionId gebunden.
 */
export function airportEventInstantsAufloesen(eingabe: {
  options: readonly FlugOption[]
  airportTimezoneEvidence: readonly FlugAirportTimezoneEvidence[]
}): {
  airportEventInstantEvidence: FlugAirportEventInstantEvidence[]
  airportEventInstantIssues: FlugAirportEventInstantIssue[]
} {
  const airportEventInstantEvidence: FlugAirportEventInstantEvidence[] = []
  const airportEventInstantIssues: FlugAirportEventInstantIssue[] = []
  const optionenNachId = new Map<string, FlugOption>()
  for (const option of eingabe.options) {
    if (!optionenNachId.has(option.id)) optionenNachId.set(option.id, option)
  }
  const formatterCache = new Map<string, Intl.DateTimeFormat>()

  for (const evidence of eingabe.airportTimezoneEvidence) {
    const option = optionenNachId.get(evidence.optionId)
    const segment = segmentFuerEvidence(option, evidence)
    const gebunden = segment ? wanduhrFuerEvidence(segment, evidence) : null
    if (!option || !segment || !gebunden) {
      airportEventInstantIssues.push(issueAusEvidence(evidence, 'evidence_mismatch'))
      continue
    }

    const timeZone = airportTimezoneIdentifierLesen(evidence.timeZone)
    if (!timeZone) {
      airportEventInstantIssues.push(issueAusEvidence(evidence, 'invalid_time_zone'))
      continue
    }

    const datum = kalenderDatumLesen(gebunden.date)
    const uhrzeit = uhrzeitLesen(gebunden.time)
    if (!datum || !uhrzeit) {
      airportEventInstantIssues.push(issueAusEvidence(evidence, 'invalid_local_date_time'))
      continue
    }

    const wanduhr = { ...datum, ...uhrzeit }
    const instants = instantsFuerWanduhr(wanduhr, timeZone, formatterCache)
    if (instants.length === 0) {
      airportEventInstantIssues.push(issueAusEvidence(evidence, 'nonexistent_local_time'))
      continue
    }
    if (instants.length !== 1) {
      airportEventInstantIssues.push(issueAusEvidence(evidence, 'ambiguous_local_time'))
      continue
    }

    const instant = kanonischesUtcIso(instants[0]!)
    if (!instant) {
      airportEventInstantIssues.push(issueAusEvidence(evidence, 'invalid_local_date_time'))
      continue
    }

    airportEventInstantEvidence.push({
      optionId: evidence.optionId,
      legIndex: evidence.legIndex,
      segmentIndex: evidence.segmentIndex,
      endpoint: evidence.endpoint,
      iata: gebunden.iata,
      timeZone,
      instant,
    })
  }

  return { airportEventInstantEvidence, airportEventInstantIssues }
}
