// lib/seasonal/relevanz.ts
//
// Geo + Travel Window + Source Validity. Keine Titel-Geo-Truth.

import type { RouteFacts } from '@/lib/route/domain'
import type { SeasonalRelevance, SeasonalSpatialPrecision, SeasonalTripRef } from '@/lib/seasonal/domain'
import type { SeasonalTravelWindow } from '@/lib/seasonal/fenster'
import { kontaktImTravelWindow } from '@/lib/seasonal/fenster'
import type { SeasonalReisekontext, SeasonalStageKontext } from '@/lib/seasonal/kontext'

function routeKontaktZeit(date: string | null, time: string | null): string | null {
  if (!date) return null
  if (time && /^\d{2}:\d{2}$/.test(time)) return `${date}T${time}`
  return date
}
import { entfernungKm, type SeasonalSpatialScope } from '@/lib/seasonal/scope'

export type SeasonalKontakt = {
  start: string | null
  end: string | null
}

export type SeasonalRelevanzErgebnis = {
  relevance: SeasonalRelevance
  precision: SeasonalSpatialPrecision
  affectedRefs: SeasonalTripRef[]
  unresolvedRefs?: SeasonalTripRef[]
  unresolvedRoute?: boolean
  reason: string
}

function etappenRef(etappe: SeasonalStageKontext): SeasonalTripRef {
  return { kind: 'stage', id: etappe.id, label: etappe.name }
}

function airportRef(code: string): SeasonalTripRef {
  return { kind: 'airport', id: code, label: code }
}

function routePunktRef(code: string): SeasonalTripRef {
  return { kind: 'route_point', id: code, label: code }
}

function gleicheStadt(etappe: SeasonalStageKontext, scope: Extract<SeasonalSpatialScope, { kind: 'city' }>): boolean {
  return Boolean(scope.placeId && etappe.placeId && etappe.placeId === scope.placeId)
}

function etappeImRadius(
  etappe: SeasonalStageKontext,
  scope: Extract<SeasonalSpatialScope, { kind: 'point_radius' }>,
): boolean | null {
  if (etappe.latitude == null || etappe.longitude == null) return null
  return (
    entfernungKm(
      { latitude: etappe.latitude, longitude: etappe.longitude },
      { latitude: scope.latitude, longitude: scope.longitude },
    ) <= scope.radiusKm
  )
}

function routeBeruehrtLand(kontext: SeasonalReisekontext, countryCode: string | null): boolean {
  if (!countryCode) return false
  return (
    kontext.route.origin.countryCode === countryCode ||
    kontext.route.destination.countryCode === countryCode ||
    kontext.route.transitCountryCodes.includes(countryCode) ||
    kontext.route.destinationCountryCodes.includes(countryCode)
  )
}

function airportKontakte(route: RouteFacts, code: string): SeasonalKontakt[] {
  const segmente = route.segments
  const pairedInbound = new Set<number>()
  const pairedOutbound = new Set<number>()
  const kontakte: SeasonalKontakt[] = []

  for (let i = 0; i < segmente.length - 1; i += 1) {
    const ankunft = segmente[i]
    const abflug = segmente[i + 1]
    if (ankunft?.destination.airportCode !== code || abflug?.origin.airportCode !== code) continue
    kontakte.push({
      start: routeKontaktZeit(ankunft.arrivalDate, ankunft.arrivalTime),
      end: routeKontaktZeit(abflug.departureDate, abflug.departureTime),
    })
    pairedInbound.add(i)
    pairedOutbound.add(i + 1)
  }

  for (let i = 0; i < segmente.length; i += 1) {
    const segment = segmente[i]
    if (!segment) continue
    if (segment.destination.airportCode === code && !pairedInbound.has(i)) {
      const at = routeKontaktZeit(segment.arrivalDate, segment.arrivalTime)
      kontakte.push({ start: at, end: at })
    }
    if (segment.origin.airportCode === code && !pairedOutbound.has(i)) {
      const at = routeKontaktZeit(segment.departureDate, segment.departureTime)
      kontakte.push({ start: at, end: at })
    }
  }

  return kontakte
}

function routeAirportsImLand(kontext: SeasonalReisekontext, countryCode: string | null): string[] {
  if (!countryCode) return []
  const codes = new Set<string>()
  const add = (airportCode: string | null, land: string | null) => {
    if (land === countryCode && airportCode) codes.add(airportCode)
  }
  add(kontext.route.origin.airportCode, kontext.route.origin.countryCode)
  add(kontext.route.destination.airportCode, kontext.route.destination.countryCode)
  for (const segment of kontext.route.segments) {
    add(segment.origin.airportCode, segment.origin.countryCode)
    add(segment.destination.airportCode, segment.destination.countryCode)
  }
  for (const verbindung of kontext.route.connections) {
    add(verbindung.airportCode, verbindung.countryCode)
  }
  return [...codes].sort()
}

