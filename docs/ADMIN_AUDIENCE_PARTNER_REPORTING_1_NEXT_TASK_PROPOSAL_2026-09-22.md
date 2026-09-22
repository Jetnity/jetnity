# Admin Audience & Partner Reporting — Smallest Next Implementation Task PROPOSAL

Date: 2026-09-22  
Agent: **Jetnity admin audience partner reporting preflight 1**, Generation 1  
Session: `bc-ea4a0209-f139-4b47-8943-16ddf78e4270`  
Source matrix: `docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_SOURCE_MATRIX_2026-09-22.md`  
Status: **PROPOSAL ONLY / R1+R2 CORRECTED / NOT DISPATCHED / DO NOT IMPLEMENT FROM THIS PREFLIGHT**

This is the smallest independently useful implementation after the inventory. It is not a Growth OS, not an analytics vendor decision, not public indexing, and not a V1 phase reorder. Technical Lead may accept, narrow, or reject it after independent review.

---

## 1. Proposed slice

**Name:** Jetnity admin audience truth overview 1  
**Class:** read-only Admin honesty slice on **existing** measures  
**Why this, not a universal event platform:** the only AVAILABLE audience-adjacent numbers on main are trip aggregates. Unique visitors, sessions, pageviews, active accounts, outbound clicks, bookings and commission have **no producer**. Building a tracker now would cross AP6A / consent / legal gates and still could not backfill history. The Product-Owner need is reliable Admin figures and, later, partner-ready reports. The first slice can only make **internal raw operations** honest: show the RPC output and refuse clean-audience or partner-ready labels.

**Does not replace** `/admin/analytics` with fake charts. Prefer a bounded overview that can live on Admin home and/or a non-placeholder Analytics page **without** claiming Growth M0–M6 is built.

---

## 2. In scope (proposed)

1. Versioned metric ids from the source matrix (`jetnity.admin-audience-metrics.v0`) wired as **display contracts**, not a new event bus.
2. Read-only reuse of:
   - `admin_reisen_kennzahlen()` → `trips.created.rolling30d`, `accounts.with_trip.rolling30d`, optionally `trips.created.total` (already returned, currently hidden);
   - `admin_reisen_zeitreihe(n)` → `trips.created.daily`.
3. Explicit tiles/rows for the partner-relevant **unavailable** metrics: unique visitors, sessions, pageviews, registered accounts, active accounts, outbound referrals, provider-confirmed bookings, commission states. Each uses collection-not-started / gated / unavailable — **never `0`**.
4. Visible window, as-of (request time), definition version, and the existing honest copy (`kennzahlenHinweis`, `umsatzConversionHinweis`). Label timezone as `NOT VERIFIED` until a later DB/read confirms it.
5. Optional **INTERNAL RAW OPERATIONS** aggregate CSV of the authorised trip metrics + daily series. Header must state exclusions **not** implemented (test/Preview/internal/bot/fixture). **No** partner-ready or clean-audience claim. Formula-injection neutralization. Same `betrieb-lesen` + AAL2 gate. No person fields. No email send. Alternatively the later task may omit CSV entirely.
6. Tests that lock the honesty rules (see §6).
7. Named docs/status for that later slice only.

---

## 3. Out of scope (hard)

- Tracking SDK, consent banner, UTM parser, fingerprinting, visitor-id cookies.
- New analytics vendor, partner signup, Impact/Skyscanner contact, secrets, paid calls.
- Service-role or Auth-admin listing of `auth.users`.
- New `analytics.read` capability unless TL later decides a shared-auth slice (not required to reuse `betrieb-lesen`).
- SQL/migration **unless** TL separately accepts a profile/auth aggregate (see §5). The smallest slice should **not** need a migration.
- Using Users-page `count`, `profiles.created_at`, or `last_seen_at` as audience / active / registration.
- Treating `account_visits` as web visits.
- Treating `trips.status='booked'`, local payments, or `affiliate_status` as booking/commission.
- Inventing a test/Preview/bot/fixture SQL filter, or labelling raw RPC output as partner-ready / clean audience.
- Editing #548 HBX, merged #545/#547 owned files, or global roadmap/start/handoff files from that writer without a new task.
- Public indexing, launch gate, Growth M1–M6, Copilot execute, Ads, Bexio.
- Implementing this proposal from PR #549.

