# Official Truth Regulatory Applicability Runtime Foundation 1 — Handoff

Date: 3 October 2026
Issue: #794
Draft PR: #795
Branch: `feat/official-truth-regulatory-applicability-foundation-1`
Baseline: `main@50c1c799feb20adfafa563a3862b1cda70719cb4`
Task: `docs/OFFICIAL_TRUTH_REGULATORY_APPLICABILITY_FOUNDATION_1_TASK_2026-10-03.md`
Task seed: `cea5d57bd36b616bd45ec184d57cf71011f1e75c` is not the review head.
Logical agent: **Jetnity Official Truth regulatory applicability runtime foundation 1**
Generation: **1**
Session: https://cursor.com/agents/bc-925f9127-f08a-44ff-84b2-c2d8406633f2
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

The review head is the branch tip that contains this handoff. Re-fetch before review. This handoff is not Ready and not a merge.

## Read first

1. `docs/OFFICIAL_TRUTH_REGULATORY_APPLICABILITY_FOUNDATION_1_TASK_2026-10-03.md`
2. `docs/OFFICIAL_TRUTH_REGULATORY_ELIGIBILITY_PREDICATE_ARCHITECTURE_1_2026-10-03.md`
3. `lib/readiness/regulierungs-anwendbarkeit.ts`
4. `lib/readiness/regulierungs-anwendbarkeit.test.ts`
5. `docs/OFFICIAL_TRUTH_REGULATORY_APPLICABILITY_FOUNDATION_1_REPORT_2026-10-03.md`
6. this handoff
7. `docs/OFFICIAL_TRUTH_REGULATORY_APPLICABILITY_FOUNDATION_1_SELF_REVIEW_2026-10-03.md`

Machine mode is `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.

## Status

Dormant pure foundation. Draft. Stopped for independent Technical-Lead review.

The module evaluates one supplied traveller context against one applicability payload. It does not choose a passport, does not rank citizenships, and does not compare credential options. The full citizenship set is membership-tested. A null credential link stays unknown.

## Owned files

- `lib/readiness/regulierungs-anwendbarkeit.ts`
- `lib/readiness/regulierungs-anwendbarkeit.test.ts`
- `docs/OFFICIAL_TRUTH_REGULATORY_APPLICABILITY_FOUNDATION_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_REGULATORY_APPLICABILITY_FOUNDATION_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_REGULATORY_APPLICABILITY_FOUNDATION_1_SELF_REVIEW_2026-10-03.md`

The task seed was already on the branch and was not edited. `rule-claims.ts` was not edited. No route, UI, migration, extractor, store, or acceptance file was edited. `docs/ACTIVE_WORK_STATUS.md` was not edited; this handoff is the continuity record for the exact-file task.

## Behaviour a reviewer should re-check

- Two `user_asserted` negatives (`not_valid`, `not_held`) decide `otherwise` / `required` / `context_asserted` with `polarity: 'false'` and no personal value in the trace.
- An `all` whose first canonical operand is already false does not keep a later `user_asserted` dependency.
- `not` of a user-asserted false atom keeps `polarity: 'false'`.
- Recorded-only dependencies bind `context_recorded`. Unconditional binds `null`.
- Unknown does not fall through to `otherwise`.
- Known origin plus empty region pins returns `region_membership_unpinned` and does not ask `journey_origin`.
- Residence is not lawful residence and is not journey origin. Passport is not ordinary.
- Legacy `conditional` fails closed. Mixed top-level outcome plus branches is `mixed_outcome`.
- Fingerprint prefix is only `rule-applicability:v1:`. The source has no `reg-eval-ctx:v1`.
- `REGULIERUNGS_REGION_PINS.length === 0`.
- No non-test importer.

## Gates

Same delivery run as the report and the self-review, on this working tree before the delivery commit:

- Focused applicability test: 11 pass / 0 fail.
- `npm test`: 4591 pass / 0 fail.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0, 0 errors, 148 pre-existing warnings.
- `npm run build` (Next.js 16.3.8): exit 0.
- `check:operating-mode`, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`: exit 0.
- `check:schema-bezug` still lists the same four LOCAL/UNAPPLIED RPCs. This slice added none.
- `git diff --check`: exit 0.

No remote database was contacted. Nothing was applied. Local PostgreSQL 16 binaries on the agent VM let existing throwaway `initdb` proofs run. The system cluster was not started. Exact-head CI and Vercel belong to the pushed tip.

## Database, cost, provider

No migration. No RLS change. No service role. No secret. No new running cost. No provider activation. `requirementsProviderAus()` stays as it is on this branch.

## Do not do

Do not Ready. Do not merge. Do not wire this module into `wirkungLesen`, the extractor, the same-request server, a route, or the store. Do not pin Common Travel Area members in this branch. Do not compute `reg-eval-ctx:v1`. Do not start F8 or a follow-up slice.

## Next step

Independent exact-head Technical-Lead review. Cursor stops.
