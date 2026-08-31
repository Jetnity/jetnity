# Provider Activation Readiness Precheck – Next Slice

Stand: 1. September 2026  
Status: **SPECIFICATION ONLY / DO NOT START IN THIS TASK / BINDING BUILD ORDER RESTORED**  
Agent: **`Jetnity provider activation readiness precheck 1`**  
Generation: **1**  
Review-fix for TL #5072115941

This document does **not** authorise implementation of any slice.

It separates three things that the rejected head collapsed:

1. **Immediate next implementation under the current Product-Owner Binding Build Order**
2. **Later real Commercial Truth snapshot** (the original task’s “real provider-backed snapshot” gate)
3. **Optional integration-pipeline sandbox harness** (not Commercial Truth; not `live_api`; not inferred as next)

---

## 0. Hard separations

| Proof class | What it may prove | May mint S5-A `live_api`? | Satisfies “real commercial snapshot” gate? |
| --- | --- | --- | --- |
| Provider Readiness S4 residual / S6 / S7 / S8 | Jetnity-side ops before any vendor | no | no |
| Sandbox / test-mode vendor call (Duffel test, Hotelbeds eval) | Transport, mapping, timeout, tamper, expiry *mechanics* | **no** | **no** |
| Real Commercial Truth snapshot | One server-side quote from **real/live** vendor prices | only from a real live/provider response, after S5-A validation | **yes**, still not TW-8 |

Duffel Help Centre (VERIFIED): sandbox/test-mode prices “are not real, live prices.”  
Duffel test-mode docs (VERIFIED): Duffel Airways schedules and prices are not realistic.  
S5-A `live_api` is a provider-truth source eligible for a `current` commercial evaluation. A synthetic sandbox quote must not enter that class. Do not add a silent new sourceKind in this audit.

---

## 1. Immediate next implementation — Binding Build Order

`docs/JETNITY_BINDING_BUILD_ORDER.md` §4 remains Product-Owner binding:

> Provider Readiness **S4–S8**, **danach** echte Provider.

That sequence is **not** superseded by the TW-8 audit, by this precheck, or by the existence of a Duffel adapter.

Live reconstruction of remaining slices (this checkout / `main@ebd08ec`):

| Slice | State | Role |
| --- | --- | --- |
| S1–S3 | contracts on main | done as readiness ports |
| S4 | **partial** — S4-R1 Requirements timeout/kill-switch/freshness merged; residual: Safety party still `[]`, domain flags incomplete until a non-null factory | residual truth-ops |
| S5-A / S5-B schema | on main; write path **false**; 0 rows | persist foundation, not provider truth |
| **S6 Persistent Cost Guard** | **missing** | serial **provider-activation gate** (`S4S8-ACT-GATE-01`) |
| S7 Observability write | event type only | after S6 in the serial ops path |
| S8 License/cache hooks | `no-store` default only | may be planned in parallel with residual S4; not a provider |

**Immediate next implementation under the current binding order:** a new versioned **Provider Readiness S6 – Persistent Cost Guard** task (not this PR, not this agent).

Reasons:

- Original slice order places S6 as the next **serial** slice after S5.
- S6 is the documented activation gate before a paid/live provider.
- Residual S4 items remain open and must be tracked, but they are largely pre-adapter residuals and do not replace S6.
- S7 follows S6. S8 remains a hook slice, not a vendor activation.

This precheck **does not start S6**. S6 still needs its own versioned task, tests, and PO gates for any DB/cost-model work.

**Not the immediate next implementation:** Duffel sandbox harness, Hotelbeds adapter, Skyscanner transport, Viator, TW-8, write-path allocation.

A sandbox harness **before** S4/S6/S7/S8 would be an explicit **new Product-Owner sequencing exception** (`PO-SEQ-01` in the gate matrix). This audit **does not infer** that exception.

---

## 2. Later real Commercial Truth snapshot (C1) — after S4/S6/S7/S8

