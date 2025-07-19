'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import HeroSearchTabs, { SearchMode } from './HeroSearchTabs'
import HeroSearchForm from './HeroSearchForm'

export default function HeroSearchWrapper() {
  // Gemeinsamer State für den aktiven Suchmodus (Tabs + Formular)
  const [searchMode, setSearchMode] = useState<SearchMode>('flight')

  return (
    <div className="relative z-10 flex flex-col items-center w-full px-4">
      <div
        className={cn(
          'w-full max-w-5xl bg-white/90 backdrop-blur-md shadow-xl rounded-2xl',
          'flex flex-col md:flex-row items-center md:items-end gap-4 p-6 md:p-8 transition-all duration-300'
        )}
      >
        <div className="w-full md:w-auto">
          <HeroSearchTabs selected={searchMode} onSelect={setSearchMode} />
        </div>
        <div className="flex-1 w-full">
          <HeroSearchForm searchMode={searchMode} />
        </div>
      </div>
    </div>
  )
}
