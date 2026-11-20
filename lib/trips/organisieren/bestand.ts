// lib/trips/organisieren/bestand.ts
//
// «Das hast du schon» in Organisieren: die Planpunkte einer Kategorie, die
// schon in der Reise stehen. Stand und Preis kommen aus denselben Regeln wie
// das Kostenbild, damit beide Stellen nie verschieden urteilen.

import { planpunktWann } from '@/lib/trips/datum-anzeige'
import { gespeicherterPreis, kostenStand, type GespeicherterPreis, type KostenStand } from '@/lib/trips/kostenbild'
import { inventar } from '@/lib/trips/trip-plan-integrated/day'
import type { Suchkategorie } from '@/lib/trips/workspace-mode'
import type { Trip, TripItem, TripItemKind } from '@/types/trips'

const ARTEN: Record<Suchkategorie, readonly TripItemKind[]> = {
  fluege: ['flight'],
  unterkunft: ['stay'],
  aktivitaeten: ['activity'],
  mietwagen: ['rental_car'],
  verbindungen: ['transfer'],
}

export type BestandEintrag = {
  id: string
  titel: string
  stand: KostenStand
  preis: GespeicherterPreis
  /** Lesbarer Zeitpunkt, etwa «10. Feb. · 13:05» oder «10.–13. Feb.»; `null`, wenn kein Datum gespeichert ist. */
  wann: string | null
}

function tagDatum(punkt: TripItem, tage: ReadonlyMap<string, string | null>): string | null {
  return punkt.startsOn ?? (punkt.dayId ? tage.get(punkt.dayId) ?? null : null)
}

export function organisierenBestand(
  reise: Trip,
  ohneTag: readonly TripItem[],
  kategorie: Suchkategorie,
): BestandEintrag[] {
  const { items } = inventar(ohneTag === reise.ohneTag ? reise : { ...reise, ohneTag: [...ohneTag] })
  const tage = new Map(reise.days.map((tag) => [tag.id, tag.dayDate]))
  const arten = ARTEN[kategorie]
  return items
    .filter((punkt) => arten.includes(punkt.kind))
    .map((punkt) => ({ punkt, datum: tagDatum(punkt, tage) }))
    .sort((a, b) => {
      if (a.datum !== b.datum) return a.datum === null ? 1 : b.datum === null ? -1 : a.datum < b.datum ? -1 : 1
      const zeitA = a.punkt.startsAt ?? ''
      const zeitB = b.punkt.startsAt ?? ''
      if (zeitA !== zeitB) return zeitA < zeitB ? -1 : 1
      return a.punkt.title.localeCompare(b.punkt.title, 'de')
    })
    .map(({ punkt, datum }) => ({
      id: punkt.id,
      titel: punkt.title,
      stand: kostenStand(punkt),
      preis: gespeicherterPreis(punkt),
      wann: planpunktWann(punkt, datum),
    }))
}
