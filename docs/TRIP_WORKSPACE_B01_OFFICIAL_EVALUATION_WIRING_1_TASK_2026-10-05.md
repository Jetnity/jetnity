# Trip Workspace B01 — account Official Evaluation wiring 1 — Task

Date: 5 October 2026
Issue: #846
Status: **BINDING / B01 / ACCOUNT SERVER WIRING / FAIL-CLOSED / NO PROVIDER ACTIVATION / NO DB MIGRATION**

## 1. Baseline

Repository: `Jetnity/jetnity`
Baseline: `main@bb42e261771245b1675d2886cec96b60674dd608`
Machine mode at dispatch: `NORMAL`

Completed prerequisites:
- B03a manual stay dates — merged/verified
- B03b manual flight routes — merged/verified
- U02/U03 contextual navigation / direct Preparation targeting — merged/verified
- existing Requirements domain/API/OfficialEvaluation presentation architecture
- current Official Truth v2 Development hardening/registration work
- #845 accepted fail-closed GOV.UK ETA audit

Current material truth:
- `TripWorkspace` already accepts `officialEvaluations?: OfficialEvaluation[]`
- `Reisevorbereitung`, Destination Essentials and Attention already consume that canonical shape
- `KontoArbeitsbereich` currently passes no Official evaluations
- `GastArbeitsbereich` currently passes no Official evaluations
- account Trip page already loads the authenticated Trip snapshot server-side under existing Auth/RLS
- `requirementsProviderAus()` currently returns `null`
- `requirementsProviderNachZustand()` is the binding readiness kill-switch/state gate; Production is hard-off
- Official evaluations are compute-on-read and must not be persisted into the Trip graph

## 2. Writer

Logical writer:
**Jetnity Trip Workspace B01 Official Evaluation wiring 1**

Generation: **1**

Execution:
**Codex Desktop — new session**

