/** Read-only, offline current-version control for #950; no environment-file reads. */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, relative, resolve, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { isDeepStrictEqual } from 'node:util'

const control = JSON.parse(readFileSync(new URL('./historical-control.json', import.meta.url), 'utf8'))
const historicalPath = 'scripts/next-16-3-8-security-upgrade-1-audit.mjs'
const expectedHistoricalFailures = [
  'next pin is 16.4.1, expected 16.3.8',
  'eslint-config-next pin is 16.4.1, expected 16.3.8',
]
const exact = {
  next: '16.4.1', 'eslint-config-next': '16.4.1', react: '19.2.8', 'react-dom': '19.2.8',
  eslint: '9.39.5', typescript: '5.9.3', '@types/node': '22.20.1',
  '@types/react': '19.2.18', '@types/react-dom': '19.2.5',
}
// Direct official npm metadata, verified 2026-10-15 before dependency edits.
const publishedIntegrity = {
  next: 'sha512-uc657V62E34fOI6W5NtG9IzwsPcms0Z60grz2MJGtglgD+pTFnNt4Yw2PzaU622tfX4vhrDgLZzicE2YlhI20Q==',
  'eslint-config-next': 'sha512-6AsojbCfRdpWkP6BIUnMBv3MH4OvtfmH9p4hSfLh8ZgsW7nfhu7DpUMNBB7leisDyyMz+YYxTc+NAdBOQfovlA==',
  sharp: 'sha512-Ywn4OnzGukp7CDMrp08RQ50YKmuwG47brZgIVPTvBaaAfQlRlygrRqSrxdCiL9M+LlzLBiJ68IR1QqvzHyjC7g==',
}
const packageName = (path) => path.split('node_modules/').at(-1)
const isBinary = (name) => name.startsWith('@img/sharp-') && !name.startsWith('@img/sharp-libvips-')
const isRelevant = (name) => name in exact || name === 'sharp' || name.startsWith('@img/sharp-') || name.startsWith('@next/')
const stable = (v) => typeof v === 'string' && /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(v)
const atLeast = (v, floor) => stable(v) && v.split('.').map(Number).reduce((cmp, n, i) => cmp || Math.sign(n - floor[i]), 0) >= 0
const blob = (bytes) => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
const provenance = (entry) => ({ version: entry?.version, resolved: entry?.resolved, integrity: entry?.integrity })

function resolveLock(packages, parent, name) {
  let dir = parent
  for (;;) {
    const candidate = posix.join(dir, 'node_modules', name)
    if (packages[candidate]) return packages[candidate]
    if (dir === '.') return undefined
    dir = posix.dirname(dir)
  }
}

