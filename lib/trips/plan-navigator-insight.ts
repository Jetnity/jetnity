import { KANTE_ZUORDNUNG_UNKLAR, routeModell, type RouteKanteZeile } from '@/lib/trips/ux-u1c-route-design-alignment-1/route'
import { chronologischeLaeufe } from '@/lib/trips/n12-chronology-1/laeufe'
import type { Trip, TripItemKind } from '@/types/trips'

export type NavigatorInsight = {
  status: string
  nextAction: string
  transferHinweis: string | null
}

function leereWerte(): Record<TripItemKind, number> {
  return {
    flight: 0,
    stay: 0,
    activity: 0,
    transfer: 0,
    rental_car: 0,
    note: 0,
  }
}

function statusTeile(werte: Record<TripItemKind, number>, suffix = ''): string[] {
  const teile: string[] = []
  if (werte.stay > 0) teile.push(`${werte.stay === 1 ? '1 Unterkunft' : `${werte.stay} Unterkünfte`}${suffix}`)
  if (werte.activity > 0) teile.push(`${werte.activity === 1 ? '1 Aktivität' : `${werte.activity} Aktivitäten`}${suffix}`)
  if (werte.transfer > 0) teile.push(`${werte.transfer === 1 ? '1 Transfer' : `${werte.transfer} Transfers`}${suffix}`)
  if (werte.flight > 0) teile.push(`${werte.flight === 1 ? '1 Flug' : `${werte.flight} Flüge`}${suffix}`)
  if (werte.rental_car > 0) teile.push(`${werte.rental_car === 1 ? '1 Mietwagen' : `${werte.rental_car} Mietwagen`}${suffix}`)
  if (werte.note > 0) teile.push(`${werte.note === 1 ? '1 Notiz' : `${werte.note} Notizen`}${suffix}`)
  return teile
}

function punktStatusText(geplant: Record<TripItemKind, number>, ungeplant: Record<TripItemKind, number>): string {
  const teile = [
    ...statusTeile(geplant),
    ...statusTeile(ungeplant, ' ohne Tag'),
  ]
  return teile.length > 0 ? teile.join(' · ') : 'Noch keine Punkte erfasst'
}

function statusMitMehrdeutigerUnterkunft(basis: string, mehrdeutig: boolean): string {
  if (!mehrdeutig) return basis
  const hinweis = 'Ungeplante Unterkunft vorhanden, keinem Aufenthalt eindeutig zugeordnet'
  return basis === 'Noch keine Punkte erfasst' ? hinweis : `${basis} · ${hinweis}`
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
  const laufAnzahlProStage = new Map<string, number>()
  for (const lauf of chronologie.laeufe) {
    if (!lauf.stageId) continue
    laufAnzahlProStage.set(lauf.stageId, (laufAnzahlProStage.get(lauf.stageId) ?? 0) + 1)
  }
  const ungeplantProStage = new Map<string, Record<TripItemKind, number>>()
  for (const punkt of trip.ohneTag) {
    if (punkt.dayId != null || punkt.stageId == null) continue
    const werte = ungeplantProStage.get(punkt.stageId) ?? leereWerte()
    werte[punkt.kind] += 1
    ungeplantProStage.set(punkt.stageId, werte)
  }
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
    const werte = leereWerte()
    const stageMehrfach = lauf.stageId != null && (laufAnzahlProStage.get(lauf.stageId) ?? 0) > 1
    const ungeplantBasis = lauf.stageId ? (ungeplantProStage.get(lauf.stageId) ?? leereWerte()) : leereWerte()
    const ungeplant = stageMehrfach ? leereWerte() : ungeplantBasis
    const mehrdeutigeUnterkunft = stageMehrfach && ungeplantBasis.stay > 0
    for (const tag of lauf.tage) {
      for (const punkt of tag.items) werte[punkt.kind] += 1
    }
    const verbindung = transferHinweis(kantenProLauf.get(lauf.schluessel) ?? [])
    const nextAction = lauf.lesart === 'reise-ohne-ziel'
      ? (werte.flight + werte.transfer > 0 ? 'Anreise- oder Transferdetails prüfen' : 'Reiseeintrag prüfen')
      : lauf.lesart === 'zuordnung-offen'
        ? 'Abschnitt prüfen und bei Bedarf zuordnen'
        : werte.stay === 0 && mehrdeutigeUnterkunft
          ? 'Ungeplante Unterkunft prüfen (mehrfacher Aufenthalt)'
        : werte.stay === 0 && ungeplant.stay > 0
          ? 'Unterkunft einem Reisetag zuordnen'
          : werte.stay === 0
          ? 'Unterkunft ergänzen'
          : verbindung != null
            ? 'Verbindung prüfen'
            : werte.activity === 0
              ? 'Aktivität hinzufügen'
              : 'Tagesdetails prüfen'

    antwort[lauf.schluessel] = {
      status: statusMitMehrdeutigerUnterkunft(punktStatusText(werte, ungeplant), mehrdeutigeUnterkunft),
      nextAction,
      transferHinweis: verbindung,
    }
  }

  return antwort
}
