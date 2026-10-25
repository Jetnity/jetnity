from pathlib import Path
import hashlib,json,os,subprocess,tempfile,shutil,datetime

repo=Path('/tmp/jetnity-r105-b-v3-review-84c496c037cf')
head='84c496c037cff9e14102ff0fe3e6686fee33d5a6'
tree='3996b1bbe5eb11197c6e6450f0288d2ecbb3120c'
source=Path('/tmp/jetnity-r105-b-harness-prep/adapted/montage.ts')
css=Path('/tmp/jetnity-r105-b-css-84c496c0-20261024-2302z/jetnity-b-postcss-84c496c037cf.css')
sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git','-C',str(repo),*a],text=True).strip()
assert git('rev-parse','HEAD')==head and git('rev-parse','HEAD^{tree}')==tree
assert git('status','--porcelain')==''
raw=source.read_bytes();assert sha(raw)=='ca76794668f593fbd3a86fe4489f9ae301583d56ff736dee033166cb8ed0fbe7'
cssraw=css.read_bytes();assert sha(cssraw)=='6ea356ae1284e432eae27e9511923cf43550a4f80b34ac63c7235424e1f22af8'
out=Path(tempfile.mkdtemp(prefix='jetnity-r105-b-overflow-diagnostic-',dir='/tmp'))
needle='      if (mass.ueberlauf > 1) throw new Error(`${zustand} ${breite.name} Überlauf ${mass.ueberlauf}`)'
insert='''      if (mass.ueberlauf > 1) {
        const detail = await seite.evaluate(`(() => {
          const root = document.documentElement
          const all = [...document.body.querySelectorAll('*')]
          const offenders = all.filter((el) => el.getBoundingClientRect().right > root.clientWidth + 1 || el.getBoundingClientRect().left < -1 || el.scrollWidth > el.clientWidth + 1)
          function describe(el) {
            const r=el.getBoundingClientRect(),s=getComputedStyle(el),range=document.createRange();range.selectNodeContents(el);const tr=range.getBoundingClientRect()
            return {tag:el.tagName,classes:el.getAttribute('class'),name:el.getAttribute('name'),text:el.textContent?.slice(0,240),rect:{left:r.left,right:r.right,width:r.width,top:r.top,height:r.height},textRect:{left:tr.left,right:tr.right,width:tr.width,height:tr.height},scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,style:{display:s.display,width:s.width,minWidth:s.minWidth,maxWidth:s.maxWidth,boxSizing:s.boxSizing,fontSize:s.fontSize,fontFamily:s.fontFamily,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,whiteSpace:s.whiteSpace,overflowWrap:s.overflowWrap,wordBreak:s.wordBreak,flexShrink:s.flexShrink,gap:s.gap,padding:s.padding,overflowX:s.overflowX}}
          }
          return {viewport:{width:innerWidth,height:innerHeight},root:{clientWidth:root.clientWidth,scrollWidth:root.scrollWidth,font:getComputedStyle(root).fontSize},offenders:offenders.map(el=>({element:describe(el),ancestors:[el.parentElement,el.parentElement?.parentElement].filter(Boolean).map(el=>describe(el))}))}
        })()`)
        writeFileSync(join(ausgabe, 'overflow-diagnostic.json'), JSON.stringify(detail,null,2)+'\\n')
        await seite.screenshot({path:join(ausgabe,'overflow-320.png'),fullPage:false})
      }
'''
text=raw.decode();assert text.count(needle)==1
adapted=text.replace(needle,insert+needle)
assert adapted.replace(insert,'')==text
(out/'diagnostic-montage.ts').write_text(adapted)
(out/'node_modules').symlink_to((repo/'node_modules').resolve(),target_is_directory=True)
(out/'tmp').mkdir();(out/'cache').mkdir()
node=str(Path(shutil.which('node')).resolve())
env={'PATH':os.pathsep.join((str(Path(node).parent),os.defpath)),'LANG':'C.UTF-8','LC_ALL':'C.UTF-8','TZ':'UTC','TMPDIR':str(out/'tmp'),'XDG_CACHE_HOME':str(out/'cache'),'TSX_TSCONFIG_PATH':str(repo/'tsconfig.json'),'JETNITY_REVIEW_CHROMIUM':'/tmp/jetnity-r104-browsers/chromium-1187/chrome-linux/chrome','JETNITY_REVIEW_CSS_PATH':str(css)}
cmd=[node,'--import','./scripts/server-only-test-register.mjs','--import','tsx',str(out/'diagnostic-montage.ts'),'--ausgabe',str(out/'capture')]
record={'kind':'TARGETED_LAYOUT_FAILURE_DIAGNOSTIC_NOT_ACCEPTANCE','head':head,'tree':tree,'sourceSha256':sha(raw),'adaptedSha256':sha(adapted.encode()),'cssSha256':sha(cssraw),'command':cmd,'cwd':str(repo),'startedAtUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'onlyChange':'Capture failing DOM/computed styles and viewport screenshot immediately before unchanged overflow assertion. No assertion removed; execution stops on the same failure.'}
print(json.dumps({'starting':True,'output':str(out)}),flush=True)
p=subprocess.run(cmd,cwd=repo,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=90)
(out/'stdout.log').write_bytes(p.stdout);(out/'stderr.log').write_bytes(p.stderr)
record.update({'exitCode':p.returncode,'stderr':p.stderr.decode(),'finishedAtUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'cleanAfter':git('status','--porcelain')=='','headAfter':git('rev-parse','HEAD'),'treeAfter':git('rev-parse','HEAD^{tree}'),'sourceUnchanged':source.read_bytes()==raw,'cssUnchanged':css.read_bytes()==cssraw})
(out/'result.json').write_text(json.dumps(record,indent=2)+'\n')
assert record['cleanAfter'] and record['headAfter']==head and record['treeAfter']==tree and record['sourceUnchanged'] and record['cssUnchanged']
assert p.returncode==1 and 'liste 320 Überlauf 37' in p.stderr.decode()
assert (out/'capture/overflow-diagnostic.json').is_file() and (out/'capture/overflow-320.png').is_file()
print(json.dumps({'status':'EXPECTED_FAILURE_CAPTURED','output':str(out),'resultSha256':sha((out/'result.json').read_bytes())}),flush=True)
