'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { X, Minus, Plus, Briefcase, Gem, Crown, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const CLASSES = [
  { key: 'eco',     label: 'Economy',  icon: <Briefcase className="w-4 h-4 text-blue-600" /> },
  { key: 'premium', label: 'Premium',  icon: <Star      className="w-4 h-4 text-blue-600" /> },
  { key: 'business',label: 'Business', icon: <Gem       className="w-4 h-4 text-blue-600" /> },
  { key: 'first',   label: 'First',    icon: <Crown     className="w-4 h-4 text-blue-600" /> },
] as const

type Cabin = 'eco' | 'premium' | 'business' | 'first'

export interface TravelerCabinSelectorProps {
  open: boolean
  onClose: () => void
  value: { adults: number; children: number; infants: number }
  onChange: (counts: { adults: number; children: number; infants: number }) => void
  cabinClass: Cabin
  onCabinChange: (cabin: Cabin) => void
}

export default function TravelerCabinSelector({
  open, onClose, value, onChange, cabinClass, onCabinChange,
}: TravelerCabinSelectorProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  // Esc schließt
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !mounted) return null

  const { adults, children, infants } = value

  function set(type: keyof typeof value, delta: number) {
    const next = { ...value, [type]: value[type] + delta }
    // Mindestens 1 Erwachsener
    if (type === 'adults') next.adults = Math.max(1, next.adults)
    // Gesamt max 9
    const total = next.adults + next.children + next.infants
    if (total > 9) return
    // Babys ≤ Erwachsene
    if (next.infants > next.adults) next.infants = next.adults
    // Keine negativen
    next.children = Math.max(0, next.children)
    next.infants  = Math.max(0, next.infants)
    onChange(next)
  }

  const node = (
    <div
      className={cn(
        'jetnity-popup-backdrop',
        // sichere Defaults: voller Screen, hoch genug, leichter Blur
        'fixed inset-0 z-[70] bg-black/20 backdrop-blur-[2px]',
        'flex items-start justify-center p-2 md:p-4'
      )}
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        className={cn(
          'jetnity-popup-card',
          // Karte: responsive, schön
          'mt-2 md:mt-8 w-[28rem] max-w-[95vw] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Reisende & Kabinenklasse"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-lg">Reisende & Kabinenklasse</div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-zinc-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Travelers */}
        <div className="flex flex-col gap-3 mb-5">
          <Row
            label="Erwachsene"
            subtitle="ab 12 J."
            value={adults}
            min={1}
            total={adults + children + infants}
            onDec={() => set('adults', -1)}
            onInc={() => set('adults',  1)}
          />
          <Row
            label="Kinder"
            subtitle="2–11 J."
            value={children}
            min={0}
            total={adults + children + infants}
            onDec={() => set('children', -1)}
            onInc={() => set('children',  1)}
          />
          <Row
            label="Babys"
            subtitle="unter 2 J."
            value={infants}
            min={0}
            total={adults + children + infants}
            // bei Inc zusätzlich Babys ≤ Erwachsene sicherstellen
            onDec={() => set('infants', -1)}
            onInc={() => set('infants',  1)}
          />
          {/* Hinweis Babys ≤ Erwachsene */}
          {infants > adults && (
            <div className="text-xs text-red-600">Babys dürfen die Anzahl der Erwachsenen nicht übersteigen.</div>
          )}
        </div>

        {/* Cabin Selector */}
        <div className="mb-4">
          <div className="font-semibold text-sm mb-2">Kabinenklasse</div>
          <div className="flex gap-2 flex-wrap">
            {CLASSES.map(c => (
              <button
                key={c.key}
                type="button"
                className={cn(
                  'flex items-center gap-1 px-3 py-2 rounded-xl border font-medium text-sm transition',
                  cabinClass === c.key
                    ? 'bg-blue-600 text-white border-blue-600 shadow'
                    : 'bg-gray-100 text-gray-700 border-transparent hover:bg-blue-100'
                )}
                onClick={() => onCabinChange(c.key as Cabin)}
                aria-pressed={cabinClass === c.key}
              >
                {c.icon}
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 font-semibold text-base transition"
          onClick={onClose}
        >
          Übernehmen
        </button>
      </div>
    </div>
  )

  // <-- WICHTIG: via Portal außerhalb der Glas-Card rendern
  return createPortal(node, document.body)
}

/* ---- kleine Hilfskomponente für die 3 Reihen ---- */
function Row({
  label, subtitle, value, min, total, onDec, onInc,
}: {
  label: string; subtitle: string; value: number; min: number; total: number
  onDec: () => void; onInc: () => void
}) {
  const decDisabled = value <= min
  const incDisabled = total >= 9
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-zinc-500">{subtitle}</div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={cn('p-1 rounded border border-zinc-200', decDisabled ? 'opacity-50' : 'hover:bg-zinc-100')}
          onClick={onDec}
          disabled={decDisabled}
          aria-label={`${label} verringern`}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-6 text-center tabular-nums">{value}</span>
        <button
          type="button"
          className={cn('p-1 rounded border border-zinc-200', incDisabled ? 'opacity-50' : 'hover:bg-zinc-100')}
          onClick={onInc}
          disabled={incDisabled}
          aria-label={`${label} erhöhen`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
