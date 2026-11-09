// Local process benchmark only; no network, database, region or public SLO claim.
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { createV3VisitorQuery } from '@/lib/readiness/official-truth-product-v3/visitor/query'
import { syntheticV3Fixture } from '@/lib/readiness/official-truth-product-v3/visitor/test-fixtures'
import { writeU1Evidence } from './evidence.mjs'

const fixture = syntheticV3Fixture()
const query = createV3VisitorQuery(fixture.ports)
const input = { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }
async function run() {
  const start = performance.now()
  const result = await query(input)
  assert.ok(result.ok && result.answer.response.cells[0].results[0].status === 'accepted')
  return performance.now() - start
}
async function main() {
  for (let sample = 0; sample < 20; sample += 1) await run()
  const elapsed: number[] = []
  for (let sample = 0; sample < 200; sample += 1) elapsed.push(await run())
  elapsed.sort((a, b) => a - b)
  const report = writeU1Evidence('benchmark.json', { scope: 'single Node process, prepared one-cell cache hit with synthetic in-memory ports',
    realNetwork: false, productionSloVerified: false, node: process.version, warmupSamples: 20, measuredSamples: elapsed.length,
    p50Ms: elapsed[Math.ceil(elapsed.length * .5) - 1], p95Ms: elapsed[Math.ceil(elapsed.length * .95) - 1],
    maximumMs: elapsed[elapsed.length - 1], pendingJobs: fixture.jobs.size + fixture.discoveryJobs.size })
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
}
void main().catch((error: unknown) => { process.stderr.write(`${String(error)}\n`); process.exitCode = 1 })
