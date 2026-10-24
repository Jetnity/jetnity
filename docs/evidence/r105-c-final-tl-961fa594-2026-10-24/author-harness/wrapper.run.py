#!/usr/bin/env python3
"""Run the reviewed author C harness outside its checkout; never edit product files.

Usage: python run.py /tmp/EXACT_REVIEW_CHECKOUT FULL_HEAD FULL_TREE
Execute only after the final author STOP and independent source review.
"""

import base64
import datetime as dt
import difflib
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import signal
import subprocess
import sys
import tempfile


HARNESS_PATH = 'scripts/manual-journey-editor-completion-1/harness.mjs'
TEMPLATE_HARNESS_SHA256 = '58009d9835a73101b51d272961e4a94f69ce2fcbc280809b56fb4165a700af8c'
CHROMIUM = Path('/tmp/jetnity-r104-browsers/chromium-1187/chrome-linux/chrome')
DEPENDENCIES = Path('/tmp/jetnity-r104-review/node_modules')
PRODUCT_SOURCES = [
    'components/trips/FlugBestand.tsx',
    'components/trips/UnterkunftBestand.tsx',
    'components/trips/MobilitaetBereich.tsx',
    'lib/trips/manual-journey-editor-completion-1.ts',
]
BINDING_PATHS = PRODUCT_SOURCES + [
    HARNESS_PATH,
    'scripts/manual-journey-editor-completion-1/mount.tsx',
    'styles/globals.css',
    'tailwind.config.js',
    'package.json',
    'package-lock.json',
]
EXPECTED_SCENARIOS = [
    'flight-valid-schema-domain-reject-retry',
    'flight-add-remove-1-to-4',
    'flight-multileg-and-over-four-refusal',
    'flight-section-replacement-and-late-readback',
    'stay-focus-validation-escape-replacement-unmount',
    'connection-pending-domain-unconfirmed',
    'connection-preset-trip-late-result',
    'connection-late-r1-success-domain-reject-r2-pending',
    'connection-aborted-transition-releases-lock',
    'flight-saved-graph-readback',
    'flight-saved-graph-changed-trip',
    'flight-saved-graph-new-draft',
    'flight-speculative-trip-keeps-readback',
    'flight-late-r1-success-domain-reject-r2-pending',
    'stay-saved-graph-readback',
    'stay-saved-graph-changed-stay',
    'stay-saved-graph-new-draft',
    'stay-late-r1-success-domain-reject-r2-pending',
    'flight-other-row-readback-keeps-focus',
    'flight-pending-a-newer-b-keeps-focus',
    'stay-current-owner-focus',
    'stay-pending-a-newer-b-keeps-focus',
]
DIAGNOSTICS = [
    'behaviorBlockedRequests', 'behaviorPageErrors',
    'layoutBlockedRequests', 'layoutPageErrors',
    'blockedRequests', 'pageErrors',
]
OLD_BROWSER = """async function launchBrowser() {
  const errors = []
  try {
    return { browser: await chromium.launch({ headless: true }), channel: 'playwright-chromium', errors }
  } catch (error) {
    errors.push(String(error))
  }
  try {
    return { browser: await chromium.launch({ headless: true, channel: 'chrome' }), channel: 'chrome', errors }
  } catch (error) {
    errors.push(String(error))
  }
  return { browser: null, channel: null, errors }
}"""


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def sha256(raw):
    return hashlib.sha256(raw).hexdigest()


def git_object_sha(kind, raw):
    return hashlib.sha1(kind.encode('ascii') + b' ' + str(len(raw)).encode('ascii') + b'\0' + raw).hexdigest()


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def git(repo, *args, allowed=(0,)):
    environment = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}
    environment.update({
        'GIT_NO_REPLACE_OBJECTS': '1', 'GIT_GRAFT_FILE': '/dev/null',
        'GIT_NO_LAZY_FETCH': '1', 'GIT_TERMINAL_PROMPT': '0', 'GIT_OPTIONAL_LOCKS': '0',
    })
    command = [
        'git', '-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false',
        '-c', 'filter.lfs.process=', '-c', 'filter.lfs.clean=',
        '-c', 'filter.lfs.smudge=', '-c', 'filter.lfs.required=false',
        '-C', str(repo), *args,
    ]
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=environment)
    require(result.returncode in allowed, f'Git read failed: {args!r}; exit {result.returncode}')
    return result.stdout


