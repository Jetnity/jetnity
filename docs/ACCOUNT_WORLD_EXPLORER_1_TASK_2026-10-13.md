# Jetnity — Deine Welt Explorer 1

Date: 13 October 2026. **BINDING IMPLEMENTATION TASK**, Issue #940.
Logical writer: **Jetnity Deine Welt Explorer 1 — Codex Generation 1**.
Baseline main: `0b7c5034389f74d32075027109ef506b9e463cd8`; tree `4f02945668eeae79c486ccc39a4b5eb44904cfa9`; mode NORMAL.
Branch: `feat/account-world-explorer-1`. The TL-created Draft PR is linked in #940/#751. One new coding session; creating this task is not proof of a started session.

## 1. Product result and priority

The Owner accepted a second, independent product lane alongside Official Truth #938 / Draft #939. Deliver a useful **searchable, filterable, navigable personal world map with country details on the existing /account/welt page**, not an audit, new demo, recoloring exercise or second travel planner.

Acceptance example with LOCAL synthetic account data: search Portugal -> select the country -> see its separately labelled confirmed visit events and linked planned trips -> zoom/pan/reset -> open the correct existing trip. The same interaction must work by touch and keyboard. A country or visit absent from the account's records must not be invented.

The first-party entry-requirements/database goal retains highest priority. This task neither replaces nor activates it. #936/#937 remains paused at43cd; no Mac/App/key/backup work. #934's Bern hard stop, #913 safety hold and all protected Owner gates are unchanged.

## 2. Live reconstruction and reuse

Read JETNITY_START_HERE.md, the TL operating standard, ACTIVE_WORK_STATUS, live mode/main and current #751 body plus newer comments. Inspect current open relevant PRs and newer unread #748 material before starting. Historical handoffs do not assign the current writer. Start from the task branch, never from unmerged #939 or #937.

Reuse these established read-only domain contracts and data already delivered to the map:
- `app/account/welt/page.tsx`: existing independent account-trip and confirmed-visit loading and noindex.
- `components/account/AccountBesuche.tsx`: existing create/edit/revoke visit management; do not rebuild it.
- `components/account/AccountWeltKarte.tsx`: existing atlas versus compact overview, marker groups, canonical trip links and map layers.
- `components/account/WeltZustaende.tsx`: existing visited/planned/both visual and text language.
- `lib/account/world-map.ts`: WorldMapAbleitung/WorldMapOrt and real trip provenance/IDs; planned truth only.
- `lib/account/welt-ansicht.ts`, `lib/account/besuche.ts`: confirmed events, partial dates and separate error state.
- `lib/account/welt-laender.ts`, `welt-geometrie.ts`, `world-map-ansicht.ts`: existing geometry/labels/projection and small-country/unknown-location handling.

Read their actual implementation before changing integration. Existing map UX/visit-management work is already present on main; do not reopen its old PRs. The complete country geometry stays server-owned; do not ship the entire geometry table to the browser or add a map provider, geocoder, tile service or package.

## 3. Integrated functional scope

### A. Account-local map search

Add an accessible labelled search over the already loaded canonical country labels/codes and place names from BOTH available data sources. Scope it visibly to this account's records, not a global destination catalogue. Use bounded input (maximum120 characters), deterministic case/diacritic-insensitive matching and stable real IDs. Matching text is not identity and never establishes a country/place/trip relationship.

Provide keyboard-operable results, an explicit clear control, result counts and a true no-match state. Empty query restores the current filter's full set. Paginate or progressively disclose a long list without losing access or falsely claiming a partial page is the total. Records without geometry remain searchable/listed with an honest no-map-position message. No network request, analytics event or persistent storage for search text.

### B. Presentation filters

Support Alle / Besucht / Geplant / Beides. On country rows, Besucht includes countries also planned; Geplant includes countries also visited; Beides is the evidenced intersection. Never relabel a both-state country to visited-only/planned-only just because a filter is active. Global totals remain explicitly totals, distinct from filtered-match counts.

