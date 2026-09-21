# Jetnity – V1 Security Event Mutation-Derived Producer Contract 1 HANDOFF

Stand: 21. September 2026  
Status: **LOCAL DISPOSABLE PROOF + TL F1/F2 ADDRESSED / FREEZE HEAD AFTER REMAINING GATES / REPORT CI IN A PR COMMENT / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEINE PERSISTENTE AKTIVIERUNG**

Binding task: `docs/V1_SECURITY_EVENT_MUTATION_DERIVED_PRODUCER_CONTRACT_1_TASK_2026-09-21.md`  
Architecture: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`  
Status: `docs/V1_SECURITY_EVENT_MUTATION_DERIVED_PRODUCER_CONTRACT_1_STATUS_2026-09-21.md`  
Self-review: `docs/V1_SECURITY_EVENT_MUTATION_DERIVED_PRODUCER_CONTRACT_1_SELF_REVIEW_2026-09-21.md`  
Binding review: Technical-Lead **5267095835** on `0d2a3a1f413b018c2d322424d33861dd916ed14a`

This document is enough for a new agent or Technical Lead to continue without the chat.

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #493 |
| Draft PR | #494 |
| Branch | `test/v1-security-event-mutation-derived-producer-contract-1` |
| Dispatch / original canonical base | `main@4169c5b4a2d6e2f663bfaace385a2d482a4cc2d9` |
| Integrated live main | `main@d1949e23b3dda30b7482265822e7e1279f244228` (#498 docs-only, unchanged) |
| Agent / session | Generation 1 / `bc-c0bfb7b9-1212-4121-b8d6-4f1bbf0d6a39` |
| Required model | Cursor Grok 4.6 High Fast — confirmed (`originalModelName=cursor-grok-4.6-high-fast`) |

Read first: the binding task, then architecture §3.3 / §7 / §8, then review 5267095835, then the three harness files.

## 2. What changed

The accepted mutation-derived contract is an executable local proof. After CHANGES REQUIRED:

1. `scripts/db/security-events-producer-contract-lokal-bootstrap.sql` — Supabase-like roles, JWT/AAL, capability predicates, `blocked_ips` / `security_events` grants+RLS.
2. `scripts/db/security-events-producer-contract-lokal-contract.sql` — quota row, trigger-only DEFINER, AFTER ROW triggers, cleanup/`used` coupling, **private `jetnity_internal` origin ledger**.
3. `scripts/db/security-events-producer-contract-lokal.mjs` — adversarial matrix including two real `psql` sessions and F1 privileged exact-shape provenance cases.
4. `package.json` command `db:security-events-producer-contract-lokal`.
5. F2: `docs/ACTIVE_WORK_STATUS.md` restored to current main. It is **not** in the #494 diff.

No `supabase/migrations/` file. No persistent environment apply.

Quota and cleanup decide “tracked producer” only from `jetnity_internal.security_event_producer_origin`. Copying `{surface,result,op}` onto a `service_role` INSERT does not mint origin, does not change `used`, and is not deleted by cleanup.

## 3. How to re-run

```bash
npm run db:security-events-producer-contract-lokal
```

Requires local PostgreSQL 16 and `sudo -u postgres` (same pattern as `db:besuche-lokal`). The script creates `jetnity_security_events_producer_lokal` and drops it at the end.

Last verified local run: **67/67 PASS** on PostgreSQL 16.15.

## 4. What a reviewer should verify first

1. Merge-base equals live `main@d1949e23` and behind=0. #498 hunter docs are present and unmodified. Dispatch base `4169c5b4` is historical.
2. Diff stays inside the allowed files. Zero files under `supabase/migrations/`. **Zero** `docs/ACTIVE_WORK_STATUS.md` hunks.
3. Harness never imports `scripts/db/sql.mjs` and rejects remote overrides.
4. Catalog proof: DEFINER, `search_path=""`, no EXECUTE for PUBLIC/anon/authenticated/service_role, trigger returns `trigger`, ROW not STATEMENT. Private schema/table/function ACLs closed; public shape classifier absent.
5. F1 adversarial: `service_role` exact-shape insert succeeds; not tracked; `used` unchanged; cleanup keeps it; genuine trigger is tracked; atomic source/event/origin/quota; rollback clears producer-owned state; direct roles cannot read/write/execute the ledger.
6. Concurrency evidence is two processes plus a lock wait, not sequential imitation.
7. Finding 5.2 is not marked resolved; no PASS claim; persistent activation stays closed.
8. Final CI/Auth/Preview for the **frozen** head belong in a PR comment.

## 5. What this does not mean

Not implemented in Development/Preview/Production. Not a retention decision. Not network enforcement. Not Ready. Not a Technical-Lead PASS. §G unsatisfied. `jetnity_internal` is fixture-only.

## 6. Next step

**STOP FOR TECHNICAL-LEAD REVIEW** after the frozen head’s remaining local gates and exact-head CI/Auth/Preview are posted as a PR comment.
