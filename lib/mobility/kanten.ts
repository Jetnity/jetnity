// lib/mobility/kanten.ts
//
// Deterministische Verbindungsbedarfe aus Origin, Etappen und vorhandenen
// Flug-/Transfer-Planpunkten. Keine angenommenen Wegezeiten zwischen
// Flughafen, Bahnhof, Hotel oder Hafen. Kein erfundener Mindestumstieg.
//
// Fehlende oder mehrdeutige Graphdaten bleiben unbestimmt.
// Frei von React, Next und Providern.

import { istGebucht } from '@/lib/trips/buchung'
import { istMobilitaetspunkt } from '@/lib/trips/mobilitaet-felder'
import type { Trip, TripItem, TripStage } from '@/types/trips'

function allePunkte(reise: Trip, ohneTag: readonly TripItem[]): TripItem[] {
  const extra = ohneTag.length > 0 ? ohneTag : reise.ohneTag
  return [...reise.days.flatMap((tag) => tag.items), ...extra]
}

export type BewegungsArt = 'outbound' | 'connection' | 'return'

export type BewegungsStatus = 'open' | 'selected' | 'booked' | 'unknown' | 'covered_by_flight'

export type Bewegungskante = {
  id: string
  art: BewegungsArt
  originName: string
  destinationName: string
  originPlaceId: string | null
  destinationPlaceId: string | null
  date: string | null
  status: BewegungsStatus
  flightItem: TripItem | null
  mobilityItem: TripItem | null
  /** Nur wenn Abfahrt und Ankunft vollständig als Ortszeit vorliegen. */
  durationMinutes: number | null
}

export type MobilitaetsAbdeckung = {
  bestimmbar: boolean
  kanten: Bewegungskante[]
  unzugeordnet: TripItem[]
  zusammenfassung: string
}

function nameGleich(links: string | null | undefined, rechts: string | null | undefined): boolean {
  const a = links?.trim().toLocaleLowerCase('de-CH') ?? ''
  const b = rechts?.trim().toLocaleLowerCase('de-CH') ?? ''
  return a.length > 0 && a === b
}

