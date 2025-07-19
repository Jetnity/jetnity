'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Bus, MapPin, Users2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BusSearchForm() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState<Date | null>(null)
  const [passengers, setPassengers] = useState(1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Später: Bus-API, KI, etc.
    console.log({ from, to, date, passengers })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'w-full bg-white/90 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-end transition-all'
      )}
    >
      {/* Start */}
      <div className="flex flex-col min-w-[160px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-blue-600" /> Abfahrtsort
        </label>
        <Input
          type="text"
          placeholder="Stadt, Haltestelle"
          value={from}
          onChange={e => setFrom(e.target.value)}
          autoComplete="off"
        />
      </div>
      {/* Ziel */}
      <div className="flex flex-col min-w-[160px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-green-600" /> Ziel
        </label>
        <Input
          type="text"
          placeholder="Stadt, Haltestelle"
          value={to}
          onChange={e => setTo(e.target.value)}
          autoComplete="off"
        />
      </div>
      {/* Datum */}
      <div className="flex flex-col min-w-[160px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <Calendar className="w-4 h-4 text-blue-600" /> Datum
        </label>
        <DatePicker
          label=""
          selectedDate={date}
          onSelect={setDate}
          minDate={new Date()}
        />
      </div>
      {/* Passagiere */}
      <div className="flex flex-col min-w-[120px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <Users2 className="w-4 h-4 text-blue-600" /> Passagiere
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
        Busverbindung suchen
      </Button>
    </form>
  )
}
