# V3 Node-Postgres transport candidate

Source-only delivery. No project code, parser, test, database, hosted connection,
official-source retrieval or production activation was executed during authoring.

The production selector is literal `null`. Runtime accepts only the fixed MA1
reader, the four existing S1 statements, the one M04 statement and the three HRS
channels. The six LOGIN names come from Root selection #1139/6832438377; HRS
writer/reader/verifier keep their separate direct privileges. A working/control
pair is the entire per-LOGIN capacity and both connections use that same LOGIN.

The additive MA1 third argument and S1 fourth argument carry the original
immutable monotonic deadline. This production adapter refuses a missing,
malformed or expired cap before allocation and may only shorten it. The new HRS
factory supplies the minimum of its original call, scope and receipt/operation
caps. Older dormant/native executors remain compatible with the optional type
argument. A public query retains its original 750-ms business cap. Its returned
latency includes actual cleanup/drain; the native proof records both quantities,
and real hosted p95 performance still needs independent verification.

The pg 8.23.1 adapter preserves text and NULL cells through query-local parsers,
owns DNS, TLS, bounded protocol frames, SCRAM continuations, queries and socket
closure. Both TLS hops are required: explicit certificate/hostname verification
at the client, and actual own-backend `pg_stat_ssl.ssl` readback in the session.

Before SET LOCAL ROLE, both true PID/backend-start identities are captured.
A same-LOGIN PostgreSQL watchdog uses the actual original transaction and one
absolute DB cutoff derived from the shrinking monotonic bound and notAfter.
The working connection proves the guard is actually sleeping before the effect.
COMMIT requires its actual command/ReadyForQuery acknowledgement; cleanup joins
the watchdog, checks exact backend absence and closes both local sessions.

## Explicit negative terminal outcome

If both connections are lost before a remote terminal observation is available,
no finite local timer can prove remote completion. Under Root selection
[#1139/6834185393](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6834185393),
`blocked_remote_unknown` may return only after the actual locally owned DNS,
authentication, query/COMMIT and socket work has joined. Remote COMMIT, rollback
and absence remain unknown. Both slots stay permanently `blocked_terminal`,
with no reconnect, replay or later allocation. If even local closure is unproved,
the promise stays unresolved. The HRS factory poisons all later calls and aborts
and joins its active invocations; consumers return only unavailable/unconfirmed
or the public temporary-failure result. No SQL/native wire reply was extended.

A server statement/transaction timeout limits server work but is not an observed
termination receipt. Reconnecting without evidence that the old control slot is
terminal could create an unaccounted third backend, so this candidate has no such
automatic path. These authored negatives are not a remote termination guarantee
or a runtime acceptance claim; the production target remains `null`.

## Authored verification

Root may execute these only after reviewing the exact integrated source and lock:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test scripts/db/official-truth-v3-node-postgres-transport-1/boundary.test.ts
node --experimental-test-module-mocks --import ./scripts/server-only-test-register.mjs --import tsx --test --test-concurrency=1 scripts/db/official-truth-v3-node-postgres-transport-1/offline.test.ts
node --experimental-test-module-mocks --import ./scripts/server-only-test-register.mjs --import tsx --test --test-concurrency=1 scripts/db/official-truth-v3-node-postgres-transport-1/native.test.ts
```

Native requires an unprivileged owner, PostgreSQL 17 tools and OpenSSL. It creates
its own loopback-only TLS cluster and an owned TLS proxy, synthetic passwords and
synthetic functions with the exact fixed signatures. The literal target
selection is mocked; observation-only spies call the original driver methods
and count their actual callbacks and socket closes. The real `pg` transport, TLS, authentication, server grants,
cancel/terminate, transaction and COMMIT-loss paths execute. The proxy drops the
actual backend COMMIT frame; independent SQL observes the committed row.

The valid synthetic HRS public configuration reaches the genuine MA1 transport
once before its two channels lose the actual COMMIT frame. The proof records the
unchanged 750-ms cap, total elapsed time, post-loss drain and deadline overrun;
checks zero owned callbacks/sockets at return and no later callback; and checks
that all six facade entries make no further native call after poisoning. A second
dual-loss case independently observes an actual committed M04 write while its
executor still reports only remote unknown. Neither inspector result is supplied
to the production executor as a receipt, and the original functions/grants stay
unchanged. The loopback literal creates no DNS child; the production resolver's
two actual promises remain joined by the unchanged adapter.

Additional native cases consume part of a shared MA1/S1 cap before acquisition,
observe the real backend inside PgSleep, and prove its final absence. A deferred
constraint trigger also stalls a genuine COMMIT; expiry must leave the preceding
insert rolled back. These are authored proof cases, not executed pass claims.

These synthetic functions prove transport behavior, not MA1/HRS acceptance or
hosted installation. The original Unix-socket proof wire and its ownership guard
are unchanged. Root's full HRS/composed proof remains a separate required gate.

Primary implementation references: the pg@8.23.1 `client.js`, `connection.js`,
`connection-parameters.js`, `query.js` and pg-protocol parser in
https://github.com/brianc/node-postgres/tree/pg%408.23.1/packages ;
https://node-postgres.com/apis/client ;
https://node-postgres.com/features/ssl ;
https://www.postgresql.org/docs/17/functions-admin.html#FUNCTIONS-ADMIN-SIGNAL ;
https://www.postgresql.org/docs/17/runtime-config-client.html .

The driver-private coupling is intentionally narrow and visible: the real
connection/TLS frame stream and asynchronous SCRAM continuation are joined. A pg
upgrade requires re-review of those surfaces and the native proof.
