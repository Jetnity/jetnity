# Official Truth Fact-Entry Authority Guard 1 — Self-Review

Date: 2 October 2026
Issue: #760
Draft PR: #761
Branch: `fix/official-truth-fact-entry-authority-guard-1`

Logical agent: **Jetnity Official Truth fact-entry role data-plane authority guard 1**, Generation 1
Session: https://cursor.com/agents/bc-a3616990-3273-4b07-aac6-f648e8ce492e
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

Against `main@169b89def147891ed4685818d0db57ba9b88eb46`, the branch contains the task seed plus:

- `lib/readiness/official-truth-fact-entry-authority-server.ts`
- `lib/readiness/official-truth-fact-entry-authority-server.test.ts`
- `scripts/db/verwendung.mjs`
- `lib/admin/account-counts-delivery/schema-reference.test.ts`
- `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_FACT_ENTRY_AUTHORITY_GUARD_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_FACT_ENTRY_AUTHORITY_GUARD_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_FACT_ENTRY_AUTHORITY_GUARD_1_SELF_REVIEW_2026-10-02.md`

The schema files changed only so the literal `.rpc('darf_official_truth_freigeben')` is classified LOCAL/UNAPPLIED from this server file to the existing migration. Without that registration, `check:schema-bezug` fails closed on an unknown RPC. `types/supabase.ts` was the forbidden alternative and was not edited.

No Auth, guard, role, Supabase client, migration, or app route file changed. #755, #757, and #759 runtime modules were not edited. `docs/ACTIVE_WORK_STATUS.md` was not edited.

## Mandatory checks I saw pass

1. Role-backed access plus database boolean `true` returns authorized, and only the keys `status`, `grant`, and `capability`.
2. Break-glass plus a database-true fixture returns `role_grant_required` and the reader call count stays 0.
3. Break-glass with a role present, the shape left after AAL2, stays blocked.
4. `unauthenticated`, `forbidden`, and `aal2-required` return `access_forbidden` before the reader.
5. `lookup-failed` and `aal-lookup-failed` return `access_lookup_failed` before the reader.
6. Role-backed access plus database `false` returns `database_capability_denied`.
7. Codes `42883` and `PGRST202` return `database_capability_unavailable`.
8. Permission codes and HTTP 401/403 return `database_capability_denied` without echoing the code.
9. A thrown read, status 0, and an unknown code return `database_capability_failed` without echoing the error text.
10. `null`, `undefined`, `'true'`, numbers, arrays, objects, and a Boolean object fail closed.
11. Boolean `true` is the only database success. An error object is not success.
12. `loadOfficialTruthFactEntryAuthority.length` is 0. The source signature has no parameters and no dependency override.
13. The only `evaluateAdminAccess` call is `{ capability: 'official-truth-freigeben' }`.
14. The loader body calls `reachesDatabase(access)` before `readUserScopedOfficialTruthCapability`.
15. The only client factory is `createServerComponentClient()`. The file has no service-role client.
16. The only `.rpc('...')` literal is `darf_official_truth_freigeben`.
17. `git diff HEAD -- types/supabase.ts` is empty, and that file does not contain the RPC name.
18. No tracked file under `app/` names the module or either exported function.
19. The module source does not contain `regelKandidatAkzeptieren` or the store RPC.
20. The module does not read a request body, `ADMIN_ALLOWED_EMAILS`, or `auth.getSession`. A dirty access object does not copy email or user id into the result.
21. `requirementsProviderAus()` is `null`.
22. Calling the live loader outside a request returns `access_lookup_failed` and not `authorized`. `cookies()` throws before a client is built, so that test did not contact a remote database.

## Boundary choices a reviewer should see

1. The break-glass call count is proven on `decideOfficialTruthFactEntryAuthority`, which returns before invoking its reader. The live loader repeats `grant === 'role'` and `reachesDatabase` and returns before it passes `readUserScopedOfficialTruthCapability` into that seam. The live function accepts no dependency injection, so the break-glass fixture is not pushed into it.
2. Permission errors use `database_capability_denied`. Missing-function errors use `database_capability_unavailable`. Other failures use `database_capability_failed`. All three are blocked. None include the database message.
3. The seam trusts an already server-derived `AdminDecision`. It does not re-check the role string. The live loader obtains that decision only from `evaluateAdminAccess` with the fixed capability. A future route that calls the seam with a forged decision reopens F9.
4. The internal decision copy keeps `role` because `AdminDecision` requires it. The public result does not include it. Owner in the app decision is not enough; the RPC must return boolean `true`.
5. The merged function still grants `EXECUTE` to `service_role`. This module does not use that client. The function remains `SECURITY INVOKER` and still requires `hat_rolle_mindestens('owner')` and `aktuelles_admin_aal2()`. This slice does not edit that migration.
6. Registering the RPC in `LOCAL_UNAPPLIED_RPCS` does not apply it. A live call before a later apply fails closed as unavailable.
7. One regulatory cell is unchanged. This guard collects no citizenship, document, or traveller fact. It decides only whether a future fact-entry action may proceed.
8. No ADR was added. `DECISIONS.md` is outside this task's allowlist. The decision lives in the task, the architecture binding, this review, and the report.

## Tests and gates

Focused guard tests on this tree: 22/22 pass. Schema-reference tests: 4/4 pass. Full `npm test`: 4453 pass / 0 fail, 761 suites. Typecheck, lint, production build, diff check, operating-mode guard, and the hygiene checks passed. Lint reports 0 errors and 148 pre-existing warnings, none in the edited files.

PostgreSQL 16 was installed locally because `initdb` was absent. The package cluster was not started. No remote database was contacted. This slice did not apply SQL.

## Stop line

The docs commit after `f17a56a26abfa176e93e115c4a3189b7b5ff10eb` is not a behavior change. GitHub CI, the Auth job, and Vercel Preview belong to the pushed tip after that commit. Do not reuse run ids from `f17a56a2`. This remains a Draft. No Ready, no merge, and no follow-up from this writer.

**STOP for independent Technical-Lead exact-head review of the exact pushed tip.**
