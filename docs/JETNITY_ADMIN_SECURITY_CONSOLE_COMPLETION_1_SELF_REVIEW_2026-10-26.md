# Jetnity Admin Security Console Completion 1 — SELF_REVIEW

**26 October 2026 · author review of the R1 head · not a Technical-Lead PASS**

## Scope check

Owned files are the Security widget, its local operation status and CSS module, the response contract, the operation lifecycle, their tests, the narrow refresh-order test update, `scripts/admin-security-console-completion-1/**`, and the owned docs and evidence. Frozen routes, auth, loader, taxonomy copy, package, workflows and siblings were not edited. TASK V1 was not edited.

## R1

The reviewed gaps are corrected in the owned client. A denial now clears rows, KPIs and operation subjects together. Stale reads and older settlements do not restore them. The unlock label is gone. Long stored text no longer fails the whole list, and the widget will not submit a reason beyond the 2000-character presentation bound.

## What I would still question

A write denial clears every displayed operation, including an unrelated in-flight subject. That subject is not failed, not resent, and its later result cannot settle a newer operation. The independent-subject case without a denial still passes.

The full long string stays in client state so the filter can see it. The document shows only the first 2000 characters plus the truncation sentence. The truncation sentence sits under the scroll box.

"Erneut versuchen" still comes from the frozen error surface and calls the same list re-read. "Erneut lesen" is the owned recovery label. Neither one posts.

Writes return only after an accepted read. A discarded operation is not put back; the operator sends again from the form, whose text was left in place.

The mounted proof uses a bundled client component and compiled project CSS. It is not the deployed Preview document and not a real admin session.

`npm test` is not fully green on this machine because PostgreSQL 16 binaries are absent. I did not convert those failures into skips.

## Findings

- P0: none in the owned journey.
- P1: none found.
- P2 from the review of `c239bef1059453734070fbe22cf0a8aa6015e9e2`: addressed on this branch by the denial clearing and the long-text contract. Fresh exact-head review is still required.
- P2 remaining: render-time `Date.now()` for the 24-hour KPIs, an ESLint purity warning. The mounted clock is frozen.
- P3: eleven repository tests fail in this session solely because local PostgreSQL 16 is unavailable.

## Decision

I do not mark Ready and I do not merge. The branch stays Draft for an independent exact-head Technical-Lead review.
