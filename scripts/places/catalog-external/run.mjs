#!/usr/bin/env node
// One external operator command. Importing this module never starts a data run.
// Fixed, additive Dev snapshot only. No downloader, Production mode or raw logs.
import { createHash, randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, mkdir, open, readFile, readdir, rename, unlink } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

export const TARGET = 'yfvbxvijcorffwxbxahl'
const PARENT = 'qscbgcdmivbbnzrcyegn'
const SOURCE = '626eda801321471285889859e2025165c6032b7b45e67abe3de27164d12fb991'
const COUNT = 294833
const BATCHES = 611
const CAPACITY = 786432000
const API = 'https://api.supabase.com/v1'
const HERE = dirname(fileURLToPath(import.meta.url))
const PINS = Object.freeze({
  'batch-manifest.json': '69ce68a8e24c6845bed2af41e60bcfe4cea852f6a7f34de9a3287d0622b8c971',
  'backup/checksums.json': 'dd455fbc55213bfdba3cb7d5feaed259df4f9d3ccad60cb97cd2d403ae223b22',
  'backup/rls-after-batch-0.json': '4c502fd5771a169513c65fc7e553a74b5e14c8239a4facdbb02896dd58dcca3b',
  'source-manifest.json': 'ab5cf4e7efbbfe54a36f80916e89a9bf173f8d2ad414d2bacb0d0ac80c81c4ba',
})
const DEFINITION = 'id text,source text,source_id text,name text,typ text,country text,country_code text,region text,lat double precision,lon double precision,iata text,keywords text,population bigint,feature_code text'
const FIELDS = DEFINITION.split(',').map((field) => field.split(' ')[0])
const hex = (value, length) => typeof value === 'string' && new RegExp(`^[0-9a-f]{${length}}$`).test(value)
const digest = (value, algorithm = 'sha256') => createHash(algorithm).update(value).digest('hex')

export class CatalogError extends Error {
  constructor(code) { super(code); this.name = 'CatalogError'; this.code = code }
}
function requireValue(condition, code) { if (!condition) throw new CatalogError(code) }
export function safeError(error) { return error instanceof CatalogError ? error.code : 'CATALOG_STOPPED' }

export function options(args, env) {
  let directory
  let write = false
  let dev = false
  const seen = new Set()
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    requireValue(!seen.has(arg), 'ARGUMENTS_INVALID')
    seen.add(arg)
    if (arg === '--daten-verzeichnis') {
      directory = args[++i]
      requireValue(typeof directory === 'string' && directory.length > 0 && !directory.startsWith('--'), 'ARGUMENTS_INVALID')
    } else if (arg === '--schreiben') write = true
    else if (arg === '--entwicklung') dev = true
    else throw new CatalogError('ARGUMENTS_INVALID')
  }
  requireValue(directory && write === dev, 'ARGUMENTS_INVALID')
  if (write) {
    requireValue(!env.CI && !env.GITHUB_ACTIONS && !env.VERCEL, 'AUTOMATED_IMPORT_FORBIDDEN')
    requireValue(env.SUPABASE_PROJECT_REF === TARGET, 'WRONG_TARGET')
    requireValue(typeof env.SUPABASE_ACCESS_TOKEN === 'string' && env.SUPABASE_ACCESS_TOKEN.length > 0, 'TOKEN_REQUIRED')
  }
  return { directory: resolve(directory), write }
}

async function regularPath(root, relative) {
  requireValue(typeof relative === 'string' && !relative.includes('\\') && relative.split('/').every((part) => part && part !== '.' && part !== '..'), 'INPUT_PATH_INVALID')
  let path = root
  requireValue((await lstat(root)).isDirectory() && !(await lstat(root)).isSymbolicLink(), 'INPUT_PATH_INVALID')
  const parts = relative.split('/')
  for (let i = 0; i < parts.length; i += 1) {
    path = join(path, parts[i])
    const stat = await lstat(path)
    requireValue(!stat.isSymbolicLink() && (i === parts.length - 1 ? stat.isFile() : stat.isDirectory()), 'INPUT_PATH_INVALID')
  }
  return path
}
async function bytes(root, relative, maximum = 1_000_000) {
  const path = await regularPath(root, relative)
  requireValue((await lstat(path)).size <= maximum, 'INPUT_TOO_LARGE')
  return readFile(path)
}
async function pinned(root, relative) {
  const raw = await bytes(root, relative)
  requireValue(digest(raw) === PINS[relative], 'PINNED_INPUT_CHANGED')
  return JSON.parse(raw.toString('utf8'))
}
async function fileDigest(root, relative) {
  const hash = createHash('sha256')
  let size = 0
  for await (const chunk of createReadStream(await regularPath(root, relative))) { hash.update(chunk); size += chunk.length }
  return { sha256: hash.digest('hex'), bytes: size }
}

