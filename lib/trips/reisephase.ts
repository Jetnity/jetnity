// lib/trips/reisephase.ts
//
// Reisephase für die Anzeige im Reisekopf. Reine Darstellung: keine gespeicherte
// Phase, kein zweiter Lifecycle-Status, keine Buchung, keine Änderung, keine
// Anfrage an Official Truth und kein KI-Aufruf.
//
// Alles wird aus den Daten der Reise und dem Geräte-Kalendertag abgeleitet
// (`heute`, `YYYY-MM-DD`, nie ein stilles UTC-Datum). Ohne belegten Kalendertag
// (Server, Hydration) bleibt die Phase leer. Was die Daten nicht beweisen, wird
// nicht behauptet: keine erfundene Etappe, Stadt, Route oder Dauer. «Heute laut
// Plan» nennt die Etappe des Plans und sagt nichts über den tatsächlichen Ort.

import { reiseGruppe } from '@/lib/account/reise-lage'
import { kalendertagNummer } from '@/lib/trips/datum-anzeige'
import type { Trip, TripStage } from '@/types/trips'

export type ReisephaseReise = Pick<Trip, 'startDate' | 'endDate' | 'stages' | 'days'>

export type ReisephaseArt = 'wartet' | 'offen' | 'unklar' | 'vorher' | 'laeuft' | 'nachher'

export type Reisephase = {
  art: ReisephaseArt
  /** Kurzzeile über dem Titel. Leer, solange der Geräte-Kalendertag nicht bekannt ist. */
  kopfzeile: string
  /** «Heute laut Plan: Bangkok» oder «Heutige Etappe noch offen». Nur während der Reise. */
  heute: string | null
  /** Etappe, auf die «Heute laut Plan» zeigt. Nur, wenn der Plan den Tag eindeutig zuordnet. */
  etappe: TripStage | null
}

const OHNE_PHASE: Reisephase = { art: 'wartet', kopfzeile: '', heute: null, etappe: null }

function tageText(anzahl: number): string {
  return anzahl === 1 ? '1 Tag' : `${anzahl} Tage`
}

/** Daten der Reise, die ausserhalb des Reisezeitraums liegen, widersprechen ihm. */
function widersprichtZeitraum(reise: ReisephaseReise, start: number, ende: number): boolean {
  const ausserhalb = (wert: string | null | undefined) => {
    const nummer = kalendertagNummer(wert)
    return nummer !== null && (nummer < start || nummer > ende)
  }
  return (
    reise.stages.some((etappe) => ausserhalb(etappe.arrivalDate) || ausserhalb(etappe.departureDate)) ||
    reise.days.some((tag) => ausserhalb(tag.dayDate))
  )
}

type Tagesetappe = { art: 'eindeutig'; etappe: TripStage } | { art: 'keine' } | { art: 'mehrdeutig' }

/** Die ausdrückliche Zuordnung «Tag → Etappe» des Plans für genau diesen Kalendertag. */
function etappeAusTagesplan(reise: ReisephaseReise, heute: string): Tagesetappe {
  const tage = reise.days.filter((tag) => tag.dayDate === heute)
  if (tage.length === 0) return { art: 'keine' }
  if (tage.length > 1) return { art: 'mehrdeutig' }
  const stageId = tage[0]!.stageId
  if (stageId === null) return { art: 'keine' }
  const etappe = reise.stages.find((kandidat) => kandidat.id === stageId)
  return etappe ? { art: 'eindeutig', etappe } : { art: 'mehrdeutig' }
}

/**
 * Etappen, deren Aufenthalt den Tag einschliesst. Der Abreisetag zählt dazu:
 * am Wechseltag berühren zwei Etappen denselben Tag, und das ist ohne
 * ausdrückliche Zuordnung nicht eindeutig. Eine einzige Etappe ohne eigene
 * Daten gilt für den ganzen Reisezeitraum.
 */
function etappenAmTag(reise: ReisephaseReise, tag: number): TripStage[] {
  if (reise.stages.length === 1) {
    const einzige = reise.stages[0]!
    const von = kalendertagNummer(einzige.arrivalDate)
    const bis = kalendertagNummer(einzige.departureDate)
    if (von === null && bis === null) return [einzige]
  }
  return reise.stages.filter((etappe) => {
    const von = kalendertagNummer(etappe.arrivalDate)
    const bis = kalendertagNummer(etappe.departureDate)
    return von !== null && bis !== null && von <= tag && tag <= bis
  })
}

function etappeHeute(reise: ReisephaseReise, heute: string, tag: number): TripStage | null {
  const plan = etappeAusTagesplan(reise, heute)
  if (plan.art === 'mehrdeutig') return null
  const daten = etappenAmTag(reise, tag)
  if (plan.art === 'eindeutig') {
    return daten.length === 0 || daten.includes(plan.etappe) ? plan.etappe : null
  }
  return daten.length === 1 ? daten[0]! : null
}

/**
 * Leitet die Phase der Reise für den Geräte-Kalendertag `heute` ab.
 * `heute === null` heisst: noch nicht belegt, es wird nichts behauptet.
 */
export function reisephaseAbleiten(reise: ReisephaseReise, heute: string | null): Reisephase {
  const jetzt = kalendertagNummer(heute)
  if (heute === null || jetzt === null) return OHNE_PHASE

  const start = kalendertagNummer(reise.startDate)
  const ende = kalendertagNummer(reise.endDate)
  if (start === null || ende === null) {
    return { art: 'offen', kopfzeile: 'Reisezeitraum noch offen', heute: null, etappe: null }
  }
  if (ende < start || widersprichtZeitraum(reise, start, ende)) {
    return { art: 'unklar', kopfzeile: 'Reisezeitraum noch unklar', heute: null, etappe: null }
  }

  const gruppe = reiseGruppe({ startDate: reise.startDate, endDate: reise.endDate }, heute)
  if (gruppe === 'kommend') {
    return {
      art: 'vorher',
      kopfzeile: `Noch ${tageText(start - jetzt)} bis zur Abreise`,
      heute: null,
      etappe: null,
    }
  }
  if (gruppe === 'vergangen') {
    return { art: 'nachher', kopfzeile: 'Deine Reise im Rückblick', heute: null, etappe: null }
  }

  if (gruppe !== 'aktiv') {
    return { art: 'offen', kopfzeile: 'Reisezeitraum noch offen', heute: null, etappe: null }
  }

  const etappe = etappeHeute(reise, heute, jetzt)
  const name = etappe?.name.trim() ?? ''
  return {
    art: 'laeuft',
    kopfzeile: `Tag ${jetzt - start + 1} von ${ende - start + 1}`,
    heute: etappe && name ? `Heute laut Plan: ${name}` : 'Heutige Etappe noch offen',
    etappe: etappe && name ? etappe : null,
  }
}
