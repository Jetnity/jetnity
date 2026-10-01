# Registry Traveller → Preparation Slot Integration 1 — Report

Date: 1 October 2026
Issue: #688
Draft PR: #689
Branch: `fix/registry-traveller-preparation-slot-integration-1`
Baseline: `main@9c494110196a2877f6eba3babe7cf5ae7c00acf1`

Logical agent: **Jetnity Registry traveller preparation slot integration 1**, Generation 1
Session: https://cursor.com/agents/bc-9ea87fd0-84d7-4c15-9fad-bfa5cc51c53d
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## What changed

`travellerSlots()` still treats `Trip.travellers` as the exact count of applicable slots, clamped to 1..20. An exact persisted `traveller:N` stays in that slot. Any other persisted trip traveller can fill an empty applicable slot. Fill order is code-point order of `createdAt`, then `clientRef`. It does not follow the party array order, the label, or a citizenship. The occupied slot keeps that traveller's own `clientRef`. Travellers beyond the headcount stay non-applicable and do not feed Requirements, Preparation checks, or Safety.

Registry import now stops when every applicable headcount slot is already occupied, or when the party array already hits the absolute cap of 20. Both stops happen after the trip read and before the Registry read and before `party_schreiben`. The visible copy remains `REGISTRY_TRIP_COPY.limit`. Success copy, `revalidatePath`, and `router.refresh()` are unchanged.

The snapshot builder is unchanged. It still mints fresh trip-owned ids and clientRefs and does not reuse Account Registry identities.

## Why the live failure happened

A successful Registry copy stored a trip-owned traveller whose clientRef was not `traveller:N`. Preparation, Requirements, and Safety kept only `slot.applicable`. Those paths therefore kept showing empty `Reisende N` placeholders. The import itself had not failed.

## Scope actually touched

Runtime:

- `lib/readiness/party.ts`
- `lib/traveller/account-registry-trip.ts`
- `lib/readiness/reisende-aktionen.ts`
- `components/trips/KontoArbeitsbereich.tsx`

`lib/traveller/account-registry-trip-copy.ts` was not changed. The existing limit sentence is the failure copy for both gates.

Tests:

- `lib/readiness/party-slot-integration.test.ts`
- `lib/traveller/account-registry-trip-orchestrierung.test.ts`
- `lib/traveller/account-registry-trip-ui.test.ts`
- `lib/trips/account-graph-read.test.ts`

The graph-read test is not a new runtime path. It repeats the action mapping and now passes `travellers` because the orchestration type requires the headcount. `components/trips/RegistryReiseUebernahme.tsx` was not edited. It already disables the action and shows the limit copy when `voll` is true.

No migration, schema, RLS, Auth, Production, provider, or global continuity file was edited. `.jetnity/operating-mode.json` was not edited. Machine mode was `NORMAL`.

## Local validation before this push

Recorded on this VM before the tip was pushed. Do not copy a parent run forward.

- Focused slot, orchestration, UI, materialisation, and account-graph tests passed after the final assertion fix. The integration file is 10 pass / 0 fail.
- `npm test`: 4190 pass / 1 fail. The single failure is `lib/readiness/official-truth-store-server.test.ts`, `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. This VM has no PostgreSQL binary. That test file is not in this diff. This is not a product failure of the slot change, and it is not a local PostgreSQL proof.
- `npm run typecheck`: pass.
- `npm run lint`: 0 errors, 148 warnings. None are in the files this slice changed.
- `npm run build`: pass. Next.js 16.3.8. 25 static pages. `check:setup` warned that no `.env` / `.env.local` is present. That warning predates this slice.
- `check:dead`: 0 unwarranted orphans. `check:exports`: 0 unwarranted exports. `check:deps`: 0 unused packages. `check:api-schutz`: 12 admin routes, all use `requireAdminApi()`.
- `check:schema-bezug`: exit 0. It still prints the pre-existing LOCAL/UNAPPLIED notes for `admin_account_counts_v1` and `official_truth_store_accepted_v1`. This slice did not add an RPC.
- `git fetch origin main`: merge-base and `origin/main` are `9c494110196a2877f6eba3babe7cf5ae7c00acf1`. The branch was 0 behind that baseline. `git diff --check` passed.

`db:rechte`, `db:rls`, `db:sicherheit`, and `auth:pruefen` were not run locally. They talk to a database. This slice does not change the database. GitHub CI still runs Auth on the tip.

No browser pass was run. The task forbids real personal data and database mutation. Preparation reads `travellerSlots()`. The synthetic tests assert that contract for Requirements, derived preparation checks, and Safety.

## Not done

Cursor does not Ready and does not merge. No follow-up slice was started. Exact-head GitHub CI, Auth, and Vercel Preview belong to the pushed tip. This report does not embed a run id.
