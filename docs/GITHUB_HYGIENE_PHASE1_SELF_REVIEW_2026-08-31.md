# Jetnity – GitHub Hygiene Phase 1 Adversarial Self-Review

Stand: 31. August 2026  
Autor-Agent: **`Jetnity github hygiene audit 1`**  
Generation: **1**  
Cursor-Session: `bc-8293337d-f32b-41fd-a36d-edb90dc99d95`  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

Issue: #266  
Task: `docs/GITHUB_HYGIENE_PHASE1_AUDIT_TASK_2026-08-31.md`  
Assigned start head: `9cc05da98064e551837088dc4d7c4a379110411c`

## 1. Auftrag gegen Diff

Intended write-set:

1. `docs/GITHUB_HYGIENE_PHASE1_AUDIT_2026-08-31.md`
2. `docs/GITHUB_HYGIENE_PHASE1_EVIDENCE_2026-08-31.md`
3. `docs/GITHUB_HYGIENE_PHASE1_SELF_REVIEW_2026-08-31.md`
4. `docs/GITHUB_HYGIENE_PHASE1_HANDOFF_2026-08-31.md`
5. `docs/evidence/GITHUB_HYGIENE_PHASE1_MANIFEST_2026-08-31.json`
6. `docs/evidence/GITHUB_HYGIENE_PHASE1_LS_REMOTE_HEADS_2026-08-31.txt`
7. `docs/evidence/GITHUB_HYGIENE_PHASE1_API_BRANCHES_2026-08-31.json`
8. `docs/evidence/GITHUB_HYGIENE_PHASE1_OPEN_PRS_2026-08-31.json`
9. `docs/evidence/GITHUB_HYGIENE_PHASE1_RULESET_21875372_2026-08-31.json`
10. `docs/evidence/GITHUB_HYGIENE_PHASE1_TAGS_2026-08-31.txt`

The pre-existing task `docs/GITHUB_HYGIENE_PHASE1_AUDIT_TASK_2026-08-31.md` is unchanged.

Hard non-scope observed:

- no branch / tag / ref delete or move;
- no PR close, Ready, or merge;
- no protection / ruleset write;
- no runtime, app, Supabase, Vercel, Auth, Traveller, Requirements, or shared-contract file;
- no edit of `docs/ACTIVE_WORK_STATUS.md` or `JETNITY_START_HERE.md`;
- no Phase 2 delete runner;
- no files from the Entry-Requirements-E1 or TW-Readiness streams.

An environment-dirty `next-env.d.ts` was restored and not committed.

The Cursor UI title was not renamed. No programmable rename tool was available. The binding display name used in repository/PR evidence is **`Jetnity github hygiene audit 1`**.

## 2. Adversarial questions

| Question | Answer |
|---|---|
| Was `main` classified delete-safe? | No. `KEEP_MAIN`, protected, ruleset-included. |
| Was any open PR head classified delete-safe? | No. All 8 open heads are `KEEP_OPEN_PR`, including this audit branch, E1, and TW-8/TW-9. |
| Was a stale open draft treated as already merged? | No. #28 / #39 / #40 / #50 / #52 stay `KEEP_OPEN_PR` even though they look abandoned. |
| Was uncertainty promoted to delete-safe? | No. Unknown ancestry, protection-unread residuals, tip-equals-`main`, and any non-ancestor tip are `REVIEW_UNMERGED`. |
| Was the 30 August remaining set copied as today’s truth? | No. Live `ls-remote` + API + ancestry were collected. The old set is only a drift comparison: all 62 names still exist; 17 new names appeared. |
| Could squash-merged historical work be deleted because “the content is probably on main”? | No. Ancestor of live `main` is required. Those refs stay `REVIEW_UNMERGED`. |
| Could a brand-new empty branch at the current `main` tip be deleted? | Extra hold: tip-equals-current-`main` is `REVIEW_UNMERGED`. None existed at collection. |
| Did API and `ls-remote` disagree? | No. 79/79 names and SHAs match. All tip objects exist locally. |
| Was a missing git object treated as delete-safe? | No missing objects. The contract would have been `REVIEW_UNMERGED`. |
| Was `feat/requirements-truth-ops-s4-r1-2026-08-31` delete-safe only because #293 exists? | No. #293 is closed unmerged. The tip `595b4ad2…` is an ancestor of `main` and equals the merged #296 head. |
| Was this audit branch kept? | Yes. Open PR #301 → `KEEP_OPEN_PR`. |
| Did the agent start Phase 2 because 13 refs look obvious? | No. STOP after deliverables. |
| Did the agent close stale PRs “to make deletion easier”? | No. |
| Did the agent edit global continuity files because persistence policy asked for a live handoff? | No. Slice persistence is in the four hygiene docs plus evidence. |
| Did the agent touch E1 or TW files? | No. |
| Did the agent claim org rulesets are absent? | No. 404 is recorded as unread, not as “none exist”. |
| Did the agent treat classic-protection 403 as “unprotected repo”? | No. `main` is protected via the branches flag and the active ruleset. |
| Could `do-not-use` / `tmp-noop` be deleted by name? | No. Both are `REVIEW_UNMERGED` (tip not ancestor). Name is only a note. |
| Are tags in the delete list? | No. Three archive tags were listed as out of scope. |
| Did the author dump scratch notes into the audit file? | Caught during authoring. The audit file was regenerated from the classified table so the 79-row manifest matches the JSON. |