export function validateBatch(raw, batch) {
  requireValue(Buffer.isBuffer(raw) && raw.length === batch.bytes && raw.length <= 180000 && digest(raw) === batch.sha256, 'BATCH_CHANGED')
  const rows = JSON.parse(raw.toString('utf8'))
  requireValue(Array.isArray(rows) && rows.length === batch.count && rows.length > 0 && rows.length <= 500, 'BATCH_COUNT_INVALID')
  let prior = ''
  for (const row of rows) {
    requireValue(row && isDeepStrictEqual(Object.keys(row).sort(), [...FIELDS].sort()), 'BATCH_FIELDS_INVALID')
    requireValue(typeof row.id === 'string' && /^[\x21-\x7e]+$/.test(row.id) && row.id > prior, 'BATCH_ORDER_INVALID')
    requireValue(['geonames', 'ourairports'].includes(row.source) && typeof row.source_id === 'string' && row.source_id.length > 0, 'BATCH_IDENTITY_INVALID')
    requireValue(Number.isFinite(row.lat) && Math.abs(row.lat) <= 90 && Number.isFinite(row.lon) && Math.abs(row.lon) <= 180, 'BATCH_COORDINATES_INVALID')
    prior = row.id
  }
  requireValue(rows[0].id === batch.first_id && rows.at(-1).id === batch.last_id, 'BATCH_RANGE_INVALID')
  return rows
}
async function batchRows(root, batch) { return validateBatch(await bytes(root, `batches/${batch.file}`, 180000), batch) }

export async function loadInputs(root) {
  // Every original source, backup and batch is checked before the first request.
  const manifest = await pinned(root, 'batch-manifest.json')
  requireValue(manifest.project_ref === TARGET && manifest.source_sha256 === SOURCE && manifest.expected_count === COUNT && manifest.batches.length === BATCHES, 'MANIFEST_INVALID')
  const source = await fileDigest(root, 'places-combined.jsonl')
  requireValue(source.sha256 === SOURCE && source.bytes === 99265449, 'SOURCE_CHANGED')
  const sourceManifest = await pinned(root, 'source-manifest.json')
  for (const item of sourceManifest.files) {
    requireValue(['allCountries.zip', 'countryInfo.txt', 'admin1CodesASCII.txt', 'admin2Codes.txt'].includes(item.name), 'SOURCE_MANIFEST_INVALID')
    const actual = await fileDigest(root, `source/${item.name}`)
    requireValue(actual.sha256 === item.sha256 && actual.bytes === item.bytes, 'SOURCE_CHANGED')
  }
  const checksums = await pinned(root, 'backup/checksums.json')
  requireValue(checksums.length === 14, 'BACKUP_INCOMPLETE')
  const backups = {}
  for (const item of checksums) {
    requireValue(/^(airports-(?:0[1-9]|1[01])|airports-manifest|places-before|schema-before)\.json$/.test(item.file), 'BACKUP_INVALID')
    const raw = await bytes(root, `backup/${item.file}`)
    requireValue(raw.length === item.bytes && digest(raw) === item.sha256, 'BACKUP_CHANGED')
    backups[item.file] = JSON.parse(raw.toString('utf8'))
  }
  await pinned(root, 'backup/rls-after-batch-0.json')
  let count = 0
  let prior = ''
  const types = {}
  const sources = {}
  let nullCountries = 0
  for (const [index, batch] of manifest.batches.entries()) {
    requireValue(batch.index === index && batch.file === `${String(index).padStart(4, '0')}.json` && batch.first_id > prior, 'MANIFEST_ORDER_INVALID')
    const rows = await batchRows(root, batch)
    for (const row of rows) {
      types[row.typ] = (types[row.typ] ?? 0) + 1
      sources[row.source] = (sources[row.source] ?? 0) + 1
      if (row.country_code === null) nullCountries += 1
    }
    count += rows.length
    prior = batch.last_id
  }
  requireValue(count === COUNT, 'SOURCE_COVERAGE_INVALID')
  const original = backups['places-before.json']
  requireValue(original.project_ref === TARGET && original.count === 270 && original.rows.length === 270, 'BACKUP_INVALID')
  const schema = Object.fromEntries(backups['schema-before.json'].map((part) => [part.part, part.data]))
  const basic = {}
  for (const [part, fields] of [['columns', ['table', 'column']], ['indexes', ['table', 'name']], ['roles', ['table', 'grantee', 'privilege']]]) {
    basic[part] = [...schema[part]].sort((a, b) => {
      for (const field of fields) { const n = Buffer.compare(Buffer.from(a[field]), Buffer.from(b[field])); if (n) return n }
      return 0
    })
  }
  const expected = {
    project_ref: TARGET, source_count: COUNT, source_digest: null,
    previous_ids: original.rows.map((row) => row.id), previous_count: 270,
    previous_digest: 'cc9a679ea45b5a66fa82bbcdc5792203',
    airport_count: 5332, airport_digest: '90feedd315e598f44b4b1f65b08d0304',
    basic_schema: basic, supplementary_digest: 'a0fa0c02d4785bf8205fb59e7acaa96a',
    supplementary_capture_point: 'after_batch_0_before_remaining_batches',
    types, sources, null_country_codes: nullCountries, receipt_count: 0, receipt_files_sha256: null,
  }
  return { manifest, expected }
}

