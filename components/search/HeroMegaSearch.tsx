'use client'

import React, { useState } from 'react'
import { Plane, Hotel, Car, Ship, Bus, Train, Route, Users2, ArrowRightLeft, Repeat, CornerRightUp, Shuffle, ChevronDown } from 'lucide-react'
import TravelerCabinSelector from './forms/TravelerCabinSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

type TabType = 'flight' | 'hotel' | 'car' | 'ferry' | 'bus' | 'train' | 'cruise' | 'combo'
type TripType = 'roundtrip' | 'oneway' | 'multicity'

const TABS: { label: string; icon: React.ReactNode; value: TabType }[] = [
  { label: 'Flüge', icon: <Plane className="w-4 h-4" />, value: 'flight' },
  { label: 'Hotels', icon: <Hotel className="w-4 h-4" />, value: 'hotel' },
  { label: 'Mietwagen', icon: <Car className="w-4 h-4" />, value: 'car' },
  { label: 'Fähren', icon: <Ship className="w-4 h-4" />, value: 'ferry' },
  { label: 'Bus', icon: <Bus className="w-4 h-4" />, value: 'bus' },
  { label: 'Zug', icon: <Train className="w-4 h-4" />, value: 'train' },
  { label: 'Kreuzfahrten', icon: <Ship className="w-4 h-4" />, value: 'cruise' },
  { label: 'Kombireisen', icon: <Route className="w-4 h-4" />, value: 'combo' },
]

const TRIP_TYPES: { key: TripType; label: string; icon: React.ReactNode }[] = [
  { key: 'roundtrip', label: 'Hin- und Rückflug', icon: <Repeat className="w-4 h-4" /> },
  { key: 'oneway', label: 'Nur Hinflug', icon: <CornerRightUp className="w-4 h-4" /> },
  { key: 'multicity', label: 'Gabelflug', icon: <Shuffle className="w-4 h-4" /> },
]

