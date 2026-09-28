# Jetnity – Admin Security Blocklist Bound Honesty 1 – TASK v1

Stand: 29. September 2026
Issue: #617
Branch: `fix/admin-security-blocklist-bound-honesty-1`
Canonical baseline: `main@b633e5f299389faf7e7de375470aaa309e8ef674`

## 1. Objective

Keep the existing Admin Security **blocklist read** honest about its bounded result size.

Current route `app/api/admin/security/list/route.ts` applies `MAX_ZEILEN = 200` to both:
- `security_events`
- `blocked_ips`

PR #614 already made the event-table bound visible. The blocklist still shows `{blockedCount} Einträge` with no indication that a returned 200-row list may be truncated.

A bounded read must not silently look complete.

## 2. Parallel boundary

Active PR #616 owns Admin Users created-at honesty. This slice must not touch any users path.

No overlap with #616 is expected.

## 3. Required reading

Before editing:

1. `JETNITY_START_HERE.md`
2. `.jetnity/operating-mode.json`
3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
4. PR #614 exact accepted implementation and TL FINAL PASS review
5. `components/admin/security/SecurityWidget.tsx`
6. `lib/admin/ehrliche-zustaende.ts`
7. `lib/admin/security/filter-ehrlichkeit.ts`
8. `lib/admin/security/filter-ehrlichkeit.test.ts`
9. `app/api/admin/security/list/route.ts` read-only reference.

Re-fetch live main, open PRs, active writers and collision state before material work.

## 4. Product truth contract

Distinguish:
- blocklist read shorter than the bound: show the returned count, no truncation claim;
- blocklist read reaching the current 200-row bound: show that the list is bounded and may be incomplete;
- blocklist read failure: existing unavailable/error behavior remains;
- non-enforced truth remains unchanged.

Do not imply that 200 necessarily means truncation. Wording should state that the read **may** be incomplete.

## 5. Acceptance cases

1. 0 blocklist rows: existing honest empty behavior remains.
2. 199 rows: no bounded/truncation warning.
3. 200 rows: visible blocklist-bound notice appears.
4. The visible count remains the returned-row count, not a claim of total blocked IPs.
5. Existing event-table bound notice from #614 remains unchanged and still keys off events, not blocklist.
6. Existing incomplete-ingestion/security warnings remain unchanged.
7. IP blocklist stays explicitly "nicht enforced".
8. Block/unblock buttons and request bodies remain unchanged.
9. No API contract, database, Auth/RLS, enforcement or ingestion changes.

## 6. Evidence

Use synthetic payloads only. No Production security data.

Before/after proof should demonstrate:
- baseline 200 blocklist rows without bound notice;
- fixed 199 rows without notice;
- fixed 200 rows with honest bounded-read notice;
- event-table 200-row notice remains independently correct;
- no block/unblock POST occurs in the harness.

Actual-component controlled evidence preferred. State limitations explicitly.

## 7. Exclusive write ownership

Allowed runtime writes:
- `components/admin/security/SecurityWidget.tsx` — blocklist read/count presentation only;
- `lib/admin/ehrliche-zustaende.ts` — blocklist bounded-read copy only;
- `lib/admin/security/filter-ehrlichkeit.ts` and test only if a generic existing bound helper can be reused without altering #614 semantics.

Optional:
- focused test/evidence script using existing tooling.

Allowed slice docs/evidence:
- `docs/ADMIN_SECURITY_BLOCKLIST_BOUND_HONESTY_1_TASK_2026-09-29.md`
- STATUS / HANDOFF / SELF_REVIEW with same prefix
- `docs/evidence/admin-security-blocklist-bound-honesty-1/`

Do NOT edit:
- security list route;
- block/unblock routes;
- any SQL/migration;
- users/Payments paths;
- package/lockfile/workflows;
- global continuity.

If correct implementation requires a forbidden path, STOP and report.

## 8. Hard boundaries

No:
- IP enforcement;
- security_events ingestion/finding 5.2 closure;
- retention rule;
- Production DB/Auth/RLS mutation;
- provider/payment/spend;
- public indexing/launch;
- new dependency;
- next slice.

## 9. Validation

At minimum:
- focused blocklist-bound regression tests;
- #614 event-bound/filter-honesty tests;
- actual-component synthetic evidence;
- full repository-required tests;
- typecheck;
- lint;
- Admin API protection;
- schema/dead/export/dependency hygiene;
- Production build.

Before STOP:
- re-read main;
- confirm 0 overlap with #616;
- exact diff self-review;
- document limitations.

Exact-head CI/Auth/Vercel remain Technical-Lead gates.

## 10. Agent contract

Logical agent: **Jetnity admin security blocklist bound honesty 1**
Generation: **1**
Required model: **Grok 4.7 High Fast**
No Auto / no substitution.

Cursor is sole runtime writer for this slice.
Cursor does not Ready, merge, or start another slice.
Review fixes remain in the same logical agent/session.

**STOP FOR INDEPENDENT CHATGPT TECHNICAL-LEAD CODE + INTERACTION REVIEW.**