**Name (later, do not open):** Provider Real Commercial Snapshot C1  
**Domain recommendation:** Flights  
**Vendor:** a **live/real-price** flight source (Duffel *live* or Skyscanner Live Prices), chosen only after partner/ToS/DPA/cost gates — **not** Duffel test mode.

### 2.1 Why this is the real-snapshot gate

The original task asked for one server-side provider-backed commercial snapshot. That gate requires **real market prices**, not sandbox theatre.

C1 may run only after:

- residual S4 items closed or explicitly deferred by a new versioned S4 task;
- **S6** persistent cost guard in place (or Preview still in-memory **only** if no paid key exists — Production/live still blocked);
- S7 emit of secret-safe search outcomes (minimum contract, not a new SaaS);
- S8 persist/cache defaults remain `forbidden` / `no-store` until a reviewed vendor licence;
- Product-Owner gates for the chosen **live** vendor (signup, contract/DPA, secrets, paid/live calls).

C1 success = one S5-A-validated snapshot whose `sourceKind` is honestly `live_api` or `provider_snapshot` from a **real** vendor response.  
C1 success ≠ TW-8, ≠ write-path allocation unless separately approved, ≠ public “flights are live”.

### 2.2 One-invocation / store rule

- **Zero-persistence C1 proof:** search → unique option select → revalidate → S5-A mint **inside one server-side invocation / test harness**. No cross-request “session”.
- **Cross-request Nachweis/adopt:** requires a **durable server-side store** (TTL, trip/owner binding, tamper resistance, no-store/privacy, cost). Process-local/Vercel instance memory is **not** that store. A new store is its own gated architecture slice — not implied by C1.

### 2.3 Explicit C1 non-scope

- Duffel test-mode / Duffel Airways as `live_api`
- Process memory as a search session
- S5-B Production write / TW-8 / TW-9
- Starting C1 from this PR

---

## 3. Optional integration-pipeline sandbox harness (HARNESS-S) — not Commercial Truth

**May be specified later. Must not be treated as C1. Must not start here.**

Purpose: prove Duffel HTTP mapping, timeout, 429, tamper, `expires_at` *mechanics* against official test mode.

### 3.1 Sequencing

Under the current binding order, HARNESS-S is **after** S4/S6/S7/S8, or **only earlier** if Product Owner explicitly approves `PO-SEQ-01`. This audit does **not** grant `PO-SEQ-01`.

### 3.2 Trust / mint ban

| Allowed | Forbidden |
| --- | --- |
| One server-side invocation: Offer Request → pick one option → optional GET offer → assert mechanics | S5-A mint with `sourceKind: 'live_api'` |
| Test assertions on mapped `FlugOption` / Nachweis fail-closed taxonomy | Calling `commercialSnapshotFuerPersistenzMinten` as product truth |
| Recording outcome as **sandbox/test evidence** in tests | Workspace price, persist, or `current` commercial evaluation |
| `duffel_test_*` + Production hard-off | Live token, paid calls |

If a future ADR introduces a provider-neutral **sandbox/test** evidence class, that is a **new** S5-A change and a separate PO/architecture decision. Until then: **no mint**.

### 3.3 No process-local session

Search and Nachweis must stay in **one invocation**.  
Do not specify `Map`/module memory, “process lifetime”, or Vercel instance reuse as a cross-request store.

### 3.4 Non-scope

Same as C1, plus: does not satisfy the real-snapshot gate even if green.

---

## 4. Suggested later task headers (do not open)

| Later task | When |
| --- | --- |
| Provider Readiness S6 Persistent Cost Guard | Immediate next *if* TL opens a new versioned S6 task on then-current main |
| Residual S4 truth-ops (Safety party / flags) | Own versioned task; do not mix into S6 |
| HARNESS-S | Only after S4–S8 **or** after explicit `PO-SEQ-01` |
| C1 real commercial snapshot | After S4–S8 + live-vendor PO gates |

Baseline for any of those: then-current `main`, not this audit head.  
Logical agent: new generation. This session must not start them.
