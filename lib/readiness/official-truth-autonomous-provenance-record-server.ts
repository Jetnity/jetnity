import 'server-only'

// Deliberately private. No exported issuer, dependency injection, test factory or DTO loader.
// A stage handle only records this skeleton's invocation membership, never origin/acceptance.
const stages = ['admission', 'custody', 'selection', 'review', 'capture', 'bundle'] as const
type Stage = (typeof stages)[number]
type Handle = Readonly<object>
const denied = Object.freeze({ status: 'blocked' as const, reason: 'authority_required' as const })

function createInvocation() {
  const ledger = new WeakMap<object, { stage: Stage; predecessor: Handle | null }>()
  let open = true
  let current: Handle | null = null
  let next = 0
  function close() { open = false; current = null }
  function belongs(handle: unknown, stage: Stage, predecessor: Handle | null): boolean {
    if (!open || !handle || typeof handle !== 'object' || handle !== current) return false
    const entry = ledger.get(handle)
    return !!entry && entry.stage === stage && entry.predecessor === predecessor
  }
  // Non-exported issuance, retained only by this closure. No value/ID/pin authorizes entry.
  function advance(predecessor: Handle | null, stage: Stage) {
    if (!open || stages[next] !== stage || predecessor !== current
      || (next > 0 && (!predecessor || !ledger.has(predecessor)))) { close(); return denied }
    const handle: Handle = Object.freeze(Object.create(null) as object)
    ledger.set(handle, { stage, predecessor }); current = handle; next++
    return Object.freeze({ status: 'stage' as const, handle })
  }
  function consume(handle: unknown, stage: Stage, predecessor: Handle | null) {
    if (!belongs(handle, stage, predecessor)) { close(); return denied }
    // Terminal consumption prevents re-entry/reuse, including after successful publication.
    close()
    return Object.freeze({ status: 'closed' as const })
  }
  return Object.freeze({ advance, belongs, consume, close })
}

/** No caller input, authority loader, catalog, origin issuer, resolver or I/O dependencies.
 * Historical bytes/IDs (even passed by a role-authorized caller) cannot enter this root.
 */
export function runOfficialTruthGlobalProduction() {
  const invocation = createInvocation()
  invocation.close()
  return Object.freeze({ status: 'blocked' as const, reason: 'custody_missing' as const })
}
