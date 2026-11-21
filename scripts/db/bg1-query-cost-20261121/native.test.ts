// Mandatory owned PG17, socket-free, real SQL. No credentials, hosted calls,
// skipped cases, changed guard bodies or weakened predecessor assertions.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { compileArtifacts, original, optimized, literal, digest } from './build.mjs'
import { benchmark, createFixture, creator, guard, hash, lineageTables, snapshot } from './native-fixture'

const catalog = `${guard}.catalog_status_v1()`
const assertion = `${guard}.assert_catalog_v1()`
const audit = `${guard}.audit_v1()`
const successor = `${guard}.query_cost_baseline_v1`
// Only local fault injection uses the initdb bootstrap superuser. The generated
// installer, reader, complete assertion and rollback execute as the non-superuser
// postgres owner with BYPASSRLS; hosted Creator permissions still need readback.
const inject = 'SET SESSION AUTHORIZATION ot_pilot_owner; SET LOCAL session_replication_role=replica;'
const restoreOwner = 'SET SESSION AUTHORIZATION postgres;'
const artifacts = compileArtifacts()
const artifact = (name: string): string => {
  const value = artifacts.get(name)
  assert.equal(typeof value, 'string')
  return value as string
}
const functionPins = (pins: Record<string, string>) => `(SELECT jsonb_object_agg(signature,
 encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(signature)),'UTF8')),'hex'))
 FROM unnest(${literal('{' + Object.keys(pins).join(',') + '}')}::text[]) signature)`

test('checked SQL artifacts exactly reproduce the reviewed bounded generator', () => {
  for (const [name, generated] of artifacts) {
    assert.equal(readFileSync(new URL('./' + name, import.meta.url), 'utf8'), generated, name)
  }
  assert.equal(Object.keys(optimized).length, 2)
  assert.ok(!Object.hasOwn(optimized, audit), 'audit body and five-minute scheduler remain unchanged')
})

