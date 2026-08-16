'use client'

import * as React from 'react'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react'

import { createGuestTrip } from '@/lib/trips/guest-store'
import { cn } from '@/lib/utils'
import {
  TRIP_INTERESTS,
  TRIP_PACES,
  type TripInterest,
  type TripPace,
} from '@/types/trips'

type TripPlannerProps = {
  initialDestination?: string
  initialIdea?: string
}

const paceLabels: Record<TripPace, { title: string; description: string }> = {
  ruhig: { title: 'Ruhig', description: 'Mehr Freiraum und Erholung' },
  ausgewogen: { title: 'Ausgewogen', description: 'Erlebnisse und freie Zeit' },
  intensiv: { title: 'Intensiv', description: 'Möglichst viel entdecken' },
}

/**
 * Feldgestaltung aller Eingaben dieses Formulars.
 * `min-w-0` ist notwendig, weil die Felder in Grid-Spuren liegen: ohne die
 * Angabe waechst die Spur auf die inhaltsbasierte Mindestbreite des nativen
 * Steuerelements, was auf schmalen Geraeten das Layout sprengt.
 */
const fieldClass =
  'h-12 w-full min-w-0 rounded-2xl border border-line-200 bg-surface-0 pl-10 pr-4 text-base ' +
  'outline-none transition placeholder:text-ink-600 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10'

/** Beschriftung mit Feld darunter; als Grid-Kind schrumpfbar. */
const fieldLabelClass = 'grid min-w-0 gap-2 text-sm font-medium text-brand-800'

const fieldIconClass =
  'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-700'

