# Jetnity – GitHub Hygiene Phase 1 Live Evidence

Stand: 31. August 2026  
Status: **EVIDENCE PACK / READ-ONLY COLLECTION**  
Agent: **`Jetnity github hygiene audit 1`**  
Generation: **1**  
Cursor-Session: `bc-8293337d-f32b-41fd-a36d-edb90dc99d95`

Collected at (UTC): `2026-08-31T00:28:54Z`  
Repository: `Jetnity/jetnity`  
Baseline / live `origin/main`: `7f057e6ee8caddf87a3b5365731eaf43d037a114`

This file records what was queried and what the live answers were. Historical 28/30 August hygiene docs are context only. Live evidence wins.

## 1. Commands and APIs used

Read-only only. No `git push --delete`, no `gh pr close`, no ruleset PATCH/PUT, no tag delete.

| Source | Query | Result |
|---|---|---|
| Local git | `git rev-parse HEAD` after checkout of the assigned branch | start head `9cc05da98064e551837088dc4d7c4a379110411c` |
| Local git | `git rev-parse --is-shallow-repository` | `false` |
| Local git | `git fetch origin` then `git rev-parse origin/main` | `7f057e6ee8caddf87a3b5365731eaf43d037a114` |
| Local git | `git ls-remote --heads origin` | 79 heads; stored below |
| Local git | `git ls-remote --tags origin` | 3 annotated archive tags + peeled objects |
| Local git | `git merge-base --is-ancestor <tip> 7f057e6e` and `git rev-list --count 7f057e6e..<tip>` for every head | all 79 objects present locally; 13 delete-safe tips revalidated independently |
| GitHub API | `GET /repos/Jetnity/jetnity` | `default_branch=main` |
| GitHub API | `GET /repos/Jetnity/jetnity/branches` paginated | 79 records; `protected=true` only for `main`; SHAs identical to `ls-remote` |
| GitHub CLI | `gh pr list --state open --limit 500` | 8 open drafts |
| GitHub CLI | `gh pr list --state merged --limit 500` | 200 most recent merged PRs (name-match evidence only; not a classification input) |
| GitHub CLI | `gh pr list --state closed --limit 500` | 231 closed-state rows; 31 closed unmerged |
| GitHub API | `GET /repos/Jetnity/jetnity/rulesets` | one ruleset `21875372` |
| GitHub API | `GET /repos/Jetnity/jetnity/rulesets/21875372` | active; include `refs/heads/main` only; deletion + non-fast-forward + PR + required checks |
| GitHub API | `GET /repos/Jetnity/jetnity/rules/branches/main` | 4 rules |
| GitHub API | `GET /repos/Jetnity/jetnity/rules/branches/audit/github-hygiene-phase1-2026-08-31` | `[]` |
| GitHub API | `GET /repos/Jetnity/jetnity/branches/main/protection` | **403** Resource not accessible by integration |
| GitHub API | `GET /orgs/Jetnity/rulesets` | **404** Not Found |

Issue #266 was read in full before classification. Private repos `jetnity-travel` / `jetnity-bets` were not queried; the issue states the current GitHub-App access does not cover them.

## 2. Stored raw evidence

