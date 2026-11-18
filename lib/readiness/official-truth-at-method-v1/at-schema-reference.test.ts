import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { AT_DEV_INSTALLED_RPCS, pruefe } from '../../../scripts/db/verwendung.mjs'

// Dev PG17 already hosts this wrapper, but the generated TypeScript schema is
// Production-scoped. This is one exact route/SQL identity, never a wildcard.
test('AT visitor schema permits only its actual guarded Dev RPC and refuses other callers', () => {
  const name = 'jetnity_source_bound_at_visa_v1'
  const sourcePath = 'app/api/readiness/at-visa/route.ts'
  const sqlPath = 'scripts/db/official-truth-source-bound-renewal-dev-1/install.sql'
  assert.deepEqual(AT_DEV_INSTALLED_RPCS, [{ name, sourcePath, sqlPath }])
  const sql = readFileSync(sqlPath, 'utf8')
  const route = readFileSync(sourcePath, 'utf8')
  const check = (path: string, source: string, sqlPresent = true, sqlBody = sql) => pruefe({
    dateien: [path], lese: () => source, typenInhalt: '    Functions: {\n    }\n',
    sqlVorhanden: (p: string) => sqlPresent && p === sqlPath,
    sqlInhalt: (p: string) => { assert.equal(p, sqlPath); return sqlBody },
  })
  assert.match(sql, /CREATE FUNCTION public\.jetnity_source_bound_at_visa_v1\(p_citizenship_country_code text\)/)
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.jetnity_source_bound_at_visa_v1\(text\) TO anon,authenticated/)
  assert.match(sql, /official_v3_source_renewal_private\.facts_v1/)
  const ok = check(sourcePath, route)
  assert.deepEqual(ok.befunde, [])
  assert.equal(ok.lokaleUnapplied.length, 1)
  assert.equal(ok.lokaleUnapplied[0].classification, 'DEV-INSTALLED/PRODUCTION-UNAPPLIED')
  assert.equal(check('app/api/other/route.ts', route).befunde[0].grund, 'wrong-source')
  assert.equal(check(sourcePath, route, false).befunde[0].grund, 'missing-sql')
  assert.equal(check(sourcePath, route, true, 'SELECT 1').befunde[0].grund, 'missing-sql')
  assert.equal(check(sourcePath, `.rpc('${name}_other')`).befunde.length, 1)
})
