#!/usr/bin/env node
// Private run-owned Docker CLI shim for the official Supabase CLI child only.
// Rewrites docker-create publish args to explicit 127.0.0.1 before start.
// Harness Docker operations keep using the exact verified real binary.
// #564 NetworkSettings inspection remains the authoritative post-start check.
// Official CLI archive/binary bytes are never modified.

import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { delimiter, dirname, isAbsolute, join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { findeAusfuehrbare } from '../admin-account-counts-browser-acceptance-1/resolve-executable.mjs'
import { CLI } from './constants.mjs'
import { notACompletedExecution } from './implementation.mjs'

export const SHIM_MODULE_PATH = fileURLToPath(import.meta.url)
export const SHIM_DIR_NAME = 'docker-publish-shim'
export const SHIM_FILE_NAME = 'docker'
export const LOOPBACK_HOST = '127.0.0.1'

const GLOBAL_VALUE_OPTIONS = new Set([
  '--config',
  '--context',
  '--host',
  '--log-level',
  '--tlscacert',
  '--tlscert',
  '--tlskey',
  '-H',
  '-c',
  '-l',
])
const GLOBAL_FLAG_OPTIONS = new Set([
  '-D',
  '--debug',
  '--tls',
  '--tlsverify',
])

function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function sha256File(path) {
  return sha256Bytes(readFileSync(path))
}

function isPort(value) {
  if (!/^[1-9][0-9]{0,4}$/.test(String(value || ''))) return false
  const port = Number(value)
  return Number.isInteger(port) && port >= 1 && port <= 65535
}

function isPublishFlag(token) {
  const name = String(token || '').split('=')[0]
  return name === '-p' || name === '--publish' || name === '-P' || name === '--publish-all'
}

function publishFlagName(token) {
  const raw = String(token || '')
  if (raw === '-p' || raw.startsWith('-p=') || (/^-p./.test(raw) && !raw.startsWith('--'))) return '-p'
  if (raw === '--publish' || raw.startsWith('--publish=')) return '--publish'
  return null
}

export function parseDockerPublishValue(value) {
  if (value == null) {
    throw new Error('missing docker create publish value')
  }
  const raw = String(value)
  if (raw === '') throw new Error('missing docker create publish value')
  if (/[\s,]/.test(raw)) throw new Error('ambiguous docker create publish value')
  if (raw.includes('[') || raw.includes(']')) {
    throw new Error('IPv6 docker create publish syntax is refused')
  }
  if (raw.includes('-')) {
    throw new Error('docker create publish port ranges are refused')
  }

  let rest = raw
  let protocol = ''
  const proto = rest.match(/^(.*)\/([A-Za-z0-9]+)$/)
  if (proto) {
    rest = proto[1]
    protocol = proto[2].toLowerCase()
    if (protocol !== 'tcp' && protocol !== 'udp') {
      throw new Error('unexpected docker create publish protocol')
    }
  }

  const parts = rest.split(':')
  if (parts.length === 2) {
    const [hostPort, containerPort] = parts
    if (!isPort(hostPort) || !isPort(containerPort)) {
      throw new Error('malformed docker create publish hostPort:containerPort')
    }
    return { host: null, hostPort, containerPort, protocol }
  }
  if (parts.length === 3) {
    const [host, hostPort, containerPort] = parts
    if (host !== LOOPBACK_HOST) {
      throw new Error(`docker create publish host ${host || '<empty>'} is refused`)
    }
    if (!isPort(hostPort) || !isPort(containerPort)) {
      throw new Error('malformed docker create publish 127.0.0.1:hostPort:containerPort')
    }
    return { host, hostPort, containerPort, protocol }
  }
  throw new Error('unexpected docker create publish syntax')
}

export function formatLoopbackPublishValue(parsed) {
  const proto = parsed.protocol ? `/${parsed.protocol}` : ''
  return `${LOOPBACK_HOST}:${parsed.hostPort}:${parsed.containerPort}${proto}`
}

export function locateDockerCommand(tokens = []) {
  let index = 0
  while (index < tokens.length) {
    const token = tokens[index]
    if (token === '--') {
      return { isCreate: false, index: -1 }
    }
    if (String(token).startsWith('-')) {
      if (isPublishFlag(token)) {
        throw new Error('publish flag before docker command is ambiguous')
      }
      const name = String(token).split('=')[0]
      if (GLOBAL_VALUE_OPTIONS.has(name) && !String(token).includes('=')) {
        if (tokens[index + 1] == null) {
          throw new Error(`docker global option ${name} is missing a value`)
        }
        index += 2
        continue
      }
      if (GLOBAL_VALUE_OPTIONS.has(name) || GLOBAL_FLAG_OPTIONS.has(name)) {
        index += 1
        continue
      }
      throw new Error(`unexpected docker global option before command: ${name}`)
    }
    if (token === 'create') return { isCreate: true, index }
    if (token === 'container' && tokens[index + 1] === 'create') {
      return { isCreate: true, index: index + 1 }
    }
    return { isCreate: false, index }
  }
  return { isCreate: false, index: -1 }
}

function rewritePublishToken(token, nextToken) {
  if (token === '-P' || token === '--publish-all') {
    throw new Error('docker create --publish-all is refused')
  }
  if (token === '-p' || token === '--publish') {
    if (nextToken == null || String(nextToken).startsWith('-')) {
      throw new Error('missing docker create publish value')
    }
    return {
      tokens: [token, formatLoopbackPublishValue(parseDockerPublishValue(nextToken))],
      consumed: 2,
    }
  }
  if (token.startsWith('-p=') || token.startsWith('--publish=')) {
    const flag = publishFlagName(token)
    const value = token.slice(token.indexOf('=') + 1)
    return {
      tokens: [`${flag}=${formatLoopbackPublishValue(parseDockerPublishValue(value))}`],
      consumed: 1,
    }
  }
  if (/^-p./.test(token) && !token.startsWith('--')) {
    const value = token.slice(2)
    return {
      tokens: [`-p${formatLoopbackPublishValue(parseDockerPublishValue(value))}`],
      consumed: 1,
    }
  }
  return null
}

export function rewriteDockerArgv(argv = []) {
  const tokens = Array.from(argv, (item) => String(item))
  const command = locateDockerCommand(tokens)
  if (!command.isCreate) {
    return { argv: tokens, rewritten: false, command }
  }
  const out = []
  let index = 0
  while (index < tokens.length) {
    const token = tokens[index]
    if (token === '--expose' || token.startsWith('--expose=')) {
      if (token === '--expose') {
        if (tokens[index + 1] == null) throw new Error('missing docker create --expose value')
        out.push(token, tokens[index + 1])
        index += 2
        continue
      }
      out.push(token)
      index += 1
      continue
    }
    const rewritten = rewritePublishToken(token, tokens[index + 1])
    if (rewritten) {
      out.push(...rewritten.tokens)
      index += rewritten.consumed
      continue
    }
    out.push(token)
    index += 1
  }
  return { argv: out, rewritten: true, command }
}

export function baueCliChildUmgebung({ childEnv, shimDir } = {}) {
  if (!childEnv || typeof childEnv !== 'object') {
    throw notACompletedExecution('docker publish shim', 'CLI child environment is missing')
  }
  if (!shimDir || !isAbsolute(shimDir)) {
    throw notACompletedExecution('docker publish shim', 'shim directory must be an absolute run-owned path')
  }
  const next = { ...childEnv }
  const current = String(next.PATH || '')
  next.PATH = current ? `${shimDir}${delimiter}${current}` : shimDir
  return next
}

export function resolveDockerInEnv(env) {
  return findeAusfuehrbare(SHIM_FILE_NAME, env)
}

export function assertDockerResolvesToShim({ env, shimPath } = {}) {
  const resolved = resolveDockerInEnv(env)
  if (resolved !== shimPath) {
    throw notACompletedExecution(
      'docker publish shim',
      `child PATH docker resolved to ${resolved || 'none'}, not ${shimPath}`,
    )
  }
  return resolved
}

function assertOwnedUnder(path, root) {
  if (!path || !root) return false
  const rel = relative(root, path)
  if (rel === '') return true
  if (rel.startsWith(`..${sep}`) || rel === '..' || rel.startsWith('..')) return false
  if (isAbsolute(rel)) return false
  return true
}

function fileMode(path) {
  return lstatSync(path).mode & 0o777
}

function assertHarnessDockerBinary(path, label) {
  if (!path || !isAbsolute(path)) {
    throw notACompletedExecution('docker publish shim', `${label} must be an absolute path`)
  }
  if (!existsSync(path)) {
    throw notACompletedExecution('docker publish shim', `${label} is absent`)
  }
  const visible = lstatSync(path)
  const target = visible.isSymbolicLink() ? statSync(path) : visible
  if (!target.isFile()) {
    throw notACompletedExecution('docker publish shim', `${label} is not a file`)
  }
  if ((target.mode & 0o111) === 0) {
    throw notACompletedExecution('docker publish shim', `${label} is not executable`)
  }
  return visible
}

export function assertDockerPublishShimUsable(input = {}) {
  const {
    shim,
    cli,
    docker,
    cliEnv,
    privateHome,
    runId,
  } = input
  void input.shimVerified
  void input.verified
  void input.ready
  void input.ok

  if (!cli || cli.archiveBound !== true || cli.identityVerified !== true) {
    throw notACompletedExecution(
      'docker publish shim',
      'official CLI 2.117.0 is not archiveBound and identityVerified',
    )
  }
  if (cli.version != null && String(cli.version) !== '' && !CLI.versionPattern.test(String(cli.version))) {
    throw notACompletedExecution('docker publish shim', 'official CLI version is not the pinned 2.117.0 identity')
  }
  if (!docker?.usable || !docker?.selected?.path) {
    throw notACompletedExecution('docker publish shim', 'verified local Docker binary is absent')
  }
  if (!shim?.path || !shim.dir || !shim.sha256 || !shim.realDockerBin) {
    throw notACompletedExecution('docker publish shim', 'shim provenance is incomplete')
  }
  if (!privateHome || !assertOwnedUnder(shim.path, privateHome) || !assertOwnedUnder(shim.dir, privateHome)) {
    throw notACompletedExecution('docker publish shim', 'shim is not under the current run-owned HOME')
  }
  if (runId && shim.runId && shim.runId !== runId) {
    throw notACompletedExecution('docker publish shim', 'shim run identity does not match the current run')
  }
  if (shim.realDockerBin !== docker.selected.path) {
    throw notACompletedExecution('docker publish shim', 'shim real Docker path is not the harness-selected binary')
  }
  assertHarnessDockerBinary(shim.realDockerBin, 'real Docker binary')
  const shimStat = lstatSync(shim.path)
  if (shimStat.isSymbolicLink()) {
    throw notACompletedExecution('docker publish shim', 'shim must not be a symlink')
  }
  if (!shimStat.isFile()) {
    throw notACompletedExecution('docker publish shim', 'shim is not a regular file')
  }
  if (fileMode(shim.path) !== 0o700) {
    throw notACompletedExecution('docker publish shim', 'shim file mode must be 0700')
  }
  const dirStat = lstatSync(shim.dir)
  if (dirStat.isSymbolicLink()) {
    throw notACompletedExecution('docker publish shim', 'shim directory must not be a symlink')
  }
  if (fileMode(shim.dir) !== 0o700) {
    throw notACompletedExecution('docker publish shim', 'shim directory mode must be 0700')
  }
  const actualHash = sha256File(shim.path)
  if (actualHash !== shim.sha256) {
    throw notACompletedExecution('docker publish shim', 'shim SHA256 does not match the bytes just created')
  }
  if (shim.path === shim.realDockerBin || shim.realDockerBin.startsWith(`${shim.dir}${sep}`)) {
    throw notACompletedExecution('docker publish shim', 'real Docker binary must not resolve to the shim')
  }
  assertDockerResolvesToShim({ env: cliEnv, shimPath: shim.path })
  return true
}

function renderShimSource({ realDockerBin, modulePath, nodeBin }) {
  if (!isAbsolute(nodeBin) || /[\r\n]/.test(nodeBin)) {
    throw notACompletedExecution('docker publish shim', 'refusing unsafe node interpreter path')
  }
  return `${`#!${nodeBin}`}\n`
    + `'use strict'\n`
    + `const realDockerBin = ${JSON.stringify(realDockerBin)}\n`
    + `const moduleHref = ${JSON.stringify(pathToFileURL(modulePath).href)}\n`
    + `import(moduleHref).then((mod) => mod.delegateDockerPublishShim({\n`
    + `  realDockerBin,\n`
    + `  argv: process.argv.slice(2),\n`
    + `})).then((code) => {\n`
    + `  process.exit(code ?? 1)\n`
    + `}).catch((error) => {\n`
    + `  const message = error && error.message ? error.message : 'docker publish shim failed'\n`
    + `  console.error(message)\n`
    + `  process.exit(1)\n`
    + `})\n`
}

export function delegateDockerPublishShim({
  realDockerBin,
  argv = process.argv.slice(2),
  spawnFn = spawn,
} = {}) {
  if (!realDockerBin || !isAbsolute(realDockerBin)) {
    throw new Error('shim refuses to resolve docker from PATH')
  }
  const { argv: next } = rewriteDockerArgv(argv)
  return new Promise((resolve, reject) => {
    const child = spawnFn(realDockerBin, next, { stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code) => resolve(code ?? 1))
  })
}

export function prepareDockerPublishShim({
  privateHome,
  toolingDir,
  realDockerBin,
  childEnv,
  cli,
  docker,
  runId,
} = {}) {
  if (!privateHome) {
    throw notACompletedExecution('docker publish shim', 'run-owned private HOME is missing')
  }
  if (!cli || cli.archiveBound !== true || cli.identityVerified !== true) {
    throw notACompletedExecution(
      'docker publish shim',
      'official CLI 2.117.0 is not archiveBound and identityVerified',
    )
  }
  if (!docker?.usable || !docker?.selected?.path) {
    throw notACompletedExecution('docker publish shim', 'verified local Docker binary is absent')
  }
  const selected = docker.selected.path
  if (!realDockerBin || realDockerBin !== selected) {
    throw notACompletedExecution('docker publish shim', 'shim real Docker path must be the harness-selected binary')
  }
  assertHarnessDockerBinary(realDockerBin, 'real Docker binary')

  const baseTooling = toolingDir || join(privateHome, 'tooling')
  mkdirSync(baseTooling, { recursive: true, mode: 0o700 })
  chmodSync(baseTooling, 0o700)
  if (!assertOwnedUnder(baseTooling, privateHome)) {
    throw notACompletedExecution('docker publish shim', 'tooling directory is not under the run-owned HOME')
  }
  const shimDir = join(baseTooling, SHIM_DIR_NAME)
  mkdirSync(shimDir, { recursive: true, mode: 0o700 })
  chmodSync(shimDir, 0o700)
  const shimPath = join(shimDir, SHIM_FILE_NAME)
  if (realDockerBin === shimPath || realDockerBin.startsWith(`${shimDir}${sep}`)) {
    throw notACompletedExecution('docker publish shim', 'real Docker binary must not resolve to the shim')
  }
  if (existsSync(shimPath)) {
    throw notACompletedExecution('docker publish shim', 'shim path already exists')
  }
  const source = renderShimSource({
    realDockerBin,
    modulePath: SHIM_MODULE_PATH,
    nodeBin: process.execPath,
  })
  writeFileSync(shimPath, source, { encoding: 'utf8', mode: 0o700, flag: 'wx' })
  chmodSync(shimPath, 0o700)
  const shimStat = lstatSync(shimPath)
  if (shimStat.isSymbolicLink() || !shimStat.isFile()) {
    throw notACompletedExecution('docker publish shim', 'created shim must be a regular file')
  }
  if (fileMode(shimPath) !== 0o700 || fileMode(shimDir) !== 0o700) {
    throw notACompletedExecution('docker publish shim', 'created shim mode must stay 0700')
  }
  const shim = {
    path: shimPath,
    dir: shimDir,
    sha256: sha256File(shimPath),
    realDockerBin,
    runId: runId || null,
    mode: 0o700,
    created: true,
  }
  const cliEnv = baueCliChildUmgebung({ childEnv, shimDir })
  assertDockerPublishShimUsable({
    shim,
    cli,
    docker,
    cliEnv,
    privateHome,
    runId,
    shimVerified: true,
  })
  return { shim, cliEnv }
}

export function shimOwnershipUnknown(shim, ownedRoots = []) {
  if (!shim) return false
  if (!shim.path || !shim.dir) return true
  if (!ownedRoots.length) return true
  return !ownedRoots.some((root) => assertOwnedUnder(shim.path, root) && assertOwnedUnder(shim.dir, root))
}

export { sha256File, dirname }
