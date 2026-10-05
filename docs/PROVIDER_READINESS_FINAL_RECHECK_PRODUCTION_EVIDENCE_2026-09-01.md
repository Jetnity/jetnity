# Provider Readiness Final Recheck – Production Evidence

Stand: 1. September 2026  
Status: **READ-ONLY PRODUCTION EVIDENCE / NO MUTATION / NO PROVIDER ACTIVATION**

Baseline repository: `main@a64fb13fb2a2078e95a41354cdbb9e88e37f4f18`  
Supabase project: `qscbgcdmivbbnzrcyegn`

## 1. Supabase project

Live connector evidence:

- name: `Jetnity's Project`;
- status: `ACTIVE_HEALTHY`;
- region: `eu-central-2`;
- PostgreSQL engine: 17;
- reported database version: `17.6.1.003`.

All SQL in this recheck was SELECT/catalog inspection only.

## 2. Commercial Provenance persistence

### Relation

`public.trip_item_commercial_provenance`

Verified:

- relation exists;
- RLS = enabled;
- migration `20260829140000` / `trip_item_commercial_provenance` present in Production migration history;
- current row count = **0**.

### Table grants

Verified effective grants from `information_schema.role_table_grants`:

- `authenticated`: SELECT;
- `postgres`: owner/administrative table privileges.

No INSERT/UPDATE/DELETE table grant was found for `authenticated`.

### RLS policy

Policy:

`trip_item_commercial_provenance_lesen`

- command: SELECT;
- role: `authenticated`;
- checks `user_id = auth.uid()`;
- additionally requires matching owned `trip_items` row and matching `trip_id`.

### Internal writer

Function:

`jetnity_internal.trip_item_commercial_provenance_schreiben(_eingabe jsonb)`

Verified:

- SECURITY DEFINER;
- EXECUTE granted to `postgres` and `jetnity_commercial_writer` only;
- no EXECUTE grant to `anon` or `authenticated` surfaced in the live routine privilege check.

### Capability roles

- `jetnity_commercial_writer`: NOLOGIN, INHERIT, no BYPASSRLS;
- `jetnity_commercial_runtime`: NOLOGIN, NOINHERIT, no BYPASSRLS;
- `jetnity_commercial_runtime` is a member of `jetnity_commercial_writer`;
- no real login/runtime principal was found in the Jetnity/provider role audit.

Conclusion:

> S5-B persistence is applied and ownership-protected, but no real runtime login principal is allocated and no Commercial Truth row exists.

## 3. S6-A Production state

Repository migration:

`supabase/migrations/20260901020000_provider_cost_guard_s6a.sql`

Production catalog/history verification returned **ABSENT** for:

- `jetnity_internal.provider_cost_guard_runtime_gate`;
- `jetnity_internal.provider_cost_guard_policy`;
- `jetnity_internal.provider_cost_guard_reservation`;
- `jetnity_internal.provider_cost_guard_reservieren(jsonb)`;
- role `jetnity_provider_cost_guard_writer`;
- migration version `20260901020000`.

Conclusion:

> Production S6 remains genuinely UNAPPLIED/HARD-OFF. The repository closure statement is live-confirmed.

## 4. Flight Production hard-off

Current repository `lib/flights/zustand.ts` independently enforces:

- Production always inactive through shared Provider Ops state logic;
- explicit `JETNITY_FLIGHT_AKTIV` flag required outside Production;
- only a server-side Duffel token with `duffel_test_` prefix is accepted by the current development path;
- a live Duffel token cannot activate the existing development adapter path.

Therefore existing Production credential presence alone cannot silently activate the current Flight search path.

## 5. What was not inspected

This audit intentionally did not read secret values and did not mutate Vercel/Supabase configuration.

It does not claim that no unrelated secret name exists in hosting configuration. That is unnecessary for the current activation truth because the current Flight Production state is hard-off in code and S6 Production objects/runtime allocation are absent.

## 6. Production verdict

| Area | State |
| --- | --- |
| S5-B relation | APPLIED |
| S5-B RLS | ENABLED |
| Commercial rows | 0 |
| normal authenticated write | NOT GRANTED |
| internal commercial writer contract | EXISTS |
| real commercial login principal | NOT ALLOCATED |
| S6-A Production migration | NOT APPLIED |
| S6 persistent runtime | NOT ALLOCATED |
| S6 HMAC/live budget | NOT ACTIVATED |
| current Flight Production path | HARD-OFF |
| real provider | NOT ACTIVE |

**NO PRODUCTION WRITE WAS PERFORMED BY THIS RECHECK.**
