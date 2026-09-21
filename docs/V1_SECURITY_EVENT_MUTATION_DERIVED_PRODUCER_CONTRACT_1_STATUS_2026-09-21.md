# Jetnity – V1 Security Event Mutation-Derived Producer Contract 1 STATUS

Stand: 21. September 2026  
Status: **LOCAL DISPOSABLE PROOF IMPLEMENTED / HEAD WILL BE FROZEN AFTER REMAINING GATES / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / FINDING 5.2 INGESTION OPEN / PERSISTENT ACTIVATION CLOSED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #493  
Draft PR: #494  
Branch: `test/v1-security-event-mutation-derived-producer-contract-1`  
Canonical base: `main@4169c5b4a2d6e2f663bfaace385a2d482a4cc2d9`  
Binding task: `docs/V1_SECURITY_EVENT_MUTATION_DERIVED_PRODUCER_CONTRACT_1_TASK_2026-09-21.md`  
Binding architecture: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`

Cursor-Agent: **Jetnity V1 security event mutation-derived producer contract 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast**  
Session: `bc-c0bfb7b9-1212-4121-b8d6-4f1bbf0d6a39`

This file is point-in-time evidence. Agent self-review is not Technical-Lead PASS. Finding 5.2 remains OPEN. Release-gate §G remains unsatisfied. This slice does not activate the producer in any persistent database.

Final exact-head CI / Auth / Preview for the frozen head belong in a **PR comment**, not in a later evidence-only commit.

---

## 1. Goal

Prove the accepted mutation-derived producer contract on a **local disposable PostgreSQL** only: F1/F2 authorization, producer integrity, payload/PII, R1 fail-closed, R2/R4 serialized admission including real concurrency, invalid quota state, R3 cleanup/`used` coupling, legacy compatibility, and SECURITY DEFINER catalog truth.

## 2. Implemented

- Isolated harness reused from `besuche-rls-lokal` / `s5b-persistenz-lokal`: create/drop local DB, no `scripts/db/sql.mjs`, reject `JETNITY_ALLOW_REMOTE_DB=1` and connection-string overrides.
- Bootstrap models anon/authenticated/service_role, `auth.uid()` / `auth.jwt()`, moderator vs operator, `darf_betrieb_lesen()` / `darf_betrieb_eingreifen()` = operator+ AND AAL2, `blocked_ips`, `security_events`, SELECT-only event grants, no authenticated INSERT.
- Contract fixture (not a migration): quota object, trigger-only SECURITY DEFINER with `search_path=''`, AFTER ROW triggers, closed extra, reserve exactly 1 per qualifying row, cleanup/`used` in the same lock domain.
- Real two-session concurrency: at C−1, one session held the quota row lock (`PgSleep`), the other waited on `Lock/transactionid`, then failed with `quota exceeded`. Final `used` = `tracked` = C.
- Synthetic fixtures only: TEST-NET IPs, fixed UUIDs. No real actor data.

## 3. Changed files versus canonical base

Allowed slice files only:

- `scripts/db/security-events-producer-contract-lokal.mjs`
- `scripts/db/security-events-producer-contract-lokal-bootstrap.sql`
- `scripts/db/security-events-producer-contract-lokal-contract.sql`
- `package.json` — one local command
- this STATUS, HANDOFF, SELF_REVIEW
- binding TASK (already on the dispatch head)
- `docs/ACTIVE_WORK_STATUS.md` — continuity for this writer

No file under `supabase/migrations/`, `app/`, `components/`, `lib/`, `hooks/`, `types/`, `public/`.

## 4. Traveller-context check

Not relevant. No traveller credentials, routes, documents or eligibility rules.

## 5. Hard exclusions held

No Development/Preview/Production Supabase mutation. No Management API. No remote DB. No service-role application writer. No provider/secret/paid call. No retention-period decision. No persistent activation. No edge/network blocklist enforcement. No Ready. No merge. No follow-up slice.

## 6. Local proof (verified)

| Gate | Result |
| --- | --- |
| Local PostgreSQL | 16.15, cluster `16/main`, created and dropped by the script |
| `npm run db:security-events-producer-contract-lokal` | **56/56** PASS |
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
- merge-base / behind=0
- review threads 0

## 8. Residual risks

- Finding 5.2 remains OPEN. Application still has no persistent writer.
- `service_role` ALL / null-uid maintenance stays uncovered by the authenticated producer guarantee.
- Fail-closed plus a drifted quota will refuse in-scope blocklist writes after a later activation.
- Cleanup age is a test fixture, not legal retention.
- The in-repo prototype is not a migration and must not be copied into Production without a later gated slice.

## 9. Next step

Freeze the implementation head. Run remaining local gates. Report exact-head CI/Auth/Vercel in a PR comment. Then **STOP FOR TECHNICAL-LEAD REVIEW**.
