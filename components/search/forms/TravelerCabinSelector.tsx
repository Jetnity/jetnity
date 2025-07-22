'use client'

import * as React from 'react'
import { X, Minus, Plus, Briefcase, Gem, Crown, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const CLASSES = [
  { key: 'eco', label: 'Economy', icon: <Briefcase className="w-4 h-4 text-blue-600" /> },
  { key: 'premium', label: 'Premium', icon: <Star className="w-4 h-4 text-blue-600" /> },
  { key: 'business', label: 'Business', icon: <Gem className="w-4 h-4 text-blue-600" /> },
  { key: 'first', label: 'First', icon: <Crown className="w-4 h-4 text-blue-600" /> },
] as const

export interface TravelerCabinSelectorProps {
  open: boolean
  onClose: () => void
  value: { adults: number; children: number; infants: number }
  onChange: (counts: { adults: number; children: number; infants: number }) => void
  cabinClass: 'eco' | 'premium' | 'business' | 'first'
  onCabinChange: (cabin: 'eco' | 'premium' | 'business' | 'first') => void
}

export default function TravelerCabinSelector({
  open, onClose, value, onChange, cabinClass, onCabinChange,
}: TravelerCabinSelectorProps) {
  if (!open) return null
  const { adults, children, infants } = value

  function set(type: keyof typeof value, delta: number) {
    const newCounts = { ...value, [type]: Math.max(0, value[type] + delta) }
    if (type === 'adults' && newCounts.adults < 1) newCounts.adults = 1
    const sum = newCounts.adults + newCounts.children + newCounts.infants
    if (sum <= 9) {
      onChange(newCounts)
    }
  }

  return (
    <div className="jetnity-popup-backdrop" tabIndex={-1} onClick={onClose}>
      <div
        className="jetnity-popup-card"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center mb-3">
          <div className="font-semibold text-lg">Reisende & Kabinenklasse</div>
          <button type="button" onClick={onClose} className="p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3 mb-5">
          {/* Travelers */}
          <div className="flex items-center justify-between">
            <span>Erwachsene</span>
            <div className="flex items-center gap-1">
              <button type="button" className="p-1 rounded bg-gray-100" disabled={adults <= 1} onClick={() => set('adults', -1)}><Minus className="w-4 h-4" /></button>
              <span className="w-5 text-center">{adults}</span>
              <button type="button" className="p-1 rounded bg-gray-100" disabled={adults + children + infants >= 9} onClick={() => set('adults', 1)}><Plus className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Kinder</span>
            <div className="flex items-center gap-1">
              <button type="button" className="p-1 rounded bg-gray-100" disabled={children <= 0} onClick={() => set('children', -1)}><Minus className="w-4 h-4" /></button>
              <span className="w-5 text-center">{children}</span>
              <button type="button" className="p-1 rounded bg-gray-100" disabled={adults + children + infants >= 9} onClick={() => set('children', 1)}><Plus className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Babys</span>
            <div className="flex items-center gap-1">
              <button type="button" className="p-1 rounded bg-gray-100" disabled={infants <= 0} onClick={() => set('infants', -1)}><Minus className="w-4 h-4" /></button>
              <span className="w-5 text-center">{infants}</span>
              <button type="button" className="p-1 rounded bg-gray-100" disabled={adults + children + infants >= 9} onClick={() => set('infants', 1)}><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
        {/* Cabin Selector */}
        <div className="mb-4">
          <div className="font-semibold text-sm mb-2">Kabinenklasse</div>
          <div className="flex gap-2 flex-wrap">
            {CLASSES.map(c => (
              <button
                key={c.key}
                type="button"
                className={cn(
                  'flex items-center gap-1 px-3 py-2 rounded-xl border font-medium text-sm',
                  cabinClass === c.key
                    ? 'bg-blue-600 text-white border-blue-600 shadow'
                    : 'bg-gray-100 text-gray-700 border-transparent hover:bg-blue-100'
                )}
                onClick={() => onCabinChange(c.key as any)}
                aria-pressed={cabinClass === c.key}
              >
                {c.icon}
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 font-semibold text-base transition"
          onClick={onClose}
        >
          Übernehmen
        </button>
      </div>
    </div>
  )
}
