# Jetnity – V1 Security Event Mutation-Derived Producer Contract 1 HANDOFF

Stand: 21. September 2026  
Status: **LOCAL DISPOSABLE PROOF IMPLEMENTED / FREEZE HEAD AFTER REMAINING GATES / REPORT CI IN A PR COMMENT / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEINE PERSISTENTE AKTIVIERUNG**

Binding task: `docs/V1_SECURITY_EVENT_MUTATION_DERIVED_PRODUCER_CONTRACT_1_TASK_2026-09-21.md`  
Architecture: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`  
Status: `docs/V1_SECURITY_EVENT_MUTATION_DERIVED_PRODUCER_CONTRACT_1_STATUS_2026-09-21.md`  
Self-review: `docs/V1_SECURITY_EVENT_MUTATION_DERIVED_PRODUCER_CONTRACT_1_SELF_REVIEW_2026-09-21.md`

This document is enough for a new agent or Technical Lead to continue without the chat.

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #493 |
| Draft PR | #494 |
| Branch | `test/v1-security-event-mutation-derived-producer-contract-1` |
| Canonical base | `main@4169c5b4a2d6e2f663bfaace385a2d482a4cc2d9` |
| Agent / session | Generation 1 / `bc-c0bfb7b9-1212-4121-b8d6-4f1bbf0d6a39` |
| Required model | Cursor Grok 4.6 High Fast — confirmed (`originalModelName=cursor-grok-4.6-high-fast`) |

Read first: the binding task, then architecture §3.3 / §7 / §8, then the three harness files.

## 2. What changed

The accepted mutation-derived contract is now an executable local proof:

1. `scripts/db/security-events-producer-contract-lokal-bootstrap.sql` — Supabase-like roles, JWT/AAL, capability predicates, `blocked_ips` / `security_events` grants+RLS.
2. `scripts/db/security-events-producer-contract-lokal-contract.sql` — quota row, trigger-only DEFINER, AFTER ROW triggers, cleanup/`used` coupling.
3. `scripts/db/security-events-producer-contract-lokal.mjs` — adversarial matrix including two real `psql` sessions.
4. `package.json` command `db:security-events-producer-contract-lokal`.

No `supabase/migrations/` file. No persistent environment apply.

## 3. How to re-run

```bash
npm run db:security-events-producer-contract-lokal
```

Requires local PostgreSQL 16 and `sudo -u postgres` (same pattern as `db:besuche-lokal`). The script creates `jetnity_security_events_producer_lokal` and drops it at the end.

## 4. What a reviewer should verify first

1. Merge-base equals `main@4169c5b4` and behind=0.
2. Diff stays inside the allowed files. Zero files under `supabase/migrations/`.
3. Harness never imports `scripts/db/sql.mjs` and rejects remote overrides.
4. Catalog proof: DEFINER, `search_path=""`, no EXECUTE for PUBLIC/anon/authenticated, trigger returns `trigger`, ROW not STATEMENT.
5. Concurrency evidence is two processes plus a lock wait, not sequential imitation.
6. Finding 5.2 is not marked resolved; no PASS claim; persistent activation stays closed.
7. Final CI/Auth/Preview for the **frozen** head belong in a PR comment.

## 5. What this does not mean

Not implemented in Development/Preview/Production. Not a retention decision. Not network enforcement. Not Ready. Not a Technical-Lead PASS. §G unsatisfied.

## 6. Next step

**STOP FOR TECHNICAL-LEAD REVIEW** after the frozen head’s remaining local gates and exact-head CI/Auth/Preview are posted as a PR comment.
