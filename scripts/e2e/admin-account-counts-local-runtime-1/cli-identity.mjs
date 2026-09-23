#!/usr/bin/env node
// Official Supabase CLI v2.117.0 identity. PATH presence is not a pin.
// Acquisition, if requested, is one hash-checked official archive into
// run-owned tooling. Never apt, curl-pipe-shell, unpinned npx, or a silent
// version switch.

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { arch, platform } from 'node:os'
import { join } from 'node:path'
import { findeAusfuehrbare } from '../admin-account-counts-browser-acceptance-1/resolve-executable.mjs'
import { CLI, TIMEOUTS } from './constants.mjs'

export function platformKey({ plat = platform(), cpu = arch() } = {}) {
  if (plat === 'linux' && (cpu === 'x64' || cpu === 'x86_64')) return 'linux-x64'
  if (plat === 'linux' && (cpu === 'arm64' || cpu === 'aarch64')) return 'linux-arm64'
  if (plat === 'darwin' && (cpu === 'arm64' || cpu === 'aarch64')) return 'darwin-arm64'
  if (plat === 'darwin' && (cpu === 'x64' || cpu === 'x86_64')) return 'darwin-x64'
  return null
}

export function parseChecksums(text) {
  const map = {}
  for (const line of String(text || '').split(/\r?\n/)) {
    const match = line.trim().match(/^([a-f0-9]{64})\s+(\S+)$/i)
    if (match) map[match[2]] = match[1].toLowerCase()
  }
  return map
}

export function digestHex(digest) {
  return String(digest || '').replace(/^sha256:/i, '').toLowerCase()
}

export function assertOfficialArchiveIdentity({ platformId, checksumsText, checksumsBytes, apiDigest }) {
  const expected = CLI.archives[platformId]
  if (!expected) throw new Error(`Unsupported platform for CLI ${CLI.version}: ${platformId}`)
  if (checksumsBytes) {
    const actual = createHash('sha256').update(checksumsBytes).digest('hex')
    if (actual !== digestHex(CLI.checksumsApiDigest)) {
      throw new Error(`checksums.txt digest ${actual} != ${digestHex(CLI.checksumsApiDigest)}`)
    }
  }
  const parsed = parseChecksums(checksumsText)
  const fileDigest = parsed[expected.name]
  if (!fileDigest) throw new Error(`checksums.txt missing ${expected.name}`)
  const api = digestHex(apiDigest || expected.apiDigest)
  if (fileDigest !== api) {
    throw new Error(`CLI checksum mismatch for ${expected.name}: checksums.txt ${fileDigest} != API ${api}`)
  }
  return { name: expected.name, sha256: fileDigest, version: CLI.version }
}

export function assertCliVersionText(text) {
  if (!CLI.versionPattern.test(String(text || '').trim())) {
    throw new Error(`CLI --version is not the selected ${CLI.version}: ${String(text || '').trim() || 'empty'}`)
  }
  return true
}

export function assertCliHelpText(text, { kind = 'help' } = {}) {
  const source = String(text || '')
  if (kind === 'start' && !CLI.startHelpPattern.test(source)) {
    throw new Error('CLI start --help did not match the official local-development start help.')
  }
  if (kind !== 'start' && !CLI.helpPattern.test(source) && !CLI.startHelpPattern.test(source)) {
    throw new Error('CLI --help did not mention official start/stop/status commands.')
  }
  return true
}

function tryExec(execFile, bin, args, env, timeout = TIMEOUTS.cliHelpMs) {
  try {
    const out = execFile(bin, args, { encoding: 'utf8', timeout, env })
    return { ok: true, text: String(out).trim().split('\n')[0], full: String(out) }
  } catch (error) {
    return { ok: false, error: String(error && error.message ? error.message : error).split('\n')[0], full: String(error?.stdout || '') }
  }
}

