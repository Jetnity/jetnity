# Reise-Inspiration Explorer 1 — binding implementation task

Date: 14 October 2026. Issue #942. Status: TASK SEED / NOT IMPLEMENTED / NOT AGENT-STARTED.

## 1. Objective and ownership

Deliver a useful, connected travel-discovery experience: homepage -> curated destination search/theme selection -> useful idea details -> the existing real `/planen` entry with the selected canonical place ID and editable idea. Not a new planner, general audit, offer simulator or mass-produced destination SEO system.

Exact logical writer: **Jetnity Reise-Inspiration Explorer 1 — Codex Generation 1**. One coding writer, new isolated checkout/worktree and branch `feat/travel-inspiration-explorer-1`. Record actual session evidence; a task publication is not a started session. Technical Lead alone reviews, marks Ready and merges.

Baseline: main `ef8ca0fa4bdc4c557a00e79b58061e52c09faf50`, tree `85bc50363828250e8eeaa12a2a2233f3461dbae5`, mode NORMAL. Completed #939 and #941 are already in main. Read current main/mode, `JETNITY_START_HERE.md`, Technical Lead Operating Standard, active handoff, `docs/ACTIVE_WORK_STATUS.md`, latest #751 and only newer relevant #748 material before implementation. Later live evidence wins.

This is the independent lane previously queued after the map delivery, selected by TL under Operating Standard section 3a. The first-party Official-Truth/database objective retains priority. DEV-PREP-1 has first-apply SUCCESS response, mandatory readback blocked, second NOT ATTEMPTED; checkpoint #917/6164202501 remains binding. This task must not retry/reformulate/delegate/route around that operation or change plugin permissions. No Supabase action belongs to this writer. #936/#937 remains paused; no Mac/App/backup work.

## 2. Existing reusable contracts (read before building)

- `components/home/HomeInspiration.tsx`, baseline blob `44f9f393bb5da4ce91cbba885782802b98ff777e`: four homepage cards already link directly into planning. Preserve those direct links and section anchor `entdecken`.
- `lib/places/inspiration.ts`, blob `3368884b8d7a5e3af7c94d17d9e63e3681ea56fa`: single existing curated data source, four entries: Bali, Lissabon, Zermatt, Amsterdam. IDs, names, countries, local images and example ideas are already committed. Reuse, do not duplicate the base catalogue.
- `lib/places/auswahl.ts`, blob `aea169b355fa62acc4a5c78cc43ffd47446f8f30`: `zielHref` is the planning handoff. A syntactically valid stored ID is not proof of a live confirmed place; `/planen` keeps its existing server revalidation.
- `app/(public)/planen/page.tsx`, blob `09eed25b44e6991c473c084b6326ff055f223e66`: existing request-param helpers, Auth-owned guest/account decision and place confirmation. Read only.
- `app/(public)/page.tsx`, blob `89a8a0be8231c4938355c0da94f31012b2e6f7c7`: accepted homepage shell/hero/order. No redesign here.
- `docs/FINAL_HOMEPAGE_PRODUCT_SPEC_2026-09-30.md`: curated inspiration, actual planning handoff, mobile first, factual capability separation, no thin SEO doorway pages and no launch/indexing permission.

## 3. Deliver as one implementation

### EX-01 — real discovery route and entry

Implement `/entdecken` under the existing public layout. Verify route collisions before creating it. Add one clear discover-more link to the existing homepage inspiration section; the four direct-to-plan cards continue to work without a new mandatory detour. Do not change the hero, global navbar, footer or section order.

Initial useful content and planning links must be server-rendered. Search/filter enhancement must not leave the page blank before hydration; provide a usable no-JavaScript baseline. Reuse current layout, design tokens, image components and public metadata helpers. The new route and query variants keep explicit prelaunch noindex; canonical URL is `/entdecken`. No sitemap/robots/global SEO policy edits, new indexing grant or invented structured offer/review metadata.

### EX-02 — honest, extensible editorial catalogue

Initially use exactly the four committed destinations and their local images. A compact owned presentation module may add original short descriptions, accessible image text, a suggested travel idea and bounded editorial themes such as Stadt/Kultur, Natur, Strand and Erholung, grounded in the existing ideas. Theme labels are editorial suggestions, not verified provider/regulatory facts. Reuse base identities by place ID; do not derive a place from an arbitrary name.

Show the actual curated catalogue size/scope honestly. Do not call this a worldwide destination database or live recommendation engine. Missing existing information stays absent; do not fill with fabricated prices, availability, ratings, popularity, safety, climate/best-season, legal entry rules or precise commercial promises. Example durations remain clearly editable ideas, not confirmed itinerary dates. No automatic selection of citizenship, documents, dates or origin.

No new photos, external image hosts, downloads, licences or partner statements in this task. Reuse existing asset paths without claiming a fresh rights clearance. If a genuine existing asset issue is found, report it specifically rather than inventing a replacement/permission.

### EX-03 — search and themes

Search destination/country/owned editorial labels locally, with bounded query length (120 characters), case/diacritic-insensitive matching, trimmed input, visible count, clear/reset and useful empty state. Combine the search with one selected editorial theme plus All. Use accessible real labels and keyboard-operable controls. No network request, analytics, account read or storage write per keystroke.

Keep shareable/back-navigation state in this route's bounded URL params only; parse unknown/repeated/malformed/overlong values deterministically. Safe escaping, fixed enum filters, no raw HTML or caller-controlled navigation target. Do not steal focus when typing. Back/forward and reload must reproduce the displayed state without hydration disagreement. The no-results path offers reset, not an invented matching destination.

