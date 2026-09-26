#!/usr/bin/env node
// Seed the run-owned private npm cache from the original user's local
// content-addressable cache only. Never copy .npmrc, auth, logs, or npm
// config. The isolated npm ci stays offline, ignore-scripts and lockfile-bound.

import {
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import { notACompletedExecution } from './implementation.mjs'

export const NPM_CACHE_SEED = Object.freeze({
  sourceSegments: Object.freeze(['.npm', '_cacache']),
  destCacheSegments: Object.freeze(['cache', 'npm']),
  destCacacheName: '_cacache',
  maxFiles: 100_000,
  maxBytes: 4 * 1024 * 1024 * 1024,
  expectedRegistryHosts: Object.freeze(['registry.npmjs.org']),
  refusedNames: Object.freeze([
    '.npmrc',
    '_logs',
    '_log',
    'auth',
    'auth.json',
    '.npm-auth',
    'npm-auth',
    '_auth',
    '_authToken',
  ]),
  integrityPattern: /^sha(512|256|1)-[A-Za-z0-9+/=]+$/,
  tarballPathPattern: /^\/(?:@[^/]+\/)?[^/]+\/-\/[^/]+\.tgz$/,
})

function seedError(reason) {
  return notACompletedExecution('offline npm cache seed', reason)
}

export function pathIsUnderRoot(path, root) {
  if (!path || !root) return false
  const rel = relative(resolve(String(root)), resolve(String(path)))
  if (rel === '') return true
  if (rel.startsWith(`..${sep}`) || rel === '..' || rel.startsWith('..')) return false
  if (isAbsolute(rel)) return false
  return true
}

function refuseRemoteOrRelativePath(path, label) {
  if (path == null || String(path).trim() === '') {
    throw seedError(`${label} is unavailable`)
  }
  const value = String(path)
  if (value.includes('\0')) throw seedError(`${label} contains a NUL`)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) {
    throw seedError(`${label} must be a local path, not a URL`)
  }
  if (value.startsWith('//') || value.startsWith('\\\\')) {
    throw seedError(`${label} must be a local path, not a remote share`)
  }
  if (!isAbsolute(value)) throw seedError(`${label} must be an absolute local path`)
  return resolve(value)
}

export function assertLocalNonSymlinkDirectory(path, label) {
  const resolved = refuseRemoteOrRelativePath(path, label)
  if (!existsSync(resolved)) throw seedError(`${label} is absent`)
  const visible = lstatSync(resolved)
  if (visible.isSymbolicLink()) throw seedError(`${label} is a symlink and is refused`)
  if (!visible.isDirectory()) throw seedError(`${label} is not a directory`)
  const real = realpathSync(resolved)
  if (real !== resolved) throw seedError(`${label} real path escaped its visible path`)
  return resolved
}

export function assertNoSymlinkPathComponents(path, root) {
  const resolved = resolve(path)
  const rootResolved = resolve(root)
  if (!pathIsUnderRoot(resolved, rootResolved)) {
    throw seedError('path is outside the required local root')
  }
  let current = rootResolved
  const rel = relative(rootResolved, resolved)
  if (rel === '') return resolved
  for (const part of rel.split(sep)) {
    current = join(current, part)
    if (!existsSync(current)) continue
    if (lstatSync(current).isSymbolicLink()) {
      throw seedError(`nested symlink is refused: ${current}`)
    }
  }
  return resolved
}

export function leseOriginalHome(candidate) {
  const home = candidate === undefined ? process.env.HOME : candidate
  return assertLocalNonSymlinkDirectory(home, 'original HOME')
}

export function isRefusedCacheName(name) {
  return NPM_CACHE_SEED.refusedNames.includes(String(name))
}

export function discoverSourceCacache({ originalHome, sourceCacache } = {}) {
  const home = leseOriginalHome(originalHome)
  const source = sourceCacache == null
    ? join(home, ...NPM_CACHE_SEED.sourceSegments)
    : refuseRemoteOrRelativePath(sourceCacache, 'source cache')
  if (!pathIsUnderRoot(source, home)) {
    throw seedError('source cache is outside original HOME')
  }
  if (!existsSync(source)) throw seedError('source cache is absent')
  const visible = lstatSync(source)
  if (visible.isSymbolicLink()) throw seedError('source cache is a symlink and is refused')
  if (!visible.isDirectory()) throw seedError('source cache is not a directory')
  assertNoSymlinkPathComponents(source, home)
  const real = realpathSync(source)
  if (!pathIsUnderRoot(real, home)) {
    throw seedError('source cache real path escaped original HOME')
  }
  if (real !== resolve(source)) {
    throw seedError('source cache real path escaped its visible path')
  }
  return resolve(source)
}

