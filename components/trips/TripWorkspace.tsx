'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
  WalletCards,
} from 'lucide-react'

import {
  createTripPlanItem,
  getGuestTrip,
  saveGuestTrip,
} from '@/lib/trips/guest-store'
import { cn } from '@/lib/utils'
import type { GuestTrip } from '@/types/trips'

const fullDateFormatter = new Intl.DateTimeFormat('de-CH', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const shortDateFormatter = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

function dateFromIso(value: string) {
  return new Date(`${value}T00:00:00Z`)
}

function formatFullDate(value: string) {
  return fullDateFormatter.format(dateFromIso(value))
}

function formatShortDate(value: string) {
  return shortDateFormatter.format(dateFromIso(value))
}

function formatMoney(value?: number) {
  if (value === undefined) return 'Noch offen'
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    maximumFractionDigits: 0,
  }).format(value)
}

type TripWorkspaceProps = {
  tripId: string
}

export default function TripWorkspace({ tripId }: TripWorkspaceProps) {
  const [trip, setTrip] = React.useState<GuestTrip | null>(null)
  const [ready, setReady] = React.useState(false)
  const [activeDayId, setActiveDayId] = React.useState('')
  const [title, setTitle] = React.useState('')
  const [time, setTime] = React.useState('')
  const [note, setNote] = React.useState('')
  const [formOpen, setFormOpen] = React.useState(false)

  React.useEffect(() => {
    const storedTrip = getGuestTrip(tripId)
    setTrip(storedTrip)
    setActiveDayId(storedTrip?.days[0]?.id ?? '')
    setReady(true)
  }, [tripId])

  const activeDay = React.useMemo(
    () => trip?.days.find((day) => day.id === activeDayId) ?? trip?.days[0],
    [activeDayId, trip]
  )

  const plannedItemCount = React.useMemo(
    () => trip?.days.reduce((total, day) => total + day.items.length, 0) ?? 0,
    [trip]
  )

  const persist = (nextTrip: GuestTrip) => {
    const saved = saveGuestTrip(nextTrip)
    setTrip(saved)
  }

  const addItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!trip || !activeDay || !title.trim()) return

    const nextTrip = {
      ...trip,
      days: trip.days.map((day) =>
        day.id === activeDay.id
          ? { ...day, items: [...day.items, createTripPlanItem(title, note, time)] }
          : day
      ),
    }

    persist(nextTrip)
    setTitle('')
    setTime('')
    setNote('')
    setFormOpen(false)
  }

  const removeItem = (dayId: string, itemId: string) => {
    if (!trip) return
    persist({
      ...trip,
      days: trip.days.map((day) =>
        day.id === dayId
          ? { ...day, items: day.items.filter((item) => item.id !== itemId) }
          : day
      ),
    })
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="h-48 animate-pulse rounded-[30px] bg-white/70" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="h-96 animate-pulse rounded-[26px] bg-white/70" />
          <div className="h-96 animate-pulse rounded-[26px] bg-white/70" />
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
          <MapPin className="h-5 w-5" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-brand-800">
          Diese Reise ist auf diesem Gerät nicht verfügbar.
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-700">
          Gastreisen werden lokal im jeweiligen Browser gespeichert. Öffne deine Reisen oder erstelle einen neuen Entwurf.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/reisen" className="rounded-full border border-line-300 bg-white px-5 py-2.5 text-sm font-semibold text-brand-800">
            Meine Reisen
          </Link>
          <Link href="/planen" className="rounded-full bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white">
            Neue Reise
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-surface-75 pb-20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/reisen"
          className="-ml-2 inline-flex min-h-11 items-center gap-2 px-2 text-sm font-medium text-ink-800 transition hover:text-brand-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Meine Reisen
        </Link>

        <section className="mt-5 rounded-[30px] bg-brand-800 text-white shadow-[0_24px_70px_rgba(15,46,42,0.16)]">
          <div className="grid grid-cols-1 gap-7 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-ink-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Privat auf diesem Gerät
              </span>
              <h1 className="mt-5 break-words text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                {trip.title}
              </h1>
              <p className="mt-2 flex min-w-0 items-start gap-2 text-sm text-white/65">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words">
                  {trip.destination} · ab {trip.origin}
                </span>
              </p>
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                <CalendarDays className="h-4 w-4 text-ink-400" />
                <strong className="mt-2 block text-sm">{trip.days.length} Tage</strong>
                <span className="text-xs text-white/55">{formatShortDate(trip.startDate)} – {formatShortDate(trip.endDate)}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                <Users className="h-4 w-4 text-ink-400" />
                <strong className="mt-2 block text-sm">{trip.travelers}</strong>
                <span className="text-xs text-white/55">Reisende</span>
              </div>
              <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 sm:col-span-1">
                <WalletCards className="h-4 w-4 text-ink-400" />
                <strong className="mt-2 block text-sm">{formatMoney(trip.budget)}</strong>
                <span className="text-xs text-white/55">Budget</span>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
          <aside className="h-fit rounded-[26px] border border-black/5 bg-white p-3 lg:sticky lg:top-24">
            <div className="px-3 pb-3 pt-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700">Tagesplan</p>
              <p className="mt-1 text-sm text-ink-900">{plannedItemCount} Punkte geplant</p>
            </div>
            <div className="max-h-[520px] space-y-1 overflow-y-auto pr-1">
              {trip.days.map((day, index) => {
                const selected = activeDay?.id === day.id
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => {
                      setActiveDayId(day.id)
                      setFormOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
                      selected ? 'bg-surface-100 text-brand-800' : 'text-ink-800 hover:bg-surface-0'
                    )}
                  >
                    <span className="min-w-0">
                      <strong className="block text-sm font-semibold">Tag {index + 1}</strong>
                      <span className="mt-0.5 block text-xs opacity-70">{formatShortDate(day.date)}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-xs">
                      {day.items.length > 0 && day.items.length}
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>

          <section className="min-w-0 rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,46,42,0.06)] sm:p-7">
            {activeDay && (
              <>
                <div className="flex flex-col justify-between gap-4 border-b border-line-200 pb-5 sm:flex-row sm:items-center">
                  {/* Datum kann auf schmalen Breiten mehrzeilig werden */}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                      Tag {trip.days.findIndex((day) => day.id === activeDay.id) + 1}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
                      {formatFullDate(activeDay.date)}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormOpen((current) => !current)}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900"
                  >
                    <Plus className="h-4 w-4" />
                    Punkt hinzufügen
                  </button>
                </div>

                {formOpen && (
                  <form onSubmit={addItem} className="mt-5 rounded-2xl border border-line-200 bg-surface-0 p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,120px)_minmax(0,1fr)]">
                      <label className="grid min-w-0 gap-1.5 text-xs font-medium text-ink-900">
                        Uhrzeit
                        <input
                          type="time"
                          value={time}
                          onChange={(event) => setTime(event.target.value)}
                          className="h-11 w-full min-w-0 rounded-xl border border-line-200 bg-white px-3 text-base outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 pointer-fine:text-sm"
                        />
                      </label>
                      <label className="grid min-w-0 gap-1.5 text-xs font-medium text-ink-900">
                        Ort oder Aktivität
                        <input
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          required
                          maxLength={120}
                          autoFocus
                          placeholder="z. B. Tsukiji Outer Market"
                          className="h-11 w-full min-w-0 rounded-xl border border-line-200 bg-white px-3 text-base outline-none placeholder:text-ink-600 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 pointer-fine:text-sm"
                        />
                      </label>
                    </div>
                    <label className="mt-3 grid min-w-0 gap-1.5 text-xs font-medium text-ink-900">
                      Notiz, optional
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={2}
                        maxLength={500}
                        placeholder="Reservierung, Treffpunkt oder persönliche Notiz"
                        className="w-full min-w-0 rounded-xl border border-line-200 bg-white px-3 py-2.5 text-base outline-none placeholder:text-ink-600 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 pointer-fine:text-sm"
                      />
                    </label>
                    <div className="mt-3 flex justify-end gap-2">
                      <button type="button" onClick={() => setFormOpen(false)} className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-ink-800 hover:bg-white">
                        Abbrechen
                      </button>
                      <button type="submit" className="inline-flex min-h-11 items-center rounded-full bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">
                        Speichern
                      </button>
                    </div>
                  </form>
                )}

                {activeDay.items.length === 0 ? (
                  <div className="py-14 text-center">
                    <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface-100 text-brand-600">
                      <CalendarDays className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold text-brand-800">Dieser Tag gehört dir.</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-700">
                      Füge einen Ort, eine Aktivität oder einfach freie Zeit hinzu. Jetnity ordnet alles chronologisch.
                    </p>
                  </div>
                ) : (
                  <ol className="mt-5 space-y-3">
                    {activeDay.items.map((item) => (
                      <li key={item.id} className="group flex gap-4 rounded-2xl border border-line-200 p-4 transition hover:border-line-300">
                        <span className="mt-0.5 flex h-9 min-w-9 items-center justify-center rounded-xl bg-surface-50 text-brand-600">
                          {item.time ? <Clock3 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          {item.time && <span className="text-xs font-semibold text-brand-600">{item.time}</span>}
                          <strong className="block break-words text-sm font-semibold text-brand-800">{item.title}</strong>
                          {item.note && <span className="mt-1 block break-words text-xs leading-5 text-ink-700">{item.note}</span>}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(activeDay.id, item.id)}
                          aria-label={`${item.title} entfernen`}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-600 opacity-70 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100 pointer-fine:h-9 pointer-fine:w-9"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            )}
          </section>

          <aside className="h-fit space-y-4 lg:sticky lg:top-24">
            <section className="rounded-[24px] border border-black/5 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700">Reiseprofil</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-700">Tempo</dt>
                  <dd className="font-semibold capitalize text-brand-800">{trip.pace}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-ink-700">Interessen</dt>
                  <dd className="min-w-0 break-words text-right font-semibold text-brand-800">
                    {trip.interests.length ? trip.interests.join(', ') : 'Noch offen'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-[24px] bg-surface-100 p-5 text-brand-800">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-brand-600">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <h2 className="mt-4 text-base font-semibold">Nächster sinnvoller Schritt</h2>
              <p className="mt-2 text-xs leading-5 text-ink-800">
                Plane zuerst die wichtigsten Übernachtungsorte. Angebote und Einreisehinweise werden anschließend passend zur Reise ergänzt.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
