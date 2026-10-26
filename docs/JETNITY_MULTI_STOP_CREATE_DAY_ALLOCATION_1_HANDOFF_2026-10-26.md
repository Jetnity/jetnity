# R109-T — Multi Stop Create Day Allocation 1 — HANDOFF

Date: 26 October 2026.

Writer: **Jetnity Multi Stop Create Day Allocation 1 — Cursor Generation 1**.  
Session: https://cursor.com/agents/bc-a0a82333-7855-4ba7-b641-39af97c78458  
Model: `grok-4.7-high-fast`. Not Auto.

## Where to resume

Read the immutable TASK V1, blob `d52e6a8e15cd554e1410b88388491d6ffcab91f6`, then PLAN, STATUS, REPORT and SELF_REVIEW dated 2026-10-26, including the R1 addendum. Do not edit the TASK.

Draft PR: https://github.com/Jetnity/jetnity/pull/1030  
Tracking: https://github.com/Jetnity/jetnity/issues/1029  
Parent: https://github.com/Jetnity/jetnity/issues/1026  
Branch: `feat/r109-multi-stop-create-day-allocation-1`

Seed `09381574876196b4538272c28e05fceae63e87b2`, seed tree `a5173a6623f2fdb53e5ef8aaddd56d591903625d`.  
Original baseline and merge-base: `6ae344f4453b16514f9048083bb8b07396135fa2`.  
Reviewed head that produced R1: `54a06423b80f7c33495f57efbcdda6f7ba31da18`.

The review head is the latest commit on this branch that contains this integrated handoff. Re-read `git rev-parse HEAD`, `git rev-parse HEAD^{tree}`, `git merge-base HEAD origin/main`, and ahead/behind before review.

## Delivery git — integrated

Re-read on 26 October 2026 before the merge. Mode `NORMAL`. `origin/main` was exactly the accepted pin `68435f012f27f599a1092699f5635aa88312ea67`, tree `9f05dce58c9ad800c324db014e98a8aeb5039481`. It had not moved further. The merge is an ordinary `--no-ff` merge of that commit into this branch. No rebase, reset, or force push.

- Merge commit: `cdd2282ba5c82e492ce17cd0bc741d7fc4bfa58d`
- Merge tree: `75810fb13b57c450f9d01ffd83a62fe8360ff6ff`
- Parents: `f30c838307fa86d1409a4954b443f1a48010b4ef` and `68435f012f27f599a1092699f5635aa88312ea67`
- After the merge, before this handoff commit: merge-base equals `origin/main`, **8 ahead / 0 behind**
- This handoff commit is the review head. After it lands, expect **9 ahead / 0 behind** the same main. Re-read HEAD before review.

Integrated mounted proof: `docs/evidence/multi-stop-create-day-allocation-1/mounted-cdd2282ba5c8.json`, 10/10 PASS, commit `cdd2282ba5c82e492ce17cd0bc741d7fc4bfa58d`, `hostedPersistence: not invoked`. The 367-day field text is `Eine Reise umfasst höchstens 366 Kalendertage, einschließlich Abreise und Rückreise.` The 366-day guest case still stores 366 days.

Dependency provenance after `npm ci` on this lock, which matches accepted main and was not rewritten by the install: Node v22.23.4, npm 10.9.7, ws 8.21.0, source-map-js 1.2.2, zod 3.25.76, next 16.4.1, react 19.2.8, `@supabase/supabase-js` 2.57.2. `package.json` is not in the diff against main. This lane did not take dependency ownership.

Focused regressions on that install: 311 pass, 0 fail. `npm run typecheck` exit 0. `npm run lint` exit 0, 0 errors, 180 warnings. `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` exit 0. `npm run build` exit 0. `npm test` exit 1: 7279 tests, 7263 pass, 11 fail, 5 skipped. The 11 failures are the existing local PostgreSQL 16 proofs (`initdb` ENOENT, `NOT_VERIFIED`, or `local_proof_connection_override_forbidden`). No PostgreSQL package was installed and no hosted database was used.

The diff against accepted main is the owned create/import files, the allocation harness and evidence, the five continuity docs, immutable TASK V1, and the one authorized `lib/trips/aktionen.ts` blob in `scripts/next-16-4-1-security-patch-p1/historical-control.json` (`4833378894aeedb152e093912574a698a9701b33` to `e0c03d9ea5fc1200774727e4b790511684020c86`). No other historical-control entry moved.

Hosted CI and Preview for this head are pending until GitHub and Vercel finish the push. This handoff does not wait for them and does not add a later commit only to copy their result.

## Delivery git — R1

Re-read on 26 October 2026 after the R1 runtime commit and before this handoff commit. `origin/main` was fetched. This branch was not rebased or merged.

- R1 runtime HEAD: `c17257ad04ac8bb90e6136c7b3b3f7a50f7537f2`
- R1 runtime tree: `82d1ee68317b87f029075495291f3e428c265efc`
- Mounted evidence: `docs/evidence/multi-stop-create-day-allocation-1/mounted-c17257ad04ac.json`, 10/10 PASS, `hostedPersistence: not invoked`
- `origin/main`: `68435f012f27f599a1092699f5635aa88312ea67` (S merge; actual-main acceptance was still pending)
- merge-base with `origin/main`: `6ae344f4453b16514f9048083bb8b07396135fa2`
- ahead/behind versus merge-base: **4 ahead / 0 behind**
- ahead/behind versus `origin/main`: **4 ahead / 6 behind**

That handoff commit was the review head at the R1 stop. It parents `c17257ad` and adds the R1 records, the mounted evidence, and one visibility change: `zeitraumDauer` is no longer exported, because `check:exports` rejected an unused export.