### EX-04 — details and canonical planning handoff

Every result provides useful original short descriptive text and an explicit `Reise mit diesem Ziel planen` action. A selected-card detail region may expand within the same page; it is not a separate generic city page. Selection/filter/close behavior must be keyboard accessible and cannot retain a hidden stale choice.

Construct the destination link using unchanged `zielHref({ id: placeId, name }, idea)`. Preserve exact ID/idea semantics and existing guest/account handoff; never bypass place revalidation or reimplement trip creation. A failed/null link must not masquerade as a confirmed destination. No automatic trip/account write, auto-submit or planning-model call when browsing, filtering or selecting. User edits remain in the existing planning flow.

### EX-05 — visual and device quality

Calm, modern Jetnity styling; smartphone primary. Evidence at 360x800, 390x844, 768 and 1440 widths; no new horizontal page overflow, inputs >=16px on phone, interactive targets >=44px, visible focus, sensible image sizes/aspect ratios, stable loading layout and useful text beyond images. Respect reduced motion. Do not hide overflow globally or scale a desktop mockup down.

Retain accepted homepage first-screen behavior. Check keyboard-only discovery -> details -> plan action, back navigation, query clearing, no results and image failure fallback. Distinguish native zoom/device tests from CSS enlargement/viewport emulation; disclose limits rather than adding an OS-permission detour.

## 4. Exact write scope

Allowed new paths:
- `app/(public)/entdecken/page.tsx`
- `components/inspiration/explorer-1/**` (only this feature)
- `lib/inspiration/explorer-1/**` (pure presentation/search/params/handoff helpers and tests)
- `scripts/travel-inspiration-explorer-1-audit.mjs` and at most one additional task-named local interaction harness if necessary
- `docs/TRAVEL_INSPIRATION_EXPLORER_1_PLAN_2026-10-14.md`
- `docs/TRAVEL_INSPIRATION_EXPLORER_1_REPORT_2026-10-14.md`
- `docs/TRAVEL_INSPIRATION_EXPLORER_1_HANDOFF_2026-10-14.md`
- `docs/evidence/travel-inspiration-explorer-1/**` (small sanitized receipts and selected screenshots; no personal data/secrets)

Allowed existing-file edit:
- `components/home/HomeInspiration.tsx`: minimal visible link into discovery, preserving current direct card href/data contract, anchor and existing layout behavior.
- `scripts/final-homepage-product-1-audit.mjs` and `scripts/final-homepage-premium-experience-2-audit.mjs`: only justified additive assertions for the new navigation edge if required; no removed/weakened old assertion.

The TASK is immutable. The base catalogue, place helpers/resolver, planning page/components, homepage page/hero, global layout/navbar/styles, central Trip/traveller/Requirements/Official-Truth, maps, Auth/RLS/Supabase, packages/lock/workflows, middleware, indexing policy and operating mode are read-only. Any genuinely necessary out-of-scope edit must be named with an exact proposed diff for TL arbitration, not silently bundled.

## 5. Execution isolation and required evidence

Separate worktree/checkout, node_modules/build directories and local server port (prefer 3541 if available). Never reset/stash/clean/switch another writer's checkout, kill unrelated processes or adopt unmerged #937 code. Use existing tools/dependencies; no extra agent or service. Do not inspect local credentials/private account data. Local synthetic test ports are not hosted fixtures.

Record a short plan, then implement all EX-01..05 together. Use focused checks during development; full required repository setup/mode/typecheck/lint/tests/API/schema/dead/exports/deps/build gates once the material code is ready, with fresh exact-head CI/Auth/Preview. Do not modify tests/timeouts/CI to conceal existing P2/environment failures. Existing normal CI Auth comparison is not authority for new hosted queries or the blocked readback. Preserve failed attempts accurately and distinguish local from CI results.

Deliver one end-to-end local browser witness on the actual route: homepage discovery link -> search/theme -> description/selection -> exact `/planen` target and editable idea. Use existing isolated synthetic place fixtures for a populated planning proof; no real hosted call. A URL assertion alone is not a populated planning/form proof. If that final existing-route fixture cannot be exercised within scope, report the specific boundary without faking success or modifying Auth/confirmation.

Show no-result/reset/back/reload/no-JS behavior, mobile/keyboard proof, unchanged homepage direct planning links, accepted map/application preservation and absence of new outbound services. Provide exact HEAD/tree/parent/merge-base/ahead-behind/diff/TASK blob, tests, original CI/Auth outputs, Preview identity, scope review and truthful residuals. No self-certified production/device/entry-advice PASS.

## 6. Stop and retained boundaries

Only commit/push scope-treue work to `feat/travel-inspiration-explorer-1`; no force-push, no Ready, no merge, no automatic follow-up. Publish and read back the complete author handoff, then STOP for independent TL review. A changed head invalidates earlier exact-head gates.

No Supabase access, readback retry or migration; no Work delegation to bypass a platform denial; no secrets/permissions/App/Bern/source/provider/payment/official-rule or real user-data action; no paid infrastructure or launch/indexing change. Existing USD100/month budget remains. DEV-PREP-1 stays first-apply-reported-success/readback-pending/second-not-attempted until its legitimate access and mandatory checks resolve. Do not conflate this separate product task with progress on that blocked operation.
