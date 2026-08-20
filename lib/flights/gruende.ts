// lib/flights/gruende.ts
//
// 2–4 nachvollziehbare Sätze, warum Jetnity diese Option empfiehlt.
//
// Die Sätze vergleichen mit Günstigster und Schnellster. Provision, Provider
// und interne Score-Zahlen kommen nicht vor.
//
// Frei von Next und Providern.

import type { FlugOption } from '@/lib/flights/domain'
import {
  hatLangenUmstieg,
  hatOvernight,
  istFrueherAbflug,
  istSpaeteAnkunft,
  laengsterUmstiegMinuten,
} from '@/lib/flights/ranking'
import { betragDifferenzLesbar, dauerLesbar } from '@/lib/flights/zeit'

function stoppText(anzahl: number): string {
  if (anzahl <= 0) return 'ohne Umstieg'
  if (anzahl === 1) return 'nur 1 Umstieg'
  return `${anzahl} Umstiege`
}

export function gruendeFuer(empfohlen: FlugOption, cheapest: FlugOption, fastest: FlugOption): string[] {
  const gruende: string[] = []
  const waehrung = empfohlen.priceCurrency

  if (empfohlen.id !== cheapest.id) {
    const diff = empfohlen.priceAmount - cheapest.priceAmount
    const teile: string[] = []
    if (diff > 0) teile.push(`${betragDifferenzLesbar(diff, waehrung)} teurer`)
    if (empfohlen.durationMinutes + 20 < cheapest.durationMinutes) {
      teile.push(`${dauerLesbar(cheapest.durationMinutes - empfohlen.durationMinutes)} schneller`)
    }
    if (empfohlen.stops < cheapest.stops) {
      teile.push(empfohlen.stops === 0 ? 'ohne Umstieg' : `mit ${stoppText(empfohlen.stops)}`)
    }
    if (teile.length === 1) gruende.push(`Gegenüber der günstigsten Option ${teile[0]}.`)
    if (teile.length >= 2) {
      const letzte = teile.pop()
      gruende.push(`${teile.join(', ')}, aber ${letzte}.`)
    }
  } else {
    gruende.push(`Günstigste Verbindung in dieser Suche (${betragDifferenzLesbar(empfohlen.priceAmount, waehrung)}).`)
  }

  if (empfohlen.id !== fastest.id && empfohlen.durationMinutes <= fastest.durationMinutes + 30) {
    if (empfohlen.priceAmount + 1 < fastest.priceAmount) {
      gruende.push(
        `Nahezu so schnell wie die schnellste Option, ${betragDifferenzLesbar(fastest.priceAmount - empfohlen.priceAmount, waehrung)} günstiger.`,
      )
    }
  } else if (empfohlen.id === fastest.id && empfohlen.id !== cheapest.id) {
    gruende.push(`Kürzeste Reisezeit (${dauerLesbar(empfohlen.durationMinutes)}).`)
  }

  if (empfohlen.stops === 0) gruende.push('Direktflug, ohne Umsteigen.')
  else if (empfohlen.stops === 1 && !hatLangenUmstieg(empfohlen)) {
    gruende.push('Nur ein kurzer Umstieg.')
  }

  if (!istFrueherAbflug(empfohlen) && !istSpaeteAnkunft(empfohlen)) {
    gruende.push('Angenehme Abflug- und Ankunftszeiten.')
  } else if (istFrueherAbflug(cheapest) && !istFrueherAbflug(empfohlen)) {
    gruende.push('Kein sehr früher Abflug.')
  } else if (istSpaeteAnkunft(cheapest) && !istSpaeteAnkunft(empfohlen)) {
    gruende.push('Keine sehr späte Ankunft.')
  }

  if (hatOvernight(cheapest) && !hatOvernight(empfohlen)) {
    gruende.push('Keine Übernachtung unterwegs.')
  } else if (hatLangenUmstieg(cheapest) && !hatLangenUmstieg(empfohlen)) {
    gruende.push('Ohne langen Umstieg.')
  } else if (hatLangenUmstieg(empfohlen) && laengsterUmstiegMinuten(empfohlen) >= 360) {
    // nicht als Vorteil nennen
  }

  const eindeutig = [...new Set(gruende)].slice(0, 4)
  if (eindeutig.length >= 2) return eindeutig

  eindeutig.push(`Gesamtreisezeit ${dauerLesbar(empfohlen.durationMinutes)}.`)
  if (eindeutig.length < 2) {
    eindeutig.push(`${stoppText(empfohlen.stops)} · ${betragDifferenzLesbar(empfohlen.priceAmount, waehrung)}.`)
  }
  return eindeutig.slice(0, 4)
}
