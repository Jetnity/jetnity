// SYNTHETIC ONLY. Real U1 orchestration over private in-memory test adapters.
import type { Ladung } from '@/lib/admin/ladezustand'
import { createV3VisitorQuery, queryOfficialTruthVisitorV3 } from '@/lib/readiness/official-truth-product-v3/visitor/query'
import { presentV3VisitorAnswer, type V3VisitorView } from '@/lib/readiness/official-truth-product-v3/visitor/presentation'
import { syntheticV3Fixture } from '@/lib/readiness/official-truth-product-v3/visitor/test-fixtures'
import { readV3VisitorInput } from '@/lib/readiness/official-truth-product-v3/contract'

export function syntheticServer() {
  const fixture = syntheticV3Fixture()
  const conflictFixture = syntheticV3Fixture()
  conflictFixture.setState('conflict')
  const conditionsFixture = syntheticV3Fixture()
  const business = conditionsFixture.make(conditionsFixture.context('CH', 'business')).projection
  conditionsFixture.cache.set(business.rule.subject.contextKey, business)
  const applicationFixture = syntheticV3Fixture()
  const applicationProjection = applicationFixture.application.projection
  applicationFixture.cache.set(applicationProjection.rule.subject.contextKey, applicationProjection)
  const normal = createV3VisitorQuery(fixture.ports)
  const completionFixture = syntheticV3Fixture()
  const completion = createV3VisitorQuery(completionFixture.ports)
  let completionReads = 0
  const queries = {
    mixed: normal,
    conflict: createV3VisitorQuery(conflictFixture.ports),
    unbound: queryOfficialTruthVisitorV3,
    read_error: createV3VisitorQuery({ ...fixture.ports, cache: { read: async () => ({
      zeilen: null, problem: { status: 503, message: 'SYNTHETIC private read failure' } }) } }),
    conditions: createV3VisitorQuery({ ...conditionsFixture.ports, coverage: { targets: async (input, signal) =>
      input.destinationCountryCode === 'DE' && input.citizenshipCountryCode === 'CH'
        ? { zeilen: [{ context: conditionsFixture.context(), factKind: 'blank_passport_pages' },
          { context: conditionsFixture.context('CH', 'business'), factKind: 'blank_passport_pages' }], problem: null }
        : conditionsFixture.ports.coverage.targets(input, signal) } }),
    application: createV3VisitorQuery({ ...applicationFixture.ports, coverage: { targets: async (input, signal) =>
      input.destinationCountryCode === 'DE' && input.citizenshipCountryCode === 'CH'
        ? { zeilen: [{ context: applicationFixture.applicationContext(), factKind: 'blank_passport_pages' }], problem: null }
        : applicationFixture.ports.coverage.targets(input, signal) } }),
    slow: normal,
    complete: async (input: unknown, signal: AbortSignal) => {
      const parsed = readV3VisitorInput(input)
      if (parsed.ok && parsed.value.destinationCountryCode === 'DE' && parsed.value.citizenshipCountryCodes.includes('RS')) {
        completionReads += 1
        if (completionReads > 1) {
          // Explicit synthetic research completion. This is not an M1 worker,
          // database commit or method approval; the real U1 reproof still runs.
          const prepared = completionFixture.make(completionFixture.context('RS')).projection
          completionFixture.cache.set(prepared.rule.subject.contextKey, prepared)
        }
      }
      return completion(input, signal)
    },
  }
  return async (raw: unknown, signal: AbortSignal): Promise<Ladung<V3VisitorView>> => {
    const error: Ladung<V3VisitorView> = { daten: null, fehler: { meldung: 'Synthetic failure', wiederholbar: true } }
    if (!raw || typeof raw !== 'object' || !('scenario' in raw) || !('input' in raw)
      || Object.keys(raw).some((key) => key !== 'scenario' && key !== 'input')) return error
    const scenario = raw.scenario
    if (typeof scenario !== 'string' || !Object.prototype.hasOwnProperty.call(queries, scenario)) return error
    if (scenario === 'slow') await new Promise<void>((resolve) => setTimeout(resolve, 400))
    const query = queries[scenario as keyof typeof queries]
    const result = await query(raw.input, signal)
    return result.ok ? { daten: presentV3VisitorAnswer(result.answer), fehler: null } : error
  }
}
