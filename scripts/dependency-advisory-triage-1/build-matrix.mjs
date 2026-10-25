/**
 * Rebuild the triage matrix from retained local evidence. No registry and no install.
 *
 * Usage: node scripts/dependency-advisory-triage-1/build-matrix.mjs <repo-root> <evidence-dir> <output.json>
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { compareVersions, matchingNpmRanges, priorityCell, priorityRank, SEVERITY } from './range.mjs'

const root = process.argv[2]
const evidence = process.argv[3]
const outputPath = process.argv[4]
if (!root || !evidence || !outputPath) {
  process.stderr.write('usage: build-matrix.mjs <repo-root> <evidence-dir> <output.json>\n')
  process.exit(2)
}

const inventory = JSON.parse(readFileSync(join(evidence, 'lockfile-inventory.json'), 'utf8'))
const audit = JSON.parse(readFileSync(join(evidence, 'npm-audit-lockfile.json'), 'utf8'))
const byPath = new Map(inventory.entries.map((entry) => [entry.path, entry]))
const receipts = new Map()
for (const name of readdirSync(join(evidence, 'npm-view'))) {
  if (!name.endsWith('.json')) continue
  const body = readFileSync(join(evidence, 'npm-view', name), 'utf8').trim()
  const parsed = JSON.parse(body)
  const version = typeof parsed === 'string' ? parsed : parsed.version
  const packageName = name.slice(0, name.length - '.json'.length).replace(/_(\d+\.\d+\.\d+)$/, '')
  const fromName = name.match(/^(.*)_(\d+\.\d+\.\d+)\.json$/)
  if (!fromName || !version) continue
  receipts.set(`${fromName[1].replaceAll('_', '/')}@${version}`, version)
}

function receiptFor(packageName, version) {
  const key = `${packageName}@${version}`
  if (receipts.has(key)) return version
  const alt = `${packageName.replaceAll('/', '_')}@${version}`
  return receipts.has(alt) ? version : null
}

function viewedFor(packageName) {
  const found = []
  for (const key of receipts.keys()) {
    if (key.startsWith(`${packageName}@`)) found.push(key.slice(packageName.length + 1))
  }
  return found.sort(compareVersions)
}

function ghsaId(url) {
  const match = String(url || '').match(/GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}/i)
  return match ? match[0] : null
}

const advisories = new Map()
function loadAdvisory(id) {
  if (advisories.has(id)) return advisories.get(id)
  const payload = JSON.parse(readFileSync(join(evidence, 'advisories', `${id}.json`), 'utf8'))
  advisories.set(id, payload)
  return payload
}

function chainText(entry) {
  const production = entry.chains.filter((chain) => chain.at(-1)?.from === '<root>' && chain.at(-1)?.kind === 'dependencies')
  const chosen = (production[0] ? production : entry.chains).slice().sort((a, b) => a.length - b.length)[0] || []
  let child = `${entry.canonicalName}@${entry.version}`
  const steps = []
  for (const edge of chosen) {
    steps.push(`${edge.from} --${edge.kind} ${edge.range}--> ${child}`)
    child = edge.from
  }
  return steps.reverse().join(' ; ')
}

function direct(entry) {
  return entry.parents.some((parent) => parent.from === '<root>' && (parent.kind === 'dependencies' || parent.kind === 'devDependencies'))
}

const BUILD = new Set(['brace-expansion', 'browserslist', 'glob', 'minimatch', 'picomatch', 'playwright', 'postcss-selector-parser', 'source-map-js', 'yaml'])

function groupFor(name, path) {
  if (name === 'source-map-js') return 'S-FIX-1'
  if (name === 'ws') return 'S-FIX-2'
  if (name === 'zod') return 'S-FIX-3'
  if (name === 'playwright') return 'S-FIX-4'
  if ((name === 'picomatch' && path.includes('tinyglobby')) || (name === 'brace-expansion' && path !== 'node_modules/brace-expansion')) return 'S-FIX-5'
  return 'S-FIX-6'
}

const rows = []
for (const [packageName, vuln] of Object.entries(audit.vulnerabilities)) {
  const ids = new Set()
  for (const via of vuln.via || []) {
    if (via && typeof via === 'object') {
      const id = ghsaId(via.url)
      if (id) ids.add(id)
    }
  }
  for (const lockPath of vuln.nodes || []) {
    const entry = byPath.get(lockPath)
    if (!entry) continue
    for (const id of ids) {
      const payload = loadAdvisory(id)
      const decision = matchingNpmRanges(entry.version, payload.vulnerabilities, entry.canonicalName)
      if (decision.state !== 'RANGE_DECIDED') continue
      const severity = SEVERITY[payload.severity] || null
      const patched = decision.matches.map((match) => match.first_patched_version).filter(Boolean).sort(compareVersions).at(-1) || null
      const viewed = viewedFor(entry.canonicalName)
      const chosen = viewed
        .filter((version) => patched && compareVersions(version, patched) >= 0 && version.split('.')[0] === patched.split('.')[0])
        .sort(compareVersions)[0] || null
      const reach = inventory.literalImports.reachability[entry.canonicalName] || { serverChains: [], clientChains: [] }
      const classes = ['NOT_ASSESSED']
      let classBucket = null
      if (reach.serverChains.length || reach.clientChains.length) {
        if (reach.serverChains.length) classes.push('application-server')
        if (reach.clientChains.length) classes.push('client-bundle')
        classBucket = 'A'
      } else if (BUILD.has(entry.canonicalName)) {
        classes.push('build-ci')
        classBucket = 'B'
      }
      const candidates = [{ bucket: 'U', priority: priorityCell(severity, 'U') }]
      if (classBucket) candidates.push({ bucket: classBucket, priority: priorityCell(severity, classBucket) })
      candidates.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
      const deciding = candidates[0]
      const primaryConfirmed = patched ? receiptFor(entry.canonicalName, patched) : null
      let fixText = patched
        ? (primaryConfirmed
          ? `Primary first patched version ${patched} has a retained npm-view receipt.`
          : `Primary first patched version is ${patched}. No retained npm-view receipt for ${patched}.${chosen ? ` Retained npm-view receipt: ${entry.canonicalName}@${chosen}.` : ''}`)
        : 'NO_FIX_IN_PRIMARY'
      if (entry.canonicalName === 'zod') fixText += ' The receipt is outside declared ^3.25.76, so there is NO_FIX_IN_PRIMARY inside the locked major.'
      if (entry.canonicalName === 'postcss-selector-parser' && String(patched).startsWith('7.')) fixText += ' That version is outside the locked parent ranges ^6.1.1 and ^6.1.2, so there is NO_FIX_IN_PRIMARY inside the locked major.'
      rows.push({
        advisoryId: id,
        canonicalUrl: payload.html_url || `https://github.com/advisories/${id}`,
        officialSeverity: severity,
        githubSeverityWord: payload.severity,
        impact: 'partial',
        lockPath,
        name: entry.canonicalName,
        version: entry.version,
        direct: direct(entry),
        parentChain: chainText(entry),
        devExclusive: entry.devExclusive,
        optional: entry.optional,
        peer: entry.peer,
        os: entry.os,
        cpu: entry.cpu,
        exposureClasses: classes,
        exposureBucket: deciding.bucket,
        uFloor: true,
        deploymentUnknown: true,
        executionCall: 'NOT_ASSESSED',
        lockGraphConfidence: entry.chainsTruncated ? 'limited' : 'high',
        executionExposureConfidence: 'limited',
        importChainEvidence: {
          server: reach.serverChains,
          client: reach.clientChains,
        },
        jetnityPriority: deciding.priority,
        provisional: String(deciding.priority).startsWith('provisional'),
        confidence: 'split',
        uncertainty: 'Exploitability was not demonstrated. Deployment selection is unknown, so bucket U is a floor. Installed consistency is UNVERIFIED. The vulnerable function inside the dependency was not traced.',
        primaryFirstPatched: patched,
        chosenCandidate: chosen,
        npmViewConfirmsPrimary: Boolean(primaryConfirmed),
        fixedVersion: fixText,
        proposedGroup: groupFor(entry.canonicalName, lockPath),
        laterFiles: entry.canonicalName === 'zod' ? ['package.json', 'package-lock.json'] : ['package-lock.json'],
        rangeState: 'RANGE_DECIDED',
        retrievedAt: payload.published_at || null,
        primaryPublished: payload.published_at || null,
        primaryUpdated: payload.updated_at || null,
        groupActivated: false,
      })
    }
  }
}

rows.sort((a, b) => `${a.advisoryId}|${a.lockPath}`.localeCompare(`${b.advisoryId}|${b.lockPath}`))
const counts = {}
for (const row of rows) counts[row.jetnityPriority] = (counts[row.jetnityPriority] || 0) + 1
writeFileSync(outputPath, `${JSON.stringify({
  role: 'triage-matrix',
  supersedesHead: '01f4f2b97b614c3b16048fa8585e1e635c93286f',
  impactPolicy: 'partial; vulnerable call NOT_ASSESSED; deployment unknown applies the U floor',
  priorityCounts: counts,
  rows,
}, null, 2)}\n`)
process.stdout.write(`MATRIX rows=${rows.length} ${JSON.stringify(counts)}\n`)
