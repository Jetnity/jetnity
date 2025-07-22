'use client'

import React from 'react'
import { CornerRightUp, Repeat, Shuffle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TripType = 'oneway' | 'roundtrip' | 'multicity'

export interface TripTypeSelectorProps {
  value: TripType
  onChange: (type: TripType) => void
}

const TRIP_TYPES: { key: TripType; label: string; icon: React.ReactNode }[] = [
  { key: 'roundtrip', label: 'Hin- und Rückflug', icon: <Repeat className="w-4 h-4 text-blue-600" /> },
  { key: 'oneway', label: 'Nur Hinflug', icon: <CornerRightUp className="w-4 h-4 text-blue-600" /> },
  { key: 'multicity', label: 'Gabelflug', icon: <Shuffle className="w-4 h-4 text-blue-600" /> },
]

export function TripTypeSelector({ value, onChange }: TripTypeSelectorProps) {
  const [dropdown, setDropdown] = React.useState(false)
  const selected = TRIP_TYPES.find(t => t.key === value)!

  // Medienabfrage für Breakpoint (Tailwind md: 768px)
  const [isMobile, setIsMobile] = React.useState(false)
  React.useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 768)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // --- Desktop: Button-Switch ---
  if (!isMobile) {
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

  // --- Mobile: Dropdown ---
  return (
    <div className="relative mb-3 w-full">
      <button
        type="button"
        className="flex items-center justify-between w-full px-4 py-2 rounded-xl font-semibold text-base bg-white text-[#1a2640] shadow border border-white/30 hover:bg-blue-50 transition"
        onClick={() => setDropdown(d => !d)}
        aria-haspopup="listbox"
        aria-expanded={dropdown}
      >
        <span className="flex items-center gap-2">
          {selected.icon}
          {selected.label}
        </span>
        <ChevronDown className="ml-2 w-4 h-4 opacity-60" />
      </button>
      {dropdown && (
        <ul
          className="absolute left-0 z-30 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100"
          role="listbox"
        >
          {TRIP_TYPES.map((t) => (
            <li
              key={t.key}
              className={cn(
                "flex items-center px-4 py-2 cursor-pointer rounded-xl",
                value === t.key
                  ? "bg-blue-100 font-bold text-blue-900"
                  : "hover:bg-blue-50"
              )}
              role="option"
              aria-selected={value === t.key}
              tabIndex={0}
              onClick={() => { onChange(t.key); setDropdown(false) }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  onChange(t.key)
                  setDropdown(false)
                }
              }}
            >
              {t.icon}
              {t.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
