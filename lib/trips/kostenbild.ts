// lib/trips/kostenbild.ts
//
// Das Kostenbild einer Reise: gespeicherte Preise der Planpunkte, pro Währung
// und pro Stand summiert. Rein, ohne React, ohne Netz.
//
// Wahrheitsregeln (docs/UI_UX_FEINSCHLIFF_PHASE1_ANALYSE_2026-11-20.md §5):
//   · Kein Preis wird erfunden. Ein Punkt ohne Preis zählt als „ohne Preis“
//     und wird genannt, nicht mit null gerechnet.
//   · Jede Währung bleibt für sich. Es gibt keine Umrechnung.
//   · „Gebucht“ heisst „von dir als gebucht markiert“; Jetnity prüft keine
//     Buchung beim Anbieter.
//   · Ein gespeicherter Preis ist der Preis beim Auswählen, kein Live-Preis.
//   · Das Budget wird nur verglichen, wenn alle Preise in seiner Währung stehen.
//   · Ob ein Preis pro Person gilt, ist nicht gespeichert: keine Hochrechnung.

import { betragLesbar } from '@/lib/trips/bezeichnungen'
import { leistungsstand } from '@/lib/trips/angebot-buchung-anzeige'
import { inventar } from '@/lib/trips/trip-plan-integrated/day'
import type { Trip, TripItem, TripItemKind } from '@/types/trips'

/** Bei diesen Arten ist ein Preis zu erwarten. Eine Notiz ohne Preis ist kein fehlender Preis. */
const PREISARTEN: ReadonlySet<TripItemKind> = new Set(['flight', 'stay', 'activity', 'transfer', 'rental_car'])

export type KostenStand = 'gebucht' | 'ausgewaehlt'

export type KostenPosten = {
  id: string
  titel: string
  art: TripItemKind
  stand: KostenStand
  betrag: number
  waehrung: string
}

export type KostenSumme = {
  waehrung: string
  gebucht: number
  ausgewaehlt: number
  gesamt: number
  anzahl: number
}

export type KostenBudget = {
  betrag: number
  waehrung: string
  /** Nur gesetzt, wenn jeder gespeicherte Preis in der Budgetwährung steht. */
  vergleich: { geplant: number; rest: number } | null
}

export type Kostenbild = {
  /** Reisewährung zuerst, danach alphabetisch. */
  summen: KostenSumme[]
  posten: KostenPosten[]
  ohnePreis: Omit<KostenPosten, 'betrag' | 'waehrung'>[]
  ungueltig: number
  mehrdeutig: number
  budget: KostenBudget | null
  vollstaendig: boolean
}

function rappen(betrag: number): number | null {
  if (!Number.isFinite(betrag) || betrag < 0) return null
  const ganz = Math.round(betrag * 100)
  if (!Number.isSafeInteger(ganz) || Math.abs(ganz / 100 - betrag) > 1e-8) return null
  return ganz
}

type Lesung =
  | { art: 'ohne' }
  | { art: 'ungueltig' }
  | { art: 'preis'; rappen: number; waehrung: string }

function preisLesen(punkt: Pick<TripItem, 'priceAmount' | 'priceCurrency'>): Lesung {
  if (punkt.priceAmount === null && punkt.priceCurrency === null) return { art: 'ohne' }
  if (typeof punkt.priceAmount !== 'number' || typeof punkt.priceCurrency !== 'string') return { art: 'ungueltig' }
  if (!/^[A-Z]{3}$/.test(punkt.priceCurrency)) return { art: 'ungueltig' }
  const wert = rappen(punkt.priceAmount)
  return wert === null ? { art: 'ungueltig' } : { art: 'preis', rappen: wert, waehrung: punkt.priceCurrency }
}

/** «gebucht» nur, wenn du den Punkt als gebucht markiert hast; sonst gilt er als ausgewählt. */
export function kostenStand(punkt: TripItem): KostenStand {
  return leistungsstand(punkt) === 'vom_nutzer_markiert' ? 'gebucht' : 'ausgewaehlt'
}

export type GespeicherterPreis =
  | { art: 'ohne' }
  | { art: 'ungueltig' }
  | { art: 'preis'; betrag: number; waehrung: string }

