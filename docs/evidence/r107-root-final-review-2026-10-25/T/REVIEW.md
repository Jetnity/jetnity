# T original P1 — independent mounted RED to same-assertion GREEN

Reviewer: `/root/dependency_review`, read-only helper. Root owns the P1 closure and formal Technical-Lead disposition. No PASS, Ready or merge action is issued here.

## Evidence reconciliation

The pre-existing independent core, adapter, Registry and focus packets did not execute the original UUID-plus-passport residence-only case. Their fixtures used other citizenship refs and no passport. `/root/admin_review` confirmed that its historical RED/GREEN work established commit/test provenance, not independent execution of this case. The source and historical author receipts were useful but did not fill this independent mounted gap.

Root explicitly authorized exactly the original named test on the historical RED product baseline and frozen final bytes. Both executions are now preserved, with one test actually executed in each run and no wider matrix.

## Exact identities

| Item | Identity |
| --- | --- |
| PR | Jetnity/jetnity #1017, open Draft |
| Final head | `fe434ae7ffcafedb0c2e9f7c528b84d96941fe13` |
| Final tree | `0bda1d7556dcbda64e77600a1658bf934b84b583` |
| Unchanged runtime | `669f8ec80324583adaec6dc21d5caf6d23e11c84` |
| Runtime tree | `e0b8ffcbecdbc01d64686ec886140a1c1ee79437` |
| Base / merge-base | `a74c443c6be3f064f150fcf021ab6154bda325e5` |
| Comparison | 22 ahead / 0 behind / 41 files |
| Historical RED head | `318fd50821be3c83aa8ec7182ad2e6cd3a4c9dec` |
| Historical RED tree | `8eb51910883d3b1a77ae5b6c11bb30a297c67881` |
| Original first GREEN | `27102ebae649ceaaab5866a0df6db84f570c507a` |
| Author | Jetnity Trip Traveller Snapshot Workflow Completion 1 — Cursor Generation 1 |
| Session | `bc-5d06d92d-a371-4889-b29c-f03a9b6c85d0`, author-attested `grok-4.7-high-fast` |
| TASK / PLAN blobs | `75c59b0851d835560ff4b5562e9fcc52c395b2ad` / `252ae82c9cf1aff34f7f46e16999d50178369dff` |

A fresh post-run PR read still reported the exact final head/base and Draft state. The independently reread a74→318 comparison contains only TASK, PLAN, the synthetic harness and the residence test; historical product bytes are baseline bytes.

## Original test and unchanged assertions

File: `scripts/trip-traveller-snapshot-workflow-completion-1/mounted-residence.test.ts`.

Suite: `mounted TripWorkspace traveller residence-only identity`.

Executed test: `a residence-only save keeps the loaded citizenship UUID and its passport relation`.

- RED and historical first-GREEN complete test-file blob are identical: `9d878f0263233b166110596683f9dfa440be19e3`.
- Final test-file blob: `8b8fb6ce6aad481905a866929dcd16b3626e3a41`; it adds two separate cases and project CSS support, but those two cases were excluded and not executed.
- The synthetic `reisender()` fixture is byte-identical between RED and final.
- The actual interaction and assertion portion from `try` onward is byte-identical: SHA256 `5cdf1b45c98a4ed9c943953cf15beb470a987d79c9870b9c87c4ac5de232fded`.
- All three assertions are identical: citizenship ref equals the UUID, passport citizenshipClientRef equals the same UUID, residenceCountryCode equals IT. Assertion-list SHA256 `08e37fc50131bece32105cc6d4e20a71f9ba38c3ae066ad677afa9f861f679e0`.
- The only difference in this named test's full body is supplying `css` to the opening helper. No assertion or interaction was weakened.
- The real-Workspace synthetic harness is identical at both refs: `6633d268c44be1ce4582a7538d73ab65e1443942`.

AST-derived original test bodies are retained in `red-original-test.txt` and `final-original-test.txt`; `test-body-binding.json` contains the exact fixture/action/assertion comparisons.

## Actual independent observations

The actual TripWorkspace was mounted with the loaded citizenship UUID and a passport linked to it. DOM actions opened Vorbereitung and Angaben bearbeiten, selected only residence IT, focused Angaben speichern and pressed Enter. Both runs recorded a trusted Enter keydown. The select change is the existing Playwright selectOption action; its DOM change event is honestly recorded as untrusted. No private React handler was called.

