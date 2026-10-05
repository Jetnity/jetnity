# V1 Auth Lookup Failure Truth 1 – honest protected HTML failure state — Binding Task

Stand: 21. September 2026
Issue: #499
Canonical base: `main@d1949e23b3dda30b7482265822e7e1279f244228`

## Objective
Close Regression Hunter finding RH-1.1 on current main `d1949e23b3dda30b7482265822e7e1279f244228`.

Protected HTML routes currently map Supabase/Auth lookup failure or missing Auth configuration to the same login redirect used for a genuinely unauthenticated user. APIs already return honest 503-style unavailable truth.

Implement the smallest fail-closed correction so HTML account/admin protected routes distinguish:
- unauthenticated -> login redirect
- identity lookup/configuration unavailable -> honest unavailable/retry surface

Do not weaken protection or AAL2.

## Ownership
Allowed: `proxy.ts`, focused proxy/auth contract tests, slice-local docs.
Forbidden: Supabase config/migrations, Auth provider settings, MFA/AAL semantics, account/trip runtime, package.json unless strictly required and TL approves.

No Production mutation. No Ready/merge/follow-up by Cursor.

## Multi-Agent Suitability
Decision: **SINGLE_AGENT** on this isolated branch.
This slice is intentionally file-disjoint from active PRs #494, #497 and the other P2 fix slices.

Agent: **Jetnity V1 auth lookup failure truth 1**, Generation 1.
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
