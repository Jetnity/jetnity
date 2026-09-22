# Admin Account Counts Independent Verification 1 — REPORT

Date: 2026-09-22  
Status: **CURSOR SPECIALIST EVIDENCE / LOCAL R1–R4 CORRECTIONS VERIFIED IN SPECIFIED SCOPE / NOT OPERATING-MODE HOLD / NOT A TL PASS / NOT GUARDIAN**  
Cursor-Agent: **Jetnity admin account counts independent verification 1**  
Generation: **1**  
Required / actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-4a3288b3-eb42-480b-9c37-f74b584e2419`  
Session URL: https://cursor.com/agents/bc-4a3288b3-eb42-480b-9c37-f74b584e2419  
Run-info display name: `Admin account counts independent verification`. UI rename **not** performed.  
Not reused: builder `bc-49dd67e9-5979-44af-9476-1df8bcdfff93`, continuity `bc-e268a98c-10c1-428f-94ae-99f3246f460a`.

Evidence PR: Draft **#552** · branch `audit/admin-account-counts-independent-verification-1`  
Task seed: `34f7586e75e7d77ce59998afed54e5dd1775d52f`  
Evidence-branch baseline at commissioning: `e28ab43b53faf38aef163ccea82c45aedf3a7d06` · mode **NORMAL**  
Authorized later main (E3): `34686af3a12317d5eb40ab12056a1188298e04c6` — Merge #550, identical tree to `b5bbe211`.

## Reviewed product target (separate from this evidence SHA)

| Item | Value |
| --- | --- |
| Historical product target | `b5bbe211bc82c16da34bc8f48b58f39920af5f5a` — unchanged; still the reviewed SQL |
| Product PR | **#550 MERGED** after TL PASS **5282850421** |
| Identical-tree merge | `34686af3a12317d5eb40ab12056a1188298e04c6` (`b5bbe211^{tree}` == `34686af3^{tree}`) |
| Prior main at first persist | `e28ab43b53faf38aef163ccea82c45aedf3a7d06` |
| Builder freeze | comment **5782471633** |
| Prior product TL review | **5282427169** CHANGES REQUIRED R1–R4 on historical `9219e31e` |
| This evidence TL review | **5282860545** E1–E3 on `cbba1264` |

First persist used a detached worktree at `/tmp/jetnity-review-550` and did **not** import unmerged #550 code. E3 later merged **accepted** main `34686af3` into this same branch (no rebase/force/cherry-pick). Incoming product files were left byte-unmodified (candidate/bootstrap/runner hashes unchanged).

## Verdict

**Specialist evidence: the local R1–R4 corrections on historical target `b5bbe211` were independently executed and verified in the specified local PostgreSQL 16.15 scope.**  
This is **not** operating-mode HOLD, **not** a Technical-Lead PASS, and **not** Guardian evidence. Builder 56/56 and 10/10 were **re-executed** in the first persist, not accepted as this reviewer's evidence. The first persist's 25 mixed-probe total stays a separate class from SQL counts and from the E2 reconstructed 9/9 run. Production apply / RPC / UI / privilege activation remain reserved.

## Isolation before execution

Inspected every `psql` path in the runner and tests **before** running them.

| Control | Fact |
| --- | --- |
| Process | `execFileSync` only; no `sudo`, no `pg_ctlcluster`, no import of `scripts/db/sql.mjs` |
| Cluster | `registrierePrivatesCluster()` before `initdb`; 0700 dirs; `listen_addresses=''`; unix socket 0700 |
| `psqlFile` / `psqlSql` | always `psqlSafeArgs`: `-X --no-psqlrc -h <owned socket> -U jetnity_proof` |
| `runPsqlCapture` | test/control helper; intentional no-`-X` only on the owned socket for sentinel proof |
| Env | rejects listed connection keys and remote argv DSNs **before** `initdb`; child env strips `PG*` + `PSQLRC` |
| System `16/main` | package install created it; **policy-rc.d denied start**; remained **down**; unused |

Ordinary Ubuntu packages installed PostgreSQL **16.15**. Production dated metadata is **17.6**. That major-version gap is a stated limitation, not a mock PASS.

## Independent execution (this session)

| Command | Result | Exit |
| --- | --- | --- |
| `node scripts/db/admin-account-counts-1-local-proof.mjs` on detached `b5bbe211` | **56/56** | 0 |
| `node --test scripts/db/admin-account-counts-1-local-proof.test.mjs` | **10/10** | 0 |
| Reviewer-owned mixed probes (cbba1264, historical) | **25** mixed-class PASS + 1 harness artifact | not a SQL-only count |
| E2 reconstructed HOME/DST repro (after 5282860545) | **9/9** | 0 |

Assertion categories actually counted in the exact-source run (do not relabel as all-SQL):

| Group | n | Kind |
| --- | --- | --- |
| auth-sql | 18 | executed SQL |
| lifecycle-sql | 4 | executed SQL |
| window-sql | 5 | executed SQL |
| zero-vs-deny-sql | 2 | executed SQL |
| rls-sql | 6 | executed SQL |
| catalog | 13 | catalog |
| static-source | 3 | source |
| psqlrc-node | 4 | Node + real psql |
| cleanup-node | 1 | Node lifecycle |
| runner-safety tests | 10 | Node |

Extracted helper **bodies** `rollenrang`, `hat_rolle_mindestens`, `aktuelle_rolle`, `aktuelles_admin_aal2`, `darf_konten_verwalten` are **byte-equal** to the named current migrations. Candidate sha256 matches freeze **5782471633**.

Re-read exact-head integration (not SQL proof): CI `35772116946` SUCCESS; Auth `106896128209`; Typecheck/Lint/Build `106896127697`; Vercel Preview Comments `106896306511`; deployment `6da5vghJfNPMqw3k3BSF65jnL8xg` completed.

## R1 — psql startup isolation

**Holds.** Every runner `psql` used for candidate SQL goes through `psqlSafeArgs` (`-X --no-psqlrc` + owned socket). Child env deletes `PSQLRC`.

Independent HOME-only control (builder's control always also sets `PSQLRC`):

- Without `-X`, `HOME/.psqlrc` printed `JETNITY_PSQLRC_SENTINEL` then `\connect nonexistent_psqlrc_redirect_db` on the **private** socket. No remote host.
- With `-X --no-psqlrc`, stdout was `1` and the sentinel was absent.
- That pair is a working negative control: the assertion *can* fail.

Exact-source run also showed the builder explicit-`PSQLRC` control executing the sentinel and the `-X` paths suppressing it.

## R2 — fixed 720-hour window

**Verified in this local scope.** Candidate prosrc uses `_measured_at - interval '720 hours'` and one `pg_catalog.now()`. No caller time/filter argument. Function `TimeZone=UTC`. Live candidate window on the first persist was exactly **2592000** seconds. Candidate source contains no `interval '30 days'`.

E1 correction (start displacement ≠ elapsed duration), reconstructed 2026-09-22 in `repro-home-psqlrc-and-dst.mjs`:

| Anchor (UTC) | Fixed start | NY calendar start | Start displacement | Calendar elapsed | vs 720h |
| --- | --- | --- | --- | --- | --- |
| 2026-03-09T07:00Z | 2026-02-07T07:00Z | 2026-02-07T08:00Z | **+3600s** (later start) | **2588400s / 719h** | 3600s **shorter** |
| 2026-11-02T06:00Z | 2026-10-03T06:00Z | 2026-10-03T05:00Z | **−3600s** (earlier start) | **2595600s / 721h** | 3600s **longer** |

The first persist labeled spring “longer” and fall “shorter” from the start-displacement sign. That wording was wrong; candidate 720h and raw inclusion checks were unaffected. The historical 25 mixed-probe list keeps those two IDs as **HISTORICAL MISLABEL**.

`jetnity_test.counts_at` is a proof-only reimplementation with the same 720h / present filter. DST *row inclusion* is proven on that seam plus interval arithmetic, not by calling the unparameterized candidate at a historical instant. That is the correct production shape.

## R3 — cluster lifecycle

**Holds.** Owned directory is registered before `initdb`. Stop checks `postmasterLebt` and **does not** `rm -rf` a still-running cluster (`failStop` Node test independently re-run: `removed=false`, postmaster still alive, then a real stop cleaned up). Normal exact-source and reviewer-probe cleanups removed only their `/tmp/jetnity-admin-account-counts-1-<uuid>` trees. Foreign marker `jetnity-unrelated-cluster-must-remain/keep.txt` remained. System `16/main` untouched.

## R4 — RLS / trusted owner

**Holds, with honest trusted-owner scope.**

Fixture catalog (executed): `auth.users` RLS=on, FORCE=off, owner `supabase_auth_admin`, 0 policies; `postgres` NOSUPERUSER+BYPASSRLS+SELECT; clients are not members of `postgres`; no client SELECT; `jetnity_internal` USAGE false for anon/authenticated/service_role; profiles RLS-on owner postgres.

Independent probe: `GRANT SELECT` to `authenticated` still returns **0** rows under RLS. Table owner / superuser can see rows (FORCE off). Unprivileged-owner helper still fails for a legitimate moderator AAL2 caller (`42501 not authorized`) because RLS hides even the caller row from that owner — then `visible_users=0`. Trusted-owner candidate returns the aggregate for that caller and still denies user / missing subject / anonymous+privileged profile / soft-deleted leftover privileged profile.

`postgres` **already has broader authority than this function** (BYPASSRLS plus any table privileges it holds). The candidate does not reduce that role. Later apply still needs a fresh metadata/ownership/ACL review and the reserved Product-Owner gate. Smallest later migration is **not** “copy + new BYPASSRLS role”.

## Adversarial caller / output

Authorized: owner/admin/operator/moderator + AAL2. Denied (42501, `row=null`, not success-zero): AAL1 / missing AAL / AAL3, user, creator, no-profile caller, absent sub, soft-deleted caller, anonymous, anonymous+privileged profile, break-glass, `user_metadata.role`, authenticated without `sub`, service_role even with a moderator JWT (schema EXECUTE/USAGE deny). Output allowlist only: two counts, two timestamps, version. No identities.

Authorized present minimum is 1 (caller). Empty window can be genuine 0.

## Findings

### IV1-P0 — none

No incident / unauthorized success-zero / remote-DSN fallback / PUBLIC execute leak was reproduced on this head. **Not whole-system assurance.**

### IV1-P2-1 — trusted `postgres` remains broader than the function

- **Severity:** P2 (promotion / later apply, not a local-correction miss)
- **Path:** `scripts/db/admin-account-counts-1-candidate.sql` owner clause; bootstrap `alter role postgres ... bypassrls`
- **Expected / actual:** TL selected existing trusted postgres for the local candidate. Confirmed NOSUPERUSER+BYPASSRLS. Function is a narrow wrapper, not a privilege reduction.
- **Class:** FACT
- **Source version:** `b5bbe211`
- **Remediation direction (do not implement here):** keep the later apply review + PO gate; do not add a new global BYPASSRLS role in a silent follow-up.

### IV1-P3-1 — engine major 16 vs dated Production 17.6

- **Severity:** P3 limitation
- **Expected:** prefer 17 when already available. 16 is allowed with the limitation stated.
- **Actual:** 16.15 executed. RLS/interval/`psql -X` behaviour used here is not a 17.6 binary re-run.
- **Class:** FACT
- **Remediation:** none for this local slice. Fresh 17 metadata check remains a later apply prerequisite.

### IV1-P3-2 — builder HOME-only negative control always set `PSQLRC`

- **Severity:** P3 evidence gap (closed independently)
- **Path:** `pruefePsqlrcIsolation()` control sets both `PSQLRC` and `HOME`
- **Actual:** inherited-home suppression with `-X` was tested; inherited-home *execution* without `-X` and without `PSQLRC` was not in that control. This review added that control; sentinel ran; redirect stayed on the private socket.
- **Class:** FACT
- **Remediation:** optional same-session test clarification only if TL wants builder-owned evidence symmetry. **Not required to accept R1.**

### IV1-P3-4 — first persist confused start displacement with elapsed duration

- **Severity:** P3 wording (closed in this persist)
- **Path:** REPORT R2; historical `independent-probes.txt` I-R2-NY-spring/fall labels
- **Expected:** spring calendar-30d elapsed is 719h (shorter); fall is 721h (longer).
- **Actual at cbba1264:** labels said the opposite because they described `calendar_start - fixed_start`.
- **Class:** FACT
- **Remediation:** labels corrected; reconstructed oracle 9/9. Do not edit builder code.

### IV1-P3-3 — `cleanChildEnv` does not strip non-PG secrets

- **Severity:** P3 residual
- **Path:** `CHILD_ENV_STRIP_KEYS` / `FORBIDDEN_CONNECTION_KEYS`
- **Actual:** `SUPABASE_ACCESS_TOKEN` is inherited by child processes unless the caller unsets it. It is not a DSN and was unset for this run. No credential values were printed.
- **Class:** RISK
- **Remediation:** later runner hygiene could strip known non-connection secret names. Not a remote-DB escape.

## Related out-of-scope (no new product requirement)

**IV1-OBS-1:** a fixture user with `profiles.role='moderator'` and `status='banned'` plus AAL2 **is authorized**. `aktuelle_rolle()` / `darf_konten_verwalten()` do not read `profiles.status`. Target banned rows are intentionally counted. Do not invent a banned-caller rule in this slice.

**IV1-OBS-2:** `SET ROLE postgres` from an `authenticated` GUC succeeded only because the disposable `session_user` is initdb superuser `jetnity_proof`. Catalog membership remains false. Harness artifact.

Traveller-context intelligence does not apply (no travel-document / route logic).

## What was not tested / not claimed

- No Production, Preview, or hosted Supabase query (dated TL metadata only).
- No browser / UI proof (local-only slice).
- No Guardian PASS.
- No live account counts.
- No Ready / merge / follow-up / product fix.

## Specialist recommendation to Technical Lead

Treat historical target `b5bbe211` (now identically merged as `34686af3`) as independently executed local evidence that the R1–R4 corrections work in the specified disposable PostgreSQL 16.15 scope. #550 is already merged. This persist only closes evidence wording/reproducibility/sync (E1–E3). Do **not** treat this as apply authority. #551 remains the central-doc writer. This reviewer stops.
