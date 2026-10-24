# Guest Trip Read Recovery 1 — STATUS

Date: 24 October 2026
Status: **implemented on the draft branch, stopped for independent Technical-Lead review. Not Ready. Not merged. Not Technical-Lead PASS.**
Author: **Jetnity Guest Trip Read Recovery 1 — Cursor Generation 1**
Issue: #991 (leave open)
Draft PR: #994
Branch: `fix/guest-trip-read-recovery-1`

## Identity

- Session: `bc-2806475d-7ee4-40d0-980e-1d26bcb5b270`
- Link: https://cursor.com/agents/bc-2806475d-7ee4-40d0-980e-1d26bcb5b270
- Actual model: `grok-4.7-high-fast` (requested Grok 4.7 High Fast). Not Auto. No fallback.
- Chat title set by the supported rename to the logical name above.
- Base and `origin/main`: `913cf9353fd33491d2bd3130b3c430cc88990200`
- Merge-base: `913cf9353fd33491d2bd3130b3c430cc88990200`
- Seed: `de51604c832061ffd18f5742766d5da83cd7caae`
- Plan commit: `de65696cc4233beb4dab02f04fefb31f7c1d8973`
- Addendum V2: `83c64c7c093b3024c4da13aa72502f39872d688e`, blob `8cff61c42d3b341aeee67ec4cb48bfa2999b4271`. Not edited.
- Addendum V3: `2dcc1e5475fb4a70b9b3c89fed2497ab79e1acc3`, blob `e7d6fb1ff65c45238d7d74c752b5e65c8184ac9f`. Not edited. Parent is `f2d8f7e4d94c0a9659652c025b7852862e0b4953`.
- Superseded review heads: `7e7a2e4b1f2733bc970673acd7582fde4eaac83d`, `f2d8f7e4d94c0a9659652c025b7852862e0b4953`. App CI on f2 failed the two workspace-wiring adapters.
- Ahead/behind after this R2 delivery: 10 / 0
- Final head: the commit that adapts the two guest workspace tests. The PR comment records `git rev-parse HEAD` after push. f2 does not gate this head.
- TASK V1 blob, unchanged: `9a089b26a6892ede8f235692b92f72dc225df147`
- Mode: `NORMAL`. This slice does not cross a special Product-Owner gate.
- Lane B of the finite R104 batch. Integration remains B → A → C. Lanes A and C are already active on their own branches. This lane does not integrate them. `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, and #751 are not edited.

## What this branch now does

The guest list and the first workspace read no longer treat every empty loader result as a missing trip. Invalid and unreadable occupancy stops before `gastspeicherLaden()`, so that observation cannot migrate. Invalid occupancy then lists a valid queue through `gastspeicherWarteschlangeLesen()`, which only returns the existing private queue reader. Unreadable occupancy does not read the queue and is not shown as absence. Absence, a valid draft, and legacy still use one loader call. A fresh recheck may observe a new state. A legacy draft with a stored id stays usable when the migration write fails. A legacy draft without an id does not gain a continue link. "Erneut prüfen" observes again and does not delete or reset. Create stays available only when the active slot is confirmed empty (list: absence or queue-only; workspace: absence only).

## Still open for the Technical Lead

- Independent exact-head review of every changed file and the real behavior.
- Exact-head App/Auth CI and Vercel Preview. Earlier heads do not gate this head.
- Ordinary merge, then separate actual-main CI / Production / domain. This author does not merge and does not start a follow-up.

## Verified locally on this tree

The two full wiring files plus the previous focused set: 267 tests, 0 fail. `npm run typecheck` exit 0. Eslint `--max-warnings 0` exit 0 on the two adapter files. The unchanged mounted proof passed 12/12 on the second run, with empty `pageErrors` and `externalRequests`. The first run of that same proof failed one unchanged-error focus assertion while the button was already back and focus was still on `BODY`; no production file changed between the runs. Production build, full eslint, and hygiene checks were not repeated. Full `npm test` was not run locally. Exact-head CI and Preview of this head are not verified.

R2 changes only the guest adapters in `lib/trips/flug-manuell.test.ts` and `lib/trips/unterkunft-manuell.test.ts`. Runtime files are unchanged from f2.

## Not verified here

Full `npm test`, exact-head App/Auth CI, Vercel Preview of this head, hosted account, physical device, screen reader, Production, provider behavior, and the held scopes #985 / #982 / #917 / #968 / #748.
