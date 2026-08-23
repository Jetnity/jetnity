// lib/safety/relevanz.ts
//
// Deterministische räumliche und zeitliche Relevanz.
// Keine Länder-Pauschalisierung und keine geratene Geo-Präzision.

import type { RouteFacts } from '@/lib/route/domain'
import type { SafetyRelevance, SafetySpatialPrecision, SafetyTripRef } from '@/lib/safety/domain'
import type { SafetyReisekontext, SafetyStageKontext } from '@/lib/safety/kontext'
import {
  entfernungKm,
  punktInPolygon,
  zeitraeumeUeberschneiden,
  type SafetySpatialScope,
} from '@/lib/safety/scope'

export type SafetyRelevanzErgebnis = {
  relevance: SafetyRelevance
  precision: SafetySpatialPrecision
  affectedRefs: SafetyTripRef[]
  reason: string
}

function etappenRef(etappe: SafetyStageKontext): SafetyTripRef {
  return { kind: 'stage', id: etappe.id, label: etappe.name }
}

function airportRef(code: string, label: string): SafetyTripRef {
  return { kind: 'airport', id: code, label }
}

function routePunktRef(code: string): SafetyTripRef {
  return { kind: 'route_point', id: code, label: code }
}

function gleicheStadt(etappe: SafetyStageKontext, scope: Extract<SafetySpatialScope, { kind: 'city' }>): boolean {
  return Boolean(scope.placeId && etappe.placeId && etappe.placeId === scope.placeId)
}

function etappeImRadius(
  etappe: SafetyStageKontext,
  scope: Extract<SafetySpatialScope, { kind: 'point_radius' | 'polygon' }>,
): boolean | null {
  if (etappe.latitude == null || etappe.longitude == null) return null
  if (scope.kind === 'point_radius') {
    return entfernungKm(
      { latitude: etappe.latitude, longitude: etappe.longitude },
      { latitude: scope.latitude, longitude: scope.longitude },
    ) <= scope.radiusKm
  }
  return punktInPolygon({ latitude: etappe.latitude, longitude: etappe.longitude }, scope.coordinates)
}

function routeAirports(kontext: SafetyReisekontext): string[] {
  return kontext.airportCodes
}

function stageImLand(kontext: SafetyReisekontext, countryCode: string | null): boolean {
  return Boolean(countryCode && kontext.stages.some((etappe) => etappe.countryCode === countryCode))
}

function routeBeruehrtLand(kontext: SafetyReisekontext, countryCode: string | null): boolean {
  if (!countryCode) return false
  return (
    kontext.route.origin.countryCode === countryCode ||
    kontext.route.destination.countryCode === countryCode ||
    kontext.route.transitCountryCodes.includes(countryCode) ||
    kontext.route.destinationCountryCodes.includes(countryCode)
  )
}

function airportZeitfenster(
  route: RouteFacts,
  code: string,
): { start: string | null; end: string | null } | null {
  const zeiten: string[] = []
  for (const segment of route.segments) {
    if (segment.origin.airportCode === code && segment.departureDate) zeiten.push(segment.departureDate)
    if (segment.destination.airportCode === code && segment.arrivalDate) zeiten.push(segment.arrivalDate)
  }
  if (zeiten.length === 0) return null
  const sortiert = [...zeiten].sort()
  return { start: sortiert[0] ?? null, end: sortiert[sortiert.length - 1] ?? null }
}

function refZeitfenster(
  kontext: SafetyReisekontext,
  ref: SafetyTripRef,
): { start: string | null; end: string | null } | null {
  if (ref.kind === 'stage') {
    const etappe = kontext.stages.find((eintrag) => eintrag.id === ref.id)
    if (!etappe) return null
    if (!etappe.arrivalDate && !etappe.departureDate) return null
    return {
      start: etappe.arrivalDate ?? etappe.departureDate,
      end: etappe.departureDate ?? etappe.arrivalDate,
    }
  }
  if (ref.kind === 'airport' || ref.kind === 'route_point') {
    return airportZeitfenster(kontext.route, ref.id)
  }
  if (ref.kind === 'day') {
    const tag = kontext.days.find((eintrag) => eintrag.id === ref.id)
    return tag?.dayDate ? { start: tag.dayDate, end: tag.dayDate } : null
  }
  if (ref.kind === 'item') {
    const punkt = kontext.items.find((eintrag) => eintrag.id === ref.id)
    if (!punkt) return null
    if (!punkt.startsOn && !punkt.endsOn) return null
    return { start: punkt.startsOn ?? punkt.endsOn, end: punkt.endsOn ?? punkt.startsOn }
  }
  return null
}

