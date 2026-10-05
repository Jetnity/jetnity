# Jetnity – GitHub Hygiene Phase 2 Adversarial Self-Review

Stand: 31. August 2026  
Autor-Agent: **`Jetnity github hygiene delete safe 1`**  
Generation: **1**  
Cursor-Session: `bc-59e32b76-6b49-41e6-8631-de29904ea404`  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

Issue: #266  
Task: `docs/GITHUB_HYGIENE_PHASE2_DELETE_SAFE_TASK_2026-08-31.md`  
Assigned start head: `7459132b462f87a1fb19ad8c0dd7718721fefafc`

## 1. Auftrag gegen Diff

Intended write-set after the remote deletes:

1. `docs/GITHUB_HYGIENE_PHASE2_STATUS_2026-08-31.md`
2. `docs/GITHUB_HYGIENE_PHASE2_HANDOFF_2026-08-31.md`
3. `docs/GITHUB_HYGIENE_PHASE2_SELF_REVIEW_2026-08-31.md`
4. `docs/evidence/GITHUB_HYGIENE_PHASE2_DELETE_LOG_2026-08-31.json`
5. `docs/evidence/GITHUB_HYGIENE_PHASE2_LS_REMOTE_BEFORE_2026-08-31.txt`
6. `docs/evidence/GITHUB_HYGIENE_PHASE2_LS_REMOTE_AFTER_2026-08-31.txt`
7. `docs/evidence/GITHUB_HYGIENE_PHASE2_TAGS_BEFORE_2026-08-31.txt`
8. `docs/evidence/GITHUB_HYGIENE_PHASE2_TAGS_AFTER_2026-08-31.txt`
9. `docs/evidence/GITHUB_HYGIENE_PHASE2_OPEN_PRS_BEFORE_2026-08-31.json`
10. `docs/evidence/GITHUB_HYGIENE_PHASE2_OPEN_PRS_AFTER_2026-08-31.json`

The pre-existing task `docs/GITHUB_HYGIENE_PHASE2_DELETE_SAFE_TASK_2026-08-31.md` is unchanged.

Allowed remote mutations: delete of the 15 exact manifest refs only.

Hard non-scope observed:

- `main` not deleted or moved;
- no tag delete or move;
- no PR close, Ready, or merge;
- no protection / ruleset write;
- no `REVIEW_UNMERGED` delete;
- Phase-1 audit branch and this Phase-2 branch not deleted;
- no Runtime, App, Supabase, Vercel, Auth, Traveller, Requirements, or Provider file;
- no edit of `docs/ACTIVE_WORK_STATUS.md` or `JETNITY_START_HERE.md`;
- candidate list not widened;
- Issue #266 not closed.

The Cursor UI title was not renamed. No programmable rename tool was available. The binding display name used in repository/PR evidence is **`Jetnity github hygiene delete safe 1`**.

## 2. Adversarial questions

| Question | Answer |
|---|---|
| Was any name outside the exact 15 deleted? | No. `heads_vanished` equals the 15 manifest names. Extra-delete list is empty. |
| Was the list widened because E2 or other leftovers looked delete-safe? | No. #307 / E2 and all 57 `REVIEW_UNMERGED` leftovers stayed. |
| Was `main` deleted or moved? | No. Start and end `a57a15a6c8011ea81af1a228a2fd0c3e6e0853b9`. |
| Was a tip deleted after SHA drift? | No. Every observed `ls-remote` tip matched the manifest SHA immediately before delete. |
| Was an open PR head deleted? | No. Live open-PR list was re-queried per candidate. None of the 15 were heads. |
| Were #28 / #39 / #40 / #50 / #52 closed to make deletion easier? | No. All five remain open. #307 and #308 remain open. |
| Was the Phase-1 audit branch deleted because Phase 1 is merged? | No. Explicit non-scope; still present. |
| Was this Phase-2 branch deleted? | No. |
| Was ancestry checked against stale `main@26b44e8f` instead of live `a57a15a6`? | No. Each candidate fetched `origin/main` live. All 15 were ancestors of `a57a15a6` with `rev-list` 0. |
| Was `rev-list == 0` skipped because Phase 1 already said so? | No. Recomputed immediately before each delete. |
| Was classic-protection 403 treated as “unprotected repo”? | No. Combined with `branches.protected=false`, empty `rules/branches`, and ruleset include `refs/heads/main` only. A non-403 classic response would have been `SKIPPED_DRIFT`. |
| Were unread org rulesets treated as “none exist”? | No. 404 recorded as unread, same as Phase 1. Deletes were not forced past a protection rejection. |
| Did API/git disagree on a tip? | No. `ls-remote` and branch API SHA matched the expected SHA on every PASS. |
| Was a missing git object deleted? | No. All 15 objects existed locally as commits. |
| Did a failed delete get retried with force? | No. All 15 `git push --delete` exited 0. No `--force`. |
| Were tags used as delete targets? | No. Before/after tag snapshots are byte-identical (`9845a05a…`). |
| Did the agent Ready or merge #308? | No. STOP after evidence. |
| Did the agent close #266? | No. |
| Did persistence policy cause an `ACTIVE_WORK_STATUS` edit? | No. Slice persistence is this handoff plus status/self-review/evidence. |

## 3. False-positive deletion risks that were refused

| Target | Why it was not deleted |
|---|---|
| `main` | Default branch + active deletion-blocking ruleset |
| `ops/github-hygiene-phase2-delete-safe-2026-08-31` | This slice’s own branch / PR #308 |
| `audit/github-hygiene-phase1-2026-08-31` | Explicit non-scope even though Phase 1 is merged |
| `feat/entry-requirements-official-actions-e2-2026-08-31` | New after Phase 1; open PR #307 |
| Any of the 57 `REVIEW_UNMERGED` leftovers | Tips not fully in `main` |
| Historical drafts #28 / #39 / #40 / #50 / #52 | Open PR heads |
| Archive tags | Hard non-scope |

## 4. Residual risks

| Risk | Residual |
|---|---|
| Invisible org ruleset the integration cannot read | Deletes were not blocked. Recorded as unread. If a later audit finds an org rule that should have prevented a delete, restore from the documented SHA. |
| A ruleset or protection was added in the seconds between revalidation and `git push --delete` | Unobserved. Every delete succeeded and post-checks found the ref gone without `main`/tag/PR side effects. |
| Independent workstream created a new delete-safe leftover during the slice | Not deleted. `heads_appeared` is empty. Future leftovers need a new audit. |
| Restore requires a later push of a documented SHA | Intended. History remains in `main`. |
| Author self-review is not an independent TL PASS | Correct. Exact-Head review is still required. |

## 5. Author verdict

This agent considers the bounded Phase-2 delete contract fulfilled: 15/15 exact refs deleted after live revalidation, no other mutation, evidence complete.

**CHANGES REQUIRED through the author:** none.

**Unabhängiger Technical-Lead-Review:** required on the Exact Head of Draft-PR #308. This self-review is not that PASS.

Ready, merge, and closing #266 are forbidden for this agent.
