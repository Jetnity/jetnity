'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft, Users2, ChevronDown } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

/* helpers */
const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')
type Pax = { adults: number; children: number }
type ClassType = '2' | '1'
function toDate(dateStr: string | null, timeStr: string | null): Date | null {
  if (!dateStr) return null
  const t = timeStr && timeStr.trim() ? timeStr : '00:00'
  const d = new Date(`${dateStr}T${t}:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export interface TrainSearchFormProps {
  onSubmit?: (params: {
    from: string
    to: string
    datetime: Date | null
    passengers: Pax
    classType: ClassType
    directOnly: boolean
    flexible: boolean
  }) => void
}

export default function TrainSearchForm({ onSubmit }: TrainSearchFormProps) {
  const router = useRouter()

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [pax, setPax] = useState<Pax>({ adults: 1, children: 0 })
  const [classType, setClassType] = useState<ClassType>('2')
  const [directOnly, setDirectOnly] = useState(false)
  const [flexible, setFlexible] = useState(false)

  function swap() { setFrom(to); setTo(from) }

  const dt = toDate(date, time)
  const canSubmit = from.trim().length >= 2 && to.trim().length >= 2 && !!date

  const paxLabel = useMemo(() => {
    const total = pax.adults + pax.children
    return `${total} ${total === 1 ? 'Reisender' : 'Reisende'}`
  }, [pax])

  function submit(e: React.FormEvent) {
    e.preventDefault()

    onSubmit?.({
      from, to, datetime: dt, passengers: pax, classType, directOnly, flexible,
    })

    if (!onSubmit) {
      const p = new URLSearchParams()
      p.set('from', from.trim())
      p.set('to', to.trim())
      p.set('date', date)
      if (time) p.set('time', time)
      p.set('adults', String(pax.adults))
      p.set('children', String(pax.children))
      p.set('class', classType)
      if (directOnly) p.set('nonstop', '1')
      if (flexible) p.set('flex3', '1')
      router.push(`/search/train?${p.toString()}`)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/95 p-4 text-[#0c1930] shadow-inner md:p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <Field className="md:col-span-5" label="Von">
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="Bahnhof / Stadt"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            aria-label="Startbahnhof"
          />
        </Field>

        <div className="relative md:col-span-2">
          <button
            type="button"
            onClick={swap}
            aria-label="Von und Nach tauschen"
            className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200 bg-white p-2 shadow-sm transition hover:bg-zinc-50"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>
        </div>

        <Field className="md:col-span-5" label="Nach">
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Bahnhof / Stadt"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            aria-label="Zielbahnhof"
          />
        </Field>

        <Field className="md:col-span-3" label="Datum">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>
        <Field className="md:col-span-2" label="Zeit (optional)">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>

        {/* Klasse & Passagiere */}
        <div className="md:col-span-3 flex items-center">
          <Segmented<ClassType>
            value={classType}
            onChange={setClassType}
            options={[
              { value: '2', label: '2. Klasse' },
              { value: '1', label: '1. Klasse' },
            ]}
          />
        </div>

        <div className="md:col-span-4">
          <PaxPicker value={pax} onChange={setPax} label={paxLabel} />
        </div>

        <div className="md:col-span-3 flex items-center gap-4">
          <Toggle label="Nur Direktverbindung" checked={directOnly} onCheckedChange={setDirectOnly} />
        </div>
        <div className="md:col-span-3 flex items-center gap-4">
          <Toggle label="+/− 3 Tage flexibel" checked={flexible} onCheckedChange={setFlexible} />
        </div>

        <div className="md:col-span-2">
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

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm">
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value} type="button" onClick={() => onChange(o.value)}
            className={cn('rounded-xl px-3 py-2 text-sm transition', active ? 'bg-zinc-900 font-semibold text-white' : 'text-zinc-700 hover:bg-zinc-100')}
          >
            {o.label}
          </button>
        )
      })}
    </div>
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

function PaxPicker({ value, onChange, label }: { value: Pax; onChange: (v: Pax) => void; label: string }) {
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
        <div role="dialog" aria-label="Passagiere" className="absolute right-0 z-20 mt-2 w-[24rem] max-w-[95vw] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
          <div className="grid grid-cols-2 gap-3">
            <Counter label="Erwachsene" subtitle="ab 15 J." value={value.adults} min={1} onChange={(v) => patch({ adults: v })} />
            <Counter label="Kinder" subtitle="0–14 J." value={value.children} min={0} onChange={(v) => patch({ children: v })} />
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
