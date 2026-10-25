# Jetnity Account Booking Folder Completion 1 — TASK V1

Date: 2026-10-24. Immutable Technical-Lead task. Do not edit or reinterpret this TASK; request a named TL addendum for any needed ownership change.

## 0. Authority, identity and exact baseline

- R105 lane **B**, tracking **#997**, branch **`feat/account-booking-folder-completion-1`**.
- Exact logical author: **Jetnity Account Booking Folder Completion 1 — Cursor Generation 1**. Fresh Generation1, one genuine Cursor writer for this branch.
- Requested model: **Grok4.7 High Fast**, expected identifier **grok-4.7-high-fast**. Attest actual runtime model and actual session ID/link; no Auto/unrelated fallback. If unavailable, STOP and report. Use a supported UI rename only if available; report performed vs not available honestly.
- Base actual main: **0c37d318c47a758f06634448d6e0de3856bbc6a6**; tree **5e7b61a111f94f16a27c80a8ec89e42ef7af62e8**; machine mode **NORMAL**. Re-read live values; never silently change base/contract.
- [R105 V1 TL precheck6385343244](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6385343244), [canonical current index#751](https://github.com/Jetnity/jetnity/issues/751). New explicit Owner instruction authorizes these ordinary larger tasks without routine reconfirmations. Previous R104 is closed; its agents stay STOP.

## 1. Required startup and pre-code gate

Read JETNITY_START_HERE.md, AGENTS.md, the Technical Lead Cursor Operating Standard, current handoff, ACTIVE_WORK_STATUS durable pointer, current#751/precheck, Multi-Agent Operating System, Multi-Agent Slice Planning Standard, Binding Slice Precheck/Continuity Gate2026-08-29, V1 Binding Build Order2026-09-01, relevant Vision/Architecture/DECISIONS/Design/ProductQuality/Continuity/Logic standards, current source and tests. Old dated current-state paragraphs are historical where current live evidence supersedes them.

**First delivery is PLAN ONLY:** commit `docs/JETNITY_ACCOUNT_BOOKING_FOLDER_COMPLETION_1_PLAN_2026-10-24.md`, then post a PR comment with exact logical name/model/session, main/head/merge-base/ahead/behind, source-confirmed defects, proposed changes, exact owned paths, regression proofs, costs and unknowns. The seed TASK and this PLAN must be the only diff at this gate. **STOP for TL plan review before product/test implementation.** TL will authorize the same session; no new Owner prompt is required. Do not interpret @cursor alone as permission to skip this stop.

## 2. Product outcome

Bestehenden lesenden Buchungsordner vollständig nutzbar machen: begrenzte Fortsetzung über den bisherigen 200er-Schnitt hinaus, Titelsuche, Art-/Archivfilter und direkter Sprung zum bestehenden Planpunkt. Echte Leerstände, keine Treffer und Lesefehler bleiben unterscheidbar.
## 3. Source-established gap and product boundaries

Existing AP-10-S1 `/account/bookings` is implemented. Do not rebuild its foundation. `buchungen-daten.ts`46–58 reads authenticated/RLS-owned user-confirmed items and stops at200. The UI only warns about truncation. Cards link to the trip, though existing workspace-mode supports the exact item. No live account with >200 rows was examined; use synthetic fixtures.

Complete this coherent journey: Account→confirmed bookings→find by title/kind/archive status→continue beyond first page→open precisely that existing plan item.

AP-10 in ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN393–413 permits this read-only aggregation without a new Owner gate. Keep the user-confirmed wording; archived is not deleted/invalid, and user-booked is not provider confirmation or revenue/conversion evidence.

## 4. Exclusive runtime and test allowlist

- `app/account/bookings/page.tsx`, `app/account/bookings/loading.tsx`.
- `components/account/AccountBuchungen.tsx`.
- `lib/account/buchungen.ts`, `lib/account/buchungen-daten.ts`.
- Existing `lib/account/buchungen.test.ts`, `lib/account/buchungen-ui.test.ts`: update only behavior genuinely superseded by this new task and retain auth/read-only/truth assertions.
- New `lib/account/buchungen-abfrage.ts`, `lib/account/buchungen-abfrage.test.ts`, `lib/account/buchungen-daten.test.ts`.
- Optional new `components/account/BuchungenFilter.tsx` if it simplifies the real existing page; no new application route/API/dashboard.

Read-only contracts: account layout/proxy/auth and Supabase client; `lib/api/datenbank-lesen.ts`; `lib/trips/buchung.ts`; `lib/account/reise-archiv.ts`; `lib/trips/workspace-mode.ts`; types and DB migrations/RLS. Existing AccountUebersicht entry/navigation remains unchanged. No TripWorkspace writer work.

## 5. Binding query, pagination and navigation

1. Use the existing authenticated server client and unchanged ownership/RLS. Never service-role, client-trusted user_id, new RPC/view/table or privileged path. Query only currently booked and canonically bookable item kinds before limiting; derive allowed kinds from the existing contract.
2. Bounded page size **50** plus at most **one sentinel** to establish another page. No fetch-all loop or uncapped caller-selected page size. Prefer a keyset continuation matching `booking_confirmed_at DESC NULLS LAST, id ASC`. Prove equal timestamps, transition to null timestamps and null-only continuation; IDs/timestamps/cursor structure are strictly validated.
3. Visible ordering must match the declared continuation semantics. Existing mapping re-sorts by archive/date after the DB cut; do not label per-page local sorting as global chronology. An explicitly described latest-user-confirmed sequence is acceptable; dates remain the stored travel dates. No claimed snapshot isolation across separate requests.
4. Search only the booking title, bounded to120 characters; kind filter from existing bookable kinds; archive filter active/archived/all. Apply all filters server-side before page/sentinel limit. Keep filters in bounded shareable URL state; changing a filter resets continuation. Empty search restores unfiltered results. No new cross-join full-text, trip catalog or fuzzy-search system.
5. Treat search as literal title matching, including umlauts, percent, underscore, apostrophe and punctuation. Do not interpolate untrusted raw query grammar. `.or()` uses raw PostgREST syntax; if keyset uses it, compose only strictly validated closed tokens. Do not attempt cross-table OR search. Archived filtering uses the current inner joined trip relation and known status semantics.
6. Cursor invalidity, repeated/oversized parameters and malformed timestamps/IDs fail predictably and cannot widen the query. A cursor is pagination state, never account authorization. No identity or additional PII in the cursor. Ensure filter/cursor relationship is explicit; stale filter cursors cannot silently skip a new filter's first page.
7. Total counts are optional; do not show remaining-after-cursor count as total matching bookings, page length as account total, or unknown as zero. Sentinel supports honest continuation without exact count. Keep empty account, no matching results, failed load and end of results distinct.
8. Use existing `modusUrl('/reisen/'+tripId, {ansicht:'plan', bereich:null, itemId})` behavior or equivalent existing adapter, with correctly encoded/validated target IDs and no external destination. No workspace-mode changes. Deleted/moved item resolution remains existing safe graph fallback. Provide clearly named item-open link; no phantom per-item booking details or partner target.
9. Search/filter submit, clear, next-page/back-navigation and retry are keyboard-accessible; loaded filters/state remain understandable on errors and browser history. No automatic endless loading or request-on-every-keystroke necessity. Preserve noindex/account protection.

## 6. Required behavioral proof

- Actual owned query builder/parameter mapping:0,1,50,51 and >200 synthetic rows; all unchanged dataset rows reachable exactly once; tie/null timestamp edges; last page. Verify serialized real client query shape where practical, not only a mock that assumes every requested filter works.
- Search match beyond historical200; combined kind/archive/title filters before limit; filter reset; URL reload/back; invalid cursor/parameters; literal `%`, `_`, apostrophe, umlaut and PostgREST punctuation.
- Booked-only and allowed-kind-only truth; archive semantics; malformed joined row fails honestly; missing count; data:null without error; thrown/rejected read; next-page error; no false completeness.
- Mounted real booking page/component behavior with synthetic results and real owned adapters: empty vs no matches vs error, navigation, focus, long titles and responsive controls. Existing item navigation contract cases remain passing.
- Confirm no writes/privileged clients/new Auth or schema surface by full diff. Account callback/query serialization fixtures are not a hosted RLS or database PASS. Do not access hosted data for this task.

Before implementation check the installed Supabase/PostgREST client version and current official query docs. TL consulted supabase.com/changelog (markdown endpoint unsupported by reader), official JavaScript order/ilike/or references. Changelog's12Oct TLS notice is not permission for unrelated infra work. Record any relevant version constraint; no dependency upgrade. Official references: https://supabase.com/docs/reference/javascript/order , /ilike , /or .

## 7. Non-scope

Keine neue Booking-/Commercial-Wahrheit, Preise, Partnerfelder, Traveller-PII, Writes, neue Tabellen/RPCs/RLS oder Auth-Änderungen. Bestehende Itemnavigation bleibt read-only.
No new booking status, payment, affiliate/revenue claim, currency conversion, export/calendar, guest folder, homepage/account navigation redesign or traveller/official truth.
## Multi-Agent Suitability

Decision **MULTI_AGENT**. Mode NORMAL; this is ordinary bounded Phase1 work under the fresh Owner instruction. A/#996 owns plan editing plus only guest deletion; B/#997 owns the read-only booking folder; C/#998 owns manual flight/stay/connection editors. Each has separate branch/PR, runtime files or explicitly named function boundaries and its own tests/evidence/docs. Shared contracts are already present and remain read-only. No shared-contract writer is required.

Integrate **A → C → B**, one full TL acceptance at a time. No sibling cherry-pick/merge. After main advances, await TL synchronization instruction in this same session; changed head means new exact-head gates. Additional Work helpers may independently inspect/reproduce ordinary scoped behavior, never write your branch or substitute for Cursor/Guardian.

## Delivery file ownership

- New optional slice helpers and focused tests only at the exact paths allowed above; no generic helper framework.
- Scripts: `scripts/account-booking-folder-completion-1/**` for isolated disposable synthetic fixtures/harnesses. Do not create a deployed test route. No personal browser or production storage/session.
- New evidence only: `docs/evidence/account-booking-folder-completion-1/**`. Record baseline/head/source digests, actual commands/exits/case counts, browser version/viewport/root text/motion settings, stubs/ports and exact NOT-VERIFIED limits. Do not overwrite earlier evidence or manifests.
- Own docs: `docs/JETNITY_ACCOUNT_BOOKING_FOLDER_COMPLETION_1_{PLAN,STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-24.md`. TASK V1 remains immutable.
- Global START_HERE/HANDOFF/ACTIVE/ROADMAP/central ADR/build-order/mode/governance files remain TL-only. Document proposed global reconciliation in your own handoff.

## Verification and stop

Prove meaningful behavior, not source-pattern-only claims. Use real mounted components for async/focus/context cases and genuine owned pure/storage/query functions for persistence/data semantics. Include deterministic failure, pending, retry and late-response cases, relevant existing regression tests, TypeScript, lint, five hygiene guards and production build. Preserve the mandatory full CI App/Auth/Vercel gates; do not change workflows, timeouts, dependencies, global styles, config, schemas or gate logic. Disclose existing warnings/skips; a skip is not PASS.

Check narrow layouts at280/320/360/390/430,768/1280 and landscape where relevant; 200% root text and keyboard/reduced motion for changed core interactions. At minimum mount representative320/390/1280 cases and320/root32. Label CSS/root-font simulation honestly; no fabricated physical-device, screenreader, hosted-account or native zoom pass. No overflow masking on page/root to hide defects.

Each final HANDOFF includes actual main/base/head/mergebase/ahead/behind, actual model/session/name, complete diff/file ownership, findings P0/P1/P2/P3, exact executed proof and unknowns, CI/Preview bindings if observed, database/production/provider/cost statements, remaining review risks and exact next actor. Author self-review is never TL PASS. Deliver and **STOP** for independent TL exact-head review.

**Never Ready, merge, close the tracking issue, change main, or start a follow-up.** CHANGES REQUIRED stays with this exact author/session; a new head invalidates prior gates.

## Standing exclusions

#985/#982 scoped HOLD and its interrupted review must not be retried, rephrased, rerouted to another agent/tool or performed manually. #917 denied hosted readback STOP; no alternate query/apply/operator. #913/#911 block; #968 historical Preview cleanup PAUSE; #748 personal-browser automation SUSPENDED; #626 STOP; Bern#934/#937 PAUSE; #944 no-autostart; #585 deferred; historical Drafts unchanged. Do not inspect held implementation while searching for tests.

No hosted database writes/reads, migration/RLS/grant/function/Auth change, secret/credential access, old Preview inventory/probing, protection bypass, provider/model/payment activation, paid provider/model calls, contract/legal/launch/indexing changes. This batch uses local synthetic evidence and existing platform metadata under TL control. Any unforeseen boundary is reported to TL, not routed around.