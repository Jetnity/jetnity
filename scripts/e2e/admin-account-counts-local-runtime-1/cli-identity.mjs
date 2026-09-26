#!/usr/bin/env node
// Official Supabase CLI v2.117.0 identity. PATH presence is not a pin.
// The only verified path is: official archive bytes → extract → hash the
// exact selected file → then version/help. Version/help never precedes
// provenance. Default no-start does not download.

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { chmodSync, closeSync, existsSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { arch, platform, tmpdir } from 'node:os'
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

export function resolveCliPins(pins = CLI) {
  return {
    version: pins.version || CLI.version,
    checksumsApiDigest: pins.checksumsApiDigest || CLI.checksumsApiDigest,
    archives: pins.archives || CLI.archives,
  }
}

export function assertOfficialArchiveIdentity({
  platformId,
  checksumsText,
  checksumsBytes,
  apiDigest,
  pins = CLI,
} = {}) {
  const resolvedPins = resolveCliPins(pins)
  const expected = resolvedPins.archives[platformId]
  if (!expected) throw new Error(`Unsupported platform for CLI ${resolvedPins.version}: ${platformId}`)
  if (checksumsBytes) {
    const actual = createHash('sha256').update(checksumsBytes).digest('hex')
    if (actual !== digestHex(resolvedPins.checksumsApiDigest)) {
      throw new Error(`checksums.txt digest ${actual} != ${digestHex(resolvedPins.checksumsApiDigest)}`)
    }
  }
  const parsed = parseChecksums(checksumsText)
  const fileDigest = parsed[expected.name]
  if (!fileDigest) throw new Error(`checksums.txt missing ${expected.name}`)
  const api = digestHex(apiDigest || expected.apiDigest)
  if (fileDigest !== api) {
    throw new Error(`CLI checksum mismatch for ${expected.name}: checksums.txt ${fileDigest} != API ${api}`)
  }
  return { name: expected.name, sha256: fileDigest, version: resolvedPins.version }
}

export function assertCliVersionText(text) {
  if (!CLI.versionPattern.test(String(text || '').trim())) {
    throw new Error(`CLI --version is not the selected ${CLI.version}: ${String(text || '').trim() || 'empty'}`)
  }
  return true
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function whitespaceFlexible(text) {
  return String(text).trim().split(/\s+/).map(escapeRegExp).join('\\s+')
}

export function hasOfficialCliRootUsageIdentity(text) {
  return /(?:^|\n)\s*Usage:\s*(?:\r?\n[ \t]*)?supabase[ \t]+\[command\]/i.test(String(text || ''))
}

export function isOfficialCliSubcommandHelp(text) {
  return /(?:^|\n)\s*Usage:\s*(?:\r?\n[ \t]*)?supabase[ \t]+(?:start|status|stop)\b/i.test(String(text || ''))
}

export function hasOfficialCliRootCommandEntry(text, command, description) {
  const source = String(text || '')
  const name = escapeRegExp(command)
  const desc = whitespaceFlexible(description)
  const cobraEntry = new RegExp(`(?:^|\\n)[ \\t]*${name}[ \\t]+${desc}`, 'i')
  const historicalLine = new RegExp(
    `(?:^|\\n)[ \\t]*supabase[ \\t]+${name}(?:[ \\t]+${desc})?[ \\t]*$`,
    'im',
  )
  return cobraEntry.test(source) || historicalLine.test(source)
}

export function isOfficialCliRootHelp(text) {
  const source = String(text || '')
  if (!source.trim()) return false
  if (isOfficialCliSubcommandHelp(source)) return false
  if (!hasOfficialCliRootUsageIdentity(source)) return false
  const commands = CLI.rootHelpCommands
  return (
    hasOfficialCliRootCommandEntry(source, 'start', commands.start)
    && hasOfficialCliRootCommandEntry(source, 'status', commands.status)
    && hasOfficialCliRootCommandEntry(source, 'stop', commands.stop)
  )
}

export function assertCliHelpText(text, { kind = 'help' } = {}) {
  const source = String(text || '')
  if (kind === 'start') {
    if (!CLI.startHelpPattern.test(source)) {
      throw new Error('CLI start --help did not match the official local-development start help.')
    }
    return true
  }
  if (!isOfficialCliRootHelp(source)) {
    throw new Error('CLI --help did not match the official v2.117 Cobra root-help structure.')
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

export function officialArchiveDigest(platformId, pins = CLI) {
  const expected = resolveCliPins(pins).archives[platformId]
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

export function isolatedTarEnv() {
  return {
    PATH: '/usr/bin:/bin',
    LANG: 'C',
    LC_ALL: 'C',
    TZ: 'UTC',
    HOME: '/nonexistent-aaclr1-tar',
  }
}

export function hashTarMember(archivePath, member, options = {}) {
  const opts = typeof options === 'function' ? { execFile: options } : (options || {})
  const execFile = opts.execFile || execFileSync
  const maxBytes = opts.maxBytes ?? TIMEOUTS.tarMemberMaxBytes
  const timeoutMs = opts.timeoutMs ?? TIMEOUTS.tarMemberMs
  const env = opts.env || isolatedTarEnv()
  const workDir = opts.workDir || mkdtempSync(join(tmpdir(), 'aaclr1-tar-'))
  mkdirSync(workDir, { recursive: true, mode: 0o700 })
  const destPath = opts.destPath || join(workDir, 'member.bin')
  const fd = openSync(destPath, 'w', 0o600)
  try {
    execFile('tar', ['-xOf', archivePath, member], {
      stdio: ['ignore', fd, 'pipe'],
      timeout: timeoutMs,
      env,
      maxBuffer: 1024 * 1024,
    })
  } catch (error) {
    try { closeSync(fd) } catch { /* already closed */ }
    try { unlinkSync(destPath) } catch { /* best-effort */ }
    const code = error?.code
    const signal = error?.signal
    const msg = error instanceof Error ? error.message : String(error)
    if (code === 'ETIMEDOUT' || signal === 'SIGTERM' || /ETIMEDOUT|timeout|TIMEDOUT/i.test(msg)) {
      throw new Error(`tar member extract timed out after ${timeoutMs}ms`)
    }
    if (code === 'ENOBUFS') {
      throw new Error(`tar member extract exceeded the isolated file budget; refuse default stdout buffering: ${msg}`)
    }
    throw error instanceof Error ? error : new Error(msg)
  }
  try { closeSync(fd) } catch { /* already closed */ }
  const size = existsSync(destPath) ? statSync(destPath).size : 0
  if (size > maxBytes) {
    try { unlinkSync(destPath) } catch { /* best-effort */ }
    throw new Error(`tar member ${member} size ${size} exceeds maxBytes ${maxBytes}`)
  }
  if (size === 0) {
    try { unlinkSync(destPath) } catch { /* best-effort */ }
    throw new Error(`tar member ${member} extracted empty or missing bytes`)
  }
  const digest = sha256File(destPath)
  if (opts.keepDest !== true) {
    try { unlinkSync(destPath) } catch { /* best-effort */ }
  }
  return digest
}

export function bindCliExecutableIdentity({
  resolved,
  provenance,
  platformId = platformKey(),
  archiveBytes,
  archivePath,
  execFile = execFileSync,
  pins = CLI,
} = {}) {
  const official = officialArchiveDigest(platformId, pins)
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
  const bytes = archiveBytes
    ?? (archivePath && existsSync(archivePath) ? readFileSync(archivePath) : null)
  if (!bytes) {
    return {
      archiveBound: false,
      pinned: false,
      binarySha256,
      reason: 'Sidecar or archiveVerified is not a trust root. Official archive bytes must be hashed in this process.',
    }
  }
  const archiveBytesSha256 = createHash('sha256').update(bytes).digest('hex')
  if (!official || archiveBytesSha256 !== official) {
    return {
      archiveBound: false,
      pinned: false,
      binarySha256,
      reason: `archive bytes sha256 ${archiveBytesSha256} != official ${official}`,
    }
  }
  let ownedArchive = null
  if (archivePath && existsSync(archivePath) && sha256File(archivePath) === archiveBytesSha256) {
    ownedArchive = archivePath
  } else if (provenance?.archivePath && existsSync(provenance.archivePath) && sha256File(provenance.archivePath) === archiveBytesSha256) {
    ownedArchive = provenance.archivePath
  }
  if (!ownedArchive) {
    return {
      archiveBound: false,
      pinned: false,
      binarySha256,
      reason: 'Verified archive path is missing after hashing official bytes; sidecar cannot substitute the archive.',
    }
  }
  let memberSha
  try {
    const members = listTarMembers(ownedArchive, execFile)
    const member = members.find((name) => name === 'supabase' || name.endsWith('/supabase'))
    if (!member) {
      return {
        archiveBound: false,
        pinned: false,
        binarySha256,
        reason: `Verified archive is missing the supabase member; found: ${members.join(',') || 'none'}`,
      }
    }
    memberSha = hashTarMember(ownedArchive, member, {
      execFile,
      workDir: resolve(ownedArchive, '..'),
    })
  } catch (error) {
    return {
      archiveBound: false,
      pinned: false,
      binarySha256,
      reason: error instanceof Error ? error.message : String(error),
    }
  }
  if (memberSha !== binarySha256) {
    return {
      archiveBound: false,
      pinned: false,
      binarySha256,
      reason: 'selected executable is not the supabase member of the verified archive',
    }
  }
  if (provenance?.extractedBinPath && resolve(resolved) !== resolve(provenance.extractedBinPath)) {
    return {
      archiveBound: false,
      pinned: false,
      binarySha256,
      reason: 'selected executable is not the owned extracted official binary',
    }
  }
  return {
    archiveBound: true,
    pinned: true,
    reason: null,
    archiveSha256: archiveBytesSha256,
    binarySha256,
  }
}

export function verifyResolvedCli({
  resolved,
  env,
  execFile = execFileSync,
  provenance,
  platformId = platformKey(),
  archiveBytes,
  archivePath,
  pins = CLI,
} = {}) {
  if (!resolved) {
    return {
      available: false,
      identityVerified: false,
      pinned: false,
      archiveBound: false,
      version: null,
      versionVerified: false,
      helpVerified: false,
      startHelpVerified: false,
      failedIdentityChecks: [],
      note: 'No supabase executable on the isolated PATH or in run-owned tooling.',
    }
  }
  const bound = bindCliExecutableIdentity({
    resolved,
    provenance,
    platformId,
    archiveBytes,
    archivePath: archivePath || provenance?.archivePath,
    execFile,
    pins,
  })
  if (!bound.archiveBound) {
    return {
      available: false,
      identityVerified: false,
      pinned: false,
      archiveBound: false,
      resolved,
      version: null,
      versionVerified: false,
      helpVerified: false,
      startHelpVerified: false,
      failedIdentityChecks: [],
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
  const failedIdentityChecks = [
    ...(!versionOk ? ['version'] : []),
    ...(versionOk && !helpOk ? ['help'] : []),
    ...(versionOk && !startHelpOk ? ['start-help'] : []),
  ]
  return {
    available: identityVerified,
    identityVerified,
    pinned: identityVerified,
    archiveBound: bound.archiveBound,
    resolved,
    version: version.ok ? version.text : null,
    versionVerified: versionOk,
    helpVerified: helpOk,
    startHelpVerified: startHelpOk,
    failedIdentityChecks,
    startHelpTextPresent: Boolean(startHelp.full),
    excludeNames: listExcludeNames(startHelp.full || ''),
    provenance: identityVerified
      ? {
        archiveBytesSha256: bound.archiveSha256,
        extractedBinPath: provenance.extractedBinPath,
        binarySha256: bound.binarySha256,
        boundFromArchiveBytes: true,
      }
      : null,
    binarySha256: bound.binarySha256,
    note: identityVerified
      ? `Selected executable ${bound.binarySha256} is the owned extract of official ${CLI.version} archive ${bound.archiveSha256} and matched version/help.`
      : `Official archive is bound but version=${versionOk}; help=${helpOk}; startHelp=${startHelpOk}. Failed checks: ${failedIdentityChecks.join(',') || 'none'}.`,
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

export function acquireOfficialCli({
  toolingDir,
  checksumsText,
  checksumsBytes,
  archiveBytes,
  platformId = platformKey(),
  extract = true,
  execFile = execFileSync,
  pins = CLI,
} = {}) {
  const resolvedPins = resolveCliPins(pins)
  if (!platformId || !resolvedPins.archives[platformId]) {
    throw new Error(`CLI ${resolvedPins.version} has no official archive for this platform.`)
  }
  if (!archiveBytes) throw new Error('Official archive bytes are required; PATH text is not provenance.')
  const identity = assertOfficialArchiveIdentity({
    platformId,
    checksumsText,
    checksumsBytes,
    apiDigest: resolvedPins.archives[platformId].apiDigest,
    pins: resolvedPins,
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
    return materializeVerifiedArchive({
      toolingDir,
      archiveBytes,
      identity: { ...identity, sha256: actual, name: identity.name },
      execFile,
    })
  }
  const provenance = {
    ...identity,
    archivePath,
    platformId,
    extractedBinPath,
    binarySha256,
    archiveBytesSha256: actual,
    boundFromArchiveBytes: true,
    archiveVerified: true,
    archiveSha256: actual,
  }
  writeCliProvenance(toolingDir, {
    archiveSha256: actual,
    archiveBytesSha256: actual,
    extractedBinPath,
    binarySha256,
    boundFromArchiveBytes: true,
    archiveVerified: true,
    version: CLI.version,
    platformId,
  })
  return provenance
}

export function parseCliArtifactArgs(argv = []) {
  let archivePath = null
  let checksumsPath = null
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--cli-archive') {
      archivePath = argv[i + 1] || null
      i += 1
    } else if (argv[i] === '--cli-checksums') {
      checksumsPath = argv[i + 1] || null
      i += 1
    }
  }
  if ((archivePath && !checksumsPath) || (!archivePath && checksumsPath)) {
    throw new Error('Both --cli-archive and --cli-checksums are required together.')
  }
  return { archivePath, checksumsPath }
}

export function readOfflineOfficialArtifacts({ archivePath, checksumsPath } = {}) {
  if (!archivePath || !checksumsPath) return null
  if (!existsSync(archivePath) || !existsSync(checksumsPath)) {
    throw new Error('Official CLI archive or checksums input is missing.')
  }
  assertRegularOwnedFile(archivePath)
  assertRegularOwnedFile(checksumsPath)
  const archiveBytes = readFileSync(archivePath)
  const checksumsBytes = readFileSync(checksumsPath)
  return {
    archiveBytes,
    checksumsBytes,
    checksumsText: checksumsBytes.toString('utf8'),
    sourceArchivePath: archivePath,
    sourceChecksumsPath: checksumsPath,
  }
}

export function listTarMembers(archivePath, execFile = execFileSync) {
  const out = execFile('tar', ['-tzf', archivePath], { encoding: 'utf8' })
  return String(out).split(/\r?\n/).map((line) => line.replace(/^\.\//, '').replace(/\/$/, '')).filter(Boolean)
}

export function materializeVerifiedArchive({
  toolingDir,
  archiveBytes,
  identity,
  execFile = execFileSync,
} = {}) {
  if (!identity?.sha256) throw new Error('Verified archive identity is required before extract.')
  if (!archiveBytes) throw new Error('Archive bytes are required before extract.')
  const actual = createHash('sha256').update(archiveBytes).digest('hex')
  if (actual !== digestHex(identity.sha256)) {
    throw new Error(`Archive bytes sha256 ${actual} != verified identity ${identity.sha256}`)
  }
  mkdirSync(toolingDir, { recursive: true, mode: 0o700 })
  const archivePath = join(toolingDir, identity.name || 'supabase.tar.gz')
  writeFileSync(archivePath, archiveBytes, { mode: 0o600 })
  const members = listTarMembers(archivePath, execFile)
  const member = members.find((name) => name === 'supabase' || name.endsWith('/supabase'))
  if (!member) {
    throw new Error(`Verified archive is missing the supabase member; found: ${members.join(',') || 'none'}`)
  }
  const binDir = join(toolingDir, 'bin')
  mkdirSync(binDir, { recursive: true, mode: 0o700 })
  execFile('tar', ['-xzf', archivePath, '-C', binDir, '--strip-components', member.includes('/') ? String(member.split('/').length - 1) : '0'], {
    encoding: 'utf8',
  })
  const extractedBinPath = markExtractedBinary(join(binDir, 'supabase'))
  assertRegularOwnedFile(extractedBinPath)
  const binarySha256 = sha256File(extractedBinPath)
  const provenance = {
    ...identity,
    archivePath,
    extractedBinPath,
    binarySha256,
    archiveBytesSha256: actual,
    boundFromArchiveBytes: true,
    archiveVerified: true,
    archiveSha256: actual,
  }
  writeCliProvenance(toolingDir, provenance)
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

export function shouldInvokeOfficialCli(mode) {
  return mode === 'runtime-only' || mode === 'full'
}

export function prepareOfficialCliIdentity({
  toolingDir,
  env,
  execFile = execFileSync,
  platformId = platformKey(),
  archivePath,
  checksumsPath,
  invokeBinary = false,
  readOfficialArtifacts = defaultReadOfficialArtifacts,
  pins = CLI,
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
  let artifacts = null
  try {
    artifacts = archivePath && checksumsPath
      ? readOfflineOfficialArtifacts({ archivePath, checksumsPath })
      : (typeof readOfficialArtifacts === 'function' ? readOfficialArtifacts({ toolingDir, platformId }) : null)
  } catch (error) {
    return {
      available: false,
      identityVerified: false,
      pinned: false,
      archiveBound: false,
      note: error instanceof Error ? error.message : String(error),
    }
  }
  if (!artifacts?.archiveBytes || !artifacts?.checksumsBytes) {
    return {
      available: false,
      identityVerified: false,
      pinned: false,
      archiveBound: false,
      note: `Official ${CLI.version} archive bytes are not present in run-owned tooling. Default no-start does not download or execute an official binary.`,
    }
  }
  try {
    const provenance = acquireOfficialCli({
      toolingDir,
      checksumsText: artifacts.checksumsText,
      checksumsBytes: artifacts.checksumsBytes,
      archiveBytes: artifacts.archiveBytes,
      platformId,
      extract: true,
      execFile,
      pins,
    })
    if (invokeBinary === true) {
      return verifyResolvedCli({
        resolved: provenance.extractedBinPath,
        provenance,
        env,
        execFile,
        platformId,
        archiveBytes: artifacts.archiveBytes,
        archivePath: provenance.archivePath,
        pins,
      })
    }
    return {
      available: false,
      identityVerified: false,
      pinned: true,
      archiveBound: true,
      resolved: provenance.extractedBinPath,
      binarySha256: provenance.binarySha256,
      provenance,
      note: `Official ${CLI.version} archive bytes were hashed and extracted into run-owned tooling. Version/help/start were not invoked in this correction.`,
    }
  } catch (error) {
    return {
      available: false,
      identityVerified: false,
      pinned: false,
      archiveBound: false,
      note: error instanceof Error ? error.message : String(error),
    }
  }
}
