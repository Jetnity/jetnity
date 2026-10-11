import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { startLocalProofCluster } from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgText, pgBytes } from '../../scripts/db/official-truth-integrated-pilot-1/pg-wire'
import { installLocalProofSchema, localArtifactTypeOids, publishIntegratedBundle } from '../../scripts/db/official-truth-integrated-pilot-1/storage'
import { runControlledSyntheticPilot } from '../../scripts/official-truth-integrated-pilot-1/controlled-runtime'
import { pilotBody, type PilotItem } from '../../scripts/official-truth-integrated-pilot-1/corpus'
import { bindCandidate, cursor, persistCandidate, prepareOriginals, readCandidate, reviewCandidate } from '../../scripts/db/official-truth-original-custody-1/storage'
import { officialTruthSourceFingerprintV2 } from './official-truth-source-fingerprint-v2'
import { evidenceQuellenFingerprint } from './evidence'
import { verifyLocalIntegratedPilotBundle, type LocalIntegratedPilotEnvelope } from './official-truth-integrated-pilot-bundle'

import { provenanceCanonical } from './official-truth-autonomous-provenance-artifact'
import { contentEvidenceVersionV2 } from './official-truth-content-identity'
import { officialTruthReviewIdentityV3 } from './official-truth-rule-review-fingerprint'
import { rewriteIntegratedFixture } from '../../scripts/db/official-truth-integrated-pilot-1/integrated-proof'

// Calendar-relative SYNTHETIC historical fixture, never live retrieval authority.
// This custody proof retains the complete typed graph but uses explicitly synthetic
// implementation capsules, bounding this fixture independently of compiler and
// dependency growth. The integrated pilot's separate native proof still exercises
// the full captured execution bytes. No original response,
// support, review, dependency edge or validation step is removed here.
// Recompute Evidence/review identities and every ancestor Pin using existing codecs.
function currentSyntheticFixture(envelope: LocalIntegratedPilotEnvelope, origin: number) {
  type Value = Record<string, unknown>
  const offset = origin - Date.parse('2026-10-06T12:00:00.000Z')
  const stamp = (s: string) => /^2026-10-06T12:0[01]:[0-9]{2}\.[0-9]{3}Z$/.test(s) ? new Date(Date.parse(s) + offset).toISOString() : s
  const parse = (b: Uint8Array): Value => JSON.parse(Buffer.from(b).toString())
  const encode = (v: unknown) => Buffer.from(provenanceCanonical(v)!)
  const values = envelope.bundle.artifacts.map(a => parse(a.canonicalBytes)), identities = new Map<string, Value>(), replacements = new Map<string, string>()
  for (const value of values) if (value.artifactType === 'implementation_bundle') {
    value.content = { ...(value.content as Value), bundleBase64: encode({ schema: 'implementation-source-bundle-v1', files: [
      { path: 'synthetic-custody-fixture.ts', utf8: '// Synthetic custody conformance capsule; no execution or source authority.\nexport const fixture = true;\n' },
    ] }).toString('base64') }
  }
  const collect = (value: unknown): void => {
    if (Array.isArray(value)) { value.forEach(collect); return }
    if (!value || typeof value !== 'object') return
    const v = value as Value
    if (v.identitySchema === 2 && typeof v.lookupKey === 'string' && typeof v.versionId === 'string') {
      const { versionId, ...preimage } = v
      const identity = contentEvidenceVersionV2({ ...preimage, retrievedAt: stamp(v.retrievedAt as string) })
      assert.ok(identity.ok)
      identities.set(versionId, { ...identity.value.identity, versionId: identity.value.versionId }); replacements.set(versionId, identity.value.versionId)
    }
    Object.values(v).forEach(collect)
  }
  values.forEach(collect)
  const transform = (value: unknown): unknown => {
    if (typeof value === 'string') return replacements.get(value) ?? stamp(value)
    if (Array.isArray(value)) {
      const result = value.map(transform)
      if (result.every(x => typeof x === 'string' && x.startsWith('ev2_'))) return (result as string[]).sort()
      if (result.every(x => x && typeof x === 'object' && typeof (x as Value).versionId === 'string')) return result.sort((a, b) => String((a as Value).versionId).localeCompare(String((b as Value).versionId)))
      return result
    }
    if (!value || typeof value !== 'object') return value
    const v = value as Value
    if (v.identitySchema === 2 && typeof v.sourceId === 'string' && typeof v.versionId === 'string' && identities.has(v.versionId)) {
      const identity = identities.get(v.versionId)!
      if ('lookupKey' in v) return identity
      const { lookupKey, ...compact } = identity; void lookupKey; return compact
    }
    const next = Object.fromEntries(Object.entries(v).map(([k, child]) => [k, transform(child)]))
    if (next.artifactType === 'eligible_version_snapshot') {
      next.dependencies = ((next.content as Value).entries as Value[]).map((entry, i) => ({ slot: `/entries/${i}/custody`, pin: entry.custody }))
    }
    return next
  }
  let rewritten = values.map(transform) as Value[]
  for (const artifact of rewritten) if (artifact.kind === 'AutonomousReviewConstructionV1') {
    const v = artifact.value as Value, preimage = v.safePreimage as Value
    const review = officialTruthReviewIdentityV3(preimage.candidate as Parameters<typeof officialTruthReviewIdentityV3>[0], preimage.supports as Parameters<typeof officialTruthReviewIdentityV3>[1])
    assert.ok(review.ok); replacements.set(v.reviewPacketKey as string, `review-packet:v3:${review.digest}`)
  }
  rewritten = rewritten.map(transform) as Value[]
  return rewriteIntegratedFixture({ profile: envelope.profile, bundle: { ...envelope.bundle,
    receiptBytes: encode(transform(parse(envelope.bundle.receiptBytes))), custodyBindingBytes: encode(transform(parse(envelope.bundle.custodyBindingBytes))),
    artifacts: envelope.bundle.artifacts.map((a, i) => ({ ...a, canonicalBytes: encode(rewritten[i]) })),
  } }, '__rehash_all__', v => v)
}

