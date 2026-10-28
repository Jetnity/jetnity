import {
  isViatorSearchCurrency,
  type ViatorPrice,
  type ViatorPriceRole,
  type ViatorSearchCurrency,
} from '@/lib/providers/viator/activities/contracts'

const MAX_AMOUNT = 9_999_999.99

export function readViatorCurrency(value: unknown): ViatorSearchCurrency | null {
  if (typeof value !== 'string' || !/^[A-Z]{3}$/.test(value)) return null
  return isViatorSearchCurrency(value) ? value : null
}

/**
 * Customer price is recommended retail / from-price only.
 * A supplier currency that differs from the stated price currency is not
 * converted. Checkout transfer, including CHF, is never confirmed.
 */
export function readViatorCustomerPrice(input: {
  amount: unknown
  currency: unknown
  priceRole: ViatorPriceRole
  supplierCurrency?: ViatorSearchCurrency | null
}): ViatorPrice | null {
  if (typeof input.amount !== 'number' || !Number.isFinite(input.amount)) return null
  if (input.amount < 0 || input.amount > MAX_AMOUNT) return null
  const cents = Math.round(input.amount * 100)
  if (Math.abs(cents / 100 - input.amount) > 1e-6) return null
  const currency = readViatorCurrency(input.currency)
  if (!currency) return null
  if (input.supplierCurrency && input.supplierCurrency !== currency) return null
  return {
    amount: input.amount,
    currency,
    priceRole: input.priceRole,
    checkoutCurrencyConfirmed: false,
  }
}

/** Full Access non-transactional: no checkout currency is transferred. */
export function viatorCheckoutTransfer(currency: string | null): {
  supported: false
  reason: 'checkout_currency_not_transferred'
  currency: string | null
} {
  return {
    supported: false,
    reason: 'checkout_currency_not_transferred',
    currency,
  }
}
