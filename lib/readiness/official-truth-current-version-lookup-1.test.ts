import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readdirSync, readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { startLocalProofCluster } from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgBytes, pgText } from '../../scripts/db/official-truth-integrated-pilot-1/pg-wire'
import { installLocalProofSchema, localArtifactTypeOids, publishIntegratedBundle } from '../../scripts/db/official-truth-integrated-pilot-1/storage'
import { runControlledSyntheticPilot } from '../../scripts/official-truth-integrated-pilot-1/controlled-runtime'
import { pilotBody, type PilotItem } from '../../scripts/official-truth-integrated-pilot-1/corpus'
import { bindCandidate, cursor, persistCandidate, prepareOriginals, readCandidate, reviewCandidate, type Cursor } from '../../scripts/db/official-truth-original-custody-1/storage'
import { alternateSameIdentityReceipt, currentSyntheticFixture } from '../../scripts/db/official-truth-current-version-lookup-1/fixtures'
import { lookupCurrentVersion, type CurrentVersionLookupResult, type CurrentVersionRequest } from '../../scripts/db/official-truth-current-version-lookup-1/lookup'
import { provenanceCanonical } from './official-truth-autonomous-provenance-artifact'
import { verifyLocalIntegratedPilotBundle, type LocalIntegratedPilotEnvelope } from './official-truth-integrated-pilot-bundle'
import { regelScopeAusEvidenceScope } from './rule-claims'

