# Intelligent Admin / Copilot Pro Foundation 1 — Source / Capability / Freshness Matrix

Date: 21 September 2026  
Issue: #508  
Draft PR: #510  
Branch: `architecture/intelligent-admin-copilot-pro-foundation-1`  
Audited code baseline: `main@c7fb9f0f693ba9f020add7b26a041263aa7e3b07`  
Dispatch / seed head: `b498f0dfa64fff500c08bf87cb5bffa6979e477f`  
Agent: **Jetnity intelligent admin copilot pro foundation 1**, Generation 1  
Required model: Cursor Grok 4.6 High Fast

This matrix is current-code truth for the first read-only analyst. It is not a second Admin audit, not a claim that Copilot Pro is operational, and not a live Production probe. Historical D–K / PR #40 plans are labelled historical. #506 visual-audit and #509 Trip/Account reports are sibling input and are not treated as canonical here.

Traveller-context intelligence does not apply: this slice is operator-facing Admin A–C. No traveller citizenship, document or credential is collected or propagated.

---

## 0. How to read this matrix

For every candidate the columns mean:

| Field | Meaning |
| --- | --- |
| Actual seam | File / function / API / RPC that exists on this baseline |
| Consumer | Who already reads it |
| Establishes | The only statement the source is allowed to support |
| Cannot establish | False conclusions the first analyst must not draw |
| Gate | Role / capability / AAL and denied behaviour |
| Privilege | Existing read versus a new secret, role or table |
| Freshness | Timestamp, TTL, window, missing / error / stale |
| Safe fields | Aggregates or sanitized typed fields the analyst may reuse |
| Forbidden | PII, raw rows, secrets, executable text |
| First slice | Selected, deferred, or forbidden for Foundation 1 runtime |

Common Admin gate (all surfaces below):

- Area entry: `requireAdminPage({ surface: 'admin-bereich' })` in `app/(admin)/layout.tsx`.
- Identity: verified `auth.getUser()`; role from `profiles`; AAL2 via `applyAdminAal`.
- Capability table: `lib/auth/roles.ts` — `betrieb-lesen` and `konten-verwalten` start at `moderator`; `betrieb-eingreifen` at `operator`.
- API denials: 401 `unauthenticated`, 403 `forbidden` / `aal2-required`, 503 `lookup-failed` / `aal-lookup-failed` (`statusForDenial`).
- Break-glass (`ADMIN_ALLOWED_EMAILS`): opens the shell only. `reachesDatabase()` is false. Empty lists from RLS must not be shown as zero events or zero trips (ADR-0036 / ADR-0040).
- Hiding a nav item is UX only (`adminNavIstNurUx()`). It is not authorization.

#500 (merged) is relevant only as HTML/API lookup-failure truth: Auth lookup failure is unavailable, not “logged out”. The analyst must not map `lookup-failed` to an empty healthy board.

---

## 1. Selected first source — System Health typed snapshot

