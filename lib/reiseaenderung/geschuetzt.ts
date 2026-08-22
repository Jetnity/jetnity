// lib/reiseaenderung/geschuetzt.ts
//
// Kommerzielle Planpunkte gehören nicht dem Modell.
//
// Ein Planpunkt mit Preis, Anbieter, Fremdkennung oder Buchungslink bleibt
// bis Phase 3 vollständig gesperrt: Inhalt, Termin und Zuordnung dürfen eine
// Modelloperation nicht verändern. Entfällt sein Tag oder seine Etappe,
// bleibt er ungeplant und sonst unverändert. Neue Planpunkte bleiben ohne
// Handelsfelder. Die Nutzlast an die Datenbank darf Handelsfelder nicht
// überschreiben; diese Funktion ist die TypeScript-Seite derselben Regel.
//
// Frei von Next, Supabase und `process.env`.

import type { Reisegraph, TripItem } from '@/types/trips'

const GESCHUETZTE_FELDER = [
  'priceAmount',
  'priceCurrency',
  'provider',
  'externalRef',
  'bookingUrl',
  'bookingStatus',
  'bookingSource',
  'bookingConfirmedAt',
  'mobilityMode',
  'originPlaceId',
  'destinationPlaceId',
  'originName',
  'destinationName',
  'connectionRef',
  'mobilityChanges',
  'mobilityEvidence',
  'rentalSupplier',
  'vehicleClass',
  'transmission',
  'rentalEvidence',
] as const

type GeschuetztesFeld = (typeof GESCHUETZTE_FELDER)[number]

function allePunkte(reise: Reisegraph): TripItem[] {
  return [...reise.days.flatMap((tag) => tag.items), ...reise.ohneTag]
}

function handelswerte(punkt: TripItem): Pick<TripItem, GeschuetztesFeld> {
  return {
    priceAmount: punkt.priceAmount,
    priceCurrency: punkt.priceCurrency,
    provider: punkt.provider,
    externalRef: punkt.externalRef,
    bookingUrl: punkt.bookingUrl,
    bookingStatus: punkt.bookingStatus,
    bookingSource: punkt.bookingSource,
    bookingConfirmedAt: punkt.bookingConfirmedAt,
    mobilityMode: punkt.mobilityMode,
    originPlaceId: punkt.originPlaceId,
    destinationPlaceId: punkt.destinationPlaceId,
    originName: punkt.originName,
    destinationName: punkt.destinationName,
    connectionRef: punkt.connectionRef,
    mobilityChanges: punkt.mobilityChanges,
    mobilityEvidence: punkt.mobilityEvidence,
    rentalSupplier: punkt.rentalSupplier,
    vehicleClass: punkt.vehicleClass,
    transmission: punkt.transmission,
    rentalEvidence: punkt.rentalEvidence,
  }
}

/** Ein Planpunkt mit Anbieter, Buchungslink, Fremdkennung, Preis oder Buchungsstatus. */
export function istKommerziell(punkt: TripItem): boolean {
  return Boolean(
    punkt.provider ||
      punkt.bookingUrl ||
      punkt.externalRef ||
      punkt.priceAmount !== null ||
      punkt.bookingStatus === 'booked',
  )
}

function leer(): Pick<TripItem, GeschuetztesFeld> {
  return {
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    bookingStatus: 'unconfirmed',
    bookingSource: null,
    bookingConfirmedAt: null,
    mobilityMode: null,
    originPlaceId: null,
    destinationPlaceId: null,
    originName: null,
    destinationName: null,
    connectionRef: null,
    mobilityChanges: null,
    mobilityEvidence: null,
    rentalSupplier: null,
    vehicleClass: null,
    transmission: null,
    rentalEvidence: null,
  }
}

function kommerziellWiederherstellen(
  original: TripItem,
  vorhandeneTage: Set<string>,
  vorhandeneEtappen: Set<string>,
): TripItem {
  const tagDa = original.dayId !== null && vorhandeneTage.has(original.dayId)
  const etappeDa = original.stageId === null || vorhandeneEtappen.has(original.stageId)
  if (tagDa && etappeDa) {
    return { ...original }
  }
  return { ...original, dayId: null, stageId: null }
}

/**
 * Stellt kommerzielle Planpunkte vollständig wieder her und leert
 * Handelsfelder auf neuen Kennungen.
 *
 * Solange Tag und Etappe noch existieren, bleibt der Originalpunkt unverändert
 * auf seinem Tag. Sonst landet er ungeplant, ohne Termin- oder Inhaltsänderung.
 */
export function kommerziellErhalten(vorher: Reisegraph, nachher: Reisegraph): Reisegraph {
  const ursprung = new Map(allePunkte(vorher).map((punkt) => [punkt.id, punkt]))
  const kommerziell = allePunkte(vorher).filter(istKommerziell)
  const kommerziellIds = new Set(kommerziell.map((punkt) => punkt.id))
  const vorhandeneTage = new Set(nachher.days.map((tag) => tag.id))
  const vorhandeneEtappen = new Set(nachher.stages.map((etappe) => etappe.id))

  const punktAnpassen = (punkt: TripItem): TripItem => {
    const alt = ursprung.get(punkt.id)
    return { ...punkt, ...(alt ? handelswerte(alt) : leer()) }
  }

  const tage = nachher.days.map((tag) => ({
    ...tag,
    items: tag.items.filter((punkt) => !kommerziellIds.has(punkt.id)).map(punktAnpassen),
  }))

  const ohne = nachher.ohneTag
    .filter((punkt) => !kommerziellIds.has(punkt.id))
    .map(punktAnpassen)

  const ungeplant: TripItem[] = []
  for (const original of kommerziell) {
    const wieder = kommerziellWiederherstellen(original, vorhandeneTage, vorhandeneEtappen)
    if (wieder.dayId) {
      const ziel = tage.find((tag) => tag.id === wieder.dayId)
      ziel?.items.push(wieder)
    } else {
      ungeplant.push(wieder)
    }
  }

  for (const tag of tage) {
    tag.items.sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
  }

  return {
    ...nachher,
    days: tage,
    ohneTag: [...ohne, ...ungeplant],
  }
}