function refKontakte(kontext: SeasonalReisekontext, ref: SeasonalTripRef): SeasonalKontakt[] | null {
  if (ref.kind === 'stage') {
    const etappe = kontext.stages.find((eintrag) => eintrag.id === ref.id)
    if (!etappe) return null
    if (!etappe.arrivalDate && !etappe.departureDate) return null
    return [
      {
        start: etappe.arrivalDate ?? etappe.departureDate,
        end: etappe.departureDate ?? etappe.arrivalDate,
      },
    ]
  }
  if (ref.kind === 'airport' || ref.kind === 'route_point') {
    const kontakte = airportKontakte(kontext.route, ref.id)
    return kontakte.length > 0 ? kontakte : null
  }
  if (ref.kind === 'day') {
    const tag = kontext.days.find((eintrag) => eintrag.id === ref.id)
    return tag?.dayDate ? [{ start: tag.dayDate, end: tag.dayDate }] : null
  }
  if (ref.kind === 'item') {
    const punkt = kontext.items.find((eintrag) => eintrag.id === ref.id)
    if (!punkt) return null
    if (!punkt.startsOn && !punkt.endsOn) return null
    return [{ start: punkt.startsOn ?? punkt.endsOn, end: punkt.endsOn ?? punkt.startsOn }]
  }
  return null
}

function kontakteGegenFenster(
  kontakte: SeasonalKontakt[] | null,
  fenster: SeasonalTravelWindow,
): 'overlaps' | 'outside' | 'insufficient' {
  if (!kontakte || kontakte.length === 0) return 'insufficient'
  let trifft = false
  let unklar = false
  for (const kontakt of kontakte) {
    if (!kontakt.start && !kontakt.end) {
      unklar = true
      continue
    }
    const lage = kontaktImTravelWindow(kontakt.start, kontakt.end, fenster)
    if (lage === 'overlaps') trifft = true
    else if (lage === 'insufficient') unklar = true
  }
  if (trifft) return 'overlaps'
  if (unklar) return 'insufficient'
  return 'outside'
}

