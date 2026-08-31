# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 1. September 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / PROVIDER ACTIVATION READINESS PRECHECK TECHNICAL-LEAD PASS / NO ACTIVE FOLLOW-UP IMPLEMENTATION / NO PROVIDER ACTIVATION / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven. Sandbox does not mean live truth.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen.

## 1. Zuerst lesen

1. `docs/ACTIVE_WORK_STATUS.md` ← **aktueller Status**
2. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_ACTIVATION_READINESS_PRECHECK_REVIEW_2026-09-01.md` ← **aktueller unabhängiger TL-Review**
3. `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_HANDOFF_2026-09-01.md`
4. `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_STATUS_2026-09-01.md`
5. `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_RECOMMENDATION_2026-09-01.md`
6. `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_NEXT_SLICE_2026-09-01.md`
7. `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_GATE_MATRIX_2026-09-01.md`
8. `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_CANDIDATE_MATRIX_2026-09-01.md`
9. `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_EVIDENCE_2026-09-01.md`
10. `docs/JETNITY_BINDING_BUILD_ORDER.md`
11. `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md`
12. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3C_CLOSED_2026-08-31.md`
13. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
14. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Migration-/Persistenzfragen zusätzlich Supabase Production read-only prüfen.

## 2. Current verified main baseline

Before integration of Provider Activation Readiness Precheck PR #354:

`main@ebd08ec07134f1ad4d3f6d68a694be4ff189fa5b`

Commit:

`Close Entry Requirements E5-B3C continuity (#350)`

This SHA may advance after PR #354 merges. Always read live `main`.

## 3. Provider Activation Readiness Precheck

Issue:

**#351**

PR:

**#354**

Logical Cursor agent:

**`Jetnity provider activation readiness precheck 1`**, Generation 1

Cursor session:

`bc-d1b4e6bb-c952-4242-ba57-384783bc23ea`

Initial agent head:

`43bb98762ed00bc0293e5b4df5566a4e25c3d865` → **CHANGES REQUIRED**.

Same-session review-fix head:

`997fca395cef8fe44a4198a1b313e28364d83723` → **independent Technical-Lead PASS**.

Reviewed-head gates:

- CI #1555 / Run `33448121389`: **SUCCESS**;
- Vercel Preview `dpl_FBvQiu1DnfhQWhp3Tv1u7T9CAigc`: **READY**;
- GitHub inline review threads: **0**;
- Vercel unresolved toolbar threads: **0**;
- fresh Supabase Production SELECT: commercial rows **0**, `production_write_path_allocated=false`, Flight Event Provenance remains absent.

The Technical-Lead review/current-state docs create a newer docs-only descendant. It must be re-gated before merge.

## 4. Canonical conclusions

### Sandbox truth

Duffel test/sandbox prices are **not** real Commercial Truth and must not mint S5-A `live_api`.

A future sandbox harness may test transport/mapping/expiry mechanics only. It cannot satisfy the real commercial snapshot gate and cannot unlock TW-8.

### Binding Provider Readiness order

The Product-Owner binding order remains:

**Provider Readiness S4–S8 → then real providers.**

No sequencing exception has been inferred or granted.

The serial Provider Readiness path identifies **S6 Persistent Cost Guard** as the next implementation candidate after S5. Residual S4 still remains open; S7 and S8 remain open; all must be closed before real-provider activation.

### First later real Commercial Truth path

Preferred domain: **Flights**.

The live vendor is still undecided. Duffel live, Skyscanner or another qualified real-price source requires separate partner/commercial/licensing/DPA/cost/security decisions.

### Server state

Process-local/Vercel memory is not a valid cross-request Nachweis store. Any zero-persistence proof must stay inside one server-side invocation. A cross-request design needs a durable server-side store in a separate gated architecture slice.

### Viator

Viator Basic supports real-time schedule retrieval for a selected product but not booking-grade `/availability/check`. Activities remain a later candidate rather than the first Commercial Truth path.

## 5. Production / Product-Owner boundary

This precheck does **not** authorize:

- provider signup/contract/DPA;
- API keys or secrets;
- paid/live provider calls;
- Production provider activation;
- Supabase Production mutation;
- runtime writer/principal allocation;
- application writer/backfill;
- TW-8/TW-9 runtime;
- public live-provider claims.

## 6. Current programme state

**NO ACTIVE FOLLOW-UP IMPLEMENTATION SLICE.**

S6 is the next identified candidate, not an active task. Do not automatically dispatch an agent from this checkpoint.

After PR #354 integration, reconstruct live main/PRs/issues/CI/Vercel/Production truth again before starting any new slice.

**TW-8 and TW-9 remain BLOCKED.**

**Production Flight Event Provenance remains UNAPPLIED.**

**Live-Evidence wins always.**
