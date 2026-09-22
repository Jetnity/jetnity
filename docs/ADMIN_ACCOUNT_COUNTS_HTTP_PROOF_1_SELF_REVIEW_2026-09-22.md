# Admin Account Counts HTTP Proof 1 — SELF-REVIEW

Stand: 22. September 2026  
Agent: **Jetnity admin account counts HTTP proof 1**, Generation 1  
Session: `bc-e1622174-d101-44e3-bb7d-d4fad18cd016`  
Required / actual model: `cursor-grok-4.6-high-fast`  
This is not a Technical-Lead PASS.

---

## 1. Scope fidelity

I stayed inside the task-owned proof harness, fixture, evidence directory and three deliverables. I exported wrapper/parser/contract from `dcf7bfee` into a private temp directory. I did not edit #553 product files, accepted #550/#552 sources, shared client/auth, checker, migrations, package/lock/CI, central docs or app routes.

I merged exact authorized main `72291ee6` only (`20a8efc0`, no rebase/force/reset/cherry-pick). Incoming merged files were not modified. The experiment still targets snapshot `dcf7bfee`.

## 2. Isolation

- Fail-closed on inherited `PG*`, `PGRST_*`, `SUPABASE_*`, `NEXT_PUBLIC_SUPABASE_*` and `JETNITY_ALLOW_REMOTE_DB`.
- Private PostgreSQL socket; `listen_addresses=''`; `--auth-host=reject`.
- PostgREST `server-host=127.0.0.1`; owned-pid socket inode + `/proc/net/tcp{,6}` LISTEN `0A`.
- Synthetic identities and per-run HS256 material only. Logs/evidence contain no raw JWT or connection URI.
- System cluster `17/main` remained down and was not used.
- Cleanup now observes ChildProcess exit/close before `rmSync`. Confirmed `httpStopped:true` / `httpReaped:true`. No leftover PostgREST or proof directory after the passing run.

## 3. Evidence honesty

| Claim | Status |
| --- | --- |
| Real PostgREST HTTP + JWT signature verification | **Yes** — 34 loopback requests |
| SET ROLE in psql labelled as HTTP auth | **No** |
| Deterministic fixture counts + genuine window 0 | **Yes** — present `10` / window `0`, then labelled `11`/`1` |
| Frozen parser on real HTTP bodies | **Yes** |
| Distinct denial classes | **Yes** — exact 403/42501, 401/42501, PGRST301, PGRST303 |
| Excluded-schema selection | **Yes** — Accept-Profile/Content-Profile → 406/PGRST106 |
| Invalid-path `/auth/users` as schema unexposure | **No** — labelled `http-route-shape` only |
| Catalog before/after definition/owner/ACL | **Yes** — not existence-only |
| Large-value TEXT transport | **Yes**, separately labelled; not the producer |
| Separate HTTP clocks | **Observation only** |
| GoTrue / browser / Production E2E | **Not run** |
| Hosted Supabase parity | **Not claimed** |
| Local production-app build | **Not re-run** (no product-file edits) |
| Historical 0109fce2 38/38 | **Dated; not this rerun** |

## 4. H1–H3 correction

I agree with review 5284332971 that the first freeze's reusable acceptance tests were insufficient:

- H1: `stoppeCluster()` could report cleaned/removed while `httpStopped:false`. That is now a failing acceptance.
- H2: `status!==200 && !count-fields` accepted injected 500/503. Denials now require the pinned pairs; executable tests prove the counterexample fails.
- H3: `/auth/users` without a profile header is a route-shape 404/PGRST125. Schema unexposure is now 406/PGRST106 via profile headers, with before/after catalog snapshots.

## 5. What I would tell TL

The frozen SQL-to-HTTP boundary at `dcf7bfee` still behaved as specified on this local PostgreSQL 17.11 + PostgREST 16.3 cluster after the harness corrections. That does **not** make #554 Ready and does not prove hosted Supabase. #553 is already closed; do not reactivate its implementer.

## 6. Errors I made and corrected in-session

- First freeze accepted comm-name cleanup and any-non-200 denials. Corrected in this same session after 5284332971.
- Duplicate ESM export of helper names during the H1–H3 edit; removed.
- Sleep-child unit test first required `exitCode !== null`; SIGTERM leaves `signalCode` set instead. Fixed to accept either and to assert ESRCH.

## 7. Stop

No Ready. No merge. No follow-up slice. No second product writer.
