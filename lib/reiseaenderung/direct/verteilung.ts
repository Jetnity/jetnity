// lib/reiseaenderung/direct/verteilung.ts
//
// Verteilt die vorhandenen Reisetage auf die vorhandenen Ziele, ohne Tage
// anzuhängen oder zu entfernen. Es gelten die Regeln der Erstzuordnung im
// Planer (`lib/trips/create-day-assignment.ts`): Die Tage folgen der
// Reihenfolge der Ziele, kein Tag gehört zwei Zielen, Tage am Ende dürfen
// ohne Ziel bleiben. Eine geschützte Buchung wechselt nie still ihr Ziel.
//
// Frei von React, Next und Supabase.

import { istKommerziell } from '@/lib/reiseaenderung/geschuetzt'
import type { Trip } from '@/types/trips'

export type Tagesverteilung = ReadonlyArray<{ id: string; days: number }>

export type VerteilungsBlock = {
  etappeId: string | null
  tagId: string
  nachTagId: string
}

export type VerteilungsErgebnis =
  | { ok: true; bloecke: VerteilungsBlock[]; zugeordnet: number; ohneZiel: number }
  | { ok: false; meldung: string }

function geordnet<T extends { id: string }>(liste: readonly T[], nach: (eintrag: T) => number): T[] {
  return [...liste].sort((a, b) => nach(a) - nach(b) || a.id.localeCompare(b.id))
}

/** Zielnummer je Tag in Tagesreihenfolge; `null` heißt ohne Ziel. */
export function verteilungsZiele(reise: Pick<Trip, 'stages' | 'days'>, verteilung: Tagesverteilung): Array<string | null> {
  const ziele: Array<string | null> = []
  for (const etappe of geordnet(reise.stages, (s) => s.position)) {
    const anzahl = verteilung.find((eintrag) => eintrag.id === etappe.id)?.days ?? 0
    for (let i = 0; i < anzahl; i += 1) ziele.push(etappe.id)
  }
  while (ziele.length < reise.days.length) ziele.push(null)
  return ziele.slice(0, reise.days.length)
}

/**
 * Prüft eine vollständige Verteilung und liefert die zusammenhängenden Blöcke,
 * deren Zuordnung sich ändert. Keine Änderung ergibt eine leere Liste.
 */
export function tageVerteilen(reise: Trip, verteilung: Tagesverteilung): VerteilungsErgebnis {
  const ids = new Set(reise.stages.map((s) => s.id))
  if (new Set(verteilung.map((v) => v.id)).size !== verteilung.length) {
    return { ok: false, meldung: 'Ein Ziel wurde mehrfach angegeben.' }
  }
  if (verteilung.some((v) => !ids.has(v.id))) {
    return { ok: false, meldung: 'Ein gewähltes Ziel gehört nicht mehr zu dieser Reise.' }
  }
  if (verteilung.length !== reise.stages.length) {
    return { ok: false, meldung: 'Bitte für jedes Ziel eine Tageszahl angeben, auch 0.' }
  }
  const summe = verteilung.reduce((s, v) => s + v.days, 0)
  const gesamt = reise.days.length
  if (summe > gesamt) {
    return {
      ok: false,
      meldung: `Deine Reise hat ${gesamt} ${gesamt === 1 ? 'Tag' : 'Tage'}, verteilt ${summe === 1 ? 'ist' : 'sind'} ${summe}. Beim Verteilen wird die Reise nicht länger. Bitte vergib höchstens ${gesamt} ${gesamt === 1 ? 'Tag' : 'Tage'}.`,
    }
  }

  const tage = geordnet(reise.days, (d) => d.dayIndex)
  const ziele = verteilungsZiele(reise, verteilung)
  const name = (id: string) => reise.stages.find((s) => s.id === id)?.name ?? 'einem anderen Ziel'

  for (let stelle = 0; stelle < tage.length; stelle += 1) {
    const tag = tage[stelle]!
    const geschuetzt = tag.items.find((p) => istKommerziell(p) && p.stageId !== null && p.stageId !== ziele[stelle])
    if (geschuetzt?.stageId) {
      return {
        ok: false,
        meldung: `Tag ${tag.dayIndex} enthält eine gebuchte oder bepreiste Leistung in ${name(geschuetzt.stageId)}. Verteile die Tage so, dass dieser Tag bei ${name(geschuetzt.stageId)} bleibt.`,
      }
    }
  }

  const bloecke: VerteilungsBlock[] = []
  let start = 0
  while (start < tage.length) {
    let ende = start
    while (ende + 1 < tage.length && ziele[ende + 1] === ziele[start]) ende += 1
    const geaendert = tage.slice(start, ende + 1).some((tag, i) => tag.stageId !== ziele[start + i])
    if (geaendert) {
      bloecke.push({ etappeId: ziele[start] ?? null, tagId: tage[start]!.id, nachTagId: tage[ende]!.id })
    }
    start = ende + 1
  }

  const zugeordnet = ziele.filter((z) => z !== null).length
  return { ok: true, bloecke, zugeordnet, ohneZiel: gesamt - zugeordnet }
}
