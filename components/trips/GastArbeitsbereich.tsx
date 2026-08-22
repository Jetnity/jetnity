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

import type { ActivityOptionSichtbar } from '@/lib/activities/client-sicht'
import { alsActivityMomentaufnahme } from '@/lib/activities/uebernahme'
import type { FlugOptionSichtbar } from '@/lib/flights/client-sicht'
import { alsFlugMomentaufnahme } from '@/lib/flights/uebernahme'
import type { HotelOptionSichtbar } from '@/lib/hotels/client-sicht'
import { hotelZeitraumAusEtappe } from '@/lib/hotels/reisegraph'
import { alsHotelMomentaufnahme } from '@/lib/hotels/uebernahme'
import {
  gastAktivitaetUebernehmen,
  gastBuchungsstatusSetzen,
  gastFlugUebernehmen,
  gastHotelUebernehmen,
  gastMietwagenAnlegen,
  gastMobilitaetAnlegen,
  gastPlanpunktAnlegen,
  gastPlanpunktEntfernen,
  gastreiseEntfernen,
  gastreiseLadenNach,
} from '@/lib/trips/gastspeicher'
import { gastReadinessEntfernen, gastReadinessSetzen } from '@/lib/readiness/gast'
import type { PlanpunktFormular } from '@/lib/trips/schema'
import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import MobilitaetBereich from '@/components/trips/MobilitaetBereich'
import FlugSuche from '@/components/trips/FlugSuche'
import HotelBereich from '@/components/trips/HotelBereich'
import ReiseAenderung from '@/components/trips/ReiseAenderung'
import TripWorkspace from '@/components/trips/TripWorkspace'
import type { Trip } from '@/types/trips'