export function resolveDestinationCacache({ privateHome, npmConfigCache } = {}) {
  const home = assertLocalNonSymlinkDirectory(privateHome, 'private HOME')
  const cacheRoot = npmConfigCache == null
    ? join(home, ...NPM_CACHE_SEED.destCacheSegments)
    : refuseRemoteOrRelativePath(npmConfigCache, 'run-owned npm cache')
  const dest = join(cacheRoot, NPM_CACHE_SEED.destCacacheName)
  if (!pathIsUnderRoot(cacheRoot, home) || !pathIsUnderRoot(dest, home)) {
    throw seedError('destination cache escaped private HOME')
  }
  if (existsSync(cacheRoot) && lstatSync(cacheRoot).isSymbolicLink()) {
    throw seedError('destination cache root is a symlink and is refused')
  }
  if (existsSync(dest)) {
    const visible = lstatSync(dest)
    if (visible.isSymbolicLink()) throw seedError('destination cache is a symlink and is refused')
    if (!visible.isDirectory()) throw seedError('destination cache is not a directory')
  }
  return { cacheRoot: resolve(cacheRoot), dest: resolve(dest), privateHome: home }
}

function mkdirOwned(path, root) {
  if (!pathIsUnderRoot(path, root)) {
    throw seedError('refusing to create a directory outside private HOME')
  }
  mkdirSync(path, { recursive: true, mode: 0o700 })
  chmodSync(path, 0o700)
  if (lstatSync(path).isSymbolicLink()) {
    throw seedError('destination directory became a symlink')
  }
}

export function isNpmRegistryTarballUrl(value) {
  try {
    const url = new URL(String(value))
    return url.protocol === 'https:'
      && !url.username
      && !url.password
      && NPM_CACHE_SEED.tarballPathPattern.test(url.pathname)
  } catch {
    return false
  }
}

function refuseResolvedSource(resolved, pkgName) {
  const raw = String(resolved)
  if (/^(git\+?|ssh:|file:|http:|github:|gitlab:|bitbucket:|gist:|npm:|workspace:)/i.test(raw)) {
    throw seedError(`lockfile dependency ${pkgName} uses a refused ${raw.split(':')[0]} source`)
  }
  let url
  try {
    url = new URL(raw)
  } catch {
    throw seedError(`lockfile dependency ${pkgName} uses a custom remote source`)
  }
  if (url.protocol !== 'https:') {
    throw seedError(`lockfile dependency ${pkgName} is not an HTTPS registry tarball`)
  }
  if (url.username || url.password) {
    throw seedError(`lockfile dependency ${pkgName} resolved URL carries credentials`)
  }
  if (!NPM_CACHE_SEED.tarballPathPattern.test(url.pathname)) {
    throw seedError(`lockfile dependency ${pkgName} is not an npm-registry tarball URL`)
  }
  return url
}

export function validateLockfileRegistryIntegrity({ lockfilePath, lockfile } = {}) {
  const parsed = lockfile == null
    ? JSON.parse(readFileSync(lockfilePath, 'utf8'))
    : lockfile
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw seedError('package-lock.json is not an object')
  }
  if (parsed.lockfileVersion !== 2 && parsed.lockfileVersion !== 3) {
    throw seedError('package-lock.json lockfileVersion must be 2 or 3')
  }
  const packages = parsed.packages
  if (packages == null) return { ok: true, packageCount: 0, hosts: [] }
  if (typeof packages !== 'object' || Array.isArray(packages)) {
    throw seedError('package-lock.json packages must be an object')
  }

  const representedHosts = new Set()
  let packageCount = 0
  for (const [name, pkg] of Object.entries(packages)) {
    if (name === '') continue
    if (pkg == null || typeof pkg !== 'object') {
      throw seedError(`lockfile package ${name} is not an object`)
    }
    if (pkg.link === true) {
      throw seedError(`lockfile dependency ${name} uses a refused file/link source`)
    }
    if (pkg.resolved == null || String(pkg.resolved) === '') {
      throw seedError(`lockfile registry package ${name} is missing a resolved URL`)
    }
    const url = refuseResolvedSource(pkg.resolved, name)
    if (!pkg.integrity || typeof pkg.integrity !== 'string' || !NPM_CACHE_SEED.integrityPattern.test(pkg.integrity)) {
      throw seedError(`lockfile registry package ${name} is missing a usable integrity field`)
    }
    representedHosts.add(url.hostname)
    packageCount += 1
  }

  for (const host of representedHosts) {
    if (!NPM_CACHE_SEED.expectedRegistryHosts.includes(host)) {
      throw seedError(`lockfile registry host ${host} is not an expected npm registry host`)
    }
  }
  return {
    ok: true,
    packageCount,
    hosts: [...representedHosts],
    lockfilePath: lockfilePath || null,
  }
}

function walkSourceEntries(source) {
  const files = []
  const directories = []
  const stack = [source]
  while (stack.length) {
    const dir = stack.pop()
    for (const name of readdirSync(dir)) {
      if (isRefusedCacheName(name)) continue
      const full = join(dir, name)
      const visible = lstatSync(full)
      if (visible.isSymbolicLink()) {
        throw seedError(`nested symlink is refused: ${full}`)
      }
      if (visible.isDirectory()) {
        directories.push(full)
        stack.push(full)
        continue
      }
      if (!visible.isFile()) {
        throw seedError(`source cache entry is not a regular file: ${full}`)
      }
      files.push({ path: full, bytes: visible.size })
    }
  }
  return { files, directories }
}