function räumlicheRelevanz(
  kontext: SafetyReisekontext,
  scope: SafetySpatialScope,
): SafetyRelevanzErgebnis {
  if (scope.kind === 'insufficient') {
    return {
      relevance: 'insufficient_context',
      precision: 'unknown',
      affectedRefs: [],
      reason: 'Der räumliche Geltungsbereich der Quelle ist nicht präzise genug.',
    }
  }

  if (scope.kind === 'country') {
    const etappen = kontext.stages.filter((etappe) => etappe.countryCode === scope.countryCode)
    const routeImLand =
      kontext.route.origin.countryCode === scope.countryCode ||
      kontext.route.destination.countryCode === scope.countryCode ||
      kontext.route.transitCountryCodes.includes(scope.countryCode)
    if (etappen.length === 0 && !routeImLand) {
      return {
        relevance: 'not_affected',
        precision: 'country',
        affectedRefs: [],
        reason: 'Das Ereignis betrifft ein anderes Land als diese Reise.',
      }
    }
    const refs = etappen.map(etappenRef)
    if (routeImLand && etappen.length === 0) {
      const code =
        kontext.route.transitCountryCodes.includes(scope.countryCode)
          ? kontext.route.connections.find((punkt) => punkt.countryCode === scope.countryCode)?.airportCode
          : kontext.route.origin.countryCode === scope.countryCode
            ? kontext.route.origin.airportCode
            : kontext.route.destination.airportCode
      if (code) refs.push(routePunktRef(code))
    }
    return {
      relevance: 'affected',
      precision: 'country',
      affectedRefs: refs,
      reason: 'Offizielle Lage auf Landesebene, ohne erfundene regionale Präzision.',
    }
  }

  if (scope.kind === 'airport' || scope.kind === 'route_corridor') {
    const gesucht = scope.kind === 'airport' ? [scope.airportCode] : scope.airportCodes
    const getroffen = routeAirports(kontext).filter((code) => gesucht.includes(code))
    if (getroffen.length === 0) {
      return {
        relevance: 'not_affected',
        precision: 'airport',
        affectedRefs: [],
        reason: 'Der betroffene Verkehrsknoten liegt nicht auf der konkreten Route.',
      }
    }
    return {
      relevance: 'affected',
      precision: scope.kind === 'airport' ? 'airport' : 'route',
      affectedRefs: getroffen.map((code) => airportRef(code, code)),
      reason: 'Die Flugroute oder ein Transitpunkt ist betroffen, das Reiseziel nicht pauschal.',
    }
  }

  const imSelbenLand = (etappe: SafetyStageKontext) => {
    if ('countryCode' in scope && scope.countryCode) return etappe.countryCode === scope.countryCode
    return false
  }

  if (scope.kind === 'place') {
    const exakt = kontext.stages.filter((etappe) => etappe.placeId === scope.placeId)
    if (exakt.length > 0) {
      return {
        relevance: 'affected',
        precision: 'place',
        affectedRefs: exakt.map(etappenRef),
        reason: 'Der belegte Ort der Quelle entspricht einer konkreten Etappe.',
      }
    }
    const gleichesLand = kontext.stages.filter(imSelbenLand)
    if (gleichesLand.some((etappe) => !etappe.placeId)) {
      return {
        relevance: 'insufficient_context',
        precision: 'unknown',
        affectedRefs: [],
        reason: 'Der Ereignisort ist belegt, die Etappe hat aber keinen vergleichbaren Ortsbezug.',
      }
    }
    if (gleichesLand.length > 0 && !routeBeruehrtLand(kontext, scope.countryCode)) {
      return {
        relevance: 'not_affected',
        precision: 'place',
        affectedRefs: [],
        reason: 'Das Ereignis liegt im selben Land, aber ausserhalb der konkreten Reisezone.',
      }
    }
    if (routeBeruehrtLand(kontext, scope.countryCode)) {
      return {
        relevance: 'insufficient_context',
        precision: 'unknown',
        affectedRefs: [],
        reason: 'Die Route berührt das Land, die feinere Ortszugehörigkeit ist aber nicht belegt.',
      }
    }
    return {
      relevance: 'not_affected',
      precision: 'place',
      affectedRefs: [],
      reason: 'Kein Reiseort entspricht dem belegten Ereignisort.',
    }
  }

  if (scope.kind === 'admin_region') {
    if (stageImLand(kontext, scope.countryCode) || routeBeruehrtLand(kontext, scope.countryCode)) {
      return {
        relevance: 'insufficient_context',
        precision: 'unknown',
        affectedRefs: [],
        reason: 'Die Quelle nennt eine Region, Jetnity besitzt aber keine kanonische Regionszugehörigkeit.',
      }
    }
    return {
      relevance: 'not_affected',
      precision: 'admin_region',
      affectedRefs: [],
      reason: 'Keine Etappe oder Route liegt im belegten Land der Region.',
    }
  }

  if (scope.kind === 'city') {
    if (!scope.placeId) {
      return stageImLand(kontext, scope.countryCode) || routeBeruehrtLand(kontext, scope.countryCode)
        ? {
            relevance: 'insufficient_context',
            precision: 'unknown',
            affectedRefs: [],
            reason: 'Die Stadt ist nur namentlich belegt und nicht kanonisch vergleichbar.',
          }
        : {
            relevance: 'not_affected',
            precision: 'city',
            affectedRefs: [],
            reason: 'Keine Etappe oder Route liegt im belegten Land der Stadt.',
          }
    }
    const exakt = kontext.stages.filter((etappe) => gleicheStadt(etappe, scope))
    if (exakt.length > 0) {
      return {
        relevance: 'affected',
        precision: 'city',
        affectedRefs: exakt.map(etappenRef),
        reason: 'Die belegte Region oder Stadt entspricht einer konkreten Etappe.',
      }
    }
    const gleichesLand = kontext.stages.filter(imSelbenLand)
    if (gleichesLand.some((etappe) => !etappe.placeId)) {
      return {
        relevance: 'insufficient_context',
        precision: 'unknown',
        affectedRefs: [],
        reason: 'Die Quelle ist städtisch, die Etappe hat aber keinen vergleichbaren Ortsbezug.',
      }
    }
    if (gleichesLand.length > 0 && !routeBeruehrtLand(kontext, scope.countryCode)) {
      return {
        relevance: 'not_affected',
        precision: 'city',
        affectedRefs: [],
        reason: 'Das Ereignis liegt im selben Land, aber klar ausserhalb der konkreten Reisezone.',
      }
    }
    if (routeBeruehrtLand(kontext, scope.countryCode)) {
      return {
        relevance: 'insufficient_context',
        precision: 'unknown',
        affectedRefs: [],
        reason: 'Die Route berührt das Land, die Stadtzugehörigkeit ist aber nicht belegt.',
      }
    }
    return {
      relevance: 'not_affected',
      precision: 'city',
      affectedRefs: [],
      reason: 'Keine Etappe liegt in der belegten Stadt.',
    }
  }

  if (scope.kind === 'point_radius' || scope.kind === 'polygon') {
    const betroffen: SafetyStageKontext[] = []
    let unklar = false
    for (const etappe of kontext.stages) {
      const treffer = etappeImRadius(etappe, scope)
      if (treffer === true) betroffen.push(etappe)
      if (treffer === null) {
        if (!scope.countryCode || imSelbenLand(etappe)) unklar = true
      }
    }
    if (betroffen.length > 0) {
      return {
        relevance: 'affected',
        precision: 'point',
        affectedRefs: betroffen.map(etappenRef),
        reason: 'Die belegte Geometrie der Quelle schneidet eine konkrete Etappe.',
      }
    }
    if (unklar || routeBeruehrtLand(kontext, scope.countryCode)) {
      return {
        relevance: 'insufficient_context',
        precision: 'unknown',
        affectedRefs: [],
        reason: 'Für einen präzisen Abgleich fehlen Koordinaten der Etappe oder der Route.',
      }
    }
    return {
      relevance: 'not_affected',
      precision: 'point',
      affectedRefs: [],
      reason: 'Die belegte Geometrie liegt ausserhalb der konkreten Reisezone.',
    }
  }

  return {
    relevance: 'insufficient_context',
    precision: 'unknown',
    affectedRefs: [],
    reason: 'Der räumliche Vergleich ist nicht belastbar.',
  }
}

