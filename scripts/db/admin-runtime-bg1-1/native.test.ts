// Owned socket-free PG17 proof. Never connects to hosted Dev/Production. The real
// predecessor validators and next real BG1 due slots are used without rewinding
// proof timestamps, rewriting old evidence, or faking the installed Guard.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { literal, json } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { prepareCycle4Attempt2RecoveryFixture } from '../official-truth-v3-dev-cycle4-attempt2-recovery-1/history-fixture'
import { awaitNextBg1 } from '../official-truth-v3-dev-cycle4-attempt2-recovery-1/await-next-bg1'
import { BASELINE as PREDECESSOR_BASELINE } from '../official-truth-v3-dev-cycle4-attempt2-recovery-1/build.mjs'
import { INSPIRATION_ZIELE } from '../../../lib/places/inspiration'
import { ENTDECKEN_ZIELE } from '../../../lib/inspiration/explorer-1/katalog'
import { compileAdminRuntimeInstallation, BASELINE } from './build.mjs'
import { functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'

const creator = "SET SESSION AUTHORIZATION postgres;SET search_path=pg_catalog;SET statement_timeout='30s';"
const uid = (n: number) => n.toString(16).padStart(8, '0') + '-1111-4111-8111-' + n.toString(16).padStart(12, '0')
const human = (aal = 'aal2') => 'SET SESSION AUTHORIZATION authenticated;SET search_path=pg_catalog;'
  + "SELECT set_config('request.jwt.claims'," + literal(JSON.stringify({ sub: uid(1), session_id: uid(201),
    role: 'authenticated', aal, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) - 10 })) + ',false);'
const entryId = INSPIRATION_ZIELE[0]!.placeId
const entryRead = 'public.admin_cms_inspiration_read_v1(' + literal(entryId) + ',NULL,NULL,20)'
const marketingRead = "public.admin_marketing_drafts_read_v1('{\"schemaVersion\":1,\"action\":\"list\"}'::jsonb)"
const countRead = '(SELECT to_jsonb(c) FROM public.admin_account_counts_v1() c)'
const rowsDigest = (table: string) => `(SELECT jsonb_build_object('count',count(*),'digest',encode(sha256(convert_to(COALESCE(
  string_agg(encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex'),'' ORDER BY to_jsonb(r)::text COLLATE "C"),''),'UTF8')),'hex')) FROM ${table} r)`

