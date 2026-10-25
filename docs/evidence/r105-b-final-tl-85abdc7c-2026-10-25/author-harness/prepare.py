#!/usr/bin/env python3
"""Prepare final-head source copies after Root accepts the author STOP.

Only read-only local Git commands and new output files; no Node/browser/build/test.
Usage: prepare.py REPO HEAD TREE MAIN NEW_PREPARED_DIRECTORY
"""
import argparse
import difflib
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess

TOOL_ROOT = Path(__file__).resolve().parent
EXPECTED_MAIN = '9092b29c2e187bd73d644a3d85670f3ac6436be1'
EXPECTED_MAIN_TREE = 'bc39c3b74b5cbab7c15595500ddc70a72de8826b'
PREFIX = 'scripts/account-booking-folder-completion-1/'
OBSERVED_INTERIM_HEAD = '824f1bab0a5415a0e8c118004d4b429d58bf47f1'
OBSERVED_BLOBS = {'ablauf.ts': 'e9b6f41a126aa19f53e7940c0e464ccdc26bce8c', 'montage.ts': 'dd6a3b8c51c80dd016117b0a529f19b2605195ac'}

def require(condition, message):
    if not condition:
        raise RuntimeError(message)

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def blob(raw):
    return hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()

def no_symlink(path):
    for item in (path, *path.parents):
        require(not item.is_symlink(), 'Symlink not permitted: ' + str(item))

def edit(label, old, new, count=1, category='environment'):
    return {'label': label, 'old': old, 'new': new, 'count': count, 'category': category}

CSS_ORIGINAL = """function cssLesen(): { text: string; sha256: string; dateien: { pfad: string; sha256: string; bytes: number }[] } {
  const dateien = cssDateien(join('.next', 'static')).sort()
  if (dateien.length === 0) throw new Error('Production-CSS fehlt. Zuerst den Build ausführen.')
  const eintraege = dateien.map((pfad) => {
    const inhalt = readFileSync(pfad)
    return { pfad, sha256: sha256(inhalt), bytes: inhalt.length, text: inhalt.toString('utf8') }
  })
  const text = eintraege.map((eintrag) => eintrag.text).join('\\n')
  return {
    text,
    sha256: sha256(text),
    dateien: eintraege.map(({ pfad, sha256: summe, bytes }) => ({ pfad, sha256: summe, bytes })),
  }
}"""

CSS_ADAPTER = """function cssLesen(): { text: string; sha256: string; dateien: { pfad: string; sha256: string; bytes: number }[] } {
  const pfad = process.env.JETNITY_REVIEW_CSS_PATH
  if (!pfad) throw new Error('Verifizierte lokale Projekt-PostCSS-Datei fehlt.')
  const inhalt = readFileSync(pfad)
  const text = inhalt.toString('utf8')
  return {
    text,
    sha256: sha256(text),
    dateien: [{ pfad, sha256: sha256(inhalt), bytes: inhalt.length }],
  }
}"""

OBSERVER_DECLARATION = """const bilder = join(ausgabe, 'screens')
// Root-only passive observer; no routing, interception, fixture or navigation changes.
const rootDiagnostik = {
  pageerror: [] as string[],
  consoleError: [] as string[],
  unexpectedRequests: [] as string[],
  requestFailed: [] as string[],
}"""

