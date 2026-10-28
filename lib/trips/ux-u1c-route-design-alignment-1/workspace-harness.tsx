'use client'

import * as React from 'react'
import { createRoot } from 'react-dom/client'

import TripWorkspace from '@/components/trips/TripWorkspace'
import {
  referenzReise,
  unklareVerbindungReise,
  wiederholteEtappenReise,
  wiederholterNameReise,
} from '@/lib/trips/ux-u1c-route-design-alignment-1/fixture'
import type { Trip } from '@/types/trips'

const SZENEN: Record<string, () => Trip> = {
  referenz: referenzReise,
  namen: wiederholterNameReise,
  abab: wiederholteEtappenReise,
  unklar: unklareVerbindungReise,
}

function Flaeche() {
  const [reise, setReise] = React.useState<Trip>(() => referenzReise())
  return (
    <div data-u1c-workspace="">
      <header data-site-header className="sticky top-0 z-50 flex h-[72px] items-center border-b border-line-200 bg-white px-3 text-sm font-semibold text-brand-800">
        Jetnity
      </header>
      <div className="flex flex-wrap gap-2 p-3">
        {Object.entries(SZENEN).map(([name, erzeugen]) => (
          <button key={name} type="button" data-u1c-szene={name} onClick={() => setReise(erzeugen())}>{name}</button>
        ))}
        <button
          type="button"
          data-u1c-tag-weg
          onClick={() => setReise((alt) => ({ ...alt, days: alt.days.filter((tag) => tag.id !== 'day-3') }))}
        >
          Tag 3 weg
        </button>
        <button
          type="button"
          data-u1c-etappe-weg
          onClick={() => setReise((alt) => ({
            ...alt,
            stages: alt.stages.filter((etappe) => etappe.id !== 'stage-kc'),
            days: alt.days.map((tag) => tag.stageId === 'stage-kc' ? { ...tag, stageId: null } : tag),
          }))}
        >
          Ko Chang weg
        </button>
      </div>
      <TripWorkspace
        reise={reise}
        quelle="guest"
        ohneTag={reise.ohneTag}
        onPunktAnlegen={async () => null}
        onPunktEntfernen={async () => null}
      />
    </div>
  )
}

export function mountU1cWorkspace() {
  const wurzel = document.getElementById('root')
  if (!wurzel) return
  createRoot(wurzel).render(<Flaeche />)
}

if (typeof document !== 'undefined' && document.getElementById('root')) {
  mountU1cWorkspace()
}
