'use client'

import * as React from 'react'
import { createRoot } from 'react-dom/client'

import TripWorkspace from '@/components/trips/TripWorkspace'
import { n12Punkt, n12Reise } from '@/lib/trips/n12-chronology-1/fixture'
import type { Trip, TripStage } from '@/types/trips'

export type U1bZaehler = { mounts: number; unmounts: number; requests: number; writes: string[] }

declare global {
  interface Window {
    __u1b?: U1bZaehler
  }
}

function buehne(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name' | 'position'>): TripStage {
  return { countryCode: 'TH', arrivalDate: null, departureDate: null, latitude: null, longitude: null, placeId: null, ...teil }
}

function u1bReise(): Trip {
  const reise = n12Reise()
  reise.stages = [...reise.stages, buehne({ id: 'stage-bkk-2', name: 'Bangkok', position: 3 })]
  const letzter = reise.days[21]
  if (letzter) letzter.stageId = 'stage-bkk-2'
  const tag = reise.days[2]
  if (tag) {
    tag.items = [
      n12Punkt({ id: 'kind-flight', kind: 'flight', title: 'Flugtag', dayId: tag.id }),
      n12Punkt({ id: 'kind-stay', kind: 'stay', title: 'Haus', dayId: tag.id }),
      n12Punkt({ id: 'kind-activity', kind: 'activity', title: 'Gang', dayId: tag.id }),
      n12Punkt({ id: 'kind-transfer', kind: 'transfer', title: 'Bahn', dayId: tag.id, mobilityMode: 'rail' }),
      n12Punkt({ id: 'kind-rental', kind: 'rental_car', title: 'Wagen', dayId: tag.id }),
      n12Punkt({ id: 'kind-note', kind: 'note', title: 'Notiz', dayId: tag.id }),
    ]
  }
  reise.ohneTag = [n12Punkt({ id: 'note-ohne', kind: 'note', title: 'Ohne Tag', dayId: null })]
  return reise
}

const stand: U1bZaehler = { mounts: 0, unmounts: 0, requests: 0, writes: [] }
const anlegenWarten: { halten: boolean; loesen: ((wert: string | null) => void) | null } = { halten: false, loesen: null }

function SuchProbe() {
  React.useEffect(() => {
    stand.mounts += 1
    window.__u1b = stand
    return () => { stand.unmounts += 1 }
  }, [])
  return (
    <div data-u1b-suchprobe="">
      <button type="button" data-u1b-suchprobe-holen onClick={() => { stand.requests += 1 }}>Abruf</button>
    </div>
  )
}

function Flaeche() {
  const [reise, setReise] = React.useState(() => u1bReise())
  React.useEffect(() => { window.__u1b = stand }, [])
  return (
    <div data-u1b-harness="">
      <header className="sticky top-0 z-50 flex h-[72px] items-center border-b border-line-200 bg-white px-3 text-sm font-semibold text-brand-800">Jetnity</header>
      <button type="button" data-u1b-bump onClick={() => setReise((alt) => ({ ...alt, revision: alt.revision + 1 }))}>Aktualisieren</button>
      <button type="button" data-u1b-neue onClick={() => setReise((alt) => ({ ...alt, id: 'trip-neu', clientRef: 'trip-neu' }))}>Neue Reise</button>
      <button type="button" data-u1b-tag-weg onClick={() => setReise((alt) => ({ ...alt, days: alt.days.filter((tag) => tag.id !== 'day-2') }))}>Tag weg</button>
      <button type="button" data-u1b-punkt-weg onClick={() => setReise((alt) => ({
        ...alt,
        days: alt.days.map((tag) => ({ ...tag, items: tag.items.filter((punkt) => punkt.id !== 'stay-11') })),
      }))}>Punkt weg</button>
      <button type="button" data-u1b-anlegen-halten onClick={() => { anlegenWarten.halten = true }}>Anlegen halten</button>
      <button type="button" data-u1b-anlegen-fehler onClick={() => { anlegenWarten.loesen?.('Der Entwurf bleibt auf diesem Tag.'); anlegenWarten.loesen = null; anlegenWarten.halten = false }}>Anlegen Fehler</button>
      <button type="button" data-u1b-tag10-weg onClick={() => setReise((alt) => ({ ...alt, days: alt.days.filter((tag) => tag.id !== 'day-10') }))}>Tag 10 weg</button>
      <button type="button" data-u1b-verschieben onClick={() => setReise((alt) => ({
        ...alt,
        days: alt.days.map((tag) => {
          if (tag.id === 'day-11') return { ...tag, items: tag.items.filter((punkt) => punkt.id !== 'stay-11') }
          if (tag.id === 'day-5') return { ...tag, items: [...tag.items, n12Punkt({ id: 'stay-11', kind: 'stay', title: 'Nachmittag vor Ort', dayId: 'day-5' })] }
          return tag
        }),
      }))}>Verschieben</button>
      <TripWorkspace
        reise={reise}
        quelle="guest"
        ohneTag={reise.ohneTag}
        onPunktAnlegen={async (tagId, eingabe) => {
          stand.writes.push(`${tagId}:${eingabe.title}`)
          if (!anlegenWarten.halten) return null
          return await new Promise<string | null>((resolve) => { anlegenWarten.loesen = resolve })
        }}
        onPunktEntfernen={async (tagId, punktId) => { stand.writes.push(`${tagId}:${punktId}`); return null }}
        flugsuche={<SuchProbe />}
      />
    </div>
  )
}

export function mountUxU1bHarness() {
  const wurzel = document.getElementById('root')
  if (!wurzel) return
  createRoot(wurzel).render(<Flaeche />)
}

if (typeof document !== 'undefined' && document.getElementById('root')) {
  mountUxU1bHarness()
}
