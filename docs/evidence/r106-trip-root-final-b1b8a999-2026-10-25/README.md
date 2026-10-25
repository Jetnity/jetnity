# R106 Trip — root execution evidence at b1b8a999

This append-only archive preserves the root Technical Lead's local executions on **`b1b8a999bfe4d81e315fac2671bcd9eef24b520b`**, tree **`8d319e0c3f769e7f316b2f749f823c82eb7855c4`**, on 2026-10-25. It also preserves the preceding 44e1 and 19ac observations at their actual historical heads. Archive preparation performed file, hash and Git-object correspondence checks only. It did not rerun product code, edit the repository, publish evidence, set Ready, merge, or grant TL PASS.

The repository is `Jetnity/jetnity`; the finite Trip delivery is PR #1009. The original harness author is **Jetnity Trip Personal Preparation Workflow Completion 1 — Cursor Generation 1**, session `bc-6bbca11e-14c9-4f1a-ac07-e729d8a54ca3`, model `grok-4.7-high-fast`. Those embedded author/session/model fields in the unchanged runner outputs identify the **harness author**. The fresh `root-execution.json` receipts identify the actual executor as **ChatGPT / root Technical Lead**, with command arguments, working directory, start/end times, subprocess exit codes and raw-log hashes.

## Recorded final-head results

| Evidence | Recorded result and scope |
| --- | --- |
| `functional/r1-pure.json` and `r2-same-ref.json` | 5 + 1 independent assertions using the real pure workflow: all pass. No writer, storage or browser claim. |
| `functional/r1-mounted.json`, `r2-controls.json`, `r2-post-delete.json`, `r3-residual.json` | 3 + 3 + 1 + 3 independent assertions using the production list and hook under the inspected synthetic Host: all pass. This HTML is unstyled. |
| `functional/workspace/workspace-r4-result.json` | 3 independent actual-Workspace scenarios: wrong-trip read, unreadable read and late response after a trip switch; all bounded observations pass. The 3 unique raw traces are retained alongside the result. |
| `functional/reviewed-author-suites/` | Root reran the reviewed author runner: **18 mounted list cases + 1 source-pattern check**, then **6 Workspace cases**; 25 total, zero failures/cancellations/skips/todos. Full TAP and console output are preserved. |
| `functional/root-execution.json` | All **10 commands exited 0**. The 19 independent cases above are distinct from the 25 author-suite cases; command count is not test count. |
| `build/root-execution.json` and `build/commands/production-build.txt` | Actual local `npm run build`, including Next production compilation, TypeScript and static generation, exited 0. The complete log retains its original warnings and route list. A successful build does not establish hosted route behavior. |
| `css-run1/root-execution.json` and raw log | Exit **1** after the 12 screenshot flows, at final metadata collection: `git rev-parse origin/main` could not resolve the absent local remote-tracking ref. This is a setup/metadata failure, not a failed CSS/product assertion. There is **no final `ablauf.json`** for this run. |
| `css-run2/root-execution.json`, `css-run2/css/ablauf.json`, screenshots and CSS bytes | The unchanged CSS runner exited **0** after root populated the normal local `origin/main` ref. There are **11 measurement records + 1 keyboard case**, with 12 PNGs. Widths are 320/360/390/768/1280; the 320/root32 simulation and reduced-motion case are included. |

Runtime recorded for these executions: **Node v22.23.4** and **Chromium 140.0.7339.16**, with the default headless Chromium launch. The independent mounted Host reports record zero external requests. The independent Workspace result records zero external requests, page errors and console errors. These observations are not transferred to uninstrumented build or author-runner network activity.

The final residual result demonstrates three corrected assertions in **two P2 families**: current-state/history receipt truthfulness (two cases), and newer focus ownership (one case). Its focus case used natural trusted pointer followed by Tab; `programmaticRowFocusFallbackUsed` is false. The result permits honest retained history and does not claim extra writes or data recreation.

## CSS provenance, failed first attempt and visual review

