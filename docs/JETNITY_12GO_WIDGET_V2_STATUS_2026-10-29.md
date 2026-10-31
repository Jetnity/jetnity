# Jetnity 12Go Official Search Widget V2 — STATUS

Date: 29 October 2026 Europe/Zurich
Tracking: https://github.com/Jetnity/jetnity/issues/1085
PR: https://github.com/Jetnity/jetnity/pull/1086
State: **CONSENT_BLOCKED / DRAFT / R7 disclosure / STOP for independent Technical Lead review**

## Current, 31 October 2026 — R7

Accepted main `628b95ddcffc90261cb3bb3d121eafd9e3ce91ea` is merged. The host shows `TWELVEGO_PRODUCTION_DISCLOSURE` and mounts `PrivacyBeeCmpPreferences` with `appearance="surface"`. The disclosure revision is `twelvego-general-disclosure-v1`. The privacy link is `https://12go.asia/en/privacy-policy`. `CMP_RELEASE_AUTHORIZED` stays false, so the production bootstrap still returns no capability. A ready message or a grant is not a completed search. R6-R1 scope and frame retirement stay in place. The exact implementation head is posted on the PR.

Sentences below that say the visitor has no request button, or that the policy row is null, describe earlier rounds and are superseded.

R6-R1: the scope key includes stage name, country, place id, trip origin, and origin place id. The same stage id with Bangkok/TH/bkk replaced by Tokio/JP/tyo is a new key. The host hides the frame on that render and releases the handle before the next message can grant it. Restoring the old place does not mount a frame again until a new click.

Native run [41243615981](https://github.com/Jetnity/jetnity/actions/runs/41243615981) on `8e36dad9` failed in `lib/trips/organisieren-action-recovery-1.test.ts` because the new hook called `useContext` outside that file's custom React. The test loader now supplies the closed scope. The booking, lock, error, retry, and late-context cases stay in the file. App job `124662410744` was the failure. Auth on that run succeeded. Those gates do not cover the correction head.

`/embed/twelve-go` still returns 404. `hostSelectionCommit` is not pinned here. Host source `f056b01d63ac7d61650864734a9b44eb6484989e` has verified source and native gates. Its deployment remains with Root. This branch does not edit CMP or the host. This is not a working embedded search.

## R5.1 light workspace scope

The surface harness places the delivered section inside `.workspace-shell[data-workspace-theme="light"] .workspace-page .workspace-content`. A missing shell, a text color other than the light mint muted token, or a missing desktop content offset fails the run. No global CSS was edited.

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

The official general export and the Bangkok → Koh Chang reference are stored as exact bytes. The 29 October visitor surface had no request button. R6 replaced that with a request that stays closed while the production facade returns null. V1 links stay. There is still no vendor script and no prefetch.

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
