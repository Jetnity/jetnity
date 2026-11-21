# Supabase-Dev-Sequenz: vorbereitete Supportanfrage

**Status:** Vollständig vorbereitet, noch nicht gesendet. Das Senden an Supabase benötigt Sasas ausdrückliches Go für diese externe Nachricht. Die Dev-Rechtekorrektur selbst ist bereits freigegeben; fehlend ist die technisch verfügbare Provider-Berechtigung.

**Empfänger:** Supabase Support über https://supabase.com/support  
**Projekt:** Jetnity Development, `yfvbxvijcorffwxbxahl`  
**Betreff:** Dev-only: provider-owned pg_net sequence fell behind immutable request IDs; supported transactional repair needed

## Sendefertiger Text

Hello Supabase Support,

Please help us establish a supported maintenance path for **Development project `yfvbxvijcorffwxbxahl` only**. No Production access or changes are authorized by this request.

We run PostgreSQL 17 with `pg_net 0.20.4`. Our durable application journals preserve immutable HTTP request identities. After a reported Dev database restart, we observed the pg_net sequence below existing historical reservations:

- Database start observed: 2026-11-21 13:01:42.863753 UTC.
- At 13:42:18 UTC, `net.http_request_queue_id_seq` was 20 / `is_called=true`, while the highest reserved ID across the 16 inventoried bigint consumer columns was 1800.
- At 14:01:09 and 14:04:27 UTC, the live sequence was 23 / `is_called=true`.
- The sequence has `relpersistence='u'` (UNLOGGED), increment 1, cache 1, no cycle, bigint range.
- Both the sequence and its dependent `net.http_request_queue.id` table belong to `supabase_admin`; the sequence has the normal `OWNED BY` dependency.
- Our caller is `current_user=session_user=postgres`, with CREATEROLE but not SUPERUSER. It already has sequence USAGE and UPDATE, but no MEMBER/USAGE/SET authority over `supabase_admin`. The existing `supabase_privileged_role` membership does not authorize the attempted sequence DDL.
- Both the initial `ALTER SEQUENCE ... INCREMENT BY 1` barrier and the subsequent separately authorized `ALTER SEQUENCE ... OWNER TO postgres` probe were rejected with SQLSTATE **42501**, `must be owner of sequence http_request_queue_id_seq`.
- No role/ACL/owner or sequence repair was committed. Independent readback confirmed the same protected catalog, exact role memberships, original source archives and fact-history hash.

The owner has authorized the necessary Dev permissions and repair. We understand that `supabase_admin` is a reserved provider role and that per-project modifications to pg_net grants are not supported. **We are not asking for blanket superuser membership or for security controls to be bypassed.**

Please provide a supported, narrowly scoped Dev maintenance proposal that allows the following:

1. Re-read the exact live sequence parameters and the complete durable ID-consumer inventory.
2. Take a global sequence lock **before** reading the sequence value or historical high-water marks; use READ COMMITTED and bounded lock/statement timeouts.
3. Prove a real SAVEPOINT-based transactional `ALTER SEQUENCE ... RESTART WITH` and rollback, verifying restoration of sequence value, `is_called`, parameters, relfilenode, ownership/ACL/dependencies and protected application state.
4. Separately commit the same reviewed strictly forward-only correction above all current reserved IDs, with independent postchecks and a regular real HTTP source batch.
5. Explain and address the recurrence risk of the UNLOGGED generator. The observed restart correlation is not proof of the exact restart cause; a one-time numerical alignment does not establish crash durability.

Please return the exact supported proposal before performing any provider-side changes. We can then review it against the existing source-integrity safeguards and prepare a provider-role-specific execution script. The current Dev candidate files intentionally require `current_user=session_user=postgres`; they must **not** be executed unchanged as `supabase_admin`.

Please preserve all durable request journals, original archives, facts, owner receipts and cron configuration. Do not drop/recreate pg_net, reset the database, delete historical IDs, use nontransactional `setval` as a claimed rollback substitute, or touch Production. No paid service change is authorized.

### Complete observed ID-consumer set

```text
jetnity_dev_import_scheduler.dispatches_v1.net_request_id
jetnity_dev_import_scheduler.preview_dispatches_v1.net_request_id
jetnity_followup_source_monitor_private.items_v1.request_id
jetnity_followup_source_monitor_private.items_v2.pgnet_request_id
jetnity_followup_source_monitor_private.items_v3.request_id
jetnity_global_source_monitor_private.requests_v1.request_id
jetnity_source_dispatch_private.requests_v1.request_id
jetnity_source_dispatch_private.observations_v1.request_id
jetnity_usagov_fallback_private.original_v1.request_id
jetnity_usagov_watch_private.requests_v1.request_id
jetnity_usagov_watch_private.observations_v1.request_id
official_v3_at_source_watch_private.reads_v1.request_id
official_v3_source_renewal_private.observations_v1.request_id
supabase_functions.hooks.request_id
net._http_response.id
net.http_request_queue.id
```

There are 14 durable application/webhook columns plus the two volatile pg_net stores. Historical values are evidence only; never hard-code 1800 into the repair.

### Evidence available

- Previous reviewed package and exact source/history proofs: commit `fe5d52ec1b63b05f200eb23631a1837d166b9576` in https://github.com/Jetnity/jetnity.
- New direct authority inventory, failed owner-transfer probe and independent readback: `docs/evidence/official-truth-renewal-20261121/dev-sequence-owner-authority-20261121.json`.
- Exact rollback-only owner probe: `scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-pgnet-owner-transfer-authority.ROLLBACK.sql`.
- Existing guarded Dev rehearsal/commit candidates and immutable original failed rehearsal are linked in `docs/OFFICIAL_TRUTH_PRODUCTION_REVIEW_PACKAGE_2026-11-21.md`.

No passwords, tokens, request headers, personal records or database credentials are included in this request.

Thank you,
Jetnity

## Dokumentationsgrundlage

- [Supabase: reservierte Administratorrolle und Grenzen von postgres](https://supabase.com/kb/troubleshooting/cant-revoke-a-role-membership-granted-by-supabase_admin-d08922)
- [Supabase: providerverwaltete pg_net-Objekte und Grant-Grenzen](https://supabase.com/kb/troubleshooting/revoking-access-to-pg_net-objects-has-no-effect-0bbc16)
- [PostgreSQL 17: ALTER SEQUENCE](https://www.postgresql.org/docs/17/sql-altersequence.html)
- [PostgreSQL 17: UNLOGGED-Sequenzen](https://www.postgresql.org/docs/17/sql-createsequence.html)

## Vor dem späteren Senden

Die feste Dev-Ref und die drei genannten Belegdateien mit dem aktuellen Commit verknüpfen. Anfrage nur nach Owner-Go senden. Die Antwort von Supabase ist zunächst ein technischer Vorschlag, noch kein erfolgreich ausgeführter Reparatur-/Rollbackbeleg. Production bleibt ausgeschlossen.