def source_snapshot(repo, expected_head, expected_tree):
    require(git(repo, 'rev-parse', 'HEAD').decode().strip() == expected_head, 'HEAD changed or differs from expected')
    require(git(repo, 'rev-parse', 'HEAD^{tree}').decode().strip() == expected_tree, 'Tree differs from expected')
    require(git_object_sha('commit', git(repo, 'cat-file', 'commit', expected_head)) == expected_head, 'Commit bytes mismatch')
    require(git_object_sha('tree', git(repo, 'cat-file', 'tree', expected_tree)) == expected_tree, 'Tree bytes mismatch')
    require(git(repo, 'symbolic-ref', '-q', 'HEAD', allowed=(0, 1)) == b'', 'Review checkout must be detached')
    require(git(repo, 'status', '--porcelain=v1', '--untracked-files=all') == b'', 'Checkout must be completely clean')
    sources = {}
    for relative in BINDING_PATHS:
        path = repo / relative
        require(path.is_file() and not path.is_symlink(), f'Expected regular source file: {relative}')
        raw = path.read_bytes()
        expected_blob = git(repo, 'rev-parse', f'{expected_head}:{relative}').decode().strip()
        stored = git(repo, 'cat-file', 'blob', expected_blob)
        require(raw == stored, f'Source differs from exact Git blob: {relative}')
        require(git_object_sha('blob', raw) == expected_blob, f'Source Git SHA mismatch: {relative}')
        sources[relative] = {'gitBlob': expected_blob, 'sha256': sha256(raw), 'bytes': len(raw)}
    return {'head': expected_head, 'tree': expected_tree, 'cleanStatus': '', 'sources': sources}


def adapt_harness(original_bytes, repo, output):
    require(sha256(original_bytes) == TEMPLATE_HARNESS_SHA256, 'Author harness changed; review and refresh adapter explicitly')
    original = original_bytes.decode('utf-8')
    new_browser = """async function launchBrowser() {
  const errors = []
  try {
    return { browser: await chromium.launch({ headless: true, executablePath: %s }), channel: 'playwright-chromium', errors }
  } catch (error) {
    errors.push(String(error))
  }
  return { browser: null, channel: null, errors }
}""" % json.dumps(str(CHROMIUM))
    replacements = [
        ("const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..')", f'const REPO = {json.dumps(str(repo))}'),
        ("const EVIDENCE = join(REPO, 'docs/evidence/manual-journey-editor-completion-1')", f'const EVIDENCE = {json.dumps(str(output / "author-evidence"))}'),
        ("const OUT = join('/tmp', 'manual-journey-editor-completion-1')", f'const OUT = {json.dumps(str(output / "build"))}'),
        (OLD_BROWSER, new_browser),
    ]
    adapted = original
    for previous, replacement in replacements:
        require(adapted.count(previous) == 1, 'Adapter match is missing or ambiguous')
        adapted = adapted.replace(previous, replacement, 1)
    restored = adapted
    for previous, replacement in reversed(replacements):
        require(restored.count(replacement) == 1, 'Reverse adapter match is missing or ambiguous')
        restored = restored.replace(replacement, previous, 1)
    require(restored == original, 'Unexpected bytes changed outside adapter')
    boundary = 'function region(page, name) {'
    require(original.count(boundary) == adapted.count(boundary) == 1, 'Protected body marker is ambiguous')
    protected = original[original.index(boundary):]
    require(adapted[adapted.index(boundary):] == protected, 'Assertion/scenario/metadata body changed')
    groups = re.findall(r"evidence\.scenarios\.push\('([^']+)'\)", original)
    require(groups == EXPECTED_SCENARIOS, 'Expected 22 named groups changed')
    diff = ''.join(difflib.unified_diff(
        original.splitlines(keepends=True), adapted.splitlines(keepends=True),
        fromfile='author-original/harness.mjs', tofile='outside-checkout/harness.adapted.mjs',
    ))
    return adapted.encode('utf-8'), diff, {
        'adapterOnly': ['REPO', 'EVIDENCE', 'OUT', 'browser executable lookup; no fallback browser'],
        'SCREENS': 'unchanged expression; follows redirected EVIDENCE',
        'importsAndRequire': 'unchanged; external node_modules symlink provides dependencies',
        'originalSha256': sha256(original_bytes),
        'adaptedSha256': sha256(adapted.encode('utf-8')),
        'protectedBodySha256': sha256(protected.encode('utf-8')),
        'protectedBodyByteIdentical': True,
        'reverseAdaptationRestoresOriginal': True,
        'namedGroupCount': len(groups),
    }


