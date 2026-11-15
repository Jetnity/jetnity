# Admin and product delivery plan — 15 to 30 November 2026

## Basis and scope

Prepared from fresh GitHub metadata and `main@63544e820e912bd275556588c956a09b99b1cf90`. Dates are planning estimates for Development delivery, not commitments to a Production launch. Sasa retains merges, Production, new costs and login/2FA. The separate Hauptplan 83 lane owns #1196/#1197/#1198 and all their files.

## Delivery sequence

| Window | Work | Definition of a useful result |
| --- | --- | --- |
| 15–20 November | Admin core | Actual Analytics travel report, explicit snapshot/refresh semantics, reliable denied/error states, bounded follow-up for local finance integrity and Dev account-count evidence. |
| 21–25 November | Existing product journeys | Trace create → multi-stop plan → search → provider handoff → save/reopen in Dev. Inspect provider parameter correctness and reported gaps. Respect #1198 ownership; test its combined integration only after the owner lane provides it. |
| 26–30 November | Consolidated acceptance | Mobile/desktop/keyboard, guest/account, transient failure, empty and unavailable states; fix collected regressions in coherent batches and prepare reviewable releases. |

The goal is a dependable Admin core and existing travel core in Dev. Fully autonomous Copilot Pro, a complete Ads/CRM/Bexio platform, live payment processing, full multilingual operations, collaboration, and universal live travel inventory are not credible unconditional November commitments.

## Verified Admin baseline and remaining work

- User directory, role/status filtering, pagination and confirmed mutations exist. Do not restart the superseded #40 audit as a new implementation.
- System Health, provider/cost views, local security events/blocklist and deterministic analyst hints exist. External Vercel/GitHub/Infomaniak management feeds are not configured by the code; absence is not healthy status.
- `/admin/analytics`, `/admin/content`, `/admin/marketing`, `/admin/settings`, `/admin/localization` are still placeholders at this baseline. Analytics is the first implementation because useful authorized aggregate sources already exist.
- Home KPI/analyst panels are render-time snapshots. Make refresh and age visible before describing this as a continuous control center.
- Payments are local records, not verified revenue or a connected processor. Overview/list/webhook readers retain previous records after denied refresh; repair this first.
- Refund notes write before the later read/status update and lack an atomic/idempotent transaction. Address separately with a reviewed database contract before finance activation; do not silently retry ambiguous writes.
- Registered-account counts are intentionally local-only in `lib/admin/account-counts-delivery/activation.ts`; hosted Dev admission is separate work.
- Copilot Pro currently provides deterministic read-only hints, not autonomous operational execution.

## Existing product features — avoid duplicate work

| Feature | Actual code/PR evidence | Remaining check |
| --- | --- | --- |
| Multi-stop trip and day plan | #1181 merged; `TripWorkspacePlan.tsx`, `reiseplan/Etappenplan.tsx`, `reiseplan/Etappenkarte.tsx` | Combined mobile/save/reload and transition-date acceptance. The interactive Leaflet/Natural-Earth map already exists. |
| Private UX train | #1198 is an open reserved draft containing shared calendars, category-search retention, city images, saved offers and plan adoption | Owner-lane integration and then combined acceptance; do not build competing versions. |
| Hotel search | Stay22 #1185 merged | Children/room context and final provider handoff semantics; no proven same-room universal best-price guarantee. |
| Flight comparison | Travelpayouts #1187 merged | Reported `citizenship=RU` alongside `market_code=CH` needs tariff-impact clarification; never infer the user's nationality from the widget parameter. |
| Car rental | Native DiscoverCars #1109 merged | Context, final total, consent and outbound booking checks. Old widget #1084 may be superseded. |
| Activities | Viator/GetYourGuide widgets #1100 merged | Widget error/empty/provider handoff checks. Native Viator Production source remains closed in `produktion.ts`. Widgets do not provide a general internal item-data API. |
| Connections | Omio #1176 and native general 12Go timetable views | Distinguish catalog/general schedules from date-specific confirmed bookability; reconcile old #1086 before continuing it. |
| Account/Meine Welt | Trips, traveller registry, world atlas and export code exist | Authenticated Dev save/reopen/export acceptance within the owner's login/2FA boundary. |
| Separate Google Maps variant | `lib/maps/config.ts` source gate is false; #1118 | Explicit pilot/cost/consent constraints if still desired. This is not a missing base trip map. |
| Discover/collaboration | Four curated destination pages; old collaboration foundation #28 still open | Curated expansion can follow core acceptance. No complete trends/social/collaboration claim. |

## Entry interface

The complete customer-visible category/evidence requirement is recorded in `ADMIN_OPERATIONS_COMPLETION_2026-11-15.md`. It is a binding future Admin coverage requirement, not an assignment to modify Official Truth in this lane.

## References

- [Live main at reconstruction](https://github.com/Jetnity/jetnity/tree/63544e820e912bd275556588c956a09b99b1cf90).
- [Reserved UX PR #1198](https://github.com/Jetnity/jetnity/pull/1198).
- [Trip plan #1181](https://github.com/Jetnity/jetnity/pull/1181), [Stay22 #1185](https://github.com/Jetnity/jetnity/pull/1185), [Travelpayouts #1187](https://github.com/Jetnity/jetnity/pull/1187).
- [Native DiscoverCars #1109](https://github.com/Jetnity/jetnity/pull/1109), [activity widgets #1100](https://github.com/Jetnity/jetnity/pull/1100), [Omio #1176](https://github.com/Jetnity/jetnity/pull/1176).
- Existing Admin SQL: `supabase/migrations/20260817120100_reise_anlegen.sql`; existing read and UI contracts: `lib/api/datenbank-lesen.ts`, `lib/admin/ladezustand.ts`.
