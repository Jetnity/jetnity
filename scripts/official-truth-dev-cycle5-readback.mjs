// Install beside scripts/db/official-truth-chde-at-renewal-dev-20261121/.
// CI-only, fixed Dev SELECT/READ ONLY readback. No configurable SQL, URL, target or CLI input.
import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import {pathToFileURL} from 'node:url'

const DEV = 'yfvbxvijcorffwxbxahl'
const API = 'https://api.supabase.com/v1'
const REF = 'refs/heads/fix/official-truth-chde-at-renewal-dev-20261121'
const WORKFLOW_REF = 'Jetnity/jetnity/.github/workflows/official-truth-chde-at-renewal-dev.yml@' + REF
const SQL_FILE = new URL('./db/official-truth-chde-at-renewal-dev-20261121/dev-cycle5-independent-readback.READONLY.sql', import.meta.url)
const SQL_SHA256 = 'aa674ad533c9c99082aeb82c1255b1e53ab36654ca9ca6303a718c30235cab20'
const PASS = 'DEV_CYCLE5_RETIREMENT_AND_ARCHIVE_INDEPENDENT_READBACK_PASS'
const MAX_RESULT_BYTES = 16_384
const EXPECTED_NUMBERS = Object.freeze({
  cycle5_retirement_count: 1, prior_retirement_count: 6, retirement_owner_receipt_count: 7,
  archived_original_count: 2, later_source_starts: 0, later_accepted_versions: 0,
  later_public_projections: 0, retired_attempt_results: 0, retired_attempt_dispositions: 0,
  jobs_membership_count: 1,
})
const TRUE_FIELDS = Object.freeze([
  'cycle5_owner_receipt_exact', 'closed_job_and_15_53_history_unchanged',
  'cycle5_original_intake_bytes_exact', 'archived_original_bytes_exact',
  'jobs_membership_original', 'v7_catalog_exact',
])
const FALSE_FIELDS = Object.freeze([
  'historical_ui_confirmation_proven_from_database', 'owner_session_used',
  'new_source_run_started', 'production_write',
])
const TIME_FIELDS = Object.freeze(['observed_at', 'cycle5_retired_at', 'latest_bg1_due_at'])
const COUNTER_FIELDS = Object.freeze(['bg1_generation', 'incident_generation', 'resumed_generation', 'natural_post_v7_complete_proofs'])
const ALL_FIELDS = [...Object.keys(EXPECTED_NUMBERS), ...TRUE_FIELDS, ...FALSE_FIELDS,
  ...TIME_FIELDS, ...COUNTER_FIELDS, 'bg1', 'verdict'].sort()

class ReadbackStop extends Error {
  constructor(code) { super(code); this.code = code }
}
function stop(code) { throw new ReadbackStop(code) }
function statusCode(status) {
  return Number.isInteger(status) && status >= 100 && status <= 599 ? String(status) : 'INVALID'
}

function requireCi(env, argv) {
  if (argv.length !== 0 || env.CI !== 'true' || env.GITHUB_ACTIONS !== 'true'
      || env.GITHUB_REPOSITORY !== 'Jetnity/jetnity' || env.GITHUB_EVENT_NAME !== 'push'
      || env.GITHUB_REF !== REF || env.GITHUB_WORKFLOW_REF !== WORKFLOW_REF
      || !/^[a-f0-9]{40}$/.test(env.GITHUB_SHA ?? '')
      || (env.SUPABASE_PROJECT_REF && env.SUPABASE_PROJECT_REF !== DEV)) stop('CI_SCOPE')
}

async function cancelBody(response) {
  // Branch details can contain credentials. Never read either preflight body.
  try { await response.body?.cancel() } catch { stop('BODY_CANCEL') }
}

async function request(fetchImpl, token, path, method, body, consume, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(API + path, {
      method, headers: {Authorization: `Bearer ${token}`, ...(body === undefined ? {} : {'Content-Type': 'application/json'})},
      ...(body === undefined ? {} : {body}), redirect: 'error', signal: controller.signal,
    })
    return await consume(response)
  } catch (error) {
    if (error instanceof ReadbackStop) throw error
    // Do not propagate error.message, request URLs, headers, bodies or stacks.
    stop(controller.signal.aborted ? 'TIMEOUT' : 'TRANSPORT')
  } finally { clearTimeout(timer) }
}