test('BG1 query-cost: exact JSONB, complete predecessor assertion, atomic install and safe rollback on owned PG17',
  { timeout: 240_000 }, async context => {
    const proof = new OwnedPersistentProof(context.signal)
    const run = (sql: string, label = 'owned BG1 query-cost proof') => proof.run(creator + sql, label)
    const value = <T>(expression: string) => proof.value<T>(expression, creator)
    const refused = async (sql: string, message: RegExp) => {
      const output = await proof.run(creator + sql, 'owned BG1 negative proof', message)
      assert.match(output, message)
    }
    const catalogHash = () => value<string>(`to_jsonb(${hash(catalog)})`)
    const withinRollback = (sql: string) => 'BEGIN;\n' + sql + '\nROLLBACK;'
    try {
      await createFixture(proof)
      assert.deepEqual(await value(functionPins(original)),
        Object.fromEntries(Object.entries(original).map(([name, body]) => [name, digest(body)])))
      const beforeRows = await snapshot(proof)
      const beforeCatalog = await catalogHash()
      const scale = await value<{ keys: number; bytes: number; workMem: string; postgres: string }>(`(
        WITH c AS MATERIALIZED(SELECT ${catalog} AS v)
        SELECT jsonb_build_object('keys',(SELECT count(*) FROM jsonb_each(v)),
          'bytes',octet_length(v::text),'workMem',current_setting('work_mem'),
          'postgres',current_setting('server_version')) FROM c)`)
      assert.match(scale.postgres, /^17\./)
      assert.deepEqual(await value(`(SELECT jsonb_build_object('superuser',rolsuper,'bypassRls',rolbypassrls)
        FROM pg_roles WHERE rolname=current_user)`), { superuser: false, bypassRls: true })
      assert.equal(scale.workMem, '3500kB')
      assert.ok(scale.keys >= 8000 && scale.bytes >= 2_800_000, 'representative wide protected catalog')
      const before = await benchmark(proof, 'original-full-assert')

      await context.test('missing/wrong target and a non-Creator role refuse before any DDL', async () => {
        for (const invalid of [
          'RESET jetnity.bg1_query_cost_target;',
          "SET jetnity.bg1_query_cost_target='owned-wrong-target';",
          'SET SESSION AUTHORIZATION anon;',
        ]) {
          await refused(invalid + artifact('install.sql'), /query-cost fixed target and PG17 Creator context required/)
          assert.equal(await value(`to_jsonb(to_regclass('${successor}') IS NULL)`), true)
        }
        assert.equal(await catalogHash(), beforeCatalog)
        assert.deepEqual(await snapshot(proof), beforeRows)
      })

      await context.test('optimized aggregate preserves exact JSONB and canonical SHA without changing the guard', async () => {
        const comparison = optimized[catalog].replace('FUNCTION ' + catalog, 'FUNCTION public.bg1_native_optimized_catalog()')
        await run(comparison + '; REVOKE ALL ON FUNCTION public.bg1_native_optimized_catalog() FROM PUBLIC;')
        const equality = await value(`(WITH c AS MATERIALIZED(SELECT ${catalog} AS old,public.bg1_native_optimized_catalog() AS next)
          SELECT jsonb_build_object('same',old=next,'sameDigest',${hash('old')}=${hash('next')}) FROM c)`)
        assert.deepEqual(equality, { same: true, sameDigest: true })
        assert.equal(await catalogHash(), beforeCatalog)
      })

      await context.test('legitimate duplicate complete pg_depend rows keep identical JSONB and SHA', async () => {
        const result = await proof.value(`(WITH c AS MATERIALIZED(SELECT ${catalog} AS old,public.bg1_native_optimized_catalog() AS next)
          SELECT jsonb_build_object('same',old=next,'sameDigest',${hash('old')}=${hash('next')},
            'unchanged',${hash('old')}=${literal(beforeCatalog)}) FROM c)`, creator + `BEGIN;
SET SESSION AUTHORIZATION ot_pilot_owner;
INSERT INTO pg_catalog.pg_depend SELECT * FROM pg_catalog.pg_depend
 WHERE classid='pg_proc'::regclass AND objid='official_v3_jobs_private.native_protected_1()'::regprocedure LIMIT 1;
${restoreOwner}`, 'ROLLBACK;')
        assert.deepEqual(result, { same: true, sameDigest: true, unchanged: true })
      })

      await context.test('a conflicting inheritance key is rejected rather than silently selecting one value', async () => {
        await refused(withinRollback(`SET SESSION AUTHORIZATION ot_pilot_owner;
INSERT INTO pg_catalog.pg_inherits(inhrelid,inhparent,inhseqno,inhdetachpending)
SELECT inhrelid,inhparent,inhseqno+100,inhdetachpending FROM pg_catalog.pg_inherits
WHERE inhrelid='official_v3_jobs_private.native_child'::regclass;
${restoreOwner}
SELECT public.bg1_native_optimized_catalog();`), /duplicate JSON object key/)
        assert.equal(await catalogHash(), beforeCatalog)
      })

      await context.test('original lineage corruption is refused before any installation DDL', async () => {
        await refused(withinRollback(`${inject}
UPDATE ${guard}.baselines_v1 SET catalog=catalog||'{"owned-corruption":true}' WHERE component='all';
${restoreOwner}
${artifact('provider-migration-body.sql')}`), /production rolling protected catalog changed/)
        assert.equal(await value(`to_jsonb(to_regclass('${successor}') IS NULL)`), true)
        assert.deepEqual(await snapshot(proof), beforeRows)
      })

      await context.test('a failure at the final install step atomically restores all DDL and predecessor data', async () => {
        const body = artifact('provider-migration-body.sql')
        assert.equal(body.split('END $install$;').length, 2)
        const injected = body.replace('END $install$;', "RAISE EXCEPTION 'owned injected final-step failure';\nEND $install$;")
        await refused(withinRollback(injected), /owned injected final-step failure/)
        assert.equal(await value(`to_jsonb(to_regclass('${successor}') IS NULL)`), true)
        assert.equal(await catalogHash(), beforeCatalog)
        assert.deepEqual(await snapshot(proof), beforeRows)
      })

      await context.test('reviewed install commits only two routine definitions and its new append-only baseline', async () => {
        await run(artifact('install.sql'), 'install exact generated package')
        await run(`SELECT ${assertion};`)
        assert.deepEqual(await snapshot(proof), beforeRows, 'all predecessor, state, latch, cron and Auth rows identical')
        const current = { ...original, ...optimized }
        assert.deepEqual(await value(functionPins(current)),
          Object.fromEntries(Object.entries(current).map(([name, body]) => [name, digest(body)])))
        await refused(withinRollback(`UPDATE ${successor} SET predecessor_catalog_digest=repeat('0',64);`), /bg1 immutable evidence/)
        await refused(artifact('install.sql'), /query-cost successor already exists/)
      })
      await context.test('public runtime roles cannot read the new baseline or execute either private routine', async () => {
        for (const role of ['anon', 'authenticated', 'service_role', 'supabase_read_only_user']) {
          assert.deepEqual(await value(`jsonb_build_object(
            'select',has_table_privilege(${literal(role)},${literal(successor)},'SELECT'),
            'catalog',has_function_privilege(${literal(role)},${literal(catalog)},'EXECUTE'),
            'assert',has_function_privilege(${literal(role)},${literal(assertion)},'EXECUTE'))`),
          { select: false, catalog: false, assert: false })
          for (const query of [`SELECT * FROM ${successor}`, `SELECT ${catalog}`, `SELECT ${assertion}`]) {
            await refused(`SET SESSION AUTHORIZATION ${role}; ${query};`, /permission denied/)
          }
        }
        assert.deepEqual(await snapshot(proof), beforeRows)
      })
      const after = await benchmark(proof, 'optimized-full-assert')
      // These counters are the measured outer full assertion, including nested
      // catalog work. Time is reported, never a flaky pass/fail speed threshold.
      assert.ok(before.tempWrittenBlocks > 0, 'old full assertion must reproduce the catalog sort spill')
      assert.ok(after.tempWrittenBlocks < before.tempWrittenBlocks,
        'optimization must reduce measured full-assert temp writes, without a timing threshold')

      await context.test('all predecessor digest edges and their data remain enforced after optimization', async () => {
        const edges: Record<string, string[]> = {
          baselines_v1: ['predecessor_digest'],
          status_baseline_v1: ['predecessor_catalog_digest', 'predecessor_baselines_digest', 'provider_digest'],
          rolling_quota_baseline_v1: ['predecessor_catalog_digest', 'predecessor_status_digest', 'predecessor_provider_digest'],
          admin_runtime_baseline_v1: ['predecessor_catalog_digest', 'predecessor_rolling_digest', 'predecessor_provider_digest', 'definition_digest'],
          saved_offers_baseline_v1: ['predecessor_catalog_digest', 'predecessor_admin_digest', 'migration_blob', 'approved_delta_digest'],
          weather_quota_baseline_v1: ['predecessor_sha256', 'candidate_sha256'],
          at_source_monitor_baseline_v1: ['predecessor_catalog_digest', 'predecessor_weather_digest'],
          at_batch_switch_baseline_v2: ['predecessor_catalog_digest', 'predecessor_baseline_digest'],
          bg1_transient_baseline_v3: ['predecessor_catalog_digest', 'predecessor_baseline_digest'],
          query_cost_baseline_v1: ['predecessor_catalog_digest', 'predecessor_baseline_digest'],
        }
        for (const [name, columns] of Object.entries(edges)) for (const column of columns) {
          await refused(withinRollback(`${inject}
UPDATE ${guard}.${name} SET ${column}=repeat('0',64);
${restoreOwner}
SELECT ${assertion};`), /production rolling protected catalog changed/)
        }
        for (const name of lineageTables) {
          await refused(withinRollback(`${inject}
UPDATE ${guard}.${name} SET catalog=catalog||'{"owned-corruption":true}';
${restoreOwner}
SELECT ${assertion};`), /production rolling protected catalog changed/)
        }
        await refused(withinRollback(`${inject}
UPDATE official_v3_jobs_private.rolling_policy_v2 SET method_binding='{"changed":true}';
${restoreOwner}
SELECT ${assertion};`), /production rolling protected catalog changed/)
        for (const name of ['at_batch_switch_baseline_v2', 'bg1_transient_baseline_v3']) {
          await refused(withinRollback(`${inject}
UPDATE ${guard}.${name} SET required_generation=1,proof_not_before='2026-10-01T00:00:00Z';
${restoreOwner}
SELECT ${assertion};`), /production rolling protected catalog changed/)
        }
        assert.deepEqual(await snapshot(proof), beforeRows)
      })

      await context.test('body, ACL, configuration, table and new dependency drift fail the assertion and rollback', async () => {
        const changes = [
          'CREATE OR REPLACE FUNCTION official_v3_jobs_private.native_protected_1() RETURNS integer LANGUAGE sql IMMUTABLE AS $$SELECT -1$$;',
          `GRANT EXECUTE ON FUNCTION ${catalog} TO anon;`,
          `ALTER FUNCTION ${catalog} SET work_mem='8MB';`,
          'ALTER TABLE official_v3_jobs_private.native_parent ADD COLUMN drift text;',
          `CREATE VIEW public.bg1_native_unexpected_dependency AS SELECT * FROM ${successor};`,
        ]
        for (const change of changes) {
          await refused(withinRollback(change + `SELECT ${assertion};`), /production rolling protected catalog changed/)
          await refused(withinRollback(change + artifact('rollback-provider-body.sql')),
            /production rolling protected catalog changed|query-cost exact routine predecessor changed/)
        }
        await refused(withinRollback(`CREATE VIEW public.bg1_native_unexpected_dependency AS SELECT * FROM ${successor};
DROP TABLE ${successor} RESTRICT;`), /cannot drop table .* because other objects depend on it/)
        assert.deepEqual(await snapshot(proof), beforeRows)
      })

      await context.test('clean rollback exactly restores catalog, all old definitions and all protected rows', async () => {
        await run(artifact('rollback.sql'), 'exact generated rollback')
        await run(`SELECT ${assertion};`)
        assert.equal(await catalogHash(), beforeCatalog)
        assert.deepEqual(await snapshot(proof), beforeRows)
        assert.equal(await value(`to_jsonb(to_regclass('${successor}') IS NULL)`), true)
      })

      const secondBefore = await benchmark(proof, 'original-full-assert-repeat')
      let secondAfter: Awaited<ReturnType<typeof benchmark>> | undefined
      await context.test('provider transaction body installs the same successor and rolls back cleanly', async () => {
        await run('BEGIN;\n' + artifact('provider-migration-body.sql') + '\nCOMMIT;')
        secondAfter = await benchmark(proof, 'optimized-full-assert-repeat')
        await run('BEGIN;\n' + artifact('rollback-provider-body.sql') + '\nCOMMIT;')
        assert.equal(await catalogHash(), beforeCatalog)
        assert.deepEqual(await snapshot(proof), beforeRows)
      })
      assert.ok(secondAfter)
      assert.ok(secondAfter.tempWrittenBlocks < secondBefore.tempWrittenBlocks,
        'repeat measurement must retain the full-assert temp-write reduction')
      console.log('BG1_QUERY_COST_NATIVE_RECEIPT ' + JSON.stringify({
        schema: 'jetnity.bg1-query-cost.native.v1', fixture: 'synthetic complete assertion lineage; not full Production installer stack',
        scale, before, after, repeat: { before: secondBefore, after: secondAfter },
        elapsedDeltaMs: after.elapsedMs - before.elapsedMs,
        auditDefinitionUnchanged: true, predecessorRowsUnchanged: true, stateCronAuthUnchanged: true,
        installerRole: 'postgres NOSUPERUSER BYPASSRLS; bootstrap superuser only for owned fault injection',
        exactCatalogRoundtrip: true,
      }))
    } finally { await proof.close() }
  })
