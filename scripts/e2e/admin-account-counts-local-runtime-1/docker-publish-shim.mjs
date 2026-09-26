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
import { fileURLToPath } from 'node:url'
import { findeAusfuehrbare } from '../admin-account-counts-browser-acceptance-1/resolve-executable.mjs'
import { CLI } from './constants.mjs'
import { notACompletedExecution } from './implementation.mjs'

export const SHIM_MODULE_PATH = fileURLToPath(import.meta.url)
export const SHIM_DIR_NAME = 'docker-publish-shim'
export const SHIM_FILE_NAME = 'docker'
export const LOOPBACK_HOST = '127.0.0.1'

// Exact docker-create option grammar emitted by pinned Supabase CLI v2.117.0's
// legacyBuildStartContainerCreateArgs(): options first, then image, then CMD.
// Unknown pre-image options fail closed instead of being guessed.
const CREATE_VALUE_OPTIONS = new Set(["--name","--hostname","-e","-v","--volumes-from","--tmpfs","-p","--publish","--expose","--health-cmd","--health-interval","--health-timeout","--health-retries","--health-start-period","--restart","--security-opt","--add-host","--network","--network-alias","--label","--entrypoint"])
const CREATE_FLAG_OPTIONS = new Set(["--rm"])
const CREATE_PUBLISH_OPTIONS = new Set(["-p","--publish"])

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

export function locateDockerCommand(tokens = []) {
  // Pinned v2.117 calls the container CLI with "create" as argv[0].
  // Every other command is delegated byte-for-byte. A future "docker container
  // create" shape is intentionally refused instead of silently bypassing the
  // publication guard.
  if (tokens[0] === 'create') return { isCreate: true, index: 0 }
  if (tokens[0] === 'container' && tokens[1] === 'create') {
    throw new Error('unexpected docker container create command shape')
  }
  return { isCreate: false, index: -1 }
}

export function rewriteDockerArgv(argv = []) {
  const tokens = Array.from(argv, (item) => String(item))
  const command = locateDockerCommand(tokens)
  if (!command.isCreate) {
    return { argv: tokens, rewritten: false, command }
  }

  const out = [tokens[command.index]]
  let index = command.index + 1
  let rewritten = false

  while (index < tokens.length) {
    const token = tokens[index]

    // Pinned builder emits all Docker options before the image. The first
    // non-option token is therefore the image; image + CMD are copied
    // byte-for-byte and never scanned for -p/--publish.
    if (!String(token).startsWith('-')) {
      out.push(...tokens.slice(index))
      return { argv: out, rewritten, command, imageIndex: index }
    }

    if (token === '--') {
      throw new Error('unexpected docker create option terminator before image')
    }

    if (CREATE_FLAG_OPTIONS.has(token)) {
      out.push(token)
      index += 1
      continue
    }

    if (!CREATE_VALUE_OPTIONS.has(token)) {
      throw new Error(`unexpected docker create option before image: ${token}`)
    }

    if (tokens[index + 1] == null) {
      throw new Error(`docker create option ${token} is missing a value`)
    }

    const value = tokens[index + 1]
    if (CREATE_PUBLISH_OPTIONS.has(token)) {
      out.push(token, formatLoopbackPublishValue(parseDockerPublishValue(value)))
      rewritten = true
    } else {
      out.push(token, value)
    }
    index += 2
  }

  throw new Error('docker create image is missing')
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

function renderShimSource({ realDockerBin, nodeBin }) {
  if (!isAbsolute(nodeBin) || /[\r\n]/.test(nodeBin)) {
    throw notACompletedExecution('docker publish shim', 'refusing unsafe node interpreter path')
  }

  // Self-contained executable: freeze the already-reviewed enforcement
  // functions into this single run-owned, SHA256-verified 0700 file. Later
  // shim invocations do not import repository enforcement code.
  return `#!${nodeBin}\n`
    + `'use strict'\n`
    + `const { spawnSync } = require('node:child_process')\n`
    + `const realDockerBin = ${JSON.stringify(realDockerBin)}\n`
    + `const LOOPBACK_HOST = ${JSON.stringify(LOOPBACK_HOST)}\n`
    + `const CREATE_VALUE_OPTIONS = new Set(${JSON.stringify([...CREATE_VALUE_OPTIONS])})\n`
    + `const CREATE_FLAG_OPTIONS = new Set(${JSON.stringify([...CREATE_FLAG_OPTIONS])})\n`
    + `const CREATE_PUBLISH_OPTIONS = new Set(${JSON.stringify([...CREATE_PUBLISH_OPTIONS])})\n`
    + `${isPort.toString()}\n`
    + `${parseDockerPublishValue.toString()}\n`
    + `${formatLoopbackPublishValue.toString()}\n`
    + `${locateDockerCommand.toString()}\n`
    + `${rewriteDockerArgv.toString()}\n`
    + `let next\n`
    + `try { next = rewriteDockerArgv(process.argv.slice(2)).argv } catch (error) {\n`
    + `  console.error(error && error.message ? error.message : 'docker publish shim refused command')\n`
    + `  process.exit(1)\n`
    + `}\n`
    + `const result = spawnSync(realDockerBin, next, { stdio: 'inherit' })\n`
    + `if (result.error) { console.error('real Docker execution failed'); process.exit(1) }\n`
    + `if (result.signal) { console.error('real Docker terminated by signal'); process.exit(1) }\n`
    + `process.exit(Number.isInteger(result.status) ? result.status : 1)\n`
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
