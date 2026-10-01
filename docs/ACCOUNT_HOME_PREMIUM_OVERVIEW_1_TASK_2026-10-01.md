# Account Home Premium Overview 1 — Binding Task

Date: 1 October 2026
Issue: #690
Baseline: `main@9c494110196a2877f6eba3babe7cf5ae7c00acf1`
Logical agent: **Jetnity Account home premium overview 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Product-owner evidence

Live authenticated desktop screenshots of `/account` were supplied on 1 October 2026.

The account is functionally correct and the map itself already benefited from the merged #640 premium-map slice. The remaining issue is **composition, density and cross-device hierarchy of the Account home page**.

Observed:
- greeting + bookings entry + next-trip area leave substantial dead space on wide screens;
- the next-trip card is clean but visually underuses desktop width;
- the Account home embeds the **full atlas** experience: large map, context/legend, long country chips and the full planned-place card list;
- this makes the personal-home surface too long and lets “Deine Welt” dominate everything below it;
- the exhaustive atlas belongs on `/account/welt`; `/account` should be a premium overview/preview;
- the phone must not become an endless stack of repeated atlas detail.

Do not undo #640.

## Read before editing

Mandatory:
- `docs/ACCOUNT_WORLD_PREMIUM_MAP_UX_1_TASK_2026-09-30.md`
- `docs/ACCOUNT_WORLD_PREMIUM_MAP_UX_1_REPORT_2026-09-30.md`
- `docs/ACCOUNT_WORLD_PREMIUM_MAP_UX_1_HANDOFF_2026-09-30.md`
- `components/account/AccountUebersicht.tsx`
- `components/account/AccountWeltKarte.tsx`
- `components/account/AccountNavigation.tsx`
- `app/account/page.tsx`
- existing account/world-map tests and audit harness

## Product outcome

`/account` should feel like a polished personal Jetnity travel home:
1. immediate welcome / personal-home identity;
2. next action / next trip;
3. compact access to confirmed bookings;
4. an elegant **Deine Welt preview**;
5. clear path into full `/account/welt`.

The full atlas page keeps full detail.

No second dashboard. No invented metrics. No duplicate product domains.

## A. Account-home hierarchy

Improve the desktop composition without turning it into a dense admin dashboard.

Expected direction:
- reduce visual dead space around greeting/bookings/next-trip;
- use wide screens intentionally;
- next-trip block may become a balanced responsive composition with title/meta/status and actions distributed deliberately;
- booking entry should feel like an intentional secondary action, not a loose text fragment;
- maintain calm premium spacing and strong typography;
- do not add fake booking counts, provider truth, prices or readiness data.

On phone:
- single-column flow;
- primary CTA obvious;
- no text squeezed beside controls;
- no action row smaller than 44px;
- no horizontal overflow.

## B. Overview-specific world preview

The current `AccountWeltKarte` serves both `/account` and `/account/welt`. Introduce an explicit presentation mode/variant if that is the cleanest solution.

**Full atlas mode**:
- remains the current #640 experience on `/account/welt`;
- keep full country list, planned-place cards, marker selection, legend, caveats and atlas breakout behavior unless a narrowly necessary shared bug is found.

**Account overview mode**:
- preserve the same map truth, colours/patterns, markers and keyboard semantics;
- keep visited/planned/both counts;
- keep a compact legend or equivalent visible state language;
- keep selected-marker → selected-place/trip context;
- make the map a strong preview, but do not let it take over the full page;
- **do not render the exhaustive country-chip list on Account home**;
- **do not render the full planned-place card list on Account home**;
- provide a clear, premium CTA into `/account/welt`;
- do not break out to an excessive desktop width if that creates a disproportionate Account-home section;
- legal/truth/provenance caveats must remain visible/accessible, but can be hierarchy-secondary;
- no external tile/network service.

The overview must not hide or reinterpret data; it simply avoids duplicating the complete atlas listing already available one click away.

## C. Preserve truth/interaction boundaries

Must remain:
- visited and planned are separate truths;
- planned is never a claim of visit;
- no visit inferred from a trip;
- no trip changed by a visit;
- small-country shape fallback;
- marker coordinates;
- clustered-marker chooser;
- keyboard/focus behavior;
- reduced motion;
- colour not sole state carrier;
- selected state;
- read-error/empty states remain honest;
- next-trip active/upcoming classification remains device-calendar based;
- booking entry remains based on existing booking route/copy.

## D. Cross-device acceptance matrix

Capture and measure at least:
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
- landscape 844×390
- 200% text at 360×800
- desktop zoom 125% and 150%

States:
- normal with next trip + visited/planned world;
- empty account;
- trip read error;
- visit read error;
- map marker selected;
- clustered marker state where available.

Measure:
- horizontal overflow = none;
- first-viewport hierarchy;
- map/card bounds;
- page-height reduction on Account home vs current full-atlas embedding;
- min interactive target >=44px;
- keyboard tab/focus;
- selected marker context;
- no external network origin;
- no console error/hydration issue;
- no content hidden behind fixed/sticky nav;
- no 200%-text character-column collapse.

## E. Preferred file ownership

Allowed runtime:
- `components/account/AccountUebersicht.tsx`
- `components/account/AccountWeltKarte.tsx`
- `components/account/AccountAuditClient.tsx`
- `app/account/page.tsx` only if required for local spacing/composition
- focused new/updated account-overview visual tests
- one bounded audit script
- lane-specific evidence/docs

Do **not** edit:
- `components/account/AccountNavigation.tsx` unless a measured blocking defect exists; stop and report first
- world-map truth/projection/geography derivation files
- visit persistence/actions/forms
- global CSS/design tokens
- package/lockfile
- Trip Workspace
- Supabase/Auth/DB/provider/payment
- files owned by #686, #687, #689
- global continuity files

## F. Parallel collision rule

Active lanes:
- #686 Source Catalog gateway
- #687 Freshness/gap policy
- #689 Registry traveller → Preparation integration

Do not touch any file owned by those lanes.

## G. Tests / proof

Add focused regression tests proving:
- Account home uses overview variant;
- `/account/welt` keeps full atlas mode;
- overview omits exhaustive country chip list and full planned-place list;
- full atlas still renders them;
- counts/marker/selected-context truth unchanged;
- next-trip link/status and booking link remain;
- no new provider/search/network call;
- no invented data;
- empty/error states remain distinct.

Run:
- focused tests
- full `npm test`
- typecheck
- lint
- build
- account audit
- new visual matrix
- `git diff --check`

## H. Stop

Push one fully validated exact head.
Record:
- session URL
- originalModelName
- exact head
- merge-base
- ahead/behind
- changed-file manifest
- all viewport evidence/results

Stay Draft.
Do not Ready.
Do not merge.
Do not start a follow-up slice.
STOP for independent Technical-Lead code + visual + interaction review.