## 3. False-positive deletion risks

| Target | Why a naive Phase 2 delete would be wrong |
|---|---|
| `main` | Default branch + active deletion-blocking ruleset |
| Any open PR head | Destroys an in-flight review surface. After sync there are 6, including this audit. E1/TW heads are no longer open and are only delete-safe because their tips are ancestors of current `main`. |
| Any `REVIEW_UNMERGED` tip | Unique commits not in `main`; possible squash-merge leftovers or unfinished work |
| `docs/entry-requirements-target-architecture-2026-08-31` | New, 3 commits not in `main` |
| `docs/post-cleanup-final-handoff-2026-08-30` | 4 commits not in `main` even though a sibling checkpoint branch is delete-safe |
| A future empty branch created at current `main` after this collection | Would require a new live inventory; this manifest would be stale |
| Tags `archive/*` | Recovery/archive contract; hard non-scope |
| `jetnity-travel` / `jetnity-bets` refs | Different repositories; not in this App scope |

## 4. False-negative / under-call risks

| Risk | Residual |
|---|---|
| An additional open PR was created after collection | Phase 2 must re-query open PRs. This collection is timestamped. |
| A ruleset or classic protection was added to a non-`main` branch after collection | Phase 2 must re-check protection. |
| Org ruleset protects more than `main` and this integration cannot see it | No non-`main` branch was classified delete-safe on protection-unknown grounds; delete-safe refs are still subject to Phase 2 re-check. If an invisible org rule blocked a delete, that is a STOP, not a reason to force it. |
| Merged-PR name match missed an older squash | Irrelevant: squash tips that are not ancestors stay `REVIEW_UNMERGED`. |
| `gh pr list --state merged` capped at 200 | Used only as supporting evidence for the 13 delete-safe names. |
| This PR’s own tip will move after the audit commit | Expected. The row for `audit/github-hygiene-phase1-2026-08-31` records the collection tip and remains `KEEP_OPEN_PR`. |

## 5. Author verdict (first collection)

First-collection PASS on `ef0c50a9…` is historical after `main` moved.

## 6. Sync-only adversarial check

| Question | Answer |
|---|---|
| Was history rewritten / force-pushed? | No. `git merge --no-ff origin/main@26b44e8f`. |
| Were classifications rewritten from memory? | No. Full live re-inventory. Only two dispositions changed, both from vanished open PRs + proven ancestry. |
| Was `mergedAt=null` on #300/#302 treated as “not merged, keep REVIEW_UNMERGED”? | No. They are not open, and the tips are ancestors of live `main`. That is the delete-safe contract. The closed-without-mergedAt GitHub state is documented, not used as a veto. |
| Were #300/#302 closed by this agent? | No. They were already absent from the live open list before any write. |
| Did the agent promote other REVIEW_UNMERGED rows because “E1 probably included them”? | No. `docs/entry-requirements-target-architecture-2026-08-31` stays `REVIEW_UNMERGED`. |
| Did the previous 13 delete-safe SHAs change? | No. Still ancestors of the new `main`. |
| Was Phase 2 started because two more refs became obvious? | No. |
| Were ACTIVE_WORK_STATUS / START_HERE / runtime files edited by this agent? | No. The merge brought already-merged main files into this branch; no additional runtime edit. |

**CHANGES REQUIRED through the author:** none for this sync.

**Unabhängiger Technical-Lead-Review:** previous PASS invalidated by `main` movement and by this new head. Fresh Exact-Head re-gate required.

Ready, merge, and Phase 2 deletion are forbidden for this agent.