Visit and planned-load errors remain independent. An unreadable side is unknown, not zero/empty, and no definitive both/intersection status may be inferred from it. Show available records and the missing-side message. Filtering/searching must not mutate any supplied array, stored visit, itinerary, status or canonical truth derivation.

Map state overlays, selectable items and result list must follow the documented filter/search semantics consistently. Keep the neutral geographic background and map provenance/disputed-border disclaimer. Clarify when a selected item is hidden by changed filters; do not leave stale country/marker details on screen.

### C. Selected-country detail panel

An account-country result or existing country-list control opens one coherent details region: adjacent to the atlas on wide screens and below it on narrow screens, with predictable focus/scroll and a close/back control. It shows the canonical country label, evidenced status and two separate sections: confirmed visits and planned trips.

Confirmed visits use their existing event IDs and original date precision; repeated visits remain separate events. Planned trips are derived only from WorldMapOrt.reisen/herkuenfte for that stored country and deduplicated by tripId, never title. Use the existing typed internal trip-link pattern. A confirmed visit has no implicit trip relationship: never connect a visit to a trip merely because name/country/date matches. Missing dates stay unknown. A no-country record remains accessible separately, never assigned by text or coordinates.

Do not add new visit editing flows inside the panel; retain the existing visit-management workflow below. Reset details when new props invalidate the selected record (including a visit revoked via existing UI). Retain correctly labelled partial-error states rather than showing a deceptive empty country history.

### D. Bounded map navigation

Use the existing map/projection. Add zoom in/out and reset, with a finite scale range (1x–4x), clamped pan and deterministic reset. Land, state fills, small-country marks, place markers and hit targets must use the SAME viewport transform. Recompute/clamp on resize; do not let markers drift away from the locations they represent. Country/record selection without usable geometry must not invent a centroid.

Preserve marker grouping, small countries, boundary labels and reachable 44px minimum interactive targets. At zoom, adapt marker positioning/grouping as needed within task-owned presentation helpers; do not shrink button targets with the SVG. A pan must not fire a marker click on release; handle pointer cancellation and leaving the area safely.

Normal one-finger page scroll and native browser pinch-zoom must work by default. Use an explicit, clearly reversible map-movement mode for touch panning if needed; do not globally capture scrolling or attach blocking window listeners. Button/keyboard equivalents must suffice without gestures. Keyboard arrows/+/- apply only while the relevant map control is focused, never inside the search field. Do not prevent browser zoom shortcuts. Respect reduced motion and avoid scroll/focus jumps while typing.

## 4. UI, isolation and non-scope

Only the full atlas under /account/welt receives the complete explorer by default. Preserve `darstellung='uebersicht'` on the account overview: compact layout, links, totals, markers and existing behavior remain usable without the new full controls. Keep public German text clear, no unimplemented claims or public KI wording. Use existing design tokens; no site-wide style or layout change.

Keep Auth/RLS/read errors and existing data-loading contracts intact. No new backend route, DB table/migration, permission grant, visit/trip mutation, account creation, sensitive-data field, external data call, tracking, persistent map state, public share/export or secret. Automated/browser evidence uses synthetic local data; do not edit or publish real travel history. Empty states in deployed code contain no fixture trips/visits.

## 5. Multi-Agent Suitability and exact ownership

**Decision: MULTI_AGENT across two disjoint product lanes; SINGLE_AGENT within this map task.** #939 owns central Trip Workspace/regulatory context/Requirements contracts. This task owns the map's presentation and interactions. It reads published trip summaries only; no runtime dependency on unmerged #939 and no second writer inside either PR.

New owned paths:
- `components/account/world-explorer-1/**`
- `lib/account/world-explorer-1/**` (pure presentation helpers/tests, not a new truth store)
- `scripts/account-world-explorer-1*` (local audit/interaction evidence only)
- `docs/ACCOUNT_WORLD_EXPLORER_1_*` and `docs/evidence/account-world-explorer-1/**`

