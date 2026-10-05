# Trip Workspace manual stay dates completion 1 — Report

Status: implementation complete; **Draft / independent exact-head review required**.
Evidence collected 2026-10-04 UTC / 2026-10-05 Europe/Zurich. Issue #832, PR #833; Generation 1, sole implementation writer.

## Authority and live reconciliation

- Branch: `fix/trip-workspace-manual-stay-dates-1`.
- Baseline and freshly fetched main: `85a53346a87b6175f9e0ffad9901ff6bd45a2654`; merge-base equals baseline; mode `NORMAL`.
- Immutable task seed: `982b791e3fbd09676a19bf7ae5293a7879dbe221`. The implementation is one additional commit on that seed; final commit SHA and remote CI/Preview receipts are recorded in the PR delivery body, avoiding a self-referential commit hash in this file.
- Task remains byte-identical: Git blob `b6cd1c3a3b7fdaa519b4ce8bac48d5e31bcd5127`; SHA-256 `029a3a43f51807d707aacf14874ae0b2ff19f15bea834477cc5e9b6792f9dd9c`.
- Startup read START_HERE, operating mode, Technical-Lead Operating Standard, binding task, #832/#833, #751 and relevant #748 evidence. Inspected the named workspace/stay/account/guest code and tests before implementation.
- Latest #751 names this writer A and newly dispatched writer B #834 / Draft #835. Read the latter task's allowed files: readiness/catalog/migration surfaces are disjoint from this Workspace slice. No second writer or Cursor agent was started here.
- #748 comments after marker `5984004655`: receipts `5984167839` and `5985154235` read. The latter requires separately gated Official Truth exact-host/profile hardening; no B03a dependency or blocker was found. Its residuals and reserved gates remain open. Hosted state described there is another actor's evidence, not a database read by this writer.
- PR #833 is open/Draft; no inline review threads at pre-delivery read. Final readback is recorded with the PR receipt.
- Actual Codex Desktop `turn_context` metadata for session `01a108ff-d172-79b1-8b92-0450dcb96132` at `2026-10-04T22:19:06.908Z` and `2026-10-04T22:33:16.027Z` reports `model=gpt-6-astra`, `effort=xhigh`; collaboration settings agree. This is observed metadata, not only the requested model label. Sanitized evidence is in the local delivery archive.

## Result and boundaries

Manual stays now expose Check-in / Check-out and an explicit date editor in the existing Unterkunft surface. Invalid/incomplete dates show **Zeitraum ergänzen**; valid dates show **Zeitraum ändern**. Existing values are prefilled, missing values stay empty, and typing never saves. Booking stays a separate action.

The one new pure helper `istManuelleUnterkunft` is consumed by UI, account and guest. It accepts only `kind === 'stay'` with `provider`, `externalRef` and `bookingUrl` each null/undefined. Even empty strings and unexpected identity values fail closed. Booking status/source, price, note and time fields do not determine eligibility; a user-booked manual stay remains editable.

The shared `unterkunftZeitraumSchema` reuses the existing strict ISO calendar-day validator and requires both dates and `endsOn > startsOn`. It rejects equal/reversed dates, impossible calendar days, missing values, timestamps, whitespace and other formats. No title/note/trip/day/stage/provider-derived default, time-zone transformation or reassignment was added. Existing persisted Trip schema and DB schema were not changed.

## Account write proof

`unterkunftZeitraumSetzen(unknown)` validates identifiers and dates before auth/DB work, calls the existing `konto()`, and exact-reads `trip_items` with both `id=itemId` and `trip_id=tripId`. Missing, foreign, non-stay and any provider/commercial identity fail before update. Existing authenticated client and RLS remain ownership authority; no service role is introduced.

The complete update object is exactly:

```ts
{ starts_on: zeitraum.data.startsOn, ends_on: zeitraum.data.endsOn }
```

The update also repeats exact item/trip filters plus `kind=stay` and SQL-null checks for provider/external_ref/booking_url. A concurrent conversion to a provider item or deletion therefore cannot pass the earlier pre-read and then receive a date write. The action selects only the returned id and requires an actual row before success/revalidation. Existing `meldungAus` sanitizes DB failures. Only successful writes revalidate the trip and `/reisen`; the account wrapper then refreshes the canonical server graph.

Tests execute the actual action with auth/framework/transport seams replaced. They assert the complete pre-read, all filters, exactly one update, exact two-key payload even with forged extra input fields, sanitization, success-only revalidation, and concurrent deletion/identity changes. They do not certify a live hosted RLS transaction. Existing SELECT/UPDATE ownership policy and commercial-trigger definitions were inspected without changing them.

## Guest and coverage proof

`gastUnterkunftZeitraumSetzen` finds the exact id across day items and `ohneTag`, requires exactly one match, validates the same date/predicate rules and replaces only the two date fields. Existing `punktErsetzen` and `gastreiseSpeichern` retain revision, full-graph schema validation, local persistence and readback behavior. The returned persisted graph is placed directly into guest workspace state.

Tests compare the entire input and expected persisted graph for both day and unassigned items: every sibling and every other target field, including stage/day/position, title/note, price, times and booking metadata, survives. Input is not mutated; the saved JSON re-parses and reloads. Missing/duplicate ids, non-stay, provider/ref/url, bad dates, invalid final graph and storage failure reject.

