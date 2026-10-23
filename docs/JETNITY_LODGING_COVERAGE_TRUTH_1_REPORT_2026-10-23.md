# Jetnity Lodging Coverage Truth 1 — REPORT

**Cursor-Agent: Jetnity Lodging Coverage Truth 1 — Cursor Generation 1**

## Outcome

The accommodation panel no longer replaces an unknown canonical summary with a numeric coverage heading. While any stay date is missing, invalid, or reversed, gap rows keep the canonical count but do not say those nights are missing. A stored booked stay, including one without dates, offers `Buchung korrigieren` and calls `(itemId, false)`.

## R1 row correction

Reviewed head `0dafbfca179c65347b03a83b3bbff5b77c0d6e71` against the two new row tests: exit 1, 0 pass / 2 fail. The invalid provider row contained `1. März – 2. März` and `Gebucht` with no uncertainty sentence. The reversed row contained `10. Sept. – 1. Sept.` The operator was `doesNotMatch`. `64f7c510` fails the same invalid-row assertion because it still renders `1. März – 2. März` beside the sentence. The repaired panel passes both tests. The full lodging file, `naechte-abdeckung.test.ts`, `buchung.test.ts`, and `direct-lodging-coverage-preview-1.test.ts` then passed together (32 tests). `unterkunft-manuell.test.ts` passed against this panel before the two tests were split. Owned-file ESLint passed. `tsc -p tsconfig.json --noEmit` passed. `npm run typecheck`, `npm run build`, and earlier hygiene checks are not re-copied from `0dafbfca`. CI and Preview for this head are not claimed green.

## Commands

| Command | Result |
|---|---|
| Final `lib/trips/lodging-coverage-truth-1.test.ts` against seed `UnterkunftBestand.tsx` | Exit 1. 7 tests, 5 failed, 2 passed. Known partial/full/empty/out-of-period and the error alert passed. Unknown heading, unqualified gaps, and the booked-undated action failed. |
| Same test against the repaired panel | Exit 0. 7 passed, 0 failed. |
| `unterkunft-manuell.test.ts`, `naechte-abdeckung.test.ts`, `buchung.test.ts`, `direct-lodging-coverage-preview-1.test.ts` | Exit 0. |
| `npm run typecheck` | Exit 0. |
| `npx eslint` on the panel and the new test | Exit 0. |
| `npm run build` | Exit 0. Next.js 16.4.1 compiled, TypeScript finished, 26 static pages generated. Prebuild setup check warned: no `.env` / `.env.local`. |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode` | Exit 0. Pre-existing LOCAL/UNAPPLIED RPC notes only. |

Logs for the red and green regression runs are local author output, not CI. CI, Auth, and Preview are the pushed-head gates and are reported from GitHub after push. They are not marked green in this file.

## Boundaries

No database, SQL, Auth, RLS, secret, account, personal browser, source admission, provider call, dependency, workflow, or configuration change. No traveller-document collection. No new recurring cost. TASK blob unchanged: `5d424fd82ae5334aca79e999e3078101b8b4e44b`. `origin/main` re-read `be0a8b68765e25dc3216dc1f61bfd4620af3e134`. Merge-base `ba0725d6dd2ce3d5e170eb1eab03cedef2def1de`. 5 ahead / 5 behind after this commit. Not synchronized with merged #984.

## Copy choice

Provisional gaps are qualified rather than hidden: `N Nacht/Nächte noch nicht als fehlend bestimmbar`, plus the existing seal `Noch nicht vollständig bestimmbar`. The date span stays the canonical uncovered span. Known gaps still say `Nacht fehlt` / `Nächte fehlen`.
