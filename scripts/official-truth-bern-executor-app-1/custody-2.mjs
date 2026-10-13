// Explicit, offline macOS rehearsal. Importing this module never touches the OS
// keychain, generates a key, creates a persistent directory or spawns a process.
import { spawnSync } from 'node:child_process'
import { createHash, generateKeyPairSync, verify } from 'node:crypto'
import { constants as F, chmodSync, closeSync, copyFileSync, existsSync, fstatSync, linkSync,
  lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readSync, readdirSync, realpathSync,
  renameSync, rmSync, rmdirSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { userInfo, tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const identity = 'org.jetnity.bern-executor-app-1.signer.synthetic.v1'
const sourceDir = dirname(fileURLToPath(import.meta.url))
const digest = value => createHash('sha256').update(value).digest('hex')
const demand = (value, code) => { if (!value) throw new Error(code) }
const cleanEnv = Object.freeze({ LANG: 'C', LC_ALL: 'C' })

function run(executable, args, input, env = cleanEnv) {
  const r = spawnSync(executable, args, { input, env, encoding: 'utf8', timeout: 60_000,
    maxBuffer: 64 * 1024, stdio: ['pipe', 'pipe', 'pipe'] })
  // Never propagate child stderr, path, command arguments or credentials.
  if (r.error || r.signal || r.status !== 0) throw new Error('local_tool_failed')
  return r.stdout
}
function inspect(path, directory, mode) {
  const s = lstatSync(path)
  demand(!s.isSymbolicLink() && (directory ? s.isDirectory() : s.isFile())
    && s.uid === process.getuid() && (s.mode & 0o777) === mode
    && (directory || s.nlink === 1) && realpathSync(path) === path, 'path_rejected')
  return s
}
function privateDirectory(path) {
  inspect(path, true, 0o700)
  const acl = run('/bin/ls', ['-lde', path])
  demand(!/\bgrant\b|\ballow\b/.test(acl), 'acl_rejected')
}
function candidatePath() {
  const ownerHome = userInfo().homedir // OS account metadata, never a caller env override.
  const base = join(ownerHome, 'Library', 'Application Support')
  for (let p = base; ; p = dirname(p)) {
    const s = lstatSync(p)
    demand(s.isDirectory() && !s.isSymbolicLink() && realpathSync(p) === p
      && (s.uid === process.getuid() || s.uid === 0) && (s.mode & 0o022) === 0, 'parent_rejected')
    demand(!/\ballow\b/.test(run('/bin/ls', ['-lde', p])), 'parent_acl_rejected')
    if (p === '/') break
  }
  return join(base, 'Jetnity', 'bern-executor-app-1-custody-2')
}
function backupStatus(path) {
  const result = run('/usr/bin/tmutil', ['isexcluded', path])
  return result.startsWith('[Excluded]') ? 'excluded' : result.startsWith('[Included]') ? 'included' : 'unknown'
}
function prepareEmpty() {
  const candidate = candidatePath(), parent = dirname(candidate)
  demand(!existsSync(candidate), 'candidate_already_exists')
  let madeParent = false, madeCandidate = false
  try {
    if (!existsSync(parent)) { mkdirSync(parent, { mode: 0o700 }); madeParent = true }
    privateDirectory(parent)
    // Do not adopt a pre-existing/shared Jetnity directory with other data.
    demand(readdirSync(parent).length === 0, 'parent_not_empty')
    mkdirSync(candidate, { mode: 0o700 }); madeCandidate = true
    privateDirectory(candidate)
    return { status: 'EMPTY_CANDIDATE_PREPARED', mode: '0700', ownerMatches: true,
      canonicalParents: true, parentAclAllowsAbsent: true, empty: readdirSync(candidate).length === 0,
      timeMachine: backupStatus(candidate), knownCloudRoot: false,
      thirdPartySyncExclusionProved: false, browserDestinationProved: false,
      backupPolicyChanged: false, realCredentialAccess: false }
  } catch {
    // rmdir only: never recursively remove pre-existing/shared content.
    if (madeCandidate) { try { rmdirSync(candidate) } catch { /* retained empty candidate or interference */ } }
    if (madeParent) { try { rmdirSync(parent) } catch { /* never remove unrelated content */ } }
    throw new Error('candidate_preparation_failed')
  }
}

// Open once, reject links/permissions before reading, then recheck inode/size.
// Import uses this bounded in-memory snapshot via stdin, never a reopened PEM path.
function readStage(path, expectedDigest) {
  const before = inspect(path, false, 0o600)
  demand(before.size > 0 && before.size <= 8192, 'stage_size_rejected')
  const fd = openSync(path, F.O_RDONLY | F.O_NOFOLLOW | F.O_NONBLOCK)
  try {
    const s = fstatSync(fd)
    demand(s.dev === before.dev && s.ino === before.ino && s.nlink === 1
      && s.isFile() && (s.mode & 0o777) === 0o600 && s.uid === process.getuid(), 'stage_changed')
    const bounded = Buffer.alloc(8193)
    let length = 0, count
    do { count = readSync(fd, bounded, length, bounded.length - length); length += count }
    while (count !== 0 && length < bounded.length)
    const bytes = bounded.subarray(0, length)
    const after = fstatSync(fd), current = lstatSync(path)
    demand(bytes.length === s.size && after.size === s.size && after.mtimeMs === s.mtimeMs
      && after.ctimeMs === s.ctimeMs && current.ino === s.ino && current.dev === s.dev
      && current.nlink === 1 && digest(bytes) === expectedDigest, 'stage_changed')
    return bytes
  } finally { closeSync(fd) }
}

/** Closed, non-secret file adversaries for portable CI. No external path/key input. */
export function syntheticStagingCaseForTests(kind) {
  if (process.env.NODE_TEST_CONTEXT === undefined) return false
  const cases = ['valid', 'symlink', 'hardlink', 'mode', 'empty', 'oversize', 'wrong_content', 'directory', 'missing']
  if (!cases.includes(kind)) return false
  const directory = realpathSync(mkdtempSync(join(tmpdir(), 'bern-custody-stage-test-')))
  chmodSync(directory, 0o700)
  const path = join(directory, 'synthetic-only.pem'), bytes = Buffer.from('UNREGISTERED_SYNTHETIC_FILE_ONLY')
  try {
    writeFileSync(path, bytes, { mode: 0o600, flag: 'wx' })
    if (kind === 'symlink') { renameSync(path, path + '.target'); symlinkSync(path + '.target', path) }
    if (kind === 'hardlink') linkSync(path, path + '.link')
    if (kind === 'mode') chmodSync(path, 0o644)
    if (kind === 'empty') writeFileSync(path, '')
    if (kind === 'oversize') writeFileSync(path, Buffer.alloc(8193))
    if (kind === 'wrong_content') writeFileSync(path, 'SUBSTITUTED_SYNTHETIC_BYTES')
    if (kind === 'directory') { unlinkSync(path); mkdirSync(path, { mode: 0o700 }) }
    if (kind === 'missing') unlinkSync(path)
    try { readStage(path, digest(bytes)); return kind === 'valid' }
    catch { return kind !== 'valid' }
  } finally { rmSync(directory, { recursive: true, force: true }) }
}

/** No inherited environment, claim, identity, credential or path arguments. */
export function custodyCommand(args) {
  return args.length === 1 && ['--prepare-empty', '--synthetic-rehearsal'].includes(args[0]) ? args[0] : null
}

function parseChild(executable, args = ['--synthetic-sign'], input = '', env = cleanEnv) {
  const r = spawnSync(executable, args, { input, env, timeout: 10_000, maxBuffer: 8192, encoding: 'utf8' })
  demand(!r.error && !r.signal && r.stderr === '', 'signer_process_failed')
  let value
  try { value = JSON.parse(r.stdout) } catch { throw new Error('signer_output_rejected') }
  demand(r.status === (value.status === 'BLOCKED' ? 2 : 0), 'signer_exit_rejected')
  return value
}
function verifyAssertion(result, publicKey, earliest, latest) {
  demand(result.status === 'SYNTHETIC_SIGNED' && result.privateExportDenied === true
    && typeof result.assertion === 'string' && result.assertion.length <= 2048, 'signature_result_rejected')
  const parts = result.assertion.split('.')
  demand(parts.length === 3 && parts.every(p => /^[A-Za-z0-9_-]+$/.test(p)), 'signature_shape_rejected')
  demand(verify('RSA-SHA256', Buffer.from(parts.slice(0, 2).join('.')), publicKey,
    Buffer.from(parts[2], 'base64url')), 'signature_verification_failed')
  const h = JSON.parse(Buffer.from(parts[0], 'base64url').toString())
  const c = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
  demand(JSON.stringify(h) === '{"alg":"RS256","typ":"JWT"}' && Object.keys(c).sort().join(',') === 'exp,iat,iss'
    && c.iss === 'SYNTHETIC-UNREGISTERED-BERN-APP' && c.exp - c.iat === 360
    && c.iat + 60 >= earliest && c.exp - 300 <= latest, 'claims_rejected')
  result.assertion = '' // JS/Swift allocations do not promise secure memory erasure.
}

function rehearse() {
  const candidate = candidatePath()
  privateDirectory(dirname(candidate)); privateDirectory(candidate)
  demand(readdirSync(candidate).length === 0, 'candidate_not_empty')
  const directory = mkdtempSync(join(candidate, 'synthetic-')); chmodSync(directory, 0o700)
  const vault = join(directory, 'synthetic.keychain-db'), pem = join(directory, 'synthetic.pem')
  const signer = join(directory, 'bern-signer'), probe = join(directory, 'foreign-probe')
  const config = join(directory, 'SyntheticConfiguration.swift')
  const report = { schema: 'bern_app_custody_2_synthetic_v1', syntheticOnly: true,
    realCredentialAccess: false, productionInvocationEnabled: false, networkUsed: false,
    operationalCustodyAccepted: false, backupPolicyChanged: false, checks: {} }
  let created = false, stage = 'prepare', pair, pemBytes, searchBefore
  const createVault = () => {
    run('/usr/bin/security', ['create-keychain', '-p', 'UNREGISTERED-SYNTHETIC-DISPOSABLE', vault]); created = true
    chmodSync(vault, 0o600)
    run('/usr/bin/security', ['set-keychain-settings', '-l', '-u', '-t', '30', vault])
  }
  const importPair = material => {
    pemBytes = Buffer.from(material.privateKey.export({ format: 'pem', type: 'pkcs1' }))
    writeFileSync(pem, pemBytes, { mode: 0o600, flag: 'wx' })
    const checked = readStage(pem, digest(pemBytes))
    try {
      run('/usr/bin/security', ['import', '/dev/stdin', '-k', vault, '-t', 'priv', '-f', 'openssl', '-x', '-T', signer], checked)
    } finally { checked.fill(0); pemBytes.fill(0); unlinkSync(pem) }
    report.checks.stagedPemRemovedAfterImport = !existsSync(pem)
  }
  try {
    report.timeMachine = backupStatus(candidate)
    privateDirectory(directory)
    stage = 'compile'
    pair = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const publicPin = pair.publicKey.export({ format: 'der', type: 'pkcs1' }).toString('base64')
    writeFileSync(config, 'enum SyntheticConfiguration { static let directory = ' + JSON.stringify(directory)
      + '; static let publicKey = ' + JSON.stringify(publicPin) + ' }\n', { mode: 0o600, flag: 'wx' })
    const compile = (source, output, synthetic) => {
      run('/usr/bin/swiftc', ['-parse-as-library', '-module-cache-path', join(directory, 'module-cache'),
        ...(synthetic ? ['-D', 'CUSTODY_SYNTHETIC_REHEARSAL', config] : []), join(sourceDir, source), '-o', output])
      chmodSync(output, 0o700)
      run('/usr/bin/codesign', ['--force', '--sign', '-', '--options', 'runtime', '--timestamp=none',
        '--identifier', output === signer ? identity : identity + '.foreign', output])
    }
    const dormant = join(directory, 'dormant-signer')
    compile('custody-signer.swift', dormant, false)
    demand(parseChild(dormant).code === 'production_disabled', 'production_gate_failed')
    report.checks.defaultBuildCannotLookupKey = true
    compile('custody-signer.swift', signer, true)
    compile('custody-denial-probe.swift', probe, true)
    report.signerSourceSha256 = digest(readFileSync(join(sourceDir, 'custody-signer.swift')))
    report.signerBinarySha256 = digest(readFileSync(signer))
    const signatureInfo = spawnSync('/usr/bin/codesign', ['-dvvv', signer], { encoding: 'utf8', env: cleanEnv })
    const cdhash = signatureInfo.stderr.match(/^CDHash=([a-f0-9]+)$/m)?.[1]
    demand(signatureInfo.status === 0 && cdhash && signatureInfo.stderr.includes('Identifier=' + identity), 'signer_package_rejected')
    report.signerIdentifier = identity; report.signerCDHash = cdhash
    run('/usr/bin/codesign', ['--verify', '--strict', signer])
    const assertPackage = () => demand(digest(readFileSync(signer)) === report.signerBinarySha256, 'signer_package_changed')
    assertPackage()
    stage = 'import'
    // Observe only the search-list metadata in memory; no unrelated items/keys.
    searchBefore = run('/usr/bin/security', ['list-keychains', '-d', 'user'])
    createVault(); importPair(pair)
    report.checks.searchListUnchanged = searchBefore === run('/usr/bin/security', ['list-keychains', '-d', 'user'])
    demand(report.checks.searchListUnchanged, 'search_list_changed')
    stage = 'sign_and_verify'
    assertPackage()
    const earliest = Math.floor(Date.now() / 1000), result = parseChild(signer)
    const latest = Math.floor(Date.now() / 1000)
    const foreignPair = generateKeyPairSync('rsa', { modulusLength: 2048 })
    let wrongVerifierDenied = false, tamperDenied = false
    try { verifyAssertion({ ...result }, foreignPair.publicKey, earliest, latest) }
    catch { wrongVerifierDenied = true }
    const tampered = { ...result, assertion: result.assertion.replace(/\.([A-Za-z0-9_-])([^.]*)$/, (_, c, rest) => '.' + (c === 'A' ? 'B' : 'A') + rest) }
    try { verifyAssertion(tampered, pair.publicKey, earliest, latest) }
    catch { tamperDenied = true }
    demand(wrongVerifierDenied && tamperDenied, 'verification_negative_failed')
    verifyAssertion(result, pair.publicKey, earliest, latest)
    report.checks.independentSignatureAndFixedClaims = true
    report.checks.wrongPublicKeyAndTamperedSignatureRejected = true
    report.checks.authorizedPrivateExportDenied = true
    const denied = parseChild(probe, [])
    demand(denied.signDenied === true && denied.exportDenied === true && denied.signCode !== 0 && denied.exportCode !== 0,
      'foreign_access_not_denied')
    report.foreignAccess = denied
    run('/usr/bin/codesign', ['--force', '--sign', '-', '--identifier', identity, probe])
    const sameIdentifier = parseChild(probe, [])
    demand(sameIdentifier.signDenied === true && sameIdentifier.exportDenied === true, 'same_identifier_access_not_denied')
    report.checks.sameIdentifierDifferentBinaryDenied = true
    stage = 'negative_inputs'
    for (const args of [[], ['--production'], ['--synthetic-sign', '--iss', '5300986'],
      ['--synthetic-sign', '--exp', '9999999999'], ['--synthetic-sign', '--key', 'supplied'],
      ['--synthetic-sign', '--now', '0'], ['--synthetic-sign', '--claims', '{}']]) {
      demand(parseChild(signer, args).code === 'invocation_rejected', 'argument_not_denied')
    }
    for (const input of ['x', '{}', 'PRIVATE SYNTHETIC SENTINEL']) {
      demand(parseChild(signer, ['--synthetic-sign'], input).code === 'input_rejected', 'stdin_not_denied')
    }
    demand(parseChild(signer, ['--synthetic-sign'], '', { ...cleanEnv, GITHUB_TOKEN: 'SYNTHETIC_SENTINEL' }).code === 'environment_rejected', 'environment_not_denied')
    report.checks.suppliedInputsRejected = true
    const changed = join(directory, 'changed-identity'); copyFileSync(signer, changed)
    run('/usr/bin/codesign', ['--force', '--sign', '-', '--identifier', identity + '.changed', changed])
    demand(parseChild(changed).code === 'executable_identity_rejected', 'changed_identity_not_denied')
    report.checks.changedExecutableIdentityRejected = true
    stage = 'locked_vault'
    run('/usr/bin/security', ['lock-keychain', vault])
    demand(parseChild(signer).status === 'BLOCKED', 'locked_vault_not_denied')
    report.checks.lockedVaultDeniedWithoutPrompt = true
    run('/usr/bin/security', ['unlock-keychain', '-p', 'UNREGISTERED-SYNTHETIC-DISPOSABLE', vault])
    stage = 'wrong_key'
    run('/usr/bin/security', ['delete-keychain', vault]); created = false
    createVault(); importPair(foreignPair)
    demand(parseChild(signer).code === 'key_identity_rejected', 'wrong_key_not_denied')
    report.checks.wrongKeyRejected = true
    stage = 'missing_key'
    run('/usr/bin/security', ['delete-keychain', vault]); created = false
    createVault()
    demand(parseChild(signer).code === 'key_identity_rejected', 'missing_key_not_denied')
    report.checks.missingKeyRejected = true
    stage = 'failure_cleanup'
    // Real failure after a staged synthetic file exists; finally must remove it.
    const failed = join(directory, 'failed-import.pem')
    writeFileSync(failed, 'INVALID-UNREGISTERED-SYNTHETIC-PEM', { mode: 0o600, flag: 'wx' })
    try {
      run('/usr/bin/security', ['import', '/dev/stdin', '-k', vault, '-t', 'priv', '-f', 'openssl', '-x', '-T', signer],
        readStage(failed, digest(Buffer.from('INVALID-UNREGISTERED-SYNTHETIC-PEM'))))
      throw new Error('invalid_import_accepted')
    } catch (e) { demand(e.message === 'local_tool_failed', 'invalid_import_accepted') }
    finally { unlinkSync(failed) }
    report.checks.failedImportRedactedAndFileRemoved = !existsSync(failed)
    report.status = 'SYNTHETIC_REHEARSAL_PASS'
  } catch {
    report.status = 'BLOCKED'; report.failedStage = stage; report.error = 'synthetic_rehearsal_failed'
  } finally {
    pemBytes?.fill(0); pair = undefined
    if (created) {
      try { run('/usr/bin/security', ['delete-keychain', vault]); report.keychainDeleted = true }
      catch { report.keychainDeleted = false }
    }
    if (searchBefore !== undefined) {
      try {
        report.checks.searchListUnchangedAfterCleanup = searchBefore === run('/usr/bin/security', ['list-keychains', '-d', 'user'])
      } catch { report.checks.searchListUnchangedAfterCleanup = false }
      if (!report.checks.searchListUnchangedAfterCleanup) report.status = 'BLOCKED'
    }
    try {
      rmSync(directory, { recursive: true, force: true })
      report.filesRemoved = !existsSync(directory)
      report.candidateEmpty = readdirSync(candidate).length === 0
    } catch { report.filesRemoved = false; report.candidateEmpty = false }
    if (!report.filesRemoved || !report.candidateEmpty || report.keychainDeleted === false) report.status = 'BLOCKED'
  }
  return report
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let report
  try {
    demand(process.platform === 'darwin', 'macos_required')
    const command = custodyCommand(process.argv.slice(2))
    demand(command, 'invocation_rejected')
    report = command === '--prepare-empty' ? prepareEmpty() : rehearse()
  } catch { report = { status: 'BLOCKED', code: 'custody_preparation_unavailable', realCredentialAccess: false } }
  process.stdout.write(JSON.stringify(report, null, 2) + '\n')
  if (report.status === 'BLOCKED') process.exitCode = 2
}