Actual guest persistence followed by unchanged `unterkunftAbdeckung` and `bereichStatus` proves unknown -> partial (6/14) -> full (14/14) -> outside-trip (0/14). Booking alone cannot create nights. Browser proof independently covers unknown -> 2/4 -> 4/4 -> outside 0/4. No coverage algorithm or status rule was changed.

## UI proof

Actual component render/submit tests verify native date inputs, associated labels, correct prefills, blocked invalid submission, exact `(itemId, startsOn, endsOn)` callback, success closure and status, retained input after errors, cancellation and separate booking action. Actual account/guest wrapper tests verify refresh/state handoff; TripWorkspace forwards the same bounded callback.

A local Chrome/Playwright harness rendered the real React component with real repository Tailwind styles, guest persistence/localStorage and coverage functions. It verified keyboard open/tab/cancel/focus return, errors and thrown exceptions, pending controls, double-submit lock, provider/ref/url exclusions and the above coverage changes. Viewports: 280, 320, 360, 375, 390, 430, 768 and 1280 pixels wide, plus 844x390 and 667x375 landscape. No horizontal overflow or clipped controls; date inputs at least 44px high. 320px with 200% text also has no horizontal overflow; no page errors.

Scope of visual proof: synthetic fixture in a local file, HTTP(S) blocked; not a logged-in hosted workspace test and not a physical-device/Safari audit. Harness source, structured results and screenshots are supplied in the local evidence archive. The harness remains outside the repository.

## Validation

| Gate | Result |
| --- | --- |
| `git diff --check` | PASS |
| `npm run check:operating-mode` | PASS, NORMAL |
| Stay/action/guest/nights/Workspace focused tests | 166/166 PASS, 0 skipped |
| `npm test` in disposable Linux / PostgreSQL 16 | 5260/5260 PASS, 0 skipped |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 errors; 149 existing warnings, none in changed files |
| `npm run check:api-schutz` | PASS |
| `npm run check:schema-bezug` | PASS |
| `npm run check:dead` | PASS |
| `npm run check:exports` | PASS |
| `npm run check:deps` | PASS |
| `npm run build` | PASS, production Next build |
| Real-component Chrome harness | PASS as scoped above |

The first native macOS full-suite run was **not green**: 5205 passed / 3 failed because existing SQL suites require `/usr/lib/postgresql/16/bin/initdb` (ENOENT). The Linux rerun used existing local image `jetnity-r2-validation:local` / `sha256:a184368370116fb675edc535efbfa9be2e913d5a605e046a5e41819c1dd6beaf`, non-root postgres user, no network, read-only source mount and disposable tmpfs. Both package manifests were byte-compared to its installed dependencies before `npm test`; no tests were skipped. Test totals differ because the native fixture failures stop nested SQL cases before enumeration. A later wrapper test is included in the final 5260 count.

An intermediate build/typecheck caught an inferred test-fixture type after extending the coverage test; explicit `Trip` typing fixed it, then focused/full/typecheck/lint/build checks were rerun successfully. The initial sandbox build also required local process/IPC permission; no application deployment was performed by that build.

## Exact changed files

14 writer-owned files, plus the unchanged task from the seed in the main-relative PR diff:

1. `components/trips/UnterkunftBestand.tsx` — bounded editor.
2. `components/trips/TripWorkspace.tsx` — optional callback forwarding.
3. `components/trips/KontoArbeitsbereich.tsx` — action/refresh callback.
4. `components/trips/GastArbeitsbereich.tsx` — persistence/state callback.
5. `lib/trips/aktionen.ts` — narrow guarded action.
6. `lib/trips/gastspeicher.ts` — narrow guest replacement.
7. `lib/trips/schema.ts` — shared input validator; existing graph contract unchanged.
8. `lib/trips/unterkunft-manuell.ts` — the sole new production helper.
9. `lib/trips/unterkunft-manuell.test.ts` — the sole new test file.
10. `lib/trips/gastspeicher.test.ts` — graph/persistence assertions.
11. `lib/trips/naechte-abdeckung.test.ts` — persisted date-to-coverage assertions.
12. This REPORT.
13. `docs/TRIP_WORKSPACE_MANUAL_STAY_DATES_COMPLETION_1_HANDOFF_2026-10-04.md`.
14. `docs/TRIP_WORKSPACE_MANUAL_STAY_DATES_COMPLETION_1_SELF_REVIEW_2026-10-04.md`.

## Access inventory and limitations

GitHub metadata/files/refs were read; delivery writes only the assigned branch and PR description. Public Supabase reference documentation was read. Dependency installation used the existing offline npm cache. Docker used an already present local image; SQL fixture databases and browser localStorage were disposable/local. No hosted Development/Production database query, migration/apply, provider/search/model-runtime API call, auth configuration change, Production data mutation or manual Vercel deployment was performed. The repository's existing GitHub CI and Vercel Preview integration may run automatically after push; the existing Auth CI job performs its configured read-only settings check. This is distinguished from writer database access.

Account revalidation/refresh follows the existing server-graph pattern; it does not optimistically fabricate a saved interval. Guest whole-graph persistence retains its existing concurrent-tab semantics, with no new concurrency protocol. Browser coverage is Chrome emulation; hosted authenticated account flow and physical devices were not exercised. Remote CI/Preview are reported only after exact-head readback in the PR receipt, not inferred from the seed preview.

Writer self-review is not a Technical-Lead PASS. **STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.** Keep Draft; no Ready, merge or follow-up.