---

## 4. Proposed owned paths (later writer only)

Reuse, do not fork:

- `components/admin/home/AdminStatsStrip.tsx`
- `components/admin/home/AdminTimeSeries.tsx`
- `app/(admin)/admin/analytics/page.tsx` (today `AdminFolgtSeite`)
- `lib/admin/ehrliche-zustaende.ts` (additive honest strings only)
- `lib/admin/ladezustand.ts` / `lib/api/datenbank-lesen.ts` (existing empty-vs-error)
- Existing RPCs `admin_reisen_kennzahlen` / `admin_reisen_zeitreihe` — **no definition change** in the first slice

Likely new (keep small):

- `lib/admin/audience-metrics/` — versioned ids, labels, unavailable states, CSV builder
- `lib/admin/audience-metrics/*.test.ts`
- `components/admin/audience/` — read-only overview + optional download control
- `docs/ADMIN_AUDIENCE_TRUTH_OVERVIEW_1_*` (task/status/handoff/self-review) when TL versions a task

Do not add `app/`, `lib/`, `components/` or SQL from **this** preflight.

---

## 5. Named prerequisites / gates — do **not** bypass

| Need | Prerequisite | Gate |
| --- | --- | --- |
| Show current trip tiles honestly | None beyond existing `betrieb-lesen` + AAL2 | None new |
| Show unique visitors | First-party collection **or** an authorised external analytics connector **plus** documented exclusions | Legal/consent/tracker; possibly public-indexing/launch; cost if vendor; **Product-Owner** |
| Show registered accounts | New SECURITY DEFINER aggregate over a permitted source, **or** an explicit Product decision that `profiles` rows are the published “account” metric | Production migration / RLS/grant review; **do not** use service role. Auth-admin API is a new privilege. |
| Show active accounts | A named, versioned event with a real writer. `last_seen_at` is **not** that writer. | Same as event collection; not a silent column backfill |
| Show outbound referrals | A versioned click/handoff **event and attribution producer** with purpose, authorization, privacy and collection contract. No such producer exists. | Legal/consent/privacy/collection. **S5-B `production_write_path_allocated` applies only if** that design writes `trip_item_commercial_provenance` via `trip_item_commercial_provenance_schreiben`. It is not a blanket click-collection gate. |
| Show bookings / commission | Provider-confirmed ledger | Provider contract, secrets, paid/live calls, money-adjacent reconciliation |
| Clean external partner CSV/PDF | Validated exclusion/provenance method **plus** the metric producers those partners require (usually unique visitors, not raw trips) | Not first slice. Do not ship raw trip CSV as that report. |
| Partner acceptance | Partner’s own evidence rules | Internal raw CSV never guarantees Skyscanner/Impact admission |

If the Technical Lead later wants “accounts” in the **same** first slice, that **is no longer the smallest slice**: it needs an explicit definition (auth.users vs profiles), a new aggregate RPC, and a Production-migration Product-Owner gate. Prefer shipping unavailable-account tiles first.

---

## 6. Acceptance criteria (for the later task)

A later writer has succeeded only if all of the following are true:

1. Authorised `betrieb-lesen` + AAL2 session sees trip metrics with version ids, window, as-of, and existing honest revenue caveat.
2. Denied / break-glass / RPC error / missing row never renders `0` for those tiles (ADR-0040 preserved).
3. Unique visitors, sessions, pageviews, registrations, active accounts, referrals, bookings and commission are visible as **unavailable / collection-not-started / gated**, not as zero and not as profile counts.
4. Users-page count and `last_seen_at` are not referenced as sources.
5. If CSV exists: labelled **INTERNAL RAW OPERATIONS ONLY**; exclusions-not-implemented listed; no partner-ready/clean-audience wording; aggregates only; injection-safe; no person fields; same page gate.
6. No tracker, consent banner, vendor SDK, migration, service role, sibling-file edit, or partner contact.
7. Typecheck / lint / build / relevant unit tests green. Docs-only honesty tests are required; no manufactured E2E “traffic”.
8. Exact-head CI / Auth / Preview recorded. Draft until independent TL PASS. Cursor does not Ready or merge.

