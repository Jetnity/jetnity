# REFRESH-RETIREMENT1 — exact Dev original

This additive package admits the existing Owner/AAL2 recovery for the real
CH→DE refresh START left unknown at 10:45 UTC on 15 November 2026. PostgreSQL
reported `P7302 intake_lease_elapsed` in the original I1 finish transaction.
There is no result, completion or disposition to resume. The installer itself
does not retire an attempt or fabricate an outcome.

## Fixed inputs and effects

| Input | Exact value |
| --- | --- |
| Project | Dev `yfvbxvijcorffwxbxahl` |
| Repository base | `70a3cb09204e74f6bcd4a5b481e942e526a6102f` |
| Installed predecessor | CUSTOMER-INFORMATION1, `cd886ead66b92ec48ee9c5c5a214f310bc6e6645e1fc15f88a78650fcb95b37f` |
| Original attempt | `execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea` |
| Original claim | `op3_af6a4ab203d24be7869136eec570468e` |
| Original S1 operation | `op3_7e003b5a015c26976fbdf3fed1b8d494` |
| Current subject | Revision 37, Attempt 1, 9 starts, 41 queue operations |
| Preserved history | Three old retirements; five accepted versions, projections and publications |

`original-evidence.json` holds the complete bounded, non-credential original
state. The compiler pins the installed predecessor bytes and all predecessor
function bodies. The transaction replaces exactly 17 existing function bodies,
preserving their OIDs, owners, options and ACLs, and adds two private immutable
tables: `refresh_retirement_baseline_v1` and `retired_refresh_attempts_v1`.
Existing table rows and catalogs are compared inside the installation.

Only two existing protected owners receive temporary SET-only membership and
schema CREATE privileges for the replacements. Every temporary edge is removed
before the new catalog baseline is captured. Original grantor edges, all roles,
schema ACLs, existing Cycle2/Cycle3 artifacts and method guarantees remain.

The normal Owner RPC performs full original-state CAS and closes only
`subjects_v1.open_attempt`. The queue record, original START, S1 record and all
historical results remain unchanged. The new immutable receipt permanently
fences both the original intake operation and execution attempt. The whole
earlier retirement rows and every retained HRS row are bound in the snapshot;
subsequent legitimate history may append.

The existing panel describes the **open source attempt**. Its counts are
truthfully 2 originals, 1 qualification and 0 accepted versions. Five previous
versions/publications are separately retained and checked. No Admin file changes.

## Root operator sequence

1. Use only the explicit Dev project. Confirm CUSTOMER-INFORMATION1 remains the
   installed predecessor and the current original still matches the evidence.
   Keep the Dev sender disabled and drained and runtime connections quiescent.
2. Apply the exact `provider-migration-body.sql` through one provider migration
   transaction as managed `postgres` on PostgreSQL 17. It checks target, source,
   full predecessor catalog/history, permissions, complete row preservation,
   disabled/drained sender and the new post-commit proof boundary.
3. Read `readback.sql`. The five verification flags must be true, `retired=0`
   and admission initially `unavailable`. Record provider/baseline digests,
   required generation and proof boundary. On lost acknowledgement, first read
   `to_regclass('official_v3_guard_private.refresh_retirement_baseline_v1')`;
   if present, use readback. Do not replay an uncertain installation.
4. Wait for the next **ordinary BG1 cron**. Require its generation and proof
   start to meet the new immutable boundary and admission to be `current`.
   The readback never runs an audit or sender tick.
5. Use the unchanged Owner/AAL2 review → retire → confirm path. Review the exact
   open original and selection digest. The result is `unknown_retired`;
   retries use the same operation identity and separate confirmation.
6. Resume the saved normal CH→DE source request with the corrected I1 runtime.
   Its exact retired `resume` read reports no resumable custody, then the
   ordinary original-claim confirmation, full queue CAS and MA1 checks select
   deterministic Attempt 2. A retired START/token cannot be reused. Other
   purposes, attempts, changed claims, subject drift, missing/changed receipts
   and any open custody remain refused.
7. Continue Root's actual normal UI run, additive Cycle3 review and unattended
   proof. Local PG17 evidence is not a hosted run or unattended result.

The installer has no Production counterpart. Production remains UNAPPLIED.
No reset, historical rewrite, new authority, synthetic hosted completion or
separate merge is part of this package.

## Build and native verification

From the repository, using Node 22:

```sh
node scripts/db/official-truth-v3-dev-refresh-retirement-1/build.mjs --check
node --experimental-test-module-mocks --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-dev-refresh-retirement.test.ts
```

The focused test uses the existing owned, socket-free PostgreSQL 17 harness.
`local-history.json.gz` contains copied business history, including public
source bytes. Live lease tokens, token hashes and Owner actor identities were
omitted before export; the local harness fills explicitly synthetic credentials
and fixture actors. It reconstructs the unchanged installed chain, imports the
actual retained rows, and passes its original full history checks. Nullable
JSON values are never guessed: column types and NOT NULL constraints come from
the actual local schema.

The proof covers installation rollback on drift, immutable history/OIDs/ACLs,
fresh BG1 admission, Owner/AAL2 and full selection CAS, separate confirmation
and replay, valid original late S1 and M04 requests, exact resume refusals and a
real subsequent claim/START through `workSelectedOnce`. Local corruption probes
run only inside rollback transactions; the immutable trigger is restored before
the normal reader tests missing or changed Owner receipts. The following local
producer deliberately returns an ordinary unreachable failure for its **new**
attempt. It does not create an HRS success or alter the retired original.

See `HANDOFF.md` for final native results and the complete corrected error group.
