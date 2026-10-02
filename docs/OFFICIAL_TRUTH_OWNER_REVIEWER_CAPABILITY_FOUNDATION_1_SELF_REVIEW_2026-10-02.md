# Official Truth Owner Reviewer Capability Foundation 1 — Self-Review

Date: 2 October 2026
Issue: #742
Draft PR: #743
Branch: `feat/official-truth-owner-reviewer-capability-foundation-1`

Logical agent: **Jetnity Official Truth owner reviewer capability foundation 1**, Generation 1
Session: https://cursor.com/agents/bc-b12805ca-1d17-4171-9f96-40c873ab2585
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

Implementation commit: `6f293687e8828b6e5884640af4d1b76016122b22`.

Runtime and test files in that commit:

- `lib/auth/roles.ts`
- `lib/auth/roles.test.ts`
- `lib/auth/admin-access.test.ts`
- `lib/auth/admin-aal2-alignment.test.ts`
- `supabase/migrations/20261002154952_official_truth_owner_reviewer_capability_1.sql`
- `lib/admin/analyst/system-health-insights.test.ts`

The last file is the one allowlist exception. It is a frozen `CAPABILITIES` snapshot. Without the extra name, `npm test` fails. Analyst runtime was not edited.

The docs commit after `6f293687` is limited to:

- `docs/OFFICIAL_TRUTH_OWNER_REVIEWER_CAPABILITY_FOUNDATION_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_OWNER_REVIEWER_CAPABILITY_FOUNDATION_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_OWNER_REVIEWER_CAPABILITY_FOUNDATION_1_SELF_REVIEW_2026-10-02.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md`, `DECISIONS.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `JETNITY_HANDOFF.md` and `JETNITY_START_HERE.md` were not edited.

`lib/auth/admin-guard.ts` and `lib/auth/admin-access.ts` were not edited. The generic capability argument already accepts a new `CAPABILITY_MINIMUM` key, keeps the role on `profiles.role`, and leaves AAL2 on the existing guard.

No remote Supabase command was run. `supabase db push`, `db:anwenden` and `db:reproduzierbarkeit` were not run.

## Task coverage

| Task requirement | Where it is proved |
| --- | --- |
| `official-truth-freigeben: 'owner'` in `CAPABILITY_MINIMUM` | `lib/auth/roles.ts`; `roles.test.ts` |
| No one-off `role === 'owner'` path | existing `can()` / `decideAdminAccess()` only |
| Owner satisfies the application capability | `roles.test.ts`; `admin-access.test.ts` |
| admin, operator, moderator, creator and user do not | `roles.test.ts`; `admin-access.test.ts` |
| Break-glass is never database authority for this capability | `admin-access.test.ts` `reachesDatabase()` |
| Generic capability iteration still matches minimum roles | existing loop in `admin-access.test.ts`, now including the new key |
| Existing role ranks and other thresholds unchanged | `roles.test.ts` |
| CLI-created migration, timestamp not invented | `20261002154952_official_truth_owner_reviewer_capability_1.sql` via Supabase CLI 2.116.0 |
| `darf_official_truth_freigeben()` is SQL, stable, parallel safe, SECURITY INVOKER, `search_path = pg_catalog` | migration; `admin-aal2-alignment.test.ts`; throwaway catalog probe |
| True only for owner AND `aktuelles_admin_aal2()`, fail closed otherwise | migration body; alignment matrix; throwaway stub matrix |
| No table, RLS, policy or ownership change | migration text; alignment test |
| No SECURITY DEFINER and no caller-supplied reviewer/role/AAL | function signature and definition test |
| Revoke `public`/`anon`; grant only `authenticated` and `service_role` | migration; alignment test; throwaway `has_function_privilege` |
| AAL1 owner fails; AAL2 owner passes; AAL2 admin fails | alignment capability matrix |
| TypeScript and migration sets stay in lockstep | unchanged `faehigkeiten-datenbank.test.ts` |
| No endpoint, trusted fact, acceptance, audit, live role change, remote apply, #626 or #741 | diff scope |

## Boundary choices a reviewer should see

1. Application `can()` checks role rank only. Current AAL2 stays in `evaluateAdminAccess()` and in the database function. This slice does not invent a second AAL check inside `can()`.
2. An owner session whose AAL is not `aal2` still receives `grant: 'role'` from `decideAdminAccess()`. The existing guard then rejects it before an admin surface opens, and the database function also returns false. Both layers remain.
3. Break-glass for a non-owner, including an admin, returns `grant: 'break-glass'` and `reachesDatabase() === false` for this capability.
4. The new function calls the existing `SECURITY DEFINER` helper `hat_rolle_mindestens`. The new function itself stays `SECURITY INVOKER`, matching the current `darf_*` family.
5. `types/supabase.ts` does not contain the new function. There is no TypeScript caller. Generated types were not hand-edited.
6. The historical AAL2 production-apply runner was not taught this function. Applying this migration to Development or Production remains a later gate.
7. The analyst snapshot test was updated because it hard-coded the previous capability list. That is a test lockstep edit, not a new analyst capability.
8. The throwaway privilege probe used stub helpers. It proves this function's AND body, volatility, invoker mode, search_path and grants. It does not replay `20260817100000` or `20260827170000`.

## Validation recorded on the implementation commit

`6f293687e8828b6e5884640af4d1b76016122b22` against `origin/main` `4a47190226d1d52bdb65374ad479393f0cdd0d4f`, 0 behind.

- `npm test`: 4416 pass / 0 fail, 759 suites
- typecheck: pass
- lint: 0 errors, 148 warnings
- production build: pass
- operating-mode guard: PASS
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`: pass, with the three known LOCAL/UNAPPLIED RPCs
- migration versions: 68 files, no duplicate, this migration is the latest

The first `npm test` on this tree failed for two environment reasons that were then cleared: missing PostgreSQL 16 (`initdb` ENOENT) and gitignored `supabase/.temp/cli-latest` created by the CLI. After installing PostgreSQL 16.15 locally and deleting that temp directory, the suite passed. The package cluster was not started. No remote database was contacted.

## Stop

No Ready. No merge. No follow-up slice. Self-review is not Technical-Lead PASS.
