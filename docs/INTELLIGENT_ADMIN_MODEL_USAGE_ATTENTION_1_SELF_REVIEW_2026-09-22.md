# Intelligent Admin Model Usage Attention 1 — Self-Review

Stand: 22. September 2026  
Agent: **Jetnity intelligent admin model usage attention 1**, Generation 1  
Session: `bc-2c6673c9-be6c-4de3-a735-0516448e7fdd`  
Model: Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`)

This is an adversarial self-review. It is **not** a Technical-Lead PASS.

---

## 1. Did I execute only the dispatched runtime?

| Requirement | Verdict |
| --- | --- |
| One model-usage status/freshness card on `/admin` | Yes — after `AdminLagehinweise`, before `AdminNaechsteSchritte` |
| Gate `betrieb-lesen` + surface `admin-home-model-usage` before load | Yes — `ladeModelUsageBericht`; denied spy = 0 loads |
| All five AdminDenials | Yes — T-five-denials |
| Break-glass zero loader calls, no cached facts, no hop | Yes — T-break-glass-zero-load; insights ignore any injected board |
| Role → break-glass → denied isolation | Yes — T-role-then-break-glass-then-denied |
| Empty ≠ null spend; unavailable ≠ empty | Yes — T-statuses-distinct + render |
| Unique item; missing/duplicate/malformed honest | Yes — T-missing-duplicate-malformed |
| Unrelated parents discarded | Yes — T-unrelated-parents |
| Loader throw ≠ empty; no raw error | Yes — loader + insights source_failed tests |
| Original item time; TTL 120s; future not clamped | Yes — T-original-item-time / T-boundary-120s / T-missing-invalid-future-timestamp |
| MU-R1 collector ISO + calendar before retain | Yes — `parseEvidencedIsoInstant`; invalid strings no longer survive |
| A then B keep original time, no session claim | Yes — T-cache-A-then-B |
| Fixed `/admin/provider-ops` only; writes empty; model off | Yes — T-fixed-link-and-writes |
| No costs/totals/metadata/PII in report | Yes — closed copy + leak assertions |
| Exclusive allowlist; #518 unchanged | Yes |
| No collector/cache/role/API/DB/secret/paid call | Yes |
| Synthetic render ≠ authenticated Preview | Yes — labelled BLOCKED_ACCESS |
| No Ready / merge / follow-up | Yes |

---

## 2. Attacks on the implementation

### 2.1 Could a denied caller still see a cached available/empty board?

Only if `ladeModelUsageBericht` called the loader after denial. The wrapper returns before `ladeBoard`. T-five-denials and T-gate-before-load assert zero loads and no source facts.

### 2.2 Could break-glass inherit caller A’s available snapshot?

Break-glass never calls the loader and `leiteModelUsageInsights` ignores any provided board when `grant === 'break-glass'`. Observed is `unknown` / `not_attributed`, not available/empty/unavailable.

### 2.3 Could first-match hide a duplicate or pick a hostile parent?

Selection requires exactly one `id === 'model-usage'` item that passes the closed status/time shape. Two items → `partial_failed`. Parents are never copied.

### 2.4 Could board time or `juengsteCreatedAt` replace item time?

`sourceCheckedAt` and insight `checkedAt` come only from the selected item. Tests use a later board timestamp and hostile metadata timestamp.

### 2.5 Could a future timestamp become fresh via Math.max?

`berechneModelUsageFreshness` returns `unknown` / `ageMs: null` when `nowMs - parsed < 0`. It does not use the existing clamp helper.

### 2.5a MU-R1 — could Date.parse retain free text or invent a fresh instant?

The first freeze accepted any finite `Date.parse` result and copied nonempty `checkedAt` before validation. Independent TL counterexamples (RFC GMT + synthetic email marker; 2026-02-30 rolling to March 2) are now rejected: both timestamp fields are `null`, age is unknown, and the raw string is absent from JSON and HTML. Only `YYYY-MM-DDTHH:mm:ss.sssZ` values that reconstruct to the same UTC calendar instant are retained. Valid future ISO is kept and marked unknown. Board time, newest usage time and `now` are never substituted. The old `gestern-vormittag` retention assertion was replaced.

### 2.6 Could stale available look like a current all-clear?

Stale available/empty is `materiality: 'attention'` and includes “Stand ist veraltet.” `none` is never emitted for this source.

### 2.7 Could raw errors or PII leak through sanitizer-only handling?

Source summary/detail/metadata/proves are not copied. The report is a closed German map. Leak tests fail if those strings appear in JSON or HTML.

### 2.8 Did I weaken #518 or invent a combined health score?

Existing analyst files were not edited. The new card is a separate report. No overall health summary combines the two sources.

### 2.9 Did I manufacture authenticated Preview proof?

No. Existing authorized Admin access was not available. Evidence is synthetic compiled-CSS component render, labelled BLOCKED_ACCESS.

---

## 3. Residual risks for TL

- Synthetic screenshots are still not Preview/Production route acceptance.
- Process-wide ProviderOpsBoard 30s cache is unchanged by design; displayed age uses item time + evaluation now, not cache age.
- The bounded 30-day / 200-row read can miss older or additional spend. Copy states that limit; this slice does not display totals.
- `overflow-x` was not hidden; wrapping uses `break-words` so focus outlines stay visible.
- Denied `doesNotProve` still contains the honest phrase “nicht 0 USD” on the denial path only; source metadata never supplies that number.
- Historical viewport screenshots from `7602a0ac` were not recaptured; standard-case rendered copy is unchanged. `unavailable_1280_focus.png` remains programmatic focus only. Keyboard evidence for this correction is `unavailable_1280_tab_focus.png` (1 Tab).

---

## 4. Stop

Agent completion/self-review is not TL PASS. Any later head invalidates this exact-head evidence.

**STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW.**
