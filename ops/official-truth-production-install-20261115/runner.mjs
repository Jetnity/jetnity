// One explicitly selected, isolated build job. No server or deployed function.
// --prepare is the only default and never reads the password or connects to DB.
// --install sends the reviewed files unchanged through native psql on ONE
// connection. Original BEGIN/COMMIT and genuine first BG1 audit are untouched.
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = dirname(fileURLToPath(import.meta.url))
const branch = 'ops/official-truth-production-install-20261115'
const project = 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM'
const target = 'qscbgcdmivbbnzrcyegn'
const host = 'db.qscbgcdmivbbnzrcyegn.supabase.co'
const secretName = 'JETNITY_PROD_INSTALL_POSTGRES_PASSWORD'
const cleanEnvironment = Object.freeze({ PATH: '/usr/bin:/bin', LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8', TZ: 'UTC' })
const pins = Object.freeze({
  'preflight.sql': [4254, 'f65986f02a3e83a091303c087d5a5dd980db1cd933f764c4680933c1084fdd50'],
  'install-and-start-guard.sql': [2867380, 'e5a9db6404a7377cf8ec853ffe0a839474aaf7885e8f6a2195b8ce8e14462290'],
  'verify.sql': [3379, '284d9e63ee3bdde6e86f5586c9ff05afcd72b886012fecbe221d54f29f242cbd'],
  'supabase-ca.pem': [1367, '700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7'],
})
const identitySql = `BEGIN;
SET TRANSACTION READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
DO $native_identity$
BEGIN
  IF session_user <> 'postgres' OR current_user <> session_user
    OR current_database() <> 'postgres'
    OR current_setting('server_version_num')::integer / 10000 <> 17
    OR current_setting('ssl') <> 'on'
    OR NOT EXISTS (SELECT 1 FROM pg_stat_ssl WHERE pid=pg_backend_pid() AND ssl) THEN
    RAISE EXCEPTION 'native installation identity refused' USING ERRCODE='P7921';
  END IF;
END $native_identity$;
SELECT jsonb_build_object('nativeIdentity','verified','tls',true,'serverMajor',17);
ROLLBACK;
`

let phase = 'startup'
let childStarted = false
let scratch
let child
let interrupted = false
let password
const mode = process.argv.length === 3 ? process.argv[2] : null
if (mode === '--install') password = process.env[secretName]
// Never pass the parent build's secrets to package managers or subprocesses.
delete process.env[secretName]

function refuse(code) { throw new Error(code) }
function context() {
  if (process.env.VERCEL !== '1' || process.env.VERCEL_ENV !== 'preview'
    || process.env.VERCEL_PROJECT_ID !== project
    || process.env.VERCEL_GIT_REPO_OWNER !== 'Jetnity'
    || process.env.VERCEL_GIT_REPO_SLUG !== 'jetnity'
    || process.env.VERCEL_GIT_COMMIT_REF !== branch
    || !/^[a-f0-9]{40}$/.test(process.env.VERCEL_GIT_COMMIT_SHA ?? '')) refuse('BUILD_CONTEXT_REFUSED')
}
function readArtifacts() {
  return Object.fromEntries(Object.entries(pins).map(([name, [size, digest]]) => {
    const path = join(directory, name)
    if (!lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) refuse('ARTIFACT_TYPE_REFUSED')
    const bytes = readFileSync(path)
    if (bytes.length !== size || createHash('sha256').update(bytes).digest('hex') !== digest) refuse('ARTIFACT_DIGEST_REFUSED')
    return [name, bytes]
  }))
}
function command(binary, args, timeout) {
  const result = spawnSync(binary, args, { env: cleanEnvironment, encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'], timeout, maxBuffer: 2 * 1024 * 1024 })
  // Raw stdout/stderr and Error objects are never printed (including failures).
  if (result.error || result.signal || result.status !== 0) refuse('NATIVE_CLIENT_SETUP_FAILED')
  return result.stdout.trim()
}
function prepareClient() {
  phase = 'native-client-setup'
  // Official AL2023 repositories; no external RPM, package hook, shell, or npm.
  command('/usr/bin/dnf', ['install', '-y', 'postgresql17'], 240000)
  const binary = '/usr/bin/psql'
  if (!existsSync(binary) || !lstatSync(realpathSync(binary)).isFile()) refuse('NATIVE_CLIENT_PATH_REFUSED')
  for (const path of new Set([binary, realpathSync(binary)])) {
    if (command('/usr/bin/rpm', ['-qf', '--qf', '%{NAME}', path], 10000) !== 'postgresql17') refuse('NATIVE_CLIENT_PACKAGE_REFUSED')
  }
  const version = command(binary, ['--version'], 10000)
  if (!/^psql \(PostgreSQL\) 17\.\d+(?:\b|\.)/.test(version)) refuse('NATIVE_CLIENT_VERSION_REFUSED')
  return { binary, version }
}
function staticOutput(status) {
  const output = join(directory, 'public')
  if (existsSync(output) && (lstatSync(output).isSymbolicLink()
    || readdirSync(output).some(name => name !== 'index.html'))) refuse('STATIC_OUTPUT_REFUSED')
  mkdirSync(output, { recursive: true })
  writeFileSync(join(output, 'index.html'), '<!doctype html><html lang="de"><meta charset="utf-8">'
    + '<meta name="robots" content="noindex,nofollow"><title>Jetnity Installation</title>'
    + '<body><p>' + (status === 'prepared' ? 'Installationslauf vorbereitet. Keine Datenbankverbindung geöffnet.'
      : 'Datenbankinstallation abgeschlossen. Die öffentliche Freigabe wird separat geprüft.') + '</p></body></html>')
}
function current(status) { return status?.schema === 1 && status.status === 'current' }
function verifyReceipts(output) {
  const values = output.split(/\r?\n/).filter(line => line.startsWith('{')).map(line => {
    try { return JSON.parse(line) } catch { refuse('NATIVE_RECEIPT_PARSE_FAILED') }
  })
  if (values.filter(value => value.nativeIdentity === 'verified' && value.tls === true && value.serverMajor === 17).length !== 1) refuse('NATIVE_IDENTITY_RECEIPT_MISSING')
  const installed = values.filter(value => value.schema === 1 && value.target === target && value.core === 'installed')
  if (installed.length !== 1 || !current(installed[0].guardStatus)
    || installed[0].sourceImport !== 'not_started' || installed[0].ownerApproval !== 'not_created'
    || installed[0].importPlan !== 'disabled') refuse('CORE_RECEIPT_MISSING')
  const verified = values.filter(value => value.schema === 1 && value.target === target && value.catalog === 'verified').at(-1)
  if (!verified || values.at(-1) !== verified || !current(verified.guardStatus)
    || verified.methodRows !== 0 || verified.sourceJobs !== 0 || verified.publishedProjections !== 0
    || verified.quotaModel !== 'rolling_24h_v2') refuse('POSTCOMMIT_RECEIPT_MISSING')
}
async function install(binary, artifacts) {
  phase = 'native-installation'
  scratch = mkdtempSync(join(tmpdir(), 'jetnity-prod-native-'))
  chmodSync(scratch, 0o700)
  for (const [name, bytes] of Object.entries(artifacts)) writeFileSync(join(scratch, name), bytes, { mode: 0o600, flag: 'wx' })
  writeFileSync(join(scratch, 'identity.sql'), identitySql, { mode: 0o600, flag: 'wx' })
  const passfile = join(scratch, 'credential')
  const escaped = password.replaceAll('\\', '\\\\').replaceAll(':', '\\:')
  writeFileSync(passfile, `${host}:5432:postgres:postgres:${escaped}\n`, { mode: 0o600, flag: 'wx' })
  password = undefined
  const args = ['--no-psqlrc', '--no-password', '--quiet', '--no-align', '--tuples-only',
    '--set=ON_ERROR_STOP=1', '--set=VERBOSITY=sqlstate', '--set=SHOW_CONTEXT=never',
    '--host=' + host, '--port=5432', '--username=postgres', '--dbname=postgres',
    '-c', "SET jetnity.production_target='production:qscbgcdmivbbnzrcyegn:INSTALL1';",
    '-f', join(scratch, 'identity.sql'), '-f', join(scratch, 'preflight.sql'),
    '-f', join(scratch, 'install-and-start-guard.sql'), '-f', join(scratch, 'verify.sql')]
  // Original SQL files are unmodified, no --single-transaction wrapper, no SQL
  // splitter, no DO wrapper, and no separate connection between -c/-f actions.
  const output = await new Promise((resolve, reject) => {
    let stdout = '', stderr = '', bytes = 0, forced = false
    child = spawn(binary, args, { env: { ...cleanEnvironment, PGSSLMODE: 'verify-full',
      PGSSLROOTCERT: join(scratch, 'supabase-ca.pem'), PGPASSFILE: passfile,
      PGCONNECT_TIMEOUT: '15', PGTARGETSESSIONATTRS: 'read-write',
      PGAPPNAME: 'jetnity-production-install-20261115' }, stdio: ['ignore', 'pipe', 'pipe'] })
    childStarted = true
    const timeout = setTimeout(() => { forced = true; child.kill('SIGKILL') }, 900000)
    for (const [stream, kind] of [[child.stdout, 'out'], [child.stderr, 'err']]) {
      stream.setEncoding('utf8')
      stream.on('data', text => {
        bytes += Buffer.byteLength(text)
        if (bytes > 2 * 1024 * 1024) { forced = true; child.kill('SIGKILL'); return }
        if (kind === 'out') stdout += text
        else stderr += text
      })
      stream.on('error', () => { forced = true; child.kill('SIGKILL') })
    }
    child.once('error', () => { forced = true })
    child.once('close', (code, signal) => {
      clearTimeout(timeout)
      child = undefined
      if (forced || interrupted || signal || code !== 0) {
        // psql VERBOSITY=sqlstate emits only SQLSTATE after ERROR/FATAL. Never
        // include the raw text or a connection error (which could echo inputs).
        const states = [...new Set([...stderr.matchAll(/\b(?:ERROR|FATAL):\s+([A-Z0-9]{5})\b/g)].map(match => match[1]))]
        console.log(JSON.stringify({ event: 'native-psql-stopped', exitCode: code, sqlStates: states,
          commit: 'unknown_until_independent_readback', retry: 'forbidden' }))
        reject(new Error('NATIVE_EXECUTION_DID_NOT_COMPLETE'))
      } else resolve(stdout)
    })
  })
  verifyReceipts(output)
}
const onSignal = () => { interrupted = true; if (child) child.kill('SIGKILL') }
process.once('SIGTERM', onSignal)
process.once('SIGINT', onSignal)
try {
  if (mode !== '--prepare' && mode !== '--install') refuse('EXPLICIT_MODE_REQUIRED')
  context()
  if (mode === '--install' && (typeof password !== 'string' || password.length === 0
    || Buffer.byteLength(password) > 1024 || /[\u0000\r\n]/.test(password))) refuse('EXISTING_CREATOR_SECRET_REQUIRED')
  phase = 'artifact-validation'
  const artifacts = readArtifacts()
  const { binary, version } = prepareClient()
  if (interrupted) refuse('BUILD_INTERRUPTED')
  if (mode === '--install') await install(binary, artifacts)
  phase = 'static-output'
  staticOutput(mode === '--prepare' ? 'prepared' : 'installed')
  console.log(JSON.stringify({ event: 'official-truth-native-build', mode, status: mode === '--prepare' ? 'prepared_no_database_connection' : 'core_committed_and_readback_verified',
    client: version, coreSha256: pins['install-and-start-guard.sql'][1], childStarted,
    publicRelease: 'not_implied', retry: 'forbidden_after_installation_attempt' }))
} catch (error) {
  console.error(JSON.stringify({ event: 'official-truth-native-build', mode, phase, status: 'stopped',
    code: error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message : 'UNCLASSIFIED_LOCAL_FAILURE',
    childStarted, commit: childStarted ? 'independent_readback_required' : 'not_attempted', retry: 'forbidden_after_installation_attempt' }))
  process.exitCode = 1
} finally {
  password = undefined
  if (scratch) rmSync(scratch, { recursive: true, force: true })
  process.removeListener('SIGTERM', onSignal)
  process.removeListener('SIGINT', onSignal)
}
