# Risks and limitations — V1 Account Graph Read Completeness 1

## Deliberate availability tradeoff

If an account graph is structurally incomplete, the affected trip workspace and account actions report unavailable. This is not deleted data and not a 404. Canonical complete/empty reads are unchanged.

A later partial-workspace experience would need a separate consumer contract. This slice does not invent one.

## What this does not prove

- Production schema validation. No official entry that child tables exist or are missing in Production.
- Guest draft preservation. Owned by #532.
- Credential sufficiency, visa rules, or document validity. Only structural load completeness.
- Authenticated Preview, hardware, Safari or WCAG. No UI change; no visual audit required.
- Live SQL, Auth, provider or account mutation. None were run.
- Execution of every page/action caller. Non-injectable callers are source-inspected only.

## Caller ownership

Source inspection of the named production callers found an existing `Lesung.problem` stop before graph use or mutation. No out-of-scope caller defect. No expansion requested. Matrix: `consumer-source-review.md`.

Executed consumer evidence is only:

- `safetyReiseAufloesen` / `safetyEvaluationsPruefen` with this slice’s incomplete Lesung
- `registryTripUebernahmeOrchestrieren` with the same problem mapping as `registryTravellerInReiseUebernehmen`

There is no shared runtime consumer helper. A previous unused `accountGraphVerbrauch` surrogate was removed after AG-R1.

## Residual

- `partyAusZeilen` still expands leftover singular columns when children are not loaded. That remains correct for guest/legacy snapshots. Account consumers must not receive that result from `reiseLaden`.
- Header correction does not prove live Production catalog state.
- This branch must not autonomously rebase onto later main.
