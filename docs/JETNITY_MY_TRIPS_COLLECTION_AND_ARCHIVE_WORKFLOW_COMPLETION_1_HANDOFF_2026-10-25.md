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

## Main-sync1

The sections above are the pre-sync record. They are not rewritten and they are not a fresh run.

Parents of this history-preserving merge: branch `444a8c254e11688120f7f2b6e49193746932a865`, tree `93d4734c6a28abfa676d25540158fedb852f99bc`; authorized main `70b878a8fbe23f0dd455175a53de74175b2b976d`, tree `d732487b09c3245c9c22e38b38bb030c8aa181cf`. Fetched `origin/main` was that SHA. The pre-merge merge-base was `a74c443c6be3f064f150fcf021ab6154bda325e5`. No path in the M diff also changed on main. No rebase, squash, cherry-pick, force-push, or sibling merge. The resulting commit is reported in the session handoff comment, not guessed here.

TASK blob `eeb1f1239e07df5d9d9bc7459c4c83918b947777` and PLAN blob `7d4e5ce4f2e4e3715066c77d1204fa754677cbee` stay. The address helper blob stays `a33b7b873fa8542a10345eee66cb50e077dae403`. Runtime proof stays `96715e43f9c979a542a1b7bd5acc2b15ef494c5d`, tree `d734a39f5f97228f076a8d12e37e02b71257a0ae`. That tree is source-equivalent to `444a8c25` for the runtime and the proof. Older `7c997103` and `a8110299` records are not substituted.

The 18 mounted groups are the clean `96715` run on Node `v22.23.4`. Root's 15 bounded observations on Node `24.22.1` and Chromium `140` stay a separate run. Root's direct empty-parameter probe recorded zero `from()` calls. Earlier query and pagination proof stays historical. The local full suite, lint, and hygiene on `7c997103`, including 11 environment failures and 5 skips, are not this integration run.

`package.json`, `package-lock.json`, `tailwind.config.js`, `postcss.config.js`, and `styles/globals.css` have the same blobs on `a74c443c` and `70b878a8`. Incoming lanes still change files that Tailwind scans. The retained screenshots keep their original CSS execution. This packet has no compiled CSS hash. A later reconstruction is not that stylesheet.

The collection sources named above match `444a8c25`. The whole route is not byte-identical, because guest transfer reaches four added strings in `lib/traveller/account-registry-trip-copy.ts`: `warten`, `refreshUnklar`, `unbekannt`, and `erneut`. The previous keys remain. `partyUebernehmen` does not read those four strings, and `GastreiseBruecke` does not import `REGISTRY_TRIP_COPY`.

Tracking remains open pending root post-merge acceptance. Fresh Typecheck, Lint & Build, Auth-Konfiguration, and Preview belong to the pushed head. The native run on `444a8c25` does not transfer.
