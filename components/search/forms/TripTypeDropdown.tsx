'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ArrowRight, Repeat, Shuffle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TripType = 'oneway' | 'roundtrip' | 'multicity'

const OPTIONS: { key: TripType; label: string; icon: React.ReactNode }[] = [
  { key: 'oneway', label: 'Nur Hinflug', icon: <ArrowRight className="w-4 h-4" /> },
  { key: 'roundtrip', label: 'Hin- und Rückflug', icon: <Repeat className="w-4 h-4" /> },
  { key: 'multicity', label: 'Gabelflug', icon: <Shuffle className="w-4 h-4" /> },
]

export default function TripTypeDropdown({
  value,
  onChange,
}: {
  value: TripType
  onChange: (t: TripType) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = OPTIONS.find(o => o.key === value)!

  return (
    <div ref={ref} className="relative z-30">
      <button
        type="button"
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#19233b] text-white border border-white/20 font-semibold text-base shadow-sm hover:bg-[#222c49] transition-all min-w-[180px]"
        onClick={() => setOpen(v => !v)}
      >
        {selected.icon}
        {selected.label}
        <ChevronDown className="w-4 h-4 ml-1 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-[240px] bg-[#202b45] border border-white/10 rounded-xl shadow-xl py-2">
          {OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              className={cn(
                'flex items-center gap-2 w-full px-4 py-2 text-left text-white font-medium text-base hover:bg-[#23315a] transition',
                value === opt.key && 'bg-[#23315a]'
              )}
              onClick={() => { onChange(opt.key); setOpen(false) }}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
