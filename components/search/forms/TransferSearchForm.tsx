'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users2, ChevronDown } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

export default function TransferSearchForm() {
  const router = useRouter()
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [passengers, setPassengers] = useState(2)
  const [childSeat, setChildSeat] = useState(false)

  const canSubmit = pickup.trim().length >= 2 && dropoff.trim().length >= 2 && !!dateTime

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams({
      mode: 'transfer',
      pickup: pickup.trim(),
      dropoff: dropoff.trim(),
      dateTime,
      passengers: String(passengers),
      childSeat: childSeat ? '1' : '0',
    })
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-white/95 p-4 text-[#0c1930] shadow-inner md:p-5">
      {/* Top row: Abholung | Ziel | Datum & Zeit | Personen | Suchen */}
      <div
        className={cn(
          'grid grid-cols-1 items-end gap-3',
          'md:[grid-template-columns:1.4fr_1.4fr_1.2fr_1.1fr_auto]'
        )}
      >
        <Field label="Abholung" className="md:[grid-column:1/2]">
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            placeholder="Flughafen/Hotel/Adresse"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
          />
        </Field>

        <Field label="Ziel" className="md:[grid-column:2/3]">
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            placeholder="Hotel/Adresse"
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
          />
        </Field>

        <Field label="Datum & Zeit" className="md:[grid-column:3/4]">
          <input
            type="datetime-local"
            className="w-full bg-transparent text-sm outline-none"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
          />
        </Field>

        <Field label="Personen" className="md:[grid-column:4/5]">
          <div className="flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            <input
              type="number" min={1}
              className="h-11 w-full bg-transparent text-sm outline-none"
              value={passengers}
              onChange={(e) => setPassengers(Math.max(1, Number(e.target.value || 1)))}
            />
          </div>
        </Field>

        <div className="md:[grid-column:5/6]">
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

      {/* Secondary row: Kindersitz */}
      <div className="mt-3">
        <label className="inline-flex w-max items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <input type="checkbox" className="h-4 w-4"
                 checked={childSeat} onChange={(e) => setChildSeat(e.target.checked)} />
          <span className="text-sm">Kindersitz benötigt</span>
        </label>
      </div>
    </form>
  )
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs font-medium text-zinc-500">{label}</span>
      <div className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 shadow-sm">{children}</div>
    </label>
  )
}
