// Isolated, one-use operator build. No endpoint, deployed function or secret output.
// The reviewed SQL is unchanged; only credential transport and generic error
// handling are supplied here. --prepare is inert with respect to the database.
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { checkServerIdentity, TLSSocket } from 'node:tls'
import { fileURLToPath } from 'node:url'

const directory = dirname(fileURLToPath(import.meta.url))
const target = 'qscbgcdmivbbnzrcyegn'
const host = 'db.qscbgcdmivbbnzrcyegn.supabase.co'
const branch = 'ops/official-truth-production-install-20261115'
const project = 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM'
const marker = 'jetnity_prod_import_cron_v1'
const creatorKey = 'JETNITY_PROD_INSTALL_POSTGRES_PASSWORD'
const bundleKey = 'JETNITY_PROD_INSTALL_RUNTIME_BUNDLE'
const mode = process.argv.length === 3 ? process.argv[2] : '--prepare'
const metadata = Object.fromEntries(['VERCEL', 'VERCEL_ENV', 'VERCEL_PROJECT_ID',
  'VERCEL_GIT_REPO_OWNER', 'VERCEL_GIT_REPO_SLUG', 'VERCEL_GIT_COMMIT_REF',
  'VERCEL_GIT_COMMIT_SHA'].map(key => [key, process.env[key]]))
let creatorInput = mode === '--provision' ? process.env[creatorKey] : undefined
let bundleInput = mode === '--provision' ? process.env[bundleKey] : undefined
// Package installation and the native driver cannot inherit ambient secrets,
// PG* fallbacks, NODE_OPTIONS, npm credentials or a different database target.
for (const key of Object.keys(process.env)) delete process.env[key]
const cleanEnvironment = Object.freeze({ PATH: `${dirname(process.execPath)}:/usr/bin:/bin`,
  LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8', TZ: 'UTC' })
const pins = Object.freeze({
  'package.json': [228, '10e64ae0673bcb1ba1f742bdfa1ef949c0368b095de32900af411672980a6911'],
  'package-lock.json': [5700, 'f6583b1ca38d16a855d4124703cceefa8b94bce67250dbf41e3939f555fe23d3'],
  'configure-credentials.sql': [2857, 'aaeff1f36fc852546579b62be4046085d052f8ccb1d3794e481791d7a63f6b04'],
  'supabase-ca.pem': [1367, '700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7'],
})
const logins = Object.freeze([
  ['JETNITY_V3_PG_METHOD_PASSWORD', 'ot_v3_method_transport_login', 'ot_v3_method_reader'],
  ['JETNITY_V3_PG_INTAKE_PASSWORD', 'ot_v3_intake_transport_login', 'ot_v3_intake_caller'],
  ['JETNITY_V3_PG_JOBS_PASSWORD', 'ot_v3_jobs_transport_login', 'ot_v3_jobs_caller'],
  ['JETNITY_V3_PG_RESULT_WRITER_PASSWORD', 'ot_v3_result_writer', null],
  ['JETNITY_V3_PG_RESULT_READER_PASSWORD', 'ot_v3_result_reader', null],
  ['JETNITY_V3_PG_RESULT_VERIFIER_PASSWORD', 'ot_v3_result_verifier', null],
])
let phase = 'startup', credentials, hmac, artifacts, Client, cache, nativeDeadline
let databaseStarted = false, mutationAttempted = false, commitAttempted = false, committed = false
let loginChecks = 0, interrupted = false
const clients = new Set()
class LocalFailure extends Error {
  constructor(code) { super('PROVISION_OPERATION_FAILED'); this.code = code }
}
const fail = code => { throw new LocalFailure(code) }
const exact = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key))

