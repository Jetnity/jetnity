'use client'

import { ArrowUpRight, BedDouble, ChevronRight, MapPin } from 'lucide-react'
import { chronologischeLaeufe, laufUntertitel, ZUORDNUNG_OFFEN } from '@/lib/trips/n12-chronology-1/laeufe'
import { etappenZeitraumAnzeigen } from '@/lib/trips/datum-anzeige'
import { laufUnterkunftLeser, laufUnterkunftText } from '@/lib/trips/reiselinie'
import type { Trip, TripItem } from '@/types/trips'

/** Compact entry to the existing day plan. No inferred stays or transport. */
export default function WorkspaceRouteOverview({ reise, ungeplantePunkte, onRoute }: {
  reise: Trip
  ungeplantePunkte?: readonly TripItem[]
  onRoute: (tagId?: string) => void
}) {
  const chronologie = chronologischeLaeufe(reise)
  const unterkunft = laufUnterkunftLeser(reise, ungeplantePunkte)
  const ohneTage = [...reise.stages]
    .filter((etappe) => !reise.days.some((tag) => tag.stageId === etappe.id))
    .sort((a, b) => a.position - b.position)
  const tageOhneZiel = reise.days.some((tag) => !tag.stageId)
  return (
    <section className="workspace-route-overview" aria-label="Deine Route">
      <header><div><h3>Deine Route</h3><p>Wo du an welchen Tagen bist</p></div>
        <button type="button" onClick={() => onRoute()}>Reiseplan öffnen<ArrowUpRight aria-hidden="true" /></button>
      </header>
      {!chronologie.gueltig ? <p className="workspace-route-empty">Die gespeicherte Tagesfolge ist nicht eindeutig. Öffne den Reiseplan, um die Zuordnung zu prüfen.</p>
        : chronologie.laeufe.length === 0 ? <p className="workspace-route-empty">Noch keine Reisetage angelegt.</p>
          : <ol>{chronologie.laeufe.map((lauf) => {
            const stand = unterkunft(lauf)
            return (
              <li key={lauf.schluessel}>
                <button type="button" onClick={() => onRoute(lauf.tage[0].id)}>
                  <span className="workspace-route-marker"><MapPin aria-hidden="true" /></span>
                  <span className="workspace-route-copy"><strong>{!lauf.istNutzerziel && lauf.tage.length === 1 && lauf.tage[0].title ? lauf.tage[0].title : lauf.name}</strong>
                    <small>{etappenZeitraumAnzeigen(lauf.tage[0].dayDate, lauf.tage.at(-1)?.dayDate) ?? 'Datum noch offen'}</small>
                    {laufUntertitel(lauf) ? <small>{laufUntertitel(lauf)}</small> : null}
                    {stand ? (
                      <small className="workspace-route-stay" data-route-unterkunft={stand.offen === 0 ? 'abgedeckt' : 'offen'}>
                        <BedDouble aria-hidden="true" />{laufUnterkunftText(stand)}
                      </small>
                    ) : null}
                  </span><ChevronRight aria-hidden="true" />
                </button>
              </li>
            )
          })}</ol>}
      {chronologie.gueltig && ohneTage.length > 0 ? (
        <p className="workspace-route-ohne-tage">
          Noch ohne Tage: {ohneTage.map((etappe) => etappe.name).join(', ')}. Unter «Reise ändern» legst du fest, wie lange du wo bleibst.
          {tageOhneZiel ? ` Bis dahin stehen deine Reisetage unter «${ZUORDNUNG_OFFEN}».` : null}
        </p>
      ) : null}
    </section>
  )
}
