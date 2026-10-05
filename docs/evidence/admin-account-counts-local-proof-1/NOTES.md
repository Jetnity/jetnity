# Admin account counts local proof 1 — evidence notes

- Command: `node scripts/db/admin-account-counts-1-local-proof.mjs` → 56/56 PASS
- Runner safety: `node --test scripts/db/admin-account-counts-1-local-proof.test.mjs` → 10/10 PASS
- Local PostgreSQL 16.15 via a private `initdb` cluster and unix socket owned by this run.
- System cluster `16/main` was never started or queried.
- No `scripts/db/sql.mjs`, no remote DSN, no Production/Preview/Development apply. This writer did not query Production.
- TL 2026-09-22 Production metadata (review 5282427169) was used only as fixture-design evidence for RLS-on/default-deny `auth.users`, distinct owner `supabase_auth_admin`, and trusted `postgres` NOSUPERUSER+BYPASSRLS.
- Authorization helpers are extracted from `20260817100000_rollenmodell.sql`, `20260817120300_generisches_profil.sql`, and `20260827170000_admin_aal2_data_plane_alignment.sql`.
- Candidate remains outside `supabase/migrations/`. No new BYPASSRLS role and no client `auth.users` SELECT in the candidate.
- Assertion categories are mixed: executed SQL (`auth-sql`, `lifecycle-sql`, `window-sql`, `zero-vs-deny-sql`, `rls-sql`), catalog/source, and Node lifecycle (`psqlrc-node`, `cleanup-node`, runner tests). Do not relabel all as SQL permission assertions.
- Proof log: `proof-run.txt`. Hashes: `hashes.json`.
- Previous frozen head `9219e31e` is historical after R1–R4.
