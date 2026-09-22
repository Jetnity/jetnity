# Admin Audience & Partner Reporting Preflight 1 — Source / Producer Matrix

Date: 2026-09-22  
Agent: **Jetnity admin audience partner reporting preflight 1**, Generation 1  
Required / actual model: Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-ea4a0209-f139-4b47-8943-16ddf78e4270`  
Run: https://cursor.com/agents/bc-ea4a0209-f139-4b47-8943-16ddf78e4270  
Draft PR: #549  
Branch: `audit/admin-audience-partner-reporting-1`  
Task: `docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_TASK_2026-09-22.md` at seed `8ebed62b565a7ab28f80b276984d12f2b535dff0`  
Audited producer baseline: task main `9dc8926ef859bcde2dc31dc8b96f2e61e1948f74`; this R1/R2 persist merges authorized live `origin/main` `8fcccd6475f41703bd2a31deecb3067391f330b4` (#547/#545 accepted). Those merges are Admin navigation/indexing, not visitor or trip-aggregate producers.  
Status: **DOCS-ONLY PREFLIGHT / R1+R2 CORRECTION / NOT IMPLEMENTATION / NOT READY / NOT A TECHNICAL-LEAD PASS**

This matrix is repository-plus-quoted-TL-metadata truth for Admin audience, product-usage and partner-report questions. It is not a second Admin D–K audit, not a Growth OS, not a vendor decision, not public indexing, and not a launch gate. #548 remains unmerged and is **not** main truth. #548 may advance main again; do not silently claim this main pin stays current.

Traveller-context intelligence does not apply: this slice is operator-facing reporting preflight. No citizenship, document or credential is collected or proposed as a marketing segment.

---

## 0. How to read

| Field | Meaning |
| --- | --- |
| Definition | The only statement the metric is allowed to support |
| Source / producer | File, RPC, table, or explicit absence |
| Coverage start | Earliest reliable coverage, or `none` |
| Window / timezone | Rolling vs calendar; labelled timezone or unknown |
| Env / test / bot | How Preview, fixtures, internal and bot traffic are treated |
| Auth path | Capability / AAL / deny behaviour |
| Freshness | Request-time, TTL, or none |
| Status | `AVAILABLE` / `PARTIAL` / `ABSENT` / `GATED` |
| Evidence | `repo` = this checkout of main; `tl-live-metadata` = quoted Technical-Lead observation, not a complete Production PASS |

Status meanings:

- **AVAILABLE** — a current producer exists; the number may be shown only with the definition below.
- **PARTIAL** — a nearby field or surface exists, but it does not establish the asked metric.
- **ABSENT** — collection or producer has not started. This is not observed zero.
- **GATED** — a later legal, Production-migration, provider, secret, privacy or Product-Owner gate stands in front of any honest producer.

Four unavailable states must stay distinct in any later UI or export:

| State | Meaning | Must not be shown as |
| --- | --- | --- |
| Observed zero | Producer ran and counted nothing in the window | Unavailable |
| Unavailable | Producer missing, failed, or denied | `0` |
| Forbidden | Caller lacks capability / AAL / RLS | `0` or a global audience count |
| Collection-not-started | No event/visitor/affiliate-click pipeline exists | Historical traffic `0` |

No fabricated historical traffic. No nationwide user-identity assumption. No cross-device fingerprinting. No person-count guarantee. No inferred nationality from language or IP. No sensitive travel or document attributes in marketing segmentation.

---

## 1. Identity definitions — proposed, documentation only

These names are the proposed v1 reporting vocabulary. They are not implemented contracts.

| Term | Proposed definition | Current producer | Status |
| --- | --- | --- | --- |
| **Auth account** | A row in `auth.users`. Registration exists here. | No Admin aggregate. Application Register/OAuth calls `signUp` / `signInWithOAuth` only. | `GATED` to count; `ABSENT` as Admin metric |
| **Profile** | A row in `public.profiles` (`user_id` unique, FK to `auth.users` ON DELETE CASCADE). Carries `role`, `status`, `created_at`, `last_seen_at`. | Created only when a writer inserts a row. **No `auth.users` trigger** (`docs/DATENBANK.md` §3, `docs/AUTH.md`). **No application insert** found in `app/**` or `lib/**`. Self-insert policy `profiles_anlegen` exists. Test/admin scripts insert. | `PARTIAL` as a listed-row surface; **not** registrations |
| **Guest draft** | A trip graph in browser `localStorage` under `/planen`. ADR-0042: no shadow `auth.users` row, no guest cookie token, no fingerprinting. | `lib/trips/uebernahme.ts` / `GastreiseBruecke`. Never in `public.trips` until explicit takeover. | `ABSENT` from every server aggregate |
| **Measured visitor / device** | A consented, versioned first-party visit identifier with documented collision, expiry and exclusion rules. Not a human. | None. AP6A inventory asserts no non-essential tracker and no mounted consent banner. | `ABSENT` / collection-not-started |
| **Human** | A unique natural person. | None. Must never be inferred from accounts, profiles, cookies, IP or language. | `ABSENT` |
| **Active account (proposed)** | An auth account that produced a **named product event** in the window. Until that event exists, do not use `last_seen_at`. | `last_seen_at` has **no writer** in application, SQL functions or scripts. Users table only reads it. | `ABSENT` |
| **Account with a trip (30d)** | Distinct `trips.user_id` whose trip `created_at` is in rolling 30 days. | `admin_reisen_kennzahlen().konten_mit_reise_30d` | `AVAILABLE` when `betrieb-lesen` returns a row |
| **Trip created** | A persisted `public.trips` row. Guest drafts are excluded. Local `status='booked'` is **not** a provider booking. | `admin_reisen_kennzahlen` / `admin_reisen_zeitreihe` | `AVAILABLE` when authorised |

`account ≠ profile ≠ visitor ≠ human ≠ active-account ≠ account-with-trip`.

A Users-page count of profiles under `konten-verwalten`, with optional search filter and RLS, is **not** a global audience count.

---

## 2. Source-to-metric matrix

### 2.1 Existing accounts, registrations, activation, active accounts

| Metric | Definition | Source / producer | Coverage | Window / TZ | Env / test / bot | Auth | Freshness | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Registered accounts | Count of `auth.users` | No Admin RPC, no Auth-admin read in app. Register does not insert `profiles`. | none as Admin metric | n/a | Testkonto scripts create Auth users **and** a profile via SQL (`scripts/auth/testkonto.ts`). | Auth-admin / service-role would be a new privilege. Forbidden here. | n/a | **GATED** | repo |
| New registrations | `auth.users.created_at` in window | Same absence | none | n/a | Same | Same | n/a | **GATED** | repo |
| Profiles listed | Paginated `profiles` rows the caller may read | `app/(admin)/admin/users/page.tsx` `select … { count: 'exact' }` with optional `q` | From first inserted profile row; **not** from first signup | `created_at` desc; no timezone label | Search filter changes `count`. Break-glass / RLS-empty must not become “0 Nutzer”. ADR-0040. | `requireAdminPage({ capability: 'konten-verwalten' })` + `canManageUsers`; RLS `profiles_lesen` = self **or** `darf_konten_verwalten()` | Request-time | **PARTIAL** — operator list, not audience | repo |
| Profile `created_at` | Timestamp of the **profile row**, not signup | Column default `timezone('utc', now())` on historical creator table; no app writer found | Only if a profile row exists | UTC-ish column default; UI formats locally | Test inserts included if present | Same as Users page | Row timestamp | **PARTIAL** | repo |
| `last_seen_at` | Intended last-activity column | Schema only: `supabase/migrations/20260815060111_baseline.sql`; displayed in `UsersTable`; exported in `lib/account/datenexport.ts`. **No UPDATE/INSERT producer** in `app/**`, `lib/**`, `supabase/migrations/**` (except the column itself) or scripts. | none | n/a | n/a | Read with profile | Stale-by-construction (never written) | **ABSENT** as activity; **PARTIAL** as unused column | repo |
| Active accounts | Proposed: named product event in window | No event contract. Do not substitute `last_seen_at` or “has a trip”. | none | n/a | n/a | n/a | n/a | **ABSENT** | repo |
| Activation | First core-product benefit (Growth standard) | No versioned activation event | none | n/a | n/a | n/a | n/a | **ABSENT** | repo |
| Account deletion / lifecycle | Auth delete cascades profile + trips | `trips.user_id` / `profiles.user_id` ON DELETE CASCADE. No retention ledger for reporting. | Deletion **removes** historical trip counts | n/a | Deleted test users disappear from aggregates | n/a | Immediate on delete | **PARTIAL** — backfill of deleted accounts impossible | repo |

`profiles.status` allows `active`, `pending`, `disabled`, `banned`. Default on a **self-created** profile is `active` (`docs/DATENBANK.md` §6). That is account-moderation status, not “active user”.

### 2.2 Unique visitors, sessions, pageviews, returning use

| Metric | Definition | Source / producer | Coverage | Window / TZ | Env / test / bot | Auth | Freshness | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Unique visitors / month | Distinct consented visit identifiers in a calendar month. **This is the Skyscanner affiliate criterion**, not accounts. | None. No first-party collector. `package.json` has none of `@vercel/analytics`, `@sentry/nextjs`, `posthog-js`, `mixpanel-browser`, `plausible-tracker`, `react-ga4`, `ga-gtag` (`lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts`). | none; **no historical backfill** | n/a | No bot/internal filter exists because no collection exists | Later consent / legal / tracker gate | n/a | **ABSENT** / collection-not-started | repo; Skyscanner page independently fetched 2026-09-22 |
| Sessions | Grouped visits | Historical `creator_sessions` **removed** (`20260817120200_creator_sessions_entfernen.sql`). Admin time series now counts **new trips**, not sessions (`AdminTimeSeries.tsx`). | none for web sessions | n/a | n/a | n/a | n/a | **ABSENT** | repo |
| Pageviews | Rendered public pages | No pageview event. No middleware analytics file in this checkout. | none | n/a | n/a | n/a | n/a | **ABSENT** | repo |
| Returning use | Same visitor/account returns | No visitor id; no active-account event | none | n/a | n/a | n/a | n/a | **ABSENT** | repo |
| `account_visits` | User-confirmed **travel-place** history | `public.account_visits` + `account_visit_bestaetigen` | Explicit visits only | Visit calendar fields, not web sessions | Not web traffic | Owner RLS | Row timestamps | **ABSENT** as traffic. Do not rename. | repo |
| TW “visitor search” | Destination / entry-requirements visitor checklist | Remaining-build-map TW-1–TW7-A wording | Product UX, not analytics | n/a | n/a | n/a | n/a | **ABSENT** as unique visitors | repo |

Legal current contract (do not weaken): CookieConsent component is **removed**; no mounted banner; introducing a tracker later is a separate explicit consent/legal gate (`ap6a-gate0-legal-foundation-inventory.test.ts`). Historical `docs/GROWTH_DISCOVERABILITY_D0_G0_AUDIT.md` still mentioning an unreachable CookieConsent file is **superseded** on that point.

### 2.3 Trips, searches, feature usage

| Metric | Definition | Source / producer | Coverage | Window / TZ | Env / test / bot | Auth | Freshness | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trips created (30d) | `count(*)` from `public.trips` where `created_at >= now() - interval '30 days'` | `public.admin_reisen_kennzahlen()` in `supabase/migrations/20260817120100_reise_anlegen.sql`; UI `components/admin/home/AdminStatsStrip.tsx` label `Reisen (30T)` | From first persisted account trip. Guest drafts excluded. | Rolling 30 days via `now()`. `created_at timestamptz default now()`. **Timezone not labelled in UI.** Hosted Supabase is typically UTC; **NOT VERIFIED** as live DB `TimeZone` in this session. | No env/test/internal/bot exclusion. All statuses counted, including `draft` / `planned` / `booked` / `archived`. Local `booked` ≠ provider booking. | Function is STABLE SECURITY DEFINER, `search_path public,pg_temp`, `where public.darf_betrieb_lesen()`. EXECUTE to `authenticated` only. No row ⇒ em dash / explicit “no operating figures”, never `?? 0` (ADR-0040). Page area + home strip; capability is inside the RPC. | Request-time; no freshness object | **AVAILABLE** when a row returns | repo + **tl-live-metadata** (function shape only) |
| Trips total | `count(*)` from `public.trips` | Same RPC field `reisen_gesamt` | Same | Lifetime of remaining rows; deletes remove history | Same | Same | Same | **PARTIAL** — returned by RPC, **not displayed** on the home strip | repo + tl-live-metadata |
| Accounts with a trip (30d) | `count(distinct user_id)` in the same 30-day created_at window | `konten_mit_reise_30d` | Same | Unique-over-period, **not** sum-of-daily-uniques | Same | Same | Same | **AVAILABLE** when a row returns. **Not** registrations. **Not** unique visitors. | repo + tl-live-metadata |
| New trips / day | Daily `count(t.id)` left-joined to `generate_series` | `admin_reisen_zeitreihe(_tage)` default 14, max 90; UI 14 days | Same | `current_date` series + `created_at` half-open day. Missing day = 0 **only after a successful authorised row set**. Empty result = forbidden, not a zero curve. | Same; day boundary follows DB `current_date` | Same `darf_betrieb_lesen()` | Request-time | **AVAILABLE** when rows return | repo |
| Trip searches / feature usage | Versioned product events | No event table. Flight/hotel search is request-time domain logic (`lib/flights`, `lib/hotels/suche.ts`), not an analytics log. | none | n/a | Fixture/test ports must not feed partner metrics | n/a | n/a | **ABSENT** | repo |
| `model_usage` | Recorded model-cost rows, 30d / 200-row cap | Provider-ops snapshot | Usage ledger only | 30d | Not audience | `betrieb-lesen` | Process cache + freshness helper | **ABSENT** as audience; cost evidence only | repo |

TL production metadata (2026-09-22, project `qscbgcdmivbbnzrcyegn` ACTIVE_HEALTHY), quoted from the task, **not independently re-probed here**: `public.admin_reisen_kennzahlen` exists; returns `reisen_30d`, `reisen_gesamt`, `konten_mit_reise_30d` bigint; STABLE SECURITY DEFINER; `search_path public,pg_temp`; guarded by `public.darf_betrieb_lesen()`; counts trips by `created_at` and distinct `user_id` during rolling 30 days. **No user rows or counts were retrieved.** This proves function definition only, not caller authorization, exclusions or reporting accuracy. Not a complete Production schema PASS.

### 2.4 Coarse market / language / device / acquisition

| Metric | Definition | Source / producer | Status | Evidence |
| --- | --- | --- | --- | --- |
| Market | Documented market contract | HTML `lang="de"` only (`app/layout.tsx`). Currency default `CHF` is a trip field, not a visitor market. | **ABSENT** | repo |
| Language | User/browser language | Hard-coded page locale. No Accept-Language analytics. | **ABSENT**. Do not infer nationality. | repo |
| Device | Device class | No collection. | **ABSENT** | repo |
| Acquisition / UTM / referrer / click id | First/last touch | No UTM parser, no Acquisition-Context object (Growth D0/G0 audit; still no producer on main). | **ABSENT** | repo |

### 2.5 Provider outbound referrals

| Metric | Definition | Source / producer | Status | Evidence |
| --- | --- | --- | --- | --- |
| Outbound referral / click | User left Jetnity via a provider deeplink, with time and partner | Deeplink fields exist on normalised offers (`lib/providers/flights/domain.ts`). Skyscanner fixture adapter **rejects** non-https deeplinks and does **not** expose `affiliate` on the offer (`lib/providers/skyscanner/flights/adapter.test.ts`). **No versioned outbound click / attribution event producer exists.** | **ABSENT** as a count. Deeplink presence ≠ click. The gap is a missing event/attribution/privacy/collection contract, **not** the S5-B snapshot-writer flag. | repo |
| Affiliate provenance on a trip item | Snapshot says affiliate evidence was `unknown` / `absent` / `present` | `public.trip_item_commercial_provenance` (`20260829140000_trip_item_commercial_provenance.sql`). `affiliate_status` check + beleg. Write only via `jetnity_internal.trip_item_commercial_provenance_schreiben`. `commercial_write_runtime_gate.production_write_path_allocated` defaults **false**. No backfill. | **PARTIAL** schema; **GATED** only for that snapshot writer; **ABSENT** as referral volume | repo |

`affiliate_status='present'` means at least one of `affiliate_partner_id`, `affiliate_click_id`, `affiliate_attribution_ref` was stored on a snapshot. It does **not** prove an outbound click, a completed booking, or commission. `production_write_path_allocated` gates `trip_item_commercial_provenance_schreiben` only. A later click-event implementation hits that flag **only if** it writes this commercial snapshot.

### 2.6 Provider-confirmed bookings and commission

| Metric | Definition | Source / producer | Status | Evidence |
| --- | --- | --- | --- | --- |
| Provider-confirmed booking | Provider attestation that a booking completed | None. Local `trips.status='booked'` is user/workspace state. | **ABSENT** | repo |
| Commission pending / approved / reversed / paid | Provider or Impact/network ledger | None. No partner connector. | **ABSENT** / **GATED** (provider contract, secrets, paid calls) | repo |
| Local payments residue | Rows in `payments` / `refunds` | `GET /api/admin/payments/summary`; honest copy: no provider-backed money (`ADMIN_EHRLICHE_TEXTE.zahlungenHinweis`, #472). | **ABSENT** as revenue / commission | repo |
| Home revenue tiles | Removed | `AdminStatsStrip` no longer calls `admin_payments_summary_30d` (`lib/admin/admin-stats-strip-revenue-truth.test.ts`). | Must stay absent | repo |

A click never establishes a booking or earned commission ([#512 comment 5780510581](https://github.com/Jetnity/jetnity/pull/512#issuecomment-5780510581)).

### 2.7 Analytics surface

| Surface | Producer | Status |
| --- | --- | --- |
| `/admin/analytics` | `app/(admin)/admin/analytics/page.tsx` → `AdminFolgtSeite` “Berichte und Charts sind nicht gebaut.” Nav `kind: 'later'` (`lib/admin/navigation.ts`). | Placeholder. **ABSENT** operational analytics |
| `/admin/marketing`, `/admin/content` | Same placeholder pattern | **ABSENT** |
| Admin home strip | Trip aggregates only + `kennzahlenHinweis` / `umsatzConversionHinweis` | Honest ops tiles, **not** Growth KPIs |

---

## 3. Proposed versioned metric definitions (documentation only)

Proposed metric-contract version: **`jetnity.admin-audience-metrics.v0`** (preflight; not implemented).

| ID | Display name | Formula | Unit | Window default | Unique rule | Exclusions | Honest empty state |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `trips.created.rolling30d` | Reisen (30T) | `count(*)` trips `created_at >= now()-30d` | trips | rolling 30d from query `now()` | n/a | Guest drafts; deleted accounts (cascade). No test/bot filter today. | `0` only after authorised row; else unavailable/forbidden |
| `trips.created.total` | Reisen gesamt | `count(*)` trips | trips | lifetime of remaining rows | n/a | Same | Same |
| `accounts.with_trip.rolling30d` | Konten mit Reise (30T) | `count(distinct user_id)` in same window | auth-user ids that own a new trip | rolling 30d | unique-over-period | Not registrations; not visitors | Same |
| `trips.created.daily` | Neue Reisen je Tag | daily count, missing day = 0 **inside an authorised series** | trips / calendar day in DB `current_date` TZ | last N days, UI 14, RPC max 90 | n/a | Same | Empty series = forbidden, not zeros |
| `auth_accounts.registered` | Registrierte Konten | `count(auth.users)` | accounts | as-of | n/a | Requires new authorised aggregate; test accounts must be labelled | collection/privilege not started |
| `profiles.rows` | Profilzeilen | `count(profiles)` | profiles | as-of | n/a | ≠ auth accounts; ≠ visitors | Do not use Users `count` as this metric |
| `accounts.active` | Aktive Konten | count of accounts with a **named v1 event** | accounts | rolling30d **or** calendar month, never mixed silently | unique-over-period | `last_seen_at` is not this event | collection-not-started |
| `visitors.unique` | Unique visitors | distinct consented visit id | visit-ids, not humans | **calendar month** when used for partner admission; otherwise labelled | unique-over-period ≠ sum of daily uniques | bots/internal/Preview/test once a method exists; never claim perfect | collection-not-started |
| `referrals.outbound` | Outbound referrals | persisted click/handoff events | events | labelled | n/a | Desired later: fixtures/synthetic. **Not collected today.** | collection-not-started |
| `bookings.provider_confirmed` | Provider-confirmed bookings | provider attestation | bookings | labelled | n/a | Local `booked` is not this metric. Desired later: exclude fixtures. | gated / absent |
| `commission.{pending,approved,reversed,paid}` | Commission states | provider/network ledger | money + state | labelled | n/a | Local payments table | gated / absent |

Rules:

- Rolling 30 days and calendar month are different metrics. Do not compare them silently.
- Unique-over-period is not the sum of daily uniques.
- Deletion cannot be backfilled from these RPCs.
- Current trip RPCs implement **only** time + `darf_betrieb_lesen()` predicates. They do **not** exclude test, Preview, internal, bot or fixture-derived rows. Guest drafts are absent only because they never enter `public.trips`.
- A later **clean external partner report** must not treat those raw counts as filtered real-user volume. That is a future exclusion/provenance gate, **not** a property of today’s SQL.
- Observed zero, unavailable, forbidden and collection-not-started stay four states.

---

## 4. Minimal partner-report contract (documentation only)

Two report classes. Do not mix them:

| Class | Version (proposed) | What it may contain | Partner-ready? |
| --- | --- | --- | --- |
| **Internal raw operations** | `jetnity.admin-ops-report.v0` | Authorised trip RPC output as-is | **No** |
| **Clean external partner report** | `jetnity.partner-report.v0` | Metrics after a validated exclusion/provenance method | **GATED** until that method exists and is reviewed |

An internal report does **not** guarantee partner acceptance.

### 4.1 Required header (both classes)

| Field | Rule |
| --- | --- |
| Report class | `INTERNAL RAW OPERATIONS` or `CLEAN EXTERNAL PARTNER` — never implied |
| Date range | Explicit calendar month **or** trailing 30 days; never both under one label |
| Timezone | Named IANA zone; until verified, state `NOT VERIFIED` rather than invent UTC |
| As-of | Query timestamp |
| Metric set / version | `jetnity.admin-audience-metrics.v0` (or later) |
| Source / coverage | Producer id + first reliable coverage + known holes |
| Exclusions implemented | Only predicates the producer actually applies. Today: time window + `darf_betrieb_lesen()`. Guest drafts never persisted. Deletes cascade. |
| Exclusions **not** implemented | Test / Preview / internal / bot / fixture-derived rows. Do not list these as if they were filtered. |
| Caveats | Raw trip volume ≠ unique visitors ≠ clean audience. Partner may require **their** approved analytics evidence |

### 4.2 What can be honest **now** (internal raw operations only)

The authorised trip aggregates in §2.3 may be shown as **internal raw operations**: “how many persisted `public.trips` rows match the time predicate?” They **cannot** prove clean real-user volume. They are **not** partner-ready and **not** a clean-audience claim.

Independently fetched 2026-09-22 from https://www.partners.skyscanner.net/product/affiliates :

> The website’s traffic volume is higher than 5,000 unique visitors per month.

That is **unique visitors**, not accounts, not profiles, not raw trip counts. No partner contact or signup was performed. [#512 comment 5780349486](https://github.com/Jetnity/jetnity/pull/512#issuecomment-5780349486) already separates affiliate admission from API access.

### 4.3 What must stay unavailable / gated

Unique visitors, sessions, pageviews, returning humans, acquisition mix, device/language/market, outbound clicks, provider bookings, commission states. Missing values stay **unavailable**, not `0`.

A **clean external partner report** (filtered audience, fixture-free volume, partner CSV/PDF presented as admission evidence) stays **GATED** until an exclusion/provenance method is specified, implemented, and independently validated. Do not invent that filter in SQL from this preflight.

### 4.4 Export shape

- **First, if exported at all:** aggregate CSV labelled **`INTERNAL RAW OPERATIONS ONLY`**. One row per metric, or one row per day for the authorised trip series. Header must state exclusions **not** implemented and must **not** claim partner-ready or clean-audience.
- **Clean external partner CSV/PDF:** gated (see §4.3). Not in the smallest next slice.
- **No** real-person fields (name, email, user id, IP, trip title, destination, documents).
- **No** automatic external sending.
- Formula-injection: any text cell that could start with `=`, `+`, `-`, `@` must be prefixed (for example `'`) before CSV write. Documented only here; not implemented.
- Authorisation: same capability as the read (`betrieb-lesen` + AAL2 for trip aggregates). Export is not a second, weaker door.
- Audit: later Growth standard §30 requires an audit trail when exports are sensitive. First internal-raw CSV can reuse existing Admin gate; person-level export is a **privacy gate** and is out of scope.
- Small-group disclosure: if a later breakdown could isolate a person (for example one trip in a market), suppress or roll up. No market/device breakdown exists today.

Owner-scoped account JSON export (`lib/account/datenexport.ts`, schema `jetnity.account-export.v1`) is a **user privacy download**, not an Admin partner report. It includes `last_seen_at` and must not be reused as audience evidence.

---

## 5. Authority, privacy, export and data-quality gaps

| Gap | Why it matters | Honest next step |
| --- | --- | --- |
| Two Admin capabilities, no `analytics.read` | Trip RPCs: `betrieb-lesen` (moderator+). Users list: `konten-verwalten`. Nav hide is UX only. Break-glass opens the shell; `reachesDatabase()` is false; empty RLS ≠ zero audience. | Keep existing gates. Do not service-role around them. |
| Users `count` is filter- and RLS-scoped | Search `q` changes “Nutzer gesamt”. | Never promote to a global registration KPI. |
| No profile insert in the product | Signup ≠ profile. Users page under-counts auth accounts if profiles were never created. | If a later slice needs “accounts”, decide auth.users vs profiles **explicitly**; new aggregate RPC + Production-migration gate. |
| `last_seen_at` displayed but never written | Operators may read “—” as “never seen”. It is “never produced”. | Do not use for active accounts. Optional later: hide or label unused column (separate UX slice). |
| No visitor collection + AP6A no-tracker contract | Partner unique-visitor claims are impossible without a later legal/consent decision. | Keep collection-not-started. Do not restore a banner/SDK in the first implementation. |
| Affiliate columns ≠ commercial events | Provenance snapshot + closed S5-B snapshot writer. | Do not report clicks/bookings/commission from this table. Click collection is a separate missing event contract. |
| Local payments / `booked` status | Revenue-truth #472. | Keep unavailable. |
| No test/Preview/bot exclusion | Current trip RPCs have only time + capability predicates. Any number may include operator, test or Preview-created trips. | Label **INTERNAL RAW OPERATIONS**. Do not invent a filter. Do not call it partner-ready. |
| No freshness object on trip RPCs | Figures are “whatever this request returned”. | Label as-of = request time. |
| Deleted accounts vanish | Cascade deletes history. | No backfill claim. |
| Formula injection / person export | CSV risk if any free text later appears. | Internal-raw aggregates only; neutralize `=+@-`; no person fields. |
| Small-group risk | Not present while only global trip aggregates exist. | Gate any later breakdown. |
| #548 still unmerged | HBX fixture adapter may later land on main. | Not a current producer. Fixture rows still would not be excluded by today’s RPCs. |

---

## 6. Evidence limits

Checked in this session:

- Authorized merge of `origin/main` `8fcccd6475f41703bd2a31deecb3067391f330b4` (accepted #547/#545). Producer citations re-checked against that checkout; trip RPC SQL is unchanged (time + `darf_betrieb_lesen()` only).
- Named Admin, Auth, trip, legal, commercial and export files cited above.
- Skyscanner affiliates page (public HTTP fetch, 2026-09-22).
- #548 observed open at `2542a95b2c5de066e355a66ade920bd0846f3cea` — not used as truth; may advance main later.

Not checked / not claimed:

- No Production SQL, no user/trip/email/IP rows, no Auth-admin listing.
- TL function metadata is quoted, not re-executed.
- Live DB `TimeZone`, exclusions and reporting accuracy: **NOT VERIFIED**.
- No Vercel Analytics / Search Console / partner dashboard (none connected; no login).
- No complete Production schema PASS.

---

## 7. Collision / build-order (read-only observation)

| Item | Fit |
| --- | --- |
| Growth / Admin Marketing standard | Reuse M0 “contracts & read-only foundation”, data-quality and privacy/export rules. Do not start M1–M6. |
| Remaining-build-map | Admin J Analytics / SEO is `DELIBERATELY_LATER` / indexing-gated. M0–M6 Growth OS is later. This preflight does **not** reorder V1. |
| V1 binding build order | Full Admin D–K / Growth Control Plane is explicitly not V1-critical. |
| #545 / #547 | Accepted and present on authorized main `8fcccd64`. Navigation search / indexing configuration. Not audience producers. |
| #548 | Open; next integration candidate; may advance main. Not this owner. Not a visitor/trip-aggregate producer. |
| Special gates that would apply to **later** collection or vendor work | Legal/consent/tracker; public launch/indexing; provider contracts/secrets/paid calls; Production migration; payments/money; spend &gt; budget; sensitive export. Clean external partner report additionally needs a validated exclusion/provenance method. Click collection needs an event/attribution/privacy contract; S5-B only if that design writes the commercial snapshot. |

Canonical requirement text: [#512 comment 5780510581](https://github.com/Jetnity/jetnity/pull/512#issuecomment-5780510581). This matrix is the inventory step. It does not implement Analytics views.
