# Account Home and Export Completion 1 — Status

**Lane K · 26 October 2026 · Cursor Generation 1**

**Status:** R3 stacks the Home trip text above its actions. Draft. No final Technical-Lead PASS. Not Ready. Not merged to main.

## Identity

Re-read of `.jetnity/operating-mode.json` and `origin/main` on 26 October 2026, after `git fetch origin main`, before the merge:

| | |
| --- | --- |
| Mode | `NORMAL` |
| Logical writer | Jetnity Account Home and Export Completion 1 — Cursor Generation 1 |
| Runtime | `grok-4.7-high-fast`, from Cursor Cloud run-info field `originalModelName` |
| Session | `bc-596c12d0-a045-48c8-ba62-db7ca4ca3809` · https://cursor.com/agents/bc-596c12d0-a045-48c8-ba62-db7ca4ca3809 |
| Branch | `feat/r109-account-home-export-completion-1` |
| Draft PR | #1036 · tracking #1033 · parent #1026 |
| Accepted `origin/main` | `7c5b32d309fa52f18bca1b1744421cb5b2cd1c84` |
| Accepted main tree | `a1a3e145b6870fa5e1d4c2f00bb04f9d5c240d8a` |
| Starting reviewed head | `c020b7cb81616d469d8021cb33395afe653ef659` |
| Starting reviewed tree | `77b4a7d874e262b215ae89390b96439d61fa3e74` |

The merge is ordinary and history-preserving. No rebase, reset, force-push, sibling cherry-pick, or second writer.

| | |
| --- | --- |
| Merge commit | `db09b714d4fe57459e37b672fef603853b66d0d4` |
| Merge parents | `c020b7cb81616d469d8021cb33395afe653ef659` and `7c5b32d309fa52f18bca1b1744421cb5b2cd1c84` |
| Merge tree, before the proof commit | `816cd8d1236ec8088c57dbb38829adec55d2c147` |
| Proof commit | `d5b7bf3392bca6ed4d9d675d3d1b053c87d466bd` |
| Proof tree | `e50bd37d337968788c0eb64c4b2911af463f8eb8` |
| Merge-base with accepted main | `7c5b32d309fa52f18bca1b1744421cb5b2cd1c84` |
| Ahead / behind at the proof commit | 11 / 0 |

This documentation commit sits on that proof commit. It cannot name its own SHA. The author block on Draft PR #1036 records `git rev-parse` after the push. CI and Preview for that head are pending and are not claimed here.

`package.json` and `package-lock.json` match accepted main exactly. `npm ci` installed `ws@8.21.0` and `source-map-js@1.2.2`. No new dependency.

## What landed

- Home and world say when the 200-row reader result is the whole answer, only the loaded window, or a failed read. At 200 stage-less trips they do not say the account has no places. A complete empty account still may. Visit emptiness and a failed trip or visit stay separate.
- The device calendar day moves at local midnight and on focus, pageshow and visibility. No network poll and no stored derived date.
- Settings starts one explicit JSON download. Failures, cancel, timeout and a late body stay on the page and do not download. A newer pointer or keyboard focus is left in place. Keyboard cancel focuses the message.
- The client rejects an unusable `generatedAt`, a null row, a scalar row, an array row, a blank id, and a duplicate id inside one table. A valid file has one row in each of the 13 tables.
- The existing 13-table export pages with `user_id` plus ascending `id` before `range`. Schema version, columns, owner predicate, no-store and the 20,000 cap stay. Ordering is per table, not one atomic snapshot.
- `KontoLoeschen.tsx` still has the secondary raw export anchor. The export route, Auth, deletion and privacy contracts were not edited.
- `WorldExplorer.tsx` still has only the narrow coverage, empty-state and recovery presentation granted in the R1 addendum. Geography, search and markers were not changed. TASK V1 was not edited. Blob `ca05682f451fb9140af63922afbf9ec2b0cb0e35`.

## Checks on the integrated tree

Node `v22.23.4`. These are this session's local results, not native CI.

