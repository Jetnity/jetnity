import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
const path='scripts/db/official-truth-universal-registry-dev-1/at-us-ua-original-visa-passport-readonly-v1.sql'
const src=readFileSync(path,'utf8')
test('US/UA native PG17 audit is select-only and cannot approve visas or mutate',()=>{
 assert.match(src,/BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY/)
 assert.match(src,/^ROLLBACK;/m)
 assert.doesNotMatch(src,/^\s*(COMMIT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|GRANT|REVOKE|TRUNCATE|CALL)\b/im)
 assert.match(src,/WHERE code IN \('US','UA'\)/)
 assert.match(src,/proof\.codes<>'US UA'/)
 assert.match(src,/new_or_unqualified_positive<>0/)
 assert.match(src,/FALSE AS legal_source_to_rule_sealed/)
 assert.match(src,/FALSE AS person_document_verified/)
 assert.match(src,/FALSE AS owner_method_approved/)
 assert.match(src,/FALSE AS visitor_publication/)
})
test('US/UA national ordinary passport exemption never imports diplomat exception or synthetic seal',()=>{
 assert.match(src,/octet_length\(original_body\)=498415/)
 assert.match(src,/encode\(sha256\(original_body\),'hex'\)='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'/)
 assert.match(src,/encode\(sha256\(original_body\),'hex'\)='ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e'/)
 assert.match(src,/original_eu_visa_requirement IS DISTINCT FROM 'Nein'/)
 assert.match(src,/original_eu_visa_exemption_conditions IS DISTINCT FROM 'Ja'/)
 assert.match(src,/t\.code='UA'.*'Ja, nur biometrische Reisep%'/)
 assert.match(src,/position\('Diplomatenp' IN m\.original_eu_visa_exemption_conditions\)/)
 assert.match(src,/two_destination_primaries_unchanged_research_only/)
 assert.match(src,/selected_us_ua_binding/)
 assert.match(src,/BIOMETRIC_90_180_DOCUMENT_HRS2_MA1_OWNER_E2E_MISSING/)
})
