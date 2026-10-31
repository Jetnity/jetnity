# Jetnity UX V1 U1-C Route Design Alignment 1 — HANDOFF

31 October 2026, Europe/Zurich. Amendment 5 delivery. STOP for independent exact-head review. One writer: session `bc-4904589f-a8f0-4106-a65a-507bc53e084a`, read-back `Jetnity UX V1 Route Design Alignment 1 — Cursor Generation 1`, `originalModelName` `grok-4.7-high-fast`.

## Amendment 5

Started from published tip `74b2d565ed7313c0b7644e7d4834b2e2db56b3ca`. The task file is unchanged. No further main merge. Main and merge-base remain `bfdb3751bf40f789437fc33abb16111beaddcefe`.

R8 puts the visit's real day ids in `data-u1c-tag-ids` as JSON and matches return focus by full string equality. Invalid JSON matches nothing. The old space-separated `data-u1c-tage` hook remains for existing selectors. Before the fix, keyboard return for `day-11` focused the Ko-Chang visit, while `day 11` kept that query value and focused the route container. After the fix, both focus the visit that was opened, identified by its route key rather than the JSON text.

R9 stores the trip, parent tag, connection id and occurrence key when All Connections opens, and still calls the existing trigger capture. The original button is disconnected once the plan section unmounts. On the mobility-child return, focus moves to the new visible button inside that same connection detail, after the detail-close path has focused the plan heading. If that logical target is gone, the heading fallback remains. The regression keeps an ElementHandle from before Enter: it is disconnected after return, and the focused node is a different connected button with the same occurrence. Removing Ko Chang before return focuses `#workspace-plan-titel` and not another All Connections button.

Local results after the fix: route units 13/13; workspace suite 7/7 on the rerun, including R6, R7, the light-palette check and these two regressions. One earlier parallel run timed out in the existing connection keyboard step; that test then passed alone and in the suite rerun. U1-B browser 16/16, U1-C evidence 1/1, N12 browser 9/9. Typecheck passed. ESLint on the edited files has the three pre-existing TripWorkspace warnings and no new warning. Hygiene checks passed. Production build finished 26 static pages. The pushed head, tree and native CI/Preview are in the PR comment.

Hosted Develop and account acceptance stay open. The first outstanding step is an independent Technical-Lead exact-head review.

## Previous handoff

31 October 2026, Europe/Zurich. Amendment 4 delivery. STOP for independent exact-head review. One writer: session `bc-4904589f-a8f0-4106-a65a-507bc53e084a`, read-back `Jetnity UX V1 Route Design Alignment 1 — Cursor Generation 1`, `originalModelName` `grok-4.7-high-fast`.

## Amendment 4

Ordinary merge `ca4d408f4d9b7dc23f5d19cff2e70dab31e18eb4` brings pinned main `bfdb3751bf40f789437fc33abb16111beaddcefe` onto author head `5ab20d9d8e796ae5e21d741a02f1ac4aa5ed412e`. Parents are those two commits. `origin/main` at the merge was that same pin, 0 ahead of it. The workspace fixture now loads compiled globals, then `styles/white-mint.css`, then the workspace styles. In the light theme the rendered `--white-mint-canvas`, document background and shell background match the canvas token in that file. A missing file or an unapplied sheet fails that check. R6 and R7 assertions are unchanged.

Local results: route units 13/13; mounted workspace suite 6/6, including the light-palette check, R6 create/edit audit and R7 center clicks. `tsc --noEmit` passed. ESLint on the fixture passed. Hygiene `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` and `check:operating-mode` passed. Production build compiled and finished 26 static pages. The exact pushed head, tree and its own CI/Preview are in the PR comment, not repeated here.

Hosted Develop and account acceptance stay open. #968, #917, #985/#982 and #748 remain. No Ready and no merge from this writer.

The first outstanding step is an independent Technical-Lead exact-head review of the pushed delivery, including its own native CI and SHA-bound Preview.

## Previous handoff

30 October 2026, night Europe/Zurich. STOP after R7. One writer: session `bc-4904589f-a8f0-4106-a65a-507bc53e084a`.

## Read first

1. This handoff, then the R7 section in `docs/JETNITY_UX_V1_U1C_ROUTE_DESIGN_ALIGNMENT_1_STATUS_2026-10-28.md`
2. The Technical Lead R7 v1 request on PR #1082
3. `docs/JETNITY_UX_V1_U1C_ROUTE_DESIGN_ALIGNMENT_1_TASK_AMENDMENT_3_2026-10-30.md`

The review head is the branch tip after this status commit. Re-fetch before review. Main at the start of R7 was `ac2199dba64e458a20a155b5d1bb826ea99949d3`. CI `41109271505` and Preview `dpl_3yq7NYf8FSjDTtVSnSEDpCGeSVT3` gate `dd66a385` only.

Do not mark Ready. Do not merge. Do not start a follow-up. Hosted account acceptance under #968 stays a separate gate. Immediate review fixes stay in this same session.

## Previous handoff