function todayIso() {
  const today = new Date()
  const local = new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

export default function TripPlanner({
  initialDestination = '',
  initialIdea = '',
}: TripPlannerProps) {
  const router = useRouter()
  const [destination, setDestination] = React.useState(initialDestination)
  const [origin, setOrigin] = React.useState('')
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [travelers, setTravelers] = React.useState(2)
  const [budget, setBudget] = React.useState('')
  const [pace, setPace] = React.useState<TripPace>('ausgewogen')
  const [interests, setInterests] = React.useState<TripInterest[]>([])
  const [travelWish, setTravelWish] = React.useState(initialIdea)
  const [error, setError] = React.useState('')
  const [isCreating, setIsCreating] = React.useState(false)

  const toggleInterest = (interest: TripInterest) => {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    )
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!destination.trim() || !origin.trim() || !startDate || !endDate) {
      setError('Bitte fülle Reiseziel, Abreiseort und Reisedaten aus.')
      return
    }

    if (endDate < startDate) {
      setError('Das Rückreisedatum muss nach dem Abreisedatum liegen.')
      return
    }

    const numericBudget = budget ? Number(budget) : undefined
    if (numericBudget !== undefined && (!Number.isFinite(numericBudget) || numericBudget < 0)) {
      setError('Bitte gib ein gültiges Budget ein.')
      return
    }

    setIsCreating(true)

    try {
      const trip = createGuestTrip({
        title: destination.trim(),
        destination: destination.trim(),
        origin: origin.trim(),
        startDate,
        endDate,
        travelers,
        pace,
        budget: numericBudget,
        interests,
        travelWish: travelWish.trim() || undefined,
      })

      router.push(`/reisen/${trip.id}` as Route)
    } catch {
      setError('Die Reise konnte auf diesem Gerät nicht gespeichert werden. Bitte prüfe den Browserspeicher.')
      setIsCreating(false)
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_24px_80px_rgba(15,46,42,0.08)] sm:p-8"
      >
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <Sparkles className="h-3.5 w-3.5" />
            Privater Reiseentwurf
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-brand-900 sm:text-4xl">
            Beginnen wir mit deiner Reise.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-900 sm:text-base">
            Ein paar Angaben genügen. Du kannst jeden Teil später gemeinsam mit deinen Mitreisenden verfeinern.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className={fieldLabelClass}>
            Reiseziel
            <span className="relative block min-w-0">
              <MapPin className={fieldIconClass} aria-hidden="true" />
              <input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                maxLength={120}
                placeholder="z. B. Japan"
                autoComplete="off"
                className={fieldClass}
              />
            </span>
          </label>

          <label className={fieldLabelClass}>
            Abreise ab
            <span className="relative block min-w-0">
              <MapPin className={fieldIconClass} aria-hidden="true" />
              <input
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                maxLength={120}
                placeholder="z. B. Zürich"
                autoComplete="address-level2"
                className={fieldClass}
              />
            </span>
          </label>

          <label className={fieldLabelClass}>
            Abreise
            <span className="relative block min-w-0">
              <CalendarDays className={fieldIconClass} aria-hidden="true" />
              <input
                type="date"
                min={todayIso()}
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value)
                  if (endDate && event.target.value > endDate) setEndDate('')
                }}
                className={fieldClass}
              />
            </span>
          </label>

          <label className={fieldLabelClass}>
            Rückreise
            <span className="relative block min-w-0">
              <CalendarDays className={fieldIconClass} aria-hidden="true" />
              <input
                type="date"
                min={startDate || todayIso()}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className={fieldClass}
              />
            </span>
          </label>

          <label className={fieldLabelClass}>
            Reisende
            <span className="relative block min-w-0">
              <Users className={fieldIconClass} aria-hidden="true" />
              <input
                type="number"
                min={1}
                max={20}
                inputMode="numeric"
                value={travelers}
                onChange={(event) => setTravelers(Math.max(1, Math.min(20, Number(event.target.value))))}
                className={fieldClass}
              />
            </span>
          </label>

          <label className={fieldLabelClass}>
            Ungefähres Gesamtbudget
            <span className="relative block min-w-0">
              <WalletCards className={fieldIconClass} aria-hidden="true" />
              <input
                type="number"
                min={0}
                step={100}
                inputMode="numeric"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder="CHF, optional"
                className={fieldClass}
              />
            </span>
          </label>
        </div>

        <fieldset className="mt-7">
          <legend className="text-sm font-medium text-brand-800">Reisetempo</legend>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {TRIP_PACES.map((option) => {
              const selected = pace === option
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPace(option)}
                  className={cn(
                    'min-w-0 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
                    selected
                      ? 'border-brand-600 bg-surface-50'
                      : 'border-line-200 bg-white hover:border-line-500'
                  )}
                >
                  <span className="flex items-center justify-between gap-2 text-sm font-semibold text-brand-800">
                    {paceLabels[option].title}
                    {selected && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-ink-700">
                    {paceLabels[option].description}
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="mt-7">
          <legend className="text-sm font-medium text-brand-800">Was interessiert euch?</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {TRIP_INTERESTS.map((interest) => {
              const selected = interests.includes(interest)
              return (
                <button
                  key={interest}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
                    selected
                      ? 'border-brand-800 bg-brand-800 text-white'
                      : 'border-line-200 bg-white text-ink-900 hover:border-line-500'
                  )}
                >
                  {interest}
                </button>
              )
            })}
          </div>
        </fieldset>

        <label className="mt-7 grid min-w-0 gap-2 text-sm font-medium text-brand-800">
          Was ist dir bei dieser Reise besonders wichtig?
          <textarea
            value={travelWish}
            onChange={(event) => setTravelWish(event.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Zum Beispiel: lokale Restaurants, wenig Hotelwechsel und zwei ruhige Tage am Meer."
            className="w-full min-w-0 resize-y rounded-2xl border border-line-200 bg-surface-0 px-4 py-3 text-base leading-6 outline-none transition placeholder:text-ink-600 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10"
          />
        </label>

        {error && (
          <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-line-200 pt-6 sm:flex-row sm:items-center">
          <p className="flex min-w-0 items-start gap-2 text-xs leading-5 text-ink-700">
            <ShieldCheck className="h-4 w-4 shrink-0 text-brand-600" />
            Dieser Entwurf bleibt zunächst nur in deinem Browser.
          </p>
          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-800 px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(21,58,51,0.18)] transition hover:-translate-y-0.5 hover:bg-brand-900 disabled:pointer-events-none disabled:opacity-60"
          >
            {isCreating ? 'Reise wird erstellt …' : 'Reise erstellen'}
            {!isCreating && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </form>

      <aside className="h-fit rounded-[28px] bg-brand-800 p-6 text-white lg:sticky lg:top-28">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">So geht es weiter</p>
        <ol className="mt-6 space-y-6">
          {[
            ['01', 'Entwurf anlegen', 'Deine Eckdaten werden zu einer übersichtlichen Reise.'],
            ['02', 'Gemeinsam verfeinern', 'Füge Tagespunkte, Buchungen und Mitreisende hinzu.'],
            ['03', 'Entspannt reisen', 'Später begleiten dich Live-Hinweise und wichtige Erinnerungen.'],
          ].map(([number, title, description]) => (
            <li key={number} className="grid grid-cols-[36px_1fr] gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-semibold text-ink-300">
                {number}
              </span>
              <span>
                <strong className="block text-sm font-semibold">{title}</strong>
                <span className="mt-1 block text-xs leading-5 text-white/65">{description}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <p className="text-xs leading-5 text-white/70">
            Für diesen Schritt wird kein kostenpflichtiger Dienst verwendet. Die intelligente Planung wird später transparent ergänzt.
          </p>
        </div>
      </aside>
    </div>
  )
}
