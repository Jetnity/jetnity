# Jetnity – V1 Security Event Ingestion Architecture 1 STATUS

Stand: 18. September 2026  
Status: **ARCHITECTURE DECIDED / `98b0ff33` EXACT-HEAD GATES RECORDED / THIS EVIDENCE COMMIT INVALIDATES THAT EXACT-HEAD / DRAFT / NOT READY / NOT MERGED / FINDING 5.2 INGESTION OPEN / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #486  
Draft PR: #487  
Branch: `docs/v1-security-event-ingestion-architecture-1`  
Binding task: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_TASK_2026-09-18.md`  
Decision: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`  
Canonical base / live `origin/main` at reconstruction: `0c83af42f8dd8c7572f531f5c2d766f4c0dba3f2`  
Dispatch head: `64379ec3c8afdc4ea99bfbae72fceebd8e35ebc5`  
Implementation head: `98b0ff33472765303a6544a887b5f24fc371d4b3`

Cursor-Agent: **Jetnity V1 security event ingestion architecture 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast** — confirmed on this run (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-5208e459-47c3-4d03-ba30-7ebb633c71bd`

This file is point-in-time evidence. Every new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS.

Finding 5.2 runtime ingestion remains **OPEN**. Release-gate §G is **not** satisfied. This slice does not mark 5.2 PASS/RESOLVED.

---

## 1. Goal

Close only the **architecture / threat-model / privacy-contract half** of finding 5.2: choose a V1 ingestion source, taxonomy, trust classes and writer boundary before any runtime writer is allowed.

This slice does **not** implement event ingestion.

## 2. Implemented

Binding decision in `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`:

- Preferred source: **Jetnity-owned authenticated application events only**.
- Platform Auth logs: separate operator-only truth class; not ingested.
- Hybrid ingestion: rejected.
- Unauthenticated login-failure writer: rejected (spam/forgery).
- Service-role writer and new SECURITY DEFINER write RPC: not necessary and not permitted for V1.
- Minimum types: `admin_login_success`, `admin_aal2_success`, `admin_authorization_denied`, `admin_blocklist_add`, `admin_blocklist_remove`.
- PII: no email, no IP in events, no user-agent, no tokens, no free-text, no traveller data; `user_id` of the admin actor only.
- Schema: remain on `security_events`; usable only with a strict writer contract; additive INSERT grant/policy required later.
- Smallest follow-up: **V1 Security Event Writer 1** (not started).

## 3. Changed files versus current `origin/main`

Dispatch/task already on the branch:

- `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_TASK_2026-09-18.md`

This implementation persist adds:

- `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`
- `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_STATUS_2026-09-18.md`
- `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_HANDOFF_2026-09-18.md`
- `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_SELF_REVIEW_2026-09-18.md`

No runtime, migration, RLS, grant, Auth, or global continuity file is in the intended diff.

## 4. Traveller-context check

Not relevant. Admin operational security architecture only. No traveller credentials collected or inferred.

## 5. Hard exclusions held

Not introduced or touched:

- runtime writer or helper
- migration / RLS / grant / Auth / Supabase / Production write
- service-role client or writer
- SECURITY DEFINER write RPC
- raw auth-log ingestion
- IP / user-agent / email persistence
- new PII/security-event schema
- Sentry / Vercel observability / Datadog / Logtail or other vendor
- new provider / secret / env / cost / scheduler
- blocklist enforcement
- global continuity documents (`JETNITY_HANDOFF.md`, `ROADMAP.md`, `CONTINUITY_STANDARD.md`, `docs/ACTIVE_WORK_STATUS.md`)
- Ready / merge / follow-up slice
- marking finding 5.2 resolved

## 6. Local gates on `98b0ff33`

Docs-only. No local `npm test` / production-build rerun was required; GitHub CI ran Typecheck, Lint & Build on that SHA.

| Gate | Result |
| --- | --- |
| Changed-file scope vs `origin/main` | **5 docs files only** (task + DECISION/STATUS/HANDOFF/SELF_REVIEW) |
| Forbidden runtime/continuity paths | **none** |
| `git merge-base` vs live `origin/main` | `0c83af42` = live main; behind **0** |
| Finding 5.2 marked resolved | **no** |
| DB / Auth / Production calls | **none** |
| Browser `/admin/security` | **not** performed; no UI change |

## 7. Exact-head CI / Preview on `98b0ff33`

Recorded before this persist. This persist is a newer HEAD and invalidates these bindings.

| | |
| --- | --- |
| GitHub Actions | [`35366837440`](https://github.com/Jetnity/jetnity/actions/runs/35366837440) **SUCCESS** — Auth-Konfiguration `105671244691`; Typecheck, Lint & Build `105671244350`; Vercel Preview Comments `105671369711` |
| Combined commit status | `success` on `98b0ff33472765303a6544a887b5f24fc371d4b3` |
| Vercel | `69HMZy4hedL3iAD81xdpZng1RDQD` **READY** |
| Preview | https://jetnity-app-git-docs-v1-security-event-65dec6-jetnity-e1b93c82.vercel.app |

Dispatch-head Preview `5e5ho1cRB9BC8qJbazWN68ZFGWiz` is historical only.

## 8. Drift / thread report (re-fetched `origin/main`)

| | |
| --- | --- |
| Live `origin/main` | `0c83af42f8dd8c7572f531f5c2d766f4c0dba3f2` |
| Merge-base | `0c83af42f8dd8c7572f531f5c2d766f4c0dba3f2` |
| Ahead / behind before this persist | **3 / 0** (`84a5ec7b`, `64379ec3`, `98b0ff33`). Persist adds one more ahead commit. |
| Drift vs current main | **none** |
| PR #487 | Draft, open, not merged, `mergeable_state=blocked` (draft) |
| Formal reviews | none |
| Review comment threads | **0** |
| Issue #486 comments | none beyond the issue body |
| PR comments | Vercel bot `5732702307` (READY on dispatch head); dispatch `5732714821`; cursor bot `5732716276` |

## 9. Residual risks

- Finding 5.2 runtime ingestion remains OPEN.
- Unauthenticated login failures remain invisible in Jetnity.
- `service_role` ALL on `security_events` still exists from baseline.
- KPI helpers still look for `auth_failed` / `anomaly*` / `failed` / bot strings; V1 types will not move those numbers.
- Retention (2.4) and blocklist enforcement (5.3) remain separate.
- Platform Auth log capability is UNKNOWN pending operator dashboard verification.

## 10. Next step

Re-gate the **live HEAD** after this persist. Then **STOP FOR TECHNICAL-LEAD REVIEW**. Do not Ready. Do not merge. Do not start V1 Security Event Writer 1.
