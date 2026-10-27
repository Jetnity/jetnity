// lib/providers/twelve-go/affiliate/kanten.ts
//
// Benachbarte Zielvorkommen und der dazu passende 12Go-Ausgangs-Link.
// Keine Anbieteranfrage, kein Angebot, keine Buchung, kein Datum in der URL.
// Frei von React und Next.

import { datumKurz } from '@/lib/trips/datum-anzeige'
import {
  TWELVE_GO_GEPRUEFTE_ROUTEN,
  type TwelveGoGepruefteRoute,
  type TwelveGoOrtArt,
} from '@/lib/providers/twelve-go/affiliate/konstanten'
import { twelveGoAffiliateUrl, twelveGoGenerischeSuche } from '@/lib/providers/twelve-go/affiliate/url'
import type { Trip, TripItem } from '@/types/trips'

export const TWELVE_GO_HINWEIS =
  'Externer Affiliate-Link – Angebote, Verfügbarkeit und Buchung ausschliesslich bei 12Go'
const TWELVE_GO_GENERISCHE_STRECKE = 'Bitte Strecke und Datum bei 12Go auswählen'
const TWELVE_GO_DATUM_WAEHLEN = 'Bitte das Datum bei 12Go wählen.'
const TWELVE_GO_WAEHRUNG = 'Währung und Anzahl Reisende bitte bei 12Go prüfen.'

const ORT_ID = /^geonames:\d+$/
const ISO_TAG = /^(\d{4})-(\d{2})-(\d{2})$/

export type TwelveGoEndpunktArt = TwelveGoOrtArt | 'region' | 'country' | 'airport' | 'station'

export type TwelveGoEndpunkt = {
  occurrenceId: string
  position: number
  name: string
  placeId: string | null
  countryCode: string | null
  kind: TwelveGoEndpunktArt | null
}

export type TwelveGoTransferFakt = {
  id: string
  originPlaceId: string | null
  destinationPlaceId: string | null
  startsOn: string | null
}

export type TwelveGoKante = {
  id: string
  vonOccurrenceId: string
  nachOccurrenceId: string
  vonName: string
  nachName: string
  vonPlaceId: string | null
  nachPlaceId: string | null
  vonLand: string | null
  nachLand: string | null
  art: 'route' | 'generic'
  href: string
  aktion: string
  streckenHinweis: string | null
  datumHinweis: string
  geplantesDatum: string | null
  waehrungHinweis: string
  hinweis: string
}

function kalender(wert: string | null | undefined): string | null {
  if (!wert) return null
  const teile = ISO_TAG.exec(wert)
  if (!teile) return null
  const jahr = Number(teile[1])
  const monat = Number(teile[2])
  const tag = Number(teile[3])
  const zeit = new Date(Date.UTC(jahr, monat - 1, tag))
  if (zeit.getUTCFullYear() !== jahr || zeit.getUTCMonth() !== monat - 1 || zeit.getUTCDate() !== tag) return null
  return wert
}

function routeHref(
  von: TwelveGoEndpunkt,
  nach: TwelveGoEndpunkt,
  register: readonly TwelveGoGepruefteRoute[],
): string | null {
  if (!von.placeId || !nach.placeId || von.placeId === nach.placeId) return null
  if (!ORT_ID.test(von.placeId) || !ORT_ID.test(nach.placeId)) return null
  if (von.kind !== 'city' && von.kind !== 'island') return null
  if (nach.kind !== 'city' && nach.kind !== 'island') return null
  const treffer = register.filter(
    (eintrag) =>
      eintrag.originPlaceId === von.placeId &&
      eintrag.destinationPlaceId === nach.placeId &&
      eintrag.originKind === von.kind &&
      eintrag.destinationKind === nach.kind,
  )
  if (treffer.length !== 1) return null
  return twelveGoAffiliateUrl(treffer[0]!.path)
}

function geplantesDatum(
  von: TwelveGoEndpunkt,
  nach: TwelveGoEndpunkt,
  transfers: readonly TwelveGoTransferFakt[],
): string | null {
  if (!von.placeId || !nach.placeId) return null
  const treffer = transfers.filter(
    (transfer) =>
      transfer.originPlaceId === von.placeId &&
      transfer.destinationPlaceId === nach.placeId &&
      kalender(transfer.startsOn) !== null,
  )
  if (treffer.length !== 1) return null
  return kalender(treffer[0]!.startsOn)
}

