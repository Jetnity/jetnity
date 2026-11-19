import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = (path: string) => readFileSync(path, 'utf8')
const candidate = source('scripts/db/admin-service-recovery-20261119/candidate.sql')
const cmsServer = source('lib/admin/content/cms-editor-2/server.ts')
const quotaServer = source('lib/modell/kontingent.ts')
const cron = source('scripts/db/admin-service-recovery-20261119/production-cron-owner-UNAPPLIED.sql')

test('public CMS v2 reads only published, unarchived revisions without the shared admin lock', () => {
  const match = /CREATE FUNCTION public\.cms_inspiration_published_v2\(\) RETURNS jsonb\s+LANGUAGE sql STABLE SECURITY DEFINER[\s\S]*?AS \$cms_public_reader\$([\s\S]*?)\$cms_public_reader\$/.exec(candidate)
  assert.ok(match, 'canonical vetted public reader must exist')
  assert.match(match[1], /JOIN jetnity_cms_private\.inspiration_revisions_v1/)
  assert.match(match[1], /r\.revision = e\.published_revision/)
  assert.match(match[1], /WHERE NOT e\.archived AND e\.published_revision IS NOT NULL/)
  assert.doesNotMatch(match[1], /admin_runtime_guard|official_v3_guard|pg_advisory/i)
  assert.match(candidate, /REVOKE ALL ON FUNCTION public\.cms_inspiration_published_v2\(\) FROM PUBLIC, anon, authenticated, service_role/)
  // The published-only public RPC intentionally inherits EXECUTE via PUBLIC:
  // explicit anon/authenticated GRANTs create pg_shdepend rows and trip BG1.
  assert.match(candidate, /GRANT EXECUTE ON FUNCTION public\.cms_inspiration_published_v2\(\) TO PUBLIC/)
  assert.doesNotMatch(candidate, /GRANT EXECUTE ON FUNCTION public\.cms_inspiration_published_v2\(\) TO anon, authenticated/)
  assert.match(candidate, /d\.deptype='a'/)
  assert.match(cmsServer, /\.rpc\('cms_inspiration_published_v2'\)/)
  assert.match(cmsServer, /\.rpc\('cms_inspiration_published_v1'\)/)
  assert.match(cmsServer, /cmsEditorRuntime\(\) === 'production'/)
  assert.match(cmsServer, /JETNITY_CMS_PUBLIC_V2_ENABLED !== 'true'/)
})

test('quota HTTP 429 is an error-mapping change, not a loosened cost or authorization limit', () => {
  // The candidate uses a preflight-pinned regprocedure OID, then reads that
  // exact definer function body from pg_proc. No hardcoded alternate RPC.
  assert.match(candidate, /f regprocedure := 'public\\.modell_kontingent_beanspruchen\\(text,text,text,uuid\\)'::regprocedure/)
  assert.match(candidate, /SELECT pg_get_functiondef\\(p\\.oid\\) INTO src/)
  assert.match(candidate, /WHERE p\\.oid = f::oid AND p\\.prosecdef/)
  assert.match(candidate, /replace\(src, 'errcode = ''53400''', 'errcode = ''PT429'''\)/)
  assert.match(candidate, /has_function_privilege\('anon', f, 'EXECUTE'\)/)
  assert.match(candidate, /pg_advisory_xact_lock/)
  assert.match(quotaServer, /error\.code === 'PT429'/)
  assert.match(quotaServer, /error\.code === '53400'/)
  assert.doesNotMatch(candidate, /ALTER TABLE public\.model_usage|CREATE ROLE|ALTER ROLE|GRANT EXECUTE ON FUNCTION public\.modell_kontingent_beanspruchen/i)
})

test('production legacy cron operation stays an exact owner-only, unapplied change', () => {
  assert.match(cron, /UNAPPLIED PRODUCTION OWNER GATE/)
  assert.match(cron, /to_regprocedure\('public\.sync_creator_profile_core\(\)'\) IS NOT NULL/)
  assert.match(cron, /btrim\(legacy_job\.command\) <> 'select public\.sync_creator_profile_core\(\);'/)
  assert.match(cron, /cron\.unschedule\(legacy_job\.jobid\)/)
  assert.doesNotMatch(candidate, /cron\.unschedule|sync_profile_emails_hourly/)
})
