'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, ChevronDown, Plus, Minus } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

/* ---------- helpers ---------- */
const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')
type CarSearchPayload = {
  pickup: string
  dropoff: string | null
  from: Date | null
  to: Date | null
  sameLocation: boolean
  driverAge: number
}

function toDate(dateStr: string | null, timeStr: string | null): Date | null {
  if (!dateStr || !timeStr) return null
  const d = new Date(`${dateStr}T${timeStr}:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export interface CarSearchFormProps {
  onSubmit?: (params: CarSearchPayload) => void
}

export default function CarSearchForm({ onSubmit }: CarSearchFormProps) {
  const router = useRouter()

  // Locations
  const [pickup, setPickup] = useState('')
  const [sameLoc, setSameLoc] = useState(true)
  const [drop, setDrop] = useState('')

  // Datums-/Zeitwerte (HTML inputs)
  const [dateOut, setDateOut] = useState('')
  const [timeOut, setTimeOut] = useState('')
  const [dateBack, setDateBack] = useState('')
  const [timeBack, setTimeBack] = useState('')

  // Fahrer
  const [age, setAge] = useState(30)

  const start = toDate(dateOut, timeOut)
  const end = toDate(dateBack, timeBack)

  const canSubmit =
    pickup.trim().length >= 2 &&
    !!start &&
    !!end &&
    end.getTime() > start.getTime()

  const dropComputed = sameLoc ? pickup : drop

  function submit(e: React.FormEvent) {
    e.preventDefault()

    const payload: CarSearchPayload = {
      pickup,
      dropoff: dropComputed?.trim() || null,
      from: start,
      to: end,
      sameLocation: sameLoc,
      driverAge: age,
    }

    // 1) Optionales Callback
    onSubmit?.(payload)

    // 2) Fallback: URL-Routing
    if (!onSubmit) {
      const p = new URLSearchParams()
      p.set('pickup', pickup.trim())
      p.set('drop', (dropComputed || '').trim())
      p.set('from', start!.toISOString())
      p.set('to', end!.toISOString())
      p.set('age', String(age))
      if (sameLoc) p.set('same', '1')
      router.push(`/search/car?${p.toString()}`)
    }
  }

  // Label für Fahrerinfo
  const driverLabel = useMemo(() => `Fahrer: ${age} Jahre`, [age])

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
        {/* Abholort */}
        <Field className="md:col-span-5" label="Abholort">
          <MapPin className="h-4 w-4 opacity-80" />
          <input
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            placeholder="Flughafen oder Stadt"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/60"
            aria-label="Abholort"
          />
        </Field>

        {/* gleicher Ort Toggle */}
        <div className="md:col-span-2 flex items-end">
          <PillToggle
            checked={sameLoc}
            onChange={setSameLoc}
            label="Rückgabe am selben Ort"
          />
        </div>

        {/* Rückgabeort */}
        <Field className="md:col-span-5" label="Rückgabeort">
          <MapPin className={cn('h-4 w-4', sameLoc ? 'opacity-30' : 'opacity-80')} />
          <input
            value={drop}
            onChange={(e) => setDrop(e.target.value)}
            placeholder={sameLoc ? 'gleich wie Abholort' : 'Flughafen oder Stadt'}
            disabled={sameLoc}
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/60 disabled:cursor-not-allowed"
            aria-label="Rückgabeort"
          />
        </Field>

        {/* Abholung: Datum/Zeit */}
        <Field className="md:col-span-3" label="Abholung – Datum">
          <input
            type="date"
            value={dateOut}
            onChange={(e) => {
              setDateOut(e.target.value)
              // falls Rückgabe vor Abholung – grob angleichen
              if (dateBack && new Date(e.target.value) > new Date(dateBack)) {
                setDateBack(e.target.value)
              }
            }}
            className="h-11 w-full bg-transparent text-sm outline-none"
          />
        </Field>
        <Field className="md:col-span-2" label="Abholung – Zeit">
          <input
            type="time"
            value={timeOut}
            onChange={(e) => setTimeOut(e.target.value)}
            className="h-11 w-full bg-transparent text-sm outline-none"
          />
        </Field>

        {/* Rückgabe: Datum/Zeit */}
        <Field className="md:col-span-3" label="Rückgabe – Datum">
          <input
            type="date"
            value={dateBack}
            min={dateOut || undefined}
            onChange={(e) => setDateBack(e.target.value)}
            className="h-11 w-full bg-transparent text-sm outline-none"
          />
        </Field>
        <Field className="md:col-span-2" label="Rückgabe – Zeit">
          <input
            type="time"
            value={timeBack}
            onChange={(e) => setTimeBack(e.target.value)}
            className="h-11 w-full bg-transparent text-sm outline-none"
          />
        </Field>

        {/* Fahreralter */}
        <div className="md:col-span-7">
          <DriverAge value={age} onChange={setAge} label={driverLabel} />
        </div>

        {/* Suchen */}
        <div className="md:col-span-5">
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

/* ---------------------------- UI building blocks ---------------------------- */

function Field({
  label, className, children,
}: { label: string; className?: string; children: React.ReactNode }) {
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

function PillToggle({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'tap-target focus-ring inline-flex items-center justify-center rounded-xl border px-3 text-sm font-medium transition',
        checked
          ? 'border-white/20 bg-white/20 text-white'
          : 'border-white/10 bg-white/10 text-white/90 hover:bg-white/15'
      )}
      aria-pressed={checked}
    >
      {label}
    </button>
  )
}

function DriverAge({
  value, onChange, label,
}: { value: number; onChange: (v: number) => void; label: string }) {
  const [open, setOpen] = useState(false)

  function dec() { onChange(Math.max(18, value - 1)) }
  function inc() { onChange(Math.min(80, value + 1)) }

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
        <span>{label}</span>
        <ChevronDown className="h-4 w-4 opacity-80" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Fahreralter"
          className="
            absolute z-20 mt-2 w-[20rem] max-w-[95vw]
            rounded-2xl border border-white/10 bg-[#0c1930]/95 p-4 text-white
            shadow-xl backdrop-blur-xl
          "
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Alter des Fahrers</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={dec}
                className="tap-target focus-ring rounded-lg border border-white/10 bg-white/10 px-2 hover:bg-white/15"
                aria-label="Weniger"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="w-10 text-center">{value}</div>
              <button
                type="button"
                onClick={inc}
                className="tap-target focus-ring rounded-lg border border-white/10 bg-white/10 px-2 hover:bg-white/15"
                aria-label="Mehr"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="mt-2 text-xs text-white/70">
            Viele Vermieter verlangen ein Mindestalter von 21–25 Jahren.
          </p>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="
                tap-target focus-ring inline-flex items-center justify-center
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
