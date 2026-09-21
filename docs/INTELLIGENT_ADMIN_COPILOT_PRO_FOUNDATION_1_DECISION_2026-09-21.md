# Intelligent Admin / Copilot Pro Foundation 1 — Decision

Date: 21 September 2026  
Issue: #508  
Draft PR: #510  
Branch: `architecture/intelligent-admin-copilot-pro-foundation-1`  
Audited code baseline: `main@c7fb9f0f693ba9f020add7b26a041263aa7e3b07`  
Status: **SLICE-LOCAL ARCHITECTURE DECISION / NOT AN OPERATIONAL COPILOT / NOT YET DISPATCHED**

Companion: `docs/INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_SOURCE_MATRIX_2026-09-21.md`  
Runtime task (complete, not dispatched): `docs/INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_RUNTIME_TASK_2026-09-21.md`

This document chooses one contract. It is not a menu. It does not implement runtime. Documents alone do not mean Copilot Pro is built.

---

## 1. Date

21 September 2026

## 2. Decision

Build the first Intelligent Admin foundation as a **deterministic System-Health Attention Analyst** inside the existing Admin home.

1. **One source:** the already collected, sanitized `SystemHealthBericht` from `lib/admin/system-health`.
2. **One derivation:** a pure function that ranks observed items/sub-checks, copies their `summary` / `proves` / `doesNotProve` / freshness, and emits a typed `AnalystBericht`.
3. **One surface:** a new “Aktuelle Hinweise” block on `/admin`, composed **above** the existing static `AdminNaechsteSchritte` directory. No second dashboard, no new route, no new table, no new API unless the existing RSC loader is insufficient — it is sufficient.
4. **One safe next hop** for this slice: `/admin/system-health`.
5. **Model seam:** typed, default-disabled, unauthorized. No provider, secret, paid call or “AI is thinking” chrome.
6. **Copilot Pro folgt** remains `later` / no Execute. This analyst is not marketed as live Copilot Pro.

Full Admin D–K, Ads, Bexio, CRM, operator execute, growth control and live security ingestion stay later staged work. They are not cancelled and they are not made a V1 launch prerequisite by this decision. V1 Binding Build Order §9 already says full Admin D–K is not required before V1.

## 3. Context