function räumlicheRelevanz(
  kontext: SeasonalReisekontext,
  scope: SeasonalSpatialScope,
): SeasonalRelevanzErgebnis {
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
    const routeImLand = routeBeruehrtLand(kontext, scope.countryCode)
    if (etappen.length === 0 && !routeImLand) {
      return {
        relevance: 'not_applies',
        precision: 'country',
        affectedRefs: [],
        reason: 'Das saisonale Muster betrifft ein anderes Land als diese Reise.',
      }
    }
    const airports = routeAirportsImLand(kontext, scope.countryCode)
    return {
      relevance: 'applies',
      precision: 'country',
      affectedRefs: [...etappen.map(etappenRef), ...airports.map((code) => routePunktRef(code))],
      unresolvedRoute: routeImLand && airports.length === 0,
      reason: 'Saisonaler Kontext auf Landesebene, ohne erfundene regionale Präzision.',
    }
  }

  if (scope.kind === 'airport' || scope.kind === 'route') {
    const gesucht = scope.kind === 'airport' ? [scope.airportCode] : scope.airportCodes
    const getroffen = kontext.airportCodes.filter((code) => gesucht.includes(code))
    if (getroffen.length === 0) {
      return {
        relevance: 'not_applies',
        precision: 'airport',
        affectedRefs: [],
        reason: 'Der betroffene Verkehrsknoten liegt nicht auf der konkreten Route.',
      }
    }
    return {
      relevance: 'applies',
      precision: scope.kind === 'airport' ? 'airport' : 'route',
      affectedRefs: getroffen.map((code) => airportRef(code)),
      reason: 'Die Flugroute oder ein Transitpunkt liegt im saisonalen Geltungsbereich.',
    }
  }

  const imSelbenLand = (etappe: SeasonalStageKontext) => {
    if ('countryCode' in scope && scope.countryCode) return etappe.countryCode === scope.countryCode
    return false
  }

  if (scope.kind === 'place') {
    const exakt = kontext.stages.filter((etappe) => etappe.placeId === scope.placeId)
    if (exakt.length > 0) {
      return {
        relevance: 'applies',
        precision: 'place',
        affectedRefs: exakt.map(etappenRef),
        unresolvedRefs: routeAirportsImLand(kontext, scope.countryCode).map((code) => routePunktRef(code)),
        unresolvedRoute: routeBeruehrtLand(kontext, scope.countryCode),
        reason: 'Der belegte Ort der Quelle entspricht einer konkreten Etappe.',
      }
    }
    const gleichesLand = kontext.stages.filter(imSelbenLand)
    if (gleichesLand.some((etappe) => !etappe.placeId)) {
      return {
        relevance: 'insufficient_context',
        precision: 'unknown',
        affectedRefs: [],
        reason: 'Der saisonale Ort ist belegt, die Etappe hat aber keinen vergleichbaren Ortsbezug.',
      }
    }
    if (gleichesLand.length > 0 && !routeBeruehrtLand(kontext, scope.countryCode)) {
      return {
        relevance: 'not_applies',
        precision: 'place',
        affectedRefs: [],
        reason: 'Das Muster liegt im selben Land, aber ausserhalb der konkreten Reisezone.',
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
      relevance: 'not_applies',
      precision: 'place',
      affectedRefs: [],
      reason: 'Kein Reiseort entspricht dem belegten saisonalen Ort.',
    }
  }

  if (scope.kind === 'admin_region') {
    if (kontext.stages.some((etappe) => etappe.countryCode === scope.countryCode) || routeBeruehrtLand(kontext, scope.countryCode)) {
      return {
        relevance: 'insufficient_context',
        precision: 'unknown',
        affectedRefs: [],
        reason: 'Die Quelle nennt eine Region, Jetnity besitzt aber keine kanonische Regionszugehörigkeit.',
      }
    }
    return {
      relevance: 'not_applies',
      precision: 'admin_region',
      affectedRefs: [],
      reason: 'Keine Etappe oder Route liegt im belegten Land der Region.',
    }
  }

  if (scope.kind === 'city') {
    if (!scope.placeId) {
      return kontext.stages.some((etappe) => etappe.countryCode === scope.countryCode) ||
        routeBeruehrtLand(kontext, scope.countryCode)
        ? {
            relevance: 'insufficient_context',
            precision: 'unknown',
            affectedRefs: [],
            reason: 'Die Stadt ist nur namentlich belegt und nicht kanonisch vergleichbar.',
          }
        : {
            relevance: 'not_applies',
            precision: 'city',
            affectedRefs: [],
            reason: 'Keine Etappe oder Route liegt im belegten Land der Stadt.',
          }
    }
    const exakt = kontext.stages.filter((etappe) => gleicheStadt(etappe, scope))
    if (exakt.length > 0) {
      return {
        relevance: 'applies',
        precision: 'city',
        affectedRefs: exakt.map(etappenRef),
        unresolvedRefs: routeAirportsImLand(kontext, scope.countryCode).map((code) => routePunktRef(code)),
        unresolvedRoute: routeBeruehrtLand(kontext, scope.countryCode),
        reason: 'Die belegte Stadt entspricht einer konkreten Etappe.',
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
        relevance: 'not_applies',
        precision: 'city',
        affectedRefs: [],
        reason: 'Das Muster liegt im selben Land, aber klar ausserhalb der konkreten Reisezone.',
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
      relevance: 'not_applies',
      precision: 'city',
      affectedRefs: [],
      reason: 'Keine Etappe liegt in der belegten Stadt.',
    }
  }

  if (scope.kind === 'point_radius') {
    const betroffen: SeasonalStageKontext[] = []
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
        relevance: 'applies',
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
      relevance: 'not_applies',
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

function zeitAufRefsAnwenden(
  kontext: SeasonalReisekontext,
  raum: SeasonalRelevanzErgebnis,
  fenster: SeasonalTravelWindow,
): SeasonalRelevanzErgebnis {
  if (raum.relevance === 'not_applies') return raum

  const trip = kontaktImTravelWindow(kontext.startDate, kontext.endDate, fenster)
  if (trip === 'before' || trip === 'after') {
    return {
      ...raum,
      relevance: 'not_applies',
      affectedRefs: [],
      reason: 'Das saisonale Fenster liegt ausserhalb des konkreten Reisezeitraums.',
    }
  }

  if (raum.relevance !== 'applies' || raum.affectedRefs.length === 0) {
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

  const passende: SeasonalTripRef[] = []
  let unklar = false
  for (const ref of raum.affectedRefs) {
    const lage = kontakteGegenFenster(refKontakte(kontext, ref), fenster)
    if (lage === 'overlaps') passende.push(ref)
    else if (lage === 'insufficient') unklar = true
  }

  let unresolvedHit = raum.unresolvedRoute === true && (raum.unresolvedRefs?.length ?? 0) === 0
  let unresolvedUnklar = false
  for (const ref of raum.unresolvedRefs ?? []) {
    const lage = kontakteGegenFenster(refKontakte(kontext, ref), fenster)
    if (lage === 'overlaps') unresolvedHit = true
    else if (lage === 'insufficient') unresolvedUnklar = true
  }

  if (passende.length > 0) {
    return {
      ...raum,
      affectedRefs: passende,
      reason:
        passende.length === raum.affectedRefs.length
          ? raum.reason
          : 'Nur der zeitlich überschneidende Reiseteil fällt in dieses saisonale Fenster.',
    }
  }
  if (unklar || unresolvedUnklar || unresolvedHit) {
    return {
      ...raum,
      relevance: 'insufficient_context',
      affectedRefs: [],
      reason: unresolvedHit
        ? 'Die Route berührt das Land erneut, die feinere Ortszugehörigkeit ist aber nicht belegt.'
        : 'Für einen zeitlichen Abgleich des betroffenen Reiseteils fehlen belastbare Daten.',
    }
  }
  return {
    ...raum,
    relevance: 'not_applies',
    affectedRefs: [],
    reason: 'Das saisonale Fenster liegt ausserhalb des konkreten Zeitraums des betroffenen Reiseteils.',
  }
}

export function räumlichZeitlicheRelevanz(
  kontext: SeasonalReisekontext,
  scope: SeasonalSpatialScope,
  fenster: SeasonalTravelWindow,
): SeasonalRelevanzErgebnis {
  return zeitAufRefsAnwenden(kontext, räumlicheRelevanz(kontext, scope), fenster)
}
