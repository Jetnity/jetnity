'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Plus, MapPin, Users2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

type Leg = {
  from: string
  to: string
  date: Date | null
}

export default function ComboSearchForm() {
  const [legs, setLegs] = useState<Leg[]>([
    { from: '', to: '', date: null },
    { from: '', to: '', date: null }
  ])
  const [travelers, setTravelers] = useState(1)

  const handleLegChange = (index: number, field: keyof Leg, value: string | Date | null) => {
    const updated = legs.map((leg, i) =>
      i === index ? { ...leg, [field]: value } : leg
    )
    setLegs(updated)
  }

  const addLeg = () => {
    setLegs([...legs, { from: '', to: '', date: null }])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Später: KI-gestützte Routing-Logik
    console.log({ legs, travelers })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'w-full bg-white/90 p-6 rounded-2xl shadow-xl flex flex-col gap-4 transition-all'
      )}
    >
      <div className="flex flex-col gap-4">
        {legs.map((leg, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
            {/* Von */}
            <div className="flex flex-col min-w-[150px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-blue-600" /> Von
              </label>
              <Input
                type="text"
                placeholder="Start"
                value={leg.from}
                onChange={e => handleLegChange(idx, 'from', e.target.value)}
                autoComplete="off"
              />
            </div>
            {/* Nach */}
            <div className="flex flex-col min-w-[150px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-green-600" /> Nach
              </label>
              <Input
                type="text"
                placeholder="Ziel"
                value={leg.to}
                onChange={e => handleLegChange(idx, 'to', e.target.value)}
                autoComplete="off"
              />
            </div>
            {/* Datum */}
            <div className="flex flex-col min-w-[150px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-blue-600" /> Datum
              </label>
              <DatePicker
                label=""
                selectedDate={leg.date}
                onSelect={date => handleLegChange(idx, 'date', date)}
                minDate={new Date()}
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 flex items-center gap-2 self-start"
          onClick={addLeg}
        >
          <Plus className="w-4 h-4" /> Weitere Etappe hinzufügen
        </Button>
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
        Kombireise suchen
      </Button>
    </form>
  )
}
