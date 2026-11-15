# Production CH→DE import schedule — prepared, not activated

This package prepares normal recurring source work on `jetnity.com`. It grants
no Production execution, merge, #1198 or new-cost approval. The existing Dev
route, scheduler, preview renewal and keys remain byte-identical.

## Fixed contract

| Item | Production value |
| --- | --- |
| Database | `qscbgcdmivbbnzrcyegn`, database `postgres`, PostgreSQL 17 |
| Runtime | Fixed Jetnity Vercel project, repository `Jetnity/jetnity`, `production`, branch `main` |
| Ingress | `POST https://jetnity.com/api/internal/readiness/ch-de-prod-refresh` |
| Environment key | `JETNITY_PROD_IMPORT_CRON_SECRET` |
| Vault name | `jetnity_prod_import_cron_v1` |
| Installation/activation marker | `jetnity.prod_import_target=production:qscbgcdmivbbnzrcyegn:refresh1` |
| Private state | `jetnity_prod_import_scheduler` |
| Import cron | `jetnity-ch-de-prod-import-v1`, `* * * * *`, `SELECT jetnity_prod_import_scheduler.tick_v1();` |
| Source cycle | 40 minutes from the original cycle creation, continuation every minute |
| Independent observer | `.github/workflows/official-truth-production-import-monitor.yml` |
| Monitor approval variable | `JETNITY_PRODUCTION_IMPORT_MONITOR=production:qscbgcdmivbbnzrcyegn:enabled-v1` |
| Monitor public-key variable | `JETNITY_PROD_SUPABASE_PUBLISHABLE_KEY`, modern `sb_publishable_…` only |

The shared runtime still requires the genuine current human method approval,
source evidence, original queue claim, rolling quota, BG1 and accepted
publication path. The fixed CH→DE key is
`research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513`.
The 206-target research remains `RESEARCH_ONLY`; this package cannot select it.

The new route accepts no cookie, Vercel share/bypass header, query parameter,
alternate hostname, Dev target, Dev secret or Dev MAC domain. Its strict
256-byte schema2 body accepts only the existing canonical owner encoding or
PostgreSQL's exact JSONB encoding. Original request and lease IDs are persisted
before `pg_net` can send after COMMIT. HMAC-SHA256 binds the separate Production
domain, method, path, timestamp, schema, phase and both IDs. Admission is valid
for 120 seconds with at most 5 seconds future skew, rechecked after method
resolution. Response MACs bind the same original dispatch plus HTTP status,
response schema/status and publication count. The persistent key never enters
the public `net` queue or response table.

Only a verified positive `published` response in the resume phase ends a cycle.
Unknown, lost ACK, complete-zero and provider errors keep the original IDs and
phase. A signed queued response advances that same request to resume. Eight
attempts per phase or 25 minutes park the original cycle and raise an operator
alarm; no replacement ID is minted to conceal failure. Protected 5-second CAS,
30-second work, method, source, lease and projection-expiry limits are unchanged.
The genuine `rolling_24h_v2` getter supplies 64 STARTs/256 queue operations per
24 hours, with the existing terminal reservation. A new cycle requires at
least 4 STARTs/16 operations remaining. No counter reset, GC or lifetime-history
claim is introduced. Append-only audit cost still grows and remains observable.

## Provider evidence and installation order

