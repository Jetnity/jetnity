// lib/trips/uebersicht.ts
//
// Presentation-Derivation der Reiseübersicht. Keine persistierte Wahrheit,
// kein zweiter trips.status, kein Shadow-Lifecycle (ADR-0164 / TW-2).
//
// Zeitliche Lage kommt aus derselben AP-3-Date-only-Funktion. Coverage-Texte
// kommen aus bereichStatus / planStatus. Personen aus party[] oder ehrlich
// nur als Anzahl ohne Angaben. Citizenships werden nicht gelesen.

import { heutigesDatum } from '@/lib/account/naechste-reise'
import { reiseGruppe, type ReiseGruppe } from '@/lib/account/reise-lage'
import { bereichStatus, planStatus, type BereichStatus } from '@/lib/trips/arbeitsbereich'
import type { Trip, TripItem } from '@/types/trips'

export type UebersichtLage = ReiseGruppe

export type AbdeckungLage = 'offen' | 'belegt' | 'unbestimmt'

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

export function uebersichtOrte(reise: Pick<Trip, 'origin' | 'stages'>): string {
  const orte = reise.stages.length > 0 ? reise.stages.map((etappe) => etappe.name).join(' · ') : 'Ziel noch offen'
  return reise.origin ? `${orte} · ab ${reise.origin}` : orte
}

export function uebersichtZeitraum(reise: Pick<Trip, 'startDate' | 'endDate'>): string {
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

export function uebersichtLageText(lage: UebersichtLage | null): string {
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

export function abdeckungLageAusText(text: string): AbdeckungLage {
  if (/nicht vollständig bestimmbar|nicht belastbar/.test(text)) return 'unbestimmt'
  if (/^Noch kei/.test(text)) return 'offen'
  return 'belegt'
}

function fortschrittAus(abdeckungen: readonly UebersichtAbdeckung[]): string {
  const belegt = abdeckungen.filter((eintrag) => eintrag.lage === 'belegt').length
  const offen = abdeckungen.filter((eintrag) => eintrag.lage === 'offen').length
  const unbestimmt = abdeckungen.filter((eintrag) => eintrag.lage === 'unbestimmt').length
  const gesamt = abdeckungen.length

  if (unbestimmt > 0 && belegt === 0 && offen === 0) {
    return 'Abdeckung noch nicht vollständig bestimmbar'
  }
  if (unbestimmt > 0) {
    return `${belegt} von ${gesamt} Bereichen belegt · ${unbestimmt} noch nicht vollständig bestimmbar`
  }
  if (offen === gesamt) return 'Noch nichts ausgewählt'
  if (offen === 0) return 'Wesentliche Bereiche sind belegt'
  return `${belegt} von ${gesamt} Bereichen belegt`
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
    lage: abdeckungLageAusText(eintrag.text),
    text: eintrag.text,
    anzahl: eintrag.anzahl,
  }))

  return {
    titel: reise.title,
    orte: uebersichtOrte(reise),
    zeitraum: uebersichtZeitraum(reise),
    lage,
    lageText: uebersichtLageText(lage),
    personen: uebersichtPersonen(reise),
    abdeckungen,
    planText: planStatus(reise, ohneTag).text,
    fortschrittText: fortschrittAus(abdeckungen),
  }
}
