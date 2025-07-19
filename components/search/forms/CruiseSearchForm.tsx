'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateRangePicker } from './DateRangePicker'
import { Ship, MapPin, Users2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CruiseSearchForm() {
  const [departurePort, setDeparturePort] = useState('')
  const [destination, setDestination] = useState('')
  const [dates, setDates] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  })
  const [passengers, setPassengers] = useState(2)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Später: API-Call, KI, etc.
    console.log({ departurePort, destination, dates, passengers })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'w-full bg-white/90 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-end transition-all'
      )}
    >
      {/* Abfahrtshafen */}
      <div className="flex flex-col min-w-[160px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-blue-600" /> Abfahrtshafen
        </label>
        <Input
          type="text"
          placeholder="z. B. Hamburg, Genua, Miami"
          value={departurePort}
          onChange={e => setDeparturePort(e.target.value)}
          autoComplete="off"
        />
      </div>
      {/* Zielgebiet */}
      <div className="flex flex-col min-w-[160px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-green-600" /> Zielgebiet
        </label>
        <Input
          type="text"
          placeholder="z. B. Karibik, Mittelmeer, Nordsee"
          value={destination}
          onChange={e => setDestination(e.target.value)}
          autoComplete="off"
        />
      </div>
      {/* Zeitraum */}
      <div className="flex flex-col min-w-[180px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <Calendar className="w-4 h-4 text-blue-600" /> Zeitraum
        </label>
        <DateRangePicker
          startDate={dates.start}
          endDate={dates.end}
          onChange={(start, end) => setDates({ start, end })}
        />
      </div>
      {/* Reisende */}
      <div className="flex flex-col min-w-[120px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <Users2 className="w-4 h-4 text-blue-600" /> Reisende
        </label>
        <Input
          type="number"
          min={1}
          max={12}
          value={passengers}
          onChange={e => setPassengers(Number(e.target.value))}
        />
      </div>
      {/* Suchen */}
      <Button type="submit" size="lg" variant="primary" className="min-w-[120px]">
        Kreuzfahrten finden
      </Button>
    </form>
  )
}
