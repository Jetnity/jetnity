/**
 * Read-only lockfile inventory for Dependency Advisory Triage 1.
 * Reads package.json and package-lock.json only. Does not import npm,
 * spawn an installer, or read node_modules.
 *
 * Usage: node scripts/dependency-advisory-triage-1/inventory.mjs <repo-root> <output.json>
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative, extname, dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export function leadingDirective(text) {
  let i = 0
  const source = String(text).replace(/^\uFEFF/, '')
  while (i < source.length) {
    const ch = source[i]
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      i += 1
      continue
    }
    if (source.startsWith('//', i)) {
      const nl = source.indexOf('\n', i)
      if (nl < 0) return null
      i = nl + 1
      continue
    }
    if (source.startsWith('/*', i)) {
      const end = source.indexOf('*/', i + 2)
      if (end < 0) return null
      i = end + 2
      continue
    }
    const match = /^['"]use (client|server)['"]/.exec(source.slice(i))
    return match ? (match[1] === 'client' ? 'use-client' : 'use-server') : null
  }
  return null
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
if (!isDirectRun) {
  // Imported for the directive helper and fixture checks.
} else {
  runInventory(process.argv[2], process.argv[3])
}

function runInventory(root, outputPath) {
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
  const pathSuffix = path.split('node_modules/').pop()
  const canonicalName = entry.name || pathSuffix
  const { chains, chainsTruncated } = chainsToRoot(path)
  entries.push({
    path,
    pathSuffix,
    canonicalName,
    alias: pathSuffix !== canonicalName,
    name: canonicalName,
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
  uniquePathSuffixCount: new Set(entries.map((e) => e.pathSuffix)).size,
  uniqueCanonicalNameCount: new Set(entries.map((e) => e.canonicalName)).size,
  aliases: entries.filter((e) => e.alias).map((e) => ({
    path: e.path,
    pathSuffix: e.pathSuffix,
    canonicalName: e.canonicalName,
    version: e.version,
  })),
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
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']
  const indexExtensions = ['/index.ts', '/index.tsx', '/index.js', '/index.jsx', '/index.mjs']
  const byRel = new Map()
  const dynamicNonLiteral = []

  function resolveLocal(fromRel, spec) {
    const base = spec.startsWith('@/')
      ? join(repo, spec.slice(2))
      : join(repo, dirname(fromRel), spec)
    const candidates = []
    for (const ext of extensions) candidates.push(base + ext)
    for (const ext of indexExtensions) candidates.push(base + ext)
    for (const candidate of candidates) {
      const rel = relative(repo, candidate).split('\\').join('/')
      if (byRel.has(rel)) return rel
    }
    return null
  }

  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    const rel = relative(repo, file).split('\\').join('/')
    const directive = leadingDirective(text)
    const packageImports = []
    const localSpecs = []
    if (dynamicRe.test(text)) dynamicNonLiteral.push(rel)
    dynamicRe.lastIndex = 0
    for (const re of importRe) {
      re.lastIndex = 0
      let match
      while ((match = re.exec(text))) {
        const spec = match[1]
        if (spec.startsWith('.') || spec.startsWith('@/')) localSpecs.push(spec)
        else if (!spec.startsWith('/')) {
          const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
          packageImports.push(name)
        }
      }
    }
    byRel.set(rel, { rel, directive, packageImports, localSpecs })
  }

  for (const record of byRel.values()) {
    record.localImports = [...new Set(record.localSpecs.map((spec) => resolveLocal(record.rel, spec)).filter(Boolean))]
  }

  const isRoute = (rel) => /(?:^|\/)route\.(?:ts|tsx|js|jsx)$/.test(rel)
  const serverSeeds = [...byRel.values()]
    .filter((record) => record.rel === 'proxy.ts' || isRoute(record.rel) || record.directive === 'use-server')
    .map((record) => record.rel)
  const clientSeeds = [...byRel.values()].filter((record) => record.directive === 'use-client').map((record) => record.rel)

  function walk(seeds, stopAtClientBoundary) {
    const reached = new Map()
    const queue = seeds.map((rel) => ({ rel, chain: [rel] }))
    while (queue.length) {
      const { rel, chain } = queue.shift()
      if (reached.has(rel)) continue
      const record = byRel.get(rel)
      if (!record) continue
      if (stopAtClientBoundary && record.directive === 'use-client' && chain.length > 1) continue
      reached.set(rel, chain)
      for (const next of record.localImports) {
        if (!reached.has(next)) queue.push({ rel: next, chain: chain.concat(next) })
      }
    }
    return reached
  }

  const serverReached = walk(serverSeeds, true)
  const clientReached = walk(clientSeeds, false)
  const byPackage = {}
  const reachability = {}
  for (const record of byRel.values()) {
    for (const name of new Set(record.packageImports)) {
      if (!byPackage[name]) byPackage[name] = []
      byPackage[name].push({ file: record.rel, directive: record.directive })
      if (!reachability[name]) reachability[name] = { serverChains: [], clientChains: [] }
      if (serverReached.has(record.rel) && reachability[name].serverChains.length < 3) {
        reachability[name].serverChains.push(serverReached.get(record.rel))
      }
      if (clientReached.has(record.rel) && reachability[name].clientChains.length < 3) {
        reachability[name].clientChains.push(clientReached.get(record.rel))
      }
    }
  }

  return {
    limits: [
      'Literal import graph follows relative and @/ specifiers inside app, components, lib, hooks, scripts, proxy.ts, and the three config files.',
      'A directive is recognized after leading comments and whitespace. A comment after other statements is not a directive.',
      'node_modules internals are not traced. A parent import is not a call into the vulnerable function.',
      'Non-literal dynamic import stays NOT_ASSESSED.',
    ],
    serverSeedCount: serverSeeds.length,
    clientSeedCount: clientSeeds.length,
    packageCount: Object.keys(byPackage).length,
    byPackage,
    reachability,
    dynamicNonLiteral,
  }
}
}