| Observation | Historical RED | Frozen final GREEN |
| --- | --- | --- |
| Process exit | 1 | 0 |
| Executed tests | 1 | 1 |
| Pass / Fail | 0 / 1 | 1 / 0 |
| Captured payloads | 1 | 1 |
| residenceCountryCode | IT | IT |
| citizenship clientRef | `citizenship:CH` | `a1111111-1111-4111-8111-111111111111` |
| passport clientRef | `document:pass-1` | `document:pass-1` |
| passport citizenshipClientRef | null | `a1111111-1111-4111-8111-111111111111` |
| Page / observer errors | 0 / 0 | 0 / 0 |

Both payloads retain the same passport type, issuingCountryCode CH and expiry2030-01-01. The final payload retains the imported citizenship identity and the original passport relationship. The historical failure is the original expected UUID assertion, not a harness/bootstrap failure.

Raw process outputs are `red-run.log` and `final-run.log`. `RESULTS.json` preserves original synthetic traveller, actual old/new payloads, trusted Enter events, process versions/counts, input-source records and raw observation-file references.

## Execution and source binding

Commands, from the respective private `red` and `final` staging directories:

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/r106-review-browsers \
RESIDENCE_REVIEW_OUTPUT=/tmp/r107-trip-residence-final-review/red \
node --require ../observe.cjs \
  --import ./scripts/server-only-test-register.mjs --import tsx --test \
  --test-skip-pattern='a pointer click on Angaben speichern|the open traveller card' \
  scripts/trip-traveller-snapshot-workflow-completion-1/mounted-residence.test.ts
```

For the final command only cwd and RESIDENCE_REVIEW_OUTPUT change from red to final. The skip filter excludes the two separately named later tests; observed run totals are one test each.

- Node `v24.22.1`; existing Chromium `140.0.7339.16`, Playwright from existing pinned dependencies. This is independent local component evidence, not Node22 native CI.
- Test and product files were not edited. The reviewed observer only captures the payload at page close, records real input events, requests esbuild metadata and blocks non-fixture browser traffic. It does not replace actions, mutate application state or change assertions.
- Only the synthetic localhost root document is permitted; every other browser request is aborted. No non-fixture requests occurred in either run.
- The original harness stubs the writer by recording submitted payloads and returning null. Existing Next Link/router/dynamic/image/server-only shims remain explicit. This is an actual editor/Workspace interaction through a controlled writer, not hosted storage, SQL/RLS, full-router, authenticated or device proof.
- Historical card, Workspace and old document-helper bytes were fetched at the exact RED ref and verified. All20 final candidate non-document blobs match the independently read final compare. The fetched test/harness files and all27 recorded source entries remain unchanged after execution.
- esbuild metadata captures the actual bundle inputs and their Git/SHA256 hashes (1811 RED and1813 final including dependencies). Critical product/harness inputs are joined to expected Git blobs in RESULTS.json, proving the historical and final actual components were bundled.
- package.json and package-lock.json match the existing a74 baseline in both staging directories; no installation or upgrade occurred.
- Historical baseline test did not compile project CSS; the retained final test does. No layout acceptance is claimed by this narrow P1 check.

## Artifacts

- `REVIEW.md`, `RESULTS.json`, `live-identity.json`.
- `red-run.log`, `final-run.log`.
- `red-original-test.txt`, `final-original-test.txt`, `test-body-binding.json`.
- `pre-run-source-verification.json`, `post-run-source-verification.json`, `source-transfer.json`.
- `red/observation-*.json` and `final/observation-*.json`: raw page observations and bundle-input metadata; the runner parent creates an empty observation separately, while the child record contains exactly one actual page.
- `observe.cjs`, `verify-test-body.cjs`, `stage.py`, `finalize.py`: reviewed local evidence tooling.

All earlier review packets remain intact. No other matrix, optional cases, installs, held/hosted work, external writes or product implementation changes were performed. Root can now assess original P1 closure from the same asserted actual-editor failure and corrected result, while retaining native/deployment and all broader acceptance boundaries.
