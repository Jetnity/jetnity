# Jetnity – V1 Security Event Ingestion Architecture 1 STATUS

Stand: 21. September 2026  
Status: **INTEGRATED ONTO `main@4a223d34` / `d4fee848` EXACT-HEAD GATES RECORDED / THIS EVIDENCE COMMIT INVALIDATES THAT EXACT-HEAD / DRAFT / NOT READY / NOT MERGED / FINDING 5.2 INGESTION OPEN / OPERATING MODE NORMAL / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #486  
Draft PR: #487  
Branch: `docs/v1-security-event-ingestion-architecture-1`  
Binding task: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_TASK_2026-09-18.md`  
Decision: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`  
Original canonical base: `main@0c83af42f8dd8c7572f531f5c2d766f4c0dba3f2`  
Current integration base / live `origin/main`: `4a223d342e24fb9316f5ee4333914a16dca3b7bc`  
Parked head before resume: `12d070a79c35fbb9f03d1302833eee8561ec17bd`  
Dispatch relation before merge: **4 ahead / 71 behind**  
Integration merge: `9e6b68a2202d641ed8368875b77ef6776f6f6115`  
Integration persist head: `d4fee84804a87247c0ae054a2c63bd8ed0980e2a`

Cursor-Agent: **Jetnity V1 security event ingestion architecture 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast**  
Session: `bc-5208e459-47c3-4d03-ba30-7ebb633c71bd`

This file is point-in-time evidence. Every new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS.

Finding 5.2 runtime ingestion remains **OPEN**. Release-gate §G is **not** satisfied. Writer 1 is **not** started. This slice does not mark 5.2 PASS/RESOLVED.

---

## 1. Goal

Resume the parked architecture slice and bring it onto current main. Preserve the accepted source/threat/privacy decision unless current-main evidence invalidates it.

This slice does **not** implement event ingestion.

## 2. Implemented

### 2.1 Accepted architecture (unchanged)

Binding decision in `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`:

- Preferred source: **Jetnity-owned authenticated application events only**.
- Platform Auth logs: separate operator-only truth class; not ingested.
- Hybrid ingestion: rejected.
- Unauthenticated login-failure writer: rejected (spam/forgery).
- Service-role writer and new SECURITY DEFINER write RPC: not permitted for V1.
- Minimum types: `admin_login_success`, `admin_aal2_success`, `admin_authorization_denied`, `admin_blocklist_add`, `admin_blocklist_remove`.
- PII: no email, no IP in events, no user-agent, no tokens, no free-text, no traveller data; `user_id` of the admin actor only.
- Schema: remain on `security_events`; usable only with a later additive INSERT grant/policy.
- Smallest follow-up: **V1 Security Event Writer 1** (not started).

### 2.2 Integration-only step (this head)

`origin/main@4a223d34` (#492 HOLD-closure / OS-2) was merged with a clean disjoint tree. No accepted architecture rule was rewritten.

Current-main re-read:

| Surface | Result vs 18 September decision |
| --- | --- |
| Finding 5.2 | Still OPEN / ingestion MISSING; presentation mitigation retained |
| `SecurityWidget.tsx` | Recorded-event KPIs; `failed` / bot-string guesses unchanged |
| `ehrliche-zustaende.ts` | Incomplete-coverage copy unchanged |
| admin security routes | Reads only; block/unblock still `blocked_ips` only |
| admin login / guard | No `security_events` write |
| `security_events` schema / grants | No new migration on main |
| Operating mode | **NORMAL**; prior HOLD closed |

Main-only delta is governance/OS docs plus `.jetnity/operating-mode.json`. That metadata file still names this PR `parked_safe_draft_stop` at `12d070a7`. Stale after this resume; not edited here.

## 3. Changed files versus current `origin/main`

Exactly the #487 architecture package:

- `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_TASK_2026-09-18.md`
- `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`
- `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_STATUS_2026-09-18.md`
- `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_HANDOFF_2026-09-18.md`
- `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_SELF_REVIEW_2026-09-18.md`

No runtime, migration, RLS, grant, Auth, or global continuity file is in the intended diff. OS/HOLD files arrived only through the merge commit.

## 4. Traveller-context check

Not relevant. Admin operational security architecture only. No traveller credentials collected or inferred.

## 5. Hard exclusions held

Not introduced or touched by this resume:

- Security Event Writer 1
- runtime writer or helper
- migration / RLS / grant / Auth / Supabase / Production write
- service-role client or writer
- raw auth-log ingestion
- provider / secret / env / cost / scheduler
- blocklist enforcement
- edits to `.jetnity/operating-mode.json` or global continuity
- Ready / merge / follow-up slice
- marking finding 5.2 resolved

## 6. Local gates on `d4fee848`

Docs/architecture only.

| Gate | Result |
| --- | --- |
| Merge-base vs live `origin/main` | `4a223d342e24fb9316f5ee4333914a16dca3b7bc` |
| Ahead / behind before this evidence persist | **6 / 0** |
| Changed-file scope vs `origin/main` | **5 docs files only** |
| Forbidden runtime/continuity paths in the #487 diff | **none** |
| Finding 5.2 marked resolved | **no** |
| DB / Auth / Production calls | **none** |
| Browser `/admin/security` | **not** performed; no UI change |

## 7. Exact-head CI / Preview on `d4fee848`

Recorded before this persist. This persist is a newer HEAD and invalidates these bindings.

| | |
| --- | --- |
| GitHub Actions | [`35587473966`](https://github.com/Jetnity/jetnity/actions/runs/35587473966) **SUCCESS** — Auth-Konfiguration `106294046795`; Typecheck, Lint & Build `106294047011`; Vercel Preview Comments `106294220557` |
| Combined commit status | `success` on `d4fee84804a87247c0ae054a2c63bd8ed0980e2a` |
| Vercel | `AwhkmGrVhELkhguMp4WphHaMGJRP` **READY** |
| Preview | https://jetnity-app-git-docs-v1-security-event-65dec6-jetnity-e1b93c82.vercel.app |

Parked-head CI `35367401959` / Vercel `dpl_3bPiYSyPirvdHpthKoKNtXScTrw6` remain historical only.

## 8. Drift / thread report (re-fetched `origin/main`)

| | |
| --- | --- |
| Live `origin/main` | `4a223d342e24fb9316f5ee4333914a16dca3b7bc` |
| Merge-base | `4a223d342e24fb9316f5ee4333914a16dca3b7bc` |
| Ahead / behind | **6 / 0** before this evidence persist. Persist adds one more ahead commit. |
| Drift vs current main | **none** after merge |
| Operating mode | **NORMAL** |
| PR #487 | Draft, open, not merged |
| Formal reviews | none |
| Review comment threads | **0** |

## 9. Residual risks

- Finding 5.2 runtime ingestion remains OPEN.
- Unauthenticated login failures remain invisible in Jetnity.
- `service_role` ALL on `security_events` still exists from baseline.
- KPI helpers still look for `auth_failed` / `anomaly*` / `failed` / bot strings.
- Retention (2.4) and blocklist enforcement (5.3) remain separate.
- Platform Auth log capability is UNKNOWN.
- `.jetnity/operating-mode.json` on main still parks this PR at `12d070a7` until a later governance persist.

## 10. Next step

Re-gate the **live HEAD** after this persist. Then **STOP FOR TECHNICAL-LEAD REVIEW**. Do not Ready. Do not merge. Do not start V1 Security Event Writer 1.
