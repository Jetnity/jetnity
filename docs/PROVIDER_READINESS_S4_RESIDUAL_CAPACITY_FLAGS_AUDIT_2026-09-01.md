# Provider Readiness S4 – Residual Capacity / Activation-Flag Audit

Stand: 1. September 2026  
Status: **DOCS-ONLY AUDIT / AGENT B / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Logical agent: **`Jetnity provider readiness S4 residual capacity flags audit 1`**  
Generation: **1**  
Cursor session: `bc-38ebef81-cb58-4dbf-96ad-152dd9250125`  
Parent: Issue #365  
Draft-PR: #367  
Branch: `audit/provider-readiness-s4-residual-capacity-flags-2026-09-01`

Pre-agent head: `cc8336c1e49defc30391efd869c51fd3125de160`  
Live `origin/main` at reconstruction: `17ee633ea89567761297c8f07c023953ec98bbf2`  
Merge-base: identical to live `origin/main` (branch was 1 ahead: task commit only)  
Agent A (read-only neighbour): Draft-PR #366 `feat/provider-readiness-s4-r2-safety-server-trip-truth-2026-09-01`

No runtime, factory, shared provider-ops, DB, Active Work or Start Here writes.

Legend used below:

- **VERIFIED FACT** – observed in this checkout or live GitHub
- **INFERENCE** – conclusion from verified facts
- **UNKNOWN** – not established from this checkout
- **REQUIRES FUTURE PROVIDER CONTRACT** – cannot be closed without a later vendor/product decision

---

## 1. Verdict

| Residual | Current S4 blocker while factories are hard-`null`? | Classification |
| --- | --- | --- |
| Readiness HTTP body-cap `8192` | **No** | Sufficient for representative / currently intended payloads. Contradicts only the schema-maximum untrusted HTTP party. Prefer server-owned trip truth later; do not raise the cap. |
| Requirements activation flag | **No** | **Already closed** by S4-R1 (`JETNITY_READINESS_AKTIV` + `requirementsProviderNachZustand`). |
| Safety / Seasonal activation flags | **No** | **Activation-time mandatory contract.** Hard-`null` factories are already fail-closed. A future non-`null` factory must not ship without an S1 kill-switch + Production hard-off wrapper. |

**S4 after Agent A:** Agent A owns the remaining *current* S4 runtime residual (Safety HTTP `party: []`). After Agent A is independently reviewed and integrated, **this audit does not require one more bounded S4 implementation before S6** for body-cap or flags.

