import { KANTE_ZUORDNUNG_UNKLAR, routeModell, type RouteKanteZeile } from '@/lib/trips/ux-u1c-route-design-alignment-1/route'
import { chronologischeLaeufe } from '@/lib/trips/n12-chronology-1/laeufe'
import type { Trip, TripItemKind } from '@/types/trips'

export type NavigatorInsight = {
  status: string
  nextAction: string
  transferHinweis: string | null
}

function punktStatusText(werte: Record<TripItemKind, number>): string {
  const teile: string[] = []
  if (werte.stay > 0) teile.push(werte.stay === 1 ? '1 Unterkunft' : `${werte.stay} Unterkünfte`)
  if (werte.activity > 0) teile.push(werte.activity === 1 ? '1 Aktivität' : `${werte.activity} Aktivitäten`)
  if (werte.transfer > 0) teile.push(werte.transfer === 1 ? '1 Transfer' : `${werte.transfer} Transfers`)
  if (werte.flight > 0) teile.push(werte.flight === 1 ? '1 Flug' : `${werte.flight} Flüge`)
  if (werte.rental_car > 0) teile.push(werte.rental_car === 1 ? '1 Mietwagen' : `${werte.rental_car} Mietwagen`)
  if (werte.note > 0) teile.push(werte.note === 1 ? '1 Notiz' : `${werte.note} Notizen`)
  return teile.length > 0 ? teile.join(' · ') : 'Noch keine Punkte erfasst'
}

function transferHinweis(kanten: readonly RouteKanteZeile[]): string | null {
  if (kanten.some((kante) => kante.planText === KANTE_ZUORDNUNG_UNKLAR)) return 'Verbindung ist noch ungeklärt'
  if (kanten.some((kante) => kante.planText.startsWith('Noch keine gespeicherte Verbindung.'))) return 'Verbindung fehlt noch'
  return null
}

export function planNavigatorInsights(trip: Trip): Record<string, NavigatorInsight> {
  const chronologie = chronologischeLaeufe(trip)
  if (!chronologie.gueltig) return {}
  const route = routeModell(trip)
  const kantenProLauf = new Map<string, RouteKanteZeile[]>()
  for (const zeile of route.zeilen) {
    if (zeile.art !== 'kante') continue
    const links = kantenProLauf.get(zeile.vonSchluessel) ?? []
    links.push(zeile)
    kantenProLauf.set(zeile.vonSchluessel, links)
    const rechts = kantenProLauf.get(zeile.nachSchluessel) ?? []
    rechts.push(zeile)
    kantenProLauf.set(zeile.nachSchluessel, rechts)
  }

  const antwort: Record<string, NavigatorInsight> = {}
  for (const lauf of chronologie.laeufe) {
    const werte: Record<TripItemKind, number> = {
      flight: 0,
      stay: 0,
      activity: 0,
      transfer: 0,
      rental_car: 0,
      note: 0,
    }
    for (const tag of lauf.tage) {
      for (const punkt of tag.items) werte[punkt.kind] += 1
    }
    const verbindung = transferHinweis(kantenProLauf.get(lauf.schluessel) ?? [])
    const nextAction = lauf.lesart === 'reise-ohne-ziel'
      ? 'Passenden Aufenthalt zuordnen'
      : lauf.lesart === 'zuordnung-offen'
        ? 'Ort für diesen Abschnitt festlegen'
        : werte.stay === 0
          ? 'Unterkunft ergänzen'
          : verbindung != null
            ? 'Verbindung prüfen'
            : werte.activity === 0
              ? 'Aktivität hinzufügen'
              : 'Tagesdetails prüfen'

    antwort[lauf.schluessel] = {
      status: punktStatusText(werte),
      nextAction,
      transferHinweis: verbindung,
    }
  }

  return antwort
}
