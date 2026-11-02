import { cn } from '@/lib/utils'
import type { RentalResponse } from '@/lib/providers/discovercars/search/contract'

export async function rentalRequest(body: unknown, signal: AbortSignal): Promise<RentalResponse> {
  const response = await fetch('/api/rental-cars/discovercars', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal, cache: 'no-store',
  })
  const data: RentalResponse = await response.json()
  return data
}

export const FIELD = 'min-h-11 min-w-0 w-full max-w-full rounded-2xl border border-line-200 bg-white px-3 py-2 text-sm text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600'
export const BUTTON = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800 transition hover:bg-surface-25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:opacity-50'
export const PRIMARY = cn(BUTTON, 'border-transparent bg-brand-800 text-white hover:bg-brand-900')
export const CATEGORY: Record<string, string> = { small: 'Kleinwagen', medium: 'Mittelklasse', large: 'Grosse Fahrzeuge', premium: 'Premium', suv: 'SUV', vans: 'Vans', commercial: 'Nutzfahrzeuge' }
export const TRANSMISSION: Record<string, string> = { automatic: 'Automatik', manual: 'Schaltung' }
export function money(amount: number | null | undefined, currency: string) {
  return amount == null ? 'Nicht angegeben' : new Intl.NumberFormat('de-CH', { style: 'currency', currency }).format(amount)
}
