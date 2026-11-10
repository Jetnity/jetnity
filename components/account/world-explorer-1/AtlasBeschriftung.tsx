import anker from '@/lib/account/world-explorer-1/kartenbeschriftung.json'
import { weltKarteProjektion } from '@/lib/account/world-map'
import { weltPunktLage } from '@/lib/account/world-map-ansicht'
import { viewportPoint, type ExplorerMarker, type Viewport } from '@/lib/account/world-explorer-1/viewport'

// Natural Earth Admin 0, 1:50m (public domain). LABEL_X/Y are in WGS84;
// the relief asset uses the same Plate Carrée projection as the country paths.
const namen = new Intl.DisplayNames(['de'], { type: 'region' })
const laender = anker.map(({ code, lon, lat, rank }) => {
  const { x, y } = weltKarteProjektion(lat, lon)
  return { code, rank, name: namen.of(code) ?? code, punkt: weltPunktLage(x, y) }
})

export function landPosition(code: string) {
  return laender.find((land) => land.code === code)?.punkt ?? null
}

type Box = { x: number; y: number; w: number; h: number }

function beruehrt(a: Box, b: Box) {
  return Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h
}

/** Textanker sind Beschriftungspunkte der Kartografie und keine Besuchsorte. */
export default function AtlasBeschriftung({ view, width, height, gruppen }: {
  view: Viewport
  width: number
  height: number
  gruppen: readonly ExplorerMarker[]
}) {
  const belegt: Box[] = gruppen.map((g) => ({
    x: width * g.links / 100, y: height * g.oben / 100, w: 35, h: 28,
  }))
  const labels = laender.flatMap((land) => {
    if (!land.punkt || land.rank > Math.min(7, Math.ceil(view.scale + 1))) return []
    const p = viewportPoint(land.punkt, view)
    const box = { x: width * p.links / 100, y: height * p.oben / 100, w: land.name.length * 6.4 + 10, h: 20 }
    if (box.x - box.w / 2 < 4 || box.y < 12 || box.x + box.w / 2 > width - 4 || box.y > height - 12) return []
    if (belegt.some((b) => beruehrt(box, b))) return []
    belegt.push(box)
    return <span key={land.code} className="jetnity-atlas-label" style={{ left: `${p.links}%`, top: `${p.oben}%` }}>{land.name}</span>
  })
  const orte = view.scale >= 2 ? gruppen.flatMap((gruppe) => {
    if (gruppe.records.length !== 1) return []
    const ort = gruppe.records[0]
    const box = { x: width * gruppe.links / 100, y: height * gruppe.oben / 100 - 26, w: ort.label.length * 6.4 + 8, h: 15 }
    if (box.x - box.w / 2 < 4 || box.x + box.w / 2 > width - 4 || box.y < 8 || belegt.some((b) => beruehrt(box, b))) return []
    belegt.push(box)
    return <span key={ort.id} className="jetnity-atlas-label" style={{ left: `${gruppe.links}%`, top: box.y }}>{ort.label}</span>
  }) : []
  return <div aria-hidden className="jetnity-atlas-labels">{labels}{orte}</div>
}
