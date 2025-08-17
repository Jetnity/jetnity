'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft, Users2, ChevronDown } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

/* ---------- helpers ---------- */
const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')
type Pax = { adults: number; children: number; infants: number }
type VehicleType = 'none' | 'car' | 'motorcycle' | 'camper' | 'van' | 'bicycle'

function strToDate(s: string | null): Date | null {
  if (!s) return null
  const d = new Date(`${s}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export interface FerrySearchFormProps {
  onSubmit?: (params: {
    from: string
    to: string
    date: Date | null
    passengers: Pax
    vehicle: { type: VehicleType; lengthMeters?: number | null }
  }) => void
}

export default function FerrySearchForm({ onSubmit }: FerrySearchFormProps) {
  const router = useRouter()

  // Basisfelder
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('') // YYYY-MM-DD

  // Passagiere
  const [pax, setPax] = useState<Pax>({ adults: 2, children: 0, infants: 0 })

  // Fahrzeug
  const [vehType, setVehType] = useState<VehicleType>('none')
  const [vehLen, setVehLen] = useState<number | ''>('') // in Metern (optional)

  const paxLabel = useMemo(() => {
    const total = pax.adults + pax.children + pax.infants
    const people = `${total} ${total === 1 ? 'Reisender' : 'Reisende'}`
    const v =
      vehType === 'none'
        ? 'ohne Fahrzeug'
        : vehType === 'car'
        ? `Auto${vehLen ? ` ${vehLen} m` : ''}`
        : vehType === 'motorcycle'
        ? 'Motorrad'
        : vehType === 'bicycle'
        ? 'Fahrrad'
        : vehType === 'camper'
        ? `Camper${vehLen ? ` ${vehLen} m` : ''}`
        : `Van${vehLen ? ` ${vehLen} m` : ''}`
    return `${people}, ${v}`
  }, [pax, vehType, vehLen])

  const canSubmit =
    from.trim().length >= 2 && to.trim().length >= 2 && !!date

  function swap() {
    setFrom(to)
    setTo(from)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()

    // 1) Optionales Callback
    onSubmit?.({
      from,
      to,
      date: strToDate(date),
      passengers: pax,
      vehicle: { type: vehType, lengthMeters: vehLen === '' ? null : Number(vehLen) },
    })

    // 2) Fallback: URL-Routing
    if (!onSubmit) {
      const p = new URLSearchParams()
      p.set('from', from.trim())
      p.set('to', to.trim())
      p.set('date', date)
      p.set('adults', String(pax.adults))
      p.set('children', String(pax.children))
      p.set('infants', String(pax.infants))
      if (vehType !== 'none') {
        p.set('vehicle', vehType)
        if (vehLen !== '') p.set('length', String(vehLen))
      }
      router.push(`/search/ferry?${p.toString()}`)
    }
  }

  const needsLength = vehType === 'car' || vehType === 'camper' || vehType === 'van'

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/95 p-4 text-[#0c1930] shadow-inner md:p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        {/* Von */}
        <Field className="md:col-span-5" label="Von">
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="Hafen / Stadt"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            aria-label="Start-Hafen"
          />
        </Field>

        {/* Swap */}
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

        {/* Nach */}
        <Field className="md:col-span-5" label="Nach">
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Hafen / Stadt"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            aria-label="Ziel-Hafen"
          />
        </Field>

        {/* Datum */}
        <Field className="md:col-span-4" label="Datum">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>

        {/* Passagiere */}
        <div className="md:col-span-4">
          <Passengers value={pax} onChange={setPax} />
        </div>

        {/* Fahrzeug */}
        <div className="md:col-span-4">
          <VehiclePicker
            type={vehType}
            length={vehLen}
            onTypeChange={setVehType}
            onLengthChange={setVehLen}
          />
        </div>

        {/* Zusammenfassung + Suche */}
        <div className="md:col-span-8">
          <Summary label={paxLabel} />
        </div>
        <div className="md:col-span-4">
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

/* -------------------------------- UI Parts -------------------------------- */

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs font-medium text-zinc-500">{label}</span>
      <div className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 shadow-sm">
        {children}
      </div>
    </label>
  )
}

function Summary({ label }: { label: string }) {
  return (
    <div className="flex h-11 items-center rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700">
      {label}
    </div>
  )
}

function Passengers({
  value, onChange,
}: { value: Pax; onChange: (v: Pax) => void }) {
  const [open, setOpen] = useState(false)
  function patch(p: Partial<Pax>) { onChange({ ...value, ...p }) }
  const total = value.adults + value.children + value.infants
  const label = `${total} ${total === 1 ? 'Reisender' : 'Reisende'}`

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 text-left text-sm transition hover:bg-zinc-50"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Users2 className="h-4 w-4" />
          <span className="line-clamp-1">{label}</span>
        </div>
        <ChevronDown className="h-4 w-4 opacity-60" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Passagiere"
          className="absolute right-0 z-20 mt-2 w-[26rem] max-w-[95vw] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl"
        >
          <div className="grid grid-cols-3 gap-3">
            <Counter label="Erwachsene" subtitle="ab 12 J." value={value.adults} min={1} onChange={(v) => patch({ adults: v })} />
            <Counter label="Kinder" subtitle="2–11 J." value={value.children} onChange={(v) => patch({ children: v })} />
            <Counter label="Babys" subtitle="unter 2 J." value={value.infants} onChange={(v) => patch({ infants: v })} />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold hover:bg-zinc-50"
            >
              Übernehmen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function VehiclePicker({
  type, length, onTypeChange, onLengthChange,
}: {
  type: VehicleType
  length: number | ''
  onTypeChange: (v: VehicleType) => void
  onLengthChange: (v: number | '') => void
}) {
  const [open, setOpen] = useState(false)
  const label =
    type === 'none'
      ? 'Ohne Fahrzeug'
      : type === 'car'
      ? `Auto${length ? ` – ${length} m` : ''}`
      : type === 'motorcycle'
      ? 'Motorrad'
      : type === 'bicycle'
      ? 'Fahrrad'
      : type === 'camper'
      ? `Camper${length ? ` – ${length} m` : ''}`
      : `Van${length ? ` – ${length} m` : ''}`

  const needsLength = type === 'car' || type === 'camper' || type === 'van'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 text-left text-sm transition hover:bg-zinc-50"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="line-clamp-1">{label}</span>
        <ChevronDown className="h-4 w-4 opacity-60" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Fahrzeug"
          className="absolute right-0 z-20 mt-2 w-[28rem] max-w-[95vw] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl"
        >
          <div className="grid grid-cols-3 gap-2">
            {(['none', 'car', 'motorcycle', 'bicycle', 'camper', 'van'] as VehicleType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTypeChange(t)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-sm capitalize',
                  type === t ? 'border-zinc-900 bg-zinc-900 font-semibold text-white' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                )}
              >
                {t === 'none'
                  ? 'Ohne Fahrzeug'
                  : t === 'car'
                  ? 'Auto'
                  : t === 'motorcycle'
                  ? 'Motorrad'
                  : t === 'bicycle'
                  ? 'Fahrrad'
                  : t === 'camper'
                  ? 'Camper'
                  : 'Van'}
              </button>
            ))}
          </div>

          {needsLength && (
            <div className="mt-4">
              <span className="mb-1 block text-xs font-medium text-zinc-500">Fahrzeuglänge (Meter)</span>
              <div className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3">
                <input
                  type="number"
                  min={2}
                  max={12}
                  step={0.1}
                  value={length}
                  onChange={(e) => onLengthChange(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="z. B. 4.5"
                  className="w-full bg-transparent text-sm outline-none"
                />
                <span className="text-sm text-zinc-500">m</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">Viele Reedereien staffeln Preise nach Länge.</p>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold hover:bg-zinc-50"
            >
              Übernehmen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Counter({
  label, subtitle, value, onChange, min = 0, max = 9,
}: { label: string; subtitle?: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
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
