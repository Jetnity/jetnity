'use client'

import { ArrowUpRight, ChevronRight, MapPin } from 'lucide-react'
import { chronologischeLaeufe, laufUntertitel } from '@/lib/trips/n12-chronology-1/laeufe'
import { etappenZeitraumAnzeigen } from '@/lib/trips/datum-anzeige'
import type { Trip } from '@/types/trips'

/** Compact entry to the existing day plan. No inferred stays or transport. */
export default function WorkspaceRouteOverview({ reise, onRoute }: {
  reise: Trip
  onRoute: (tagId?: string) => void
}) {
  const chronologie = chronologischeLaeufe(reise)
  return (
    <section className="workspace-route-overview" aria-label="Deine Route">
      <header><div><h3>Deine Route</h3><p>Gespeicherte Reihenfolge deiner Reisetage</p></div>
        <button type="button" onClick={() => onRoute()}>Reiseplan öffnen<ArrowUpRight aria-hidden="true" /></button>
      </header>
      {!chronologie.gueltig ? <p className="workspace-route-empty">Die gespeicherte Tagesfolge ist nicht eindeutig. Öffne den Reiseplan, um die Zuordnung zu prüfen.</p>
        : chronologie.laeufe.length === 0 ? <p className="workspace-route-empty">Noch keine Reisetage angelegt.</p>
          : <ol>{chronologie.laeufe.map((lauf) => (
            <li key={lauf.schluessel}>
              <button type="button" onClick={() => onRoute(lauf.tage[0].id)}>
                <span className="workspace-route-marker"><MapPin aria-hidden="true" /></span>
                <span className="workspace-route-copy"><strong>{!lauf.istNutzerziel && lauf.tage.length === 1 && lauf.tage[0].title ? lauf.tage[0].title : lauf.name}</strong>
                  <small>{etappenZeitraumAnzeigen(lauf.tage[0].dayDate, lauf.tage.at(-1)?.dayDate) ?? 'Datum noch offen'}</small>
                  {laufUntertitel(lauf) ? <small>{laufUntertitel(lauf)}</small> : null}
                </span><ChevronRight aria-hidden="true" />
              </button>
            </li>
          ))}</ol>}
    </section>
  )
}
