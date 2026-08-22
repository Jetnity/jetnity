// lib/readiness/uebernahme.ts
//
// Guest → Account: idempotente Übernahme ohne Duplikate.
// Planpunkt-IDs der Gastreise gelten im Konto nicht. Confirmation-Checks
// werden über Art, Daten und Titel neu zugeordnet.

import { readinessItemBauen } from '@/lib/readiness/bauen'
import { readinessItemsVon } from '@/lib/readiness/domain'
import { planpunkteSammeln } from '@/lib/trips/arbeitsbereich'
import type { Trip, TripReadinessItem } from '@/types/trips'

export type ReadinessUebernahmeItemEingabe = {
  clientRef: string
  kind: TripReadinessItem['kind']
  userStatus: TripReadinessItem['userStatus']
  countryCode: string | null
  title: string | null
  itemKind?: string | null
  itemStartsOn?: string | null
  itemEndsOn?: string | null
  itemTitle?: string | null
}

export function readinessAlsUebernahme(reise: Trip): ReadinessUebernahmeItemEingabe[] {
  const punkte = planpunkteSammeln(reise, reise.ohneTag)
  return readinessItemsVon(reise).map((item) => {
    const punkt = item.tripItemId ? punkte.find((eintrag) => eintrag.id === item.tripItemId) : null
    return {
      clientRef: item.clientRef,
      kind: item.kind,
      userStatus: item.userStatus,
      countryCode: item.countryCode,
      title: item.title,
      itemKind: punkt?.kind ?? null,
      itemStartsOn: punkt?.startsOn ?? null,
      itemEndsOn: punkt?.endsOn ?? null,
      itemTitle: punkt?.title ?? null,
    }
  })
}

export function tripItemFuerUebernahme(
  reise: Trip,
  hinweis: Pick<ReadinessUebernahmeItemEingabe, 'itemKind' | 'itemStartsOn' | 'itemEndsOn' | 'itemTitle'>,
): string | null {
  if (!hinweis.itemKind) return null
  const kandidaten = planpunkteSammeln(reise, reise.ohneTag).filter((punkt) => {
    if (punkt.kind !== hinweis.itemKind) return false
    if (hinweis.itemStartsOn && punkt.startsOn !== hinweis.itemStartsOn) return false
    if (hinweis.itemEndsOn && punkt.endsOn !== hinweis.itemEndsOn) return false
    if (hinweis.itemTitle && punkt.title !== hinweis.itemTitle) return false
    return punkt.bookingStatus === 'booked'
  })
  return kandidaten.length === 1 ? kandidaten[0].id : null
}

export function readinessNachUebernahmeBauen(
  reise: Trip,
  items: readonly ReadinessUebernahmeItemEingabe[],
): TripReadinessItem[] {
  const ergebnis: TripReadinessItem[] = []
  const gesehen = new Set<string>()

  for (const item of items) {
    if (gesehen.has(item.clientRef)) continue
    gesehen.add(item.clientRef)

    const tripItemId =
      item.kind === 'ticket_confirmation_check' || item.kind === 'booking_confirmation_check'
        ? tripItemFuerUebernahme(reise, item)
        : null

    const gebaut = readinessItemBauen(reise, {
      clientRef: item.clientRef,
      kind: item.kind,
      userStatus: item.userStatus,
      countryCode: item.countryCode,
      tripItemId,
      title: item.title,
    })
    if (gebaut.ok) ergebnis.push(gebaut.item)
  }

  return ergebnis
}

