# Official Truth Regulatory Applicability Runtime Foundation 1 — Self-Review

Date: 3 October 2026
Issue: #794
Draft PR: #795
Branch: `feat/official-truth-regulatory-applicability-foundation-1`
Baseline: `main@50c1c799feb20adfafa563a3862b1cda70719cb4`
Logical agent: **Jetnity Official Truth regulatory applicability runtime foundation 1**, Generation 1
Session: https://cursor.com/agents/bc-925f9127-f08a-44ff-84b2-c2d8406633f2
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This self-review is the author check. It is not an independent Technical-Lead PASS. It does not mark Ready and it does not merge.

## Scope check

The task allows:

- `lib/readiness/regulierungs-anwendbarkeit.ts`
- `lib/readiness/regulierungs-anwendbarkeit.test.ts`
- the report, this self-review, and the handoff

No `rule-claims.ts` edit. No acceptance, store, extractor, same-request, route, UI, migration, or provider edit. The task seed was not edited. `.jetnity/operating-mode.json` was not edited. `docs/ACTIVE_WORK_STATUS.md` was not edited because the task says to verify exactly the owned files and delivery docs. The handoff carries the continuity fields. Merged architecture #793 recorded the same limit.

A dirty `next-env.d.ts` existed before implementation and was restored. It is not staged.

## Contract check

I implemented the #793 vocabularies, bounds, parsers, normalization, three-valued table, missing-fact short-circuit, branch outcomes, and the corrected dependency trace.

`otherwise` does not run while any exemption is unknown. False facts are dependencies. The first canonical decisive operand is the only short-circuit dependency. `not` does not rewrite polarity. Empty branched traces fail closed. Unconditional binding stays null.

Legacy and schema-1 requirement-effect and visa-option key sets match section 3.1. Mixed outcomes are rejected. Legacy `conditional` is not rewritten into branches.

`REGULIERUNGS_REGION_PINS` is empty. There is no source-specific country flag and no `reg-eval-ctx:v1` string in the module. The test walks repository code and allows an import of this module only from its own test.

## Deliberate mappings

These are inside the task, and a reviewer should see them explicitly:

- `OfficialRequirementType` comes from `@/types/trips` because `official.ts` does not re-export it. `OFFICIAL_VISA_MODES` is imported so invalid modes are rejected instead of coerced.
- The personal-key denylist is duplicated from the claim parser, plus the names this task adds. Importing `rule-claims.ts` is forbidden.
- Visa-option cardinality, uniqueness, and sort match today's `visaOptionenLesen` (1..4).
- Official visa eligibility `unknown` evaluates as `official_unknown` so it is not coerced to `not_allowed`.
- Non-visa `visaMode` uses the live reason `visa_mode_forbidden`. A contradictory visa pair uses `visa_contradiction`.
- `account_profile` is rejected on facts the architecture says the profile must not supply.

## What I did not do

I did not wire the parser into acceptance. I did not persist branched facts. I did not pin region members. I did not map source prose onto the purpose enum. I did not add a context hash. I did not start F8.

## Author gate note

The focused test file passed 11/11 before this self-review was written. The full-suite, typecheck, lint, build, and hygiene results below are the delivery run. If a line says a command failed, that failure stands.

## Gates

Delivery run on this working tree, 3 October 2026, before the delivery commit. A commit cannot name its own SHA. The review head is the branch tip that contains this file. Re-fetch it.

- Focused `lib/readiness/regulierungs-anwendbarkeit.test.ts`: 11 pass / 0 fail.
- `npm test`: 4591 pass / 0 fail. Exit 0.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0. 148 problems, 0 errors, 148 warnings. None are in the owned files.
- `npm run build`: exit 0. Next.js 16.3.8.
- `npm run check:operating-mode`: PASS.
- `npm run check:dead`: exit 0. The dormant module is reachable through its test.
- `npm run check:exports`: exit 0. 0 exports without a caller.
- `npm run check:deps`: exit 0. 11 dependencies, 0 unused.
- `npm run check:api-schutz`: exit 0. 12 admin routes.
- `npm run check:schema-bezug`: exit 0. LOCAL/UNAPPLIED RPCs unchanged: `admin_account_counts_v1`, `darf_official_truth_freigeben`, `official_truth_source_catalog_v1`, `official_truth_store_accepted_v1`.
- `git diff --check`: exit 0.

`origin/main` at gate time: `50c1c799feb20adfafa563a3862b1cda70719cb4`. This branch was 0 behind. No remote database. No SQL applied. Local PostgreSQL 16 binaries exist only so existing throwaway proofs can call `initdb`. The system cluster was not started.
