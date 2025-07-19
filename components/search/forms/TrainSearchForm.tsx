'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { TrainFront, MapPin, Users2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TrainSearchForm() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState<Date | null>(null)
  const [passengers, setPassengers] = useState(1)
  const [bahncard, setBahncard] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Später: API-Call, KI, etc.
    console.log({ from, to, date, passengers, bahncard })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'w-full bg-white/90 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-end transition-all'
      )}
    >
      {/* Startbahnhof */}
      <div className="flex flex-col min-w-[160px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-blue-600" /> Startbahnhof
        </label>
        <Input
          type="text"
          placeholder="Bahnhof, Stadt"
          value={from}
          onChange={e => setFrom(e.target.value)}
          autoComplete="off"
        />
      </div>
      {/* Zielbahnhof */}
      <div className="flex flex-col min-w-[160px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-green-600" /> Zielbahnhof
        </label>
        <Input
          type="text"
          placeholder="Bahnhof, Stadt"
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
      {/* BahnCard Option */}
      <div className="flex items-center mt-5 mb-1 ml-1">
        <input
          id="bahncard"
          type="checkbox"
          className="mr-1"
          checked={bahncard}
          onChange={e => setBahncard(e.target.checked)}
        />
        <label htmlFor="bahncard" className="text-xs text-muted-foreground">
          BahnCard nutzen
        </label>
      </div>
      {/* Suchen */}
      <Button type="submit" size="lg" variant="primary" className="min-w-[120px]">
        Zugverbindung suchen
      </Button>
    </form>
  )
}
