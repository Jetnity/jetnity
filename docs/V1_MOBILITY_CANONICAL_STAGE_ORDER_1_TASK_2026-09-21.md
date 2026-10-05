# V1 Mobility Canonical Stage Order 1 – position-ordered edges — Binding Task

Stand: 21. September 2026
Issue: #501
Canonical base: `main@d1949e23b3dda30b7482265822e7e1279f244228`

## Objective
Close Regression Hunter finding RH-3.1 on current main `d1949e23b3dda30b7482265822e7e1279f244228`.

`lib/mobility/kanten.ts` derives outbound/connection/return edges from incidental stage array order. Jetnity contract says stage truth is canonical `position` order.

Implement the smallest sort-then-walk fix and regression tests with deliberately out-of-order arrays but correct positions.

## Ownership
Allowed: `lib/mobility/kanten.ts`, `lib/mobility/kanten.test.ts` (or exact existing focused test), slice-local docs.
Forbidden: trip schema/types/migrations, provider code, UI redesign, package.json.

Preserve duplicate/ambiguous/fail-closed route semantics. No Ready/merge/follow-up by Cursor.

## Multi-Agent Suitability
Decision: **SINGLE_AGENT** on this isolated branch.
This slice is intentionally file-disjoint from active PRs #494, #497 and the other P2 fix slices.

Agent: **Jetnity V1 mobility canonical stage order 1**, Generation 1.
Required model: **Cursor Grok 4.6 High Fast** — no Auto/substitution.

## Validation
Run focused tests plus normal repository gates relevant to changed runtime files:
- typecheck
- lint
- npm test
- check:api-schutz
- check:schema-bezug
- check:dead
- check:exports
- check:deps
- build
- exact-head CI + Vercel
- merge-base=current main / behind=0
- review threads=0

Freeze final head and put final gate IDs in a PR comment, not a second evidence-only commit.

STOP FOR TECHNICAL-LEAD REVIEW.
