import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
const workflow=readFileSync(new URL('../../../../.github/workflows/official-truth-bg1-production-backup-readonly.yml',import.meta.url),'utf8')
test('Production backup-inventory workflow is non-running after explicit Owner denial of CI access',()=>{
 assert.match(workflow,/on:\s*\n\s*workflow_dispatch:/)
 assert.match(workflow,/production-backup-inventory:\s*\n[\s\S]*?if: false/)
 assert.doesNotMatch(workflow,/(?:pull_request|schedule|push):/)
 assert.match(workflow,/permissions:\s*\n\s*contents: read/)
 assert.match(workflow,/Owner explicitly declined expanding the CI token/)
})
test('Archived backup inventory implementation stays GET-only and cannot silently restore or create costs',()=>{
 assert.match(workflow,/https:\/\/api\.supabase\.com\/v1\/projects\/qscbgcdmivbbnzrcyegn\/database\/backups/)
 assert.match(workflow,/method:'GET'/)
 assert.match(workflow,/redirect:'error'/)
 assert.match(workflow,/status==='COMPLETED'/)
 assert.match(workflow,/is_physical_backup===true/)
 assert.match(workflow,/liveRestoreTested:false/)
 assert.match(workflow,/productionWritePerformed:false/)
 assert.match(workflow,/newCostCreated:false/)
 assert.doesNotMatch(workflow,/method:'(?:POST|PATCH|PUT|DELETE)'|restore-pitr|restore-to-new|CREATE\s+PROJECT/i)
})
