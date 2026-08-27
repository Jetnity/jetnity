// lib/trips/uebersicht.ts
//
// Presentation-Derivation der Reiseübersicht. Keine persistierte Wahrheit,
// kein zweiter trips.status, kein Shadow-Lifecycle (ADR-0164 / TW-2).
//
// Zeitliche Lage kommt aus derselben AP-3-Date-only-Funktion. Coverage-Texte
// und ihre maschinenlesbare Presentation-Lage kommen gemeinsam aus
// bereichStatus / planStatus. Personen aus party[] oder ehrlich nur als Anzahl.
// Citizenships werden nicht gelesen.

import { heutigesDatum } from '@/lib/account/naechste-reise'
import { reiseGruppe, type ReiseGruppe } from '@/lib/account/reise-lage'
import {
  bereichStatus,
  planStatus,
  type BereichLage,
  type BereichStatus,
} from '@/lib/trips/arbeitsbereich'
import { reiseOrte } from '@/lib/trips/reise-orte'
import type { Trip, TripItem } from '@/types/trips'

export type UebersichtLage = ReiseGruppe

export type AbdeckungLage = BereichLage

export type UebersichtPerson = {
  anzahl: number
  quelle: 'party' | 'travellers'
  text: string
}

export type UebersichtAbdeckung = {
  bereich: BereichStatus['bereich']
  lage: AbdeckungLage
  text: string
  anzahl: number
}

export type UebersichtAbleitung = {
  titel: string
  orte: string
  zeitraum: string
  lage: UebersichtLage | null
  lageText: string
  personen: UebersichtPerson
  abdeckungen: UebersichtAbdeckung[]
  planText: string
  fortschrittText: string
}

const KURZES_DATUM = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

const LAGE_TEXT: Record<UebersichtLage, string> = {
  aktiv: 'Reise läuft',
  kommend: 'Bevorstehende Reise',
  vergangen: 'Vergangene Reise',
  'ohne-datum': 'Zeitraum noch offen',
}

function alsDatum(wert: string) {
  return new Date(`${wert}T00:00:00Z`)
}

function uebersichtZeitraum(reise: Pick<Trip, 'startDate' | 'endDate'>): string {
  if (!reise.startDate || !reise.endDate) return 'Zeitraum noch offen'
  return `${KURZES_DATUM.format(alsDatum(reise.startDate))} – ${KURZES_DATUM.format(alsDatum(reise.endDate))}`
}

export function uebersichtLage(
  reise: Pick<Trip, 'startDate' | 'endDate'>,
  heute?: string | null,
): UebersichtLage | null {
  if (!heute) return null
  return reiseGruppe(reise, heute)
}

function uebersichtLageText(lage: UebersichtLage | null): string {
  if (!lage) return 'Zeitliche Lage noch nicht bestimmbar'
  return LAGE_TEXT[lage]
}

export function uebersichtPersonen(reise: Pick<Trip, 'travellers' | 'party'>): UebersichtPerson {
  const party = reise.party ?? []
  if (party.length > 0) {
    const anzahl = party.length
    return {
      anzahl,
      quelle: 'party',
      text: anzahl === 1 ? '1 Reisende Person' : `${anzahl} Reisende`,
    }
  }

  const anzahl = reise.travellers
  return {
    anzahl,
    quelle: 'travellers',
    text:
      anzahl === 1 ? '1 Reisende Person · Angaben noch offen' : `${anzahl} Reisende · Angaben noch offen`,
  }
}

function fortschrittAus(abdeckungen: readonly UebersichtAbdeckung[]): string {
  const belegt = abdeckungen.filter((eintrag) => eintrag.lage === 'belegt').length
  const teilweise = abdeckungen.filter((eintrag) => eintrag.lage === 'teilweise').length
  const offen = abdeckungen.filter((eintrag) => eintrag.lage === 'offen').length
  const unbestimmt = abdeckungen.filter((eintrag) => eintrag.lage === 'unbestimmt').length
  const gesamt = abdeckungen.length

  if (unbestimmt === gesamt) return 'Abdeckung noch nicht vollständig bestimmbar'
  if (offen === gesamt) return 'Noch nichts ausgewählt'
  if (belegt === gesamt) return 'Wesentliche Bereiche sind belegt'

  const teile: string[] = []
  if (belegt > 0) teile.push(`${belegt} von ${gesamt} Bereichen belegt`)
  if (teilweise > 0) teile.push(`${teilweise} teilweise abgedeckt`)
  if (offen > 0) teile.push(`${offen} offen`)
  if (unbestimmt > 0) teile.push(`${unbestimmt} noch nicht vollständig bestimmbar`)

  return teile.join(' · ')
}

export function uebersichtAbleiten(
  reise: Trip,
  ohneTag: readonly TripItem[] = [],
  heute: string | null = heutigesDatum(),
): UebersichtAbleitung {
  const lage = uebersichtLage(reise, heute)
  const status = bereichStatus(reise, ohneTag)
  const abdeckungen = status.map((eintrag) => ({
    bereich: eintrag.bereich,
    lage: eintrag.lage,
    text: eintrag.text,
    anzahl: eintrag.anzahl,
  }))

  return {
    titel: reise.title,
    orte: reiseOrte(reise),
    zeitraum: uebersichtZeitraum(reise),
    lage,
    lageText: uebersichtLageText(lage),
    personen: uebersichtPersonen(reise),
    abdeckungen,
    planText: planStatus(reise, ohneTag).text,
    fortschrittText: fortschrittAus(abdeckungen),
  }
}