export function createTransport(token, fetcher = globalThis.fetch) {
  async function request(path, query) {
    let response
    try {
      response = await fetcher(`${API}${path}`, {
        method: query === undefined ? 'GET' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...(query === undefined ? {} : { body: JSON.stringify({ query }) }),
        redirect: 'error', signal: AbortSignal.timeout(30_000),
      })
      if (response.status === 404 && query === undefined) { await response.body?.cancel(); return { status: 404 } }
      if (!response.ok) { await response.body?.cancel(); throw new CatalogError('REMOTE_REQUEST_REJECTED') }
      const chunks = []
      let size = 0
      for await (const chunk of response.body) {
        size += chunk.length
        requireValue(size <= 65536, 'REMOTE_RESPONSE_TOO_LARGE')
        chunks.push(Buffer.from(chunk))
      }
      return { status: response.status, data: JSON.parse(Buffer.concat(chunks).toString('utf8')) }
    } catch (error) {
      if (error instanceof CatalogError) throw error
      throw new CatalogError('REMOTE_REQUEST_UNCERTAIN')
    }
  }
  return {
    async verifyTarget() {
      const project = await request(`/projects/${TARGET}`)
      requireValue(project.status === 404, 'TARGET_NOT_A_BRANCH')
      const branch = await request(`/branches/${TARGET}`)
      const b = branch.data
      requireValue(branch.status === 200 && b?.project_ref === TARGET && b.parent_project_ref === PARENT && b.is_default === false && (b.git_branch ?? b.name) === 'develop', 'TARGET_BRANCH_MISMATCH')
    },
    async sql(query) {
      const response = await request(`/projects/${TARGET}/database/query`, query)
      requireValue(Array.isArray(response.data) && response.data.length === 1, 'SQL_RESPONSE_INVALID')
      return response.data[0]
    },
  }
}

