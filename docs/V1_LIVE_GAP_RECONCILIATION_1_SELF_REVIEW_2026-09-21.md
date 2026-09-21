# Jetnity – V1 Live Gap Reconciliation 1 — ADVERSARIAL SELF-REVIEW

Stand: 21. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #495  
Draft PR: #497  
Reviewed artefact: `docs/V1_LIVE_GAP_RECONCILIATION_1_REPORT_2026-09-21.md`

This document exists to argue against the reconciliation, not to endorse it. A feature/audit author’s own review cannot substitute for an independent Technical-Lead PASS.

---

## 1. Where this reconciliation is most likely to be wrong

### 1.1 `CLOSED` may over-close a residual the G2 matrix still cares about

The binding task asks for one classification per material finding. Several historical rows were split so a closed half would not hide an open half. A reviewer can still disagree with the **primary** label:

- **2.1 `CLOSED`.** #476 shipped a scoped owner JSON export and honestly refused legal-DSAR completeness. A reader who treats “data-subject access” as the full CH-DSG/GDPR right can call this `PARTIAL`. I chose `CLOSED` because repeating the #476 engineering slice would be the exact duplicate work this reconciliation exists to prevent. The residual is named.
- **4.1 `CLOSED`.** The process document exists; mailbox monitoring and a ticket vendor do not. I treated those as out-of-scope residuals that #470 already declared, not as a reason to keep the historical P1 open.
- **3.4(a) `CLOSED`.** A runbook is not a rehearsed recovery. The G2 self-review already said P0 vs P1 was judgement. The operational document the audit asked for now exists.
- **5.2 `PARTIAL`.** A stricter reading is `STILL_OPEN`, because ingestion — the original defect — is unchanged. I used `PARTIAL` so #485/#487 are not rebuilt, and I stated in the same row that release-gate §G is not satisfied.

If the Technical Lead wants a single conservative label for 5.2, `STILL_OPEN` is defensible. It must then still record that architecture and presentation must not be redone.

### 1.2 `PO_GATED` vs `STILL_OPEN` is a labelling choice

1.1, 2.2, 2.4, 3.8 and 5.5(b) are both still missing **and** gated. I used `PO_GATED` as the primary label because the next responsible action is a decision, not a Cursor implementation. A reviewer who wants every absent capability labelled `STILL_OPEN` can do that without changing the “new engineering slice needed? No” column.

### 1.3 I did not re-run credentialed Production checks

3.8 and 3.6 rest on #480’s already-recorded Production snapshot plus current `supabase/config.toml`. This slice did not repeat `auth:produktion:lesen`. If Production SMTP was configured out-of-band after #480, this report would be wrong. I found no repository evidence of that, and I did not claim a fresh Production read.

### 1.4 Continuity-staleness could be overweighted

I recorded that `JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md` still say HOLD and “#487 parked”. That is true on this tree. A reviewer might consider it out of scope for an Account/Privacy/Operations reconciliation. I kept it because the task required reading those files against live main, and because a later agent who trusts them will incorrectly park or reopen #487.

I did **not** edit those files. Editing them would have violated the task.

### 1.5 Line numbers and “no application INSERT”

The 5.2 no-writer claim was re-checked with a repository search over `*.ts` / `*.tsx` / `*.mjs` / `*.sql` for `security_events`. Matches are readers, RLS/grants, types, honest-copy tests, and the privileged `scripts/db/sicherheit.mjs` fixture. I did not read every admin security route line-by-line. If a writer exists under an unexpected symbol, this search would miss it. I found none.

### 1.6 #494 could land before this review

#494 is an open parallel slice. If it merges before #497 is reviewed, 5.2’s residual wording stays correct — a local disposable proof still would not close persistent ingestion — but the “next exclusive owner” sentence would need a live re-read. This report must not be used as a reason to merge or stop #494.

---

## 2. Where I believe the reconciliation is solid

- **Closed copy/runtime slices that are independently visible on main:** 1.4 (no DSGVO string except absence tests), 1.2(a) (file absent), 4.2 (`app/account/error.tsx` present), 6.3 (AdminStatsStrip no longer has Umsatz tiles), 2.1 (export route + settings entry).
- **#487 is merged.** Reconstructing it as parked is now a continuity defect, not a product defect.
- **No finding was implemented.** The diff is docs-only by construction.
- **Parallel ownership was respected.** No `scripts/db`, no `package.json`, no #498 files.
- **Refusal to start the remaining PO-gated cluster** from a reconciliation report.

---

## 3. Attacks I ran against my own draft

| Attack | Result |
| --- | --- |
| Did I mark 5.2 CLOSED because #487 merged? | No. Ingestion remains the residual. §G not satisfied. |
| Did I keep 1.4 / 4.2 / 6.3 / 2.1 open from stale G2 text? | No. Live files contradict the historical MISSING state. |
| Did I invent legal pages or SMTP as an engineering next slice? | No. |
| Did I edit global continuity to make the report tidier? | No. Stale HOLD/#487 prose is recorded, not “fixed”. |
| Did I touch #494 harness files or recommend merging them? | No. |
| Did I treat #498 as a second writer of this matrix? | No. |
| Did I claim Production SMTP/redirect state from a new credentialed read? | No. Cited #480 + current config.toml only. |
| Did I run tests and call them green? | No. Recorded as not run. |
| Did I collect traveller credentials? | No. Not relevant. |

---

## 4. Compliance with the binding task

| Requirement | Met? | Note |
| --- | --- | --- |
| Read G2 matrix/status/handoff | Yes | |
| Read JETNITY_START_HERE / live main | Yes | Recorded the stale HOLD/#487 contradiction |
| Read closure docs for #457, #460, #464, #470, #471, #472, #476, #477, #480, #483, #485, #487 | Yes | |
| Current runtime files as read-only evidence | Yes | RegisterForm, LoginForm, settings, account error, AdminStatsStrip, ehrliche-zustaende, system-health, config.toml, vercel.json, package.json, migrations comments |
| Classify every required finding | Yes | Required set plus explicit splits where one label would lie |
| Live evidence wins | Yes | |
| Docs/evidence only | Yes | |
| No runtime / scripts/db / package.json | Yes | |
| No global continuity edits | Yes | |
| No implementation | Yes | |
| No Ready / merge / follow-up | Yes | |
| Freeze head + PR comment evidence | After this persist | STATUS says CI/Vercel go in the PR comment |
| Disjoint from #494 / #498 | Yes | |

---

## 5. Known coverage this reconciliation did not expand

The G2 self-review already named audit holes that are still not this slice: backup/restore, SMTP deliverability (SPF/DKIM/DMARC), and release-gate §F web-security headers. I did not silently add them to the current-truth matrix.

---

## 6. Stop

This self-review is not a Technical-Lead PASS.

**STOP FOR TECHNICAL-LEAD REVIEW.**