| | |
| --- | --- |
| **Selection** | **Chosen first runtime source.** |
| Actual seam | `sammleSystemHealth()` in `lib/admin/system-health/sammeln.ts`; evaluation in `lib/admin/system-health/bewertung.ts`; freshness in `lib/admin/system-health/freshness.ts`; types in `lib/admin/system-health/typen.ts`; RSC/API loaders in `lib/admin/system-health/runtime.ts`. |
| API | `GET /api/admin/system-health` — `app/api/admin/system-health/route.ts`. `requireAdminApi({ surface: 'api/system-health', capability: 'betrieb-lesen' })`. `Cache-Control: private, max-age=30`. `writeActions: []`. |
| Page | `/admin/system-health` — `app/(admin)/admin/system-health/page.tsx` additionally calls `requireAdminPage({ surface: 'system-health', capability: 'betrieb-lesen' })` then `ladeSystemHealthFuerSeite()`. |
| Consumer | `SystemHealthBoard` (`components/admin/system-health/SystemHealthBoard.tsx`). Home currently only *links* here via static `ADMIN_NAECHSTE_SCHRITTE`. |
| Contract | ADR-0159 / `docs/ADR_0159_ADMIN_SLICE_B.md`. Parent `app` stays `unknown`. Parent `supabase` stays `not_configured`. Visible green only if `status === 'healthy' && freshness.state === 'fresh'` (`healthKarteIstGruen`). `istUeberzogenerGesamtClaim` forbids parent `app` / `supabase` healthy. |
| Items | Fixed ids: `app`, `vercel`, `supabase`, `github`, `infomaniak`. |
| What it actually checks today | **App-Prozess:** this Next.js process answered. **App-Deployment:** always `unknown` (`source: none`). **Supabase App-Datenzugriff:** session-scoped `airports` `select iata limit 1` with 8s timeout, only when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set. **Supabase Management, Vercel, GitHub/CI, Infomaniak:** `not_configured` / `source: none`. |
| Establishes | Process reachability of this instance; whether the configured app Supabase client can read `public.airports` in this session; that named management/CI/DNS sources are not attached; freshness of *this* collection (`checkedAt`, TTL 60–300s, process cache 30s). |
| Cannot establish | Deployment or Vercel platform health; Supabase project / Auth / billing / Management; CI green; Infomaniak domain/mail; provider liveness; incidents; revenue; that “all systems are healthy”. `VERCEL_*` metadata is not a health proof. |
| Gate | `betrieb-lesen` + AAL2 on the page and API. Home (`/admin`) currently has **area access only**. A home-mounted analyst **must re-check `betrieb-lesen` before calling `sammleSystemHealth`**. Denied: page redirect / API 401–503. Do not render an empty “all quiet” list. |
| Privilege | Existing read. No new secret, role, RPC or table. Airports ping uses the caller’s cookie client, not service role. Management tokens are **not** present and must not be added. |
| Freshness | `berechneFreshness({ checkedAt, nowMs, ttlMs })`: missing/invalid `checkedAt` → `unknown`; `ageMs > ttlMs` → `stale`; else `fresh`. TTL: app/supabase 60s, vercel 120s, github/infomaniak 300s. Cached bericht is re-aged via `wendeEvidenceAlterAn`. Isolated collector failures fall back to a typed item, not a thrown empty board. |
| Safe fields | `id`, `name`, `status`, `source`, `checkedAt`, `freshness`, `summary`, `detail`, `proves`, `doesNotProve`, non-secret metadata (`vercelEnv`, truncated `commitSha`, `deploymentId`, `region`). Sub-check ids `app-prozess`, `app-deployment`, `supabase-app-datenzugriff`, `supabase-management`. |
| Forbidden | Management tokens, raw SQL errors as executable text, user/trip/security PII (none are in this snapshot), inventing `healthy` for parents, fabricating `checkedAt`. |
| User-visible use | “Supabase App-Datenzugriff is unavailable; this does not prove Management is down; next: open System Health.” Or, if only expected `unknown` / `not_configured` remain: coverage disclosure, **no invented configure-token recommendation**. |
| #497 | Finding 5.4 System health is `PARTIAL`. This foundation reuses the honest partial board; it does not complete platform monitoring. |

Process-level cache (`CACHE_MS = 30_000` in `sammeln.ts`) is **after** the existing page/API gate. The first analyst must still run its own capability check before reuse. The cache must not become a lower-privilege summary.

---

## 2. Deferred — Provider & cost typed snapshot