export function collect(root = process.cwd()) {
  const read = (path) => readFileSync(join(root, path))
  const json = (path) => JSON.parse(read(path).toString())
  const protectedBlobs = Object.fromEntries(Object.keys(control.protectedBlobs).map(path => [path, blob(read(path))]))
  // Never execute an altered historical control.
  if (protectedBlobs[historicalPath] !== control.protectedBlobs[historicalPath]) throw new Error('historical audit changed')
  const run = spawnSync(process.execPath, [historicalPath], { cwd: root, encoding: 'utf8' })
  const historical = { status: run.status, signal: run.signal, error: Boolean(run.error), stderrEmpty: run.stderr === '', report: JSON.parse(run.stdout) }
  const serverActions = {}
  const walk = (dir) => {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = `${dir}/${entry.name}`
      if (entry.isSymbolicLink()) throw new Error('runtime symlink cannot be inventoried')
      if (entry.isDirectory()) walk(path)
      else if (/\.[cm]?[jt]sx?$/.test(path) && !/\.(test|spec)\.[cm]?[jt]sx?$/.test(path)) {
        const bytes = read(path)
        if (/(^|\n)\s*['"]use server['"]\s*;?\s*(\n|$)/.test(bytes.toString())) serverActions[path] = blob(bytes)
      }
    }
  }
  for (const dir of ['app', 'components', 'lib', 'hooks']) if (existsSync(join(root, dir))) walk(dir)
  const lock = json('package-lock.json')
  const installLock = json('node_modules/.package-lock.json')
  const installed = {}
  for (const path of new Set([...Object.keys(lock.packages), ...Object.keys(installLock.packages)])) {
    if (isRelevant(packageName(path)) && existsSync(join(root, path, 'package.json'))) installed[path] = json(`${path}/package.json`)
  }
  const require = createRequire(join(root, 'package.json'))
  const sharp = require('sharp') // Loads the actual host binding; no image input or request.
  const loadedBinaries = Object.keys(require.cache).map(path => relative(root, path).split('\\').join('/'))
    .filter(path => /^node_modules\/@img\/sharp-[^/]+\/.+\.node$/.test(path))
  if (loadedBinaries.length !== 1) throw new Error('one loaded native Sharp binary required')
  const nativeBinary = loadedBinaries[0]
  const native = nativeBinary.split('/').slice(1, 3).join('/')
  const platform = native.slice('@img/sharp-'.length, -(process.arch.length + 1))
  const nativeEntry = relative(root, require.resolve(`${native}/sharp.node`)).split('\\').join('/')
  const sharpEntry = relative(root, require.resolve('sharp')).split('\\').join('/')
  return { pkg: json('package.json'), lock, installLock, installed, protectedBlobs, serverActions, historical,
    runtime: { node: process.versions.node, platform, arch: process.arch, native, nativeEntry, nativeBinary, sharpEntry, versions: sharp.versions } }
}

export function validate(snapshot) {
  const failures = []
  const check = (ok, message) => { if (!ok) failures.push(message) }
  try {
    const { pkg, lock, installLock, installed, historical, runtime } = snapshot
    check(isDeepStrictEqual(snapshot.protectedBlobs, control.protectedBlobs), 'historical audit/config/deployment blob drift')
    check(isDeepStrictEqual(snapshot.serverActions, control.serverActions), 'server action source inventory drift')
    check(historical.status === 1 && historical.signal === null && !historical.error && historical.stderrEmpty, 'historical audit unexpected process result')
    check(historical.report.slice === 'next-16-3-8-security-upgrade-1', 'historical audit identity drift')
    check(isDeepStrictEqual(historical.report.failures, expectedHistoricalFailures), 'historical audit unexpected failures')
    const pins = { next: '16.4.1', eslintConfigNext: '16.4.1', react: '19.2.8', reactDom: '19.2.8' }
    check(isDeepStrictEqual(historical.report.pins, pins), 'historical reported current pins drift')
    for (const key of ['inventory', 'remotePatterns', 'deployment']) check(isDeepStrictEqual(historical.report[key], control[key]), `historical ${key} drift`)
    check(pkg.engines?.node === '22.x' && /^22\./.test(runtime.node), 'Node 22 compatibility contract drift')
    check(isDeepStrictEqual(pkg.overrides, { 'simple-swizzle': '0.2.2' }), 'package override drift')
    check(lock.lockfileVersion === 3 && installLock.lockfileVersion === 3, 'npm lock version drift')
    for (const key of ['dependencies', 'devDependencies', 'engines']) check(isDeepStrictEqual(pkg[key], lock.packages[''][key]), `root lock ${key} drift`)
    for (const [name, version] of Object.entries(exact)) {
      check((pkg.dependencies?.[name] ?? pkg.devDependencies?.[name]) === version, `${name} manifest pin drift`)
      check(lock.packages[`node_modules/${name}`]?.version === version, `${name} locked pin drift`)
      check(installed[`node_modules/${name}`]?.version === version, `${name} installed pin drift`)
    }
    check(lock.packages['node_modules/next']?.optionalDependencies?.sharp === '^0.35.5', 'Next Sharp dependency range drift')
    check(lock.packages['node_modules/sharp'] && installed['node_modules/sharp'], 'Sharp missing')
    check(lock.packages['node_modules/next']?.peerDependencies?.react?.includes('^19.0.0'), 'Next React peer compatibility drift')
    check(installed['node_modules/eslint-config-next']?.peerDependencies?.eslint === '>=9.0.0', 'ESLint peer compatibility drift')
    check(installed['node_modules/eslint-config-next']?.peerDependencies?.typescript === '>=3.3.1', 'TypeScript peer compatibility drift')
    for (const [path, entry] of Object.entries(lock.packages)) {
      const name = packageName(path)
      if (!isRelevant(name)) continue
      check(stable(entry.version), `${path} non-stable version`)
      if (name in exact) check(entry.version === exact[name], `${path} unexpected version`)
      if (name.startsWith('@next/')) check(entry.version === '16.4.1', `${path} Next companion drift`)
      if (name === 'sharp' || isBinary(name)) check(atLeast(entry.version, [0, 35, 5]), `${path} below Sharp floor`)
      if (name.startsWith('@img/sharp-libvips-')) check(atLeast(entry.version, [1, 3, 4]), `${path} below separate libvips package floor`)
      const tarball = `https://registry.npmjs.org/${name}/-/${name.split('/').at(-1)}-${entry.version}.tgz`
      check(entry.resolved === tarball && /^sha512-[A-Za-z0-9+/]+={0,2}$/.test(entry.integrity ?? ''), `${path} registry provenance missing`)
      if (publishedIntegrity[name] && (name !== 'sharp' || entry.version === '0.35.5')) check(entry.integrity === publishedIntegrity[name], `${path} published integrity mismatch`)
      for (const [child, version] of Object.entries(entry.optionalDependencies ?? {})) {
        if (!child.startsWith('@img/sharp-')) continue
        const resolved = resolveLock(lock.packages, path, child)
        check(stable(version) && resolved?.version === version, `${path} optional native graph mismatch: ${child}`)
      }
    }
    for (const [path, entry] of Object.entries(installed)) {
      const locked = lock.packages[path]
      check(locked && entry.version === locked.version && isDeepStrictEqual(provenance(locked), provenance(installLock.packages[path])), `${path} installed provenance mismatch`)
      for (const key of ['dependencies', 'optionalDependencies']) check(isDeepStrictEqual(entry[key] ?? {}, locked?.[key] ?? {}), `${path} installed ${key} drift`)
    }
    for (const path of Object.keys(installLock.packages)) if (isRelevant(packageName(path))) check(Boolean(installed[path]), `${path} installed package missing`)
    const nativePath = `node_modules/${runtime.native}`
    check(isBinary(runtime.native) && Boolean(installed[nativePath]), 'host native binding missing')
    check(runtime.nativeEntry.startsWith(`${nativePath}/`) && !runtime.nativeEntry.includes('/../'), 'host native binding resolution drift')
    check(runtime.nativeBinary.startsWith(`${nativePath}/`) && runtime.nativeBinary.endsWith('.node') && !runtime.nativeBinary.includes('/../'), 'loaded native binary provenance drift')
    check(runtime.sharpEntry.startsWith('node_modules/sharp/'), 'Sharp runtime resolution drift')
    check(runtime.versions.sharp === installed['node_modules/sharp']?.version && atLeast(runtime.versions.sharp, [0, 35, 5]), 'loaded Sharp version drift')
    for (const name of Object.keys(installed['node_modules/sharp']?.optionalDependencies ?? {})) {
      if (name === runtime.native || name === `@img/sharp-libvips-${runtime.platform}-${runtime.arch}`) check(Boolean(installed[`node_modules/${name}`]), `${name} applicable native dependency missing`)
    }
  } catch {
    failures.push('audit input missing or malformed')
  }
  return failures
}

export function audit(root = process.cwd()) {
  const snapshot = collect(root)
  return {
    slice: 'next-16-4-1-security-patch-p1', pins: snapshot.historical.report.pins,
    deployment: snapshot.historical.report.deployment, remotePatterns: snapshot.historical.report.remotePatterns,
    inventory: snapshot.historical.report.inventory, serverActions: snapshot.serverActions,
    protectedBlobs: snapshot.protectedBlobs,
    historical: { status: snapshot.historical.status, classification: 'EXPECTED_DATED_PIN_MISMATCH_NOT_PASS', failures: snapshot.historical.report.failures },
    lock: Object.fromEntries(Object.entries(snapshot.lock.packages).filter(([path]) => isRelevant(packageName(path))).map(([path, entry]) => [path, provenance(entry)])),
    installed: Object.fromEntries(Object.entries(snapshot.installed).map(([path, entry]) => [path, entry.version])),
    runtime: snapshot.runtime, failures: validate(snapshot),
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let report
  try { report = audit() } catch { report = { slice: 'next-16-4-1-security-patch-p1', failures: ['audit input, historical process or native installation unreadable'] } }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  process.exitCode = report.failures.length ? 1 : 0
}
