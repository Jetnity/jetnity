# Jetnity 12Go Official Search Widget V2 — STATUS

Date: 29 October 2026 Europe/Zurich
Tracking: https://github.com/Jetnity/jetnity/issues/1085
PR: https://github.com/Jetnity/jetnity/pull/1086
State: **CONSENT_BLOCKED / DRAFT / R3 source preparation / STOP for independent Technical Lead review**

## R4 evidence binding

`scripts/twelve-go-widget-v2/rahmen-nachweis.ts` now server-renders `TwelveGoWidgetRahmen` and wires the local stub only onto that iframe. A missing, duplicated, or clipped frame fails the same predicate the browser uses. Output goes to `TWELVE_GO_WIDGET_NACHWEIS_DIR` or the OS temp directory `twelve-go-widget-v2`. Non-loopback requests are aborted and fail the run. The local stub is still not a fresh official-form proof. CI `41065919207` and Preview `dpl_FZNiKe4kjcB1euezYxZBRhChhEPz` matched the previous head only.

## R3 on the synced branch

Pinned main `ac2199dba64e458a20a155b5d1bb826ea99949d3` is merged. `vendorScriptMayExecute` and `TWELVE_GO_WIDGET_FREIGABE.ausfuehrbar` both stay false. `/embed/twelve-go` answers 404 with no vendor document. The visitor surface still has no iframe and no load button. A localhost stub proved the 800px opaque frame and keyboard input without calling 12Go. The official form was not loaded again; the R2 measurement remains that evidence. CI and Preview for the R3 head are not evidence until they finish. The exact head is the tip after the R3 commits and is posted on the PR.

## Session

- `originalModelName`: `grok-4.7-high-fast`
- bcId: `bc-2a335d8e-9108-4c0e-a2f2-8d7d499fd49c`
- Session URL: https://cursor.com/agents/bc-2a335d8e-9108-4c0e-a2f2-8d7d499fd49c
- Display name: `Jetnity 12Go Official Search Widget V2 Opt-In 1 — Cursor Generation 1`
- Rename: applied in this run. Previous title was `12Go V2 search widget`.
- Author is not the independent reviewer and does not mark Ready or merge.

## Git

- Branch: `feat/12go-v2-official-search-widget-optin-1`
- Protected main / merge-base: `e462cf7c5910ce75fa6350928326c04e33d94eee`
- Task seed: `421a703b274b489004c0b07e8d392dbc1cec6ed7`
- Plan commit: `b041aacb967e9a0c1b16a6c06f80cbd5e4343264`
- Implementation commit: `e53ac39ce51f85e0a13c51b182f2397ad606ca34`
- Implementation tree: `9e83883a884f885b83a27c28e1705f275f551c57`
- Invalidated prior head: `c2fa11dcc898d66d2f527ba3efdd11aa8bd1d2c5` (R1-F1). Its CI, Preview, and review gates do not apply to the correction.
- The R1 correction commit is the new branch head. A commit cannot store its own hash. The PR comment after push states the exact final HEAD, tree, and ahead/behind.

## Result

The official general export and the Bangkok → Koh Chang reference are stored as exact bytes. The visitor surface in Organisieren → Verbindungen keeps the V1 links and states that the general form is not loaded. There is no load button, no script, no frame, and no prefetch.

Execution stays closed:

- `status: CONSENT_BLOCKED`
- `ausfuehrbar: false`
- `isolation: NOT_ESTABLISHED`

Reason: there is no approved vendor consent policy, and safe isolation was not established. The ephemeral audit showed that pasting the official snippet runs 12Go's loader and jQuery 1.11 from `ajax.googleapis.com` in the host document. An opaque `sandbox="allow-scripts"` frame still contacted the same hosts and did not present a complete form. `app/embed/twelve-go/route.ts` was not added.

## R1-F1

Native CI run `40949841634` failed `npm run check:schema-bezug` because `Buffer.from('Bangkok')` in `lib/providers/twelve-go/widget/quelle.test.ts` matched the schema scanner as a table. The assertion now decodes the general export as UTF-8 and checks that the text does not contain `Bangkok`. No table, migration, scanner, or workflow was changed. `CONSENT_BLOCKED` is unchanged.

## Not done

- No Production deploy, no Ready, no merge.
- No edit to privacy, CMP, DiscoverCars, Viator, UX, affiliate V1 logic, database, Auth, or `docs/ACTIVE_WORK_STATUS.md`.
- No follow-up slice.
