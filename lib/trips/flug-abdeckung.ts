// lib/trips/flug-abdeckung.ts
//
// Ehrliche Flugabdeckung aus Origin, Etappen und gespeicherten Flug-Items.
//
// Keine erfundenen Flüge, keine geratenen IATA-Codes. Ein Abschnitt gilt nur
// dann als offen, ausgewählt oder gebucht, wenn die Zuordnung aus dem Graphen
// deterministisch ist. Sonst bleibt er unbestimmt.
//
// Frei von React, Next und Providern.

import { istGebucht } from '@/lib/trips/buchung'
import type { Trip, TripItem, TripStage } from '@/types/trips'

function allePunkte(reise: Trip, ohneTag: readonly TripItem[]): TripItem[] {
  const extra = ohneTag.length > 0 ? ohneTag : reise.ohneTag
  return [...reise.days.flatMap((tag) => tag.items), ...extra]
}

export type FlugAbschnittArt = 'outbound' | 'connection' | 'return'

export type FlugAbschnittStatus = 'open' | 'selected' | 'booked' | 'unknown'

export type FlugAbschnitt = {
  id: string
  art: FlugAbschnittArt
  originName: string
  destinationName: string
  originPlaceId: string | null
  destinationPlaceId: string | null
  date: string | null
  status: FlugAbschnittStatus
  item: TripItem | null
}

export type FlugAbdeckung = {
  bestimmbar: boolean
  abschnitte: FlugAbschnitt[]
  unzugeordnet: TripItem[]
  zusammenfassung: string
}

function nameGleich(links: string | null | undefined, rechts: string | null | undefined): boolean {
  const a = links?.trim().toLocaleLowerCase('de-CH') ?? ''
  const b = rechts?.trim().toLocaleLowerCase('de-CH') ?? ''
  return a.length > 0 && a === b
}

function selberOrt(links: {
  name: string | null | undefined
  placeId: string | null | undefined
}, rechts: {
  name: string | null | undefined
  placeId: string | null | undefined
}): boolean {
  if (links.placeId && rechts.placeId) return links.placeId === rechts.placeId
  return nameGleich(links.name, rechts.name)
}

function datumOderNull(wert: string | null | undefined): string | null {
  return wert && /^\d{4}-\d{2}-\d{2}$/.test(wert) ? wert : null
}

function originOrt(reise: Trip): { name: string; placeId: string | null } | null {
  const name = reise.origin?.trim() ?? ''
  if (!name && !reise.originPlaceId) return null
  if (!name) return null
  return { name, placeId: reise.originPlaceId }
}

function etappenOrt(etappe: TripStage): { name: string; placeId: string | null } {
  return { name: etappe.name.trim(), placeId: etappe.placeId }
}

function statusVon(item: TripItem | null, fallback: FlugAbschnittStatus): FlugAbschnittStatus {
  if (!item) return fallback
  return istGebucht(item) ? 'booked' : 'selected'
}

function abschnittWort(abschnitt: FlugAbschnitt): string {
  const lage =
    abschnitt.status === 'booked'
      ? 'gebucht'
      : abschnitt.status === 'selected'
        ? 'ausgewählt'
        : abschnitt.status === 'open'
          ? 'offen'
          : 'noch nicht vollständig bestimmbar'

  if (abschnitt.art === 'outbound') return `Hinflug ${lage}`
  if (abschnitt.art === 'return') return `Rückflug ${lage}`
  return `${abschnitt.originName} → ${abschnitt.destinationName} ${lage}`
}

function zusammenfassungAus(
  bestimmbar: boolean,
  abschnitte: readonly FlugAbschnitt[],
  fluge: readonly TripItem[],
): string {
  if (!bestimmbar) {
    if (fluge.length === 0) return 'Noch kein Flug ausgewählt'
    if (fluge.length === 1) return '1 Flug ausgewählt · Abdeckung noch nicht vollständig bestimmbar'
    return `${fluge.length} Flüge ausgewählt · Abdeckung noch nicht vollständig bestimmbar`
  }

  if (abschnitte.length === 0) {
    if (fluge.length === 0) return 'Kein Flugabschnitt erforderlich'
    return fluge.length === 1 ? '1 Flug ausgewählt' : `${fluge.length} Flüge ausgewählt`
  }

  if (abschnitte.some((abschnitt) => abschnitt.status === 'unknown')) {
    const bekannte = abschnitte.filter((abschnitt) => abschnitt.status !== 'unknown')
    if (bekannte.length === 0) return 'noch nicht vollständig bestimmbar'
    return `${bekannte.map(abschnittWort).join(' · ')} · weitere Abschnitte noch nicht vollständig bestimmbar`
  }

  if (abschnitte.every((abschnitt) => abschnitt.status === 'open') && fluge.length === 0) {
    return 'Noch kein Flug ausgewählt'
  }

  return abschnitte.map(abschnittWort).join(' · ')
}

