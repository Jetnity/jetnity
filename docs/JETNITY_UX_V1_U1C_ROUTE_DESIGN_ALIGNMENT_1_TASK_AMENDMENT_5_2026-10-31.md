# U1-C — Technical Lead amendment 5: restore the exact keyboard return target

31 October 2026, Europe/Zurich. PR #1082 / tracking #1081 / parent #1064. Binding additive amendment for two independently reproduced review findings in the same unfinished slice. TASK V1, amendments 1–4 and accepted R1–R7 behavior remain in force.

## Reviewed baseline and decision

**CHANGES REQUIRED — R8 and R9, both P3.** Reviewed author head `dfff91311ea9fb793bab52e40ee43f3c752c9250`, tree `31cdbdea9d9157cca5fdd6775bf2e5bed8c85363`. It includes released main `bfdb3751bf40f789437fc33abb16111beaddcefe`, with that merge-base, 23 ahead and 0 behind at review. Amendment 4's author delta contains only its browser fixture and one Handoff section; the TL task file is unchanged. Its existing focused suite independently passed 32/32. This does not cover the two missing cases below.

The TL reviewed the real source, full independent reproduction and actual results. Fresh isolated Chromium 140 / Node 22.23.3, viewport 390×844, actual GastArbeitsbereich + TripWorkspace + WorkspaceShell, active integrated White/Mint CSS: the two additional focus assertions failed on this exact head, 2 FAIL / 0 skip / 0 browser errors / 0 non-loopback requests. The normal-ID control passed. No runtime code was changed for the probes. These are keyboard-context defects, not loss of trip data or a claim of a production incident.

## Same writer, pre-code gate

Resume **Jetnity UX V1 Route Design Alignment 1 — Cursor Generation 1**, original session `bc-4904589f-a8f0-4106-a65a-507bc53e084a`, actual `run-info.originalModelName=grok-4.7-high-fast`. No new generation, Auto or silent substitution. First fetch/read the actual PR tip, including this TL-only task seed; confirm `dfff9131` is in its ancestry and report main, head, tree, merge-base and ahead/behind. The prior rejected non-force push was safely resolved; do not start again from an obsolete cached tip.

**Post the actual session/model read-back and a short PRE-CODE plan as a PR conversation comment, then STOP before source edits for explicit TL plan acceptance.** State the finite write set and how both regressions will fail before the fix and pass afterward. The TL will handle that acceptance; no new Product-Owner decision is requested. A delivery-time attestation is not retrospective evidence that a pre-code comment existed.

## R8 — lossless day membership for return focus

On the reviewed head, `TripWorkspaceRoute.tsx` joins day IDs with a space into `data-u1c-tage`, and `TripWorkspace.tsx` splits that string to find the return target. Accepted IDs are opaque; `reiseLesen()` and workspace query validation accept an internal space.

Reproduction: use the existing reference trip, replace `day-11` with `day 11` and keep any item `dayId` reference identical; verify parser acceptance. In a fresh synthetic guest context at 390×844, open the Ko-Chang visit by keyboard, select Tag 11, then activate **Zur Route**. Control `day-11` focuses visit `stage-kc:ziel:day-9`; valid `day 11` incorrectly focuses the route DIV. Selection and query value stay correct.

Make return-target membership lossless for valid opaque IDs. Preserve canonical IDs, parser acceptance, URL round-tripping and trip data. Do not prohibit spaces, rename IDs, match substrings, choose a different visit, or replace the specific target with a generic container. Add a mounted keyboard regression with the accepted normal and internal-space IDs; assert the actual visible originating visit receives focus after the real return control. The test must establish behavior independently of the chosen DOM encoding.

## R9 — remember the actual All Connections trigger

On the reviewed head, `alleVerbindungenOeffnen()` enters mobility as a child without capturing its trigger, although adjacent child-opening paths use the existing trigger mechanism.

Reproduction in a fresh guest context: open canonical Bangkok → Ko Chang, focus **Alle Verbindungen öffnen**, press Enter, then use the existing **Zum Tagesplan** control by keyboard. The exact parent URL with `tag` and `kante` returns, but focus lands on `H2#workspace-plan-titel`. The actual originating button remains connected and visible.

Restore the original trigger through the existing child/return mechanism, retaining the existing safe fallback if the trigger no longer exists or is no longer visible. Add a fresh-context mounted keyboard regression asserting both the exact parent URL and the actual visible trigger focus. Do not hard-code a new global focus destination, add history entries on return, remount the workspace, or alter selection to make the test pass.

## Finite write set and verification

Allowed runtime edits are limited to `components/trips/TripWorkspace.tsx` and, if the lossless membership representation needs it, `components/trips/TripWorkspaceRoute.tsx`. Add the two behavior regressions to the existing U1-C `workspace-browser.test.ts`; its existing synthetic `workspace-harness.tsx` may receive only the fixture support actually required. If a changed test hook requires it, make only corresponding selector/decoding adaptations in the existing U1-C `browser.test.ts`, U1-B `browser.test.ts`, and `lib/trips/n12-chronology-1/browser.test.ts`. Preserve every existing behavior assertion and threshold. Prefer the smallest coherent implementation; do not redesign focus, routing or the route model.

Run the two regressions before and after the fix and preserve the red/green results honestly. Run the existing route/workspace-mode and U1-B/U1-C focused browser coverage affected by the change, plus N12 if its hook is affected, then required typecheck/lint/hygiene/build gates. Keep the real integrated White/Mint stylesheet and the rendered palette assertion. Retain all R6/R7 contrast, required-node, negative-control, hit-test, resize, normal-layout, history and scroll checks; no weakened assertions or added skips. All test data is synthetic and all non-loopback requests must stay blocked.

Add one concise section to the existing task-owned Handoff with actual changes, commands/results and remaining limits. After the final push, report exact head/tree, parents, merge-base/ahead/behind, changed paths and its own native CI/Preview references in the PR comment. No repeated docs-only head/CI echo commits. Do not rewrite this TL-owned amendment or historical reports. No additional main merge unless the TL separately scopes one after a live drift check.

## Release boundary and STOP

Every changed head invalidates earlier gates. The TL will independently review the full actual diff, rerun the regressions and required focused checks, inspect new native App/Auth CI and the exact Vercel Preview. Hosted Develop/account acceptance under the existing #968 approval remains open and separate; this amendment commissions no hosted login or account mutation.

No DB/SQL/RLS/Auth/ENV, credentials, provider calls or activation, protection/share-link changes, manual deployment, DNS, payment or new cost. Keep #917 STOP, #985/#982 HOLD, #748 personal-browser/CUA suspension, the other consent/provider holds, noindex and the USD100/month ceiling. No unrelated fixes or follow-up slice. **Do not mark Ready or merge. Deliver once, then STOP for independent Technical-Lead review.**
