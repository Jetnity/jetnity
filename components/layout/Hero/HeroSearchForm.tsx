// components/layout/Hero/HeroSearchForm.tsx
'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import type { HeroMegaSearchProps, TabType } from '@/components/search/HeroMegaSearch'

/**
 * Rückwärtskompatibler Typ (falls irgendwo importiert).
 * Die neue MegaSearch steuert die eigentliche Logik – dieses Wrapper bleibt schlank.
 */
export type SearchMode =
  | 'flight'
  | 'hotel'
  | 'car'
  | 'ferry'
  | 'bus'
  | 'train'
  | 'cruise'
  | 'combo'
  | 'activity'
  | 'transfer'

interface HeroSearchFormProps {
  /** Optional: alter Prop-Name, wird intern auf MegaSearch.initialTab gemappt */
  searchMode?: SearchMode
}

/** Legacy → neues Tab-Mapping */
function mapLegacyToTab(mode?: SearchMode): TabType {
  switch (mode) {
    case 'flight':
    case 'hotel':
    case 'car':
    case 'ferry':
    case 'bus':
    case 'train':
    case 'cruise':
    case 'combo':
    case 'activity':
    case 'transfer':
      return mode
    default:
      return 'flight'
  }
}

/** Wichtig: korrekt getypter dynamic()-Import, damit keine TS-Fehler auftreten */
const HeroMegaSearch = dynamic<HeroMegaSearchProps>(
  () =>
    import('@/components/search/HeroMegaSearch').then((m) => 
      m.default as React.ComponentType<HeroMegaSearchProps>
    ),
  {
    ssr: false,
    loading: () => (
      <div
        aria-busy="true"
        aria-live="polite"
        className="mx-auto w-full max-w-6xl rounded-3xl border border-white/10 bg-[#0c1930] p-6 text-white/80 shadow-2xl ring-1 ring-black/5"
      >
        <div className="h-8 w-40 animate-pulse rounded-full bg-white/10" />
        <div className="mt-4 h-24 animate-pulse rounded-2xl bg-white/10" />
      </div>
    ),
  }
)

export default function HeroSearchForm({ searchMode }: HeroSearchFormProps) {
  const initialTab = React.useMemo(() => mapLegacyToTab(searchMode), [searchMode])
  return <HeroMegaSearch initialTab={initialTab} />
}
