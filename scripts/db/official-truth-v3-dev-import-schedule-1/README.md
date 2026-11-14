# CH→DE Dev import schedule v1

This package adds an ordinary source refresh sender for the exact existing Dev
installation. It does not install a Production runtime, approve a method, extend
a published expiry, alter protected counters or rewrite evidence. Live execution
receipts belong in [PR #1197](https://github.com/Jetnity/jetnity/pull/1197).

## Fixed scope and verified prerequisite

- Database project: `yfvbxvijcorffwxbxahl`, PostgreSQL 17, operator `postgres`.
- Preview branch: `feat/official-truth-human-method-ui-1-20261112`.
- Host: `jetnity-app-git-feat-official-truth-hum-6fe0cd-jetnity-e1b93c82.vercel.app`.
- Endpoint: `POST /api/internal/readiness/ch-de-dev-refresh`.
- Scope: the reviewed AA/Bern CH passport → DE direct visa-only program.
- Existing Dev extensions: `pg_cron` 1.6.4, `pg_net` 0.20.4, Vault 0.3.1,
  and `extensions.hmac(text,text,text)` from pgcrypto.
- Existing Owner/method/source authorizations are used, never repeated by this
  scheduler. Every actual run still checks the current method and normal guards.
- The 206-country research remains `RESEARCH_ONLY` and is not an input here.

## Why enqueue precedes work

The original projection expires after one hour. The normal source monitor can
correctly report unchanged content while its 24-hour source qualification is
still current; that alone does not publish a fresh projection. This sender first
creates a normal new research requirement and then resumes that exact request.
Fresh originals, qualification, version preparation and publication still pass
through the existing runtime. The sender never edits source or projection dates.

A cycle stores original operation/lease IDs before HTTP can run after COMMIT.
`start` must receive a signed `queued` acknowledgement for its deterministic job
identity before `resume` is sent. Both phases retain the same original IDs.
Missing, malformed, stale or forged responses never create replacement IDs.
Only a verified `published > 0` response completes a cycle. A zero-publication
result remains the same work request. Eight attempts per phase or 25 minutes
park the cycle for review. A parked cycle prevents a later replacement cycle.

The cron wakes every minute. A successful cycle makes the next cycle due 40
minutes after the original request was created; a delayed publication ACK does
not push the next deadline past the prepared result's freshness window.

## Authentication and preview access

`JETNITY_DEV_IMPORT_CRON_SECRET` is a Sensitive Vercel variable for this Preview
branch only. The same random value is encrypted in Dev Vault under
`jetnity_dev_import_cron_v1`. Request and response have separate HMAC-SHA256
domains and bind timestamp, phase, exact path and original IDs. The secret is
never placed in the pg_net queue; the route rejects unsigned or stale requests.

The provider's pg_net queue and response tables have PUBLIC grants. A bearer
signing secret there would be unsafe. Signed responses also prevent a writer of
the response table from forging publication evidence. Such a writer can still
deny service; the scheduler parks rather than manufacturing a successful run.

Vercel Authentication separately protects the Preview. Its alias-specific
Shareable Link was created with an explicit 48-hour TTL. A GET to the same alias
with `_vercel_share` returns a 307 and a `_vercel_jwt` cookie. The actual observed
JWT audience is the exact alias, subject is `protection-bypass-url`, and its
`exp` matches the Shareable Link expiry. A cookie-only GET to the existing import
route reached the application's 405 response, without a redirect. The cookie's
browser Max-Age is seven days; that does not extend its signed 48-hour expiry.

The cookie is held separately in Vault as
`jetnity_dev_import_preview_cookie_v1`. It is necessarily visible in PUBLIC
pg_net transport and grants access to that Dev preview, not Owner/application
authority or Production. The route allows exactly that single canonical cookie;
HMAC, Dev selection and method checks remain mandatory. No query parameter,
additional cookie or application session is admitted. The private scheduler also
stops at the verified JWT expiry. Privileged Supabase operators with Vault read
access remain inside the platform trust boundary; no global roles are changed.

## Installation and activation

1. Review the complete runtime/SQL/test candidate and exact branch configuration.
   Require all existing CI gates and the matching Ready Preview deployment.
2. Provision the two Dev Vault entries and the branch-only Sensitive HMAC
   variable without writing credential values into Git, comments or evidence.
3. Record the current BG1 protected catalog hash and require its complete
   baseline equality. Wrap `core.sql` in one transaction, setting
   `SET LOCAL jetnity.dev_import_target='dev:yfvbxvijcorffwxbxahl:refresh1'`.
   Recheck catalog equality in the same transaction before COMMIT. The new
   independent schema starts disabled; no source request is sent by installation.
4. Verify the deployed UI's normal source run. Preserve original request IDs
   when any outcome is unknown; do not repeat completed Owner approvals.
5. Set the exact target and `jetnity.dev_import_preview_expires` to the actual,
   verified JWT `exp` for the following transaction, then execute `activate.sql`.
   It refuses an existing schedule instead of silently replacing it. It creates
   only `jetnity-ch-de-dev-import-v1`, checks its exact command/user/database,
   and enables the private state. Existing guard and cleanup schedules remain.
6. Observe actual cron dispatch, queued acknowledgement, fresh source work and
   signed publication. Compare the real visitor response/version/expiry and
   normal following BG1 full proof. Observe the next scheduled cycle separately;
   a job registration or synthetic test is not a live renewal receipt.

## Finite v1 limit — not a permanent-operation claim

The installed M04 model limits a subject to 64 STARTs and 256 queue operations
over its **entire lifetime**. These are not daily allowances. The sender reads
those counters, never resets/increases them, and requires at least four STARTs
and sixteen queue operations before beginning another cycle. The state records
remaining capacity. With the observed initial 4 STARTs and 13 operations, at
most 57 more single-START cycles fit this reserve. At 40-minute cadence the last
projection may expire approximately 38 hours after the first cycle; retries can
shorten this. Preview access also has an explicit expiry.

This v1 package therefore proves a finite scheduled Dev pilot. A permanent
operation claim requires a separately reviewed versioned quota policy for
recurring work, complete replay/terminal-credit protection and a measured
history/guard capacity envelope. Retained evidence, unknown operations and
method authority must not be reset, relabelled or rotated to evade v1 limits.
No new paid scheduler, plan or archive is activated by this package.

## Readback, failure and stop

Read `state_v1`, `cycles_v1`, `dispatches_v1` and this named job's
`cron.job_run_details`; never return Vault values or raw HTTP headers.
`transport_access_expired`, `pilot_capacity_low`, `guard_not_current`, and
`operator_review_required` need operator attention. Status rows alone are not an
independent external alert. Production needs its own verified alarm delivery.

For a stop, disable this named cron and set `state_v1.enabled=false` in a
transaction holding `pg_advisory_xact_lock(771106,31)`. Keep the complete ledger,
original requests and provider responses; stopping does not prove rollback of
an already dispatched request. Revoke the exact alias Shareable Link when it is
no longer needed. Never drop used evidence or change another cron as recovery.

## Verification

The added mandatory PG17 test runs the actual `core.sql` with real pgcrypto in
an owned local PostgreSQL single-user backend. Vault/net are explicit synthetic
transport fixtures; no socket, external database or live credential is used.
It proves state transitions, identity custody, SQL/Node MAC agreement, negative
ACL/immutability, malformed/forged/stale replies, bounded retries, guard/capacity
and preview-expiry gates. Hosted extension behavior and real publication remain
separate live checks. Existing runtime/replay/Owner/architecture/audit tests are
preserved, and the selector includes this file in its mandatory PG17 group.
