# Jetnity Trip Workspace Premium Experience 3 — TASK

Stand: 30 September 2026
Status: **BOUNDED TRIP WORKSPACE PREMIUM UX / MOBILE-FIRST / NO DATA-LOGIC REDESIGN**

Issue: #660
Branch: `feat/trip-workspace-premium-experience-3`
Baseline: `main@a2685812022258610e0cf34d926695b7067e55df`

## 1. Product-Owner decision

The Product Owner reviewed the live Trip Workspace and authorized a bounded premium refinement.

Goal:
- same premium quality bar as the accepted final homepage;
- smartphone-first;
- modern, calm, highly professional;
- preserve all accepted Trip Workspace information architecture, data truth and behavior.

This is **not** a rewrite of the Trip Workspace architecture.

## 2. Fresh live precheck

At dispatch:
- machine mode `NORMAL`;
- live main `a2685812022258610e0cf34d926695b7067e55df`;
- #657 footer white-logo slice is merged/post-merge verified;
- active #655 Next.js security upgrade owns dependency/security paths;
- active #659 favicon slice owns icon-family paths;
- neither owns Trip Workspace presentation;
- no other active runtime writer owns `components/trips/TripWorkspace*`;
- #626 remains OPEN/BLOCKED;
- provider/payment/Production/indexing/launch special gates remain unchanged.

Re-fetch all of this before editing. Live evidence wins.

## 3. Writer identity

Logical agent: **Jetnity Trip Workspace premium experience 3**
Generation: **1**
Required model: **Grok 4.7 High Fast**, not Auto.

Record actual Cursor session URL and `originalModelName` before editing.
If required model is unavailable, STOP.

## 4. Required read order

1. `.jetnity/operating-mode.json`
2. `JETNITY_START_HERE.md`
3. Technical-Lead / Cursor operating standard
4. Binding Slice Precheck standard
5. Issue #660
6. accepted #642 Trip Workspace IA task/report/handoff/self-review and TL review
7. current `components/trips/TripWorkspace.tsx`
8. current:
   - `TripWorkspaceKopf.tsx`
   - `TripWorkspaceModeNavigation.tsx`
   - `TripWorkspaceDomainNavigation.tsx`
   - `TripWorkspaceUebersicht.tsx`
   - `TripWorkspacePlan.tsx`
   - `TripWorkspaceDetail.tsx`
   - `TripWorkspaceNavigation.tsx`
9. current Trip Workspace tests/audits and cross-device contracts
10. current live screenshots / production behavior
11. active PR #655 and #659 changed-file lists for collision safety

## 5. Product acceptance principle

A user opening a trip should understand in 2–3 seconds:

1. **Where am I going?**
2. **What is already planned?**
3. **What is missing?**
4. **What should I do next?**

The workspace must feel like one connected premium travel cockpit, not a collection of generic cards.

## 6. Preserve these accepted contracts

Do not regress:
- trip identity and saved-account truth;
- dates / traveller count / budget truth;
- four modes exactly:
  - Übersicht
  - Reiseplan
  - Organisieren
  - Vorbereitung
- URL/deep-link semantics;
- Back/Forward/reload authority;
- compact vs wide detail behavior;
- focus restoration;
- sticky-nav coverage rules;
- lazy mounting of commercial search;
- no provider search until explicit user action;
- existing detail/item/gap semantics;
- current trip mutations/actions;
- current source/official/safety/seasonal truth;
- no fake completion, price, provider, alert, official result or booking state.

## 7. Required visual/product refinement

### 7.1 Trip identity header

Preserve the dark-green identity surface and all real facts.

Refine only presentation:
- stronger hierarchy between trip title, route/subtitle and metadata;
- date / people / budget facts should read like integrated trip facts, not floating dashboard widgets;
- reduce dead space while preserving calm premium feel;
- deletion and saved-state messaging must remain visible but subordinate;
- mobile should be intentionally composed, not just stacked.

No new KPI or fake status.

### 7.2 Mode navigation

Keep all four mode labels and semantics.

Phone:
- prevent awkward multi-line wrapping;
- use a polished horizontally scrollable or compact segmented treatment;
- active mode always obvious;
- each target >=44px;
- selected item should remain visible when changed;
- no hidden content under sticky bars.

Desktop:
- refined segmented workspace navigation;
- visually connected to the trip surface without becoming heavy.

Keyboard/focus/ARIA remain correct.

### 7.3 “Reise ändern” and “Reisebegleiter fragen”

Current full-width action strips are visually expensive.

Refine them into a compact premium action rail / grouped action treatment.

Requirements:
- retain existing trigger semantics;
- no auto-mounting;
- no extra provider/model call;
- no hidden functionality;
- copy remains truthful;
- phone layout must make both actions easy to discover and use;
- do not merge the actions into one ambiguous control.

### 7.4 Overview summary

Keep “Deine Reise auf einen Blick” but make the summary read more intentionally.

Allowed:
- compact factual stats from already-derived trip data;
- better spacing/typographic rhythm;
- status chips only from existing truth.

Forbidden:
- invented progress percentage;
- arbitrary score;
- fake “complete” state;
- fabricated urgency.

### 7.5 “Jetzt wichtig” = attention queue

This is a core Jetnity differentiator.

Improve:
- priority hierarchy;
- scan speed;
- relationship between each attention item and the trip;
- interaction affordance where an existing action already exists;
- “weitere Hinweise” treatment.

No new action may be invented.
No provider/official checks may be implied if unavailable.
Do not turn every item red/urgent.

On desktop, use width efficiently.
On phone, keep a natural vertical queue.

### 7.6 Destination context

Keep the existing official/safety/seasonal boundaries.

