# Fresh Production core

Generated files in this directory form the fixed new installation for Supabase
`qscbgcdmivbbnzrcyegn`. **UNAPPLIED**; no Production connection or approval is
created by generation or tests.

Use the execution order and non-destructive rollback in
[`../../official-truth-product-v3-production/README.md`](../../official-truth-product-v3-production/README.md).
`install-and-start-guard.sql` is the default complete execution transaction,
including the genuine first BG1 audit and its Cron. `install.sql` is the core
without activation, retained for review and native proof. The separately
emitted HMT/BG/status/rolling files document exact component identities and are
not independently applicable upgrade scripts.

The compiler is `../../official-truth-product-v3-production/build.mjs`.
The original packages are immutable inputs; modifications are confined to this
new target's context, artifact ancestry, empty-ledger quota installation, the
six closed customer-information validators and the separately pinned complete
history-validator, journal-membership and atomic queue successors. They retain all historical checks and the
original five-second API deadline. It reuses only exact pure results within one
invocation; a smaller eight-entry job memo reduces copying, and canonical/node
subtree reuse shares the original 64-KiB budget. The original general validators
remain installed and serve as fallbacks. Fixed-key success checks apply only to
the compiler-bound finite keysets, never arbitrary caller-selected key arrays.
The journal-membership memo contains at most one successful exact-byte witness
of at most 64 KiB, resets for each subject and invocation, and leaves every
original lock, full-chain rebuild, row, method and intake check in place.
Its existing owner remains `ot_v3_jobs_owner`; only this replacement receives
temporary CREATE on the guard schema, immediately revoked in the same
transaction. The original schema ACL and role memberships must match exactly
afterward, as verified by the existing full delta check.
The normal claim and enqueue/complete/fail mutations use separate closed atomic
operations in the existing M04 API. Original confirmation, actual read, complete
original transition, rolling CAS and actual final confirmation/read run in one
transaction. Both direct history checks and the complete BG1 seal remain; the
single-subject capacity vector therefore executes three full history scans.
The two private orchestration helpers have owner-only EXECUTE. Existing OIDs,
argument contracts and ACLs remain exact. Every unexpected post-CAS mismatch
rolls the entire transaction back. Replay retains the original ledger receipt
and, for non-claim mutations, a separate actual current read of the same cycle.
The mandatory local factory proof checks each complete mutation, including
three actual MA1 reads, against its original single five-second deadline and
the successful/failed worker against its original thirty-second total budget.
Separate own executor functions select the new protocol; historical adapters
keep their immutable protocol. There is no fallback after atomic selection.
A passing individual read or claim is not a complete worker proof.
No Dev recovery migration or existing lifecycle counter is adopted.

Run the actual PG17 proof from repository root with Node 22:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-concurrency=1 scripts/db/official-truth-v3-production-install-1/native.test.ts
```

The harness owns and removes its disposable cluster. It uses PG17 `--single`,
without sockets, remote URLs or provider credentials. Synthetic local provider
fixtures are named explicitly. All runtime SQL bodies, rollback boundaries,
role checks and first normal queue admission execute in the actual database.
