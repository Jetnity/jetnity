# Jetnity – GitHub Hygiene Phase 2 Delete-Safe Status

Stand: 31. August 2026  
Status: **DELETE EXECUTED / EVIDENCE COMMITTED / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**

Issue: #266 (remains OPEN)  
Task: `docs/GITHUB_HYGIENE_PHASE2_DELETE_SAFE_TASK_2026-08-31.md`  
Agent: **`Jetnity github hygiene delete safe 1`**  
Generation: **1**  
Cursor-Session: `bc-59e32b76-6b49-41e6-8631-de29904ea404`  
Branch: `ops/github-hygiene-phase2-delete-safe-2026-08-31`  
PR: #308 (Draft)

Assigned start head: `7459132b462f87a1fb19ad8c0dd7718721fefafc`  
Canonical Phase-1 restore map: `docs/evidence/GITHUB_HYGIENE_PHASE1_SYNC_MANIFEST_2026-08-31.json`  
Fresh baseline / live `origin/main` at start **and** end: `a57a15a6c8011ea81af1a228a2fd0c3e6e0853b9`

Slice window (UTC): `2026-08-31T07:48:08Z` → `2026-08-31T07:49:13Z`

This file is the human-readable delete protocol. Machine-readable twin:

`docs/evidence/GITHUB_HYGIENE_PHASE2_DELETE_LOG_2026-08-31.json`

`docs/ACTIVE_WORK_STATUS.md` and `JETNITY_START_HERE.md` were **not** edited.

## 1. What this slice did

Phase 2 deleted **only** the 15 exact name→SHA pairs classified `DELETE-SAFE_MERGED` in the Phase-1 sync manifest.

Each candidate was revalidated live immediately before its own delete: current `origin/main`, exact tip SHA, open-PR status, protection/ruleset, ancestry, and `rev-list == 0`. Drift would have been `SKIPPED_DRIFT`. Systemic evidence/auth failure would have STOP'd the slice.

Result: **15 / 15 `DELETED`**. `SKIPPED_DRIFT` 0. `STOPPED_SYSTEMIC` 0.

Commit history was not rewritten. Every restore SHA remains an ancestor of `main@a57a15a6`.

## 2. Counts

| Metric | Before | After |
|---|---:|---:|
| Remote heads (`git ls-remote --heads origin`) | 81 | 66 |
| Deleted exact manifest refs | — | 15 |
| Tags | 3 annotated archive tags | unchanged |
| Open PRs | 7 drafts | 7 drafts, same numbers |
| `origin/main` | `a57a15a6…` | `a57a15a6…` |

