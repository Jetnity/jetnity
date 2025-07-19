'use client'

import { useState } from 'react'
import { Users2, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PassengerCounts {
  adults: number
  children: number
  infants: number
}

export interface PassengerSelectorProps {
  value: PassengerCounts
  onChange: (counts: PassengerCounts) => void
  minAdults?: number
  maxPassengers?: number
}

export function PassengerSelector({
  value,
  onChange,
  minAdults = 1,
  maxPassengers = 9,
}: PassengerSelectorProps) {
  const { adults, children, infants } = value

  function set(type: keyof PassengerCounts, delta: number) {
    const newCounts = { ...value, [type]: Math.max(0, value[type] + delta) }
    if (type === 'adults' && newCounts.adults < minAdults) newCounts.adults = minAdults
    const sum = newCounts.adults + newCounts.children + newCounts.infants
    if (sum <= maxPassengers) {
      onChange(newCounts)
    }
  }

  return (
    <div className={cn('flex flex-col gap-2 min-w-[140px] bg-white/70 rounded-xl p-3 shadow border')}>
      <div className="flex items-center mb-2 gap-2 text-xs font-semibold text-gray-700">
        <Users2 className="w-4 h-4 text-blue-600" />
        Reisende
      </div>
      <div className="flex flex-col gap-2">
        {/* Erwachsene */}
        <div className="flex items-center justify-between">
          <span>Erwachsene</span>
          <div className="flex items-center gap-1">
            <button type="button" className="p-1 rounded bg-gray-100" disabled={adults <= minAdults} onClick={() => set('adults', -1)}><Minus className="w-4 h-4" /></button>
            <span className="w-5 text-center">{adults}</span>
            <button type="button" className="p-1 rounded bg-gray-100" disabled={adults + children + infants >= maxPassengers} onClick={() => set('adults', 1)}><Plus className="w-4 h-4" /></button>
          </div>
        </div>
        {/* Kinder */}
        <div className="flex items-center justify-between">
          <span>Kinder</span>
          <div className="flex items-center gap-1">
            <button type="button" className="p-1 rounded bg-gray-100" disabled={children <= 0} onClick={() => set('children', -1)}><Minus className="w-4 h-4" /></button>
            <span className="w-5 text-center">{children}</span>
            <button type="button" className="p-1 rounded bg-gray-100" disabled={adults + children + infants >= maxPassengers} onClick={() => set('children', 1)}><Plus className="w-4 h-4" /></button>
          </div>
        </div>
        {/* Babys */}
        <div className="flex items-center justify-between">
          <span>Babys</span>
          <div className="flex items-center gap-1">
            <button type="button" className="p-1 rounded bg-gray-100" disabled={infants <= 0} onClick={() => set('infants', -1)}><Minus className="w-4 h-4" /></button>
            <span className="w-5 text-center">{infants}</span>
            <button type="button" className="p-1 rounded bg-gray-100" disabled={adults + children + infants >= maxPassengers} onClick={() => set('infants', 1)}><Plus className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground mt-2">Maximal {maxPassengers} Personen</div>
    </div>
  )
}