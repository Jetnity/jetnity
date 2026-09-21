# Jetnity – V1 Live Gap Reconciliation 1 – Binding Task

Stand: 21. September 2026
Issue: #495
Canonical base: `main@4169c5b4a2d6e2f663bfaace385a2d482a4cc2d9`

## Objective
Reconcile historical Account / Privacy / Operations audit findings against current live repository truth so stale findings cannot drive duplicate work.

## Topology
Decision: SINGLE_AGENT.
This branch owns docs/evidence only and is intentionally disjoint from PR #494.

Agent: **Jetnity V1 live gap reconciliation 1**, Generation 1.
Required model: **Cursor Grok 4.6 High Fast** — no Auto/substitution.

## Read first
- historical G2 gap matrix/status/handoff
- current JETNITY_START_HERE / current live main
- closure docs for PRs #457, #460, #464, #470, #471, #472, #476, #477, #480, #483, #485, #487
- current relevant runtime files only as read-only evidence

## Required classification
For every material historical finding reviewed, classify:
- CLOSED
- STILL_OPEN
- PARTIAL
- PO_GATED
- SUPERSEDED
- NOT_APPLICABLE

For each classification include:
- historical finding ID/title
- old state
- current state
- exact current evidence
- closure PR/head when applicable
- remaining gate/dependency
- whether a new engineering slice is actually needed

At minimum reconcile:
1.1 legal pages
1.2 cookie consent
1.4 compliance claim hygiene
1.5 terms acceptance
2.1 data export
2.2 account deletion
2.4 retention
3.4 MFA recovery
3.8 production email
4.1 support process
4.2 account error boundary
5.2 security events
5.4 system health
5.5 alerting/incident process
6.3 admin revenue truth

Do not assume the historical matrix is current. Live evidence wins.

## Allowed files
- this task
- new slice-local reconciliation report
- STATUS / HANDOFF / SELF_REVIEW for #495

## Forbidden
- no app/components/lib/hooks/types/public edits
- no scripts/db or package.json
- no migrations/RLS/Auth/Supabase mutation
- no provider/secret/cost action
- no global continuity edits
- no implementation of findings
- no Ready/merge/follow-up

## Validation
- changed-file scope docs-only
- exact main / merge-base / behind=0
- CI/Vercel if repository automation runs
- review threads 0

## Stop
Freeze head, report exact-head evidence in PR comment, STOP FOR TECHNICAL-LEAD REVIEW.
