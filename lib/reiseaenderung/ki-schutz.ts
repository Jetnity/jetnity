/**
 * KI-only acceptance gate: never silently unplan existing activity, stay,
 * transfer or note when an AI removes/reweights days. The lower-level
 * operation interpreter deliberately preserves detached items (for manual
 * structural previews); that is not permission for AI to claim a safe change.
 *
 * Pure guard. No model, quota, database, provider or browser access.
 */
import type { Reisegraph, TripItem } from '@/types/trips'

export type KiGraphSafety = { ok: true } | { ok: false; meldung: string }

const SAFE_FAILURE =
  'Dieser Vorschlag würde bestehende Aktivitäten, Unterkünfte oder Notizen aus ihrem Reisetag lösen. ' +
  'Deine Reise bleibt unverändert. Verschiebe die betroffenen Punkte zuerst im Reiseplan ausdrücklich ' +
  'auf einen passenden Tag oder wähle eine Änderung ohne Wegfall belegter Tage.'

const RETURN_FAILURE =
  'Dieser Vorschlag hängt einen leeren Tag an, während der bisherige letzte Reisetag bereits ' +
  'Planpunkte enthält. Prüfe zuerst die Rückreise und die Tagesaufteilung; nichts wurde gespeichert.'

function allePunkte(graph: Reisegraph): Map<string, TripItem> {
  return new Map([...graph.days.flatMap(day => day.items), ...graph.ohneTag]
    .map(item => [item.id, item]))
}

/** Validate both the preview and the *server-side* replay before any save. */
export function kiGraphSicherheit(vorher: Reisegraph, nachher: Reisegraph): KiGraphSafety {
  const neu = allePunkte(nachher)
  const moved = vorher.days.flatMap(day => day.items).some(punkt => {
    const heute = neu.get(punkt.id)
    return !heute || heute.dayId === null || heute.stageId !== punkt.stageId
  })
  if (moved) return { ok: false, meldung: SAFE_FAILURE }

  const oldLast = [...vorher.days].sort((a, b) => a.dayIndex - b.dayIndex).at(-1)
  const newLast = [...nachher.days].sort((a, b) => a.dayIndex - b.dayIndex).at(-1)
  if (oldLast && newLast && oldLast.id !== newLast.id
    && oldLast.items.length > 0 && newLast.items.length === 0
    && !vorher.days.some(day => day.id === newLast.id)) {
    return { ok: false, meldung: RETURN_FAILURE }
  }
  return { ok: true }
}
