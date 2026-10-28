// lib/trips/ux-u3b-country-empty-1/leere-einreise.ts
//
// Display-only grouping for identical generic empty entry placeholders.
// Consecutive stages may share one country sentence. The helper does not
// re-sort, does not merge stage identities, and does not decide entry rules.
// Safety, season, links and dates stay on each original stage.

import { istKatalogLand } from '@/lib/country/katalog'
import {
  DESTINATION_ESSENTIALS_LEERTEXT,
  type DestinationEssentialZiel,
} from '@/lib/trips/destination-essentials'

export type U3bEinreiseSignatur = {
  countryCode: string
  countryLabel: string
}

export type U3bAnzeigeEinzeln = {
  art: 'einzeln'
  ziel: DestinationEssentialZiel
}

export type U3bAnzeigeGruppe = {
  art: 'gemeinsame-leere-einreise'
  countryCode: string
  countryLabel: string
  text: string
  ziele: readonly DestinationEssentialZiel[]
}

export type U3bAnzeige = U3bAnzeigeEinzeln | U3bAnzeigeGruppe

export function einreiseinformationenUngeprueft(countryLabel: string): string {
  return `Einreiseinformationen ${countryLabel} noch nicht geprüft`
}

/**
 * Trusted canonical country plus the exact neutral empty entry shape the
 * existing essentials projection already emits. Anything else stays ungrouped.
 */
export function generischeLeereEinreiseSignatur(
  ziel: DestinationEssentialZiel,
): U3bEinreiseSignatur | null {
  const code = ziel.countryCode
  const label = ziel.countryLabel?.trim() ?? ''
  if (!code || !istKatalogLand(code)) return null
  if (label.length === 0) return null
  const einreise = ziel.einreise
  if (einreise.lage !== 'keine_evidence') return null
  if (einreise.unvollstaendig !== false) return null
  if (einreise.details.length !== 0) return null
  if (einreise.links.length !== 0) return null
  if (einreise.text !== DESTINATION_ESSENTIALS_LEERTEXT) return null
  return { countryCode: code, countryLabel: label }
}

function gleicheSignatur(links: U3bEinreiseSignatur, rechts: U3bEinreiseSignatur): boolean {
  return links.countryCode === rechts.countryCode && links.countryLabel === rechts.countryLabel
}

/**
 * Groups only contiguous identical empty-entry runs of length 2 or more.
 * A later reentry after another country starts a new run, so it stays an
 * independent visit even when the empty signature matches again.
 */
export function u3bAnzeigeGruppen(ziele: readonly DestinationEssentialZiel[]): readonly U3bAnzeige[] {
  const ausgabe: U3bAnzeige[] = []
  let lauf: DestinationEssentialZiel[] = []
  let signatur: U3bEinreiseSignatur | null = null

  const abschliessen = () => {
    if (lauf.length === 0 || !signatur) return
    if (lauf.length === 1) {
      ausgabe.push({ art: 'einzeln', ziel: lauf[0]! })
    } else {
      ausgabe.push({
        art: 'gemeinsame-leere-einreise',
        countryCode: signatur.countryCode,
        countryLabel: signatur.countryLabel,
        text: einreiseinformationenUngeprueft(signatur.countryLabel),
        ziele: lauf,
      })
    }
    lauf = []
    signatur = null
  }

  for (const ziel of ziele) {
    const naechste = generischeLeereEinreiseSignatur(ziel)
    if (naechste && signatur && gleicheSignatur(signatur, naechste)) {
      lauf.push(ziel)
      continue
    }
    abschliessen()
    if (naechste) {
      signatur = naechste
      lauf = [ziel]
    } else {
      ausgabe.push({ art: 'einzeln', ziel })
    }
  }
  abschliessen()
  return ausgabe
}

export function u3bHinweisAnzahl(ziel: DestinationEssentialZiel): number {
  return ziel.einreise.details.length + ziel.sicherheit.details.length + ziel.saison.details.length
}

export function u3bQuellenAnzahl(ziel: DestinationEssentialZiel): number {
  return ziel.einreise.links.length + ziel.sicherheit.links.length + ziel.saison.links.length
}
