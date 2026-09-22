# Admin Account Counts HTTP Proof 1 — SELF-REVIEW

Stand: 22. September 2026  
Agent: **Jetnity admin account counts HTTP proof 1**, Generation 1  
Session: `bc-e1622174-d101-44e3-bb7d-d4fad18cd016`  
Required / actual model: `cursor-grok-4.6-high-fast`  
This is not a Technical-Lead PASS.

---

## 1. Scope fidelity

I stayed inside the task-owned proof harness, fixture, evidence directory and three deliverables. I exported wrapper/parser/contract from `dcf7bfee` into a private temp directory. I did not edit #553 files, accepted #550/#552 sources, shared client/auth, checker, migrations, package/lock/CI, central docs or app routes.

I did not run, fix or accept the changing #553 R1 loader at `f9a41701`. I reported that drift.

## 2. Isolation

- Fail-closed on inherited `PG*`, `PGRST_*`, `SUPABASE_*`, `NEXT_PUBLIC_SUPABASE_*` and `JETNITY_ALLOW_REMOTE_DB`.
- Private PostgreSQL socket; `listen_addresses=''`; `--auth-host=reject`.
- PostgREST `server-host=127.0.0.1`; local-address check on `/proc/net/tcp`.
- Synthetic identities and per-run HS256 material only. Logs/evidence contain no raw JWT or connection URI.
- System cluster `17/main` was created by the PGDG package install, remained down, and was not used.
- Cleanup removed the owned `/tmp/jetnity-admin-account-counts-http-1-*` tree. No leftover PostgREST process after the passing run.

## 3. Evidence honesty

| Claim | Status |
| --- | --- |
| Real PostgREST HTTP + JWT signature verification | **Yes** — 29 loopback requests |
| SET ROLE in psql labelled as HTTP auth | **No** |
| Deterministic fixture counts + genuine window 0 | **Yes** — present `10` / window `0`, then labelled `11`/`1` |
| Frozen parser on real HTTP bodies | **Yes** |
| Distinct denial classes | **Yes** — 403/42501, 401/42501, PGRST301, PGRST303 |
| Large-value TEXT transport | **Yes**, separately labelled; not the producer |
| GoTrue / browser / Production E2E | **Not run** |
| Hosted Supabase parity | **Not claimed** |
| #553 residual R1 accepted | **No** |

The cleanup JSON field `httpStopped=false` is a conservative comm-name check. I verified separately that no PostgREST process and no proof cluster directory remained. I do not treat that field as a leftover-process incident.

## 4. What I would tell TL

The frozen SQL-to-HTTP boundary at `dcf7bfee` behaved as specified on this local PostgreSQL 17.11 + PostgREST 16.3 cluster: authorized AAL2 moderator-or-higher callers received canonical TEXT counts; unauthorized/signature-invalid callers did not; private schemas stayed unexposed; a dropped wrapper became unavailable rather than zero.

That does **not** make #553 Ready, does not prove hosted Supabase, and does not close residual R1. Applicability waits for TL hash reconciliation to the final accepted product.

## 5. Errors I made and corrected in-session

- First PostgREST asset URL used `linux-static-x64` (404). Correct asset is `linux-static-x86-64`.
- `/proc/net/tcp` first treated rem_address `0.0.0.0:0` as a public bind. Fixed to local-address only.
- A static-source regex matched `process.env` / its own `dotenv` literal. Narrowed.
- A post-cleanup stdio handler crashed after 38/38 PASS. Guarded/destroyed streams; re-ran to exit 0.

## 6. Stop

No Ready. No merge. No follow-up slice. No second product writer.
