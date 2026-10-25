#!/usr/bin/env python3
"""Root execution only: exact B author action/layout harnesses with disclosed adapters.

Usage: python run.py REPO FULL_HEAD FULL_TREE CSS_FILE CSS_PROVENANCE_JSON
No Next build, hosted call, credentials, personal browser, retry or escalation.
"""
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent
CHROMIUM = Path('/tmp/jetnity-r104-browsers/chromium-1187/chrome-linux/chrome')
MAIN = '9092b29c2e187bd73d644a3d85670f3ac6436be1'
MAIN_TREE = 'bc39c3b74b5cbab7c15595500ddc70a72de8826b'
PREFIX = 'scripts/account-booking-folder-completion-1/'
SOURCES = (
    *(PREFIX + name for name in ('ablauf.ts', 'montage.ts', 'flaeche.tsx', 'crypto-browser-stub.ts')),
    'app/account/bookings/page.tsx', 'components/account/AccountBuchungen.tsx',
    'components/account/BuchungenFilter.tsx', 'lib/account/buchungen.ts',
    'lib/account/buchungen-abfrage.ts', 'lib/account/buchungen-daten.ts',
    'lib/account/reise-archiv.ts', 'lib/trips/buchung.ts', 'lib/trips/bezeichnungen.ts',
    'lib/trips/datum-anzeige.ts', 'lib/trips/workspace-mode.ts', 'types/trips.ts',
    'lib/api/datenbank-lesen.ts', 'lib/supabase/server.ts',
    'scripts/server-only-test-register.mjs', 'scripts/server-only-test-loader.mjs',
    'scripts/server-only-empty.js', 'scripts/server-only-empty.mjs',
    'package.json', 'package-lock.json', 'tsconfig.json',
    'styles/globals.css', 'postcss.config.js', 'tailwind.config.js', 'next.config.js',
    'docs/JETNITY_ACCOUNT_BOOKING_FOLDER_COMPLETION_1_TASK_V1_2026-10-24.md',
    'docs/JETNITY_ACCOUNT_BOOKING_FOLDER_COMPLETION_1_PLAN_2026-10-24.md',
)
STATES = ('liste', 'fortsetzung', 'leer', 'keine', 'fehler', 'ungueltig', 'fortsetzungLeer')
WIDTHS = (('280',280,700),('320',320,700),('360',360,800),('390',390,844),
          ('430',430,900),('768',768,1024),('1280',1280,800),('844x390',844,390))
SCREENSHOTS = ('bookings-liste-390.png','bookings-liste-320-32px.png','bookings-leer-390.png',
               'bookings-keine-390.png','bookings-fehler-390.png','bookings-fortsetzungLeer-390.png')

def require(ok, text):
    if not ok:
        raise RuntimeError(text)

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def blob(raw):
    return hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()

def utc():
    return dt.datetime.now(dt.timezone.utc).isoformat()

def no_symlink(path):
    for item in (path, *path.parents):
        require(not item.is_symlink(), 'Symlink is not permitted: '+str(item))

def regular(path):
    no_symlink(path)
    require(path.is_file(), 'Required regular file is absent: '+str(path))
    return path.read_bytes()

def save(path, value):
    with path.open('x', encoding='utf-8') as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2)
        handle.write('\n')

