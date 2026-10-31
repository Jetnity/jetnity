# Jetnity 12Go Official Search Widget V2 — STATUS

Date: 29 October 2026 Europe/Zurich
Tracking: https://github.com/Jetnity/jetnity/issues/1085
PR: https://github.com/Jetnity/jetnity/pull/1086
State: **CONSENT_BLOCKED / DRAFT / R5 current-main evidence / STOP for independent Technical Lead review**

## Current, 31 October 2026

Accepted main `b7ebc399b92303eacda9afdaa1786f245492051f` is merged. The trip path still mounts only the closed notice in `TwelveGoWidgetEinbau`. `TwelveGoWidgetRahmen` is not on that path. `/embed/twelve-go` exists and stays a constant 404. Both execution switches stay false. Iframe height is not the open blocker: the dated R2 measurement already showed the official general form inside an 800px `allow-scripts` frame. The local three-field stub and the current-style surface check are not official hosted acceptance.

The paragraph in Organisieren is not a finished search form.

Pending bridge, not implemented here:

1. Account-supported CMP grant and withdraw, including the still-open Swiss PrivacyBee snippet, callback, and entitlement (#1087).
2. A reviewed shared execution and origin contract. Informative consent is not that grant.
3. One real frame lifecycle, then official form, search, and redirect acceptance.

Older sentences below that say the embed route does not exist, or that the opaque frame failed to show the form, are dated and superseded.

## R5 stylesheet

`oberflaeche.ts` no longer keeps a handwritten utility list. It compiles `styles/globals.css` with the repo Tailwind config, then appends `styles/white-mint.css`, `components/workspace/workspace.css`, and `components/workspace/workspace-surfaces.css` in application order. CI `41083212365` and Preview `dpl_GaEQx9wUePWXRFn1V79951YcAx7x` matched `0a26c611` only.

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

The commit list below is the 29 October record. Current main and the R5 head are in the 31 October section and on the PR.

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

Dated 29 October reason, superseded: the first audit treated a 300×150 frame as a failed form, and the embed route did not exist yet. R2 later showed the clip. R3 added the 404 route. The still-open cause is the consent and execution bridge in the current section, not the missing route and not the frame height.

## R1-F1

Native CI run `40949841634` failed `npm run check:schema-bezug` because `Buffer.from('Bangkok')` in `lib/providers/twelve-go/widget/quelle.test.ts` matched the schema scanner as a table. The assertion now decodes the general export as UTF-8 and checks that the text does not contain `Bangkok`. No table, migration, scanner, or workflow was changed. `CONSENT_BLOCKED` is unchanged.

## Not done

- No Production deploy, no Ready, no merge.
- No edit to privacy, CMP, DiscoverCars, Viator, UX, affiliate V1 logic, database, Auth, or `docs/ACTIVE_WORK_STATUS.md`.
- No follow-up slice.
