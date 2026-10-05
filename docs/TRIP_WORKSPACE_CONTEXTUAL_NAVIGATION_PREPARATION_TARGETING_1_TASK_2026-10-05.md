# Trip Workspace Contextual Navigation + Preparation Targeting 1 — Task

Date: 5 October 2026
Issue: #840
Status: **BINDING / U02 + U03 / PRESENTATION-NAVIGATION ONLY / NO DB / NO OFFICIAL-TRUTH CHANGE**

## 1. Baseline and evidence

Baseline:
- main: `3ba69f15907e0652cfe83478dabcf91904ca9a00`
- mode: `NORMAL`
- #836/#837 and #838/#839 are merged/post-merge verified/closed
- no active implementation writer at dispatch
- latest processed Guardian MATERIAL/triage remains the current #748 state; re-read live before edits

Independent audit U02:
- details do not have a reliably recognizable return address;
- a plan item detail is not represented as its own URL/history state;
- browser Back/saved link cannot reconstruct item/day selection;
- the same "Zurück zur Reise" copy means different destinations.

Independent audit U03:
- dedicated Preparation mode still shows another global "Vorbereitung öffnen" step;
- Official Attention only enters Preparation mode and does not target the affected section/traveller;
- section open state is lost when Preparation unmounts.

Re-read live main/mode/#751/#748/Issue/PR and affected code before edits. Live evidence wins. STOP on overlapping writer/material drift.

## 2. Writer

Logical writer: **Jetnity Trip Workspace contextual navigation 1**, Generation 1.

