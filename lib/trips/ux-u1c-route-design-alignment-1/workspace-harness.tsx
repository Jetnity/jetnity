'use client'

import * as React from 'react'
import { createRoot } from 'react-dom/client'

import GastArbeitsbereich from '@/components/trips/GastArbeitsbereich'
import KontoArbeitsbereich from '@/components/trips/KontoArbeitsbereich'
import TripWorkspace from '@/components/trips/TripWorkspace'
import {
  artenReise,
  referenzReise,
  unklareVerbindungReise,
  wiederholteEtappenReise,
  wiederholterNameReise,
} from '@/lib/trips/ux-u1c-route-design-alignment-1/fixture'
import type { Trip } from '@/types/trips'

function tagMitLeerzeichen(reise: Trip): Trip {
  const alt = 'day-11'
  const neu = 'day 11'
  const ersetze = (id: string | null) => (id === alt ? neu : id)
  const punkt = (eintrag: Trip['ohneTag'][number]) => ({ ...eintrag, dayId: ersetze(eintrag.dayId) })
  return {
    ...reise,
    days: reise.days.map((tag) => ({
      ...tag,
      id: tag.id === alt ? neu : tag.id,
      items: tag.items.map(punkt),
    })),
    ohneTag: reise.ohneTag.map(punkt),
  }
}

const SZENEN: Record<string, () => Trip> = {
  referenz: referenzReise,
  namen: wiederholterNameReise,
  abab: wiederholteEtappenReise,
  unklar: unklareVerbindungReise,
  arten: artenReise,
  leerzeichen: () => tagMitLeerzeichen(referenzReise()),
}

function RouteFlaeche() {
  const [reise, setReise] = React.useState<Trip>(() => referenzReise())
  return (
    <div data-u1c-workspace="">
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

function Arbeitsbereich({
  probe,
  kontoReise,
}: {
  probe: 'route' | 'gast' | 'konto'
  kontoReise: Trip
}) {
  if (probe === 'gast') return <GastArbeitsbereich tripId="trip-u1c-referenz" />
  if (probe === 'konto') return <KontoArbeitsbereich reise={kontoReise} ohneTag={kontoReise.ohneTag} officialEvaluations={[]} />
  return <RouteFlaeche />
}

function Flaeche() {
  const kontoReise = React.useMemo(() => referenzReise(), [])
  const [probe, setProbe] = React.useState<'route' | 'gast' | 'konto'>('route')
  const [shell, setShell] = React.useState(true)
  const [Shell, setShellKomponente] = React.useState<React.ComponentType<{ children: React.ReactNode }> | null>(null)
  React.useEffect(() => {
    let lebend = true
    void import('@/components/workspace/WorkspaceShell').then((mod) => {
      if (lebend) setShellKomponente(() => mod.default)
    })
    return () => { lebend = false }
  }, [])
  const inhalt = <Arbeitsbereich probe={probe} kontoReise={kontoReise} />
  return (
    <>
      <div data-u1c-probe-bar className="flex flex-wrap gap-2 bg-white p-2 text-sm">
        <button type="button" data-u1c-probe="route" onClick={() => setProbe('route')}>Route</button>
        <button type="button" data-u1c-probe="gast" onClick={() => setProbe('gast')}>Gast</button>
        <button type="button" data-u1c-probe="konto" onClick={() => setProbe('konto')}>Konto</button>
        <button type="button" data-u1c-shell={shell ? 'an' : 'aus'} onClick={() => setShell((wert) => !wert)}>
          {shell ? 'Hülle aus' : 'Hülle an'}
        </button>
      </div>
      {shell && Shell ? <Shell>{inhalt}</Shell> : shell ? <p data-u1c-shell-warte>Workspace wird geladen.</p> : inhalt}
    </>
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
