'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Plane, Hotel, Car, Ship, Bus, Train, Route as RouteIcon,
} from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

// Fallback cn (falls utils nicht vorhanden ist)
function cnFallback(...a: any[]) { return a.filter(Boolean).join(' ') }
const cn = typeof _cn === 'function' ? _cn : cnFallback

type TabType = 'flight' | 'hotel' | 'car' | 'ferry' | 'bus' | 'train' | 'cruise' | 'combo'

/** ⬇️ Lazy load – reduziert JS im Hero massiv */
const FlightSearchForm = dynamic(() => import('./forms/FlightSearchForm'), { ssr: false })
const HotelSearchForm  = dynamic(() => import('./forms/HotelSearchForm'),  { ssr: false })
const CarSearchForm    = dynamic(() => import('./forms/CarSearchForm'),    { ssr: false })
const FerrySearchForm  = dynamic(() => import('./forms/FerrySearchForm'),  { ssr: false })
const BusSearchForm    = dynamic(() => import('./forms/BusSearchForm'),    { ssr: false })
const TrainSearchForm  = dynamic(() => import('./forms/TrainSearchForm'),  { ssr: false })
const CruiseSearchForm = dynamic(() => import('./forms/CruiseSearchForm'), { ssr: false })
const ComboSearchForm  = dynamic(() => import('./forms/ComboSearchForm'),  { ssr: false })

const TABS: { key: TabType; label: string; icon: React.ElementType }[] = [
  { key: 'flight', label: 'Flüge',        icon: Plane },
  { key: 'hotel',  label: 'Hotels',       icon: Hotel },
  { key: 'car',    label: 'Mietwagen',    icon: Car },
  { key: 'ferry',  label: 'Fähren',       icon: Ship },
  { key: 'bus',    label: 'Bus',          icon: Bus },
  { key: 'train',  label: 'Zug',          icon: Train },
  { key: 'cruise', label: 'Kreuzfahrten', icon: Ship },
  { key: 'combo',  label: 'Kombireisen',  icon: RouteIcon },
]

export default function HeroMegaSearch() {
  const [tab, setTab] = useState<TabType>('flight')

  return (
    <section
      aria-label="Suche"
      className="mx-auto w-full max-w-6xl rounded-3xl border border-white/10 bg-[#0c1930] px-5 py-5 text-white shadow-2xl ring-1 ring-black/5 backdrop-blur md:px-7 md:py-6"
    >
      {/* Tabs */}
      <nav className="flex flex-wrap items-center gap-2">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = key === tab
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition',
                active
                  ? 'border-white/20 bg-white/10 font-semibold'
                  : 'border-white/10 text-white/80 hover:border-white/20 hover:bg-white/5'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Content */}
      <div className="mt-5">
        {tab === 'flight' && <FlightSearchForm />}
        {tab === 'hotel'  && <HotelSearchForm />}
        {tab === 'car'    && <CarSearchForm />}
        {tab === 'ferry'  && <FerrySearchForm />}
        {tab === 'bus'    && <BusSearchForm />}
        {tab === 'train'  && <TrainSearchForm />}
        {tab === 'cruise' && <CruiseSearchForm />}
        {tab === 'combo'  && <ComboSearchForm />}
      </div>
    </section>
  )
}
