// lib/trips/reiselinie.ts
//
// Unterkunftsstand pro Etappenlauf für die Reiselinie der Übersicht.
// Liest nur `unterkunftAbdeckung()`. Ist der Stand dort unklar, sagt die
// Reiselinie nichts, statt „offen“ oder „abgedeckt“ zu behaupten.

import { naechteHalboffen, unterkunftAbdeckung } from '@/lib/trips/naechte-abdeckung'
import type { Trip, TripDay, TripItem } from '@/types/trips'

export type LaufUnterkunft = { naechte: number; offen: number }

type Lauf = { stageId: string | null; lesart: string; tage: readonly Pick<TripDay, 'dayDate'>[] }

export function laufUnterkunftLeser(reise: Trip, ohneTag: readonly TripItem[] = reise.ohneTag) {
  const abdeckung = unterkunftAbdeckung(reise, ohneTag)
  const klar = abdeckung.bekannt && !abdeckung.aufenthalte.some((aufenthalt) => aufenthalt.status === 'unknown')

  return (lauf: Lauf): LaufUnterkunft | null => {
    if (!klar || lauf.lesart !== 'ziel' || !lauf.stageId) return null
    const daten = lauf.tage.map((tag) => tag.dayDate).filter((datum): datum is string => Boolean(datum)).sort()
    const von = daten[0]
    const bis = daten.at(-1)
    if (!von || !bis) return null
    const imLauf = (stueck: { stageId: string | null; start: string }) =>
      stueck.stageId === lauf.stageId && stueck.start >= von && stueck.start <= bis
    const naechte = abdeckung.zeitraeume
      .filter(imLauf)
      .reduce((summe, zeitraum) => summe + naechteHalboffen(zeitraum.start, zeitraum.end).length, 0)
    if (naechte === 0) return null
    const offen = abdeckung.luecken.filter(imLauf).reduce((summe, luecke) => summe + luecke.naechte, 0)
    return { naechte, offen: Math.min(offen, naechte) }
  }
}

export function laufUnterkunftText(stand: LaufUnterkunft): string {
  if (stand.offen === 0) return stand.naechte === 1 ? 'Unterkunft für die Nacht' : `Unterkunft für alle ${stand.naechte} Nächte`
  if (stand.offen === stand.naechte) return stand.naechte === 1 ? 'Unterkunft noch offen' : `Unterkunft für ${stand.naechte} Nächte noch offen`
  return `${stand.offen} von ${stand.naechte} Nächten ohne Unterkunft`
}