Improve:
- destination label / dates hierarchy;
- compact truth messaging;
- avoid a large empty white card when little data exists;
- preserve “not yet reliable/available” meaning exactly.

No official result fabrication.

### 7.7 Domain overview: Flüge / Unterkunft / Aktivitäten / Mobilität

Current rows are functional but visually generic.

Required:
- show they are four connected parts of the same trip;
- preserve exact click/open/detail semantics;
- preserve status text derived from current truth;
- use existing Lucide icons;
- desktop may use a 2×2 or connected status composition if that improves scanability;
- phone should remain a clean vertical sequence;
- no tiny hit targets;
- selected/active domain is obvious when relevant;
- empty state must feel intentional, not unfinished.

### 7.8 Reiseplan / Organisieren / Vorbereitung

Do not redesign their product logic.

Only harmonize:
- page rhythm;
- spacing;
- heading hierarchy;
- shared navigation and cards;
- detail panel visual continuity.

If a deeper behavior/data change is necessary, STOP and request a TL scope amendment.

## 8. Device-first design matrix

Primary:
- 360×800
- 390×844

Then:
- 768×1024
- 1024×768
- 1280×800
- 1440×900
- 1920×1080

Required evidence:
- first visible screen;
- mode navigation;
- actions;
- overview/attention;
- destination context;
- domain section;
- representative Reiseplan;
- representative Organisieren detail/search entry;
- representative Vorbereitung;
- full-page 390 and 1440;
- 200% text at 360;
- keyboard focus path;
- reduced motion;
- Back/Forward/reload;
- no horizontal overflow;
- no content under sticky header/nav.

## 9. Functional regression requirements

Explicitly verify:
- direct URL mode deep link;
- invalid mode/domain fail-closed canonicalization;
- browser Back/Forward;
- reload;
- mode change keeps unrelated query params;
- compact detail open/close and focus return;
- wide detail open/close;
- domain search remains unmounted until explicit action;
- opening one domain does not auto-search;
- “Reise ändern” remains lazy;
- “Reisebegleiter fragen” remains lazy;
- accepted #638 focus/context behavior remains;
- no new network call on first paint compared with accepted baseline.

## 10. Accessibility / performance

- no new dependency;
- no design system replacement;
- no animation library;
- reduced-motion respected;
- semantic headings/landmarks;
- focus visible;
- target >=44px;
- text inputs >=16px on compact devices;
- 200% text readable;
- no mid-word fragmentation in critical text;
- no global `overflow-x:hidden` masking;
- no unnecessary blur or oversized shadows;
- preserve static/SSR portions where already static;
- no image/vendor expansion.

## 11. Allowed runtime write ownership

Primary:
- `components/trips/TripWorkspace.tsx`
- `components/trips/TripWorkspaceKopf.tsx`
- `components/trips/TripWorkspaceModeNavigation.tsx`
- `components/trips/TripWorkspaceDomainNavigation.tsx`
- `components/trips/TripWorkspaceUebersicht.tsx`
- `components/trips/TripWorkspacePlan.tsx`
- `components/trips/TripWorkspaceDetail.tsx`
- `components/trips/TripWorkspaceNavigation.tsx`

Focused presentation helpers only if necessary:
- new pure/static helpers under `lib/trips/trip-workspace-premium-experience-3*`

Focused tests/audit:
- relevant `lib/trips/*.test.ts`
- new `scripts/trip-workspace-premium-experience-3-audit.mjs`
- own task/report/handoff/self-review
- `docs/evidence/trip-workspace-premium-experience-3/**`

Do not edit:
- package / lock files;
- footer/navbar;
- favicon/icon files;
- homepage/search SEO;
- Supabase/auth;
- DB/schema/migrations;
- provider adapters;
- payments;
- global continuity pointers.

## 12. Parallel collision rule

Before every push and before final delivery, re-fetch:
- PR #655 changed files;
- PR #659 changed files;
- current main.

If either begins to own a Trip Workspace path:
STOP and report collision.

If main moves due #655 or #659 while you are working:
- integrate the new main into this same branch/session;
- preserve the merged changes;
- confirm 0 behind;
- rerun all exact-head gates.

## 13. Local gates

Run:
- focused Trip Workspace tests;
- full `npm test`;
- `npm run typecheck`;
- `npm run lint`;
- `npm run build`;
- `npm run check:setup:ci`;
- `npm run check:dead`;
- `npm run check:exports`;
- `npm run check:deps`;
- `npm run check:api-schutz`;
- `npm run check:schema-bezug`;
- `npm run check:operating-mode`;
- existing Trip Workspace audit where applicable;
- new production-mode premium/cross-device audit.

## 14. Exact-head acceptance

Before STOP:
- exact branch head;
- exact current main;
- merge-base;
- ahead / behind;
- complete changed-path manifest;
- GitHub Actions exact-head SUCCESS;
- Auth job SUCCESS;
- Typecheck/Lint/Tests/Build SUCCESS;
- Vercel Preview READY on exact head;
- no unresolved GitHub review threads;
- no unresolved Vercel toolbar threads;
- all visual evidence from exact or runtime-equivalent implementation head clearly pinned.

## 15. Hard boundaries

No trip schema/data-model redesign.
No provider activation/calls/secrets.
No Supabase/Auth/RLS/schema.
No payment.
No #626.
No PrivacyBee/legal text.
No tracking/ads.
No indexing/robots/launch.
No package/dependency changes.
No favicon/footer/navbar change.
No Production config.
No cost commitment.
No new feature disguised as polish.

## 16. Stop

Stay Draft.
Cursor never Ready.
Cursor never merges.
No follow-up slice.
STOP for independent main-chat Technical-Lead code + visual + mobile + interaction review.
