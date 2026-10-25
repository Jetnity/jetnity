/**
 * Evidence checks for Dependency Advisory Triage 1.
 * Read-only. Does not restore files, install packages, or call a registry.
 *
 * Usage: node scripts/dependency-advisory-triage-1/validate-evidence.mjs <repo-root>
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.argv[2]
if (!root) {
  process.stderr.write('usage: validate-evidence.mjs <repo-root>\n')
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
if (binding.packageJsonSha256 !== EXPECTED.packageJsonSha256) fail('input binding package hash')
if (binding.packageLockSha256 !== EXPECTED.packageLockSha256) fail('input binding lock hash')
if (binding.packageJsonBlob !== EXPECTED.packageJsonBlob) fail('input binding package blob')
if (binding.packageLockBlob !== EXPECTED.packageLockBlob) fail('input binding lock blob')
if (binding.installedConsistency !== 'UNVERIFIED') fail('installed consistency must stay UNVERIFIED')
if (sha256(pkgBytes) !== binding.preCommand.packageJsonSha256) fail('package.json differs from pre-command snapshot')
if (sha256(lockBytes) !== binding.preCommand.packageLockSha256) fail('package-lock.json differs from pre-command snapshot')

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

const matrix = readJson(join(evidence, 'triage-matrix.json'))
const rows = matrix.rows || []
const required = [
  'advisoryId', 'canonicalUrl', 'officialSeverity', 'impact', 'lockPath', 'name', 'version',
  'direct', 'parentChain', 'exposureClasses', 'exposureBucket', 'jetnityPriority',
  'provisional', 'confidence', 'uncertainty', 'fixedVersion', 'proposedGroup', 'retrievedAt',
]
const seen = new Set()
for (const row of rows) {
  for (const field of required) {
    if (row[field] === undefined || row[field] === null || row[field] === '') fail(`row missing ${field}`)
  }
  if (!row.canonicalUrl?.startsWith('https://github.com/advisories/')) fail(`non-https primary url ${row.advisoryId}`)
  const key = `${row.advisoryId}|${row.lockPath}`
  if (seen.has(key)) fail(`duplicate ${key}`)
  seen.add(key)
  const payloadPath = join(evidence, 'advisories', `${row.advisoryId}.json`)
  const payload = readJson(payloadPath)
  if (payload.ghsa_id !== row.advisoryId) fail(`payload id mismatch ${row.advisoryId}`)
  if (row.primarySource === 'osv') fail(`OSV labeled primary ${row.advisoryId}`)
}

const reconciliation = binding.reconciliation
if (reconciliation?.npmPackageCount !== 11) fail('npm aggregate count missing')
if (reconciliation?.uniqueGhsaCount !== 23) fail('unique GHSA count missing')
if (reconciliation?.historicalPackageCount !== 11) fail('historical 11 missing')
if (!reconciliation?.registryChange || !reconciliation?.lockVersusInstalled || !reconciliation?.folding) {
  fail('three reconciliation columns missing')
}

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
  rowCount: rows.length,
  failures,
}
writeFileSync(join(evidence, 'validation.json'), `${JSON.stringify(result, null, 2)}\n`)
if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`)
  process.exit(1)
}
process.stdout.write(`EVIDENCE_VALID rows=${rows.length}\n`)
