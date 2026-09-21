# Jetnity – V1 Security Event Mutation-Derived Producer Contract 1 SELF-REVIEW

Stand: 21. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #493  
Draft PR: #494  
Binding task: `docs/V1_SECURITY_EVENT_MUTATION_DERIVED_PRODUCER_CONTRACT_1_TASK_2026-09-21.md`  
Binding review: Technical-Lead **5267095835** on `0d2a3a1f413b018c2d322424d33861dd916ed14a`  
Session: `bc-c0bfb7b9-1212-4121-b8d6-4f1bbf0d6a39`

This document argues against the implementation. It cannot replace an independent Technical-Lead PASS.

Current Supabase docs were fetched before relying on RLS / Data API / SECURITY DEFINER semantics:

- Grants **and** RLS both apply; a missing grant is `42501` before any policy. Default public-schema grants are being withdrawn (opt-in 2026-04-28, new-project default 2026-05-30, existing projects 2026-10-30).  
  https://supabase.com/docs/guides/api/securing-your-api  
  https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
- SECURITY DEFINER must pin `search_path = ''` and schema-qualify every relation. Functions are executable by PUBLIC unless revoked; a DEFINER in an exposed schema is a Data API RPC.  
  https://supabase.com/docs/guides/database/postgres/row-level-security  
  https://supabase.com/docs/guides/database/functions

The fixture follows that current guidance. Training-memory-only semantics were not used.

---

## 1. Attacks on this slice

| Attack | Result | Evidence |
| --- | --- | --- |
| Same-JWT Data API INSERT of a forged blocklist event | Fail. No authenticated INSERT grant/policy. | `42501 permission denied for table security_events` for moderator AAL2 and operator AAL2 |
| Direct event write by anon | Fail. No grant. | `42501` |
| Moderator AAL2 mutating `blocked_ips` | Fail. `darf_betrieb_eingreifen()` is operator+ AND AAL2. | RLS policy violation |
| Operator AAL1 | Fail. AAL2 required. | RLS policy violation |
| Break-glass JWT claim | Fail. Claim is not read by `darf_*`. | Moderator+AAL2+`break_glass` and traveller+AAL2+`break_glass` both denied |
| Function EXECUTE exposure | Fail. `REVOKE ALL` from PUBLIC/anon/authenticated/service_role. Catalog: all four `*_exec=false`. RPC `select producer()` → `42501`. | catalog + RPC case |
| Privileged exact-shape public INSERT (F1) | Insert succeeds as disclosed `service_role` ALL residual. Row is **not** origin-tracked, `used` stays 0, cleanup does not delete it. | F1-provenance group; forged id has `origin_row=false`, `tracked=false` |
| Direct write/read of private origin ledger | Fail. Schema USAGE and table/function grants revoked; RLS on with no policy. | `42501 permission denied for schema jetnity_internal` for anon/authenticated/service_role SELECT/INSERT/EXECUTE |
| Trigger / event-insert failure | Fail-closed. Injected BEFORE INSERT fault rolls back source, event, origin and `used`. | R1 `P0001 injected security_events insert fault`; source/tracked/origins/used = 0 |
| Quota race at C−1 | One wins, one waits on `Lock/transactionid`, loser `quota exceeded`. `used`=`tracked`=C. | two `psql` processes; lock snapshot recorded |
| Multi-row over C | Whole statement rolls back. No leftover source rows or `used + 1`. | `quota exceeded`; source=false; used unchanged |
| Cleanup/quota drift | Cleanup and `used` share `FOR UPDATE` on the quota row. Rollback restores both. Drifted `used` disables writes until repaired. Cleanup deletes only origin members. | R3 + invalid-state + F1 cleanup-keeps-forged |
| PII leakage | Event `ip`/`metadata` null; extra is exactly `{surface,result,op}`; blocked IP and reason absent. | payload group; 58 bytes |
| Legacy row destruction | `login_failed` + IP fixture and privileged out-of-contract row survive cleanup. No type CHECK. | legacy + cleanup |
| Accidental remote DB use | Script rejects `JETNITY_ALLOW_REMOTE_DB=1` and URL overrides; does not import `sql.mjs`; connects only via `sudo -u postgres psql` to a created/dropped local name. | source of harness |
| Continuity-file scope (F2) | `docs/ACTIVE_WORK_STATUS.md` restored to current main; not in #494 diff. | `git diff origin/main -- docs/ACTIVE_WORK_STATUS.md` empty |
| Main-drift integration | Live `#498`, `#497`, then `#502` merged; incoming files unchanged; contract / proof files not rewritten; no extra ownership. | merge-base `d99c7781`; those paths identical to `origin/main` |

## 2. Residual risks I would still challenge

- A later persistent activation that copies this SQL into `supabase/migrations/` without a separate gate would be a scope failure. This PR must not be treated as that gate. `jetnity_internal` is fixture-only.
- `service_role` BYPASSRLS can still mutate `blocked_ips`. Null `auth.uid()` emits no event and does not raise. Direct exact-shape `security_events` inserts still succeed. Those residuals are disclosed, not closed; they are now outside quota/cleanup.
- If `service_role` is given a forged JWT `sub`, the trigger would mint a trusted-looking event **and** a genuine origin row. That is the same privileged residual class as baseline ALL. Not advertised as the authenticated producer guarantee.
- `aktuelle_rolle()` remains SECURITY DEFINER so it can read `creator_profiles` from policies. It now uses `search_path=''`. A future persistent port must keep EXECUTE tightly granted.
- Cleanup age is synthetic. Inventing N from this test would violate finding 2.4.
- The concurrency proof observed a lock wait on attempt 2 in the passing F1/F2 run. A flaky scheduler could require retries; the command fails if no wait is seen after 3 attempts.
- Superuser/`postgres` still bypasses the private ledger. The proof is about Data-API roles, not cluster superuser.

## 3. What was not claimed

- Finding 5.2 is not closed.
- Release-gate §G is not satisfied.
- Network/edge blocklist enforcement is not implemented.
- No retention period was chosen.
- No Technical-Lead PASS.
- No Ready / merge / follow-up.
- `docs/ACTIVE_WORK_STATUS.md` is not this writer's continuity surface.

## 4. Dispatch compliance

| Requirement | Met? |
| --- | --- |
| Local disposable PostgreSQL only | Yes |
| Existing isolated DB-proof pattern | Yes |
| Current Supabase docs fetched | Yes — recorded above |
| Real concurrency, not sequential imitation | Yes — two sessions + lock wait |
| F1/F2/R1/R2/R3/R4 matrix | Yes — 67 harness cases including F1 provenance |
| Trigger-origin not public shape (review F1) | Yes — private ledger + adversarial group |
| ACTIVE_WORK_STATUS removed from diff (review F2) | Yes — restored to current main |
| EXECUTE/grants/catalog truth | Yes |
| No `supabase/migrations/` | Yes |
| No remote/service-role application writer | Yes |
| Stop for TL review | After freeze + PR comment |
