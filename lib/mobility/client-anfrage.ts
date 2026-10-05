// lib/mobility/client-anfrage.ts
//
// Browser-Aufruf der geschlossenen Mobilitätssuche.

import { LEERE_MOBILITY_EVIDENZ } from '@/lib/mobility/domain'
import type { MobilitySucheAntwort } from '@/lib/mobility/client-sicht'
import type { MobilitySucheEingabe } from '@/lib/mobility/schema'

export function mobilitySucheFehlerAntwort(message: string): MobilitySucheAntwort {
  return {
    status: 'error',
    message,
    coverageNote: '',
    evidenz: LEERE_MOBILITY_EVIDENZ,
    options: [],
  }
}

export async function mobilitySucheVomClient(
  eingabe: MobilitySucheEingabe,
  signal?: AbortSignal,
): Promise<MobilitySucheAntwort> {
  const antwort = await fetch('/api/mobility/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(eingabe),
    signal,
  })

  try {
    const koerper = (await antwort.json()) as MobilitySucheAntwort
    if (koerper && typeof koerper.status === 'string' && typeof koerper.message === 'string') {
      return koerper
    }
  } catch {
    // Die Antwort war kein JSON. Unten die allgemeine Meldung.
  }

  if (antwort.status === 429) {
    return mobilitySucheFehlerAntwort('Zu viele Suchanfragen. Bitte später erneut versuchen.')
  }
  return mobilitySucheFehlerAntwort('Die Mobilitätssuche ist gerade nicht verfügbar.')
}
