# Deine Welt Explorer 1 — implementation report and author handoff

Author: **Jetnity Deine Welt Explorer 1 — Codex Generation 1**. Issue #940, Draft PR #941. Session `01a136ab-864f-78c0-b940-65d4d68790d0`, one coding writer; no delegated agent. Implementation performed in this session, not inferred from the dispatch.

## Delivery identity and reconstruction

- Binding checkpoint: https://github.com/Jetnity/jetnity/issues/940#issuecomment-6153050540
- TASK: `docs/ACCOUNT_WORLD_EXPLORER_1_TASK_2026-10-13.md`, unchanged blob `b8f771a3255add4be5f753af5ecefb0371c94071`.
- Seed/implementation parent: `b8ad38269208d05813fd02d530661cb6c84b8c57`.
- Baseline and freshly fetched main: `0b7c5034389f74d32075027109ef506b9e463cd8`; mode **NORMAL**.
- Only working/push branch: `feat/account-world-explorer-1`.
- Start documents, live #751 body/current checkpoint `6153085479`, relevant PR inventory and newer #748 material were read before implementation. No later #751 instruction displaced the two-lane ownership on final read.
- Independent checkout `work/jetnity`, its own `node_modules` and `.next`, localhost port **3497**. No switch/reset/stash/clean in another checkout. No unmerged #939/#937 code adopted. Linux test container is also task-owned, uses this checkout's source and lockfile, and is disconnected from the network for tests.
- Exact final commit/tree/parent, complete compare, CI attempt/job links and matching Preview are bound in the **single final author-delivery comment on PR #941**, after pushing this report with the code. This report does not claim that pre-push remote checks have already run. No extra documentation commit is made just to restart CI.

## Product behavior delivered

`/account/welt` uses the existing page, loaders and `AccountBesuche` integration. The default full atlas now renders the explorer; `darstellung='uebersicht'` still renders the existing compact implementation. Visit management below the map remains unchanged.

The implementation sequence was: read actual domain/geometry contracts; derive presentation records and pure search/viewport helpers; integrate search, filters, detail region and transformed map; exercise truth/error/interaction regressions; run complete gates and inspect final remote evidence.

### Search and filter semantics

- Search is limited to loaded account country labels/codes and confirmed/planned place names. It is case/diacritic insensitive, bounded to 120 characters, has a clear button and honest counts/empty states. Query text causes no request, persistence or analytics event.
- IDs remain prefixed stored country/event/place identities. Text matching never creates a relationship. Country matches include eligible records in that country; place matches retain their stored country row. No-country records remain separate.
- `Alle`, `Besucht`, `Geplant`, `Beides` filter country overlays and list/marker records together. A both-state country remains labelled both under either single-source filter. Child records keep their own source status. `Beides` includes children of evidenced intersecting countries; its help text explicitly does not claim every planned place was visited.
- Global totals are explicitly independent of filtered matches. Results disclose 24 at a time without truncating the total; every record remains reachable.
- Failed visits/plans are handled independently, stale failed-source arrays are ignored, and the intersection becomes unknown. Available opposite-source records remain usable.
- Missing coordinates/geometry have honest list/detail text, never inferred centroids. Input arrays and domain objects are not mutated.

### Country details and selection

One detail region sits beside the map on wide screens and below it on narrow screens. Explicit selection focuses/scrolls to its heading; closing restores the initiating control when it still exists. Typing does not move focus. Search/filter removal closes stale details with an explanation. Prop changes that remove/revoke the selected visit immediately close it, even if its country remains through a trip; restoring old props does not resurrect selection.

Country details show all available records for that stored country, independently of the current text query, and say so. Confirmed visits retain each event ID, repetition and original date precision. Planned trips come only from `WorldMapOrt.reisen` under its stored country code, deduplicated by `tripId`; two same-title trips remain separate typed `/reisen/<id>` links. No visit is implicitly joined to a trip. A no-country entry exposes only its own supplied provenance. Error messages distinguish unreadable history from a known empty history.

