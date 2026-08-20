'use client'

// components/trips/TripPlanner.tsx
//
// Das Formular, aus dem eine Reise entsteht.
//
// Es hat zwei Ausgänge, und der Unterschied ist die Ablage, nicht das Formular:
//
//   · Ohne Konto entsteht die Reise im `localStorage`. Genau eine – die
//     Produktregel steht in `lib/trips/gastspeicher.ts` und wird dort
//     durchgesetzt, nicht hier.
//   · Mit Konto entsteht sie in der Datenbank, über `public.reise_anlegen()`.
//
// Beide Wege schicken dieselbe geprüfte Eingabe. Die Prüfung selbst liegt in
// `lib/trips/schema.ts`: Dieselben Bedingungen gelten im Browser, in der Server
// Action und in der Datenbank, und formuliert sind sie einmal.
//
// `clientRef` entsteht beim ersten Absenden und bleibt, bis das Formular
// verlassen wird. Dadurch ist ein zweiter Anlauf nach einem Netzwerkabbruch
// derselbe Vorgang und keine zweite Reise.

import * as React from 'react'
import type { Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CalendarDays,
  Check,
  Cloud,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react'

import OrtSuche from '@/components/places/OrtSuche'
import { reiseorteBestaetigen } from '@/lib/places/aktionen'
import { reiseortePflicht, type OrtAuswahl } from '@/lib/places/auswahl'
import { reiseAnlegen } from '@/lib/trips/aktionen'
import { INTERESSE_BEZEICHNUNG, TEMPO_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import {
  GastreiseBestehtFehler,
  SpeicherFehler,
  gastreiseAnlegen,
  kennungErzeugen,
} from '@/lib/trips/gastspeicher'
import { GRENZEN, ersteMeldung, neueReiseSchema } from '@/lib/trips/schema'
import { cn } from '@/lib/utils'
import { TRIP_INTERESTS, TRIP_PACES, type TripInterest, type TripPace } from '@/types/trips'

type TripPlannerProps = {
  /** Kommt aus der Server-Komponente: `auth.getUser()` auf dem Server, nicht geraten. */
  angemeldet: boolean
  initialDestination?: string
  initialDestinationId?: string
  initialIdea?: string
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

function heuteIso() {
  const jetzt = new Date()
  const lokal = new Date(jetzt.getTime() - jetzt.getTimezoneOffset() * 60_000)
  return lokal.toISOString().slice(0, 10)
}

export default function TripPlanner({
  angemeldet,
  initialDestination = '',
  initialDestinationId = '',
  initialIdea = '',
}: TripPlannerProps) {
  const router = useRouter()
  const [destination, setDestination] = React.useState(initialDestination)
  const [destinationOrt, setDestinationOrt] = React.useState<OrtAuswahl | null>(
    initialDestinationId && initialDestination
      ? { id: initialDestinationId, name: initialDestination }
      : null,
  )
  const [origin, setOrigin] = React.useState('')
  const [originOrt, setOriginOrt] = React.useState<OrtAuswahl | null>(null)
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [travellers, setTravellers] = React.useState(2)
  const [budget, setBudget] = React.useState('')
  const [pace, setPace] = React.useState<TripPace>('balanced')
  const [interests, setInterests] = React.useState<TripInterest[]>([])
  const [travelWish, setTravelWish] = React.useState(initialIdea)
  const [meldung, setMeldung] = React.useState('')
  const [bestehendeReise, setBestehendeReise] = React.useState('')
  const [laeuft, setLaeuft] = React.useState(false)

  // Bleibt über einen erneuten Anlauf hinweg gleich. Das ist der ganze Zweck:
  // dieselbe Kennung, dieselbe Reise.
  const clientRef = React.useRef('')

  const interesseUmschalten = (interesse: TripInterest) => {
    setInterests((bisher) =>
      bisher.includes(interesse)
        ? bisher.filter((eintrag) => eintrag !== interesse)
        : [...bisher, interesse],
    )
  }

  const absenden = async (ereignis: React.FormEvent<HTMLFormElement>) => {
    ereignis.preventDefault()
    if (laeuft) return

    setMeldung('')
    setBestehendeReise('')

    if (!clientRef.current) clientRef.current = kennungErzeugen('trip')

    const auswahlFehler = reiseortePflicht({
      destination,
      destinationPlaceId: destinationOrt?.id,
      origin,
      originPlaceId: originOrt?.id,
    })
    if (auswahlFehler) {
      setMeldung(auswahlFehler)
      return
    }

    const geprueft = neueReiseSchema.safeParse({
      clientRef: clientRef.current,
      title: destinationOrt?.name ?? destination,
      destination: destinationOrt?.name ?? destination,
      destinationPlaceId: destinationOrt?.id,
      origin: originOrt?.name ?? origin,
      originPlaceId: originOrt?.id,
      startDate,
      endDate,
      travellers,
      currency: 'CHF',
      budgetAmount: budget === '' ? null : Number(budget),
      pace,
      interests,
      travelWish,
    })

    if (!geprueft.success) {
      setMeldung(ersteMeldung(geprueft.error))
      return
    }

    setLaeuft(true)

    const orte = await reiseorteBestaetigen({
      zielId: geprueft.data.destinationPlaceId,
      abreiseId: geprueft.data.originPlaceId,
    })
    if (!orte.ok) {
      setMeldung(orte.meldung)
      setLaeuft(false)
      return
    }

    if (angemeldet) {
      const ergebnis = await reiseAnlegen({
        ...geprueft.data,
        title: orte.ziel.name,
        destination: orte.ziel.name,
        destinationPlaceId: orte.ziel.id,
        origin: orte.abreise.name,
        originPlaceId: orte.abreise.id,
      })
      if (!ergebnis.ok) {
        setMeldung(ergebnis.meldung)
        setLaeuft(false)
        return
      }
      router.push(`/reisen/${ergebnis.wert}` as Route)
      return
    }

    try {
      const reise = gastreiseAnlegen(geprueft.data, orte)
      router.push(`/reisen/${reise.id}` as Route)
    } catch (fehler) {
      setLaeuft(false)
      if (fehler instanceof GastreiseBestehtFehler) {
        setBestehendeReise(fehler.bestehendeId)
        setMeldung(fehler.message)
        return
      }

      // Auch der Speicherfehler bleibt hier stehen: Kein `router.push` in einen
      // Arbeitsbereich, dessen Reise nirgends liegt.
      setMeldung(
        fehler instanceof SpeicherFehler
          ? fehler.message
          : 'Die Reise konnte auf diesem Gerät nicht gespeichert werden. Bitte prüfe den Browserspeicher.',
      )
    }
  }

  return (
    <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form
        onSubmit={absenden}
        className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_24px_80px_rgba(15,46,42,0.08)] sm:p-8"
      >
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <Sparkles className="h-3.5 w-3.5" />
            {angemeldet ? 'Reise in deinem Konto' : 'Privater Reiseentwurf'}
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-brand-900 sm:text-3xl">
            Deine Reise Schritt für Schritt.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-900 sm:text-base">
            Ein paar Angaben genügen. Du kannst jeden Teil später gemeinsam mit deinen Mitreisenden verfeinern.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className={fieldLabelClass}>
            Reiseziel
            <span className="relative block min-w-0">
              <MapPin className={fieldIconClass} aria-hidden="true" />
              <OrtSuche
                rolle="ziel"
                variante="field"
                value={destinationOrt}
                initialText={destination}
                onChange={(wert, roh) => {
                  setDestinationOrt(wert)
                  setDestination(wert?.name ?? roh)
                }}
                placeholder="z. B. Japan"
                inputClassName={`${fieldClass} pr-10`}
              />
            </span>
          </label>

          <label className={fieldLabelClass}>
            Abreise ab
            <span className="relative block min-w-0">
              <MapPin className={fieldIconClass} aria-hidden="true" />
              <OrtSuche
                rolle="abreise"
                variante="field"
                value={originOrt}
                onChange={(wert, roh) => {
                  setOriginOrt(wert)
                  setOrigin(wert?.name ?? roh)
                }}
                placeholder="z. B. Zürich"
                inputClassName={`${fieldClass} pr-10`}
              />
            </span>
          </label>

          <label className={fieldLabelClass}>
            Abreise
            <span className="relative block min-w-0">
              <CalendarDays className={fieldIconClass} aria-hidden="true" />
              <input
                type="date"
                min={heuteIso()}
                value={startDate}
                onChange={(ereignis) => {
                  setStartDate(ereignis.target.value)
                  if (endDate && ereignis.target.value > endDate) setEndDate('')
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
                min={startDate || heuteIso()}
                value={endDate}
                onChange={(ereignis) => setEndDate(ereignis.target.value)}
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
                max={GRENZEN.reisende}
                inputMode="numeric"
                value={travellers}
                onChange={(ereignis) =>
                  setTravellers(Math.max(1, Math.min(GRENZEN.reisende, Number(ereignis.target.value))))
                }
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
                onChange={(ereignis) => setBudget(ereignis.target.value)}
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
              const gewaehlt = pace === option
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={gewaehlt}
                  onClick={() => setPace(option)}
                  className={cn(
                    'min-w-0 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
                    gewaehlt
                      ? 'border-brand-600 bg-surface-50'
                      : 'border-line-200 bg-white hover:border-line-500',
                  )}
                >
                  <span className="flex items-center justify-between gap-2 text-sm font-semibold text-brand-800">
                    {TEMPO_BEZEICHNUNG[option].titel}
                    {gewaehlt && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-ink-700">
                    {TEMPO_BEZEICHNUNG[option].beschreibung}
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="mt-7">
          <legend className="text-sm font-medium text-brand-800">Was interessiert euch?</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {TRIP_INTERESTS.map((interesse) => {
              const gewaehlt = interests.includes(interesse)
              return (
                <button
                  key={interesse}
                  type="button"
                  aria-pressed={gewaehlt}
                  onClick={() => interesseUmschalten(interesse)}
                  className={cn(
                    'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
                    gewaehlt
                      ? 'border-brand-800 bg-brand-800 text-white'
                      : 'border-line-200 bg-white text-ink-900 hover:border-line-500',
                  )}
                >
                  {INTERESSE_BEZEICHNUNG[interesse]}
                </button>
              )
            })}
          </div>
        </fieldset>

        <label className="mt-7 grid min-w-0 gap-2 text-sm font-medium text-brand-800">
          Was ist dir bei dieser Reise besonders wichtig?
          <textarea
            value={travelWish}
            onChange={(ereignis) => setTravelWish(ereignis.target.value)}
            rows={4}
            maxLength={GRENZEN.reisewunsch}
            placeholder="Zum Beispiel: lokale Restaurants, wenig Hotelwechsel und zwei ruhige Tage am Meer."
            className="w-full min-w-0 resize-y rounded-2xl border border-line-200 bg-surface-0 px-4 py-3 text-base leading-6 outline-none transition placeholder:text-ink-600 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10"
          />
        </label>

        {meldung && (
          <div role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            <p>{meldung}</p>
            {bestehendeReise && (
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <Link
                  href={`/reisen/${bestehendeReise}` as Route}
                  className="font-semibold underline underline-offset-2"
                >
                  Entwurf öffnen
                </Link>
                <Link href="/register" className="font-semibold underline underline-offset-2">
                  Konto erstellen
                </Link>
              </p>
            )}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-line-200 pt-6 sm:flex-row sm:items-center">
          <p className="flex min-w-0 items-start gap-2 text-xs leading-5 text-ink-700">
            {angemeldet ? (
              <>
                <Cloud className="h-4 w-4 shrink-0 text-brand-600" />
                Diese Reise wird in deinem Konto gespeichert.
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 shrink-0 text-brand-600" />
                Dieser Entwurf bleibt zunächst nur in deinem Browser.
              </>
            )}
          </p>
          <button
            type="submit"
            disabled={laeuft}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-800 px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(21,58,51,0.18)] transition hover:-translate-y-0.5 hover:bg-brand-900 disabled:pointer-events-none disabled:opacity-60"
          >
            {laeuft ? 'Reise wird erstellt …' : 'Reise erstellen'}
            {!laeuft && <ArrowRight className="h-4 w-4" />}
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
          ].map(([nummer, titel, beschreibung]) => (
            <li key={nummer} className="grid grid-cols-[36px_1fr] gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-semibold text-ink-300">
                {nummer}
              </span>
              <span>
                <strong className="block text-sm font-semibold">{titel}</strong>
                <span className="mt-1 block text-xs leading-5 text-white/65">{beschreibung}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <p className="text-xs leading-5 text-white/70">
            {angemeldet
              ? 'Dieses Formular funktioniert ohne die intelligente Planung. Beide Wege führen zur gleichen Reise.'
              : 'Ohne Konto lässt sich eine Reise planen. Für mehrere gespeicherte Reisen und den Zugriff von jedem Gerät genügt eine Registrierung.'}
          </p>
        </div>
      </aside>
    </div>
  )
}
