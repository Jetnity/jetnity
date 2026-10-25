#!/usr/bin/env python3
import datetime, hashlib, json, os, pathlib, re, subprocess, sys, tempfile
repo=pathlib.Path(sys.argv[1]).resolve()
head,tree=sys.argv[2:4]
assert re.fullmatch(r'/tmp/jetnity-[A-Za-z0-9._-]+',str(repo))
assert re.fullmatch(r'[0-9a-f]{40}',head) and re.fullmatch(r'[0-9a-f]{40}',tree)
files=[
'lib/trips/flug-manuell.test.ts','lib/trips/flug-route-form-validation.test.ts',
'lib/trips/unterkunft-manuell.test.ts','lib/trips/manual-journey-editor-completion-1.test.ts',
'lib/trips/organisieren-action-recovery-1.test.ts','lib/trips/lodging-coverage-truth-1.test.ts']
sources=files+['components/trips/FlugBestand.tsx','components/trips/UnterkunftBestand.tsx',
'components/trips/MobilitaetBereich.tsx','lib/trips/manual-journey-editor-completion-1.ts',
'scripts/server-only-test-register.mjs','scripts/server-only-test-loader.mjs','package.json','package-lock.json']
def git(*args):
 return subprocess.check_output(['git','-C',str(repo),*args]).decode().strip()
def binding():
 assert git('rev-parse','HEAD')==head and git('rev-parse','HEAD^{tree}')==tree
 assert git('status','--porcelain')==''
 assert subprocess.run(['git','-C',str(repo),'symbolic-ref','-q','HEAD'],capture_output=True).returncode==1
 out={}
 for p in sources:
  b=(repo/p).read_bytes()
  assert b==subprocess.check_output(['git','-C',str(repo),'show','HEAD:'+p]),p
  out[p]={'gitBlob':git('rev-parse','HEAD:'+p),'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)}
 return {'head':head,'tree':tree,'gitStatus':'','sources':out}
out=pathlib.Path(tempfile.mkdtemp(prefix='jetnity-r105-c-focused-final-proof-'))
out.joinpath('run.py').write_bytes(pathlib.Path(__file__).read_bytes())
record={'executionClass':'ROOT_EXECUTED_EXISTING_FOCUSED_TESTS','startedAtUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'output':str(out),'repo':str(repo),'expectedTests':113,'expectedSuites':13,'node':subprocess.check_output(['node','--version'],text=True).strip(),'permissionNote':'Normal process-isolated node:test invocation; executed with approved local subprocess permission. No single-process diagnostic fallback.','environment':'explicit non-secret PATH/LANG/LC_ALL/TZ only'}
exitcode=1
try:
 record['before']=binding()
 command=['node','--import','./scripts/server-only-test-register.mjs','--import','tsx','--test','--test-reporter=tap',*files]
 record['command']=command
 env={k:os.environ[k] for k in ['PATH','LANG','LC_ALL','TZ'] if k in os.environ}
 print(json.dumps({'starting':True,'head':head,'output':str(out)}),flush=True)
 run=subprocess.run(command,cwd=repo,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=180)
 out.joinpath('focused.tap').write_bytes(run.stdout)
 out.joinpath('stderr.log').write_bytes(run.stderr)
 record['exitCode']=run.returncode
 record['counts']={}
 text=run.stdout.decode()
 for k in ['tests','suites','pass','fail','cancelled','skipped','todo']:
  m=re.findall(r'^# '+k+r' (\d+)\r?$',text,re.M)
  assert len(m)==1,(k,m)
  record['counts'][k]=int(m[0])
 record['after']=binding()
 assert record['after']==record['before']
 assert run.returncode==0,run.returncode
 assert record['counts']=={'tests':113,'suites':13,'pass':113,'fail':0,'cancelled':0,'skipped':0,'todo':0},record['counts']
 record['status']='PASS'
 record['sourceBindingsUnchanged']=True
 exitcode=0
except Exception as e:
 record['status']='FAIL'
 record['error']=repr(e)
 try: record['after']=binding()
 except Exception as b: record['bindingError']=repr(b)
record['finishedAtUtc']=datetime.datetime.now(datetime.timezone.utc).isoformat()
record['artifacts']={p.name:{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in out.iterdir() if p.is_file()}
out.joinpath('result.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':record['status'],'output':str(out),'counts':record.get('counts'),'error':record.get('error'),'resultSha256':hashlib.sha256(out.joinpath('result.json').read_bytes()).hexdigest()}),flush=True)
sys.exit(exitcode)

