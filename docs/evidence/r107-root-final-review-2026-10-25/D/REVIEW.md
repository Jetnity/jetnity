# R107-D R2 correction — bounded independent recheck

Read-only helper `/root/dependency_review`. Root Technical Lead owns formal acceptance, native gates, Ready and merge. This packet is not a candidate PASS.

## Identity and full delivery

- PR #1020, open / Draft.
- Exact exercised head `878212adf0384bba02cd1ce217041a673bfdaf84`, unchanged in a fresh live read after the probes.
- Tree `b0e0fe9601404e0954c956b19c6bf437a32b9a1d`.
- Main / merge-base `a74c443c6be3f064f150fcf021ab6154bda325e5`; independently compared 9 ahead / 0 behind, 29 changed files.
- Original author Jetnity Admin User Directory Completion 1 — Cursor Generation 1.
- Same Cursor session `bc-cc48889b-f8c5-4cce-9892-1daa0eab7fc6`, attested runtime `grok-4.7-high-fast`.
- Same-session response `6400998745`, updated 2026-10-25 17:53:30 UTC, explicitly delivers the final head and stops for independent re-gating. Current HANDOFF, STATUS, REPORT, SELF_REVIEW and receipts are updated. This is a full correction delivery, not an intermediate commit.
- TASK blob remains `704b63dc2f0da1df30db73988cf7e3bb4ed6cbfb`; accepted PLAN blob remains `888407e808559463e22b0dbc2392bef09d01f48d`.

## Bounded source delta

Compared prior reviewed `d29a621390bf1d760c3086bea8cb5f19e5160d25` to final 878:

- Two commits, eight changed paths.
- Product commit `5575794c1e84f703769bcaa2d1f98af0d4693812` changes only `UsersTable.tsx` and the lane proof runner.
- Sole product behavior change: `commitFilters` no longer clears `ownSearchAcks`; three explanatory comment lines replace that clear.
- The lane runner adds exactly the role and status delayed-acknowledgement regressions.
- Final 878 is documentation/evidence only; current screenshot files are unchanged in this delta.
- No changes to Clear, page navigation, retry, external URL synchronization, native traversal, mutation actions or other product files.

All eight fetched final-head files independently matched their GitHub Git blobs. Actual current UsersTable blob `4151e01aec8d60fc61f7685af583c6037dd1c718` is present in the new bundle, and the prior table is absent. `editable`, `changeRole` and `toggleBan` function texts were additionally compared with exact a74 baseline and match. The assignable-role expression is unchanged by this delta; its prior baseline AST check is preserved.

## Actual mounted results

Five bounded cases ran with the real current component, retained existing harness and project CSS. All assertions passed; every case made zero mutation action calls.

| Case | Actual intermediate result | Actual final result |
| --- | --- | --- |
| Delayed anna, then role operator | Both replaces retained. After committing older anna URL/read, input remains empty, operation remains dispatched, previous-query copy stays, one latest-filter replace remains queued. | Commit latest filter: `page=1&role=operator`, empty input, settled/current, queue empty, exactly two replaces. |
| Delayed anna, then status pending | Both replaces retained. After committing older anna URL/read, input remains empty, operation remains dispatched, previous-query copy stays, one latest-filter replace remains queued. | Commit latest filter: `page=1&status=pending`, empty input, settled/current, queue empty, exactly two replaces. |
| Delayed anna, then Clear | Older anna URL/read actually commits; input stays empty, phase acknowledged rather than settled, previous-query copy stays. | Clear actually commits to `page=1`, empty input, settled/current, queue empty, exactly two replaces. |
| External navigation during held search | After a held bob search and newer bobby draft, external elsa/page2 is applied. | Input and URL become elsa/page2; no delayed bobby replacement; exactly one original replace and zero mutation calls. |
| Actual native Back / Forward | Native history.back returns to bob/page1; native history.forward returns to anna/page3. | Two trusted popstate events; field follows the address; held request remains queued through both traversals; no extra replaces. |

The original R2 P2 counterexample no longer reproduces. No additional finding was found in the requested bounded delta and these five cases. No broader matrix or same-value-filter behavior was tested.

### Harness distinction

Role, status and Clear retained both pending replaces and actually committed the older URL/read followed by the newer URL/read. Their result is not produced by discarding a queue.

The retained external-navigation helper intentionally drops queued commits when it applies an external URL. That is explicitly recorded as the boundary of the external-navigation case; this case does not claim a later stale queued acknowledgement was received. Native Back/Forward used real browser history APIs and trusted popstate events, and retained the held queue.

## Evidence

- `bounded-probe.mjs`: reviewed current-head bundle and five-case runner.
- `bounded-probe-results.json`: complete queued/intermediate/final observations, action and refresh counts, and real popstate records.
- `bundle-inputs.json`: actually bundled file paths and SHA-256 hashes.
- `source-manifest.json` / `source-blob-verification.json`: all eight exact fetched blobs.
- `live-identity.json`: independent comparison, final live-head check, immutable blobs and complete-delivery identity.
- `verification-record.json`: execution/artifact hashes and preservation of earlier D proof packets.

Execution: Node v24.22.1, existing dependencies, existing Chromium 1187 at `/tmp/r106-review-browsers`. Existing project CSS is reused unchanged because the product delta changes only acknowledgement handling and comments. The previously documented exact `feldFehlerId` / `ariaBeschrieben` helper extraction remains the bundle boundary; it avoids unrelated trip-schema imports and does not replace the component's navigation logic.

This is isolated local component evidence with controlled router/read/action seams. It is not native Node22 CI, signed-in full Next routing, hosted Supabase, SQL/RLS or Production acceptance. Native CI/Vercel gates remain with root. Author-reported 44/44 mounted and ordinary gate claims are not substituted for independent acceptance here.

Prior packets remain unchanged. No installs, hosted work, held-source inspection, external writes, product edits, Ready or merge occurred.
