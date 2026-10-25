/**
 * Evidence checks for Dependency Advisory Triage 1.
 * Read-only. Does not restore files, install packages, or call a registry.
 *
 * Usage: node scripts/dependency-advisory-triage-1/validate-evidence.mjs <repo-root>
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { compareVersions, matchingNpmRanges, priorityCell, priorityRank, SEVERITY } from './range.mjs'

const root = process.argv[2]
const duringFixture = process.argv.includes('--during-fixture')
if (!root) {
  process.stderr.write('usage: validate-evidence.mjs <repo-root> [--during-fixture]\n')
  process.exit(2)
}

const evidence = join(root, 'docs/evidence/dependency-advisory-triage-1')
const failures = []
const fail = (message) => failures.push(message)
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

const EXPECTED = {
  packageJsonSha256: 'd564cf2944c55fad83a9797311d6abefb446ccd107023d1f007aac2c6ef5d90c',
  packageLockSha256: '5f0575fdeb1750fc2316a25d01d0fc6383dd52bfea7457124f42453446d807de',
  packageJsonBlob: 'e6187432cb8f224c10281b7b476bb24eb8ef1c1b',
  packageLockBlob: '4c64e03d16a54ae6c648dc3e40c88d6b94c5cfbe',
}
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const pkgBytes = readFileSync(join(root, 'package.json'))
const lockBytes = readFileSync(join(root, 'package-lock.json'))
if (sha256(pkgBytes) !== EXPECTED.packageJsonSha256) fail('package.json SHA-256 drifted')
if (sha256(lockBytes) !== EXPECTED.packageLockSha256) fail('package-lock.json SHA-256 drifted')

const binding = readJson(join(evidence, 'input-binding.json'))
for (const [key, value] of Object.entries(EXPECTED)) {
  if (binding[key] !== value) fail(`input binding ${key}`)
}
if (binding.installedConsistency !== 'UNVERIFIED') fail('installed consistency must stay UNVERIFIED')
if (sha256(pkgBytes) !== binding.preCommand.packageJsonSha256) fail('package.json differs from pre-command snapshot')
if (sha256(lockBytes) !== binding.preCommand.packageLockSha256) fail('package-lock.json differs from pre-command snapshot')

const inventory = readJson(join(evidence, 'lockfile-inventory.json'))
if (inventory.inputs?.packageJsonSha256 !== EXPECTED.packageJsonSha256) fail('inventory package hash')
if (inventory.inputs?.packageLockSha256 !== EXPECTED.packageLockSha256) fail('inventory lock hash')
if (inventory.packageEntryCount !== 611) fail('inventory entry count')
if (inventory.uniquePathSuffixCount !== 565) fail('path suffix count')
if (inventory.uniqueCanonicalNameCount !== 562) fail('canonical name count')
const aliasByPath = new Map((inventory.aliases || []).map((alias) => [alias.path, alias]))
for (const expected of [
  ['node_modules/string-width-cjs', 'string-width', '4.2.3'],
  ['node_modules/strip-ansi-cjs', 'strip-ansi', '6.0.1'],
  ['node_modules/wrap-ansi-cjs', 'wrap-ansi', '7.0.0'],
]) {
  const alias = aliasByPath.get(expected[0])
  if (!alias || alias.canonicalName !== expected[1] || alias.version !== expected[2] || alias.pathSuffix === alias.canonicalName) {
    fail(`alias ${expected[0]}`)
  }
}
const byPath = new Map(inventory.entries.map((entry) => [entry.path, entry]))

const commands = readFileSync(join(evidence, 'commands.txt'), 'utf8')
const full = commands.split('OMIT_DEV_LOCK_GRAPH')[0]
const omit = commands.split('OMIT_DEV_LOCK_GRAPH')[1] || ''
for (const flag of ['--include=prod', '--include=dev', '--include=optional', '--include=peer']) {
  if (!full.includes(flag)) fail(`full set missing ${flag}`)
}
if (full.includes('--omit')) fail('full set must not pass --omit')
for (const flag of ['--omit=dev', '--include=prod', '--include=optional', '--include=peer']) {
  if (!omit.includes(flag)) fail(`omit-dev set missing ${flag}`)
}
if (omit.includes('--include=dev')) fail('omit-dev set must not include dev')
if (!commands.includes('node scripts/dependency-advisory-triage-1/inventory.mjs /workspace ')) fail('inventory rerun argv missing')
if (!commands.includes('node scripts/dependency-advisory-triage-1/validate-evidence.mjs /workspace')) fail('validator argv missing')
if (!duringFixture) {
  if (!commands.includes('node scripts/dependency-advisory-triage-1/validate-evidence.fixtures.mjs /workspace')) fail('fixture argv missing')
  if (!commands.includes('FIXTURE_RESULT pass')) fail('fixture receipt missing')
}

const audit = readJson(join(evidence, 'npm-audit-lockfile.json'))
const advisories = new Map()
function loadAdvisory(id) {
  if (!advisories.has(id)) advisories.set(id, readJson(join(evidence, 'advisories', `${id}.json`)))
  return advisories.get(id)
}
function ghsaId(url) {
  const match = String(url || '').match(/GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}/i)
  return match ? match[0] : null
}
const receipts = new Set()
for (const name of readdirSync(join(evidence, 'npm-view'))) {
  const match = name.match(/^(.*)_(\d+\.\d+\.\d+)\.json$/)
  if (!match) continue
  const body = JSON.parse(readFileSync(join(evidence, 'npm-view', name), 'utf8'))
  const version = typeof body === 'string' ? body : body.version
  if (version) receipts.add(`${match[1]}@${version}`)
}

const expected = new Map()
const ghsaIds = new Set()
for (const vuln of Object.values(audit.vulnerabilities || {})) {
  const ids = []
  for (const via of vuln.via || []) {
    if (via && typeof via === 'object') {
      const id = ghsaId(via.url)
      if (id) {
        ids.push(id)
        ghsaIds.add(id)
      }
    }
  }
  for (const lockPath of vuln.nodes || []) {
    const entry = byPath.get(lockPath)
    if (!entry) {
      fail(`audit path missing from inventory ${lockPath}`)
      continue
    }
    for (const id of ids) {
      const payload = loadAdvisory(id)
      const decision = matchingNpmRanges(entry.version, payload.vulnerabilities, entry.canonicalName)
      if (decision.state === 'RANGE_UNPARSEABLE') {
        fail(`unparseable range ${id} ${lockPath}`)
        continue
      }
      if (decision.state !== 'RANGE_DECIDED') continue
      expected.set(`${id}|${lockPath}`, { id, lockPath, entry, payload, decision })
    }
  }
}

const matrix = readJson(join(evidence, 'triage-matrix.json'))
const rows = matrix.rows
if (!Array.isArray(rows) || rows.length === 0) fail('matrix rows empty')
const seen = new Set()
for (const row of rows || []) {
  const key = `${row.advisoryId}|${row.lockPath}`
  if (seen.has(key)) fail(`duplicate ${key}`)
  seen.add(key)
  const want = expected.get(key)
  if (!want) fail(`row not derived from audit and primary range ${key}`)
  else {
    if (row.name !== want.entry.canonicalName || row.version !== want.entry.version) fail(`false join ${key}`)
    const severity = SEVERITY[want.payload.severity]
    if (row.officialSeverity !== severity) fail(`severity ${key}`)
    const patched = want.decision.matches.map((match) => match.first_patched_version).filter(Boolean).sort(compareVersions).at(-1) || null
    if (row.primaryFirstPatched !== patched) fail(`primary patch ${key}`)
  }
  if (!row.canonicalUrl?.startsWith('https://')) fail(`url ${row.advisoryId}`)
  if (row.primarySource === 'osv') fail(`OSV labeled primary ${row.advisoryId}`)
  if (row.deploymentUnknown !== true || row.uFloor !== true) fail(`U floor not applied ${key}`)
  if (row.executionCall !== 'NOT_ASSESSED') fail(`execution call claimed ${key}`)
  if (row.executionExposureConfidence !== 'limited') fail(`execution confidence ${key}`)
  if (!Array.isArray(row.exposureClasses) || !row.exposureClasses.includes('NOT_ASSESSED')) fail(`missing NOT_ASSESSED ${key}`)
  const buckets = new Set(['U'])
  if (row.exposureClasses.includes('application-server') || row.exposureClasses.includes('client-bundle')) buckets.add('A')
  if (row.exposureClasses.includes('build-ci')) buckets.add('B')
  let best = null
  for (const bucket of buckets) {
    const cell = priorityCell(row.officialSeverity, bucket)
    if (!cell) fail(`priority cell ${key}`)
    else if (!best || priorityRank(cell) < priorityRank(best.priority)) best = { bucket, priority: cell }
  }
  if (best && (row.jetnityPriority !== best.priority || priorityRank(row.jetnityPriority) > priorityRank(priorityCell(row.officialSeverity, 'U')))) {
    fail(`priority violates U floor ${key}`)
  }
  if (row.exposureClasses.includes('application-server') || row.exposureClasses.includes('client-bundle')) {
    const chains = row.importChainEvidence || {}
    const present = (row.exposureClasses.includes('application-server') ? chains.server : []).concat(row.exposureClasses.includes('client-bundle') ? chains.client : [])
    if (!present.length) fail(`import class without chain ${key}`)
  }
  if (row.chosenCandidate && !receipts.has(`${row.name}@${row.chosenCandidate}`)) fail(`unsupported candidate ${row.name}@${row.chosenCandidate}`)
  if (row.npmViewConfirmsPrimary && !receipts.has(`${row.name}@${row.primaryFirstPatched}`)) fail(`unsupported primary confirmation ${key}`)
  const claimed = `${row.fixedVersion || ''}`
  if (/confirmed by npm view/i.test(claimed)) fail(`unstructured npm-view claim ${key}`)
  for (const match of claimed.matchAll(/npm-view receipt: ([^@\s]+)@(\d+\.\d+\.\d+)/g)) {
    if (!receipts.has(`${match[1]}@${match[2]}`)) fail(`receipt text mismatch ${match[1]}@${match[2]}`)
  }
  for (const match of claimed.matchAll(/No retained npm-view receipt for (\d+\.\d+\.\d+)/g)) {
    if (receipts.has(`${row.name}@${match[1]}`)) fail(`receipt denied for a viewed version ${key}`)
  }
}
for (const key of expected.keys()) {
  if (!seen.has(key)) fail(`missing expected row ${key}`)
}

const npmPackageCount = Object.keys(audit.vulnerabilities || {}).length
if (npmPackageCount !== 11) fail(`computed npm package count ${npmPackageCount}`)
if (ghsaIds.size !== 23) fail(`computed GHSA count ${ghsaIds.size}`)
if (binding.reconciliation?.npmPackageCount !== npmPackageCount) fail('reconciliation npm count')
if (binding.reconciliation?.uniqueGhsaCount !== ghsaIds.size) fail('reconciliation GHSA count')
if (!String(readFileSync(join(evidence, 'ci-baseline-40202059080.txt'), 'utf8')).includes('11 vulnerabilities')) fail('historical 11')
if (binding.reconciliation?.historicalPackageCount !== 11) fail('historical reconciliation')

const osv = readJson(join(evidence, 'osv-crosscheck.json'))
if (osv.role !== 'aggregator') fail('OSV cross-check is not labeled aggregator')

const secret = /_authToken=|Bearer |ghp_|github_pat_/
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') fail('evidence contains a node_modules tree')
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (name !== 'validation.json') {
      const text = readFileSync(path, 'utf8')
      if (secret.test(text)) fail(`secret-shaped string in ${name}`)
    }
  }
}
walk(evidence)

const result = {
  state: failures.length ? 'EVIDENCE_INVALID' : 'EVIDENCE_VALID',
  rowCount: Array.isArray(rows) ? rows.length : 0,
  expectedRows: expected.size,
  failures,
}
writeFileSync(join(evidence, 'validation.json'), `${JSON.stringify(result, null, 2)}\n`)
if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`)
  process.exit(1)
}
process.stdout.write(`EVIDENCE_VALID rows=${rows.length}\n`)
