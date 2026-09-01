# Jetnity – Destination Essentials 1 Task

Stand: 1. September 2026  
Status: **ACTIVE PHASE-1 CODING TASK / SINGLE_AGENT / STOP FOR TECHNICAL-LEAD REVIEW**  
Issue: #393  
Canonical base: `main@c4b6bf3266a9a6aa88a2f3e22e51007b6fb38a08`  
Cursor-Agent: **`Jetnity destination essentials 1`**  
Generation: **1**

## 1. Binding decision

Destination Essentials 1 is the next smallest responsible non-gated Phase-1 slice after PWA-1.

Why now:

- the binding V1 build order lists Destination Essentials as an open product-surface gap;
- Flight/Hotel/Activities/real Official-provider work remains behind Product-Owner/external gates;
- broad Mobile/Accessibility polish should follow after remaining V1 surfaces are closed;
- World Map is not selected first because `visited` is separate account truth and must not be inferred from past trip dates.

## 2. Multi-Agent Suitability

**Decision: SINGLE_AGENT.**

The destination projection, truth grouping, UI component and Trip Workspace integration are tightly coupled. Parallel writers would collide in shared presentation/workspace/test surfaces and risk divergent truth semantics.

## 3. Goal

Add a compact, accessible **Destination Essentials** section to the existing Trip Workspace overview. It must summarize, destination by destination, only truth already supplied to Jetnity through existing canonical structures:

- destination/stage identity and dates from `Trip.stages[]`;
- entry/preparation state from `OfficialEvaluation[]`;
- safety/disruption context from `SafetyEvaluation[]`;
- season/travel-time context from `SeasonalEvaluation[]`;
- validated official/source links already present in evidence/actions.

Missing evidence stays missing. No destination fact may be invented.

## 4. Canonical reuse

Reuse existing contracts and components rather than creating a second truth system:

- `types/trips.ts` → ordered `Trip.stages[]`;
- `lib/readiness/official.ts` → Official status/freshness/action semantics;
- `lib/safety/*` → Safety evidence, affected refs and presentation semantics;
- `lib/seasonal/*` → Seasonal evidence, affected refs and presentation semantics;
- `components/trips/TripWorkspace.tsx` already receives `officialEvaluations`, `safetyEvaluations`, `seasonalEvaluations`;
- existing `ReiseSicherheit`, `ReisezeitHinweise`, `Reisevorbereitung` remain canonical domain surfaces.

Do not create duplicate provider/domain engines.

## 5. Required implementation

### 5.1 Destination projection

Create a small deterministic presentation helper from `Trip.stages[]`.

- preserve stage order and stage identity;
- duplicate-country stages remain distinct;
- use only actual stage `name`, `countryCode`, `placeId`, coordinates and dates;
- no geocoding or free-text country inference;
- no inference that a past stage was visited.

### 5.2 Official truth joining

For each stage:

- destination requirements are matched by `destinationCountryCode`;
- transit requirements remain separate and must not be shown as destination truth;
- `unknown`, `unavailable`, `stale`, `recheck_needed`, `provider_unavailable` remain visibly different from `not_required`;
- missing evidence never becomes a positive claim;
- only existing validated `OfficialEvaluation.action` may create application/form/appointment/information actions;
- evidence `sourceUrl` is source/information only and must never be relabelled as an application/form/appointment action.

### 5.3 Safety / Seasonal joining

- match destination-specific evidence only through explicit affected stage refs (`kind: 'stage'`, matching stage id) where applicable;
- do not attach route/airport/item evidence by label similarity;
- preserve existing freshness/status/presentation semantics;
- no second Safety or Seasonal truth engine.

### 5.4 UI

Integrate the section into the existing **Trip Workspace overview**; do not add another equal-rank top-level tab.

Expected product behavior:

- clear heading such as `Wichtig für deine Ziele` / `Reiseziele im Blick`;
- ordered destination cards;
- destination name/country/date context only when known;
- compact honest Entry, Safety and Season/Timing states;
- details/source links accessible without overwhelming the overview;
- empty/no-evidence state remains visible and honest, e.g. `Noch keine verlässlichen Hinweise verfügbar`;
- same IA on mobile and desktop;
- existing Jetnity accessibility conventions for headings, focus, keyboard and touch targets.

Existing dedicated Safety/Seasonal/Readiness components may remain. This is a destination-oriented summary, not a replacement architecture.

## 6. Hard non-scope

Do not change or introduce:

- Supabase schema/migrations/RLS/grants/roles/functions;
- Auth/session/MFA/AAL;
- Traveller Registry / citizenship / document contracts;
- provider choice/signup/contracts/DPA/secrets/cost guards/live/paid calls;
- Commercial Truth writer/persistence;
- TW-8/TW-9;
- World Map or visited-truth persistence;
- service worker/offline cache/push;
- public indexing/domain cutover;
- native app architecture;
- payments;
- site-wide redesign;
- homepage hero-intent issue #110;
- strategic issue #236 runtime;
- new hard-coded country facts, weather, currency, emergency numbers, plugs, tipping/culture content;
- new destination CMS/table/provider adapter.

## 7. Required tests

Add deterministic coverage for at least:

1. stage order preserved and duplicate-country stages remain distinct;
2. null country code is not inferred;
3. destination vs transit Official truth stays separate;
4. unknown/unavailable/stale never becomes `not required` or false certainty;
5. only validated actions are actionable;
6. Safety/Seasonal stage matching uses explicit refs, not labels;
7. empty evidence has an honest bounded state;
8. Destination Essentials does not auto-mount/trigger commercial searches;
9. no DB/provider/service-worker/indexing scope introduced.

Run and report:

- targeted Destination Essentials tests;
- relevant Trip Workspace / Safety / Seasonal / Readiness tests;
- full repository test suite under normal project standard;
- typecheck;
- lint;
- Production build;
- Vercel Preview exact-head evidence;
- mobile + desktop acceptance evidence;
- console/runtime errors.

## 8. Governance

- Do not mark Ready.
- Do not merge.
- Do not start a follow-up slice.
- Do not use GitHub Copilot as a substitute coding agent.
- Re-fetch `origin/main` before final handoff and report drift.
- Agent self-review is not Technical-Lead PASS.

## 9. Required handoff

Before stopping, persist/provide:

- exact base SHA;
- exact final head SHA;
- Cursor session evidence if available;
- changed-file list;
- concise rationale;
- exact tests/outcomes;
- Preview evidence;
- mobile/desktop evidence;
- non-scope confirmation;
- adversarial self-review;
- `STOP FOR TECHNICAL-LEAD REVIEW`.

## 10. Acceptance principle

> Destination Essentials may summarize only truth Jetnity already has evidence for. Missing evidence must stay missing, not become travel advice by inference.