function kanteAus(
  von: TwelveGoEndpunkt,
  nach: TwelveGoEndpunkt,
  transfers: readonly TwelveGoTransferFakt[],
  register: readonly TwelveGoGepruefteRoute[],
  generisch: string,
): TwelveGoKante {
  const route = routeHref(von, nach, register)
  const art = route ? 'route' : 'generic'
  const vonName = von.name.trim()
  const nachName = nach.name.trim()
  const datum = geplantesDatum(von, nach, transfers)
  return {
    id: `${von.occurrenceId}:${nach.occurrenceId}`,
    vonOccurrenceId: von.occurrenceId,
    nachOccurrenceId: nach.occurrenceId,
    vonName,
    nachName,
    vonPlaceId: von.placeId,
    nachPlaceId: nach.placeId,
    vonLand: von.countryCode,
    nachLand: nach.countryCode,
    art,
    href: route ?? generisch,
    aktion:
      art === 'route'
        ? `Verbindungen ${vonName}–${nachName} bei 12Go ansehen`
        : 'Bei 12Go selbst nach Verbindungen suchen',
    streckenHinweis: art === 'generic' ? TWELVE_GO_GENERISCHE_STRECKE : null,
    datumHinweis: datum
      ? `Geplant am ${datumKurz(datum)}. Bitte das Datum bei 12Go bestätigen.`
      : TWELVE_GO_DATUM_WAEHLEN,
    geplantesDatum: datum,
    waehrungHinweis: TWELVE_GO_WAEHRUNG,
    hinweis: TWELVE_GO_HINWEIS,
  }
}

/**
 * Genau die benachbarten bestätigten Vorkommen, in Positions- dann
 * Vorkommensreihenfolge. Eine Lücke ohne Namen verbindet die Nachbarn nicht.
 * Herkunft und Heimreise entstehen hier nicht.
 */
export function twelveGoKantenAusVorkommen(
  vorkommen: readonly TwelveGoEndpunkt[],
  transfers: readonly TwelveGoTransferFakt[],
  register: readonly TwelveGoGepruefteRoute[],
): TwelveGoKante[] {
  const geordnet = [...vorkommen]
    .filter((ort) => ort.occurrenceId.trim().length > 0)
    .sort((links, rechts) => links.position - rechts.position || links.occurrenceId.localeCompare(rechts.occurrenceId))
  const eindeutig: TwelveGoEndpunkt[] = []
  const gesehen = new Set<string>()
  for (const ort of geordnet) {
    if (gesehen.has(ort.occurrenceId)) continue
    gesehen.add(ort.occurrenceId)
    eindeutig.push(ort)
  }

  const generisch = twelveGoGenerischeSuche()
  const kanten: TwelveGoKante[] = []
  for (let index = 1; index < eindeutig.length; index += 1) {
    const von = eindeutig[index - 1]!
    const nach = eindeutig[index]!
    if (!von.name.trim() || !nach.name.trim()) continue
    kanten.push(kanteAus(von, nach, transfers, register, generisch))
  }
  return kanten
}

function artAusPlaceId(placeId: string | null): TwelveGoEndpunkt['kind'] {
  if (placeId?.startsWith('airport:')) return 'airport'
  return null
}

function transfersAus(reise: Trip): TwelveGoTransferFakt[] {
  const punkte: TripItem[] = [...reise.days.flatMap((tag) => tag.items), ...reise.ohneTag]
  return punkte
    .filter((punkt) => punkt.kind === 'transfer')
    .map((punkt) => ({
      id: punkt.id,
      originPlaceId: punkt.originPlaceId,
      destinationPlaceId: punkt.destinationPlaceId,
      startsOn: punkt.startsOn,
    }))
}

/** Produktionspfad. Das Register bleibt das leere geprüfte Verzeichnis. */
export function twelveGoKantenFuerReise(reise: Trip): TwelveGoKante[] {
  return twelveGoKantenAusVorkommen(
    reise.stages.map((etappe) => ({
      occurrenceId: etappe.id,
      position: etappe.position,
      name: etappe.name,
      placeId: etappe.placeId,
      countryCode: etappe.countryCode,
      kind: artAusPlaceId(etappe.placeId),
    })),
    transfersAus(reise),
    TWELVE_GO_GEPRUEFTE_ROUTEN,
  )
}