export function batchSql(rows, write) {
  const raw = Buffer.from(JSON.stringify(rows))
  requireValue(rows.length > 0 && rows.length <= 500 && raw.length <= 180000, 'BATCH_LIMIT_EXCEEDED')
  const incoming = `WITH incoming AS MATERIALIZED (
    SELECT * FROM jsonb_to_recordset(convert_from(decode('${raw.toString('base64')}','base64'),'UTF8')::jsonb) AS i(${DEFINITION})
  ), existing AS MATERIALIZED (SELECT p.* FROM public.places p JOIN incoming i ON i.id=p.id)`
  const comparison = `NOT EXISTS (SELECT 1 FROM existing e JOIN incoming i ON i.id=e.id WHERE (to_jsonb(e)-'updated_at') IS DISTINCT FROM to_jsonb(i))
    AND NOT EXISTS (SELECT 1 FROM public.places p JOIN incoming i ON p.source=i.source AND p.source_id=i.source_id WHERE p.id<>i.id)`
  const tail = `SELECT (SELECT count(*) FROM incoming)::integer AS input_count,
    (SELECT count(*) FROM existing)::integer AS existing_count,
    ${write ? '(SELECT count(*) FROM written)::integer' : 'NULL::integer'} AS inserted_count,
    (SELECT count(*) FROM confirmed)::integer AS confirmed_count,
    (${comparison}) AS content_matches,
    (SELECT md5(string_agg(md5(to_jsonb(i)::text),'' ORDER BY i.id COLLATE "C")) FROM incoming i) AS expected_digest,
    (SELECT md5(string_agg(md5(c.data::text),'' ORDER BY c.id COLLATE "C")) FROM confirmed c) AS confirmed_digest,
    (SELECT string_agg(md5(to_jsonb(i)::text),'' ORDER BY i.id COLLATE "C") FROM incoming i) AS expected_record_hashes;`
  if (!write) return `${incoming}, confirmed AS (SELECT e.id,to_jsonb(e)-'updated_at' AS data FROM existing e) ${tail}`
  return `${incoming}, guard AS MATERIALIZED (
    SELECT official_v3_guard_private.assert_catalog_v1()::text AS result
  ), gate AS MATERIALIZED (
    SELECT 1 / CASE WHEN pg_database_size(current_database()) < ${CAPACITY}
      AND (SELECT count(DISTINCT id) FROM incoming)=${rows.length} AND ${comparison}
      THEN 1 ELSE 0 END AS ok FROM guard
  ), written AS (
    INSERT INTO public.places (${FIELDS.join(',')},updated_at)
    SELECT ${FIELDS.map((field) => `i.${field}`).join(',')},now() FROM incoming i CROSS JOIN gate g WHERE g.ok=1
    ON CONFLICT(id) DO NOTHING RETURNING *
  ), confirmed AS (
    SELECT e.id,to_jsonb(e)-'updated_at' AS data FROM existing e
    UNION ALL SELECT w.id,to_jsonb(w)-'updated_at' FROM written w
  ) ${tail}`
}

export function validateResult(result, count, reconciled = false) {
  requireValue(result?.input_count === count && result.confirmed_count === count && result.content_matches === true, 'BATCH_NOT_CONFIRMED')
  requireValue(hex(result.expected_record_hashes, count * 32) && digest(result.expected_record_hashes, 'md5') === result.expected_digest && result.confirmed_digest === result.expected_digest, 'BATCH_DIGEST_MISMATCH')
  if (!reconciled) requireValue(Number.isInteger(result.existing_count) && result.existing_count >= 0 && Number.isInteger(result.inserted_count) && result.inserted_count >= 0 && result.existing_count + result.inserted_count === count, 'BATCH_COUNTS_INVALID')
}
export function validateReceipt(receipt, batch) {
  requireValue(receipt?.state === 'confirmed' && receipt.project_ref === TARGET && receipt.source_sha256 === SOURCE && isDeepStrictEqual(receipt.batch, batch), 'RECEIPT_INVALID')
  requireValue(['sql_confirmed', 'readback_reconciled'].includes(receipt.confirmation), 'RECEIPT_INVALID')
  // Historical confirmed receipts predate the explicit comparison boolean.
  validateResult({ content_matches: true, ...receipt.result }, batch.count, receipt.confirmation === 'readback_reconciled')
}
async function readState(root, relative) {
  try { return JSON.parse((await bytes(root, relative, 65536)).toString('utf8')) }
  catch (error) { if (error?.code === 'ENOENT') return null; throw error }
}
export async function atomicJson(path, value) {
  const temporary = `${path}.${randomUUID()}.tmp`
  const raw = `${JSON.stringify(value)}\n`
  let handle
  try {
    handle = await open(temporary, 'wx', 0o600)
    await handle.writeFile(raw)
    await handle.sync()
    await handle.close(); handle = undefined
    await rename(temporary, path)
    const directory = await open(dirname(path), 'r')
    try { await directory.sync() } finally { await directory.close() }
  } finally {
    if (handle) await handle.close()
    await unlink(temporary).catch((error) => { if (error.code !== 'ENOENT') throw error })
  }
  return digest(raw)
}
async function receiptPrefix(root, manifest) {
  await mkdir(join(root, 'receipts'), { recursive: true, mode: 0o700 })
  const stat = await lstat(join(root, 'receipts'))
  requireValue(stat.isDirectory() && !stat.isSymbolicLink(), 'INPUT_PATH_INVALID')
  const files = (await readdir(join(root, 'receipts'))).filter((file) => file.endsWith('.json')).sort()
  requireValue(files.length <= manifest.batches.length, 'RECEIPT_GAP')
  for (const [index, file] of files.entries()) {
    requireValue(file === `${String(index).padStart(4, '0')}.json`, 'RECEIPT_GAP')
    validateReceipt(await readState(root, `receipts/${file}`), manifest.batches[index])
  }
  return files.length
}
async function confirm(root, batch, result, reconciled) {
  if (reconciled) result = { ...result, existing_count: null, inserted_count: null }
  const receipt = { state: 'confirmed', project_ref: TARGET, source_sha256: SOURCE, batch, confirmation: reconciled ? 'readback_reconciled' : 'sql_confirmed', result }
  validateReceipt(receipt, batch)
  const receiptSha = await atomicJson(join(root, 'receipts', batch.file), receipt)
  await atomicJson(join(root, 'current-attempt.json'), { state: 'confirmed', project_ref: TARGET, source_sha256: SOURCE, batch, receipt_sha256: receiptSha })
}

