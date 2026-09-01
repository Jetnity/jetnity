# Provider Readiness S4 – Residual Capacity / Flags Recommendation

Stand: 1. September 2026  
Status: **RECOMMENDATION ONLY / DO NOT IMPLEMENT FROM THIS PR**  
Logical agent: **`Jetnity provider readiness S4 residual capacity flags audit 1`**  
Generation: **1**  
Evidence: `docs/PROVIDER_READINESS_S4_RESIDUAL_CAPACITY_FLAGS_AUDIT_2026-09-01.md`

---

## 1. Decision asked of Technical Lead

After independent exact-head review of this Draft-PR **and** Agent A (#366):

1. Treat the 8 KB Readiness HTTP cap as **sufficient for intended payloads**. Do not raise it in S4.
2. Treat Safety / Seasonal activation flags as an **activation-time mandatory contract**, not a current S4 implementation.
3. Declare S4 closed on live main only after Agent A integrates — **without** a further body-cap/flag slice — unless live recheck shows a new current blocker.

This is not S4 closure. Cursor must not Ready or merge.

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

### Discovered parser follow-up (not S4-cap, not a S6 gate)

`travellerAnfrageStriktLesen` rejects mixed document types when `citizenshipClientRef` is set, because it index-compares after sort. Smallest later fix: compare by `clientRef`, or compare against the unsorted raw row, or skip the index check once `documentStrikt` already validated links. New versioned Readiness parser task if TL wants it; **do not** fold it into S6 or a cap change.

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
Agent A #366 TL-PASS + integrate
        +
this audit persisted on main (via TL merge of #367)
        │
        ▼
S4 residuals named here: closed or explicitly deferred
        │
        ▼
STOP — live-reconstruct
        │
        ▼
S6 Persistent Cost Guard (own versioned task; PO gates for any DB/cost model)
```

Do not start S6 from this PR. Do not start flag/cap/parser follow-ups from this PR.

---

## 5. Classified leftovers

| Item | Class |
| --- | --- |
| Real Timatic / Sherpa / advisory / climate vendor | REQUIRES FUTURE PROVIDER CONTRACT |
| Whether a future Guest-Evaluate must accept 5–20 fully loaded travellers | UNKNOWN / product decision |
| Agent A exact-head quality | UNKNOWN to this agent |
| Outbound vendor request size vs 8192 inbound cap | REQUIRES FUTURE PROVIDER CONTRACT (different layer) |
