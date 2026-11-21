// Mandatory real PostgreSQL 17 proof. Owned socket-only cluster; never hosted credentials.
// The existing CMS fixture supplies real constraints/Admin functions and local-only Auth.
// This is not a replacement for the existing full BG1 native CI proof.
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { OwnedTestLifetime } from '../official-truth-atomic-version-refresh-1/test-lifetime'
import { LocalPgConnection } from '../official-truth-integrated-pilot-1/pg-wire'
import {
  CMS_TABLES, cmsCommand, command, createCmsFixture, jsonQuery, readEntry, rejectSql, snapshot,
} from '../admin-editorial-cms-1/fixture'
import { assertTransactionBody, functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'

const read = (file: string) => readFileSync(new URL('./' + file, import.meta.url), 'utf8')
const install = read('install.sql')
const provider = read('provider-migration-body.sql')
const rollback = read('rollback.sql')
const readback = read('readback.sql')
const devProof = read('dev-rollback-proof.sql')
const catalog = read('protected-catalog.sql')
const signature = 'public.cms_inspiration_published_v2()'
const providerHeader = '-- Provider transaction body. Exactly install.sql without its outer transaction.\n'
const withoutTransaction = (sql: string) => sql.replace('\nBEGIN;\n', '\n').replace('\nCOMMIT;\n', '\n')
const publicRead = (connection: LocalPgConnection) =>
  jsonQuery(connection, 'SELECT public.cms_inspiration_published_v2() AS result')

test('release contains exactly the reviewed Dev v2, with a matching provider transaction body', () => {
  const original = readFileSync(new URL('../admin-service-recovery-20261119/candidate.sql', import.meta.url), 'utf8')
  const oldReader = functionsIn(original).filter(f => f.signature === signature)
  assert.equal(oldReader.length, 1)
  const parts = install.split('$cms_reader_definition$')
  assert.equal(parts.length, 3)
  assert.equal(parts[1]!.trim(), oldReader[0]!.sql, 'no new projection, Auth, guard or KI behavior')
  assert.equal(provider, providerHeader + withoutTransaction(install))
  assertTransactionBody(provider)
  assertTransactionBody(withoutTransaction(rollback))
  assert.equal(install.split('\nBEGIN;\n').length, 2)
  assert.equal(install.split('\nCOMMIT;\n').length, 2)
  assert.equal(rollback.split('\nBEGIN;\n').length, 2)
  assert.equal(rollback.split('\nCOMMIT;\n').length, 2)
  assert.equal(devProof.split('\nROLLBACK;\n').length, 2)
  assert.ok(!devProof.includes('\nCOMMIT;'), 'hosted Dev proof can never commit fixtures')
})

test('CMS reader release: real publication boundaries, least privilege, unchanged predecessor and safe rollback',
  { timeout: 120_000 }, async context => {
    const lifetime = new OwnedTestLifetime(context.signal)
    lifetime.installConnectOwnership()
    let root: string | undefined
    try {
      const fixture = await createCmsFixture(lifetime)
      root = fixture.cluster.root
      const owner = fixture.owner
      const predecessor = readFileSync(new URL(
        '../admin-runtime-production-1/provider-migration-body.sql', import.meta.url), 'utf8')
      const definitions = functionsIn(predecessor)
      const guardedReader = definitions.filter(f => f.signature === 'public.cms_inspiration_published_v1()').at(-1)
      const guard = definitions.find(f => f.signature === 'official_v3_guard_private.admin_runtime_guard_v1()')
      assert.ok(guardedReader && guard)
      // Exact real predecessor definitions, not no-op guard stubs. Its complete BG1
      // dependencies intentionally are not supplied in this bounded CMS fixture:
      // neither installer nor v2 may call it. Full BG1 runs in its existing CI job.
      await owner.query('CREATE SCHEMA official_v3_guard_private AUTHORIZATION postgres; SET ROLE postgres;'
        + guard.sql
        + 'REVOKE ALL ON FUNCTION official_v3_guard_private.admin_runtime_guard_v1() FROM PUBLIC,anon,authenticated,service_role;'
        + guardedReader.sql)
      const beforeCatalog = await owner.query(catalog)
      const beforeContents = await snapshot(owner)
      const noQuota = await owner.query(
        "SELECT to_regprocedure('public.modell_kontingent_beanspruchen(text,text,text,uuid)')::text AS quota")
      assert.equal(noQuota[0]?.quota, null, 'this release must not depend on the unrelated KI installation')

      await context.test('clean installation commits only the reader and passes real metadata readback', async () => {
        await owner.query(install)
        assert.deepEqual(await owner.query(catalog), beforeCatalog)
        assert.deepEqual(await snapshot(owner), beforeContents)
        const rows = await owner.query(readback)
        assert.ok(rows.some(row => row.caller === 'anon' && row.published_count === '0'))
        assert.ok(rows.some(row => row.anon_execute === 't' && row.no_role_acl_dependencies === 't'))
      })

      await context.test('real anon, authenticated without claims and an unrelated caller can read public empty state only', async () => {
        for (const role of ['anon', 'authenticated', 'service_role', null] as const) {
          const client = await fixture.connect(role, {})
          assert.deepEqual(await publicRead(client), { schema: 1, items: [] })
          for (const table of CMS_TABLES) {
            await rejectSql(() => client.query('SELECT * FROM jetnity_cms_private.' + table), '42501')
            await rejectSql(() => client.query('DELETE FROM jetnity_cms_private.' + table), '42501')
          }
          await rejectSql(() => command(client, cmsCommand()), '42501')
          await rejectSql(() => readEntry(client), '42501')
          client.close()
        }
        assert.deepEqual(await owner.query(catalog), beforeCatalog)
        assert.deepEqual(await snapshot(owner), beforeContents)
      })

      await context.test('the identical Dev rollback proof selects published revision despite newer draft, archive and history', async () => {
        const before = await snapshot(owner)
        await owner.query(devProof)
        assert.deepEqual(await snapshot(owner), before, 'every fixture revision, ledger row and entry update is rolled back')
        assert.deepEqual(await owner.query(catalog), beforeCatalog)
        const visitor = await fixture.connect('anon', {})
        assert.deepEqual(await publicRead(visitor), { schema: 1, items: [] })
        visitor.close()
      })

      await context.test('rollback proof can safely run over existing editorial history without persisting a change', async () => {
        const editor = await fixture.connect()
        await command(editor, cmsCommand())
        await command(editor, cmsCommand({ expectedVersion: '1', action: 'publish', payload: { revision: '1' } }))
        editor.close()
        const before = await snapshot(owner)
        const visitor = await fixture.connect('anon', {})
        const originalPublic = await publicRead(visitor)
        await owner.query(devProof)
        assert.deepEqual(await snapshot(owner), before)
        assert.deepEqual(await publicRead(visitor), originalPublic)
        assert.deepEqual(await owner.query(catalog), beforeCatalog)
        visitor.close()
      })

      const refused = async (sql: string) => {
        await rejectSql(() => owner.query(sql), 'P0001')
        await owner.query('ROLLBACK;')
      }
      await context.test('repeat installation refuses existing state without replacement', async () => {
        const before = await owner.query("SELECT to_jsonb(p)::text AS metadata FROM pg_proc p WHERE p.oid='public.cms_inspiration_published_v2()'::regprocedure")
        await refused(install)
        assert.deepEqual(await owner.query(
          "SELECT to_jsonb(p)::text AS metadata FROM pg_proc p WHERE p.oid='public.cms_inspiration_published_v2()'::regprocedure"), before)
        assert.deepEqual(await owner.query(catalog), beforeCatalog)
      })

      await context.test('rollback refuses changed body, changed configuration, individual-role grants and new dependent view', async () => {
        const checks = [
          "CREATE OR REPLACE FUNCTION public.cms_inspiration_published_v2() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$SELECT '{}'::jsonb$$;",
          "ALTER FUNCTION public.cms_inspiration_published_v2() SET search_path='public';",
          'GRANT EXECUTE ON FUNCTION public.cms_inspiration_published_v2() TO anon;',
          'CREATE TEMP VIEW cms_release_dependent AS SELECT public.cms_inspiration_published_v2() AS value;',
        ]
        for (const mutation of checks) {
          await refused('BEGIN;' + mutation + withoutTransaction(rollback) + 'ROLLBACK;')
          await owner.query(readback)
          assert.deepEqual(await owner.query(catalog), beforeCatalog, 'fault rollback leaves every protected catalog unchanged')
        }
      })

      await context.test('clean rollback removes only v2; provider body installs the same function and can be removed again', async () => {
        const before = await snapshot(owner)
        await owner.query(rollback)
        assert.deepEqual(await owner.query(catalog), beforeCatalog)
        assert.deepEqual(await snapshot(owner), before)
        assert.deepEqual(await owner.query(
          "SELECT to_regprocedure('public.cms_inspiration_published_v2()')::text AS reader"), [{ reader: null }])
        await owner.query('BEGIN;' + provider + 'COMMIT;')
        await owner.query(readback)
        assert.deepEqual(await owner.query(catalog), beforeCatalog)
        await owner.query(rollback)
        assert.deepEqual(await snapshot(owner), before)
      })
      context.diagnostic(JSON.stringify({
        schema: 'jetnity.cms-public-reader-release.native.v1', postgres: fixture.cluster.version,
        realSqlRoles: true, exactExistingReader: true, hostedAuthVerified: false, hostedDatabaseTouched: false,
      }))
    } finally {
      const cleanup = await lifetime.dispose()
      assert.equal(cleanup.pending, 0)
      assert.equal(cleanup.started, cleanup.settled)
      assert.equal(cleanup.connections, cleanup.closed)
      if (root) {
        assert.equal(cleanup.stoppedClusters, 1)
        assert.equal(existsSync(root), false)
      }
      context.diagnostic(JSON.stringify({ schema: 'jetnity.cms-public-reader-release.cleanup.v1', ...cleanup }))
    }
  })

