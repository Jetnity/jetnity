'use client'

import { useState } from 'react'
import HeroSearchTabs, { SearchMode } from './HeroSearchTabs'
import HeroSearchForm from './HeroSearchForm'

export default function HeroSearch() {
  // Gemeinsamer State für den aktiven Suchmodus (Tabs + Formular)
  const [searchMode, setSearchMode] = useState<SearchMode>('flight')

  return (
    <div className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-2xl rounded-2xl p-6 sm:p-8 md:p-10 space-y-6">
        <HeroSearchTabs selected={searchMode} onSelect={setSearchMode} />
        <HeroSearchForm searchMode={searchMode} />
      </div>
    </div>
  )
}
