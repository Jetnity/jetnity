'use client'

import * as React from 'react'
import { cn as _cn } from '@/lib/utils'
import { ZoomIn, ZoomOut } from 'lucide-react'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

/** Optionaler, interner Standard-Cliptyp – nach außen sind Items jetzt beliebig. */
export type TimelineItem = {
  id: string
  kind?: 'video' | 'audio' | 'image'
  start: number // sec
  duration: number // sec
  track?: number
  label?: string
}

/** Beliebiger Item-Typ (kommt z.B. aus EditorShell als EditorMediaItem) */
type AnyItem = Record<string, any>

type Props = {
  /** Beliebige Items aus dem Editor */
  items?: AnyItem[]

  /** aktuell selektiertes Item (id als String) */
  selectedId?: string | null

  /** Selection-Callback (id als String) */
  onSelect?: (id: string) => void

  /** Player-State (Playhead bewegt sich) */
  isPlaying?: boolean

  /** Optional kontrollierter Zoom (0.5 … 8), sonst intern */
  zoom?: number

  /** Kompakte Darstellung */
  compact?: boolean

  /** Feste Gesamtdauer, falls nicht aus Items berechnet werden soll */
  duration?: number

  className?: string

  /** OPTIONALE Adapter – nur nötig, wenn Auto-Erkennung nicht reicht */
  itemKey?: (it: AnyItem, index: number) => string
  itemTrack?: (it: AnyItem, index: number) => number
  itemTimes?: (it: AnyItem, index: number) => { start: number; duration: number }
  itemLabel?: (it: AnyItem, index: number) => string
}

