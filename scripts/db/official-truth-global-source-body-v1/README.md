# Dev-only bounded government source body snapshots (Official Truth)

**Date:** 18 November 2026. **Scope:** supplement the private 206×50 research queue in [PR #1228](https://github.com/Jetnity/jetnity/pull/1228) and the model quarantine in [PR #1234](https://github.com/Jetnity/jetnity/pull/1234). This is **not** a legal fact validator, a model connection or a release.

## Confirmed blocking gap

The 10-country research monitors already track real HTTP source results and bytewise SHA-256. But after their *first* original HTML body, many subsequent changed observations contain **only** the hash and size. Those receipts cannot safely support a later semantic OpenAI/Grok before/after analysis without the exact later original. Supabase [pg_net](https://supabase.com/docs/guides/database/extensions/pg_net) by default retains HTTP response bodies only six hours, in an unlogged table; so this body cannot be reconstructed later from the SHA.

Read-only Dev diagnostic on 18 November: several UK, Thai, Turkish, UAE, French, Italian and Portuguese pages produced new raw SHA values almost every monitored batch, while the Spanish and Turkish e-visa pages often stayed bytewise constant. A changed HTML hash is **not** proof that immigration law changed. Some Greek/US source responses returned 403 and are excluded.

## Exact bounded solution

`dev-install.sql` is an atomic, **Dev-only**, exact-predecessor checked PG17 installation that adds a separate postgres-only, forced-RLS, immutable table `jetnity_source_body_private.changed_originals_v1`. It reuses the **existing** six-country and IT/FR/ES/PT HTTP response request IDs; it does **not** issue any new HTTP request. The original existing first-snapshot archives stay unchanged. Only later monitor observations with `changed_unqualified_snapshot` or `changed_requires_review` are eligible, and only if an existing pg_net response is present, HTTP 200, valid HTML, not an error/bot page, and its actual UTF-8 bytes and SHA-256 **exactly** match the previously stored monitor receipt. An unmatched or expired response cannot create a snapshot.

Per source, at most **one immutable example per UTC day** is stored. Strict limits: **max 96 snapshots total, 16 MiB total uncompressed raw HTML, 256 KiB per response**; once at capacity the capture function stops and the source remains not yet semantically verified. Same-day subsequent changes are **unsampled** unless the latest source SHA exactly matches an existing stored sample. These are intentional pilot limits, **not** claims of full change-history coverage. The underlying observation and digest history remains append-only in its existing monitor.

No new Cron job: the existing 5-minute private queue job is changed only from `capture_all_v2()` to `jetnity_source_body_private.capture_all_v1()`, which calls that original collector and then the restricted raw-snapshot sample collector. The actual 50-minute-or-longer government HTTP spacing is unchanged. All rows are `UNQUALIFIED_RESEARCH_SNAPSHOT` with `primary_rule_qualified=false`, `legal_fact_approved=false`, `public_publish_allowed=false`. No API, account data, traveler information, new roles, provider, secret, xAI/OpenAI API call or production change.

## Acceptance and limitations

A full **transactional Dev PG17 rehearsal** must pass and end in ROLLBACK before the exact SQL can be installed. Then read back BG1 current, 206×50 Research-only pairs unchanged, zero accepted new rules, existing background queue unchanged except its command, immutable source table and post-install cron runs. Also verify that `anon`, `authenticated` and `service_role` have no private read or schema usage, and that all stored sha/byte lengths match their immutable source observations.

A changed snapshot is only *unqualified material for future human or AI research*, not an official determination. Future full-fidelity semantic comparison/retention requires a separately approved storage policy and trained source-bound validator. Insufficient samples, HTTP 403, stale sources, unsupported source formats and model inconsistencies remain **unavailable**, not visa-exempt. Production, merges, more storage, real model calls and any cost increase remain Owner-gated.
