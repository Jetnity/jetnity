'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users2, ChevronDown, Plus, Minus } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

/* ---------- helpers ---------- */
const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')
type Occupancy = { rooms: number; adults: number; children: number }

function strToDate(s: string | null): Date | null {
  if (!s) return null
  const d = new Date(`${s}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export interface HotelSearchFormProps {
  onSubmit?: (params: {
    destination: string
    checkin: Date | null
    checkout: Date | null
    occupancy: Occupancy
    flexible: boolean
  }) => void
}

export default function HotelSearchForm({ onSubmit }: HotelSearchFormProps) {
  const router = useRouter()

  const [destination, setDestination] = useState('')
  const [checkin, setCheckin] = useState('')  // YYYY-MM-DD
  const [checkout, setCheckout] = useState('')// YYYY-MM-DD
  const [flexible, setFlexible] = useState(false)
  const [occ, setOcc] = useState<Occupancy>({ rooms: 1, adults: 2, children: 0 })

  const occLabel = useMemo(() => {
    const guests = occ.adults + occ.children
    const gLabel = `${guests} ${guests === 1 ? 'Gast' : 'Gäste'}`
    const rLabel = `${occ.rooms} ${occ.rooms === 1 ? 'Zimmer' : 'Zimmer'}`
    return `${gLabel}, ${rLabel}`
  }, [occ])

  const canSubmit =
    destination.trim().length >= 2 &&
    !!checkin &&
    !!checkout &&
    new Date(checkin) <= new Date(checkout)

  function submit(e: React.FormEvent) {
    e.preventDefault()

    // 1) Rückwärtskompatibel: optionales onSubmit füttern
    onSubmit?.({
      destination,
      checkin: strToDate(checkin),
      checkout: strToDate(checkout),
      occupancy: occ,
      flexible,
    })

    // 2) Fallback: URL-Routing, wenn kein onSubmit gesetzt ist
    if (!onSubmit) {
      const p = new URLSearchParams()
      p.set('dest', destination.trim())
      p.set('checkin', checkin)
      p.set('checkout', checkout)
      p.set('rooms', String(occ.rooms))
      p.set('adults', String(occ.adults))
      p.set('children', String(occ.children))
      if (flexible) p.set('flex3', '1')
      router.push(`/search/hotel?${p.toString()}`)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/95 p-4 text-[#0c1930] shadow-inner md:p-5">
      {/* Fields */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        {/* Destination */}
        <Field className="md:col-span-6" label="Ziel / Unterkunft">
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Stadt, Region oder Hotel"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            aria-label="Ziel oder Unterkunft"
          />
        </Field>

        {/* Dates */}
        <Field className="md:col-span-3" label="Check-in">
          <input
            type="date"
            value={checkin}
            onChange={(e) => {
              setCheckin(e.target.value)
              // Falls Check-out vor Check-in steht, automatisch angleichen
              if (checkout && new Date(e.target.value) > new Date(checkout)) {
                setCheckout(e.target.value)
              }
            }}
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>
        <Field className="md:col-span-3" label="Check-out">
          <input
            type="date"
            value={checkout}
            onChange={(e) => setCheckout(e.target.value)}
            min={checkin || undefined}
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>

        {/* Occupancy popover */}
        <div className="md:col-span-6">
          <OccupancyPicker value={occ} onChange={setOcc} label={occLabel} />
        </div>

        {/* Flexible */}
        <div className="md:col-span-3 flex items-center">
          <Toggle label="+/− 3 Tage flexibel" checked={flexible} onCheckedChange={setFlexible} />
        </div>

        {/* Submit */}
        <div className="md:col-span-3">
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

/* ---------------------------- UI building blocks ---------------------------- */

function Field({
  label, className, children,
}: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs font-medium text-zinc-500">{label}</span>
      <div className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 shadow-sm">
        {children}
      </div>
    </label>
  )
}

function Toggle({
  label, checked, onCheckedChange,
}: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
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

function OccupancyPicker({
  value, onChange, label,
}: { value: { rooms: number; adults: number; children: number }; onChange: (v: Occupancy) => void; label: string }) {
  const [open, setOpen] = useState(false)
  const { rooms, adults, children } = value

  function patch(p: Partial<Occupancy>) { onChange({ ...value, ...p }) }

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
        <div role="dialog" aria-label="Gäste & Zimmer"
             className="absolute right-0 z-20 mt-2 w-[28rem] max-w-[95vw] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
          <div className="grid grid-cols-3 gap-3">
            <Counter label="Zimmer" value={rooms} min={1} max={9} onChange={(v) => patch({ rooms: v })} />
            <Counter label="Erwachsene" subtitle="ab 18 J." value={adults} min={1} max={9} onChange={(v) => patch({ adults: v })} />
            <Counter label="Kinder" subtitle="0–17 J." value={children} min={0} max={9} onChange={(v) => patch({ children: v })} />
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

function Counter({
  label, subtitle, value, onChange, min = 0, max = 9,
}: { label: string; subtitle?: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <div className="text-sm font-medium">{label}</div>
      {subtitle && <div className="text-xs text-zinc-500">{subtitle}</div>}
      <div className="mt-2 flex items-center justify-between">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
                className="rounded-lg border border-zinc-200 px-2 py-1 hover:bg-zinc-50" aria-label={`${label} verringern`}>
          <Minus className="h-4 w-4" />
        </button>
        <div className="w-8 text-center text-sm">{value}</div>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))}
                className="rounded-lg border border-zinc-200 px-2 py-1 hover:bg-zinc-50" aria-label={`${label} erhöhen`}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
