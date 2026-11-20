# Official Truth: Dev-only source evidence capacity V2 (launch pilot)

**19 November 2026 — Dev-only design, tested first as an actual rollback.** Follows the verified Dev-only append-only original snapshot collector [#1236](https://github.com/Jetnity/jetnity/pull/1236). Does not replace that version, change any protected Official Truth rule, or publish any customer-facing advice.

## Why extend the initial pilot?

On 18 November, the private collector had **11** immutable changed-body samples from 11 government source pages, with **987,372** raw bytes total; all 11 hashes/byte sizes matched their original monitor observations, BG1 stayed current, and zero new rules were published. It was limited to **96 total samples** (16 MiB raw). One per source and UTC day, 11 sources/day would hit 96 after approximately **eight to nine collecting days**, before Jetnity's intended November 30 launch. This is a capacity forecast, not an observed failure. Source-change digests still continue to be monitored even when body capture stops.

## Bounded V2 successor

`capacity-v2-dev.sql` is a single **atomic** transaction with an exact target GUC for **Supabase Dev only** and a fixed **PG17/postgres/BG1-current** predecessor. It pins the actual, already installed V1 code definitions by their existing `pg_get_functiondef` MD5 hashes; does not change them.

It creates two **additional** postgres-owned `SECURITY INVOKER` functions in the existing **private** schema:
- `capture_changed_v2()`: the complete V1 collection logic is preserved byte-for-byte **except** that maximum total samples becomes **256** and maximum raw body bytes becomes **32 MiB** (33,554,432 bytes), and it fails closed once the **whole Dev PostgreSQL database** reaches **256 MiB** (268,435,456 bytes). The existing 256 KiB per-response cap and one-per-source-per-day UTC uniqueness are unchanged.
- `capture_all_v2()`: the same existing review queue `jetnity_global_review_private.capture_all_v2()` followed by the new bounded capture. The existing single 5-minute private job is adjusted via `cron.alter_job`; **no new cron** and **no new official government HTTP call**. The existing source monitor requests remain rate-limited as previously.

The original table, all its immutable records, the two immutable row/truncate triggers, source original archives, the old functions, MA1/BG1 catalog and existing roles stay **unmodified**. Before and after, verify exact row/byte bounds, forced RLS, no public/anon/authenticated/service-role private schema privileges, no positive research publications, and BG1 `current`. If an invariant fails, the entire installation rolls back.

**Capacity is not infinite**: 256 rows/32 MiB and 256 MiB total DB ceiling stop later capture, rather than silently altering or overwriting the append-only record history. This is still a short-term pilot. Durable long-term storage policy, cost/usage monitoring, full source version history and actual legal AI/Owner qualification require separate decisions. We are not claiming the quota is gratis on every Supabase subscription or sufficient under every future source-change rate.

## Verification and production boundary

- **True PostgreSQL 17 Dev rehearsal (ROLLBACK):** the entire exact installer was executed in one transaction, changed the private cron command only inside that transaction and observed 11 preserved samples/987,372 bytes with BG1 `current`. No change from the rehearsal was committed.
- Required next validation: full **CI 12/12 green**, native immutable negative cases, exact original-table readback, and first natural scheduled 5-minute follow-up in Dev. A CI green result does not authorize a merge.
- **No Production apply**, no purchased quota/IPv4/add-on, no model key/call, no owner login, no Vercel API change and no automatic publication. This PR must remain stacked on #1236 until the Owner authorizes release in dependency order.

The end-to-end API-based, legally qualified OpenAI/Grok analysis remains a different future gate under [#1232](https://github.com/Jetnity/jetnity/issues/1232); snapshot capacity is only research retention.
