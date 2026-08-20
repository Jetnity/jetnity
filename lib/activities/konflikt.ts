// lib/activities/konflikt.ts
//
// Reine Zeit- und Konfliktlogik für Aktivitäten.
//
// Was diese Phase sicher beurteilen kann:
//   · zwei vollständige lokale HH:MM-Fenster am selben Kalendertag
//   · eindeutige Überschneidung (Start < fremdes Ende und Ende > fremder Start)
//
// Was sie nicht beurteilt:
//   · fehlende Start- oder Endzeit
//   · mehrtägige Optionen (startsOn !== endsOn)
//   · Fenster über Mitternacht (Ende vor Start am selben Tag)
//   · Zeitzonen aus Ortskoordinaten
//   · Wegezeiten zwischen zwei Punkten
//
// Fehlende Zeiten gelten nicht als konfliktfrei.
// Frei von Next und Providern.

import type { ActivityKonflikt, ActivityTimeslot } from '@/lib/activities/domain'
import { istDatum, minutenSeitMitternacht, tageDifferenz } from '@/lib/activities/zeit'

export type Zeitfenster = {
  startsOn: string | null
  startsAt: string | null
  endsOn: string | null
  endsAt: string | null
}

export type KonfliktErgebnis = {
  konflikt: ActivityKonflikt
  grund: 'ueberschneidung' | 'frei' | 'zeit-unbekannt' | 'mehrtägig' | 'ueber-mitternacht' | 'kein-tag'
}

export function timeslotAlsFenster(slot: ActivityTimeslot | null): Zeitfenster | null {
  if (!slot) return null
  return {
    startsOn: slot.startsOn,
    startsAt: slot.startsAt,
    endsOn: slot.endsOn,
    endsAt: slot.endsAt,
  }
}

/**
 * Ein Fenster ist nur dann vollständig beurteilbar, wenn Start und Ende
 * am selben Kalendertag als HH:MM vorliegen.
 */
function fensterVollstaendig(fenster: Zeitfenster, tagDatum: string | null): boolean {
  if (!tagDatum || !istDatum(tagDatum)) return false
  const startTag = fenster.startsOn ?? tagDatum
  const endeTag = fenster.endsOn ?? fenster.startsOn ?? tagDatum
  if (startTag !== tagDatum || endeTag !== tagDatum) return false
  return minutenSeitMitternacht(fenster.startsAt) !== null && minutenSeitMitternacht(fenster.endsAt) !== null
}

function fensterMehrtägig(fenster: Zeitfenster): boolean {
  const start = fenster.startsOn
  const ende = fenster.endsOn
  if (!start || !ende) return false
  const differenz = tageDifferenz(start, ende)
  return differenz !== null && differenz !== 0
}

function fensterUeberMitternacht(fenster: Zeitfenster, tagDatum: string | null): boolean {
  if (fensterMehrtägig(fenster)) return false
  if (!fensterVollstaendig(fenster, tagDatum ?? fenster.startsOn)) return false
  const start = minutenSeitMitternacht(fenster.startsAt)
  const ende = minutenSeitMitternacht(fenster.endsAt)
  if (start === null || ende === null) return false
  return ende <= start
}

function ueberschneidet(aStart: number, aEnde: number, bStart: number, bEnde: number): boolean {
  return aStart < bEnde && bStart < aEnde
}

export function konfliktPruefen(
  kandidat: Zeitfenster,
  bestehende: readonly Zeitfenster[],
  tagDatum: string | null,
): KonfliktErgebnis {
  if (!tagDatum || !istDatum(tagDatum)) {
    return { konflikt: 'unbekannt', grund: 'kein-tag' }
  }

  if (fensterMehrtägig(kandidat)) {
    return { konflikt: 'unbekannt', grund: 'mehrtägig' }
  }

  if (fensterUeberMitternacht(kandidat, tagDatum)) {
    return { konflikt: 'unbekannt', grund: 'ueber-mitternacht' }
  }

  if (!fensterVollstaendig(kandidat, tagDatum)) {
    return { konflikt: 'unbekannt', grund: 'zeit-unbekannt' }
  }

  const start = minutenSeitMitternacht(kandidat.startsAt)
  const ende = minutenSeitMitternacht(kandidat.endsAt)
  if (start === null || ende === null) {
    return { konflikt: 'unbekannt', grund: 'zeit-unbekannt' }
  }

  let unbekannterNachbar = false
  for (const punkt of bestehende) {
    if (fensterMehrtägig(punkt) || fensterUeberMitternacht(punkt, tagDatum)) {
      unbekannterNachbar = true
      continue
    }
    if (!fensterVollstaendig(punkt, tagDatum)) {
      unbekannterNachbar = true
      continue
    }
    const punktStart = minutenSeitMitternacht(punkt.startsAt)
    const punktEnde = minutenSeitMitternacht(punkt.endsAt)
    if (punktStart === null || punktEnde === null) {
      unbekannterNachbar = true
      continue
    }
    if (ueberschneidet(start, ende, punktStart, punktEnde)) {
      return { konflikt: 'ueberschneidung', grund: 'ueberschneidung' }
    }
  }

  if (unbekannterNachbar) {
    return { konflikt: 'unbekannt', grund: 'zeit-unbekannt' }
  }

  return { konflikt: 'frei', grund: 'frei' }
}