export default function GastArbeitsbereich({ tripId }: { tripId: string }) {
  const router = useRouter()
  const [reise, setReise] = React.useState<Trip | null>(null)
  const [geladen, setGeladen] = React.useState(false)
  const [speicherfehler, setSpeicherfehler] = React.useState('')

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
   *
   * Weitergeleitet wird erst, wenn der Entwurf bestätigt weg ist. Sonst zeigte
   * die Liste ihn gleich wieder – und niemand wüsste, warum.
   */
  const verwerfen = () => {
    const sicher = window.confirm(
      `„${reise?.title ?? 'Dieser Entwurf'}" wird von diesem Gerät entfernt. ` +
        'Ohne Konto lässt er sich nicht wiederherstellen.',
    )
    if (!sicher) return

    try {
      gastreiseEntfernen()
    } catch (fehler) {
      setSpeicherfehler(
        fehler instanceof Error
          ? fehler.message
          : 'Der Entwurf konnte auf diesem Gerät nicht entfernt werden.',
      )
      return
    }

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
      onReadinessSetzen={async (eingabe) => {
        if (!reise) return 'Diese Reise ist auf diesem Gerät nicht mehr vorhanden.'
        try {
          setReise(gastReadinessSetzen(reise, eingabe))
          return null
        } catch (fehler) {
          return fehler instanceof Error ? fehler.message : 'Die Vorbereitung konnte nicht gespeichert werden.'
        }
      }}
      onReadinessEntfernen={async (clientRef) => {
        if (!reise) return 'Diese Reise ist auf diesem Gerät nicht mehr vorhanden.'
        try {
          setReise(gastReadinessEntfernen(reise, clientRef))
          return null
        } catch (fehler) {
          return fehler instanceof Error ? fehler.message : 'Die Vorbereitung konnte nicht entfernt werden.'
        }
      }}
      onBuchungsstatus={async (itemId, gebucht) => {
        if (!reise) return 'Diese Reise ist auf diesem Gerät nicht mehr vorhanden.'
        try {
          setReise(gastBuchungsstatusSetzen(reise, itemId, gebucht))
          return null
        } catch (fehler) {
          return fehler instanceof Error
            ? fehler.message
            : 'Der Buchungsstatus konnte nicht gespeichert werden.'
        }
      }}
      aenderung={
        <ReiseAenderung
          reise={reise}
          quelle="guest"
          onGespeichert={(aktualisiert) => aktualisiert && setReise(aktualisiert)}
        />
      }
      flugsuche={
        <FlugSuche
          reise={reise}
          tagId={reise.days[0]?.id ?? null}
          onUebernehmen={async (tagId, option: FlugOptionSichtbar) => {
            const aufnahme = alsFlugMomentaufnahme(option)
            if (!aufnahme) return 'Diese Flugoption ist unvollständig.'
            try {
              setReise(gastFlugUebernehmen(reise, aufnahme, tagId))
              return null
            } catch (fehler) {
              return fehler instanceof Error
                ? fehler.message
                : 'Der Flug konnte nicht in die Reise übernommen werden.'
            }
          }}
        />
      }
      hotelsuche={
        <HotelBereich
          reise={reise}
          onUebernehmen={async (etappe, option: HotelOptionSichtbar, _zeitraum, dayId) => {
            const zeitraum = hotelZeitraumAusEtappe(reise, etappe)
            if (!zeitraum) return 'Für diese Etappe fehlt ein belastbarer Zeitraum.'
            const aufnahme = alsHotelMomentaufnahme(option, zeitraum)
            if (!aufnahme) return 'Diese Hoteloption ist unvollständig.'
            try {
              setReise(gastHotelUebernehmen(reise, aufnahme, etappe.id, dayId))
              return null
            } catch (fehler) {
              return fehler instanceof Error
                ? fehler.message
                : 'Das Hotel konnte nicht in die Reise übernommen werden.'
            }
          }}
        />
      }
      mobilitaetssuche={
        <MobilitaetBereich
          reise={reise}
          ohneTag={reise.ohneTag}
          onBuchungsstatus={async (itemId, gebucht) => {
            if (!reise) return 'Diese Reise ist auf diesem Gerät nicht mehr vorhanden.'
            try {
              setReise(gastBuchungsstatusSetzen(reise, itemId, gebucht))
              return null
            } catch (fehler) {
              return fehler instanceof Error
                ? fehler.message
                : 'Der Buchungsstatus konnte nicht gespeichert werden.'
            }
          }}
          onManuellAnlegen={async (eingabe) => {
            if (!reise) return 'Diese Reise ist auf diesem Gerät nicht mehr vorhanden.'
            try {
              setReise(gastMobilitaetAnlegen(reise, eingabe))
              return null
            } catch (fehler) {
              return fehler instanceof Error
                ? fehler.message
                : 'Die Verbindung konnte nicht gespeichert werden.'
            }
          }}
          onMietwagenAnlegen={async (eingabe) => {
            if (!reise) return 'Diese Reise ist auf diesem Gerät nicht mehr vorhanden.'
            try {
              setReise(gastMietwagenAnlegen(reise, eingabe))
              return null
            } catch (fehler) {
              return fehler instanceof Error
                ? fehler.message
                : 'Der Mietwagen konnte nicht gespeichert werden.'
            }
          }}
        />
      }
      aktivitaetensuche={
        <AktivitaetenBereich
          reise={reise}
          onUebernehmen={async (etappe, tag, option: ActivityOptionSichtbar) => {
            const aufnahme = alsActivityMomentaufnahme(option, tag.dayDate)
            if (!aufnahme) return 'Diese Aktivitätsoption ist unvollständig.'
            try {
              setReise(gastAktivitaetUebernehmen(reise, aufnahme, etappe.id, tag.id))
              return null
            } catch (fehler) {
              return fehler instanceof Error
                ? fehler.message
                : 'Die Aktivität konnte nicht in die Reise übernommen werden.'
            }
          }}
        />
      }
      ohneTag={reise.ohneTag}
      kopfzeile={
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 text-xs leading-5 text-white/65">
              Ohne Konto lässt sich eine Reise planen. Verwirf diesen Entwurf, um mit einem anderen zu
              beginnen.
            </p>
            <button
              type="button"
              onClick={verwerfen}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-2 text-sm font-medium text-white/70 transition hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
              Entwurf verwerfen
            </button>
          </div>
          {speicherfehler && (
            <p
              role="alert"
              className="rounded-2xl bg-white/10 px-4 py-2.5 text-xs leading-5 text-white"
            >
              {speicherfehler}
            </p>
          )}
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
