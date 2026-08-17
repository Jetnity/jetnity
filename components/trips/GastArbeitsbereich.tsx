'use client'

// components/trips/GastArbeitsbereich.tsx
//
// Der Arbeitsbereich einer Gastreise.
//
// Die Reise liegt im `localStorage`, und der `localStorage` existiert erst im
// Browser: Diese Komponente lädt sie deshalb im Effekt und nicht beim Rendern.
// Der Ladezustand ist echt und keine Verzierung – ohne ihn zeigte der erste
// Rahmen „Diese Reise gibt es nicht“, bevor er sie gefunden hat.

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CloudOff, MapPin, Trash2 } from 'lucide-react'

import {
  gastPlanpunktAnlegen,
  gastPlanpunktEntfernen,
  gastreiseEntfernen,
  gastreiseLadenNach,
} from '@/lib/trips/gastspeicher'
import type { PlanpunktFormular } from '@/lib/trips/schema'
import TripWorkspace from '@/components/trips/TripWorkspace'
import type { Trip } from '@/types/trips'

export default function GastArbeitsbereich({ tripId }: { tripId: string }) {
  const router = useRouter()
  const [reise, setReise] = React.useState<Trip | null>(null)
  const [geladen, setGeladen] = React.useState(false)

  React.useEffect(() => {
    setReise(gastreiseLadenNach(tripId))
    setGeladen(true)
  }, [tripId])

  const anlegen = async (tagId: string, eingabe: PlanpunktFormular) => {
    if (!reise) return 'Diese Reise ist auf diesem Gerät nicht mehr vorhanden.'
    try {
      setReise(gastPlanpunktAnlegen(reise, { ...eingabe, dayId: tagId }))
      return null
    } catch (fehler) {
      return fehler instanceof Error ? fehler.message : 'Der Punkt konnte nicht gespeichert werden.'
    }
  }

  const entfernen = async (_tagId: string, punktId: string) => {
    if (!reise) return 'Diese Reise ist auf diesem Gerät nicht mehr vorhanden.'
    try {
      setReise(gastPlanpunktEntfernen(reise, punktId))
      return null
    } catch (fehler) {
      return fehler instanceof Error ? fehler.message : 'Der Punkt konnte nicht entfernt werden.'
    }
  }

  /**
   * Verwirft den Entwurf.
   *
   * Für einen Gast ist das der einzige Weg zu einer anderen Reise: Ohne Konto
   * gilt genau eine aktive Gastreise. Ohne diesen Vorgang wäre die Regel eine
   * Sackgasse, aus der nur das Löschen des Browserspeichers herausführt.
   */
  const verwerfen = () => {
    const sicher = window.confirm(
      `„${reise?.title ?? 'Dieser Entwurf'}" wird von diesem Gerät entfernt. ` +
        'Ohne Konto lässt er sich nicht wiederherstellen.',
    )
    if (!sicher) return

    gastreiseEntfernen()
    router.replace('/reisen')
  }

  if (!geladen) {
    return (
      <div aria-busy="true" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="h-48 animate-pulse rounded-[30px] bg-white/70" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="h-96 animate-pulse rounded-[26px] bg-white/70" />
          <div className="h-96 animate-pulse rounded-[26px] bg-white/70" />
        </div>
      </div>
    )
  }

  if (!reise) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
          <MapPin className="h-5 w-5" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-brand-800">
          Diese Reise ist auf diesem Gerät nicht verfügbar.
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-700">
          Ohne Konto liegt ein Reiseentwurf nur im Browser, in dem er entstanden ist. Melde dich an, um
          deine Reisen auf jedem Gerät zu sehen.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/reisen"
            className="inline-flex min-h-11 items-center rounded-full border border-line-300 bg-white px-5 text-sm font-semibold text-brand-800"
          >
            Meine Reisen
          </Link>
          <Link
            href="/planen"
            className="inline-flex min-h-11 items-center rounded-full bg-brand-800 px-5 text-sm font-semibold text-white"
          >
            Neue Reise
          </Link>
        </div>
      </div>
    )
  }

  return (
    <TripWorkspace
      reise={reise}
      quelle="guest"
      onPunktAnlegen={anlegen}
      onPunktEntfernen={entfernen}
      kopfzeile={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 text-xs leading-5 text-white/65">
            Ohne Konto lässt sich eine Reise planen. Verwirf diesen Entwurf, um mit einem anderen zu
            beginnen.
          </p>
          <button
            type="button"
            onClick={verwerfen}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-medium text-white/85 transition hover:border-white/40 hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
            Entwurf verwerfen
          </button>
        </div>
      }
      hinweis={
        <p className="mt-5 flex items-start gap-3 rounded-2xl border border-line-200 bg-white px-4 py-3 text-sm leading-6 text-ink-800">
          <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          <span>
            Dieser Entwurf liegt nur in diesem Browser. Mit einem Konto wird er dauerhaft gespeichert und
            auf allen Geräten sichtbar –{' '}
            <Link href="/register" className="font-semibold text-brand-800 underline underline-offset-2">
              Konto erstellen
            </Link>{' '}
            oder{' '}
            <Link href="/login" className="font-semibold text-brand-800 underline underline-offset-2">
              anmelden
            </Link>
            . Deine Reise wird dabei übernommen.
          </span>
        </p>
      }
    />
  )
}