def exclusive_write(path, raw):
    with path.open('xb') as target:
        target.write(raw)


def validate_evidence(evidence, before):
    require(evidence.get('status') == 'PASS', 'Author harness did not report PASS')
    require(evidence.get('failure') is None, 'Author harness reports a failure')
    require(evidence.get('headAtRun') == before['head'], 'Author result names a different HEAD')
    require(evidence.get('behaviorCount') == 22, 'Expected exactly 22 named groups')
    require(evidence.get('scenarios') == EXPECTED_SCENARIOS, 'Named group list/order differs')
    require(len(set(evidence['scenarios'])) == 22, 'Repeated/missing named groups')
    layouts = evidence.get('layouts')
    require(evidence.get('layoutCount') == 9 and isinstance(layouts, list) and len(layouts) == 9, 'Expected exactly 9 layouts')
    expected_layouts = [('280', 280, 720, 1), ('320', 320, 720, 1), ('360', 360, 740, 1), ('390', 390, 844, 1), ('430', 430, 900, 1), ('768', 768, 1024, 1), ('1280', 1280, 800, 1), ('landscape', 844, 320, 1), ('320', 320, 720, 2)]
    require([(x.get('viewport'), x.get('width'), x.get('height'), x.get('scale')) for x in layouts] == expected_layouts, 'Layout identities differ')
    for field in DIAGNOSTICS:
        require(evidence.get(field) == [], f'Nonempty or absent diagnostic array: {field}')
    expected_hashes = {p: before['sources'][p]['sha256'] for p in PRODUCT_SOURCES}
    require(evidence.get('sourceSha256') == expected_hashes, 'Author source hashes differ from independently bound sources')
    require(evidence.get('author') == 'Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1', 'Source-author metadata changed')
    require(evidence.get('session') == 'bc-02fbe98d-97ba-4c0b-a3b0-10857d784379', 'Source-session metadata changed')
    require(evidence.get('model') == 'grok-4.7-high-fast', 'Source-model metadata changed')
    require(evidence.get('command') == 'node scripts/manual-journey-editor-completion-1/harness.mjs', 'Original authored command metadata changed')
    require(evidence.get('browser', {}).get('launchErrors') == [], 'Browser launch reported errors')
    require(evidence.get('browser', {}).get('channel') == 'playwright-chromium', 'Unexpected browser lookup')
    require(bool(evidence.get('browser', {}).get('version')), 'Missing actual browser version')


