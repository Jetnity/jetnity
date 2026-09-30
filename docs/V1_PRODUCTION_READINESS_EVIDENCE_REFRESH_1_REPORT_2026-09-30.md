# Jetnity V1 Production Readiness Evidence Refresh 1 — Report

Stand: 30 September 2026
Status: **READ-ONLY EVIDENCE DELIVERED / DRAFT / NO TL PASS / NO READY / NO MERGE / NOT A LAUNCH PASS**

Issue: #635
Draft PR: #636
Branch: `docs/v1-production-readiness-evidence-refresh-1`
Baseline: `main@b42d1ce1ee52fcb02a58acd269b10c121f906213`
Binding task: `docs/V1_PRODUCTION_READINESS_EVIDENCE_REFRESH_1_TASK_2026-09-30.md`
Accepted prior reassessment, not rewritten: `docs/V1_RELEASE_READINESS_PREFLIGHT_3_REPORT_2026-09-30.md`
Accepted continuity closure, not rewritten: `docs/POST_PREFLIGHT_3_CONTINUITY_CLEANUP_1_REPORT_2026-09-30.md`
Binding gate: `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`

Logical agent: **Jetnity V1 production readiness evidence refresh 1**, Generation 1
Required and actual model: **Grok 4.7 High Fast** (`originalModelName=grok-4.7-high-fast`)
Session: `bc-4f78b5a4-3f6f-435f-840b-0ba48581cfe6`
Session URL: https://cursor.com/agents/bc-4f78b5a4-3f6f-435f-840b-0ba48581cfe6

This refresh classifies current Production-readiness evidence. It does not authorize public launch, indexing, a provider, a migration, a schema rewrite, a backup purchase, a restore, Production mutation, #626 continuation, Ready, or merge.

## 1. Evidence classes

| Class | Meaning in this report |
| --- | --- |
| `PROVEN_THIS_SESSION` | This session read it. Public HTTPS and GitHub read APIs only. |
| `VERSIONED_TL_EVIDENCE` | Stated in issue #635 and the binding task. This session did not re-execute the Supabase read. |
| `UNVERIFIED` | No readable evidence. Absence of a read endpoint is not evidence that the control is off. |
| `RESIDUAL_NOT_A_REWRITE` | A notice or header gap remains. It does not by itself authorize a migration, ACL change, or header slice. |

## 2. Live git reconstruction

Fetched `origin/main` before writing.

| Item | Value |
| --- | --- |
| `origin/main` | `b42d1ce1ee52fcb02a58acd269b10c121f906213` |
| Commit subject | `Merge #634: reconcile post-Preflight 3 continuity` |
| Commit time | 2026-09-30 02:19:22 +0200 |
| Merge-base with this branch | `b42d1ce1ee52fcb02a58acd269b10c121f906213` |
| Ahead / behind before the delivery commit | `0` behind / `1` ahead |
| Ahead commit | task seed `d1e5fac63d54bd58359c950f0196dae84186bc1f` |
| Machine mode | `NORMAL` in `.jetnity/operating-mode.json`. This slice did not edit that file. |
| Open product writers | Draft #636 only. Historical drafts #52, #50, #40, #39, #28 remain stale. |
| Issue #635 | OPEN |
| Issue #626 | OPEN / `reopened`, `updated_at` 2026-09-29T22:52:55Z. Not operated on. |

The review head is the branch tip that contains this report. Do not review the task seed. Re-fetch `main` before review. A new head invalidates this measurement. The post-push exact head is in the handoff after the mandatory re-fetch.

Dirty worktree file `next-env.d.ts` was already modified before editing. It is not part of this change.

## 3. What is proven, attributed, or unverified

### 3.1 Production project and branch isolation

`VERSIONED_TL_EVIDENCE` from issue #635, created 2026-09-30T00:28:34Z. No later issue comment. This session did not call the Supabase API.

| Fact | Classification |
| --- | --- |
| Production project `qscbgcdmivbbnzrcyegn` | `ACTIVE_HEALTHY` |
| Region | `eu-central-2` |
| Database | Postgres 17 GA |
| Development branch | `develop`, project ref published in issue #635 and redacted in this file |
| Development status | separate from Production, `ACTIVE_HEALTHY` |

The task file writes the development ref as `[REDACTED]`. Issue #635 publishes it. This file does not repeat it. Isolation is proven only as that versioned read: Production and `develop` are separate projects and both were `ACTIVE_HEALTHY` at the Technical Lead’s read. This session did not re-list branches, preview projects, or connection strings.

### 3.2 Migration inventory relevant to V1

`VERSIONED_TL_EVIDENCE`: the current Production migration set **includes**

- `20260917120000 account_visits`
- `20260927230000 reise_graph_kaskade_tiefe`

This session did not query `supabase_migrations` and does not claim those two rows are the whole catalog. “Includes” is not “only these”.

Repository context, read locally and not a live apply:

