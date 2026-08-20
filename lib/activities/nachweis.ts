// lib/activities/nachweis.ts
//
// Serverseitige Vertrauensnaht für eine Aktivitätsauswahl.
//
// ActivityProvider.suchen() bleibt schmal. Diese Schnittstelle bestätigt eine
// konkrete Option gegen den erwarteten Suchkontext, bevor ein Konto sie als
// kommerziellen activity-Punkt speichert. Search-Provider und Affiliate-/
// Booking-Partner müssen nicht identisch sein.
//
// Frei von Next, Secrets und Anbieter-SDKs.

import { activityZielKennungAus, type ActivityOption, type ActivityTimeslot } from '@/lib/activities/domain'
import { activityOptionLesen } from '@/lib/activities/schema'
import type { Trip, TripDay, TripStage } from '@/types/trips'

export type ActivityNachweisFehlerArt =
  | 'unavailable'
  | 'unbekannt'
  | 'abgelaufen'
  | 'geaendert'
  | 'invalid'
  | 'error'

export type ActivityNachweisKontext = {
  destinationPlaceId: string
  dayDate: string | null
  participants: number
  currency: string
  timeslot: ActivityTimeslot | null
}

export type ActivityNachweisErgebnis =
  | { ok: true; option: ActivityOption }
  | { ok: false; art: ActivityNachweisFehlerArt; message: string }

export type ActivityNachweis = {
  nachweisen(eingabe: {
    optionId: string
    kontext: ActivityNachweisKontext
  }): Promise<ActivityNachweisErgebnis>
}

const ACTIVITY_NACHWEIS_MELDUNG: Record<ActivityNachweisFehlerArt, string> = {
  unavailable: 'Aktivitäten können noch nicht verbindlich in die Reise übernommen werden.',
  unbekannt: 'Diese Aktivitätsauswahl ist unbekannt.',
  abgelaufen: 'Diese Aktivitätsauswahl ist nicht mehr gültig.',
  geaendert: 'Dieses Angebot hat sich geändert. Bitte suche erneut.',
  invalid: 'Diese Aktivitätsauswahl ist unvollständig.',
  error: 'Die Aktivitätsauswahl konnte gerade nicht bestätigt werden.',
}

export function activityNachweisFehler(
  art: ActivityNachweisFehlerArt,
): Extract<ActivityNachweisErgebnis, { ok: false }> {
  return { ok: false, art, message: ACTIVITY_NACHWEIS_MELDUNG[art] }
}

function timeslotGleich(a: ActivityTimeslot | null, b: ActivityTimeslot | null): boolean {
  if (a === null && b === null) return true
  if (a === null || b === null) return false
  return (
    a.startsOn === b.startsOn &&
    a.startsAt === b.startsAt &&
    a.endsOn === b.endsOn &&
    a.endsAt === b.endsAt
  )
}

export function activityNachweisKontextGleich(
  a: ActivityNachweisKontext,
  b: ActivityNachweisKontext,
): boolean {
  return (
    a.destinationPlaceId === b.destinationPlaceId &&
    a.dayDate === b.dayDate &&
    a.participants === b.participants &&
    a.currency === b.currency &&
    timeslotGleich(a.timeslot, b.timeslot)
  )
}

export function activityNachweisKontextAusGraph(
  reise: Pick<Trip, 'travellers' | 'currency'>,
  graph: { etappe: Pick<TripStage, 'id' | 'placeId'>; tag: Pick<TripDay, 'dayDate'> },
): Omit<ActivityNachweisKontext, 'timeslot'> {
  return {
    destinationPlaceId: activityZielKennungAus(graph.etappe),
    dayDate: graph.tag.dayDate,
    participants: reise.travellers,
    currency: reise.currency.trim().toUpperCase(),
  }
}

function graphKontextGleich(
  erwartet: ActivityNachweisKontext,
  kontext: Omit<ActivityNachweisKontext, 'timeslot'> | ActivityNachweisKontext,
): boolean {
  return (
    erwartet.destinationPlaceId === kontext.destinationPlaceId &&
    erwartet.dayDate === kontext.dayDate &&
    erwartet.participants === kontext.participants &&
    erwartet.currency === kontext.currency
  )
}

/**
 * Phase 3.3: Es gibt keinen serverseitigen Nachweis.
 * Die Konto-Übernahme bleibt fail closed, bis ein Adapter oder ein
 * Jetnity-eigener Nachweis diese Naht implementiert.
 */
export function activityNachweisAusUmgebung(): ActivityNachweis | null {
  return null
}

export type ActivityNachweisKatalog = {
  optionen?: Record<string, unknown>
  kontexte?: Record<string, ActivityNachweisKontext>
  abgelaufen?: readonly string[]
  geaendert?: readonly string[]
  fehler?: Partial<Record<string, ActivityNachweisFehlerArt>>
}

/** Fake-Nachweis für Tests. Kein Produktionsweg. */
export function activityNachweisAusKatalog(katalog: ActivityNachweisKatalog): ActivityNachweis {
  const abgelaufen = new Set(katalog.abgelaufen ?? [])
  const geaendert = new Set(katalog.geaendert ?? [])
  const fehler = katalog.fehler ?? {}

  return {
    async nachweisen({ optionId, kontext }) {
      const id = optionId.trim()
      if (!id) return activityNachweisFehler('invalid')

      const art = fehler[id]
      if (art) return activityNachweisFehler(art)
      if (abgelaufen.has(id)) return activityNachweisFehler('abgelaufen')
      if (geaendert.has(id)) return activityNachweisFehler('geaendert')

      const roh = katalog.optionen?.[id]
      if (roh === undefined) return activityNachweisFehler('unbekannt')
      const option = activityOptionLesen(roh)
      if (!option) return activityNachweisFehler('invalid')
      const erwartet = katalog.kontexte?.[id]
      if (
        !erwartet ||
        !graphKontextGleich(erwartet, kontext) ||
        !timeslotGleich(erwartet.timeslot, option.timeslot)
      ) {
        return activityNachweisFehler('geaendert')
      }
      return { ok: true, option }
    },
  }
}