Execution: **Codex Desktop**
Required model: **GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`).

No Cursor. No second writer. Keep PR Draft.

## 3. Product goal

After this slice:
- opening a plan item creates an explicit, bookmarkable/replayable workspace navigation state;
- browser Back, Escape and visible Back restore the same parent context;
- a gap opened from Overview can return to Overview rather than always falling into Organisieren root;
- direct/deep URLs degrade safely when the referenced item/day/traveller no longer exists;
- Preparation mode exposes its work areas immediately;
- Official Attention can carry an explicit workspace-local target to the correct preparation section and affected traveller;
- preparation section open/closed choices survive a temporary mode switch.

No new travel truth or persistence is introduced.

## 4. URL/history contract

Extend the existing workspace URL contract; do not build a parallel router.

Use bounded query keys with names chosen consistently in the implementation. Preferred semantic fields:
- `ansicht`
- `bereich`
- active plan day id
- selected plan item id
- preparation section id
- preparation traveller client ref

Exact query key names are an implementation detail but must be documented and tested.

### Mode validity

- plan-day/item fields are valid only for `ansicht=plan`;
- preparation-target fields are valid only for `ansicht=vorbereitung`;
- organize domain remains the existing `ansicht=organisieren&bereich=...`;
- overview has no workspace selection fields.

### Parsing/canonicalization

- only one value per owned key;
- bounded string lengths using existing Trip/Readiness id constraints where available;
- never parse semantic meaning from the contents of an opaque id/ref;
- preserve unrelated foreign query params;
- malformed/duplicate/invalid-owned query params fail closed to the nearest safe parent state and set canonical replace;
- no selected item means no selected-item query;
- no preparation target means no preparation-target query.

### Runtime graph validation

Syntactically valid URL refs must be validated against the current Trip graph:
- selected item must exist;
- if it belongs to a day, current active day must become that real `dayId`;
- a stale/wrong day query is corrected to the item's actual day rather than trusted;
- an unplanned item has no invented day;
- deleted/stale item => degrade to plan/day parent safely;
- preparation traveller target must exist in the current applicable traveller slots before focusing; stale traveller target degrades to section-only.

No URL id becomes travel truth.

## 5. History/return contract

Every drill-in pushed from an existing workspace state must remember that parent navigation context using history state only; do not encode a fake origin as domain truth.

### Plan item
Opening an item:
- switches/keeps `ansicht=plan`;
- sets selected item in URL;
- sets real day in URL when the item has one;
- pushes one browser-history entry.

Visible Back / Escape:
- if the current detail was opened by an internal child push, call browser history Back so all three mechanisms share the same parent state;
- if landed directly on a deep link with no internal parent marker, fall back to the canonical plan parent (same real day, no item) via replace/push as appropriate.

Visible label:
- plan item: **"Zum Tagesplan"**.

### Organize gap
Opening a gap from Overview/another parent already pushes a mode/domain entry.

Visible Back / Escape:
- if an internal parent marker exists, browser Back restores that exact parent (e.g. Overview);
- direct organize deep link fallback goes to Organisieren root.

Visible label:
- internal origin Overview: **"Zur Übersicht"**;
- direct/fallback organize detail: **"Zur Organisation"**.

### Browser Back
Popstate must reconstruct:
- mode;
- selected item/day;
- preparation target;
- correct detail open/closed state.

No extra history entry may be written while handling popstate.

### Focus
Keep current good behavior:
- detail open moves focus appropriately;
- close/back restores source trigger when still mounted;
- deep-link fallback focuses the relevant mode/parent heading.

## 6. Preparation mode — remove the extra global gate

`Reisevorbereitung` is currently used only by TripWorkspace.

In the dedicated `ansicht=vorbereitung`:
- remove the global `Vorbereitung öffnen/schliessen` disclosure layer;
- show the preparation area navigation and section list immediately;
- keep each individual preparation section as a collapsible `<details>` area;
- default section-open behavior may remain current (currently open) unless a smaller current UX contract exists.

Do not remove the disclaimer, counts, status, section boundaries or official/personal distinction.

## 7. Preserve section state across mode switches

Lift only the **presentation open/closed state** of preparation sections high enough that leaving and returning to Preparation does not reset it.

Requirements:
- state is workspace-local, not persisted to DB/localStorage;
- default state is deterministic;
- user collapse/expand choices survive switching to Plan/Overview/Organisieren and back;
- direct target navigation always opens its target section even if the user previously collapsed it;
- no section state is treated as readiness/official truth.

A controlled `Set<PreparationBereichId>` or equivalent pure structure is acceptable.

## 8. Typed Preparation target on AttentionAction

Do not parse `AttentionPunkt.id`, titles, traveller labels or scope strings to navigate.

Minimally extend the existing presentation-only `AttentionAktion` with an optional explicit preparation-navigation payload.

Preferred shape conceptually:
- target preparation section id;
- optional existing `travellerClientRef`.

Keep `art='bereich'` / current workspace domain semantics compatible.

For **Official** Attention points:
- `insufficient_context` should target `reisende-dokumente` and the exact existing `slot.travellerClientRef`;
- other official unavailable/unchecked/stale results should target `offizielle-anforderungen` and may carry the exact existing traveller ref where already known;
- no missing fact, citizenship, credential or country is inferred from the opaque ref.

Existing Coverage actions must remain unchanged.

Grouping U01 must still group only equal actions/targets; if the optional preparation target differs, those points must not be silently grouped under one action.

## 9. Preparation target behavior

When TripWorkspace receives an Attention action with a preparation target:
- push canonical `ansicht=vorbereitung` URL including section and optional traveller ref;
- open the target section;
- scroll/focus to the targeted workspace element after mount;
- if traveller ref is valid and the corresponding traveller card is rendered, focus that card's heading/anchor;
- otherwise focus the target section summary/heading;
- repeated activation of the same target must retrigger focus/scroll (use an explicit request/version signal if needed).

When a saved/deep preparation URL is opened:
- same target behavior occurs after validation;
- no user input or DB write occurs merely from navigation.

## 10. Preparation markup

Add only presentation hooks needed for target focus:
- `data-preparation-section` already exists;
- add an explicit stable presentation hook for traveller cards using the existing `slot.clientRef`;
- a focused heading/anchor may use `tabIndex=-1`;
- do not expose the raw client ref as visible copy;
- do not use traveller ref to infer identity/citizenship.

## 11. Back copy / component contract

Remove ambiguous **"Zurück zur Reise"** from detail/compact navigation where the real parent is known.

Pass one explicit return label/action contract from TripWorkspace to:
- `TripWorkspaceDetail`;
- compact sticky `TripWorkspaceNavigation`.

Do not let child components guess history origin.

## 12. Required tests

### URL mode contract
- unrelated query params preserved;
- plan item/day serialize + parse;
- item params ignored/canonicalized outside Plan;
- preparation section/traveller serialize + parse;
- preparation params ignored/canonicalized outside Preparation;
- duplicate/malformed owned values fail closed;
- long invalid refs rejected/canonicalized;
- overview strips owned selection params.

### Current graph reconciliation
- real item deep link restores item + actual day;
- stale/wrong queried day corrected to actual item day;
- unplanned item opens without invented day;
- missing/deleted item degrades to plan parent;
- stale traveller ref degrades to section only.

### History U02
- Overview -> organize gap -> visible Back returns Overview;
- same flow browser Back returns Overview;
- Escape uses same return behavior;
- direct organize gap URL fallback returns Organisieren root;
- Plan -> item -> visible Back returns same day plan;
- browser Back does the same;
- direct plan-item deep link close returns plan/day parent;
- back copy is "Zur Übersicht", "Zur Organisation" or "Zum Tagesplan" according to explicit parent contract;
- no duplicate push on popstate.

### Preparation U03
- entering preparation shows sections without an extra global "Vorbereitung öffnen" action;
- collapsing a section, switching mode, returning preserves collapsed state;
- direct Attention insufficient-context opens `reisende-dokumente`;
- exact traveller target focuses the matching traveller card;
- missing traveller target focuses section only;
- official unavailable action opens/focuses `offizielle-anforderungen`;
- deep URL reproduces preparation target;
- repeated same target retriggers focus;
- no raw traveller ref becomes visible text.

### Attention regression
- Coverage actions unchanged;
- U01 grouping still preserves member count and does not merge different preparation targets;
- canonical Attention points unchanged except the explicit presentation action payload;
- no official evaluation/result/status mutation.

### Accessibility/device
- browser Back, visible Back and Escape keyboard flow;
- focused headings use no positive tabIndex;
- no focus trapped in hidden/inert surface;
- 360/390 mobile no horizontal overflow;
- desktop detail placement unchanged unless required for return semantics.

## 13. Allowed material files

Runtime only as required:
- `lib/trips/workspace-mode.ts`
- `lib/trips/detail.ts`
- `lib/trips/attention.ts`
- `lib/readiness/preparation-premium-experience-5.ts`
- `components/trips/TripWorkspace.tsx`
- `components/trips/TripWorkspaceDetail.tsx`
- `components/trips/TripWorkspaceNavigation.tsx`
- `components/trips/Reisevorbereitung.tsx`
- `components/trips/TripWorkspacePlan.tsx` only if callback/day synchronization needs a type seam, not for layout redesign

Tests:
- existing workspace-mode/detail/attention/preparation tests
- existing cross-device/premium tests
- at most one new narrowly scoped contextual-navigation test file
- bounded audit script only if current harness genuinely cannot prove browser Back/deep-link/focus behavior

Docs:
- immutable TASK
- REPORT
- HANDOFF
- SELF_REVIEW
- bounded evidence only if a browser audit is executed

If another runtime surface, route, database or API is needed: STOP before scope expansion.

## 14. Non-scope

Absolutely no:
- DB migration/write;
- new API route;
- Official Truth runtime/change;
- B01/B04/B06;
- U04/B07/B05;
- U05/U06/U07;
- search-provider behavior;
- plan ordering;
- traveller data model;
- readiness persistence;
- broad visual redesign;
- provider/model call;
- Production mutation;
- follow-up slice.

## 15. Validation

Run:
- `git diff --check`
- `npm run check:operating-mode`
- focused workspace-mode/detail/attention/preparation/navigation tests
- relevant browser/cross-device audit for Back/deep-link/focus
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run check:api-schutz`
- `npm run check:schema-bezug`
- `npm run check:dead`
- `npm run check:exports`
- `npm run check:deps`
- `npm run build`

Do not fabricate PASS.

## 16. Delivery

Before delivery:
- re-read main/mode/#751/#748/PR;
- prove immutable task;
- exact changed files;
- merge-base/ahead/behind;
- review threads;
- exact model/xhigh evidence;
- no hosted DB/Production mutation.

Create REPORT/HANDOFF/SELF_REVIEW.
Keep PR Draft.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**

Do not Ready/merge/start U04/B07/B05/B01/follow-up.
