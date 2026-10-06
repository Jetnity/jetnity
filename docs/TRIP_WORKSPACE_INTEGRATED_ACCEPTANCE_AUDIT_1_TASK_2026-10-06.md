# Trip Workspace integrated acceptance audit after B01/B03/U02/U03 1 — Task

Date: 6 October 2026
Issue: #869
Repository: Jetnity/jetnity
Baseline: `main@9adfc04ffe90693dedc059f07a396751a0625157`
Branch: `docs/trip-workspace-integrated-acceptance-audit-1`
Execution lane: Codex Desktop
Parallel-safe with #863/#866/#867/#868 when this scope is respected.

## 1. Objective

Perform one **read-only integrated product acceptance audit** of the current merged Trip Workspace after:
- #833 B03a manual stay-date completion;
- #837 B03b manual flight-route completion;
- #841 U02/U03 contextual navigation + Preparation targeting;
- #847 B01 Account Official Evaluation wiring;
plus the already merged premium cross-device Trip Workspace/Preparation foundations.

Do not implement the next product feature. Determine whether the combined experience is coherent and identify the **smallest justified next product slice**.

## 2. Product doctrine

Jetnity is not a generic itinerary builder.

Evaluate the current workspace against:
- Planen → Entscheiden → Reisebereit sein;
- “Macht das Jetnity einzigartiger oder nur größer?”;
- smartphone priority while tablet/laptop/desktop remain first-class;
- no fake Official Truth, provider price, availability or certainty.

A suggested next slice must strengthen a real traveller outcome or a necessary quality/reliability enabler.

## 3. Binding reads

Re-read live state first:
1. live `origin/main`
2. mode
3. #751
4. binding Product Differentiation Doctrine
5. Binding Build Order
6. Issues/PR deliveries #832/#833, #836/#837, #840/#841, #846/#847
7. relevant merged premium Trip Workspace / Preparation contracts
8. current implementation and tests for:
   - `TripWorkspace`
   - `KontoArbeitsbereich`
   - `GastArbeitsbereich`
   - `FlugBestand`
   - `UnterkunftBestand`
   - `Reisevorbereitung`
   - workspace navigation/detail modes
   - manual stay/flight actions/schema
   - Trip Official evaluations server
   - attention/readiness presentation

Live evidence wins.

## 4. Audit scenarios

At minimum audit these integrated journeys:

### Account trip
- open Trip Workspace;
- navigate between overview / trip plan / organize / preparation;
- open an item detail and return without losing context;
- open a gap/attention target and return correctly;
- add/edit manual accommodation dates and verify nights/readiness recompute coherently;
- add/edit a 1–4 segment manual flight route and preserve exact local segment truth;
- confirm cross-timezone/date-line data does not create misleading legacy chronology;
- verify preparation targeting lands on the intended item/section;
- verify B01 canonical OfficialEvaluation[] wiring remains fail-closed with provider state disabled/null;
- no evaluation persistence/cache/localStorage side effect.

### Guest trip
- verify supported manual stay/flight paths;
- verify IATA-only/null-country constraints remain honest;
- no account-only Official-Truth authority leaks into Guest.

### Cross-device
Inspect at minimum:
- 360 px smartphone;
- 390 px smartphone;
- tablet-class width around 768 px;
- desktop around 1440 px.

Check:
- action discoverability;
- contextual return/back behavior;
- no horizontal page overflow;
- touch target/readability issues;
- detail/panel placement;
- preparation navigation;
- long-trip density;
- text scaling / 200% resilience where practical;
- keyboard/focus/Escape behavior where applicable.

## 5. Evidence rules

Prefer existing deterministic tests and existing audit scripts first.

Where a local dev-server/browser path is available without mutating Production/DB, perform a rendered visual/interaction gut-check and store only audit evidence in this slice's unique evidence directory.

Do not claim authenticated E2E if the environment cannot genuinely execute it. If auth/test data is unavailable, mark that coverage as a gap and rely on code/tests only for that portion.

Do not create fake user/provider/Official-Truth data in Production.

## 6. Required output

Classify each audited area:
- PASS
- PARTIAL
- FAIL
- NOT_VERIFIED

Identify P0/P1/P2/P3 issues with exact code/evidence references.

Then choose one exact next-product recommendation:
- either `NO_IMMEDIATE_TRIP_WORKSPACE_SLICE_REQUIRED`, or
- one narrowly bounded named next slice.

The recommended next slice must include:
- concrete user problem;
- differentiation/enabler justification;
- exact likely files/contracts;
- dependencies/gates;
- why it can or cannot run before Official Truth F8/provider activation.

Do not implement it.

## 7. Hard non-scope

No product/runtime code changes.
No DB/Supabase/schema/RLS migration.
No Official Truth source/catalog/Evidence/Rule/F8 changes.
No provider activation or fake commercial truth.
No Auth/capability changes.
No Production mutation.
No global continuity edits.
No automatic follow-up.

## 8. Allowed files

TASK is immutable:
- `docs/TRIP_WORKSPACE_INTEGRATED_ACCEPTANCE_AUDIT_1_TASK_2026-10-06.md`

Create only:
- `docs/TRIP_WORKSPACE_INTEGRATED_ACCEPTANCE_AUDIT_1_2026-10-06.md`
- `docs/TRIP_WORKSPACE_INTEGRATED_ACCEPTANCE_AUDIT_1_REPORT_2026-10-06.md`
- `docs/TRIP_WORKSPACE_INTEGRATED_ACCEPTANCE_AUDIT_1_HANDOFF_2026-10-06.md`
- `docs/TRIP_WORKSPACE_INTEGRATED_ACCEPTANCE_AUDIT_1_SELF_REVIEW_2026-10-06.md`
- optional rendered audit evidence only under:
  `docs/evidence/trip-workspace-integrated-acceptance-audit-1/**`

Do not modify existing evidence files.

## 9. Required checks

Run the relevant existing focused tests/audit scripts you discover for the merged areas.
Run `git diff --check`.
If practical and not disproportionately expensive, run the broader relevant test set.
Do not describe a test as passed unless actually executed.

Before STOP report:
- remote main;
- Exact Head;
- merge-base/ahead/behind;
- exact changed files;
- TASK blob unchanged;
- tests/scripts/browser checks actually executed;
- exact device/viewport evidence;
- coverage gaps;
- P0/P1/P2/P3 findings;
- recommended next slice;
- Codex session/model evidence.

Commit and push the authorized branch.
Stay Draft.
Do not Ready.
Do not merge.
Do not start the recommended follow-up.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
