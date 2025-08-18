'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users2, ChevronDown, Plus, Minus } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

/* helpers */
const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')
type Pax = { adults: number; children: number }

function strToDate(s: string | null): Date | null {
  if (!s) return null
  const d = new Date(`${s}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export interface ComboSearchFormProps {
  onSubmit?: (params: {
    destination: string
    startDate: Date | null
    days: number
    budget?: number | null
    passengers: Pax
    flexible: boolean
    themes?: string[]
  }) => void
}

export default function ComboSearchForm({ onSubmit }: ComboSearchFormProps) {
  const router = useRouter()

  // Basics
  const [dest, setDest] = useState('')
  const [start, setStart] = useState('') // optional
  const [days, setDays] = useState(7)
  const [budget, setBudget] = useState<number | ''>('')

  // Options
  const [pax, setPax] = useState<Pax>({ adults: 2, children: 0 })
  const [flexible, setFlexible] = useState(false)
  const [themes, setThemes] = useState<string[]>([]) // z. B. Strand, Städtetrip, Natur …

  const paxLabel = useMemo(() => {
    const total = pax.adults + pax.children
    return `${total} ${total === 1 ? 'Reisender' : 'Reisende'}`
  }, [pax])

  const canSubmit = dest.trim().length >= 2 && days > 1

  function toggleTheme(t: string) {
    setThemes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()

    onSubmit?.({
      destination: dest,
      startDate: strToDate(start || null),
      days,
      budget: budget === '' ? null : Number(budget),
      passengers: pax,
      flexible,
      themes,
    })

    if (!onSubmit) {
      const p = new URLSearchParams()
      p.set('dest', dest.trim())
      p.set('days', String(days))
      if (start) p.set('start', start)
      if (budget !== '') p.set('budget', String(budget))
      p.set('adults', String(pax.adults))
      p.set('children', String(pax.children))
      if (themes.length) p.set('themes', themes.join(','))
      if (flexible) p.set('flex3', '1')
      router.push(`/search/combo?${p.toString()}`)
    }
  }

  const THEME_OPTS = ['Strand', 'Städtetrip', 'Natur', 'Kultur', 'Wellness', 'Abenteuer']

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
        <Field className="md:col-span-6" label="Ziel / Region">
          <input
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            placeholder="z. B. Bali, Andalusien, Kalifornien"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/60"
            aria-label="Reiseziel"
          />
        </Field>

        <Field className="md:col-span-3" label="Startdatum (optional)">
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="h-11 w-full bg-transparent text-sm outline-none"
          />
        </Field>

        <Field className="md:col-span-3" label="Dauer (Tage)">
          <input
            type="number"
            min={2}
            max={30}
            value={days}
            onChange={(e) => setDays(Math.max(2, Number(e.target.value || 2)))}
            className="h-11 w-full bg-transparent text-sm outline-none"
          />
        </Field>

        <Field className="md:col-span-3" label="Budget (optional, €)">
          <input
            type="number"
            min={0}
            step={50}
            value={budget}
            onChange={(e) => setBudget(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="z. B. 1500"
            className="h-11 w-full bg-transparent text-sm outline-none"
          />
        </Field>

        <div className="md:col-span-4">
          <PaxPicker value={pax} onChange={setPax} label={paxLabel} />
        </div>

        <div className="md:col-span-5">
          <ThemeSelect options={THEME_OPTS} selected={themes} onToggle={toggleTheme} />
        </div>

        <div className="md:col-span-2 flex items-center">
          <Toggle label="+/− 3 Tage flexibel" checked={flexible} onCheckedChange={setFlexible} />
        </div>

        <div className="md:col-span-2">
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

/* UI-Bausteine */
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
        role="switch" aria-checked={checked} tabIndex={0}
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
        type="button" onClick={() => setOpen((v) => !v)}
        className="
          tap-target focus-ring flex w-full items-center justify-between
          rounded-xl border border-white/10 bg-white/10 px-3 text-left text-sm
          transition hover:bg-white/15
        "
        aria-haspopup="dialog" aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Users2 className="h-4 w-4" />
          <span className="line-clamp-1">{label}</span>
        </div>
        <ChevronDown className="h-4 w-4 opacity-80" />
      </button>
      {open && (
        <div
          role="dialog" aria-label="Reisende"
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
              type="button" onClick={() => setOpen(false)}
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

function ThemeSelect({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (t: string) => void }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-white/80">Reisethemen (optional)</span>
      <div className="flex flex-wrap gap-2">
        {options.map((t) => {
          const active = selected.includes(t)
          return (
            <button
              key={t}
              type="button"
              onClick={() => onToggle(t)}
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
  )
}

function Counter({
  label, subtitle, value, onChange, min = 0, max = 9,
}: { label: string; subtitle?: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
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
