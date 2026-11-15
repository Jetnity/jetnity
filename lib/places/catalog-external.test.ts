import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  TARGET, CatalogError, atomicJson, batchSql, createTransport, finalExpected,
  loadInputs, options, reconcilePending, run, safeError, validateAcceptance,
  validateBatch, validateReceipt, validateResult,
} from '../../scripts/places/catalog-external/run.mjs'
import { findLocalPgBins, startLocalProofCluster } from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'

const SOURCE = '626eda801321471285889859e2025165c6032b7b45e67abe3de27164d12fb991'
const sha = (raw: string | Buffer) => createHash('sha256').update(raw).digest('hex')
const md5 = (raw: string) => createHash('md5').update(raw).digest('hex')
const env = { SUPABASE_PROJECT_REF: TARGET, SUPABASE_ACCESS_TOKEN: 'synthetic-token' }
const rows = [1, 2].map((n) => ({
  id: `geonames:90000000${n}`, source: 'geonames', source_id: `90000000${n}`,
  name: `Synthetic ${n}`, typ: 'city', country: null, country_code: null,
  region: null, lat: 0, lon: 0, iata: null, keywords: null,
  population: null, feature_code: 'PPL',
}))
const raw = Buffer.from(JSON.stringify(rows))
const batch = { index: 0, file: '0000.json', count: 2, bytes: raw.length, sha256: sha(raw), first_id: rows[0].id, last_id: rows[1].id }
const hashes = 'a'.repeat(32) + 'b'.repeat(32)
const result = {
  input_count: 2, existing_count: 0, inserted_count: 2, confirmed_count: 2,
  content_matches: true, expected_record_hashes: hashes,
  expected_digest: md5(hashes), confirmed_digest: md5(hashes),
}
const receipt = { state: 'confirmed', project_ref: TARGET, source_sha256: SOURCE, batch, confirmation: 'sql_confirmed', result }

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'jetnity-catalog-synthetic-'))
  await mkdir(join(root, 'batches'))
  await mkdir(join(root, 'receipts'))
  await writeFile(join(root, 'batches', batch.file), raw)
  await atomicJson(join(root, 'current-attempt.json'), {
    state: 'prepared_before_sql', project_ref: TARGET, source_sha256: SOURCE, batch,
  })
  return root
}

test('external runner import has no requests, execution or output', () => {
  const moduleUrl = new URL('../../scripts/places/catalog-external/run.mjs', import.meta.url).href
  const child = spawnSync(process.execPath, ['--input-type=module', '-e',
    `globalThis.fetch=()=>{throw new Error('unexpected-network')}; await import(${JSON.stringify(moduleUrl)});`], { encoding: 'utf8' })
  assert.equal(child.status, 0)
  assert.equal(child.stdout, '')
  assert.equal(child.stderr, '')
})

test('wrong target, Production flags and automated write execution fail before any data read or request', async () => {
  const args = ['--daten-verzeichnis', '/synthetic-missing', '--schreiben', '--entwicklung']
  assert.equal(options(['--daten-verzeichnis', '/synthetic-missing'], {}).write, false)
  assert.equal(options(args, env).write, true)
  for (const changed of [{ ...env, SUPABASE_PROJECT_REF: 'qscbgcdmivbbnzrcyegn' }, { ...env, CI: 'true' }, { ...env, GITHUB_ACTIONS: 'true' }, { ...env, VERCEL: '1' }, { ...env, SUPABASE_ACCESS_TOKEN: '' }]) {
    assert.throws(() => options(args, changed), CatalogError)
  }
  assert.throws(() => options([...args, '--produktion'], env), /ARGUMENTS_INVALID/)
  assert.throws(() => options([...args, '--schreiben'], env), /ARGUMENTS_INVALID/)
  let requests = 0
  await assert.rejects(run({ directory: '/synthetic-missing', write: true }, { ...env, SUPABASE_PROJECT_REF: 'wrong' }, async () => { requests += 1; throw new Error('unexpected') }), /WRONG_TARGET/)
  assert.equal(requests, 0)
})

