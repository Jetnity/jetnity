import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
const sql=readFileSync(new URL('../../../scripts/db/official-truth-universal-registry-dev-1/at-eu5-matrix-metadata-readonly-v1.sql',import.meta.url),'utf8')
const executable=sql.split('\n').filter(line=>!line.trimStart().startsWith('--')).join('\n')
test('EU5 BMI metadata proof is read-only, exact scoped, and not a source seal or issuer',()=>{
 assert.match(executable,/BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY/)
 assert.ok(executable.trimEnd().endsWith('ROLLBACK;'))
 assert.doesNotMatch(executable,/\bCOMMIT\s*;|\bGRANT\b|\bCREATE\s+(?:FUNCTION|TABLE)|\bINSERT\s+INTO\b|\bUPDATE\s+\w|\bDELETE\s+FROM\b|\bALTER\s+ROLE\b/i)
 assert.match(executable,/WHERE b\.citizenship_country_code IN \('DE','PL','IT','RO','FR'\)/)
 assert.match(executable,/e\.checked_priority<>'DE PL IT RO FR'/)
 assert.match(executable,/e\.pinned_matrix_rows<>5/)
 assert.match(executable,/fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778/)
 assert.match(executable,/DATE '2026-11-06'/)
 assert.match(executable,/b\.conditional_matrix_class = 'F'/)
 assert.match(executable,/Ja \(siehe Zusatz\)/)
 assert.match(executable,/e\.france_id_addendum_rows<>1/)
 assert.match(executable,/e\.unresolved_or_positive<>0/)
 assert.match(executable,/h\.at_eu5_selected OR h\.selected<>1/)
 assert.match(executable,/s\.bg1 IS DISTINCT FROM 'current'/)
 assert.match(executable,/EU5_PINNED_METADATA_MATCHES__SOURCE_BYTES_SEAL_OWNER_ISSUER_E2E_MISSING/)
 for(const flag of ['original_bytes_rehashed_now','document_or_article5_verified',
 'destination_specific_seal_proven','owner_session_or_ma1_authorized','publication_allowed'])
  assert.match(executable,new RegExp('FALSE AS '+flag))
})
