# Admin Account Counts Delivery 1 — HANDOFF

Stand: 22. September 2026  
Status: **R1–R4 FIX PACKAGE FROZEN / AWAITING INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**

## Identity

- Agent: **Jetnity admin account counts delivery 1**, Generation 1
- Session: `bc-3d009635-3ebd-40d6-b47e-dc8328cf309b`
- Required/actual model: `cursor-grok-4.6-high-fast`
- UI rename: **not** performed
- Footer: [#553 comment 5783559904](https://github.com/Jetnity/jetnity/pull/553#issuecomment-5783559904)
- Review requiring this package: [5283659145](https://github.com/Jetnity/jetnity/pull/553#pullrequestreview-5283659145)
- Task seed: `6666b02795a080fdb10f73158503e009f7d853c2`
- PR: #553 Draft
- Branch: `feat/admin-account-counts-delivery-1`

## Reconstruction pins

- Previous freeze that was CHANGES REQUIRED: `d1d18daca96bb72c4ed6645c46b765e867bd5615`
- Authorized exact-main sync pin / merge-base: `ff054f76c14cf1c434890ba342af4df5e536dd05`
- Mode: NORMAL
- #551 already merged at that pin; incoming docs-only files remain read-only

## What a reviewer should read

1. Binding task and this STATUS / HANDOFF / SELF_REVIEW
2. `lib/admin/account-counts-delivery/{activation,parser,reader,contract}.ts` and tests
3. Wrapper SQL and mixed-class local proof
4. Page mount via `isAdminAccountCountsRuntimeEnabled()`
5. Evidence `docs/evidence/admin-account-counts-delivery-1/`

## Exact next step

Independent Technical-Lead exact-head re-review of this R1–R4 package. Do not Ready. Do not merge the PR. Do not start another agent. Production activation remains a separate reserved gate. Schema-reference LOCAL/UNAPPLIED inventory remains a later TL-owned addendum.

## Limitations to preserve

- No live statistics claim
- No hosted/Production/Preview enablement
- No authenticated PostgREST/browser E2E
- PostgreSQL 16.15, not Production 17.6
- Schema-reference green does not cover the named-constant wrapper
- Author run-info is not TL control-plane model inspection
