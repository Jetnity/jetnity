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

Vercel Authentication separately protects the Preview. The initial admission
proof used an alias-specific Shareable Link with an explicit 48-hour TTL. A GET to the same alias
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

### Recurring preview admission

`preview-renewal.sql` adds a private candidate ledger and a read-only credential
refresh. A separate, revocable Shareable Link with no TTL is scoped to this exact
Dev alias and encrypted as `jetnity_dev_import_preview_share_v1`. The sender GETs
only that fixed host and stores no Vercel management API key. The share link grants
preview access, while application and import authority still require their own
checks. Its transport visibility has the same provider trust boundary as the cookie.

The actual pg_net probe followed the 307 to a 200 and retained the initial
Set-Cookie header. Renewal accepts only its own recent response and a single
bounded cookie whose decoded metadata names the exact alias, purpose and share
link. The permanent link's actual JWT has no `exp`; its use is therefore limited
locally to seven days after its `iat`. When `exp` is present, it must be numeric
and within that same maximum. The issue time must match the dispatch; the
effective use horizon must be over 24 hours away and newer than the current credential.
These are candidate checks, not JWT signature verification. Vercel independently
validates admission; only an HMAC-authenticated import response can prove source
publication. A writer of PUBLIC net responses can deny service but cannot forge
an import result.

The next renewal is due 24 hours before that candidate use horizon. Malformed, missing,
late or older responses retain the previous credential. Eight unsuccessful GETs
park renewal for review. `run_v1()` isolates operational renewal errors in a
subtransaction and still invokes the ordinary import gates with the existing
credential. An expired credential continues to stop import dispatch.

## Installation and activation

1. Review the complete runtime/SQL/test candidate and exact branch configuration.
   Require all existing CI gates and the matching Ready Preview deployment.
2. Provision the two Dev Vault entries and the branch-only Sensitive HMAC
   variable without writing credential values into Git, comments or evidence.
3. Call `official_v3_guard_private.assert_catalog_v1()` and record the current
   `catalog_status_v1()` hash. This checks the complete immutable successor
   chain, including the installed gap-recovery baseline; an older intermediate
   baseline alone is not the current catalog. Wrap `core.sql` in one transaction, setting
   `SET LOCAL jetnity.dev_import_target='dev:yfvbxvijcorffwxbxahl:refresh1'`.
   Recheck that assertion and unchanged current catalog in the same transaction before COMMIT. The new
   independent schema starts disabled; no source request is sent by installation.
4. Verify the deployed UI's normal source run. Preserve original request IDs
   when any outcome is unknown; do not repeat completed Owner approvals.
5. Set the exact target and `jetnity.dev_import_preview_expires` to the verified
   finite use horizon: the JWT's actual `exp`, or `iat + 7 days` for the observed
   permanent-link JWT without `exp`. Then execute `activate.sql`.
   It refuses an existing schedule instead of silently replacing it. It creates
   only `jetnity-ch-de-dev-import-v1`, checks its exact command/user/database,
   and enables the private state. Existing guard and cleanup schedules remain.
6. Observe actual cron dispatch, queued acknowledgement, fresh source work and
   signed publication. Compare the real visitor response/version/expiry and
   normal following BG1 full proof. The scheduled publication must renew the
   previously confirmed manual result. Verify its next due time precedes its
   actual expiry, plus the active cron, rolling quota and renewal configuration.
   This supports ‘first automatic follow-up confirmed’; a second observed
   automatic cycle or indefinite provider availability is not implied.
7. For recurring preview access, install `preview-renewal.sql` with the same
   catalog checks, provision the exact alias link in Vault, and run
   `activate-preview-renewal.sql`. It changes only this job's exact old command
   to `SELECT jetnity_dev_import_scheduler.run_v1();`, preserving its identity
   and history. Verify actual candidate renewal and a subsequent signed import.

## Reviewed rolling quota is required

The installed M04 model limits a subject to 64 STARTs and 256 queue operations
over its **entire lifetime**. These are not daily allowances. With the observed
initial 4 STARTs and 13 operations, a lifetime-only sender would fit at most 57
more single-START cycles with a four-START reserve: approximately 38 hours of
freshness at this cadence. That finite pilot was not sufficient for this task.

Activation therefore requires the separately reviewed
`official-truth-v3-rolling-jobs-quota-1` successor. The sender reads only
`official_v3_guard_private.ch_de_quota_v2()`, requires its exact `rolling_24h_v2`
model and valid clock, and retains a reserve of four STARTs and sixteen queue
operations before starting another cycle. Its getter already accounts for any
terminal operation credit. A missing successor, invalid clock or exhausted
window stops new dispatch. Admission itself remains enforced in the normal
database API and shared with manual source runs.

Lifetime counts and complete evidence remain append-only. No reset, new subject
key, method rotation or historical relabelling is used to evade a limit. Quota
and preview renewal remove the known fixed lifetime and link-expiry stops;
provider availability, method approval, normal guards and the measured history
capacity envelope still apply. No new paid scheduler, plan or archive is activated.

## Readback, failure and stop

Read `state_v1`, `cycles_v1`, `dispatches_v1` and this named job's
`cron.job_run_details`; never return Vault values or raw HTTP headers.
`transport_access_expired`, `daily_capacity_low`, `quota_state_unavailable`, `guard_not_current`, and
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
preserved, and the selector includes these files in its mandatory PG17 group.
The renewal proof executes the actual additive SQL with explicit synthetic
Vault/net providers, including malformed JWT payloads, exact scope and expiry,
retained IDs and counters, retry bounds, ACLs, and isolated provider failures.

The activation regression executes both complete activation files with explicit
synthetic cron APIs and extension-catalog prerequisites in the owned PG17 cluster.
It reproduces the former `job`/`cron.job` ambiguity (SQLSTATE 42702), verifies the
qualified readback, preserves the same cron identity through renewal activation,
and proves rollback leaves no enabled schedule, cycle, dispatch or HTTP request.
Wrong targets and short preview horizons remain refused. These fixtures prove
SQL behavior; the real installed extensions require the separate Dev transaction
probe and actual cron/publication readbacks recorded in PR #1197.
