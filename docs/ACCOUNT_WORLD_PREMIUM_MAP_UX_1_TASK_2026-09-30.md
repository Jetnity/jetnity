# Jetnity Account / Meine Welt Premium Map UX 1 — TASK

Stand: 30 September 2026
Status: **BOUNDED VISUAL/INTERACTION AUDIT + REPAIR / NO DATA-TRUTH CHANGE**

Issue: #639
Branch: `fix/account-world-premium-map-ux-1`
Baseline: `main@20bf11b0cf24460cf01d9dfe487b89bbfe555191`

## 1. Product-owner evidence

Live desktop screenshots of `/account/welt` show a technically correct but visually underpowered world-map experience.

Current strengths already accepted:
- Natural Earth cartography;
- visited/planned separation;
- no external network map origin;
- deterministic markers;
- shape/pattern accessibility;
- small-state fallback;
- keyboard interaction;
- existing audits are green.

Do not undo those strengths.

## 2. User outcome

Opening **Meine Welt** should feel like opening a personal Jetnity travel atlas.

At first glance the user should understand:
- where they have explicitly confirmed visits;
- what is only planned;
- what is both;
- which place is selected;
- which trip belongs to that place.

The map should feel premium, calm and intentional, not like a technical status panel.

## 3. Read before editing

- `docs/REALISTIC_WORLD_CARTOGRAPHY_1_VISUAL_EVIDENCE_2026-09-17.md`
- `docs/EXPLICIT_VISIT_HISTORY_1_VISUAL_EVIDENCE_2026-09-17.md`
- `components/account/AccountWeltKarte.tsx`
- `components/account/WeltZustaende.tsx`
- `components/account/AccountBesuche.tsx`
- current world-map tests and account UI audit harness

## 4. Baseline visual audit

Capture and measure baseline at:
- 360×800
- 390×844
- 768×1024
- 1024×768
- 1280×800
- 1440×900
- 1920×1080

Required states:
- empty
- visited only
- planned only
- visited + planned
- both on same country
- selected marker
- clustered markers / group chooser
- small-state point fallback
- supported read-error state

Record:
- horizontal overflow;
- map/card bounds;
- first-viewport hierarchy;
- map-to-page width ratio;
- marker visibility;
- selected-state visibility;
- minimum target size;
- keyboard/focus;
- external network origins;
- visual distinction of visited/planned/both without relying only on colour.

## 5. Repair direction

### A. Map surface
- stronger distinction between ocean and neutral land;
- visited/planned/both states should read immediately;
- reduce washed-out all-mint appearance;
- soften graticule prominence;
- retain readable boundaries;
- use subtle depth/gradient/vignette only if it stays performant and legible;
- map remains SVG/local, no tile service.

### B. State language
- visited: confident, rich Jetnity state;
- planned: lighter/aspirational plus existing non-colour pattern;
- both: additive combination, not a third unrelated colour;
- keep textual legend/list equivalents.

### C. Markers / selection
- improve idle, hover, focus and selected states;
- selected marker must clearly correspond to selected place/trip detail;
- preserve truthful coordinates and 44px hit areas;
- clustered-marker chooser remains explicit and keyboard-safe.

### D. Desktop composition
- use wide space intentionally;
- map should be the visual hero;
- selected place/trip context should feel integrated with the map card rather than detached;
- avoid huge dead zones;
- keep visit-management sections below clearly separated from the atlas experience.

### E. Tablet/mobile
- keep the map readable and tappable;
- no overlay that obscures the map;
- selected detail may stack below;
- legend/state chips must wrap cleanly;
- no horizontal overflow;
- preserve focus/scroll context.

### F. Information density
- provenance/border disclaimer remains visible/accessible but visually secondary;
- explicit visit-truth disclaimer remains;
- do not remove legal/truth caveats, only hierarchy them better.

## 6. Projection boundary

**Do not change the map projection in this slice.**

If the agent concludes the equirectangular projection itself is the dominant remaining quality problem after the bounded visual/composition repair, document that as a separate follow-up candidate with evidence. Do not implement it here.

## 7. Exclusive write ownership

Allowed runtime files:
- `components/account/AccountWeltKarte.tsx`
- `components/account/WeltZustaende.tsx`
- `components/account/AccountBesuche.tsx` only for atlas/page composition and spacing around the map
- focused account/world-map visual test files under `lib/account/*premium-map-ux-1*.test.ts`
- bounded audit script `scripts/account-world-premium-map-ux-1-audit.mjs`
- own task/report/handoff/self-review and `docs/evidence/account-world-premium-map-ux-1/`

Do not write:
- `lib/account/world-map*.ts`
- `lib/account/welt-ansicht.ts`
- `lib/account/welt-laender.ts`
- visit-history persistence/actions/form logic
- Trip Workspace files owned by #638
- design tokens/global CSS
- package/lockfile
- Supabase/Auth/DB

If a truth/projection/shared-contract write appears necessary, STOP and return to TL.

## 8. Acceptance criteria

- map feels visually distinct from a plain reporting widget;
- desktop has deliberate composition at 1280/1440/1920;
- ocean, neutral land, visited, planned and both are distinguishable;
- colour is never the sole differentiator;
- selected marker/place relationship is obvious;
- no marker coordinate drift;
- cluster chooser remains correct;
- small-state fallback remains readable;
- no horizontal overflow;
- >=44px interactive targets;
- reduced-motion and keyboard behavior preserved;
- no external map/network origin;
- no new dependency;
- existing visit/planned truth tests unchanged in semantics;
- account UI audit, focused tests, typecheck, lint, full tests and build pass.

## 9. Deliverables

- baseline and after evidence at all required viewports/states;
- report with visual decisions and measured outcomes;
- changed-file manifest;
- focused regression tests;
- exact final head / merge-base / ahead-behind;
- actual Cursor session URL + `originalModelName`.

Required model: **Grok 4.7 High Fast**, not Auto.

Cursor remains Draft. No Ready, no merge, no follow-up slice.

STOP for independent main-chat Technical-Lead **code + visual + interaction** review.
