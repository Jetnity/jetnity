# Jetnity V1 Support Runbook Reconciliation 1 — STATUS

Date: 23 October 2026
Status: **IMPLEMENTED ON THE BRANCH / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**
Writer: **Jetnity V1 Support Runbook Reconciliation 1 — Cursor Generation 1**
Issue: #971
Draft PR: #974
Branch: `docs/v1-support-runbook-reconciliation-1`

This file is point-in-time evidence. Agent self-review is not Technical-Lead PASS. A later commit invalidates this exact head.

## Integration V1 — current delivery record

Ordinary merge of fetched main `de169965f8318a46bdd350eb14df88b0682fc803` (tree `997d34c515b5108ec0de2f90fcf85998ba6bb755`) into this branch. Merge commit `5f18f3dcb4859c7b51252cfc1abd9980aa6d749b`, parents `36649eaee13c2299caed0a75291d39799a104d6c` and `de169965f8318a46bdd350eb14df88b0682fc803`, merge tree `40ec493436909020d4cc85d92df9e1805767a4b5`. No conflict. The runbook file is byte-identical to the reviewed head. Its internal source baseline stays `5269b9192a2300c6c03fc8659964583130d2d1d1` and is not a new Production test. TASK blob `989457863f58bde5264e8974459780b95a615ac3`.

The commit that adds this section is the integrated delivery head. The PR comment states that SHA after push. CI and Preview on `36649eae` do not gate it. `git diff --check origin/main...HEAD` reports only the two pre-existing Markdown trailing spaces on runbook lines 4–5. `originalModelName` remains `grok-4.7-high-fast`. Historical model sentences below are unchanged.

## Identity

| Item | Value |
| --- | --- |
| Requested model | Claude Opus 5.5 High |
| Observed model | `originalModelName=grok-4.7-high-fast` from `cursor-cloud` `run-info` |
| Model decision | The required model was not available on this session. No other model was selected by the writer. This is a limitation for the Technical Lead, not a claim that Opus ran. |
| Session | `bc-131cfc15-e947-42e6-be53-565205666604` — https://cursor.com/agents/bc-131cfc15-e947-42e6-be53-565205666604 |
| Session title | `rename-chat` returned “Jetnity V1 Support Runbook Reconciliation 1 — Cursor Generation 1”. The agents-list UI was not visually inspected. |

## Git, re-read before this evidence file

| Item | Value |
| --- | --- |
| `origin/main` | `5269b9192a2300c6c03fc8659964583130d2d1d1` |
| Merge-base with the runbook commit | same SHA |
| Ahead / behind that main | 2 ahead / 0 behind after the runbook commit; the evidence commit makes it 3 ahead if main is unchanged |
| Runbook commit | `8c201a70d507bb9f3e38879f85d05526f5f18031` |
| Runbook-commit tree | `429c4b0f7154dbfc0db0e4c28a2b0622f127c661` |
| Seed head | `054fce6dba06897ea7f4b7212e2cc6941c2ac965` (not the delivery head) |
| Immutable TASK blob | `989457863f58bde5264e8974459780b95a615ac3` unchanged |
| Operating mode | `NORMAL` |
| Final head | The commit that adds this STATUS, SELF_REVIEW and HANDOFF. The PR comment records `git rev-parse HEAD` after push. Do not treat `8c201a70` CI as the final-head CI. |

`next-env.d.ts` was dirty in the worktree and was not committed.

## What changed

`docs/V1_SUPPORT_PROCESS_RUNBOOK_2026-09-18.md` now separates implemented source, dated accepted evidence, and remaining limits for export, deletion, `/privacy` `/terms` `/impressum`, and Auth SMTP. Support mail still cannot export or delete an account. `#585` and `#626` stay open. `/datenschutz` still has no app page. Public contact remains `info@jetnity.ch`. Sender in the 27 September 2026 closure is `no-reply@jetnity.com`.

Claim-by-claim table: `docs/JETNITY_V1_SUPPORT_RUNBOOK_RECONCILIATION_1_HANDOFF_2026-10-23.md`.

## Coverage of affected sections

| Section | Result |
| --- | --- |
| 0 | Absence list no longer says export, deletion, legal pages and SMTP do not exist. §0.3 records the later implementations and their evidence class. |
| 1 | Legal routes, footer legal links, settings tools, and `/datenschutz` absence match current source. Dated live checks are labeled and not re-run. |
| 3 | Auth and data-rights rows point at the signed-in path and forbid email execution. |
| 7 | Data-rights triage matches §8.6. |
| 8 | §8.1 has the three mail layers. §8.2 no longer says account deletion does not exist. §8.6 states export and deletion limits. |
| 10 | Promising fulfillment stays with the Product Owner. Describing the signed-in path is Technical Lead, §8.6 only. |
| 11 / 11.1 | Self-service is allowed for the signed-in user. The reply template no longer says export and deletion are not built. |
| 12 | No conformity claim. Pages exist. Email fulfillment is not claimed. |
| 13 | Closure examples match the remaining gaps. |
| 14 | Gap rows replaced the obsolete “not built” rows. Launch is not closed by this edit. |
| 15 | Email execution, populated-erasure overclaim, and #626 rerun are STOP conditions. |

## Checks actually run

| Check | Result |
| --- | --- |
| Full read of the edited runbook | Done by this writer before the runbook commit |
| Path existence for named routes and docs | Pass. `/datenschutz`, `/support`, `/help`, `/kontakt` and `/faq` app pages are absent |
| Stale-phrase scan | Remaining hits are the explicit negations (“not `no-reply@jetnity.ch`”, “do not say … are not built”) |
| `npm test`, typecheck, lint, build | Not run. Not required for this prose change. Not a repository-wide runtime acceptance |
| Production mail, export, deletion, PrivacyBee, DB, Auth dashboard | Not performed |
| GitHub CI / Vercel Preview on the final head | Not yet observed at authoring. Seed-head Preview does not apply |

## Boundaries held

No DB, Auth, RLS, SMTP, provider, legal-text, mailbox, or runtime edit. No Ready, no merge, no follow-up slice.
