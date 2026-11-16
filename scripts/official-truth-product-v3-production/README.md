# CH→DE Production installation package 1

Prepared execution package; **UNAPPLIED**. Merge, Production SQL, secrets,
Owner actions, monitor activation and any IPv4 add-on require Sasa's release
approval. Local PG17 evidence is preparation evidence, not Production acceptance.
The existing Dev installation and the 206 `RESEARCH_ONLY` targets are outside
this package. No Dev approval, job, START, receipt or recovery history is copied.

## Fixed target and reviewed bytes

Only project `qscbgcdmivbbnzrcyegn`, database `postgres`, PG17, host
`db.qscbgcdmivbbnzrcyegn.supabase.co:5432` and site `https://jetnity.com` are valid.
Before any SQL, independently read the selected connector/project identity and
verify the runtime's fixed TLS host/certificate. A custom PostgreSQL GUC is an
operator acknowledgement; it does not establish the remote project's identity.
No SQL file selects a host or accepts an alternate project.

Run offline from repository root:

```sh
node scripts/official-truth-product-v3-production/build.mjs --check
```

`manifest.json` records the exact original inputs and compiled outputs. The
compiler verifies immutable source hashes, changes enumerated target/context
anchors and recomputes transitive function/artifact bindings. It does not make a
global Dev-to-Production string replacement, open a connection or read secrets.
`binding.json` must equal the reviewed AA/Bern runtime binding; its method and
package digests, one-hour projection age and existing API deadlines are unchanged.

## Approved execution order

Use the exact files from one reviewed commit and stop at any failed check.
Keep the previous app deployment available before the release begins.
The live alias readback on 15 November 2026 selected
`dpl_88LzdqY5DUo8mQT9rLzji6apcZBJ`, commit
`63544e820e912bd275556588c956a09b99b1cf90`, deployment
`https://jetnity-qhlf2ccij-jetnity-e1b93c82.vercel.app` for `jetnity.com`.
This is the recorded rollback candidate, not a promotion instruction; re-read
the actual alias/deployment immediately before the approved release.

| Step | Artifact or action | Required result |
| --- | --- | --- |
| 1 | Remove the temporary Dev build hook/importer permit, finish CI and merge #1197 only after approval | Production deploy cannot use the temporary Dev hook |
| 2 | `preflight.sql`, after session acknowledgement `jetnity.production_target=production:qscbgcdmivbbnzrcyegn:INSTALL1` | Read-only proof of unused core, PG17 managed roles, auth/profile and provider prerequisites |
| 3 | Scheduler `provider-prerequisites.sql` | Explicit installation of the available pg_net **0.19.5** only; existing pg_cron 1.6.4, Vault 0.3.1 and pgcrypto 1.3 preserved |
| 4 | Scheduler `core.sql` then `monitoring.sql`, together in their prescribed transaction | Disabled scheduler; monitor ACL installed **before** the fresh BG1 catalog snapshot |
| 5 | `../db/official-truth-v3-production-install-1/install-and-start-guard.sql` | One atomic PAI → three logins → PG1/HMA/HS/HMT → **HRS → HM04** → bounded SET edges → BG1/status/fresh rolling quota → active five-minute BG1 Cron and genuine first audit |
| 6 | `configure-credentials.sql` and Production runtime environment setup | Six distinct own SCRAM credentials in server-only Production scope; no Dev credential reuse |
| 7 | `verify.sql`, actual fixed TLS/login checks, Production Owner/AAL2 in the normal import UI | Catalog remains exact; own Production method stage/approval is recorded by the real Owner session |
| 8 | Normal first CH→DE source import using retained UI request IDs | Fresh primary/counter source evidence, accepted publication and real public visitor result |
| 9 | Scheduler `activate.sql`, first automatic cycle, next due time and external monitor | Forty-minute import cadence, current BG1, publication before expiry, independent checks enabled after acceptance |

Scheduler artifacts are in
`scripts/db/official-truth-v3-production-import-schedule-1/`; its own README
specifies the exact target acknowledgement, secret provisioning and activation.
Creating the scheduler monitor after BG1 would alter the protected anonymous-role
dependency graph and is deliberately refused. Do not bypass that guard.
The default execution artifact includes the first audit in the same transaction
as core installation, so external secret/Owner setup cannot consume the first
background-proof deadline. `install.sql` is the unactivated core used for proof
and review; do not substitute it for the complete default execution artifact.
`activate-background-guard.sql` is its exact separately inspectable component.

