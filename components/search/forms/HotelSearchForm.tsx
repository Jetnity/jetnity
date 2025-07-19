'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateRangePicker } from './DateRangePicker'
import { DatePicker } from '@/components/ui/date-picker'
import { BedDouble, MapPin, Users2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import TravelerPicker from '@/components/ui/TravelerPicker'

export default function HotelSearchForm() {
  const [destination, setDestination] = useState('')
  const [dates, setDates] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  })
  const [travelers, setTravelers] = useState({ adults: 2, children: 0 })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Später: Suche/Weiterleitung/Analytics
    console.log({ destination, dates, travelers })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'w-full bg-white/90 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-end transition-all'
      )}
    >
      {/* Ziel */}
      <div className="flex flex-col min-w-[180px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-blue-600" /> Ziel / Unterkunft
        </label>
        <Input
          type="text"
          placeholder="Hotel, Stadt, Region ..."
          value={destination}
          onChange={e => setDestination(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Daten */}
      <div className="flex flex-col min-w-[180px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <BedDouble className="w-4 h-4 text-blue-600" /> Reisedaten
        </label>
        <DateRangePicker
          startDate={dates.start}
          endDate={dates.end}
          onChange={(start, end) => setDates({ start, end })}
        />
      </div>

      {/* Reisende */}
      <div className="flex flex-col min-w-[160px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <Users2 className="w-4 h-4 text-blue-600" /> Reisende
        </label>
        <TravelerPicker
          value={travelers}
          onChange={setTravelers}
          adultsLabel="Erwachsene"
          childrenLabel="Kinder"
        />
      </div>

      {/* Suchen */}
      <Button type="submit" size="lg" variant="primary" className="min-w-[120px]">
        Hotels finden
      </Button>
    </form>
  )
}