def main():
    require(len(sys.argv) == 4, 'Usage: run.py REPO FULL_HEAD FULL_TREE')
    repo_arg, expected_head, expected_tree = sys.argv[1:]
    require(re.fullmatch(r'/tmp/jetnity-[A-Za-z0-9._-]+', repo_arg), 'Expected a direct /tmp/jetnity-* checkout')
    require(all(re.fullmatch(r'[0-9a-f]{40}', x) for x in (expected_head, expected_tree)), 'Expected full lowercase Git SHAs')
    repo = Path(repo_arg)
    require(repo.resolve(strict=True) == repo and not repo.is_symlink(), 'Checkout path cannot be a symlink')
    require((repo / 'node_modules').resolve(strict=True) == DEPENDENCIES.resolve(strict=True), 'Unexpected dependency store')
    require(CHROMIUM.is_file() and os.access(CHROMIUM, os.X_OK), 'Configured isolated Chromium is unavailable')
    node = Path(shutil.which('node') or '')
    require(node.is_file(), 'Node runtime is unavailable')
    before = source_snapshot(repo, expected_head, expected_tree)
    original = (repo / HARNESS_PATH).read_bytes()
    require(sha256(original) == TEMPLATE_HARNESS_SHA256, 'Author harness changed; review before adapting')
    output = Path(tempfile.mkdtemp(prefix='jetnity-r105-c-author-harness-', dir='/tmp'))
    adapted, diff, adapter = adapt_harness(original, repo, output)
    exclusive_write(output / 'harness.original.mjs', original)
    exclusive_write(output / 'harness.adapted.mjs', adapted)
    exclusive_write(output / 'adaptation.diff', diff.encode())
    exclusive_write(output / 'wrapper.run.py', Path(__file__).read_bytes())
    exclusive_write(output / 'mount.original.tsx', (repo / 'scripts/manual-journey-editor-completion-1/mount.tsx').read_bytes())
    (output / 'node_modules').symlink_to(DEPENDENCIES.resolve(strict=True), target_is_directory=True)
    command = [str(node), str(output / 'harness.adapted.mjs')]
    report = {
        'status': 'FAIL', 'startedAtUtc': now(), 'executionClass': 'ROOT_EXECUTED_AUTHOR_HARNESS',
        'independentCustomRunner': False,
        'provenanceNote': 'Author/session/model/command fields in author-evidence/result.json remain source-authored metadata. This sidecar records the actual Technical-Lead execution, not a new Cursor run.',
        'actualCommand': command, 'actualCommandShell': shlex.join(command),
        'actualWorkingDirectory': str(repo),
        'repo': str(repo), 'output': str(output), 'before': before, 'adapter': adapter,
        'wrapperSha256': sha256(Path(__file__).read_bytes()), 'browserExecutable': str(CHROMIUM),
        'childEnvironment': 'explicit non-secret PATH/LANG/LC_ALL/TZ/PLAYWRIGHT_BROWSERS_PATH only',
        'repositoryWritesIntended': False, 'historicalOutputsOverwritten': False,
        'sourceAuthorMetadataPreserved': True, 'testsIndependentOfAuthorHarness': 'NOT_RUN_BY_THIS_WRAPPER',
    }
    print(json.dumps({'starting': True, 'executionClass': report['executionClass'], 'head': expected_head, 'tree': expected_tree, 'output': str(output)}), flush=True)
    failed = False
    try:
        child_env = {
            'PATH': str(node.parent) + ':/usr/local/bin:/usr/bin:/bin',
            'LANG': 'C.UTF-8', 'LC_ALL': 'C.UTF-8', 'TZ': 'UTC',
            'PLAYWRIGHT_BROWSERS_PATH': '/tmp/jetnity-r104-browsers',
        }
        with (output / 'harness.stdout.log').open('xb') as stdout, (output / 'harness.stderr.log').open('xb') as stderr:
            child = subprocess.Popen(command, cwd=repo, env=child_env, stdout=stdout, stderr=stderr, start_new_session=True)
            try:
                code = child.wait(timeout=600)
            except subprocess.TimeoutExpired:
                os.killpg(child.pid, signal.SIGTERM)
                try:
                    child.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    os.killpg(child.pid, signal.SIGKILL)
                    child.wait()
                raise AssertionError('Author harness exceeded the bounded 600-second execution limit')
        report['childExitCode'] = code
        require(code == 0, f'Author harness exited {code}; retained logs are evidence')
        evidence_path = output / 'author-evidence/result.json'
        evidence = json.loads(evidence_path.read_text())
        validate_evidence(evidence, before)
        report['evidenceSha256'] = sha256(evidence_path.read_bytes())
        report['validatedAuthorResult'] = {'status': 'PASS', 'namedScenarioGroups': 22, 'layouts': 9, 'diagnosticArrays': {name: [] for name in DIAGNOSTICS}, 'actualBrowser': evidence['browser']}
    except Exception as exc:
        failed = True
        report['error'] = f'{type(exc).__name__}: {exc}'
    finally:
        try:
            after = source_snapshot(repo, expected_head, expected_tree)
            require(after == before, 'Source bindings changed during execution')
            require((output / 'harness.original.mjs').read_bytes() == original, 'Original copy changed')
            require((output / 'harness.adapted.mjs').read_bytes() == adapted, 'Adapted harness changed')
            report['after'] = after
            report['sourceBindingsUnchanged'] = True
        except Exception as exc:
            failed = True
            report['postRunBindingError'] = f'{type(exc).__name__}: {exc}'
        artifacts = {}
        for path in sorted(output.rglob('*')):
            if path.is_file() and not path.is_symlink():
                artifacts[str(path.relative_to(output))] = {'sha256': sha256(path.read_bytes()), 'bytes': path.stat().st_size}
        report['artifacts'] = artifacts
        report['status'] = 'FAIL' if failed else 'PASS'
        report['finishedAtUtc'] = now()
        exclusive_write(output / 'wrapper-result.json', (json.dumps(report, indent=2) + '\n').encode())
        print(json.dumps({'status': report['status'], 'output': str(output), 'result': str(output / 'wrapper-result.json'), 'resultSha256': sha256((output / 'wrapper-result.json').read_bytes()), 'error': report.get('error'), 'postRunBindingError': report.get('postRunBindingError')}), flush=True)
    return 1 if failed else 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print(json.dumps({'status': 'PREFLIGHT_REFUSED', 'error': f'{type(error).__name__}: {error}'}), file=sys.stderr)
        sys.exit(1)
