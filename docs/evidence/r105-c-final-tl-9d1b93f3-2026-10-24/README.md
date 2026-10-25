# R105 C — final Technical-Lead execution at 9d1b93f3

Execution: 2026-10-24 around22:01 UTC. Exact head **9d1b93f371d5f1a14d3aa0607dfc7f8ff9b92509**, complete tree **bc39c3b74b5cbab7c15595500ddc70a72de8826b**. Actual accepted main/merge-base **43124e28f0c2ac366d25a86787f055b885b1fc00**, **21 ahead /0 behind**. Original same-session [final STOP6390045540](https://github.com/Jetnity/jetnity/pull/1001#issuecomment-6390045540) explicitly freezes further author writes.

## What was independently executed

| Proof | Actual result | Result SHA-256 |
| --- | --- | --- |
| Existing focused Node tests, standard process isolation |113 tests /13 suites /113 pass /0 fail /0 skip |2322b1e154eba519586e3b83054548d2071b1d055d99b305578954653b413810 |
| Independently authored flight proof |9/9 PASS |14fbd7f0e46ad83a2b3487682c08d677960481dee4cb6cd3af45486f4e5911e7 |
| Independently authored stay proof |9/9 PASS: six prior failures plus three current-owner controls |da63fc420cfcae468b314d968dc197eb06f028a315b56448ac28245af6983e5f |
| Independently authored preset proof |3/3 PASS |1925ad7cce4ab36d4384285cfd9561066bd5387259e0b4f342282487f3b0ca66 |
| Root execution of the original full author harness |22 named behavior groups /9 layouts PASS |973bd74102971db64126ecf5926ca0ab3272ab8221343ed233dc0a3da00c44e6 |

All five processes exited0. Every proof checks exact HEAD/tree, clean checkout and actual source bytes against Git before/after. All flight/stay and full-harness browser/request diagnostic arrays are empty; focused stderr is empty. Node24.22.1; isolated Chromium140.0.7339.16. Only synthetic local fixtures were used.

The focused command includes the previously failing nine-test lodging coverage file, with all its original assertions retained. The final run uses the normal process-isolated Node test runner with ordinary approved child-process permission; it does not use the earlier single-process diagnostic fallback.

The full harness keeps its original cases/assertions and source-author metadata. Its sidecar records root's real command/cwd, browser, output paths, unchanged protected body and successful exact reverse adaptation. It is root execution of an author harness, separate from the independently authored9/9/3 runners.

## Failure and correction history

The original961 native [run40135029902](https://github.com/Jetnity/jetnity/actions/runs/40135029902) remains **failed**, with8 old direct-call fixture errors. `prior-961-native-failure.json` preserves the actual root-read failure excerpts/counts, diagnosis, local diagnostic boundary, original-author candidate and explicit later ownership grant.

Candidate1990 added only five useRef fixture lines inside bedienung(); removing them reconstructs the original test bytes. No test body/assertion or product runtime changed. TL's ADDENDUM V3 atf522 explicitly records that the candidate preceded the additional file grant; no retrospective prior authorization is claimed. Final9d1 adds separate author9/113-test TAP/provenance and owned docs. All47 earlier C/V4 artifacts and16 older R103/R104 files remain unchanged.

## Archival integrity and limits

All48 original execution artifacts, including23 newly captured screenshots, are byte-preserved. `archive-manifest.json` maps original local paths to repository paths with SHA-256/Git hashes. All23 screenshots independently hash-identically to the earlier961 execution screenshots; Git blob reuse saves duplicate content while each new execution retains its own command, timestamp, head and result record. Reproducible generated JS/CSS alone is omitted; its hashes remain in the sidecar.

Stay-independent proof concerns callback/focus behavior, not saved graph or layout. Preset proof is helper-only, not full Trip-schema proof. The full harness's changed-context graph fixtures deliver data for the matching context. CSS viewport/root-font measurements do not claim native zoom, screen-reader or device acceptance. Capture modes differ: the 18 independent flight/stay screenshots requested `fullPage: true`; the five full-harness screenshots requested `fullPage: false` at their actual scroll positions. No hosted account, provider, database, storage or personal-browser interaction occurred.

At archival authoring, final native [CI40136535412 attempt1](https://github.com/Jetnity/jetnity/actions/runs/40136535412) remains **in progress**. Auth120999384592 passed; root read real logs55 expected values/243 keys. Actual CI checkout **6bae5062bf3b353f74e9f45c83ac5242f2da90bd** has exact parents main43124 + candidate9d1 and exact tree equality. Preview **dpl_HiL79x1Sw3Fta4VapPXWDsdetAFB** is READY with correct project/ref/SHA. App120999384465 is still running. **This archive is not itself full TL PASS, Ready, merge or actual-main Production acceptance.** Live final gates remain required.

Documentation correction, 2026-10-24: the capture-mode sentence above now matches the archived runner calls. No original result, screenshot, source, manifest or execution record changed; no new run was required.
