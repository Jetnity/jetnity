# Jetnity 12Go Official Search Widget V2 — HANDOFF

Date: 29 October 2026 Europe/Zurich
Tracking: https://github.com/Jetnity/jetnity/issues/1085
PR: https://github.com/Jetnity/jetnity/pull/1086
Stop: independent exact-head review by the Technical Lead. No Ready, no merge, no next slice from this author.

## Identity

- Writer: Jetnity 12Go Official Search Widget V2 Opt-In 1 — Cursor Generation 1
- Model: `grok-4.7-high-fast`
- bcId: `bc-2a335d8e-9108-4c0e-a2f2-8d7d499fd49c`
- Session: https://cursor.com/agents/bc-2a335d8e-9108-4c0e-a2f2-8d7d499fd49c
- Mode: `NORMAL`
- Protected main / merge-base: `e462cf7c5910ce75fa6350928326c04e33d94eee`
- Implementation: `e53ac39ce51f85e0a13c51b182f2397ad606ca34`, tree `9e83883a884f885b83a27c28e1705f275f551c57`
- Invalidated head: `c2fa11dcc898d66d2f527ba3efdd11aa8bd1d2c5`. R1-F1 replaces `Buffer.from('Bangkok')` with a UTF-8 `includes('Bangkok')` check. Exact final HEAD, tree, and ahead/behind are the branch tip after that correction. They are posted on the PR because this file cannot contain the hash of the commit that adds it.

## Where the work stopped

`CONSENT_BLOCKED`. The general and reference exports are in `lib/providers/twelve-go/widget/quelle/`. The visitor copy is `components/trips/TwelveGoWidgetEinbau.tsx`, mounted from `TwelveGoAffiliateLinks`. V1 links still work. The form does not load.

The audit script is `scripts/twelve-go-widget-v2/audit.ts`. The surface script is `scripts/twelve-go-widget-v2/oberflaeche.ts`. Both are outside `npm test`. Evidence narrative: `docs/JETNITY_12GO_WIDGET_V2_REPORT_2026-10-29.md`. Proposed notice: `docs/JETNITY_12GO_WIDGET_V2_PRIVACY_NOTICE_2026-10-29.md`.

## Blocker for a functioning form

Two gates are open:

1. An approved vendor notice and choice. The proposal is written. The live privacy page was not edited.
2. An isolation technique that does not run the loader and jQuery 1.11 in the Jetnity origin. The opaque sandbox was not good enough, and `app/embed/twelve-go/route.ts` still needs an explicit review before anyone adds it.

Until both are decided, do not add a visitor load button and do not mount the official script.

## Do not touch

`lib/providers/twelve-go/affiliate/**`, `MobilitaetBereich.tsx`, privacy/CMP, DiscoverCars, Viator, GetYourGuide, UX, Supabase, Auth, RLS, secrets, package, and CI. `docs/ACTIVE_WORK_STATUS.md` was not updated: this task forbids it, even though the progress policy names it. A later writer should reconcile that only with Technical Lead scope.

## R3

Main `ac2199dba64e458a20a155b5d1bb826ea99949d3` is merged without a force-push. The visitor page is still closed. `/embed/twelve-go` is a 404. The iframe contract is `allow-scripts` only at 100% by 800px and is not mounted on the trip page. A local stub proved size and keyboard. The official form was not requested again. Search remains `NOT_PROVED`. Consent #1087 is still required before any live frame.

## R4

The browser script renders the delivered frame component. A unit test fails if that component is omitted or the measured frame is clipped, duplicated, or same-origin. Output is `TWELVE_GO_WIDGET_NACHWEIS_DIR` or the OS temp folder. Non-loopback traffic fails the run. Gates stay closed.

## Next step

Technical Lead reviews the R4 head. CI `41065919207` and Preview `dpl_FZNiKe4kjcB1euezYxZBRhChhEPz` belong to `5dc16630` and do not cover the correction. This session does not start another slice.
