'use client'

import { useState } from 'react'
import { Users, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TravelerPickerProps {
  value: {
    adults: number
    children: number
  }
  onChange: (val: { adults: number; children: number }) => void
  adultsLabel?: string
  childrenLabel?: string
  minAdults?: number
  maxAdults?: number
  minChildren?: number
  maxChildren?: number
  className?: string
}

export default function TravelerPicker({
  value,
  onChange,
  adultsLabel = 'Erwachsene',
  childrenLabel = 'Kinder',
  minAdults = 1,
  maxAdults = 8,
  minChildren = 0,
  maxChildren = 6,
  className,
}: TravelerPickerProps) {
  const [open, setOpen] = useState(false)

  const handleAdults = (step: number) => {
    const next = Math.max(minAdults, Math.min(maxAdults, value.adults + step))
    if (next !== value.adults) {
      onChange({ ...value, adults: next })
    }
  }

  const handleChildren = (step: number) => {
    const next = Math.max(minChildren, Math.min(maxChildren, value.children + step))
    if (next !== value.children) {
      onChange({ ...value, children: next })
    }
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center gap-2 border rounded-lg px-4 py-2 bg-white shadow-sm text-base font-medium',
          open && 'ring-2 ring-primary'
        )}
      >
        <Users className="w-5 h-5 text-muted-foreground" />
        <span>
          {value.adults} {adultsLabel}
          {value.children > 0 && `, ${value.children} ${childrenLabel}`}
        </span>
      </button>
      {open && (
        <div className="absolute z-30 mt-2 p-4 bg-white rounded-xl shadow-2xl w-64">
          <div className="flex justify-between items-center mb-2">
            <span>{adultsLabel}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdults(-1)}
                disabled={value.adults <= minAdults}
                className="w-8 h-8 rounded-full flex items-center justify-center border hover:bg-gray-100 disabled:opacity-40"
              >
                <Minus />
              </button>
              <span className="w-6 text-center">{value.adults}</span>
              <button
                type="button"
                onClick={() => handleAdults(1)}
                disabled={value.adults >= maxAdults}
                className="w-8 h-8 rounded-full flex items-center justify-center border hover:bg-gray-100 disabled:opacity-40"
              >
                <Plus />
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span>{childrenLabel}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleChildren(-1)}
                disabled={value.children <= minChildren}
                className="w-8 h-8 rounded-full flex items-center justify-center border hover:bg-gray-100 disabled:opacity-40"
              >
                <Minus />
              </button>
              <span className="w-6 text-center">{value.children}</span>
              <button
                type="button"
                onClick={() => handleChildren(1)}
                disabled={value.children >= maxChildren}
                className="w-8 h-8 rounded-full flex items-center justify-center border hover:bg-gray-100 disabled:opacity-40"
              >
                <Plus />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