const migrations = [
  '20261001121258_official_truth_private_evidence_store_schema_1.sql',
  '20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql',
  '20261001180549_official_truth_trusted_store_writer_1.sql',
  '20261001193748_official_truth_source_catalog_gateway_1.sql',
  '20261004010705_official_truth_content_identity_2.sql',
  '20261004223959_official_truth_v2_catalog_hardening_1.sql',
  '20261010180000_official_truth_source_fingerprint_protocol_2.sql',
  '20261011111839_official_truth_original_custody_lifecycle_1.sql',
]
const code = (expected: string) => (error: unknown) => error instanceof LocalPgError && error.code === expected

test('M1–M4 synthetic atomic custody, protected review, current reader and immutable lifecycle on native PostgreSQL16', { timeout: 240_000 }, async context => {
  const started = performance.now()
  const primary = await runControlledSyntheticPilot('primary'), composed = await runControlledSyntheticPilot('composed')
  assert.equal(primary.status, 'synthetic_bundle_verified'); assert.equal(composed.status, 'synthetic_bundle_verified')
  if (primary.status !== 'synthetic_bundle_verified' || composed.status !== 'synthetic_bundle_verified') throw Error('fixture_required')
  const originals = (envelope: LocalIntegratedPilotEnvelope) => {
    const v = verifyLocalIntegratedPilotBundle(envelope); assert.ok(v.ok, JSON.stringify(v.ok ? null : v.reason))
    return prepareOriginals(envelope, v.value.receipt.payload.supports.map(s => Buffer.from(pilotBody((s.binding as {contentItemId: PilotItem}).contentItemId))))
  }
  const origin = Math.floor((Date.now() - 120_000) / 1000) * 1000
  const p = originals(currentSyntheticFixture(primary.envelope, origin)), c = originals(currentSyntheticFixture(composed.envelope, origin))
  for (const [full, fixture] of [[primary.envelope, p.envelope], [composed.envelope, c.envelope]]) {
    assert.deepEqual(fixture!.bundle.artifacts.map(a => [a.pin.id, a.artifactType]).sort(), full!.bundle.artifacts.map(a => [a.pin.id, a.artifactType]).sort())
  }
  context.diagnostic(JSON.stringify({ schema: 'custody-fixture-v1', authority: 'synthetic-historical-only', fixtures: [p, c].map(prepared => ({
    artifacts: prepared.envelope.bundle.artifacts.length, artifactBytes: prepared.envelope.bundle.artifacts.reduce((n, a) => n + a.canonicalBytes.length, 0),
    originals: prepared.bodies.length, originalBytes: prepared.bodies.map(b => b.length),
  })) }))
  const cluster = startLocalProofCluster(), connections: LocalPgConnection[] = [], checks: string[] = []
  // Test-local observations only. Fixed labels, numeric aggregates and SQLSTATEs;
  // never SQL, parameters, source bytes, keys, hashes or connection identities.
  const originalConnect = LocalPgConnection.connect
  type Phase = 'publish' | 'bind' | 'current_read' | 'archive_read' | 'commit'
  const phases = new Map<Phase, { calls: number; elapsedMs: number; maxMs: number; sqlStates: Set<string> }>()
  LocalPgConnection.connect = async (...args: Parameters<typeof LocalPgConnection.connect>) => {
    const connection = await originalConnect(...args), query = connection.query.bind(connection)
    connection.query = async (sql, params) => {
      const phase: Phase | undefined = sql.startsWith('SELECT official_provenance_api.publish_local_integrated_v2(') ? 'publish'
        : sql.startsWith('SELECT official_original_api.bind_candidate(') ? 'bind'
        : sql.includes('FROM official_original_api.read_candidate(') ? 'current_read'
        : sql.includes('FROM official_provenance_api.read_local_integrated_v2(') ? 'archive_read' : sql === 'COMMIT' ? 'commit' : undefined
      if (!phase) return query(sql, params)
      const at = performance.now(), sample = phases.get(phase) ?? { calls: 0, elapsedMs: 0, maxMs: 0, sqlStates: new Set<string>() }
      phases.set(phase, sample)
      try { return await query(sql, params) }
      catch (error) { if (error instanceof LocalPgError && /^[0-9A-Z]{5}$/.test(error.code)) sample.sqlStates.add(error.code); throw error }
      finally { const elapsed = Math.ceil(performance.now() - at); sample.calls++; sample.elapsedMs += elapsed; sample.maxMs = Math.max(sample.maxMs, elapsed) }
    }
    return connection
  }
  const connect = async (role?: string) => { const connection = await LocalPgConnection.connect(cluster, role); connections.push(connection); return connection }
  const owner = await connect(), key = randomBytes(32).toString('hex')
  try {
    assert.match(cluster.version, /^postgres \(PostgreSQL\) 16\./)
    await owner.query('CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions; CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;')
    await installLocalProofSchema(owner)
    for (const name of migrations) await owner.query(readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8'))
    await owner.query(`CREATE ROLE ot_original_test_writer LOGIN; GRANT ot_original_producer,ot_provenance_writer TO ot_original_test_writer;
      CREATE ROLE ot_original_test_reader LOGIN; GRANT ot_original_reader,ot_provenance_reader TO ot_original_test_reader;
      CREATE ROLE ot_original_test_reviewer LOGIN; GRANT ot_original_reviewer TO ot_original_test_reviewer;
      CREATE ROLE ot_original_test_lifecycle LOGIN; GRANT ot_original_lifecycle TO ot_original_test_lifecycle;`)
    for (const prepared of [p, c]) {
      const v = verifyLocalIntegratedPilotBundle(prepared.envelope); assert.ok(v.ok)
      for (const s of v.value.receipt.payload.supports) await owner.query(`INSERT INTO official_original_private.admissions VALUES($1::jsonb,$2::text,$3::text,1,65536,2592000,2592000) ON CONFLICT DO NOTHING`, [pgText(JSON.stringify(s.binding), 3802), pgText(s.contentType), pgText(s.canonicalFinalUrl)])
    }
    const oids = await localArtifactTypeOids(owner), writer = await connect('ot_original_test_writer'), reviewer = await connect('ot_original_test_reviewer'), reader = await connect('ot_original_test_reader'), lifecycle = await connect('ot_original_test_lifecycle')
    let witness = await cursor(reader)
    const review = await reviewCandidate(reviewer, p), reviewC = await reviewCandidate(reviewer, c)
    const counts = async () => owner.query(`SELECT 'provenance' AS store,(SELECT count(*) FROM official_provenance_private.artifact_names)::text AS names,(SELECT count(*) FROM official_provenance_private.artifact_blobs)::text AS blobs,(SELECT count(*) FROM official_provenance_private.artifacts)::text AS artifacts,(SELECT count(*) FROM official_provenance_private.receipts)::text AS receipts,(SELECT count(*) FROM official_provenance_private.receipt_dependencies)::text AS links,(SELECT count(*) FROM official_provenance_private.artifact_dependencies)::text AS edges,(SELECT count(*) FROM official_provenance_private.custody_bindings)::text AS bindings,(SELECT count(*) FROM official_provenance_private.custody_dependencies)::text AS custody
      UNION ALL SELECT 'original',(SELECT count(*) FROM official_original_private.admissions)::text,(SELECT count(*) FROM official_original_private.ciphertexts)::text,(SELECT count(*) FROM official_original_private.originals)::text,(SELECT count(*) FROM official_original_private.reviews)::text,(SELECT count(*) FROM official_original_private.supports)::text,(SELECT count(*) FROM official_original_private.events)::text,(SELECT count(*) FROM official_original_private.rule_bindings)::text,(SELECT sequence FROM official_original_private.head)::text ORDER BY store`)
    const read = async (fp = p.envelope.bundle.recordFingerprint, conn = reader, at = witness, secret = key) => {
      await conn.query('BEGIN ISOLATION LEVEL READ COMMITTED')
      try { const result = await readCandidate(cluster, conn, fp, secret, at); await conn.query('COMMIT'); return result }
      catch (error) { await conn.query('ROLLBACK'); throw error }
    }
    // Independent test lifecycle authority renews only the externally held exact
    // witness, between logical operations. Never re-bootstrap from a database
    // cursor, refresh inside the producer/reader, or retry a rejected operation.
    const checkpoint = async () => {
      await lifecycle.query('SELECT official_original_api.checkpoint($1::bigint,$2::text)', [pgText(witness.sequence, 20), pgText(witness.eventHash)])
    }
    const check = async (name: string, run: () => Promise<void>) => {
      await checkpoint(); phases.clear()
      const at = performance.now()
      try { await context.test(name, run); checks.push(name) }
      finally { context.diagnostic(JSON.stringify({ schema: 'custody-phase-v1', stage: checks.length, atMs: Math.ceil(at - started), elapsedMs: Math.ceil(performance.now() - at),
        phases: [...phases].map(([phase, sample]) => ({ phase, ...sample, sqlStates: [...sample.sqlStates].sort() })) })) }
    }
    await check('atomic failed producer rolls back all eight provenance and all eight vault relations', async () => {
      const before = await counts()
      await writer.query('BEGIN'); await publishIntegratedBundle(writer, oids, p.envelope)
      await assert.rejects(bindCandidate(writer, { ...p, bodies: [Buffer.from('forged synthetic body')] }, review, key, witness, 'create_or_verify'), code('23514'))
      await writer.query('ROLLBACK'); assert.deepEqual(await counts(), before)
      await checkpoint()
      await assert.rejects(persistCandidate(cluster, oids, p, reviewC, key, witness), code('P0002'))
      assert.deepEqual(await counts(), before)
      await checkpoint()
      await assert.rejects(persistCandidate(cluster, oids, p, review, key, witness, 'verify_existing'), LocalPgError)
      assert.deepEqual(await counts(), before)
    })
    await check('protected review and cross-account capabilities are denied with SQLSTATE 42501', async () => {
      await assert.rejects(reviewCandidate(writer, p), code('42501'))
      for (const role of ['anon', 'authenticated', 'service_role', 'ot_original_producer', 'ot_original_reviewer', 'ot_original_reader', 'ot_provenance_bypass_denied']) {
        await owner.query(`SET ROLE ${role}`)
        for (const table of ['originals', 'ciphertexts', 'reviews', 'events']) await assert.rejects(owner.query(`SELECT * FROM official_original_private.${table}`), code('42501'))
        if (['anon', 'authenticated', 'service_role'].includes(role)) await assert.rejects(cursor(owner), code('42501'))
        await owner.query('RESET ROLE')
      }
      for (const account of ['synthetic-account-a', 'synthetic-account-b']) {
        await owner.query('SET ROLE authenticated')
        await owner.query("SELECT set_config('request.jwt.claims',$1::text,false)", [pgText(JSON.stringify({ sub: account, role: 'authenticated' }))])
        await assert.rejects(cursor(owner), code('42501'))
        await owner.query('RESET ROLE')
      }
      await assert.rejects(reviewer.query('SELECT official_original_api.lifecycle($1::text,$2::text,0::bigint,$3::text)', [pgText('withdrawn'), pgText(p.envelope.bundle.recordFingerprint), pgText(witness.eventHash)]), code('42501'))
    })
    await check('whole-body UTF8 boundaries and SQL TypeScript fingerprint V1/V2 parity', async () => {
      const v = verifyLocalIntegratedPilotBundle(p.envelope); assert.ok(v.ok)
      const support = v.value.receipt.payload.supports[0]!
      for (const protocol of [1, 2]) for (const length of [65535, 65536, 65537, 131071, 131072, 131073]) {
        const text = '😀'.repeat(Math.floor(length / 4)) + 'a'.repeat(length % 4), body = Buffer.from(text)
        const s = protocol === 2 ? { ...support, sourceFingerprintProtocol: 2 } : support
        const query = owner.query('SELECT official_original_private.source_hash($1::bytea,$2::jsonb,$3::integer) AS hash', [pgBytes(body), pgText(JSON.stringify(s), 3802), pgText(String(protocol === 1 ? 65536 : 131072), 23)])
        if (length > (protocol === 1 ? 65536 : 131072)) await assert.rejects(query, code('22023'))
        else assert.equal((await query)[0]?.hash, protocol === 1 ? evidenceQuellenFingerprint(text) : officialTruthSourceFingerprintV2(text, { ...(s.binding as Record<string, unknown>), canonicalUrl: s.canonicalFinalUrl, contentType: s.contentType }))
      }
      await assert.rejects(owner.query('SELECT official_original_private.source_hash($1::bytea,$2::jsonb,65536)', [pgBytes(Uint8Array.of(0xc3, 0x28)), pgText(JSON.stringify(support), 3802)]), code('22021'))
      await assert.rejects(owner.query('SELECT official_original_private.source_hash($1::bytea,$2::jsonb,65536)', [pgBytes(Buffer.from('\uFEFFbody')), pgText(JSON.stringify(support), 3802)]), code('22023'))
      assert.throws(() => prepareOriginals(p.envelope, [...p.bodies, p.bodies[0]!]), /support_count/)
      assert.throws(() => prepareOriginals(p.envelope, [new TextEncoder().encode('forged')]), /fingerprint/)
    })
    await check('acknowledged commit fresh-reader full closure and exact encrypted original reproof', async () => {
      const input = structuredClone(p), pending = persistCandidate(cluster, oids, input, review, key, witness)
      input.bodies[0]!.fill(0); input.envelope.bundle.receiptBytes.fill(0)
      const result = await pending; assert.ok(result.ok)
      assert.equal(result.outcome, 'inserted'); assert.equal(result.readback.status, 'synthetic_custody_verified'); witness = result.cursor
      assert.equal((await read()).positiveVisaCells, 0)
      const bytes = await owner.query('SELECT encrypted_bytes::text FROM official_original_private.ciphertexts')
      assert.ok(!bytes[0]!.encrypted_bytes!.includes(Buffer.from(p.bodies[0]!).toString('hex')))
      await checkpoint()
      const before = await counts(), retry = await persistCandidate(cluster, oids, p, review, key, witness, 'verify_existing')
      assert.ok(retry.ok); assert.equal(retry.outcome, 'idempotent'); assert.deepEqual(await counts(), before)
      await assert.rejects(read(undefined, reader, witness, '0'.repeat(64)), code('39000'))
    })
    await check('composed ordered supports commit atomically with exact reviewer packet', async () => {
      const result = await persistCandidate(cluster, oids, c, reviewC, key, witness); assert.ok(result.ok); witness = result.cursor
      assert.equal(result.readback.supports, 2)
      const before = await counts()
      await writer.query('BEGIN'); await assert.rejects(bindCandidate(writer, { ...c, bodies: [...c.bodies].reverse() }, reviewC, key, witness, 'verify_existing'), code('23505')); await writer.query('ROLLBACK')
      assert.deepEqual(await counts(), before)
      await assert.rejects(reviewer.query('SELECT official_original_api.review($1::text,$2::text,$3::jsonb)', [pgText(p.envelope.bundle.recordFingerprint), pgText(`review-packet:v3:${'0'.repeat(64)}`), pgText(JSON.stringify(p.ordered), 3802)]), code('23505'))
    })
    await check('lost commit acknowledgement returns unknown; explicit retry proves durable existing state', async () => {
      const before = await counts(), originalConnect = LocalPgConnection.connect
      LocalPgConnection.connect = async (owned, role) => {
        const connection = await originalConnect(owned, role)
        if (role === 'ot_original_test_writer') {
          const query = connection.query.bind(connection)
          connection.query = async (sql, params) => {
            const result = await query(sql, params)
            if (sql === 'COMMIT') throw new LocalPgError('08006')
            return result
          }
        }
        return connection
      }
      try { assert.deepEqual(await persistCandidate(cluster, oids, p, review, key, witness, 'verify_existing'), { ok: false, reason: 'commit_outcome_unknown' }) }
      finally { LocalPgConnection.connect = originalConnect }
      assert.deepEqual(await counts(), before)
      await checkpoint()
      const resolved = await persistCandidate(cluster, oids, p, review, key, witness, 'verify_existing'); assert.ok(resolved.ok); assert.equal(resolved.outcome, 'idempotent')
    })
    await check('native quota backpressure enforces per-source/day, total items and total live bytes', async () => {
      const v = verifyLocalIntegratedPilotBundle(p.envelope); assert.ok(v.ok)
      const support = v.value.receipt.payload.supports[0]!, params = [pgText(JSON.stringify(support), 3802)]
      await owner.query('SELECT official_original_private.quota($1::jsonb,1)', params)
      for (const [number, perDay, bytes] of [[29, true, false], [253, false, false], [32, false, true]] as const) {
        await owner.query('BEGIN')
        try {
          // Owner-only synthetic capacity fixtures. They never become Rule support.
          await owner.query(`INSERT INTO official_original_private.originals(evidence_version,support,raw_digest,byte_count,captured_at,expires_at,freshness_until,key_id,binding)
            SELECT 'quota-'||n,jsonb_build_object('versionId','quota-'||n),repeat('0',64),${bytes ? 131072 : 1},
              captured_at-${perDay ? "interval '0 days'" : "n*interval '1 day'"},expires_at-${perDay ? "interval '0 days'" : "n*interval '1 day'"},freshness_until-${perDay ? "interval '0 days'" : "n*interval '1 day'"},key_id,binding
            FROM official_original_private.originals CROSS JOIN generate_series(1,${number}) n WHERE evidence_version=$1::text`, [pgText(support.versionId)])
          if (bytes) await owner.query("INSERT INTO official_original_private.ciphertexts SELECT original_pin,decode('00','hex') FROM official_original_private.originals WHERE evidence_version LIKE 'quota-%'")
          const health = await lifecycle.query('SELECT official_original_api.health()::text AS health')
          assert.equal(JSON.parse(health[0]!.health!).stop, false) // uncommitted capacity is private to the owner transaction
          assert.equal(JSON.parse((await owner.query('SELECT official_original_api.health()::text AS health'))[0]!.health!).stop, true)
          await assert.rejects(owner.query('SELECT official_original_private.quota($1::jsonb,1)', params), code('54000'))
        } finally { await owner.query('ROLLBACK') }
      }
      await assert.rejects(owner.query('SELECT official_original_private.quota($1::jsonb,131073)', params), code('22023'))
    })
    await check('history update delete truncate and stale transaction are refused', async () => {
      for (const sql of ['UPDATE official_original_private.events SET kind=kind', 'DELETE FROM official_original_private.events', 'TRUNCATE official_original_private.events']) await assert.rejects(owner.query(sql), code('55000'))
      await reader.query('BEGIN ISOLATION LEVEL REPEATABLE READ')
      await assert.rejects(readCandidate(cluster, reader, p.envelope.bundle.recordFingerprint, key, witness), code('25000')); await reader.query('ROLLBACK')
      await assert.rejects(read(undefined, reader, { sequence: '0', eventHash: '0'.repeat(64) }), code('55000'))
      // Same intact history/bytes, matching witness, valid source and current
      // isolation: advancing only checkpoint age must reject both write and read.
      const before = await counts()
      await owner.query('BEGIN')
      try {
        await owner.query("UPDATE official_original_private.head SET checked_at=clock_timestamp()-interval '61 seconds'")
        const state = await owner.query("SELECT sequence=$1::bigint AND event_hash=$2::text AS witness_matches,checked_at<clock_timestamp()-interval '60 seconds' AS expired FROM official_original_private.head", [pgText(witness.sequence, 20), pgText(witness.eventHash)])
        assert.deepEqual(Object.values(state[0]!), ['t', 't'])
        await assert.rejects(owner.query('SELECT official_original_private.check_head($1::bigint,$2::text)', [pgText(witness.sequence, 20), pgText(witness.eventHash)]), code('55000'))
      } finally { await owner.query('ROLLBACK') }
      for (const operation of ['bind', 'read'] as const) {
        await owner.query('BEGIN')
        try {
          await owner.query("UPDATE official_original_private.head SET checked_at=clock_timestamp()-interval '61 seconds'")
          await assert.rejects(operation === 'bind' ? bindCandidate(owner, p, review, key, witness, 'verify_existing') : readCandidate(cluster, owner, p.envelope.bundle.recordFingerprint, key, witness), code('55000'))
        } finally { await owner.query('ROLLBACK') }
      }
      assert.deepEqual(await counts(), before)
    })
    const corrupt = async (sql: string, expected: string) => {
      const before = await counts()
      await owner.query('BEGIN'); await owner.query(sql)
      try { await assert.rejects(readCandidate(cluster, owner, p.envelope.bundle.recordFingerprint, key, witness), code(expected)) }
      finally { await owner.query('ROLLBACK') }
      assert.deepEqual(await counts(), before)
    }
    await check('missing ciphertext review support event and corrupted encrypted original refuse', async () => {
      await corrupt('DELETE FROM official_original_private.ciphertexts', '55000')
      await corrupt("UPDATE official_original_private.ciphertexts SET encrypted_bytes=decode('00010203','hex')", '39000')
      await corrupt("ALTER TABLE official_original_private.supports DISABLE TRIGGER immutable_rows; DELETE FROM official_original_private.supports;", '55000')
      await corrupt("ALTER TABLE official_original_private.events DISABLE TRIGGER immutable_rows; DELETE FROM official_original_private.events WHERE sequence=1;", '55000')
      await corrupt("ALTER TABLE official_original_private.reviews DISABLE TRIGGER immutable_rows; UPDATE official_original_private.reviews SET packet_key='review-packet:v3:'||repeat('0',64)", '55000')
      await corrupt("UPDATE official_original_private.head SET checked_at=clock_timestamp()-interval '61 seconds'", '55000')
      await corrupt("ALTER TABLE official_original_private.originals DISABLE TRIGGER immutable_rows; UPDATE official_original_private.originals SET expires_at=captured_at+interval '1 second'", '55000')
      await corrupt("ALTER TABLE official_original_private.originals DISABLE TRIGGER immutable_rows; UPDATE official_original_private.originals SET freshness_until=captured_at+interval '1 second'", '55000')
    })
    await check('source profile withdrawal and Rule supersession never rewrite accepted history', async () => {
      for (const [kind, target] of [['source_withdrawn', 'synthetic-pilot-authority'], ['profile_withdrawn', 'synthetic-pilot-whole-response:1'], ['withdrawn', c.envelope.bundle.recordFingerprint], ['superseded', c.envelope.bundle.recordFingerprint]]) {
        const before = await counts()
        await owner.query('BEGIN')
        try {
          await owner.query('SELECT official_original_api.lifecycle($1::text,$2::text,$3::bigint,$4::text)', [pgText(kind!), pgText(target!), pgText(witness.sequence, 20), pgText(witness.eventHash)])
          const next = await cursor(owner)
          await assert.rejects(readCandidate(cluster, owner, c.envelope.bundle.recordFingerprint, key, next), code('55000'))
        } finally { await owner.query('ROLLBACK') }
        assert.deepEqual(await counts(), before)
      }
      // A restored older head, even with a freshly stamped heartbeat, is not the
      // independently held witness. Expired bytes also remain unusable on restore.
      await corrupt("UPDATE official_original_private.head SET sequence=0,event_hash=repeat('0',64),checked_at=clock_timestamp()", '55000')
    })
    await check('reader lifecycle lock orders concurrent revocation and prevents obsolete cursor reuse', async () => {
      await reader.query('BEGIN'); await readCandidate(cluster, reader, p.envelope.bundle.recordFingerprint, key, witness)
      const pending = lifecycle.query('SELECT official_original_api.lifecycle($1::text,$2::text,$3::bigint,$4::text)', [pgText('conflicted'), pgText(p.envelope.bundle.recordFingerprint), pgText(witness.sequence, 20), pgText(witness.eventHash)])
      let waiting = false
      for (let i = 0; i < 100; i++) {
        waiting = (await owner.query("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE usename='ot_original_test_lifecycle' AND wait_event_type='Lock')::text AS waiting"))[0]?.waiting === 'true'
        if (waiting) break
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      assert.equal(waiting, true); await reader.query('COMMIT'); await pending
      const old = witness; witness = await cursor(lifecycle)
      await assert.rejects(read(undefined, reader, old), code('55000')); await assert.rejects(read(), code('55000'))
      await assert.rejects(lifecycle.query('SELECT official_original_api.checkpoint($1::bigint,$2::text)', [pgText(old.sequence, 20), pgText(old.eventHash)]), code('55000'))
    })
    await check('expiry withdraws reliance before disposal; retained metadata and retries cannot resurrect bytes', async () => {
      await owner.query('BEGIN'); await owner.query("ALTER TABLE official_original_private.originals DISABLE TRIGGER immutable_rows; UPDATE official_original_private.originals SET expires_at=captured_at+interval '1 second'; ALTER TABLE official_original_private.originals ENABLE TRIGGER immutable_rows;")
      assert.equal((await owner.query('SELECT official_original_api.expire($1::bigint,$2::text)::text AS count', [pgText(witness.sequence, 20), pgText(witness.eventHash)]))[0]?.count, '3')
      const next = await cursor(owner)
      const events = await owner.query("SELECT kind FROM official_original_private.events WHERE sequence>$1::bigint ORDER BY sequence", [pgText(witness.sequence, 20)])
      assert.equal(events[0]?.kind, 'expired'); assert.ok(events.some(e => e.kind === 'disposed'))
      assert.equal((await owner.query('SELECT count(*)::text AS count FROM official_original_private.ciphertexts'))[0]?.count, '0')
      assert.equal((await owner.query('SELECT count(*)::text AS count FROM official_original_private.originals'))[0]?.count, '3')
      await assert.rejects(bindCandidate(owner, c, reviewC, key, next, 'create_or_verify'), code('55000')); await owner.query('ROLLBACK')
      assert.equal((await read(c.envelope.bundle.recordFingerprint)).supports, 2)
    })
    const legacy = await owner.query('SELECT (SELECT count(*) FROM private.official_evidence_versions)::text AS evidence,(SELECT count(*) FROM private.official_rule_claims)::text AS rules,(SELECT count(*) FROM private.official_source_fingerprint_protocols)::text AS profiles')
    assert.deepEqual(Object.values(legacy[0]!), ['0', '0', '0'])
    context.diagnostic(JSON.stringify({ schema: 'original-custody-m1-m4-local-v1', status: 'PASS', postgres: cluster.version, checks, positiveStructuralAcceptedRead: 'VERIFIED_SYNTHETIC_ONLY', productionAcceptedRead: 'NOT_AUTHORIZED', hostedWrites: 0, realOriginals: 0, positiveVisaCells: 0 }))
  } finally { LocalPgConnection.connect = originalConnect; for (const connection of connections) connection.close(); cluster.stop() }
})
