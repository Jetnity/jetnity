'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Users2 } from 'lucide-react'
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

  const [region, setRegion] = useState('')
  const [embark, setEmbark] = useState('')
  const [from, setFrom] = useState('')      // YYYY-MM-DD
  const [nights, setNights] = useState(7)
  const [line, setLine] = useState('')      // optional Reederei

  const [pax, setPax] = useState<Pax>({ adults: 2, children: 0 })
  const [cabin, setCabin] = useState<Cabin>('any')
  const [flexible, setFlexible] = useState(false)

  const paxLabel = useMemo(() => {
    const total = pax.adults + pax.children
    const cab =
      cabin === 'any' ? 'Kabine egal'
      : cabin === 'interior' ? 'Innenkabine'
      : cabin === 'oceanview' ? 'Außenkabine'
      : cabin === 'balcony' ? 'Balkon'
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
      p.set('region', region.trim()); if (embark.trim()) p.set('embark', embark.trim())
      p.set('from', from); p.set('nights', String(nights))
      p.set('adults', String(pax.adults)); p.set('children', String(pax.children))
      if (cabin !== 'any') p.set('cabin', cabin); if (line.trim()) p.set('line', line.trim())
      if (flexible) p.set('flex3', '1')
      router.push(`/search/cruise?${p.toString()}`)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/95 p-4 text-[#0c1930] shadow-inner md:p-5">
      {/* Top row: Region | Abfahrtshafen | Abreise ab | Nächte | Passagiere | Kabine | Suchen */}
      <div
        className={cn(
          'grid grid-cols-1 items-end gap-3',
          'md:[grid-template-columns:1.3fr_1.1fr_0.95fr_0.75fr_1.2fr_1.2fr_auto]'
        )}
      >
        <Field className="md:[grid-column:1/2]" label="Region / Route">
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="z. B. Mittelmeer, Karibik, Norwegen"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            aria-label="Kreuzfahrt-Region"
          />
        </Field>

        <Field className="md:[grid-column:2/3]" label="Abfahrtshafen (optional)">
          <input
            value={embark}
            onChange={(e) => setEmbark(e.target.value)}
            placeholder="z. B. Barcelona, Hamburg"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            aria-label="Abfahrtshafen"
          />
        </Field>

        <Field className="md:[grid-column:3/4]" label="Abreise ab">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
        </Field>

        <Field className="md:[grid-column:4/5]" label="Dauer (Nächte)">
          <input
            type="number" min={1} max={30}
            value={nights} onChange={(e) => setNights(Math.max(1, Number(e.target.value || 1)))}
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>

        <div className="md:[grid-column:5/6]">
          <Passengers value={pax} onChange={setPax} label={paxLabel} />
        </div>

        <div className="md:[grid-column:6/7]">
          <CabinPicker value={cabin} onChange={setCabin} />
        </div>

        <div className="md:[grid-column:7/8]">
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              'inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#0c1930] px-6 font-semibold text-white transition',
              'hover:bg-[#102449] active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            Suchen
          </button>
        </div>
      </div>

      {/* Secondary row: Reederei + Flex */}
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
        <Field className="md:col-span-5" label="Reederei (optional)">
          <input
            value={line}
            onChange={(e) => setLine(e.target.value)}
            placeholder="z. B. MSC, AIDA, Royal Caribbean"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
        </Field>

        <div className="md:col-span-3 flex items-center">
          <Toggle label="+/− 3 Tage flexibel" checked={flexible} onCheckedChange={setFlexible} />
        </div>
      </div>
    </form>
  )
}

/* UI-Bausteine */
function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs font-medium text-zinc-500">{label}</span>
      <div className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 shadow-sm">{children}</div>
    </label>
  )
}

function Toggle({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2">
      <span
        role="switch" aria-checked={checked} tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onCheckedChange(!checked)}
        onClick={() => onCheckedChange(!checked)}
        className={cn('relative h-6 w-11 rounded-full border transition', checked ? 'border-emerald-400 bg-emerald-400' : 'border-zinc-300 bg-zinc-200')}
      >
        <span className={cn('absolute top-1/2 -translate-y-1/2 transform rounded-full bg-white transition', checked ? 'right-1 h-4 w-4' : 'left-1 h-4 w-4')} />
      </span>
      <span className="text-sm text-zinc-700">{label}</span>
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
        className="flex h-11 w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 text-left text-sm transition hover:bg-zinc-50"
        aria-haspopup="dialog" aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Users2 className="h-4 w-4" />
          <span className="line-clamp-1">{label}</span>
        </div>
        <ChevronDown className="h-4 w-4 opacity-60" />
      </button>
      {open && (
        <div role="dialog" aria-label="Passagiere" className="absolute right-0 z-[1001] mt-2 w-[26rem] max-w-[95vw] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
          <div className="grid grid-cols-2 gap-3">
            <Counter label="Erwachsene" subtitle="ab 18 J." value={value.adults} min={1} onChange={(v) => patch({ adults: v })} />
            <Counter label="Kinder" subtitle="0–17 J." value={value.children} min={0} onChange={(v) => patch({ children: v })} />
          </div>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold hover:bg-zinc-50">
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
    value === 'any' ? 'Kabine: egal'
    : value === 'interior' ? 'Innenkabine'
    : value === 'oceanview' ? 'Außenkabine'
    : value === 'balcony' ? 'Balkon'
    : 'Suite'

  return (
    <div className="relative">
      <button
        type="button" onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 text-left text-sm transition hover:bg-zinc-50"
        aria-haspopup="dialog" aria-expanded={open}
      >
        <span className="line-clamp-1">{label}</span>
        <ChevronDown className="h-4 w-4 opacity-60" />
      </button>
      {open && (
        <div role="dialog" aria-label="Kabinenkategorie" className="absolute right-0 z-[1001] mt-2 w-[28rem] max-w-[95vw] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(['any', 'interior', 'oceanview', 'balcony', 'suite'] as Cabin[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange(c)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-sm',
                  value === c ? 'border-zinc-900 bg-zinc-900 font-semibold text-white' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                )}
              >
                {c === 'any' ? 'egal' : c === 'interior' ? 'Innen' : c === 'oceanview' ? 'Außen' : c === 'balcony' ? 'Balkon' : 'Suite'}
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold hover:bg-zinc-50">
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
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <div className="text-sm font-medium">{label}</div>
      {subtitle && <div className="text-xs text-zinc-500">{subtitle}</div>}
      <div className="mt-2 flex items-center justify-between">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="rounded-lg border border-zinc-200 px-2 py-1 hover:bg-zinc-50" aria-label={`${label} verringern`}>−</button>
        <div className="w-8 text-center text-sm">{value}</div>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="rounded-lg border border-zinc-200 px-2 py-1 hover:bg-zinc-50" aria-label={`${label} erhöhen`}>+</button>
      </div>
    </div>
  )
}
