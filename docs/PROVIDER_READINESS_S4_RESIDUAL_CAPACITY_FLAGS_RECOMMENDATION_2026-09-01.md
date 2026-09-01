# Provider Readiness S4 – Residual Capacity / Flags Recommendation

Stand: 1. September 2026
Status: **RECOMMENDATION ONLY / REVIEW-FIX FOR TL `5072890265` / DO NOT IMPLEMENT FROM THIS PR**
Logical agent: **`Jetnity provider readiness S4 residual capacity flags audit 1`**
Generation: **1**
Evidence: `docs/PROVIDER_READINESS_S4_RESIDUAL_CAPACITY_FLAGS_AUDIT_2026-09-01.md`
Rejected head: `b0fb4b28ec14dd8f3d863bb0c8c81794202a5545`

---

## 1. Decision asked of Technical Lead

After independent exact-head **re-review** of this Draft-PR on current main `e8549e82`, plus the later parser slice (Agent A S4-R2 is already on that main via #368):

1. Treat the 8 KB Readiness HTTP cap as **sufficient for intended payloads**. Do not raise it in S4. Unchanged.
2. Treat Safety / Seasonal activation flags as an **activation-time mandatory contract**, not a current S4 implementation. Unchanged.
3. **Do not** declare S4 closed immediately after Agent A. The order-sensitive Multi-Document parser is a Phase-1 blocking truth-contract defect. It needs its own smallest bounded **runtime** slice **before S4 final closure and before S6**.
4. Body-cap and flags still do not require their own S4 implementation.

This is not S4 closure and not parser implementation. Cursor must not Ready or merge.

---

## 2. Body-cap – do this / do not do this

### Do not

- Do not raise `READINESS_GRENZEN.maxAnfrageBytes` to 16 KB / 24 KB by reflex.
- Do not treat 20 × 8 × 12 as a product-recommended party.
- Do not send persisted `TripTraveller` dumps (`id` / timestamps) over the public Evaluate API as a future design.
- Do not “fix” the cap by shrinking Traveller Context limits.

### Do (later, not this PR)

If a future Guest-Evaluate must accept more than **four fully loaded** travellers (8 citizenships + 12 documents each) or a 20 × 8 × 12 dump:

- **Preferred:** stop trusting client `party` for account trips; evaluate from `reiseLaden()` / trip snapshot (already loads `trip_travellers` under RLS). Historical id: `G-API-PARTY`.
- Guest without a server trip remains fail-closed or count-only (`travellers: N` without party is 123 B and already valid).
- Keep 8192 as the untrusted HTTP bound.

That is architecture, not a byte bump. It needs a product decision (Guest-Evaluate vs account-only) and a new versioned task.

### Why not raise

Measured valid compact 20 × 8 × 12 is **38864 B** (4.7× the cap). A 24 KB Safety-like cap would still 413 that shape. Raising toward 40–90 KB would weaken the untrusted-body DoS/privacy bound for a route that **no product UI calls** and that must not carry credential numbers.

Four fully loaded travellers fit (7860 B). Twenty simple travellers fit (4379 B). Representative families fit (1852–3816 B). That is the intended envelope.

## 2b. Multi-Document parser – required before S4 close / S6

Binding after TL `5072890265`. This is **not** optional later work and **not** a cap change.

`travellerAnfrageStriktLesen` already validates each document, then `travellerLegacyLesen` sorts documents, then a positional `gelesen.documents[index]` vs `documentsRoh[index]` `citizenshipClientRef` check rejects a legitimate mixed `passport` + `national_id` set solely because order changed.

### Do not (this PR / Agent A / S6)

- Do not implement the parser fix in this docs PR.
- Do not fold the fix into Agent A Safety party work, a cap change, flag wrappers, or S6.
- Do not “fix” it by dropping `citizenshipClientRef`, collapsing to `documents[0]`, or inventing default/primary/preferred passport or citizenship.

### Required later slice (new versioned runtime task; not started here)

**Name (proposal only):** Readiness Multi-Document request-order integrity
**Art:** smallest bounded runtime + tests
**When:** after this audit is reviewed; **before S4 final closure; before S6**

Minimal acceptance contract:

1. **Order-independent identity / ref-based comparison.** After `documentStrikt` / `travellerLegacyLesen`, citizenship-link and document-identity checks must match by `clientRef` (or another stable document identity), never by post-sort array index against the raw input row.
2. **Keep strict malformed / sensitive-field rejection.** Invalid types, illegal keys, sensitive credential fields, over-limit children, and unreadable country/date fields remain fail-closed.
3. **Keep duplicate / ref integrity.** Duplicate document `clientRef`, duplicate citizenship country/ref, and `citizenshipClientRef` that does not belong to the same traveller remain `null` / HTTP 400.
4. **Tests must cover mixed-document order permutations and citizenship links.** At least: `passport` + `national_id` (+ optional `unknown`) with valid links, same set in multiple input orders, sort-stable same-type controls, and a linked mixed set that today’s positional check rejects.
5. **No default / primary / preferred citizenship or passport semantics.** No `documents[0]`, no implicit first citizenship, no issuer=citizenship collapse.

Smallest likely edit surface (recommend only): the positional block in `lib/readiness/traveller-anfrage.ts` plus focused tests next to `lib/readiness/anfrage.test.ts` / `traveller-anfrage.test.ts`. Do not start that slice from this session.

---

## 3. Flags – smallest contract

### Already done

`JETNITY_READINESS_AKTIV` + `requirementsProviderNachZustand`. Do not add another Requirements flag.

### Mandatory before any Safety / Seasonal factory becomes non-null

| Step | Location | Why this is the smallest |
| --- | --- | --- |
| 1 | `lib/safety/zustand.ts` and `lib/seasonal/zustand.ts` | Copy `lib/readiness/zustand.ts`. Reuse `providerOpsZustand`. No new shared-ops type. |
| 2 | Flags `JETNITY_SAFETY_AKTIV` / `JETNITY_SEASONAL_AKTIV` (`true`/`1` only), documented in `.env.example` as default false, never `NEXT_PUBLIC_` | Same S1 convention as Flight/Hotel/Readiness |
| 3 | Wrap factory **or** engine default + `lib/safety/auswerten.ts` / `lib/seasonal/auswerten.ts` | Otherwise a `return adapter` skips Production hard-off |
| 4 | Admin `domainZustaende()` uses those zustand helpers | Board today hardcodes `zugangVorhanden: false` without a flag |

**Contract sentence to persist into the first adapter task:**

> `safetyProviderAus()` / `seasonalProviderAus()` must not return non-null unless `providerOpsZustand` (Production hart aus + explicit domain flag + real provider object) wraps every execution path, including factory, engine default, API, and Admin board.

### Do not implement now

A flag that cannot activate a `null` factory does not improve current safety. Implementing empty wrappers in S4 would only be S4-R1 parity cosmetics.

If TL still wants mechanical lock-in before S6: a later **optional** tiny docs+wrapper slice, factory remains `null`. This audit recommends **against** making that a S4-close requirement.

---

## 4. S4 close vs S6

```text
this audit review-fix TL-PASS + integrate (current-main baseline `e8549e82`)
        +
Agent A S4-R2 already on main via #368
        +
bounded Multi-Document parser runtime slice (own versioned task; not this PR)
        │
        ▼
TL live-main S4 closure recheck (Issue #365)
        │
        ▼
STOP — live-reconstruct
        │
        ▼
S6 Persistent Cost Guard (own versioned task; PO gates for any DB/cost model)
```

Do not start S6 from this PR. Do not start the parser implementation, flag wrappers, or a cap change from this PR. S4 must not be declared closed after Agent A alone.

---

## 5. Classified leftovers

| Item | Class |
| --- | --- |
| Order-sensitive Multi-Document parser | **Phase-1 blocking truth-contract defect** — own runtime slice before S4 close / S6; not implemented here |
| Real Timatic / Sherpa / advisory / climate vendor | REQUIRES FUTURE PROVIDER CONTRACT |
| Whether a future Guest-Evaluate must accept 5–20 fully loaded travellers | UNKNOWN / product decision |
| Agent A exact-head quality | UNKNOWN to this agent — now on main via #368; not re-reviewed here |
| Outbound vendor request size vs 8192 inbound cap | REQUIRES FUTURE PROVIDER CONTRACT (different layer) |
