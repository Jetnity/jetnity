# Official Truth Fact-Entry Authority Guard 1 — Report

Date: 2 October 2026
Issue: #760
Draft PR: #761
Branch: `fix/official-truth-fact-entry-authority-guard-1`
Baseline: `main@169b89def147891ed4685818d0db57ba9b88eb46`
Implementation commit: `f17a56a26abfa176e93e115c4a3189b7b5ff10eb`
Task seed: `97741acfcdeec7fb61af284ea3b8f6f9e74f565b`

Logical agent: **Jetnity Official Truth fact-entry role data-plane authority guard 1**, Generation 1
Session: https://cursor.com/agents/bc-a3616990-3273-4b07-aac6-f648e8ce492e
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report records the delivery. It is not a Technical-Lead PASS and it is not merge approval.

## Status

Partly finished as a Draft implementation. The dedicated server guard is implemented and locally gated. Independent exact-head review has not happened. Ready and merge were not set.

## Umgesetzt

`loadOfficialTruthFactEntryAuthority()` is the only live authority entry. It takes no arguments. It calls `evaluateAdminAccess({ capability: 'official-truth-freigeben' })`, then requires `decision.allowed`, `decision.grant === 'role'`, and `reachesDatabase(decision)`. Only after those checks does it call user-scoped `public.darf_official_truth_freigeben()` through `createServerComponentClient()`.

Authorized means the RPC data is exactly boolean `true`. The result is `{ status: 'authorized', grant: 'role', capability: 'official-truth-freigeben' }`. It carries no email, user id, role string, or database error text.

Break-glass, access denial, lookup failure, database `false`, a missing or unapplied function, a permission error, a thrown read, and any non-boolean value fail closed. Break-glass does not call the database reader.

`decideOfficialTruthFactEntryAuthority` is the deterministic test seam. It is not the live entry. No file under `app/` calls either function. The module does not call `regelKandidatAkzeptieren` or the trusted store.

The architecture file now binds a future fact-entry or acceptance path to this loader. Bypassing it would reopen F9.

## Dateien

- `lib/readiness/official-truth-fact-entry-authority-server.ts`
- `lib/readiness/official-truth-fact-entry-authority-server.test.ts`
- `scripts/db/verwendung.mjs`
- `lib/admin/account-counts-delivery/schema-reference.test.ts`
- `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`
- this report, the handoff, and the self-review

`scripts/db/verwendung.mjs` and the schema-reference test changed only to classify the existing unapplied function as LOCAL/UNAPPLIED from this one source file. That is the same scanner registration the catalog gateway uses. It is not a migration edit and not an apply.

`types/supabase.ts` is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited. The task forbids global startup and Guardian current-state files in this lane.

## Datenbank

No new migration. The existing migration `supabase/migrations/20261002154952_official_truth_owner_reviewer_capability_1.sql` was not edited and was not applied. No Development or Production Supabase call. No RLS, Auth, role, or profile mutation.

`check:schema-bezug` lists four LOCAL/UNAPPLIED RPCs:

- `admin_account_counts_v1`
- `darf_official_truth_freigeben` from this guard to the existing owner-capability migration
- `official_truth_source_catalog_v1`
- `official_truth_store_accepted_v1`

A missing function still fails closed at runtime as `database_capability_unavailable`.

## Tests

Focused guard file: 22 pass / 0 fail.
Schema-reference file: 4 pass / 0 fail.

Full `npm test`: 4453 pass / 0 fail, 761 suites. Duration about 42 seconds.

PostgreSQL 16 was installed locally because `initdb` was absent. The package cluster was not started: `policy-rc.d` denied `start`. The two existing throwaway proofs use their own temporary clusters. No remote database was contacted. This slice did not apply SQL.

## Build

`npm run typecheck` passed.
`npm run lint` passed with 0 errors and 148 pre-existing warnings. None are in the files this slice edited.
`npm run build` passed.
`git diff --check` passed.
`check:operating-mode` passed.
`check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, and `check:schema-bezug` passed.

`auth:pruefen` was not run. It needs repository secrets, and this slice does not change Auth.

## Security

The live loader is fail closed. Generic admin access and break-glass do not authorize fact entry. The database proof is the user-scoped RPC, not a caller role string. The narrow cast exists only because generated types do not list the unapplied function. The module does not construct a service-role client.

`requirementsProviderAus()` remains `null`.

## Kosten

No new dependency, provider, model, secret, or recurring cost.

## Offene Punkte

Independent Technical-Lead exact-head review has not happened. No route calls the guard yet. F7, F8, and #741 are not implemented. The RPC remains LOCAL/UNAPPLIED until a separate database gate.

## Risiken

A later route that calls `decideOfficialTruthFactEntryAuthority`, `requireAdminPage`, or the RPC directly would reopen F9. The architecture binding says the live loader is the only entry.

The merged function still grants `EXECUTE` to `service_role`. This guard does not use that path. The function is `SECURITY INVOKER` and still requires owner plus current AAL2 from the JWT. This slice does not change that grant.

## Empfehlung

Stop. Independent Technical-Lead review of the exact pushed head. Cursor does not Ready, does not merge, and does not start F7, F8, or #741.
