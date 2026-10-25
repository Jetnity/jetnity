import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO = process.argv[2]
const EXPECTED_HEAD = process.argv[3]
const EXPECTED_TREE = process.argv[4]
assert.match(REPO ?? '', /^\/tmp\/jetnity-[A-Za-z0-9._-]+$/)
assert.match(EXPECTED_HEAD ?? '', /^[0-9a-f]{40}$/)
assert.match(EXPECTED_TREE ?? '', /^[0-9a-f]{40}$/)
const INPUT = dirname(fileURLToPath(import.meta.url))
const execFileAsync = promisify(execFile)
const git = async (...args) => (await execFileAsync('git', args, {cwd: REPO, encoding: 'utf8'})).stdout.trim()
assert.equal(await git('rev-parse', 'HEAD'), EXPECTED_HEAD)
assert.equal(await git('rev-parse', 'HEAD^{tree}'), EXPECTED_TREE)
assert.equal(await git('status', '--short'), '', 'clean exact source checkout required')
const OUT = mkdtempSync('/tmp/jetnity-r105-c-preset-final-proof-')
for (const name of ['run.mjs', 'entry.ts']) writeFileSync(`${OUT}/${name}`, readFileSync(`${INPUT}/${name}`), {flag: 'wx'})
const hash = data => createHash('sha256').update(data).digest('hex')
const sourcePaths = ['lib/trips/manual-journey-editor-completion-1.ts', 'types/trips.ts']
const sourceSha256 = {}
for (const path of sourcePaths) {
  const bytes = readFileSync(`${REPO}/${path}`)
  const committed = (await execFileAsync('git', ['show', `HEAD:${path}`], {cwd: REPO, encoding: 'buffer'})).stdout
  assert.deepEqual(bytes, committed, `Source bytes match HEAD: ${path}`)
  sourceSha256[path] = hash(bytes)
}
const require = createRequire(`${REPO}/package.json`)
const result = {
  createdAtUtc: new Date().toISOString(), head: EXPECTED_HEAD, tree: EXPECTED_TREE,
  command: `node ${INPUT}/run.mjs ${REPO} ${EXPECTED_HEAD} ${EXPECTED_TREE}`, output: OUT,
  node: process.version, sourceSha256, sourceVerifiedAgainstGit: true,
  runnerSha256: hash(readFileSync(`${OUT}/run.mjs`)), fixtureSha256: hash(readFileSync(`${OUT}/entry.ts`)),
  boundary: 'Pure actual normalized-preset/key helper. No browser/network/hosted access. Full Trip schema validity is not re-proved by this small helper-only regression.',
  cases: [],
}
try {
  await require('esbuild').build({absWorkingDir: REPO, entryPoints: [`${OUT}/entry.ts`], outfile: `${OUT}/helper.mjs`,
    bundle: true, platform: 'node', format: 'esm', alias: {'@': REPO}, nodePaths: [`${REPO}/node_modules`], logLevel: 'silent'})
  const { verbindungsVorgabeAus, vorgabeSchluessel } = await import(pathToFileURL(`${OUT}/helper.mjs`).href)
  const tripA = {origin: 'a\u001fb', startDate: null, stages: [{name: 'c'}], days: []}
  const tripB = {origin: 'a', startDate: null, stages: [{name: 'b\u001fc'}], days: []}
  const presetA = verbindungsVorgabeAus(tripA)
  const presetB = verbindungsVorgabeAus(tripB)
  const keyA = vorgabeSchluessel(presetA)
  const keyB = vorgabeSchluessel(presetB)
  const different = JSON.stringify(presetA) !== JSON.stringify(presetB)
  result.cases.push({name: 'delimiter-in-distinct-fields-cannot-collide', presetA, presetB, keyA, keyB,
    passed: different && typeof keyA === 'string' && typeof keyB === 'string' && keyA !== keyB})
  const repeatedA = vorgabeSchluessel(presetA)
  result.cases.push({name: 'same-normalized-tuple-stable', passed: repeatedA === keyA})
  const copiedA = vorgabeSchluessel(verbindungsVorgabeAus(JSON.parse(JSON.stringify(tripA))))
  result.cases.push({name: 'equivalent-input-object-same-key', passed: copiedA === keyA})
  result.status = result.cases.length === 3 && result.cases.every(c => c.passed === true) ? 'PRESET_KEY_REGRESSION_PASS' : 'SEE_CASES'
  if (result.status !== 'PRESET_KEY_REGRESSION_PASS') process.exitCode = 1
} catch (error) {
  result.status = 'HARNESS_ERROR'
  result.error = String(error.stack ?? error)
  process.exitCode = 2
} finally {
  result.finalHead = await git('rev-parse', 'HEAD')
  result.finalTree = await git('rev-parse', 'HEAD^{tree}')
  result.productGitStatus = await git('status', '--short')
  result.finalSourceSha256 = Object.fromEntries(sourcePaths.map(p => [p, hash(readFileSync(`${REPO}/${p}`))]))
  result.cleanExactSource = result.finalHead === EXPECTED_HEAD && result.finalTree === EXPECTED_TREE && result.productGitStatus === '' && JSON.stringify(sourceSha256) === JSON.stringify(result.finalSourceSha256)
  if (!result.cleanExactSource) {result.status = 'SOURCE_CHANGED'; process.exitCode = 2}
  writeFileSync(`${OUT}/result.json`, `${JSON.stringify(result, null, 2)}\n`, {flag: 'wx'})
  const names = ['run.mjs', 'entry.ts', 'result.json']
  writeFileSync(`${OUT}/manifest.json`, `${JSON.stringify({head: EXPECTED_HEAD, tree: EXPECTED_TREE, sha256: Object.fromEntries(names.map(name => [name, hash(readFileSync(`${OUT}/${name}`))]))}, null, 2)}\n`, {flag: 'wx'})
  console.log(JSON.stringify({status: result.status, cases: result.cases, cleanExactSource: result.cleanExactSource,
    output: OUT, resultSha256: hash(readFileSync(`${OUT}/result.json`)), manifestSha256: hash(readFileSync(`${OUT}/manifest.json`))}, null, 2))
}
