'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Plane, Hotel, Car, Ship, Bus, Train,
  Route as RouteIcon, Activity as ActivityIcon, MapPin
} from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type TabType =
  | 'flight' | 'hotel' | 'car' | 'activity' | 'ferry'
  | 'bus' | 'train' | 'cruise' | 'combo' | 'transfer'

const FlightSearchForm    = dynamic(() => import('./forms/FlightSearchForm'),    { ssr: false })
const HotelSearchForm     = dynamic(() => import('./forms/HotelSearchForm'),     { ssr: false })
const CarSearchForm       = dynamic(() => import('./forms/CarSearchForm'),       { ssr: false })
const ActivitySearchForm  = dynamic(() => import('./forms/ActivitySearchForm'),  { ssr: false })
const FerrySearchForm     = dynamic(() => import('./forms/FerrySearchForm'),     { ssr: false })
const BusSearchForm       = dynamic(() => import('./forms/BusSearchForm'),       { ssr: false })
const TrainSearchForm     = dynamic(() => import('./forms/TrainSearchForm'),     { ssr: false })
const CruiseSearchForm    = dynamic(() => import('./forms/CruiseSearchForm'),    { ssr: false })
const ComboSearchForm     = dynamic(() => import('./forms/ComboSearchForm'),     { ssr: false })
const TransferSearchForm  = dynamic(() => import('./forms/TransferSearchForm'),  { ssr: false })

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
  { key: 'transfer', label: 'Transfer',     icon: MapPin },
]

export default function HeroMegaSearch() {
  const [tab, setTab] = useState<TabType>('flight')

  return (
    <section
      aria-label="Suche"
      className={cn(
        'relative z-[80] isolate mx-auto w-full',
        'max-w-[1280px] 2xl:max-w-[1340px]',
        'px-3 sm:px-6'
      )}
    >
      {/* Tabs */}
      <nav
        role="tablist"
        aria-label="Suchkategorien"
        className="mb-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar mask-edges"
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
              className={cn('tab-chip', active && 'tab-chip--active')}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Glassy Navy Panel */}
      <div className="hero-glass rounded-3xl text-white shadow-2xl">
        <div className="p-3 sm:p-5 md:p-6">
          <div id={`panel-${tab}`} role="tabpanel" aria-live="polite">
            {tab === 'flight'   && <FlightSearchForm />}
            {tab === 'hotel'    && <HotelSearchForm />}
            {tab === 'car'      && <CarSearchForm />}
            {tab === 'activity' && <ActivitySearchForm />}
            {tab === 'ferry'    && <FerrySearchForm />}
            {tab === 'bus'      && <BusSearchForm />}
            {tab === 'train'    && <TrainSearchForm />}
            {tab === 'cruise'   && <CruiseSearchForm />}
            {tab === 'combo'    && <ComboSearchForm />}
            {tab === 'transfer' && <TransferSearchForm />}
          </div>
        </div>
      </div>
    </section>
  )
}