test('atomic Admin installation preserves real BG1, enforces the new proof and protects all three stores',
  // At most three genuine five-minute cadence boundaries plus bounded setup.
  { timeout: 1_200_000 }, async t => {
    const proof = new OwnedPersistentProof(t.signal)
    const compiled = compileAdminRuntimeInstallation()
    assert.equal(readFileSync(new URL('./provider-migration-body.sql', import.meta.url), 'utf8'), compiled.migration)
    const refuses = async (sql: string, message: RegExp) => {
      const output = await proof.run(sql, 'bounded Admin negative proof', new RegExp(message.source + '|current transaction is aborted'))
      assert.match(output, message, 'the intended original refusal must precede transaction-aborted follow-ups')
    }
    try {
      // Compile the complete new delta block before spending real cadence
      // boundaries on the predecessor. The early exception executes no DDL or
      // assertions; it is only a syntax probe, never an installation/proof.
      const delta = /DO \$admin_runtime_delta\$([\s\S]*?)\$admin_runtime_delta\$;/.exec(compiled.migration)?.[1]
      assert.ok(delta)
      assert.equal(delta.split('\nBEGIN\n').length, 2)
      await refuses('DO $owned_delta_syntax$' + delta.replace('\nBEGIN\n',
        "\nBEGIN\n  RAISE EXCEPTION 'owned delta syntax compiled only';\n") + '$owned_delta_syntax$;',
      /owned delta syntax compiled only/)
      const moderation = functionsIn(readFileSync(new URL(
        '../../../supabase/migrations/20260827170000_admin_aal2_data_plane_alignment.sql', import.meta.url), 'utf8'))
        .find(f => f.signature === 'public.darf_inhalte_moderieren()')
      assert.ok(moderation, 'canonical source helper, checked by the installer pin')
      await prepareCycle4Attempt2RecoveryFixture(proof, t.signal, async () => {
        // These missing synthetic fixture prerequisites are established before
        // PAI/HMA/BG1 capture any catalog. No installed baseline is replaced.
        await proof.run('SET SESSION AUTHORIZATION ot_pilot_owner;'
          + 'ALTER TABLE auth.users ADD COLUMN created_at timestamptz;'
          + "UPDATE auth.users SET created_at=clock_timestamp()-interval '1 day';"
          + creator + moderation.sql
          + 'REVOKE ALL ON FUNCTION public.darf_inhalte_moderieren() FROM PUBLIC,anon;'
          + 'GRANT EXECUTE ON FUNCTION public.darf_inhalte_moderieren() TO postgres,authenticated,service_role;',
        'synthetic Admin auth prerequisites before all protected catalogs')
      })
      const prior = readFileSync(new URL('../official-truth-v3-dev-cycle4-attempt2-recovery-1/provider-migration-body.sql', import.meta.url), 'utf8')
      await proof.run(creator + 'BEGIN;' + prior + 'COMMIT;', 'install exact unchanged final BG1 predecessor')
      await awaitNextBg1(proof, t.signal, PREDECESSOR_BASELINE)
      const originalTables = await proof.value<string[]>(`(SELECT jsonb_agg(format('%I.%I',n.nspname,c.relname) ORDER BY n.nspname,c.relname)
        FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname IN
        ('official_v3_method_private','official_v3_intake_private','official_v3_jobs_private','official_v3_result_private','official_v3_guard_private'))`, creator)
      const preserved = '(SELECT jsonb_object_agg(name,value) FROM (VALUES ' + originalTables.map(table =>
        '(' + literal(table) + ',' + rowsDigest(table) + ')').join(',') + ') x(name,value))'
      const before = await proof.value(preserved, creator)
      const authority = `(SELECT jsonb_build_object('roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r),
        'memberships',(SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m)))`
      const authorityBefore = await proof.value(authority, creator)
      const isAbsent = `to_jsonb(to_regnamespace('jetnity_reporting') IS NULL AND to_regnamespace('jetnity_cms_private') IS NULL
        AND to_regnamespace('jetnity_marketing_private') IS NULL AND to_regclass(${literal(BASELINE)}) IS NULL)`

      await t.test('wrong target, partial prior state, old drift, half installation and extra grants roll back completely', async () => {
        const faults = [
          { prefix: '', body: compiled.migration.replace("SET LOCAL jetnity.admin_runtime_target='dev:", "SET LOCAL jetnity.admin_runtime_target='wrong:"), error: /exact unused Dev predecessor/ },
          { prefix: 'CREATE SCHEMA jetnity_reporting;', body: compiled.migration, error: /exact unused Dev predecessor/ },
          { prefix: "ALTER FUNCTION official_v3_guard_private.require_open_v1() SET statement_timeout='1s';", body: compiled.migration, error: /predecessor catalog mismatch/ },
          { prefix: '', body: compiled.migration.replace('CREATE SCHEMA jetnity_cms_private',
            () => "DO $$BEGIN RAISE EXCEPTION 'injected owned rollback boundary'; END$$;CREATE SCHEMA jetnity_cms_private"), error: /injected owned rollback boundary/ },
          { prefix: '', body: compiled.migration.replace('DO $admin_runtime_delta$',
            'GRANT EXECUTE ON FUNCTION public.admin_marketing_drafts_apply_v1(jsonb) TO anon;DO $admin_runtime_delta$'), error: /function contract changed/ },
          { prefix: '', body: compiled.migration.replace('DO $admin_runtime_delta$',
            'CREATE TYPE jetnity_marketing_private.unreviewed_v1 AS ENUM(\'unreviewed\');DO $admin_runtime_delta$'), error: /additional object outside approved closure/ },
        ]
        for (const fault of faults) {
          await refuses(creator + 'BEGIN;' + fault.prefix + fault.body + 'ROLLBACK;', fault.error)
          assert.equal(await proof.value(isAbsent, creator), true)
          assert.deepEqual(await proof.value(preserved, creator), before)
          assert.deepEqual(await proof.value(authority, creator), authorityBefore)
        }
      })
      await proof.run(creator + 'BEGIN;' + compiled.migration + 'COMMIT;', 'install exact atomic Admin successor')
      await t.test('original histories and permissions survive; repeated installation cannot replace the successor', async () => {
        assert.deepEqual(await proof.value(preserved, creator), before)
        assert.deepEqual(await proof.value(authority, creator), authorityBefore)
        await proof.run(creator + 'SELECT official_v3_guard_private.assert_catalog_v1();', 'new catalog is already exactly bound')
        await refuses(creator + 'BEGIN;' + compiled.migration + 'ROLLBACK;', /exact unused Dev predecessor/)
        await refuses(creator + 'BEGIN;TRUNCATE ' + BASELINE + ';ROLLBACK;', /bg1 immutable evidence/)
      })
      await t.test('the previous green generation admits no Counts, CMS, campaigns or published read', async () => {
        for (const expression of [countRead, entryRead, marketingRead])
          await refuses(human() + 'SELECT ' + expression + ';', /fresh full proof required/)
        await refuses('SET SESSION AUTHORIZATION anon;SELECT public.cms_inspiration_published_v1();', /fresh full proof required/)
      })
      await awaitNextBg1(proof, t.signal, BASELINE)
      await t.test('a genuinely later complete BG1 admits all new RPCs and retains AAL2', async () => {
        const counts = await proof.value<{ present_registered_accounts: string }>(countRead, human())
        assert.ok(BigInt(counts.present_registered_accounts) > 0n)
        const content = await proof.value<{ entry: { version: string }; history: unknown[] }>(entryRead, human())
        assert.equal(content.entry.version, '0'); assert.deepEqual(content.history, [])
        const campaigns = await proof.value<{ items: unknown[] }>(marketingRead, human())
        assert.deepEqual(campaigns.items, [])
        assert.deepEqual(await proof.value('public.cms_inspiration_published_v1()', 'SET SESSION AUTHORIZATION anon;'), { schema: 1, items: [] })
        for (const expression of [countRead, entryRead, marketingRead])
          await refuses(human('aal1') + 'SELECT ' + expression + ';', /not authorized/)
      })
      await t.test('synthetic CMS and campaign writes commit once; exact receipts confirm without a second write', async () => {
        const cmsRequest = randomUUID(), campaignRequest = randomUUID(), campaignId = randomUUID()
        const payload = { beschreibung: ENTDECKEN_ZIELE[0]!.beschreibung, idea: ENTDECKEN_ZIELE[0]!.idea, themen: [...ENTDECKEN_ZIELE[0]!.themen] }
        const cmsWrite = 'public.admin_cms_inspiration_command_v1(' + literal(cmsRequest) + ',' + literal(entryId) + ",0,'save_draft'," + json(payload) + ')'
        const cmsReceipt = await proof.value<{ status: string; version: string }>(cmsWrite, human())
        assert.equal(cmsReceipt.status, 'recorded'); assert.equal(cmsReceipt.version, '1')
        assert.deepEqual(await proof.value('public.admin_cms_inspiration_confirm_v1(' + literal(cmsRequest) + ')', human()), cmsReceipt)
        const command = { schemaVersion: 1, requestId: campaignRequest, draftId: campaignId, expectedVersion: '0', action: 'create',
          payload: { label: 'Owned native proof', destination: 'inspiration', channel: 'qr', contentId: null } }
        const campaignWrite = 'public.admin_marketing_drafts_apply_v1(' + json(command) + ')'
        await proof.value(campaignWrite, human())
        const stored = await proof.value<{ items: { draftId: string; version: string }[] }>(marketingRead, human())
        assert.equal(stored.items.length, 1); assert.equal(stored.items[0]!.draftId, campaignId); assert.equal(stored.items[0]!.version, '1')
        assert.equal(await proof.value('(SELECT to_jsonb(count(*)) FROM jetnity_marketing_private.operations_v1)', creator), 1)
        await proof.run(creator + 'SELECT official_v3_guard_private.assert_catalog_v1();', 'ordinary store DML does not rewrite the sealed catalog')
      })
      await t.test('new ACL/definition drift and a clock outside the lease fail directly in the database', async () => {
        const faults = [
          { sql: 'GRANT SELECT ON jetnity_marketing_private.drafts_v1 TO authenticated;', error: /protected catalog changed/ },
          { sql: "ALTER FUNCTION jetnity_cms_private.actor_v1() SET statement_timeout='1s';", error: /protected catalog changed/ },
          { sql: "UPDATE official_v3_guard_private.state_v1 SET last_observed=clock_timestamp()+interval '1 minute' WHERE singleton;", error: /integrity unavailable/ },
        ]
        for (const fault of faults) {
          await refuses(creator + 'BEGIN;' + fault.sql + human() + 'SELECT ' + entryRead + ';ROLLBACK;', fault.error)
          await proof.run(creator + 'SELECT official_v3_guard_private.assert_catalog_v1();', 'failed tampering transaction was fully rolled back')
        }
      })
    } finally { await proof.close() }
  })