Required model:
**GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`).

Follow the standing #751 Codex autonomous execution directive:
- work autonomously through commit + push;
- do not ask the Product Owner for routine commit/push/test approval;
- keep PR Draft;
- never Ready or merge;
- STOP after delivery for independent Technical-Lead exact-head review.

## 3. Goal

Wire the authenticated account-trip page to produce canonical `OfficialEvaluation[]` from the exact server-loaded Trip snapshot and pass them losslessly into the existing Trip Workspace.

Required flow:

`app/(public)/reisen/[tripId]/page.tsx`
→ server-only bounded helper
→ existing Requirements engine using the exact loaded `reise`
→ provider selected only as `requirementsProviderNachZustand(requirementsProviderAus())`
→ `OfficialEvaluation[]`
→ `KontoArbeitsbereich officialEvaluations`
→ `TripWorkspace officialEvaluations`

The Workspace must then use its existing canonical presentation paths unchanged unless a genuinely necessary narrow correction is proven.

## 4. Exact authority boundary

The only traveller/credential/route/date evaluation input is the **server-loaded Trip snapshot** returned by the existing account Trip loader.

Do not:
- read Account Registry as evaluation authority;
- silently merge registry data into the Trip;
- choose a default traveller/citizenship/document;
- derive citizenship from issuer/residence;
- mutate traveller data;
- add personal-data hashes or persistence.

Existing registry-to-trip adoption remains the only route by which registry material becomes Trip truth.

## 5. Provider/state boundary

The server helper must use the existing readiness state gate.

Required provider expression/semantics:
`requirementsProviderNachZustand(requirementsProviderAus())`

Do not:
- modify `requirementsProviderAus()`;
- create/register a provider;
- bypass the state gate;
- enable Production provider execution;
- set/modify readiness environment flags;
- call a commercial or research provider;
- use model/browser output as a Requirements provider.

With current code, provider remains `null`; B01 therefore produces canonical fail-closed evaluations.

A later separately authorized provider may flow through this same wiring only if the existing state gate permits it.

## 6. Server helper

Prefer one narrow `server-only` helper under `lib/readiness/`, for example:
`lib/readiness/trip-official-evaluations-server.ts`

The helper should:
- accept a `Trip`;
- invoke the existing Requirements engine/facade, not reimplement evaluation logic;
- pass only the state-gated provider;
- return `Promise<OfficialEvaluation[]>`;
- not persist;
- not swallow/convert canonical evaluation fields;
- fail closed through the existing engine/provider semantics.

If existing engine/provider timeout/error semantics are already bounded, reuse them. Do not invent a second truth engine.

## 7. Account page integration

In `app/(public)/reisen/[tripId]/page.tsx`:

After successful authenticated Trip load and before rendering `KontoArbeitsbereich`:
- obtain `officialEvaluations` from the new server helper for that exact `reise`;
- pass them to `KontoArbeitsbereich`.

Do not evaluate before the trip is proven to exist/owned.

Do not change not-found/RLS indistinguishability.

Do not call the public Requirements HTTP endpoint from the server page.

## 8. KontoArbeitsbereich integration

Add a typed `officialEvaluations: OfficialEvaluation[]` (or readonly equivalent if compatible) prop.

Forward it unchanged to:
`<TripWorkspace officialEvaluations={officialEvaluations} ... />`

Do not locally recompute it.

Do not persist it.

Do not derive it from registry.

Existing router.refresh behavior should naturally re-run the server page after traveller/trip changes.

## 9. Guest boundary

`GastArbeitsbereich` must remain behaviorally unchanged.

No server evaluation, no public HTTP fetch, no new provider call, no new persistence, no background request.

Guest continues to use existing fail-closed local behavior.

Do not add `officialEvaluations` to Guest merely for symmetry.

## 10. Presentation truth

Existing canonical presentation rules remain binding:
- one visible requirement row maps to exact `OfficialEvaluation` scope;
- unknown/unavailable/stale/recheck/gap/conflict are never rendered as not-required;
- hard result copy only for trusted/current states;
- no default credential;
- no foreign-scope fallback;
- no duplicated coarse readiness cards;
- Actions remain bound to their exact evaluation/evidence metadata.

If B01 reveals an existing presentation bug that is directly caused by receiving real arrays, STOP and report it unless the fix is tiny, strictly necessary, and explicitly documented before changing scope.

## 11. Tests

Add focused tests proving at minimum:

1. authenticated account page:
   - loads Trip first;
   - computes evaluations from the exact loaded Trip;
   - passes returned evaluations into `KontoArbeitsbereich`.

2. server helper:
   - delegates to existing engine/facade;
   - uses `requirementsProviderNachZustand(requirementsProviderAus())`;
   - with current null provider returns canonical fail-closed evaluations matching exact Trip scope;
   - no persistence/client/API route use.

3. `KontoArbeitsbereich`:
   - accepts evaluations;
   - forwards them unchanged to `TripWorkspace`.

4. Guest:
   - no new official evaluation server/API/provider wiring;
   - current behavior preserved.

5. regression:
   - multi-traveller/multi-citizenship/multi-document scope remains peer-based;
   - no `documents[0]` / first-citizenship / first-evaluation shortcut introduced.

Use existing tests/helpers where possible.

## 12. Allowed runtime files

Primary:
- `app/(public)/reisen/[tripId]/page.tsx`
- `components/trips/KontoArbeitsbereich.tsx`
- new narrow server helper under `lib/readiness/`

Focused tests under existing relevant `lib/readiness/*` and/or `lib/trips/*`.

Only if genuinely required by the exact implementation:
- `components/trips/TripWorkspace.tsx`

Do **not** modify:
- `components/trips/GastArbeitsbereich.tsx` except an unavoidable test-only import/type compatibility correction; behavioral change is forbidden
- `lib/readiness/provider.ts`
- Official Truth catalog/extractor/policy/store/acceptance files
- migrations/Supabase
- Account Registry semantics
- Requirements HTTP route unless a compile-only import extraction is strictly necessary; functional behavior change is forbidden

If broader runtime scope appears necessary: STOP for TL scope review.

## 13. Hard prohibitions

Absolutely no:
- DB migration or hosted DB write
- Supabase mutation
- Production Official Truth apply
- provider registration/activation
- GOV.UK extractor/policy activation
- accepted Evidence creation
- Rule acceptance
- F8
- schema-2 work
- CH research/import
- new personal data collection
- account registry reinterpretation
- API contract redesign
- guest live provider request
- cache/persistence of Official evaluations
- fake fixture in product runtime
- Ready/Merge
- follow-up slice

## 14. Validation

Before delivery:
- live re-read main/mode/#751/new #748/#846/PR;
- prove no overlapping writer;
- prove immutable TASK blob;
- exact changed-file list;
- merge-base/ahead/behind;
- `git diff --check`;
- focused tests;
- full `npm test`;
- `npm run typecheck`;
- `npm run lint`;
- `npm run build`;
- `npm run check:operating-mode` or repository-equivalent gate;
- report exact Codex session id + model/effort;
- inspect exact-head GitHub CI and Vercel Preview after push.

Do not call local/agent self-review Technical-Lead PASS.

## 15. Delivery documents

Create:
- `docs/TRIP_WORKSPACE_B01_OFFICIAL_EVALUATION_WIRING_1_REPORT_2026-10-05.md`
- `docs/TRIP_WORKSPACE_B01_OFFICIAL_EVALUATION_WIRING_1_HANDOFF_2026-10-05.md`
- `docs/TRIP_WORKSPACE_B01_OFFICIAL_EVALUATION_WIRING_1_SELF_REVIEW_2026-10-05.md`

Binding TASK remains byte-identical.

## 16. STOP

Push the completed bounded slice to the existing Draft PR.

Then report:
- exact remote head;
- exact changed files;
- merge-base / ahead / behind;
- tests/build/lint/typecheck;
- exact-head CI;
- Vercel Preview;
- model/session evidence;
- any remaining limitation.

Keep Draft.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**

Do not Ready.
Do not merge.
Do not start F8, provider activation, database work or another follow-up slice.
