// Belegwahrheit für gespeicherte Angebote. Keine Preise aus alten Suchkarten.
import type { SavedOffer } from '@/lib/saved-offers/contract'

export type OfferEvidence = {
  herkunft: string
  preis: string
  frist: string
  buchung: string
}

/**
 * A bookmark is only a reference. Its optional expiry is NOT a provider
 * revalidation; even a not-yet-expired link is not a quoted fresh price.
 */
export function savedOfferEvidence(
  offer: Pick<SavedOffer, 'source' | 'provider' | 'expires_at'>,
  now = Date.now(),
): OfferEvidence {
  const herkunft = offer.source === 'discovercars'
    ? 'DiscoverCars – geprüfte Angebotsreferenz beim Merken, keine neue Provider-Antwort'
    : 'Von dir selbst erfasster Link – Angaben nicht unabhängig von Jetnity bestätigt'
  const preis = 'Aktueller Preis und Verfügbarkeit nicht geprüft'
  const expiryMs = offer.expires_at ? Date.parse(offer.expires_at) : NaN
  const frist = Number.isFinite(expiryMs)
    ? expiryMs <= now
      ? 'Ursprünglicher Suchbeleg abgelaufen – eine neue Suche ist notwendig'
      : 'Ursprüngliche Referenz noch innerhalb ihrer Frist – kein aktueller Preisnachweis'
    : 'Ohne Anbieter-Gültigkeitsnachweis'
  return { herkunft, preis, frist, buchung: 'Nur gemerkt, nicht gebucht' }
}
