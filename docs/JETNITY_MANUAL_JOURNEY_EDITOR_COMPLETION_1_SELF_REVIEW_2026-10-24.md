# Manual Journey Editor Completion 1 — SELF_REVIEW

Date: 24 October 2026
Author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
Session: `bc-02fbe98d-97ba-4c0b-a3b0-10857d784379`
Model: `grok-4.7-high-fast`

This is the author's review of the CODE REVIEW V4 repair and of the CODE REVIEW V5 evidence preservation. It is not a Technical-Lead PASS.

## Scope check

The product diff in `b356fd9f` is `UnterkunftBestand.tsx`, `manual-journey-editor-completion-1.ts` and its test, and the lane harness/mount. ADDENDUM V2 was fast-forwarded and accepted main was merged. TASK V1, ADDENDUM V1, and the accepted PLAN blobs were not rewritten. Booking, rental, the connection alert, shared CSS, schemas, writers, and `TripIntegratedDay` were not edited. No sibling branch was merged. Lint configuration was not weakened. The completed P3 behavior/layout diagnostic split remains.

CODE REVIEW V5 changes only evidence and these four owned documents. The 23 files under `docs/evidence/manual-journey-editor-completion-1/v4-b356fd9f/` are byte copies of the run stored by `860b35d9`. `archive-manifest.json` is the new map and states that this is an archival relocation, not a new execution. The four paths named in V5 are restored to the `be2c4932` blobs. No other pre-V4 evidence path changed. Product logic and test assertions were not edited again. `git diff b356fd9f -- components lib scripts` is empty.

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
- The V4 R103 `wide-1280-pending.png` differs by a few bytes from the prior file. Those V4 bytes are preserved at blob `c40449fa2e3e4b107e85c531111e51bc213d2c9e` inside `v4-b356fd9f/`. The original path is restored to blob `1a3f6f6e60d0532ee73f121094273a87e018e1e8`. The R103 `result.json` at the original path is the prior file. The archived R103 `result.json` is the same blob, `ec999469a7118c7d3a2a573d345372d467fa38a9`.
- Stay ownership advances only when the event is inside a different `[data-aufenthalt-editor]`. A keystroke in the saving editor does not drop that editor's own error focus. That keeps the existing same-editor domain case, which focuses Check-in while the save is pending and then expects the alert.

## Author conclusion

The local runtime proof for `b356fd9f` matches the three V4 corrections and the retained flight and diagnostic cases. That proof now lives at `docs/evidence/manual-journey-editor-completion-1/v4-b356fd9f/`, and the four prior paths match `be2c4932`. This preservation did not re-run the product. Author does not mark Ready, merge, or close #998.
