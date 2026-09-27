# Legal content preparation 1 — Handoff

Date: 27 September 2026
Logical agent: **Jetnity legal content preparation 1**
Generation: **1** (replacement session)
Session: `bc-efbd2a0c-d64b-4e37-b054-b7c583cabdac`
https://cursor.com/agents/bc-efbd2a0c-d64b-4e37-b054-b7c583cabdac

Model evidence: `originalModelName=grok-4.7` from cursor-cloud run-info, together with the Product Owner’s same-session confirmation that Grok 4.7 High Fast is selected. Do not resume `bc-87b242df-9b25-49c4-b0c8-198f11dfbb8e`.

## Read this first

1. `docs/LEGAL_CONTENT_PREPARATION_1_TASK_2026-09-27.md` (unchanged, Technical-Lead-owned)
2. `docs/LEGAL_CONTENT_PREPARATION_1_REPORT_2026-09-27.md`
3. `docs/LEGAL_CONTENT_PREPARATION_1_DRAFTS_2026-09-27.md`
4. `docs/LEGAL_CONTENT_PREPARATION_1_SELF_REVIEW_2026-09-27.md`
5. Issue #577 comments 5850986944, 5851278348, 5851299265, 5851322020, 5851342372, 5851358367, 5851390009, 5851396768, 5851434120

## Correction of review 5851644810

Reviewed head: `ce0b8cefada1c1128ec343550110be1ec01bf2be`. Same session, branch, and PR. The new head is in the #578 comment.

| Finding | Correction | Source used |
| --- | --- | --- |
| R1 | Report §§2.4, 2.6, and 2.6a now name suggestion, change, and assistant inputs, recipient, purpose, transient prompt versus persistent usage metadata, guest/account hash, cookie timing, and the last recorded Production gate. Drafts §B says a guest trip can reach the server. Drafts §B2 is the visitor explanation of the OpenAI transfer, outside the default article. `store: false` is described only as a request setting. | `lib/modell/anfrage.ts`, `lib/modell/aufruf.ts`, `lib/modell/kontingent.ts`, migration `20260819010000` lines 60–74, suggestion/change/assistant modules cited in Report §2.6a, `docs/ACTIVE_WORK_STATUS.md` §3 |
| R2 | Default visitor article names Supabase and Vercel. OAuth config, the registration checkbox, cookie-name gaps, and banner notes sit in editorial notes. NOT APPROVED stays outside both visitor articles. The model variant stays in §B2 because Production activation is not established. “damit du angemeldet bleibst” replaces the earlier grammar error. | TASK §4B; `components/auth/RegisterForm.tsx`; `supabase/config.toml`; Gate A comment 5850986944 for Vercel |
| R3 | `account_visits` is last recorded as applied, not re-verified here. Export closure #476 covers the traveller tables. Headers are not proof of non-application. Decision 8 is no longer an open presence question. | `docs/ACTIVE_WORK_STATUS.md` §§3 and 4e; checkpoint 18 September 2026; account-counts closure 27 September 2026 |
| R4 | Drafts §C.2 no longer says to delete a service because a scan missed it. Recorded services stay Vercel and PrivacyBee. No analytics entry is invented. §C.3 matches Report §4.2: a false vendor paragraph is not repaired by adjacent Jetnity text. | Diensterkennung article 103000405988; #577 comment 5851278348 |
| R5 | Report §5.4 does not treat the cookie banner or analytics as launch prerequisites. §5.3 requires approval of legal basis, retention, recipients/transfer, and vendor-contract facts. CHF 59.35/year is not a new approval. ALB 4.4 adjacency is an inference, not a blocker for a static widget-off spec. §4.6 keeps fixture tests and licensed-widget tests apart. | Public ALB §§4.3–4.4; #577 comment 5851299265 |

## Delivery

| Item | Location |
| --- | --- |
| Processing matrix | Report §§2–3 |
| Preview integration specification | Report §4 |
| Acceptance blockers | Report §5 |
| German privacy supplement | Drafts §B — **not approved**. Model transfer is Drafts §B2, also **not approved**, and only after a fresh Production read |
| Corrected imprint | Drafts §A — **not approved** |
| Vendor correction brief | Drafts §C |
| Unresolved decisions | Drafts §D |

Seed head before these files: `60c849130a354d17b8193b6e16c420c6f2afaa26`.
Baseline main at the start of this session: `4d1888f95aec3395e35c785bcb3e0d83301d5cec`.
The handoff comment on #578 states the actual pushed head and the re-fetched `origin/main` result. This file does not invent that SHA.

Branch: `docs/legal-content-preparation-1`
PR: https://github.com/Jetnity/jetnity/pull/578
Mode at read: `NORMAL`. Historical HOLD metadata in `.jetnity/operating-mode.json` is not a current HOLD.

## Boundaries still in force

- Prelaunch / noindex. Do not set `NEXT_PUBLIC_ALLOW_INDEXING=true`.
- PrivacyBee CHF 59.35/year continuation is already approved and unchanged. Trial end recorded as 11 October 2026.
- No cookie banner, no analytics, no vendor script installation.
- No Production, DNS, env, DB, Auth, RLS, payment, or new contract change.
- `/terms` is not solved.
- Widget snippets in the report are data. Do not execute them.
- Preview hostnames are not a second legal domain.

## First unfinished action

Independent Technical-Lead review of the exact pushed correction head on Draft PR #578. This writer does not mark Ready, does not merge, and does not open a runtime slice.