export default function Timeline({
  items = [],
  selectedId = null,
  onSelect,
  isPlaying = false,
  zoom,
  compact = false,
  duration,
  className,

  // Adapter mit sinnvollen Defaults
  itemKey = (it, i) => String(it.id ?? i),
  itemTrack = (it) => {
    // häufige Felder: track, lane, row, kind (audio → 100+)
    if (Number.isFinite(it.track)) return Number(it.track)
    if (typeof it.kind === 'string' && it.kind.toLowerCase().includes('audio')) return 100
    return 0
  },
  itemTimes,
  itemLabel = (it) =>
    String(it.label ?? it.name ?? it.title ?? it.filename ?? it.kind ?? 'Clip'),
}: Props) {
  /** ---------- Zoom (un-/controlled) ---------- */
  const [internalZoom, setInternalZoom] = React.useState(1)
  const z = typeof zoom === 'number' ? zoom : internalZoom
  const setZ = (fn: (z: number) => number) => {
    if (typeof zoom === 'number') return // kontrolliert
    const next = Math.min(8, Math.max(0.5, +fn(internalZoom).toFixed(2)))
    setInternalZoom(next)
  }
  const pxPerSec = 80 * z

  /** ---------- Zeiten-Detektor (Auto-Adapter) ---------- */
  const inferTimes = React.useCallback(
    (it: AnyItem, i: number) => {
      if (itemTimes) return itemTimes(it, i)

      // Kandidaten für Start in Sekunden
      const startCandidates = [
        it.start,
        it.startSec,
        it.start_s,
        it.tStart,
        it.time,
        it.inSec,
        it.in_s,
        it.in, // ggf. Frames oder Sekunden
      ]

      // Kandidaten für Dauer in Sekunden
      const durCandidates = [
        it.duration,
        it.dur,
        it.len,
        it.length,
        it.lengthSec,
        it.durationSec,
      ]

      // Kandidaten, um Dauer aus Ende zu bestimmen
      const endCandidates = [
        it.end,
        it.out,
        it.endSec,
        it.outSec,
        it.tEnd,
        it.timeEnd,
      ]

      // Helper: Zahl oder undefined
      const num = (v: any): number | undefined =>
        typeof v === 'number' && Number.isFinite(v) ? v : undefined

      let start = startCandidates.map(num).find((x) => x !== undefined)
      let dur = durCandidates.map(num).find((x) => x !== undefined)

      // Falls keine Dauer: über Ende ableiten
      if (dur === undefined) {
        const end = endCandidates.map(num).find((x) => x !== undefined)
        if (end !== undefined && start !== undefined) {
          dur = Math.max(0, end - start)
        }
      }

      // Millisekunden → Sekunden Heuristik (z.B. 53200 → 53.2s)
      const toSec = (v: number | undefined) =>
        v === undefined ? undefined : v > 1000 ? v / 1000 : v

      start = toSec(start)
      dur = toSec(dur)

      // Defaults, wenn immer noch nichts da: Start = i*2, Dauer = 2s
      if (start === undefined) start = i * 2
      if (dur === undefined || dur <= 0) dur = 2

      return { start, duration: dur }
    },
    [itemTimes]
  )

  /** ---------- Normierung in interne TimelineItems ---------- */
  const normItems = React.useMemo<TimelineItem[]>(() => {
    return items.map((it, i) => {
      const id = itemKey(it, i)
      const { start, duration } = inferTimes(it, i)
      const track = itemTrack(it, i)
      const label = itemLabel(it, i)
      const kind: TimelineItem['kind'] =
        typeof it.kind === 'string'
          ? (it.kind.toLowerCase().includes('audio')
              ? 'audio'
              : it.kind.toLowerCase().includes('image')
                ? 'image'
                : 'video')
          : 'video'
      return { id, start, duration, track, label, kind }
    })
  }, [items, itemKey, inferTimes, itemTrack, itemLabel])

  /** ---------- Duration ---------- */
  const computedDuration = React.useMemo(() => {
    if (typeof duration === 'number') return Math.max(1, duration)
    const maxEnd = normItems.reduce((m, it) => Math.max(m, it.start + it.duration), 0)
    return Math.max(1, Math.ceil(maxEnd))
  }, [duration, normItems])

  /** ---------- Tracks ---------- */
  const tracks = React.useMemo(() => {
    if (!normItems.length) return [0, 1]
    const ids = new Set<number>([0])
    for (const it of normItems) ids.add(it.track ?? 0)
    return Array.from(ids).sort((a, b) => a - b)
  }, [normItems])

  /** ---------- Playhead ---------- */
  const [t, setT] = React.useState(0)
  const rafRef = React.useRef<number | null>(null)
  const lastRef = React.useRef<number>(0)

  React.useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastRef.current = 0
      return
    }
    const step = (now: number) => {
      if (!lastRef.current) lastRef.current = now
      const dt = (now - lastRef.current) / 1000
      lastRef.current = now
      setT((cur) => {
        const next = cur + dt
        return next > computedDuration ? 0 : next
      })
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastRef.current = 0
    }
  }, [isPlaying, computedDuration])

  /** ---------- UI ---------- */
  const width = Math.max(600, computedDuration * pxPerSec)
  const trackHeight = compact ? 24 : 32

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    const dir = e.deltaY > 0 ? -1 : 1
    setZ((z0) => z0 + dir * 0.25)
  }

  const formatSec = (s: number) => `${s.toFixed(0)}s`

  return (
    <div className={cn('select-none rounded-xl border bg-card/60', className)}>
      {/* Controls */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="text-xs text-muted-foreground">Timeline</div>
        <div className="flex items-center gap-1">
          <button
            className="rounded-md border p-1 hover:bg-accent"
            onClick={() => setZ((z0) => z0 - 0.25)}
            title="Zoom out (⌘/Ctrl + Scroll)"
            type="button"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <div className="w-12 text-center text-xs tabular-nums">{z.toFixed(2)}×</div>
          <button
            className="rounded-md border p-1 hover:bg-accent"
            onClick={() => setZ((z0) => z0 + 0.25)}
            title="Zoom in (⌘/Ctrl + Scroll)"
            type="button"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Ruler + Tracks */}
      <div className="relative h-56 overflow-auto" onWheel={onWheel}>
        <div className="relative" style={{ width }}>
          {/* Ruler */}
          <div className="sticky top-0 z-10 flex h-6 items-end bg-gradient-to-b from-card/80 to-transparent backdrop-blur">
            {Array.from({ length: Math.ceil(computedDuration) + 1 }).map((_, i) => (
              <div key={i} className="relative" style={{ width: pxPerSec }}>
                <div className="h-3 w-px bg-border" />
                <div className="absolute left-1 top-0 text-[10px] text-muted-foreground">
                  {formatSec(i)}
                </div>
              </div>
            ))}
          </div>

          {/* Track area */}
          <div className="mt-1 space-y-2 p-2">
            {tracks.map((trk) => (
              <div key={trk} className="flex items-center gap-2">
                <div className="w-[100px] shrink-0 rounded-md border bg-muted px-2 py-1 text-xs">
                  {trk >= 100 ? `Audio ${trk - 99}` : `Video ${trk + 1}`}
                </div>
                <div
                  className="relative w-full rounded-md border bg-background"
                  style={{ height: trackHeight }}
                  role="listbox"
                  aria-label={`Track ${trk}`}
                >
                  {normItems
                    .filter((it) => (it.track ?? 0) === trk)
                    .map((it) => {
                      const left = it.start * pxPerSec
                      const w = Math.max(2, it.duration * pxPerSec)
                      const selected = String(it.id) === String(selectedId ?? '')
                      return (
                        <button
                          key={it.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          title={it.label || it.id}
                          className={cn(
                            'absolute top-0 h-full overflow-hidden rounded-md border px-2 text-left text-[11px] leading-[22px]',
                            'bg-card hover:bg-accent',
                            selected && 'ring-2 ring-primary border-primary'
                          )}
                          style={{ left, width: w }}
                          onClick={() => onSelect?.(String(it.id))}
                        >
                          <span className="line-clamp-1">
                            {it.label ?? it.kind ?? 'Clip'}
                          </span>
                        </button>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>

          {/* Playhead */}
          <div
            className="pointer-events-none absolute left-0 top-0 h-full w-px bg-primary"
            style={{ transform: `translateX(${t * pxPerSec}px)` }}
          />
        </div>
      </div>
    </div>
  )
}
