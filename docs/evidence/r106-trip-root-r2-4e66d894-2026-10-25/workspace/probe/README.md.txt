# Independent T-R4 Workspace acceptance probe — prepared only

Prepared by the root review helper on 2026-10-25 from inspected R1
`80006fdf1443ca9d75d8c481246821354da16000`. **This probe has not been built,
mounted, or executed against product code. It is not a test result or a TL PASS.**
Root must inspect it and choose the actual completed R2 candidate before execution.
Old evidence and repository files are unchanged.

Preparation validation: Node 22 `--check` accepted `run.mjs`, `provenance.mjs`,
and `source-manifest.mjs`. This is JavaScript syntax validation only. TSX has not
been bundled and no product scenario has run. The inspected checkout remains
clean for tracked files.

## Narrow purpose

The previous author's failed-read Workspace test deferred the entire write and
counted its completion. An accidentally dispatched write could therefore remain
queued without changing that counter. Its retained composer lock was also an
independent reason for a blocked create. Its delayed trip-switch writer had a
fixture-only trip-id cancellation guard absent from the frozen guest callback.

This probe mounts the real `TripWorkspace`, follows its actual mode buttons,
uses the actual guest mutation/parser/storage functions and current-V3 getter,
counts callback **entry before any validation**, and completes the real guest
side effect synchronously. Only its response settlement is delayed. The fixture
does not cancel a guest write after a trip switch.

There are three bounded scenarios:

| Case | Required observations |
| --- | --- |
| `wrong_trip` | A real create is written, its response is rejected, a simulated concurrent real deletion is explicitly read, and a later read sees a different active trip. Retry must not enter the writer. The old receipt is discarded, a new valid draft is entered, actual mode away/back unmounts and remounts the personal component, and submit/Enter/native form submission plus available row controls cannot mutate. Restoring bytes alone must not clear the barrier. An explicit successful expected-trip read permits one deliberate fresh create. |
| `unreadable` | The same sequence, with the genuine getter encountering a synthetic active-key `getItem` exception and producing its actual `unreadable` result. |
| `trip_switch` | A guest write on A genuinely completes before its response is held. The fixture installs a fresh real B trip and passes B into the still-mounted Workspace. Settling A's response must cause no new mutation entry, storage mutation, read, old receipt, draft loss or focus change in B. This does **not** claim cancellation or rollback of A's already-issued write. |

Each failed-read case starts with a real existing personal row and a nonpersonal
entry-check sibling. Both must remain byte-equivalent as item objects after the
qualified recovery and deliberate new create. The discarded attempt and new
create must have different client refs. Counts require exactly two mutation
entries and four product getter calls for the complete scenario.

## Exact fixture changes from the inspected author's setup

Reference files at the inspected R1 are
`scripts/trip-personal-preparation-workflow-completion-1/arbeitsbereich.tsx`,
`arbeitsbereich.test.ts`, `browser-lauf.mjs`, and their `shims/` directory.
This independent fixture is external; it does not replace those files.

| Boundary | Independent setup |
| --- | --- |
| Mounted component | Imports the actual `components/trips/TripWorkspace.tsx` from the explicitly named clean candidate. Real `Reiseansicht` buttons select Preparation and Plan. The personal subtree must disappear during the Plan visit. No substitute personal-component-only model. |
| Guest set/delete callback | Calls `gastReadinessSetzen(trip, payload)` or `gastReadinessEntfernen(trip, ref)` synchronously and calls React `setTrip(next)`, matching the body of frozen `GastArbeitsbereich` callbacks. An entry record is appended first. Promise resolution/rejection alone is held. The fixture has no trip-id writer cancellation check and no deferred guest mutation body. |
| Read callback | Calls actual `aktiveV3GastreiseLesen(trip.id)`, counts entry, records its actual discriminant, and updates props only on success. It does not inject a fabricated result object. Reads must touch only the active key and perform no storage mutation. |
| Seed | Real `gastreiseSpeichern` and guest writer create a fresh trip, existing personal row and nonpersonal sibling. No fabricated fingerprint/readiness item bypasses the actual builders. |
| Uncertain receipt setup | After a real create, the held response rejects synthetically. A separate fixture operation invokes the real getter and removal writer without updating component props. An explicit UI read must observe that concurrent absence. The resulting floating create receipt provides a legitimate Retry control, rather than a missing-row editor with an independent missing-target guard. |
| Read failure | `wrong_trip` installs an actual different active trip using the real storage writer. `unreadable` wraps the active-key `Storage.prototype.getItem` call to throw. The real accessor must classify the result. Storage instrumentation records all guest `getItem`, `setItem`, and `removeItem` operations with their callback/fixture phase. |
| Recovery | A fixture operation restores expected-trip bytes without updating props or resetting any product controller. Only a subsequent explicit UI getter call may clear the barrier. |
| New generation | Uses the actual receipt discard button, trusted keyboard entry of a new draft, and actual mode navigation. No old delayed job remains. No controller lock is edited or exposed. |
| Submission evidence | Uses trusted Playwright pointer/keyboard input, then the standards-based `HTMLFormElement.requestSubmit()` on the actual valid form. A capture listener records actual submit events and whether the production handler prevented their default action. There is no React private API, `dispatchEvent`, forced click, changed disabled attribute, or direct controller invocation. |
| Row controls | Existing-row edit/status/save and delete confirmation are used where available. Native HTML disabled controls are recorded as **UI-only observations**, not central dispatch proof. An available floating Retry receives a trusted pointer and is measured using immediate callback/storage counters. If future source disables it natively, that observation is downgraded to UI-only. |
| Trip switch | Installs a fresh B using real seed/writer functions and changes the Workspace trip prop. The old side effect has already occurred. This covers the mounted Workspace's response binding, not the complete `GastArbeitsbereich` route/unmount lifecycle. |
| Next boundaries | External `next/dynamic` uses React lazy/Suspense; navigation methods are inert and audited; Link is an anchor; Image is a labelled span; explicit cache/headers/server/server-only/OpenTelemetry modules are empty. Unrecognised Next imports fail bundling. No product workflow/readiness function is shimmed. |
| Presentation | No CSS is loaded. Viewport is 1280×900 only to make interaction possible. There are no layout, responsive, zoom or screenshot claims. Author's corrected current-head CSS/matrix evidence remains a separate requirement. |
| Isolation | Local HTTP server; fresh browser context per scenario; service workers blocked; nonlocal HTTP requests and all WebSockets blocked and audited. Any attempted external request or page error prevents a passed result. Default Chromium launch has only `{ headless: true }`, with no sandbox override or launch arguments. |
| Provenance | Requires Node 22, explicit new full HEAD, clean tracked sources, separate committed-source manifest, descendant of inspected R1, unchanged frozen guest callback/storage/TASK/PLAN boundaries. Hashes every nondependency repository input in esbuild's actual input graph against that commit. Records bundle SHA, input graph, installed dependency versions and before/after probe/product hashes. Fresh output is mandatory. |