export default function HeroMegaSearch() {
  const [activeTab, setActiveTab] = useState<TabType>('flight')
  const [tripType, setTripType] = useState<TripType>('roundtrip')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date1, setDate1] = useState<Date | null>(null)
  const [date2, setDate2] = useState<Date | null>(null)
  const [directOnly, setDirectOnly] = useState(false)
  const [flexible, setFlexible] = useState(false)
  const [travelerPopup, setTravelerPopup] = useState(false)
  const [travelers, setTravelers] = useState({ adults: 1, children: 0, infants: 0 })
  const [cabin, setCabin] = useState<'eco' | 'premium' | 'business' | 'first'>('eco')
  const [showTripType, setShowTripType] = useState(false)

  function swapFromTo() {
    setFrom(to)
    setTo(from)
  }

  function TripTypeDropdown() {
    const selected = TRIP_TYPES.find(t => t.key === tripType)!
    return (
      <div className="relative z-10">
        <button
          type="button"
          className={cn(
            'flex items-center justify-between w-[180px] px-3 py-2 rounded-md bg-white text-[#1a2640] font-medium border border-gray-300 text-sm shadow-sm transition',
            showTripType && 'ring-2 ring-blue-400'
          )}
          onClick={() => setShowTripType(v => !v)}
        >
          <span className="flex items-center gap-2">{selected.icon} {selected.label}</span>
          <ChevronDown className="w-4 h-4 ml-1 opacity-60" />
        </button>
        {showTripType && (
          <div className="absolute left-0 top-full z-40 mt-1 w-full bg-white rounded-md shadow-xl border">
            {TRIP_TYPES.map(t => (
              <button
                key={t.key}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 w-full text-left rounded-md transition',
                  tripType === t.key ? 'bg-blue-100 font-bold text-blue-900' : 'hover:bg-gray-100'
                )}
                onClick={() => { setTripType(t.key); setShowTripType(false) }}
                type="button"
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full flex justify-center">
      <div className="jetnity-search-panel mx-auto">
        {/* Tabs */}
        <div className="flex flex-wrap justify-center items-center gap-2 px-1 pt-2 pb-6">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              className={cn(
                'flex items-center gap-2 px-6 py-2 rounded-xl font-semibold text-base transition-all',
                activeTab === tab.value
                  ? 'bg-white text-[#19233b] shadow-lg'
                  : 'bg-[#202b45] text-white hover:bg-primary/10 border border-white/10'
              )}
              style={{ minWidth: 120 }}
              onClick={() => setActiveTab(tab.value)}
              tabIndex={0}
              aria-label={tab.label}
              type="button"
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Suchformular */}
        <form className="w-full" autoComplete="off">
          {activeTab === 'flight' && (
            <>
              {/* Exakte Zeile für TripType Dropdown (wie Skyscanner) */}
              <div className="flex flex-row justify-start mb-2">
                <TripTypeDropdown />
              </div>
              <div className="flex flex-row gap-2 items-end jetnity-search-row">
                {/* Von */}
                <div className="flex flex-col min-w-[140px]">
                  <label className="jetnity-label">Von</label>
                  <div className="flex items-center">
                    <Input
                      className="jetnity-search-input"
                      placeholder="Abflughafen, Stadt"
                      value={from}
                      onChange={e => setFrom(e.target.value)}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="ml-2 jetnity-swap-btn"
                      title="Wechsel"
                      tabIndex={-1}
                      onClick={swapFromTo}
                    >
                      <ArrowRightLeft className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {/* Nach */}
                <div className="flex flex-col min-w-[140px]">
                  <label className="jetnity-label">Nach</label>
                  <Input
                    className="jetnity-search-input"
                    placeholder="Zielflughafen, Stadt"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                {/* Abflug */}
                <div className="flex flex-col min-w-[120px]">
                  <label className="jetnity-label">Abflug</label>
                  <DatePicker
                    label="Abflug"
                    className="jetnity-search-input"
                    selectedDate={date1}
                    onSelect={setDate1}
                    placeholder="Datum wählen"
                  />
                </div>
                {/* Rückflug */}
                {tripType === 'roundtrip' && (
                  <div className="flex flex-col min-w-[120px]">
                    <DatePicker
                      label="Rückflug"
                      className="jetnity-search-input"
                      selectedDate={date2}
                      onSelect={setDate2}
                      placeholder="Datum wählen"
                    />
                  </div>
                )}
                {/* Reisende & Kabine */}
                <div className="flex flex-col min-w-[160px]">
                  <label className="jetnity-label">Reisende & Kabine</label>
                  <button
                    type="button"
                    className="jetnity-traveler-btn"
                    onClick={() => setTravelerPopup(true)}
                  >
                    <Users2 className="w-5 h-5 mr-2 opacity-70" />
                    <span>
                      {travelerLabel(travelers)}, {cabinLabel(cabin)}
                    </span>
                  </button>
                  {travelerPopup && (
                    <TravelerCabinSelector
                      open={travelerPopup}
                      onClose={() => setTravelerPopup(false)}
                      value={travelers}
                      onChange={setTravelers}
                      cabinClass={cabin}
                      onCabinChange={setCabin}
                    />
                  )}
                </div>
                {/* Suchen Button */}
                <div className="flex flex-col min-w-[100px] justify-end">
                  <Button type="submit" className="search-btn">
                    Suchen
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Optionen unterhalb */}
          {activeTab === 'flight' && (
            <div className="flex gap-6 items-center mt-4 px-2">
              <label className="flex items-center gap-2 text-sm font-medium text-white/90">
                <Switch checked={directOnly} onCheckedChange={setDirectOnly} id="directOnly" />
                Nur Direktverbindung
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-white/90">
                <Switch checked={flexible} onCheckedChange={setFlexible} id="flexible" />
                +/- 3 Tage flexibel
              </label>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

// Hilfsfunktionen
function travelerLabel(t: { adults: number; children: number; infants: number }) {
  let s = []
  if (t.adults) s.push(`${t.adults} Erwachsener${t.adults > 1 ? 'e' : ''}`)
  if (t.children) s.push(`${t.children} Kind${t.children > 1 ? 'er' : ''}`)
  if (t.infants) s.push(`${t.infants} Baby${t.infants > 1 ? 's' : ''}`)
  return s.join(', ') || '1 Reisender'
}
function cabinLabel(key: string) {
  return (
    { eco: 'Economy', premium: 'Premium', business: 'Business', first: 'First' }[
      key as 'eco' | 'premium' | 'business' | 'first'
    ] || ''
  )
}