function benoetigteAbschnitte(reise: Trip): { bestimmbar: boolean; roh: Omit<FlugAbschnitt, 'status' | 'item'>[] } {
  const origin = originOrt(reise)
  const etappen = reise.stages.filter((etappe) => etappe.name.trim().length > 0)
  if (!origin || etappen.length === 0) return { bestimmbar: false, roh: [] }

  const roh: Omit<FlugAbschnitt, 'status' | 'item'>[] = []
  const erste = etappen[0]
  const letzte = etappen[etappen.length - 1]

  if (!selberOrt(origin, etappenOrt(erste))) {
    roh.push({
      id: `outbound:${erste.id}`,
      art: 'outbound',
      originName: origin.name,
      destinationName: erste.name,
      originPlaceId: origin.placeId,
      destinationPlaceId: erste.placeId,
      date: datumOderNull(erste.arrivalDate) ?? datumOderNull(reise.startDate),
    })
  }

  for (let i = 1; i < etappen.length; i += 1) {
    const von = etappen[i - 1]
    const nach = etappen[i]
    if (selberOrt(etappenOrt(von), etappenOrt(nach))) continue
    roh.push({
      id: `connection:${von.id}:${nach.id}`,
      art: 'connection',
      originName: von.name,
      destinationName: nach.name,
      originPlaceId: von.placeId,
      destinationPlaceId: nach.placeId,
      date: datumOderNull(nach.arrivalDate),
    })
  }

  if (!selberOrt(origin, etappenOrt(letzte))) {
    roh.push({
      id: `return:${letzte.id}`,
      art: 'return',
      originName: letzte.name,
      destinationName: origin.name,
      originPlaceId: letzte.placeId,
      destinationPlaceId: origin.placeId,
      date: datumOderNull(letzte.departureDate) ?? datumOderNull(reise.endDate),
    })
  }

  return { bestimmbar: true, roh }
}

export function flugAbdeckung(reise: Trip, ohneTag: readonly TripItem[] = []): FlugAbdeckung {
  const fluge = allePunkte(reise, ohneTag).filter((punkt) => punkt.kind === 'flight')
  const { bestimmbar, roh } = benoetigteAbschnitte(reise)

  if (!bestimmbar) {
    return {
      bestimmbar: false,
      abschnitte: [],
      unzugeordnet: fluge,
      zusammenfassung: zusammenfassungAus(false, [], fluge),
    }
  }

  const rest = [...fluge]
  const abschnitte: FlugAbschnitt[] = roh.map((abschnitt) => {
    if (!abschnitt.date) {
      return { ...abschnitt, status: rest.length > 0 ? 'unknown' : 'open', item: null }
    }
    const treffer = rest.filter((flug) => flug.startsOn === abschnitt.date)
    if (treffer.length === 1) {
      const item = treffer[0]
      const stelle = rest.findIndex((flug) => flug.id === item.id)
      if (stelle >= 0) rest.splice(stelle, 1)
      return { ...abschnitt, status: statusVon(item, 'open'), item }
    }
    if (treffer.length > 1) {
      return { ...abschnitt, status: 'unknown', item: null }
    }
    return { ...abschnitt, status: 'open', item: null }
  })

  if (rest.length > 0) {
    for (const abschnitt of abschnitte) {
      if (abschnitt.status === 'open' && !abschnitt.item) abschnitt.status = 'unknown'
    }
  }

  return {
    bestimmbar: true,
    abschnitte,
    unzugeordnet: rest,
    zusammenfassung: zusammenfassungAus(true, abschnitte, fluge),
  }
}