OBSERVER_HOOKS = """    const seite = await browser.newPage()
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

OBSERVER_SAVE = """} finally {
  await browser.close()
  writeFileSync(join(ausgabe, 'montage-root-observer.json'), `${JSON.stringify({
    kind: 'ROOT_ADDED_PASSIVE_MONTAGE_OBSERVER',
    diagnostics: rootDiagnostik,
  }, null, 2)}\\n`)
}"""

PROTECTED_REGIONS = [
    ('fixture-state-construction', 'function ansicht(', '\nfunction cssDateien('),
    ('computed-style-assertions', 'function stilePruefen(', '\nfunction dokument('),
    ('widths-states-keyboard-assertions', 'const breiten = [', '\nasync function montage('),
    ('measurement-overflow-style-keyboard-screenshots', '    const messungen = []', '    befund.zustaende[zustand] = messungen'),
]

def region(text, start, end):
    require(text.count(start) == 1 and text.count(end) == 1, 'Protected region boundary is ambiguous')
    first = text.index(start)
    last = text.index(end, first)
    return text[first:last + len(end)].encode('utf-8')

def edits_for(actual_main):
    browser = lambda count: edit('isolated Chromium executable', 'chromium.launch()', 'chromium.launch({ executablePath: process.env.JETNITY_REVIEW_CHROMIUM })', count)
    main = edit('actual-main metadata without shared-ref mutation', "git(['rev-parse', 'origin/main'])", "git(['rev-parse', '" + actual_main + "'])", category='provenance')
    return {
        'ablauf.ts': [browser(2), main],
        'montage.ts': [
            browser(1), main,
            edit('truthful CSS source comment', '// CSS kommt aus dem Production-Build. Das ist keine Geräte-, Zoom- oder Screenreader-Prüfung.', '// CSS kommt aus LOCAL_PROJECT_POSTCSS_COMPILATION, nicht aus einem Next-Build. Keine Geräte-, Zoom- oder Screenreader-Prüfung.', category='provenance'),
            edit('external verified PostCSS input retaining V4 object shape', CSS_ORIGINAL, CSS_ADAPTER),
            edit('truthful CSS finding provenance', 'CSS aus dem lokalen Next-Production-Build, injiziert als zusammengefügtes style-Element.', 'LOCAL_PROJECT_POSTCSS_COMPILATION: CSS aus der unveränderten Projekt-PostCSS-Pipeline, injiziert als style-Element. Kein Next-Build-CSS-Nachweis.', category='provenance'),
            edit('truthful CSS manifest provenance', 'Zusammengeführte Dateien unter .next/static mit Endung .css aus dem lokalen next build. Das ist nicht die unabhängige PostCSS-Kompilation der Prüfung.', 'LOCAL_PROJECT_POSTCSS_COMPILATION: Eine verifizierte CSS-Datei aus der unveränderten Projekt-PostCSS-Pipeline. Kein Next-Production-CSS-Gleichheitsnachweis; sha256/dateien dokumentieren genau diese Datei.', category='provenance'),
            edit('truthful CSS scope provenance', 'Statisches Markup mit CSS aus dem lokalen Production-Build.', 'Statisches Markup mit LOCAL_PROJECT_POSTCSS_COMPILATION aus der unveränderten Projekt-PostCSS-Pipeline. Kein Next-Build-CSS-Nachweis.', category='provenance'),
            edit('passive observer declaration', "const bilder = join(ausgabe, 'screens')", OBSERVER_DECLARATION, category='observer-only'),
            edit('passive per-page listeners', '    const seite = await browser.newPage()', OBSERVER_HOOKS, category='observer-only'),
            edit('separate observer after browser close', '} finally {\n  await browser.close()\n}', OBSERVER_SAVE, category='observer-only'),
        ],
    }

def adapt(raw, changes, name):
    original = raw.decode('utf-8')
    adapted = original
    for item in changes:
        require(adapted.count(item['old']) == item['count'], name + ': old slot count: ' + item['label'])
        require(item['new'] not in adapted, name + ': adapter already present: ' + item['label'])
        adapted = adapted.replace(item['old'], item['new'])
    reverse = adapted
    for item in reversed(changes):
        require(reverse.count(item['new']) == item['count'], name + ': reverse slot count')
        reverse = reverse.replace(item['new'], item['old'])
    require(reverse.encode('utf-8') == raw, name + ': reverse equality failed')
    protected_original, protected_adapted = original, adapted
    for index, item in enumerate(changes):
        marker = '__ROOT_V4_ADAPTER_SLOT_' + str(index) + '__'
        require(marker not in original and marker not in adapted, 'Protected marker collision')
        protected_original = protected_original.replace(item['old'], marker)
        protected_adapted = protected_adapted.replace(item['new'], marker)
    require(protected_original == protected_adapted, name + ': complete protected-source equality failed')
    regions = []
    if name == 'montage.ts':
        for label, start, end in PROTECTED_REGIONS:
            before, after = region(original, start, end), region(adapted, start, end)
            require(before == after, 'Protected assertion/fixture region changed: ' + label)
            regions.append({'label': label, 'start': start, 'end': end, 'sha256': digest(before), 'bytes': len(before)})
    return adapted.encode('utf-8'), {
        'source': PREFIX + name, 'gitBlob': blob(raw), 'originalSha256': digest(raw),
        'adaptedSha256': digest(adapted.encode('utf-8')), 'reverseAdaptedSha256': digest(reverse.encode('utf-8')),
        'protectedSourceSha256': digest(protected_original.encode('utf-8')), 'reverseEqualsOriginal': True,
        'protectedRegions': regions, 'changes': changes,
    }

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('repo', type=Path); parser.add_argument('head'); parser.add_argument('tree')
    parser.add_argument('main'); parser.add_argument('output', type=Path)
    parser.add_argument('--ablauf-blob', default=OBSERVED_BLOBS['ablauf.ts'])
    parser.add_argument('--montage-blob', default=OBSERVED_BLOBS['montage.ts'])
    args = parser.parse_args()
    for value in [args.head, args.tree, args.main, args.ablauf_blob, args.montage_blob]:
        require(re.fullmatch(r'[0-9a-f]{40}', value), 'Full lowercase SHA-1 values required')
    require(args.main == EXPECTED_MAIN, 'This reviewed preparation supports explicit main 9092b29 only; re-review tooling after main changes')
    require(args.repo.is_absolute() and re.fullmatch(r'/tmp/jetnity-[A-Za-z0-9._-]+', str(args.repo)), 'Direct absolute /tmp/jetnity-* repository required')
    no_symlink(args.repo); repo = args.repo.resolve(strict=True)
    require(args.output.is_absolute() and args.output.parent == Path('/tmp') and args.output.name.startswith('jetnity-r105-b-v4-'), 'New direct /tmp/jetnity-r105-b-v4-* output required')
    no_symlink(args.output); require(not args.output.exists() and args.output != repo, 'Prepared output must be new and outside source checkout')
    git_exe = shutil.which('git'); require(git_exe, 'Existing Git required')
    env = {'PATH': os.defpath, 'LANG': 'C.UTF-8', 'LC_ALL': 'C.UTF-8', 'TZ': 'UTC', 'GIT_NO_REPLACE_OBJECTS': '1', 'GIT_GRAFT_FILE': '/dev/null', 'GIT_NO_LAZY_FETCH': '1', 'GIT_TERMINAL_PROMPT': '0', 'GIT_OPTIONAL_LOCKS': '0'}
    overrides = ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', '-c', 'core.autocrlf=false']
    def git(*arguments, allowed=(0,)):
        result = subprocess.run([git_exe, *overrides, '-C', str(repo), *arguments], env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
        require(result.returncode in allowed, 'Read-only Git failed: ' + ' '.join(arguments))
        return result
    def text(*arguments):
        return git(*arguments).stdout.decode().strip()
    require(text('rev-parse', '--show-toplevel') == str(repo), 'Expected exact worktree root')
    require(text('rev-parse', '--show-object-format') == 'sha1', 'Only SHA-1 repositories supported')
    require(git('config', '--get-regexp', r'^(extensions\.partialclone|remote\..*\.promisor)$', allowed=(0, 1)).returncode == 1, 'Partial/promisor repository refused')
    filter_names = set()
    for key in git('config', '--null', '--name-only', '--get-regexp', r'^filter\.', allowed=(0, 1)).stdout.decode().split('\0'):
        if key:
            match = re.fullmatch(r'filter\.(.+)\.([A-Za-z][A-Za-z0-9-]*)', key)
            require(match and not any(ord(c) < 32 for c in key), 'Unsupported Git filter name')
            filter_names.add(match[1])
    for name in sorted(filter_names):
        for setting, value in (('process', ''), ('clean', ''), ('smudge', ''), ('required', 'false')):
            overrides.extend(('-c', f'filter.{name}.{setting}={value}'))
    require(text('rev-parse', 'HEAD') == args.head and text('rev-parse', 'HEAD^{tree}') == args.tree, 'Exact HEAD/tree mismatch')
    require(git('symbolic-ref', '-q', 'HEAD', allowed=(0, 1)).returncode == 1, 'Detached worktree required')
    require(not git('status', '--porcelain=v1', '--untracked-files=all').stdout, 'Clean worktree required')
    require(text('rev-parse', args.main + '^{tree}') == EXPECTED_MAIN_TREE, 'Actual-main tree mismatch')
    require(text('merge-base', '--all', args.main, args.head) == args.main, 'Actual main must be sole merge-base')
    behind, ahead = map(int, text('rev-list', '--left-right', '--count', args.main + '...' + args.head).split())
    require(behind == 0 and ahead > 0, 'Candidate must be ahead and not behind actual main')
    required_blobs = {'ablauf.ts': args.ablauf_blob, 'montage.ts': args.montage_blob}
    data, contracts, diffs = {}, {}, []
    for name, changes in edits_for(args.main).items():
        path = repo / PREFIX / name; no_symlink(path); raw = path.read_bytes()
        require(text('rev-parse', 'HEAD:' + PREFIX + name) == required_blobs[name] == blob(raw), 'Unreviewed source blob: ' + name)
        require(git('cat-file', 'blob', required_blobs[name]).stdout == raw, 'Working bytes differ from Git: ' + name)
        modified, contract = adapt(raw, changes, name)
        data[name] = (raw, modified); contracts[name] = contract
        diffs.extend(difflib.unified_diff(raw.decode().splitlines(keepends=True), modified.decode().splitlines(keepends=True), fromfile='original/' + name, tofile='adapted/' + name))
    manifest = {
        'status': 'PREPARED_NOT_EXECUTED', 'repo': str(repo), 'head': args.head, 'tree': args.tree,
        'actualMain': args.main, 'actualMainTree': EXPECTED_MAIN_TREE, 'mergeBase': args.main, 'ahead': ahead, 'behind': behind,
        'rootFinalStopRequiredBeforeInvocation': True, 'remoteFreshnessNotCheckedHere': True,
        'gitFilterDriversNeutralizedPerCommand': sorted(filter_names),
        'designInterimHead': OBSERVED_INTERIM_HEAD, 'sourceBlobsExplicitlyAccepted': required_blobs,
        'scripts': contracts, 'tooling': {name: digest((TOOL_ROOT / name).read_bytes()) for name in ('prepare.py', 'run.py', 'README.md')},
    }
    args.output.mkdir(mode=0o700)
    (args.output / 'original').mkdir(); (args.output / 'adapted').mkdir()
    for name, (raw, modified) in data.items():
        (args.output / 'original' / name).write_bytes(raw); (args.output / 'adapted' / name).write_bytes(modified)
    diff = ''.join(diffs).encode('utf-8'); manifest['adaptationDiffSha256'] = digest(diff)
    (args.output / 'adaptation.diff').write_bytes(diff)
    (args.output / 'adaptation.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    require(text('rev-parse', 'HEAD') == args.head and text('rev-parse', 'HEAD^{tree}') == args.tree and not git('status', '--porcelain=v1', '--untracked-files=all').stdout, 'Source changed during preparation')
    print(json.dumps({'status': manifest['status'], 'output': str(args.output), 'head': args.head, 'tree': args.tree, 'ahead': ahead, 'behind': behind, 'adaptationSha256': digest((args.output / 'adaptation.json').read_bytes())}))

if __name__ == '__main__':
    main()
