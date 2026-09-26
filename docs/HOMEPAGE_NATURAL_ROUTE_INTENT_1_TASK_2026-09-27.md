# Homepage Natural Route Intent 1

Date: 2026-09-27
Status: ACTIVE / BOUNDED RUNTIME SLICE / DO NOT READY / DO NOT MERGE
Base: `8faa0447a89d613cb7d00c8173c3bda57a3524fc`
Branch: `feat/homepage-natural-route-intent-1`
Parent target: Issue #110
Prerequisite #543: MERGED as `d03a048624b42cb0b2a1cb0e146aed238e23041f`

## Binding Slice Precheck — Technical Lead

### Current contracts verified

- Homepage `StartzielForm` already supports ordered confirmed destination occurrences.
- `route-einstieg.ts` transports only confirmed canonical Place IDs via `zielId` / repeated `zielIds`.
- Order and intentional duplicates are preserved.
- `/planen` server-revalidates the entire route against `public.places`; partial routes are refused.
- `TripPlanner` accepts the confirmed primary + ordered additional destinations.
- Guest-One-Trip gate remains downstream and unchanged.
- `OrtSuche` is canonical: typed free text is never a Place; only a selected `OrtOption.id` is truth.
- Public place search is local `public.places` search; no live GeoNames/geocoding/provider call.
- Hero visual direction is already established and must remain.

### Why this slice is now eligible

Issue #110 explicitly deferred runtime while earlier Account work and the confirmed-route foundation were incomplete. #543 is now merged; Account Counts local acceptance has reached real `LOCAL_FULL_STACK_PASS`. No provider/Production/Auth/DB gate is required for this bounded client-side intent layer.

## Product goal

Let a traveller type normal route intent in the existing hero input, for example:

- `Peru`
- `Lima und Cusco`
- `Thailand, Kambodscha und Vietnam`

without introducing rigid Ziel-1/2/3 fields and without persisting guessed text.

Jetnity may **recognize intent**, but every actual destination must still be explicitly confirmed through the existing canonical Place search.

## Core safety rule

**Whole-place truth wins before route splitting.**

Before treating free text as a route, the client must query the existing canonical `/api/search/places?rolle=ziel` for the complete input.

If the complete text is credibly one canonical place, do NOT split it.

This protects names such as:
- `Bosnien und Herzegowina`
- `Trinidad und Tobago`
- `Lima, Peru` when the search result proves the comma suffix is location context rather than a second destination.

No naive unconditional `.split("und")`.

## Required implementation

### 1. Pure route-intent parser / decision helper

Create a small pure helper, preferably `lib/places/route-intent.ts`, with no DB/network access.

It should:
- normalize whitespace safely;
- recognize route separators only after the whole-input check has failed;
- preserve source order;
- preserve repeated destinations;
- support normal conjunctions for Jetnity languages DE/EN/FR/IT/ES/PT/PL plus comma/semicolon/newline/arrow/& where safe;
- refuse empty/malformed intent;
- enforce `GRENZEN.etappenJeReise`;
- never manufacture Place IDs.

The helper must distinguish:
- no route intent / one unresolved phrase;
- ordered 2..N pending destination phrases;
- too many / invalid route phrases.

### 2. Whole-input canonical-place protection

On submit with unconfirmed free text:
1. use the existing public local Place search for the **complete** string;
2. determine whether the returned options prove the input can be one place;
3. if yes, keep it as one pending place and ask the user to choose the canonical result;
4. only if the whole phrase is not credibly one place may route segmentation begin.

A credible whole-place proof may use exact folded label equality, exact country alias signal and bounded label+description context logic for patterns such as `Lima, Peru`.

Do not auto-select the returned place. The user still confirms it.

If the search is unavailable/errors/malformed: fail closed to the existing confirmation behavior. Do not guess/split from an unverified whole-input state.

### 3. Sequential confirmation queue

For recognized multi-destination intent:
- create an ordered queue of pending phrases;
- prefill the existing `OrtSuche` with the first phrase;
- show a compact honest status such as `3 Ziele erkannt – bitte Ziel 1 von 3 bestätigen`;
- when the user selects a canonical result, add it through the existing route occurrence logic and advance to the next pending phrase;
- ambiguous phrases remain user choice from the normal result list;
- no result => user may edit/discard; never silently skip a destination;
- after the final confirmation, keep the confirmed chips and existing `Reise planen` submit action. Do not auto-navigate/create a trip.

