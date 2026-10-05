# Provider Readiness S4 – Residual Capacity / Flags Handoff

Stand: 1. September 2026
Status: **REVIEW-FIX FOR TL `5072890265` / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW / KEIN READY / KEIN MERGE / KEIN PARSER-IMPLEMENTIERUNG**
Logical agent: **`Jetnity provider readiness S4 residual capacity flags audit 1`**
Generation: **1**
Cursor session: `bc-38ebef81-cb58-4dbf-96ad-152dd9250125`
Parent: Issue #365
Draft-PR: https://github.com/Jetnity/jetnity/pull/367
Neighbour Agent A: https://github.com/Jetnity/jetnity/pull/366
Rejected head: `b0fb4b28ec14dd8f3d863bb0c8c81794202a5545`

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR.

---

## Zuerst lesen

1. `docs/PROVIDER_READINESS_S4_RESIDUAL_CAPACITY_FLAGS_AUDIT_TASK_2026-09-01.md`
2. `docs/PROVIDER_READINESS_S4_RESIDUAL_CAPACITY_FLAGS_AUDIT_2026-09-01.md`
3. `docs/PROVIDER_READINESS_S4_RESIDUAL_CAPACITY_FLAGS_RECOMMENDATION_2026-09-01.md`
4. `docs/PROVIDER_READINESS_S4_RESIDUAL_CAPACITY_FLAGS_SELF_REVIEW_2026-09-01.md`
5. Issue #365 Multi-Agent ownership (Agent B = this PR)

Do **not** treat `docs/ACTIVE_WORK_STATUS.md` as this audit’s live main. Current main for this sync is `e8549e8287382abf2dc1ea77f9722eeaa04218dd`. Do not edit Active Work or Start Here.

---

## What a new chat must know

This is **Agent B / docs-only**. Agent A S4-R2 is on `main` via recovery PR #368. Do not touch Agent A / Safety runtime files.

Measured this session against live helpers:

- 8192-byte cap **fits** representative families, 20 simple travellers, and **4** fully loaded (8×12) travellers (7860 B).
- The same cap **413s** a schema-valid 20×8×12 compact party (38864 B).
- No product UI posts `/api/readiness/requirements`. Trip-owned Evaluate has no HTTP cap.
- `JETNITY_READINESS_AKTIV` already exists. Safety/Seasonal factories are hard-`null` with **no** domain flag; engines would honour a future non-null factory even in Production.

**Recommendation (review-fix `5072890265`):** do not implement cap or flags now. Those conclusions stand.

**S4 must not close immediately after Agent A.** The order-sensitive Multi-Document parser (`travellerAnfrageStriktLesen` positional `citizenshipClientRef` check after sort) is a Phase-1 blocking truth-contract defect. It needs its own smallest bounded runtime slice **before S4 final closure and before S6**. This PR only specifies the acceptance contract. Do not implement the parser here.

---

## Files

| File | Role |
| --- | --- |
| `docs/PROVIDER_READINESS_S4_RESIDUAL_CAPACITY_FLAGS_AUDIT_TASK_2026-09-01.md` | binding task (pre-existing; pointer added) |
| `docs/PROVIDER_READINESS_S4_RESIDUAL_CAPACITY_FLAGS_AUDIT_2026-09-01.md` | evidence |
| `docs/PROVIDER_READINESS_S4_RESIDUAL_CAPACITY_FLAGS_RECOMMENDATION_2026-09-01.md` | recommend only |
| `docs/PROVIDER_READINESS_S4_RESIDUAL_CAPACITY_FLAGS_SELF_REVIEW_2026-09-01.md` | this agent, not TL-PASS |
| this handoff | continuity |

Unique commits vs current main touch only the five Agent B `docs/PROVIDER_READINESS_S4_RESIDUAL_CAPACITY_FLAGS_*` files. The merge brought Agent A main files along; this agent did not edit them.

---

## Transport at handoff write

| Item | Value |
| --- | --- |
| Original task baseline | `17ee633ea89567761297c8f07c023953ec98bbf2` |
| Current live main | `e8549e8287382abf2dc1ea77f9722eeaa04218dd` |
| Review-fix before sync | `1adf54f48288c11aa7a1e3012ff7ff1aef5ed672` |
| Final head | **read live on PR #367** |
| Behind main | **0** after sync |
| Draft | stays Draft |

---

## Residuals left for Technical Lead

- Exact-head **re-review** of this docs review-fix
- Agent A S4-R2 is on current main via #368; do not re-open it from this PR
- **Required later (not this PR):** bounded Multi-Document parser runtime slice — order-independent identity/ref comparison; keep malformed/sensitive/duplicate/ref rejection; tests for mixed-document order permutations and citizenship links; no default/primary passport or citizenship. Blocks S4 final closure and S6.
- Live-main S4 closure decision (Issue #365) only after the parser slice; Agent A is already on current main
- Later, not S4-close blockers: Guest-Evaluate architecture (`G-API-PARTY`); Safety/Seasonal zustand at first non-null factory

---

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-**Re-Review** von Draft-PR #367.

Nicht Ready. Nicht mergen. Keine Parser-Implementierung. Kein Folgeslice aus dieser Session. Kein S6-Start. S4 nicht nach Agent A allein schließen.
