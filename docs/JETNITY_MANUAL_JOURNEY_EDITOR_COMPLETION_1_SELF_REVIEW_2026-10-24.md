# Manual Journey Editor Completion 1 — SELF_REVIEW

Date: 24 October 2026
Author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
Session: `bc-02fbe98d-97ba-4c0b-a3b0-10857d784379`
Model: `grok-4.7-high-fast`

This is the author's review of the CODE REVIEW V3 repair. It is not a Technical-Lead PASS.

## Scope check

The runtime diff from `52779d7f` to `ecdaef7b` is `FlugBestand.tsx` and `scripts/manual-journey-editor-completion-1/harness.mjs`. The evidence commit adds proof and these four docs. TASK V1, addendum V1, and the accepted PLAN were not rewritten. Booking, rental, the connection alert, shared CSS, schemas, and `TripIntegratedDay` were not edited. No sibling branch was merged. Lint configuration was not weakened.

## Counting

`behaviorCount` 20 is `evidence.scenarios.length`: 20 named groups. It is not 20 executions and not an assertion count. The three groups named `late-r1-success-domain-reject-r2-pending` each execute R1 as success, domain, and reject (9 executions) while R2 stays success. `flight-pending-a-newer-b-keeps-focus` is one group and executes 6 times. `layoutCount` 9 is the separate viewport measurements, including 320 at root 32px.

## Findings

### P0

None found in the local proof.

### P1

None found in the local proof.

### P2

- `result.json` records `headAtRun` `ecdaef7b7ecb24b34b3bc482810ed646a405c807`. The evidence commit does not change `components`, `lib`, or `scripts`.
- Browser proof used Chrome `148.0.7778.96` after Playwright Chromium `chromium_headless_shell-1187` failed to launch. It is not native zoom and not a device.
- CI, Preview, hosted account, and a screen reader were not run for `ecdaef7b` or for the evidence commit.
- Live `origin/main` is `43124e28`. This branch was not rebased. Merge-base remains `0c37d318`.

### P3

- Lint on the runtime tree is exit 0 with 144 warnings and 0 errors. `FlugBestand.tsx` has none of them.
- `check:schema-bezug` prints pre-existing LOCAL/UNAPPLIED RPC notes.
- `check:setup` warned that this VM has no `.env`. The production build still exited 0.
- caniuse-lite is 13 months old.
- R103 and R104 `result.json` author strings are inherited. Historical evidence stayed byte-identical (16 files). R103 `wide-1280-pending.png` changed by a few bytes.
- The first harness launch after the commit timed out in `awaitSuspend` while the production build was still running. The isolated rerun passed. That timeout is not recorded as a product failure.

## Behavior the author rechecked in evidence

- Pending A, edit B, cancel B: focus is B's `Flugroute ändern` button. After A's success callback and after A's graph, that same button still has focus. The selection sentence is absent. Row A shows `11:30`.
- The same pending-A sequence with B left open keeps focus on B's departure input and keeps `12:00`.
- Domain and reject, with B open and with B closed, show the domain or throw text, keep A's `11:30` draft, and do not move focus onto A's alert.
- Same-row newer draft, completed-A-then-open-B, and ordinary saved-graph readback remain passing groups.
- At 320 CSS px and root 32px, page `scrollWidth` is 320.

## Not a pass

Author self-review does not authorize Ready or merge.
