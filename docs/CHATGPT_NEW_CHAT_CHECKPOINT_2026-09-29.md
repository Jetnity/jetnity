# Jetnity – ChatGPT New Chat Checkpoint – 29. September 2026

Stand: 29. September 2026  
Status: **NORMAL / PREFLIGHT 2 ACCEPTED AS THE RELEASE BOUNDARY / DEVELOPMENT SECURITY-EVENT RETENTION 1 IS A LATER APPROVED WRITER / EXTERNAL WAITS OPEN**

> **Later writer, recorded 29 September 2026 without rewriting this checkpoint's historical body.** Product Owner comment `5887161416` approved the #626 Development proposal. Draft PR #628 on `feat/dev-security-event-logging-retention-1` is that package. Logical agent **Jetnity development security event logging retention 1**, Generation 1, session https://cursor.com/agents/bc-b1f79b09-d5cb-4f74-97a5-50bb9a4ee7ab, `originalModelName=grok-4.7-high-fast`. Baseline `main@e785cd00b090042ac6622383bceebd7f6ddfed88`. R2 review `5351648702` is a later correction on this same branch. The reviewed head `51ad3a38` is not the current tip. The R1 trigger check was not exact function, predicate, and column identity. Local proof only, including a local PostgreSQL 17 run. Hosted apply and Production were not run. Finding 5.2 stays partial. #626 stays open. Handoff: `docs/DEV_SECURITY_EVENT_LOGGING_RETENTION_1_HANDOFF_2026-09-29.md`. The sections below remain the Preflight 2 continuity persist, including its then-current `main` pin `a9a8898c` and its "no ungated implementation" conclusion. Live evidence still wins over both.

> Live evidence wins. Read this checkpoint, then re-fetch `main`, open PRs, open issues, Actions, Vercel, and the latest #395, #294 and #585 comments before selecting work.

## 0. Current main and operating mode

Repository: `Jetnity/jetnity`

Current `main` at the 2026-09-28T23:47:37Z verification:

`a9a8898ca2362b2ef86ccb1817a62eaa439c2d30`

That commit is Merge #622, V1 Release Readiness Preflight 2, merged 2026-09-28T23:39:46Z. The branch that wrote this checkpoint was 0 behind that `main` and ahead only by the continuity task seed plus this persist. If `main` has moved past `a9a8898c` for any other reason, stop and reconstruct again. Do not keep this SHA as current by habit.

Machine mode in `.jetnity/operating-mode.json`: **`NORMAL`**.

Normal bounded work may be selected by the Technical Lead. `NORMAL` does not grant Production migration, provider activation, real payment, sensitive-data storage, public launch, or any other reserved Product-Owner gate.