The retained CSS is the actual local build output, **99,091 bytes**, SHA256 **`9fdcfb3304373fe80e813c75b8a05078064bb38eeba3b6f309db2e28d45ccf7b`**, originally `.next/static/chunks/19ds4pry6tbr3.css`. Its bytes are retained at `css-run2/css-assets/00-19ds4pry6tbr3.css` and checked against both the raw CSS report and the root receipt. This is not a recreated stylesheet.

Root reported that it visually inspected `lang-320.png`, `lang-320-root32.png`, `lang-1280.png` and `fehler-390.png` and found them acceptable. This is a **parent/root attestation**, separate from the raw machine measurements; the archiving helper did not perform another visual acceptance run. The CSS report states its real boundary: actual list/hook, local compiled project CSS, synthetic deferred adapters, and a 32px CSS root-font simulation. It does not establish native zoom, device, screenreader, full Workspace/router or hosted behavior.

The first CSS attempt's 12 PNGs are **byte-for-byte identical** to the corresponding second-attempt PNGs. Their original paths, identities and explicit relative references are recorded in `bindings/deduplicated-artifacts.json`; one verified physical copy is retained. No first-attempt result JSON has been invented and no successful measurements have been backfilled into that failed attempt. Its failed raw log and receipt remain separate and unchanged.

Root reported that it ran the build before CSS, and that the only repair between CSS attempts was fetching accepted main into the missing local remote-tracking ref. The receipts show the build ending at 13:23:11 UTC, CSS attempt 1 starting at 13:23:44 UTC, and CSS attempt 2 starting at 13:25:20 UTC. **The wrapper does not enforce build-to-CSS sequencing or itself perform that ref repair.** These chronology/repair statements are root's contemporaneous attestation, supported by the distinct raw timestamps and source witnesses, not invented wrapper guarantees.

## Exact sources and limits of the receipts

All four root receipts retain **288 repository-file witnesses before and after execution**, each checked against the committed head, with equal before/after source identities and a tracked-clean checkout. The root wrapper itself is preserved as `probes/trip-root-execute-v1.py.txt`; its SHA256 matches the receipts' `receiptSourceSha256`. Its path set includes the Trip components, readiness code, author scripts, package/lock and relevant build inputs. It is a selected 288-file witness, **not a claim that every repository file was hashed before and after**.

The full committed Git manifest produced by the wrapper contains **7,329 blob paths** and is retained once at `functional/committed-source-manifest.json`. The build and both CSS manifests are identical complete files; their original paths point explicitly to that single retained copy in `bindings/deduplicated-artifacts.json`. Raw receipts and result JSONs have not been edited to change their original absolute paths.

The controlled Host bundle metadata records 61 repository sources; the mounted results additionally bind their fixture to yield 62 unique verified source paths. The actual-Workspace run retains its 22-path primary manifest, 198-path compiled/final manifest, esbuild input/output metadata and before/after provenance. The 198 count includes the primary pinned paths and is a source-path count, not a test count. Generated JavaScript bundles, installed dependencies and browser binaries are omitted; the exact builders, inputs and metadata support a fresh rebuild.

The independent Workspace runner additionally records **9 external probe/harness/shim files before and after**, whose identities are equal and match the previously archived sources. The broader root wrapper **does not witness all external Host probes before and after execution**. `bindings/external-source-inventory.json` is an archival-time inventory of those existing files and their byte-identical archive references. It cannot retrospectively create a broader execution-time witness. The wrapper's recorded commands, original versioned probe provenance and unchanged archived source copies are preserved with that limit.

The author runner's raw `functional/reviewed-author-suites/browser-lauf.json` records **`main: null` and `mergeBase: null`** because the local remote-tracking ref was missing at that time; its recorded head is the correct b1 head. Those nulls are retained. Separately, immutable Git-object inspection and the dated source reviews establish accepted main **`77ed41adbd3d32bbc995300b61eef1e16c2710d6`** as b1's merge-base, **0 behind / 15 ahead**. Successful CSS attempt 2 also records that main after the ref repair. This separate graph evidence does not rewrite the earlier runner's metadata.

