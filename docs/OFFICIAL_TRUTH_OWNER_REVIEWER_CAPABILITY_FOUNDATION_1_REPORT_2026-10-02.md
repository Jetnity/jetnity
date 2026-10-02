# Official Truth Owner Reviewer Capability Foundation 1 — Report

Date: 2 October 2026
Issue: #742
Draft PR: #743
Branch: `feat/official-truth-owner-reviewer-capability-foundation-1`
Baseline: `main@4a47190226d1d52bdb65374ad479393f0cdd0d4f`

Logical agent: **Jetnity Official Truth owner reviewer capability foundation 1**, Generation 1
Session: https://cursor.com/agents/bc-b12805ca-1d17-4171-9f96-40c873ab2585
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review. This report is not Ready and not a merge.

## Technical-Lead R1

Independent review `5394162809` on exact head `d3017b169a189baf322a9544bc819a0c4a8d7e23` found one governance issue. The approved capability changes the repository-wide `CAPABILITIES` inventory, and `lib/admin/analyst/system-health-insights.test.ts` freezes that global list.

The Technical Lead amended the binding task in `458a3b9075b9ab010b3a65a61f09f8a42ee1e6b3`. That test-only file is now an R1-authorized dependency. The existing semantic change on the R1 head stays. No Analyst runtime file is part of this fix. No other R1 finding exists.

## Result

The canonical capability model now contains exactly one new entry:

`official-truth-freigeben: 'owner'`

in `CAPABILITY_MINIMUM` (`lib/auth/roles.ts`). There is no separate `role === 'owner'` authorization path. `can()`, `minimumRoleFor()` and `decideAdminAccess()` are the application vocabulary.

The matching database function is `public.darf_official_truth_freigeben()`. The Supabase CLI `2.116.0` created the file. The timestamp was not invented:

`supabase/migrations/20261002154952_official_truth_owner_reviewer_capability_1.sql`

The function returns boolean, is `language sql`, `stable`, `parallel safe`, `security invoker`, and pins `search_path = pg_catalog`. It is true only when `public.hat_rolle_mindestens('owner')` and `public.aktuelles_admin_aal2()` are both true. It takes no reviewer, role or AAL argument. It does not read `user_metadata`. It is not `SECURITY DEFINER`. Execute is revoked from `public` and `anon` and granted only to `authenticated` and `service_role`.

`lib/auth/admin-guard.ts` and `lib/auth/admin-access.ts` were not modified. The generic `capability?: Capability` path already represents this choice: the role comes from `profiles.role`, the verified user comes from `auth.getUser()`, and current AAL2 remains the existing admin-guard check. Break-glass can open an admin surface. `reachesDatabase()` stays false unless `grant === 'role'`.

## What this slice did not change

- No app route, API route, Server Action or endpoint.
- No `trustedRuleFact` and no call to `regelKandidatAkzeptieren`.
- No decision or audit persistence.
- No table, RLS policy, ownership or profile/role mutation.
- No remote Supabase Development or Production apply.
- No provider, OpenAI, model or network call from the product.
- No secret, cost, indexing or launch change.
- No edit to #626 and no implementation of Future issue #741.
- No edit to `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_HANDOFF.md`, `JETNITY_START_HERE.md`, `DECISIONS.md`, `ARCHITECTURE.md` or `ROADMAP.md`. The task forbids global current-state files. This report, the handoff and the self-review are the continuity for the slice.
- `lib/auth/faehigkeiten-datenbank.test.ts` was left unchanged. Its generic lockstep coverage passed with the new pair.
- `types/supabase.ts` was not edited. Nothing in the application calls the new function yet, so `check:schema-bezug` does not require a generated signature. A later caller must regenerate types from the applied schema. Hand-editing the generated file was outside this allowlist.

## R1-authorized test dependency

`lib/admin/analyst/system-health-insights.test.ts` is the Technical-Lead-authorized R1 dependency from review `5394162809` and task amendment `458a3b9075b9ab010b3a65a61f09f8a42ee1e6b3`. It is not a self-granted scope exception.