test('target requires live exact non-default develop branch and rejects redirects/error bodies', async () => {
  const branch = { project_ref: TARGET, parent_project_ref: 'qscbgcdmivbbnzrcyegn', is_default: false, git_branch: 'develop' }
  for (const b of [branch, { ...branch, is_default: true }, { ...branch, project_ref: 'wrong' }, { ...branch, parent_project_ref: 'wrong' }, { ...branch, git_branch: 'main' }]) {
    const requests: string[] = []
    const fetcher: typeof fetch = async (input, init) => {
      requests.push(String(input))
      assert.equal(init?.redirect, 'error')
      return requests.length === 1 ? new Response('', { status: 404 }) : Response.json({ ...b, database_password: 'must-never-escape' })
    }
    const promise = createTransport('synthetic', fetcher).verifyTarget()
    if (b === branch) await promise
    else await assert.rejects(promise, /TARGET_BRANCH_MISMATCH/)
    assert.equal(requests.length, 2)
    assert.ok(requests.every((url) => url.startsWith('https://api.supabase.com/v1/') && url.includes(TARGET)))
  }
  const standalone = createTransport('synthetic', async () => Response.json({ password: 'must-never-escape' }))
  await assert.rejects(standalone.verifyTarget(), /TARGET_NOT_A_BRANCH/)
  const rejected = createTransport('synthetic', async () => new Response('secret and SQL', { status: 403 }))
  await assert.rejects(rejected.sql('synthetic'), (error) => safeError(error) === 'REMOTE_REQUEST_REJECTED')
  const broken = createTransport('synthetic', async () => { throw new Error('secret and SQL') })
  await assert.rejects(broken.sql('synthetic'), (error) => safeError(error) === 'REMOTE_REQUEST_UNCERTAIN')
  const huge = createTransport('synthetic', async () => new Response('x'.repeat(65537)))
  await assert.rejects(huge.sql('synthetic'), /REMOTE_RESPONSE_TOO_LARGE/)
  assert.equal(safeError(new Error('secret and SQL')), 'CATALOG_STOPPED')
})