## Behavioral coverage boundaries

The independent Workspace fixture mounts the real `TripWorkspace` with real mode navigation and genuine guest reader/writer/storage behavior, while deferring only response settlement after the synchronous guest side effect. Immediate callback-entry records distinguish dispatch from deferred completion. Failed expected-trip reads are followed by discard, a fresh client ref, real mode-away/back navigation and create/retry attempts before a qualifying read.

Its raw **`fullCentralRowGuardCoverage` remains `false`**. Native-disabled row status/save/final-delete controls are recorded as **`NATIVE_DISABLED_UI_ONLY`**, not as controller invocations. Trusted submit/Enter, the enabled floating retry and standards-based `requestSubmit` exercise their actual production paths. This independent probe uses no React-private handler access, altered disabled attributes or replacement workflow model. Root's source inspection and separately bounded central-guard checks remain distinct. The reviewed author's Workspace suite includes direct handler invocation for disabled controls; that is a handler-level test, not a trusted user activation of a disabled button.

The trip-switch case records that the old trip's guest write **already executed synchronously before the switch**. It checks that late settlement does not affect the new trip's callbacks/read/storage/draft/focus/DOM. It does not claim cancellation or rollback of that old write. The fixture keeps `TripWorkspace` mounted while changing its trip prop and does not simulate the full `GastArbeitsbereich` route lifecycle. The accepted in-memory ledger lifetime at full Workspace unmount and the existing non-atomic whole-trip cross-tab writer remain outside these observations.

No item here establishes a hosted Account session, full Next router, Supabase/RLS/migration acceptance, Preview or Production behavior, native CI success, merge eligibility or post-merge acceptance. Those are separate root-owned gates. Archive preparation does not predict them.

## Historical evidence and source-review continuity

`historical/44e1a1c4/` contains the three-case residual pass and its guarded Host bundle metadata at **`44e1a1c41d2e4939524d2b11996c7baa6a1b0056`**. `historical/19ac02ae/` contains the five pure cases and one same-ref case, plus the Host build metadata, at **`19ac02ae34a05cf6e2636313e8fda316782959a2`**. These earlier results remain at their actual heads. They do not substitute for the separately recorded b1 execution. Historical raw JSONs record verdicts rather than subprocess exit fields; no fields have been added. Root reported exit 0 separately.

The historical full Git manifests are not duplicated: their identities, path counts, exact committed-tree correspondence and replay recipe are recorded in `bindings/source-binding-metadata.json`. All source blobs used by these historical results and Host builds are checked against the corresponding historical commits. The archived result/build maps retain those precise source bindings.

`source-reviews/` preserves the original 19ac source review and the b1 source rebind, both JSON and Markdown, as dated source-only reports. The b1 delta consists of four documentation corrections; all other tree entries are unchanged from 19ac. Their original then-pending gate wording is retained. A present committed-tree comparison does not retrospectively prove a clean-tree before/after witness for an older author run.

`probes/` contains the v3 residual source, its original preparation README, exact guard-only diff and provenance. That original provenance says `PREPARED_NOT_EXECUTED`; it describes preparation time. The separately preserved historical and final executions establish later use. The behavioral body is byte-identical to v2: v3 only admits an explicit new 40-hex head while refusing the three previously demonstrated defective heads. The prior v2 source, six-semicolon setup correction, original run 1 setup errors and run 2 product failures remain in [the R3 findings archive](../r106-trip-root-r3-findings-4e66d894-2026-10-25/README.md).

Root also reported that `git diff --check 77..b1` found trailing spaces on lines 6 and 8 of the committed historical failure terminal capture. That raw capture is preserved by the author; this archive does not normalize it or turn the formatting finding into a runtime failure. Root's eventual P3 disposition belongs in its TL acceptance record.

## Archive layout and byte preservation