The temporary window bridge exposes fixture storage/response operations and
observed events only. It exposes no production controller, reducer or private
React handle. The unknown-response injection is synthetic; the normal frozen
guest callback ordinarily resolves immediately after its synchronous write.

## Root-only execution after the actual R2 candidate exists

Use existing installed dependencies and browser. These commands do not install
anything or write to the checkout. Replace the two candidate values below with
the independently verified new head and its clean checkout. Use a new suffix
for any later invocation; existing evidence is never overwritten.

```bash
JETNITY_REVIEW_NODE22=/root/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node
JETNITY_T_R4_PROBE=/tmp/r106-review-evidence/trip-workspace-r4-probe-v1
JETNITY_T_R2_REPO=/absolute/path/to/clean/r2/checkout
JETNITY_T_R2_HEAD=REPLACE_WITH_VERIFIED_NEW_40_HEX_HEAD
JETNITY_T_R4_MANIFEST=/tmp/r106-review-evidence/trip-r4-r2-committed-manifest-run1.json
JETNITY_T_R4_OUTPUT=/tmp/r106-review-evidence/trip-r4-r2-workspace-run1

"$JETNITY_REVIEW_NODE22" "$JETNITY_T_R4_PROBE/source-manifest.mjs" \
  --repo "$JETNITY_T_R2_REPO" \
  --expected-head "$JETNITY_T_R2_HEAD" \
  --output "$JETNITY_T_R4_MANIFEST"

PLAYWRIGHT_BROWSERS_PATH=/tmp/r106-review-browsers \
  "$JETNITY_REVIEW_NODE22" "$JETNITY_T_R4_PROBE/run.mjs" \
  --repo "$JETNITY_T_R2_REPO" \
  --expected-head "$JETNITY_T_R2_HEAD" \
  --source-manifest "$JETNITY_T_R4_MANIFEST" \
  --output-dir "$JETNITY_T_R4_OUTPUT"
```

The manifest step is metadata-only and validates the 22 primary files. The run
extends it to every actual bundled repository input and verifies source again
after execution. If a frozen boundary changes or the inspected R1 Git object is
unavailable, stop and inspect the source/provenance; do not remove the check to
obtain a passing result. The manifest by itself is not acceptance evidence.

## Outputs and interpretation

`workspace-r4-result.json` holds the three results, immediate callback/read
records, control classifications, provenance, browser/runtime/dependency
versions, network audit, page errors, and limitations. `trace-<case>.json` records
fixture storage/events even if a case fails. `committed-source-manifest.json`
and `bundle-metafile.json` identify actual compiled source; the generated
`workspace-bundle.js` has its own hash. A final closure archive can retain the
runner, fixture/shims, source manifests, result and unique trace evidence without
duplicating generated dependencies/bundles.

`BOUNDED_WORKSPACE_OBSERVATIONS_PASSED` means only the three described scenarios
passed with unchanged candidate source and no attempted external requests/page
errors. It is not complete R4 acceptance. The report always retains
`fullCentralRowGuardCoverage: false` because disabled row controls cannot prove
central dispatch. Root must review actual submit/Retry forwarding and separately
validate central edit/status/delete guards. No concealed hooks or event bypass
are added to manufacture that proof.

If the corrected source changes relevant copy/DOM or disables the draft field,
the probe stops rather than bypassing it. Root must distinguish a genuine
product counterexample from an obsolete fixture assumption before issuing a
finding. Browser setup, bundling or source-contract failures are reported as
infrastructure/contract failures, not product failures.

Remaining separate work includes current-head author CSS/viewport evidence,
the rest of the accepted R1/R2 matrix, native CI/Preview gates, root's complete
source review, and later actual-main postmerge gates. This probe adds no new
product scope and no hosted, RLS, production or full-router claim.
