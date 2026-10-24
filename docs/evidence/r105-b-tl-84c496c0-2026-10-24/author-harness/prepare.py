#!/usr/bin/env python3
"""Static source-copy preparation only: no Node, browser, test or build execution."""
from pathlib import Path
import hashlib
import json
import difflib

ROOT = Path(__file__).resolve().parent
REPO = Path('/tmp/jetnity-r105-b-v3-review-84c496c037cf')
MAIN = '9092b29c2e187bd73d644a3d85670f3ac6436be1'
PREFIX = 'scripts/account-booking-folder-completion-1/'

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def edit(label, old, new, count=1, category='environment'):
    return dict(label=label, old=old, new=new, count=count, category=category)

browser = lambda count: edit('isolated Chromium executable', 'chromium.launch()',
    'chromium.launch({ executablePath: process.env.JETNITY_REVIEW_CHROMIUM })', count)
main = edit('actual-main metadata, no shared ref mutation',
    "git(['rev-parse', 'origin/main'])", "git(['rev-parse', '" + MAIN + "'])", category='provenance')
css_original = """function cssLesen(): string {
  const dateien = cssDateien(join('.next', 'static'))
  if (dateien.length === 0) throw new Error('Production-CSS fehlt. Zuerst den Build ausführen.')
  return dateien.map((pfad) => readFileSync(pfad, 'utf8')).join('\\n')
}"""
css_adapter = """function cssLesen(): string {
  const pfad = process.env.JETNITY_REVIEW_CSS_PATH
  if (!pfad) throw new Error('Verifizierte lokale Projekt-PostCSS-Datei fehlt.')
  return readFileSync(pfad, 'utf8')
}"""
observer_declaration = """const bilder = join(ausgabe, 'screens')
// Root-only passive observer; no routing, interception, fixture or navigation changes.
const rootDiagnostik = {
  pageerror: [] as string[],
  consoleError: [] as string[],
  unexpectedRequests: [] as string[],
  requestFailed: [] as string[],
}"""
observer_hooks = """    const seite = await browser.newPage()
    seite.on('pageerror', (problem) => rootDiagnostik.pageerror.push(problem.message))
    seite.on('console', (meldung) => {
      if (meldung.type() === 'error') rootDiagnostik.consoleError.push(meldung.text())
    })
    seite.on('request', (anfrage) => {
      const url = anfrage.url()
      if (!url.startsWith('data:') && !url.startsWith('blob:') && url !== 'about:blank') {
        rootDiagnostik.unexpectedRequests.push(url)
      }
    })
    seite.on('requestfailed', (anfrage) => {
      rootDiagnostik.requestFailed.push(anfrage.url() + ' ' + (anfrage.failure()?.errorText ?? 'unknown'))
    })"""
observer_save = """} finally {
  await browser.close()
  writeFileSync(join(ausgabe, 'montage-root-observer.json'), `${JSON.stringify({
    kind: 'ROOT_ADDED_PASSIVE_MONTAGE_OBSERVER',
    diagnostics: rootDiagnostik,
  }, null, 2)}\\n`)
}"""
edits = {
 'ablauf.ts': [browser(2), main],
 'montage.ts': [
    browser(1), main,
    edit('truthful CSS source comment',
      '// CSS kommt aus dem Production-Build. Das ist keine Geräte-, Zoom- oder Screenreader-Prüfung.',
      '// CSS kommt aus lokaler Projekt-PostCSS-Kompilierung, nicht aus einem Next-Build. Keine Geräte-, Zoom- oder Screenreader-Prüfung.', category='provenance'),
    edit('external verified PostCSS input', css_original, css_adapter),
    edit('truthful CSS finding provenance',
      'CSS und Root-Font aus dem lokalen Production-Build in headless Chromium. Kein physisches Gerät, kein nativer Zoom, kein Screenreader, kein gehostetes Konto.',
      'LOCAL_PROJECT_POSTCSS_COMPILATION: CSS aus der unveränderten Projekt-PostCSS-Pipeline in headless Chromium. Kein Next-Build-CSS-Nachweis, kein physisches Gerät, kein nativer Zoom, kein Screenreader, kein gehostetes Konto.', category='provenance'),
    edit('truthful CSS scope provenance',
      'Statisches Markup mit CSS aus dem lokalen Production-Build. Kein Hydration, kein App-Router, kein nativer Zoom, kein Screenreader, kein gehostetes Konto. Root-Font 32px nur bei Breite 320, sonst 16px.',
      'Statisches Markup mit LOCAL_PROJECT_POSTCSS_COMPILATION aus der unveränderten Projekt-PostCSS-Pipeline. Kein Next-Build-CSS-Nachweis, keine Hydration, kein App-Router, kein nativer Zoom, kein Screenreader, kein gehostetes Konto. Root-Font 32px nur bei Breite 320, sonst 16px.', category='provenance'),
    edit('passive observer declaration', "const bilder = join(ausgabe, 'screens')", observer_declaration, category='observer-only'),
    edit('passive per-page listeners', '    const seite = await browser.newPage()', observer_hooks, category='observer-only'),
    edit('separate observer artifact after browser close', '} finally {\n  await browser.close()\n}', observer_save, category='observer-only'),
 ]
}
manifest = {'status':'PREPARED_NOT_EXECUTED', 'head':'84c496c037cff9e14102ff0fe3e6686fee33d5a6',
 'tree':'3996b1bbe5eb11197c6e6450f0288d2ecbb3120c', 'actualMain':MAIN,
 'originalLocalOriginMain':'07016ada86dcfc79d5c7c3efa9ba1d62336a1f60', 'scripts':{}}
(ROOT/'original').mkdir(exist_ok=False)
(ROOT/'adapted').mkdir(exist_ok=False)
diffs=[]
for name, changes in edits.items():
    raw=(REPO/PREFIX/name).read_bytes()
    original=raw.decode('utf-8')
    adapted=original
    for item in changes:
        assert adapted.count(item['old'])==item['count'], (name,item['label'],'old count')
        assert item['new'] not in adapted, (name,item['label'],'new already present')
        adapted=adapted.replace(item['old'],item['new'])
    reversed_text=adapted
    for item in reversed(changes):
        assert reversed_text.count(item['new'])==item['count'], (name,item['label'],'reverse count')
        reversed_text=reversed_text.replace(item['new'],item['old'])
    assert reversed_text.encode()==raw
    # The complete source outside each explicitly listed edit is identical.
    protected_original=original
    protected_adapted=adapted
    for index,item in enumerate(changes):
        marker='__ROOT_ADAPTER_SLOT_'+str(index)+'__'
        protected_original=protected_original.replace(item['old'],marker)
        protected_adapted=protected_adapted.replace(item['new'],marker)
    assert protected_original==protected_adapted
    out=adapted.encode()
    (ROOT/'original'/name).write_bytes(raw)
    (ROOT/'adapted'/name).write_bytes(out)
    blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
    manifest['scripts'][name]={'source':PREFIX+name,'gitBlob':blob,'originalSha256':digest(raw),
       'adaptedSha256':digest(out),'reverseAdaptedSha256':digest(reversed_text.encode()),
       'protectedSourceSha256':digest(protected_original.encode()),'reverseEqualsOriginal':True,
       'changes':changes}
    diffs.extend(difflib.unified_diff(original.splitlines(keepends=True),adapted.splitlines(keepends=True),
       fromfile='original/'+name,tofile='adapted/'+name))
(ROOT/'adaptation.diff').write_text(''.join(diffs))
(ROOT/'adaptation.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:{a:b for a,b in v.items() if a!='changes'} for k,v in manifest['scripts'].items()},indent=2))
