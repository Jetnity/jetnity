// Existing assertions unchanged; bound screenshots to the viewport for this UX evidence bundle.
import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
const root='scripts/trip-workspace-contextual-editing-ux-1/.replay-workspace',dir='docs/evidence/trip-workspace-contextual-editing-ux-1/regressions',results=[]
mkdirSync(root,{recursive:true})
try{
 for(const audit of ['trip-timeline-core-1','trip-timeline-temporal-review-1','trip-workspace-contextual-navigation-1','trip-plan-premium-experience-4']){
  const source=`scripts/${audit}-audit.mjs`,raw=readFileSync(source,'utf8'),path=`${root}/audit.mjs`,out=`${dir}/${audit}`
  writeFileSync(path,raw.replaceAll("'../lib/","'../../../lib/").replaceAll("'../types/","'../../../types/").replace(/fullPage:\s*true/g,'fullPage: false').replace('async function bild(page, name, fullPage = false)','async function bild(page, name)').replace('path: datei, fullPage }','path: datei, fullPage: false }'))
  mkdirSync(out,{recursive:true});const r=spawnSync(process.execPath,['--import','tsx',path],{env:{...process.env,AUDIT_BASE:'http://127.0.0.1:3517',AUDIT_EVIDENCE_DIR:out,AUDIT_BROWSER:'1',CHROME_PATH:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',AUDIT_SERVER_MODE:'production'},encoding:'utf8'})
  writeFileSync(`${out}/execution.log`,r.stdout+r.stderr);results.push({audit,exitCode:r.status,source,sourceSha256:createHash('sha256').update(raw).digest('hex'),adaptations:'Import relocation and viewport screenshots only; assertions unchanged'});console.log(audit,r.status);if(r.status)process.exitCode=1
 }
}finally{rmSync(root,{recursive:true,force:true});writeFileSync(`${dir}/workspace-regressions.json`,JSON.stringify(results,null,2)+'\n')}
