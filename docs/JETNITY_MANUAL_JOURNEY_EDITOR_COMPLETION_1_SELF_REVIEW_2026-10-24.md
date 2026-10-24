# Manual Journey Editor Completion 1 — SELF_REVIEW

Date: 24 October 2026
Author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
Session: `bc-02fbe98d-97ba-4c0b-a3b0-10857d784379`
Model: `grok-4.7-high-fast`

This is the author's review of the CODE REVIEW V4 repair. It is not a Technical-Lead PASS.

## Scope check

The product diff in `b356fd9f` is `UnterkunftBestand.tsx`, `manual-journey-editor-completion-1.ts` and its test, and the lane harness/mount. ADDENDUM V2 was fast-forwarded and accepted main was merged. TASK V1, ADDENDUM V1, and the accepted PLAN blobs were not rewritten. Booking, rental, the connection alert, shared CSS, schemas, writers, and `TripIntegratedDay` were not edited. No sibling branch was merged. Lint configuration was not weakened. The completed P3 behavior/layout diagnostic split remains.

## Counting

`behaviorCount` 22 is `evidence.scenarios.length`. It is not 22 executions and not an assertion count. The three `late-r1-success-domain-reject-r2-pending` groups execute 9 times with R2 armed success. `flight-pending-a-newer-b-keeps-focus` executes 6 times. `stay-current-owner-focus` executes 3 times. `stay-pending-a-newer-b-keeps-focus` executes 6 times. `layoutCount` 9 is separate, including 320 at root 32px.

## Findings

### P0

None found in the local proof.

### P1

None found in the local proof.

### P2

- Playwright's bundled Chromium did not launch. Chrome `148.0.7778.96` ran the harness, R103, and R104.
- Native App/Auth/Vercel for the evidence SHA is not inside this commit. A green check on `b356fd9f` does not cover the evidence commit.
- Geometry is CSS viewport and root font-size. Native zoom and a physical device were not used.

### P3

- Repo lint remains 0 errors and 144 warnings. None are in the stay or flight editor files.
- `check:schema-bezug` prints the pre-existing LOCAL/UNAPPLIED RPC notes.
- caniuse-lite is 13 months old. This VM has no `.env`. `check:setup` warns and continues.
- R103 and R104 `result.json` author and session strings are inherited.
- R103 `wide-1280-pending.png` changed by a few bytes. Its `result.json` did not.
- Stay ownership advances only when the event is inside a different `[data-aufenthalt-editor]`. A keystroke in the saving editor does not drop that editor's own error focus. That keeps the existing same-editor domain case, which focuses Check-in while the save is pending and then expects the alert.

## Author conclusion

The local runtime proof for `b356fd9f` matches the three V4 corrections and the retained flight and diagnostic cases. Author does not mark Ready, merge, or close #998.
