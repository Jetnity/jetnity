# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 1. September 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / PROVIDER ACTIVATION READINESS PRECHECK CLOSED & POST-MERGE VERIFIED / NO ACTIVE FOLLOW-UP IMPLEMENTATION / S6 NEXT CANDIDATE NOT STARTED / NO PROVIDER ACTIVATION / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven. Sandbox does not mean live truth.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen.

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_ACTIVATION_READINESS_PRECHECK_CLOSED_2026-09-01.md` ← **aktuellster Closure-/Continuity-Checkpoint**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_ACTIVATION_READINESS_PRECHECK_REVIEW_2026-09-01.md`
4. `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_HANDOFF_2026-09-01.md`
5. `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_STATUS_2026-09-01.md`
6. `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_RECOMMENDATION_2026-09-01.md`
7. `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_NEXT_SLICE_2026-09-01.md`
8. `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_GATE_MATRIX_2026-09-01.md`
9. `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_CANDIDATE_MATRIX_2026-09-01.md`
10. `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_EVIDENCE_2026-09-01.md`
11. `docs/JETNITY_BINDING_BUILD_ORDER.md`
12. `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md`
13. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3C_CLOSED_2026-08-31.md`
14. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
15. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Migration-/Persistenzfragen zusätzlich Supabase Production read-only prüfen.

## 2. Current verified main

Provider Activation Readiness Precheck runtime/continuity merge:

`main@15538630fff170f53fc0e9edb60012a769f83e4d`

Commit:

`Merge Provider Activation Readiness Precheck (#355)`

Post-merge evidence on exact merge SHA:

- Main CI #1560 / Run `33449440321`: **COMPLETED / SUCCESS**;
- Vercel Production `dpl_6WQJRXRoFp6eAPJjWEPF1GSLLFvD`: **READY**;
- Issue #351: **CLOSED / completed**.

This docs-only closure may advance canonical main after its own merge. Always read live `main` rather than assuming the SHA above remains the tip.

## 3. Provider Activation Readiness Precheck – final history

Issue:

**#351 – CLOSED / completed**

Original Draft PR:

**#354 – CLOSED / NOT MERGED** due the known connected GitHub Ready mutation error `Repository.fullDatabaseId`.

Recovery PR:

**#355 – MERGED** from exact same final branch head `d45cf6679005ab5d45401d5eeb39a47c8c3e6884`.

Logical Cursor agent:

**`Jetnity provider activation readiness precheck 1`**, Generation 1

Cursor session:

`bc-d1b4e6bb-c952-4242-ba57-384783bc23ea`

Initial agent head:

`43bb98762ed00bc0293e5b4df5566a4e25c3d865` → **CHANGES REQUIRED**.

Same-session review-fix head:

`997fca395cef8fe44a4198a1b313e28364d83723` → **independent Technical-Lead PASS**.

No new agent or generation was used for the review-fix or recovery.

## 4. Canonical conclusions

### Sandbox truth

Duffel test/sandbox prices are **not** real Commercial Truth and must not mint S5-A `live_api` under the current contract.

A future sandbox harness may test transport/mapping/timeout/expiry mechanics only. It cannot satisfy the real commercial snapshot gate and cannot unlock TW-8.

### Binding Provider Readiness order

The Product-Owner binding order remains:

**Provider Readiness S4–S8 → then real providers.**

No sequencing exception has been inferred or granted.

The serial Provider Readiness graph identifies **S6 – Persistent Cost Guard** as the next implementation candidate after S5. **S6 is not active and has not been started.**

Residual S4 remains open. S7 remains open. S8 remains open. All required S4–S8 work must be closed before real-provider activation unless the Product Owner explicitly changes the binding order.

### First later real Commercial Truth path

Preferred domain: **Flights**.

The live vendor remains undecided. Duffel live, Skyscanner or another qualified real-price source requires separate partner/commercial/licensing/DPA/cost/security decisions and gates.

### Server state

Process-local/Vercel memory is not a valid cross-request Nachweis store. Any zero-persistence proof must stay within one server-side invocation. Cross-request state requires a durable server-side store in a separate gated architecture slice.

### Viator

Viator Basic supports real-time schedule retrieval for a selected product but not booking-grade `/availability/check`. Activities remain a later candidate rather than the first Commercial Truth domain.

## 5. Production / Product-Owner boundary

Fresh read-only Production evidence remained:

- commercial provenance rows = **0**;
- `production_write_path_allocated = false`;
- Production Flight Event Provenance remains absent/unapplied.

This precheck did **not** activate a provider, create/read a secret, make paid/live vendor calls, mutate Production, allocate a writer, or start TW-8/TW-9.

Explicit Product-Owner approval remains required before:

- provider signup / contract / DPA acceptance;
- API key/token/secret creation or storage;
- paid/live provider calls;
- Production provider activation;
- Production schema/RLS/grant/role/function mutation;
- runtime/login writer principal allocation;
- real application writer/backfill;
- TW-8/TW-9 runtime;
- public/irreversible provider-live activation;
- sensitive Traveller/document changes;
- spend outside approved limits.

## 6. Current programme state

**NO ACTIVE FOLLOW-UP IMPLEMENTATION SLICE.**

S6 is the next identified candidate, not an active task. Do not automatically dispatch an agent from this checkpoint.

In the next work cycle, reconstruct live main/PRs/issues/CI/Vercel/Production truth again before starting any new slice.

**TW-8 and TW-9 remain BLOCKED.**

**Production Flight Event Provenance remains UNAPPLIED.**

**Live-Evidence wins always.**
