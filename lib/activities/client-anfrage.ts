// lib/activities/client-anfrage.ts
//
// Browser-Aufruf der geschlossenen Aktivitätensuche.
// Die Domain-, Ranking- und Providerlogik bleibt serverseitig.
//
// Frei von Next.

import type { ActivitySucheAntwort } from '@/lib/activities/client-sicht'
import { ACTIVITY_ABDECKUNGSHINWEIS, LEERE_ACTIVITY_EVIDENZ } from '@/lib/activities/domain'

export function activitySucheFehlerAntwort(message: string): ActivitySucheAntwort {
  return {
    status: 'error',
    message,
    coverageNote: ACTIVITY_ABDECKUNGSHINWEIS,
    evidenz: { ...LEERE_ACTIVITY_EVIDENZ },
    options: [],
  }
}

export async function activitySucheVomClient(
  eingabe: unknown,
  optionen: { signal?: AbortSignal; fetchFn?: typeof fetch } = {},
): Promise<ActivitySucheAntwort> {
  const fetchFn = optionen.fetchFn ?? fetch
  const res = await fetchFn('/api/activities/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(eingabe),
    signal: optionen.signal,
  })
  const json = (await res.json()) as ActivitySucheAntwort
  if (!res.ok && !json.message) {
    return activitySucheFehlerAntwort('Die Aktivitätsanfrage ist fehlgeschlagen.')
  }
  return json
}
