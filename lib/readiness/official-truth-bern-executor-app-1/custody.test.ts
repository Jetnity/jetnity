import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { custodyCommand, syntheticStagingCaseForTests } from '../../../scripts/official-truth-bern-executor-app-1/custody-2.mjs'

for (const kind of ['valid', 'symlink', 'hardlink', 'mode', 'empty', 'oversize', 'wrong_content', 'directory', 'missing']) {
  test('custody staged-file boundary: ' + kind, () => {
    assert.equal(syntheticStagingCaseForTests(kind), true)
  })
}
for (const kind of ['unknown', 'real', '../supplied-key', '', null, {}, '-----BEGIN PRIVATE KEY-----']) {
  test('custody cannot supply a file/key to the closed staging harness: ' + JSON.stringify(kind), () => {
    assert.equal(syntheticStagingCaseForTests(kind), false)
  })
}
for (const args of [[], ['--production'], ['--sign'], ['--synthetic-rehearsal', 'key.pem'],
  ['--synthetic-rehearsal', '--app-id', '5300986'], ['--synthetic-rehearsal', '--claims', '{}'],
  ['--synthetic-rehearsal', '--now', '0'], ['--prepare-empty', '/supplied/path'],
  ['--prepare-empty', '--backup-exclude']]) {
  test('custody manual entry rejects unsupported arguments: ' + JSON.stringify(args), () => {
    assert.equal(custodyCommand(args), null)
  })
}
test('custody has only two explicit finite manual actions', () => {
  assert.equal(custodyCommand(['--prepare-empty']), '--prepare-empty')
  assert.equal(custodyCommand(['--synthetic-rehearsal']), '--synthetic-rehearsal')
})
test('custody import and missing manual argument cannot create a vault or run a rehearsal', () => {
  const source = fileURLToPath(new URL('../../../scripts/official-truth-bern-executor-app-1/custody-2.mjs', import.meta.url))
  const imported = spawnSync(process.execPath, ['--input-type=module', '-e',
    `await import(${JSON.stringify(new URL('../../../scripts/official-truth-bern-executor-app-1/custody-2.mjs', import.meta.url).href)}); console.log('IMPORT_ONLY')`],
  { encoding: 'utf8', env: { NODE_ENV: 'test' }, timeout: 5000 })
  assert.equal(imported.status, 0); assert.equal(imported.stdout, 'IMPORT_ONLY\n'); assert.equal(imported.stderr, '')
  const refused = spawnSync(process.execPath, [source], { encoding: 'utf8', env: { NODE_ENV: 'test' }, timeout: 5000 })
  assert.equal(refused.status, 2); assert.equal(refused.stderr, '')
  assert.deepEqual(JSON.parse(refused.stdout), { status: 'BLOCKED', code: 'custody_preparation_unavailable', realCredentialAccess: false })
})
