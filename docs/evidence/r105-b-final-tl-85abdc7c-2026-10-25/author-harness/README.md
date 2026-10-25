# R105 B V4 — final-head action and layout tooling

**TOOLING PREPARED; NO HARNESS EXECUTED.** This new directory does not modify the earlier B tooling or artifacts. Its design read the two author scripts from interim `824f1bab0a5415a0e8c118004d4b429d58bf47f1` through read-only GitHub. Root subsequently confirmed author STOP [6391167810](https://github.com/Jetnity/jetnity/pull/1000#issuecomment-6391167810) at final `85abdc7c33a34b7a93a3fdb6f78f658940ee1063`, tree `9ea461a1ca193fd86314e2269f10cf8d2521ac8a`, against main `9092b29c2e187bd73d644a3d85670f3ac6436be1`, 13 ahead / 0 behind. These are supplied observations, not an execution or a permanent freshness claim.

## Separate preparation and execution

After the clean final checkout is materialized and Root has reviewed the final author source and STOP:

```text
python /tmp/jetnity-r105-b-v4-harness-prep/prepare.py REPO FULL_HEAD FULL_TREE 9092b29c2e187bd73d644a3d85670f3ac6436be1 NEW_PREPARED_DIRECTORY
```

Preparation accepts only a new direct `/tmp/jetnity-r105-b-v4-*` directory outside the direct `/tmp/jetnity-*` review checkout. It performs read-only local Git commands, hashes, exact source-copy adaptation and new output creation. It runs no Node, browser, test, build, package installation or network operation. Source and exact Git identity must be clean and unchanged before and after. Git hooks/fsmonitor/replacement objects/lazy fetch and configured clean/smudge filters are disabled per command; no shared ref/config is changed.

The default accepted author blobs are `ablauf.ts=e9b6f41a126aa19f53e7940c0e464ccdc26bce8c` and V4 `montage.ts=dd6a3b8c51c80dd016117b0a529f19b2605195ac`. A mismatch stops. The optional `--ablauf-blob` / `--montage-blob` arguments are for a **separately reviewed** later source blob, not permission to accept unreviewed changes. Slot-shape/protected-region checks still apply. The explicit actual-main input currently supports only `9092b29…` and its known tree; a changed main requires a preparation review. Ahead/behind are derived from this explicit main and bound to the prepared manifest, not hardcoded to the previous 10/0.

Preparation produces `original/`, `adapted/`, `adaptation.json` and `adaptation.diff`. Root inspects them before execution. A manifest is not a claim that the author STOP, remote main or CI was checked by this script.

Only Root later executes:

```text
python /tmp/jetnity-r105-b-v4-harness-prep/run.py PREPARED_DIRECTORY REPO FULL_HEAD FULL_TREE 9092b29c2e187bd73d644a3d85670f3ac6436be1 CSS_FILE CSS_PROVENANCE_JSON
```

The CSS inputs must be freshly produced for this exact final checkout by the unchanged inspected `/tmp/jetnity-r105-b-css-prep/` producer. Its existing exact SHA-256 pins are enforced. The wrapper creates a unique `/tmp/jetnity-r105-b-v4-harness-final-proof-*` output, never overwrites an evidence path, and invokes action then montage from the **exact repository cwd**. It contains no retry, alternate execution route or approval escalation. Root controls supported execution permissions outside the script.

## Exact allowed adaptations

The action script changes only its two Chromium `executablePath` selections and its provenance lookup from historical local `origin/main` to explicit actual-main SHA. Fixture, URL interpreter, bundle entry/aliases, history model, source witnesses and all assertions remain unchanged.

The montage changes only the Chromium executable, explicit main metadata, external CSS reader and truthful CSS provenance, plus a separate passive observer. **V4 `cssLesen()` retains its object return type `{ text, sha256, dateien }`.** It reads one verified external PostCSS file, hashes the exact text/bytes and records its actual path/size. It does not imitate `.next` or replace the author’s `quellenCss` source reads. CSS is labeled **LOCAL_PROJECT_POSTCSS_COMPILATION**, with no Next Production-CSS byte-equivalence claim. The recorded `herkunft.css.sha256/dateien/quellen` are cross-checked against the supplied CSS and exact repository sources by the wrapper.

The entire `stilePruefen` function remains byte-identical, including original error-message wording. Its phrase “Production-CSS” in a possible original assertion error is source-author vocabulary, not a provenance claim by this wrapper. H1 font size/line height/weight/tracking/wrapping, link font size/background/display/wrapping/bounds, root size and overflow assertions are preserved. The wrapper additionally checks their recorded readbacks and fails on mismatches.

The seven states, eight widths, 56 measurements, 32px root only at width 320, fixture construction, keyboard paths, reduced-motion setting, all screenshots and their existing `fullPage: true` behavior remain unchanged. Six fresh PNGs and all 56 zero-overflow measurements are required. This is the same stricter zero-overflow wrapper criterion as before; no author assertion is weakened.

## Preservation and validation

Every changed slot has an exact old/new occurrence count and category. Reversing all adapters must reproduce the original Git bytes. The whole source outside those slots must match byte-for-byte. Explicit protected-region hashes additionally cover fixture construction; computed-style assertions; state/width/keyboard definitions and traversal; and the full measurement/overflow/style/keyboard/screenshot block. The run wrapper regenerates the adaptation recipe and compares the full contract again before starting Node.

Exact HEAD/tree, detached state, clean index/worktree, explicit-main tree/merge-base/ahead/behind and 31 bounded source inputs are checked before, between and after children. Prepared tool sources and diff are hash-bound. Existing dependency versions are compared with the lockfile where present; no dependency install occurs. Environment values are not inventoried: child environments contain only explicit runtime/locale/temp/CSS/Chromium/Git metadata, with no inherited credentials, dotenv, NODE_OPTIONS or NODE_PATH. HOME is neither changed nor repurposed.

Chromium is the existing isolated executable `/tmp/jetnity-r104-browsers/chromium-1187/chrome-linux/chrome`; no personal browser profile, CUA, hosted account, database or provider is used. Passive montage observers record page errors, console errors, unexpected requests and request failures without routing/interception/fixture changes. The original action guards remain intact. Failure-side JSON/observer/available PNG artifacts are retained but never relabeled as success.

The result records original-source authorship separately from the **Technical Lead / Root** executor. A local action PASS remains a synthetic PostgREST URL interpreter using `String.includes` and same-document `about:blank` history, not PostgreSQL matching, hosted RLS or Next Router restoration. A static PostCSS montage is not hydration, a native Next build, physical-device QA, native zoom or screen-reader evidence. Root must visually inspect successful output images separately; this wrapper never claims it has done so. Native CI, Vercel and final TL verdict remain separate.

`derive_run.py` and `run-tooling.diff` document construction from the unchanged prior wrapper. They are tooling history, not harness execution. No final `adaptation.json`, test result or layout PASS exists until the corresponding later command actually completes.
