import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
const path='scripts/db/official-truth-universal-registry-dev-1/at-eu5-sourcebound-initialissuer-candidate.ROLLBACK.sql'
const src=readFileSync(path,'utf8')
test('AT EU5 HRS2 source-bound candidate has no install or public success path',()=>{
 assert.match(src,/^BEGIN;/m)
 assert.match(src,/^ROLLBACK;/m)
 assert.doesNotMatch(src,/^COMMIT\s*;/im)
 assert.match(src,/CREATE FUNCTION pg_temp\.at_eu5_sourcebound_initialissuer_candidate_v1/)
 assert.match(src,/VOLATILE SECURITY DEFINER SET search_path=pg_catalog/)
 assert.match(src,/REVOKE ALL ON FUNCTION pg_temp\.at_eu5_sourcebound_initialissuer_candidate_v1/)
 assert.match(src,/require_current_owner_session_v1\(\)/)
 assert.match(src,/official_v3_guard_alarm_status_v1/)
 assert.match(src,/binding#>>'\{context,scope,destinationCountryCode\}'='AT'/)
 assert.match(src,/binding#>'\{context,scope,citizenship,countryCodes\}'='\["DE","PL","IT","RO","FR"\]'::jsonb/)
 assert.match(src,/RAISE EXCEPTION 'AT EU5 source-rule\/legal\/MA1 issuer NOT INSTALLED'/)
 assert.match(src,/IF count_refusals<>18/)
 assert.match(src,/FALSE AS installed_issuer,FALSE AS visitor_publication/)
})
test('Archived exact source bytes and research monitor cannot be mistaken for legal issuer receipts',()=>{
 assert.match(src,/encode\(sha256\(original_body\),'hex'\)='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'/)
 assert.match(src,/encode\(sha256\(original_body\),'hex'\)='ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e'/)
 assert.match(src,/two_destination_primaries_unchanged_research_only/)
 assert.match(src,/pair->>'legalRuleApproved' IS DISTINCT FROM 'false'/)
 assert.match(src,/p_code='FR'/)
 assert.match(src,/italian_paper_nontravel/)
 assert.match(src,/romanian_simple_nontravel/)
 assert.match(src,/french_face_expired_legacy_unresolved/)
 assert.match(src,/special_diplomatic_passport/)
 assert.doesNotMatch(src,/GRANT\s+EXECUTE/im)
})
