'use client'

import * as Popover from '@radix-ui/react-popover'
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRightLeft, Users2, ChevronDown, Plus, Minus, X, ArrowUp, ArrowDown, History
} from 'lucide-react'
import { cn as _cn } from '@/lib/utils'
import { DateInput } from '@/components/ui/date-picker' // dein Popover-Calendar
import Combobox from '@/components/ui/combobox'   // async Airports-Combobox

/* ---------- helpers ---------- */
const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')
type TripType = 'oneway' | 'roundtrip' | 'multicity'
type CabinClass = 'eco' | 'premium' | 'business' | 'first'
type Trav = { adults: number; children: number; infants: number }
type Leg = { from: string; to: string; date: string } // UI hält Strings (YYYY-MM-DD)
type AirportOption = { label: string; value: string; description?: string }

const MAX_LEGS = 6
const LS_KEY = 'jetnity.flightForm.v2'
const LS_RECENTS = 'jetnity.flightRecents.v1'

function strToDate(s: string | null): Date | null {
  if (!s) return null
  const d = new Date(`${s}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function dateToStr(d?: Date | null): string {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function mapCabinToUrl(c: CabinClass) { return c === 'eco' ? 'economy' : c === 'premium' ? 'premium_economy' : c }
function isIataLike(s: string) { return /^[A-Za-z]{3}$/.test(s.trim()) }

/* -------- client cache for airports search -------- */
const airportsCache = new Map<string, AirportOption[]>()
const searchAbortRef = React.createRef<AbortController | null>()

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
  const [departure, setDeparture] = useState('')
  const [ret, setRet] = useState('')

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

  // UX
  const [errors, setErrors] = useState<string[]>([])
  const [showErrors, setShowErrors] = useState(false)
  const [recentRoutes, setRecentRoutes] = useState<Array<{ from: string; to: string }>>([])

  // Persist / Rehydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const s = JSON.parse(raw)
        if (s.tripType) setTripType(s.tripType)
        if (s.origin) setOrigin(s.origin)
        if (s.destination) setDestination(s.destination)
        if (s.departure) setDeparture(s.departure)
        if (s.ret) setRet(s.ret)
        if (Array.isArray(s.legs)) setLegs(s.legs)
        if (s.trav) setTrav(s.trav)
        if (s.cabin) setCabin(s.cabin)
        if (typeof s.directOnly === 'boolean') setDirectOnly(s.directOnly)
        if (typeof s.flexible === 'boolean') setFlexible(s.flexible)
      }
      const r = localStorage.getItem(LS_RECENTS)
      if (r) setRecentRoutes(JSON.parse(r))
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const state = { tripType, origin, destination, departure, ret, legs, trav, cabin, directOnly, flexible }
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)) } catch {}
  }, [tripType, origin, destination, departure, ret, legs, trav, cabin, directOnly, flexible])

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

  /* ---------- auto & validation ---------- */
  function swap() {
    setOrigin((prev) => {
      const f = destination
      setDestination(prev)
      return f
    })
  }

  // Auto-prefill Rückflug, wenn Roundtrip aktiviert wird
  useEffect(() => {
    if (tripType === 'roundtrip' && departure && !ret) {
      const d = strToDate(departure)
      if (d) setRet(dateToStr(addDays(d, 7)))
    }
    if (tripType === 'oneway') setRet('')
  }, [tripType, departure, ret])

  // Rückflug nie vor Hinflug
  useEffect(() => {
    const dOut = strToDate(departure)
    const dBack = strToDate(ret)
    if (tripType === 'roundtrip' && dOut && dBack && dBack < dOut) {
      setRet(dateToStr(addDays(dOut, 1)))
    }
  }, [tripType, departure, ret])

  // Passagier-Validierung: Babys ≤ Erwachsene
  useEffect(() => {
    const errs: string[] = []
    if (trav.infants > trav.adults) errs.push('Babys dürfen die Anzahl der Erwachsenen nicht übersteigen.')
    setErrors(errs)
  }, [trav])

  /* ---------- airports search (async, cached) ---------- */
  const searchAirports = React.useCallback(async (q: string): Promise<AirportOption[]> => {
    const key = q.trim().toLowerCase()
    if (!key) return []
    if (airportsCache.has(key)) return airportsCache.get(key)!

    // abort previous request
    if (searchAbortRef.current) {
      try { searchAbortRef.current.abort() } catch {}
    }
    const controller = new AbortController()
    searchAbortRef.current = controller

    try {
      const res = await fetch(`/api/search/airports?q=${encodeURIComponent(q)}`, {
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!res.ok) throw new Error('airport search failed')
      const data = (await res.json()) as AirportOption[]
      if (isIataLike(key)) {
        data.sort((a, b) => (a.value.toLowerCase() === key ? -1 : b.value.toLowerCase() === key ? 1 : 0))
      }
      airportsCache.set(key, data)
      return data
    } catch (err) {
      if ((err as any)?.name === 'AbortError') return []
      console.error('airport search error', err)
      return []
    } finally {
      // clear controller if it's still the same
      if (searchAbortRef.current === controller) searchAbortRef.current = null
    }
  }, [])

  /* ---------- recent routes ---------- */
  function pushRecentRoute(from: string, to: string) {
    if (!from || !to) return
    const next = [{ from, to }, ...recentRoutes.filter((r) => !(r.from === from && r.to === to))].slice(0, 8)
    setRecentRoutes(next)
    try { localStorage.setItem(LS_RECENTS, JSON.stringify(next)) } catch {}
  }

  // memoize submit to avoid new function on each render
  const submit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setShowErrors(true)
    if (errors.length || !canSubmit) return

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
      multiCityStops: tripType === 'multicity'
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

      pushRecentRoute(origin.trim(), destination.trim())
      router.push(`/search/flight?${p.toString()}`)
    }
  }, [tripType, origin, destination, departure, ret, legs, trav, cabin, directOnly, flexible, errors, canSubmit, onSubmit, router])

  /* ------------------------------- UI ------------------------------- */

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/95 p-4 text-[#0c1930] shadow-inner md:p-5" noValidate>
      {/* TripType + Recents */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Segmented<TripType>
          value={tripType}
          onChange={setTripType}
          options={[
            { value: 'roundtrip', label: 'Hin- & Rückflug' },
            { value: 'oneway', label: 'Nur Hinflug' },
            { value: 'multicity', label: 'Gabelflug' },
          ]}
        />
        {recentRoutes.length > 0 && tripType !== 'multicity' && (
          <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
            <History className="h-4 w-4" />
            <div className="flex flex-wrap gap-1">
              {recentRoutes.slice(0, 6).map((r, i) => (
                <button
                  key={`${r.from}-${r.to}-${i}`}
                  type="button"
                  onClick={() => { setOrigin(r.from); setDestination(r.to) }}
                  className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[11px] hover:bg-zinc-50"
                  aria-label={`Kürzlich: ${r.from} → ${r.to}`}
                  title={`${r.from} → ${r.to}`}
                >
                  {r.from} → {r.to}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Simple layouts */}
      {tripType !== 'multicity' ? (
        <>
          <div
            className={cn(
              'grid gap-3 items-end',
              // stabile Spalten, Button sprengt nicht mehr raus
              'md:grid-cols-[minmax(0,1.35fr)_2.5rem_minmax(0,1.35fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,1.35fr)_max-content]'
            )}
          >
            {/* From */}
            <Field className="md:[grid-column:1/2] min-w-0" label="Von" bare>
              <Combobox
                placeholder="Abflughafen oder Stadt"
                className="h-11 w-full"
                value={origin}
                onValueChange={setOrigin}
                onSearchOptions={searchAirports}
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

            {/* To */}
            <Field className="md:[grid-column:3/4] min-w-0" label="Nach" bare>
              <Combobox
                placeholder="Zielflughafen oder Stadt"
                className="h-11 w-full"
                value={destination}
                onValueChange={setDestination}
                onSearchOptions={searchAirports}
              />
            </Field>

            {/* Dates */}
            <Field className="md:[grid-column:4/5]" label="Hinflug">
              <DateInput
                value={strToDate(departure) ?? undefined}
                onChange={(d) => setDeparture(dateToStr(d))}
                className="w-full justify-start bg-transparent text-sm"
              />
            </Field>

            <Field className="md:[grid-column:5/6]" label="Rückflug">
              <DateInput
                value={strToDate(ret) ?? undefined}
                onChange={(d) => setRet(dateToStr(d))}
                disabled={tripType === 'oneway'}
                className="w-full justify-start bg-transparent text-sm"
              />
            </Field>

            {/* Pax & cabin */}
            <div className="md:[grid-column:6/7]">
              <TravellersCabin
                value={{ trav, cabin }}
                onChange={(v) => { setTrav(v.trav); setCabin(v.cabin) }}
                label={paxLabel}
                error={showErrors && errors.length ? errors.join(' ') : undefined}
              />
            </div>

            {/* CTA */}
            <div className="md:[grid-column:7/8] justify-self-end min-w-[8.5rem]">
              <button
                type="submit"
                disabled={!canSubmit || (showErrors && errors.length > 0)}
                className={cn(
                  'inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#0c1930] px-6 font-semibold text-white transition',
                  'hover:bg-[#102449] active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                Suchen
              </button>
            </div>
          </div>

          {/* Options */}
          <div
            className={cn(
              'mt-3 grid grid-cols-1 items-center gap-3 overflow-visible',
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
        /* Multicity */
        <div className="space-y-2">
          {legs.map((l, i) => (
            <div key={i} className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <Field className="md:col-span-4 min-w-0" label={`Strecke ${i + 1} – Von`} bare>
                <Combobox
                  placeholder="Abflughafen oder Stadt"
                  className="h-11 w-full"
                  value={l.from}
                  onValueChange={(v) => updateLeg(i, { from: v })}
                  onSearchOptions={searchAirports}
                />
              </Field>
              <Field className="md:col-span-4 min-w-0" label="Nach" bare>
                <Combobox
                  placeholder="Zielflughafen oder Stadt"
                  className="h-11 w-full"
                  value={l.to}
                  onValueChange={(v) => updateLeg(i, { to: v })}
                  onSearchOptions={searchAirports}
                />
              </Field>
              <Field className="md:col-span-2" label="Datum">
                <DateInput
                  value={strToDate(l.date) ?? undefined}
                  onChange={(d) => updateLeg(i, { date: dateToStr(d) })}
                  className="w-full justify-start bg-transparent text-sm"
                />
              </Field>

              <div className="md:col-span-2 flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => moveLeg(i, -1)}
                  className="inline-flex h-11 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"
                  disabled={i === 0}
                  aria-label={`Strecke ${i + 1} nach oben`}
                  title="Nach oben"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveLeg(i, +1)}
                  className="inline-flex h-11 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"
                  disabled={i === legs.length - 1}
                  aria-label={`Strecke ${i + 1} nach unten`}
                  title="Nach unten"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => duplicateLeg(i)}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
                  aria-label={`Strecke ${i + 1} duplizieren`}
                >
                  Duplizieren
                </button>
                <button
                  type="button"
                  onClick={() => removeLeg(i)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={legs.length <= 2}
                  aria-label={`Strecke ${i + 1} entfernen`}
                  title="Entfernen"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-500">Mindestens 2, maximal {MAX_LEGS} Strecken</div>
            <button
              type="button"
              onClick={addLeg}
              disabled={legs.length >= MAX_LEGS}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Strecke hinzufügen
            </button>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'inline-flex h-11 items-center justify-center rounded-xl bg-[#0c1930] px-6 font-semibold text-white transition',
                'hover:bg-[#102449] active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              Suchen
            </button>
          </div>
        </div>
      )}

      {/* Fehlerausgabe */}
      {showErrors && errors.length > 0 && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errors.map((e, i) => <div key={i}>• {e}</div>)}
        </div>
      )}
    </form>
  )

  /* -------- leg helpers -------- */
  function addLeg() { setLegs((p) => (p.length >= MAX_LEGS ? p : [...p, { from: '', to: '', date: '' }])) }
  function duplicateLeg(i: number) { setLegs((p) => (p.length >= MAX_LEGS ? p : [...p.slice(0, i + 1), { ...p[i] }, ...p.slice(i + 1)])) }
  function removeLeg(i: number) { setLegs((p) => (p.length > 2 ? p.filter((_, idx) => idx !== i) : p)) }
  function updateLeg(i: number, patch: Partial<Leg>) { setLegs((p) => p.map((l, idx) => (idx === i ? { ...l, ...patch } : l))) }
  function moveLeg(i: number, dir: -1 | 1) {
    setLegs((p) => {
      const j = i + dir
      if (j < 0 || j >= p.length) return p
      const copy = p.slice()
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })
  }
}

/* ---------------------------- UI building blocks ---------------------------- */

function Field({
  label, className, children, bare = false,
}: { label: string; className?: string; children: React.ReactNode; bare?: boolean }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs font-medium text-zinc-500">{label}</span>
      {bare ? (
        <div className="w-full">{children}</div>
      ) : (
        <div className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 shadow-sm">
          {children}
        </div>
      )}
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
        onKeyDown={(e: React.KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && onCheckedChange(!checked)}
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
  value, onChange, label, error,
}: {
  value: { trav: Trav; cabin: CabinClass }
  onChange: (v: { trav: Trav; cabin: CabinClass }) => void
  label: string
  error?: string
}) {
  const [open, setOpen] = useState(false)
  const { trav, cabin } = value

  function setTrav(patch: Partial<Trav>) { onChange({ trav: { ...trav, ...patch }, cabin }) }
  function setCabin(c: CabinClass) { onChange({ trav, cabin: c }) }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v: boolean) => !v)}
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-xl border bg-white px-3 text-left text-sm transition hover:bg-zinc-50',
          error ? 'border-red-300' : 'border-zinc-200'
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Users2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
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

          <div className="mt-4 flex justify-between">
            {error ? <div className="text-xs text-red-600">{error}</div> : <div />}
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
  const minusDisabled = value <= min
  const plusDisabled = value >= max
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <div className="text-sm font-medium">{label}</div>
      {subtitle && <div className="text-xs text-zinc-500">{subtitle}</div>}
      <div className="mt-2 flex items-center justify-between">
        <button type="button" onClick={() => !minusDisabled && onChange(value - 1)} className={cn('rounded-lg border px-2 py-1 hover:bg-zinc-50', minusDisabled ? 'border-zinc-200 opacity-50' : 'border-zinc-200')} aria-label={`${label} verringern`} disabled={minusDisabled}>
          <Minus className="h-4 w-4" />
        </button>
        <div className="w-8 text-center text-sm tabular-nums">{value}</div>
        <button type="button" onClick={() => !plusDisabled && onChange(value + 1)} className={cn('rounded-lg border px-2 py-1 hover:bg-zinc-50', plusDisabled ? 'border-zinc-200 opacity-50' : 'border-zinc-200')} aria-label={`${label} erhöhen`} disabled={plusDisabled}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
