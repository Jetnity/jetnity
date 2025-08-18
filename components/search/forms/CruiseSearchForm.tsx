'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Users2, Plus, Minus } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

/* helpers */
const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')
type Pax = { adults: number; children: number }
type Cabin = 'any' | 'interior' | 'oceanview' | 'balcony' | 'suite'

function strToDate(s: string | null): Date | null {
  if (!s) return null
  const d = new Date(`${s}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export interface CruiseSearchFormProps {
  onSubmit?: (params: {
    region: string
    embarkation?: string | null
    fromDate: Date | null
    nights: number
    passengers: Pax
    cabin: Cabin
    cruiseLine?: string | null
    flexible: boolean
  }) => void
}

export default function CruiseSearchForm({ onSubmit }: CruiseSearchFormProps) {
  const router = useRouter()

  // Basics
  const [region, setRegion] = useState('')
  const [embark, setEmbark] = useState('')
  const [from, setFrom] = useState('')      // YYYY-MM-DD
  const [nights, setNights] = useState(7)
  const [line, setLine] = useState('')      // optional Reederei

  // Options
  const [pax, setPax] = useState<Pax>({ adults: 2, children: 0 })
  const [cabin, setCabin] = useState<Cabin>('any')
  const [flexible, setFlexible] = useState(false)

  const paxLabel = useMemo(() => {
    const total = pax.adults + pax.children
    const cab =
      cabin === 'any'
        ? 'Kabine egal'
        : cabin === 'interior'
        ? 'Innenkabine'
        : cabin === 'oceanview'
        ? 'Außenkabine'
        : cabin === 'balcony'
        ? 'Balkon'
        : 'Suite'
    return `${total} ${total === 1 ? 'Reisender' : 'Reisende'}, ${cab}`
  }, [pax, cabin])

  const canSubmit = region.trim().length >= 2 && !!from && nights > 0

  function submit(e: React.FormEvent) {
    e.preventDefault()

    onSubmit?.({
      region,
      embarkation: embark.trim() || null,
      fromDate: strToDate(from),
      nights,
      passengers: pax,
      cabin,
      cruiseLine: line.trim() || null,
      flexible,
    })

    if (!onSubmit) {
      const p = new URLSearchParams()
      p.set('region', region.trim())
      if (embark.trim()) p.set('embark', embark.trim())
      p.set('from', from)
      p.set('nights', String(nights))
      p.set('adults', String(pax.adults))
      p.set('children', String(pax.children))
      if (cabin !== 'any') p.set('cabin', cabin)
      if (line.trim()) p.set('line', line.trim())
      if (flexible) p.set('flex3', '1')
      router.push(`/search/cruise?${p.toString()}`)
    }
  }

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
        <Field className="md:col-span-5" label="Region / Route">
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="z. B. Mittelmeer, Karibik, Norwegen"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/60"
            aria-label="Kreuzfahrt-Region"
          />
        </Field>

        <Field className="md:col-span-4" label="Abfahrtshafen (optional)">
          <input
            value={embark}
            onChange={(e) => setEmbark(e.target.value)}
            placeholder="z. B. Barcelona, Hamburg"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/60"
            aria-label="Abfahrtshafen"
          />
        </Field>

        <Field className="md:col-span-3" label="Abreise ab">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-11 w-full bg-transparent text-sm outline-none"
          />
        </Field>

        <Field className="md:col-span-3" label="Dauer (Nächte)">
          <input
            type="number"
            min={1}
            max={30}
            value={nights}
            onChange={(e) => setNights(Math.max(1, Number(e.target.value || 1)))}
            className="h-11 w-full bg-transparent text-sm outline-none"
          />
        </Field>

        <div className="md:col-span-4">
          <Passengers value={pax} onChange={setPax} label={paxLabel} />
        </div>

        <div className="md:col-span-5">
          <CabinPicker value={cabin} onChange={setCabin} />
        </div>

        <Field className="md:col-span-4" label="Reederei (optional)">
          <input
            value={line}
            onChange={(e) => setLine(e.target.value)}
            placeholder="z. B. MSC, AIDA, Royal Caribbean"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/60"
            aria-label="Reederei"
          />
        </Field>

        <div className="md:col-span-3 flex items-center">
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

function Passengers({ value, onChange, label }: { value: Pax; onChange: (v: Pax) => void; label: string }) {
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
          role="dialog" aria-label="Passagiere"
          className="
            absolute right-0 z-20 mt-2 w-[26rem] max-w-[95vw]
            rounded-2xl border border-white/10 bg-[#0c1930]/95 p-4 text-white
            shadow-xl backdrop-blur-xl
          "
        >
          <div className="grid grid-cols-2 gap-3">
            <Counter label="Erwachsene" subtitle="ab 18 J." value={value.adults} min={1} onChange={(v) => patch({ adults: v })} />
            <Counter label="Kinder" subtitle="0–17 J." value={value.children} min={0} onChange={(v) => patch({ children: v })} />
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

function CabinPicker({ value, onChange }: { value: Cabin; onChange: (v: Cabin) => void }) {
  const [open, setOpen] = useState(false)
  const label =
    value === 'any'
      ? 'Kabine: egal'
      : value === 'interior'
      ? 'Innenkabine'
      : value === 'oceanview'
      ? 'Außenkabine'
      : value === 'balcony'
      ? 'Balkon'
      : 'Suite'

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
        <span className="line-clamp-1">{label}</span>
        <ChevronDown className="h-4 w-4 opacity-80" />
      </button>
      {open && (
        <div
          role="dialog" aria-label="Kabinenkategorie"
          className="
            absolute right-0 z-20 mt-2 w-[28rem] max-w-[95vw]
            rounded-2xl border border-white/10 bg-[#0c1930]/95 p-4 text-white
            shadow-xl backdrop-blur-xl
          "
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(['any', 'interior', 'oceanview', 'balcony', 'suite'] as Cabin[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange(c)}
                className={cn(
                  'tap-target focus-ring rounded-xl border px-3 py-2 text-sm',
                  value === c
                    ? 'border-white/20 bg-white/20 font-semibold'
                    : 'border-white/10 bg-white/10 hover:bg-white/15'
                )}
              >
                {c === 'any' ? 'egal' : c === 'interior' ? 'Innen' : c === 'oceanview' ? 'Außen' : c === 'balcony' ? 'Balkon' : 'Suite'}
              </button>
            ))}
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
