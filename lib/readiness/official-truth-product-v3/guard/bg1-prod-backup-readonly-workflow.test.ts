import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
const wf=readFileSync(new URL('../../../../.github/workflows/official-truth-bg1-production-backup-readonly.yml',import.meta.url),'utf8')
test('Production physical-backup inventory is strictly read only and gated to PR1254',()=>{
 assert.match(wf,/github\.event\.pull_request\.number == 1254/)
 assert.match(wf,/github\.event\.pull_request\.head\.repo\.full_name == 'Jetnity\/jetnity'/)
 assert.match(wf,/github\.event\.pull_request\.head\.ref == 'feat\/official-truth-universal-source-registry-dev-20261119'/)
 assert.match(wf,/github\.event\.repository\.private == false/)
 assert.match(wf,/permissions:\s*\n\s*contents: read/)
 assert.match(wf,/secrets\.SUPABASE_ACCESS_TOKEN/)
 assert.match(wf,/https:\/\/api\.supabase\.com\/v1\/projects\/qscbgcdmivbbnzrcyegn\/database\/backups/)
 assert.match(wf,/method:'GET'/)
 assert.match(wf,/redirect:'error'/)
 assert.match(wf,/status==='COMPLETED'/)
 assert.match(wf,/is_physical_backup===true/)
 assert.match(wf,/liveRestoreTested:false/)
 assert.match(wf,/productionWritePerformed:false/)
 assert.doesNotMatch(wf,/actions\/checkout|POST\s*\(|method:'(?:POST|PATCH|PUT|DELETE)'|restore-pitr|restore-to-new|\bCREATE\s+PROJECT\b/i)
});
