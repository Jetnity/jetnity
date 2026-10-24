// Ziel und Vorgabe für die drei bestehenden manuellen Editoren.
// Keine Schreiblogik, keine Providerwahrheit, kein React.

import { MOBILITY_MODES, type MobilityMode, type Trip } from '@/types/trips'

export type EditorKontext = {
  reiseId: string
  zielId: string
}

export function gleicherEditorKontext(aktuell: EditorKontext, erfasst: EditorKontext): boolean {
  return aktuell.reiseId === erfasst.reiseId && aktuell.zielId === erfasst.zielId
}

export type VerbindungsVorgabeEingang = {
  mode?: string
  originName?: string
  destinationName?: string
  originPlaceId?: string | null
  dayId?: string | null
  destinationPlaceId?: string | null
  startsOn?: string | null
}

export type VerbindungsVorgabe = {
  mode: MobilityMode
  originName: string
  destinationName: string
  originPlaceId: string | null
  destinationPlaceId: string | null
  dayId: string
  startsOn: string
}

type ReiseFuerVorgabe = Pick<Trip, 'origin' | 'startDate' | 'stages' | 'days'>

function modus(wert: string | undefined): MobilityMode {
  return (MOBILITY_MODES as readonly string[]).includes(wert ?? '') ? wert as MobilityMode : 'rail'
}

/** Dieselbe Vorbelegung wie der bisherige Erstzustand. Eine gesetzte Vorgabe ersetzt Reisedatum und ersten Tag, auch mit leeren Werten. */
export function verbindungsVorgabeAus(reise: ReiseFuerVorgabe, vorgabe?: VerbindungsVorgabeEingang): VerbindungsVorgabe {
  return {
    mode: modus(vorgabe?.mode),
    originName: vorgabe?.originName ?? reise.origin ?? '',
    destinationName: vorgabe?.destinationName ?? reise.stages[0]?.name ?? '',
    originPlaceId: vorgabe?.originPlaceId ?? null,
    destinationPlaceId: vorgabe?.destinationPlaceId ?? null,
    startsOn: vorgabe ? vorgabe.startsOn ?? '' : reise.startDate ?? '',
    dayId: vorgabe ? vorgabe.dayId ?? '' : reise.days[0]?.id ?? '',
  }
}

export function vorgabeSchluessel(vorgabe: VerbindungsVorgabe): string {
  return JSON.stringify([
    vorgabe.mode,
    vorgabe.originName,
    vorgabe.destinationName,
    vorgabe.originPlaceId ?? '',
    vorgabe.destinationPlaceId ?? '',
    vorgabe.dayId,
    vorgabe.startsOn,
  ])
}

export function feldFolgtVorgabe(aktuell: string, angewendet: string): boolean {
  return aktuell === angewendet
}
