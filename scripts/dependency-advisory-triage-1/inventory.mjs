/**
 * Read-only lockfile inventory for Dependency Advisory Triage 1.
 * Reads package.json and package-lock.json only. Does not import npm,
 * spawn an installer, or read node_modules.
 *
 * Usage: node scripts/dependency-advisory-triage-1/inventory.mjs <repo-root> <output.json>
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative, extname, dirname } from 'node:path'

const root = process.argv[2]
const outputPath = process.argv[3]
if (!root || !outputPath) {
  process.stderr.write('usage: inventory.mjs <repo-root> <output.json>\n')
  process.exit(2)
}

const pkgBytes = readFileSync(join(root, 'package.json'))
const lockBytes = readFileSync(join(root, 'package-lock.json'))
const pkg = JSON.parse(pkgBytes.toString())
const lock = JSON.parse(lockBytes.toString())
const packages = lock.packages
if (!packages || packages[''] == null) {
  process.stderr.write('GRAPH_PARSE_FAILED\n')
  process.exit(1)
}

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const edgeKinds = ['dependencies', 'optionalDependencies', 'devDependencies', 'peerDependencies']

const parentsOf = new Map()
for (const [from, entry] of Object.entries(packages)) {
  for (const kind of edgeKinds) {
    const deps = entry[kind]
    if (!deps) continue
    for (const [name, range] of Object.entries(deps)) {
      const child = resolveChild(from, name)
      if (!child) continue
      if (!parentsOf.has(child)) parentsOf.set(child, [])
      parentsOf.get(child).push({
        from: from || '<root>',
        kind,
        range: String(range),
      })
    }
  }
}

function resolveChild(parent, name) {
  let dir = parent
  for (;;) {
    const candidate = dir ? `${dir}/node_modules/${name}` : `node_modules/${name}`
    if (packages[candidate]) return candidate
    if (!dir) return null
    const idx = dir.lastIndexOf('node_modules/')
    if (idx === -1) dir = ''
    else dir = dir.slice(0, Math.max(0, idx - 1))
    if (dir.endsWith('/')) dir = dir.slice(0, -1)
  }
}

const prodReach = new Set()
const devReach = new Set()
const peerReach = new Set()

function walk(startNames, into, peerOnly) {
  const queue = []
  for (const name of startNames) {
    const path = resolveChild('', name)
    if (path) queue.push(path)
  }
  const seen = new Set()
  while (queue.length) {
    const path = queue.shift()
    if (seen.has(path)) continue
    seen.add(path)
    into.add(path)
    const entry = packages[path]
    if (peerOnly) continue
    for (const kind of ['dependencies', 'optionalDependencies']) {
      const deps = entry[kind]
      if (!deps) continue
      for (const name of Object.keys(deps)) {
        const child = resolveChild(path, name)
        if (child) queue.push(child)
      }
    }
  }
}

walk(Object.keys(packages[''].dependencies || {}), prodReach, false)
walk(Object.keys(packages[''].devDependencies || {}), devReach, false)
for (const [path, entry] of Object.entries(packages)) {
  if (!path) continue
  const peers = entry.peerDependencies
  if (!peers) continue
  for (const name of Object.keys(peers)) {
    const child = resolveChild(path, name)
    if (child) peerReach.add(child)
  }
}

const CHAIN_LIMIT = 32

function chainsToRoot(start) {
  const found = []
  let truncated = false
  const queue = [{ path: start, chain: [], seen: new Set([start]) }]
  let steps = 0
  while (queue.length) {
    const { path, chain, seen } = queue.shift()
    const parents = parentsOf.get(path) || []
    if (parents.length === 0) {
      found.push(chain)
      if (found.length >= CHAIN_LIMIT) truncated = true
      if (truncated) break
      continue
    }
    for (const parent of parents) {
      steps += 1
      if (steps > 5000) {
        truncated = true
        break
      }
      const next = chain.concat(parent)
      if (parent.from === '<root>') {
        found.push(next)
        if (found.length >= CHAIN_LIMIT) truncated = true
      } else if (!seen.has(parent.from)) {
        const nextSeen = new Set(seen)
        nextSeen.add(parent.from)
        queue.push({ path: parent.from, chain: next, seen: nextSeen })
      }
      if (truncated) break
    }
    if (truncated) break
  }
  if (prodReach.has(start) && !found.some((chain) => chain.at(-1)?.kind === 'dependencies' && chain.at(-1)?.from === '<root>')) {
    const prod = firstRootChain(start, (parent) => parent.kind !== 'devDependencies' && parent.kind !== 'peerDependencies')
    if (prod) found.push(prod)
  }
  return { chains: found, chainsTruncated: truncated }
}

function firstRootChain(start, allow) {
  const queue = [{ path: start, chain: [], seen: new Set([start]) }]
  let steps = 0
  while (queue.length) {
    const { path, chain, seen } = queue.shift()
    for (const parent of parentsOf.get(path) || []) {
      steps += 1
      if (steps > 800) return null
      if (!allow(parent)) continue
      const next = chain.concat(parent)
      if (parent.from === '<root>') return next
      if (!seen.has(parent.from)) {
        const nextSeen = new Set(seen)
        nextSeen.add(parent.from)
        queue.push({ path: parent.from, chain: next, seen: nextSeen })
      }
    }
  }
  return null
}

const entries = []
for (const [path, entry] of Object.entries(packages)) {
  if (!path) continue
  const name = path.split('node_modules/').pop()
  const { chains, chainsTruncated } = chainsToRoot(path)
  entries.push({
    path,
    name,
    version: entry.version ?? null,
    devFlag: entry.dev === true,
    optional: entry.optional === true,
    peer: entry.peer === true,
    devExclusive: devReach.has(path) && !prodReach.has(path),
    prodReachable: prodReach.has(path),
    peerReachable: peerReach.has(path),
    os: entry.os ?? null,
    cpu: entry.cpu ?? null,
    libc: entry.libc ?? null,
    hasInstallScript: entry.hasInstallScript === true,
    integrity: entry.integrity ?? null,
    parents: parentsOf.get(path) || [],
    chains,
    chainsTruncated,
  })
}

const literalImports = scanSources(root)

const inventory = {
  role: 'lockfile-inventory',
  lockfileVersion: lock.lockfileVersion,
  packageEntryCount: entries.length,
  uniqueNameCount: new Set(entries.map((e) => e.name)).size,
  inputs: {
    packageJsonSha256: sha256(pkgBytes),
    packageLockSha256: sha256(lockBytes),
  },
  directDependencies: pkg.dependencies || {},
  directDevDependencies: pkg.devDependencies || {},
  overrides: pkg.overrides || {},
  entries,
  literalImports,
}

writeFileSync(outputPath, `${JSON.stringify(inventory)}\n`)

function scanSources(repo) {
  const dirs = ['app', 'components', 'lib', 'hooks', 'scripts'].filter((d) => {
    try { return statSync(join(repo, d)).isDirectory() } catch { return false }
  })
  const files = []
  const skip = new Set(['node_modules', '.next', 'docs'])
  const walkDir = (dir) => {
    for (const name of readdirSync(dir)) {
      if (skip.has(name)) continue
      const p = join(dir, name)
      const st = statSync(p)
      if (st.isDirectory()) walkDir(p)
      else if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(extname(name))) files.push(p)
    }
  }
  for (const d of dirs) walkDir(join(repo, d))
  for (const extra of ['proxy.ts', 'next.config.js', 'postcss.config.js', 'tailwind.config.js']) {
    try { statSync(join(repo, extra)); files.push(join(repo, extra)) } catch { /* absent */ }
  }
  const importRe = [
    /\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]
  const dynamicRe = /\bimport\s*\(\s*(?!['"])|\brequire\s*\(\s*(?!['"])/g
  const byPackage = {}
  const dynamicNonLiteral = []
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    const rel = relative(repo, file).split('\\').join('/')
    const directive = /^\s*['"]use client['"]/.test(text) ? 'use-client'
      : /^\s*['"]use server['"]/.test(text) ? 'use-server'
      : null
    if (dynamicRe.test(text)) dynamicNonLiteral.push(rel)
    dynamicRe.lastIndex = 0
    for (const re of importRe) {
      re.lastIndex = 0
      let m
      while ((m = re.exec(text))) {
        const spec = m[1]
        if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('@/')) continue
        const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
        if (!byPackage[name]) byPackage[name] = []
        byPackage[name].push({ file: rel, directive })
      }
    }
  }
  return {
    packageCount: Object.keys(byPackage).length,
    byPackage,
    dynamicNonLiteral,
  }
}
