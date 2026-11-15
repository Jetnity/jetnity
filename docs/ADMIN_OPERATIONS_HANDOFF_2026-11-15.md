# Admin operations completion — implementation handoff

## Status and ownership

This is the first bounded Admin package in [Draft PR #1199](https://github.com/Jetnity/jetnity/pull/1199), based on `main@63544e820e912bd275556588c956a09b99b1cf90`. Sasa requested autonomous Development work; merges, Production, new costs and login/2FA remain with Sasa. The PR remains Draft.

The implementation and local verification below are complete. Mounted-browser proof and the full repository CI must pass on the published implementation head before this package can be described as verified. A synthetic component test does not establish authenticated hosted access or real-device acceptance.

The current changed-file lists of #1196, #1197 and #1198 were checked against this package: no overlap. Those PRs and their files remain owned by Hauptplan 83. Global architecture/decision/roadmap documents are reserved there; this lane uses its dedicated task, delivery plan and handoff instead.

## Changes

### Reiseauswertung

- Replaced `/admin/analytics`' placeholder with a report of stored trips, trips created in the rolling last 30 days, and accounts with a new trip in that window.
- Read only the existing authenticated `admin_reisen_kennzahlen` and `admin_reisen_zeitreihe` RPCs after the existing `betrieb-lesen` page guard. No private trip rows are returned to the report.
- Added 7/30/90-calendar-day selection, a compact chart and an accessible exact-value table. Large counts, narrow screens and enlarged text are included in the browser proof.
- Validate counts, complete consecutive calendar dates, ordering and safe numeric sums. Missing, malformed and failed sources stay distinct from confirmed zero; one failed source does not hide the other.
- Explain rolling versus calendar windows, separate source reads, source day boundaries, the incomplete current day, excluded device-only guest trips and deleted trips. No revenue, conversion or total-account claim is derived from travel counts.
- Added the report to the existing capability-filtered navigation and search.

### Snapshot and payment read lifecycle

- Admin home and Analytics show observation time and an explicit full-page refresh. Refresh reruns the existing server access guard; no polling was added.
- Payment overview, transactions and webhook views use abort/generation guards. Superseded or unmounted requests cannot replace current state.
- A current HTTP 401/403 clears the entire payment view immediately when headers arrive, including when the response body stalls. The denial remains latched until a full session/page recheck.
- Temporary failures can retain an explicitly marked older snapshot. Transaction pagination preserves the committed filter; webhook refresh replaces accumulated rows and resets its cursor.
- Refund mutation behavior is unchanged in this package. Its previously identified atomicity/idempotency gap remains a separate follow-up before finance activation.

## Verification record

Local runtime: Node `22.23.5`, existing locked dependencies, no package/lock/workflow/config changes.

| Check | Result / limit |
| --- | --- |
| Focused Admin unit suite | **349 passed, 0 failed, 0 skipped.** The first run collected two obsolete navigation expectations; both were updated together, then the full focused suite passed. |
| TypeScript | Passed. An initial run exposed the test harness's missing global type declaration; a type-only import fixed all affected browser-test errors together. |
| Full lint | Passed with 193 pre-existing warnings and no errors. No new dependency or lint-rule exception. |
| Setup check | `node --import tsx check-jetnity-setup.ts --ci` passed. No `.env` file is present; no credentials were requested or used. |
| Build | Direct `node node_modules/next/dist/bin/next build` completed successfully, including TypeScript, static generation and the complete route table. |
| API protection / schema reference | Passed. |
| Dead files / exports / dependencies | Passed. |
| Diff formatting / reserved paths | Passed; zero overlap with the three protected PRs. |
| Independent source reviews | Analytics parsing/reading: 14 checks passed. Payment hook lifecycle: 8 controlled checks passed. Neither is claimed as mounted DOM proof. Reviews found mobile wrapping/button-height concerns and an insufficient refresh assertion; these were corrected together before publication. The refresh proof now requires a new document instance. |
| Mounted component tests | Added 14 browser cases to the existing core-CI discovery path. Actual production components, actual project CSS, React StrictMode and synthetic responses; no provider, account or payment operation. Execution is delegated to normal GitHub CI because local Chromium startup is blocked. |

The ordinary `npm run build` prebuild and `npm run check:setup:ci` wrappers failed locally because the `tsx` CLI tries to create a prohibited IPC socket (`EPERM`). The same setup script was then run through Node's supported import entry point, followed by the direct Next build; both completed. The local Chromium attempt also failed at an OS-prohibited socket and was not retried. Native PostgreSQL tests were not started locally after the known environment restriction; the existing full CI remains the verification path.

### Browser acceptance cases

1. Analytics at 320, 390 and 1280px, including 200% text, the largest safe count, keyboard range navigation, exact daily values and refresh retaining the selected range.
2. Unavailable source versus partial failure, with no fabricated zero.
3. Each payment read surface receiving 401 and 403 after displaying data, with a stalled body: records and tabs disappear and full session recheck works.
4. A late older response after a newer denial cannot restore private data.
5. An unmounted card's denial cannot replace the current card; transient failure marks retained values.
6. Webhook pagination followed by refresh replaces rows and uses the new cursor.
7. Editing a transaction search field does not silently change the filter of the next page; applying the filter resets pagination.

## Database, security and costs

No migration, schema, RLS, service-role access, endpoint, shared authentication, provider configuration, production deployment, scheduler or paid service was added or changed. Existing authenticated aggregate permissions remain the data boundary. Navigation filtering is only a usability feature, not authorization. No real payment processor or new money movement is introduced.

## Remaining work and next boundary

- Wait for all existing CI jobs on the published implementation head, collect every failure, and fix relevant failures as one batch. Do not edit Official Truth tests or gates to obtain green.
- Perform the final independent review against that head. Record live CI/review results in the PR; this document is not a self-issued release certificate.
- Authenticated hosted Admin and real-device acceptance remain unproven; use the existing Dev access after the owner supplies a session. No login/2FA action is delegated.
- Four Admin placeholders remain: Content, Marketing, Settings and Localization. Registered-account statistics retain their existing local-only activation gate. Deterministic Copilot hints do not constitute operational automation.
- The next bounded Admin work is finance-record integrity and the useful existing configuration/status surfaces; it must not activate a live payment processor or external service.
- Continue the existing product journeys and consolidated acceptance in the [15–30 November delivery plan](ADMIN_PRODUCT_DELIVERY_PLAN_2026-11-15.md). The complete entry-information category requirement remains in the [versioned task](ADMIN_OPERATIONS_COMPLETION_2026-11-15.md), with implementation owned by Hauptplan 83.

No Ready transition or merge is authorized by this handoff.