The test freezes the global capability names. The expected list includes `official-truth-freigeben` in insertion order, and the test name records that the Analyst does not invent its own capability. `laden.ts` still requires `betrieb-lesen` and does not invent `analyst-lesen` or `copilot-ausfuehren`. No Analyst runtime file was edited.

## Local database probe

PostgreSQL 16.15 was installed from Ubuntu packages so the existing throwaway Official Truth proofs could run. `policy-rc.d` denied starting the package cluster. No remote database was contacted.

A separate throwaway cluster applied only this migration, after stub `hat_rolle_mindestens(text)` and `aktuelles_admin_aal2()` helpers. Catalog readback:

- `prosecdef = false` (SECURITY INVOKER)
- `provolatile = s` (STABLE)
- `proparallel = s` (PARALLEL SAFE)
- `proconfig = {search_path=pg_catalog}`
- EXECUTE: `public` false, `anon` false, `authenticated` true, `service_role` true
- stub not-owner + AAL2 => false
- stub owner + not AAL2 => false
- stub owner + AAL2 => true
- unset stub settings => false

That probe does not replay the historical role or AAL migrations. Fail-closed behaviour of the real helpers remains the existing `coalesce(..., false)` contract in `hat_rolle_mindestens` and `aktuelles_admin_aal2`. The cluster was removed after the probe.

The CLI also wrote gitignored `supabase/.temp/cli-latest`. The project-sanitation test requires that path to stay absent. The directory was deleted before the green `npm test` and was not committed.

## Integration

`git fetch origin main` during R1 resolved `origin/main` to `4a47190226d1d52bdb65374ad479393f0cdd0d4f`. The branch was 0 behind that SHA. The R1 parent is the Technical-Lead task amendment `458a3b9075b9ab010b3a65a61f09f8a42ee1e6b3`. Re-fetch before treating any later SHA as current.

The first delivery gates ran on `6f293687e8828b6e5884640af4d1b76016122b22`. Those results belong to the pre-R1 tree. R1 does not change runtime, tests or SQL. It records the authorized test dependency and reruns the gates.

## R1 validation

Gates below ran on the R1 working tree whose parent is `458a3b9075b9ab010b3a65a61f09f8a42ee1e6b3`. The only R1 delta from that parent is this report, the handoff and the self-review.

| Check | Result |
| --- | --- |
| `git diff --check` | clean |
| `npm run check:operating-mode` | PASS |
| focused role/admin/AAL2/capability tests | 113 pass / 0 fail |
| `npm test` | 4416 pass / 0 fail, 759 suites |
| `npm run typecheck` | pass |
| `npm run lint` | 0 errors, 148 warnings |
| `npm run build` | pass. Setup check warned that no `.env` / `.env.local` is present. |
| `check:dead` | 0 unwarranted orphans |
| `check:exports` | 0 unwarranted exports |
| `check:deps` | 0 unused checked packages |
| `check:api-schutz` | 12 admin routes, all use `requireAdminApi()` |
| `check:schema-bezug` | generated structures match. Three known LOCAL/UNAPPLIED RPCs remain: `admin_account_counts_v1`, `official_truth_source_catalog_v1`, `official_truth_store_accepted_v1`. |
| migration list | 68 SQL files, no duplicate version, latest is `20261002154952_official_truth_owner_reviewer_capability_1.sql` |

The 148 lint warnings match the existing tree. This slice did not add a lint error. No remote migration was applied. `db:reproduzierbarkeit` was not run because it needs a live database.

## Traveller context

This slice adds authority only. It does not read citizenship, documents, residence or route facts, and it does not invent a visa, transit, health or carrier rule.

## Later boundary

`lib/rollout/aal2-prod-apply.ts` still verifies only the historical five `darf_*` functions from the AAL2 alignment migration. It was not extended. Production apply of `darf_official_truth_freigeben()` is a later Product-Owner gate and must not be folded into that historical runner.

Issue #741 remains a future Copilot Autopilot. It is not implemented here. Model output is still not Official Truth authority.