The Phase-1 collection had 79 heads. The +2 at Phase-2 start are this work branch and the later E2 branch `feat/entry-requirements-official-actions-e2-2026-08-31` (open PR #307). Neither was added to the delete list.

## 3. Per-candidate protocol

Every row: observed tip = expected SHA; not `main`; not an open PR head; `branches.protected=false`; `rules/branches=[]`; ruleset `21875372` still includes only `refs/heads/main`; `merge-base --is-ancestor` pass; `rev-list origin/main..<sha> == 0`; SHA ≠ current `main` tip. Classic protection GET remains the known **403 unread**. Org rulesets remain **404 unread**.

| # | Branch | Expected / observed SHA | Open PR | Protected / ruleset | Ancestor | rev-list | Result | After |
|---:|---|---|---|---|---|---:|---|---|
| 1 | `audit/core-repository-hygiene-2026-08-30` | `a759764eefa568784bfa08029b386b978e1d2138` | no | no / main-only | yes | 0 | `DELETED` | ref gone; SHA still in `main` |
| 2 | `audit/github-branch-hygiene-2026-08-30` | `a4dbc81284550d7b2aa1e0beb5e038deaf6a8d88` | no | no / main-only | yes | 0 | `DELETED` | ref gone; SHA still in `main` |
| 3 | `audit/requirements-provider-groundwork-g0-2026-08-30` | `74e214606c9f881ce0cd19aef3ed7865eb304d3b` | no | no / main-only | yes | 0 | `DELETED` | ref gone; SHA still in `main` |
| 4 | `audit/tw8-tw9-readiness-2026-08-31` | `93fb21efab6c22c3fd2b14a3a23d18f46110fd03` | no | no / main-only | yes | 0 | `DELETED` | ref gone; SHA still in `main` |
| 5 | `cleanup/final-mechanical-repository-leftovers-2026-08-30` | `204511f552d58e246cd08fd8b724eb98edd4dc49` | no | no / main-only | yes | 0 | `DELETED` | ref gone; SHA still in `main` |
| 6 | `docs/chatgpt-technical-lead-transition-2026-08-30-final` | `471bc93d19c2fa243182f6560e415b952b17364a` | no | no / main-only | yes | 0 | `DELETED` | ref gone; SHA still in `main` |
| 7 | `docs/post-cleanup-technical-lead-checkpoint-2026-08-30` | `5a3cf6aad1a5c89c98a96ec2904f2e265f22da2a` | no | no / main-only | yes | 0 | `DELETED` | ref gone; SHA still in `main` |
| 8 | `docs/requirements-gate0-closed-2026-08-31` | `4a86ea753bf3f7c5cfd667661f6a01557280b8ba` | no | no / main-only | yes | 0 | `DELETED` | ref gone; SHA still in `main` |
| 9 | `docs/requirements-s4-r1-closed-entry-target-2026-08-31` | `2aac34ddea0c88327986fc459826892d8895f3d0` | no | no / main-only | yes | 0 | `DELETED` | ref gone; SHA still in `main` |
| 10 | `feat/entry-requirements-detail-contract-e1-2026-08-31` | `56e018d36a176c0061a57978b8a6b5044369409d` | no | no / main-only | yes | 0 | `DELETED` | ref gone; SHA still in `main` |
| 11 | `feat/requirements-truth-ops-s4-r1-2026-08-31` | `595b4ad2a827beff7bec597433b3316d21da0747` | no | no / main-only | yes | 0 | `DELETED` | ref gone; SHA still in `main` |
| 12 | `feat/requirements-truth-ops-s4-r1-ready-2026-08-31` | `595b4ad2a827beff7bec597433b3316d21da0747` | no | no / main-only | yes | 0 | `DELETED` | ref gone; SHA still in `main` |
| 13 | `ops/creator-media-c2-recovery-2026-08-30` | `cf2bbd5b71392f17c8f31e2a13e450ae9de72e15` | no | no / main-only | yes | 0 | `DELETED` | ref gone; SHA still in `main` |
| 14 | `ops/creator-media-c3-decommission-2026-08-30` | `e8069799774433c905663b00867085bab4dbd461` | no | no / main-only | yes | 0 | `DELETED` | ref gone; SHA still in `main` |
| 15 | `recovery/core-repository-hygiene-2026-08-30` | `a759764eefa568784bfa08029b386b978e1d2138` | no | no / main-only | yes | 0 | `DELETED` | ref gone; SHA still in `main` |

Delete command for each PASS: `git push origin --delete refs/heads/<name>`.

Independent post-slice `ls-remote` (after the runner finished) again showed all 15 absent, `main` still `a57a15a6…`, 66 heads, tags identical.

## 4. Remaining open PR heads

Not deleted. Same seven drafts before and after:

| Number | Draft | Head | Head SHA |
|---:|---|---|---|
| 308 | true | `ops/github-hygiene-phase2-delete-safe-2026-08-31` | `7459132b462f87a1fb19ad8c0dd7718721fefafc` (delivery push moves this) |
| 307 | true | `feat/entry-requirements-official-actions-e2-2026-08-31` | `666756a5a8a8f55e1eb39e7128ef9c526f44e26e` |
| 52 | true | `docs/chatgpt-technical-lead-handoff-2026-08-24` | `f1e13db332ce087297dae60d4f1b3c21f321f9ec` |
| 50 | true | `cursor/s1-merged-status-f23f` | `f5a25c949f8bbfb889f87653ba1a08a02f75f6ea` |
| 40 | true | `audit/admin-platform` | `a316015733b86e2adbd050abb2f77258a99da366` |
| 39 | true | `audit/account-platform` | `65b08f4718ad74f3157c55a3efb960a4c843408a` |
| 28 | true | `feat/trip-collaboration-foundation` | `e0132cb576e8231296dc5b290e0afcef88ceb9f4` |

Historical drafts #28 / #39 / #40 / #50 / #52 were not closed.

## 5. Explicit confirmations

- `main` was not deleted and not moved by this slice.
- No tags were deleted or changed.
- No non-manifest branch was deleted.
- Phase-1 audit branch `audit/github-hygiene-phase1-2026-08-31` still exists.
- This Phase-2 branch still exists.
- Candidate list was not widened (E2 and any newly delete-safe leftovers stay for a later audit).
- No PR was closed.
- No branch protection / ruleset was changed.
- No Runtime / App / Supabase / Vercel / Auth / Provider file was changed.
- Issue #266 was not closed.

## 6. Restore

A deleted ref is reconstructed from the documented SHA, which remains in `main`:

```bash
git fetch origin a57a15a6c8011ea81af1a228a2fd0c3e6e0853b9
git push origin <restore-sha>:refs/heads/<branch-name>
```

Exact per-name commands are in the delete log under `restore_instructions`.

## 7. Evidence files

| Path | SHA-256 | Bytes |
|---|---|---:|
| `docs/evidence/GITHUB_HYGIENE_PHASE2_DELETE_LOG_2026-08-31.json` | `888facf8d6d4797f3826d7a74de290ec4fe95f84a6cdf122729d6c266ca518d1` | 69723 |
| `docs/evidence/GITHUB_HYGIENE_PHASE2_LS_REMOTE_BEFORE_2026-08-31.txt` | `de8efc6d3971cb2078753ddff18bd4ddfda4ded89c71801e66cf30c7519e1214` | 7262 |
| `docs/evidence/GITHUB_HYGIENE_PHASE2_LS_REMOTE_AFTER_2026-08-31.txt` | `663b8a8e12610521d2c60394eaca2bd8e8260ef79d7ec484889d80dd136fe783` | 5769 |
| `docs/evidence/GITHUB_HYGIENE_PHASE2_TAGS_BEFORE_2026-08-31.txt` | `9845a05a5c6db66291f27e71f4f9d6f96aae6406eb7bfcf034f536a39d554892` | 479 |
| `docs/evidence/GITHUB_HYGIENE_PHASE2_TAGS_AFTER_2026-08-31.txt` | `9845a05a5c6db66291f27e71f4f9d6f96aae6406eb7bfcf034f536a39d554892` | 479 |
| `docs/evidence/GITHUB_HYGIENE_PHASE2_OPEN_PRS_BEFORE_2026-08-31.json` | `8f932f645c747013ad7c3e33905a7bbddc71ff6e008801dfda815a1351943dcb` | 2167 |
| `docs/evidence/GITHUB_HYGIENE_PHASE2_OPEN_PRS_AFTER_2026-08-31.json` | `8f932f645c747013ad7c3e33905a7bbddc71ff6e008801dfda815a1351943dcb` | 2167 |

Tag files match the Phase-1 tag snapshot hash (`9845a05a…`). Open-PR before/after hashes are identical.

## 8. What this agent must not do next

- Ready / merge PR #308
- Close issue #266
- Start another cleanup slice
- Delete `REVIEW_UNMERGED` leftovers, tags, open PR heads, or the Phase-1 audit branch

**STOP for independent Technical-Lead Exact-Head review.**