Production readback on 2026-11-15 showed `pg_cron 1.6.4`, Vault `0.3.1`, and
`pgcrypto 1.3`; `pg_net` and the `net` schema were absent. The available pg_net
version is `0.19.5`. Its code was read at
[supabase/pg_net v0.19.5, a7792bfd](https://github.com/supabase/pg_net/tree/a7792bfd913c7859e14025d606624982706c2a7f).
The `http_post(text,jsonb,jsonb,jsonb,integer)` signature, JSONB-to-UTF8 body and
response columns match this sender. `pg_net` is already preloaded and targets
`postgres`; worker liveness is checked after installation before activation.

After separate Production approval and a fresh readback, apply the exact reviewed
artifacts in this order:

1. `provider-prerequisites.sql`: install only the previously absent pg_net
   `0.19.5` into `extensions`, then verify its exact API. It never drops or
   replaces another installation. No HTTP request or cron is created.
2. Install `core.sql` and `monitoring.sql` with the fixed target marker in one
   transaction. State starts disabled. These files call neither BG1 nor the
   quota getter and are installable before those packages exist.
3. Execute the separate reviewed Production `install-and-start-guard.sql`
   bundle once. It installs core/BG1/status/rolling quota, creates the guard
   cron and performs a genuine first full audit atomically. **The new monitoring RPC/anon ACL must precede its fresh BG1
   baseline**, so that the new role-dependency edge is captured normally.
   No existing protected catalog is widened or drift exemption added.
4. Verify that actual first generation is current; do not run a second guard
   activation. Perform the genuine Owner/AAL2 method approval and first ordinary
   source/import acceptance on the Production runtime.
5. Provision a new independent high-entropy signing key, with identical bytes
   in the Production Vercel environment and the one named Vault secret. Never
   copy the Dev key or preview credentials. Redeploy through the normal reviewed
   release path when the environment changes.
6. Execute the full `activate.sql` inside a controlled rollback preflight first;
   inspect the exact job, enabled state and zero dispatches; roll it back.
   Then execute the same approved file normally. It creates/re-enables only
   its exact named job and never changes an unrelated cron or original ledger.
7. Observe the actual signed queued→resume→published chain, one normal new job,
   fresh real visitor response and following normal BG1. Use `readback.sql`
   without request bodies, headers or secret values. Check the next due time
   against the actual visitor `expiresAt`.
8. Only after these gates, arm the independent monitor with the two repository
   variables. Run its manual `alarm_delivery_probe=true` once to verify the
   existing failed-Actions-run channel and the owner's notification settings,
   then run the ordinary check and confirm recovery. No notification or probe
   is sent by preparing this package.

## Independent monitoring and operating limits

`public.jetnity_production_import_status_v1()` is argument-free and read-only.
Only anon EXECUTE is added; no table permission or key is exposed. The exact DTO
is `{schema:1,status:current|unavailable,nextDueAt:epochMilliseconds|null}`.
It requires an enabled exact cron, a tick observation at most 3 minutes old,
remaining rolling reserve, no parked or over-10-minute original cycle, genuine
current BG1 and a signed publication whose original time determines the next
40-minute due date. Disabled, startup and unavailable states cannot claim current.

The external checker additionally reads the actual fixed public visitor POST.
It requires a non-synthetic CH→DE accepted result, a fresh server observation,
at least 15 minutes until actual expiry, and the next due time before expiry.
Both independent observations are collected even if one fails. Each network
read has a fixed 10-second deadline and byte limit; abort joins owned I/O.
No import key, service-role credential, session, SQL or source start is used.

The workflow is skipped/UNARMED until the exact variable is set. It additionally
requires the fixed public repository and `main`, uses the existing GitHub Actions
failure/check channel, and contains no Slack/email sender or paid monitoring
service. GitHub schedules are best-effort: delayed/missing workflow runs and
notification delivery need normal operator attention, not an availability
guarantee. A failed or absent observer must never be interpreted as current.

At five-minute cadence this adds 288 jobs/day, 8,640 per 30 days, with 17,280
bounded HTTP reads per 30 days (8,640 actual visitor invocations). Each job uses
at least one rounded runner-minute when billing applies. Planning at one to two
minutes per job gives 8,640–17,280 runner-minutes per 30 days; the configured
job timeout is two minutes, with actual provider metering decisive. Standard public-repository
GitHub-hosted runners are currently free; moving to a private repository disables
this job until a new cost decision. No artifacts, dependency installs or caches
are uploaded. Existing Supabase/Vercel usage still applies and must be checked
against the current paid/included allowances before arming.
References: [GitHub billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions),
[runner rounding](https://docs.github.com/en/billing/reference/actions-runner-pricing),
[schedule behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

Normal import volume is 36 cycles/day, 1,080 per 30 days; every minute adds
43,200 small DB scheduler ticks per 30 days. At least start+resume are two
HTTP calls/cycle; the unchanged resume pipeline may need more. Eight attempts
per each of two phases bound one cycle at 16 calls before parking. These counts
are usage estimates, not a claim of zero marginal provider cost.

## Stop / rollback

`deactivate.sql` disables only the exact import cron and sets enabled=false.
It retains cron identity, cycle IDs, dispatches, attempt counts, next due time,
keys and all protected history. It is usable even when BG1 or quota is closed.
The independent monitor then alarms; disarm its repository variable explicitly
for an approved prolonged stop. The normal guard cron keeps observing installed
packages. An already admitted request can still finish after stopping; use the
normal Owner method revocation for an authority stop. Do not reset quota or
erase/replace an unresolved cycle. Re-enabling resumes the same active original
request; a parked cycle requires explicit original-request review and does not
automatically receive another retry budget.

## Proof boundary

The native test executes the complete activation/deactivation SQL, real pgcrypto
HMACs and state transitions in an owned PostgreSQL 17 single-user cluster.
Vault, cron, pg_net, rolling readback and public BG status are explicit provider
models; it proves neither a hosted worker nor real source publication. The
separate Production installer test must verify the preinstalled monitoring ACL
under the actual full BG1 catalog. Source/queue/history behavior is covered by
the unchanged protected suites. Actual provider install, rollback preflight,
human approval, signed automatic publication, next normal BG1 and alert delivery
remain Production execution gates after user approval.
