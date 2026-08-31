# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 1. September 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / PROVIDER ACTIVATION READINESS PRECHECK ACTIVE / AUDIT-ONLY / NO PROVIDER ACTIVATION / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen.

## 1. Zuerst lesen

1. `docs/ACTIVE_WORK_STATUS.md` ← **aktueller aktiver Workstream**
2. `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_TASK_2026-09-01.md` ← **binding current task**
3. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3C_CLOSED_2026-08-31.md`
4. `docs/TRIP_WORKSPACE_TW8_TW9_READINESS_REVALIDATION_STATUS_2026-08-31.md`
5. `docs/JETNITY_BINDING_BUILD_ORDER.md`
6. `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md`
7. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
8. `JETNITY_HANDOFF.md`
9. relevant latest Entry Requirements / Account / Traveller / Provider handoffs and reviews named by those files.

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Migration-/Persistenzfragen zusätzlich Supabase Production read-only prüfen.

## 2. Current verified main baseline

`main@ebd08ec07134f1ad4d3f6d68a694be4ff189fa5b`

Commit:

`Close Entry Requirements E5-B3C continuity (#350)`

Exact-main evidence:

- Main CI #1552 / Run `33443161594`: **SUCCESS**;
- Vercel Production: **READY** on exact main;
- E5-B3C: **CLOSED & POST-MERGE VERIFIED**;
- Production Flight Event Provenance remains **UNAPPLIED**.

## 3. Active slice

Issue:

**#351 – Provider Activation Readiness Precheck – select first real provider path**

Branch:

`audit/provider-activation-readiness-precheck-2026-09-01`

Task:

`docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_TASK_2026-09-01.md`

Logical Cursor agent:

**`Jetnity provider activation readiness precheck 1`**, Generation 1

Cursor session: **not yet established at this TL setup checkpoint**.

## 4. Objective

The active work is a provider-selection/readiness **audit only**.

It must determine the safest, highest-value first real provider path for Jetnity using:

- current repository reuse boundaries;
- current official/public provider evidence;
- Commercial Provenance / freshness / server-side verification requirements;
- costs and cost controls;
- licensing/cache/attribution restrictions;
- privacy/DPA implications;
- operational reliability, observability and kill switches;
- effect on TW-8/TW-9 and Entry Requirements.

It must then define exactly one smallest follow-up proof slice, but must **not** start that implementation.

## 5. Current programme truth

TW-8 and TW-9 remain blocked because Jetnity has no real provider-backed Commercial Truth yet. Persisted foundations alone do not unlock them.

The current provider precheck must not assume Duffel or any other vendor wins merely because adapter-shaped code exists.

## 6. Production / Product-Owner boundary

No approval in this active task for:

- provider registration/contract acceptance;
- secrets/API keys;
- live or paid provider calls;
- Production provider activation;
- Supabase Production writes or schema/security mutations;
- runtime/login principal allocation;
- real application writer/backfill;
- TW-8/TW-9 runtime;
- public/irreversible external activation.

All remain Product-Owner gates.

## 7. Governance

Cursor must not edit:

- `docs/ACTIVE_WORK_STATUS.md`;
- `JETNITY_START_HERE.md`.

Cursor must never mark Ready or merge. Agent self-review is not Technical-Lead PASS.

After delivery, Technical Lead independently reviews the exact head. Any changed head requires full re-gating.

## 8. Stop rule

No automatic follow-up slice.

The audit stops for Technical-Lead review and then, if a real provider activation gate is next, for explicit Product-Owner approval.

**Live-Evidence wins always.**
