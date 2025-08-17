// components/layout/Hero/HeroSearchForm.tsx
'use client'

import dynamic from 'next/dynamic'

/**
 * Rückwärtskompatibler Typ (falls irgendwo importiert).
 * Hat keinen Einfluss mehr auf die Logik – die MegaSearch steuert alles.
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

interface HeroSearchFormProps {
  // optional für Backwards-Compatibility, wird intern nicht mehr benötigt
  searchMode?: SearchMode
}

const HeroMegaSearch = dynamic(() => import('@/components/search/HeroMegaSearch'), {
  ssr: false,
  loading: () => (
    <div className="mx-auto w-full max-w-6xl rounded-3xl border border-white/10 bg-[#0c1930] p-6 text-white/80 shadow-2xl ring-1 ring-black/5">
      <div className="h-8 w-40 animate-pulse rounded-full bg-white/10" />
      <div className="mt-4 h-24 animate-pulse rounded-2xl bg-white/10" />
    </div>
  ),
})

export default function HeroSearchForm(_props: HeroSearchFormProps) {
  return <HeroMegaSearch />
}
