import type { RentalOffer } from './contract'

/**
 * A cancellation deadline belongs to the CURRENT provider offer. No Jetnity-wide
 * 24h or 48h promise, and no inferred deadline when the provider omits one.
 * The rental terms at the selected supplier remain authoritative.
 */
export function cancellationText(value: RentalOffer['cancellation']): string {
  if (value?.type !== 'free')
    return value?.type === 'non_refundable' ? 'Nicht erstattbar' : 'Siehe Mietbedingungen'
  const hours = value.details?.hours_before_pickup
  return hours == null
    ? 'Kostenfrei gemäss Mietbedingungen (Frist nicht angegeben)'
    : `Kostenfrei bis ${hours} Std. vor Abholung (laut diesem Angebot)`
}
