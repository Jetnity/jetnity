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
import { activityMomentaufnahmeAlsPunkt, alsActivityMomentaufnahme } from '@/lib/activities/uebernahme'
import type { Trip, TripDay, TripStage } from '@/types/trips'

const SPEICHER = 'jetnity:ui-audit:reise'

type UebernahmeArt =
  | 'null'
  | 'string'
  | 'throw'
  | 'throw-sync'
  | 'leer'
  | 'reject'
  | 'malformed'
  | 'haengen'
  | 'haengen-offen'
  | 'gast'
  | 'gast-null'
  | 'gast-offen'

type AuditStand = {
  aufrufe: number
  letzte: { id: string; title: string } | null
}

type AuditDirektaufruf = { ok: true } | { ok: false; grund: 'fehlt' }

type ActivitiesAuditSteuerung = {
  reiseSetzen: (reise: Trip) => void
  flaeche: (sichtbar: boolean) => void
  uebernahme: (art: UebernahmeArt) => void
  freigeben: (id?: string) => AuditDirektaufruf
  aktionSichern: (id: string) => AuditDirektaufruf
  aktionAlt: () => AuditDirektaufruf
  aktion: (id: string) => AuditDirektaufruf
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
  const warteRef = React.useRef(new Map<string, () => void>())
  const aufrufeRef = React.useRef(0)
  const letzteRef = React.useRef<AuditStand['letzte']>(null)
  const aktionenRef = React.useRef(new Map<string, () => void>())
  const altRef = React.useRef<(() => void) | null>(null)

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

  const uebernehmen = React.useCallback((etappe: TripStage, tag: TripDay, option: ActivityOptionSichtbar) => {
    const art = artRef.current
    if (art === 'throw-sync') {
      aufrufeRef.current += 1
      letzteRef.current = { id: option.id, title: option.title }
      throw new Error('audit-wurf')
    }
    return (async () => {
      aufrufeRef.current += 1
      letzteRef.current = { id: option.id, title: option.title }
      if (art === 'throw') throw new Error('audit-wurf')
      if (art === 'reject') return Promise.reject(new Error('audit-ablehnung'))
      if (art === 'string') return 'Der Punkt konnte nicht zugeordnet werden.'
      if (art === 'leer') return ''
      if (art === 'malformed') return { gespeichert: false } as unknown as string
      if (art === 'gast' || art === 'gast-null' || art === 'gast-offen') {
        const aufnahme = alsActivityMomentaufnahme(option, tag.dayDate)
        if (aufnahme) {
          const punkt = activityMomentaufnahmeAlsPunkt(aufnahme, {
            id: `item-${option.externalRef}`,
            dayId: tag.id,
            stageId: etappe.id,
            position: tag.items.length + 1,
          })
          setReise((bisher) => {
            if (!bisher) return bisher
            return {
              ...bisher,
              revision: bisher.revision + 1,
              days: bisher.days.map((eintrag) =>
                eintrag.id === tag.id ? { ...eintrag, items: [...eintrag.items, punkt] } : eintrag,
              ),
            }
          })
        }
      }
      if (art === 'gast-null') return null
      if (art === 'gast-offen') return ''
      if (art === 'haengen' || art === 'haengen-offen' || art === 'gast') {
        await new Promise<void>((loesen) => {
          warteRef.current.set(option.id, loesen)
        })
        warteRef.current.delete(option.id)
      }
      if (art === 'haengen-offen') return ''
      return null
    })()
  }, [])

  React.useEffect(() => {
    const steuerung: ActivitiesAuditSteuerung = {
      reiseSetzen: (naechste) => setReise(naechste),
      flaeche: (sichtbar) => setFlaeche(sichtbar),
      uebernahme: (art) => {
        artRef.current = art
      },
      freigeben: (id) => {
        if (id) {
          const loesen = warteRef.current.get(id)
          if (!loesen) return { ok: false, grund: 'fehlt' }
          loesen()
          warteRef.current.delete(id)
          return { ok: true }
        }
        if (warteRef.current.size === 0) return { ok: false, grund: 'fehlt' }
        for (const loesen of warteRef.current.values()) loesen()
        warteRef.current.clear()
        return { ok: true }
      },
      aktionSichern: (id) => {
        const ausloesen = aktionenRef.current.get(id)
        if (!ausloesen) return { ok: false, grund: 'fehlt' }
        altRef.current = ausloesen
        return { ok: true }
      },
      aktionAlt: () => {
        const ausloesen = altRef.current
        if (!ausloesen) return { ok: false, grund: 'fehlt' }
        ausloesen()
        return { ok: true }
      },
      aktion: (id) => {
        const ausloesen = aktionenRef.current.get(id)
        if (!ausloesen) return { ok: false, grund: 'fehlt' }
        ausloesen()
        return { ok: true }
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
          flaeche ? (
            <AktivitaetenBereich
              reise={reise}
              onUebernehmen={uebernehmen}
              onUebernahmeBeobachten={(aufnahme) => {
                aktionenRef.current.set(aufnahme.id, aufnahme.ausloesen)
              }}
            />
          ) : null
        }
      />
    </main>
  )
}