export async function reconcilePending(root, manifest, prefix, sql) {
  const pending = await readState(root, 'current-attempt.json')
  if (!pending) { requireValue(prefix === 0, 'ATTEMPT_MISSING'); return prefix }
  const index = pending.batch?.index
  requireValue(pending.project_ref === TARGET && pending.source_sha256 === SOURCE && Number.isInteger(index) && isDeepStrictEqual(pending.batch, manifest.batches[index]), 'ATTEMPT_INVALID')
  if (index === prefix - 1) {
    requireValue(['confirmed', 'prepared_before_sql'].includes(pending.state), 'ATTEMPT_INVALID')
    const raw = await bytes(root, `receipts/${pending.batch.file}`, 65536)
    validateReceipt(JSON.parse(raw.toString('utf8')), pending.batch)
    await atomicJson(join(root, 'current-attempt.json'), { state: 'confirmed', project_ref: TARGET, source_sha256: SOURCE, batch: pending.batch, receipt_sha256: digest(raw) })
    return prefix // Receipt is already durable, even if the completion marker was interrupted.
  }
  requireValue(index === prefix && pending.state === 'prepared_before_sql', 'ATTEMPT_INVALID')
  const result = await sql(batchSql(await batchRows(root, pending.batch), false))
  // Missing/partial/different rows are not authority to replay an uncertain write.
  validateResult(result, pending.batch.count, true)
  await confirm(root, pending.batch, result, true)
  return prefix + 1
}