| | |
| --- | --- |
| **Selection** | **Documented, not in the first runtime.** First follow-up source after this contract is accepted, if TL still wants a second snapshot. |
| Actual seam | `sammleProviderOpsBoard()` in `lib/admin/provider-ops-board/sammeln.ts`; evaluation in `bewertung.ts`; loaders in `runtime.ts`. |
| API | `GET /api/admin/provider-ops` — `requireAdminApi({ surface: 'api/provider-ops', capability: 'betrieb-lesen' })`. Same private 30s cache header. `writeActions: []`. |
| Page | `/admin/provider-ops` — additional `requireAdminPage({ capability: 'betrieb-lesen' })`. |
| Consumer | `ProviderOpsBoard`. Home only links statically. |
| Contract | ADR-0162. Parents `provider-ops`, `kill-switch`, `cost-guard` stay `foundation_only` / non-green. `providerOpsKarteIstGruen` returns false for all four parent ids. |
| What it actually checks today | Domain S1 flags via `flugZustand` / `hotelZustand` / `activityZustand` / `mobilityZustand` / `rentalCarZustand` / `readinessZustand` plus Safety/Seasonal forced `zugangVorhanden: false`. Kill-switch form from `VERCEL_ENV`. Cost-guard **interface existence**, not a persistent budget. `model_usage`: last 30 days, `created_at` + `kosten_mikro_usd`, limit 200, via `lese()` and `darf_betrieb_lesen`. |
| Establishes | That the merged S1 contract was evaluated; that recorded `model_usage` rows in the window were readable or not; empty window ≠ 0 USD. |
| Cannot establish | Live provider, Production readiness, persistent kill-switch enforcement, monthly budget, Stripe/Bexio/finance, Ads, CRM. Code-level foundation ≠ live provider. |
| Gate | Same `betrieb-lesen` + AAL2. Denied must not become `empty` / `0` cost. |
| Privilege | Existing. No new secret. Safety/Seasonal remain hard `ohne-zugang`. |
| Freshness | Same `fresh/stale/unknown` helper. TTL 60s except `model-usage` 120s. Process cache 30s. |
| Safe fields | Parent status, `proves` / `doesNotProve`, `model-usage` metadata `zeilen`, `kostenMikroUsd`, `juengsteCreatedAt`. |
| Forbidden | Secret names, CHF conversion, “budget remaining”, treating `foundation_only` as an incident, treating `empty` as “no spend occurred anywhere”. |
| Why deferred | Three of four parents are **static** `foundation_only` on every request. Including them in v1 would generate permanent noise or fake “configure provider” recommendations. The only variable item (`model-usage`: `unknown` / `unavailable` / `empty` / `available`) is useful later, not required to start a truthful System-Health analyst. |

---

## 3. Deferred / unsafe as a first insight feed — Security aggregates

