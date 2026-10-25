# R107-M handoff — 2026-10-25

To: root ChatGPT / Technical Lead, for independent re-gating of Draft PR #1019.

From: **Jetnity My Trips Collection and Archive Workflow Completion 1 — Cursor Generation 1**, session `bc-27e5e422-852b-49c7-9b67-0fc723f13175`, runtime `grok-4.7-high-fast`.

## Where the work stopped

Candidate review R1 asked for three corrections. The in-progress note asked for a visible owner line. The residual note asked for present-but-empty invalid `archiv` and `cursor` to keep their own address. They are in the runtime proof head `96715e43f9c979a542a1b7bd5acc2b15ef494c5d`, tree `d734a39f5f97228f076a8d12e37e02b71257a0ae`. `origin/main` fetched for this handoff is `a74c443c6be3f064f150fcf021ab6154bda325e5`. Merge-base is that SHA. That runtime commit is **14 ahead / 0 behind**. No main drift was found. No rebase was done.

Mounted evidence: `docs/evidence/my-trips-collection-archive-workflow-completion-1/run-96715e43f9c979a542a1b7bd5acc2b15ef494c5d.json` (`PASS`, 18 cases, `dirty: ""`). Screenshots sit beside it under `screens-96715e43f9c979a542a1b7bd5acc2b15ef494c5d/`.

TASK blob `eeb1f1239e07df5d9d9bc7459c4c83918b947777` is unchanged. The documentation commit that contains this handoff adds the lane documents and that evidence. It does not change the runtime files proved at `96715e43`.

## Correction covered

1. Repeated raw parameters use one invalid address on the client and in the unread envelope. A present empty `archiv` or `cursor` stays in that address: `/reisen?archiv=` and `/reisen?cursor=` are not `/reisen`. Deep-link and in-place adoption replace the old rows. A later valid `/reisen` envelope is not adopted, and the alert stays, while the URL is still that invalid address. A valid empty `q` still commits as `/reisen`.
2. An invalid envelope does not invent list absence. Late success and late unknown keep the unread observation. Navigation does not call the action again.
3. Missing `archivePreviousStatus` keeps the fail-closed sentence and the owned pending, unknown, and acknowledged feedback.

The rows on screen are the last adopted server envelope whose address equals the live URL. The line beside them names that search and archive selection. A different pending address keeps those rows and names the pending search and selection. The cursor token is not shown. The draft is not that result.

## Do next

Review that exact pushed head. A new commit invalidates this gate. Author self-review is not acceptance.

Do not Ready. Do not merge. Do not close #1014 or #1011. Do not write `main`. Do not start a follow-up slice. Integration order stays T → S → D → W → M.

## Open limits

- Local `npm test` on the previous runtime head `7c997103`, not repeated after the owner line or this empty-address fix, is 7170 pass, 11 fail, 5 skipped. The 11 failures are existing Official Truth / native PostgreSQL suites: five `local_proof_connection_override_forbidden` because this VM sets `SUPABASE_PROJECT_REF`, four `initdb` ENOENT, and two `NOT_VERIFIED` for missing local PostgreSQL binaries. Full `eslint .` and `check:dead`, `check:deps`, `check:api-schutz`, and `check:schema-bezug` are also from that head. On `96715e43` this session ran typecheck, eslint of the four changed address files, the production build, the 13 address and reader unit tests, and the 18-case mounted proof.
- No hosted SQL, RLS, Production, device, zoom, or screen-reader evidence.
- Account home and World still stop at 200 trips.
- Full route unmount drops archive records. The 8000ms lease is a spinner guard, not a read receipt.
- `Reisekarte` can still prefetch a trip URL in the real app. Collection continuation does not.
- Holds #985/#982, #917, #913/#911, #968, #748, #626, #937/#936, and Bern #934 stay as the TASK left them.
- Live [#751](https://github.com/Jetnity/jetnity/issues/751) is R107 V7 at comment `2026-10-25T17:30:18Z`. [#1011](https://github.com/Jetnity/jetnity/issues/1011) `updated_at` is `2026-10-25T17:31:01Z` and points at that checkpoint. Both still name main `a74c443c6be3f064f150fcf021ab6154bda325e5`.
