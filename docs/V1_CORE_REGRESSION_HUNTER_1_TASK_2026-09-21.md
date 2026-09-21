# Jetnity – V1 Core Regression Hunter 1 – Binding Task

Stand: 21. September 2026
Issue: #496
Canonical base: `main@4169c5b4a2d6e2f663bfaace385a2d482a4cc2d9`

## Objective
Run an independent cross-surface regression audit against current accepted Jetnity V1 contracts.

This is read-mostly QA/evidence, not implementation.

## Topology
Decision: SINGLE_AGENT on its own branch.
Disjoint from PR #494 and #495. No shared writer ownership.

Agent: **Jetnity V1 core regression hunter 1**, Generation 1.
Required model: **Cursor Grok 4.6 High Fast** — no Auto/substitution.

## Review domains
At minimum:
1. Account / session / error boundary
2. Guest → account migration
3. Trip workspace / ordered multi-stage route
4. Traveller registry
5. Multi-citizenship / multi-document
6. Destination / transit / readiness truth
7. Search/provider fail-closed behavior
8. Commercial/provider neutrality
9. Assistant truth projection / no auto-apply
10. Admin security/revenue/system-health honesty
11. Mobile/accessibility accepted contracts
12. Continuity/docs-vs-live contradictions relevant to runtime truth

## Binding invariants to attack
- unknown != not_required
- unavailable != not_required
- stale != current
- planned != visited
- no default/primary/preferred citizenship/passport inference
- one traveller may have multiple peer citizenships/documents
- Official Truth != Provider Truth != Jetnity Recommendation != Community Opinion != Generated Suggestion
- provider order must not become truth/ranking bias
- no hidden live provider activation
- no assistant auto-apply
- no false green/admin zero-from-error coercion
- no regression from AAL2/security boundaries

## Findings
Use P0/P1/P2/P3.
For each finding:
- FACT / INFERENCE / RISK / RECOMMENDATION
- exact file/function evidence
- accepted contract contradicted
- user/security/privacy/truth impact
- smallest correction direction
- whether special PO gate applies

If no issue in a reviewed surface, record explicit non-finding.

## Allowed files
- this task
- new QA report
- STATUS / HANDOFF / SELF_REVIEW for #496

No test/runtime code unless Technical Lead later expands scope.

## Forbidden
- no app/components/lib/hooks/types/public edits
- no scripts/db or package.json
- no migrations/RLS/Auth/Supabase mutation
- no provider/secret/paid action
- no global continuity edits
- no implementation/fix
- no Ready/merge/follow-up

## Validation
- docs-only changed scope
- exact main / merge-base / behind=0
- CI/Vercel if triggered
- review threads 0

## Stop
Freeze head, report exact-head evidence in PR comment, STOP FOR TECHNICAL-LEAD REVIEW.
