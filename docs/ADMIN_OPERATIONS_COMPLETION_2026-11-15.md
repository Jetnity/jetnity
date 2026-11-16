# Admin operations completion — task and parallel-lane contract

## Authority and baseline

- Product Owner instruction, 15 November 2026 (Europe/Zurich): complete the remaining Jetnity product functions, starting with Admin; autonomous necessary Development work, document changes, batch corrections and inspect all failures in a failed test run.
- Production, merges, new costs and login/2FA remain with the Product Owner. No external messages, provider activation or paid calls are part of this package.
- Independent lane beside Hauptplan 83. **PRs #1196, #1197 and #1198, their branches and all their changed files are reserved.** #1198 currently contains private travel UX; this lane reserves it regardless of its title.
- Fresh baseline: `main@63544e820e912bd275556588c956a09b99b1cf90`; operating mode `NORMAL`.
- Branch: `feat/admin-operations-completion-20261115`.
- Single writer: ChatGPT Technical Lead, session `/root`. Preparatory readers `/root/admin_audit` and `/root/product_audit` made no changes. Later reviews stay read-only.
- Current instruction permits this parallel product lane; the older CH-DE-only priority does not assign Official Truth work to this lane.

## First bounded delivery

Replace the Analytics placeholder with an actual read-only travel-activity report, make the home snapshot explicitly refreshable, and fix the payment read surfaces so denied or obsolete responses cannot retain or restore protected data.

### Allowed implementation scope

- `app/(admin)/admin/analytics/page.tsx` and `app/(admin)/admin/page.tsx`.
- New Analytics model/reader/presentation files under `lib/admin/analytics/` and `components/admin/analytics/`.
- A small refresh/moment-in-time component under `components/admin/`.
- `components/admin/payments/PaymentsCenter.tsx`, narrowly scoped payment read helpers/tests, and the shared read-error contract only if required to preserve HTTP denial information.
- Admin navigation entries/search aliases and directly affected tests.
- Focused browser proof using synthetic aggregates and existing dependencies, plus this package's dedicated documentation.

### Reserved files and systems

No edits to Official Truth, `lib/readiness/`, `components/readiness/`, Admin Official Truth pages or API routes, the protected PRs' filenames, shared Auth/session/MFA logic, database migrations, `types/supabase.ts`, workflows, package/lock files, `tsconfig.json`, Supabase/Vercel configuration, or global `ARCHITECTURE.md`, `DECISIONS.md`, `ROADMAP.md` (currently owned by #1197). Use these dedicated documents for the parallel lane's plan and decisions.

No new API endpoint, database permission, service-role access, external provider, model call, scheduler or cost. No refund mutation changes in this first batch. No hosted installation, login, merge, Ready transition or Production activity.

## Acceptance criteria

1. `/admin/analytics` reads only existing `admin_reisen_kennzahlen()` and `admin_reisen_zeitreihe(_tage)` aggregates through the existing authenticated server client and `betrieb-lesen` guard. Never read private trip rows to construct Admin analytics.
2. Show actual total trips, trips created in the rolling 30-day window, and accounts with a trip in that window. Do not relabel these as registered users, visitors, active users, revenue or conversion.
3. Offer 7/30/90 calendar-day time-series ranges. Keep the rolling 30-day KPI definition separate from the calendar-day chart; a chart range does not silently redefine the KPI period. Explain source day boundaries without guessing a timezone.
4. Require valid, bounded nonnegative integer counts and valid unique ordered calendar dates. Missing rows, malformed data or failed queries are unavailable/error, never a fabricated zero. An explicitly supplied zero is valid. Separate partial-source failures rather than suppressing the valid source.
5. Show observation time and a manual full refresh. Source values remain a snapshot; refresh does not claim continuous monitoring. No hidden polling or additional cost.
6. Chart plus accessible exact daily values; narrow 320/390px and desktop layouts, keyboard access, no clipped primary actions. No new dependency.
7. Payment overview, transactions and webhook reads clear protected previous data on HTTP 401/403, invalidate pending results and stop stale responses from repopulating it. Transient failures may keep a clearly marked previous snapshot. Respect filter/cursor identity and unmount.
8. Make the new report reachable in Admin navigation/search only for the existing eligible roles. Navigation is a UX filter, never the authorization boundary.
9. Focused parser/reader/error and interaction tests, TypeScript, lint, hygiene checks and build. Record every failed gate and fix the batch together. No changes to unrelated Official Truth tests or gates to obtain green.
10. Independent review on the resulting exact head. Draft remains Draft, do not mark Ready, do not merge; no unapproved follow-up by readers.

## Risks and decisions

- Existing aggregates return zero rows when capability is absent. That is not an empty successful business report. The read model must retain this distinction.
- `admin_reisen_kennzahlen` uses a rolling 30-day window; the series uses the database's calendar-day boundary including today. They are separately read statements, not one transactional instant; do not promise equality.
- New navigation might alter exact historical assertions. Update only tests whose contract intentionally changes.
- Existing local refund notes are not atomic/idempotent; this remains a separate bounded Admin follow-up before finance activation. No real payment processor is connected.
- Registered-account statistics remain local-only. Do not silently open their hosted activation gate.
- No production-read or authenticated hosted E2E is implied by synthetic browser evidence.

## Entry-information interface requirement

The Product Owner requires the following to be visible from the first customer-facing version: visa, ETA, passport validity, vaccinations, health, forms with costs and scam warnings, fees, return/onward ticket, transit, children, customs, special cases, source and observation date, explanatory notice and official link. Existing detailed requirements such as blank passport pages and proof of funds remain relevant where applicable.

For any later Admin coverage/review screen, every required category must be represented explicitly with its own known/unknown/not-applicable/checking state and evidence. A visa-only proof must never produce an overall complete/cleared entry status. Unknown is not "not required"; an official link alone does not establish applicability, price or freshness. Display and model implementation stay with the Official Truth owner; this package neither changes its contracts nor imports research records.

## Verification and handoff

See the adjacent `ADMIN_PRODUCT_DELIVERY_PLAN_2026-11-15.md` for the wider backlog and realistic sequencing. Record exact changes, test results, limitations and next steps in a dedicated handoff after implementation. GitHub PR/CI and later receipts determine the current live state; this document is the versioned task, not a release certificate.
