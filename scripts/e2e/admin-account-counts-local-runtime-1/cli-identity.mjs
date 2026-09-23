#!/usr/bin/env node
// Official Supabase CLI v2.117.0 identity. PATH presence is not a pin.
// The only verified path is: official archive bytes → extract → hash the
// exact selected file → then version/help. Version/help never precedes
// provenance. Default no-start does not download.

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { arch, platform } from 'node:os'
import { join, resolve } from 'node:path'
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

export function officialArchiveDigest(platformId) {
  const expected = CLI.archives[platformId]
  return expected ? digestHex(expected.apiDigest) : null
}

export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

export function assertRegularOwnedFile(path) {
  if (!path || !existsSync(path)) throw new Error(`CLI executable missing: ${path || '(empty)'}`)
  const stat = lstatSync(path)
  if (stat.isSymbolicLink()) throw new Error(`CLI executable is a symlink and is refused: ${path}`)
  if (!stat.isFile()) throw new Error(`CLI executable is not a regular file: ${path}`)
  return true
}

export function bindCliExecutableIdentity({
  resolved,
  provenance,
  platformId = platformKey(),
} = {}) {
  const official = officialArchiveDigest(platformId)
  if (!resolved) {
    return { archiveBound: false, pinned: false, reason: 'No executable selected.', binarySha256: null }
  }
  let binarySha256 = null
  try {
    assertRegularOwnedFile(resolved)
    binarySha256 = sha256File(resolved)
  } catch (error) {
    return {
      archiveBound: false,
      pinned: false,
      binarySha256: null,
      reason: error instanceof Error ? error.message : String(error),
    }
  }
  if (!provenance?.archiveVerified || !provenance.archiveSha256 || !provenance.extractedBinPath) {
    return {
      archiveBound: false,
      pinned: false,
      binarySha256,
      reason: 'PATH version/help is not official archive/checksum provenance.',
    }
  }
  if (!official || digestHex(provenance.archiveSha256) !== official) {
    return {
      archiveBound: false,
      pinned: false,
      binarySha256,
      reason: `archive sha256 ${provenance.archiveSha256 || 'missing'} != official ${official}`,
    }
  }
  if (resolve(resolved) !== resolve(provenance.extractedBinPath)) {
    return {
      archiveBound: false,
      pinned: false,
      binarySha256,
      reason: 'selected executable is not the owned extracted official binary',
    }
  }
  if (!provenance.binarySha256) {
    return {
      archiveBound: false,
      pinned: false,
      binarySha256,
      reason: 'provenance is missing the extracted binary digest; refuse optional digest absence',
    }
  }
  if (binarySha256 !== provenance.binarySha256) {
    return {
      archiveBound: false,
      pinned: false,
      binarySha256,
      reason: 'selected file digest does not match recorded official extract; file mutated or substituted',
    }
  }
  return {
    archiveBound: true,
    pinned: true,
    reason: null,
    archiveSha256: digestHex(provenance.archiveSha256),
    binarySha256,
  }
}

