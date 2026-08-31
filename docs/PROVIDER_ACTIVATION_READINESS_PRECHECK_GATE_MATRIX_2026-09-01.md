# Provider Activation Readiness Precheck – Gate Matrix

Stand: 1. September 2026  
Status: **AUDIT GATE MATRIX / BINDING BUILD ORDER RESTORED / NO GATE CROSSED**  
Agent: **`Jetnity provider activation readiness precheck 1`**  
Generation: **1**  
Review-fix for TL #5072115941

This audit crossed **no** Product-Owner gate.

---

## 1. Already satisfied (do not re-litigate as if missing)

| Gate | State | Evidence |
| --- | --- | --- |
| S5-A domain contract | on main — **must not be weakened** | `lib/commercial-provenance/*`; `live_api` ∈ provider-truth sources |
| S5-B persistence DDL / RLS / SQL writer | on main + Production | live SELECT: table exists |
| S5-B Production apply `S5B-G0-PO-MIG-01` | applied historically | apply verification 29 Aug + live table |
| Adapter Core transport | on main | `lib/server/providers/core/*` |
| Flight search Production hard-off | enforced | `providerOpsIstProduction` |
| Duffel live-token rejection | enforced | `istDuffelTestToken()` |
| TW-8 / TW-9 closed | blocked | revalidation + 0 commercial rows |

Satisfied foundation ≠ permission to activate a provider or to skip S4/S6/S7/S8.

---

## 2. Binding Build Order (Product-Owner, not inferred away)

| ID | Rule | This audit |
| --- | --- | --- |
| **PO-SEQ-00** | `JETNITY_BINDING_BUILD_ORDER.md` §4: **S4–S8, then real providers**. Change requires an **explicit new Product-Owner decision**. | Binding. TW-8 audit and this precheck do **not** supersede it. |
| **PO-SEQ-01** | Optional exception: allow a **sandbox integration harness** (not `live_api` mint) *before* remaining S4/S6/S7/S8 | **Not inferred. Not requested. Not granted.** |

Immediate next implementation under **PO-SEQ-00**: **S6 Persistent Cost Guard** (new later task). Residual S4 remains open.

A Duffel sandbox harness is **not** the immediate next implementation under the current order.

---

## 3. Product-Owner gates that remain closed

| ID | Gate | This audit | S6 (later) | HARNESS-S (sandbox, not truth) | C1 real snapshot | Any Production/live |
| --- | --- | --- | --- | --- | --- | --- |
| PO-SEQ-00 | Finish S4/S6/S7/S8 before real providers | binding | **is** the next slice | allowed only after S4–S8 **or** PO-SEQ-01 | **required first** | required |
| PO-SEQ-01 | Sequence exception for sandbox-before-S6 | **not granted** | n/a | required if started early | n/a | n/a |
| PO-PROV-01 | Vendor signup | not done | no | required if no test token | required (live vendor) | required |
| PO-PROV-02 | Contract / ToS / DPA | not done | no | test-mode ToS ack only | live contract + DPA | required |
| PO-SEC-01 | Create/store secret | not done | no | Preview `duffel_test_*` only | live secret | required |
| PO-PAY-01 | Paid or live vendor call | not done | no | **forbidden** (test only) | **required** (real prices) | required |
| PO-ACT-01 | Production provider flag | not done | no | **forbidden** | **forbidden** until separate PO | required |
| PO-DB-01 | Production mutation | SELECT only | **possible** (S6 schema is a PO/DB gate) | **forbidden** | **forbidden** unless persist separately approved | if persist/write-path |
| PO-WR-01/02/03 | Write path / principal / app writer | false / 0 rows | no | **forbidden** | **forbidden** unless separate PO | required for persist |
| PO-TW-01/02 | TW-8 / TW-9 | blocked | no | **forbidden** | **forbidden** | after real snapshots + read join |
| PO-S5A-01 | New S5-A sandbox sourceKind | not proposed as runtime | no | **must not mint `live_api`**; new kind = separate ADR | real `live_api` only from live data | — |
| PO-ER-01 | Requirements vendor | factory `null` | out of scope | out of scope | out of scope | separate |
| PO-ID-01 / PO-PII-01 | Auth rewrite / passport store | not done | **forbidden** | **forbidden** | **forbidden** | only if separately approved |
| PO-COST-01 | Spend / new recurring cost | not done | cost-model gate for S6 | test should be $0 | live economics | required |
| PO-PUB-01 | Public “provider live” | not done | **forbidden** | **forbidden** | **forbidden** | after truth-ready launch |

---

## 4. Technical gates (bind Cursor)

| ID | Rule |
| --- | --- |
| TL-01 | Cursor never Ready/merges |
| TL-02 | Exact-head review; this is a review-fix head |
| TL-03 | No automatic S6 / HARNESS-S / C1 |
| TL-04 | Live Evidence wins for S5-B location; **does not** rewrite PO sequence |
| TL-05 | Client prices are not Commercial Truth |
| TL-06 | Fixtures and **sandbox/test prices** cannot become `live_api` |
| TL-07 | E5 event mint ≠ commercial snapshot |
| TL-08 | Process-local/Vercel memory is not a cross-request Nachweis store |

---

## 5. Licensing / privacy / commercial gates by vendor

| Vendor | Public constraint | Before persist | Before Production |
| --- | --- | --- | --- |
| Duffel **test** | Prices are **not real/live** (Help Centre VERIFIED). Airways not realistic (docs VERIFIED). | Must not persist as current or `live_api` | n/a — test is not Production truth |
| Duffel **live** | Per-order + excess search (VERIFIED). Offer expiry short. Persist-as-current **VENDOR-CONFIRMATION-REQUIRED** | Legal snapshot question | DPA, live token, excess-search budget |
| Skyscanner | No cache/resell/repackage/redistribute (VERIFIED) | Persist likely blocked | Partner + attribution |
| Booking.com | No sandbox without Managed Affiliate (VERIFIED) | Contract first | Contract + attribution |
| Hotelbeds | Eval 50/day (VERIFIED). Eval≠automatic live truth | Eval ToS | Certification + commercial + mTLS for booking |
| Viator | Basic: `/availability/schedules/{product-code}` yes; `/availability/check` no (VERIFIED technical guide) | Schedule ≠ booking-grade | Full Access + cert for booking-grade |
| 12Go | API not public | Cannot design persist | Vendor disclosure first |
| Amadeus | Self-Service closed 17 Jul 2026 | Enterprise | Enterprise |

---

## 6. Residual Jetnity-side gaps — **blockers for real-provider / C1**, not “silent F1 skip”

| Gap | Slice | Role under PO-SEQ-00 |
| --- | --- | --- |
| Residual S4 (Safety party / flags) | S4 | Open residual; own later task |
| Persistent global cost guard | **S6** | **Immediate next serial implementation** |
| Search observability persist | S7 | After S6 |
| License/cache policy hooks | S8 | Parallel-capable; still required before treating persist as licensed |
| Workspace provenance join | TW-8 | After real snapshots; still closed |

These are **not** declared non-blockers for a real provider path.  
A sandbox harness does not close them and does not satisfy C1.

---

## 7. What this audit may not request

- Duffel/Hotelbeds/any signup or secret  
- `live_api` mint from sandbox  
- Process-memory session architecture  
- Starting S6, HARNESS-S, C1, or TW-8  
- Inferring `PO-SEQ-01`