const priorMigrations = [
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
const signature = 'official_original_api.lookup_current_version(text,bigint,text,bytea,text,text,bigint,text)'

function requestFrom(envelope: LocalIntegratedPilotEnvelope): CurrentVersionRequest {
  const verified = verifyLocalIntegratedPilotBundle(envelope)
  assert.ok(verified.ok)
  return {
    definition: verified.value.receipt.payload.globalCell.definition,
    scope: verified.value.receipt.payload.globalCell.scope,
    factKind: verified.value.receipt.payload.candidate.factKind,
    requirementType: verified.value.receipt.payload.candidate.requirementType,
  }
}

test('current-version lookup resolves one retained synthetic receipt on native PostgreSQL 16', { timeout: 300_000 }, async t => {
  const lookupMigrations = readdirSync(new URL('../../supabase/migrations/', import.meta.url)).filter(name => name.endsWith('_official_truth_current_version_lookup_1.sql')).sort()
  assert.deepEqual(lookupMigrations, ['20261023153726_official_truth_current_version_lookup_1.sql'])
  const lookupSql = readFileSync(new URL(`../../supabase/migrations/${lookupMigrations[0]}`, import.meta.url), 'utf8')
  assert.match(lookupSql, /LOCAL \/ UNAPPLIED/)
  assert.equal(/CREATE TABLE/i.test(lookupSql), false)
  assert.equal(/CREATE ROLE/i.test(lookupSql), false)
  assert.equal(/decrypt_original/.test(lookupSql), false)
  assert.equal(/\bLIMIT\b/.test(lookupSql), false)
  assert.match(lookupSql, /GRANT EXECUTE ON FUNCTION official_original_api\.lookup_current_version/)
  const provider = readFileSync(new URL('./provider.ts', import.meta.url), 'utf8')
  assert.match(provider, /export function requirementsProviderAus\(\)[\s\S]*return null/)
  const primary = await runControlledSyntheticPilot('primary'), composed = await runControlledSyntheticPilot('composed')
  assert.equal(primary.status, 'synthetic_bundle_verified')
  assert.equal(composed.status, 'synthetic_bundle_verified')
  const origin = Math.floor((Date.now() - 120_000) / 1000) * 1000
  const primaryEnvelope = currentSyntheticFixture(primary.envelope, origin)
  const versionTwoEnvelope = alternateSameIdentityReceipt(primaryEnvelope)
  const composedEnvelope = currentSyntheticFixture(composed.envelope, origin)
  assert.notEqual(versionTwoEnvelope.bundle.recordFingerprint, primaryEnvelope.bundle.recordFingerprint)
  const originals = (envelope: LocalIntegratedPilotEnvelope) => {
    const verified = verifyLocalIntegratedPilotBundle(envelope)
    assert.ok(verified.ok)
    return prepareOriginals(envelope, verified.value.receipt.payload.supports.map(support => Buffer.from(pilotBody((support.binding as { contentItemId: PilotItem }).contentItemId))))
  }
  const first = originals(primaryEnvelope), second = originals(versionTwoEnvelope), other = originals(composedEnvelope)
  const primaryRequest = requestFrom(first.envelope), secondIdentity = requestFrom(second.envelope), otherRequest = requestFrom(other.envelope)
  assert.equal(primaryRequest.factKind, 'requirement_effect')
  assert.equal(primaryRequest.requirementType, 'visa')
  assert.deepEqual(primaryRequest.definition, secondIdentity.definition)
  assert.equal(primaryRequest.factKind, secondIdentity.factKind)
  assert.equal(primaryRequest.requirementType, secondIdentity.requirementType)
  assert.notEqual(primaryRequest.definition && (primaryRequest.definition as { digest: string }).digest, (otherRequest.definition as { digest: string }).digest)
  const cluster = startLocalProofCluster(), connections: LocalPgConnection[] = [], checks: string[] = []
  const connect = async (role?: string) => { const connection = await LocalPgConnection.connect(cluster, role); connections.push(connection); return connection }
  const owner = await connect()
  const key = randomBytes(32).toString('hex')
  const note = (name: string) => { checks.push(name) }
  try {
    assert.match(cluster.version, /^postgres \(PostgreSQL\) 16\./)
    await owner.query('CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions; CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;')
    await installLocalProofSchema(owner)
    for (const name of priorMigrations) await owner.query(readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8'))
    const relations = async () => (await owner.query(`SELECT n.nspname||'.'||c.relname||':'||c.relkind::text AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname LIKE 'official_%' AND c.relkind IN ('r','p','v','m') ORDER BY 1`)).map(row => row.name)
    const roles = async () => (await owner.query(`SELECT rolname FROM pg_roles WHERE rolname LIKE 'ot_%' OR rolname IN ('anon','authenticated','service_role') ORDER BY 1`)).map(row => row.rolname)
    const beforeRelations = await relations(), beforeRoles = await roles()
    await owner.query(lookupSql)
    assert.deepEqual(await relations(), beforeRelations)
    assert.deepEqual(await roles(), beforeRoles)
    note('lookup migration adds no table, view or role')
    await owner.query(`CREATE ROLE ot_original_test_writer LOGIN; GRANT ot_original_producer,ot_provenance_writer TO ot_original_test_writer;
      CREATE ROLE ot_original_test_reader LOGIN; GRANT ot_original_reader,ot_provenance_reader TO ot_original_test_reader;
      CREATE ROLE ot_original_test_reviewer LOGIN; GRANT ot_original_reviewer TO ot_original_test_reviewer;
      CREATE ROLE ot_original_test_lifecycle LOGIN; GRANT ot_original_lifecycle TO ot_original_test_lifecycle;`)
    for (const prepared of [first, second, other]) {
      const verified = verifyLocalIntegratedPilotBundle(prepared.envelope)
      assert.ok(verified.ok)
      for (const support of verified.value.receipt.payload.supports) await owner.query('INSERT INTO official_original_private.admissions VALUES($1::jsonb,$2::text,$3::text,1,65536,2592000,2592000) ON CONFLICT DO NOTHING', [pgText(JSON.stringify(support.binding), 3802), pgText(support.contentType), pgText(support.canonicalFinalUrl)])
    }
    const oids = await localArtifactTypeOids(owner)
    const writer = await connect('ot_original_test_writer'), reader = await connect('ot_original_test_reader'), reviewer = await connect('ot_original_test_reviewer'), lifecycle = await connect('ot_original_test_lifecycle')
    const readerPid = (await reader.query('SELECT pg_backend_pid()::text AS pid'))[0]?.pid
    const writerPid = (await writer.query('SELECT pg_backend_pid()::text AS pid'))[0]?.pid
    assert.notEqual(readerPid, writerPid)
    note('reader and writer use separate backends')
    const privileges = await owner.query(`SELECT r.rolname, has_function_privilege(r.oid, '${signature}', 'EXECUTE')::text AS allowed FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role','ot_original_producer','ot_original_reviewer','ot_original_reader','ot_original_lifecycle') ORDER BY 1`)
    assert.deepEqual(privileges.map(row => [row.rolname, row.allowed]), [
      ['anon', 'false'], ['authenticated', 'false'], ['ot_original_lifecycle', 'false'], ['ot_original_producer', 'false'], ['ot_original_reader', 'true'], ['ot_original_reviewer', 'false'], ['service_role', 'false'],
    ])
    assert.equal((await owner.query(`SELECT has_function_privilege('public', '${signature}', 'EXECUTE')::text AS allowed`))[0]?.allowed, 'false')
    const definition = await owner.query(`SELECT prosecdef::text AS definer, provolatile, proconfig::text AS config, pg_get_functiondef(p.oid) AS body FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='official_original_api' AND p.proname='lookup_current_version'`)
    assert.equal(definition[0]?.definer, 'true')
    assert.equal(definition[0]?.provolatile, 'v')
    assert.match(definition[0]?.config ?? '', /search_path=/)
    assert.match(definition[0]?.config ?? '', /timezone=UTC/)
    assert.match(definition[0]?.config ?? '', /statement_timeout=20s/)
    assert.equal(/\bLIMIT\b/.test(definition[0]?.body ?? ''), false)
    assert.equal(/decrypt_original/.test(definition[0]?.body ?? ''), false)
    note('execute grant is reader-only and the function keeps the existing ceilings')
    for (const role of ['anon', 'authenticated', 'service_role', 'ot_original_producer', 'ot_original_reviewer', 'ot_original_lifecycle']) {
      await owner.query('BEGIN'); await owner.query(`SET LOCAL ROLE ${role}`)
      await assert.rejects(owner.query(`SELECT outcome FROM ${signature.split('(')[0]}(NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL)`), code('42501'))
      await owner.query('ROLLBACK')
    }
    await assert.rejects(reader.query('SELECT count(*) FROM official_original_private.events'), code('42501'))
    await assert.rejects(reader.query('SELECT count(*) FROM official_original_private.ciphertexts'), code('42501'))
    await assert.rejects(reader.query('SELECT count(*) FROM official_provenance_private.receipts'), code('42501'))
    note('application roles and direct private reads are denied')
    let witness = await cursor(reader)
    await lifecycle.query('SELECT official_original_api.checkpoint($1::bigint,$2::text)', [pgText(witness.sequence, 20), pgText(witness.eventHash)])
    const align = async (next: Cursor) => { await lifecycle.query('SELECT official_original_api.checkpoint($1::bigint,$2::text)', [pgText(next.sequence, 20), pgText(next.eventHash)]); return next }
    const openLookup = async (request: CurrentVersionRequest, at = witness, connection = reader) => {
      await connection.query('BEGIN ISOLATION LEVEL READ COMMITTED')
      try {
        const result = await lookupCurrentVersion(cluster, connection, request, key, at)
        await connection.query('COMMIT')
        return result
      } catch (error) {
        try { await connection.query('ROLLBACK') } catch { /* The failed transaction still has to end. */ }
        throw error
      }
    }
    const empty = await openLookup(primaryRequest)
    assert.equal(empty.status, 'no_match')
    assert.equal(empty.acceptedCount, 0)
    assert.equal(empty.productionAcceptedRead, 'NOT_AUTHORIZED')
    assert.equal(empty.positiveVisaCells, 0)
    assert.equal(empty.reusablePositiveCache, false)
    note('empty accepted corpus is no_match')
    const review = await reviewCandidate(reviewer, first)
    const reviewedOnly = await openLookup(primaryRequest)
    assert.equal(reviewedOnly.status, 'no_match')
    note('unpublished review is not a current candidate')
    await writer.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    assert.equal(await publishIntegratedBundle(writer, oids, other.envelope), 'inserted')
    await writer.query('COMMIT')
    assert.equal((await openLookup(otherRequest)).status, 'no_match')
    note('unbound provenance receipt is outside the accepted set')
    await assert.rejects(lookupCurrentVersion(cluster, reader, { ...primaryRequest, factKind: 'made_up' }, key, witness), /identity_request_invalid/)
    await assert.rejects(lookupCurrentVersion(cluster, reader, { ...primaryRequest, requirementType: 'passport' }, key, witness), /identity_request_invalid/)
    const scopeRead = regelScopeAusEvidenceScope(primaryRequest.scope)
    assert.ok(scopeRead.ok)
    await reader.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    await assert.rejects(reader.query(`SELECT outcome FROM official_original_api.lookup_current_version($1::text,$2::bigint,$3::text,$4::bytea,$5::text,$6::text,$7::bigint,$8::text)`, [pgText((primaryRequest.definition as { id: string }).id), pgText(String((primaryRequest.definition as { version: number }).version), 20), pgText((primaryRequest.definition as { digest: string }).digest), pgBytes(Buffer.from(provenanceCanonical(scopeRead.scope)!)), pgText('requirement_effect'), pgText('passport'), pgText(witness.sequence, 20), pgText(witness.eventHash)]), code('22023'))
    await reader.query('ROLLBACK')
    await reader.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    await assert.rejects(lookupCurrentVersion(cluster, reader, primaryRequest, key, witness), code('25000'))
    await reader.query('ROLLBACK')
    note('invalid identity and non-current snapshots refuse before a result')
    const persisted = await persistCandidate(cluster, oids, first, review, key, witness)
    assert.equal(persisted.ok, true)
    if (!persisted.ok) throw new Error('persist_failed')
    witness = await align(persisted.cursor)
    const matched = await openLookup(primaryRequest)
    assert.equal(matched.status, 'synthetic_current_version_verified')
    if (matched.status !== 'synthetic_current_version_verified') throw new Error('match_required')
    assert.equal(matched.recordFingerprint, first.envelope.bundle.recordFingerprint)
    assert.equal(matched.proof.status, 'synthetic_custody_verified')
    assert.equal(matched.proof.productionAcceptedRead, 'NOT_AUTHORIZED')
    assert.equal(matched.proof.positiveVisaCells, 0)
    assert.equal(matched.matchCount, 1)
    assert.equal(JSON.stringify(matched).includes('original_bytes'), false)
    assert.equal(JSON.stringify(matched).includes(key), false)
    const tainted = { ...primaryRequest, fingerprint: `ot-provenance-v1:${'ab'.repeat(32)}` }
    const ignored = await openLookup(tainted)
    assert.equal(ignored.status, 'synthetic_current_version_verified')
    if (ignored.status === 'synthetic_current_version_verified') assert.notEqual(ignored.recordFingerprint, tainted.fingerprint)
    const wrongPin = { ...primaryRequest, definition: { ...(primaryRequest.definition as { id: string; version: number; digest: string }), digest: (primaryRequest.definition as { digest: string }).digest.endsWith('a') ? `${(primaryRequest.definition as { digest: string }).digest.slice(0, -1)}b` : `${(primaryRequest.definition as { digest: string }).digest.slice(0, -1)}a` } }
    const wrongScopeValue = structuredClone(primaryRequest.scope) as { destinationCountryCode: string | null; transitCountryCode: string | null }
    if (wrongScopeValue.destinationCountryCode) wrongScopeValue.destinationCountryCode = wrongScopeValue.destinationCountryCode === 'DE' ? 'FR' : 'DE'
    else wrongScopeValue.transitCountryCode = wrongScopeValue.transitCountryCode === 'DE' ? 'FR' : 'DE'
    const wrongRequirementScope = structuredClone(primaryRequest.scope) as { requirementType: string }
    wrongRequirementScope.requirementType = 'passport'
    for (const [label, request] of [
      ['wrong pin', wrongPin],
      ['wrong scope', { ...primaryRequest, scope: wrongScopeValue }],
      ['wrong fact kind', { ...primaryRequest, factKind: 'passport_validity' }],
      ['wrong requirement type', { ...primaryRequest, scope: wrongRequirementScope, requirementType: 'passport' }],
      ['other cell', otherRequest],
    ] as const) {
      const missed = await openLookup(request)
      assert.equal(missed.status, 'no_match', label)
    }
    const fresh = await connect('ot_original_test_reader')
    assert.notEqual((await fresh.query('SELECT pg_backend_pid()::text AS pid'))[0]?.pid, readerPid)
    const persistedRead = await openLookup(primaryRequest, witness, fresh)
    assert.equal(persistedRead.status, 'synthetic_current_version_verified')
    if (persistedRead.status === 'synthetic_current_version_verified') assert.equal(persistedRead.recordFingerprint, first.envelope.bundle.recordFingerprint)
    note('exact cell and fact match survives a new connection; wrong identity is no_match')
    const reviewTwo = await reviewCandidate(reviewer, second)
    const persistedTwo = await persistCandidate(cluster, oids, second, reviewTwo, key, witness)
    assert.equal(persistedTwo.ok, true)
    if (!persistedTwo.ok) throw new Error('persist_v2_failed')
    witness = await align(persistedTwo.cursor)
    const ambiguous = await openLookup(primaryRequest)
    assert.equal(ambiguous.status, 'ambiguous')
    if (ambiguous.status !== 'ambiguous') throw new Error('ambiguity_required')
    assert.equal(ambiguous.matchCount, 2)
    assert.equal(JSON.stringify(ambiguous).includes(second.envelope.bundle.recordFingerprint), false)
    note('two active receipts for one identity stay ambiguous')
    const refuseInTransaction = async (statement: string, params: ReturnType<typeof pgText>[] | undefined, reason: CurrentVersionLookupResult extends infer R ? R extends { status: 'refused'; reason: infer X } ? X : never : never) => {
      await owner.query('BEGIN')
      try {
        await owner.query(statement, params)
        const seen = await cursor(owner)
        const result = await lookupCurrentVersion(cluster, owner, primaryRequest, key, seen)
        assert.equal(result.status, 'refused')
        if (result.status === 'refused') assert.equal(result.reason, reason)
        assert.equal(JSON.stringify(result).includes(second.envelope.bundle.recordFingerprint), false)
      } finally { await owner.query('ROLLBACK') }
      await align(witness)
    }
    await refuseInTransaction(`DO $$ DECLARE c record; BEGIN
      FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='official_provenance_private.receipts'::regclass AND contype='c' LOOP
        EXECUTE format('ALTER TABLE official_provenance_private.receipts DROP CONSTRAINT %I', c.conname);
      END LOOP; END $$; ALTER TABLE official_provenance_private.receipts DISABLE TRIGGER USER; UPDATE official_provenance_private.receipts SET canonical_payload_bytes=convert_to('{}','UTF8') WHERE record_fingerprint=$1`, [pgText(second.envelope.bundle.recordFingerprint)], 'accepted_corpus_unclassifiable')
    await refuseInTransaction(`SELECT official_original_private.append_event('accepted', $1)`, [pgText(first.envelope.bundle.recordFingerprint)], 'accepted_corpus_incomplete')
    await refuseInTransaction(`INSERT INTO official_original_private.reviews(fingerprint,packet_key,ordered_supports) VALUES('ot-provenance-v1:'||repeat('ab',32),'review-packet:v3:'||repeat('cd',32),'[]'::jsonb); INSERT INTO official_original_private.rule_bindings(fingerprint,review_id) SELECT fingerprint,review_id FROM official_original_private.reviews WHERE fingerprint='ot-provenance-v1:'||repeat('ab',32)`, undefined, 'accepted_corpus_incomplete')
    await refuseInTransaction(`SELECT official_original_private.append_event('accepted','ot-provenance-v1:'||repeat('ef',32))`, undefined, 'accepted_corpus_incomplete')
    await refuseInTransaction(`SELECT official_original_private.append_event('accepted','not-a-fingerprint')`, undefined, 'accepted_corpus_incomplete')
    await owner.query('BEGIN')
    await owner.query(`ALTER TABLE official_original_private.rule_bindings DISABLE TRIGGER USER; INSERT INTO official_original_private.reviews(fingerprint,packet_key,ordered_supports) VALUES('ot-provenance-v1:'||repeat('12',32),'review-packet:v3:'||repeat('34',32),'[]'::jsonb); UPDATE official_original_private.rule_bindings SET review_id=(SELECT review_id FROM official_original_private.reviews WHERE fingerprint='ot-provenance-v1:'||repeat('12',32)) WHERE fingerprint=$1`, [pgText(first.envelope.bundle.recordFingerprint)])
    const mismatched = await lookupCurrentVersion(cluster, owner, primaryRequest, key, await cursor(owner))
    assert.equal(mismatched.status, 'refused')
    if (mismatched.status === 'refused') assert.equal(mismatched.reason, 'accepted_corpus_incomplete')
    await owner.query('ROLLBACK'); await align(witness)
    const stillAmbiguous = await openLookup(primaryRequest)
    assert.equal(stillAmbiguous.status, 'ambiguous')
    note('damaged, duplicate, orphan, missing and mismatched competitors refuse the whole lookup')
    await owner.query('BEGIN')
    await owner.query(`INSERT INTO official_original_private.reviews(fingerprint,packet_key,ordered_supports) SELECT 'ot-provenance-v1:'||encode(sha256(('ceiling-'||g::text)::bytea),'hex'), 'review-packet:v3:'||encode(sha256(('packet-'||g::text)::bytea),'hex'), '[]'::jsonb FROM generate_series(1,(SELECT 1024-count(*) FROM official_original_private.reviews)) g`)
    assert.equal((await owner.query('SELECT count(*)::text AS n FROM official_original_private.reviews'))[0]?.n, '1024')
    const atCeiling = await lookupCurrentVersion(cluster, owner, primaryRequest, key, witness)
    assert.equal(atCeiling.status, 'ambiguous')
    await owner.query('ROLLBACK'); await align(witness)
    await refuseInTransaction(`INSERT INTO official_original_private.reviews(fingerprint,packet_key,ordered_supports) SELECT 'ot-provenance-v1:'||encode(sha256(('overflow-'||g::text)::bytea),'hex'), 'review-packet:v3:'||encode(sha256(('packet-overflow-'||g::text)::bytea),'hex'), '[]'::jsonb FROM generate_series(1,(SELECT 1025-count(*) FROM official_original_private.reviews)) g`, undefined, 'lookup_budget_count')
    await refuseInTransaction(`DO $$ DECLARE n integer; i integer; BEGIN
      SELECT 1025-count(*) INTO n FROM official_original_private.events WHERE kind='accepted';
      FOR i IN 1..n LOOP PERFORM official_original_private.append_event('accepted','budget-'||i::text); END LOOP; END $$`, undefined, 'lookup_budget_count')
    await refuseInTransaction(`INSERT INTO official_provenance_private.receipts(record_fingerprint,canonical_payload_bytes,storage_contract_version,receipt_schema,receipt_schema_version,canonicalization)
      SELECT 'ot-provenance-v1:'||encode(sha256(convert_to('ot-provenance-v1'||chr(10),'UTF8')||payload),'hex'), payload, 2, 'official-truth-autonomous-provenance', 1, 'ot-provenance-json-v1'
      FROM (SELECT convert_to(lpad(g::text,10,'0'),'UTF8')||repeat('y',262134)::bytea AS payload FROM generate_series(1,33) g) q;
      INSERT INTO official_original_private.reviews(fingerprint,packet_key,ordered_supports)
      SELECT record_fingerprint, 'review-packet:v3:'||encode(sha256(convert_to(record_fingerprint,'UTF8')),'hex'), '[]'::jsonb
      FROM official_provenance_private.receipts WHERE octet_length(canonical_payload_bytes)=262144;
      INSERT INTO official_original_private.rule_bindings(fingerprint,review_id)
      SELECT r.fingerprint, r.review_id FROM official_original_private.reviews r
      WHERE octet_length(convert_to(r.fingerprint,'UTF8'))=81 AND NOT EXISTS (SELECT 1 FROM official_original_private.rule_bindings b WHERE b.fingerprint=r.fingerprint);
      DO $$ DECLARE fp text; BEGIN
        FOR fp IN SELECT record_fingerprint FROM official_provenance_private.receipts WHERE octet_length(canonical_payload_bytes)=262144 ORDER BY 1 LOOP
          PERFORM official_original_private.append_event('accepted', fp);
        END LOOP; END $$`, undefined, 'lookup_budget_bytes')
    await refuseInTransaction(`DO $$ DECLARE c record; BEGIN FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='official_provenance_private.receipts'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%262144%' LOOP EXECUTE format('ALTER TABLE official_provenance_private.receipts DROP CONSTRAINT %I', c.conname); END LOOP; END $$;
      INSERT INTO official_provenance_private.receipts(record_fingerprint,canonical_payload_bytes,storage_contract_version,receipt_schema,receipt_schema_version,canonicalization)
      SELECT 'ot-provenance-v1:'||encode(sha256(convert_to('ot-provenance-v1'||chr(10),'UTF8')||payload),'hex'), payload, 2, 'official-truth-autonomous-provenance', 1, 'ot-provenance-json-v1'
      FROM (SELECT repeat('z',262145)::bytea AS payload) q;
      INSERT INTO official_original_private.reviews(fingerprint,packet_key,ordered_supports)
      SELECT record_fingerprint, 'review-packet:v3:'||repeat('ab',32), '[]'::jsonb
      FROM official_provenance_private.receipts WHERE octet_length(canonical_payload_bytes)=262145;
      INSERT INTO official_original_private.rule_bindings(fingerprint,review_id)
      SELECT r.fingerprint, r.review_id FROM official_original_private.reviews r
      WHERE r.packet_key='review-packet:v3:'||repeat('ab',32);
      SELECT official_original_private.append_event('accepted', record_fingerprint) FROM official_provenance_private.receipts WHERE octet_length(canonical_payload_bytes)=262145`, undefined, 'lookup_budget_receipt')
    assert.equal((await openLookup(primaryRequest)).status, 'ambiguous')
    note('count, aggregate and per-receipt bounds refuse without a truncated match')
    await lifecycle.query('BEGIN')
    await lifecycle.query('SELECT official_original_api.lifecycle($1::text,$2::text,$3::bigint,$4::text)', [pgText('superseded'), pgText(first.envelope.bundle.recordFingerprint), pgText(witness.sequence, 20), pgText(witness.eventHash)])
    await lifecycle.query('COMMIT')
    witness = await align(await cursor(reader))
    const current = await openLookup(primaryRequest, witness, await connect('ot_original_test_reader'))
    assert.equal(current.status, 'synthetic_current_version_verified')
    if (current.status !== 'synthetic_current_version_verified') throw new Error('v2_required')
    assert.equal(current.recordFingerprint, second.envelope.bundle.recordFingerprint)
    await reader.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    await assert.rejects(readCandidate(cluster, reader, first.envelope.bundle.recordFingerprint, key, witness), code('55000'))
    await reader.query('ROLLBACK')
    note('explicit supersession leaves the second receipt as the only current version')
    await owner.query('BEGIN')
    await owner.query('SELECT official_original_api.lifecycle($1::text,$2::text,$3::bigint,$4::text)', [pgText('source_withdrawn'), pgText('synthetic-pilot-authority'), pgText(witness.sequence, 20), pgText(witness.eventHash)])
    await assert.rejects(lookupCurrentVersion(cluster, owner, primaryRequest, key, await cursor(owner)), code('55000'))
    await owner.query('ROLLBACK'); await align(witness)
    await owner.query('BEGIN')
    await owner.query('SELECT official_original_api.lifecycle($1::text,$2::text,$3::bigint,$4::text)', [pgText('profile_withdrawn'), pgText('synthetic-pilot-whole-response:1'), pgText(witness.sequence, 20), pgText(witness.eventHash)])
    await assert.rejects(lookupCurrentVersion(cluster, owner, primaryRequest, key, await cursor(owner)), code('55000'))
    await owner.query('ROLLBACK'); await align(witness)
    await owner.query('BEGIN')
    await owner.query(`ALTER TABLE official_original_private.originals DISABLE TRIGGER USER; UPDATE official_original_private.originals SET expires_at=captured_at+interval '1 second'`)
    await owner.query('SELECT official_original_api.expire($1::bigint,$2::text)', [pgText(witness.sequence, 20), pgText(witness.eventHash)])
    const expired = await lookupCurrentVersion(cluster, owner, primaryRequest, key, await cursor(owner))
    assert.equal(expired.status, 'no_match')
    await owner.query('ROLLBACK'); await align(witness)
    assert.equal((await openLookup(primaryRequest)).status, 'synthetic_current_version_verified')
    await assert.rejects(openLookup(primaryRequest, { sequence: '0', eventHash: '0'.repeat(64) }), code('55000'))
    await owner.query('BEGIN')
    await owner.query(`UPDATE official_original_private.head SET sequence=0, event_hash=repeat('0',64), checked_at=clock_timestamp()`)
    await assert.rejects(lookupCurrentVersion(cluster, owner, primaryRequest, key, witness), code('55000'))
    await owner.query('ROLLBACK'); await align(witness)
    note('source, profile, expiry, stale witness and restored head do not yield a fresh positive')
    const reviewOther = await reviewCandidate(reviewer, other)
    await writer.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    assert.equal(await publishIntegratedBundle(writer, oids, other.envelope, 'verify_existing'), 'idempotent')
    await bindCandidate(writer, other, reviewOther, key, witness, 'create_or_verify')
    await reader.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    const blockedLookup = lookupCurrentVersion(cluster, reader, otherRequest, key, witness)
    let publicationWaiting = false
    for (let attempt = 0; attempt < 100; attempt++) {
      publicationWaiting = (await owner.query(`SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE usename='ot_original_test_reader' AND wait_event_type='Lock')::text AS waiting`))[0]?.waiting === 'true'
      if (publicationWaiting) break
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    assert.equal(publicationWaiting, true)
    await writer.query('COMMIT')
    await assert.rejects(blockedLookup, code('55000'))
    await reader.query('ROLLBACK')
    witness = await align(await cursor(lifecycle))
    const published = await openLookup(otherRequest)
    assert.equal(published.status, 'synthetic_current_version_verified')
    if (published.status === 'synthetic_current_version_verified') assert.equal(published.recordFingerprint, other.envelope.bundle.recordFingerprint)
    note('publication waits for the lifecycle lock and a stale witness cannot observe it as current')
    await reader.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    const held = await lookupCurrentVersion(cluster, reader, primaryRequest, key, witness)
    assert.equal(held.status, 'synthetic_current_version_verified')
    if (held.status !== 'synthetic_current_version_verified') throw new Error('held_required')
    const withdrawal = lifecycle.query('SELECT official_original_api.lifecycle($1::text,$2::text,$3::bigint,$4::text)', [pgText('withdrawn'), pgText(second.envelope.bundle.recordFingerprint), pgText(witness.sequence, 20), pgText(witness.eventHash)])
    let withdrawalWaiting = false
    for (let attempt = 0; attempt < 100; attempt++) {
      withdrawalWaiting = (await owner.query(`SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE usename='ot_original_test_lifecycle' AND wait_event_type='Lock')::text AS waiting`))[0]?.waiting === 'true'
      if (withdrawalWaiting) break
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    assert.equal(withdrawalWaiting, true)
    await reader.query('COMMIT')
    await withdrawal
    const afterWithdrawal = await align(await cursor(reader))
    const gone = await openLookup(primaryRequest, afterWithdrawal)
    assert.equal(gone.status, 'no_match')
    assert.notEqual(gone.status, held.status)
    note('withdrawal waits for the guarded proof and the earlier positive is not reusable')
    const legacy = await owner.query('SELECT (SELECT count(*) FROM private.official_evidence_versions)::text AS evidence,(SELECT count(*) FROM private.official_rule_claims)::text AS rules')
    assert.deepEqual(Object.values(legacy[0]!), ['0', '0'])
    note('legacy accepted-claim tables stay empty')
    t.diagnostic(JSON.stringify({ schema: 'official-truth-current-version-lookup-1', status: 'PASS', postgres: cluster.version, checks, productionAcceptedRead: 'NOT_AUTHORIZED', positiveVisaCells: 0, hostedWrites: 0 }))
  } finally {
    for (const connection of connections) connection.close()
    cluster.stop()
  }
})
