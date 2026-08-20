// lib/reiseaenderung/geschuetzt.ts
//
// Kommerzielle Felder gehören nicht dem Modell.
//
// Ein Planpunkt, der vor der Änderung einen Preis, Anbieter oder Buchungslink
// trug, behält ihn, solange er dieselbe Kennung hat. Fehlt er nach der
// Anwendung – etwa durch punkt_entfernen oder eine gekürzte Etappe –, landet
// er ungeplant wieder auf der Reise. Neue Planpunkte bleiben ohne diese Felder.
// Die Nutzlast an die Datenbank darf sie nicht überschreiben; diese Funktion
// ist die TypeScript-Seite derselben Regel.
//
// Frei von Next, Supabase und `process.env`.

import type { Reisegraph, TripItem } from '@/types/trips'

const GESCHUETZTE_FELDER = [
  'priceAmount',
  'priceCurrency',
  'provider',
  'externalRef',
  'bookingUrl',
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
  }
}

/** Ein Planpunkt mit Anbieter, Buchungslink, Fremdkennung oder Preis. */
export function istKommerziell(punkt: TripItem): boolean {
  return Boolean(
    punkt.provider || punkt.bookingUrl || punkt.externalRef || punkt.priceAmount !== null,
  )
}

function leer(): Pick<TripItem, GeschuetztesFeld> {
  return {
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
  }
}

/**
 * Kopiert geschützte Felder vom Original auf Planpunkte gleicher Kennung.
 *
 * Neue Kennungen bekommen leere Handelsfelder, auch wenn irgendwo Werte
 * mitgereist wären.
 */
export function kommerziellErhalten(vorher: Reisegraph, nachher: Reisegraph): Reisegraph {
  const ursprung = new Map(allePunkte(vorher).map((punkt) => [punkt.id, punkt]))
  const danach = new Set(allePunkte(nachher).map((punkt) => punkt.id))

  const punktAnpassen = (punkt: TripItem): TripItem => {
    const alt = ursprung.get(punkt.id)
    return { ...punkt, ...(alt ? handelswerte(alt) : leer()) }
  }

  const wiederhergestellt = allePunkte(vorher)
    .filter((punkt) => istKommerziell(punkt) && !danach.has(punkt.id))
    .map((punkt) => ({
      ...punkt,
      dayId: null,
      stageId: null,
    }))

  return {
    ...nachher,
    days: nachher.days.map((tag) => ({
      ...tag,
      items: tag.items.map(punktAnpassen),
    })),
    ohneTag: [...nachher.ohneTag.map(punktAnpassen), ...wiederhergestellt],
  }
}
