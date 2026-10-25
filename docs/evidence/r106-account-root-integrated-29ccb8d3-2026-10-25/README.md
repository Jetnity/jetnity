# R106 Account — root evidence on synchronized final 29ccb8d3

This append preserves actual root executions on **`29ccb8d3cb7786f0d1b1f6c453526f67cdd7c3b8`**, tree `29d75dd70c711b67c5c43826c8a0db05fa9037f6`, after normal synchronization with main `41844878a8437256572da3de1374fbb36fd7a516`. It supplements the [preintegration e2 archive](../r106-account-root-preintegration-e2db757d-2026-10-25/README.md). Earlier e2 results and the author's e761 proof remain historical; none is relabelled as a final29 run.

**At this preparation snapshot, this is not a Technical-Lead PASS.** Root reported durable execution checkpoint `6397106872`; final native App remained pending. Live CI, Preview, merge and post-merge decisions belong in the later finite-batch closure. This helper copied and inspected existing bytes only: no new test, browser, platform operation or product edit was performed.

## Direct final-head executions

| Evidence | Actual observation | Boundary |
| --- | --- | --- |
| [Independent result](independent-29/account-acceptance-result.json) | 4 pure + 10 mounted = **14 PASS**; 2026-10-25 11:28:55–11:29:11 UTC; Node22.23.4; Chrome140.0.7339.16; zero external-request attempts/page errors; tracked checkout clean before/after. | Direct exact29 source-bound run. Root reported exit0; the independent JSON itself records no numeric process-exit field. |
| [Root execution attestation](root-author-run-29/execution.json), [captured console](root-author-run-29/console.txt), [author-runner result](root-author-run-29/run-29ccb8d3cb7786f0d1b1f6c453526f67cdd7c3b8.json) | **39 mounted + 2 source contracts = 41 PASS**, zero fail/cancel/skip, exit0; 11:28:57–11:29:40 UTC; child duration38,075.642674ms; Chrome140.0.7339.16; zero recorded external requests. | Actual root execution of the independently reviewed author runner; distinct test design and boundary from the fourteen independent cases. |

The captured console contains both source-contract tests, all 39 mounted test records, and the 41-test TAP footer. Its initial Browserslist warning is preserved. The author-result JSON keeps its own shorter stdout/stderr tails as originally written.

The author result's `author`, `session` and `model` fields are hardcoded provenance for the original **Jetnity Account Traveller Management Completion 1 — Cursor Generation 1**, session `bc-3b7c97c5-d9fa-4326-9000-14377b2dd939`, model `grok-4.7-high-fast`. They do not identify the executor of this run. The separate unmodified execution attestation identifies **root Technical Lead independently executing the reviewed author runner** and records its process-local Node22 child selection.

## Files, hashes and reuse

This append has **9 original artifacts / 1,049,538 bytes**, plus this README and `archive-manifest.json` (**11 staged files**). Every original maps to its exact scratch source with size, SHA256 and Git blob identity in the manifest. Original absolute paths inside result JSON/console/helper source are deliberately preserved.

The [existing v2 probe](../r106-account-root-preintegration-e2db757d-2026-10-25/probe/account-acceptance-v2.mjs.txt) is reused by relative reference, with unchanged SHA256 `117c5f881c222df8de4578a36352f9050a2d2c32b871c3f73468a6d8d7445dc6`. The generated action and navigation helpers also equal their archived e2 copies byte-for-byte and are referenced rather than duplicated.

Two generated inputs differ and are retained as text:

- [New mount helper](independent-29/helpers/independent-mount.tsx.txt), 743 bytes: its absolute import points to the final29 action-helper path. That path substitution is the only difference from the old helper. Do not rewrite this frozen snapshot; replay regenerates a fresh helper.
- [Actual final29 CSS](independent-29/production-styles.css.txt),129,181bytes: preserve the bytes actually served during this run. Its hash is `7e913d744353e72444dcbbf08cb9241f34836143b0961d8703e0c26faaa85e79`.

Generated JS bundles, installed dependencies/browsers, and committed harness/product sources are excluded. Their relevant hashes or Git references are in the manifest. Text suffixes prevent automatic code/test discovery.

## CSS difference from the preintegration run

The earlier [21,425-byte e2 CSS](../r106-account-root-preintegration-e2db757d-2026-10-25/probe/production-styles.css.txt) remains unchanged. This is **not minification**: both files are expanded CSS with 133 comments. Static PostCSS parsing finds 64 rules in e2 versus 1,348 in final29. All 64 old selector/declaration records remain unchanged; 1,284 records are added and none removed. The old file has no `.flex`, `.grid`, `.hidden`, `.min-w-0`, `.sr-only` or `.w-full` utilities, although such classes already occurred in e2 Account markup.