Earlier delivery, superseded as the review head: runtime `5f81c30c9abf282ab92dfaef4b61fb0f1b4c2e19`, review `54a06423b80f7c33495f57efbcdda6f7ba31da18`, then 3 ahead / 0 behind main `6ae344f4`.

## Changed files

Owned implementation:

- `components/trips/TripPlanner.tsx`
- `components/trips/TripStageDayAllocation.tsx`
- `components/trips/multi-stop-create-day-allocation-1/allocation.css`
- `lib/trips/create-stages.ts`
- `lib/trips/create-day-assignment.ts`
- `lib/trips/create-day-assignment.test.ts`
- `lib/trips/input-resource-bounds.ts`
- `lib/trips/input-resource-bounds.test.ts`
- `lib/trips/multi-stop-create-day-allocation-1/pfad.test.ts`
- `lib/trips/aktionen.ts`
- `lib/trips/anlegen.ts`
- `lib/trips/gastspeicher.ts`
- `lib/trips/schema.ts`
- `types/trips.ts`
- `scripts/multi-stop-create-day-allocation-1/**`
- `docs/evidence/multi-stop-create-day-allocation-1/**`
- this PLAN, STATUS, REPORT, SELF_REVIEW and HANDOFF

Outside the owned list, one hash only:

- `scripts/next-16-4-1-security-patch-p1/historical-control.json` — `lib/trips/aktionen.ts` blob sha1

Not edited: TASK, `uebernahme.ts`, `day-stage-assignment.ts`, `zuordnung.ts`, `timeline.ts`, `lib/reiseaenderung/**`, package files, SQL, AGENTS, operating mode, global CSS, `docs/ACTIVE_WORK_STATUS.md`.

## Tests and browser

Node 22.23.4. Mounted proof: Playwright Chromium via `/opt/google/chrome/chrome`, project CSS, synthetic fixtures, external network aborted, `hostedPersistence: not invoked`. Mounted evidence is `docs/evidence/multi-stop-create-day-allocation-1/mounted-5f81c30c9abf.json`, stamped with runtime HEAD `5f81c30c9abf282ab92dfaef4b61fb0f1b4c2e19`. Six cases passed. External requests were empty. Hosted persistence was not invoked.

`npm run typecheck` exit 0. `npm run lint` exit 0 (0 errors, 181 warnings). Five hygiene checks exit 0. `npm test` on the pre-commit tree exit 1: 7259 pass, 12 fail, 5 skipped. Eleven failures need local PostgreSQL 16. The twelfth was server-action inventory drift; `lib/security/next-16-3-8-security-upgrade-1.test.ts` passed after the hash update. The full suite was not repeated after that hash and the render-time claim adjustment.

Production build: `npm run build` exit 0.

## R1 supplementary disposition — `lib/trips/tage.ts`

The additive guard in `lib/trips/tage.ts` was written before it was proposed. That path was outside the TASK's named ownership. Root then authorized only the additive pure calendar-interval guard, its constants, and the explanatory comment. `datumVerschieben`, `reisetageBauen`, `TAGE_MAXIMUM`, stored-reader limits, and unrelated callers keep their behavior. This is not general ownership of calendar or duration editing. TASK V1 was not edited.

Creator wording on runtime `6997f78f1475169be07ff69a13c28ba917fdf1c6`, tree `24c1f35f545b0b0fd6d629e8f7b5f6110ddbea1b`: accepted 366 days are described as 366 days; rejected 367 days say `Eine Reise umfasst höchstens 366 Kalendertage, einschließlich Abreise und Rückreise.` The reader sentence remains `Eine Reise dauert höchstens 365 Tage`. Mounted evidence `docs/evidence/multi-stop-create-day-allocation-1/mounted-6997f78f1475.json`, 10/10 PASS, `hostedPersistence: not invoked`.

Re-read before this handoff commit: `origin/main` `68435f012f27f599a1092699f5635aa88312ea67`, merge-base `6ae344f4453b16514f9048083bb8b07396135fa2`, **6 ahead / 6 behind**. This handoff commit is the review head and does not rebase. After it lands, expect **7 ahead / 6 behind** the same main.

## R1 historical-control addendum

Root authorized only the necessary mechanical inventory update already on this branch: the expected blob for owned `lib/trips/aktionen.ts` tracks `e0c03d9ea5fc1200774727e4b790511684020c86`. R1 does not edit the control file, the audit script, or `aktionen.ts`. Every protected pin and every other entry stays. This is not blanket ownership.

## Checked / not checked

Checked: create mapping, guest graph, account payload object, frozen mapper positions, preflight sentinels, mounted keyboard/focus/reorder/reset/viewports, 366-day accept and 367-day reject at the mounted Guest and Account boundaries, no guest write and no account dispatch for the 367-day interval, leap-boundary unit cases.

Not checked: hosted SQL, real accounts, real devices, provider calls, post-create `reise_aendern`, sibling branches, package updates, rebase onto `68435f01`.

## Findings

P0 none. P1 hosted persistence unverified. The one historical-control blob is the authorized inventory entry and was not expanded in R1. P2 date-input appearance and the 366-versus-1000 sum reading remain. The false 366-day summary for a 367-day interval is closed on this branch. P3 dropped claims stay dropped; local PostgreSQL proofs are not installed here. Main has drifted by the S merge and is intentionally not integrated.

CI and Preview bind whatever head GitHub builds after push. Do not treat a pending Vercel comment from the seed as acceptance of this head.

## Next action

Root's independent review of the integrated head. Hosted CI and Preview are pending for that head. Do not mark Ready. Do not merge. Do not start a follow-up slice.