function selberOrt(
  links: { name: string | null | undefined; placeId: string | null | undefined },
  rechts: { name: string | null | undefined; placeId: string | null | undefined },
): boolean {
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

function transferOrt(punkt: TripItem, seite: 'origin' | 'destination'): {
  name: string | null
  placeId: string | null
} {
  if (seite === 'origin') {
    return {
      name: punkt.originName ?? null,
      placeId: punkt.originPlaceId ?? null,
    }
  }
  return {
    name: punkt.destinationName ?? null,
    placeId: punkt.destinationPlaceId ?? null,
  }
}

function passtAnKante(
  punkt: TripItem,
  kante: Pick<Bewegungskante, 'originName' | 'destinationName' | 'originPlaceId' | 'destinationPlaceId' | 'date'>,
): boolean {
  const start = transferOrt(punkt, 'origin')
  const ziel = transferOrt(punkt, 'destination')
  const startBekannt = Boolean(start.placeId || start.name)
  const zielBekannt = Boolean(ziel.placeId || ziel.name)
  if (!startBekannt || !zielBekannt) return false
  if (!selberOrt(start, { name: kante.originName, placeId: kante.originPlaceId })) return false
  if (!selberOrt(ziel, { name: kante.destinationName, placeId: kante.destinationPlaceId })) return false
  if (!kante.date || !punkt.startsOn) return false
  return punkt.startsOn === kante.date
}

function minutenZwischen(punkt: TripItem): number | null {
  if (!punkt.startsOn || !punkt.startsAt || !punkt.endsOn || !punkt.endsAt) return null
  const start = Date.parse(`${punkt.startsOn}T${punkt.startsAt}:00Z`)
  const ende = Date.parse(`${punkt.endsOn}T${punkt.endsAt}:00Z`)
  if (!Number.isFinite(start) || !Number.isFinite(ende) || ende < start) return null
  return Math.round((ende - start) / 60_000)
}

function statusWort(status: BewegungsStatus): string {
  if (status === 'booked') return 'gebucht'
  if (status === 'selected') return 'ausgewählt'
  if (status === 'covered_by_flight') return 'über Flug abgedeckt'
  if (status === 'open') return 'offen'
  return 'noch nicht vollständig bestimmbar'
}

function kanteWort(kante: Bewegungskante): string {
  return `${kante.originName} → ${kante.destinationName} ${statusWort(kante.status)}`
}

function zusammenfassungAus(
  bestimmbar: boolean,
  kanten: readonly Bewegungskante[],
  transfers: readonly TripItem[],
): string {
  if (!bestimmbar) {
    if (transfers.length === 0) return 'Noch keine Verbindung geplant'
    if (transfers.length === 1) {
      return '1 Verbindung geplant · Abdeckung noch nicht vollständig bestimmbar'
    }
    return `${transfers.length} Verbindungen geplant · Abdeckung noch nicht vollständig bestimmbar`
  }

  const mobilitaet = kanten.filter((kante) => kante.status !== 'covered_by_flight')
  if (mobilitaet.length === 0 && transfers.length === 0) {
    return kanten.length === 0
      ? 'Keine Verbindung erforderlich'
      : 'Keine offene Bodenverbindung erkennbar'
  }

  if (mobilitaet.some((kante) => kante.status === 'unknown') || (!bestimmbar && transfers.length > 0)) {
    const bekannte = mobilitaet.filter((kante) => kante.status !== 'unknown')
    if (bekannte.length === 0) {
      if (transfers.length === 0) return 'noch nicht vollständig bestimmbar'
      return transfers.length === 1
        ? '1 Verbindung geplant · weitere Abschnitte noch nicht vollständig bestimmbar'
        : `${transfers.length} Verbindungen geplant · weitere Abschnitte noch nicht vollständig bestimmbar`
    }
    return `${bekannte.map(kanteWort).join(' · ')} · weitere Abschnitte noch nicht vollständig bestimmbar`
  }

  if (mobilitaet.every((kante) => kante.status === 'open') && transfers.length === 0) {
    return 'Noch keine Verbindung geplant'
  }

  if (mobilitaet.length === 0) {
    return transfers.length === 1 ? '1 Verbindung geplant' : `${transfers.length} Verbindungen geplant`
  }

  return mobilitaet.map(kanteWort).join(' · ')
}

function benoetigteKanten(reise: Trip): {
  bestimmbar: boolean
  roh: Omit<Bewegungskante, 'status' | 'flightItem' | 'mobilityItem' | 'durationMinutes'>[]
} {
  const origin = originOrt(reise)
  const etappen = reise.stages.filter((etappe) => etappe.name.trim().length > 0)
  if (!origin || etappen.length === 0) return { bestimmbar: false, roh: [] }

  const roh: Omit<Bewegungskante, 'status' | 'flightItem' | 'mobilityItem' | 'durationMinutes'>[] = []
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

function einenNehmen(liste: TripItem[], treffer: TripItem[]): TripItem | null {
  if (treffer.length !== 1) return null
  const item = treffer[0]
  const stelle = liste.findIndex((eintrag) => eintrag.id === item.id)
  if (stelle >= 0) liste.splice(stelle, 1)
  return item
}

export function mobilitaetsAbdeckung(reise: Trip, ohneTag: readonly TripItem[] = []): MobilitaetsAbdeckung {
  const alle = allePunkte(reise, ohneTag)
  const transfers = alle.filter(istMobilitaetspunkt)
  const fluege = alle.filter((punkt) => punkt.kind === 'flight')
  const { bestimmbar, roh } = benoetigteKanten(reise)

  if (!bestimmbar) {
    return {
      bestimmbar: false,
      kanten: [],
      unzugeordnet: transfers,
      zusammenfassung: zusammenfassungAus(false, [], transfers),
    }
  }

  const restTransfers = [...transfers]
  const restFluege = [...fluege]

  const kanten: Bewegungskante[] = roh.map((kante) => {
    if (!kante.date) {
      return {
        ...kante,
        status: 'unknown',
        flightItem: null,
        mobilityItem: null,
        durationMinutes: null,
      }
    }

    const transferTreffer = restTransfers.filter((punkt) => passtAnKante(punkt, kante))
    const flugTreffer = restFluege.filter((flug) => flug.startsOn === kante.date)

    if (transferTreffer.length > 1 || flugTreffer.length > 1) {
      return {
        ...kante,
        status: 'unknown',
        flightItem: null,
        mobilityItem: null,
        durationMinutes: null,
      }
    }

    if (transferTreffer.length === 1 && flugTreffer.length === 1) {
      return {
        ...kante,
        status: 'unknown',
        flightItem: null,
        mobilityItem: null,
        durationMinutes: null,
      }
    }

    const mobilityItem = einenNehmen(restTransfers, transferTreffer)
    const flightItem = einenNehmen(restFluege, flugTreffer)

    if (mobilityItem) {
      return {
        ...kante,
        status: istGebucht(mobilityItem) ? 'booked' : 'selected',
        flightItem: null,
        mobilityItem,
        durationMinutes: minutenZwischen(mobilityItem),
      }
    }

    if (flightItem) {
      return {
        ...kante,
        status: 'covered_by_flight',
        flightItem,
        mobilityItem: null,
        durationMinutes: minutenZwischen(flightItem),
      }
    }

    return {
      ...kante,
      status: 'open',
      flightItem: null,
      mobilityItem: null,
      durationMinutes: null,
    }
  })

  if (restTransfers.length > 0) {
    for (const kante of kanten) {
      if (kante.status === 'open' && !kante.mobilityItem && !kante.flightItem) {
        kante.status = 'unknown'
      }
    }
  }

  return {
    bestimmbar: true,
    kanten,
    unzugeordnet: restTransfers,
    zusammenfassung: zusammenfassungAus(true, kanten, transfers),
  }
}
