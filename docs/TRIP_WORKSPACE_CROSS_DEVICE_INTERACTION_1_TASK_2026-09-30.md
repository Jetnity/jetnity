# Jetnity Trip Workspace Cross-Device Interaction & Layout 1 — TASK

Stand: 30 September 2026
Status: **BOUNDED UX/INTERACTION AUDIT + REPAIR / NO PROVIDER OR PRODUCTION AUTHORITY**

Issue: #637
Branch: `fix/trip-workspace-cross-device-interaction-1`
Baseline: `main@20bf11b0cf24460cf01d9dfe487b89bbfe555191`

## 1. Product-owner evidence and exact defect

Live desktop screenshots show:
1. click `Flugstrecke noch offen` in `Jetzt wichtig`;
2. workspace becomes overview-left / detail-right;
3. click `Flug suchen`;
4. actual `FlugSuche` surface appears much lower in the document;
5. user must visually search for the newly opened action surface.

Source root cause on baseline:
- `TripWorkspace.tsx` renders overview/detail inside a desktop grid;
- `FlugBestand`, `UnterkunftBestand`, mobility, `FlugSuche`, `HotelBereich`, activities render after that grid;
- therefore the detail CTA and the resulting work surface do not share one desktop interaction container.

This is a real new UX defect report. Do not treat it as a generic rerun of #506/#513.

## 2. User outcome

Jetnity must feel like one guided workspace on every device.

For every interaction, the traveller must immediately understand:
- where they are;
- what changed after the click;
- where the newly opened content is;
- what the next action is;
- how to return.

No action may mount a work surface somewhere else in the page without clear spatial/focus continuity.

## 3. Required design direction

### Wide desktop / laptop
Create one coherent active-domain work area.

The overview and the active domain may use a responsive split, but:
- detail context + existing domain items + explicit search/work surface must remain spatially associated;
- clicking a detail CTA must reveal the domain work surface in the right-side context, not beneath the whole split;
- alignment and vertical rhythm must feel intentional;
- if search requires more width, use an intentional responsive column ratio or work-surface expansion; do not blindly force 50/50;
- avoid duplicate back controls or redundant headings.

### Tablet / narrow laptop
Use actual width/capacity to decide split vs stacked mode.
- no squeezed two-column fields;
- no mostly-empty side column;
- no hidden action below unrelated content.

### Phone
Preserve compact single-task flow.
- opening detail/search keeps domain identity + return control visible;
- focus moves to meaningful content only when necessary;
- no unrelated footer/bottom jump;
- close/Escape restores the invoking control or useful overview context;
- search stays explicit.

## 4. Audit before repair

Instrument the baseline before substantive layout changes.

Record for each required path:
- viewport;
- action sequence;
- scrollY;
- bounding boxes of invoking row/CTA, detail heading, active work-surface heading and first actionable field;
- activeElement/focus;
- whether the new work surface intersects the viewport after the click;
- whether a manual scroll is required to discover it.

Required paths:
- Jetzt wichtig → flights gap → Flug suchen
- Overview → flights gap → search
- accommodation → search
- activities → search
- mobility
- existing item detail
- close/reopen
- keyboard activation/Escape

Required viewports:
- 360×800
- 390×844
- 768×1024 or equivalent portrait tablet
- 1024×768
- 1280×800
- 1440×900
- 1920×1080

Use synthetic/local or safely intercept provider endpoints. No real provider/model calls.

## 5. Repair scope

Allowed runtime ownership:
- `components/trips/TripWorkspace.tsx`
- `components/trips/TripWorkspaceDetail.tsx`
- `components/trips/TripWorkspaceNavigation.tsx`
- `components/trips/TripWorkspaceUebersicht.tsx` only if needed for interaction markers/layout seam
- `components/trips/FlugSuche.tsx` only for focus/heading/layout seam, not flight business logic
- `components/trips/HotelBereich.tsx` only for equivalent interaction seam
- `components/trips/AktivitaetenBereich.tsx` only for equivalent interaction seam
- `components/trips/MobilitaetBereich.tsx` only for equivalent interaction seam
- focused tests under `lib/trips/*cross-device-interaction-1*.test.ts`
- bounded audit script `scripts/trip-workspace-cross-device-interaction-1-audit.mjs`
- own task/report/handoff/self-review and evidence under `docs/evidence/trip-workspace-cross-device-interaction-1/`

Before touching any additional path, STOP and return to TL.

## 6. Hard product constraints

Do not change:
- provider truth or provider activation;
- search request/response contracts;
- booking/commercial provenance truth;
- route/trip/traveller data contracts;
- official/readiness semantics;
- Guest→Account truth;
- Supabase/Auth/RLS/schema/functions;
- payments;
- public indexing/launch;
- #626;
- Next.js/dependencies/lockfile;
- global design tokens.

Do not auto-run flight/hotel/activity search merely because a gap opens.

## 7. Acceptance criteria

### Context continuity
- On 1280/1440/1920, `Flug suchen` reveals the flight search inside the active domain context and the traveller does not need to hunt below an unrelated full-width area.
- Equivalent hotel/activity/mobility behavior is structurally consistent.
- Search/work-surface heading or first relevant control becomes visible without an arbitrary long jump.

### Layout
- Desktop active-domain layout reads as one workspace, not unrelated cards.
- No obvious asymmetric orphan panel/dead column caused by opening a detail.
- Tablet chooses a deliberate split/stack.
- No horizontal overflow at required viewports.

### Focus / scroll
- mouse activation does not steal focus unnecessarily;
- keyboard activation lands on a meaningful domain work-surface target;
- compact opening keeps return + identity visible;
- close/Escape restores focus/useful context;
- data rerenders do not repeatedly force scroll.

### Accessibility
- hidden work areas remain `hidden`/inert appropriately;
- controls retain >=44px targets where already required;
- logical heading hierarchy;
- reduced-motion respected;
- no inaccessible visual-only state transition.

### Regression
- guest and account use the same workspace interaction shell;
- explicit-search rule preserved;
- current tests remain green;
- typecheck/lint/full tests/build/CI/Auth/Vercel Preview green.

## 8. Deliverables

- before/after instrumented evidence for all required viewport classes
- report with findings and exact repair decisions
- changed-file manifest
- focused regression tests
- exact final head / merge-base / ahead-behind
- actual Cursor session URL + `originalModelName`

Required model: **Grok 4.7 High Fast**, not Auto.

Cursor remains Draft. Cursor does not Ready, merge, contact providers or start a follow-up slice.

STOP for independent main-chat Technical-Lead **code + visual + interaction** review.