export function copyCacacheBounded({
  source,
  dest,
  privateHome,
  maxFiles = NPM_CACHE_SEED.maxFiles,
  maxBytes = NPM_CACHE_SEED.maxBytes,
} = {}) {
  const sourceDir = assertLocalNonSymlinkDirectory(source, 'source cache')
  if (!privateHome) throw seedError('copy requires the run-owned private HOME')
  if (!pathIsUnderRoot(dest, privateHome)) {
    throw seedError('destination cache escaped private HOME')
  }
  if (sourceDir === resolve(dest) || pathIsUnderRoot(dest, sourceDir) || pathIsUnderRoot(sourceDir, dest)) {
    throw seedError('source and destination cache trees must stay disjoint')
  }
  const inventory = walkSourceEntries(sourceDir)
  if (inventory.files.length > maxFiles) {
    throw seedError(`source cache exceeds the file cap ${maxFiles}`)
  }
  const totalBytes = inventory.files.reduce((sum, item) => sum + item.bytes, 0)
  if (totalBytes > maxBytes) {
    throw seedError(`source cache exceeds the byte cap ${maxBytes}`)
  }
  mkdirOwned(dest, privateHome)
  for (const directory of inventory.directories) {
    const rel = relative(sourceDir, directory)
    mkdirOwned(join(dest, rel), privateHome)
  }
  for (const file of inventory.files) {
    const rel = relative(sourceDir, file.path)
    const target = join(dest, rel)
    if (!pathIsUnderRoot(target, privateHome)) {
      throw seedError('refusing to write a cache file outside private HOME')
    }
    mkdirOwned(join(target, '..'), privateHome)
    copyFileSync(file.path, target)
    chmodSync(target, 0o644)
    if (lstatSync(target).isSymbolicLink()) {
      throw seedError('destination cache file became a symlink')
    }
  }
  return {
    files: inventory.files.length,
    bytes: totalBytes,
    directories: inventory.directories.length,
    dest: resolve(dest),
    source: sourceDir,
  }
}

export function assertOfflineLockedInstallEnv(env, { privateHome, cacheRoot } = {}) {
  if (!env || typeof env !== 'object') {
    throw seedError('install environment is missing')
  }
  if (env.npm_config_offline !== 'true') {
    throw seedError('npm_config_offline must remain true')
  }
  if (env.npm_config_ignore_scripts !== 'true') {
    throw seedError('npm_config_ignore_scripts must remain true')
  }
  if (env.npm_config_prefer_online || env.npm_config_prefer_offline === 'false') {
    throw seedError('online npm cache fallback is refused')
  }
  const configured = env.NPM_CONFIG_CACHE || env.npm_config_cache
  if (!configured) throw seedError('run-owned NPM_CONFIG_CACHE is missing')
  const resolvedCache = resolve(String(configured))
  if (cacheRoot && resolvedCache !== resolve(cacheRoot)) {
    throw seedError('install environment cache is not the run-owned destination')
  }
  if (privateHome && !pathIsUnderRoot(resolvedCache, privateHome)) {
    throw seedError('install environment cache escaped private HOME')
  }
  if (env.HOME && privateHome && resolve(String(env.HOME)) !== resolve(privateHome)) {
    throw seedError('install HOME is not the run-owned private HOME')
  }
  return {
    cache: resolvedCache,
    offline: env.npm_config_offline,
    ignoreScripts: env.npm_config_ignore_scripts,
  }
}

export function seedOfflineNpmCache({
  originalHome,
  privateHome,
  env,
  checkoutDir,
  sourceCacache,
  maxFiles,
  maxBytes,
} = {}) {
  if (!checkoutDir || !existsSync(join(checkoutDir, 'package-lock.json'))) {
    throw seedError('dedicated checkout package-lock.json is missing')
  }
  const lock = validateLockfileRegistryIntegrity({
    lockfilePath: join(checkoutDir, 'package-lock.json'),
  })
  const source = discoverSourceCacache({ originalHome, sourceCacache })
  const dest = resolveDestinationCacache({
    privateHome,
    npmConfigCache: env?.NPM_CONFIG_CACHE || env?.npm_config_cache,
  })
  const copy = copyCacacheBounded({
    source,
    dest: dest.dest,
    privateHome: dest.privateHome,
    maxFiles,
    maxBytes,
  })
  const installEnv = env
    ? assertOfflineLockedInstallEnv(env, { privateHome: dest.privateHome, cacheRoot: dest.cacheRoot })
    : null
  return {
    source,
    dest: dest.dest,
    cacheRoot: dest.cacheRoot,
    privateHome: dest.privateHome,
    lock,
    copy,
    installEnv,
  }
}