| Check | Result |
| --- | --- |
| `npm ci` | pass, from the integrated lock |
| `npm run typecheck` | pass, on proof commit `d5b7bf3392bca6ed4d9d675d3d1b053c87d466bd` |
| `npm run lint` | pass, 0 errors, 175 warnings |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` | pass. Schema notes list pre-existing local/unapplied RPCs outside this lane |
| `npm test` | 7324 tests, 7308 pass, 5 skipped, 11 fail |
| `npm run build` | pass, including `check:setup` (warning: no `.env` file in this VM) |
| Focused account tests | 35 pass, 0 fail |
| Mounted audit | pass, production CSS inlined (101,364 characters). Protocol in `docs/evidence/account-home-export-completion-1/mounted-proof.json` |

The one warning in this lane's file is `weltMusterId` in `components/account/AccountWeltKarte.tsx`. That import was already unused on baseline `6ae344f4453b16514f9048083bb8b07396135fa2`. The unused `ReiseFensterHinweis` import added by this lane was removed.

The 11 failures are existing native PostgreSQL proofs. This VM has no `/usr/lib/postgresql/16/bin/initdb`. Errors are `ENOENT`, `local_proof_connection_override_forbidden`, or `NOT_VERIFIED: local PostgreSQL binaries are required`. They are not account-home or export tests. No hosted SQL was used. The 5 skips are the same class of local-binary absence, or CI-only checks.

Mounted audit, synthetic fixtures, external network aborted, zero page errors: 21 export requests, 3 downloads, 3 object-URL revokes. The valid download's file contents match one row in all 13 tables. Blank id, duplicate id, null, scalar, array and `not-a-date` produce no download.

## R2

Reviewed head `33d2874493ffe41aef6f621fa4d2a67cd5263edf`, tree `d4e7a9bac2b46165ee8f11e0ea19697eb32d5882`. A valid 116-character title (`('Lissabon '.repeat(13)).trim()`, inside `GRENZEN.titel` of 120) let “Reise fortsetzen” paint outside its button at 1440, at 16px and at a 32px root. The same dimensions exist on accepted main. This lane owns the Home card, so the layout is corrected here. Accepted main was re-read and was still `7c5b32d309fa52f18bca1b1744421cb5b2cd1c84`. It was not merged again.

The action column no longer shrinks (`xl:shrink-0`, no `min-w-0`). The links use a minimum height instead of a fixed height, and the labels can wrap. The title, the labels and the destinations are unchanged. Nothing is clipped or ellipsized.

Correction commit `03bacf6e45e67f0fb3db5d70b19b6d4f11df6fde`, tree `2c7efb77605c6d6587232920997321dde2f15820`, parent `33d2874493ffe41aef6f621fa4d2a67cd5263edf`, 13 ahead / 0 behind accepted main. The documentation commit on top of it is the delivery head and is named in the PR author block.

The 215-character title (`repeat(24)`) stays in the audit as stress evidence only. It is outside the 120-character contract. The before screenshots are `home-1440-before-r2.png` and `home-1440-200-prozent-before-r2.png`. The valid case is `home-1440-titel-116.png` and `home-1440-titel-116-200-prozent.png`.

Mounted audit on the rebuilt CSS (101,432 characters): the 116-character title at 1440 keeps both labels inside their link boxes at 16px and 32px, the links stay inside the card and do not overlap, and Enter requests `/reisen/r0` once. The same containment check passes for the 215-character stress title at 320, 390, 768 and 1440, including 32px at 1440. Export and window cases are unchanged: 21 requests, 3 downloads, 3 revokes, 0 page errors.

## R3

Reviewed head `378f5c01b321f4a35d571251896dfa94b82c2cbc`, tree `e160e6e2c58a417742710540932312f2bde4f4d8`. R2 stopped the action labels from leaving their buttons by keeping a `xl:w-56 xl:shrink-0` column. At a 32px root that column is 448px. On the 704px card the title column was 78px wide, so the 116-character title broke into 78 lines and the next-trip sentence overlapped the buttons.

The card no longer places that column beside the text. The title, status, origin and dates use the card width, and the actions wrap underneath. Labels, destinations and font sizes are unchanged. Nothing is clipped or ellipsized. Accepted main was re-read and was still `7c5b32d309fa52f18bca1b1744421cb5b2cd1c84`. It was not merged again.

Correction `273791e37ca02f3705910d2d4f3df3ea0b1d0a0c`, tree `31457f07ab1eeeced44e53f2846ce9420fbcf580`, parent `378f5c01b321f4a35d571251896dfa94b82c2cbc`. At that commit the branch is 16 ahead and 0 behind accepted main. The documentation commit on top is the delivery head named in the PR author block.

The R2 screenshot of the overlap is `home-1440-titel-116-200-prozent-before-r3.png`. The rebuilt CSS is 101,250 characters. At 1440 and a 32px root the same 116-character title is 7 lines. Each word in the next-trip label, status, title, origin and dates is one rectangle, and none of those rectangles meet an action. The same check passes at 320, 390, 768 and 1440, at 16px and 32px. At 320 and 32px the title uses 13 lines, one whole word per line, not a character split. Enter requests local `/reisen/r0` and `/reisen` once each. No request leaves `127.0.0.1`. The 215-character fixture stays labelled stress. Export counts stay 21 requests, 3 downloads, 3 revokes, 0 page errors.

## R4

Reviewed head `8d1a59e40f78afb8d74edc25a7c6b24323dd9275`, tree `376192f5a3ccd98328a2bd8f984f2f4964c3da0f`. Stacking removed the overlap. At 320×900 and a 32px root the rem insets still left the title 222px wide. On a wide system font each “Lissabon” broke, and “fortsetzen” broke inside the primary action. This environment’s Chromium renders Noto Sans Bold, which kept the title words whole and still broke “fortsetzen”.

Below `sm`, the card uses `px-[16px]` and the actions use `px-[12px]` and `gap-[8px]`. From `sm` up the card returns to `p-8`. The stack, the font sizes, the full title and both destinations stay. Words use `break-normal`. Nothing is clipped. Accepted main was re-read and was still `7c5b32d309fa52f18bca1b1744421cb5b2cd1c84`. It was not merged again.

Correction `41b2ff903be2687f561a6bf191d3da991753fd96`, tree `ebbfdc729e92d9b048e9a2228857bc2ccc7a7bda`, parent `8d1a59e40f78afb8d74edc25a7c6b24323dd9275`. At that commit the branch is 18 ahead and 0 behind accepted main. The documentation commit on top is the delivery head named in the PR author block.

The failed 8d1 screenshot is `home-320-titel-116-200-prozent-before-r4.png` (320×7426). The rebuilt CSS is 101,303 characters. This session’s rendered family is the project system stack, and CDP reports `Noto Sans (Fontations)/NotoSans-Bold/custom:false`. At 320/32 the title is 48px, weight 600, clientWidth 286, and 13 lines. At 1440/16 the title is 30px and clientWidth 718. Observed title lines: 320/16px:7, 320/32px:13, 390/16px:5, 390/32px:13, 768/16px:3, 768/32px:7, 1440/16px:3, 1440/32px:7. The bound is 13 intact lines for this 13-word title. The title string stays 116 characters; a different line count is wrapping, not missing text. Action words are checked too. Enter still requests local `/reisen/r0` and `/reisen` once each. The 215-character fixture stays labelled stress. Export counts stay 21 requests, 3 downloads, 3 revokes, 0 page errors.

A separate local measurement set `font-family` to DejaVu Sans on the mounted card only. It is not the product font and not this audit’s rendered font. DejaVu Sans Bold draws “Lissabon” at 226.56px and “fortsetzen” at 162.88px. The same card’s title box is 286px and the action label box is 222px, so those two words fit there as well.

## R5

Reviewed head `790e41cad2f60995a967a456e8dbf86fa803656c`, tree `56cc4735da0c450195532f234f00fd2c0fe3daf4`. The eight 116-character cases pass. `break-normal` on the title and origin then let a valid unbroken 120-character token leave the card. `neueReiseSchema` and `reiseSchema` accept `'W'.repeat(120)` and `'Z'.repeat(120)` and reject 121. That is a different contract from the 13-word Lissabon fixture and from the 215-character stress title.

The title and origin use `break-words` again. The R4 insets, stack, font sizes, labels and destinations stay. Fixed labels stay `break-normal`. Nothing is clipped. Accepted main was re-read and was still `7c5b32d309fa52f18bca1b1744421cb5b2cd1c84`. It was not merged again.

Correction `62d01072e9c22eb4d5311c17c9117fcf182aca8a`, tree `484225ce04596539c5a4cd414baab535e5e98536`, parent `790e41cad2f60995a967a456e8dbf86fa803656c`. At that commit the branch is 20 ahead and 0 behind accepted main. The documentation commit on top is the delivery head named in the PR author block.

Before the change, this environment’s Noto Sans Bold drew the 120-character title past the 286px box: at 16px the text rectangle was 2698.56px and the document scrollWidth was 2716; at 32px those were 5397.14px and 5414. Those shots are `home-320-titel-120-before-r5.png` and `home-320-titel-120-32-before-r5.png`. Root’s DejaVu measurements on 790 were larger and are not claimed as this font. After the change the same token at 320px is 10 title lines and 5 origin lines at 16px, and 20 and 9 at 32px. The rectangles stay in the card, the page does not scroll sideways, and the 13-line Lissabon bound is not applied. Enter on that card requests local `/reisen/r0` and `/reisen` once each, and the 116-character keyboard checks still do. Rebuilt CSS is 101,303 characters. This session still renders `Noto Sans (Fontations)/NotoSans-Bold/custom:false`. The 116-character line counts are unchanged: 7, 13, 5, 13, 3, 7, 3, 7. Export counts stay 21 requests, 3 downloads, 3 revokes, 0 page errors.

## Stop

Independent re-gating of the pushed head. Cursor does not mark Ready and does not merge. No follow-up slice. CI and Preview for this head are pending.
