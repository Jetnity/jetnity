import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
const sql=readFileSync(new URL('../../../scripts/db/official-truth-at-production-readiness-1/read-only-preflight.sql',import.meta.url),'utf8')
const gate=readFileSync(new URL('../../../docs/official-truth-at-production-readiness-20261117.md',import.meta.url),'utf8')
const selector=readFileSync(new URL('./at-production-selection.ts',import.meta.url),'utf8')
const route=readFileSync(new URL('../../../app/api/readiness/at-visa/route.ts',import.meta.url),'utf8')
test('Production preflight is read-only, refuses authority, and preserves Dev/Production separation',()=>{
 assert.match(sql,/BEGIN READ ONLY;/)
 assert.match(sql,/ROLLBACK;\s*$/)
 assert.match(sql,/STOP_BEFORE_PRODUCTION_OWNER_RELEASE/)
 assert.doesNotMatch(sql,/\b(?:CREATE|ALTER|INSERT|UPDATE|DELETE|DROP|TRUNCATE|GRANT|REVOKE)\s+(?:TABLE|SCHEMA|ROLE|FUNCTION|INTO|FROM|ON|official_v3_)/i)
 assert.match(gate,/Status: STOP/)
 assert.match(gate,/RESEARCH_ONLY/)
 assert.match(gate,/every 60 minutes|every 60 minutes|alle 60 Minuten|hourly/)
 assert.match(gate,/1 h/)
 assert.match(gate,/24 h/)
 assert.match(gate,/five-minute cadence/)
 assert.match(gate,/Production selector/)
})

test('Production preflight reports every missing actual source/guard/visitor component without inferring approval',()=>{
 for(const name of ['atSourceCustodyInstalled','atPrivateFactsInstalled','atSourceWatchInstalled',
  'atSourceRenewalInstalled','atLegacyRpcInstalled','atBoundVisitorRpcInstalled',
  'atMethodHeadCount','bg1Current','productionGuardCronActive']) {
   assert.ok(sql.includes("'"+name+"'"), 'missing '+name)
 }
 assert.match(sql,/externalProjectIdentityRequired',true/)
 assert.match(sql,/devOwnerReceiptCannotBeReused',true/)
 assert.match(sql,/productionOwnerAal2ApprovalRequired',true/)
 assert.match(sql,/decision','STOP_BEFORE_PRODUCTION_OWNER_RELEASE'/)
})
test('Production visitor is only attempted on code-owned exact main and explicit server-only Owner flag',()=>{
 assert.match(selector,/JETNITY_OFFICIAL_AT_PRODUCTION_VISITOR_V1/)
 assert.match(selector,/deploymentEnv === 'production'/)
 assert.match(selector,/branch === 'main'/)
 assert.match(selector,/HUMAN_METHOD_PRODUCTION_URL/)
 assert.match(selector,/ownerRelease === 'enabled'/)
 assert.doesNotMatch(selector,/NEXT_PUBLIC_/)
 assert.match(route,/selectedAustriaDev\(\)\|\|selectedAustriaProduction\(\)/)
 assert.match(route,/p_citizenship_country_code:country/)
 assert.match(gate,/VISITOR_V1/)
})
