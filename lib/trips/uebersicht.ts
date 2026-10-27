// lib/trips/uebersicht.ts
//
// Presentation-Derivation der Reiseübersicht. Keine persistierte Wahrheit,
// kein zweiter trips.status, kein Shadow-Lifecycle (ADR-0164 / TW-2).
//
// Zeitliche Lage kommt aus derselben AP-3-Date-only-Funktion. Coverage-Texte
// und ihre maschinenlesbare Presentation-Lage kommen gemeinsam aus
// bereichStatus / planStatus. Die Personenanzahl ist die gespeicherte Kopfzahl.
// party.length zählt nur vorhandene Profile und darf kleiner sein. Citizenships,
// Namen und Dokumente werden nicht gelesen. Widerspricht die Profilliste der
// Kopfzahl, bleibt die Anzahl unbestimmt.

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
  anzahl: number | null
  quelle: 'travellers' | 'unbestimmt'
  text: string
}

export const KOPFZAHL_WIDERSPRUCH =
  'Anzahl der Reisenden und erfasste Profile stimmen nicht überein.'

export type Kopfzahl =
  | { art: 'bekannt'; anzahl: number; profile: number }
  | { art: 'unbestimmt' }

export type MehrereReisendeLage = 'hinweis' | 'widerspruch' | 'keiner'

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
  if (!lage) return 'Zeitliche Einordnung noch unklar'
  return LAGE_TEXT[lage]
}

function profileAnzahl(party: Trip['party']): number | null {
  if (party == null) return 0
  if (!Array.isArray(party)) return null
  return party.length
}

/** Gespeicherte Kopfzahl. Profile dürfen fehlen. Ein Überhang oder eine ungültige Zahl bleibt unbestimmt. */
export function kopfzahl(reise: Pick<Trip, 'travellers' | 'party'>): Kopfzahl {
  const profile = profileAnzahl(reise.party)
  const kopf = reise.travellers
  if (profile == null || !Number.isInteger(kopf) || kopf < 1 || profile > kopf) {
    return { art: 'unbestimmt' }
  }
  return { art: 'bekannt', anzahl: kopf, profile }
}

/** Mehrpersonenhinweis nur bei bekannter Kopfzahl über 1. Ein Widerspruch wird nicht als eine Person und nicht als mehrere Personen behauptet. */
export function mehrereReisendeLage(reise: Pick<Trip, 'travellers' | 'party'>): MehrereReisendeLage {
  const lage = kopfzahl(reise)
  if (lage.art === 'unbestimmt') return 'widerspruch'
  if (lage.anzahl > 1) return 'hinweis'
  return 'keiner'
}

function personenBasis(anzahl: number): string {
  return anzahl === 1 ? '1 Reisende Person' : `${anzahl} Reisende`
}

export function uebersichtPersonen(reise: Pick<Trip, 'travellers' | 'party'>): UebersichtPerson {
  const lage = kopfzahl(reise)
  if (lage.art === 'unbestimmt') {
    return { anzahl: null, quelle: 'unbestimmt', text: KOPFZAHL_WIDERSPRUCH }
  }

  const basis = personenBasis(lage.anzahl)
  if (lage.profile === 0) {
    return { anzahl: lage.anzahl, quelle: 'travellers', text: `${basis} · Angaben noch offen` }
  }
  if (lage.profile < lage.anzahl) {
    return {
      anzahl: lage.anzahl,
      quelle: 'travellers',
      text: `${basis} · ${lage.profile} von ${lage.anzahl} Profilen vorhanden`,
    }
  }
  return { anzahl: lage.anzahl, quelle: 'travellers', text: basis }
}

function fortschrittAus(abdeckungen: readonly UebersichtAbdeckung[]): string {
  const belegt = abdeckungen.filter((eintrag) => eintrag.lage === 'belegt').length
  const teilweise = abdeckungen.filter((eintrag) => eintrag.lage === 'teilweise').length
  const offen = abdeckungen.filter((eintrag) => eintrag.lage === 'offen').length
  const unbestimmt = abdeckungen.filter((eintrag) => eintrag.lage === 'unbestimmt').length
  const gesamt = abdeckungen.length

  if (unbestimmt === gesamt) return 'Stand der Bereiche noch unklar'
  if (offen === gesamt) return 'Noch nichts ausgewählt'
  if (belegt === gesamt) return 'Keine bekannten offenen Punkte'

  const teile: string[] = []
  if (belegt > 0) teile.push(`${belegt} von ${gesamt} Bereichen ohne bekannten offenen Punkt`)
  if (teilweise > 0) teile.push(`${teilweise} nur teilweise geplant`)
  if (offen > 0) teile.push(`${offen} noch offen`)
  if (unbestimmt > 0) teile.push(`${unbestimmt} noch unklar`)

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