30 October 2026, evening Europe/Zurich. STOP after the R6 test correction. One writer: session `bc-4904589f-a8f0-4106-a65a-507bc53e084a`.

## Read first

1. This handoff, then the R6 test correction in `docs/JETNITY_UX_V1_U1C_ROUTE_DESIGN_ALIGNMENT_1_STATUS_2026-10-28.md`
2. The Technical Lead R6 v2 request on PR #1082
3. `docs/JETNITY_UX_V1_U1C_ROUTE_DESIGN_ALIGNMENT_1_TASK_AMENDMENT_3_2026-10-30.md`

The review head is the branch tip after this status commit. Re-fetch before review. Main at the start of this correction was `ac2199dba64e458a20a155b5d1bb826ea99949d3`. CI `41102456996` and Preview `dpl_zxLWKs58D8NvEoWW16Zg9JFnhiis` gate `802f9159` only.

Do not mark Ready. Do not merge. Do not start a follow-up. Hosted account acceptance under #968 stays a separate gate. Immediate review fixes stay in this same session.

## Previous handoff

30 October 2026, evening Europe/Zurich. STOP. One writer: session `bc-4904589f-a8f0-4106-a65a-507bc53e084a`.

## Read first

1. This handoff, then the R6 section of `docs/JETNITY_UX_V1_U1C_ROUTE_DESIGN_ALIGNMENT_1_STATUS_2026-10-28.md`
2. The Technical Lead R6 request on PR #1082
3. `docs/JETNITY_UX_V1_U1C_ROUTE_DESIGN_ALIGNMENT_1_TASK_AMENDMENT_3_2026-10-30.md`

The review head is the branch tip after this status commit. Re-fetch before review. Main at the start of R6 was `ac2199dba64e458a20a155b5d1bb826ea99949d3`. CI and Preview for `941ee51c` do not gate the R6 head.

Do not mark Ready. Do not merge. Do not start a follow-up. Hosted account acceptance under #968 stays a separate gate. Immediate review fixes stay in this same session.

## Previous handoff

30 October 2026. STOP. One writer: session `bc-4904589f-a8f0-4106-a65a-507bc53e084a`.

## Read first

1. `docs/JETNITY_UX_V1_U1C_ROUTE_DESIGN_ALIGNMENT_1_TASK_AMENDMENT_3_2026-10-30.md`
2. `docs/JETNITY_UX_V1_U1C_ROUTE_DESIGN_ALIGNMENT_1_STATUS_2026-10-28.md`
3. `docs/JETNITY_UX_V1_U1C_ROUTE_DESIGN_ALIGNMENT_1_TASK_AMENDMENT_2_2026-10-28.md`
4. Review comment https://github.com/Jetnity/jetnity/pull/1082#issuecomment-6480842599
5. Draft PR #1082

The review head is the branch tip after the status commit. Re-fetch before review. Pinned and current `origin/main` at this delivery was `ac2199dba64e458a20a155b5d1bb826ea99949d3`. The branch was 0 behind that main. A later main SHA needs a new integration note, not a silent chase.

Runtime commit before the status docs: `621897aafb5c95b66edf6be26912e4069e1ce028`.

Do not mark Ready. Do not merge. Do not start #1068 or a hosted-account slice. #968 stays closed. Immediate review fixes stay in this same session.

## Historical handoff

28 October 2026. STOP. One writer: session `bc-4904589f-a8f0-4106-a65a-507bc53e084a`.

## Read first then

1. `docs/JETNITY_UX_V1_U1C_ROUTE_DESIGN_ALIGNMENT_1_TASK_AMENDMENT_2_2026-10-28.md`
2. Review comment https://github.com/Jetnity/jetnity/pull/1082#issuecomment-6478861951
3. `docs/JETNITY_UX_V1_U1C_ROUTE_DESIGN_ALIGNMENT_1_TASK_AMENDMENT_1_2026-10-28.md`
4. `docs/JETNITY_UX_V1_U1C_ROUTE_DESIGN_ALIGNMENT_1_STATUS_2026-10-28.md`
5. `docs/JETNITY_UX_V1_U1C_ROUTE_DESIGN_ALIGNMENT_1_REPORT_2026-10-28.md`
6. Draft PR #1082

The review head is the branch tip. Re-fetch before review. `origin/main` at delivery was `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc`. A later main SHA invalidates that baseline.

## Review focus

- R1 geometry reachability without requiring 22 chips at once.
- R2 unknown connection copy versus a matched user booking.
- R3 day accessible name includes the visible title.
- R5 mounted TripWorkspace history and 390px Enter focus.
- Compact route versus the before/after screenshots under `/opt/cursor/artifacts/u1c-*.png`.
- `kante` uniqueness and the visible unavailable message.
- Day chooser reachability without a horizontal strip.
- `Reiseoptionen` does not change delete or discard behavior.
- Back-to-top hit test at 390×844.
- No provider, Auth, DB, or config diff.

## Do not

Ready, merge, deploy, start #1068, or change stage-duration semantics. Fixes after review stay in this same session.