- `supabase/migrations/20260917120000_account_visits.sql` is explicit visit history. The file header still says “Nur Development anwenden. Nicht auf Production anwenden.” Later continuity already records that migration as Production-backed. The current inventory fact is the versioned Production read, not that original apply instruction. This refresh does not edit the SQL file and does not treat the header as proof that Production lacks the migration.
- `supabase/migrations/20260927230000_reise_graph_kaskade_tiefe.sql` keeps `reise_graph_geaendert()` as `SECURITY INVOKER`. `DECISIONS.md` already records the 28 September 2026 Technical-Lead finding that this version is applied on Production. Issue #635 is the current inclusion read.

Release conclusion: the two previously release-relevant versions are in the versioned current Production set. Gate F’s “migrations inventoried” bar is still partial, because this session did not reproduce the full applied list.

### 3.3 Edge Function inventory

`VERSIONED_TL_EVIDENCE`:

- `account-delete-v1` is **ACTIVE v1**
- `verify_jwt=true`

`supabase/config.toml` also sets `verify_jwt = true` for `[functions.account-delete-v1]`. That is repository expectation. It is not a new hosted listing.

This session did not invoke the function, did not read Auth users, and did not list every hosted function. One named active function is not a complete function catalog. Historical text that once said Production had zero Edge Functions is superseded by this versioned ACTIVE read. No real Production account was deleted here.

### 3.4 Security Advisor

`VERSIONED_TL_EVIDENCE`. Returned output is **WARN-only**. No ERROR-level result was in that returned output.

| Returned class | What it is | What it is not |
| --- | --- | --- |
| WARN GraphQL visibility | Visibility notices | A proven exploit |
| WARN authenticated-callable `SECURITY DEFINER` | Definer-callable notices | Authorization to rewrite RLS, grants, or function security |

`WARN ≠ proven exploit`. These notices do not authorize a migration or schema rewrite. They do not close Gate B. They do not close finding 5.2. This session did not re-run the advisor and did not open a personal-data query to “confirm” a warning.

### 3.5 Performance Advisor

`VERSIONED_TL_EVIDENCE`. Returned output is **INFO-only**:

- unindexed foreign-key notices
- unused-index notices
- Auth DB connection-strategy notice

`INFO ≠ required immediate migration`. No index, foreign-key, or connection-strategy change is authorized by this refresh.

### 3.6 Vercel Production and public binding

`PROVEN_THIS_SESSION` at 2026-09-30T00:30:20Z (HTTPS `Date` header), plus the GitHub reads in the same window.

| Fact | Result |
| --- | --- |
| GitHub commit status on `b42d1ce1ee52fcb02a58acd269b10c121f906213` | context `Vercel`, state **success**, description “Deployment has completed”, updated 2026-09-30T00:19:51Z |
| Status target | `https://vercel.com/jetnity-e1b93c82/jetnity-app/CN1sCjgMLMbUtewuZhffNnSgFnP1` |
| GitHub Deployment | `6748447001`, environment **Production**, status **success**, same SHA, created 2026-09-30T00:19:52Z |
| Deployment status URL | `https://jetnity-mhwkzujxs-jetnity-e1b93c82.vercel.app` |
| Public `https://jetnity.com/` HTML | `data-dpl-id="dpl_CN1sCjgMLMbUtewuZhffNnSgFnP1"` |

The public deployment id matches the Vercel status target id for current `main`. That is the alias binding proven here. The GitHub `environment_url` is a deployment host, not `jetnity.com`. This session did not open the Vercel dashboard and did not hash the HTML against the Git tree.

The API field `production_environment` was `false` on deployment `6748447001` and on the four older Production-environment deployments sampled in the same list (`6748019628`, `6747268585`, `6734323699`, `6723293122`). That boolean does not override the Production environment label or the public `data-dpl-id` match.

Draft #636 Preview deployment `6748563242` is the branch preview for task seed `d1e5fac63d54bd58359c950f0196dae84186bc1f`. It is not the public Production binding.

