# Jetnity – Admin + Account Ungated Residual Precheck 1 – TASK v1

Stand: 28. September 2026  
Issue: #609  
Branch: `audit/admin-account-ungated-residual-precheck-1`  
Canonical baseline: `main@bee041911003a3b871dacddc0fcdd12f4b8714a1`

## 1. Objective

Find the next actually useful, provider-independent, currently ungated Jetnity slice after Admin F reconciliation #606 and Admin Users Search Navigation #608.

This task is a **read-only precheck**. It does not implement the next slice.

The goal is to prevent three failure modes:
1. rebuilding something already merged;
2. starting a scope that actually needs a Product-Owner / privacy / RLS / identity / Production gate;
3. inventing work merely to keep Cursor busy while KAYAK, Sherpa and IATA Timatic are pending.

## 2. Required live reconstruction

Before analysis, re-fetch and record:

- exact current `main`;
- open PRs and issues;
- current operating mode;
- active Cursor/runtime writers;
- current CI/Vercel state;
- current Admin/Account continuity after #606 and #608.

Live evidence wins over all historical snapshots.

## 3. Required reading

Read at minimum:

1. `JETNITY_START_HERE.md`
2. `.jetnity/operating-mode.json`
3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
4. `docs/ACTIVE_WORK_STATUS.md`
5. `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-28.md`
6. `docs/JETNITY_REMAINING_BUILD_MAP_1_REPORT_2026-09-22.md`
7. `docs/ADMIN_F_RECONCILIATION_1_REPORT_2026-09-28.md`
8. `docs/ADMIN_USERS_SEARCH_NAVIGATION_1_REPORT_2026-09-28.md`
9. `docs/V1_TRIP_ACCOUNT_REVALIDATION_1_REPORT_2026-09-21.md`
10. `docs/V1_TRIP_ACCOUNT_REVALIDATION_1_NEXT_SLICES_2026-09-21.md`
11. `docs/V1_RELEASE_READINESS_PREFLIGHT_1_REPORT_2026-09-28.md`
12. current Admin / Account / guest source and focused tests relevant to candidate residuals.

## 4. Mandatory supersession checks

Prove current state before using any old finding.

At minimum re-check:

- Admin F palette: already built in #545; #606 only reconciled stale docs.
- Admin Users search/navigation: closed by #608; do not redispatch.
- RH-1.1 Auth lookup-failure: closed by #500.
- RH-3.1 mobility ordering: closed by #502.
- RH-10.1 / RH-10.2 security KPI taxonomy: closed by #504.
- TA-R1 invalid guest-draft honesty: check #532/current source before calling it open.
- TA-R2 protected-item date mismatch: check #520/current source before calling it open.
- TA-R3 Foundation-E degraded honesty: check #531/current source before calling it open.
- VUX-1/VUX-2/VUX-3/VUX-4/VUX-5/VUX-7/VUX-8: check their later closures before using the 21 Sep audit.
- Legal/Terms/Privacy/SMTP/Auth redirect/account-erasure gaps: do not repeat already closed 27–28 Sep work.

## 5. Gate checks

Re-establish whether these remain gated or deliberately later:

- Admin E support User + Trip read-only surface;
- AP-8 account-wide preferences;
- AP-9 favorites;
- AP-11 notification matrix;
- AP-12 entitlements;
- Admin Finance / Billing-P1;
- persistent security-event ingestion / finding 5.2;
- observability vendor;
- Production account-count exposure;
- retention / consent persistence;
- KAYAK / Sherpa / IATA / Official Truth;
- payment-live;
- public indexing/launch.

Do not convert a missing feature into an ungated candidate if it needs any new role, privilege, table, sensitive-data scope, Product-Owner decision, contract, cost, Production mutation or legal decision.

## 6. Fresh defect / residual search

Inspect current code and tests for **real bounded user or operator defects** in these existing surfaces:

- Admin home/navigation/users/security/system-health/provider-cost;
- Account home/trips/settings/security/export/travellers/world/bookings;
- guest-to-account honesty;
- existing Trip Workspace presentation seams only where already part of Account/guest journeys.

Focus on:
- stale state / URL state / pagination / navigation;
- empty-vs-error honesty;
- retry/failure semantics;
- keyboard/focus/accessibility regression;
- date/locale display;
- duplicate or contradictory operator/user copy;
- already-built features whose current implementation has a reproducible bug.

Do not perform a broad redesign or create new product concepts.

## 7. Candidate contract

Return **at most three** candidates.

For each candidate provide:

- exact title;
- exact current source paths;
- reproducible current-main evidence;
- why it is still open now;
- why it is not already closed by a later merge;
- expected user/operator impact;
- smallest safe implementation boundary;
- test/evidence acceptance cases;
- collision analysis;
- `UNGATED` or `GATED` classification;
- P0/P1/P2/P3 severity;
- whether Cursor can implement without Product-Owner approval.

Only an `UNGATED` candidate may be recommended for immediate follow-up.

If no `UNGATED` candidate survives, say **NONE**.

## 8. No implementation

Allowed writes:

- `docs/ADMIN_ACCOUNT_UNGATED_RESIDUAL_PRECHECK_1_REPORT_2026-09-28.md`
- `docs/ADMIN_ACCOUNT_UNGATED_RESIDUAL_PRECHECK_1_STATUS_2026-09-28.md`
- `docs/ADMIN_ACCOUNT_UNGATED_RESIDUAL_PRECHECK_1_HANDOFF_2026-09-28.md`
- `docs/ADMIN_ACCOUNT_UNGATED_RESIDUAL_PRECHECK_1_SELF_REVIEW_2026-09-28.md`
- optional evidence under `docs/evidence/admin-account-ungated-residual-precheck-1/`

Do not edit runtime, migrations, package files, workflows, operating mode or global continuity.

## 9. Agent contract

Logical agent: **Jetnity admin account ungated residual precheck 1**  
Generation: **1**  
Required model: **Grok 4.7 High Fast**  
No Auto / no substitution.

Cursor does not mark Ready and does not merge.

When complete: STOP for independent ChatGPT Technical-Lead exact-head review. Do not start the implementation candidate.
