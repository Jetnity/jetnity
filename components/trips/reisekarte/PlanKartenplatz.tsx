'use client'

import { createContext, useContext, useLayoutEffect, useRef, type ReactNode } from 'react'
import type { Trip } from '@/types/trips'
import type { RouteZeile } from '@/lib/trips/ux-u1c-route-design-alignment-1/route'
import type { KartenVerbindung, KartenPosition } from '@/lib/maps/etappen-kartenauswahl'

export type PlanAusschnitt = {
  reise: Trip
  route: RouteZeile[]
  etappe?: string
  tag?: string
  verbindung?: KartenVerbindung
  hinreise: boolean
  rueckreise: boolean
  setzen: boolean
  onSuche?: (kategorie: 'unterkunft' | 'aktivitaeten', etappe: string) => void
  onEdge?: (id: string, day: string) => void
  onAuswahl: (id: string) => void
  onPosition: (position: KartenPosition) => void
}
export type PlanPlatz = PlanAusschnitt & { host: HTMLDivElement }
type Anmeldung = { anzeigen: (plan: PlanPlatz) => void; entfernen: (host: HTMLDivElement) => void }
export const PlanKartenKontext = createContext<Anmeldung | null>(null)

export default function PlanKartenplatz({ children, ...plan }: PlanAusschnitt & { children: ReactNode }) {
  const anmeldung = useContext(PlanKartenKontext)
  const host = useRef<HTMLDivElement>(null)
  const aktionen = useRef(plan)
  useLayoutEffect(() => { aktionen.current = plan })
  const { reise, route, etappe, tag, verbindung, setzen, hinreise, rueckreise } = plan
  const suchbar = !!plan.onSuche
  const von = verbindung?.vonId
  const nach = verbindung?.nachId
  useLayoutEffect(() => {
    if (!anmeldung || !host.current) return
    anmeldung.anzeigen({ host: host.current, reise, route, etappe, tag, setzen, hinreise, rueckreise,
      verbindung: von && nach ? { vonId: von, nachId: nach } : undefined,
      onSuche: suchbar ? (kategorie, id) => aktionen.current.onSuche?.(kategorie, id) : undefined,
      onEdge: (id, day) => aktionen.current.onEdge?.(id, day),
      onAuswahl: id => aktionen.current.onAuswahl(id), onPosition: p => aktionen.current.onPosition(p) })
  }, [anmeldung, reise, route, etappe, tag, von, nach, setzen, hinreise, rueckreise, suchbar])
  useLayoutEffect(() => {
    const node = host.current
    return () => { if (node) anmeldung?.entfernen(node) }
  }, [anmeldung])
  if (!anmeldung) return children
  return <aside className="rk-plan" aria-label="Reisekarte im Reiseplan" ref={host} />
}
