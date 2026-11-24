// W3: read-only presentation. The current TripItem contract accepts only user
// booking evidence. Provider names, references, links, prices, free text and
// bookingConfirmedAt/rowVersion do not prove a provider booking or a price time.
import type { TripItem } from '@/types/trips'
import { kannBuchungMarkieren } from '@/lib/trips/buchung'

export const W3_STATUS_TEXT = {
  unverbindliches_angebot: 'Unverbindliches Angebot – nicht gebucht',
  vom_nutzer_markiert: 'Von dir als gebucht markiert – nicht vom Anbieter bestätigt',
  anbieter_bestaetigt: 'Vom Anbieter bestätigte Buchung',
} as const

// Reserved label: NO reachable producer of provider confirmation in this slice.
export type W3Leistungsstand = keyof typeof W3_STATUS_TEXT
export type AktuellerLeistungsstand = Exclude<W3Leistungsstand, 'anbieter_bestaetigt'>

export function leistungsstand(punkt: Pick<TripItem, 'kind' | 'bookingStatus' | 'bookingSource'>): AktuellerLeistungsstand {
  return kannBuchungMarkieren(punkt) && punkt.bookingStatus === 'booked' && punkt.bookingSource === 'user'
    ? 'vom_nutzer_markiert'
    : 'unverbindliches_angebot'
}

export const W3_PREIS_UNBEKANNT = 'Preisstand unbekannt'
export const W3_PREIS_HINWEIS = 'Preis kann sich ändern.'

// The actual matching provider-search response supplies this timestamp.
// It is the start of the search, not a live-price claim or guarantee.
export function suchzeitText(zeit: number | null | undefined): string | null {
  if (typeof zeit !== 'number' || !Number.isSafeInteger(zeit) || zeit <= 0) return null
  const datum = new Date(zeit)
  if (!Number.isFinite(datum.getTime())) return null
  return new Intl.DateTimeFormat('de-CH', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Zurich',
  }).format(datum) + ' Uhr (Schweiz)'
}

export function preisstandText(suchzeit?: number | null): string {
  const zeit = suchzeitText(suchzeit)
  return zeit ? 'Preis aus Suche vom ' + zeit : W3_PREIS_UNBEKANNT
}
