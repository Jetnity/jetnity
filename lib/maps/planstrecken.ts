import type { RouteZeile } from '@/lib/trips/ux-u1c-route-design-alignment-1/route'
import type { KartenVerbindung } from './etappen-kartenauswahl'
import type { Reiseort } from './reisekarte'

export type PlanAbschnitt = { von: number; nach: number; aktiv: boolean }
export const abreiseId = 'reise-abreise'

export function planstrecken(orte: Reiseort[], route: RouteZeile[], auswahl?: KartenVerbindung, hinreise = false, rueckreise = false) {
  const etappen = new Map(orte.flatMap((o, i) => o.art === 'Etappe' && o.etappeId && o.position ? [[o.etappeId, i] as const] : []))
  const abschnitte: PlanAbschnitt[] = []
  const add = (von: number | undefined, nach: number | undefined, aktiv = false) => {
    if (von !== undefined && nach !== undefined && von >= 0 && nach >= 0 && von !== nach) abschnitte.push({ von, nach, aktiv })
  }
  const abreise = orte.findIndex(o => o.id === abreiseId && o.position)
  const laeufe = route.flatMap(r => r.art === 'lauf' && r.stageId ? [r.stageId] : [])
  const erste = laeufe[0]
  const letzte = laeufe.at(-1)
  if (hinreise && erste) add(abreise, etappen.get(erste))
  for (const kante of route) {
    if (kante.art === 'kante') add(etappen.get(kante.vonId), etappen.get(kante.nachId),
      !kante.mehrdeutig && kante.vonId === auswahl?.vonId && kante.nachId === auswahl.nachId)
  }
  if (rueckreise && letzte) add(etappen.get(letzte), abreise)
  return abschnitte
}
