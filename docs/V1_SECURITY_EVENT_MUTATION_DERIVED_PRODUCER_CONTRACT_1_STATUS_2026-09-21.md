# Jetnity – V1 Security Event Mutation-Derived Producer Contract 1 STATUS

Stand: 21. September 2026  
Status: **LOCAL DISPOSABLE PROOF + TL F1/F2 CHANGES REQUIRED ADDRESSED / HEAD WILL BE FROZEN AFTER REMAINING GATES / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / FINDING 5.2 INGESTION OPEN / PERSISTENT ACTIVATION CLOSED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #493  
Draft PR: #494  
Branch: `test/v1-security-event-mutation-derived-producer-contract-1`  
Dispatch / original canonical base: `main@4169c5b4a2d6e2f663bfaace385a2d482a4cc2d9`  
Integrated live main: `main@d99c7781eb098f303beab9c314fa116d0680dc98` (#502 after #497/#498; audit docs and proof files unchanged)  
Reviewed exact head that required changes: `0d2a3a1f413b018c2d322424d33861dd916ed14a`  
Binding review: Technical-Lead **5267095835**  
Binding task: `docs/V1_SECURITY_EVENT_MUTATION_DERIVED_PRODUCER_CONTRACT_1_TASK_2026-09-21.md`  
Binding architecture: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`

Cursor-Agent: **Jetnity V1 security event mutation-derived producer contract 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast**  
Session: `bc-c0bfb7b9-1212-4121-b8d6-4f1bbf0d6a39`

This file is point-in-time evidence. Agent self-review is not Technical-Lead PASS. Finding 5.2 remains OPEN. Release-gate §G remains unsatisfied. This slice does not activate the producer in any persistent database.

Final exact-head CI / Auth / Preview for the frozen head belong in a **PR comment**, not in a later evidence-only commit.

---

## 1. Goal

Prove the accepted mutation-derived producer contract on a **local disposable PostgreSQL** only: F1/F2 authorization, producer integrity, payload/PII, R1 fail-closed, R2/R4 serialized admission including real concurrency, invalid quota state, R3 cleanup/`used` coupling, legacy compatibility, SECURITY DEFINER catalog truth, and — after review 5267095835 — trigger-origin provenance that a Data-API/`service_role` direct table DML path cannot mint by copying the public row shape.

## 2. Implemented

- Isolated harness reused from `besuche-rls-lokal` / `s5b-persistenz-lokal`: create/drop local DB, no `scripts/db/sql.mjs`, reject `JETNITY_ALLOW_REMOTE_DB=1` and connection-string overrides.
- Bootstrap models anon/authenticated/service_role, `auth.uid()` / `auth.jwt()`, moderator vs operator, `darf_betrieb_lesen()` / `darf_betrieb_eingreifen()` = operator+ AND AAL2, `blocked_ips`, `security_events`, SELECT-only event grants, no authenticated INSERT.
- Contract fixture (not a migration): quota object, trigger-only SECURITY DEFINER with `search_path=''`, AFTER ROW triggers, closed extra, reserve exactly 1 per qualifying row, cleanup/`used` in the same lock domain.
- **F1 provenance (review 5267095835):** private `jetnity_internal.security_event_producer_origin` keyed by event id, written atomically by the trigger. Quota and cleanup classify membership from that ledger via `jetnity_internal.security_event_is_trigger_produced(uuid)`, not from public extra shape. Schema/table/function revoked from PUBLIC/anon/authenticated/service_role; RLS enabled with no policies. The public shape classifier is gone.
- Real two-session concurrency: at C−1, one session held the quota row lock (`PgSleep`), the other waited on `Lock/transactionid`, then failed with `quota exceeded`. Final `used` = `tracked` = C.
- Synthetic fixtures only: TEST-NET IPs, fixed UUIDs. No real actor data.
- **F2 (review 5267095835):** `docs/ACTIVE_WORK_STATUS.md` restored to current `main` and removed from the #494 diff. Continuity for this writer stays in the slice STATUS/HANDOFF/SELF_REVIEW.
- **Main integration:** merged `#498`, `#497`, then live `main@d99c7781` (#502). Hunter, reconciliation, and mobility-slice docs are unmodified. Security contract / local proof files were not changed for these integrates. #494 ownership remains the producer-contract files only.

## 3. Changed files versus canonical base

Allowed slice files only:

- `scripts/db/security-events-producer-contract-lokal.mjs`
- `scripts/db/security-events-producer-contract-lokal-bootstrap.sql`
- `scripts/db/security-events-producer-contract-lokal-contract.sql`
- `package.json` — one local command
- this STATUS, HANDOFF, SELF_REVIEW
- binding TASK (already on the dispatch head)

No `docs/ACTIVE_WORK_STATUS.md` in the #494 diff. No file under `supabase/migrations/`, `app/`, `components/`, `lib/`, `hooks/`, `types/`, `public/`.

## 4. Traveller-context check

Not relevant. No traveller credentials, routes, documents or eligibility rules.

## 5. Hard exclusions held

No Development/Preview/Production Supabase mutation. No Management API. No remote DB. No service-role application writer. No provider/secret/paid call. No retention-period decision. No persistent activation. No edge/network blocklist enforcement. No Ready. No merge. No follow-up slice.

## 6. Local proof (verified)

| Gate | Result |
| --- | --- |
| Local PostgreSQL | 16.15, cluster `16/main`, created and dropped by the script |
| `npm run db:security-events-producer-contract-lokal` | **67/67** PASS |
| F1 provenance | `service_role` exact-shape INSERT succeeds as residual ALL; row is not origin-tracked; `used` unchanged; cleanup keeps it; genuine trigger row is tracked; source/event/origin/quota share one transaction; rollback removes all producer-owned state; anon/authenticated/service_role cannot read/write/execute the private ledger |
| Concurrency | two `psql` processes; lock wait observed; C not exceeded |
| Remote DB | unused; injected `SUPABASE_*` env vars were not consumed |

## 7. Remaining gates for the frozen head

Reported after freeze, in a PR comment:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- hygiene (`check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps`)
- `npm run build`
- exact-head GitHub CI / Auth
- exact-head Vercel Preview
- merge-base / behind versus live `main@d99c7781` (must be 0)
- review threads 0

Dispatch base `4169c5b4` remains the historical start. Live main `#498`, `#497`, then `#502` is integrated; those files are not owned by this slice.

## 8. Residual risks

- Finding 5.2 remains OPEN. Application still has no persistent writer.
- `service_role` ALL / null-uid maintenance stays uncovered by the authenticated producer guarantee. Direct exact-shape inserts still succeed; they are now outside quota/cleanup because they have no private origin row.
- Fail-closed plus a drifted quota will refuse in-scope blocklist writes after a later activation.
- Cleanup age is a test fixture, not legal retention.
- The in-repo prototype is not a migration and must not be copied into Production without a later gated slice.
- `jetnity_internal` exists only in the disposable fixture. A later persistent port needs its own least-privilege design review; this PR is not that review.

## 9. Next step

Freeze the implementation head. Run remaining local gates. Report exact-head CI/Auth/Vercel in a PR comment. Then **STOP FOR TECHNICAL-LEAD REVIEW**.
