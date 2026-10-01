# Registry Traveller → Preparation Slot Integration 1 — Handoff

Date: 1 October 2026
Issue: #688
Draft PR: #689
Branch: `fix/registry-traveller-preparation-slot-integration-1`
Baseline: `main@9c494110196a2877f6eba3babe7cf5ae7c00acf1`

Logical agent: **Jetnity Registry traveller preparation slot integration 1**, Generation 1
Session: https://cursor.com/agents/bc-9ea87fd0-84d7-4c15-9fad-bfa5cc51c53d
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

Parallel lane C is implemented on this branch and waiting for independent Technical-Lead review. Stay Draft. Do not Ready. Do not merge. Do not start a follow-up slice.

Read first:

1. `docs/REGISTRY_TRAVELLER_PREPARATION_SLOT_INTEGRATION_1_TASK_2026-10-01.md`
2. `docs/REGISTRY_TRAVELLER_PREPARATION_SLOT_INTEGRATION_1_REPORT_2026-10-01.md`
3. `docs/REGISTRY_TRAVELLER_PREPARATION_SLOT_INTEGRATION_1_SELF_REVIEW_2026-10-01.md`

`git fetch origin main` in this session: `origin/main` and the merge-base are `9c494110196a2877f6eba3babe7cf5ae7c00acf1`. The branch was 0 behind that SHA before the tip push. Re-fetch before treating a later SHA as current. Do not rebase onto a newer main inside this slice unless the Technical Lead assigns that. Do not touch active #686 Source Catalog or #687 freshness/gap ownership.

## Behaviour to review

- Fresh Registry → Trip snapshots keep new ids and clientRefs. Account Registry ids are not reused.
- No citizenship, passport, or credential is selected as preferred.
- `Trip.travellers` is the applicable slot count, still clamped by `PARTY_GRENZEN.slots` (20).
- Exact `traveller:N` inside that count stays in slot N.
- Other persisted trip travellers fill remaining empty applicable slots by `createdAt`, then `clientRef`, using code-point order. The slot's `clientRef` is the traveller's own ref, so later edits and deletes address that snapshot.
- People beyond the headcount stay `applicable: false`. They do not change Requirements, Preparation checks, Safety context, or missing-nationality facts.
- Empty applicable slots still report missing nationality and still use `traveller:N` plus the `Reisende N` label.
- Same labels are not merged.
- When every applicable slot is occupied, Registry import returns `REGISTRY_TRIP_COPY.limit` and does not read the Registry or write the party. The same stop remains for a party length of 20.
- The account workspace sets `voll` from `registryTripUebernahmeGesperrt(reise)`, so the existing disabled state and limit sentence appear before a full trip accepts another copy.
- Success still revalidates `/reisen/[tripId]` and the client still calls `router.refresh()` only after `ok`.

## Proof boundary

Synthetic tests only. No real account, no passport number, no MRZ, no biometric, no health data. No Supabase mutation. No Production mutation. No provider call.

Local `npm test` was 4190 pass / 1 fail. The failure is `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` in `lib/readiness/official-truth-store-server.test.ts`. This VM has no PostgreSQL 16 binary. That file is outside this diff. Do not treat the local suite as a PostgreSQL proof, and do not treat that ENOENT as a slot regression.

Exact-head GitHub CI, Auth, and Vercel Preview belong to the pushed tip. This file does not embed a run id, because writing one after the run would create a newer head. Read the checks on the tip SHA. Do not treat the task-seed parent or `main` as this head's gate.

## Stop

Cursor does not Ready, merge, mutate a database, or open the next slice.
