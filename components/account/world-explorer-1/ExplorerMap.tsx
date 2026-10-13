'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Minus, Plus, RotateCcw } from 'lucide-react'
import { WeltFuellungen, WeltMusterDefs, WeltPunktMarken } from '@/components/account/WeltZustaende'
import type { WeltLandFlaeche } from '@/lib/account/welt-laender'
import { WORLD_MAP_GRENZ_PFADE, WORLD_MAP_LAND_PFADE, WORLD_MAP_SEE_PFADE } from '@/lib/account/world-map-geografie'
import { weltKartenAnsicht, WORLD_MAP_RAHMEN_VIEWBOX } from '@/lib/account/world-map-ansicht'
import { recordStatus, type ExplorerRecord } from '@/lib/account/world-explorer-1/presentation'
import { clampViewport, RESET_VIEWPORT, viewportMarkers, viewportPoint, zoomViewport, type Viewport } from '@/lib/account/world-explorer-1/viewport'

const LAND = WORLD_MAP_LAND_PFADE.join(' ')
const SEE = WORLD_MAP_SEE_PFADE.join(' ')
const GRENZEN = WORLD_MAP_GRENZ_PFADE.join(' ')
const BASIS = weltKartenAnsicht([])
const RAHMEN = WORLD_MAP_RAHMEN_VIEWBOX
const BUTTON = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line-200 bg-surface-0 px-3 text-sm font-semibold text-brand-800 hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40'

