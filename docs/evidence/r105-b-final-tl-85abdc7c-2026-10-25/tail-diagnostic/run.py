#!/usr/bin/env python3
"""Root-only execution of one static list tail diagnostic; preparation does not run it."""
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
REPO = Path('/tmp/jetnity-r105-b-v4-review-85abdc7c33a3')
HEAD = '85abdc7c33a34b7a93a3fdb6f78f658940ee1063'
TREE = '9ea461a1ca193fd86314e2269f10cf8d2521ac8a'
MAIN = '9092b29c2e187bd73d644a3d85670f3ac6436be1'

def require(ok, message):
    if not ok:
        raise RuntimeError(message)

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def git_blob(raw):
    return hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()

def regular(path):
    require(path.is_absolute(), 'Absolute file path required')
    require(not any(p.is_symlink() for p in (path, *path.parents)), 'Symlink in input path: ' + str(path))
    require(path.is_file(), 'Missing regular file: ' + str(path))
    return path.read_bytes()

def save(path, value):
    with path.open('x', encoding='utf-8') as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2)
        handle.write('\n')

def utc():
    return dt.datetime.now(dt.timezone.utc).isoformat()

def main():
    manifest_raw = regular(ROOT / 'manifest.json')
    manifest = json.loads(manifest_raw)
    require((manifest['repo'], manifest['head'], manifest['tree'], manifest['main']) == (str(REPO), HEAD, TREE, MAIN), 'Prepared identity changed')
    require(manifest['status'] == 'PREPARED_NOT_EXECUTED', 'Unexpected preparation status')
    output = Path(tempfile.mkdtemp(prefix='jetnity-r105-b-v4-tail-viewport-proof-'))
    record = {'kind': 'ROOT_ONE_PAGE_TAIL_DIAGNOSTIC_EXECUTION', 'status': 'FAIL', 'startedAtUtc': utc(),
              'repo': str(REPO), 'head': HEAD, 'tree': TREE, 'main': MAIN, 'output': str(output),
              'manifestSha256': digest(manifest_raw), 'visualInspectionClaim': False,
              'remoteFreshnessChecked': False, 'authorMontageAssertionsModified': False,
              'permissionNote': 'Root controls execution permissions. No retry, escalation or alternate route in this controller.'}
    after_binding = None
    source_snapshot = None
    exit_code = 1
    try:
        for name in ('run.py', 'diagnostic.ts', 'fixture-source.ts', 'README.md'):
            raw = regular(ROOT / name)
            require(digest(raw) == manifest['tooling'][name]['sha256'], 'Prepared tool changed: ' + name)
            with (output / name).open('xb') as handle:
                handle.write(raw)
        with (output / 'manifest.json').open('xb') as handle:
            handle.write(manifest_raw)
        require(digest(regular(Path(manifest['priorProof']['path']))) == manifest['priorProof']['sha256'], 'Prior binding record changed')
        node = Path(manifest['nodeExecutable'])
        require(node.is_file() and os.access(node, os.X_OK), 'Pinned existing Node unavailable')
        git_exe = shutil.which('git')
        require(git_exe, 'Existing Git required')
        env = {'PATH': os.pathsep.join((str(node.parent), os.defpath)), 'LANG': 'C.UTF-8', 'LC_ALL': 'C.UTF-8',
               'TZ': 'UTC', 'TMPDIR': str(output / 'tmp'), 'XDG_CACHE_HOME': str(output / 'cache'),
               'TSX_TSCONFIG_PATH': str(REPO / 'tsconfig.json'), 'GIT_NO_REPLACE_OBJECTS': '1',
               'GIT_GRAFT_FILE': '/dev/null', 'GIT_NO_LAZY_FETCH': '1', 'GIT_TERMINAL_PROMPT': '0', 'GIT_OPTIONAL_LOCKS': '0'}
        for name in ('tmp', 'cache'):
            (output / name).mkdir(mode=0o700)
        overrides = ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', '-c', 'core.autocrlf=false']
        def git(*args, allowed=(0,)):
            run = subprocess.run([git_exe, *overrides, '-C', str(REPO), *args], env=env,
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
            require(run.returncode in allowed, 'Read-only Git failed: ' + ' '.join(args) + ': ' + run.stderr.decode('utf-8', 'replace'))
            return run
        def text(*args):
            return git(*args).stdout.decode().strip()
        require(text('rev-parse', '--show-toplevel') == str(REPO), 'Repository root mismatch')
        require(git('config', '--get-regexp', r'^(extensions\.partialclone|remote\..*\.promisor)$', allowed=(0, 1)).returncode == 1, 'Partial/promisor repo refused')
        filters = set()
        for key in git('config', '--null', '--name-only', '--get-regexp', r'^filter\.', allowed=(0, 1)).stdout.decode().split('\0'):
            if key:
                match = re.fullmatch(r'filter\.(.+)\.([A-Za-z][A-Za-z0-9-]*)', key)
                require(match and not any(ord(c) < 32 for c in key), 'Unsupported filter config key')
                filters.add(match[1])
        for name in sorted(filters):
            for setting, value in (('process', ''), ('clean', ''), ('smudge', ''), ('required', 'false')):
                overrides.extend(('-c', f'filter.{name}.{setting}={value}'))
        def binding():
            require(text('rev-parse', 'HEAD') == HEAD and text('rev-parse', 'HEAD^{tree}') == TREE, 'Exact head/tree mismatch')
            require(git('symbolic-ref', '-q', 'HEAD', allowed=(0, 1)).returncode == 1, 'Expected detached checkout')
            require(not git('status', '--porcelain=v1', '--untracked-files=all').stdout, 'Checkout is not clean')
            require(text('rev-parse', MAIN + '^{tree}') == manifest['mainTree'], 'Main object mismatch')
            require(text('merge-base', '--all', MAIN, HEAD) == MAIN, 'Merge-base mismatch')
            require(text('rev-list', '--left-right', '--count', MAIN + '...' + HEAD).split() == ['0', '13'], 'Actual-main relation differs')
            sources = {}
            for relative, expected in manifest['sources'].items():
                raw = regular(REPO / relative)
                require(git_blob(raw) == expected['gitBlob'] and digest(raw) == expected['sha256'] and len(raw) == expected['bytes'], 'Source bytes differ: ' + relative)
                require(text('rev-parse', 'HEAD:' + relative) == expected['gitBlob'], 'Head source blob differs: ' + relative)
                sources[relative] = expected
            return {'head': HEAD, 'tree': TREE, 'detached': True, 'cleanStatus': '', 'sources': sources}
        after_binding = binding
        source_snapshot = binding()
        record['before'] = source_snapshot
        record['neutralizedFilterDrivers'] = sorted(filters)
        fixture = manifest['fixtureSource']
        author = regular(REPO / fixture['path'])
        require(git_blob(author) == fixture['gitBlob'] and digest(author) == fixture['sha256'], 'Author montage changed')
        parts = []
        for segment in fixture['segments']:
            part = author[segment['startOffset']:segment['endOffset']]
            require(len(part) == segment['bytes'] and digest(part) == segment['sha256'], 'Fixture source slice differs')
            parts.append(part)
        reconstructed = bytes.fromhex(fixture['joinBytesHex']).join(parts) + bytes.fromhex(fixture['suffixBytesHex'])
        require(reconstructed == regular(ROOT / 'fixture-source.ts') and digest(reconstructed) == fixture['fixtureSha256'], 'Fixture extraction is not byte-exact')
        record['fixtureSource'] = fixture
        css = Path(manifest['css']['path'])
        css_raw = regular(css)
        provenance = Path(manifest['css']['provenancePath'])
        provenance_raw = regular(provenance)
        require(digest(css_raw) == manifest['css']['sha256'] and digest(provenance_raw) == manifest['css']['provenanceSha256'], 'CSS input changed')
        css_meta = json.loads(provenance_raw)
        require(css_meta['status'] == 'CSS_COMPILED_SOURCES_UNCHANGED' and css_meta['expectedHead'] == HEAD and css_meta['expectedTree'] == TREE, 'CSS provenance identity differs')
        require(css_meta['before'] == css_meta['after'] and css_meta['repo'] == str(REPO), 'CSS source provenance differs')
        require(css_meta['compilation']['kind'] == 'LOCAL_PROJECT_POSTCSS_COMPILATION' and css_meta['compilation']['cssSha256'] == digest(css_raw), 'CSS provenance class/digest differs')
        for item in css_meta['before']['sources']:
            expected = manifest['sources'][item['path']]
            require(item['gitBlob'] == expected['gitBlob'] and item['sha256'] == expected['sha256'], 'CSS source differs: ' + item['path'])
        record['css'] = manifest['css']
        dependency = (REPO / 'node_modules').resolve(strict=True)
        require(str(dependency) == manifest['nodeModules'] and dependency.is_dir(), 'Existing dependencies differ')
        (output / 'node_modules').symlink_to(dependency, target_is_directory=True)
        for name, package in manifest['packages'].items():
            raw = regular(dependency / name / 'package.json')
            require(digest(raw) == package['packageJsonSha256'], 'Dependency metadata changed: ' + name)
        chromium = Path(manifest['chromium']['executable'])
        require(os.access(chromium, os.X_OK) and digest(regular(chromium)) == manifest['chromium']['sha256'], 'Pinned existing Chromium differs')
        record['chromium'] = manifest['chromium']
        config = {'output': str(output), 'head': HEAD, 'tree': TREE, 'cssPath': str(css),
                  'cssSha256': digest(css_raw), 'chromium': str(chromium), 'nodeVersion': manifest['nodeVersion']}
        save(output / 'config.json', config)
        command = [str(node), '--import', './scripts/server-only-test-register.mjs', '--import', 'tsx',
                   str(output / 'diagnostic.ts'), str(output / 'config.json')]
        record['command'] = command
        record['environmentKeys'] = sorted(env)
        print(json.dumps({'starting': True, 'output': str(output), 'head': HEAD}), flush=True)
        try:
            child = subprocess.run(command, cwd=REPO, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
        except subprocess.TimeoutExpired as exc:
            for filename, data in (('stdout.log', exc.stdout), ('stderr.log', exc.stderr)):
                if data is not None:
                    (output / filename).write_bytes(data.encode() if isinstance(data, str) else data)
            raise
        (output / 'stdout.log').write_bytes(child.stdout)
        (output / 'stderr.log').write_bytes(child.stderr)
        record['exitCode'] = child.returncode
        record['after'] = binding()
        require(record['after'] == source_snapshot, 'Source binding changed')
        require(regular(css) == css_raw and regular(provenance) == provenance_raw, 'CSS changed during diagnostic')
        require(child.returncode == 0, 'Diagnostic process failed')
        result = json.loads(regular(output / 'diagnostic.json'))
        require(result['status'] == 'CAPTURED_REQUIRES_VISUAL_REVIEW' and result['renderCount'] == 1, 'Incomplete or non-single-render diagnostic')
        require(result['head'] == HEAD and result['tree'] == TREE and result['domChecksCompleted'] is True, 'Diagnostic identity/DOM checks differ')
        require(result['observer'] == {'pageerror': [], 'consoleError': [], 'unexpectedRequests': [], 'requestFailed': []}, 'Nonempty passive observer')
        screenshots = []
        for name in ('last-card-320x700.png', 'pagination-320x700.png'):
            raw = regular(output / name)
            require(raw[:8] == b'\x89PNG\r\n\x1a\n' and raw[12:16] == b'IHDR', 'Invalid PNG')
            width, height = struct.unpack('>II', raw[16:24])
            require((width, height) == (320, 700), 'Capture is not a 320x700 viewport')
            screenshots.append({'path': str(output / name), 'width': width, 'height': height, 'sha256': digest(raw), 'bytes': len(raw)})
        record['screenshots'] = screenshots
        record['diagnosticStatus'] = result['status']
        record['status'] = 'CAPTURED_REQUIRES_VISUAL_REVIEW'
        exit_code = 0
    except Exception as exc:
        record['error'] = type(exc).__name__ + ': ' + str(exc)
    finally:
        if after_binding is not None:
            try:
                record['finalBinding'] = after_binding()
                require(record['finalBinding'] == source_snapshot, 'Final source binding differs')
            except Exception as exc:
                record['finalBindingError'] = type(exc).__name__ + ': ' + str(exc)
                record['status'] = 'FAIL'
                exit_code = 1
        record['finishedAtUtc'] = utc()
        record['artifacts'] = {p.name: {'sha256': digest(p.read_bytes()), 'bytes': p.stat().st_size}
                               for p in output.iterdir() if p.is_file() and not p.is_symlink()}
        save(output / 'result.json', record)
        print(json.dumps({'status': record['status'], 'output': str(output), 'result': str(output / 'result.json'),
                          'error': record.get('error')}), flush=True)
    return exit_code

if __name__ == '__main__':
    raise SystemExit(main())