| | |
| --- | --- |
| **Selection** | **Not a first-slice insight source.** Existing Security page remains the investigation target for later coverage insights. Raw list is **forbidden** as a model or analyst feed. |
| Summary seam | `GET /api/admin/security/summary` — `requireAdminApi({ surface: 'api/security/summary', capability: 'betrieb-lesen' })`. Reads `security_events (type, created_at)` and `blocked_ips (ip)` for 7 days via `lese()`. Aggregates with `fasseSicherheitslageZusammen()` + `lib/admin/security-event-taxonomy.ts` (#504 aligned presentation taxonomy). |
| List seam | `GET /api/admin/security/list` — same capability. Selects `id, created_at, ip, type, user_id, extra` (limit 200) and blocklist `ip, reason, created_at`. Returns `user_id`, `ip`, and `detail`. |
| Page | `/admin/security` has **no extra page-level capability call**; it relies on area layout + client `fetch` of the APIs. Widget polls every 15s (`SecurityWidget`). |
| Home consumer | Static link only. `AdminHealthCards` is the **RLS catalogue**, not this event feed. |
| Establishes | Counts of **recorded** rows in the queried window that match the presentation taxonomy. Last recorded `type`/`created_at` if a row exists. Blocklist **row count**, not enforcement. |
| Cannot establish | That no incident happened. Finding 5.2 ingestion remains **OPEN**. #494 is **merged local disposable proof only**; `jetnity_internal.security_event_producer_origin` must not be queried as a live object. Release-gate §G is unsatisfied. IP blocklist is **not enforced** (`ADMIN_EHRLICHE_TEXTE.ipBlockHinweis`). Widget 24h KPIs and summary 7-day window differ by design (#504). |
| Gate | API: `betrieb-lesen` + AAL2. Error path already uses `problemAntwort` — must not collapse to zeros (route comment; ADR-0040). |
| Privilege | Existing. List already exposes IP / `user_id` / `extra` to entitled operators. **Feeding those fields into an analyst, cache, export or later model is a new privilege and is forbidden here.** |
| Freshness | Window is query-relative (`since = now - 7d` or widget 24h). No `freshness.state` object on the summary JSON. A successful empty list is “0 recorded rows”, not “fresh all-clear”. |
| Safe fields (later, if ever) | Aggregates `failed_logins`, `anomalies`, `blocked_ips` **plus** the mandatory incomplete-ingestion copy. `last_event.type` only from the allowlisted taxonomy, never raw `extra`. |
| Forbidden | Raw `ip`, `user_id`, `extra`/`detail`, block reasons as model/prompt text, invented incident counts, “0 ⇒ safe”, querying the #494 fixture ledger, claiming live monitoring. |
| User-visible use today | The Security page already states the coverage truth. Repeating “ingestion incomplete” as a prioritized home insight would be a static sermon, not an observed operational change. |

#497 classifies 5.2 as `PARTIAL` (architecture merged, ingestion open). #498 residuals RH-10.1 / RH-10.2 were closed by #504 taxonomy alignment, not by ingestion.

---

## 4. Deferred — Operational trip/account aggregates

| | |
| --- | --- |
| **Selection** | **Not first-slice.** Already rendered on home; do not duplicate as “intelligence”. |
| Actual seam | `public.admin_reisen_kennzahlen()` from `AdminStatsStrip` (`components/admin/home/AdminStatsStrip.tsx`). Time series: `admin_reisen_zeitreihe(integer)` via `AdminTimeSeries`. |
| Consumer | Admin home overview only. |
| Establishes | Count of trips in 30 days and accounts with a trip in 30 days, when a row is returned. Series of new trips per day. |
| Cannot establish | Revenue, conversion, payouts, provider health (copy: `kennzahlenHinweis`, `umsatzConversionHinweis`; #472 revenue-truth). |
| Gate | RPC self-checks `darf_betrieb_lesen()`. No row ⇒ em dash / explicit “no operating figures for this session”, never `?? 0`. Query error uses `Fehlerflaeche` / `ausProblem`. |
| Privilege | Existing SECURITY DEFINER aggregate. No titles, destinations, ids, amounts (DECISIONS ADR around admin kennzahlen). |
| Freshness | No freshness object. Figures are “whatever the RPC returned on this request”. |
| Safe fields | `reisen_30d`, `konten_mit_reise_30d`, per-day trip counts. |
| Forbidden | Payment residue, conversion rates, treating missing row as zero trips. |
| Why deferred | Home already shows the honest tiles. A failed RPC is an error surface, not a new analyst category. Useful later only as a *contrast* to a healthy airports ping (data-plane vs capability), which is a second-slice composition. |

---

## 5. Deferred / do-not-present-as-revenue — Local payments residue

| | |
| --- | --- |
| **Selection** | **Not a first-slice source.** |
| Actual seam | `GET /api/admin/payments/summary` — `betrieb-lesen`; `payments (amount_chf, status, created_at)` + `refunds (id)` 30 days; `fasseZahlungenZusammen`. Sibling list/breakdown/webhook/refund routes exist. |
| Page | `/admin/payments` calls `requireAdminPage({ surface: 'payments' })` **without** repeating the capability (area + later API). Refund write is `betrieb-eingreifen` and is **local table only**. |
| Establishes | Local table residue. Honest copy: no provider-backed money movement (#472, `zahlungenHinweis`). |
| Cannot establish | Real revenue, orders, refunds, payouts, conversion. |
| First analyst | Must not invent ROI, finance health, or “payments look fine”. |

---

## 6. Deferred — RLS catalogue (`admin_security_overview`)

| | |
| --- | --- |
| **Selection** | **Not first-slice.** Already on home as `AdminHealthCards`. |
| Actual seam | RPC `admin_security_overview()` from `components/admin/home/AdminHealthCards.tsx`. |
| Establishes | RLS enabled count and policy-count sum for **known catalog tables** in that RPC. |
| Cannot establish | Infrastructure health, System Health, live incidents (`rlsKatalogHinweis`). |
| Error / empty | `error !== null \|\| rows.length === 0` ⇒ em dash, not `0/0` all-protected (ADR-0040). |
| Why deferred | Static catalogue hygiene, already visible. Not an operational attention signal. |

---

## 7. Support / incident readiness — documents, not a live source

| | |
| --- | --- |
| **Selection** | **No runtime feed.** |
| Actual seam | Merged process docs: V1 Support Process 1 (#470), V1 Incident Process 1 (#464), Admin MFA-loss runbook (#460). #497: 4.1 and 5.5(a) `CLOSED`; 5.5(b) alerting tooling `PO_GATED`. |
| Establishes | How an operator should escalate **after** a human reads an insight. |
| Cannot establish | A live ticket queue, SLA, on-call, or correlated Fehler-ID backend. |
| First analyst | May later *link* to a runbook path only if that path already exists in-app or is an allowlisted docs route the Admin already uses. Foundation 1 does **not** add a support-queue insight. No new bot or scheduler. |

---

## 8. Explicitly forbidden or non-sources

| Candidate | Status | Why |
| --- | --- | --- |
| #494 `jetnity_internal` ledger / local producer DB | Forbidden | Disposable fixture. Not in Development/Preview/Production. Querying it would invent live ingestion. |
| Parked #487 ingestion architecture runtime | Out of scope | Parked; architecture only; finding 5.2 / §G remain open. |
| Vercel / GitHub / Infomaniak / Supabase Management APIs | Not configured | Would need new secrets and PO gates. `not_configured` is the honest state. |
| In-product Reisebegleiter / Assistant | Separate system | Account-trip assistant. No Admin credential sharing. |
| External Grok / Guardian team | Separate system | No workspace ingestion, no new routine, no shared secrets. |
| Ads / Bexio / CRM / finance / growth | Later D–K target | Historical standard + #78 audit. Not cancelled. Not a V1 prerequisite (`docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md` §9). |
| PR #40 `docs/ADMIN_PLATFORM_IMPLEMENTATION_PLAN.md` | Historical only | Lives on `origin/audit/admin-platform`, **not on main**. D–K gap audit evidence is `docs/ADMIN_D_K_GROWTH_CONTROL_AUDIT_*` (PR #78). |
| #506 rendered UX audit / #509 Trip+Account revalidation | Sibling | May be consumed later as labelled input. Not waited on. Not edited here. |

---

## 9. Home recommendation surface as it exists

`components/admin/home/AdminNaechsteSchritte.tsx` renders static `ADMIN_NAECHSTE_SCHRITTE` from `lib/admin/ehrliche-zustaende.ts`:

| Title | `stand` | `href` |
| --- | --- | --- |
| Nutzer | ready | `/admin/users` |
| Zahlungen | ready | `/admin/payments` |
| Security | ready | `/admin/security` |
| System Health | ready | `/admin/system-health` |
| Provider & Kosten | ready | `/admin/provider-ops` |
| Copilot Pro | later | `null` — “Kein Execute-Pfad. Automatik ist nicht verfügbar.” |
| Infomaniak / Domain & Mail | later | `null` |

This is a **directory**, not an observed-state analyst. Tests lock the five ready hrefs (`lib/admin/ehrliche-zustaende.test.ts`). Foundation 1 must reuse this hierarchy: add a derived “current hints” block; do not replace the directory with a second dashboard; do not turn “Copilot Pro folgt” into a live Execute control.

Topbar still shows `copilotFolgt` as a disabled title. That copy stays honest.

---

## 10. Selection decision (one sentence)

The first useful truthful analyst can be built from **System Health alone**: it is the only existing sanitized snapshot whose statuses actually change under current permissions (`unavailable` / `unknown` / `not_configured` / sub-check `healthy`) and that already carries `proves`, `doesNotProve` and freshness. A second source is not required to start. Provider `model-usage` is the named next snapshot, not part of the first runtime task.
