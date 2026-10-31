'use client'

// components/trips/GastArbeitsbereich.tsx
//
// Der Arbeitsbereich einer Gastreise.
//
// Die Reise liegt im `localStorage`, und der `localStorage` existiert erst im
// Browser: Diese Komponente liest sie deshalb im Effekt und nicht beim Rendern.
// Der Ladezustand ist echt und keine Verzierung – ohne ihn zeigte der erste
// Rahmen „Diese Reise gibt es nicht“, bevor er sie gefunden hat.
//
// Unlesbare oder ungültige Bytes sind kein leerer Entwurf. Eine andere gültige
// Reise wird nicht eingesetzt. Wechselt die angeforderte Kennung, fällt der
// vorherige Entwurf vor dem nächsten Bild weg. Die Änderungsfunktionen darunter
// bleiben unverändert.

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CloudOff, MapPin, Trash2 } from 'lucide-react'

import type { ActivityOptionSichtbar } from '@/lib/activities/client-sicht'
import { alsActivityMomentaufnahme } from '@/lib/activities/uebernahme'
import { flugNachweisFehler } from '@/lib/flights/nachweis'
import type { HotelOptionSichtbar } from '@/lib/hotels/client-sicht'
import { hotelZeitraumAusEtappe } from '@/lib/hotels/reisegraph'
import { alsHotelMomentaufnahme } from '@/lib/hotels/uebernahme'
import GastCreateLink from '@/components/trips/GastCreateLink'
import {
  GastReiseAndere,
  GastReiseLesefehler,
  GastReiseLeseWarte,
  useGastLeseFokus,
} from '@/components/trips/GastReiseLesefehler'
import {
  gastArbeitsbereichBeobachten,
  gastArbeitsbereichDarfErstellen,
  type GastArbeitsbereichLesung,
} from '@/components/trips/gast-reise-lesezustand'
import {
  gastAktivitaetUebernehmen,
  gastBuchungsstatusSetzen,
  gastFlugRouteManuellSetzen,
  gastHotelUebernehmen,
  gastMietwagenAnlegen,
  gastMobilitaetAnlegen,
  gastPlanpunktAnlegen,
  gastPlanpunktBearbeiten,
  gastPlanpunktEntfernen,
  gastUnterkunftZeitraumSetzen,
  gastreiseEntfernen,
  aktiveV3GastreiseLesen,
} from '@/lib/trips/gastspeicher'
import { gastReadinessEntfernen, gastReadinessSetzen } from '@/lib/readiness/gast'
import { gastTravellerEntfernen, gastTravellerSetzen } from '@/lib/readiness/reisende-gast'
import type { PlanpunktFormular } from '@/lib/trips/schema'
import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import MobilitaetBereich from '@/components/trips/MobilitaetBereich'
import FlugSuche from '@/components/trips/FlugSuche'
import HotelBereich from '@/components/trips/HotelBereich'
import ReiseAenderung from '@/components/trips/ReiseAenderung'
import TripWorkspace from '@/components/trips/TripWorkspace'
import type { Trip } from '@/types/trips'

// Der Schreibstand hängt an der Setter-Identität, nicht an einem Hook.
// Die bestehenden Arbeitsbereich-Prüfungen rufen diese Funktion direkt auf
// und ersetzen nur useState/useEffect; ein zusätzlicher Hook hätte dort keinen Dispatcher.
const gastSchreibstand = new WeakMap<object, { tripId: string; basis: Trip | null; unaufgeloest: boolean }>()

function schreibstand(setzen: (graph: Trip | null) => void, tripId: string) {
  const vorhanden = gastSchreibstand.get(setzen)
  if (vorhanden && vorhanden.tripId === tripId) return vorhanden
  const neu = { tripId, basis: null as Trip | null, unaufgeloest: false }
  gastSchreibstand.set(setzen, neu)
  return neu
}