Intentional duplicate phrases must remain separate occurrences.

### 4. Correction / cancellation

The traveller must be able to:
- edit the current pending phrase;
- discard current unconfirmed intent safely;
- remove/replace/reorder already confirmed route chips using #543 behavior;
- cancel the remaining detected queue without deleting already confirmed selections unless explicitly chosen.

No hidden loss of text or confirmed Place IDs.

### 5. Existing handoff remains authoritative

Final submit still uses:
- `routeAbsendenPruefen`
- `routeEinstiegHref`
- existing server revalidation on `/planen`.

No new route persistence, no second trip truth, no free-text Place storage.

### 6. UX / accessibility

- Preserve current hero design direction, colors and general footprint.
- Do not turn the homepage into the full planner.
- Mobile first at 390px; tablet/desktop must remain coherent.
- Keyboard-only confirmation/queue flow must work.
- Status text must be announced appropriately (e.g. `role=status` / live region without noisy repetition).
- Touch targets and focus restoration follow existing Jetnity conventions.
- No silent focus jumps to removed elements.

### 7. Languages

Recognition of separators may support the currently targeted Jetnity languages:
DE, EN, FR, IT, ES, PT, PL.

Do not translate/place-infer content. This is only syntax recognition around user-provided phrases.

### 8. No model/provider/cost

Forbidden:
- OpenAI/LLM call;
- external geocoder;
- GeoNames live call;
- provider API;
- new secret;
- new recurring cost.

This is deterministic local intent parsing + existing canonical Place search only.

## Required tests

At minimum prove:

1. `Peru` remains one pending place, not route.
2. `Bosnien und Herzegowina` whole canonical match prevents conjunction split.
3. `Trinidad und Tobago` whole canonical match prevents conjunction split.
4. `Lima, Peru` whole canonical city/context match prevents comma split.
5. `Lima und Cusco` -> ordered pending [Lima, Cusco].
6. `Thailand, Kambodscha und Vietnam` -> ordered 3.
7. repeated phrase `Paris, Rom, Paris` remains 3 occurrences after confirmation.
8. supported language conjunctions segment only as syntax after whole-match refusal.
9. too many destinations fail honestly.
10. empty/malformed segments do not create partial route truth.
11. whole-search 503/network/error => no guessed route segmentation.
12. ambiguous segment requires user choice; no auto-select.
13. no-result segment cannot be silently dropped.
14. selecting one segment advances exactly one queue position.
15. final queue completion does not auto-submit.
16. cancel remaining queue retains already confirmed destinations.
17. final handoff URL contains only canonical Place IDs and preserves order/duplicates.
18. existing #543 remove/replace/reorder/pending-text tests remain green.
19. Guest-One-Trip path remains unchanged.
20. 390px and keyboard flow evidence.

## Validation

Required on exact final agent head:
- focused route-intent tests;
- existing #543 route-entry tests;
- relevant Place search tests;
- full repository standard tests if feasible;
- typecheck;
- lint;
- build;
- exact-head GitHub CI/Auth;
- Vercel Preview;
- responsive evidence 390/768/1440;
- keyboard evidence;
- console/runtime error check;
- changed-file scope proof.

## Scope ownership

Allowed expected runtime files:
- `components/places/StartzielForm.tsx`
- new `lib/places/route-intent.ts`
- focused tests under `lib/places/`
- a narrowly required helper in `OrtSuche.tsx` only if necessary to preserve canonical selection semantics
- dedicated scripts/evidence for this slice
- own TASK/STATUS/HANDOFF/SELF_REVIEW docs

Do NOT edit `docs/ACTIVE_WORK_STATUS.md` in this parallel slice. PR #574 owns the current global continuity update. Technical Lead will reconcile global status after integration.

Forbidden:
- `TripPlanner` redesign unless strictly required for a proven lossless handoff defect;
- DB/migrations/RLS/Auth;
- Guest storage semantics;
- provider/model/payment/domain/legal;
- Production;
- homepage visual redesign.

## Agent

Logical name: **Jetnity homepage natural route intent 1**
Generation: **1**
Required model: **cursor-grok-4.6-high-fast**

## STOP

Do not mark Ready.
Do not merge.
Do not start follow-up.
STOP for independent Technical-Lead exact-head review.