function tripZeitlage(
  kontext: SafetyReisekontext,
  start: string | null,
  end: string | null,
): 'overlaps' | 'before' | 'after' | 'insufficient' {
  return zeitraeumeUeberschneiden(kontext.startDate, kontext.endDate, start, end)
}

function zeitAufRefsAnwenden(
  kontext: SafetyReisekontext,
  raum: SafetyRelevanzErgebnis,
  start: string | null,
  end: string | null,
): SafetyRelevanzErgebnis {
  if (raum.relevance === 'not_affected') return raum

  const trip = tripZeitlage(kontext, start, end)
  if (trip === 'before' || trip === 'after') {
    return {
      ...raum,
      relevance: 'not_affected',
      affectedRefs: [],
      reason: 'Das Ereignis liegt ausserhalb des konkreten Reisezeitraums.',
    }
  }

  if (raum.relevance !== 'affected' || raum.affectedRefs.length === 0) {
    if (trip === 'insufficient') {
      return {
        ...raum,
        relevance: 'insufficient_context',
        affectedRefs: [],
        reason: 'Für einen zeitlichen Abgleich fehlen belastbare Reisedaten.',
      }
    }
    return raum
  }

  const passende: SafetyTripRef[] = []
  let unklar = false
  for (const ref of raum.affectedRefs) {
    const fenster = refZeitfenster(kontext, ref)
    if (!fenster) {
      unklar = true
      continue
    }
    const lage = zeitraeumeUeberschneiden(fenster.start, fenster.end, start, end)
    if (lage === 'overlaps') passende.push(ref)
    else if (lage === 'insufficient') unklar = true
  }

  if (passende.length > 0) {
    return {
      ...raum,
      affectedRefs: passende,
      reason:
        passende.length === raum.affectedRefs.length
          ? raum.reason
          : 'Nur der zeitlich überschneidende Reiseteil ist betroffen.',
    }
  }
  if (unklar) {
    return {
      ...raum,
      relevance: 'insufficient_context',
      affectedRefs: [],
      reason: 'Für einen zeitlichen Abgleich des betroffenen Reiseteils fehlen belastbare Daten.',
    }
  }
  return {
    ...raum,
    relevance: 'not_affected',
    affectedRefs: [],
    reason: 'Das Ereignis liegt ausserhalb des konkreten Zeitraums des betroffenen Reiseteils.',
  }
}

export function räumlichZeitlicheRelevanz(
  kontext: SafetyReisekontext,
  scope: SafetySpatialScope,
  start: string | null,
  end: string | null,
  eventStatus: string,
): SafetyRelevanzErgebnis {
  if (eventStatus === 'resolved' || eventStatus === 'withdrawn') {
    return {
      relevance: 'not_affected',
      precision: 'unknown',
      affectedRefs: [],
      reason: 'Das Ereignis ist zurückgezogen oder als erledigt belegt.',
    }
  }
  return zeitAufRefsAnwenden(kontext, räumlicheRelevanz(kontext, scope), start, end)
}
