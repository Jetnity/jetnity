# Admin account counts HTTP proof 1 — evidence notes

- Command: `node --import tsx scripts/db/admin-account-counts-http-proof-1.mjs` → **38/38 PASS**, exit 0
- Runner safety: `node --import tsx --test scripts/db/admin-account-counts-http-proof-1.test.mjs` → **8/8 PASS**, exit 0
- Engine: private `initdb` PostgreSQL **17.11** (PGDG), unix socket only. System `17/main` remained **down** and unused.
- HTTP: official PostgREST **16.3** linux-static-x86-64, `server-host=127.0.0.1`, `/proc/net/tcp` local-address `0100007F` only. 29 bounded loopback requests.
- JWT: per-run HS256 signing material in a 0600 file. Raw JWTs, secrets and connection URIs are not in this evidence.
- Inherited `SUPABASE_*` / `NEXT_PUBLIC_SUPABASE_*` / `PG*` were rejected or stripped. No `scripts/db/sql.mjs`, no hosted project, no real account.
- Examined snapshot **dcf7bfee**. Source hashes matched the task pins. Observed #553 head `f9a41701` was reported as drift and not imported.
- Assertion categories are mixed. Do not relabel all as SQL, parser, or Production E2E.

| Category | Count | Kind |
| --- | --- | --- |
| `http-isolation` | 1 | loopback bind |
| `http-auth` | 5 | real JWT + wrapper + frozen parser |
| `http-deny` | 15 | real JWT/signature/role denials |
| `http-shape` | 3 | POST/GET/extra-args |
| `http-schema` | 4 | unexposed schema/table/function |
| `http-schema-cache` | 1 | missing wrapper after reload |
| `http-large-transport` | 1 | disposable TEXT bigint fixture |
| `parser` | 2 | frozen parser on HTTP/synthetic shapes |
| `sql-catalog` | 2 | producer intact; grants not widened |
| `static-source` | 3 | source scans |
| `cleanup-node` | 1 | owned stop + directory removal |
| runner-safety Node tests | 8 | env reject, loopback config, hash fail-closed |

- Primary fixture: present=`10`, window=`0` (genuine zero window). Labelled recent insert: present=`11`, window=`1`.
- Distinct denial classes recorded: HTTP 403/`42501`, 401/`42501`, 401/`PGRST301`, 401/`PGRST303`.
- Cleanup report `httpStopped=false` is a conservative `/proc/<pid>/comm` field. After the run: no leftover `postgrest` process, no leftover `/tmp/jetnity-admin-account-counts-http-1-*` dirs, system `17/main` still down.
- Not GoTrue/login/MFA/browser/Production E2E. Not Guardian. Not an acceptance of #553 residual R1.
