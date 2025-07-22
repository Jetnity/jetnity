'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { PassengerSelector } from '@/components/search/forms/PassengerSelector'
import { CabinClassSelector } from '@/components/search/forms/CabinClassSelector'
import { TripTypeSelector } from '@/components/search/forms/TripTypeSelector'
import { Repeat, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FlightSearchFormProps {
  onSubmit?: (params: any) => void
}

export default function FlightSearchForm({ onSubmit }: FlightSearchFormProps) {
  // State
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [departureDate, setDepartureDate] = useState<Date | null>(null)
  const [returnDate, setReturnDate] = useState<Date | null>(null)
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip' | 'multicity'>('roundtrip')
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 })
  const [cabinClass, setCabinClass] = useState<'eco' | 'premium' | 'business' | 'first'>('eco')
  const [directOnly, setDirectOnly] = useState(false)
  const [flexible, setFlexible] = useState(false)
  const [multiCityStops, setMultiCityStops] = useState([
    { from: '', to: '', date: null as Date | null },
    { from: '', to: '', date: null as Date | null }
  ])

  const handleSwap = () => {
    setOrigin(destination)
    setDestination(origin)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit({
        origin,
        destination,
        departureDate,
        returnDate: tripType === 'roundtrip' ? returnDate : null,
        tripType,
        passengers,
        cabinClass,
        directOnly,
        flexible,
        multiCityStops: tripType === 'multicity' ? multiCityStops : undefined,
      })
    }
  }

  // Gabelflug Handler
  const handleMultiCityChange = (i: number, field: 'from' | 'to' | 'date', value: any) => {
    setMultiCityStops(stops => {
      const next = [...stops]
      next[i][field] = value
      return next
    })
  }

  const addMultiCity = () => {
    setMultiCityStops(stops => [...stops, { from: '', to: '', date: null }])
  }

  const removeMultiCity = (index: number) => {
    setMultiCityStops(stops => stops.length > 2 ? stops.filter((_, i) => i !== index) : stops)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'w-full bg-white/90 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-end transition-all'
      )}
    >
      {/* Trip Type (OneWay, RoundTrip, MultiCity) */}
      <TripTypeSelector value={tripType} onChange={setTripType} />

      {/* Oneway & Roundtrip Felder */}
      {(tripType === 'oneway' || tripType === 'roundtrip') && (
        <>
          {/* Origin */}
          <div className="flex flex-col min-w-[160px]">
            <label className="text-xs font-medium text-muted-foreground mb-1">Von</label>
            <Input
              type="text"
              placeholder="Abflughafen oder Stadt"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              autoComplete="off"
            />
          </div>
          {/* Swap Icon */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-6 mx-1"
            aria-label="Ziel/Start tauschen"
            onClick={handleSwap}
          >
            <Repeat className="w-6 h-6" />
          </Button>
          {/* Destination */}
          <div className="flex flex-col min-w-[160px]">
            <label className="text-xs font-medium text-muted-foreground mb-1">Nach</label>
            <Input
              type="text"
              placeholder="Zielflughafen oder Stadt"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              autoComplete="off"
            />
          </div>
          {/* Dates */}
          <div className="flex flex-col min-w-[140px]">
            <label className="text-xs font-medium text-muted-foreground mb-1">Abflug</label>
            <DatePicker
              label="Abflug"
              selectedDate={departureDate}
              onSelect={setDepartureDate}
              minDate={new Date()}
            />
          </div>
          {tripType === 'roundtrip' && (
            <div className="flex flex-col min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground mb-1">Rückflug</label>
              <DatePicker
                label="Rückflug"
                selectedDate={returnDate}
                onSelect={setReturnDate}
                minDate={departureDate || new Date()}
              />
            </div>
          )}
        </>
      )}

      {/* Multi-City (Gabelflug) Felder */}
      {tripType === 'multicity' && (
        <div className="flex flex-col gap-2 flex-1">
          {multiCityStops.map((stop, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex flex-col min-w-[150px]">
                <label className="text-xs font-medium text-muted-foreground mb-1">Von</label>
                <Input
                  type="text"
                  placeholder="Abflughafen"
                  value={stop.from}
                  onChange={e => handleMultiCityChange(i, 'from', e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col min-w-[150px]">
                <label className="text-xs font-medium text-muted-foreground mb-1">Nach</label>
                <Input
                  type="text"
                  placeholder="Zielflughafen"
                  value={stop.to}
                  onChange={e => handleMultiCityChange(i, 'to', e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col min-w-[130px]">
                <label className="text-xs font-medium text-muted-foreground mb-1">Abflug</label>
                <DatePicker
                  label="Abflug"
                  selectedDate={stop.date}
                  onSelect={date => handleMultiCityChange(i, 'date', date)}
                  minDate={new Date()}
                />
              </div>
              {multiCityStops.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mb-4"
                  title="Segment entfernen"
                  onClick={() => removeMultiCity(i)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start mt-2"
            onClick={addMultiCity}
          >
            <Plus className="w-4 h-4 mr-1" />
            Weiteren Flug hinzufügen
          </Button>
        </div>
      )}

      {/* Passenger Selector */}
      <div className="flex flex-col min-w-[130px]">
        <PassengerSelector value={passengers} onChange={setPassengers} />
      </div>

      {/* Cabin Class Selector */}
      <div className="flex flex-col min-w-[130px]">
        <CabinClassSelector value={cabinClass} onChange={setCabinClass} />
      </div>

      {/* Direct flights only */}
      <div className="flex items-center mt-5 mb-1 ml-1">
        <input
          id="directOnly"
          type="checkbox"
          className="mr-1"
          checked={directOnly}
          onChange={(e) => setDirectOnly(e.target.checked)}
        />
        <label htmlFor="directOnly" className="text-xs text-muted-foreground">
          Nur Direktflüge
        </label>
      </div>

      {/* Flexible Dates */}
      <div className="flex items-center mt-5 mb-1 ml-1">
        <input
          id="flexible"
          type="checkbox"
          className="mr-1"
          checked={flexible}
          onChange={(e) => setFlexible(e.target.checked)}
        />
        <label htmlFor="flexible" className="text-xs text-muted-foreground">
          +/-3 Tage flexibel
        </label>
      </div>

      {/* Suchen Button */}
      <Button type="submit" size="lg" variant="primary" className="min-w-[120px]">
        Suchen
      </Button>
    </form>
  )
}
