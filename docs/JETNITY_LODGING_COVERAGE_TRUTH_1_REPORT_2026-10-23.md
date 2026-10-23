# Jetnity Lodging Coverage Truth 1 — REPORT

**Cursor-Agent: Jetnity Lodging Coverage Truth 1 — Cursor Generation 1**

## Outcome

The accommodation panel no longer replaces an unknown canonical summary with a numeric coverage heading. While any stay date is missing, invalid, or reversed, gap rows keep the canonical count but do not say those nights are missing. A stored booked stay, including one without dates, offers `Buchung korrigieren` and calls `(itemId, false)`.

## B04 row clarification

On head `0dafbfca`, the focused case `gebuchte ungültige oder umgekehrte Daten bleiben in der eigenen Zeile unklar` failed: a provider stay with `2026-02-29` or reversed dates could show a normalized range and `Gebucht` without row-level uncertainty, and there was no gap row. The same case passes after the row sentence. `unterkunft-manuell.test.ts` still passes. Owned-file ESLint passes. Full typecheck, build, and CI belong to the new pushed head and are not copied forward from `0dafbfca`.

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

No database, SQL, Auth, RLS, secret, account, personal browser, source admission, provider call, dependency, workflow, or configuration change. No traveller-document collection. No new recurring cost. TASK blob unchanged. `origin/main` at handoff remains `ba0725d6dd2ce3d5e170eb1eab03cedef2def1de`.

## Copy choice

Provisional gaps are qualified rather than hidden: `N Nacht/Nächte noch nicht als fehlend bestimmbar`, plus the existing seal `Noch nicht vollständig bestimmbar`. The date span stays the canonical uncovered span. Known gaps still say `Nacht fehlt` / `Nächte fehlen`.
