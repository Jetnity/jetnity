# Admin account counts HTTP proof 1 — evidence notes

Historical 0109fce2 author observation (22 Sep 2026, before review 5284332971): 38/38 PASS with `httpStopped:false` still accepted as cleanup PASS, denials as any non-200, and `/auth/users` path probes labelled as schema unexposure. That receipt is dated evidence only and is **not** this rerun.

Historical `c9f5df59` (review 5284606563): H2/H3 and H1 listener/removal-gate accepted; residual H1-A waiter TDZ and H1-B post-spawn error-as-exit remained. That receipt is dated and is **not** this rerun.

This file records the residual H1-A/H1-B lifecycle rerun. Author mixed HTTP proof stays 46/46 + 1 observation / 34 requests. That is not TL's 88 pure-helper checks or four lifecycle probes.

- Command: `node --import tsx scripts/db/admin-account-counts-http-proof-1.mjs` → **46/46 PASS**, 1 observation, exit 0
- Runner safety / fault controls: `node --import tsx --test scripts/db/admin-account-counts-http-proof-1.test.mjs` → **21/21 PASS**, exit 0
- Engine: private `initdb` PostgreSQL **17.11** (PGDG), unix socket only. System `17/main` remained **down** and unused.
- HTTP: official PostgREST **16.3** linux-static-x86-64, `server-host=127.0.0.1`, owned pid `/proc/<pid>/fd` inode matched `/proc/net/tcp` LISTEN `0A` on `0100007F`. 34 bounded loopback requests.
- JWT: per-run HS256 signing material in a 0600 file. Tamper XORs the first signature byte. Raw JWTs, secrets and connection URIs are not in this evidence.
- Inherited `SUPABASE_*` / `NEXT_PUBLIC_SUPABASE_*` / `PG*` were rejected or stripped. No `scripts/db/sql.mjs`, no hosted project, no real account.
- Examined snapshot **dcf7bfee**. Source hashes matched the task pins and were byte-identical on accepted main `72291ee6`. The experiment was not retargeted to the working-tree loader.
- #553 is CLOSED / MERGED / POST-MERGE VERIFIED (`f9a41701` / closure `5784907079`). This evidence does not activate counts remotely.

| Category | Count | Kind |
| --- | --- | --- |
| `http-isolation` | 1 | owned pid + LISTEN `0A` loopback |
| `http-auth` | 5 | real JWT + wrapper + frozen parser |
| `http-deny` | 16 | exact 403/42501, 401/42501, 401/PGRST301, 401/PGRST303 |
| `http-shape` | 2 | GET `{}` / extra-args 404/PGRST202 |
| `http-schema-profile` | 4 | Accept-Profile / Content-Profile; 406/PGRST106 + public 200 |
| `http-route-shape` | 4 | labelled invalid path / missing public table/function |
| `http-schema-cache` | 1 | drop → waited for 404/PGRST202 |
| `http-large-transport` | 1 | disposable TEXT bigint fixture |
| `parser` | 2 | frozen parser on HTTP/synthetic shapes |
| `sql-catalog` | 6 | before/after definition/owner/ACL/RLS; allowed authenticator only |
| `static-source` | 3 | source scans |
| `cleanup-node` | 1 | `httpStopped:true` and `httpReaped:true` required before removal |
| `http-observation` | 1 | separate clocks; **not** an assertion |
| runner-safety Node tests | 21 | isolation + H1/H2/H3 + residual H1-A/H1-B |

- Primary fixture: present=`10`, window=`0` (genuine zero window). Labelled recent insert: present=`11`, window=`1`.
- Denied classes recorded: HTTP 403/`42501`, 401/`42501`, 401/`PGRST301`, 401/`PGRST303`. Excluded schemas: 406/`PGRST106`.
- Cleanup (normal run): SIGTERM reaped the owned child; directory removed only after `httpStopped:true`. Distinct from H1-B fault control, where an injected post-spawn EPERM keeps the child and refuses removal. No leftover `postgrest` process, no leftover `/tmp/jetnity-admin-account-counts-http-1-*` dirs, system `17/main` still down. No data-loss or Production incident.
- Not GoTrue/login/MFA/browser/Production E2E. Not Guardian. Not a product PASS.