function acceptanceSql(expected, template) {
  requireValue(template.split('@@EXPECTED_JSON_BASE64@@').length === 2, 'ACCEPTANCE_TEMPLATE_INVALID')
  return template.replace('@@EXPECTED_JSON_BASE64@@', Buffer.from(JSON.stringify(expected)).toString('base64'))
}
export function validateAcceptance(row, final) {
  const a = row?.acceptance
  requireValue(a?.project_scope === TARGET && a.original_places?.all_columns_including_updated_at_unchanged === true && a.airports?.all_columns_unchanged === true, 'EXISTING_DATA_CHANGED')
  const rights = a.schema_and_rights
  requireValue(rights?.columns_unchanged === true && rights.indexes_unchanged === true && rights.grants_unchanged === true && rights.rls_constraints_triggers_owner_acl_unchanged === true && a.bg1?.returned_without_exception === true, 'SCHEMA_OR_RIGHTS_CHANGED')
  requireValue(Number.isSafeInteger(a.capacity?.database_bytes) && a.capacity.database_bytes < CAPACITY, 'CAPACITY_EXCEEDED')
  requireValue(Number.isSafeInteger(a.source?.rows) && a.source.rows >= 270 && a.source.rows <= COUNT, 'CATALOG_COUNT_INVALID')
  if (final) requireValue(a.overall_pass === true, 'FINAL_READBACK_FAILED')
  return a
}
export async function finalExpected(root, manifest, expected, verifiedHashes) {
  const hashes = createHash('md5')
  const inventory = []
  for (const batch of manifest.batches) {
    const raw = await bytes(root, `receipts/${batch.file}`, 65536)
    const receipt = JSON.parse(raw.toString('utf8'))
    validateReceipt(receipt, batch)
    requireValue(verifiedHashes.get(batch.index) === receipt.result.expected_record_hashes, 'RECEIPT_SOURCE_MISMATCH')
    hashes.update(verifiedHashes.get(batch.index))
    inventory.push({ file: batch.file, bytes: raw.length, sha256: digest(raw) })
  }
  return { ...expected, source_digest: hashes.digest('hex'), receipt_count: manifest.batches.length, receipt_files_sha256: digest(JSON.stringify(inventory)) }
}

export async function run(config, env, fetcher = globalThis.fetch) {
  const root = config.directory
  // Validate the command again so programmatic callers cannot enable a wider target.
  if (config.write) options(['--daten-verzeichnis', root, '--schreiben', '--entwicklung'], env)
  let lock
  try {
    if (config.write) {
      try { lock = await open(join(root, 'external-runner.lock'), 'wx', 0o600) }
      catch { throw new CatalogError('RUNNER_LOCKED') }
      await lock.writeFile(`${JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() })}\n`)
      await lock.sync()
    }
    const { manifest, expected } = await loadInputs(root)
    if (!config.write) return { status: 'prepared', batches: manifest.batches.length, rows: COUNT }
    const transport = createTransport(env.SUPABASE_ACCESS_TOKEN, fetcher)
    await transport.verifyTarget()
    const template = await readFile(join(HERE, 'acceptance.sql'), 'utf8')
    validateAcceptance(await transport.sql(acceptanceSql(expected, template)), false)
    let prefix = await receiptPrefix(root, manifest)
    prefix = await reconcilePending(root, manifest, prefix, transport.sql)
    const verifiedHashes = new Map()
    // A receipt is only a checkpoint, never authority for source content. Rebind
    // prior hashes to the pinned input and the actual DB before continuing.
    for (const batch of manifest.batches.slice(0, prefix)) {
      const result = await transport.sql(batchSql(await batchRows(root, batch), false))
      validateResult(result, batch.count, true)
      const receipt = await readState(root, `receipts/${batch.file}`)
      validateReceipt(receipt, batch)
      requireValue(receipt.result.expected_record_hashes === result.expected_record_hashes, 'RECEIPT_SOURCE_MISMATCH')
      verifiedHashes.set(batch.index, result.expected_record_hashes)
    }
    for (const batch of manifest.batches.slice(prefix)) {
      const rows = await batchRows(root, batch)
      await atomicJson(join(root, 'current-attempt.json'), { state: 'prepared_before_sql', project_ref: TARGET, source_sha256: SOURCE, batch })
      const result = await transport.sql(batchSql(rows, true))
      validateResult(result, batch.count)
      await confirm(root, batch, result, false)
      verifiedHashes.set(batch.index, result.expected_record_hashes)
    }
    const complete = await finalExpected(root, manifest, expected, verifiedHashes)
    const acceptance = validateAcceptance(await transport.sql(acceptanceSql(complete, template)), true)
    await atomicJson(join(root, 'external-runner-acceptance.json'), acceptance)
    return { status: 'complete', batches: manifest.batches.length, rows: COUNT, ui_acceptance: 'pending_owner_login' }
  } finally {
    if (lock) { await lock.close(); await unlink(join(root, 'external-runner.lock')) }
  }
}

async function main() {
  try {
    const result = await run(options(process.argv.slice(2), process.env), process.env)
    process.stdout.write(`${JSON.stringify(result)}\n`)
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'stopped', error: safeError(error) })}\n`)
    process.exitCode = 1
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) void main()