def validate_manifest(report, name, head, tree, node_version, sources, command):
    origin = report['herkunft']
    require(origin['autor']=='Jetnity Account Booking Folder Completion 1 — Cursor Generation 1', 'Author metadata changed')
    require(origin['session']=='bc-a34030c7-4c19-4c9f-863f-193cfdfa34da', 'Session metadata changed')
    require(origin['modell']=='grok-4.7-high-fast', 'Author model metadata changed')
    require(origin['kopf']==head and origin['baum']==tree and origin['main']==MAIN, 'Harness Git identity mismatch')
    require(origin['node']==node_version, 'Harness Node version mismatch')
    # process.argv excludes --import options; the sidecar records the full command.
    require(origin['befehl']==' '.join([command[0], *command[5:]]), 'Harness argv mismatch')
    require(isinstance(origin['quellen'],dict) and origin['quellen'], 'Missing source provenance')
    for path, ident in origin['quellen'].items():
        require(path in sources and ident==sources[path]['gitBlob'], 'Harness source provenance mismatch: '+path)
    if name=='ablauf':
        require(report['lader']=={'leer':'leer','kombiniert':1,'fortsetzungLeer':'fortsetzungLeer','gesehen':211}, 'Loader result mismatch')
        f=report['flaeche']
        require(f['viewport']=={'width':390,'height':844} and f['schrift']=='16px' and f['ort'].startswith('about:blank'), 'Action surface scope mismatch')
        require(f['suche']=={'titel':'Alpha','karten':[{'punkt':'00000000-0000-4000-8000-000000000001','titel':'Alpha Zürich'}]}, 'Search result mismatch')
        require(f['enter']=={'zustand':'keine','submitEnthaeltWeiter':False}, 'Enter result mismatch')
        require(f['reset']=={'titel':'','art':'','archiv':'alle','karten':50}, 'Reset result mismatch')
        require(f['zurueck']=={'historie':'/account/bookings','wiederholenHref':'/account/bookings','karten':50}, 'History result mismatch')
        require(f['retry']=={'gleich':True,'titel':'Flug 1','id':'00000000-0000-4000-8000-000000000001'}, 'Retry result mismatch')
        require(f['leer']=='leer' and f['ende']=='fortsetzungLeer', 'Empty state mismatch')
        require(f['plan']=='/reisen/00000000-0000-4000-8000-00000000004d?ansicht=plan&punkt=00000000-0000-4000-8000-000000000007', 'Plan target mismatch')
        return {'loaderVisibleRows':211,'viewport':f['viewport'],'browser':f['browser'],
                'originalActionErrorAndRequestGuards':'Preserved; asserted before manifest creation, arrays are not serialized.',
                'scope':report['grenze']}
    b=report['befund']
    require(list(b['zustaende'])==list(STATES) and list(b['tastatur'])==list(STATES), 'Montage state/keyboard set mismatch')
    require(b['bewegung']=='reduce', 'Reduced-motion setting mismatch')
    measurements=0
    for state in STATES:
        rows=b['zustaende'][state]
        require(len(rows)==8, 'Montage width count mismatch: '+state)
        require(isinstance(b['tastatur'][state],list) and b['tastatur'][state], 'Missing keyboard result: '+state)
        for row,(label,width,height) in zip(rows,WIDTHS):
            require((row['name'],row['width'],row['height'])==(label,width,height), 'Montage viewport mismatch')
            require(row['schrift']==('32px' if label=='320' else '16px'), 'Montage font mismatch')
            require(row['zustand']==('liste' if state=='fortsetzung' else state), 'Montage DOM state mismatch')
            require(row['ueberlauf']==0, 'Montage has nonzero overflow')
            measurements+=1
    require('LOCAL_PROJECT_POSTCSS_COMPILATION' in report['grenze'] and 'LOCAL_PROJECT_POSTCSS_COMPILATION' in b['hinweis'], 'CSS provenance message missing')
    return {'measurements':measurements,'states':7,'keyboardPaths':7,'maximumOverflow':0,
            'browser':b['browser'],'scope':report['grenze']}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('repo',type=Path);parser.add_argument('head');parser.add_argument('tree')
    parser.add_argument('css',type=Path);parser.add_argument('css_provenance',type=Path)
    args=parser.parse_args()
    require(args.repo.is_absolute(), 'Absolute repository path required')
    no_symlink(args.repo)
    repo=args.repo.resolve(strict=True)
    require(re.fullmatch(r'/tmp/jetnity-[A-Za-z0-9._-]+',str(repo)), 'Expected direct /tmp/jetnity-* review checkout')
    adapter_raw=regular(ROOT/'adaptation.json');adapter=json.loads(adapter_raw)
    require(args.head==adapter['head'] and args.tree==adapter['tree'] and adapter['actualMain']==MAIN, 'Prepared adapter is bound to a different exact candidate')
    output=Path(tempfile.mkdtemp(prefix='jetnity-r105-b-harness-final-proof-',dir='/tmp'))
    record={'executionClass':'ROOT_EXECUTED_AUTHOR_ACTION_AND_MONTAGE_HARNESSES',
      'executor':'Technical Lead / root local execution', 'status':'FAIL','startedAtUtc':utc(),
      'repo':str(repo),'expectedHead':args.head,'expectedTree':args.tree,'actualMain':MAIN,
      'actualMainEvidence':'Root-provided freshly observed GitHub actual main; wrapper performs local object/ancestry checks only.',
      'output':str(output),'actualWorkingDirectory':str(repo),'nextBuildClaim':False,
      'authorMetadataMeaning':'herkunft.autor/session/modell identify source authorship, not the executor of this fresh run.',
      'permissionNote':'Caller controls approved local execution permissions. No escalation, retry or alternate execution path exists.',
      'adaptationManifestSha256':digest(adapter_raw),'phase':'preflight','runs':[]}
    bindings_safe=False;exit_code=1;artifact_paths=[]
    node=shutil.which('node');git_exe=shutil.which('git')
    require(node and git_exe, 'Existing Node/Git executables required')
    node=str(Path(node).resolve());git_exe=str(Path(git_exe).resolve())
    env={'PATH':os.pathsep.join((str(Path(node).parent),os.defpath)),
         'LANG':'C.UTF-8','LC_ALL':'C.UTF-8','TZ':'UTC',
         'XDG_CACHE_HOME':str(output/'cache'),'TMPDIR':str(output/'tmp'),
         'TSX_TSCONFIG_PATH':str(repo/'tsconfig.json'),
         'JETNITY_REVIEW_CHROMIUM':str(CHROMIUM),'JETNITY_REVIEW_CSS_PATH':str(args.css)}
    git_safety={'GIT_NO_REPLACE_OBJECTS':'1','GIT_GRAFT_FILE':'/dev/null','GIT_NO_LAZY_FETCH':'1',
                'GIT_TERMINAL_PROMPT':'0','GIT_OPTIONAL_LOCKS':'0'}
    git_env={**env,**git_safety}
    overrides=['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-c','core.autocrlf=false']
    def git(*arguments,allowed=(0,)):
        result=subprocess.run([git_exe,*overrides,'-C',str(repo),*arguments],env=git_env,
          stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=30)
        require(result.returncode in allowed,'Git failed '+str(result.returncode)+': '+' '.join(arguments)+': '+result.stderr.decode('utf-8','replace'))
        return result
    def text(*arguments):
        return git(*arguments).stdout.decode().strip()
    def binding():
        require(text('rev-parse','HEAD')==args.head and text('rev-parse','HEAD^{tree}')==args.tree,'Exact HEAD/tree mismatch')
        require(text('write-tree')==args.tree and not git('status','--porcelain=v1','--untracked-files=all').stdout,'Checkout is not clean')
        require(git('symbolic-ref','-q','HEAD',allowed=(0,1)).returncode==1,'Expected detached checkout')
        require(text('rev-parse',MAIN+'^{tree}')==MAIN_TREE,'Actual-main tree mismatch')
        require(text('merge-base','--all',MAIN,args.head)==MAIN,'Actual-main merge-base mismatch')
        require(text('rev-list','--left-right','--count',MAIN+'...'+args.head).split()==['0','10'],'Actual-main range mismatch')
        sources={}
        for relative in SOURCES:
            raw=regular(repo/relative);ident=text('rev-parse','HEAD:'+relative)
            require(blob(raw)==ident and raw==git('cat-file','blob',ident).stdout,'Raw Git bytes changed: '+relative)
            sources[relative]={'gitBlob':ident,'sha256':digest(raw),'bytes':len(raw)}
        return {'head':args.head,'tree':args.tree,'detached':True,'gitStatus':'','actualMain':MAIN,
                'mainTree':MAIN_TREE,'mergeBase':MAIN,'ahead':10,'behind':0,
                'localOriginMain':text('rev-parse','origin/main'),'sources':sources}
    try:
        require(text('rev-parse','--show-toplevel')==str(repo),'REPO must be working-tree root')
        require(text('rev-parse','--show-object-format')=='sha1','Only SHA-1 Git objects supported')
        require(git('config','--get-regexp',r'^(extensions\.partialclone|remote\..*\.promisor)$',allowed=(0,1)).returncode==1,'Partial/promisor repository refused')
        names=set()
        for key in git('config','--null','--name-only','--get-regexp',r'^filter\.',allowed=(0,1)).stdout.decode().split('\0'):
            if key:
                match=re.fullmatch(r'filter\.(.+)\.([A-Za-z][A-Za-z0-9-]*)',key)
                require(match and not any(ord(c)<32 for c in key),'Unsupported filter name')
                names.add(match[1])
        for name in sorted(names):
            for setting,value in (('process',''),('clean',''),('smudge',''),('required','false')):
                overrides.extend(('-c',f'filter.{name}.{setting}={value}'))
        # Give the unchanged harness Git calls the same command-local safety settings.
        settings=[overrides[i+1].split('=',1) for i in range(0,len(overrides),2)]
        env.update(git_safety);env['GIT_CONFIG_COUNT']=str(len(settings))
        for index,(key,value) in enumerate(settings):
            env[f'GIT_CONFIG_KEY_{index}']=key;env[f'GIT_CONFIG_VALUE_{index}']=value
        bindings_safe=True;before=binding();record['before']=before
        record['environmentKeys']=sorted(env);record['environmentValuesRecorded']=False
        record['gitFilterDriversNeutralizedPerProcess']=sorted(names)
        for name in ('cache','tmp','copies'):
            (output/name).mkdir(mode=0o700)
        dependency=(repo/'node_modules').resolve(strict=True)
        require(dependency.is_dir(),'Existing dependencies required; no install')
        (output/'node_modules').symlink_to(dependency,target_is_directory=True)
        record['resolvedNodeModules']=str(dependency)
        require(CHROMIUM.is_file() and os.access(CHROMIUM,os.X_OK),'Configured Chromium executable missing')
        record['chromium']={'executable':str(CHROMIUM),'sha256':digest(CHROMIUM.read_bytes())}
        # Static package metadata; actual execution version is read only when invoked by Root.
        lock=json.loads((repo/'package-lock.json').read_text());packages={}
        for name in ('tsx','esbuild','playwright','playwright-core','react','react-dom','next','lucide-react','@supabase/supabase-js','@supabase/ssr','zod'):
            p=dependency/name/'package.json';raw=p.read_bytes();data=json.loads(raw)
            locked=lock.get('packages',{}).get('node_modules/'+name,{}).get('version')
            packages[name]={'version':data['version'],'lockedVersion':locked,'packageJsonSha256':digest(raw)}
            require(locked is None or data['version']==locked,'Installed dependency differs from lock: '+name)
        record['packages']=packages
        for p in (args.css,args.css_provenance):
            require(p.is_absolute() and p.is_relative_to(Path('/tmp')) and not p.is_relative_to(repo),'External absolute /tmp CSS inputs required')
        css_raw=regular(args.css);provenance_raw=regular(args.css_provenance);css_meta=json.loads(provenance_raw)
        require(css_meta['status']=='CSS_COMPILED_SOURCES_UNCHANGED' and css_meta['expectedHead']==args.head and css_meta['expectedTree']==args.tree,'CSS provenance identity mismatch')
        require(css_meta['repo']==str(repo) and css_meta['actualWorkingDirectory']==str(repo) and css_meta['before']==css_meta['after'],'CSS cwd/source provenance mismatch')
        require(css_meta['wrapperSha256']=='8ffc4d8512cc94577fa531753a9f9629ad97cf769470cc52fbaa519b4d3c56d0' and css_meta['helperSha256']=='da4a232c1555744561a5067c155f8337f4fab63b51014842e11639c8facd3ea1','Unexpected CSS producer')
        compilation=css_meta['compilation']
        require(compilation['kind']=='LOCAL_PROJECT_POSTCSS_COMPILATION' and compilation['nextBuildClaim'] is False,'CSS class mismatch')
        require(compilation['outputPath']==str(args.css) and compilation['cssSha256']==digest(css_raw) and compilation['cssBytes']==len(css_raw),'CSS output hash mismatch')
        require(compilation['inputSha256']==before['sources']['styles/globals.css']['sha256'],'CSS input hash mismatch')
        for source in css_meta['before']['sources']:
            require(source['path'] in before['sources'] and source['gitBlob']==before['sources'][source['path']]['gitBlob'] and source['sha256']==before['sources'][source['path']]['sha256'],'CSS source mismatch')
        record['css']={'path':str(args.css),'sha256':digest(css_raw),'provenancePath':str(args.css_provenance),
                       'provenanceSha256':digest(provenance_raw),'class':compilation['kind'],'nextBuildClaim':False,
                       'compilerWarnings':compilation['warnings']}
        for name in ('run.py','prepare.py','adaptation.json','adaptation.diff','README.md'):
            shutil.copyfile(ROOT/name,output/name);artifact_paths.append(output/name)
        record['adapters']={}
        for name,contract in adapter['scripts'].items():
            original=regular(repo/contract['source']);adapted=regular(ROOT/'adapted'/name)
            require(digest(original)==contract['originalSha256'] and blob(original)==contract['gitBlob'],'Original harness pin mismatch')
            require(digest(adapted)==contract['adaptedSha256'],'Prepared adapter changed')
            reverse=adapted.decode()
            for change in reversed(contract['changes']):
                require(reverse.count(change['new'])==change['count'],'Reverse adapter count mismatch')
                reverse=reverse.replace(change['new'],change['old'])
            require(reverse.encode()==original and digest(reverse.encode())==contract['reverseAdaptedSha256'],'Reverse source equality failed')
            destination=output/'copies'/name
            with destination.open('xb') as handle:handle.write(adapted)
            artifact_paths.append(destination)
            record['adapters'][name]={k:v for k,v in contract.items() if k!='changes'}
        record['phase']='node-version'
        version=subprocess.run([node,'--version'],cwd=repo,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=10)
        require(version.returncode==0,'Node version command failed')
        node_version=version.stdout.decode().strip();require(re.fullmatch(r'v\d+\.\d+\.\d+',node_version),'Unexpected Node version')
        record['nodeVersion']=node_version;record['nodeExecutable']=node
        print(json.dumps({'starting':True,'output':str(output),'head':args.head}),flush=True)
        for name in ('ablauf','montage'):
            require(binding()==before,'Sources changed before '+name)
            require(regular(args.css)==css_raw and regular(args.css_provenance)==provenance_raw,'CSS inputs changed before '+name)
            target=output/name;require(not target.exists(),'Output must be fresh')
            command=[node,'--import','./scripts/server-only-test-register.mjs','--import','tsx',str(output/'copies'/(name+'.ts')),'--ausgabe',str(target)]
            item={'name':name,'command':command,'cwd':str(repo),'startedAtUtc':utc()};record['runs'].append(item)
            record['phase']=name+'-execution'
            try:
                child=subprocess.run(command,cwd=repo,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=240)
            except subprocess.TimeoutExpired as error:
                item['timedOut']=True
                for suffix,raw in (('stdout.log',error.stdout),('stderr.log',error.stderr)):
                    if raw is not None:
                        p=output/(name+'-'+suffix);p.write_bytes(raw.encode() if isinstance(raw,str) else raw);artifact_paths.append(p)
                raise
            for suffix,raw in (('stdout.log',child.stdout),('stderr.log',child.stderr)):
                p=output/(name+'-'+suffix);p.write_bytes(raw);artifact_paths.append(p)
            item.update({'exitCode':child.returncode,'stdoutSha256':digest(child.stdout),'stderrSha256':digest(child.stderr),'finishedAtUtc':utc()})
            item['after']=binding();require(item['after']==before,'Sources changed during '+name)
            require(child.returncode==0,name+' exited '+str(child.returncode))
            manifest_path=target/(name+'.json');manifest=json.loads(regular(manifest_path));artifact_paths.append(manifest_path)
            item['manifestValidation']=validate_manifest(manifest,name,args.head,args.tree,node_version,before['sources'],command)
            if name=='ablauf':
                bundle=Path(manifest['bundle']);require(bundle.is_relative_to(output/'tmp'),'Action bundle escaped isolated output')
                regular(bundle);artifact_paths.append(bundle)
            else:
                observer_path=target/'montage-root-observer.json';observer=json.loads(regular(observer_path));artifact_paths.append(observer_path)
                require(observer['kind']=='ROOT_ADDED_PASSIVE_MONTAGE_OBSERVER','Unexpected observer class')
                require(observer['diagnostics']=={'pageerror':[],'consoleError':[],'unexpectedRequests':[],'requestFailed':[]},'Nonempty montage diagnostics')
                item['passiveObserver']=observer
                screens=target/'screens';require(sorted(p.name for p in screens.iterdir())==sorted(SCREENSHOTS),'Expected exactly six fresh PNG artifacts')
                item['screenshots']=[]
                for filename in SCREENSHOTS:
                    p=screens/filename;raw=regular(p);require(raw[:8]==b'\x89PNG\r\n\x1a\n' and raw[12:16]==b'IHDR','Invalid screenshot PNG')
                    width,height=struct.unpack('>II',raw[16:24]);expected_width=320 if '-320-' in filename else 390
                    require(width==expected_width and height>=(700 if width==320 else 844),'Screenshot dimensions unexpected')
                    artifact_paths.append(p);item['screenshots'].append({'path':str(p),'width':width,'height':height,'sha256':digest(raw),'bytes':len(raw)})
        record['after']=binding();require(record['after']==before,'Final source bindings changed')
        require(regular(args.css)==css_raw and regular(args.css_provenance)==provenance_raw,'CSS/provenance changed during execution')
        record.update({'status':'PASS','phase':'complete','sourceBindingsUnchanged':True,
          'limitations':['Root executed preserved author assertions with explicit environment/provenance adapters.',
            'Action data is a synthetic URL interpreter using String.includes, not PostgreSQL matching or hosted RLS.',
            'Action history is one about:blank document; no Next Router route restoration is proved.',
            'Montage uses local project PostCSS compilation, not Next production CSS or a Next build.',
            'Static montage and headless synthetic UI do not prove a physical device, native zoom or screenreader.',
            'Author self-review, native CI and actual-main postmerge gates remain separate.']})
        exit_code=0
    except Exception as exc:
        record['error']=type(exc).__name__+': '+str(exc)
        if bindings_safe:
            try:record['afterFailure']=binding()
            except Exception as problem:record['afterFailureError']=type(problem).__name__+': '+str(problem)
    finally:
        record['finishedAtUtc']=utc()
        record['artifacts']={str(p.relative_to(output)):{'sha256':digest(p.read_bytes()),'bytes':p.stat().st_size}
                             for p in artifact_paths if p.is_file() and not p.is_symlink()}
        save(output/'result.json',record)
        print(json.dumps({'status':record['status'],'output':str(output),'result':str(output/'result.json'),
                          'error':record.get('error'),'resultSha256':digest((output/'result.json').read_bytes())}),flush=True)
    return exit_code

if __name__=='__main__':
    raise SystemExit(main())
