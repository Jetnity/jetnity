'use client'

import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Plane, Hotel, Car, Ship, Bus, Train, Route, BadgePercent, MapPin, Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PassengerSelector, PassengerCounts } from './forms/PassengerSelector'

type TabType = 'flight' | 'hotel' | 'car' | 'ferry' | 'bus' | 'train' | 'cruise' | 'combo'

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

export default function HeroMegaSearch() {
  const [activeTab, setActiveTab] = useState<TabType>('flight')

  // Typisierte Passenger-Logik!
  const [passengers, setPassengers] = useState<PassengerCounts>({
    adults: 1,
    children: 0,
    infants: 0,
  })

  const [directOnly, setDirectOnly] = useState(false)
  const [flexible, setFlexible] = useState(false)
  const [cabinClass, setCabinClass] = useState<'eco' | 'premium' | 'business' | 'first'>('eco')

  // DatePicker States (vereinfacht, bei echten Formularen sollten es useForm-Felder sein)
  const [date1, setDate1] = useState<Date | null>(null)
  const [date2, setDate2] = useState<Date | null>(null)

  function renderFields() {
    switch (activeTab) {
      case 'flight':
        return (
          <>
            <div className="flex flex-col min-w-[180px]">
              <label className="text-xs font-semibold mb-1">Von</label>
              <Input placeholder="Abflughafen, Stadt" />
            </div>
            <div className="flex flex-col min-w-[180px]">
              <label className="text-xs font-semibold mb-1">Nach</label>
              <Input placeholder="Zielflughafen, Stadt" />
            </div>
            <div className="flex flex-col min-w-[160px]">
              <label className="text-xs font-semibold mb-1">Abflug</label>
              <DatePicker
                label=""
                selectedDate={date1}
                onSelect={setDate1}
                placeholder="Datum wählen"
              />
            </div>
            <div className="flex flex-col min-w-[160px]">
              <label className="text-xs font-semibold mb-1">Rückflug</label>
              <DatePicker
                label=""
                selectedDate={date2}
                onSelect={setDate2}
                placeholder="Datum wählen"
              />
            </div>
            <div className="flex flex-col min-w-[160px]">
              <PassengerSelector
                value={passengers}
                onChange={setPassengers}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold mb-1">Kabine</label>
              <Select
                value={cabinClass}
                onChange={e => setCabinClass(e.target.value as any)}
                options={[
                  { label: 'Economy', value: 'eco' },
                  { label: 'Premium', value: 'premium' },
                  { label: 'Business', value: 'business' },
                  { label: 'First', value: 'first' },
                ]}
              />
            </div>
            <div className="flex flex-col items-start">
              <label className="text-xs font-semibold mb-1">Optionen</label>
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2">
                  <Switch checked={directOnly} onCheckedChange={setDirectOnly} id="directOnly" />
                  Nur Direktflüge
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={flexible} onCheckedChange={setFlexible} id="flexible" />
                  +/- 3 Tage flexibel
                </label>
              </div>
            </div>
          </>
        )
      case 'hotel':
        return (
          <>
            <div className="flex flex-col min-w-[220px]">
              <label className="text-xs font-semibold mb-1">Ort / Unterkunft</label>
              <Input placeholder="Stadt, Hotel, Region" />
            </div>
            <div className="flex flex-col min-w-[160px]">
              <label className="text-xs font-semibold mb-1">Anreise</label>
              <DatePicker
                label=""
                selectedDate={date1}
                onSelect={setDate1}
                placeholder="Datum wählen"
              />
            </div>
            <div className="flex flex-col min-w-[160px]">
              <label className="text-xs font-semibold mb-1">Abreise</label>
              <DatePicker
                label=""
                selectedDate={date2}
                onSelect={setDate2}
                placeholder="Datum wählen"
              />
            </div>
            <div className="flex flex-col min-w-[160px]">
              <PassengerSelector
                value={passengers}
                onChange={setPassengers}
              />
            </div>
          </>
        )
      case 'car':
        return (
          <>
            <div className="flex flex-col min-w-[200px]">
              <label className="text-xs font-semibold mb-1">Abholort</label>
              <Input placeholder="Stadt, Flughafen, Station" />
            </div>
            <div className="flex flex-col min-w-[160px]">
              <label className="text-xs font-semibold mb-1">Abholung</label>
              <DatePicker
                label=""
                selectedDate={date1}
                onSelect={setDate1}
                placeholder="Datum wählen"
              />
            </div>
            <div className="flex flex-col min-w-[160px]">
              <label className="text-xs font-semibold mb-1">Rückgabe</label>
              <DatePicker
                label=""
                selectedDate={date2}
                onSelect={setDate2}
                placeholder="Datum wählen"
              />
            </div>
            <div className="flex flex-col min-w-[120px]">
              <label className="text-xs font-semibold mb-1">Fahrer:in</label>
              <Input placeholder="Alter" type="number" min={18} />
            </div>
          </>
        )
      case 'ferry':
        return (
          <>
            <div className="flex flex-col min-w-[180px]">
              <label className="text-xs font-semibold mb-1">Von</label>
              <Input placeholder="Abfahrtshafen" />
            </div>
            <div className="flex flex-col min-w-[180px]">
              <label className="text-xs font-semibold mb-1">Nach</label>
              <Input placeholder="Zielhafen" />
            </div>
            <div className="flex flex-col min-w-[160px]">
              <label className="text-xs font-semibold mb-1">Abfahrt</label>
              <DatePicker
                label=""
                selectedDate={date1}
                onSelect={setDate1}
                placeholder="Datum wählen"
              />
            </div>
            <div className="flex flex-col min-w-[160px]">
              <PassengerSelector
                value={passengers}
                onChange={setPassengers}
              />
            </div>
          </>
        )
      case 'bus':
      case 'train':
        return (
          <>
            <div className="flex flex-col min-w-[180px]">
              <label className="text-xs font-semibold mb-1">Von</label>
              <Input placeholder="Abfahrtsort" />
            </div>
            <div className="flex flex-col min-w-[180px]">
              <label className="text-xs font-semibold mb-1">Nach</label>
              <Input placeholder="Zielort" />
            </div>
            <div className="flex flex-col min-w-[160px]">
              <label className="text-xs font-semibold mb-1">Abfahrt</label>
              <DatePicker
                label=""
                selectedDate={date1}
                onSelect={setDate1}
                placeholder="Datum wählen"
              />
            </div>
            <div className="flex flex-col min-w-[160px]">
              <label className="text-xs font-semibold mb-1">Rückfahrt</label>
              <DatePicker
                label=""
                selectedDate={date2}
                onSelect={setDate2}
                placeholder="Datum wählen"
              />
            </div>
            <div className="flex flex-col min-w-[160px]">
              <PassengerSelector
                value={passengers}
                onChange={setPassengers}
              />
            </div>
          </>
        )
      case 'cruise':
        return (
          <>
            <div className="flex flex-col min-w-[220px]">
              <label className="text-xs font-semibold mb-1">Route</label>
              <Input placeholder="Abfahrts-/Zielhafen, Region" />
            </div>
            <div className="flex flex-col min-w-[160px]">
              <label className="text-xs font-semibold mb-1">Abfahrt</label>
              <DatePicker
                label=""
                selectedDate={date1}
                onSelect={setDate1}
                placeholder="Datum wählen"
              />
            </div>
            <div className="flex flex-col min-w-[160px]">
              <PassengerSelector
                value={passengers}
                onChange={setPassengers}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold mb-1">Kabinentyp</label>
              <Select options={[
                { label: 'Innenkabine', value: 'innen' },
                { label: 'Aussenkabine', value: 'aussen' },
                { label: 'Balkonkabine', value: 'balkon' },
                { label: 'Suite', value: 'suite' },
              ]} />
            </div>
          </>
        )
      case 'combo':
        return (
          <div className="col-span-7 flex items-center justify-center py-10">
            <BadgePercent className="mr-2 text-primary" />
            <span className="font-medium text-lg">Kombireisen: Bald verfügbar. Noch flexibler reisen!</span>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-white/40 transition-all duration-300">
      {/* Tabs */}
      <div className="flex flex-wrap justify-center items-center gap-2 px-8 pt-8 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-base transition-all',
              activeTab === tab.value
                ? 'bg-primary text-white shadow-md'
                : 'bg-white/60 text-gray-800 hover:bg-primary/10'
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
      <form
        className="px-10 pt-4 pb-10 flex flex-col gap-5"
        autoComplete="off"
        style={{ minHeight: 200 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
          {renderFields()}
        </div>
        {activeTab !== 'combo' && (
          <div className="flex flex-row gap-4 justify-end mt-6">
            <Button size="lg" variant="primary" className="min-w-[160px] text-lg">
              Suchen
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
