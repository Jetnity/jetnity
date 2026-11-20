import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
const base='../../../../'
const workflow=readFileSync(new URL(base+'.github/workflows/official-truth-bg1-alarm-delivery-proof-pr.yml',import.meta.url),'utf8')
const script=readFileSync(new URL(base+'scripts/official-truth-bg1-alarm-delivery-proof.mjs',import.meta.url),'utf8')
test('Real transport proof is strictly synthetic and PR-1254-only',()=>{
 assert.match(workflow,/pull_request:/)
 assert.match(workflow,/github.event.pull_request.number == 1254/)
 assert.match(workflow,/github.event.pull_request.head.repo.full_name == 'Jetnity\/jetnity'/)
 assert.match(workflow,/github.event.pull_request.head.ref == 'feat\/official-truth-universal-source-registry-dev-20261119'/)
 assert.match(workflow,/persist-credentials: false/)
 assert.match(workflow,/issues: write/)
 assert.doesNotMatch(workflow,/SUPABASE|VERCEL|production:qscb|service_role|secrets\./i)
 assert.doesNotMatch(script,/supabase\.co|vercel\.app|ALTER ROLE|UPDATE .*state_v1|service_role/i)
 assert.match(script,/github-actions\[bot\]/)
 assert.match(script,/confirmed\.body!==BODY/)
 assert.match(script,/kein Production-Vorfall/)
});