The JSON `activeMetaScope` still names historical Continuity Refresh 1 (Issue #511 / PR #512). That object is not the current writer. This checkpoint does not edit the operating-mode file.

`JETNITY_START_HERE.md` section 3 still pins an older runtime baseline. That section is a dated audit pin. It is not current `main`.

## 1. Accepted Preflight 2

This is the canonical current release-readiness map. It is not a launch PASS.

| Fact | Value |
| --- | --- |
| Issue #621 | CLOSED |
| PR #622 | MERGED |
| Accepted head | `5b2cb44e500323e6a3573fb5709b6c7769afccc4` |
| Technical-Lead FINAL PASS | review `5345955245` |
| Merge | `a9a8898ca2362b2ef86ccb1817a62eaa439c2d30` |
| Exact-head CI | `36498483601` SUCCESS |
| Exact-head Vercel Preview | `dpl_2RTuPAkn9iUUWcYQuLTYbizHFUHD`; GitHub Deployment `6722939513` success |
| Post-merge CI | `36499178855` SUCCESS, including Auth |
| Post-merge Vercel Production | `dpl_9EAtK55s6XSyAf2yLZgv17fkrQdw`; GitHub Deployment `6723050820` success, environment Production |
| Immediate ungated V1 candidates | **NONE** |

The Production record does not, by itself, prove that the public alias `jetnity.com` is serving this SHA. This session did not re-fetch public HTML and did not read alias text from the Vercel dashboard.

Canonical report, left unchanged:

`docs/V1_RELEASE_READINESS_PREFLIGHT_2_REPORT_2026-09-29.md`

Canonical closure:

`docs/V1_RELEASE_READINESS_PREFLIGHT_2_CLOSURE_2026-09-29.md`

The report's own STATUS and HANDOFF still say Draft / not merged. That was true at delivery. This closure supersedes that delivery-time status. Do not edit those delivery files to pretend they were written after the merge.

## 2. Provider and legal waiting states

Re-read in this session. No newer comment existed.

- **KAYAK #395** — comment `5869751056`, 2026-09-28T12:22:55Z. `A-KAYAK-INQUIRY-1` sent from `info@jetnity.ch` to `partnerships@kayak.com`. **WAITING FOR RESPONSE.** No form, Terms acceptance, signup, credential, call, spend or adapter was authorized.
- **Sherpa #294** — comment `5875627554`, 2026-09-28T17:59:04Z. Information-only inquiry sent to `partners@joinsherpa.com`. **WAITING FOR RESPONSE.**
- **IATA Timatic #294** — comment `5875963553`, 2026-09-28T18:21:25Z. Official business form submitted, including the disclosed website Terms consent. **WAITING FOR RESPONSE.** No Timatic API contract, credential, call or spend was authorized.
- **#585** — comment `5874769319`, 2026-09-28T17:03:16Z. Product Owner deferred the PrivacyBee support inquiry and accepted the current generated wording for Switzerland-first prelaunch. Not a current engineering task. Do not hand-edit PrivacyBee.

No provider or Official Truth source is selected.

## 3. Production readback limitation

Preflight 2 classified a fresh Production Supabase inventory as `INSUFFICIENT_CURRENT_EVIDENCE`. This continuity persist did not gain that read path and did not invent one.

Last recorded Production readback:

`docs/V1_RELEASE_READINESS_PREFLIGHT_1_CLOSURE_2026-09-28.md`

That closure recorded migration `20260927230000_reise_graph_kaskade_tiefe`, `account-delete-v1` ACTIVE v1 with `verify_jwt=true`, and a WARN-only Security Advisor result that does not close Security Gate B or finding 5.2. It is historical evidence, not a new read against `a9a8898c`.

## 4. Current release blockers

All of these stay gated, proof-dependent, or deliberately later. None is a Cursor dispatch.

- No live flight, hotel or activity truth. Production commercial search stays fail-closed.
- No contracted Official Entry source.
- Finding 5.2 persistent security-event ingestion.
- No alerting vendor.
- Retention undecided. Consent not persisted.
- Backup/restore not proven.
- Real provider / Official Truth end-to-end not executable yet.
- No fresh whole-journey device or Core Web Vitals proof.
- Public indexing off. No public-launch approval.
- Production account-count exposure still gated.
- CSP absence and `access-control-allow-origin: *` on the earlier public `GET /` remain a later hardening observation, not the traveller-critical path.

## 5. Recent closed work

Do not redispatch #606, #608, #610, #612, #614, #616, #618 or #620. GitHub showed each PR **MERGED** and each parent issue **CLOSED** at this read. The accepted map of what they changed is Preflight 2 report §4. Admin F is the already shipped #545 palette. Do not rebuild it.

The 28 September checkpoint still describes #608 as awaiting review. That file is now explicitly historical. Its then-current sentences were not rewritten.

## 6. No ungated implementation

The Technical Lead challenged **NONE** in review `5345955245` and accepted it.

A stale startup pointer was the only safe follow-up, and it is this docs persist. It is not a product slice. After Draft PR #625 closes, do not start another writer until a real gate changes or fresh evidence shows a genuine ungated defect.

## 7. Startup reconstruction

1. Read this checkpoint and the Preflight 2 closure.
2. Fetch `origin/main`. Confirm whether it is still `a9a8898ca2362b2ef86ccb1817a62eaa439c2d30`.
3. List open PRs and open issues. At this read the open product/governance issues were #624 (this persist), #294, #585, #395, #440, #236 and #20. Open drafts besides #625 were historical #52, #50, #40, #39 and #28. Do not resume those drafts.
4. Re-read the latest #395, #294 and #585 comments before claiming the inquiries are still unanswered.
5. Re-read Actions and the Vercel commit status for whatever `main` actually is.
6. Ignore `.jetnity/operating-mode.json` `activeMetaScope` and the historical blocks in `JETNITY_START_HERE.md` / `docs/ACTIVE_WORK_STATUS.md` as writer maps.
7. Only then decide whether any new slice exists. Default while the three inquiries are only waiting: **no new runtime slice**.

## 8. Roles

ChatGPT / Technical Lead owns slice selection, independent exact-head review, Ready and Merge.

Cursor is the writer only. Cursor does not Ready, does not merge, does not contact providers, and does not start the next slice.

Special Product-Owner gates remain in force, including Production migration, provider contract/secret/spend, payment, sensitive document storage, and public launch.

## 9. Current writer

While Draft PR #625 is open, the only current writer is:

- Logical agent: **Jetnity V1 preflight 2 continuity persist**
- Generation: **1**
- Branch: `docs/v1-preflight-2-continuity-persist`
- Issue: #624
- Model required for that dispatch: Grok 4.7 High Fast

The exact PR head moves when this persist commits. Read it live. Do not reuse the task-seed SHA `587465047af750069187d484fde06866656d80ec` as the review head.

After review and merge, that writer is finished. No successor is authorized by this checkpoint.