/** Der beim Auswählen gespeicherte Preis eines Punkts, nach denselben Regeln wie im Kostenbild. */
export function gespeicherterPreis(punkt: Pick<TripItem, 'priceAmount' | 'priceCurrency'>): GespeicherterPreis {
  const lesung = preisLesen(punkt)
  return lesung.art === 'preis' ? { art: 'preis', betrag: lesung.rappen / 100, waehrung: lesung.waehrung } : lesung
}

function gebuchtZuerst(a: { stand: KostenStand }, b: { stand: KostenStand }): number {
  return a.stand === b.stand ? 0 : a.stand === 'gebucht' ? -1 : 1
}

export function kostenbild(reise: Trip, ohneTag: readonly TripItem[] = reise.ohneTag): Kostenbild {
  const { items, ambiguous } = inventar(ohneTag === reise.ohneTag ? reise : { ...reise, ohneTag: [...ohneTag] })
  const summen = new Map<string, { gebucht: number; ausgewaehlt: number; anzahl: number }>()
  const posten: KostenPosten[] = []
  const ohnePreis: Kostenbild['ohnePreis'] = []
  let ungueltig = 0

  for (const punkt of items) {
    const lesung = preisLesen(punkt)
    const stand = kostenStand(punkt)
    if (lesung.art === 'ohne') {
      if (PREISARTEN.has(punkt.kind)) ohnePreis.push({ id: punkt.id, titel: punkt.title, art: punkt.kind, stand })
      continue
    }
    if (lesung.art === 'ungueltig') {
      ungueltig += 1
      continue
    }
    const summe = summen.get(lesung.waehrung) ?? { gebucht: 0, ausgewaehlt: 0, anzahl: 0 }
    const neu = summe[stand] + lesung.rappen
    if (!Number.isSafeInteger(neu)) {
      ungueltig += 1
      continue
    }
    summe[stand] = neu
    summe.anzahl += 1
    summen.set(lesung.waehrung, summe)
    posten.push({ id: punkt.id, titel: punkt.title, art: punkt.kind, stand, betrag: lesung.rappen / 100, waehrung: lesung.waehrung })
  }

  const reiseWaehrung = reise.currency
  const sortiert = [...summen.entries()]
    .sort(([a], [b]) => (a === reiseWaehrung ? -1 : b === reiseWaehrung ? 1 : a < b ? -1 : a > b ? 1 : 0))
    .map(([waehrung, summe]) => ({
      waehrung,
      gebucht: summe.gebucht / 100,
      ausgewaehlt: summe.ausgewaehlt / 100,
      gesamt: (summe.gebucht + summe.ausgewaehlt) / 100,
      anzahl: summe.anzahl,
    }))

  const budgetRappen = reise.budgetAmount === null ? null : rappen(reise.budgetAmount)
  let budget: KostenBudget | null = null
  if (budgetRappen !== null) {
    const nurBudgetwaehrung = sortiert.every((summe) => summe.waehrung === reiseWaehrung)
    const geplant = sortiert.find((summe) => summe.waehrung === reiseWaehrung)
    const geplantRappen = geplant ? Math.round(geplant.gesamt * 100) : 0
    budget = {
      betrag: budgetRappen / 100,
      waehrung: reiseWaehrung,
      vergleich: nurBudgetwaehrung && geplant
        ? { geplant: geplantRappen / 100, rest: (budgetRappen - geplantRappen) / 100 }
        : null,
    }
  }

  return {
    summen: sortiert,
    posten: posten.sort(gebuchtZuerst),
    ohnePreis: ohnePreis.sort(gebuchtZuerst),
    ungueltig,
    mehrdeutig: ambiguous.length,
    budget,
    vollstaendig: ohnePreis.length === 0 && ungueltig === 0 && ambiguous.length === 0,
  }
}

/**
 * Eine Zeile für Kopf und Handyleiste, z. B. „Geplant ca. CHF 2’640.00 · Budget CHF 4’200.00“.
 * „ca.“ steht, weil gespeicherte Preise keine Live-Preise sind und Punkte ohne Preis fehlen können.
 */
export function kostenZeile(bild: Kostenbild): string {
  const teile: string[] = []
  teile.push(
    bild.summen.length === 0
      ? 'Noch keine Preise gespeichert'
      : `Geplant ca. ${bild.summen.map((summe) => betragLesbar(summe.gesamt, summe.waehrung)).join(' + ')}`,
  )
  if (bild.budget) teile.push(`Budget ${betragLesbar(bild.budget.betrag, bild.budget.waehrung)}`)
  return teile.join(' · ')
}
