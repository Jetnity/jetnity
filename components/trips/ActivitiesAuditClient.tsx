'use client'

// components/trips/ActivitiesAuditClient.tsx
//
// Dünne Hülle für den UI-Audit. Die Reise kommt aus sessionStorage, gesetzt
// vom Harness – nicht aus einem produktiven Fake-Katalog. Die Steuerung am
// window existiert nur hier, damit der Audit Lebensdauer und Übernahme
// auslösen kann, ohne einen Produktpfad zu öffnen.

import * as React from 'react'

import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import TripWorkspace from '@/components/trips/TripWorkspace'
import type { ActivityOptionSichtbar } from '@/lib/activities/client-sicht'
import type { Trip, TripDay, TripStage } from '@/types/trips'

const SPEICHER = 'jetnity:ui-audit:reise'

type UebernahmeArt = 'null' | 'string' | 'throw' | 'reject' | 'malformed' | 'haengen'

type AuditStand = {
  aufrufe: number
  letzte: { id: string; title: string } | null
}

type ActivitiesAuditSteuerung = {
  reiseSetzen: (reise: Trip) => void
  flaeche: (sichtbar: boolean) => void
  uebernahme: (art: UebernahmeArt) => void
  freigeben: () => void
  stand: () => AuditStand
}

declare global {
  interface Window {
    __jetnityActivitiesAudit?: ActivitiesAuditSteuerung
  }
}

export default function ActivitiesAuditClient() {
  const [reise, setReise] = React.useState<Trip | null>(null)
  const [fehlend, setFehlend] = React.useState(false)
  const [flaeche, setFlaeche] = React.useState(true)
  const artRef = React.useRef<UebernahmeArt>('null')
  const warteRef = React.useRef<(() => void) | null>(null)
  const aufrufeRef = React.useRef(0)
  const letzteRef = React.useRef<AuditStand['letzte']>(null)

  React.useEffect(() => {
    try {
      const roh = sessionStorage.getItem(SPEICHER)
      if (!roh) {
        setFehlend(true)
        return
      }
      setReise(JSON.parse(roh) as Trip)
    } catch {
      setFehlend(true)
    }
  }, [])

  const uebernehmen = React.useCallback(async (_etappe: TripStage, _tag: TripDay, option: ActivityOptionSichtbar) => {
    aufrufeRef.current += 1
    letzteRef.current = { id: option.id, title: option.title }
    const art = artRef.current
    if (art === 'throw') throw new Error('audit-wurf')
    if (art === 'reject') return Promise.reject(new Error('audit-ablehnung'))
    if (art === 'string') return 'Der Punkt konnte nicht zugeordnet werden.'
    if (art === 'malformed') return { gespeichert: false } as unknown as string
    if (art === 'haengen') {
      await new Promise<void>((loesen) => {
        warteRef.current = loesen
      })
    }
    return null
  }, [])

  React.useEffect(() => {
    const steuerung: ActivitiesAuditSteuerung = {
      reiseSetzen: (naechste) => setReise(naechste),
      flaeche: (sichtbar) => setFlaeche(sichtbar),
      uebernahme: (art) => {
        artRef.current = art
      },
      freigeben: () => {
        warteRef.current?.()
        warteRef.current = null
      },
      stand: () => ({ aufrufe: aufrufeRef.current, letzte: letzteRef.current }),
    }
    window.__jetnityActivitiesAudit = steuerung
    return () => {
      if (window.__jetnityActivitiesAudit === steuerung) delete window.__jetnityActivitiesAudit
    }
  }, [])

  if (fehlend) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-semibold text-brand-800">Aktivitäten-Audit</h1>
        <p className="mt-3 text-sm text-ink-800">Audit-Reise fehlt.</p>
      </main>
    )
  }

  if (!reise) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16" aria-busy="true">
        <p className="text-sm text-ink-800">Aktivitäten-Audit wird vorbereitet.</p>
      </main>
    )
  }

  return (
    <main className="min-w-0">
      <p className="sr-only">Aktivitäten-Audit</p>
      <TripWorkspace
        reise={reise}
        quelle="guest"
        ohneTag={reise.ohneTag}
        onPunktAnlegen={async () => null}
        onPunktEntfernen={async () => null}
        anfangsBereich="aktivitaeten"
        aktivitaetensuche={
          flaeche ? <AktivitaetenBereich reise={reise} onUebernehmen={uebernehmen} /> : null
        }
      />
    </main>
  )
}