Narrow shared edits explicitly authorized:
- `components/account/AccountWeltKarte.tsx` for actual integration and atlas/overview separation.
- `components/account/WeltZustaende.tsx` only for optional interaction/presentation props, preserving existing callers and state semantics.
- `components/account/AccountBesuche.tsx` only if indispensable to wire existing props/selection into the explorer; no changes to its mutation/actions or unrelated management behavior.
- Directly corresponding existing map UI tests may receive narrowly scoped new expectations where this intentional feature changes old search-disabled assertions; never remove/skip underlying truth/error/accessibility coverage. Document each changed expectation.

Read-only/excluded: canonical `types/trips.ts`, `lib/trips/**`, `lib/traveller/**`, `components/trips/**`, `app/(public)/reisen/**`, all `lib/readiness/**` and source/App/custody paths, `supabase/**`, visit data/actions/domain truth functions, country data/projection originals, Auth/security, global CSS/layout, package/lock/workflows and governance. Keep `app/account/welt/page.tsx` and loaders unchanged unless the TL approves one demonstrated exact need first. Existing props should be sufficient. No silent expansion of this map task into #939's ownership.

Before implementation use a distinct existing/new worktree or separate checkout for this branch. Confirm its branch, root and clean owned work before editing; do not switch/reset/stash/clean a directory used by #939. Separate node_modules mutable state, build output and test server port; do not kill the other session's processes or expose credentials. Public evidence must not reveal private absolute paths. Missing isolated execution capability is a precise STOP, not permission to overwrite the other checkout.

Integration: no cross-branch cherry-picks/merges by authors. TL reviews and integrates one PR at a time. #939 has product priority when both are ready; a ready independent map PR need not wait for unresolved external source gates. After any main merge, TL rechecks each remaining branch's merge-base/behind/shared-consumer impact and requires fresh exact-head gating where integration changes the tested tree. Two green premerge branches are not proof of their combined tree.

## 6. Verification and one delivery

Use focused tests while implementing, then the prescribed complete gates on the final material head. Test stable search/filter semantics, both-state preservation, duplicates/same names, missing country/coordinates, partial dates, either source failure, stale selection after prop change and nonmutation. Test zoom bounds/reset, transform alignment, resize, pan versus click, marker groups and keyboard controls.

Provide local browser evidence at smartphone360/390px, tablet768px and desktop1280/1440px, plus browser200% zoom/reduced-motion/keyboard and touch-mode checks. Demonstrate existing /account/welt wiring; reuse the existing isolated account UI harness for synthetic populated states when necessary, explicitly labelling harness versus real authenticated-page evidence. No new deployed demo route or fixture activation. Show compact overview regression. Screenshots alone are not proof of drag, scrolling, focus or working trip links; report the exercised interactions. Do not claim a real-device test from viewport emulation. If a capability is absent, state it precisely and complete independent in-scope implementation.

Final gates: full repository tests/native PG, typecheck, lint, API/schema/hygiene and build using the existing commands; exact-head CI including actual Auth comparison and matching Vercel Preview. No tests skipped for green, no timeout increase or repeated retry to hide P2. Existing19 advisories/145 lint warnings and historical failures remain explicit; no dependency fix in this task. No extra docs-only commit solely to restart the full suite after a final code delivery.

Deliver code plus ONE coherent REPORT/HANDOFF (with self-review and status matrix inside), before/after synthetic images and interaction evidence. Bind exact final HEAD/tree/parent, complete diff, task blob, session identity, isolation, CI attempts/original logs/Preview and residuals. Do not fabricate session launch, test pass, Preview or Production visibility. Do not publish personal data, keys or raw private local logs.

## 7. STOP and authority

Ordinary scoped code and branch-local commits/pushes are authorized; no repeated blanket Owner approval. At a genuine scope conflict or special gate, propose the exact change to TL before crossing it. No new infrastructure or recurring cost; do not purchase/install a service.

Author MUST NOT mark Ready, merge, force-push, start another agent or automatic follow-up. Stop after coherent delivery for independent TL review. TL alone may Ready/merge after exact-head acceptance and performs actual-main postmerge CI/Production verification. No provider, launch/indexing, source/Bern, credential, hosted DB or system/backup authorization is created by this task.
