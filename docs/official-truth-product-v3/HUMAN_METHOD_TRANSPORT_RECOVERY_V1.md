# Human Method Transport1 — UNUSED recovery V1

Status: **SOURCE ONLY · UNPUBLISHED · UNAPPLIED · NOT_RUN**. This is an operator contract for the exact candidate, not permission to remove deployed or used authority.

## Ownership and prerequisite

Root Technical Lead alone may select an exact hosted action after independent source/runtime review, actual target evidence and applicable platform authorization. The implementation author stops at immutable delivery. The #917 denied action is not repeated, reformulated, rerouted or delegated. #1131 is NOT_REQUIRED and untouched.

Recovery applies only to the four public transport functions listed in the manifest. It never invokes HMA1 or PG1 recovery. It never deletes an operation, revision or head, and never changes a schema, managed role, default ACL, existing function or Auth record.

All of the following must be independently evidenced by Root/operator before BEGIN:

1. The connection is exact Dev project **yfvbxvijcorffwxbxahl**, database **postgres**, with actual session_user=current_user=postgres and the observed PG17 non-superuser creator profile. The target context is an acknowledgement of this independently bound connection; SQL cannot turn a caller-supplied project label into proof of project identity.
2. The exact original install receipt and four function OIDs, ordered by function name, are persisted and independently read back. Same-shaped replacement functions with different OIDs do not qualify.
3. Every relevant external request producer and entry point has stopped, every in-flight request has drained, and no queued retry can enter during the interval. Include the actual PostgREST routes, possible GraphQL entry points and any selected direct operational caller. There is no claim that these four functions are REST-only.
4. Concurrent administrative changes to the target/roles/defaults/prerequisites/functions are quiescent. The finite advisory locks coordinate only cooperating operators; they are not a universal administrative DDL barrier.
5. A named external evidence receipt and a finite quiescent interval, at most five minutes ahead, cover the entire transaction through COMMIT. The operator maintains this independently verified state; a flag, receipt string, clock, role list, empty table or catalog count cannot prove it.

If any item is unknown, recovery is not selected. **Do not populate acknowledgements merely to get past a failed gate.**

## Explicit context

Root/operator sets the candidate's session context only after the above evidence exists:

- jetnity.hmt1_target = dev:yfvbxvijcorffwxbxahl:postgres:E18B6824905662
- jetnity.hmt1_recovery_context = root-verified-unused-quiescent-v1
- jetnity.hmt1_original_oids = exact JSON array from the original install receipt, ordered by proname
- jetnity.hmt1_quiescence_receipt = bounded, non-secret external evidence identifier
- jetnity.hmt1_quiescence_until = finite timestamp in the proved interval, greater than current DB clock and no more than five minutes ahead

The context and OID binding are necessary acknowledgements, not independent authority, an Auth session, a cryptographic human approval or a proof of stopped callers. In the native late-writer test the synthetic acknowledgement is deliberately violated to prove an additional DB safeguard. That test cannot certify an external deployment's quiescence.

## Exact transaction behavior

The source starts BEGIN followed immediately by SET TRANSACTION ISOLATION LEVEL READ COMMITTED, before any query. It pins search_path to pg_catalog, lock_timeout to two seconds and statement_timeout to thirty seconds. It acquires the selected PG1/HMA1/HMT1 advisory locks in that order.

Before removal it validates the actual creator/context, the complete E18B public/default ACL profile, unchanged PG1 and complete HMA1 catalogs and bodies, the four exact SQL-standard INVOKER function definitions, their argument/null/security/configuration metadata, direct normal dependencies and effective rights. The original four OIDs, externally evidenced interval and external receipt must match. Missing functions, extra overloads, body/config/ACL drift, foreign dependencies or unproved context refuse atomically.

It then acquires ACCESS EXCLUSIVE locks on the three existing HMA1 history tables, with the two-second bound. A separate statement checks revisions, heads and operations under READ COMMITTED after the locks are obtained. An earlier active writer that commits while the recovery waits is therefore visible to this check. Any row, or expiry of the acknowledged interval, refuses and rolls back.

Only the four exact public signatures are dropped with RESTRICT. There is no CASCADE and no table/role/schema removal. Complete original PG1 and HMA1 prerequisites are rechecked, absence of all four wrapper names and the live interval are checked, then COMMIT. Root independently reads back the exact removal and original prerequisite identities before calling recovery complete. PostgREST/GraphQL schema-cache behavior is a separate hosted operational gate.

## Native proof boundary

The authored mandatory PG17 witness uses the real non-superuser LOGIN postgres in an owned, disposable synthetic fixture. It covers successful unused removal, absent/stale original identities, missing functions, invalid/unproved/expired acknowledgements, function/ACL drift and a parsed foreign dependent that must prevent removal. It compares original HMA1/PG1 identities and metadata.

For the late-writer case the actual recovery prefix selects READ COMMITTED despite a REPEATABLE READ session default. A fresh restricted synthetic authenticated principal stages a method in an open transaction. Recovery's actual table-lock statement is observed waiting on that identified writer. The writer commits, recovery obtains its lock, and the unchanged recovery suffix refuses the newly committed history. An inspection through the lock-owning installer avoids blocking on its own ACCESS EXCLUSIVE lock; after rollback a separate bootstrap inspector compares complete retained rows and catalogs. Prefix + actual lock + suffix are byte-for-byte the complete recovery candidate, without an omitted candidate statement.

No group has been executed by this source author. Source-only evidence cannot become a native, signed-HTTP, Dev or Production PASS.

## After any real use

Use the authorized human revoke operation and a separately reviewed forward repair. A method or operation history means UNUSED recovery is permanently inapplicable to that installation. Expired or revoked authority is still history. A failed HTTP response or uncertain client result is not proof of no committed operation; only separate exact operation confirmation can establish stored truth, and unavailable confirmation remains UNKNOWN.

The public CH→DE answer, D1 approval, source freshness and public cache automation are outside this source delivery. No automatic next slice is selected.