The probe, `styles/globals.css`, `tailwind.config.js` and lockfile are unchanged. The probe passes a loaded config object to Tailwind and never changes its working directory. The config's content globs target relative `./app`, `./components`, `./lib` and `./content`; they do not include `docs`, `scripts` or external `/tmp` evidence. The installed Tailwind3.4.17 resolver uses the process working directory for these paths by default.

The observed difference is content discovery: the earlier output contains base/custom styles without ordinary generated utilities; the final29 output contains the project utilities. Running the earlier process outside the checkout is the strong explanation, **but neither raw independent result records cwd, so the historical cwd is not proven by those JSONs alone**. A few new Admin classes cannot explain the earlier absence of common utilities already used by Account. There is no evidence here of archive/tmp content scanning. Both actual CSS outputs remain available; neither is represented as byte-equivalent to a Next Production CSS asset. Portable replay below explicitly sets cwd to the exact checkout.

## Screenshot boundary

Three final29 captures are retained: [320px](root-author-run-29/screens/320.png), [320px with root32px](root-author-run-29/screens/320-root-32.png), and [1280px](root-author-run-29/screens/1280.png). These are **viewport captures**, not full scroll-page or complete-control galleries. Root reported viewing all 3; the root 32 capture mostly shows enlarged explanatory text. This archival helper does not claim a new visual review.

The recorded layout case separately measures 320/360/390/768/1280 and 320 with root32; each recorded `scrollWidth` equals `clientWidth`. Root 32 is a CSS font simulation, not native browser zoom, physical-device or screen-reader proof. The 320 PNG happens to equal the earlier root e2 capture byte-for-byte; the other two differ. All three run-specific paths remain preserved as requested.

## Portable replay from the archives

These are instructions, not additional executions. Use a fresh isolated exact 29 checkout with the locked dependencies and a compatible provisioned Playwright browser. The author runner writes a per-head result/screenshot directory inside the checkout, so a fresh checkout avoids overwriting an earlier run.

Restore the unchanged v2 probe from the sibling archive into a fresh external directory, validating its manifest-bound bytes. Set each absolute placeholder explicitly. The independent output directory must not exist.

```bash
R106_A_ARCHIVE='/absolute/path/to/r106-account-root-integrated-29ccb8d3-2026-10-25'
R106_A_REPLAY='/absolute/path/to/new-external-replay-directory'
R106_A_OUTPUT='/absolute/path/to/new-external-result-directory'
R106_A_REPO='/absolute/path/to/fresh/29ccb8d3-checkout'
R106_A_NODE='/absolute/path/to/node22-directory/node'
R106_A_NODE_DIRECTORY='/absolute/path/to/node22-directory'
PLAYWRIGHT_BROWSERS_PATH='/absolute/path/to/provisioned/playwright-browsers'
export PLAYWRIGHT_BROWSERS_PATH

python - "$R106_A_ARCHIVE" "$R106_A_REPLAY" <<'PYRESTORE'
from pathlib import Path
import hashlib, json, sys
archive, replay = map(Path, sys.argv[1:])
manifest = json.loads((archive / 'archive-manifest.json').read_text())
item = next(x for x in manifest['reusedArtifacts'] if x['id'] == 'independent_probe_v2')
data = (archive / item['archiveRelativePath']).read_bytes()
assert len(data) == item['bytes']
assert hashlib.sha256(data).hexdigest() == item['sha256']
replay.mkdir(exist_ok=False)
with (replay / 'account-acceptance-v2.mjs').open('xb') as output:
    output.write(data)
PYRESTORE

cd "$R106_A_REPO"
"$R106_A_NODE" "$R106_A_REPLAY/account-acceptance-v2.mjs" \
  --repo "$R106_A_REPO" \
  --expected-head 29ccb8d3cb7786f0d1b1f6c453526f67cdd7c3b8 \
  --output-dir "$R106_A_OUTPUT" --only all

PATH="$R106_A_NODE_DIRECTORY:$PATH" "$R106_A_NODE" \
  scripts/account-traveller-management-completion-1/run.mjs
```

Keep generated helpers/CSS/results from that new execution separate. Do not copy the archived helper over a generated helper or edit its old absolute import. New timestamps, helper-path strings, layout pixels and some generated outputs need not match older bytes; explicitly inspect actual outcomes and source binding. The retained final 29 CSS is the authority for what this recorded independent run actually served.

## Source verification and remaining gates

During archival, 11 initial and 26 final independent source pairs plus 8 author-runner source pairs were compared to exact 29 Git objects by both Git blob and SHA256: no mismatches. The product checkout's tracked diff remained empty. The manifest pins existing author scripts, fixture/shims, UI test, global CSS, Tailwind config and lockfile rather than copying committed code.

These are local synthetic pure/mounted checks. The independent `refresh` returns `undefined`; props change only on an explicit fixture delivery. The author runner has its separately documented synthetic action/router boundary. Neither proves hosted Account, full Next Router, Supabase/RLS, native CI, Preview, Production or launch readiness. Final native checks, TL acceptance and any actual-main post-merge result remain separate and must not be inferred from this archive.
