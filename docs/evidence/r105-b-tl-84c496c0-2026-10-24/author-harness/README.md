# B final action and montage wrapper

Status: **PREPARED / NOT EXECUTED by the setup agent.**

The prepared candidate is HEAD `84c496c037cff9e14102ff0fe3e6686fee33d5a6`, tree `3996b1bbe5eb11197c6e6450f0288d2ecbb3120c`. Actual main supplied by the Technical Lead is `9092b29c2e187bd73d644a3d85670f3ac6436be1`, tree `bc39c3b74b5cbab7c15595500ddc70a72de8826b`; the local relation must be exactly 10 ahead / 0 behind with that merge-base.

## Root command after inspection

```bash
python /tmp/jetnity-r105-b-harness-prep/run.py \
  /tmp/jetnity-r105-b-v3-review-84c496c037cf \
  84c496c037cff9e14102ff0fe3e6686fee33d5a6 \
  3996b1bbe5eb11197c6e6450f0288d2ecbb3120c \
  /tmp/jetnity-r105-b-css-84c496c0-20261024-2302z/jetnity-b-postcss-84c496c037cf.css \
  /tmp/jetnity-r105-b-css-84c496c0-20261024-2302z/css-provenance-84c496c037cf.json
```

The wrapper creates a unique `/tmp/jetnity-r105-b-harness-final-proof-*` directory. It invokes the two copied scripts sequentially as:

```text
NODE --import ./scripts/server-only-test-register.mjs --import tsx COPIED_SCRIPT --ausgabe NEW_OUTPUT
```

Both children use **the exact repository root as their working directory**. The original fresh-output `--ausgabe` parser and guard remain byte-identical. The action esbuild entry point, aliases, fixture, commit witness, assertions and test sequence are unchanged; its temporary browser bundle is directed below the fresh proof directory through TMPDIR. The Node import alias resolver uses the unchanged repository tsconfig through TSX_TSCONFIG_PATH. An output-local node_modules symlink resolves copied scripts to the already installed repository dependencies. No installation or configuration file mutation occurs.

## Complete source-copy disclosure

Inspect `adaptation.diff`, `adaptation.json`, and `adapted/ablauf.ts` / `adapted/montage.ts` before executing. Original copies are in `original/`. `prepare.py` only creates and hashes these copies; it executes no Node, browser, test or build.

Every replacement requires its declared exact occurrence count. Reversing the replacements must reproduce the original bytes. The source with the listed adapter slots replaced by markers is also byte-identical and has a recorded protected-source hash. The runtime wrapper repeats original/adapted pin and reverse equality checks before executing.

The action copy has two changes: both Chromium launches receive the configured isolated executable, and its one provenance lookup resolves the verified actual-main commit instead of the stale local origin/main ref. The montage copy makes the same executable and main metadata changes, replaces only the CSS reader with the independently compiled and verified CSS input, and corrects its three CSS provenance messages.

The shared local `origin/main` was observed at historical `07016ada86dcfc79d5c7c3efa9ba1d62336a1f60`. It is neither moved nor treated as live main. The adapter uses an explicit commit lookup for `9092b29…`, whose tree, merge-base and 10/0 relation are independently checked locally. Root supplies the current remote observation; this wrapper performs no network check.

Montage additionally receives a **separate passive observer** for pageerror, console error, unexpected request and requestfailed events. It does not intercept, navigate, replace fixtures or alter existing assertions. It serializes a separate `montage-root-observer.json` after browser close; the wrapper requires all four arrays to be empty. The action retains its original hard checks for page/console errors and external requests; those arrays are not serialized by the original action manifest, and the sidecar states that limitation explicitly.

## Provenance and gates

The CSS input must be produced by the inspected CSS runner and helper, with their exact SHA256 pins. Its sidecar must bind this repository, final head and tree, unchanged before/after source bytes, the same cwd, and the actual CSS digest. Its evidence class is **LOCAL_PROJECT_POSTCSS_COMPILATION**. This wrapper consumes no `.next` CSS and makes no Next build or Next output equivalence claim. Root's native Next build gate remains separate.

Before, between and after children, the wrapper verifies detached HEAD, tree, index tree, clean tracked/untracked status, actual-main ancestry, and raw Git blob plus SHA256 identities of 31 bounded runtime/harness/config/contract inputs. Full HEAD/tree and clean state bind the remainder of the repository. This is no additional semantic review of held work. Package versions, lockfile versions and installed package metadata hashes are recorded; a present lock version must match. The configured Chromium executable and its SHA256 are recorded. Node version is read only during the eventual Root invocation.

Both child exits must be zero. The original manifest identity, author/session/model, original source Git blobs, actual argv and Node version must match. `herkunft.autor/session/modell` remain **source-author metadata**. The separate sidecar identifies **Root** as the executor of this fresh run and never calls it a fresh Cursor run.

The action manifest must retain the 211-row loader result and recorded Search, Enter, Reset, Back, retry, empty/end and plan target outcomes. The unchanged internal assertions additionally cover the 50th-row cursor, ties, null continuation and beyond-200 scope. The action remains a synthetic URL interpreter with String.includes and same-document history, not PostgreSQL matching, hosted RLS or Next Router evidence.

Montage must contain the exact seven states and eight layouts per state, all 56 measurements with zero overflow, the intended 32px root font only at width 320, seven nonempty keyboard traces, and exactly six fresh PNG screenshots. PNG signature, width/height, byte length and SHA256 are checked. Existing `fullPage: true` statements remain unchanged. Root should inspect the six images as part of its visual review. Physical device, native zoom and screenreader acceptance are not implied.

## Local isolation and artifacts

The child environment is constructed from explicit PATH, locale/timezone, new output-local cache/temp directories, the tsconfig path, Chromium/CSS paths, and command-local safe Git settings. HOME is neither overridden nor repurposed; no unused home directory is created. No provider/database/cloud credentials, dotenv values, inherited NODE_OPTIONS or NODE_PATH are passed or recorded. Git hooks, fsmonitor, lazy network fetch and configured clean/smudge filters are disabled per process. No global, repository or shared-ref setting is changed. Chromium uses Playwright's isolated ephemeral context and task TMPDIR with the explicit executable `/tmp/jetnity-r104-browsers/chromium-1187/chrome-linux/chrome`.

The sidecar records exact commands and cwd, phase/timestamps, source bindings, adapter hashes, dependency/browser identity, CSS provenance, child exits and stdout/stderr hashes, manifest checks, observer diagnostics and screenshot metadata. The scripts, adapter manifest/diff, logs, action bundle, both manifests, observer artifact and screenshots are retained in the fresh proof directory. Failure, timeout, changed binding, nonzero child exit or manifest/diagnostic mismatch yields exit 1. There is no retry, alternative isolation, escalation or cleanup/reset of the checkout. Execution permission is controlled by Root's normal local invocation.