| Path | Contents |
| --- | --- |
| `functional/` | Complete final independent raw results, root receipt, command console logs, reviewed-author JSON/TAP/console, source manifests, Host metadata and Workspace esbuild metadata/traces. |
| `build/` | Fresh root receipt and complete Next production build log. |
| `css-run1/` | Failed first attempt's raw receipt/log; the duplicate-screen mappings are in `bindings/deduplicated-artifacts.json`. |
| `css-run2/` | Successful root receipt/log, complete raw CSS JSON, 12 PNGs and actual compiled stylesheet bytes. |
| `historical/` | Exact older results/build metadata at 44e1 and 19ac, never relabelled. |
| `source-reviews/` | Dated source-only review and rebind documents. |
| `probes/` | Root receipt wrapper and the new v3 residual source/provenance; executable sources are archived as `.txt`. |
| `bindings/` | Derived source correspondence, exact external-source inventory, and explicit mappings for byte-identical deduplicated artifacts. These are archival records, not raw execution output. |
| `archive-manifest.json` | Every retained artifact's bytes, SHA256, Git blob, origin and role, plus shared archive references. The manifest excludes its own identity to avoid a circular hash. |

All copied originals are byte-preserved. Every shared reference is checked against the original current source or relevant raw artifact. The **122 pre-existing evidence files and 8 staging/upload maps** remain unchanged. This append is staged separately for root review; the outer append manifest lists only its new files, with bytes, SHA256, Git blob and binary flags. It does not modify or publish the older manifests.

## Replay instructions

Replay is a new operation that requires its own exact-head inspection and fresh output paths. This archive preparation did not replay anything.

1. Obtain a clean checkout of the intended exact commit. Use the committed package lock and Node 22. Verify the expected head, merge-base and source identities before execution. Existing default Chromium is sufficient; do not add sandbox-disabling launch flags.
2. Restore the external sources using `bindings/external-source-inventory.json`: each entry gives its archive-relative source, replay-relative filename, bytes, SHA256 and Git blob. Remove only the archival `.txt` filename suffix while preserving the bytes. The common Host helpers and older probes are reused from [the original Trip review archive](../r106-trip-root-review-b218-80006fdf-2026-10-25/README.md); the unchanged Workspace v1 runner, fixture and shims are reused from [the R2 root archive](../r106-trip-root-r2-4e66d894-2026-10-25/README.md). Keep relative imports/layout intact.
3. The root wrapper has explicit environment-specific paths for Node, the external probe directory and Chromium. To replay that unchanged wrapper, restore those verified sources at its recorded paths, preserving any existing matching source and refusing conflicting files. Alternatively invoke the exact commands recorded in its receipts with explicitly adjusted local paths and a newly recorded executor configuration; do not silently edit the archived wrapper or old receipts.
4. The wrapper CLI is `python3 trip-root-execute-v1.py --repo <clean-checkout> --head <full-40-hex-head> --out <fresh-absolute-directory> --kind functional|build|css`. Each kind uses its own fresh directory. It writes its own committed manifest from `git ls-tree -rz <head>`, so the omitted historical full manifests can likewise be regenerated from their actual committed heads. Never use a result's old head field to relabel a new run.
5. Build before CSS and make the expected `origin/main` metadata ref available using the authorized normal repository fetch. This ordering/ref requirement is not enforced by the wrapper. Its CSS mode consumes the local `.next/static` files and retains their actual bytes after verifying the runner's reported hashes. Preserve failed attempts separately.
6. Generate fresh Host and Workspace bundles with the archived guarded builders. Their retained metadata binds the original runs, while regenerated bundle hashes and paths must be recorded for the new run. No claim of identical generated bytes across different local build paths is required or implied. Keep new raw output separate from this immutable archive.

The original source hashes and complete invocations are in the manifest and receipts. Review the original prepared probe READMEs and their explicit limits before any future execution. A passing bounded probe remains one piece of root's independent acceptance, not a substitute for the remaining required gates.
