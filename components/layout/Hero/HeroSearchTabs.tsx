// components/layout/Hero/HeroSearchTabs.tsx
'use client'

import * as React from 'react'
import { cn as _cn } from '@/lib/utils'
import {
  PlaneTakeoff,
  Hotel,
  Car,
  Ship,
  Bus,
  Train,
  Route as RouteIcon,
  Activity,
} from 'lucide-react'
import { CruiseShipIcon } from '@/components/ui/icons/CruiseShip'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

export type SearchMode =
  | 'flight'
  | 'hotel'
  | 'car'
  | 'activity'
  | 'ferry'
  | 'bus'
  | 'train'
  | 'cruise'
  | 'combo'

type TabDef = {
  label: string
  value: SearchMode
  icon: React.ElementType<{ className?: string }>
  disabled?: boolean
  title?: string
}

export const DEFAULT_TABS: TabDef[] = [
  { label: 'Flüge',        value: 'flight',   icon: PlaneTakeoff },
  { label: 'Hotels',       value: 'hotel',    icon: Hotel },
  { label: 'Mietwagen',    value: 'car',      icon: Car },
  { label: 'Aktivitäten',  value: 'activity', icon: Activity },
  { label: 'Fähren',       value: 'ferry',    icon: Ship },
  { label: 'Bus',          value: 'bus',      icon: Bus },
  { label: 'Zug',          value: 'train',    icon: Train },
  { label: 'Kreuzfahrten', value: 'cruise',   icon: CruiseShipIcon ?? Ship },
  { label: 'Kombireisen',  value: 'combo',    icon: RouteIcon },
]

type Props = {
  selected: SearchMode
  onSelect: (value: SearchMode) => void
  tabs?: TabDef[]
  className?: string
  variant?: 'glass' | 'soft'
  size?: 'sm' | 'md'
  idBase?: string
  selectOnFocus?: boolean
}

export default function HeroSearchTabs({
  selected,
  onSelect,
  tabs = DEFAULT_TABS,
  className,
  variant = 'glass',
  size = 'md',
  idBase,
  selectOnFocus = false,
}: Props) {
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const btnRefs = React.useRef<Array<HTMLButtonElement | null>>([]) // sauber typisiert
  const uid = React.useId()
  const base = idBase ?? `hero-tabs-${uid}`

  // --- Aktiv-Indicator (gleitet unter dem aktiven Tab)
  const [indicator, setIndicator] = React.useState<{ left: number; width: number } | null>(null)

  const recalcIndicator = React.useCallback(() => {
    const list = listRef.current
    const idx = tabs.findIndex(t => t.value === selected)
    const btn = btnRefs.current[idx]
    if (!list || !btn) return
    const left = btn.offsetLeft - list.scrollLeft + 4
    const width = btn.offsetWidth
    setIndicator({ left, width })
  }, [selected, tabs])

  React.useEffect(() => {
    recalcIndicator()
    const list = listRef.current
    if (!list) return

    const onScroll = () => recalcIndicator()
    const ro = new ResizeObserver(() => recalcIndicator())

    list.addEventListener('scroll', onScroll, { passive: true })
    ro.observe(list)
    btnRefs.current.forEach(b => { if (b) ro.observe(b) })

    return () => {
      list.removeEventListener('scroll', onScroll)
      ro.disconnect()
    }
  }, [recalcIndicator])

  // Aktiven Tab zentrieren (mobile)
  React.useEffect(() => {
    const list = listRef.current
    const idx = tabs.findIndex(t => t.value === selected)
    const btn = btnRefs.current[idx]
    if (!list || !btn) return
    const listCenter = list.clientWidth / 2
    const target = btn.offsetLeft + btn.offsetWidth / 2 - listCenter
    list.scrollTo({ left: target, behavior: 'smooth' })
  }, [selected, tabs])

  // Keyboard: Arrow, Home/End, Enter/Space
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const key = e.key
    const dir = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0
    if (dir !== 0 || key === 'Home' || key === 'End') e.preventDefault()

    const current = tabs.findIndex(t => t.value === selected)
    if (dir !== 0) {
      let next = current
      for (let i = 0; i < tabs.length; i++) {
        next = (next + dir + tabs.length) % tabs.length
        if (!tabs[next].disabled) break
      }
      btnRefs.current[next]?.focus()
      if (selectOnFocus) onSelect(tabs[next].value)
      return
    }
    if (key === 'Home') {
      const first = tabs.findIndex(t => !t.disabled)
      if (first >= 0) {
        btnRefs.current[first]?.focus()
        if (selectOnFocus) onSelect(tabs[first].value)
      }
      return
    }
    if (key === 'End') {
      const last = [...tabs].reverse().find(t => !t.disabled)
      const idx = last ? tabs.findIndex(t => t.value === last.value) : -1
      if (idx >= 0) {
        btnRefs.current[idx]?.focus()
        if (selectOnFocus) onSelect(tabs[idx].value)
      }
      return
    }
  }

  const containerClasses =
    variant === 'glass'
      ? 'relative mask-edges no-scrollbar flex w-full items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-1 supports-blur:backdrop-blur'
      : 'relative mask-edges no-scrollbar flex w-full items-center gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-1'

  const btnBase   = 'inline-flex select-none items-center gap-2 whitespace-nowrap rounded-xl border transition relative z-10'
  const btnSizing = size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-3.5 py-2 text-sm'
  const btnInactive =
    variant === 'glass'
      ? 'border-white/10 text-white/80 hover:border-white/20 hover:bg-white/5'
      : 'border-border text-foreground/80 hover:bg-muted/40'
  const btnActive =
    variant === 'glass'
      ? 'border-white/20 bg-white/10 font-semibold text-white'
      : 'border-border bg-secondary text-secondary-foreground font-semibold'

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Suchkategorien"
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className={cn(containerClasses, className)}
    >
      {/* gleitender Indicator */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute z-0 h-[calc(100%-8px)] translate-y-1 rounded-xl transition-[left,width,opacity] duration-200 ease-out',
          variant === 'glass' ? 'bg-white/8' : 'bg-primary/10 ring-1 ring-primary/20'
        )}
        style={{
          left: indicator?.left ?? 8,
          width: indicator?.width ?? 0,
          opacity: indicator ? 1 : 0,
        }}
      />

      {tabs.map((tab, i) => {
        const Icon = tab.icon
        const active = selected === tab.value
        const disabled = !!tab.disabled
        return (
          <button
            key={tab.value}
            ref={(el) => { btnRefs.current[i] = el }}  // <-- returns void (fix)
            role="tab"
            aria-selected={active}
            aria-controls={`${base}-panel-${tab.value}`}
            data-value={tab.value}
            title={tab.title}
            disabled={disabled}
            tabIndex={active ? 0 : -1}
            onClick={() => !disabled && onSelect(tab.value)}
            onFocus={() => selectOnFocus && !disabled && onSelect(tab.value)}
            className={cn(
              btnBase,
              btnSizing,
              active ? btnActive : btnInactive,
              disabled && 'opacity-50 pointer-events-none'
            )}
          >
            <Icon className={cn('h-4 w-4', active ? 'opacity-100' : 'opacity-80')} />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
