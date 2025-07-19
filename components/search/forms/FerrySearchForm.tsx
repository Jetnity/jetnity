'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Ship, MapPin, Users2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function FerrySearchForm() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState<Date | null>(null)
  const [travelers, setTravelers] = useState(2)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Später: Fähr-API, KI-Vorschläge, etc.
    console.log({ from, to, date, travelers })
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
          placeholder="z. B. Genua, Kiel, Amsterdam"
          value={from}
          onChange={e => setFrom(e.target.value)}
          autoComplete="off"
        />
      </div>
      {/* Zielhafen */}
      <div className="flex flex-col min-w-[160px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-green-600" /> Zielhafen
        </label>
        <Input
          type="text"
          placeholder="z. B. Palermo, Göteborg, Dover"
          value={to}
          onChange={e => setTo(e.target.value)}
          autoComplete="off"
        />
      </div>
      {/* Datum */}
      <div className="flex flex-col min-w-[160px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <Calendar className="w-4 h-4 text-blue-600" /> Abfahrt
        </label>
        <DatePicker
          label=""
          selectedDate={date}
          onSelect={setDate}
          minDate={new Date()}
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
          value={travelers}
          onChange={e => setTravelers(Number(e.target.value))}
        />
      </div>
      {/* Suchen */}
      <Button type="submit" size="lg" variant="primary" className="min-w-[120px]">
        Fähre finden
      </Button>
    </form>
  )
}
