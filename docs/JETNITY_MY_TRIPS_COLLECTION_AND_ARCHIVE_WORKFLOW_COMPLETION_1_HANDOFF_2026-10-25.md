# R107-M handoff — 2026-10-25

To: root ChatGPT / Technical Lead, for independent re-gating of Draft PR #1019.

From: **Jetnity My Trips Collection and Archive Workflow Completion 1 — Cursor Generation 1**, session `bc-27e5e422-852b-49c7-9b67-0fc723f13175`, runtime `grok-4.7-high-fast`.

## Where the work stopped

Candidate review R1 asked for three corrections. They are in the runtime proof head `7c9971037f99297c1fd74bdd50c4ac3ecec41d25`, tree `5f05ec70a639a2305c4e386ad1c0b87d170ea806`. `origin/main` fetched for this handoff is `a74c443c6be3f064f150fcf021ab6154bda325e5`. Merge-base is that SHA. That runtime commit is **10 ahead / 0 behind**. No main drift was found. No rebase was done.

Mounted evidence: `docs/evidence/my-trips-collection-archive-workflow-completion-1/run-7c9971037f99297c1fd74bdd50c4ac3ecec41d25.json` (`PASS`, 15 cases, `dirty: ""`). Screenshots sit beside it under `screens-7c9971037f99297c1fd74bdd50c4ac3ecec41d25/`.

TASK blob `eeb1f1239e07df5d9d9bc7459c4c83918b947777` is unchanged. The documentation commit that contains this handoff adds the lane documents and that evidence. It does not change the runtime files proved at `7c997103`.

## Correction covered

1. Repeated raw parameters use one invalid address on the client and in the unread envelope. Deep-link and in-place adoption replace the old rows. A later valid `/reisen` envelope is not adopted while the URL is still repeated.
2. An invalid envelope does not invent list absence. Late success and late unknown keep the unread observation. Navigation does not call the action again.
3. Missing `archivePreviousStatus` keeps the fail-closed sentence and the owned pending, unknown, and acknowledged feedback.

The rows on screen are the last adopted server envelope whose address equals the live URL. The draft is not that result.

## Do next

Review that exact pushed head. A new commit invalidates this gate. Author self-review is not acceptance.

Do not Ready. Do not merge. Do not close #1014 or #1011. Do not write `main`. Do not start a follow-up slice. Integration order stays T → S → D → W → M.

## Open limits

- Local `npm test` is 7170 pass, 11 fail, 5 skipped. The 11 failures are existing Official Truth / native PostgreSQL suites: five `local_proof_connection_override_forbidden` because this VM sets `SUPABASE_PROJECT_REF`, four `initdb` ENOENT, and two `NOT_VERIFIED` for missing local PostgreSQL binaries.
- No hosted SQL, RLS, Production, device, zoom, or screen-reader evidence.
- Account home and World still stop at 200 trips.
- Full route unmount drops archive records. The 8000ms lease is a spinner guard, not a read receipt.
- `Reisekarte` can still prefetch a trip URL in the real app. Collection continuation does not.
- Holds #985/#982, #917, #913/#911, #968, #748, #626, #937/#936, and Bern #934 stay as the TASK left them.
- Live [#751](https://github.com/Jetnity/jetnity/issues/751) is R107 V7 at comment `2026-10-25T17:30:18Z`. [#1011](https://github.com/Jetnity/jetnity/issues/1011) `updated_at` is `2026-10-25T17:31:01Z` and points at that checkpoint. Both still name main `a74c443c6be3f064f150fcf021ab6154bda325e5`.
