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
        'max-w-[1320px] 2xl:max-w-[1400px]',
        'px-3 sm:px-6'
      )}
    >
      {/* Glasiger, gemeinsamer Rahmen (Tabs + Panel) */}
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl border border-white/15 text-white',
          // deutlich mehr „Glass“: transparenter + Blur
          'bg-[rgba(14,27,46,0.55)] supports-blur:backdrop-blur-xl',
          // dezenter Glow/Highlight oben
          "before:pointer-events-none before:absolute before:inset-0 before:content-[''] before:rounded-3xl",
          "before:bg-[radial-gradient(120%_60%_at_50%_0%,rgba(255,255,255,0.14),rgba(255,255,255,0)_60%)]",
          // Tiefe
          'shadow-[0_10px_30px_rgba(0,0,0,0.35)]'
        )}
      >
        {/* Tabs */}
        <nav
          role="tablist"
          aria-label="Suchkategorien"
          className={cn(
            'flex flex-wrap items-center justify-center gap-2 md:gap-2.5',
            'px-4 sm:px-6 pt-3 sm:pt-4 pb-3 border-b border-white/10'
          )}
        >
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = key === tab
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${key}`}
                onClick={() => setTab(key)}
                className={cn(
                  'whitespace-nowrap inline-flex items-center gap-2 rounded-full border transition-colors',
                  'px-3 py-1.5 text-[13px] sm:text-sm',
                  // inaktiv: glasig dunkel
                  'bg-white/10 border-white/15 text-white/90 hover:bg-white/15 hover:border-white/25',
                  // aktiv: hell, dunkler Text
                  active && 'bg-white text-[#0c1930] border-white shadow-md'
                )}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-[#0c1930]' : 'text-white')} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Inneres helles Panel */}
        <div className="p-3 sm:p-5 md:p-6">
          <div
            className={cn(
              'w-full rounded-2xl bg-white/95 text-[#0c1930]',
              'shadow-inner ring-1 ring-black/5'
            )}
          >
            <div id={`panel-${tab}`} role="tabpanel" aria-live="polite" className="p-3 sm:p-4 md:p-5">
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
      </div>
    </section>
  )
}
