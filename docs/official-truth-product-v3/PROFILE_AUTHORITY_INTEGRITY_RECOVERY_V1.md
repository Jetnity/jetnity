<!-- PAI1_FIX1_CURRENT_BEGIN -->
## PAI1-FIX1 — current source-only correction, 12 November 2026

New replacement author: **Jetnity Profile Authority Integrity1 — Codex Generation2**, session `/root/pai_fix`; the original Generation1 session is unreachable in the current thread, and the Product Owner's standing replacement-session authorization applies.
Sole parent: `a686e608f597ffa82d44fc9d3992b9b566b89688`; base tree: `b4f54fad7d9981f8b7676b42b271bf6740a17f48`.
Selected [PAI1-FIX1 task](https://github.com/Jetnity/jetnity/pull/1196#issuecomment-6829530744); [actual CI4139 failure](https://github.com/Jetnity/jetnity/pull/1196#issuecomment-6829449466).
The only executable source edit adds distinct `claim_reset`, `sub_reset`, and `claims_value` result labels to the existing three-expression `setClaims()` SELECT.
All calls, arguments, parameter, false flag, order, await, assertions, ten proof groups and resource limits remain exact; the wire reader, installer, baseline and wrapper are unchanged.
Current native: **62649 UTF-8 bytes**, SHA-256 `926ba90156ef7ea279a34fb64d2bdb3fe66eb3c07bc149dccc858ebe36f20cf7`, Git blob `7fefc442cfbd7344fa9cbe992bcd733803e1c094`.
**NOT_RUN / NOT_INSTALLED / NOT_TL_PASS**: no project, parser, compiler, test, native, SQL, CI, hosted, official-source or ref action was performed by this replacement author.
The earlier SOURCE-V1/A1 material below is preserved historical evidence; this section records the current revision.
<!-- PAI1_FIX1_CURRENT_END -->

# Profile Authority Integrity 1 — forward recovery

**SOURCE ONLY / UNAPPLIED. No rollback-to-vulnerable script is provided.** This document belongs to the SOURCE-V1/A1 candidate with sole parent `fa8bd1d02ea67cf69ba3df9fea5a3d39a35a7474`; it is not an instruction to execute SQL from this author session.

## If the installation refuses

The candidate is a single explicit transaction. It takes a bounded `SHARE ROW EXCLUSIVE` lock on `public.profiles`, checks the observed old contract and creator/default-rights conditions, creates exactly one trigger function and one trigger, verifies both new objects and the complete retained old catalog, then commits. Lock timeout is 2 seconds and statement timeout is 10 seconds. Any SQL error aborts the transaction. The operator must end an errored transaction through its ordinary transaction rollback/connection cleanup; a failed transaction is not evidence that any guard was installed.

Record the exact candidate digest, intended Dev target, actual error code and a bounded independent readback. Preserve unexpected objects and rights. A name collision is not idempotent success: the candidate intentionally refuses even a second attempt at its own already-installed name. Do not delete, overwrite, rename around, disable or normalize the colliding object to make an old gate pass.

| Candidate error | Meaning | Required next action |
| --- | --- | --- |
| `P7902` | Creator, PG family, schema rights/ownership, memberships or relation topology differ | Pause apply and let Root review the concrete drift; select a new bounded task if necessary. |
| `P7903` | New-name collision or creator/new-function defaults differ | Keep the unexpected state intact. Root binds the actual catalog and selects a forward action. |
| `P7904` | Observed old profile authority contract differs | Retain data and original objects. Obtain finite new evidence and review an explicit new candidate. |
| `P7905` | New-object or retained-catalog verification failed | Transaction must remain uncommitted. Root reads back the result and investigates before a new attempt. |
| `55P03`, `57014`, transport loss or other SQL error | Lock, statement or connection did not complete as required | Treat outcome as unverified until independent readback; never infer commit or rollback from an absent response. |

The codes above describe authored branches and normal PostgreSQL failure classes, not observed execution results. The final exact-head native/Dev receipts must carry actual results.

## If an acknowledged installation breaks a legitimate flow

Keep identity and authority protection active. Record the minimum failing operation, execution principal, SQLSTATE and affected flow without live account data, credentials, Auth token or invented Owner proof. Pause the affected operator flow if needed. Root must independently distinguish a policy-correct refusal from an actual regression, then select and review a forward repair with exact observed inputs.

The Auth account-deletion flow is a mandatory native gate: a synthetic `supabase_auth_admin` owner deletes a synthetic Auth user, the actual FK action deletes its profile, a separate INVOKER observer records the real profile DELETE principal, and the original guard returns unchanged `OLD`. The observer is fixture-only and removed before final readback. No new principal is added to the privileged NULL-actor exception by assumption. If the actual context differs from the selected `postgres`/`service_role` rule or the cascade fails, stop and return the concrete result to Root; do not suppress the delete or silently skip the profile.

Existing own-profile DELETE and selected privileged NULL-actor maintenance must remain working, while both identity columns stay immutable for every caller. Unexpected refusals require a forward reviewed correction. Do not turn a legitimate-flow concern into permission to relink accounts, downgrade another Owner, or restore broad foreign DELETE.

## Forbidden recovery shortcuts

Do not drop or disable `profiles_autoritaet_integritaet_v1`, drop its function to restore the old vulnerable behavior, disable RLS or any old guard, add a catch-and-allow path, return NULL to skip a forbidden DELETE, use CASCADE to remove dependencies, purge profile/Auth/history data, broaden the NULL-actor list, change global defaults, or grant new role/schema/function authority. No executable command for these shortcuts is included.

Fixture-only adversarial mutations in `native.ts` are confined to owned disposable PostgreSQL clusters and have explicit restoration; they are not a hosted recovery procedure. The source package does not provide an alternative channel for the denied #917 action and does not touch #1131.

## Concurrency and actual apply boundary

The profile table lock protects conflicting writes and table DDL. It cannot establish that an independently privileged database operator has stopped changing helper functions, role memberships, schema ACLs or creator defaults. Root must separately establish an operator-quiescent interval covering actual apply and readback. A caller flag, zero count, snapshot, invented catalog lock or source assertion is not evidence of that external condition.

An actual successful source review and mandatory PG17 native result are still prerequisites. Root then binds the exact Dev target, current catalogs, external quiescence, source digest and recovery readback before a selected apply. No Production equivalence, signed Owner/AAL2 result, E18/E24 closure or CH→DE publication follows from this document.


## FIX1 recovery scope

This correction changes only fixture result-column labels; the installer and all database recovery rules above remain byte-exact. It neither installs the profile guard nor authorizes rollback to the vulnerable state. A future failed native proof must retain its original error and owned cleanup; no duplicate-column suppression is introduced. Current execution status remains NOT_RUN pending Root's complete integration and gates.