function context() {
  if (metadata.VERCEL !== '1' || metadata.VERCEL_ENV !== 'preview'
    || metadata.VERCEL_PROJECT_ID !== project || metadata.VERCEL_GIT_REPO_OWNER !== 'Jetnity'
    || metadata.VERCEL_GIT_REPO_SLUG !== 'jetnity' || metadata.VERCEL_GIT_COMMIT_REF !== branch
    || !/^[a-f0-9]{40}$/.test(metadata.VERCEL_GIT_COMMIT_SHA ?? '')) fail('BUILD_CONTEXT_REFUSED')
}
function readArtifacts() {
  return Object.fromEntries(Object.entries(pins).map(([name, [size, digest]]) => {
    const path = join(directory, name)
    if (!lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) fail('ARTIFACT_TYPE_REFUSED')
    const bytes = readFileSync(path)
    if (bytes.length !== size || createHash('sha256').update(bytes).digest('hex') !== digest) fail('ARTIFACT_DIGEST_REFUSED')
    return [name, bytes]
  }))
}
function prepareDriver() {
  phase = 'driver-setup'
  const npmLink = join(dirname(process.execPath), 'npm')
  if (!existsSync(npmLink)) fail('TRUSTED_NPM_UNAVAILABLE')
  const npm = realpathSync(npmLink)
  if (!lstatSync(npm).isFile() || !npm.endsWith('/npm/bin/npm-cli.js')) fail('TRUSTED_NPM_UNAVAILABLE')
  cache = mkdtempSync(join(tmpdir(), 'jetnity-provision-npm-'))
  // npm rejects loading the same config path twice. Distinct empty owned files
  // also ensure no provider/user npm credentials or configuration are read.
  const userConfig = join(cache, 'empty-user.npmrc'), globalConfig = join(cache, 'empty-global.npmrc')
  writeFileSync(userConfig, '', { mode: 0o600, flag: 'wx' })
  writeFileSync(globalConfig, '', { mode: 0o600, flag: 'wx' })
  const result = spawnSync(process.execPath, [npm, 'ci', '--ignore-scripts', '--omit=optional',
    '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org', '--userconfig=' + userConfig,
    '--globalconfig=' + globalConfig, '--cache=' + cache], { cwd: directory, env: cleanEnvironment,
    stdio: ['ignore', 'pipe', 'pipe'], timeout: 180000, maxBuffer: 2 * 1024 * 1024 })
  if (result.error || result.signal || result.status !== 0) fail('PINNED_DRIVER_SETUP_FAILED')
  const require = createRequire(join(directory, 'package.json'))
  if (require('pg/package.json').version !== '8.23.1') fail('PINNED_DRIVER_VERSION_REFUSED')
  Client = require('pg').Client
}
function readInputs() {
  phase = 'input-validation'
  if (typeof creatorInput !== 'string' || !creatorInput.length || Buffer.byteLength(creatorInput) > 1024
    || /[\u0000\r\n]/.test(creatorInput)) fail('CREATOR_SECRET_REQUIRED')
  if (typeof bundleInput !== 'string' || Buffer.byteLength(bundleInput) > 8192) fail('RUNTIME_BUNDLE_REQUIRED')
  let bundle
  try { bundle = JSON.parse(bundleInput) } catch { fail('RUNTIME_BUNDLE_INVALID') }
  bundleInput = undefined
  const keys = logins.map(([key]) => key)
  if (!exact(bundle, ['schema', 'target', 'credentials', 'hmac']) || bundle.schema !== 1
    || bundle.target !== target || !exact(bundle.credentials, keys)) fail('RUNTIME_BUNDLE_INVALID')
  const values = [...keys.map(key => bundle.credentials[key]), bundle.hmac]
  if (values.some(value => typeof value !== 'string' || !/^[A-Za-z0-9_-]{43,128}$/.test(value))
    || new Set(values).size !== 7 || values.includes(creatorInput)) fail('DISTINCT_STRONG_SECRETS_REQUIRED')
  credentials = bundle.credentials; hmac = bundle.hmac
}
async function connect(user, password) {
  const client = new Client({ host, port: 5432, database: 'postgres', user, password,
    application_name: 'jetnity-production-runtime-provision-20261115',
    fallback_application_name: 'jetnity-production-runtime-provision-20261115',
    connectionTimeoutMillis: 15000, query_timeout: 0, statement_timeout: 30000,
    lock_timeout: 3000, idle_in_transaction_session_timeout: 45000,
    options: '-c search_path=pg_catalog -c timezone=UTC -c client_encoding=UTF8 -c transaction_timeout=120s',
    replication: 'false', sslnegotiation: 'postgres', binary: false, pipeline: false,
    enableChannelBinding: true, scramMaxIterations: 16384,
    ssl: { rejectUnauthorized: true, minVersion: 'TLSv1.2',
      ca: artifacts['supabase-ca.pem'].toString('utf8'), servername: host,
      checkServerIdentity(name, certificate) {
        return name === host ? checkServerIdentity(host, certificate) : new Error('TLS_IDENTITY_REFUSED')
      } },
  })
  clients.add(client)
  client.on('error', () => {})
  const abortAuthentication = () => { client.connection?.stream?.destroy() }
  client._handleAuthMD5Password = abortAuthentication
  client._handleAuthCleartextPassword = abortAuthentication
  databaseStarted = true
  await client.connect()
  const stream = client.connection?.stream
  if (!(stream instanceof TLSSocket) || !stream.authorized
    || checkServerIdentity(host, stream.getPeerCertificate())) fail('TLS_IDENTITY_REFUSED')
  const { rows } = await client.query(`SELECT current_database()='postgres' AS database_ok,
    session_user=$1 AS session_ok, current_user=$1 AS role_ok,
    current_setting('server_version_num')::integer / 10000=17 AS version_ok,
    EXISTS(SELECT 1 FROM pg_stat_ssl WHERE pid=pg_backend_pid() AND ssl) AS tls_ok`, [user])
  if (rows.length !== 1 || Object.values(rows[0]).some(value => value !== true)) fail('LOGIN_IDENTITY_REFUSED')
  return client
}
async function close(client) {
  try { await client.end() } finally { clients.delete(client) }
}
async function checkLogging(client) {
  const { rows } = await client.query(`SELECT
    current_setting('log_statement') IN ('none','ddl') AS statement_safe,
    current_setting('log_min_duration_statement')='-1' AS duration_safe,
    current_setting('log_min_duration_sample')='-1' AS sample_safe,
    current_setting('log_transaction_sample_rate')='0' AS transaction_sample_safe,
    current_setting('log_parameter_max_length_on_error')='0' AS error_parameters_safe,
    current_setting('pg_stat_statements.track')='top' AS only_outer_statement,
    coalesce(current_setting('pgaudit.log',true),'none')='none' AS no_nested_audit,
    NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pgaudit') AS audit_not_installed`)
  if (rows.length !== 1 || Object.values(rows[0]).some(value => value !== true)) fail('CREDENTIAL_LOGGING_CONTEXT_REFUSED')
}
async function provision() {
  phase = 'creator-connection'
  const creator = await connect('postgres', creatorInput)
  creatorInput = undefined
  phase = 'read-before-change'
  await checkLogging(creator)
  await creator.query('BEGIN')
  await creator.query("SET LOCAL jetnity.production_target='production:qscbgcdmivbbnzrcyegn:INSTALL1'")
  await creator.query('SELECT pg_advisory_xact_lock(771106,33)')
  const before = await creator.query(`SELECT
    (SELECT count(*) FROM vault.secrets WHERE name='jetnity_prod_import_cron_v1')=0 AS no_prior_marker,
    (SELECT count(*) FROM official_v3_method_private.heads_v1)<=1 AS bounded_method_state,
    (SELECT count(*) FROM official_v3_jobs_private.subjects_v1)=0 AS no_source_job,
    (SELECT count(*) FROM official_v3_result_private.projections_v1)=0 AS no_projection,
    (SELECT count(*)=1 AND bool_and(NOT enabled AND status='disabled') FROM jetnity_prod_import_scheduler.state_v1) AS sender_disabled,
    (SELECT count(*) FROM jetnity_prod_import_scheduler.cycles_v1)=0 AS no_cycles,
    (SELECT count(*) FROM jetnity_prod_import_scheduler.dispatches_v1)=0 AS no_dispatches,
    public.official_v3_guard_alarm_status_v1()='{"schema":1,"status":"current"}'::jsonb AS guard_current`)
  if (before.rows.length !== 1 || Object.values(before.rows[0]).some(value => value !== true)) fail('FRESH_INSTALLATION_MARKER_REQUIRED')
  await creator.query('SELECT official_v3_guard_private.assert_catalog_v1()')
  // Real Owner recovery may approve the single fixed method before credentials.
  // Validate its full chain; fresh BG1 and empty source/publication state remain required.
  await creator.query('SELECT official_v3_guard_private.check_hma_v1()')
  // Parameters are separate protocol values. Result cells are booleans only.
  await creator.query("SELECT set_config('jetnity.production_credentials',$1,true) IS NOT NULL AS configured",
    [JSON.stringify(credentials)])
  await creator.query("SELECT set_config('jetnity.production_hmac',$1,true) IS NOT NULL AS configured", [hmac])
  phase = 'atomic-credential-provisioning'
  mutationAttempted = true
  const original = artifacts['configure-credentials.sql'].toString('utf8')
  // The outer statement is non-secret and is the only pg_stat_statements entry.
  // Catching and replacing inner failures removes dynamic ALTER ROLE text from
  // the propagated error context, while rolling back its subtransaction. No
  // logging, audit, catalog, rights or runtime gate configuration is changed.
  await creator.query(`DO $provision_boundary$
BEGIN
  BEGIN
    EXECUTE $reviewed_credential_artifact$${original}$reviewed_credential_artifact$;
    PERFORM vault.create_secret(current_setting('jetnity.production_hmac'),
      'jetnity_prod_import_cron_v1','Jetnity CH-DE Production import HMAC; release 1197');
    PERFORM set_config('jetnity.production_hmac','',true);
    IF (SELECT count(*) FROM vault.secrets WHERE name='jetnity_prod_import_cron_v1')<>1 THEN
      RAISE EXCEPTION 'credential marker verification failed';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN RAISE EXCEPTION 'credential provisioning failed; details withheld' USING ERRCODE='P7922';
    WHEN query_canceled THEN RAISE EXCEPTION 'credential provisioning interrupted; details withheld' USING ERRCODE='P7922';
    WHEN assert_failure THEN RAISE EXCEPTION 'credential provisioning stopped; details withheld' USING ERRCODE='P7922';
  END;
END $provision_boundary$;`)
  phase = 'commit'
  commitAttempted = true
  await creator.query('COMMIT')
  committed = true
  const after = await creator.query(`SELECT
    (SELECT count(*) FROM vault.secrets WHERE name='jetnity_prod_import_cron_v1')=1 AS marker_present,
    public.official_v3_guard_alarm_status_v1()='{"schema":1,"status":"current"}'::jsonb AS guard_current`)
  if (after.rows.length !== 1 || Object.values(after.rows[0]).some(value => value !== true)) fail('POSTCOMMIT_READBACK_REFUSED')
  await creator.query('SELECT official_v3_guard_private.assert_catalog_v1()')
  await checkLogging(creator)
  await close(creator)
  phase = 'six-runtime-logins'
  // Close each physical connection before opening the next. Do not consume
  // the runtime's two-connection limit or trigger any source/Owner operation.
  for (const [key, login, setRole] of logins) {
    if (interrupted) fail('PROVISION_INTERRUPTED')
    const client = await connect(login, credentials[key])
    await client.query('BEGIN READ ONLY')
    if (setRole) await client.query('SET LOCAL ROLE ' + setRole)
    const { rows } = await client.query(`SELECT session_user=$1 AS login_ok,current_user=$2 AS role_ok,
      (SELECT rolcanlogin AND NOT rolinherit AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreaterole
        AND NOT rolcreatedb AND NOT rolreplication AND rolconnlimit=2 AND rolvaliduntil IS NULL
        AND rolconfig IS NULL FROM pg_roles WHERE rolname=$1) AS contract_ok`, [login, setRole ?? login])
    if (rows.length !== 1 || Object.values(rows[0]).some(value => value !== true)) fail('RUNTIME_LOGIN_CONTRACT_REFUSED')
    await client.query('ROLLBACK')
    await close(client)
    delete credentials[key]
    loginChecks++
  }
  credentials = undefined; hmac = undefined
}
function staticOutput() {
  const output = join(directory, 'public')
  if (existsSync(output) && (lstatSync(output).isSymbolicLink()
    || readdirSync(output).some(name => name !== 'index.html'))) fail('STATIC_OUTPUT_REFUSED')
  mkdirSync(output, { recursive: true })
  writeFileSync(join(output, 'index.html'), '<!doctype html><html lang="de"><meta charset="utf-8">'
    + '<meta name="robots" content="noindex,nofollow"><title>Jetnity Runtime-Einrichtung</title><body><p>'
    + (mode === '--prepare' ? 'Einrichtung vorbereitet. Keine Datenbankverbindung geöffnet.'
      : 'Runtime-Zugänge eingerichtet. Die öffentliche Quellenfreigabe wird separat geprüft.') + '</p></body></html>')
}
const interrupt = () => { interrupted = true; for (const client of clients) client.connection?.stream?.destroy() }
process.once('SIGTERM', interrupt); process.once('SIGINT', interrupt)
try {
  if (process.argv.length > 3 || !['--prepare', '--provision'].includes(mode)) fail('EXPLICIT_MODE_REQUIRED')
  context(); artifacts = readArtifacts(); prepareDriver()
  if (interrupted) fail('PROVISION_INTERRUPTED')
  if (mode === '--provision') {
    readInputs()
    nativeDeadline = setTimeout(interrupt, 180000)
    await provision()
    if (interrupted) fail('PROVISION_INTERRUPTED')
  }
  phase = 'static-output'; staticOutput()
  console.log(JSON.stringify({ event: 'official-truth-runtime-provision', mode,
    status: mode === '--prepare' ? 'prepared_no_database_connection' : 'credentials_committed_and_six_logins_verified',
    databaseStarted, committed, runtimeLogins: loginChecks, signingKeyCount: committed ? 1 : 0,
    sourceImport: 'not_started', ownerApproval: 'not_changed_by_provisioner', importPlan: 'disabled', publicRelease: 'not_implied' }))
} catch (error) {
  console.error(JSON.stringify({ event: 'official-truth-runtime-provision', mode, phase, status: 'stopped',
    code: error instanceof LocalFailure ? error.code : 'PROVISION_OPERATION_FAILED',
    databaseStarted, mutationAttempted, commitAttempted, committed, runtimeLogins: loginChecks,
    outcome: mutationAttempted ? 'independent_readback_required' : 'no_credential_mutation_attempted', retry: 'forbidden' }))
  process.exitCode = 1
} finally {
  for (const client of clients) {
    try { if (!committed && !commitAttempted) await client.query('ROLLBACK') } catch {}
    try { await client.end() } catch { client.connection?.stream?.destroy() }
  }
  clients.clear(); creatorInput = undefined; bundleInput = undefined; credentials = undefined; hmac = undefined
  if (nativeDeadline) clearTimeout(nativeDeadline)
  if (cache) rmSync(cache, { recursive: true, force: true })
  process.removeListener('SIGTERM', interrupt); process.removeListener('SIGINT', interrupt)
}
