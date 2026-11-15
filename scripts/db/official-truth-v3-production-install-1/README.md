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
new target's context, artifact ancestry and empty-ledger quota installation.
No Dev recovery migration or existing lifecycle counter is adopted.

Run the actual PG17 proof from repository root with Node 22:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-concurrency=1 scripts/db/official-truth-v3-production-install-1/native.test.ts
```

The harness owns and removes its disposable cluster. It uses PG17 `--single`,
without sockets, remote URLs or provider credentials. Synthetic local provider
fixtures are named explicitly. All runtime SQL bodies, rollback boundaries,
role checks and first normal queue admission execute in the actual database.
