# Visit Date Precision Fix 1 — self-review

Writer: **Jetnity Visit Date Precision Fix 1 — Cursor Generation 1**
This note is the writer's self-review. It is not a Technical-Lead PASS.

## Scope

Changed only:

- `components/account/AccountBesuchFormular.tsx`
- `lib/account/visit-date-precision-1/zeitfeld.ts`
- `lib/account/visit-date-precision-1/zeitfeld.test.ts`
- `docs/JETNITY_VISIT_DATE_PRECISION_FIX_1_PLAN_2026-10-23.md`
- this delivery set under the same task prefix

`docs/JETNITY_VISIT_DATE_PRECISION_FIX_1_TASK_2026-10-23.md` was not edited. Server actions, `besuche-eingabe.ts`, `besuche.test.ts`, `AccountBesuche.tsx`, schema, Auth and global status files were not edited.

## Acceptance

1. Create and edit both mount `AccountBesuchFormular`. The regression renders both layouts from the cleared state.
2. Clearing month from 2004/5/9 yields 2004/null/null. Unchanged `besuchAnlageLesen` and `besuchAenderungLesen` accept it. The old stale day 9 is still rejected with `tagOhneMonat`.
3. Clearing year yields null/null/null and is accepted. Place and country stay.
4. Re-entering year or month leaves descendants empty. Untouched full, year-month, year-only and unknown values stay valid.
5. Changing 2024-02-29 to 2023 keeps day 29 and fails `datumUngueltig`. A future December 2026 date still fails `datumZukunft`. Nothing is clamped to 1 January.
6. Labels, disable rules and place/country behavior stay. A year-only month stays enabled and empty. Day is disabled only when month is empty. Both are disabled when year is empty.
7. No database, server action, schema or new saved-data authority.
8. One pure helper. No second serializer and no form framework.
9. The regression calls the helper, then the real `besuchEingabeAus`, then the unchanged readers. It also checks the loaded form function's three `onChange` calls and the static markup. A file-text match is not the only proof.

## Limits I am not treating as acceptance

- Requested model was Claude Opus 5.5 High. This run's identity reports `originalModelName=grok-4.7-high-fast`. I did not select a replacement. The platform bound the run before implementation.
- No signed-in browser pass. The account form is behind login, and this task forbids real accounts and the Owner browser.
- Deleting a year all the way to empty, then typing it again, drops month and day. That is the assigned re-entry rule.
- The loaded-function check matches the tsx emit `besuchZeitfeldSetzen)(wert,"jahr"`. It passed in this session's `npm test`. A different transpiler would need the assertion updated. It is wiring evidence on top of the payload tests.
- `npm test` reported 4 pre-existing skips: two browser-audit opt-ins and two CI-only "fail when PostgreSQL binaries are absent" cases. They are not visit-date skips.
- `check:schema-bezug` still lists the same pre-existing LOCAL/UNAPPLIED RPCs. This slice added none.
- Lint: 0 errors, 146 pre-existing warnings, none in the files this slice edited.
- `npm ci` printed the repository's existing audit count (10). No dependency was added.

## Findings

- P0: none.
- P1: none introduced. Existing #968 and #748 privacy gates were read and not touched.
- P2: the input defect is fixed in the shared form. A signed-in click-through remains not checked.
- P3: the day field still allows 31 in a short month. The server rejects it, as required. No client clamp was added.

Next actor: Technical Lead, independent exact-head review of the final branch tip. Cursor does not Ready or merge.
