'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import type { SearchMode } from './HeroSearchTabs'

interface HeroSearchFormProps {
  searchMode: SearchMode
}

export default function HeroSearchForm({ searchMode }: HeroSearchFormProps) {
  const [destination, setDestination] = useState('')
  const [checkIn, setCheckIn] = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Hier kannst du abhängig vom searchMode gezielt andere Logik einbauen
    console.log({ searchMode, destination, checkIn, checkOut })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-white/80 backdrop-blur-lg p-6 rounded-xl shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
    >
      {/* Reiseziel / Abfahrtshafen */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-muted-foreground mb-1">
          {searchMode === 'cruise' ? 'Abfahrtshafen' : 'Reiseziel'}
        </label>
        <Input
          type="text"
          placeholder={
            searchMode === 'cruise'
              ? 'z. B. Hamburg, Genua, Miami'
              : 'z. B. Bali, Paris, Kapstadt'
          }
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
      </div>

      {/* Anreise / Abfahrt */}
      <DatePicker
        label={searchMode === 'cruise' ? 'Abfahrt' : 'Anreise'}
        selectedDate={checkIn}
        onSelect={setCheckIn}
        placeholder="Datum wählen"
      />

      {/* Abreise / Rückkehr */}
      <DatePicker
        label={searchMode === 'cruise' ? 'Rückkehr' : 'Abreise'}
        selectedDate={checkOut}
        onSelect={setCheckOut}
        placeholder="Datum wählen"
      />

      {/* Suche */}
      <Button
        type="submit"
        className="w-full h-[42px] md:h-[44px] text-base font-semibold"
        variant="primary"
      >
        Suchen
      </Button>
    </form>
  )
}

