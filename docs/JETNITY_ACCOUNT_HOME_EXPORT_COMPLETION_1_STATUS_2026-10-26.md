# Account Home and Export Completion 1 — Status

**Lane K · 26 October 2026 · Cursor Generation 1**

**Status:** implementation and local proof are on this branch. Draft. No Technical-Lead PASS. Not Ready. Not merged.

## Identity at the implementation tip

Re-read of `origin/main` on 26 October 2026, after `git fetch origin main`:

| | |
| --- | --- |
| Logical writer | Jetnity Account Home and Export Completion 1 — Cursor Generation 1 |
| Runtime | `grok-4.7-high-fast` (this session; not Auto) |
| Session | `bc-596c12d0-a045-48c8-ba62-db7ca4ca3809` · https://cursor.com/agents/bc-596c12d0-a045-48c8-ba62-db7ca4ca3809 |
| Branch | `feat/r109-account-home-export-completion-1` |
| Draft PR | #1036 · tracking #1033 · parent #1026 |
| `origin/main` | `6ae344f4453b16514f9048083bb8b07396135fa2` |
| Merge-base | `6ae344f4453b16514f9048083bb8b07396135fa2` |
| Implementation tip | `276c9d20ebf9cd325f2c58cfaaefcf18b3e6cfe5` |
| Implementation tree | `a33cce1b94ec85e78688d6d8df970239f3b027d6` |
| Ahead / behind at that tip | 4 ahead / 0 behind |

The documentation commit that adds this file is the review tip. Its SHA is not inside this file. The author block on Draft PR #1036 records `git rev-parse` after that commit is pushed. #751, read before delivery, still names the same main and says K was waiting for first evidence. Siblings #1028, #1030, #1034 and #1035 stayed separate drafts. This branch was not rebased onto them or onto main.

## What landed

- Home and world say when the 200-row reader result is the whole answer, only the loaded window, or a failed read.
- The device calendar day moves at local midnight and on focus, pageshow and visibility. No network poll and no stored derived date.
- Settings starts one explicit JSON download. Failures, cancel, timeout and a late body stay on the page and do not download.
- The existing 13-table export pages with `user_id` plus ascending `id` before `range`. Schema version, columns, owner predicate, no-store and the 20,000 cap stay. Ordering is per table, not one atomic snapshot.
- `KontoLoeschen.tsx` still has the secondary raw export anchor. The export route, Auth, deletion and privacy contracts were not edited.

## Checks

Node `v22.23.4`.

| Check | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass, 0 errors, 180 existing warnings, none in this lane's files |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` | pass. Schema notes list pre-existing local/unapplied RPCs outside this lane |
| `npm test` | 7265 tests, 7249 pass, 5 skipped, 11 fail |
| `npm run build` | pass, including `check:setup` (warning: no `.env` file in this VM) |
| Mounted audit | pass with inlined production CSS. Protocol in `docs/evidence/account-home-export-completion-1/mounted-proof.json` |

The 11 failures are existing native PostgreSQL proofs. This VM has no `/usr/lib/postgresql/16/bin/initdb`. Errors are `ENOENT`, `local_proof_connection_override_forbidden`, or `NOT_VERIFIED: local PostgreSQL binaries are required`. They are not account-home or export tests. No hosted SQL was used.

## R1 on the reviewed head

Reviewed head `3d3a24b8c0272f3fdbd7ad14f81ffb1615a9a1d4`. R1.1, R1.2 and R1.3 are corrected on this branch and not rebased onto main.

`origin/main` has since moved to `68435f012f27f599a1092699f5635aa88312ea67` through S. This branch was not synchronized, rebased or merged. S acceptance is still pending. Integration stays with Root.

R1 proof, same mounted harness, production CSS, synthetic data, external network aborted, zero page errors:

- 200 stage-less trips and a successful empty visit history no longer say the account has no places. A complete empty account still may. Trip failure and visit failure stay separate.
- Export success, error and timeout after newer pointer or keyboard focus stay announced and do not move that focus. Keyboard cancel focuses the message.
- `generatedAt: 'not-a-date'`, a null row, a scalar row and an array row do not produce a download event. A valid file does, with one object URL and one revoke. A cancelled older body does not download or settle the newer request. A body after unmount does not download.

## Stop

Independent Technical-Lead review of the new pushed head. Cursor does not mark Ready and does not merge. No follow-up slice.
