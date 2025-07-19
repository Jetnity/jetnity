'use client'

import { cn } from '@/lib/utils'
import { Repeat, CornerRightUp, Shuffle } from 'lucide-react'

export type TripType = 'oneway' | 'roundtrip' | 'multicity'

export interface TripTypeSelectorProps {
  value: TripType
  onChange: (type: TripType) => void
}

const TRIP_TYPES: { key: TripType; label: string; icon: React.ReactNode }[] = [
  { key: 'oneway', label: 'Oneway', icon: <CornerRightUp className="w-4 h-4 text-blue-600" /> },
  { key: 'roundtrip', label: 'Hin & Rück', icon: <Repeat className="w-4 h-4 text-blue-600" /> },
  { key: 'multicity', label: 'Multi-City', icon: <Shuffle className="w-4 h-4 text-blue-600" /> },
]

export function TripTypeSelector({ value, onChange }: TripTypeSelectorProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {TRIP_TYPES.map(t => (
        <button
          key={t.key}
          type="button"
          className={cn(
            'flex items-center gap-1 px-3 py-1 rounded-full transition-all font-medium text-xs border',
            value === t.key
              ? 'bg-blue-600 text-white border-blue-600 shadow'
              : 'bg-gray-100 text-gray-700 border-transparent hover:bg-blue-100'
          )}
          onClick={() => onChange(t.key)}
          aria-pressed={value === t.key}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  )
}