export function verifyResolvedCli({
  resolved,
  env,
  execFile = execFileSync,
  provenance,
  platformId = platformKey(),
} = {}) {
  if (!resolved) {
    return {
      available: false,
      identityVerified: false,
      pinned: false,
      archiveBound: false,
      version: null,
      helpVerified: false,
      startHelpVerified: false,
      note: 'No supabase executable on the isolated PATH or in run-owned tooling.',
    }
  }
  const bound = bindCliExecutableIdentity({ resolved, provenance, platformId })
  if (!bound.archiveBound) {
    return {
      available: false,
      identityVerified: false,
      pinned: false,
      archiveBound: false,
      resolved,
      version: null,
      helpVerified: false,
      startHelpVerified: false,
      binarySha256: bound.binarySha256,
      note: `${bound.reason} Version/help was not consulted before official-byte binding.`,
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
  const identityVerified = versionOk && helpOk && startHelpOk && bound.archiveBound === true
  return {
    available: identityVerified,
    identityVerified,
    pinned: identityVerified,
    archiveBound: bound.archiveBound,
    resolved,
    version: version.ok ? version.text : null,
    helpVerified: helpOk,
    startHelpVerified: startHelpOk,
    startHelpTextPresent: Boolean(startHelp.full),
    excludeNames: listExcludeNames(startHelp.full || ''),
    provenance: identityVerified
      ? { archiveSha256: bound.archiveSha256, extractedBinPath: provenance.extractedBinPath, binarySha256: bound.binarySha256 }
      : null,
    binarySha256: bound.binarySha256,
    note: identityVerified
      ? `Selected executable ${bound.binarySha256} is the owned extract of official ${CLI.version} archive ${bound.archiveSha256} and matched version/help.`
      : `Official archive is bound but observed ${version.ok ? version.text : 'no version'}; help=${helpOk}; startHelp=${startHelpOk}.`,
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

export function provenancePath(toolingDir) {
  return join(toolingDir, 'provenance.json')
}

export function writeCliProvenance(toolingDir, provenance) {
  mkdirSync(toolingDir, { recursive: true, mode: 0o700 })
  writeFileSync(provenancePath(toolingDir), `${JSON.stringify(provenance, null, 2)}\n`, { mode: 0o600 })
  return provenancePath(toolingDir)
}

export function loadCliProvenance(toolingDir) {
  const path = provenancePath(toolingDir)
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

export async function acquireOfficialCli({
  toolingDir,
  checksumsText,
  checksumsBytes,
  archiveBytes,
  platformId = platformKey(),
  extract = true,
  execFile = execFileSync,
} = {}) {
  if (!platformId || !CLI.archives[platformId]) {
    throw new Error(`CLI ${CLI.version} has no official archive for this platform.`)
  }
  if (!archiveBytes) throw new Error('Official archive bytes are required; PATH text is not provenance.')
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
  let extractedBinPath = null
  let binarySha256 = null
  if (extract) {
    const binDir = join(toolingDir, 'bin')
    mkdirSync(binDir, { recursive: true, mode: 0o700 })
    execFile('tar', ['-xzf', archivePath, '-C', binDir], { encoding: 'utf8' })
    extractedBinPath = markExtractedBinary(join(binDir, 'supabase'))
    assertRegularOwnedFile(extractedBinPath)
    binarySha256 = sha256File(extractedBinPath)
  }
  const provenance = {
    ...identity,
    archivePath,
    platformId,
    extractedBinPath,
    binarySha256,
    archiveVerified: true,
    archiveSha256: actual,
  }
  writeCliProvenance(toolingDir, {
    archiveSha256: actual,
    extractedBinPath,
    binarySha256,
    archiveVerified: true,
    version: CLI.version,
    platformId,
  })
  return provenance
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

export function defaultReadOfficialArtifacts() {
  return null
}

export function prepareOfficialCliIdentity({
  toolingDir,
  env,
  execFile = execFileSync,
  platformId = platformKey(),
  readOfficialArtifacts = defaultReadOfficialArtifacts,
} = {}) {
  if (!toolingDir) {
    return {
      available: false,
      identityVerified: false,
      pinned: false,
      archiveBound: false,
      note: 'Run-owned tooling directory is required for official CLI provenance.',
    }
  }
  const existing = loadCliProvenance(toolingDir)
  if (existing?.extractedBinPath) {
    return verifyResolvedCli({
      resolved: existing.extractedBinPath,
      provenance: existing,
      env,
      execFile,
      platformId,
    })
  }
  const artifacts = typeof readOfficialArtifacts === 'function' ? readOfficialArtifacts({ toolingDir, platformId }) : null
  if (!artifacts?.archiveBytes) {
    return {
      available: false,
      identityVerified: false,
      pinned: false,
      archiveBound: false,
      note: `Official ${CLI.version} archive bytes are not present in run-owned tooling. Default no-start does not download or execute an official binary.`,
    }
  }
  throw new Error('Official archive acquisition is implemented but not executed in this correction. Supply already-prepared provenance or authorize a later bounded download.')
}
