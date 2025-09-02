// components/search/InspirationPanel.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type InspirationItem = {
  label: string
  mood: string
  region?: string
  tab?: 'discover' | 'flight' | 'hotel' | 'car' | 'train' | 'bus' | 'cruise' | 'combo'
  desc?: string
}

const DEFAULT_ITEMS: InspirationItem[] = [
  { label: 'Strand & Sonne', mood: 'beach',    region: 'europa',  tab: 'discover', desc: 'Mittelmeer, Kanaren, Algarve & Co.' },
  { label: 'Städte-Trips',   mood: 'city',     region: 'europa',  tab: 'discover', desc: 'Kurztrips mit Kultur, Food & Nightlife' },
  { label: 'Berge & Wandern',mood: 'mountain', region: 'alpen',   tab: 'discover', desc: 'Alpen, Dolomiten, Panorama-Routen' },
  { label: 'Wellness',       mood: 'wellness', region: 'europa',  tab: 'discover', desc: 'Spa, Thermen & Erholung' },
  { label: 'Food & Wine',    mood: 'food',     region: 'europa',  tab: 'discover', desc: 'Kulinarische Reisen & Weinregionen' },
  { label: 'Romantik',       mood: 'romance',  region: 'europa',  tab: 'discover', desc: 'Hideaways & Citylights' },
  { label: 'Abenteuer',      mood: 'adventure',region: 'global',  tab: 'discover', desc: 'Outdoor & Adrenalin' },
  { label: 'Familie',        mood: 'family',   region: 'europa',  tab: 'discover', desc: 'Kids-tauglich, Spaß & Komfort' },
  { label: 'Luxus',          mood: 'luxury',   region: 'global',  tab: 'discover', desc: 'High-End Hotels & Experiences' },
  { label: 'Budget',         mood: 'budget',   region: 'global',  tab: 'discover', desc: 'Clever sparen, groß erleben' },
]

const LS_RECENTS = 'jetnity.mood-recent.v1'
const SS_SCROLL  = 'jetnity.inspiration.scrollLeft.v1'

function buildSearchHref(i: InspirationItem) {
  const p = new URLSearchParams()
  p.set('tab', i.tab ?? 'discover')
  p.set('mood', i.mood)
  if (i.region) p.set('region', i.region)
  return `/search?${p.toString()}`
}

function readRecents(): string[] {
  if (typeof window === 'undefined') return []
  try { const r = window.localStorage.getItem(LS_RECENTS); return r ? JSON.parse(r) : [] } catch { return [] }
}
function writeRecent(mood: string) {
  if (typeof window === 'undefined') return
  try {
    const cur = readRecents().filter(m => m !== mood)
    const next = [mood, ...cur].slice(0, 8)
    window.localStorage.setItem(LS_RECENTS, JSON.stringify(next))
  } catch {}
}
const readScroll = () => (typeof window === 'undefined' ? 0 : Number(window.sessionStorage.getItem(SS_SCROLL) || 0) || 0)
const writeScroll = (x: number) => { try { if (typeof window !== 'undefined') window.sessionStorage.setItem(SS_SCROLL, String(Math.max(0, x))) } catch {} }

