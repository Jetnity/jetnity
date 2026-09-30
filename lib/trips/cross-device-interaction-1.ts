// lib/trips/cross-device-interaction-1.ts
//
// Eine Anordnung für den aktiven Reisebereich auf jedem Gerät.
// Detail, vorhandener Bestand und ausdrückliche Suche bleiben ein Kontext.
// Keine Provider-, Such- oder Wahrheitsregel.

import { ARBEITSBEREICH_DESKTOP_AB_PX } from '@/lib/trips/arbeitsbereich'

/** Ab dieser Breite trägt die Arbeitsfläche eine breitere Spalte. */
export const AKTIVE_DOMAIN_WEIT_AB_PX = 1280

export type DomainAnordnung = 'einspaltig' | 'geteilt-schmal' | 'geteilt-weit'

/**
 * Felder folgen der verfügbaren Spaltenbreite.
 * Zwei Spalten erst, wenn jede mindestens 16rem hat. Sonst eine Spalte.
 */
export const ARBEITSFELD_SPALTEN_KLASSE =
  'grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-3'

export function domainAnordnung(input: {
  kompakt: boolean
  detailOffen: boolean
  weit: boolean
}): DomainAnordnung {
  if (input.kompakt || !input.detailOffen) return 'einspaltig'
  return input.weit ? 'geteilt-weit' : 'geteilt-schmal'
}

/**
 * Geteilte Arbeitsfläche.
 *
 * Schmal (1024–1279): die Arbeitsfläche bekommt mehr als die Hälfte, damit
 * Suche nicht in einer leeren 50/50-Spalte landet und Felder nicht gequetscht
 * werden. Weit: Übersicht und aktiver Bereich bleiben nebeneinander, die
 * Suche weitet die rechte Spalte bewusst auf.
 */
export function domainRasterKlasse(anordnung: DomainAnordnung, sucheSichtbar: boolean): string | undefined {
  if (anordnung === 'einspaltig') return undefined
  if (anordnung === 'geteilt-schmal') {
    return sucheSichtbar
      ? 'grid grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)] items-start gap-6'
      : 'grid grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] items-start gap-6'
  }
  return sucheSichtbar
    ? 'grid grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] items-start gap-8'
    : 'grid grid-cols-[minmax(0,0.46fr)_minmax(0,0.54fr)] items-start gap-6'
}

export function domainAnordnungFuerBreite(breite: number, detailOffen: boolean): DomainAnordnung {
  return domainAnordnung({
    kompakt: breite < ARBEITSBEREICH_DESKTOP_AB_PX,
    detailOffen,
    weit: breite >= AKTIVE_DOMAIN_WEIT_AB_PX,
  })
}

/**
 * Luft unter der gemessenen Chrom-Kante.
 * Sie ersetzt nicht die Höhe der Leiste. Die Kante selbst kommt aus der Messung.
 */
export const ABDECKUNG_LUFT_PX = 8

export type AbdeckungsBand = {
  top: number
  bottom: number
  height: number
}

/**
 * Unterkante der oberen festen oder klebenden Leisten.
 * Ein Band zählt nur, wenn es die bisherige Kante berührt.
 * Eine Leiste weiter unten auf der Seite bleibt aussen vor.
 */
export function abdeckungsKante(baender: AbdeckungsBand[]): number {
  const sortiert = baender
    .filter((band) => band.height > 0 && band.bottom > band.top)
    .sort((a, b) => a.top - b.top || a.bottom - b.bottom)
  let kante = 0
  for (const band of sortiert) {
    if (band.top > kante + 1) break
    kante = Math.max(kante, band.bottom)
  }
  return kante
}

/** Anteil der rechten Spalte. Einspaltig hat keine zweite Spalte. */
export function arbeitsflaecheAnteil(klasse: string | undefined): number | null {
  if (!klasse) return null
  const treffer = [...klasse.matchAll(/minmax\(0,([0-9.]+)fr\)/g)]
  const rechts = treffer.at(-1)?.[1]
  const links = treffer[0]?.[1]
  if (!rechts || !links) return null
  const rechtsZahl = Number(rechts)
  const linksZahl = Number(links)
  return rechtsZahl / (linksZahl + rechtsZahl)
}
