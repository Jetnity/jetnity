// Abfrage und Antwort-Reihenfolge für die lesende Admin-Transaktionsliste.
//
// Die Karte zeigt den Filter, den die Bedienung gerade sieht. Eine Antwort darf
// nur dann die Tabelle füllen, wenn sie zu genau dieser Abfrage gehört. Eine
// ältere, noch laufende Antwort bleibt eine ältere Antwort.

const TRANSACTION_STATUSES = ['all', 'paid', 'pending', 'failed', 'refunded'] as const

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number]

export type TransactionFilterSnapshot = {
  q: string
  status: TransactionStatus
}

export type TransactionReadClock = {
  latest: number
}

export function isTransactionStatus(value: string): value is TransactionStatus {
  return (TRANSACTION_STATUSES as readonly string[]).includes(value)
}

/** Sichtbarer Suchtext ohne Randzeichen, plus der gewählte Status. */
export function transactionFilterSnapshot(q: string, status: TransactionStatus): TransactionFilterSnapshot {
  return { q: q.trim(), status }
}

export function transactionFiltersMatch(
  left: TransactionFilterSnapshot,
  right: TransactionFilterSnapshot,
): boolean {
  return left.q === right.q && left.status === right.status
}

/**
 * Pfad der bestehenden Listenroute.
 *
 * `all` setzt keinen Status. Leeres `q` setzt keine Suche. Ein Cursor gehört
 * nur zur nächsten Seite derselben bereits bestätigten Abfrage.
 */
export function transactionListQuery(snapshot: TransactionFilterSnapshot, cursor: string | null): string {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  if (snapshot.q) params.set('q', snapshot.q)
  if (snapshot.status !== 'all') params.set('status', snapshot.status)
  const query = params.toString()
  return query.length > 0 ? `/api/admin/payments/list?${query}` : '/api/admin/payments/list'
}

/** Neue Abfrage. Die zurückgegebene Nummer ist nur aktuell, solange keine neuere folgt. */
export function beginTransactionRead(clock: TransactionReadClock): number {
  clock.latest += 1
  return clock.latest
}

export function transactionReadIsCurrent(clock: TransactionReadClock, requestId: number): boolean {
  return requestId > 0 && requestId === clock.latest
}