### Map navigation

Scale is bounded to **1–4×**, pan is clamped, and reset deterministically restores 1×/zero pan and ends movement mode. SVG land/state layers, small-country marks and HTML place targets use the same normalized transform. Resize recomputes screen-space grouping; targets remain 44px rather than scaling with the SVG. Group anchors stay at a supplied real coordinate. Neutral geography and provenance/disputed-border text are retained.

Default touch behavior permits vertical page scroll and browser pinch zoom. Explicit reversible “Karte verschieben” mode enables dragging; a 6px threshold separates clicks, pointer cancellation/leaving/capture are handled, and a drag does not open marker details. Buttons and focused-map arrow/+/-/Home keys provide gesture alternatives. Keyboard handling ignores search/descendant targets and browser modifier shortcuts. No blocking global wheel/touch listeners or new animation were added.

## Scope and self-review

New UI is under `components/account/world-explorer-1/`; pure helpers/tests under `lib/account/world-explorer-1/`. `AccountWeltKarte.tsx` only gains the routing wrapper; `WeltZustaende.tsx` only gains an optional small-country position transform preserving existing callers. The old private map body is retained to keep compact behavior stable; legacy atlas branches within it are unreachable through the exported atlas wrapper. That dormant code is a deliberate narrow-integration tradeoff, not a second rendered atlas.

Existing source assertions in `world-map.test.ts`, `account-world-premium-map-ux-1.test.ts` and `account-home-premium-overview-1.test.ts` are only extended to distinguish searchable full atlas from search-free compact overview. No old truth/error/accessibility assertion is removed or skipped.

Self-review checked data provenance, source failure separation, country/event identity, nonmutation, long-list access, stale selection, map transform alignment, focus recovery and overview regression. No known implementation blocker was found. Independent TL review is still required. A selected country's complete history is intentionally broader than its current search matches, with visible explanatory text.

Excluded paths remain unchanged: page/loaders, visit actions/domain, central trip/traveller/Requirements and readiness contracts, country geometry/projection originals, Auth/RLS, Supabase, packages/lockfiles/workflows, global styles/layout. No map service, cost, stored personal-data change, deployed fixture switch or new demo route. Next-generated unrelated file changes were restored from this checkout's seed before delivery.

## Verification matrix

| Area | Evidence / outcome |
| --- | --- |
| Focused unit/regression tests | 143 tests, 23 suites; 143 pass, zero fail/cancel/skip. Includes 10 new helper tests and existing account/map regressions. |
| Setup / operating mode | PASS. Initial mode guard lacked `origin/main` in the single-branch clone; after fetching main, unchanged guard passed. Original failure retained. |
| Typecheck | `npm run typecheck` PASS. |
| Lint | `npm run lint` PASS, zero errors; existing **145 warnings** remain. |
| API / schema / hygiene | `check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps` PASS. Zero orphan modules, unused exports or unused checked dependencies. |
| Build | `npm run build` PASS with synthetic local configuration; no production credential use. |
| Full macOS test attempt | 6,584 tests: 6,578 pass, 6 fail, zero cancel/skip. Four Linux PG16 executable-path failures and two explicit PG16 version refusals against local PG17.6. Not reported as a green suite. |
| Full native Linux PG16 attempt | 6,657 tests: 6,654 pass, 3 fail, zero cancel/skip. All native PG16 checks pass, including M1–M4. Two subtests lacked Git metadata and one lacked the tracked `.env.example` excluded during container copying. After supplying only those files, focused confirmations pass (22 authority-guard tests plus the public-origin suite). Original full attempt remains failed; sanitized summaries/log digests are in `evidence/account-world-explorer-1/gates.json`. No test/timeout changed; final exact-head CI supplies the complete remote gate. |
| Desktop / phone / tablet interactions | All 14 packages PASS on local production build: widths 360, 390, 768, 1280, 1440; reduced-motion, keyboard, touch scroll/pan, filters, focus/close, geometry, groups, trip navigation and compact overview. |
| Live prop changes | 3 synthetic React update checks PASS: revoked event closes, restored props do not reopen it, either source can fail independently. |
| 200% enlargement | CSS zoom 200% passes no-overflow and operable controls/details; **not native browser-zoom proof**. |
| Actual `/account/welt` access | Unauthenticated request redirects to `/login` with `next`; populated interaction evidence uses existing local account harness. No authenticated account session used. |
| Exact-head CI / actual Auth / Preview | Resolved after push in the final PR delivery envelope, with original job links and matching SHA. Seed checks are not delivery evidence. |

