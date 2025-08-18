// components/search/forms/ActivitySearchForm.tsx
'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users2, ChevronDown, Plus, Minus } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')
type Pax = { adults: number; children: number }

function strToDate(s: string | null): Date | null {
  if (!s) return null
  const d = new Date(`${s}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export interface ActivitySearchFormProps {
  onSubmit?: (params: {
    destination: string
    date: Date | null
    passengers: Pax
    categories: string[]
    flexible: boolean
    minRating?: number | null
    maxPrice?: number | null
  }) => void
}

export default function ActivitySearchForm({ onSubmit }: ActivitySearchFormProps) {
  const router = useRouter()

  // Basics
  const [dest, setDest] = useState('')
  const [date, setDate] = useState('') // optional YYYY-MM-DD
  const [pax, setPax] = useState<Pax>({ adults: 2, children: 0 })

  // Filters
  const [cats, setCats] = useState<string[]>([])
  const [flexible, setFlexible] = useState(false)
  const [minRating, setMinRating] = useState<number | ''>('')
  const [maxPrice, setMaxPrice] = useState<number | ''>('')

  const paxLabel = useMemo(() => {
    const total = pax.adults + pax.children
    return `${total} ${total === 1 ? 'Reisender' : 'Reisende'}`
  }, [pax])

  const canSubmit = dest.trim().length >= 2

  function toggleCat(c: string) {
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()

    onSubmit?.({
      destination: dest,
      date: strToDate(date || null),
      passengers: pax,
      categories: cats,
      flexible,
      minRating: minRating === '' ? null : Number(minRating),
      maxPrice: maxPrice === '' ? null : Number(maxPrice),
    })

    if (!onSubmit) {
      const p = new URLSearchParams()
      p.set('dest', dest.trim())
      if (date) p.set('date', date)
      p.set('adults', String(pax.adults))
      p.set('children', String(pax.children))
      if (cats.length) p.set('cats', cats.join(','))
      if (flexible) p.set('flex3', '1')
      if (minRating !== '') p.set('minRating', String(minRating))
      if (maxPrice !== '') p.set('maxPrice', String(maxPrice))
      router.push(`/search/activity?${p.toString()}`)
    }
  }

  const CAT_OPTS = ['Stadttour', 'Museum', 'Outdoor', 'Wasser', 'Kulinarik', 'Shows', 'Abenteuer']

  return (
    <form
      onSubmit={submit}
      className="
        rounded-2xl p-4 md:p-5 text-white
        bg-white/5 ring-1 ring-inset ring-white/10
        backdrop-blur-xl
      "
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        {/* Ziel */}
        <Field className="md:col-span-6" label="Ziel / Stadt">
          <input
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            placeholder="z. B. Rom, Barcelona, Dubai"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/60"
            aria-label="Ziel"
          />
        </Field>

        {/* Datum (optional) */}
        <Field className="md:col-span-3" label="Datum (optional)">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 w-full bg-transparent text-sm outline-none"
          />
        </Field>

        {/* Reisende */}
        <div className="md:col-span-3">
          <PaxPicker value={pax} onChange={setPax} label={paxLabel} />
        </div>

        {/* Kategorien */}
        <div className="md:col-span-8">
          <span className="mb-1 block text-xs font-medium text-white/80">Kategorien (optional)</span>
          <div className="flex flex-wrap gap-2">
            {CAT_OPTS.map((t) => {
              const active = cats.includes(t)
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleCat(t)}
                  className={cn(
                    'tap-target focus-ring rounded-full border px-3 py-1.5 text-sm',
                    active
                      ? 'border-white/20 bg-white/20 font-semibold text-white'
                      : 'border-white/10 bg-white/10 text-white/90 hover:bg-white/15'
                  )}
                  aria-pressed={active}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>

        {/* Filter rechts */}
        <Field className="md:col-span-2" label="min. Bewertung">
          <input
            type="number"
            min={1}
            max={5}
            step={0.1}
            value={minRating}
            onChange={(e) => setMinRating(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="z. B. 4.5"
            className="h-11 w-full bg-transparent text-sm outline-none"
          />
        </Field>
        <Field className="md:col-span-2" label="max. Preis (€)">
          <input
            type="number"
            min={0}
            step={5}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="z. B. 80"
            className="h-11 w-full bg-transparent text-sm outline-none"
          />
        </Field>

        {/* Flex + Suche */}
        <div className="md:col-span-4 flex items-center">
          <Toggle label="+/− 3 Tage flexibel" checked={flexible} onCheckedChange={setFlexible} />
        </div>
        <div className="md:col-span-2 md:col-start-11">
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              'tap-target focus-ring inline-flex w-full items-center justify-center rounded-xl',
              'bg-primary text-primary-foreground font-semibold transition',
              'hover:brightness-105 active:translate-y-[1px]',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            Suchen
          </button>
        </div>
      </div>
    </form>
  )
}

/* ---------- UI-Bausteine ---------- */
function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs font-medium text-white/80">{label}</span>
      <div
        className="
          tap-target focus-ring flex items-center gap-2
          rounded-xl border border-white/10 bg-white/10 px-3
        "
      >
        {children}
      </div>
    </label>
  )
}

function Toggle({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2 text-white">
      <span
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onCheckedChange(!checked)}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'focus-ring relative h-6 w-11 rounded-full border transition',
          checked ? 'border-emerald-400 bg-emerald-400' : 'border-white/20 bg-white/10'
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 -translate-y-1/2 transform rounded-full bg-white transition',
            checked ? 'right-1 h-4 w-4' : 'left-1 h-4 w-4'
          )}
        />
      </span>
      <span className="text-sm text-white/90">{label}</span>
    </label>
  )
}

function PaxPicker({ value, onChange, label }: { value: Pax; onChange: (v: Pax) => void; label: string }) {
  const [open, setOpen] = useState(false)
  function patch(p: Partial<Pax>) { onChange({ ...value, ...p }) }
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="
          tap-target focus-ring flex w-full items-center justify-between
          rounded-xl border border-white/10 bg-white/10 px-3 text-left text-sm
          transition hover:bg-white/15
        "
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Users2 className="h-4 w-4" />
          <span className="line-clamp-1">{label}</span>
        </div>
        <ChevronDown className="h-4 w-4 opacity-80" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Reisende"
          className="
            absolute right-0 z-20 mt-2 w-[24rem] max-w-[95vw]
            rounded-2xl border border-white/10 bg-[#0c1930]/95 p-4 text-white
            shadow-xl backdrop-blur-xl
          "
        >
          <div className="grid grid-cols-2 gap-3">
            <Counter label="Erwachsene" subtitle="ab 12 J." value={value.adults} min={1} onChange={(v) => patch({ adults: v })} />
            <Counter label="Kinder" subtitle="0–11 J." value={value.children} min={0} onChange={(v) => patch({ children: v })} />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="
                tap-target focus-ring inline-flex h-10 items-center justify-center
                rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-semibold
                hover:bg-white/15
              "
            >
              Übernehmen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Counter({ label, subtitle, value, onChange, min = 0, max = 9 }: { label: string; subtitle?: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
      <div className="text-sm font-medium text-white">{label}</div>
      {subtitle && <div className="text-xs text-white/70">{subtitle}</div>}
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="tap-target focus-ring rounded-lg border border-white/10 bg-white/10 px-2 hover:bg-white/15"
          aria-label={`${label} verringern`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="w-8 text-center text-sm">{value}</div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="tap-target focus-ring rounded-lg border border-white/10 bg-white/10 px-2 hover:bg-white/15"
          aria-label={`${label} erhöhen`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
