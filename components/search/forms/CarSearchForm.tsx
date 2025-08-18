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

  // Datums-/Zeitwerte
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
  const driverLabel = useMemo(() => `Fahrer: ${age} Jahre`, [age])

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

    onSubmit?.(payload)

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

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/95 p-4 text-[#0c1930] shadow-inner md:p-5">
      {/* Top row: Pickup | Dropoff | Abhol-Datum | Abhol-Zeit | Rückgabe-Datum | Rückgabe-Zeit | Suchen */}
      <div
        className={cn(
          'grid grid-cols-1 items-end gap-3',
          'md:[grid-template-columns:1.4fr_1.4fr_0.95fr_0.75fr_0.95fr_0.75fr_auto]'
        )}
      >
        <Field className="md:[grid-column:1/2]" label="Abholort">
          <MapPin className="h-4 w-4 opacity-60" />
          <input
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            placeholder="Flughafen oder Stadt"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            aria-label="Abholort"
          />
        </Field>

        <Field className="md:[grid-column:2/3]" label="Rückgabeort">
          <MapPin className={cn('h-4 w-4', sameLoc ? 'opacity-30' : 'opacity-60')} />
          <input
            value={drop}
            onChange={(e) => setDrop(e.target.value)}
            placeholder={sameLoc ? 'gleich wie Abholort' : 'Flughafen oder Stadt'}
            disabled={sameLoc}
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed"
            aria-label="Rückgabeort"
          />
        </Field>

        <Field className="md:[grid-column:3/4]" label="Abholung – Datum">
          <input
            type="date"
            value={dateOut}
            onChange={(e) => {
              setDateOut(e.target.value)
              if (dateBack && new Date(e.target.value) > new Date(dateBack)) {
                setDateBack(e.target.value)
              }
            }}
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>

        <Field className="md:[grid-column:4/5]" label="Abholung – Zeit">
          <input
            type="time"
            value={timeOut}
            onChange={(e) => setTimeOut(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>

        <Field className="md:[grid-column:5/6]" label="Rückgabe – Datum">
          <input
            type="date"
            value={dateBack}
            min={dateOut || undefined}
            onChange={(e) => setDateBack(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>

        <Field className="md:[grid-column:6/7]" label="Rückgabe – Zeit">
          <input
            type="time"
            value={timeBack}
            onChange={(e) => setTimeBack(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>

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

      {/* Secondary row: Same location + Driver age */}
      <div
        className={cn(
          'mt-3 grid grid-cols-1 items-center gap-3',
          'md:[grid-template-columns:1.4fr_1.4fr_0.95fr_0.75fr_0.95fr_0.75fr_auto]'
        )}
      >
        <div className="md:[grid-column:1/4]">
          <PillToggle checked={sameLoc} onChange={setSameLoc} label="Rückgabe am selben Ort" />
        </div>
        <div className="md:[grid-column:4/7]">
          <DriverAge value={age} onChange={setAge} label={driverLabel} />
        </div>
      </div>
    </form>
  )
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

function PillToggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-xl border px-3 text-sm font-medium transition',
        checked ? 'border-zinc-800 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50'
      )}
      aria-pressed={checked}
    >
      {label}
    </button>
  )
}

function DriverAge({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [open, setOpen] = useState(false)
  function dec() { onChange(Math.max(18, value - 1)) }
  function inc() { onChange(Math.min(80, value + 1)) }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 text-left text-sm transition hover:bg-zinc-50"
        aria-haspopup="dialog" aria-expanded={open}
      >
        <span>{label}</span>
        <ChevronDown className="h-4 w-4 opacity-60" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Fahreralter"
          className="absolute z-[1001] mt-2 w-[20rem] max-w-[95vw] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Alter des Fahrers</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={dec} className="rounded-lg border border-zinc-200 px-2 py-1 hover:bg-zinc-50" aria-label="Weniger">
                <Minus className="h-4 w-4" />
              </button>
              <div className="w-10 text-center">{value}</div>
              <button type="button" onClick={inc} className="rounded-lg border border-zinc-200 px-2 py-1 hover:bg-zinc-50" aria-label="Mehr">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="mt-2 text-xs text-zinc-500">Viele Vermieter verlangen ein Mindestalter von 21–25 Jahren.</p>

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
