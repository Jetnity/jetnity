# Trip Personal Preparation Workflow Completion 1 — SELF_REVIEW

Date: 2026-10-25. Writer: **Jetnity Trip Personal Preparation Workflow Completion 1 — Cursor Generation 1**. Session `bc-6bbca11e-14c9-4f1a-ac07-e729d8a54ca3`. Model `grok-4.7-high-fast`.

This self-review is not Technical-Lead PASS. It does not authorize Ready or merge. Executed proof head `44e1a1c41d2e4939524d2b11996c7baa6a1b0056`. The review head is the commit that contains this file. TASK blob `961e288a4e0ba40fa00e7ea95e920eabd6423ff2` and PLAN blob `e58f582669793ff3b7d86727ac9130afa89eef98` are unchanged.

## Checked

- After an account create is confirmed, a later same-trip canonical delivery that drops the ref leaves the receipt and removes "Gespeichert und im aktuellen Stand sichtbar." The same sentence remains while the canonical read still contains the ref and the displayed list does not.
- After a guest delete is rejected and an absence read reconciles it, discarding that local attempt leaves the older create as `confirmed` and does not restore the visibility sentence. Writes stay 1, deletes stay 1, reads stay 2, and a newer draft remains.
- Pointer on B's title, then Tab to the unopened "Titel bearbeiten" button, then A's qualifying read, leaves focus on that button. B's editor stays closed.
- The completion focus effect still moves focus to a visible confirmed row. Status, named delete, search, editor, filter, and hidden-section cases still pass.
- A programmatic row focus in this Chromium is trusted. Counting it as a user interaction wrote the pre-confirmation ledger back and dropped the new phase. The effect now brackets that call. The flag is not a product control.
- Merge parents are the R3 behavior commit and accepted main `77ed41ad`. Inherited Account and Admin files are not in the diff against that main.

## Findings

### P0

None in the owned local proof.

### P1

The guest whole-trip writer still has no compare-and-swap. The read barrier, locks, and the new observed-ref set live in memory and end when TripWorkspace unmounts. Two tabs can still replace each other's whole-trip bytes.

### P2

Status, save, named delete, and row retry stay HTML-disabled while the barrier is set. The workspace proof invokes the production `onClick` stored on the node. That remains white-box wiring, not an ordinary browser click on a disabled control. Submit and Enter use the real form.

A late guest response does not undo a write that already reached storage. A matching read after an unknown outcome stays reconciliation. Native App, Auth, and Preview for this head were not observed at authoring. Full local `npm test` was not re-run. The CSS matrix mounts the list and hook, not the full TripWorkspace chrome. The behavior suites are unstyled and live in a different directory from the CSS matrix.

The first miscounted browser-lauf JSON is unavailable. The 10-pass/6-fail TAP is the preserved terminal capture, not a reconstruction.

### P3

Below the `sm` breakpoint the filter controls remain stacked. Harness chrome is not product UI.

## Not claimed

Hosted Account, hosted RLS, Production, native zoom, a physical device, a screen reader, compare-and-swap, exactly-once delivery, or a causal server nonce. No new runtime cost or provider call.
