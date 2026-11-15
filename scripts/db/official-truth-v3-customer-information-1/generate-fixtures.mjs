// Run with the existing server-only/tsx registration after the customer-data
// slice is integrated. These are fictional test objects, never country facts.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
const source = 'lib/readiness/official-truth-product-v3/customer-information/test-support/fixture.ts'
const loaded = await import(new URL('../../../' + source, import.meta.url).href)
const { customerInformationFixture, CUSTOMER_DETAIL_SAMPLES } = loaded.default ?? loaded
const cases = []
for (const [index, detail] of CUSTOMER_DETAIL_SAMPLES.entries()) {
  const fixture = customerInformationFixture(detail, 'native_' + String.fromCharCode(97 + index).repeat(2), 'customer-native-shape-' + index)
  const completion = await fixture.completion()
  assert.equal(completion.outcome.status, 'prepared')
  cases.push({ context: fixture.context, method: fixture.method, identity: fixture.identity, proposal: fixture.proposal, ...completion })
}
assert.equal(cases.length, 17)
const output = JSON.stringify({ kind: 'fictional-owned-local-shape-vectors-only', source, cases }) + '\n'
const target = new URL('./shape-fixtures.json', import.meta.url)
assert.ok(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'customer_fixtures_mode_required')
if (process.argv[2] === '--write') writeFileSync(target, output)
else assert.equal(readFileSync(target, 'utf8'), output, 'native vectors equal the actual canonical pipeline fixtures')