| Path | SHA-256 | Bytes |
|---|---|---:|
| `docs/evidence/GITHUB_HYGIENE_PHASE1_MANIFEST_2026-08-31.json` | `a6e65b46e7b955ad78aa08ef6ebd13701a82fe908e86e5b72d5727163e950c53` | 84695 |
| `docs/evidence/GITHUB_HYGIENE_PHASE1_LS_REMOTE_HEADS_2026-08-31.txt` | `b9a7c7f2d4584b598a0fed4005bdfb32d5ebea52e7315bc1352f44653ac73162` | 7054 |
| `docs/evidence/GITHUB_HYGIENE_PHASE1_API_BRANCHES_2026-08-31.json` | `d61500b1e8bc0bbf5e9ba3340bbed4990baa1e4b439ba6c4c6e4062de07339ee` | 9107 |
| `docs/evidence/GITHUB_HYGIENE_PHASE1_OPEN_PRS_2026-08-31.json` | `9707adf037f40f3205f8f6be7cdd5a9cee314df3761dd548a34a9cb107eb612f` | 3112 |
| `docs/evidence/GITHUB_HYGIENE_PHASE1_RULESET_21875372_2026-08-31.json` | `df9f0faed235d9c5ccd3650f16b829bd1f9fb69f6a56ccf68aed1bbc69af7706` | 1262 |
| `docs/evidence/GITHUB_HYGIENE_PHASE1_TAGS_2026-08-31.txt` | `9845a05a5c6db66291f27e71f4f9d6f96aae6406eb7bfcf034f536a39d554892` | 479 |

Cross-check: API branch names/SHAs and `ls-remote` names/SHAs are identical (0 API-only, 0 ls-remote-only, 0 SHA mismatches, 0 missing git objects).

## 3. Open pull requests at collection

| Number | Draft | Head | Head SHA |
|---:|---|---|---|
| 302 | true | `audit/tw8-tw9-readiness-2026-08-31` | `d051003023331578d90cf295a12de8767e0b33b7` |
| 301 | true | `audit/github-hygiene-phase1-2026-08-31` | `9cc05da98064e551837088dc4d7c4a379110411c` |
| 300 | true | `feat/entry-requirements-detail-contract-e1-2026-08-31` | `2bec7c2d3ae7967175d1a9828c6715a577376df0` |
| 52 | true | `docs/chatgpt-technical-lead-handoff-2026-08-24` | `f1e13db332ce087297dae60d4f1b3c21f321f9ec` |
| 50 | true | `cursor/s1-merged-status-f23f` | `f5a25c949f8bbfb889f87653ba1a08a02f75f6ea` |
| 40 | true | `audit/admin-platform` | `a316015733b86e2adbd050abb2f77258a99da366` |
| 39 | true | `audit/account-platform` | `65b08f4718ad74f3157c55a3efb960a4c843408a` |
| 28 | true | `feat/trip-collaboration-foundation` | `e0132cb576e8231296dc5b290e0afcef88ceb9f4` |

Every open-PR `headRefOid` matched the live branch tip SHA.

## 4. Delete-safe revalidation

After classification, all 13 `DELETE-SAFE_MERGED` tips were re-checked with a second `git merge-base --is-ancestor` and `git rev-list --count` plus `git branch -r --contains`. All 13: ancestor rc 0, rev-list 0, `origin/main` contains the tip.

Merged-PR name matches (last 200 merged PRs) are supporting evidence only. Classification does not depend on them. The one name without a merged-PR name hit, `feat/requirements-truth-ops-s4-r1-2026-08-31`, shares tip `595b4ad2…` with merged #296.

## 5. What was not done

- no remote branch delete
- no tag delete
- no force-push / ref move
- no PR close or Ready
- no ruleset or classic-protection write
- no fetch `--prune`
- no edit of `docs/ACTIVE_WORK_STATUS.md` or `JETNITY_START_HERE.md`
- no runtime / app / Supabase / Vercel / shared-contract file change
- no query or mutation of `jetnity-travel` or `jetnity-bets`

An environment-dirty `next-env.d.ts` was restored and is not part of this slice.

## 6. Residuals that a later agent must not over-read

- Classic branch-protection JSON is unread (403). The branches `protected` boolean and the active main ruleset are the usable protection evidence.
- Org-level rulesets are unread (404). No evidence of an org ruleset that would protect non-`main` refs was obtained; uncertainty here does not promote any ref to delete-safe.
- Merged-PR history is capped at the 200 most recent merged PRs. Missing name matches are not treated as “never merged”.
- Squash-merged historical branches remain `REVIEW_UNMERGED` unless their current tip is an ancestor of live `main`.