Technical Lead still decides final S4 closure on live main (Issue #365 exit criteria). This document is evidence, not closure.

---

## 2. Reconstruction

### 2.1 Transport

| Item | Value | Class |
| --- | --- | --- |
| Task baseline | `main@17ee633ea89567761297c8f07c023953ec98bbf2` | VERIFIED |
| Live `origin/main` this session | same SHA; subject `Make multi-agent suitability check binding (#364)` | VERIFIED `git fetch origin main` |
| Local branch `main` at boot | stale `71bfd70b` — **not** used as current truth | VERIFIED |
| Pre-agent branch head | `cc8336c1` task-only | VERIFIED |
| Ahead / behind vs live main | 1 / 0 | VERIFIED |
| `docs/ACTIVE_WORK_STATUS.md` on this branch | still names `main@8eb51c55` | VERIFIED stale vs live main; **not edited** (forbidden) |
| Workspace / `components/**` callers of `/api/readiness/requirements` | **none** | VERIFIED ripgrep |
| Agent A | Draft-PR #366 open; not reviewed in this PR | VERIFIED GitHub; Agent B did not read Agent A runtime files as authority |

### 2.2 Historical S4 vs live

Historical sources (`docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md` PR-S4, `docs/PROVIDER_S4_S8_PROVENANCE_AUDIT.md`, Gate-0 gap map) asked S4 to:

1. add Requirements timeout / `AbortSignal` / freshness
2. add `JETNITY_READINESS_AKTIV` and analogous Safety / Seasonal flags *when a factory is no longer only `null`*
3. load Safety party from server-owned trip truth
4. **measure** the 8 KB Readiness cap vs multi-traveller

S4-R1 closed (1) and the Readiness half of (2). Canonical closure: `docs/CHATGPT_TECHNICAL_LEAD_REQUIREMENTS_TRUTH_OPS_S4_R1_CLOSED_2026-08-31.md`.  
(3) is Agent A.  
(4) was explicitly **unmeasured** (`G-S4-BODY`, RPG0-P2-01). This audit measures it.

`docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_NEXT_SLICE_2026-09-01.md` already classified residual S4 as “largely pre-adapter” and named S6 as the next *serial* activation gate. That precheck is historical evidence, not a start order for this PR.

V1 Binding Build Order (`docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md` §1): remaining S4 gaps → S6 → S7 → S8. This audit answers whether the two named residuals are still current gaps.

---

## 3. Audit A – Readiness body-cap

### 3.1 Current contract (VERIFIED)

| Limit | Value | File |
| --- | --- | --- |
| `READINESS_GRENZEN.maxAnfrageBytes` | `8192` | `lib/readiness/domain.ts` |
| `TRAVELLER_CONTEXT_GRENZEN.travellersJeReise` | `20` | same |
| `citizenshipsJeTraveller` | `8` | same |
| `documentsJeTraveller` | `12` | same |
| `clientRef` | `64` | `READINESS_GRENZEN` |
| `destinationCountryCodes` / `transitCountryCodes` | max `12` each | `readinessAnforderungAnfrageSchema` |
| Document types | `passport` \| `national_id` \| `unknown` | `types/trips.ts` |

HTTP path (`app/api/readiness/requirements/route.ts` + `lib/readiness/anfrage.ts` + `lib/provider-ops/anfrage.ts`):

1. `Content-Length` > 8192 → 413 (if the header is a decimal integer)
2. stream read aborts when accumulated UTF-8 bytes > 8192 → 413
3. JSON parse
4. `readinessAnforderungAnfrageSchema` via `travellerAnfrageStriktLesen`

The cap is on **raw request bytes**, before schema.

Comparison (VERIFIED): Safety / Seasonal `maxAnfrageBytes = 24576`. Flight / Hotel / Activity / Mobility / Rental search caps are `16384`.

### 3.2 Two Evaluate paths (VERIFIED)

| Path | Party source | HTTP cap applies? |
| --- | --- | --- |
| `POST /api/readiness/requirements` | untrusted client `party[]` | **yes** |
| Trip-graph `requirementsAnfrageAusReise` (`lib/readiness/engine.ts`) | server trip / `travellerSlots` | **no** |
| Account `reiseLaden()` | RLS-owned trip including `trip_travellers` | **no** (not this HTTP route) |

No `components/**` or other `app/**` page calls `/api/readiness/requirements`. Historical TW audit (`TW-P2-08`) said the same; re-verified this session.

Guest-Evaluate over the public API remains a designed untrusted-party path (`G-API-PARTY` = NEEDS PRODUCT DECISION). That is unchanged.

### 3.3 Measurement method (VERIFIED)

Temporary local harness (not committed) imported the live schema and cap helpers via the repo test loader:

- `JSON.stringify` + `TextEncoder` byte length
- `readinessAnforderungAnfrageSchema.safeParse`
- `readinessContentLengthUeberschritten(String(bytes))`

Payloads use current-contract fields only (no passport numbers, MRZ, scans). Schema-maximum is **not** a product-recommended party size; it is the accepted numeric contract.

### 3.4 Measured sizes (VERIFIED)

| Shape | UTF-8 bytes | Schema | vs 8192 |
| --- | ---: | --- | --- |
| Current test payload (2 legacy travellers, 2 destinations) | 190 | valid | fits (−8002) |
| 1 traveller, compact canonical (1 citizenship + 1 passport) | 404 | valid | fits |
| 1 traveller, legacy singular fields | 375 | valid | fits |
| Family of 4, mixed dual-citizenship, compact | 1852 | valid | fits (−6340) |
| 1 traveller, 3 citizenships + 3 passports | 916 | valid | fits |
| 1 traveller, mixed document types **without** `citizenshipClientRef` | 914 | valid | fits |
| 1 traveller at schema-max (8 citizenships + 12 passports), short refs | 2112 | valid | fits |
| Same, 64-char refs + 40-char label | 3083 | valid | fits |
| Family of 4 as persisted `TripTraveller` (`id` / timestamps) | 3816 | valid | fits |
| 12 travellers, 1 citizenship + 1 passport each | 2699 | valid | fits |
| 20 travellers, 1 citizenship + 1 passport each | 4379 | valid | fits (−3813) |
| `travellers: 20` count-only, empty party | 123 | valid | fits |
| **4** travellers at schema-max compact | **7860** | valid | **fits (−332)** |
| 20 × 8 × 12 compact short refs + 12 dest + 12 transit | 38864 | valid | **413** (−30672) |
| 20 × 8 × 12 with max-length refs | 58042 | valid | **413** |
| 20 × 8 × 12 persisted `TripTraveller` dump | 89604 | valid | **413** |

Derived envelope (VERIFIED arithmetic on the compact max-shape): one fully loaded traveller including shared envelope ≈ 2112 B; each additional ≈ 1916 B. A **fifth** fully loaded traveller would be ≈ 9776 B and would 413.

### 3.5 Parser residual discovered while measuring (VERIFIED)

`travellerAnfrageStriktLesen` compares `citizenshipClientRef` by **input index** after `travellerLegacyLesen` **sorts** documents. A legitimate mixed-type set (`passport` + `national_id`) with citizenship links therefore returns `null` → HTTP 400, even at ~900 B.

- 2 same-type passports + citizenship links: **accepted**
- mixed types **without** citizenship links: **accepted**
- mixed types **with** citizenship links: **rejected**

This is not the body-cap. It is a current-contract parser defect. Out of implementation scope here.

### 3.6 Classification

| Question | Answer | Class |
| --- | --- | --- |
| Does 8192 block representative family / dual-citizen / 20-simple-traveller requests the schema accepts? | **No** | VERIFIED |
| Does 8192 block one fully loaded legal-option traveller (8×12)? | **No** (2112–3083 B) | VERIFIED |
| Does 8192 contradict the numeric schema maximum if posted as untrusted HTTP party? | **Yes** from 5 fully loaded travellers, and for 20×8×12 | VERIFIED |
| Is the schema maximum a product-recommended user count? | **No** | VERIFIED task + Traveller Context policy (progressive disclosure) |
| Is the cap too large / a privacy risk? | **No relative finding.** 8 KB is the tightest truth-domain cap. It already forbids credential numbers / MRZ / scans. | INFERENCE |
| Does any UI currently hit this cap? | **No caller** | VERIFIED |
| Does the trip-owned Evaluate path hit this cap? | **No** | VERIFIED |
| Should the cap be raised? | **No** | INFERENCE; prefer `G-API-PARTY` server-owned trip truth if a later Guest-Evaluate needs >4 fully loaded travellers |
| Future vendor payload size | **unknown** | REQUIRES FUTURE PROVIDER CONTRACT — outbound vendor mapping is not this HTTP cap |

**Audit-A result:** cap is **sufficient** for currently valid *intended* payloads and **safely bounds** untrusted HTTP size. It is **not** a current S4 / V1 blocker. The schema-max contradiction is a documented residual, not a reason to enlarge the untrusted body.

---

## 4. Audit B – Activation flags

### 4.1 Factories (VERIFIED)

| Domain | Factory | Returns | Kill-switch wrapper |
| --- | --- | --- | --- |
| Requirements | `requirementsProviderAus()` `lib/readiness/provider.ts` | hard `null` | **yes** — `JETNITY_READINESS_AKTIV` via `readinessZustand` / `requirementsProviderNachZustand`; route wires `requirementsProviderNachZustand(requirementsProviderAus())`; Production hard-off in `providerOpsZustand` |
| Safety | `safetyProviderAus()` `lib/safety/provider.ts` | hard `null` | **no** domain flag, no `zustand.ts`. Engine + API default-inject the factory. |
| Seasonal | `seasonalProviderAus()` `lib/seasonal/provider.ts` | hard `null` | **no** domain flag, no `zustand.ts`. Same injection pattern. |
| Flights (contrast) | `duffelProviderAus()` | adapter only if zustand aktiv + test token | factory itself consults `flugZustand` |
| Hotels (contrast) | `hotelProviderAus()` | hard `null` | `JETNITY_HOTEL_AKTIV` at search ports, not inside the null factory |

`.env.example` documents `JETNITY_READINESS_AKTIV=false`. No `JETNITY_SAFETY_AKTIV` / `JETNITY_SEASONAL_AKTIV` symbols exist in `lib/**` or `.env.example`.

Admin Provider-Ops board (`lib/admin/provider-ops-board/runtime.ts`):

- Readiness: `readinessZustand()`
- Safety / Seasonal: `providerOpsZustand({ vercelEnv, zugangVorhanden: false })` — **no flag**. Result is `abgeschaltet` or `production`, never `aktiv`.

### 4.2 What a hard-null factory already does (VERIFIED)

Safety engine: `if (!provider) return safetyAusFacts(...)` — no outbound call.  
Seasonal: same.  
Requirements: factory `null` **and** zustand strips a non-null test double when the flag is off or `VERCEL_ENV === 'production'`.

Safety / Seasonal engines do **not** consult `VERCEL_ENV`. **INFERENCE:** a future factory that simply `return adapter` would run in Production on the next request. That is the silent-bypass risk.

Safety / Seasonal already have 4 s timeout + `AbortSignal` (historical S4 timeout item; not missing). Seasonal is traveller-neutral; `party: []` there is **not** a P1 (`docs/PROVIDER_READINESS_AUDIT.md` §12).

### 4.3 Historical classification vs S4-R1 practice

| Source | Statement | Class |
| --- | --- | --- |
| PR-S4 slice text | Flags “solange Factory nicht mehr nur `null` ist” | HISTORICAL |
| Gap map `G-S4-KILLSWITCH` | P1 **erst wenn Factory ≠ null**; factory `null` is today’s brake | HISTORICAL / still accurate for Safety/Seasonal |
| S4-R1 | Implemented Readiness flag **while** factory stayed `null` | VERIFIED live |
| This task’s required truth | hard-null is fail-closed; a flag that cannot activate anything may not improve current safety; future activation must not skip the kill-switch | BINDING for this audit |

**INFERENCE:** missing Safety / Seasonal flags are **not** a current S4 blocker. They are an **activation-time mandatory contract**. Implementing empty flags now would not change Production/Preview behaviour while factories remain `return null`.

### 4.4 Smallest contract location (recommendation only)

Do **not** invent a new `lib/provider-ops` shared contract.

Smallest reuse of what already exists:

1. Copy the Readiness pattern: `lib/safety/zustand.ts` / `lib/seasonal/zustand.ts` using `providerOpsZustand` + `JETNITY_SAFETY_AKTIV` / `JETNITY_SEASONAL_AKTIV`.
2. Gate **every** call site that can receive a provider object:
   - factory return (Duffel pattern) **or** `*ProviderNachZustand` at engine default + API `auswerten` (Readiness route pattern);
   - Admin board `domainZustaende()` instead of hardcoded `zugangVorhanden: false`.
3. Production remains hart aus. Factory stays `null` until a separately gated adapter.

Mechanical prevention if TL wants a lock before any factory edit: a versioned activation-gate sentence (this recommendation + later adapter task) that forbids a non-null Safety/Seasonal factory without those wrappers. Optional later test: source of `safetyProviderAus` / `seasonalProviderAus` remains `return null` until the wrappers exist.

**Do not implement in this PR.**

Requirements flag: **already sufficient**. Do not add a second Requirements flag.

---

## 5. Cross-check – can S4 close after Agent A?

| Residual | Owner | After Agent A | Before S6? |
| --- | --- | --- | --- |
| Safety HTTP `party: []` / server-owned trip truth | Agent A #366 | expected close if TL-PASS + integrate | that **is** the remaining current S4 runtime |
| Readiness 8 KB cap | this audit | document only | **no implementation** |
| Requirements flag | S4-R1 on main | already closed | none |
| Safety / Seasonal flags | this audit | activation-time contract persisted | **no implementation** required to start S6 |
| S6 Persistent Cost Guard | later versioned task | still missing | next **serial** activation gate after S4 closure |
| S7 / S8 | later | missing | after S6 |
| Real Requirements / Safety / Seasonal vendor | PO gates | factories stay `null` | REQUIRES FUTURE PROVIDER CONTRACT |

**INFERENCE:** S4 can close after Agent A + persistence of this audit, without a further body-cap or flag implementation. A silent residual must not be carried into S6: the activation-flag contract and the schema-max HTTP contradiction stay written down.

**UNKNOWN:** whether Agent A’s exact head will PASS. This agent does not review #366.

---

## 6. Traveller Context Intelligence

Relevant for Audit A (Readiness party). Not relevant for Seasonal (traveller-neutral). Safety traveller-dependence is Agent A.

This audit does **not** recommend collapsing to one citizenship/document, inventing visa rules, or treating `documents[0]` as truth. The cap question is size vs the multi-option contract, not a reason to shrink legal options.

---

## 7. Hard non-scope held

No runtime/test implementation. No cap change. No flags. No adapter. No S6. No Production mutation. No secrets/keys/paid/live calls. No TW-8/TW-9. No Ready. No merge.
