'use client'

import { useState, type ElementType, type KeyboardEvent } from 'react'
import dynamic from 'next/dynamic'
import {
  Plane,
  Hotel,
  Car,
  Ship,
  Bus,
  Train,
  Route as RouteIcon,
  Activity as ActivityIcon,
} from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type TabType =
  | 'flight'
  | 'hotel'
  | 'car'
  | 'activity'
  | 'ferry'
  | 'bus'
  | 'train'
  | 'cruise'
  | 'combo'

const FlightSearchForm   = dynamic(() => import('./forms/FlightSearchForm'),   { ssr: false })
const HotelSearchForm    = dynamic(() => import('./forms/HotelSearchForm'),    { ssr: false })
const CarSearchForm      = dynamic(() => import('./forms/CarSearchForm'),      { ssr: false })
const ActivitySearchForm = dynamic(() => import('./forms/ActivitySearchForm'), { ssr: false })
const FerrySearchForm    = dynamic(() => import('./forms/FerrySearchForm'),    { ssr: false })
const BusSearchForm      = dynamic(() => import('./forms/BusSearchForm'),      { ssr: false })
const TrainSearchForm    = dynamic(() => import('./forms/TrainSearchForm'),    { ssr: false })
const CruiseSearchForm   = dynamic(() => import('./forms/CruiseSearchForm'),   { ssr: false })
const ComboSearchForm    = dynamic(() => import('./forms/ComboSearchForm'),    { ssr: false })

const TABS: { key: TabType; label: string; icon: ElementType }[] = [
  { key: 'flight',   label: 'Flüge',        icon: Plane },
  { key: 'hotel',    label: 'Hotels',       icon: Hotel },
  { key: 'car',      label: 'Mietwagen',    icon: Car },
  { key: 'activity', label: 'Aktivitäten',  icon: ActivityIcon },
  { key: 'ferry',    label: 'Fähren',       icon: Ship },
  { key: 'bus',      label: 'Bus',          icon: Bus },
  { key: 'train',    label: 'Zug',          icon: Train },
  { key: 'cruise',   label: 'Kreuzfahrten', icon: Ship },
  { key: 'combo',    label: 'Kombireisen',  icon: RouteIcon },
]

export default function HeroMegaSearch() {
  const [tab, setTab] = useState<TabType>('flight')

  const onKeyNav = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const dir = e.key === 'ArrowRight' ? 1 : -1
    const nextIdx = (idx + dir + TABS.length) % TABS.length
    setTab(TABS[nextIdx].key)
  }

  return (
    <section aria-label="Suche" className="w-full">
      <div className="mx-auto w-full max-w-[1360px] xl:max-w-[1400px] 2xl:max-w-[1440px] px-3 sm:px-5 md:px-7">
        <div
          className={cn(
            // Panel: glass/blur + breiter Container
            'rounded-[28px] border text-white shadow-2xl ring-1 ring-black/5',
            'border-white/10 bg-[#0c1930]/90',
            // echte Blur-Variante nur wenn unterstützt
            'supports-[backdrop-filter:blur(1px)]:backdrop-blur-xl',
            'supports-[backdrop-filter:blur(1px)]:bg-[#0c1930]/70',
            'px-3 py-4 sm:px-5 sm:py-6 md:px-7 md:py-7',
            'pb-[calc(1rem+env(safe-area-inset-bottom))]'
          )}
        >
          {/* Tabs */}
          <div className="relative">
            {/* Edge-Fade links/rechts */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0c1930] to-transparent opacity-70" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0c1930] to-transparent opacity-70" />

            <nav
              role="tablist"
              aria-label="Suchkategorien"
              className="relative flex items-center gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pr-4"
            >
              {TABS.map(({ key, label, icon: Icon }, idx) => {
                const active = key === tab
                return (
                  <button
                    key={key}
                    id={`tab-${key}`}
                    role="tab"
                    aria-selected={active}
                    aria-controls={`panel-${key}`}
                    tabIndex={active ? 0 : -1}
                    onClick={() => setTab(key)}
                    onKeyDown={(e) => onKeyNav(e, idx)}
                    className={cn(
                      'tap-target focus-ring snap-start inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition',
                      active
                        ? 'border-white/25 bg-white/15 font-semibold'
                        : 'border-white/10 text-white/85 hover:border-white/20 hover:bg-white/10'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Panel */}
          <div
            id={`panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            aria-live="polite"
            className="mt-4 rounded-2xl bg-white/5 p-3 sm:p-4 ring-1 ring-inset ring-white/10"
          >
            <div className="mt-2">
              {tab === 'flight'   && <FlightSearchForm />}
              {tab === 'hotel'    && <HotelSearchForm />}
              {tab === 'car'      && <CarSearchForm />}
              {tab === 'activity' && <ActivitySearchForm />}
              {tab === 'ferry'    && <FerrySearchForm />}
              {tab === 'bus'      && <BusSearchForm />}
              {tab === 'train'    && <TrainSearchForm />}
              {tab === 'cruise'   && <CruiseSearchForm />}
              {tab === 'combo'    && <ComboSearchForm />}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
