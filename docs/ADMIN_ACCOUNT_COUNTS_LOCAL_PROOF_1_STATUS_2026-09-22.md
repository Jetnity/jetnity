# Admin Account Counts Local Proof 1 — STATUS

Stand: 22. September 2026  
Status: **R1–R4 LOCAL CORRECTION COMPLETE / FROZEN FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO PRODUCTION APPLY**

Draft PR: #550  
Branch: `feat/admin-account-counts-local-proof-1`  
Binding task: `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_PROOF_1_TASK_2026-09-22.md` at seed `129309aef1ed906b22a16b6dd5dce1db28a746ac` (TL-owned; not rewritten)  
Authorized main integrate: `e28ab43b53faf38aef163ccea82c45aedf3a7d06` (#549 docs-only inventory; no runtime/capability change)  
Reviewed/frozen previous head: `9219e31e5d646c267915812a359aad957ab3cff4` (historical; CHANGES REQUIRED 5282427169)

Cursor-Agent: **Jetnity admin account counts local proof 1**, Generation 1  
Required / actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-49dd67e9-5979-44af-9476-1df8bcdfff93`  
Session URL: https://cursor.com/agents/bc-49dd67e9-5979-44af-9476-1df8bcdfff93  
Observed run-info display name: `Admin account counts local proof`. UI rename was **not** performed (no rename capability in this session).

This file is point-in-time evidence. Agent self-review is not Technical-Lead PASS. Exact-head CI / Auth / Preview for the new frozen head belong in a **PR comment**, not a later evidence-only commit. Old-head acceptance gates are historical.

---

## 1. Goal

Produce the first real `jetnity.admin-account-counts.v1` aggregate candidate and execute it on a disposable local PostgreSQL cluster: capability + AAL2 authorization, caller lifecycle, present/window semantics, zero-versus-deny, and catalog/ACL truth. Not a dashboard, not a Production migration, not an exposed RPC.

This revision is the single same-session package for Technical-Lead CHANGES REQUIRED R1–R4. Production metadata in that review is fixture-design evidence only. This writer did not query or apply any remote database.

## 2. Implemented (R1–R4)

- `scripts/db/admin-account-counts-1-candidate.sql` — schema `jetnity_reporting`, function `account_counts_v1()`, **trusted execution owner `postgres`** (fixture: NOSUPERUSER + BYPASSRLS). No new BYPASSRLS role, no `auth.users` client SELECT, no managed auth policy changes. SECURITY DEFINER only so RLS-protected `auth.users` can be aggregated without client SELECT. Window is a fixed **720-hour** half-open interval. Deny is SQLSTATE `42501`, never a zero success row.
- `scripts/db/admin-account-counts-1-bootstrap.sql` — **METADATA-FAITHFUL FIXTURE**: `auth.users` RLS-on / FORCE-off / owner `supabase_auth_admin` / no policies; `postgres` NOSUPERUSER+BYPASSRLS+SELECT; `profiles` RLS-on owner `postgres`; extracted helpers unchanged; locked `jetnity_internal` canary. Client roles are not members of `postgres`.
- `scripts/db/admin-account-counts-1-local-proof.mjs` — private `initdb` cluster + socket; every `psql` uses `-X --no-psqlrc` and a sanitized child env (PSQLRC stripped); owned resources registered before init/start; stop verifies termination before directory removal and reports failure instead of claiming cleanup; never imports `scripts/db/sql.mjs`.
- `scripts/db/admin-account-counts-1-local-proof.test.mjs` — runner fail-closed safety, hostile startup-file subprocesses, injected init/start/SQL/stop cleanup.
- Slice STATUS / HANDOFF / SELF_REVIEW and `docs/evidence/admin-account-counts-local-proof-1/*`.

No `supabase/migrations/` file. No `app/` / `lib/` / `types/` / `package.json` / global current-work writes. Binding task not rewritten.

## 3. Metric and privilege contract

| Field | Value |
| --- | --- |
| Version | `jetnity.admin-account-counts.v1` |
| Present | `auth.users` where `deleted_at IS NULL AND is_anonymous IS FALSE` |
| Window | same set, `created_at` in half-open `[now() - 720 hours, now())` |
| Clock | one transaction-stable `pg_catalog.now()`; fixed 30×24 hours, not session-DST calendar days; function TimeZone pinned UTC |
| NULL `created_at` | present yes, window no |
| Future `created_at` | present yes, window no |
| Profile join | none — accounts without profiles count |
| Unconfirmed / banned-profile / internal fixture | included and described |
| Auth | `auth.uid()` exists, caller present/non-anonymous/not soft-deleted, `public.darf_konten_verwalten()` |
| Deny | `42501` / `jetnity.admin-account-counts.v1: not authorized` |
| Authorized zero | window can be `0`; present cannot be `0` because the caller is themselves a present account |
| Execution owner | existing trusted `postgres` (fixture NOSUPERUSER+BYPASSRLS). Broader existing authority is documented; this is **not** Production owner/privilege activation. |

## 4. Local proof (verified on this correction)

| Gate | Result |
| --- | --- |
| Local PostgreSQL | 16.15, private cluster, system `16/main` remained unused |
| `node scripts/db/admin-account-counts-1-local-proof.mjs` | **56/56 PASS** |
| `node --test scripts/db/admin-account-counts-1-local-proof.test.mjs` | **10/10 PASS** |
| Candidate sha256 | `dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420` |
| Bootstrap sha256 | `0413821d7c75c76908dd437527d623fcbed59c524135adbf5e5974730e6f6ea2` |
| Remote DB | unused; PGHOST / DSN / `JETNITY_ALLOW_REMOTE_DB=1` rejected before `initdb`. No Production catalog query by this writer. |

### Assertion categories (do not relabel all as SQL permission assertions)

| Category | Count | Kind |
| --- | --- | --- |
| `auth-sql` | 18 | executed SQL authorization |
| `lifecycle-sql` | 4 | executed SQL lifecycle |
| `window-sql` | 5 | executed SQL window / DST / 720h oracle |
| `zero-vs-deny-sql` | 2 | executed SQL empty-versus-deny |
| `rls-sql` | 6 | executed SQL RLS contrast (unprivileged owner fails; trusted owner passes same caller/ACL tests) |
| `catalog` | 13 | catalog / ACL / owner / RLS fixture attributes |
| `static-source` | 3 | source scans |
| `psqlrc-node` | 4 | Node + real `psql` startup-file isolation |
| `cleanup-node` | 1 | Node lifecycle; normal-run cleanup evidence |
| runner-safety Node tests | 10 | env reject, PSQLRC/HOME subprocess, injected init/start/SQL/stop |

R1: explicit PSQLRC and inherited-home `.psqlrc` sentinels execute without `-X` on the private socket only and are not executed with `-X --no-psqlrc`. No real remote target was contacted.  
R2: independent oracle `extract(epoch from measured_at - window_start) = 2592000`; US spring/fall DST rows distinguish 720 hours from session `interval '30 days'`. Clock seam is `jetnity_test.counts_at(timestamptz)` in the proof only.  
R3: owned directory registered before initdb; stop failure while postmaster lives does not `rm -rf`; normal-run cleanup removed the owned directory after verified stop.  
R4: unprivileged owner + SELECT grant returns `42501` for a legitimate moderator AAL2 caller and sees 0 `auth.users` rows; trusted `postgres` owner returns the fixture aggregate for that caller and still denies user / missing subject / anonymous+privileged profile.

## 5. Promotion checklist (review, not apply)

1. Independent Technical-Lead exact-head re-review of this candidate + proof. Do not treat fixture PASS as live statistics.
2. Fresh Production metadata / ownership / ACL drift check of `auth.users` RLS/owner/policies, `postgres` attributes, `darf_konten_verwalten()` / AAL2 / TimeZone **before** any apply. The 2026-09-22 TL metadata is fixture evidence, not a standing apply permit.
3. Smallest later migration is **not** “copy candidate + create a new owner role”. It is: create `jetnity_reporting` + `account_counts_v1()` owned by the already-privileged trusted database `postgres`; revoke PUBLIC/anon/service_role; grant authenticated USAGE/EXECUTE only. Do **not** add a new global BYPASSRLS role, grant `auth.users` to clients, alter managed `auth.users` policies, or disable RLS. Rollback = drop function, revoke, drop schema. Do not grant `jetnity_internal`.
4. `postgres` already has broader authority than this function. That must stay visible in the later apply review. This PR does not change live `postgres` attributes.
5. Later public RPC wrapper, if wanted, is a separate exposure review. This task does not expose a Data API RPC.
6. Minimal Admin display of the two measures must keep unavailable / error / forbidden / observed-zero distinct (ADR-0040). Forbidden or missing producer must not render `0`.
7. Product-Owner approval remains outstanding for any Production migration or privilege exposure.

## 6. Residual risks

- P1 prevention held in this fixture: no unauthorized success row, no PUBLIC execute, no remote-DB fallback, no identity fields in the result, psql startup files disabled on every invocation.
- P2: fixture-versus-Production mismatch (auth.users has more live columns than the verified subset). Timestamp coverage can be incomplete (`created_at` NULL). Test/internal rows stay included until a proven exclusion source exists.
- P2: trusted `postgres` owner is broader than a least-privilege reporting role. Selected locally because a new BYPASSRLS role / client SELECT / policy mutation is forbidden. Later apply still needs a fresh ACL review + reserved PO gate.
- P2: future permission exposure if this SQL is copied into `supabase/migrations/` without that gate.
- P3: evidence pins age when the head moves. Previous head `9219e31e` gates are historical.
- Authorized `present_registered_accounts` is at least 1. A true empty present set cannot be returned without weakening caller validation.

## 7. Next step

Freeze this correction head. Report remaining local hygiene and exact-head CI/Auth/Vercel in a PR comment. **STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW.** Do not Ready, merge, or start a follow-up slice.
