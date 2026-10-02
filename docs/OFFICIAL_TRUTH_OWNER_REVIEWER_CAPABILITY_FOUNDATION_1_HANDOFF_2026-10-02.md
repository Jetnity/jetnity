# Official Truth Owner Reviewer Capability Foundation 1 — Handoff

Date: 2 October 2026
Issue: #742
Draft PR: #743
Branch: `feat/official-truth-owner-reviewer-capability-foundation-1`
Baseline: `main@4a47190226d1d52bdb65374ad479393f0cdd0d4f`

Logical agent: **Jetnity Official Truth owner reviewer capability foundation 1**, Generation 1
Session: https://cursor.com/agents/bc-b12805ca-1d17-4171-9f96-40c873ab2585
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch adds the owner-only capability foundation and one unapplied migration. It is a Draft. It is not Ready and not merged. No endpoint, trusted fact, Rule acceptance, audit store or remote apply exists on this head.

Read first:

1. `docs/OFFICIAL_TRUTH_OWNER_REVIEWER_CAPABILITY_FOUNDATION_1_TASK_2026-10-02.md`
2. `docs/OFFICIAL_TRUTH_OWNER_REVIEWER_CAPABILITY_FOUNDATION_1_REPORT_2026-10-02.md`
3. `docs/OFFICIAL_TRUTH_OWNER_REVIEWER_CAPABILITY_FOUNDATION_1_SELF_REVIEW_2026-10-02.md`

`docs/ACTIVE_WORK_STATUS.md` was not edited. The task forbids global current-state files. This handoff is the continuity pointer for the slice. The status file still describes an older writer. Do not treat that older section as this slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- `git fetch origin main` resolved `origin/main` to `4a47190226d1d52bdb65374ad479393f0cdd0d4f`. The implementation commit `6f293687e8828b6e5884640af4d1b76016122b22` was 0 behind that SHA. Re-fetch before treating any later SHA as current. The final push must stay 0 behind.
- Local gates ran on `6f293687e8828b6e5884640af4d1b76016122b22`. `npm test` was 4416 pass / 0 fail across 759 suites. Typecheck, lint (0 errors, 148 warnings), the production build, the operating-mode guard and the hygiene checks passed. Schema reference still lists the three known LOCAL/UNAPPLIED RPCs.
- The docs commit after that SHA adds only this handoff, the report and the self-review.
- PostgreSQL 16.15 was installed locally for the existing throwaway proofs. The package cluster was not started. No remote database was contacted.
- Supabase CLI `2.116.0` created `supabase/migrations/20261002154952_official_truth_owner_reviewer_capability_1.sql`. The timestamp was not chosen by hand.

## Trust rule for the next reader

`official-truth-freigeben` is owner-only in `CAPABILITY_MINIMUM`. The database function also requires current AAL2. Break-glass does not reach the database. A request-body reviewer, role or AAL is not an argument of the function and is not authority.

`admin-guard.ts` and `admin-access.ts` were not widened. Later fact entry or acceptance must use the generic capability path and must require `grant === 'role'`.

This function does not accept a Rule, write a trusted fact, or persist a decision. Issue #741 is not started. Model output remains insufficient authority.

`types/supabase.ts` does not yet list `darf_official_truth_freigeben`. No application caller exists. Do not treat the generated types as updated.

`lib/rollout/aal2-prod-apply.ts` still covers only the historical five capabilities. Do not use that runner to apply this migration.

## What this slice did not do

- No endpoint, acceptance call, trusted-fact generator, audit table or RLS change.
- No real user, profile or role mutation.
- No Development or Production apply.
- No model, provider, secret, cost, indexing or launch change.
- No edit to global continuity files.
- No follow-up slice.

## Exact-head gate

The pushed tip is the review head. Its GitHub CI, Auth job and Vercel Preview are not copied into this file in advance. Self-review is not Technical-Lead PASS.

## Stop

No Ready. No merge. No Supabase apply. No acceptance endpoint. No model call. No Copilot Autopilot. No follow-up slice.

**STOP for independent Technical-Lead review of the exact branch tip.**