export function verifyResolvedCli({ resolved, env, execFile = execFileSync }) {
  if (!resolved) {
    return {
      available: false,
      identityVerified: false,
      pinned: false,
      version: null,
      helpVerified: false,
      startHelpVerified: false,
      note: 'No supabase executable on the isolated PATH or in run-owned tooling.',
    }
  }
  const version = tryExec(execFile, resolved, ['--version'], env)
  const help = version.ok ? tryExec(execFile, resolved, ['--help'], env) : { ok: false }
  const startHelp = version.ok ? tryExec(execFile, resolved, ['start', '--help'], env) : { ok: false }
  let versionOk = false
  let helpOk = false
  let startHelpOk = false
  try {
    if (version.ok) {
      assertCliVersionText(version.text)
      versionOk = true
    }
  } catch {
    versionOk = false
  }
  try {
    if (help.ok) {
      assertCliHelpText(help.full || help.text, { kind: 'help' })
      helpOk = true
    }
  } catch {
    helpOk = false
  }
  try {
    if (startHelp.ok) {
      assertCliHelpText(startHelp.full || startHelp.text, { kind: 'start' })
      startHelpOk = true
    }
  } catch {
    startHelpOk = false
  }
  const identityVerified = versionOk && helpOk && startHelpOk
  return {
    available: identityVerified,
    identityVerified,
    pinned: identityVerified,
    resolved,
    version: version.ok ? version.text : null,
    helpVerified: helpOk,
    startHelpVerified: startHelpOk,
    startHelpTextPresent: Boolean(startHelp.full),
    excludeNames: listExcludeNames(startHelp.full || ''),
    note: identityVerified
      ? `Resolved supabase matched official ${CLI.version} version and help.`
      : `Selected candidate is ${CLI.version}. Observed ${version.ok ? version.text : 'no version'}; help=${helpOk}; startHelp=${startHelpOk}.`,
  }
}

export function listExcludeNames(startHelpText) {
  const match = String(startHelpText || '').match(/--exclude[^[]*\[([^\]]+)\]/i)
  if (!match) return []
  return match[1].split(',').map((name) => name.trim()).filter(Boolean)
}

export function selectSafeExcludes(availableNames) {
  const preferred = [
    'realtime',
    'storage-api',
    'imgproxy',
    'studio',
    'edge-runtime',
    'logflare',
    'vector',
    'supavisor',
  ]
  const available = new Set(availableNames || [])
  return preferred.filter((name) => available.size === 0 || available.has(name))
}

export async function acquireOfficialCli({
  toolingDir,
  checksumsText,
  checksumsBytes,
  archiveBytes,
  platformId = platformKey(),
} = {}) {
  if (!platformId || !CLI.archives[platformId]) {
    throw new Error(`CLI ${CLI.version} has no official archive for this platform.`)
  }
  const identity = assertOfficialArchiveIdentity({
    platformId,
    checksumsText,
    checksumsBytes,
    apiDigest: CLI.archives[platformId].apiDigest,
  })
  const actual = createHash('sha256').update(archiveBytes).digest('hex')
  if (actual !== identity.sha256) {
    throw new Error(`Downloaded ${identity.name} sha256 ${actual} != ${identity.sha256}`)
  }
  mkdirSync(toolingDir, { recursive: true, mode: 0o700 })
  const archivePath = join(toolingDir, identity.name)
  writeFileSync(archivePath, archiveBytes, { mode: 0o600 })
  return { ...identity, archivePath, platformId }
}

export function markExtractedBinary(binPath) {
  if (!existsSync(binPath)) throw new Error(`Extracted CLI binary missing: ${binPath}`)
  chmodSync(binPath, 0o700)
  return binPath
}

export function resolveCliCandidate({ env, toolingBin, resolve = findeAusfuehrbare } = {}) {
  if (toolingBin && existsSync(toolingBin)) return toolingBin
  return resolve('supabase', env)
}

export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}
