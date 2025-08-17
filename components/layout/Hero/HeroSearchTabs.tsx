// components/layout/Hero/HeroSearchTabs.tsx
'use client'

import { useEffect, useRef } from 'react'
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
  icon: React.ComponentType<{ className?: string }>
}

export const DEFAULT_TABS: TabDef[] = [
  { label: 'Flüge', value: 'flight', icon: PlaneTakeoff },
  { label: 'Hotels', value: 'hotel', icon: Hotel },
  { label: 'Mietwagen', value: 'car', icon: Car },
  { label: 'Aktivitäten', value: 'activity', icon: Activity },
  { label: 'Fähren', value: 'ferry', icon: Ship },
  { label: 'Bus', value: 'bus', icon: Bus },
  { label: 'Zug', value: 'train', icon: Train },
  { label: 'Kreuzfahrten', value: 'cruise', icon: CruiseShipIcon ?? Ship },
  { label: 'Kombireisen', value: 'combo', icon: RouteIcon },
]

export default function HeroSearchTabs({
  selected,
  onSelect,
  tabs = DEFAULT_TABS,
  className,
}: {
  selected: SearchMode
  onSelect: (value: SearchMode) => void
  tabs?: TabDef[]
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

  // Aktiven Tab in den Viewport scrollen (mobile)
  useEffect(() => {
    const el = containerRef.current?.querySelector<HTMLButtonElement>(
      `button[data-value="${selected}"]`
    )
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selected])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const idx = tabs.findIndex((t) => t.value === selected)
    const next =
      e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length
    onSelect(tabs[next].value)
  }

  return (
    <div
      role="tablist"
      aria-label="Suchkategorien"
      onKeyDown={onKeyDown}
      ref={containerRef}
      className={cn(
        'flex w-full items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur',
        className
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = selected === tab.value
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            aria-controls={`panel-${tab.value}`}
            data-value={tab.value}
            onClick={() => onSelect(tab.value)}
            className={cn(
              'inline-flex select-none items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-sm transition',
              active
                ? 'border-white/20 bg-white/10 font-semibold text-white'
                : 'border-white/10 text-white/80 hover:border-white/20 hover:bg-white/5'
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
