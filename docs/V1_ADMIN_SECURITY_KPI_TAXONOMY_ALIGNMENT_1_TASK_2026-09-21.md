# V1 Admin Security KPI Taxonomy Alignment 1 – one event predicate — Binding Task

Stand: 21. September 2026
Issue: #503
Canonical base: `main@d1949e23b3dda30b7482265822e7e1279f244228`

## Objective
Close Regression Hunter findings RH-10.1 and RH-10.2 on current main `d1949e23b3dda30b7482265822e7e1279f244228`.

Current Admin Security UI and aggregator classify login failures/anomalies with different string rules. Align them behind one canonical presentation predicate without inventing a new producer or claiming ingestion completeness.

Historical event types must remain readable. #487/#494 producer work is separate.

## Ownership
Allowed: `components/admin/security/SecurityWidget.tsx`, `lib/admin/kennzahlen.ts`, one narrow shared admin-security taxonomy helper + focused tests, slice-local docs.
Forbidden: security_events schema/migration/RLS/writer, #494 files, blocklist enforcement, provider/secret, package.json unless strictly required and TL approves.

Preserve honest incomplete-ingestion copy and null/error != zero. No Ready/merge/follow-up by Cursor.

## Multi-Agent Suitability
Decision: **SINGLE_AGENT** on this isolated branch.
This slice is intentionally file-disjoint from active PRs #494, #497 and the other P2 fix slices.

Agent: **Jetnity V1 admin security kpi taxonomy alignment 1**, Generation 1.
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
