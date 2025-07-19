'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateRangePicker } from './DateRangePicker'
import { Car, MapPin, Users2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CarSearchForm() {
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [dates, setDates] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  })
  const [drivers, setDrivers] = useState(1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Später: Mietwagen-API, KI-Auswertung, etc.
    console.log({ pickup, dropoff, dates, drivers })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'w-full bg-white/90 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-end transition-all'
      )}
    >
      {/* Abholung */}
      <div className="flex flex-col min-w-[180px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-blue-600" /> Abholort
        </label>
        <Input
          type="text"
          placeholder="Stadt, Flughafen, Bahnhof ..."
          value={pickup}
          onChange={e => setPickup(e.target.value)}
          autoComplete="off"
        />
      </div>
      {/* Rückgabe */}
      <div className="flex flex-col min-w-[180px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-green-600" /> Rückgabeort
        </label>
        <Input
          type="text"
          placeholder="Stadt, Flughafen, Bahnhof ..."
          value={dropoff}
          onChange={e => setDropoff(e.target.value)}
          autoComplete="off"
        />
      </div>
      {/* Daten */}
      <div className="flex flex-col min-w-[180px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <Car className="w-4 h-4 text-blue-600" /> Mietdauer
        </label>
        <DateRangePicker
          startDate={dates.start}
          endDate={dates.end}
          onChange={(start, end) => setDates({ start, end })}
        />
      </div>
      {/* Fahrer */}
      <div className="flex flex-col min-w-[140px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <Users2 className="w-4 h-4 text-blue-600" /> Fahrer
        </label>
        <Input
          type="number"
          min={1}
          max={5}
          value={drivers}
          onChange={e => setDrivers(Number(e.target.value))}
        />
      </div>
      {/* Suchen */}
      <Button type="submit" size="lg" variant="primary" className="min-w-[120px]">
        Mietwagen finden
      </Button>
    </form>
  )
}
