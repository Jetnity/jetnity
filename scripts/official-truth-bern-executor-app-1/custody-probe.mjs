// macOS only, explicit manual offline proof. Never part of npm test/build/CI.
// All key material is newly generated synthetic data, never a real App key.
import { execFileSync } from 'node:child_process'
import { generateKeyPairSync } from 'node:crypto'
import { chmodSync, copyFileSync, lstatSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = mkdtempSync('/private/tmp/jetnity-app-synthetic-custody-')
chmodSync(dir, 0o700)
const vault = join(dir, 'synthetic.keychain-db')
const pem = join(dir, 'synthetic.pem')
const signer = join(dir, 'authorized-synthetic-probe')
const source = fileURLToPath(new URL('./custody-probe.swift', import.meta.url))
const other = join(dir, 'untrusted-synthetic-probe')
const run = (path, args) => execFileSync(path, args, { encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'pipe'] })
let created = false
const report = { syntheticOnly: true, realCredentialAccess: false }
try {
  const before = run('/usr/bin/security', ['list-keychains', '-d', 'user'])
  report.stage = 'compile_synthetic_signer'
  run('/usr/bin/swiftc', ['-module-cache-path', join(dir, 'module-cache'), source, '-o', signer])
  run('/usr/bin/codesign', ['--force', '--sign', '-', '--identifier', 'jetnity.synthetic.custody.authorized', signer])
  report.directoryMode = (lstatSync(dir).mode & 0o777).toString(8)
  report.realPathMatches = realpathSync(dir) === dir
  report.directorySymlink = lstatSync(dir).isSymbolicLink()
  const pair = generateKeyPairSync('rsa', { modulusLength: 2048 })
  writeFileSync(pem, pair.privateKey.export({ format: 'pem', type: 'pkcs1' }), { mode: 0o600, flag: 'wx' })
  report.fileMode = (lstatSync(pem).mode & 0o777).toString(8)
  report.fileSymlink = lstatSync(pem).isSymbolicLink()
  report.fileLinks = lstatSync(pem).nlink
  report.stage = 'create_synthetic_keychain'
  run('/usr/bin/security', ['create-keychain', '-p', 'SYNTHETIC-DISPOSABLE-NOT-A-REAL-PASSWORD', vault]); created = true
  report.stage = 'import_synthetic_nonextractable_key'
  run('/usr/bin/security', ['import', pem, '-k', vault, '-t', 'priv', '-f', 'openssl', '-x', '-T', signer])
  rmSync(pem)
  report.stage = 'authorized_synthetic_signer'
  report.authorizedSigner = run(signer, [vault]).trim().split('\n')
  copyFileSync(signer, other)
  run('/usr/bin/codesign', ['--force', '--sign', '-', '--identifier', 'jetnity.synthetic.custody.unauthorized', other])
  try { report.untrustedSigner = run(other, [vault]).trim().split('\n') }
  catch (e) { report.untrustedSigner = String(e.stdout ?? '').trim().split('\n'); report.untrustedSignerExit = e.status }
  report.searchListUnchangedDuring = before === run('/usr/bin/security', ['list-keychains', '-d', 'user'])
  report.probeStatus = report.authorizedSigner.includes('signature_available=true')
    && report.authorizedSigner.includes('private_export_available=false')
    && report.untrustedSigner.includes('signature_available=false') ? 'SYNTHETIC_PRIMITIVE_PASS' : 'BLOCKED'
} catch (e) {
  // No raw Security stderr, key bytes or local paths enter the report.
  report.probeStatus = 'BLOCKED'; report.exitStatus = e.status ?? null
  report.errorClass = e.code ?? e.name
} finally {
  if (created) {
    try { run('/usr/bin/security', ['delete-keychain', vault]); report.keychainDeleted = true }
    catch { report.keychainDeleted = false }
  }
  rmSync(dir, { recursive: true, force: true }); report.syntheticFilesRemoved = true
}
report.operationalCustodyReady = false
console.log(JSON.stringify(report, null, 2))
if (report.probeStatus !== 'SYNTHETIC_PRIMITIVE_PASS' || report.keychainDeleted !== true) process.exitCode = 2
