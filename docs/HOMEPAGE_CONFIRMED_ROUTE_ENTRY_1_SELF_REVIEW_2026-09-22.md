# Homepage Confirmed Route Entry 1 — SELF-REVIEW

Date: 2026-09-22  
Status: **AGENT SELF-REVIEW ONLY / NOT TECHNICAL-LEAD PASS**  
Agent: Jetnity homepage confirmed route entry 1, Generation 1  
Session: `bc-63084de2-f351-4c8c-be85-c36cda45935e`  
Required and actual model: Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`)

## 1. Did we stay inside the owned surface?

Yes. Review-fix writes are OrtSuche (narrow sync only), StartzielForm, TripPlanner, route-einstieg, owned tests/scripts, and owned docs/evidence. #544 remaining-build paths were not edited. No schema, Auth, secrets, Production, provider, lockfile, or global-doc writes.

## 2. Did we fake natural language?

No. There is no comma/`und` split and no model/parser path. UI copy does not promise sentence understanding. #110 stays open.

## 3. Did R1/R2 actually get fixed?

R1: `startzielErsetzenStarten` blocks when an unrelated pending draft exists; `startzielVorkommenEntfernen` keeps `sucheText`; re-clicking the same replace target does not reset typed text. Hydrated Chromium reproduced the TL sequences and kept `Cusco`.

R2: `tripPlannerPrimaerMitWeiteremTauschen` swaps occurrence keys and pending text. OrtSuche is keyed by occurrence and also syncs a null value + changed `initialText`. After Nach-oben, the primary input shows Cusco and the extra input shows Paris; accessible names match.

## 4. Are the tests real?

Unit tests now cover the controller helpers. Hydrated tests mount the actual components (not source-string only) with synthetic search and stubbed Next/server actions. They are not Production E2E, not authenticated Preview, and not a physical device.

## 5. Guest/Account and hero

Guest gate and Account independence were not rewritten. `app/(public)/page.tsx` was not edited. Hero remains the current hero.

## 6. Browser honesty

390/768/1024/1440 and 200% zoom were exercised on the hydrated harness. Successful chip route and duplicate ordered create were captured. Emulation is not a physical-device PASS.

## 7. Verdict

Ready for independent Technical-Lead exact-head re-review of the freeze SHA. **Not Ready. Not merged. No follow-up slice.**
