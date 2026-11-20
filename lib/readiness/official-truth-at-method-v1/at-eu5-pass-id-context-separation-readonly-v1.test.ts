import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
const path='scripts/db/official-truth-universal-registry-dev-1/at-eu5-pass-id-context-separation-readonly-v1.sql'
const sql=readFileSync(path,'utf8')
test('EU5 scope evidence is real PG17 read-only and cannot write or publish',()=>{
 assert.match(sql,/BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;/)
 assert.match(sql,/^ROLLBACK;$/m)
 assert.doesNotMatch(sql,/^\s*(?:COMMIT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|GRANT|REVOKE|TRUNCATE)\b/im)
 assert.match(sql,/FROM method_rows p CROSS JOIN global_state s ORDER BY p.ord/)
 for (const gate of ['passport_source_to_rule_authorized','eu_id_source_to_rule_authorized','personalized_document_qualified','owner_aal2_method_approved','visitor_positive_allowed']) {
  assert.match(sql,new RegExp('FALSE AS '+gate+'\\b'))
 }
})
test('EU5 passport research cannot be used as an independent national EU ID method',()=>{
 assert.match(sql,/VALUES \(1,'DE'\),\(2,'PL'\),\(3,'IT'\),\(4,'RO'\),\(5,'FR'\)/)
 assert.match(sql,/m.candidate_context='ordinary_passport_tourist_short_stay'/)
 assert.match(sql,/m.candidate_context='national_eu_identity_card'/)
 assert.match(sql,/p.separate_id_rows<>0 OR p.current_rule_source_checked_rows<>0/)
 assert.match(sql,/p.ordinary_passport_rows<>1/)
 assert.match(sql,/current_primary_source_checked_for_this_rule IS TRUE/)
 assert.match(sql,/primary_rule_qualified OR m.ma1_method_authorized OR m.owner_aal2_approved OR m.publication_allowed/)
 assert.match(sql,/eu5_at_hrs2_count<>0/)
 assert.match(sql,/ma1_owner_session_bound IS NOT FALSE/)
})
test('research archive bytes and unchanged monitor never imply legal receipt',()=>{
 assert.match(sql,/sha256\(original_body\)/)
 assert.match(sql,/fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778/)
 assert.match(sql,/ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e/)
 assert.match(sql,/two_destination_primaries_unchanged_research_only/)
 assert.match(sql,/RESEARCH_ONLY_PASSPORT_CONTEXT__EU_ID_SEPARATE_RECEIPT_MISSING/)
 assert.doesNotMatch(sql,/\bCH-only\b|\bBern\b/i)
})