// Sanftes Scrollen (Fallback für Safari/ältere Browser)
function smoothScrollBy(el: HTMLElement, dx: number) {
  const supportsSmooth = 'scrollBehavior' in document.documentElement.style
  if (supportsSmooth) { el.scrollBy({ left: dx, behavior: 'smooth' }); return }
  const start = el.scrollLeft, goal = start + dx, dur = 280, t0 = performance.now()
  const tick = (t: number) => {
    const p = Math.min(1, (t - t0) / dur)
    const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p
    el.scrollLeft = start + (goal - start) * ease
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

export default function InspirationPanel({
  title = 'Inspirationen für dich',
  subtitle = 'Nach Stimmung entdecken',
  items = DEFAULT_ITEMS,
  className,
}: {
  title?: string
  subtitle?: string
  items?: InspirationItem[]
  className?: string
}) {
  const search = useSearchParams()
  const activeMood = (search.get('mood') || '').toLowerCase()
  const ref = React.useRef<HTMLDivElement>(null)

  const [canLeft, setCanLeft] = React.useState(false)
  const [canRight, setCanRight] = React.useState(true)
  const [progress, setProgress] = React.useState(0)

  // Personalisierte Reihenfolge (stabil)
  const [ordered, setOrdered] = React.useState<InspirationItem[]>(items)
  React.useEffect(() => {
    const recents = readRecents()
    if (!recents.length) return
    const m = new Map<string, number>()
    recents.forEach((v, i) => m.set(v.toLowerCase(), i))
    setOrdered(prev => [...prev].sort((a,b) => {
      const ai = m.has(a.mood.toLowerCase()) ? (m.get(a.mood.toLowerCase())! - 1000) : 0
      const bi = m.has(b.mood.toLowerCase()) ? (m.get(b.mood.toLowerCase())! - 1000) : 0
      return ai - bi
    }))
  }, [items])

  // Progress + Kanten + Scroll-Restore
  const update = React.useCallback(() => {
    const el = ref.current; if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const max = Math.max(1, scrollWidth - clientWidth)
    setCanLeft(scrollLeft > 0)
    setCanRight(scrollLeft < max - 1)
    setProgress(Math.min(1, Math.max(0, scrollLeft / max)))
    writeScroll(scrollLeft)
  }, [])
  React.useEffect(() => {
    const el = ref.current; if (!el) return
    const saved = readScroll(); if (saved > 0) el.scrollLeft = saved
    update()
    const onScroll = () => update()
    el.addEventListener('scroll', onScroll, { passive: true })
    const ro = new ResizeObserver(update); ro.observe(el)
    return () => { el.removeEventListener('scroll', onScroll); ro.disconnect() }
  }, [update])

  // Aktiven Chip beim ersten Mount zentrieren
  React.useEffect(() => {
    const el = ref.current
    if (!el || !activeMood) return
    const chip = el.querySelector<HTMLAnchorElement>(`a[data-mood="${CSS.escape(activeMood)}"]`)
    if (chip) chip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Drag & Wheel horizontal
  React.useEffect(() => {
    const el = ref.current; if (!el) return
    let down = false, startX = 0, startLeft = 0
    const pd = (e: PointerEvent) => { down = true; startX = e.clientX; startLeft = el.scrollLeft; el.setPointerCapture(e.pointerId) }
    const mv = (e: PointerEvent) => { if (!down) return; el.scrollLeft = startLeft - (e.clientX - startX) }
    const up = (e: PointerEvent) => { down = false; try { el.releasePointerCapture(e.pointerId) } catch {} }
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { smoothScrollBy(el, e.deltaY); e.preventDefault() }
    }
    el.addEventListener('pointerdown', pd); el.addEventListener('pointermove', mv)
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => { el.removeEventListener('pointerdown', pd); el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.removeEventListener('wheel', wheel) }
  }, [])

  // Pfeile – robuster Step (≈80% der Viewportbreite)
  const step = () => {
    const el = ref.current
    if (!el) return 320
    return Math.max(240, Math.round(el.clientWidth * 0.8))
  }
  const scrollLeftBy = () => { const el = ref.current; if (!el) return; smoothScrollBy(el, -step()) }
  const scrollRightBy = () => { const el = ref.current; if (!el) return; smoothScrollBy(el,  step()) }

  // Keyboard: ← →
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement
    if (!t || t.tagName !== 'A') return
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const list = Array.from(ref.current?.querySelectorAll<HTMLAnchorElement>('a[data-chip]') || [])
    const i = list.findIndex(a => a === t); if (i === -1) return
    const ni = e.key === 'ArrowRight' ? Math.min(list.length - 1, i + 1) : Math.max(0, i - 1)
    list[ni]?.focus({ preventScroll: true })
    list[ni]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }

  return (
    <section className={cn('relative py-6 sm:py-8', className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <div className="hidden sm:flex items-center gap-3">
            <p className="text-xs text-muted-foreground">{subtitle}</p>
            <div className="relative h-1 w-44 overflow-hidden rounded-full bg-border">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-fuchsia-500 to-sky-500 transition-[width]"
                style={{ width: `${Math.max(8, progress * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Chips Row */}
        <div className="relative">
          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />

          {/* Arrows */}
          <button
            type="button"
            aria-label="Nach links scrollen"
            onClick={scrollLeftBy}
            disabled={!canLeft}
            className={cn(
              'absolute left-1 top-1/2 z-40 -translate-y-1/2 rounded-full border border-border bg-card/90 p-2 shadow backdrop-blur transition hover:bg-card',
              'pointer-events-auto',
              !canLeft && 'opacity-40 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Nach rechts scrollen"
            onClick={scrollRightBy}
            disabled={!canRight}
            className={cn(
              'absolute right-1 top-1/2 z-40 -translate-y-1/2 rounded-full border border-border bg-card/90 p-2 shadow backdrop-blur transition hover:bg-card',
              'pointer-events-auto',
              !canRight && 'opacity-40 cursor-not-allowed'
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Scrollarea */}
          <nav
            aria-label="Stimmungen"
            role="navigation"
            tabIndex={0}
            onKeyDown={onKeyDown}
            ref={ref}
            style={{ WebkitOverflowScrolling: 'touch' as any }}
            className={cn(
              'flex gap-3 overflow-x-auto scroll-smooth px-1 py-2',
              'snap-x snap-mandatory',
              '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
              'rounded-xl'
            )}
          >
            {ordered.map((it) => {
              const active = activeMood === it.mood.toLowerCase()
              return (
                <Chip
                  key={`${it.mood}-${it.region ?? 'any'}`}
                  href={buildSearchHref(it)}
                  label={it.label}
                  mood={it.mood}
                  desc={it.desc}
                  active={active}
                  onClick={() => writeRecent(it.mood)}
                />
              )
            })}

            {/* Reset */}
            <a
              href="/search?tab=discover"
              className="ml-1 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card/70 px-4 py-2 text-sm text-foreground shadow-sm backdrop-blur-md transition hover:bg-card"
              aria-label="Filter zurücksetzen"
              data-chip
            >
              ↺ Zurücksetzen
            </a>
          </nav>
        </div>
      </div>
    </section>
  )
}

function Chip({
  href, label, mood, desc, active, onClick,
}: {
  href: string
  label: string
  mood: string
  desc?: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <div className="group relative snap-start">
      <Link
        href={href}
        data-chip
        data-mood={mood.toLowerCase()}
        aria-current={active ? 'true' : undefined}
        aria-label={`${label}${active ? ' (aktiv)' : ''}`}
        onClick={onClick}
        className={cn(
          'relative rounded-full p-[1.6px]',
          active
            ? 'bg-gradient-to-r from-primary via-fuchsia-500 to-sky-500'
            : 'bg-gradient-to-r from-white/15 via-white/5 to-transparent'
        )}
      >
        <span
          className={cn(
            'inline-flex items-center gap-2 whitespace-nowrap rounded-full',
            'bg-card/70 px-4 py-2 text-sm text-foreground shadow-sm backdrop-blur-md',
            'transition-[transform,background] duration-300 hover:scale-[1.02] active:scale-[0.99]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            active && 'bg-white text-[#0c1930]'
          )}
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary via-fuchsia-500 to-sky-500 shadow" />
          <span className="font-medium">{label}</span>
        </span>
      </Link>

      {desc && (
        <div
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-1/2 z-30 -translate-x-1/2',
            'bottom-[calc(100%+12px)] w-max max-w-[260px]',
            'rounded-xl border border-border bg-card/95 px-3 py-2 text-xs text-muted-foreground shadow-lg backdrop-blur',
            'opacity-0 transition-opacity duration-150',
            'group-hover:opacity-100 group-focus-within:opacity-100'
          )}
        >
          {desc}
          <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b border-border bg-card/95" aria-hidden />
        </div>
      )}
    </div>
  )
}
