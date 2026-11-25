import type { V3VisitorView } from '../official-truth-product-v3/visitor/presentation'

/** Copy supplied only by a separately reviewed, server-held release. */
export type AtApprovedVisitorCopy = Readonly<{
  approvalReference: string
  scope: string
  officialLinks: string
  fraudWarning: string
  liability: string
}>

/** Transport eligibility is not legal approval. Empty or absent copy fails closed. */
export function resolveAtApprovedVisitorCopy(transportEligible: boolean, copy: AtApprovedVisitorCopy | null): AtApprovedVisitorCopy | null {
  if (!transportEligible || !copy) return null
  return Object.values(copy).every(value => typeof value === 'string' && value.trim().length > 0) ? copy : null
}

/** Proposed, conservative UI lease. No new polling or source fetch. The legal
 * fact itself retains its stricter one-hour / 70-minute source limits.
 * A flag rollback refuses new reads; an already open tab loses the positive
 * projection at the earlier of this deadline and its original expiry. */
export function capAtProductionDisplayLease(view: V3VisitorView): V3VisitorView {
  const issued = Date.parse(view.generatedAt)
  return { ...view, cells: view.cells.map(cell => ({ ...cell, results: cell.results.map(result => {
    if (result.status !== 'accepted') return result
    const until = Math.min(Date.parse(result.expiresAt), issued + 60_000)
    if (cell.country !== 'CH' || !Number.isFinite(until) || until <= issued) return {
      status: 'unavailable' as const, title: 'Derzeit nicht verfügbar',
      message: 'Für diesen Pass liegt derzeit keine bestätigte amtliche Visumauskunft vor.',
    }
    return { ...result, expiresAt: new Date(until).toISOString() }
  }) })) }
}
