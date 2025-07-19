'use client'

import { cn } from '@/lib/utils'
import { PlaneTakeoff, Hotel, Car, Activity } from 'lucide-react'
import { CruiseShipIcon } from '@/components/ui/icons/CruiseShip'

// Definiere alle erlaubten Such-Modi (Tabs) – inkl. Kreuzfahrten
export type SearchMode = 'flight' | 'hotel' | 'car' | 'activity' | 'cruise'

const tabs: {
  label: string
  value: SearchMode
  icon: React.ComponentType<{ size?: number; className?: string }>
}[] = [
  { label: 'Flüge', value: 'flight', icon: PlaneTakeoff },
  { label: 'Hotels', value: 'hotel', icon: Hotel },
  { label: 'Mietwagen', value: 'car', icon: Car },
  { label: 'Aktivitäten', value: 'activity', icon: Activity },
  { label: 'Kreuzfahrten', value: 'cruise', icon: CruiseShipIcon },
]

interface HeroSearchTabsProps {
  selected: SearchMode
  onSelect: (value: SearchMode) => void
}

export default function HeroSearchTabs({ selected, onSelect }: HeroSearchTabsProps) {
  return (
    <div className="flex flex-wrap md:flex-nowrap justify-center gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = selected === tab.value

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onSelect(tab.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500'} />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
