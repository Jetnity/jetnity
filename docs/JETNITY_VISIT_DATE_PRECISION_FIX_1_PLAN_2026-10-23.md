# Visit Date Precision Fix 1 — implementation plan

Date: 23 October 2026
Writer: Jetnity Visit Date Precision Fix 1 — Cursor Generation 1
Issue: #969
Branch: `fix/visit-date-precision-1`
Draft PR: #972
Immutable TASK blob: `7d466cdb61b6988f7df1d627aaf0ff2651789baa`
This plan does not change the TASK.

## Goal

When the shared visit form reduces precision, dependent fields leave form state and the payload. Clearing month clears day. Clearing year clears month and day. Typing a parent again does not restore discarded children. Canonical validation and saved-data authority stay unchanged.

## Files

- `components/account/AccountBesuchFormular.tsx` — year, month and day `onChange` call one pure transition.
- `lib/account/visit-date-precision-1/zeitfeld.ts` — new pure helper only.
- `lib/account/visit-date-precision-1/zeitfeld.test.ts` — synthetic regression through the real serializer and unchanged `besuchZeitPruefen` / `besuchAnlageLesen` / `besuchAenderungLesen`.
- Task-owned docs under `docs/JETNITY_VISIT_DATE_PRECISION_FIX_1_*` only.

Not changed: `lib/account/besuche-eingabe.ts`, server actions, `besuche.test.ts`, schema, shared types, `AccountBesuche.tsx`, global status, roadmap, governance.

## Contract

Create and edit already mount the same form and serialize with `besuchEingabeAus`. The defect is only the controlled-field update. The helper returns the same object shape, including place and country, and changes only `jahr` / `monat` / `tag`.

A parent counts as cleared when its new text trims to empty, matching the existing disable rule (`!wert.jahr.trim()`, `!wert.monat.trim()`). A nonempty replacement keeps descendants, including an impossible leap day or a future date, so the server still rejects those values. No 1 January default and no clamp.

Passing through an empty year while editing digit by digit drops month and day. That follows the assigned rule that re-entry must not resurrect discarded descendants.

## Non-effects

- No database, API, Auth, RLS, migration or new saved-data authority.
- No traveller-credential collection. Visit precision is not citizenship, document or route truth.
- No new dependency, workflow, provider, cost or feature flag.
- Security: the server remains the authority that rejects inconsistent dates. The client stops sending the stale payload.

## Tests

Synthetic only. No account, browser profile or hosted data.

- Clear month from 2004/5/9 serializes 2004/null/null and passes unchanged validation. The old stale day still fails.
- Clear year serializes null/null/null and passes. Re-entry does not restore month or day.
- Untouched full, year-month, year-only and unknown values stay valid.
- Leap-day year change and a future date stay rejected and unclamped.
- Place and country survive. Create and edit readers accept the reduced payload.
- Static render of the shared form shows the cleared, disabled fields for the create layout and the stacked edit layout.
- The loaded form function calls the helper. A source pattern alone is not the proof.

## Risks

P2 input-state only. Residual: no signed-in browser pass in this slice, by the task boundary. Requested model Claude Opus 5.5 High is not the model this session observed; that limitation is recorded in the handoff and is not a reason to rewrite the contract.
