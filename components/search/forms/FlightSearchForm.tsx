'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft, Users2, ChevronDown, Plus, Minus, X } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

/* ---------- helpers ---------- */
const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')
type TripType = 'oneway' | 'roundtrip' | 'multicity'
type CabinClass = 'eco' | 'premium' | 'business' | 'first'
type Trav = { adults: number; children: number; infants: number }
type Leg = { from: string; to: string; date: string } // UI hält Strings (YYYY-MM-DD)

function strToDate(s: string | null): Date | null {
  if (!s) return null
  const d = new Date(`${s}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function mapCabinToUrl(c: CabinClass) {
  return c === 'eco' ? 'economy' : c === 'premium' ? 'premium_economy' : c
}

export interface FlightSearchFormProps {
  onSubmit?: (params: {
    origin: string
    destination: string
    departureDate: Date | null
    returnDate: Date | null
    tripType: TripType
    passengers: Trav
    cabinClass: CabinClass
    directOnly: boolean
    flexible: boolean
    multiCityStops?: { from: string; to: string; date: Date | null }[]
  }) => void
}

export default function FlightSearchForm({ onSubmit }: FlightSearchFormProps) {
  const router = useRouter()

  // Trip type
  const [tripType, setTripType] = useState<TripType>('roundtrip')

  // Simple (oneway/roundtrip)
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [departure, setDeparture] = useState('') // YYYY-MM-DD
  const [ret, setRet] = useState('')            // YYYY-MM-DD

  // Multicity
  const [legs, setLegs] = useState<Leg[]>([
    { from: '', to: '', date: '' },
    { from: '', to: '', date: '' },
  ])

  // Options
  const [trav, setTrav] = useState<Trav>({ adults: 1, children: 0, infants: 0 })
  const [cabin, setCabin] = useState<CabinClass>('eco')
  const [directOnly, setDirectOnly] = useState(false)
  const [flexible, setFlexible] = useState(false)

  const paxLabel = useMemo(() => {
    const total = trav.adults + trav.children + trav.infants
    const cabinLabel =
      cabin === 'eco' ? 'Economy' : cabin === 'premium' ? 'Premium Economy' : cabin[0].toUpperCase() + cabin.slice(1)
    return `${total} ${total === 1 ? 'Reisender' : 'Reisende'}, ${cabinLabel}`
  }, [trav, cabin])

  const canSubmit =
    tripType === 'multicity'
      ? legs.every((l) => l.from.trim().length >= 2 && l.to.trim().length >= 2 && !!l.date)
      : origin.trim().length >= 2 &&
        destination.trim().length >= 2 &&
        !!departure &&
        (tripType === 'oneway' || !!ret)

  function swap() {
    setOrigin(destination)
    setDestination(origin)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()

    const payload = {
      origin,
      destination,
      departureDate: strToDate(departure),
      returnDate: tripType === 'roundtrip' ? strToDate(ret) : null,
      tripType,
      passengers: trav,
      cabinClass: cabin,
      directOnly,
      flexible,
      multiCityStops:
        tripType === 'multicity'
          ? legs.map((l) => ({ ...l, date: strToDate(l.date) }))
          : undefined,
    }
    onSubmit?.(payload)

    if (!onSubmit) {
      const p = new URLSearchParams()
      p.set('trip', tripType)
      p.set('adults', String(trav.adults))
      p.set('children', String(trav.children))
      p.set('infants', String(trav.infants))
      p.set('cabin', mapCabinToUrl(cabin))
      if (directOnly) p.set('nonstop', '1')
      if (flexible) p.set('flex3', '1')

      if (tripType === 'multicity') {
        legs.forEach((l, i) => {
          p.set(`leg${i}_from`, l.from.trim())
          p.set(`leg${i}_to`, l.to.trim())
          p.set(`leg${i}_date`, l.date)
        })
      } else {
        p.set('from', origin.trim())
        p.set('to', destination.trim())
        p.set('out', departure)
        if (tripType === 'roundtrip' && ret) p.set('back', ret)
      }
      router.push(`/search/flight?${p.toString()}`)
    }
  }

  /* ------------------------------- UI ------------------------------- */

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/95 p-4 text-[#0c1930] shadow-inner md:p-5">
      {/* TripType */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Segmented<TripType>
          value={tripType}
          onChange={setTripType}
          options={[
            { value: 'roundtrip', label: 'Hin- und Rückflug' },
            { value: 'oneway', label: 'Nur Hinflug' },
            { value: 'multicity', label: 'Gabelflug' },
          ]}
        />
      </div>

      {/* Simple layouts: EIN REIHE auf Desktop */}
      {tripType !== 'multicity' ? (
        <>
          {/* Top row – breite Ein-Zeile wie Skyscanner */}
          <div
            className={cn(
              'grid grid-cols-1 items-end gap-3',
              // Custom Grid auf Desktop:
              // Von | Swap | Nach | Abflug | Rückflug | Reisende | Button
              'md:[grid-template-columns:1.35fr_2.5rem_1.35fr_0.95fr_0.95fr_1.35fr_auto]'
            )}
          >
            <Field className="md:[grid-column:1/2]" label="Von">
              <input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Abflughafen oder Stadt"
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                aria-label="Abflugort"
              />
            </Field>

            {/* Swap */}
            <div className="relative md:[grid-column:2/3] h-11">
              <button
                type="button"
                onClick={swap}
                aria-label="Von und Nach tauschen"
                className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200 bg-white p-2 shadow-sm transition hover:bg-zinc-50"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </button>
            </div>

            <Field className="md:[grid-column:3/4]" label="Nach">
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Zielflughafen oder Stadt"
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                aria-label="Zielort"
              />
            </Field>

            <Field className="md:[grid-column:4/5]" label="Hinflug">
              <input
                type="date"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
            </Field>

            <Field className="md:[grid-column:5/6]" label="Rückflug">
              <input
                type="date"
                value={ret}
                onChange={(e) => setRet(e.target.value)}
                disabled={tripType === 'oneway'}
                className="w-full bg-transparent text-sm outline-none disabled:cursor-not-allowed"
              />
            </Field>

            <div className="md:[grid-column:6/7]">
              <TravellersCabin
                value={{ trav, cabin }}
                onChange={(v) => {
                  setTrav(v.trav)
                  setCabin(v.cabin)
                }}
                label={paxLabel}
              />
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

          {/* Options row – unten, linksbündig */}
          <div
            className={cn(
              'mt-3 grid grid-cols-1 items-center gap-3',
              'md:[grid-template-columns:1.35fr_2.5rem_1.35fr_0.95fr_0.95fr_1.35fr_auto]'
            )}
          >
            <div className="flex items-center gap-4 md:[grid-column:1/6]">
              <Toggle label="Nur Direktverbindung" checked={directOnly} onCheckedChange={setDirectOnly} />
              <Toggle label="+/− 3 Tage flexibel" checked={flexible} onCheckedChange={setFlexible} />
            </div>
          </div>
        </>
      ) : (
        /* Multicity bleibt wie gehabt */
        <div className="space-y-2">
          {legs.map((l, i) => (
            <div key={i} className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <Field className="md:col-span-4" label={`Strecke ${i + 1} – Von`}>
                <input
                  value={l.from}
                  onChange={(e) => updateLeg(i, { from: e.target.value })}
                  placeholder="Abflughafen oder Stadt"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                />
              </Field>
              <Field className="md:col-span-4" label="Nach">
                <input
                  value={l.to}
                  onChange={(e) => updateLeg(i, { to: e.target.value })}
                  placeholder="Zielflughafen oder Stadt"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                />
              </Field>
              <Field className="md:col-span-3" label="Datum">
                <input
                  type="date"
                  value={l.date}
                  onChange={(e) => updateLeg(i, { date: e.target.value })}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </Field>
              <div className="md:col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={() => removeLeg(i)}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={legs.length <= 2}
                  aria-label={`Strecke ${i + 1} entfernen`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <div>
            <button
              type="button"
              onClick={addLeg}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              <Plus className="h-4 w-4" /> Strecke hinzufügen
            </button>
          </div>
        </div>
      )}
    </form>
  )

  /* -------- leg helpers -------- */
  function addLeg() { setLegs((p) => [...p, { from: '', to: '', date: '' }]) }
  function removeLeg(i: number) { setLegs((p) => p.length > 2 ? p.filter((_, idx) => idx !== i) : p) }
  function updateLeg(i: number, patch: Partial<Leg>) {
    setLegs((p) => p.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }
}

/* ---------------------------- UI building blocks ---------------------------- */

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

function Segmented<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm">
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn('rounded-xl px-3 py-2 text-sm transition',
              active ? 'bg-zinc-900 font-semibold text-white' : 'text-zinc-700 hover:bg-zinc-100')}
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
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onCheckedChange(!checked)}
        onClick={() => onCheckedChange(!checked)}
        className={cn('relative h-6 w-11 rounded-full border transition',
          checked ? 'border-emerald-400 bg-emerald-400' : 'border-zinc-300 bg-zinc-200')}
      >
        <span className={cn('absolute top-1/2 -translate-y-1/2 transform rounded-full bg-white transition',
          checked ? 'right-1 h-4 w-4' : 'left-1 h-4 w-4')} />
      </span>
      <span className="text-sm text-zinc-700">{label}</span>
    </label>
  )
}

function TravellersCabin({
  value, onChange, label,
}: { value: { trav: Trav; cabin: CabinClass }; onChange: (v: { trav: Trav; cabin: CabinClass }) => void; label: string }) {
  const [open, setOpen] = useState(false)
  const { trav, cabin } = value

  function setTrav(patch: Partial<Trav>) { onChange({ trav: { ...trav, ...patch }, cabin }) }
  function setCabin(c: CabinClass) { onChange({ trav, cabin: c }) }

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
        <div role="dialog" aria-label="Reisende & Kabine" className="absolute right-0 z-[1001] mt-2 w-[28rem] max-w-[95vw] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
          <div className="grid grid-cols-3 gap-3">
            <PaxCounter label="Erwachsene" subtitle="ab 12 J." value={trav.adults} min={1} onChange={(v) => setTrav({ adults: v })} />
            <PaxCounter label="Kinder" subtitle="2–11 J." value={trav.children} onChange={(v) => setTrav({ children: v })} />
            <PaxCounter label="Kleinkinder" subtitle="unter 2 J." value={trav.infants} onChange={(v) => setTrav({ infants: v })} />
          </div>

          <div className="mt-4">
            <span className="mb-1 block text-xs font-medium text-zinc-500">Reiseklasse</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(['eco', 'premium', 'business', 'first'] as CabinClass[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCabin(c)}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-sm capitalize',
                    cabin === c
                      ? 'border-zinc-900 bg-zinc-900 font-semibold text-white'
                      : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  )}
                >
                  {c === 'eco' ? 'Economy' : c === 'premium' ? 'Premium Economy' : c}
                </button>
              ))}
            </div>
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

function PaxCounter({
  label, subtitle, value, onChange, min = 0, max = 9,
}: { label: string; subtitle?: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <div className="text-sm font-medium">{label}</div>
      {subtitle && <div className="text-xs text-zinc-500">{subtitle}</div>}
      <div className="mt-2 flex items-center justify-between">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="rounded-lg border border-zinc-200 px-2 py-1 hover:bg-zinc-50" aria-label={`${label} verringern`}>
          <Minus className="h-4 w-4" />
        </button>
        <div className="w-8 text-center text-sm">{value}</div>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="rounded-lg border border-zinc-200 px-2 py-1 hover:bg-zinc-50" aria-label={`${label} erhöhen`}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
