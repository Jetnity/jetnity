'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users2 } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

/* helpers */
const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')
type TransferSearchPayload = {
  pickup: string
  dropoff: string
  datetime: Date | null
  passengers: number
  childSeat: boolean
}
function strToDateTime(s: string | null): Date | null {
  if (!s) return null
  const d = new Date(s) // 'datetime-local' -> lokale Zeit
  return Number.isNaN(d.getTime()) ? null : d
}

export interface TransferSearchFormProps {
  onSubmit?: (params: TransferSearchPayload) => void
}

export default function TransferSearchForm({ onSubmit }: TransferSearchFormProps) {
  const router = useRouter()

  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [dateTime, setDateTime] = useState('') // YYYY-MM-DDTHH:mm
  const [passengers, setPassengers] = useState(2)
  const [childSeat, setChildSeat] = useState(false)

  const canSubmit =
    pickup.trim().length >= 2 &&
    dropoff.trim().length >= 2 &&
    !!dateTime &&
    passengers >= 1

  function submit(e: React.FormEvent) {
    e.preventDefault()

    const payload: TransferSearchPayload = {
      pickup,
      dropoff,
      datetime: strToDateTime(dateTime),
      passengers,
      childSeat,
    }

    // 1) Optionales Callback
    onSubmit?.(payload)

    // 2) Fallback: URL-Routing (wie vorher, unverändert)
    if (!onSubmit) {
      const params = new URLSearchParams({
        mode: 'transfer',
        pickup: pickup.trim(),
        dropoff: dropoff.trim(),
        dateTime,
        passengers: String(passengers),
        childSeat: String(childSeat),
      })
      router.push(`/search?${params.toString()}`)
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
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.3fr_1.3fr_1fr_auto]">
        {/* Abholung */}
        <Field label="Abholung">
          <input
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/60"
            placeholder="Flughafen/Hotel/Adresse"
            aria-label="Abholadresse"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
          />
        </Field>

        {/* Ziel */}
        <Field label="Ziel">
          <input
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/60"
            placeholder="Hotel/Adresse"
            aria-label="Zieladresse"
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
          />
        </Field>

        {/* Datum & Zeit */}
        <Field label="Datum & Zeit">
          <input
            type="datetime-local"
            className="h-11 w-full bg-transparent text-sm outline-none"
            aria-label="Datum und Zeit"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
          />
        </Field>

        {/* Personen + Suchen */}
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Field label="Personen">
            <Users2 className="h-4 w-4 opacity-80" />
            <input
              type="number"
              min={1}
              className="h-11 w-full bg-transparent text-sm outline-none"
              aria-label="Anzahl Personen"
              value={passengers}
              onChange={(e) => setPassengers(Math.max(1, Number(e.target.value || 1)))}
            />
          </Field>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'tap-target focus-ring inline-flex items-center justify-center gap-2 rounded-xl',
                'bg-primary px-5 text-primary-foreground font-semibold transition',
                'hover:brightness-105 active:translate-y-[1px]',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              <Search className="h-4 w-4" />
              Suchen
            </button>
          </div>
        </div>
      </div>

      {/* Kindersitz */}
      <label
        className="
          tap-target focus-ring mt-3 inline-flex w-max items-center gap-2
          rounded-xl border border-white/10 bg-white/10 px-4 py-3
        "
      >
        <input
          type="checkbox"
          className="focus-ring h-4 w-4 accent-current"
          checked={childSeat}
          onChange={(e) => setChildSeat(e.target.checked)}
          aria-label="Kindersitz benötigt"
        />
        <span className="text-sm">Kindersitz benötigt</span>
      </label>
    </form>
  )
}

/* UI-Bausteine */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
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