Earlier public ids `dpl_C6BP9K4jobWWLGFnHN2Ex35EfgDN` (#632) and `dpl_DEqXrqyw6QxJKiZkk6WqhJq6TBRm` (#630) were true for those earlier SHAs. The live apex read now is `dpl_CN1sCjgMLMbUtewuZhffNnSgFnP1` on `b42d1ce1`.

### 3.7 Indexing, HSTS, robots, sitemap

`PROVEN_THIS_SESSION`. This is the correct prelaunch hold. It is not a defect and not a launch PASS.

| Surface | Result |
| --- | --- |
| `http://jetnity.com/` | **308** to `https://jetnity.com/` |
| `https://jetnity.com/` | **200**. `strict-transport-security: max-age=63072000`. No `Content-Security-Policy` header. `access-control-allow-origin: *`. No `X-Robots-Tag` header. |
| Root HTML | `<meta name="robots" content="noindex, nofollow"/>` and the same on `googlebot` |
| `/privacy`, `/terms`, `/impressum` | **200**. Each HTML body contains `noindex, nofollow`. HSTS `max-age=63072000` on each. No CSP header observed on these responses. `access-control-allow-origin: *` on `/terms` only. |
| `https://jetnity.com/robots.txt` | **200**. Body is `User-Agent: *` / `Disallow: /`. |
| `https://jetnity.com/sitemap.xml` | **200**. Empty `urlset`. |
| `www.jetnity.com` | Does not resolve. Apex `jetnity.com` resolves. |

HSTS was present as `max-age=63072000` only. This read did not show `includeSubDomains` or `preload`. Header hardening and `www` stay the accepted Preflight 3 residuals. This refresh does not open that work.

### 3.8 Backup and recovery

`UNVERIFIED`.

Issue #635 and the binding task state that the available Supabase connector surface has **no backup/PITR read endpoint**. This session did not find a read path that returns backup enablement, retention window, PITR state, or last successful backup time. It did not purchase PITR, restore, pause, reset, or otherwise mutate Production.

Backup availability and window therefore remain **UNVERIFIED**. They are not recorded as absent, and they are not recorded as present.

## 4. Effect on gates F, H, B, and G

Binding text is `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`. Accepted Preflight 3 remains the broader A–O map. This section updates only the control-plane facts this task required.

### F. Production configuration — remains `PARTIAL`

Proven or versioned in this refresh:

- Vercel Production for current `main` is success, and public `jetnity.com` is bound to that deployment id.
- The two named migrations are in the versioned Production set. The full live catalog was not re-listed.
- `account-delete-v1` is versioned ACTIVE v1 with `verify_jwt=true`.
- Development is versioned as a separate `ACTIVE_HEALTHY` branch.
- Canonical HTTPS, HSTS, `noindex`, `Disallow: /`, and an empty sitemap match the prelaunch hold.

Still short of Gate F closure:

- full reproducible migration inventory by this session
- CSP and the split `access-control-allow-origin` behaviour
- `www` does not resolve
- backup settings, which Gate H owns and which stay unread

No Production flag, DNS, header, or indexing change is authorized.

### H. Backup / recovery / incident — backup proof remains `RELEASE_PROOF_MISSING`

The incident runbook on `main` is unchanged and still does not prove a backup or a restore rehearsal. A successful Vercel Production deployment proves a deploy exists. It does not prove a rehearsed rollback or a database backup window.

The new precision is the evidence limit: there is no connector read for backup/PITR, so the status is `UNVERIFIED`, not “backups are off”.

### B. Security — remains `PARTIAL`

The versioned advisor result has no ERROR row. WARN visibility and WARN `SECURITY DEFINER` notices stay residuals. They are not a proven cross-account exploit and not a schema task. Gate B still requires an independent security review, closed critical advisories, and no open launch-critical security gap. Finding 5.2 stays open from the accepted preflight. This session did not re-measure the Development producer and did not read Auth users, factors, or profiles.

### G. Monitoring / logging / alerting — remains `PARTIAL`

Nothing in the advisor INFO/WARN output installs detection, paging, or Production ingestion. Release Gate G and finding 5.2 stay open. No observability vendor was contacted. Performance INFO notices are not an index migration and not an alerting design.

## 5. Exact next proof for the backup/recovery gap

The gap closes only when an authorized read-only inventory, from a surface that actually returns backup fields, records all of:

1. whether automated backups are enabled on Production `qscbgcdmivbbnzrcyegn`
2. the retention window
3. whether PITR is on or off
4. the last successful backup time, if that surface returns one

That read must not purchase PITR, restore, pause, reset, rebase, or otherwise mutate Production. A connector with no backup endpoint cannot supply this proof. Do not infer the answer from the missing endpoint.

Until that inventory exists, Gate H backup/restore ability stays open. A restore rehearsal, if ever required, is a separate Product-Owner gate and is not the next proof.

## 6. What this refresh did not do

No runtime or product code. No dependency or lockfile change. No Supabase, Auth, RLS, schema, function, or job mutation. No restore, PITR purchase, pause, reset, rebase, or merge. No Auth-user, profile, factor, or private-identity read. No Production mutation. No provider contact, signup, Terms, DPA, credential, API call, spend, or adapter. No #626 role, status, MFA, fixture, event, or erasure operation. No payment, indexing, domain, or launch action. No new vendor or cost. No Ready. No merge. No follow-up slice.

Startup pointers were not edited. `JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md` still describe the post-#632 continuity writer. That is historical relative to Draft #636. The current pointer for this evidence is the handoff. Those startup files stay unchanged because this task forbids a startup-pointer edit.

## 7. Validation in this session

| Check | Result |
| --- | --- |
| Public HTTPS and GitHub deployment/status reads | Completed. Results are section 3. |
| Supabase control plane | Not re-executed. Cited as versioned Technical-Lead evidence. |
| `git diff --check` on the three allowlisted paths | Pass. No whitespace errors. |
| `node scripts/operating-mode-guard.mjs` | PASS |
| Production build | Not run. Changed paths are the task allowlist only. |
| Fresh CI / Vercel on this Draft head | Not claimed. The public binding above is current `main`, not this Draft. |

## 8. Stop

This is **not a launch PASS**.

STOP for independent main-chat Technical-Lead review.

Cursor does not Ready, merge, mutate Production, buy backup capacity, continue #626, or start a follow-up slice.
