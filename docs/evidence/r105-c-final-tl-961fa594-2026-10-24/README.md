# R105 C — independent Technical-Lead execution, exact 961fa594

Executed 2026-10-24 around 21:40 UTC. Candidate: `961fa594792b5c07f2e8423b31690f433f858fab`; complete tree: `24a1a3a025853a8e8744a80f1820172157c21c40`. Accepted main at execution: `43124e28f0c2ac366d25a86787f055b885b1fc00`, exact merge-base, 18 ahead / 0 behind. Original Cursor author STOP: [6389846935](https://github.com/Jetnity/jetnity/pull/1001#issuecomment-6389846935).

## Actual results

| Proof | Actual result | Result SHA-256 |
| --- | --- | --- |
| Independently authored flight runner | 9/9 PASS: three readback controls and six pending A/newer B ownership cases | bfaa95b435f6abffec2489183ba5aeac24b1b9a714a0a2b89494d8d1f486bd63 |
| Independently authored stay runner | 9/9 PASS: the six reproduced failures and three current-owner controls | 815ca3d6857b6f6bc63bcbe79f3dc2e5b65c9a3d921362c319d0ee3df351a13a |
| Independently authored preset runner | 3/3 PASS: distinct normalized tuples, repeated stability, equivalent input | 951d5ba419e793c64abb1b9118eafc55ebae1eb913b2daebbfbde048a2016a89 |
| Root execution of the Cursor-authored full harness | PASS: 22 named behavior groups / 9 layout measurements; root sidecar identifies the actual execution | c61c864dd9ada7efe5dbc3d8fd54fc757b3afd3416609842b2bbeeb41429e7bd |

All four processes exited 0. All checks bind the full HEAD/tree, actual source bytes against Git, and a clean checkout before and after. Browser runners used isolated Chromium 140.0.7339.16; no personal browser. Flight/stay diagnostics and all six full-harness diagnostic arrays are empty. The full harness kept every original scenario/assertion and source-authored provenance field; only checkout/output paths and the isolated browser lookup were adapted. Its sidecar records root execution, exact command, cwd, adaptation/reverse-adaptation, source bindings, stdout/stderr, and hashes. The stderr contains only the existing Browserslist data-age advisory.

The six stay regression bodies and fixture match the prior failing run preserved under the 21:21 continuity checkpoint. All six retain the correct A outcome, draft/pending state and one callback; all now preserve B's exact ElementHandle focus and state. The three controls ensure same-owner success/error focus still works. No blanket suppression of focus is accepted.

## Preservation and limits

This is an archival byte copy of already executed files. The original commands and local output paths inside JSON remain unchanged. `archive-manifest.json` maps each source path to its durable repository path and byte hash. The 23 screenshots are included. Generated JS/CSS build outputs alone are omitted; their hashes remain in the sidecar.

The stay runner proves focus behavior, not layout or saved graph persistence. The preset runner tests the actual normalized helper, not full Trip schema validity; the actual-schema collision regression was separately reviewed in the committed Node test. The full harness's changed-context graph tests use a fixture that delivers graphs for their matching context; this is not a proof against arbitrary incorrectly supplied graphs. CSS viewport/root font-size geometry does not claim native browser zoom, screen-reader or physical-device acceptance. The screenshots are viewport captures at their actual scroll positions, not full-page screenshots. No hosted account/provider/storage/database interaction occurred.

At archival authoring the exact-head native CI run [40135029902](https://github.com/Jetnity/jetnity/actions/runs/40135029902) remains in progress. Auth job120994876790 passed; root read its real logs (55 expected values /243 keys, checkout498e9b03). Exact Preview dpl_5dSQzMwtGi5JQLBEKXxqrGsJ8r8y is READY for the candidate/project/ref. **This archive itself is not a full TL PASS, Ready, merge or Production acceptance.** Those live gates remain separate and must be refreshed before integration.
