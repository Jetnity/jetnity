# Admin Account Counts Local Proof 1 — SELF-REVIEW

Stand: 22. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Draft PR: #550  
Binding task: `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_PROOF_1_TASK_2026-09-22.md`  
Session: `bc-49dd67e9-5979-44af-9476-1df8bcdfff93`

This document argues against the implementation. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on this slice

| Attack | Result | Evidence |
| --- | --- | --- |
| Ordinary user / creator AAL2 calls the aggregate | Fail. `darf_konten_verwalten()` is moderator+ AND AAL2. | `42501 not authorized` |
| Moderator AAL1 / missing AAL / AAL3 | Fail. Extracted `aktuelles_admin_aal2()` reads only `auth.jwt() ->> 'aal' = 'aal2'`. | `42501` |
| Break-glass JWT or `user_metadata.role=owner` | Fail. Helpers do not read those claims. | `42501` |
| Absent / anonymous / soft-deleted caller, including a soft-deleted moderator profile | Fail. Caller must be a present non-anonymous `auth.users` row before capability is enough. | `42501` |
| Caller without profile | Fail. `aktuelle_rolle()` returns null; capability is false. The same row still counts as a **target** account. | deny for caller; lifecycle present includes `noProfile` |
| anon / service_role shortcut | Fail. No schema USAGE / EXECUTE. | `42501 permission denied for schema jetnity_reporting` |
| Direct `SELECT` on `auth.users` as authenticated/anon | Fail. No table grant. | `42501 permission denied for table users` |
| PUBLIC execute leak | Fail. Revoke PUBLIC/anon/service_role; catalog `public_exec=false`. | catalog group |
| Grant widening of `jetnity_internal` | Fail. Candidate has no GRANT on it; fixture schema USAGE is false for client roles. | catalog + static grant scan |
| Remote / inherited connection override | Fail closed before `initdb`. | runner tests 5/5; `PGHOST` value not printed |
| Mock-only SQL PASS | Fail. Real PostgreSQL 16.15 executed the function and ACLs. | 36/36 |
| Deny presented as zero | Fail. Deny has `row=null`. Authorized window `0` is a success row with present `1`. | zero-vs-deny group |
| Count from profiles / trips | Fail. No profile join in the aggregate. | candidate prosrc + lifecycle |

## 2. Residual risks I would still challenge

- A later persistent activation that copies this SQL into `supabase/migrations/` without a reserved Product-Owner gate would be a scope failure. This PR must not be treated as that gate.
- Production `auth.users` has additional columns beyond the TL-verified subset. The fixture matches verified types/nullability only. A metadata drift check is required before apply.
- `aktuelle_rolle()` still does not establish an active/non-deleted caller. This candidate adds that check on `auth.users`. If a later port drops the caller-existence check, a deleted JWT subject with a leftover profile role could authorize.
- SECURITY DEFINER owner `jetnity_reporting_owner` can SELECT `auth.users`. That is the intended least-privilege owner, not a client role. Superuser of a future host still bypasses this model.
- `created_at` NULL is counted in present and omitted from the window. Incomplete timestamp coverage is a reporting caveat, not a guessed date.
- Test/internal/unconfirmed/banned-profile rows stay included. Inventing exclusions without a source would be a product lie.
- Authorized present count cannot be 0. UI must not treat that minimum as “empty product”. Window `0` is the honest empty-window case.
- JSON rendering of `timestamptz` follows session TimeZone. Counts and the instant stay identical; clients must compare instants, not offset strings.
- Finding 5.2 / release-gate G / provider gates are unrelated and remain as they are. This slice does not close them.

## 3. What was not claimed

- No Production / Preview / Development apply.
- No Data API RPC.
- No Admin UI.
- No live account counts.
- No Technical-Lead PASS.
- No Ready / merge / follow-up.
- No UI session rename.
- Traveller-context intelligence does not apply.

## 4. Dispatch compliance

| Requirement | Met? |
| --- | --- |
| Required model `cursor-grok-4.6-high-fast` | Yes — run-info `originalModelName` |
| New dedicated session, not #549/#548 | Yes — `bc-49dd67e9-5979-44af-9476-1df8bcdfff93` |
| Authorized main `e28ab43b` merged, no rebase/force | Yes |
| Real disposable local PostgreSQL | Yes — private cluster, 36/36 |
| No mock-only SQL PASS | Yes |
| Exact allowed new paths only | Yes |
| No remote DB / production RPC / package / global docs | Yes |
| No Ready / merge / follow-up | Yes |
