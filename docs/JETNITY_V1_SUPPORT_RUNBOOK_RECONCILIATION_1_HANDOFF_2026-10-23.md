# Jetnity V1 Support Runbook Reconciliation 1 — handoff

Date: 23 October 2026
Writer: **Jetnity V1 Support Runbook Reconciliation 1 — Cursor Generation 1**
Issue: #971
Draft PR: #974
Branch: `docs/v1-support-runbook-reconciliation-1`
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW. NOT READY. NOT MERGED. NO FOLLOW-UP.**

Self-review in `docs/JETNITY_V1_SUPPORT_RUNBOOK_RECONCILIATION_1_SELF_REVIEW_2026-10-23.md` is not Technical-Lead PASS.

## Exact git, re-read before this handoff

Fresh `git fetch origin main` before the runbook commit, repeated as the parent of this evidence:

| Item | Value |
| --- | --- |
| Protected main / base | `5269b9192a2300c6c03fc8659964583130d2d1d1` |
| Main tree at that read | `961641af883a23126e4479849a78b0a27f042c1e` |
| Merge-base | `5269b9192a2300c6c03fc8659964583130d2d1d1` |
| Runbook + plan commit | `8c201a70d507bb9f3e38879f85d05526f5f18031` |
| Tree of that commit | `429c4b0f7154dbfc0db0e4c28a2b0622f127c661` |
| Seed head | `054fce6dba06897ea7f4b7212e2cc6941c2ac965` / tree `44e1453bd28277a905ca5540639a7172bb31069c` |
| Ahead / behind at the runbook commit | 2 ahead / 0 behind |
| Immutable TASK | `docs/JETNITY_V1_SUPPORT_RUNBOOK_RECONCILIATION_1_TASK_2026-10-23.md` blob `989457863f58bde5264e8974459780b95a615ac3` |
| Mode | `NORMAL` (`.jetnity/operating-mode.json`) |
| Final head | Commit that adds STATUS, SELF_REVIEW and this HANDOFF. PR comment states `git rev-parse HEAD` after push. That head is the CI/Preview binding. `8c201a70` and the seed Preview are not automatically that gate. |

If `origin/main` moves before review, do not silent-rebase. Technical Lead integration order remains #972, then #973, then #974.

## Session and model

- Session `bc-131cfc15-e947-42e6-be53-565205666604`: https://cursor.com/agents/bc-131cfc15-e947-42e6-be53-565205666604
- `rename-chat` returned the logical title. Visual UI rename was not inspected.
- Requested: Claude Opus 5.5 High.
- Observed: `grok-4.7-high-fast`. No silent substitute was chosen. **P2 model limitation for the Technical Lead.**

## Files changed

- `docs/V1_SUPPORT_PROCESS_RUNBOOK_2026-09-18.md`
- `docs/JETNITY_V1_SUPPORT_RUNBOOK_RECONCILIATION_1_PLAN_2026-10-23.md`
- `docs/JETNITY_V1_SUPPORT_RUNBOOK_RECONCILIATION_1_STATUS_2026-10-23.md`
- `docs/JETNITY_V1_SUPPORT_RUNBOOK_RECONCILIATION_1_SELF_REVIEW_2026-10-23.md`
- `docs/JETNITY_V1_SUPPORT_RUNBOOK_RECONCILIATION_1_HANDOFF_2026-10-23.md`

TASK unchanged. No runtime file. `next-env.d.ts` left unstaged.

## Material claims

| Old current-state claim | Corrected truth | Evidence | Still limited |
| --- | --- | --- | --- |
| No consumer export | Signed-in `GET /api/account/export` downloads JSON for 13 owner-scoped tables | `app/account/settings/page.tsx`, `app/api/account/export/route.ts`, `lib/account/datenexport.ts`; merged PR #476 | Not a legal DSAR. No service role. 20,000-row fail, `maxDuration` 10s, no cross-instance rate limit, no Storage archive. Support must not download it from email. Not executed here. |
| No account deletion | Signed-in deletion UI with `KONTO LÖSCHEN`, fresh password, conditional TOTP, environment guard | `components/account/KontoLoeschen.tsx`, `lib/account/kontoloeschung-vertrag.ts`, `lib/account/kontoloeschung-ausfuehrung.ts` | OAuth-only rejected. Not atomic. Support must not execute it. |
| Deletion unproven in Production | 28 September 2026 Production UI deletion of one empty disposable account, redirect `/konto-geloescht` | `docs/PRODUCTION_ACCOUNT_ERASURE_POST_MERGE_CLOSURE_2026-09-28.md`, PR #597 | No trip/traveller/visit/security/storage rows and no verified MFA on that account. #626 stays blocked. Not repeated. |
| No `/privacy`, `/terms`, `/impressum`; those routes 404 | All three app pages exist. Footer and register link them | `app/(public)/privacy/page.tsx`, `impressum/page.tsx`, `terms/page.tsx`; inventory test | `/datenschutz` has no page. Not comprehensive compliance. #585 open. PrivacyBee text not rewritten. Dated 27–28 September 2026 live checks not re-run. |
| No own SMTP; finding 3.8 is the current mail story | #581 closed with custom SMTP still off. #582 later accepted `no-reply@jetnity.com` via Infomaniak port 587, reset and signup delivery, and the post-#583 iPhone callback | Issue comments 5855533718 and 5858252535; `docs/AUTH.md` | Not a fresh test. Commented `supabase/config.toml` SMTP example is not Production. `info@jetnity.ch` monitoring unknown. Do not send users to no-reply. |
| Reply template: export/deletion are not built | Template describes `/account/settings` and says support will not run the flow | Runbook §11.1 and §12 | Still must not confirm account existence. |
| Next step was to build export, deletion, SMTP, legal routes | Those builds are not the next step. Remaining work is the open limits above | Runbook §14 and §15 | This handoff starts none of it. |

## Commands and results

- `git fetch origin main` — main unchanged at `5269b9192a2300c6c03fc8659964583130d2d1d1`.
- Path check — named repository files exist; `/datenschutz` and support/help/kontakt/faq pages do not.
- Stale-phrase scan — only the intentional negations remain.
- Full runbook read — done before `8c201a70`.
- `npm test` / typecheck / lint / build — not run. Prose-only. Not claimed as runtime acceptance.
- CI / Preview on the final head — not observed yet. Record the actual run after push. Failed, skipped and missing stay missing.
- No Production or Development DB, Auth, export, deletion, SMTP, PrivacyBee, mailbox, or browser test.

## Risks and gates

- P0: none new.
- P1: unchanged and out of scope — #748 personal-browser privacy incident; #968 legacy Preview credential risk. No cleanup restart.
- P2: model is not the requested Opus 5.5 High.
- P3: final-head CI/Preview not yet bound; today’s mail and live legal pages not rechecked.
- Still open and not waived: #917, #944, #936, #937 paused, #911, #913, #626, #968, #748, #585. #955 complete. #957 dormant.
- Excluded: Production/Development DB, Supabase Auth/Admin/RLS, secrets, real accounts, Owner browser, government/source/provider/LLM/paid calls, contracts, feature flags, dependencies, workflows, deployment aliases.

## Next actor

Technical Lead, independent exact-head review of the pushed final head. Integration priority is visit precision, then lodging preview, then this runbook. Cursor does not Ready, merge, or open the next slice. An immediate CHANGES REQUIRED fix stays with this writer and this session.
