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

## Caller ownership

Source-read on this session: page, readiness/traveller actions, travel-change generate/apply, companion, hotel/flight/activity/mobility/rental actions and Safety already check `Lesung.problem` before using the graph. No out-of-scope caller defect is reported. No expansion requested.

Safety is executed as a real injectable consumer. Other callers are proved through the shared `accountGraphVerbrauch` gate that matches their existing problem-before-use branch. Those action files were not edited.

## Residual

- `partyAusZeilen` still expands leftover singular columns when children are not loaded. That remains correct for guest/legacy snapshots. Account consumers must not receive that result from `reiseLaden`.
- Header correction does not prove live Production catalog state.
- Local `origin/main` may drift after the assigned baseline. This branch must not autonomously rebase.