The core initially has zero method approvals, source jobs, execution starts,
originals and projections. Its quota row is configuration with zero anchors,
not a fabricated job. The first normal enqueue creates the subject. Lifetime
counters remain monotonic; the charged window remains 24 hours, 64 STARTs and
256 operations with the original terminal-credit rule.

## Secrets and runtime boundary

| Production-only environment key | Database login | Allowed SET role |
| --- | --- | --- |
| `JETNITY_V3_PG_METHOD_PASSWORD` | `ot_v3_method_transport_login` | `ot_v3_method_reader` |
| `JETNITY_V3_PG_INTAKE_PASSWORD` | `ot_v3_intake_transport_login` | `ot_v3_intake_caller` |
| `JETNITY_V3_PG_JOBS_PASSWORD` | `ot_v3_jobs_transport_login` | `ot_v3_jobs_caller` |
| `JETNITY_V3_PG_RESULT_WRITER_PASSWORD` | `ot_v3_result_writer` | None |
| `JETNITY_V3_PG_RESULT_READER_PASSWORD` | `ot_v3_result_reader` | None |
| `JETNITY_V3_PG_RESULT_VERIFIER_PASSWORD` | `ot_v3_result_verifier` | None |

All six logins have `CONNECTION LIMIT 2`, matching the unchanged runtime's
physical work/control pair contract. The PG17 proof independently reads their
actual role rows and rejects the former unlimited transport-role profile;
local single-user tests do not stand in for the real TLS/session handshake.

Use a secret-aware parameterized creator connection and one transaction to set
the local `jetnity.production_credentials` JSON value, execute
`configure-credentials.sql`, then commit. Generate six distinct random base64url
values of at least 32 random bytes, represented by 43–128 characters. The file
checks all six inputs before changing any password, clears the local input and
checks that the nonsecret protected catalog did not change. Never print or
commit the real inputs. The separate scheduler secret
`JETNITY_PROD_IMPORT_CRON_SECRET` belongs in Production runtime scope and Vault
`jetnity_prod_import_cron_v1`; it is not a database password.

## Monitoring and acceptance

The BG1 job is `jetnity-official-truth-production-guard-v1`, every five minutes.
It runs the real full audit under the existing 30-second checker bound. The
public BG1 status has no operation/source identifiers. The separate
`public.jetnity_production_import_status_v1()` reports only status and next due
time. The independent checker also verifies the public CH→DE projection, at
least 15 minutes remaining freshness, and the next due time before expiry.
Its repository gate stays disabled until the approved release is accepted.
No successful background status is inserted or backdated by the installer.

## Non-destructive stop and rollback

Before the core commit, any error rolls back the whole core, BG1 Cron and first
audit. Provider setup and
the disabled scheduler are separate prior transactions; read their state before
retrying. The core rejects adoption/reinstallation, so never rerun it after a
successful commit. An unknown commit result requires exact readback first.

After use, execute scheduler `deactivate.sql` to stop new dispatch. Already
admitted requests can still settle. In the real Production Owner/AAL2 session,
use the normal HMT revoke operation for the observed method tuple/epoch, retaining
its original operation ID for confirmation if the response is lost. Confirm the
method is revoked and the public visitor fails closed. Preserve all original
jobs, unknown outcomes, source records, approvals, revocations and BG1 evidence.
Keep BG1 running; do not delete schemas, reset counters, amend timestamps, copy
Dev recovery receipts or reopen unknown work. The previous app deployment can be
restored after the authority is closed, while these database records stay intact.

## Verification scope

`build.test.mjs` proves deterministic artifact identity and fixed order.
`../db/official-truth-v3-production-install-1/native.test.ts` executes the complete
core and activation bytes in a disposable actual PG17 single-user backend.
Managed auth/profile and Cron/provider surfaces are explicitly synthetic local
fixtures; their live Production metadata has a separate preflight. The tests
cover negative target/predecessor gates, complete atomic rollback, empty history,
least privilege, fresh quota, credential boundaries, actual first Owner approval
and enqueue, and ordinary authority revocation without deleting retained work.
Production connectivity, real secrets, real Owner authentication, first source
fetch, schedule delivery and public acceptance remain release execution checks.

Existing plans provide the proposed scheduler. No tariff or add-on is activated
by preparation. Dedicated IPv4 is currently disabled; if the fixed direct
transport requires it, the separate approval is approximately USD 4/month plus
tax (USD 0.0055/hour). Do not substitute an unverified pooler or claim zero usage
cost. #1198 follows #1197 and the CH→DE Production priority as a separate release.