The Product Owner reaffirmed a parallel first Intelligent Admin / Copilot Pro foundation (#508). Visual UX Audit #506 does not replace it. Later-phase D–K does not cancel it.

What exists today:

- Admin A–C are an honest ops shell (IA, System Health, Provider/Kosten, local payments/security/users).
- Home “Nächste Ops-Schritte” is a **static directory**. It does not change when Supabase App-Datenzugriff is unavailable or when evidence is stale.
- System Health already knows those facts and already refuses fake-green (ADR-0159).
- Provider-ops parents are almost always `foundation_only`. Security ingestion is incomplete (#494 local-proof only; §G open). Kennzahlen and RLS cards already render on home.

The operator problem that is real *and* solvable without new privileges: **an entitled Admin can miss the one currently evidenced operational problem because it lives one click away and is not prioritized.**

## 4. Alternatives

1. **Do nothing until full D–K / live monitoring / revenue / account programme exist.** Rejected. The task forbids making those a start condition. A truthful bounded analyst can start from one existing snapshot.
2. **New Copilot dashboard / chat / Execute bar.** Rejected. Second truth surface. Dead Execute buttons are explicitly forbidden. External Grok team stays separate.
3. **Feed security_events or the #494 fixture into the analyst.** Rejected. 0 recorded rows ≠ no incidents. List fields include IP / `user_id` / `extra`. The fixture ledger is not a live object.
4. **Rank every Admin card (health + provider-ops + security + kennzahlen) in v1.** Rejected as first slice. Partial-failure composition across four loaders invents a bigger product than the smallest useful analyst. Provider-ops `model-usage` is named as the next snapshot, not this one.
5. **LLM explanation of the same snapshot, now.** Rejected. No model authorization. Deterministic derivation is enough to explain an already typed `proves` / `doesNotProve` pair.
6. **Chosen: deterministic derivation over System Health, mounted on home, read-only.**

## 5. Rationale

- The source is already sanitized, typed, capability-gated and tested.
- Status vocabulary already includes `healthy | degraded | unavailable | unknown | not_configured` and freshness `fresh | stale | unknown`.
- `proves` / `doesNotProve` already exist — the analyst must not invent a second explanation language.
- Expected `not_configured` (Vercel, GitHub, Infomaniak, Supabase Management) is **coverage**, not an incident. That is the difference between a useful analyst and a generic audit.
- The only commonly *variable* operational check today is `supabase-app-datenzugriff`, plus freshness/stale and collector failure. That is enough for a first useful slice.
- Permission can be checked with the same `betrieb-lesen` + AAL2 gate the System Health page already uses. Home currently does not repeat that gate; the analyst must, before aggregation.
- No traveller credentials are involved.

## 6. Insight contract

Reuse `HealthStatus`, `HealthFreshness`, `SystemHealthId` from `lib/admin/system-health/typen.ts`. Do not add a storage table for a view of existing facts.

```ts
export const ANALYST_INSIGHT_KIND = 'deterministic-source' as const

export const ANALYST_MATERIALITY = ['attention', 'coverage', 'none'] as const
export type AnalystMateriality = (typeof ANALYST_MATERIALITY)[number]

export const ANALYST_SAFE_HREFS = ['/admin/system-health'] as const
export type AnalystSafeHref = (typeof ANALYST_SAFE_HREFS)[number]

export type AnalystObserved =
  | HealthStatus
  | 'access_denied'
  | 'source_failed'
  | 'partial_failed'

export type AnalystNext =
  | { href: AnalystSafeHref; label: string; kind: 'investigate' }
  | null

export type AnalystInsight = {
  id: string
  kind: typeof ANALYST_INSIGHT_KIND
  category: 'system-health'
  sourceItemId: SystemHealthId | 'system-health-collection'
  sourceCheckId: string | null
  sourceRef: string
  observed: AnalystObserved
  freshness: HealthFreshness
  checkedAt: string | null
  materiality: AnalystMateriality
  title: string
  explanation: string
  proves: string
  doesNotProve: string
  limitations: readonly string[]
  next: AnalystNext
}

export type AnalystCoverage = {
  evidenced: readonly string[]
  notConfigured: readonly string[]
  unknown: readonly string[]
  failed: readonly string[]
}

export type AnalystBericht = {
  generatedAt: string
  sourceCheckedAt: string | null
  source: 'system-health'
  access: 'allowed' | 'denied' | 'lookup-failed'
  insights: AnalystInsight[]
  coverage: AnalystCoverage
  writeActions: []
  modelExplanation: { enabled: false }
}
```

### 6.1 Identity and dedupe

`id` is stable for the same observed fact:

`system-health:<itemId>:<checkId or 'item'>:<observed>:<freshness.state>`

One insight per check id. Prefer the **sub-check** when the parent is an expected aggregate (`app` `unknown`, `supabase` `not_configured`). Do not emit a parent incident *and* the same sub-check incident.

Expected-unconfigured parents (`vercel`, `github`, `infomaniak`, `supabase-management`) collapse to **at most one coverage insight** for the whole expected-unconfigured set, not three “configure token” cards.

`app-prozess` `healthy` + `app-deployment` `unknown` is coverage of what the process proves, not two findings and not a green app.

### 6.2 Materiality and order

Deterministic rank, then `SYSTEM_HEALTH_IDS` order, then check id:

| Rank | `observed` / freshness | `materiality` | `next` |
| --- | --- | --- | --- |
| 0 | `access_denied` or `lookup-failed` | `attention` | null (no hop the session cannot use) |
| 1 | `source_failed` / `partial_failed` | `attention` | `/admin/system-health` if access allowed |
| 2 | `unavailable` | `attention` | `/admin/system-health` |
| 3 | `degraded` | `attention` | `/admin/system-health` |
| 4 | previously material status whose freshness is `stale` | `attention` | `/admin/system-health` |
| 5 | `unknown` on a check that was *attempted* (e.g. missing ping) | `coverage` | `/admin/system-health` |
| 6 | expected `not_configured` / parent `unknown` | `coverage` | null **or** optional investigate, never “create a token” |
| 7 | no-signal (see §6.3) | `none` | null |

No confidence score. No invented severity numbers. `attention` is “this observed state is worth opening System Health”, not P0/P1 product classification.

Stale does **not** keep a previous `healthy` as current green. Stale healthy is not healthy. Stale unavailable remains attention, labelled stale.

### 6.3 No-signal

If access is allowed, collection succeeded, the only variable check (`supabase-app-datenzugriff`) is `healthy` + `fresh`, and remaining items are expected `unknown` / `not_configured`:

- emit **one** `materiality: 'none'` coverage insight;
- title/explanation must say that only process reachability and the airports read are evidenced;
- `next` is null (do not invent a recommendation);
- coverage lists still disclose what is not configured.

No-signal is not “all systems healthy”. Parent `app` / `supabase` must stay non-green (existing `istUeberzogenerGesamtClaim`).

### 6.4 Permission before aggregation

```
evaluateAdminAccess({ capability: 'betrieb-lesen', surface: 'admin-home-analyst' })
  → if denied: AnalystBericht.access = denied | lookup-failed; insights = one attention insight; do not call sammleSystemHealth
  → if allowed: reuse ladeSystemHealthFuerSeite() / sammleSystemHealth
```

Hiding the new block is not authorization. Break-glass may see the process-local snapshot the System Health page already shows; it must not be told that database-backed facts were proven if `reachesDatabase()` is false. Do not serve the 30s process cache to a caller who failed the gate.

`access_denied` and `lookup-failed` render with existing denial copy (`messageForDenial`). They must not look like an empty healthy list.

### 6.5 Honest failure

| Input | Output |
| --- | --- |
| Denied / AAL2 required | `access: 'denied'`; no source items; no green |
| Lookup / AAL lookup failed | `access: 'lookup-failed'`; unavailable, not logged-out (#500) |
| Collector throw after allow | `source_failed`; do not invent timestamps |
| Partial item isolation (existing `isoliert`) | typed item as today; `partial_failed` only if the bericht itself is incomplete (`systemHealthIdsVollstaendig === false`) |
| Missing `checkedAt` | freshness `unknown`; no fabricated clock |
| Stale | keep last observed status, mark stale, do not treat as current |

Empty insights after a successful load means the ranking produced only coverage/none — still show coverage. Never coerce to zero incidents.

### 6.6 Navigation and text

- Allowlisted hrefs: `/admin/system-health` only in this slice.
- Kind is `investigate`, never `execute`, `repair`, `pay`, `switch-provider`, `write`.
- No buttons labelled Execute, Auto, Repair, Apply, Block, Refund.
- `explanation`, `proves`, `doesNotProve` and `summary` are **untrusted display data**. Render as text, not markdown-as-HTML, not instructions to an agent.
- No public indexing (Admin already uses `NICHT_INDEXIEREN`).
- No cross-user data. No new export.

### 6.7 Model seam (disabled)

```ts
modelExplanation: { enabled: false }
```

A later slice may add an optional explanation that takes an `AnalystInsight` and returns prose. That slice needs its own TL task, cost controls and PO/model gate. This foundation must not leave a visible “Ask Copilot” control that implies the seam is live.

Distinguish in copy:

- **Regelbasierte Lage** = this contract.
- **Modelltext** = later, optional, labelled, never a source of status.

The in-product Reisebegleiter and the external Grok team remain separate. No workspace credentials, no automatic ingestion, no new bot or routine.

## 7. Integration shape

`app/(admin)/admin/page.tsx` already composes:

1. Steuerzentrale copy (`steuerzentraleLage` — keep the “kein Copilot-Execute” sentence).
2. `AdminStatsStrip`
3. `AdminTimeSeries`
4. `AdminNaechsteSchritte`
5. `AdminHealthCards`

The runtime slice inserts a server-rendered **Aktuelle Hinweise** section immediately **before** `AdminNaechsteSchritte` (or as its first child). Static ready/later cards stay. “Copilot Pro folgt” stays later.

UX:

- Existing design tokens only (`DESIGN_SYSTEM.md`). No AI-gradient, no new colour family.
- Mobile-first, keyboard and focus: same pattern as current home cards / System Health board (`rounded-xl border`, text links, no pointer-only disclosure).
- Evidence text is muted body copy; status chips reuse the System Health colour rules (green only for fresh healthy **sub-checks**, never parent all-clear).

## 8. Synthetic design cases

The following are **synthetic design cases**, not observed Production incidents.

| Case | Input (synthetic) | Expected insight |
| --- | --- | --- |
| A | `supabase-app-datenzugriff` `unavailable` + fresh | One `attention` insight; proves only this ping failed; next `/admin/system-health` |
| B | Same status, freshness `stale` | Same fact, labelled stale; not current; still attention |
| C | Airports ping `healthy` + fresh; others expected unknown/not_configured | One `none` coverage insight; no recommendation |
| D | `betrieb-lesen` denied | `access: 'denied'`; no aggregation; no green; no System Health hop |
| E | Bericht missing `github` item | `partial_failed` attention; do not assume GitHub is healthy |
| F | `app` parent `healthy` in a fixture | Invalid input; derivation must refuse to emit a green parent claim (`istUeberzogenerGesamtClaim`) |

## 9. What this is not

- Not an operational Copilot.
- Not live monitoring, not §G closure, not finding 5.2 closure.
- Not a producer, scheduler, webhook or persistent insight store.
- Not a broadening of Admin data access.
- Not Ads/Bexio/CRM/payment/provider activation.
- Not a Technical-Lead PASS, Ready or merge.

## 10. Consequences

- TL can dispatch the companion runtime task without another generic planning cycle, unless review finds a material blocker.
- First runtime file set stays small and local to Admin home + a new `lib/admin/analyst/*` derivation (named in the runtime task).
- Provider-ops `model-usage` remains the documented second snapshot for a later numbered slice.
- Existing System Health tests stay the source-contract tests; the analyst adds derivation tests, it does not fork a second health model.
- If TL rejects the single-source choice, the alternative is to add `model-usage` only — not to reopen D–K or security ingestion in the same slice.
