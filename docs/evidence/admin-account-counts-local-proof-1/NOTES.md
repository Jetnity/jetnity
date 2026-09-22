# Admin account counts local proof 1 — evidence notes

- Command: `node scripts/db/admin-account-counts-1-local-proof.mjs`
- Runner safety: `node --test scripts/db/admin-account-counts-1-local-proof.test.mjs`
- Local PostgreSQL 16.15 via a private `initdb` cluster and unix socket owned by this run.
- System cluster `16/main` existed as `down` and was never started or queried.
- No `scripts/db/sql.mjs`, no remote DSN, no Production/Preview/Development apply.
- Fixture `auth.users` matches TL 2026-09-22 metadata types/nullability. `#494` `id`-only users cannot prove this contract.
- Authorization helpers are extracted from `20260817100000_rollenmodell.sql`, `20260817120300_generisches_profil.sql`, and `20260827170000_admin_aal2_data_plane_alignment.sql`.
- Candidate remains outside `supabase/migrations/`.
- Proof log: `proof-run.txt`. Hashes: `hashes.json`.
