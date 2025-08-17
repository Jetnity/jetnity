'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Plane, Hotel, Car, Ship, Bus, Train, Route as RouteIcon, Activity as ActivityIcon,
} from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type TabType =
  | 'flight' | 'hotel' | 'car' | 'activity' | 'ferry' | 'bus' | 'train' | 'cruise' | 'combo'

const FlightSearchForm   = dynamic(() => import('./forms/FlightSearchForm'),   { ssr: false })
const HotelSearchForm    = dynamic(() => import('./forms/HotelSearchForm'),    { ssr: false })
const CarSearchForm      = dynamic(() => import('./forms/CarSearchForm'),      { ssr: false })
const ActivitySearchForm = dynamic(() => import('./forms/ActivitySearchForm'), { ssr: false })
const FerrySearchForm    = dynamic(() => import('./forms/FerrySearchForm'),    { ssr: false })
const BusSearchForm      = dynamic(() => import('./forms/BusSearchForm'),      { ssr: false })
const TrainSearchForm    = dynamic(() => import('./forms/TrainSearchForm'),    { ssr: false })
const CruiseSearchForm   = dynamic(() => import('./forms/CruiseSearchForm'),   { ssr: false })
const ComboSearchForm    = dynamic(() => import('./forms/ComboSearchForm'),    { ssr: false })

const TABS: { key: TabType; label: string; icon: React.ElementType }[] = [
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

  return (
    <section
      aria-label="Suche"
      className={cn(
        'mx-auto w-full max-w-7xl xl:max-w-[1320px] rounded-[28px] border border-white/10 text-white shadow-2xl ring-1 ring-black/5',
        'bg-[#0c1930]/92 supports-blur:backdrop-blur-xl supports-blur:bg-panel',
        'px-3 py-4 sm:px-5 sm:py-6 md:px-7 md:py-7',
        'pb-[calc(1rem+env(safe-area-inset-bottom))]'
      )}
    >
      {/* Tabs */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#0c1930] to-transparent opacity-60 sm:hidden" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#0c1930] to-transparent opacity-60 sm:hidden" />
        <nav
          role="tablist"
          aria-label="Suchkategorien"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory mask-edges"
        >
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = key === tab
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${key}`}
                onClick={() => setTab(key)}
                className={cn(
                  'snap-start inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition focus-ring',
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
        aria-live="polite"
        className="mt-4 rounded-2xl bg-white/6 p-3 sm:p-4 ring-1 ring-inset ring-white/10"
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
    </section>
  )
}
