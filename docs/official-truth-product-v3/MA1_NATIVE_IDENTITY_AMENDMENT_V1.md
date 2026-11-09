# MA1 native identity amendment V1

Root / Technical Lead, 9 November 2026. **ISSUED: bounded correction to the native test acquisition order in accepted PLAN V2.** TASK V1, runtime port, security boundaries and all Owner gates remain unchanged. This is not implementation/native acceptance. Published documentation base at issuance: `4371024788442b0edb83d8600135d5095f61fa0b`.

## Source finding and independent verification

Native adapter snapshot `b5cd2f32991b45793d1f3c26ee5b73565b78e0397cd5a73d3beba892adbbbe2a` sets the assigned reader role before reading its own `backend_start` from `pg_stat_activity`. The genuine session login is a different restricted role. The same ordering appears in the human/reader setup in `native.ts`.

The independent source reviewer found that PostgreSQL16.15 checks statistics visibility using the effective current role, while backend ownership records the session login. Root independently read the relevant five source files and membership direction: the assigned role does not inherit the genuine login, so the birth value is hidden after the role switch. A normal reader therefore fails identity admission and poisons the fixture before real method reads. This is **MA1-NATIVE-P2-3, CHANGES REQUIRED**, established from source, not from a native execution.

Exact PostgreSQL source pins read by Root:

| Source | SHA256 |
| --- | --- |
| `src/backend/utils/adt/pgstatfuncs.c` | `f96e2c795441fb60e2174f00e438225e70bb49fff8d7266bbf575682bc588b35` |
| `src/backend/utils/activity/backend_status.c` | `349e47e29e314b6949e6c86ee4f7c190f839b99a4da48eed559ea507e240e3c4` |
| `src/backend/utils/adt/acl.c` | `d7022b114917f95e3d249e374f211d6bc14db68be8bcb1708ef032103377512c` |
| `src/backend/utils/init/miscinit.c` | `556e72104ec6b03446e4c333c0c89f005b7138c59430763ea3a2e993339b0588` |
| `src/backend/catalog/system_views.sql` | `1c47b3f1172e7ff8a0736d6747cd4487a3e970cc8f437705b1484baf2aae29e0` |

Source-evidence receipt SHA256: `3906d0449d6396c4ae88152ed55ad1c59002b70efe66f3ae73b02c125ce43d62`. The local source excerpts were read only; no PostgreSQL binary, SQL, socket or hosted target was executed.

## Exact correction and finite allowance

The same primary author `/root/v3_method_authority_writer` corrects only the new native adapter and fixture/acceptance code, preserving all earlier source/failure evidence:

1. On the actual genuine restricted login connection, capture its own exact PID and backend_start **before** SET ROLE. Assert the initial session_user and current_user are the expected genuine login.
2. Select only the already assigned fixed authenticated or ot_v3_method_reader role.
3. On that same connection, use a fixed query to assert the same PID, unchanged genuine session_user and exact assigned current_user. Do not depend on the now-hidden statistics birth column for this post-role check. Retain the previously captured birth as that connection's identity.
4. Check abort/poison after each joined acquisition/setup/identity/role statement. No authority SELECT may run before complete identity/role proof. Unknown/failed identity and other fatal setup failures retain the planned visible owned-stop and primitive-join path. Normal terminal proof still requires both target and control disappearance or the explicitly failed stopped-cluster alternative.

This replaces the impossible role-before-birth order in PLAN V2 section7 step2 and the analogous fixture setup in section9. The finite per-call inventory permits **one additional fixed post-role identity check**: one control identity query, one target pre-role identity query and one same-PID/role confirmation. Connection count, four-context cap, no authority queue, positive deadline, cancellation command, twenty paired-absence observations, cleanup lane and existing failure/teardown budgets are unchanged. No new driver, pool, transport or executor authority is added.

No `pg_read_all_stats` grant, reverse membership, broader ACL, altered role attribute, shared helper/driver change, privileged runtime impersonation or permission workaround is permitted. The purpose is to exercise the already authorized genuine restricted identities accurately.

## Acceptance

Root reviews the exact source correction. Mandatory CI must then prove successful real restricted resolve/reproof, actual child restart and fresh reads, human and machine negative privileges, lock identities and both-backend cleanup. Source reasoning alone does not close native acceptance. Any failure returns to this same author/session and requires renewed exact-head gates.

The previous local native/socket refusal is not retried. The specific #917 refusal is not retried or substituted. No hosted DB/Auth/RLS/ACL/migration/credential, real source, public route, scheduler, cost or production action is authorized. Real method remains NOT_APPROVED, Dev remains NOT_RELEASE_READY, and explicit current-main integration remains required before Ready/merge.