test('fixed input hash and batch integrity reject altered or incomplete input', async () => {
  assert.deepEqual(validateBatch(raw, batch), rows)
  assert.throws(() => validateBatch(Buffer.concat([raw, Buffer.from(' ')]), batch), /BATCH_CHANGED/)
  assert.throws(() => validateBatch(raw, { ...batch, count: 1 }), /BATCH_COUNT_INVALID/)
  const reverse = Buffer.from(JSON.stringify([...rows].reverse()))
  assert.throws(() => validateBatch(reverse, { ...batch, bytes: reverse.length, sha256: sha(reverse) }), /BATCH_ORDER_INVALID/)
  const root = await fixture()
  try {
    await writeFile(join(root, 'batch-manifest.json'), '{}')
    await assert.rejects(loadInputs(root), /PINNED_INPUT_CHANGED/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('batch SQL is additive and readback is read-only with bounded safe payload', () => {
  const write = batchSql(rows, true)
  assert.match(write, /ON CONFLICT\(id\) DO NOTHING/)
  assert.match(write, /official_v3_guard_private\.assert_catalog_v1\(\)/)
  assert.match(write, /IS DISTINCT FROM/)
  assert.match(write, /pg_database_size/)
  assert.doesNotMatch(write, /\b(?:UPDATE|DELETE|TRUNCATE|ALTER|GRANT|REVOKE)\b/i)
  assert.doesNotMatch(write, /Synthetic/)
  assert.doesNotMatch(batchSql(rows, false), /\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|GRANT|REVOKE)\b/i)
  assert.throws(() => batchSql(Array(501).fill(rows[0]), true), /BATCH_LIMIT_EXCEEDED/)
})

test('full counts/content and receipt identity are mandatory', () => {
  validateResult(result, 2)
  validateReceipt(receipt, batch)
  assert.throws(() => validateResult({ ...result, content_matches: undefined }, 2), /BATCH_NOT_CONFIRMED/)
  assert.throws(() => validateResult({ ...result, confirmed_count: 1 }, 2), /BATCH_NOT_CONFIRMED/)
  assert.throws(() => validateResult({ ...result, confirmed_digest: '0'.repeat(32) }, 2), /BATCH_DIGEST_MISMATCH/)
  assert.throws(() => validateResult({ ...result, inserted_count: 3 }, 2), /BATCH_COUNTS_INVALID/)
  assert.throws(() => validateReceipt({ ...receipt, source_sha256: '0'.repeat(64) }, batch), /RECEIPT_INVALID/)
})

test('uncertain committed batch is reconciled read-only and persisted atomically', async () => {
  const root = await fixture()
  try {
    let calls = 0
    const prefix = await reconcilePending(root, { batches: [batch] }, 0, async (query: string) => {
      calls += 1
      assert.doesNotMatch(query, /\bINSERT\b/)
      return { ...result, existing_count: 2, inserted_count: null }
    })
    assert.equal(prefix, 1)
    assert.equal(calls, 1)
    const saved = JSON.parse(await readFile(join(root, 'receipts', batch.file), 'utf8'))
    validateReceipt(saved, batch)
    assert.equal(saved.confirmation, 'readback_reconciled')
    assert.equal(saved.result.inserted_count, null)
    const marker = JSON.parse(await readFile(join(root, 'current-attempt.json'), 'utf8'))
    assert.equal(marker.state, 'confirmed')
    assert.equal(marker.receipt_sha256, sha(await readFile(join(root, 'receipts', batch.file))))
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('partial or mismatching uncertain write stops without replaying SQL or changing checkpoint', async () => {
  for (const invalid of [{ ...result, confirmed_count: 1 }, { ...result, content_matches: false }]) {
    const root = await fixture()
    try {
      const before = await readFile(join(root, 'current-attempt.json'))
      let calls = 0
      await assert.rejects(reconcilePending(root, { batches: [batch] }, 0, async (query: string) => {
        calls += 1
        assert.doesNotMatch(query, /\bINSERT\b/)
        return invalid
      }), /BATCH_NOT_CONFIRMED/)
      assert.equal(calls, 1)
      assert.deepEqual(await readFile(join(root, 'current-attempt.json')), before)
      await assert.rejects(readFile(join(root, 'receipts', batch.file)), { code: 'ENOENT' })
    } finally { await rm(root, { recursive: true, force: true }) }
  }
})

test('receipt published before crash repairs completion marker without another request', async () => {
  const root = await fixture()
  try {
    await atomicJson(join(root, 'receipts', batch.file), receipt)
    assert.equal(await reconcilePending(root, { batches: [batch] }, 1, async () => { throw new Error('unexpected request') }), 1)
    assert.equal(JSON.parse(await readFile(join(root, 'current-attempt.json'), 'utf8')).state, 'confirmed')
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('mutable receipts cannot replace source hashes verified against pinned input', async () => {
  const root = await fixture()
  try {
    await atomicJson(join(root, 'receipts', batch.file), receipt)
    const expected = await finalExpected(root, { batches: [batch] }, {}, new Map([[0, hashes]]))
    assert.equal(expected.source_digest, md5(hashes))
    const changed = 'c'.repeat(64)
    await atomicJson(join(root, 'receipts', batch.file), { ...receipt, result: { ...result, expected_record_hashes: changed, expected_digest: md5(changed), confirmed_digest: md5(changed) } })
    await assert.rejects(finalExpected(root, { batches: [batch] }, {}, new Map([[0, hashes]])), /RECEIPT_SOURCE_MISMATCH/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('acceptance never treats source counts as a substitute for unchanged data, rights and final digest', () => {
  const a = {
    project_scope: TARGET, overall_pass: false,
    original_places: { all_columns_including_updated_at_unchanged: true },
    airports: { all_columns_unchanged: true },
    schema_and_rights: { columns_unchanged: true, indexes_unchanged: true, grants_unchanged: true, rls_constraints_triggers_owner_acl_unchanged: true },
    bg1: { returned_without_exception: true }, capacity: { database_bytes: 1000 }, source: { rows: 270 },
  }
  validateAcceptance({ acceptance: a }, false)
  assert.throws(() => validateAcceptance({ acceptance: a }, true), /FINAL_READBACK_FAILED/)
  assert.throws(() => validateAcceptance({ acceptance: { ...a, schema_and_rights: { ...a.schema_and_rights, grants_unchanged: false } } }, false), /SCHEMA_OR_RIGHTS_CHANGED/)
  assert.throws(() => validateAcceptance({ acceptance: { ...a, capacity: { database_bytes: 786432000 } } }, false), /CAPACITY_EXCEEDED/)
  assert.equal(validateAcceptance({ acceptance: { ...a, overall_pass: true } }, true).overall_pass, true)
})

test('no import command is registered in CI, deployment or package scripts', async () => {
  const root = fileURLToPath(new URL('../..', import.meta.url))
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  assert.doesNotMatch(JSON.stringify(pkg.scripts), /catalog-external\/run/)
})

const localPg = findLocalPgBins()
test('native disposable PostgreSQL: additive writes preserve timestamps, reject conflicts and obey guard', {
  skip: !localPg && !process.env.CI ? 'No local PostgreSQL binaries; mandatory in CI, never uses a hosted fallback.' : false,
  timeout: 90_000,
}, async () => {
  assert.ok(localPg)
  const cluster = startLocalProofCluster()
  const sql = (query: string) => execFileSync(localPg.psql, [
    '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-h', cluster.socket, '-p', String(cluster.port), '-U', cluster.user, '-d', cluster.database,
  ], { input: query, encoding: 'utf8', timeout: 30_000, maxBuffer: 65536, stdio: ['pipe', 'pipe', 'pipe'] }).trim()
  const batchResult = (query: string) => {
    const [input, existing, inserted, confirmed, matches, expectedDigest, confirmedDigest, recordHashes] = sql(query).split('|')
    return { input_count: Number(input), existing_count: existing ? Number(existing) : null, inserted_count: inserted ? Number(inserted) : null,
      confirmed_count: Number(confirmed), content_matches: matches === 't', expected_digest: expectedDigest, confirmed_digest: confirmedDigest, expected_record_hashes: recordHashes }
  }
  try {
    sql(`CREATE TABLE public.places (
      id text PRIMARY KEY, source text NOT NULL, source_id text NOT NULL, name text NOT NULL, typ text NOT NULL,
      country text, country_code text, region text, lat double precision, lon double precision, iata text,
      keywords text, population bigint, feature_code text, updated_at timestamptz NOT NULL,
      UNIQUE(source,source_id)
    );
    CREATE TABLE public.airports (id bigint PRIMARY KEY, name text);
    CREATE SCHEMA official_v3_guard_private;
    CREATE FUNCTION official_v3_guard_private.assert_catalog_v1() RETURNS void LANGUAGE plpgsql AS $$
    BEGIN
      IF current_setting('test.catalog_guard_blocked',true)='true' THEN RAISE EXCEPTION 'synthetic guard' USING ERRCODE='P7905'; END IF;
    END $$;`)
    const first = batchResult(batchSql(rows, true))
    validateResult(first, 2)
    assert.equal(first.inserted_count, 2)
    const before = sql("SELECT md5(string_agg(to_jsonb(p)::text,'' ORDER BY p.id)) FROM public.places p")
    const repeated = batchResult(batchSql(rows, true))
    validateResult(repeated, 2)
    assert.equal(repeated.inserted_count, 0)
    assert.equal(sql("SELECT md5(string_agg(to_jsonb(p)::text,'' ORDER BY p.id)) FROM public.places p"), before)
    const third = { ...rows[0], id: 'geonames:900000003', source_id: '900000003' }
    assert.throws(() => sql(batchSql([{ ...rows[0], name: 'conflict' }, third], true)))
    assert.equal(sql('SELECT count(*) FROM public.places'), '2')
    assert.throws(() => sql(batchSql([{ ...third, source_id: rows[0].source_id }], true)))
    assert.throws(() => sql("SET test.catalog_guard_blocked='true';" + batchSql([third], true)))
    assert.equal(sql('SELECT count(*) FROM public.places'), '2')
    validateResult(batchResult(batchSql(rows, false)), 2, true)
    const partial = batchResult(batchSql([...rows, third], false))
    assert.equal(partial.confirmed_count, 2)
    assert.throws(() => validateResult(partial, 3, true), /BATCH_NOT_CONFIRMED/)
    const template = await readFile(new URL('../../scripts/places/catalog-external/acceptance.sql', import.meta.url), 'utf8')
    const expected = { previous_ids: [], source_count: 2, source_digest: first.expected_digest, previous_count: 0, airport_count: 0,
      basic_schema: { columns: [], indexes: [], roles: [] }, types: { city: 2 }, sources: { geonames: 2 }, null_country_codes: 2 }
    const acceptance = JSON.parse(sql(template.replace('@@EXPECTED_JSON_BASE64@@', Buffer.from(JSON.stringify(expected)).toString('base64'))))
    assert.equal(acceptance.source.rows, 2)
    assert.equal(acceptance.source.matches_all_confirmed_source_receipts, true)
    assert.equal(acceptance.overall_pass, false) // Deliberately incomplete synthetic rights baseline.
  } finally { cluster.stop() }
})
