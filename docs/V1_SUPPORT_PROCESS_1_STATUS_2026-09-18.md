# Jetnity – V1 Support Process 1 STATUS

Stand: 18. September 2026  
Status: **TL P1 APPLIED ON `7fadcf00` / THIS EVIDENCE COMMIT INVALIDATES THAT EXACT-HEAD / AUTH-CONFIG JOB FAILED ON THAT SHA / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #467  
Draft PR: #470  
Branch: `docs/v1-support-process-1`  
Binding task: `docs/V1_SUPPORT_PROCESS_1_TASK_2026-09-18.md`  
Canonical runbook: `docs/V1_SUPPORT_PROCESS_RUNBOOK_2026-09-18.md`  
Source audit: #438 / merged PR #449 / finding 4.1 process half  
Canonical base: `main@c3cde9ad1e2daa2ed0a3912ed6a55de803476385`  
Dispatch head: `64d4f2919810caee1f050452e81cb388b8b50938`  
Implementation head: `322f59d66e3ce3edbc7fb9d477a4a63b32743326`  
Previous evidence / TL review head: `a5582d97ae8395d70be6d842c59aa16553624f9e`  
P1-correction head: `7fadcf00bd1389ed85ae589e695d76cb1452eeac`  
TL CHANGES REQUIRED: comment `5728414707` on `a5582d97`  
Continue-same-session: comment `5728417250`

Cursor-Agent: **Jetnity V1 support process 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast** — confirmed on this run (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-869f7450-37b5-4945-8094-48705a3f6543`

This file is point-in-time evidence. Every new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS.

---

## 1. Goal

Close the process half of finding 4.1, plus TL P1: ordinary email must not become an account-existence oracle.

## 2. Implemented

P1 correction on `7fadcf00`:

- §11 `/admin/users` is internal AAL2 + `konten-verwalten` triage only, not a disclosure source;
- new §11.1 forbids confirm/deny of account existence or status from ordinary email;
- no approved secure support identity-verification channel exists, so default is non-disclosure;
- data-rights identity remains Product Owner + Legal;
- government ID / passport / OTP / password must not be requested to “verify”;
- the previous “we see an account with that email” path is gone.

No runtime, mailbox, Auth, database or cost change.

## 3. Traveller-context check

Unchanged. Identity-proofing by passport/ID is forbidden.

## 4. Hard exclusions held

Reserved parallel-slice files and global continuity were not touched. `#472` (Admin Revenue Truth) was **not** merged/rebased into this branch. Changed files versus merge-base remain the five allowed docs.

## 5. Historical gates (invalidated as current exact-head)

| Head | Local | GitHub CI | Vercel |
| --- | --- | --- | --- |
| `64d4f291` | n/a | n/a | `EmnpAZ8AXdGZxVeF4PrsfyERPqFx` READY |
| `322f59d6` | PASS | [35328321604](https://github.com/Jetnity/jetnity/actions/runs/35328321604) SUCCESS | `84V4jDWydNrVEGMM6xYQomh7upq8` READY |
| `a5582d97` | not re-run | [35328642792](https://github.com/Jetnity/jetnity/actions/runs/35328642792) SUCCESS | no new GitHub deployment observed |

## 6. Gates on P1-correction head `7fadcf00` (invalidated as current by this persist)

| | |
| --- | --- |
| SHA | `7fadcf00bd1389ed85ae589e695d76cb1452eeac` |
| GitHub CI | [35332670670](https://github.com/Jetnity/jetnity/actions/runs/35332670670) **FAILURE** (`pull_request`) |
| Typecheck, Lint & Build | SUCCESS (`105560320430`) |
| Auth-Konfiguration gegen config.toml | **FAILURE** (`105560320791`) — `SUPABASE_PROJECT_REF ist weder Projekt (404) noch Branch (504). Ref oder Token prüfen.` Secrets were present (not skipped). This docs-only P1 did not change Auth config. Same job **SUCCESS** on `a5582d97`. Agent cannot re-run GitHub jobs (read-only `gh`). |
| Vercel | GitHub commit status **success** — `8VmbRDHD65iZzTufmJN4vvgx5EFi` READY |
| Inspector | https://vercel.com/jetnity-e1b93c82/jetnity-app/8VmbRDHD65iZzTufmJN4vvgx5EFi |
| Preview | https://jetnity-app-git-docs-v1-support-process-1-jetnity-e1b93c82.vercel.app |
| Vercel threads | 0 unresolved / 0 total |

No local re-run of the full verify-job on this docs-only P1. No Supabase/mailbox/Production mutation.

## 7. `origin/main` drift (re-fetched 18 September 2026, at `7fadcf00`)

| | |
| --- | --- |
| Canonical task base | `c3cde9ad1e2daa2ed0a3912ed6a55de803476385` |
| Live `origin/main` | `b051b2c2c08572b8948d24deb013d930d77ec503` |
| Merge-base | `c3cde9ad1e2daa2ed0a3912ed6a55de803476385` |
| Ahead at `7fadcf00` | 4 |
| Behind | **4** — merged `#472` Admin Revenue Truth (`f965016e`…`b051b2c2`). Not integrated here. |

PR mergeable_state at `7fadcf00`: **behind**. Re-count after this persist.

## 8. Threads

- Binding dispatch `5727821326`.
- TL CHANGES REQUIRED `5728414707` — applied on `7fadcf00`.
- Continue-same-session `5728417250`.
- Vercel bot `5727821273` updated for `8VmbRDHD65iZzTufmJN4vvgx5EFi` READY; live-feedback 0/0.
- No GitHub review-line threads.

## 9. Next step

1. Commit/push this evidence persist.
2. Re-fetch CI/Vercel on the new HEAD.
3. Technical Lead: P1 text review; decide whether to re-run Auth-Konfiguration on `7fadcf00` or treat the 404/504 as infra; do **not** ask this agent to merge `#472`.
4. **STOP FOR TECHNICAL-LEAD REVIEW.** No Ready. No merge. No follow-up slice.
