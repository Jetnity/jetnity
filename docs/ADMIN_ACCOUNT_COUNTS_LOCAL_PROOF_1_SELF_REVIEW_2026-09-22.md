# Admin Account Counts Local Proof 1 — SELF-REVIEW

Stand: 22. September 2026  
Status: **AGENT SELF-REVIEW OF R1–R4 — NOT A TECHNICAL-LEAD PASS**

Draft PR: #550  
Binding task: `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_PROOF_1_TASK_2026-09-22.md`  
Session: `bc-49dd67e9-5979-44af-9476-1df8bcdfff93`  
Reviewed previous head: `9219e31e5d646c267915812a359aad957ab3cff4`

This document argues against the implementation. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on this slice

| Attack | Result | Evidence |
| --- | --- | --- |
| Ordinary user / creator AAL2 calls the aggregate | Fail. `darf_konten_verwalten()` is moderator+ AND AAL2. | `42501 not authorized` (`auth-sql`) |
| Moderator AAL1 / missing AAL / AAL3 | Fail. Extracted `aktuelles_admin_aal2()` reads only `auth.jwt() ->> 'aal' = 'aal2'`. | `42501` |
| Break-glass JWT or `user_metadata.role=owner` | Fail. Helpers do not read those claims. | `42501` |
| Absent / anonymous / soft-deleted caller | Fail. Caller must be a present non-anonymous `auth.users` row. | `42501` |
| Anonymous caller with a privileged fixture profile | Fail. Anonymity is checked before capability; this is not masked by role denial. | `auth-sql` + `rls-sql` |
| Caller without profile | Fail as caller. Same row still counts as a **target** account. | deny + lifecycle present includes `noProfile` |
| anon / service_role shortcut | Fail. No schema USAGE / EXECUTE. | `42501 permission denied for schema jetnity_reporting` |
| Direct `SELECT` on `auth.users` as authenticated/anon | Fail. No table grant. RLS-on/default-deny is additional. | `42501 permission denied for table users` |
| Unprivileged SECURITY DEFINER owner + SELECT grant | Fail under RLS-on/no policies, including for a legitimate moderator AAL2 caller. Visible row count is 0. | `rls-sql` |
| PUBLIC execute leak | Fail. Revoke PUBLIC/anon/service_role; catalog `public_exec=false`. | catalog |
| Grant widening of `jetnity_internal` | Fail. Candidate has no GRANT on it; fixture schema USAGE is false for client roles. | catalog + static grant scan |
| Client inherits `postgres` | Fail. `pg_has_role(authenticated/anon/service_role, postgres, MEMBER)` is false. | catalog |
| Remote / inherited connection override | Fail closed before `initdb`. | runner tests |
| Hostile `PSQLRC` / `HOME/.psqlrc` | Fail closed. `-X --no-psqlrc` skips the sentinel; local control without `-X` proves the file would otherwise run. No remote target. | `psqlrc-node` + Node subprocess tests |
| Init/start/SQL failure leaving orphan dirs; stop failure + `rm -rf` of a live cluster | Init/start/SQL paths register then cleanup; live postmaster blocks directory removal and reports failure. | Node cleanup tests + normal-run `cleanup-node` |
| Session DST changing the 30-day bound | Fixed 720-hour interval; spring/fall oracle rows flip inclusion versus `interval '30 days'` in `America/New_York`. | `window-sql` |
| Mock-only SQL PASS | Fail. Real PostgreSQL 16.15 executed the function, RLS contrast and ACLs. | 56/56 |
| Deny presented as zero | Fail. Deny has `row=null`. Authorized window `0` is a success row with present `1`. | `zero-vs-deny-sql` |
| Count from profiles / trips | Fail. No profile join in the aggregate. | candidate prosrc + lifecycle |

## 2. Residual risks I would still challenge

- A later persistent activation that copies this SQL into `supabase/migrations/` without a reserved Product-Owner gate would be a scope failure. This PR must not be treated as that gate.
- Production `auth.users` has additional columns beyond the TL-verified subset. The fixture is metadata-faithful for the reviewed RLS/owner/nullability facts, not a full catalog copy. A fresh metadata/ownership/ACL review is required before apply.
- Trusted owner `postgres` already has broader authority than this aggregate (BYPASSRLS and more). That is honest and is why TL selected it locally instead of a new global privilege role. It remains a promotion risk, not a hidden least-privilege story.
- `aktuelle_rolle()` still does not establish an active/non-deleted caller. This candidate adds that check on `auth.users`. If a later port drops the caller-existence check, a deleted JWT subject with a leftover profile role could authorize.
- `created_at` NULL is counted in present and omitted from the window. Incomplete timestamp coverage is a reporting caveat, not a guessed date.
- Test/internal/unconfirmed/banned-profile rows stay included. Inventing exclusions without a source would be a product lie.
- Authorized present count cannot be 0. UI must not treat that minimum as “empty product”. Window `0` is the honest empty-window case.
- JSON rendering of `timestamptz` follows session TimeZone. Counts and the instant stay identical; the function also pins TimeZone=UTC. Clients must compare instants, not offset strings.
- The 56/56 total mixes SQL, catalog and Node checks. A reviewer who treats all 56 as SQL permission assertions would over-claim.
- Finding 5.2 / release-gate G / provider gates are unrelated and remain as they are. This slice does not close them.

## 3. What was not claimed

- No Production / Preview / Development apply.
- No remote catalog query by this writer. TL Production metadata was used only as fixture-design evidence.
- No Data API RPC.
- No Admin UI.
- No live account counts.
- No Technical-Lead PASS.
- No Ready / merge / follow-up.
- No UI session rename.
- Traveller-context intelligence does not apply.
- No live `postgres` attribute change.

## 4. Dispatch compliance

| Requirement | Met? |
| --- | --- |
| Required model `cursor-grok-4.6-high-fast` | Yes — run-info `originalModelName` |
| Same session `bc-49dd67e9-5979-44af-9476-1df8bcdfff93`, Generation 1 | Yes |
| R1–R4 same-session package | Yes |
| Authorized main `e28ab43b` remains merge-base, no rebase/force | Yes |
| Real disposable local PostgreSQL | Yes — private cluster, 56/56 |
| Assertion categories distinguished | Yes — see STATUS §4 |
| No mock-only SQL PASS | Yes |
| Exact allowed new paths only; task not rewritten | Yes |
| No remote DB / production RPC / package / global docs | Yes |
| No Ready / merge / follow-up | Yes |
