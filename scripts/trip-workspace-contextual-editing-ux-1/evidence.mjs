// Publish bounded local evidence only after every required result actually passed.
import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,readdirSync,statSync,rmSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
const dir='docs/evidence/trip-workspace-contextual-editing-ux-1'
const json=p=>JSON.parse(readFileSync(`${dir}/${p}`,'utf8'))
for(const p of ['checks-audit.json','journey/journey.json','edges/edges.json','regressions/guest/guest-browser.json','regressions/account/account-browser.json','regressions/903/browser.json','regressions/903/account-persistence.json','regressions/linux/replay.json'])assert.equal(json(p).status,'PASS',p)
for(const p of ['regressions/workspace-regressions.json','checks/checks.json']){
 try{for(const r of json(p))assert.equal(r.exitCode,0,p)}catch(e){if(e.code!=='ENOENT')throw e}
}
const walk=root=>readdirSync(root).flatMap(n=>{const p=`${root}/${n}`;return statSync(p).isDirectory()?walk(p):[p]})
for(const p of walk(dir).filter(p=>/\/(failure|guest-diagnostic)\.png$/.test(p)))rmSync(p)
const linuxPath=`${dir}/regressions/linux/npm-test-full.log`,raw=readFileSync(linuxPath,'utf8')
const totals=Object.fromEntries([...raw.matchAll(/^# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) (.+)$/gm)].map(m=>[m[1],Number(m[2])]))
assert.equal(totals.tests,5806);assert.equal(totals.pass,5806);for(const k of ['fail','cancelled','skipped','todo'])assert.equal(totals[k],0)
writeFileSync(`${dir}/regressions/linux/totals.json`,JSON.stringify(totals,null,2)+'\n')
for(const p of walk(dir).filter(p=>/\.(log|txt|json)$/.test(p))){
 const raw=readFileSync(p,'utf8');assert(!/eyJ[A-Za-z0-9_-]{30,}|sb_secret_[A-Za-z0-9]+/.test(raw),'Credential-like string in '+p)
 const clean=raw.replaceAll(process.cwd(),'<worktree>').replace(/\/Users\/[^\s/:]+/g,'<local-user>').replace(/\x1b\[[0-9;]*m/g,'').replace(/postgres(?:ql)?:\/\/[^\s"']+/g,'[redacted-local-dsn]')
 if(p.endsWith('.log')){const lines=clean.replace(/\[bounded excerpt[^\]]*\]/g,'[bounded excerpt; middle lines omitted; totals retained]').split('\n'),bounded=clean.includes('[bounded excerpt')?lines:lines.length>240?[...lines.slice(0,80),'[bounded excerpt; middle lines omitted; totals retained]',...lines.slice(-160)]:lines;writeFileSync(p,bounded.map(s=>s.trimEnd()).join('\n').trimEnd()+'\n')}
 else writeFileSync(p,clean)
}
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim()
assert.equal(git(['hash-object','docs/TRIP_WORKSPACE_CONTEXTUAL_EDITING_UX_1_TASK_2026-10-09.md']),'e3c0c4b4c37663f4269fae282bfea24f12e1ad01')
const code=['components/trips/TripWorkspace.tsx','components/trips/TripWorkspaceEditSurface.tsx','components/trips/ReiseAenderung.tsx','components/trips/ReiseAenderungManuell.tsx','components/trips/ReiseAenderungAuswirkungen.tsx','lib/trips/workspace-edit-focus.ts']
const docs=readdirSync('docs').filter(p=>/^TRIP_WORKSPACE_CONTEXTUAL_EDITING_UX_1_(PLAN|CONTRACTS|STATUS|REPORT|SELF_REVIEW|HANDOFF)_2026-10-09.md$/.test(p)).map(p=>'docs/'+p)
const prepared=['docs/TRIP_WORKSPACE_CONTEXTUAL_EDITING_UX_1_TASK_2026-10-09.md','docs/TRIP_WORKSPACE_CONTEXTUAL_EDITING_UX_1_TL_PRECHECK_2026-10-09.md']
const files=[...code,...docs,...prepared,...walk('scripts/trip-workspace-contextual-editing-ux-1'),...walk(dir)].filter(p=>!p.includes('/.replay-')&&!p.endsWith('/source-manifest.json')).sort()
const sha256=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const actual=git(['diff','--name-only','c3004bc159bc86a7eb25b741cc0aab49344c63c8']).split('\n').filter(Boolean)
for(const p of actual)assert(files.includes(p)||p===`${dir}/source-manifest.json`,'out-of-scope tracked edit: '+p)
for(const p of code)assert.equal(json('checks-audit.json').sources[p],sha256(p),'checks predate source: '+p)
writeFileSync(`${dir}/source-manifest.json`,JSON.stringify({schema:1,createdAt:new Date().toISOString(),seed:'c3004bc159bc86a7eb25b741cc0aab49344c63c8',taskBlob:'e3c0c4b4c37663f4269fae282bfea24f12e1ad01',sources:Object.fromEntries(code.map(p=>[p,sha256(p)])),deliveryFiles:files.map(path=>({path,bytes:statSync(path).size,sha256:sha256(path)})),self:'This manifest is additionally delivered; self-hash intentionally excluded. Exact published head and remote gates are in the PR receipt.'},null,2)+'\n')
console.log(`PASS: ${code.length} source files, ${files.length+1} delivery files; bounded sanitized evidence`)