export default function GastArbeitsbereich({ tripId }: { tripId: string }) {
  const router = useRouter()
  const [reise, setReise] = React.useState<Trip | null>(null)
  const [lese, setLese] = React.useState<GastArbeitsbereichLesung>({ art: 'nicht_beobachtet' })
  const [bezogen, setBezogen] = React.useState(tripId)
  const [pruefung, setPruefung] = React.useState(0)
  const [speicherfehler, setSpeicherfehler] = React.useState('')
  const fokusVormerken = useGastLeseFokus(lese.art !== 'nicht_beobachtet')

  function gleicheReiseUebernehmen(graph: Trip) {
    const stand = schreibstand(setReise, tripId)
    if (!stand.unaufgeloest && graph.id === tripId) stand.basis = graph
    setReise(graph)
  }

  if (bezogen !== tripId) {
    schreibstand(setReise, tripId)
    setBezogen(tripId)
    setLese({ art: 'nicht_beobachtet' })
    setReise(null)
    setSpeicherfehler('')
  }

  React.useEffect(() => {
    let lebend = true
    const ergebnis = gastArbeitsbereichBeobachten(tripId)
    if (lebend) {
      // Same browser read as the list. A valid legacy migration may write once,
      // so this cannot move into render or into a pure snapshot.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLese(ergebnis)
      if (ergebnis.art === 'passend') {
        const stand = schreibstand(setReise, tripId)
        if (!stand.unaufgeloest && ergebnis.reise.id === tripId) stand.basis = ergebnis.reise
        setReise(ergebnis.reise)
      } else setReise(null)
    }
    return () => {
      lebend = false
    }
  }, [tripId, pruefung])

  const erneut = () => {
    fokusVormerken()
    setLese({ art: 'nicht_beobachtet' })
    setReise(null)
    setSpeicherfehler('')
    setPruefung((wert) => wert + 1)
  }

  const anlegen = async (tagId: string, eingabe: PlanpunktFormular) => {
    if (!reise) return 'Diese Reise ist auf diesem Gerät nicht mehr vorhanden.'
    try {
      gleicheReiseUebernehmen(gastPlanpunktAnlegen(reise, { ...eingabe, dayId: tagId }))
      return null
    } catch (fehler) {
      return fehler instanceof Error ? fehler.message : 'Der Punkt konnte nicht gespeichert werden.'
    }
  }

  const entfernen = async (_tagId: string, punktId: string) => {
    if (!reise) return 'Diese Reise ist auf diesem Gerät nicht mehr vorhanden.'
    try {
      gleicheReiseUebernehmen(gastPlanpunktEntfernen(reise, punktId))
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

  if (lese.art === 'nicht_beobachtet' || (lese.art === 'passend' && !reise)) {
    return (
      <GastReiseLeseWarte className="mx-auto min-w-0 max-w-7xl px-4 py-10 sm:px-6" />
    )
  }

  if (lese.art === 'andere_reise') {
    return (
      <div className="mx-auto min-w-0 max-w-2xl px-4 py-16 sm:px-6">
        <GastReiseAndere id={lese.id} titelText={lese.titel} />
      </div>
    )
  }

  if (lese.art === 'fehlend') {
    return (
      <div
        data-gast-leseart="fehlend"
        className="mx-auto min-w-0 max-w-2xl px-4 py-20 text-center sm:px-6"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="mt-5 min-w-0 max-w-full break-words text-3xl font-semibold tracking-[-0.04em] text-brand-800 [overflow-wrap:anywhere]">
          Diese Reise ist auf diesem Gerät nicht verfügbar.
        </h1>
        <p className="mt-3 break-words text-sm leading-6 text-ink-700 [overflow-wrap:anywhere]">
          Ohne Konto liegt ein Reiseentwurf nur im Browser, in dem er entstanden ist. Melde dich an, um
          deine Reisen auf jedem Gerät zu sehen.
        </p>
        <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/reisen"
            data-gast-fokus="weiter"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-line-300 bg-white px-5 text-center text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:w-auto"
          >
            Meine Reisen
          </Link>
          {gastArbeitsbereichDarfErstellen(lese) ? (
            <GastCreateLink
              createHref="/planen"
              createLabel="Reise erstellen"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand-800 px-5 text-center text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:w-auto"
            />
          ) : null}
        </div>
      </div>
    )
  }

  if (
    lese.art === 'speicher_unlesbar' ||
    lese.art === 'ungueltig' ||
    lese.art === 'abweichend' ||
    lese.art === 'belegt_ohne_kennung'
  ) {
    return (
      <div className="mx-auto min-w-0 max-w-2xl px-4 py-16 sm:px-6">
        <GastReiseLesefehler
          art={lese.art}
          ebene="h1"
          listenLink
          onPruefen={erneut}
          warteschlange={lese.art === 'ungueltig' ? lese.warteschlange : []}
        />
      </div>
    )
  }

  if (!reise) {
    return (
      <GastReiseLeseWarte className="mx-auto min-w-0 max-w-7xl px-4 py-10 sm:px-6" />
    )
  }

  return (
    <div data-gast-fokus="weiter" tabIndex={-1} className="min-w-0 max-w-full outline-none">
    <TripWorkspace
      reise={reise}
      quelle="guest"
      onVerbindungAnlegen={async values => {
        try { gleicheReiseUebernehmen(gastMobilitaetAnlegen(reise, values)); return null }
        catch (error) { return error instanceof Error ? error.message : 'Die Verbindung konnte nicht gespeichert werden.' }
      }}
      onPunktAnlegen={anlegen}
      onPunktBearbeiten={async (original, aenderung) => {
        try { gleicheReiseUebernehmen(gastPlanpunktBearbeiten(reise, original, aenderung)); return null }
        catch (error) { return error instanceof Error ? error.message : 'Der Punkt konnte nicht gespeichert werden.' }
      }}
      onPunktEntfernen={entfernen}
      onFlugRouteManuell={async (itemId, segments) => {
        try {
          gleicheReiseUebernehmen(gastFlugRouteManuellSetzen(reise, itemId, segments))
          return null
        } catch (fehler) {
          return fehler instanceof Error ? fehler.message : 'Die Flugroute konnte nicht gespeichert werden.'
        }
      }}
      onUnterkunftZeitraum={async (itemId, startsOn, endsOn) => {
        try {
          gleicheReiseUebernehmen(gastUnterkunftZeitraumSetzen(reise, itemId, startsOn, endsOn))
          return null
        } catch (fehler) {
          return fehler instanceof Error ? fehler.message : 'Der Zeitraum konnte nicht gespeichert werden.'
        }
      }}
      onReadinessAktualisieren={async () => {
        const lesung = aktiveV3GastreiseLesen(tripId)
        if (lesung.art === 'success') gleicheReiseUebernehmen(lesung.reise)
        return lesung
      }}
      onReadinessSetzen={async (eingabe) => {
        if (!reise) return 'Diese Reise ist auf diesem Gerät nicht mehr vorhanden.'
        try {
          gleicheReiseUebernehmen(gastReadinessSetzen(reise, eingabe))
          return null
        } catch (fehler) {
          return fehler instanceof Error ? fehler.message : 'Die Vorbereitung konnte nicht gespeichert werden.'
        }
      }}
      onGuestGraphUebernehmen={(graph) => {
        if (graph.id !== tripId) return
        const stand = schreibstand(setReise, tripId)
        stand.unaufgeloest = false
        stand.basis = graph
        setReise(graph)
      }}
      onTravellerSetzen={async (eingabe) => {
        const stand = schreibstand(setReise, tripId)
        if (stand.unaufgeloest) return 'Die gespeicherte Reise ist noch nicht geladen.'
        const basis = stand.basis ?? (reise && reise.id === tripId ? reise : null)
        if (!basis) return 'Diese Reise ist auf diesem Gerät nicht mehr vorhanden.'
        if (!stand.basis) stand.basis = basis
        try {
          const naechste = gastTravellerSetzen(basis, eingabe)
          gleicheReiseUebernehmen(naechste)
          return null
        } catch (fehler) {
          stand.unaufgeloest = true
          return fehler instanceof Error ? fehler.message : 'Die Reisendenangabe konnte nicht gespeichert werden.'
        }
      }}
      onTravellerEntfernen={async (clientRef) => {
        const stand = schreibstand(setReise, tripId)
        if (stand.unaufgeloest) return 'Die gespeicherte Reise ist noch nicht geladen.'
        const basis = stand.basis ?? (reise && reise.id === tripId ? reise : null)
        if (!basis) return 'Diese Reise ist auf diesem Gerät nicht mehr vorhanden.'
        if (!stand.basis) stand.basis = basis
        try {
          const naechste = gastTravellerEntfernen(basis, clientRef)
          gleicheReiseUebernehmen(naechste)
          return null
        } catch (fehler) {
          stand.unaufgeloest = true
          return fehler instanceof Error ? fehler.message : 'Die Reisendenangabe konnte nicht entfernt werden.'
        }
      }}
      onReadinessEntfernen={async (clientRef) => {
        if (!reise) return 'Diese Reise ist auf diesem Gerät nicht mehr vorhanden.'
        try {
          gleicheReiseUebernehmen(gastReadinessEntfernen(reise, clientRef))
          return null
        } catch (fehler) {
          return fehler instanceof Error ? fehler.message : 'Die Vorbereitung konnte nicht entfernt werden.'
        }
      }}
      onBuchungsstatus={async (itemId, gebucht) => {
        if (!reise) return 'Diese Reise ist auf diesem Gerät nicht mehr vorhanden.'
        try {
          gleicheReiseUebernehmen(gastBuchungsstatusSetzen(reise, itemId, gebucht))
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
          onGespeichert={(aktualisiert) => aktualisiert && gleicheReiseUebernehmen(aktualisiert)}
        />
      }
      flugsuche={
        <FlugSuche
          reise={reise}
          tagId={reise.days[0]?.id ?? null}
          onUebernehmen={async () => flugNachweisFehler('unavailable').message}
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
              gleicheReiseUebernehmen(gastHotelUebernehmen(reise, aufnahme, etappe.id, dayId))
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
              gleicheReiseUebernehmen(gastBuchungsstatusSetzen(reise, itemId, gebucht))
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
              gleicheReiseUebernehmen(gastMobilitaetAnlegen(reise, eingabe))
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
              gleicheReiseUebernehmen(gastMietwagenAnlegen(reise, eingabe))
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
              gleicheReiseUebernehmen(gastAktivitaetUebernehmen(reise, aufnahme, etappe.id, tag.id))
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
      reiseoptionen={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={verwerfen}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-2 text-sm font-medium text-white/70 transition hover:text-white"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Entwurf verwerfen
          </button>
        </div>
      }
      kopfzeile={
        speicherfehler ? (
          <p
            role="alert"
            className="rounded-2xl bg-white/10 px-4 py-2.5 text-xs leading-5 text-white"
          >
            {speicherfehler}
          </p>
        ) : null
      }
      hinweis={
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-line-200 bg-white px-3 py-2 text-xs leading-5 text-ink-800">
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
    </div>
  )
}
