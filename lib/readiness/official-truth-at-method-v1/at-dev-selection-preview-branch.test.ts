import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
const source=readFileSync(new URL('./at-dev-selection.ts',import.meta.url),'utf8')
const route=readFileSync(new URL('../../../app/api/readiness/at-visa/route.ts',import.meta.url),'utf8')

test('AT visitor Dev source-bound read is restricted to the two exact preview branches, never Production',()=>{
 assert.match(source,/VERCEL_ENV==='preview'/)
 assert.match(source,/VERCEL_PROJECT_ID==='prj_wTTVawPItEO7a4HihEmaU3PsuaXM'/)
 assert.match(source,/VERCEL_GIT_REPO_OWNER==='Jetnity'/)
 assert.match(source,/VERCEL_GIT_REPO_SLUG==='jetnity'/)
 assert.match(source,/VERCEL_GIT_COMMIT_REF==='feat\/official-truth-at-owned-20261116'/)
 assert.match(source,/VERCEL_GIT_COMMIT_REF==='feat\/official-truth-universal-source-registry-dev-20261119'/)
 assert.match(source,/getServerSupabaseUrl\(\)===HUMAN_METHOD_DEV_URL/)
 assert.equal((source.match(/VERCEL_GIT_COMMIT_REF===/g)??[]).length,2)
 assert.doesNotMatch(source,/VERCEL_ENV==='production'|ALLOW_ALL|process\.env\.CI\b|startsWith\(/)
 assert.match(route,/selectedAustriaDev\(\)\|\|selectedAustriaProduction\(\)/)
 assert.match(route,/client\.rpc\('jetnity_source_bound_at_visa_v1'/)
 assert.doesNotMatch(route,/client\.rpc\('jetnity_at_visa_v3'/)
})