async function readBoundedJson(response) {
  if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) {
    await cancelBody(response); stop('RESPONSE_TYPE')
  }
  const length = response.headers.get('content-length')
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_RESULT_BYTES)) {
    await cancelBody(response); stop('RESPONSE_SIZE')
  }
  if (!response.body) stop('RESPONSE_EMPTY')
  const reader = response.body.getReader()
  const chunks = []
  let lengthRead = 0
  try {
    for (;;) {
      const part = await reader.read()
      if (part.done) break
      lengthRead += part.value.byteLength
      if (lengthRead > MAX_RESULT_BYTES) { await reader.cancel(); stop('RESPONSE_SIZE') }
      chunks.push(part.value)
    }
  } finally { reader.releaseLock() }
  let parsed
  try { parsed = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(Buffer.concat(chunks))) }
  catch { stop('RESPONSE_JSON') }
  return parsed
}

function safeAggregate(rows) {
  if (!Array.isArray(rows) || rows.length !== 1 || !rows[0] || Array.isArray(rows[0])
      || typeof rows[0] !== 'object') stop('ROW_COUNT')
  const row = rows[0]
  if (Object.keys(row).sort().join('|') !== ALL_FIELDS.join('|')) stop('ROW_FIELDS')
  const safe = {}
  for (const [key, expected] of Object.entries(EXPECTED_NUMBERS)) {
    if (row[key] !== expected) stop('READBACK_NOT_PASS')
    safe[key] = expected
  }
  for (const key of TRUE_FIELDS) { if (row[key] !== true) stop('READBACK_NOT_PASS'); safe[key] = true }
  for (const key of FALSE_FIELDS) { if (row[key] !== false) stop('READBACK_NOT_PASS'); safe[key] = false }
  for (const key of COUNTER_FIELDS) {
    if (!Number.isSafeInteger(row[key]) || row[key] < 0) stop('ROW_COUNTER')
    safe[key] = row[key]
  }
  if (safe.bg1_generation < 2048 || safe.incident_generation !== safe.resumed_generation
      || safe.natural_post_v7_complete_proofs < 1 || row.bg1 !== 'current' || row.verdict !== PASS) stop('READBACK_NOT_PASS')
  for (const key of TIME_FIELDS) {
    if (typeof row[key] !== 'string'
        || !/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|\+00(?::?00)?)$/.test(row[key])
        || !Number.isFinite(Date.parse(row[key]))) stop('ROW_TIME')
    safe[key] = new Date(row[key]).toISOString()
  }
  if (Date.parse(safe.cycle5_retired_at) > Date.parse(safe.observed_at)
      || Date.parse(safe.latest_bg1_due_at) > Date.parse(safe.observed_at)) stop('ROW_TIME')
  safe.bg1 = 'current'; safe.verdict = PASS
  return safe
}

// Dependencies are injected only by imported offline tests; the CLI exposes no options.
export async function runReadback({env = process.env, argv = process.argv.slice(2),
  fetchImpl = globalThis.fetch, readFileImpl = readFile} = {}) {
  requireCi(env, argv)
  let sql
  try { sql = await readFileImpl(SQL_FILE, 'utf8') } catch { stop('SQL_FILE') }
  if (typeof sql !== 'string' || createHash('sha256').update(sql).digest('hex') !== SQL_SHA256) stop('SQL_DIGEST')
  const token = env.SUPABASE_ACCESS_TOKEN
  if (typeof token !== 'string' || token.length < 20 || token.length > 4096 || /\s/.test(token)) stop('CREDENTIAL_UNAVAILABLE')
  const statusOnly = async response => { const status = response.status; await cancelBody(response); return status }
  const projectStatus = await request(fetchImpl, token, '/projects/' + DEV, 'GET', undefined, statusOnly, 15_000)
  if (projectStatus !== 404) stop('DEV_PROJECT_GATE_' + statusCode(projectStatus))
  const branchStatus = await request(fetchImpl, token, '/branches/' + DEV, 'GET', undefined, statusOnly, 15_000)
  if (branchStatus !== 200) stop('DEV_BRANCH_GATE_' + statusCode(branchStatus))
  const row = await request(fetchImpl, token, '/projects/' + DEV + '/database/query', 'POST',
    JSON.stringify({query: sql, read_only: true}), async response => {
      if (![200, 201].includes(response.status)) { await cancelBody(response); stop('QUERY_HTTP_' + statusCode(response.status)) }
      return safeAggregate(await readBoundedJson(response))
    }, 45_000)
  return {status: 'pass', source_sha: env.GITHUB_SHA, ...row}
}

export async function runCli(options, output = process.stdout, errors = process.stderr) {
  try {
    output.write(JSON.stringify(await runReadback(options)) + '\n')
    return 0
  } catch (error) {
    const code = error instanceof ReadbackStop ? error.code : 'INTERNAL'
    errors.write('DEV_READBACK_STOP ' + code + '\n')
    return 1
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await runCli()
