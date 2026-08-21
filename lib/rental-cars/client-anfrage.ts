// lib/rental-cars/client-anfrage.ts
//
// Browser-Aufruf der geschlossenen Mietwagensuche.

import { LEERE_RENTAL_EVIDENZ } from '@/lib/rental-cars/domain'
import type { RentalCarSucheAntwort } from '@/lib/rental-cars/client-sicht'
import type { RentalCarSucheEingabe } from '@/lib/rental-cars/schema'

export function rentalCarSucheFehlerAntwort(message: string): RentalCarSucheAntwort {
  return {
    status: 'error',
    message,
    coverageNote: '',
    evidenz: LEERE_RENTAL_EVIDENZ,
    options: [],
  }
}

export async function rentalCarSucheVomClient(
  eingabe: RentalCarSucheEingabe,
  signal?: AbortSignal,
): Promise<RentalCarSucheAntwort> {
  const antwort = await fetch('/api/rental-cars/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(eingabe),
    signal,
  })

  try {
    const koerper = (await antwort.json()) as RentalCarSucheAntwort
    if (koerper && typeof koerper.status === 'string' && typeof koerper.message === 'string') {
      return koerper
    }
  } catch {
    // Die Antwort war kein JSON. Unten die allgemeine Meldung.
  }

  if (antwort.status === 429) {
    return rentalCarSucheFehlerAntwort('Zu viele Suchanfragen. Bitte später erneut versuchen.')
  }
  return rentalCarSucheFehlerAntwort('Die Mietwagensuche ist gerade nicht verfügbar.')
}
