'use client'

import { cn } from '@/lib/utils'
import { Briefcase, Gem, Crown, Star } from 'lucide-react'

export interface CabinClassSelectorProps {
  value: 'eco' | 'premium' | 'business' | 'first'
  onChange: (cabinClass: 'eco' | 'premium' | 'business' | 'first') => void
}

const CLASSES = [
  {
    key: 'eco',
    label: 'Economy',
    icon: <Briefcase className="w-4 h-4 text-blue-600" />,
  },
  {
    key: 'premium',
    label: 'Premium',
    icon: <Star className="w-4 h-4 text-blue-600" />,
  },
  {
    key: 'business',
    label: 'Business',
    icon: <Gem className="w-4 h-4 text-blue-600" />,
  },
  {
    key: 'first',
    label: 'First',
    icon: <Crown className="w-4 h-4 text-blue-600" />,
  },
] as const

export function CabinClassSelector({ value, onChange }: CabinClassSelectorProps) {
  return (
    <div className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 border shadow min-w-[120px] mt-3">
      {CLASSES.map(c => (
        <button
          key={c.key}
          type="button"
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded transition-all font-medium text-xs border',
            value === c.key
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-gray-100 text-gray-700 border-transparent hover:bg-blue-100'
          )}
          onClick={() => onChange(c.key)}
          aria-pressed={value === c.key}
        >
          {c.icon}
          {c.label}
        </button>
      ))}
    </div>
  )
}