`npm ci` used the unchanged lockfile: **19 advisories (17 high, 2 moderate)** remain. Browserslist reported stale data; dependency updates are outside this task. Historical P2/native-test timing risk remains open irrespective of a passing attempt; no timeout increase, skipped tests or repeated timing retry was used to hide it.

Original local logs are retained privately rather than published with private filesystem paths. `gates.json` provides sanitized summaries and SHA-256 log digests. Earlier browser harness attempts also remain in the private record: one audit expected `/auth/login` although the existing route is `/login`; one standalone prop harness initially lacked its bundled `process.env` definition. Both harness errors were corrected and rerun; neither required a product-code workaround.

## Browser evidence and reproducibility

Use the checkout's own server on port3497 with the already-existing local-only `JETNITY_UI_AUDIT=1` gate and synthetic Supabase placeholders. Run `node scripts/account-world-explorer-1-audit.mjs` and `node scripts/account-world-explorer-1-props-audit.mjs`. Scripts reuse installed Playwright/Chrome and esbuild; packages and lockfile are unchanged. The prop test temporarily renders the actual component in a synthetic browser document, not a deployed route. Do not activate fixtures on a hosted deployment.

- [Interaction results](evidence/account-world-explorer-1/interactions.json): the audit asserts search/diacritics, separate partial-date visits, exact distinct trip IDs, all filters/both-state/global totals, empty and partial-error states, no-country/no-coordinate handling, focus/close, 1–4× bounds/reset, SVG/HTML alignment within 1px, resize, drag/cancel/group behavior, 44px targets, touch page scroll and explicit touch pan. Density check reaches all 47 records after initial 24. Trip click reaches its exact fixture-ID route; authenticated trip content is not asserted.
- [Prop and enlargement results](evidence/account-world-explorer-1/props-and-zoom.json).
- Synthetic seed before: [390px](evidence/account-world-explorer-1/before-390.png), [1440px](evidence/account-world-explorer-1/before-1440.png).
- Production-build after, Portugal selected: [390px](evidence/account-world-explorer-1/after-390.png), [1440px](evidence/account-world-explorer-1/after-1440.png).
- Focused map/detail views captured during development: [390px](evidence/account-world-explorer-1/map-390.png), [1440px](evidence/account-world-explorer-1/map-1440.png).
- [CSS zoom 200%](evidence/account-world-explorer-1/css-zoom-200.png).

Viewport/touch emulation is **not a real-device test**. Native browser 200% zoom and actual OS/native pinch interaction were not verified: browser shortcut attempts did not demonstrate a changed zoom factor and native UI access was unavailable without additional system permissions. Native pinch remains allowed by CSS and browser modifier shortcuts are not intercepted, but that is not an end-to-end gesture claim. No authenticated populated Preview/Production account or real travel history was inspected or edited.

## Authority and next action

Author delivery remains **Draft / STOP for independent Technical-Lead review**. No Ready, merge, force-push, second writer, follow-up slice or automation. #939 retains entry-requirements priority and independent ownership; TL integrates serially and must recheck remaining-branch/combined-tree gates after any main merge. #936/#937 remains paused, and all Bern/source/#913/P2/G7 gates are unchanged. Preview readiness does not establish Production visibility or authorize deployment/activation.
