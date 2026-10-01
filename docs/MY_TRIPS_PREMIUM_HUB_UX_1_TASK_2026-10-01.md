# Meine Reisen Premium Hub UX 1 — Binding Task

Date: 1 October 2026
Issue: #694
Baseline: `main@ed5350e702f2b6b248cf49ae366420cf1b49039a`
Logical agent: **Jetnity My Trips premium hub UX 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Product-owner evidence

Live authenticated screenshots of `/reisen` show a functionally correct but visually under-refined trip hub.

Observed:
- “Aktiv”, “Vergangen” and “Ohne Datum” each consume vertical space even when empty;
- upcoming trips are clear but feel like isolated cards rather than one premium hub;
- “Archivieren” sits visually detached below each card;
- wide desktop space is underused;
- the hierarchy is correct but not yet at the quality level of merged #661 Trip Workspace premium cockpit;
- on phone/tablet the same page must remain compact, obvious and touch-friendly.

## Quality method

Use the **method** of #661, not its layout:
1. user understands the page in 2–3 seconds;
2. hierarchy before decoration;
3. phone-first at 360/390;
4. preserve truth and interaction semantics exactly;
5. measure real layout issues, not style by taste;
6. test 200% text, keyboard focus, >=44px targets, reduced motion if used;
7. capture before/after evidence;
8. no new network call or hidden side effect from polish.

## Preserve these contracts

Do not regress:
- AP-3 derived groups exactly:
  - Aktiv
  - Kommend
  - Vergangen
  - Ohne Datum
- device-calendar classification through existing logic;
- AP-3 search semantics;
- 200-trip loaded-selection boundary and visible fail-closed copy;
- Error != Empty;
- AP-4 archive lifecycle;
- restore only with valid previous-status provenance;
- archived trips stay outside normal AP-3 groups;
- guest/account share `/reisen`;
- guests do not gain account archive behavior;
- card data remains only existing TripSummary truth;
- no mini Workspace in the hub;
- no readiness/safety/official/provider/commercial content added.

## A. Header / search / create hierarchy

Improve the top composition.

Requirements:
- title/lead/search/create should feel like one coherent hub;
- “Neue Reise” remains obvious on account;
- search stays local over loaded trips only;
- no new server request per keystroke;
- desktop may use width more intentionally;
- phone uses a clean single-column flow;
- inputs >=16px on compact devices;
- controls >=44px;
- no horizontal overflow.

## B. Group presentation

Current empty groups create large dead zones.

Allowed:
- derive and show real counts from existing grouped arrays;
- compactly represent empty groups without rendering a full tall section;
- render full card grids only for groups with entries;
- search mode may continue hiding empty groups as today;
- group labels and truth must remain understandable.

Preferred direction:
- compact group overview / segmented summary / status strip with real counts;
- then sections only where trips actually exist;
- do not reinterpret “Aktiv” as saved status or vice versa;
- no fake “0%”, score, urgency or progress.

## C. Trip cards

Improve visual density and scanability.

Preserve:
- title;
- ordered destination identity;
- saved trip status;
- date range;
- traveller count;
- day/item count;
- account/guest truth;
- link to exact trip.

Allowed:
- stronger hierarchy;
- less empty vertical space;
- responsive compact variant;
- consistent card height where useful;
- subtle visual differentiation of active/upcoming/past only if derived from the group, not stored as new truth.

Do not add provider/readiness/booking/official facts.

## D. Archive action

The current archive button is visually detached below the linked card.

Improve composition while preserving valid HTML:
- no interactive element nested in the trip link;
- archive/restore must remain a separate explicit control;
- destructive-ish lifecycle action must not become an icon-only tiny target;
- error feedback stays attached to the correct trip;
- no accidental archive from clicking the card.

Preferred: one visual card shell with linked main body and a clearly separated action footer, if it can be done without nested interactivity.

## E. Empty states

For no active/past/undated trips:
- preserve the factual message;
- reduce wasted page height;
- do not imply a data error;
- distinguish true empty account from groups that are merely empty.

Main all-account empty state and load-error state remain unchanged in semantics.

## F. Search

Preserve current search contract.

Improve only presentation:
- clear local search state;
- no-match state compact and obvious;
- if useful, show matching count from already-loaded rows;
- no backend/provider call;
- no search over fields not already in current contract unless a later scope change is approved.

## G. Cross-device matrix

Audit:
- 320×568
- 360×800
- 390×844
- 412×915
- 430×932
- 768×1024
- 820×1180
- 1024×768
- 1280×800
- 1440×900
- 1728×1117
- 1920×1080
- 844×390 landscape
- 200% text at 360×800
- desktop zoom 125% and 150%

States:
- 2 upcoming, all other normal groups empty (matches PO screenshot);
- one active + upcoming + past + undated;
- archive present;
- search with matches;
- search no match;
- empty account;
- data read error;
- 200-limit notice.

Measure:
- total page height before/after for the PO-like 2-upcoming state;
- first viewport hierarchy;
- card bounds;
- action alignment;
- horizontal overflow;
- min target size;
- text wrapping;
- keyboard focus;
- no content hidden behind nav;
- no console/hydration errors.

## H. Preferred ownership

Allowed runtime:
- `components/trips/KontoReisenGruppen.tsx`
- `components/trips/KontoReiseEintrag.tsx`
- `components/trips/Reisekarte.tsx`
- `components/trips/KontoReiseArchivAktion.tsx`
- `app/(public)/reisen/page.tsx` only for local header/composition
- optional pure presentation helper under `lib/trips/my-trips-premium-hub-ux-1*.ts`
- focused tests
- one bounded audit script
- lane-specific docs/evidence

Do NOT edit:
- `components/account/AccountNavigation.tsx`
- `lib/account/reise-lage.ts`
- `lib/account/reise-archiv.ts`
- archive actions/persistence
- Trip Workspace components
- Account home / World files owned by #691/#693
- files owned by #686/#689
- Supabase/Auth/DB/provider/payment
- package/lockfile
- global CSS/design tokens
- global continuity files.

If a truth/domain file appears necessary, STOP and report before widening scope.

## I. Tests

Prove at minimum:
- AP-3 group memberships unchanged;
- device-calendar timing unchanged;
- empty group truth still represented but compact;
- only groups with trips render full grids;
- search behavior unchanged;
- archive action remains outside the trip link;
- archive and restore still target exact trip;
- guest card semantics unchanged;
- Error != Empty remains;
- no new fetch/provider call from the client hub;
- no new truth field or status model.

Run:
- focused tests;
- full npm test;
- typecheck;
- lint;
- build;
- existing account/reise group tests;
- new visual audit;
- git diff --check.

## J. Parallel drift

Active lanes may merge during this work.
Before final push:
- fetch current main;
- integrate it into this branch/session;
- preserve merged work;
- remain 0 behind;
- rerun full exact-head gates and visual matrix.

## K. Stop

Push one exact validated head.
Record session URL, originalModelName, exact head, merge-base, ahead/behind, changed files, local gates and cross-device evidence.
Stay Draft.
Do not Ready.
Do not merge.
Do not start a follow-up.
STOP for independent Technical-Lead code + visual + mobile + interaction review.