export default function ExplorerMap({ records, flaechen, selected, onSelect }: {
  records: readonly ExplorerRecord[]
  flaechen: readonly WeltLandFlaeche[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  const id = useId()
  const surface = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [view, setView] = useState<Viewport>(RESET_VIEWPORT)
  const [movement, setMovement] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const drag = useRef<{ id: number; x: number; y: number; view: Viewport; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  useEffect(() => {
    const element = surface.current
    if (!element) return
    const resize = () => setSize({ width: element.clientWidth, height: element.clientHeight })
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  // Normalized pan remains clamped under resize; only screen-space grouping changes.
  const bounded = clampViewport(view)
  const groups = useMemo(() => viewportMarkers(records, view, size.width, size.height), [records, view, size])
  const activeGroup = groups.find((g) => g.id === openGroup && g.records.length > 1)
  const zoom = (delta: number) => { setView((v) => zoomViewport(v, v.scale + delta)); setOpenGroup(null) }
  const pan = (x: number, y: number) => { setView((v) => clampViewport({ ...v, x: v.x + x, y: v.y + y })); setOpenGroup(null) }
  const reset = () => { setView(RESET_VIEWPORT); setMovement(false); setOpenGroup(null); drag.current = null }
  const transform = `translate(${bounded.x * RAHMEN.width} ${bounded.y * RAHMEN.height}) translate(0 ${RAHMEN.y}) scale(${bounded.scale}) translate(0 ${-RAHMEN.y})`
  return (
    <div className="min-w-0" data-explorer-map>
      <div role="group" aria-label="Kartenbedienung" className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" className={BUTTON} aria-label="Karte vergrössern" disabled={view.scale >= 4} onClick={() => zoom(0.5)}><Plus size={18} aria-hidden /></button>
        <button type="button" className={BUTTON} aria-label="Karte verkleinern" disabled={view.scale <= 1} onClick={() => zoom(-0.5)}><Minus size={18} aria-hidden /></button>
        <output className="min-w-12 text-center text-sm text-brand-800" aria-label="Kartenzoom">{view.scale.toFixed(1)}×</output>
        <button type="button" className={`${BUTTON} gap-2`} onClick={reset}><RotateCcw size={16} aria-hidden />Zurücksetzen</button>
        <button type="button" className={BUTTON} aria-pressed={movement} onClick={() => { setMovement((v) => !v); drag.current = null }}>
          {movement ? 'Kartenbewegung beenden' : 'Karte verschieben'}
        </button>
      </div>
      <p id={`${id}-hilfe`} className="mb-3 text-xs leading-5 text-ink-800">
        {movement ? 'Kartenbewegung aktiv: Ziehen verschiebt die Karte. Zum Seitenscrollen Bewegung beenden.' : 'Die Seite lässt sich über der Karte normal scrollen. Zum Ziehen „Karte verschieben“ einschalten.'}
        {' '}Karte fokussieren: Pfeiltasten verschieben, + / − zoomen. Browser-Zoom bleibt verfügbar.
      </p>
      <div data-world-map-rahmen="ein" className="rounded-[22px] bg-brand-900 p-6 shadow-[0_18px_40px_rgba(15,46,42,0.16)]">
        <div ref={surface} role="group" aria-label="Weltkarte bewegen" aria-describedby={`${id}-hilfe`} tabIndex={0}
          data-explorer-viewport data-scale={bounded.scale} data-pan-x={bounded.x} data-pan-y={bounded.y}
          className="relative rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citrus-400"
          style={{ touchAction: movement ? 'pinch-zoom' : 'pan-y pinch-zoom', cursor: movement ? 'grab' : undefined }}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget || event.metaKey || event.ctrlKey || event.altKey) return
            if (event.key === 'Escape') { setMovement(false); setOpenGroup(null); drag.current = null; return }
            const actions: Record<string, () => void> = { '+': () => zoom(0.5), '=': () => zoom(0.5), '-': () => zoom(-0.5), ArrowLeft: () => pan(0.1, 0), ArrowRight: () => pan(-0.1, 0), ArrowUp: () => pan(0, 0.1), ArrowDown: () => pan(0, -0.1), Home: reset }
            if (actions[event.key]) { event.preventDefault(); actions[event.key]() }
          }}
          onPointerDown={(event) => {
            suppressClick.current = false
            if (!event.isPrimary) { drag.current = null; return }
            if (!movement || event.button !== 0) return
            drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, view: bounded, moved: false }
          }}
          onPointerMove={(event) => {
            const start = drag.current
            if (!start || start.id !== event.pointerId || !size.width || !size.height) return
            const dx = event.clientX - start.x, dy = event.clientY - start.y
            if (!start.moved && Math.hypot(dx, dy) < 6) return
            start.moved = true
            suppressClick.current = true
            event.currentTarget.setPointerCapture(event.pointerId)
            setOpenGroup(null)
            setView(clampViewport({ scale: start.view.scale, x: start.view.x + dx / size.width, y: start.view.y + dy / size.height }))
          }}
          onPointerUp={() => { drag.current = null }}
          onPointerCancel={() => { drag.current = null; suppressClick.current = true }}
          onLostPointerCapture={() => { drag.current = null }}
          onPointerLeave={(event) => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) drag.current = null }}
          onClickCapture={(event) => { if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false } }}>
          <div className="overflow-hidden rounded-xl">
            <svg viewBox={BASIS.viewBox} role="img" aria-labelledby={`${id}-titel ${id}-desc`} className="block h-auto w-full">
              <title id={`${id}-titel`}>Deine Weltkarte</title>
              <desc id={`${id}-desc`}>Länderflächen und Orte folgen Suche und Filter. Alle Treffer sind auch über die Liste erreichbar.</desc>
              <WeltMusterDefs id={id} />
              <g transform={transform} data-explorer-transform>
                <rect x={RAHMEN.x} y={RAHMEN.y} width={RAHMEN.width} height={RAHMEN.height} className="fill-brand-900" />
                <path d={LAND} fillRule="evenodd" data-world-map-land="ein" className="fill-surface-75 stroke-brand-800/80 [vector-effect:non-scaling-stroke]" strokeWidth="1" />
                <WeltFuellungen id={id} flaechen={flaechen} />
                <path d={SEE} fillRule="evenodd" className="fill-brand-900" />
                <path d={GRENZEN} fill="none" className="stroke-brand-900/65 [vector-effect:non-scaling-stroke]" strokeWidth="0.7" />
                {BASIS.gitter.map((line) => <line key={line.schluessel} x1={line.x1} x2={line.x2} y1={line.y1} y2={line.y2} className="stroke-surface-0/20 [vector-effect:non-scaling-stroke]" strokeWidth="0.5" />)}
              </g>
            </svg>
          </div>
          <WeltPunktMarken flaechen={flaechen} lageTransform={(p) => {
            const next = viewportPoint(p, bounded)
            return next.links >= 0 && next.links <= 100 && next.oben >= 0 && next.oben <= 100 ? next : null
          }} />
          {size.width > 0 ? groups.map((group) => <button key={group.id} type="button"
            data-explorer-marker={group.id} data-marker-count={group.records.length}
            aria-label={group.records.map((r) => `${r.label}, ${recordStatus(r)}`).join('; ')}
            aria-controls={group.records.length > 1 ? `${id}-gruppe` : undefined}
            aria-expanded={group.records.length > 1 ? activeGroup?.id === group.id : undefined}
            aria-current={group.records.some((r) => r.id === selected) ? 'true' : undefined}
            onClick={() => { if (group.records.length > 1) setOpenGroup(activeGroup?.id === group.id ? null : group.id); else { setOpenGroup(null); onSelect(group.records[0].id) } }}
            className="absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citrus-400"
            style={{ left: `${group.links}%`, top: `${group.oben}%` }}>
            <span className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold shadow-md ring-2 ${group.records.some((r) => r.id === selected) ? 'bg-citrus-400 text-brand-900 ring-brand-900' : 'bg-brand-900 text-white ring-white'}`}>{group.records.length > 1 ? group.records.length : <span className="h-2 w-2 rounded-full bg-current" />}</span>
            {group.records.some((r) => r.id === selected) ? <span aria-hidden="true" className={`pointer-events-none absolute max-w-[9rem] truncate rounded-full bg-brand-900 px-2 py-1 text-xs text-white ring-2 ring-citrus-400 ${group.oben < 20 ? 'top-full' : 'bottom-full'} ${group.links < 25 ? 'left-0' : group.links > 75 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>{group.records.find((r) => r.id === selected)?.label}</span> : null}
          </button>) : null}
        </div>
      </div>
      <div role="group" aria-label="Kartenausschnitt verschieben" className="mt-3 flex flex-wrap gap-2">
        {([{ label: 'Westen', icon: ArrowLeft, x: 0.1, y: 0 }, { label: 'Osten', icon: ArrowRight, x: -0.1, y: 0 }, { label: 'Norden', icon: ArrowUp, x: 0, y: 0.1 }, { label: 'Süden', icon: ArrowDown, x: 0, y: -0.1 }]).map(({ label, icon: Icon, x, y }) => <button key={label} type="button" className={BUTTON} aria-label={`Kartenausschnitt nach ${label}`} disabled={view.scale === 1} onClick={() => pan(x, y)}><Icon size={18} aria-hidden /></button>)}
      </div>
      {activeGroup ? <div id={`${id}-gruppe`} className="mt-3 rounded-2xl border border-line-200 bg-surface-50 p-3">
        <p className="text-sm font-semibold text-brand-800">Mehrere Einträge an dieser Stelle</p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">{activeGroup.records.map((r) => <li key={r.id}><button type="button" className={`${BUTTON} w-full justify-start text-left`} onClick={() => { setOpenGroup(null); onSelect(r.id) }}>{r.label} · {recordStatus(r)}{r.besuch ? ` · ${r.besuch.zeitText}` : ''}</button></li>)}</ul>
        <button type="button" className={`${BUTTON} mt-2`} onClick={() => setOpenGroup(null)}>Ortsauswahl schliessen</button>
      </div> : null}
    </div>
  )
}
