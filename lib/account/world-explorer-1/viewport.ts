import type { ExplorerRecord } from './presentation'

/** All map layers use normalized, top-left based coordinates. Pan is in viewport fractions. */
export type Viewport = { scale: number; x: number; y: number }
export const RESET_VIEWPORT: Viewport = { scale: 1, x: 0, y: 0 }
export function clampViewport(view: Viewport): Viewport {
  const scale = Number.isFinite(view.scale) ? Math.max(1, Math.min(4, view.scale)) : 1
  const bound = (value: number) => Math.max(1 - scale, Math.min(0, Number.isFinite(value) ? value : 0))
  return { scale, x: bound(view.x), y: bound(view.y) }
}
export function zoomViewport(view: Viewport, scale: number): Viewport {
  const next = Math.max(1, Math.min(4, scale))
  const ratio = next / view.scale
  return clampViewport({ scale: next, x: 0.5 - (0.5 - view.x) * ratio, y: 0.5 - (0.5 - view.y) * ratio })
}
export function viewportPoint(punkt: { links: number; oben: number }, view: Viewport) {
  return { links: punkt.links * view.scale + view.x * 100, oben: punkt.oben * view.scale + view.y * 100 }
}
export type ExplorerMarker = { id: string; links: number; oben: number; records: ExplorerRecord[] }

/** Group in screen pixels after zoom/resize. Anchor stays on a stored coordinate. */
export function viewportMarkers(records: readonly ExplorerRecord[], view: Viewport, width: number, height: number): ExplorerMarker[] {
  const groups: ExplorerMarker[] = []
  for (const record of records) {
    if (!record.punkt) continue
    const p = viewportPoint(record.punkt, view)
    if (p.links < 0 || p.links > 100 || p.oben < 0 || p.oben > 100) continue
    const group = groups.find((g) => Math.abs(g.links - p.links) * width / 100 < 44 && Math.abs(g.oben - p.oben) * height / 100 < 44)
    if (group) group.records.push(record)
    else groups.push({ id: record.id, ...p, records: [record] })
  }
  return groups
}
