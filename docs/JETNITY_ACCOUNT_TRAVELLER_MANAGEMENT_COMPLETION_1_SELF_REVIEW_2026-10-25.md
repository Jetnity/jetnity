# R106 A — Account Traveller Management Completion 1 — SELF-REVIEW

Author: Jetnity Account Traveller Management Completion 1 — Cursor Generation 1

R1 fix head reviewed by the author: `6b094021068483eee82cda7791b9fa99891c1877`

This review is the author's own reading. It is not an independent Technical-Lead PASS and it does not authorize Ready or merge.

## R1 findings

A-R1 through A-R5 are corrected on this head. None of them is recorded here as an accepted residual.

- A-R1: saved-but-unobserved receipts expose `Erneut lesen`. The mounted click sends no second write and keeps an unrelated draft.
- A-R2: explicit adoption advances the epoch. Late success and the `unbestaetigt` outcome cannot close or focus the adopted editor. The mounted success case moved epoch 3 to 4.
- A-R3: clean traveller and document edits reopen with the known list values. The second mounted payloads are `Alice` / `DE` and `passport` / `DE` / empty citizenship / `2030-01-01`. Dirty drafts survive. Create forms still clear.
- A-R4: keyboard cancel restores focus after commit for citizenship create, document create, and document edit at the 12-document limit. A focus the user already moved is left alone. The late document save does not take that focus.
- A-R5: the harness rejects the deferred action promise. `320.png` is the 16px capture and `320-root-32.png` is the 32px capture. The mounted module is under `scripts/account-traveller-management-completion-1/mounted.ts`.

## P0

None found in the owned diff.

## P1

None found in the owned diff.

## P2

No open R1 product defect remains in this review.

These limits are outside the five R1 findings and stay visible:

1. Local `npm test` is not the cited native baseline. Exit 1. Summary: 7129 tests, 7113 pass, 11 fail, 5 skipped. Every failure inspected starts at `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. The account-registry, country, and document-lifecycle tests that this lane owns or touches passed in the focused run (77 pass, 0 fail). Native CI on `c7613bd6` does not cover this head.

2. Production `router.refresh()` returns `void`. The rejection path runs only when the call returns a thenable. The harness shim does. The installed Next type does not. A failed production refresh is therefore not observable here, and a completed refresh is still not a list observation. The explicit reread keeps the 4000ms local deadline and does not send a write.

## P3

1. Create actions still return `wert: null`. The UI cannot point at the inserted row. Editing `account-registry-aktionen.ts` is outside this lane. Recommend a later Technical-Lead task if a later slice needs the id.

2. Two account tabs can still race. This client cannot see the other tab. The unknown-outcome rule does not claim exactly-once.

3. The repeat control uses `aria-disabled` and still receives a click, because `beginnen` is the authority. Playwright treats `aria-disabled="true"` as not enabled, so the mounted proof uses `click({ force: true })` to reach that guard. A forced click is not a second write path.

## Traveller context

Several citizenships stay equal. Residence, issuer, and citizenship stay independent. An empty document-to-citizenship choice is submitted as empty and preserved. A clean reopen shows the known list, including an empty citizenship link, rather than wiping stored metadata to null. The screen does not invent visa, transit, or carrier rules. A read error does not delete a person, citizenship, or document from the draft.

## Scope check

The R1 diff is the card, the pure workflow and its tests, the UI-test import, the moved mounted harness, and `run.mjs`. TASK and PLAN blobs match the accepted plan head. No global continuity file was edited. The previous evidence directory for `4022bc82` is still present.