---

## 7. Meaningful tests (proposed)

| ID | Assertion |
| --- | --- |
| T-trip-rpc-reuse | Overview calls only `admin_reisen_kennzahlen` / `admin_reisen_zeitreihe` for numeric trip tiles |
| T-no-zero-on-deny | Missing row / error / forbidden → `–` or typed unavailable, never `0` |
| T-unavailable-visitors | Unique visitors tile copy matches collection-not-started; no numeric fallback |
| T-no-users-count | Source module does not read `profiles` count or `last_seen_at` |
| T-no-last-seen-active | `accounts.active` cannot be derived from `last_seen_at` |
| T-no-affiliate-as-booking | Commercial provenance / payments / `booked` status are not mapped to booking or commission |
| T-no-tracker | Existing AP6A inventory tests still pass; no new tracker package |
| T-csv-aggregates-only | CSV columns allowlisted; no email/user_id/ip/title |
| T-csv-internal-raw | CSV/title/header contain `INTERNAL RAW OPERATIONS`; do not match partner-ready / clean-audience / exclusions-implemented |
| T-csv-injection | Values starting `= + - @` are prefixed |
| T-nav-kind | If Analytics page is used, it is no longer an empty “folgt” lie **or** it stays later and the overview lives on home — pick one in the versioned task; do not show both “folgt” and live numbers |

Hydrated UI checks only for the new overview states (authorised numbers vs unavailable vs denied). No browser claim of Production audience.

---

## 8. Collision, build-order, special gates

| Question | Answer |
| --- | --- |
| V1 reorder? | **No.** Remaining-build-map keeps Admin J / Growth M0–M6 later. This slice is honesty over existing A–C tiles, not the Growth OS. |
| Collision with #545 / #547 / #548? | #545/#547 are on authorized main `8fcccd64` (nav search / indexing). Later writer must not reopen those files without a new task. #548 remains open and may advance main. Do not merge the #548 branch here. |
| Shared contracts? | Reuse ADR-0040 empty-vs-error, Admin AAL2, AP6A no-tracker, #472 revenue truth. Do not silently introduce `analytics.read`. Do not treat S5-B as the click-collection gate. |
| Special Product-Owner gates in **this** smallest slice? | None if it is display + optional **internal-raw** CSV on existing RPCs, with the raw label. |
| Gates if the slice grows? | Legal/consent/tracker; Production migration; provider/secrets/paid; public launch/indexing; money movement; spend. |
| Multi-agent? | One writer. Inventory is done. Implementation is a single honesty surface. |

---

## 9. Later event-collection gap list (not an accepted architecture)

Bound the later holes. This list is **not** a tracking design and not a vendor choice.

1. Legal/consent purpose texts and whether any non-essential measurement is allowed (AP6A currently: no).
2. Visit identifier, expiry, and **no** fingerprinting / no silent anonymous→account stitch.
3. Bot / Preview / internal / test exclusion method (never claim perfect).
4. Calendar-month unique vs rolling 30d unique vs sum-of-daily-uniques.
5. Timezone authority for “month”.
6. Named activation and active-account events (product, not pageview-only).
7. Search / feature events if product usage is required.
8. Outbound click / attribution: missing versioned event producer (purpose, authorization, privacy, collection). **S5-B applies only if** the chosen design writes the commercial snapshot.
9. Provider booking and commission reconciliation **after** a real partner ledger exists.
10. Historical backfill: **impossible** for visitors before collection starts; do not invent it.
11. Clean external partner report: exclusion/provenance method still unspecified; do not pretend current RPCs implement it.

Stop. Do not start this slice from PR #549.
