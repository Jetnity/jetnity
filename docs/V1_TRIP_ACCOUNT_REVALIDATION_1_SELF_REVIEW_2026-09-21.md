# Jetnity – V1 Trip Workspace & Account Revalidation 1 — ADVERSARIAL SELF-REVIEW

Stand: 21. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Canonical issue: #507  
Draft PR: #509  
Reviewed artefacts: REPORT, NEXT_SLICES, STATUS, HANDOFF, `docs/evidence/v1-trip-account-revalidation-1/`

This document exists to argue against the revalidation, not to endorse it. A feature/audit author's own review cannot substitute for an independent Technical-Lead PASS.

---

## 1. Where this revalidation is most likely to be wrong

### 1.1 TA-N1 may be over-scoped

The commercial-date freeze is an **accepted** Phase-3 protection, proven by tests that *want* `startsOn` to stay. Calling the missing attention signal a “finding” can be read as inventing work. I kept it P3 and forbade moving the dates. A reviewer may drop TA-R2 entirely.

### 1.2 I did not run the product

No Preview click-through, no authenticated `/reisen` adoption, no live archive, no Production SQL. Account pages and `GastreiseBruecke` are source-traced. If hydration or a server action disagrees with the unit tests, this report will miss it. That is an authorized coverage hole, not a claimed product hole.

### 1.3 Explore-agent contamination

Three explore passes were used. I re-checked the closures and residuals against current files (`proxy.ts`, `kanten.ts`, `uebernahme.ts`, `GastreiseBruecke.tsx`, `anwenden.ts`, `foundation-e-select.ts`, `bezeichnungen.ts`, `navigation.ts`, `datenexport.ts`, `account-registry-trip.ts`). I ran the tests myself (479/479). I rejected explore claims I did not re-see (including any full-suite 3523 figure).

### 1.4 “No P0/P1” can be under-severity

If the Technical Lead treats silent guest-draft loss or singularized credentials on a live fallback as launch-blocking, RH-2.1 / RH-4.1 rise. I did not promote them because:

- RH-2.1 is the accepted schema filter plus a UI gap, not data overwrite;  
- RH-4.1 is a degraded schema path; Foundation-E children are documented as Production-applied.

### 1.5 Day→stage editor temptation

Sequential check S1 can be misread as “users cannot associate days.” TW6 `unassigned` is an accepted create mode. I recorded the missing first-class editor and **refused** to make it a next slice. A reviewer who wants V1 multi-destination planning to include explicit assignment should write a new provenance task, not treat that as a bugfix.

### 1.6 #506 unread as evidence

I did not ingest #506 screenshots. If visual audit already named TA-N1-like date confusion, this report may duplicate a presentation finding. Ownership stays: they own pixels; this PR owns the functional residual only.

---

## 2. Where I believe the revalidation is solid

- Closed #500/#502/#504 were re-tested, not merely assumed.  
- Guest adoption happy path and archive provenance have large existing suites that passed here.  
- Dual-Authority / no preferred passport was re-read and re-tested.  
- #497 PO-gated list was not rebuilt as engineering work.  
- Allowed path list is mechanically checkable.  
- Main drift is actually zero; no rebase theatre.

---

## 3. Compliance with the binding task

| Requirement | Met? | Note |
| --- | --- | --- |
| Execute the 21 Sep task exactly | Yes | |
| Reuse #497/#498 and #500/#502/#504 | Yes | |
| Not a second generic audit | Yes | Matrix is trip/account + sequential |
| Classify implemented/partial/blocked/PO-gated/later | Yes | Report §2 |
| Sequential checks with execution class | Yes | Report §3 + evidence JSON |
| One-to-three concrete repairs or say none | Yes | Three honesty slices; TL may choose zero |
| Allowed files only | Yes | |
| No runtime / global continuity | Yes | |
| No #506 / #510 / #494 write | Yes | |
| Exact agent/session/model | Yes | |
| Freeze; CI IDs in PR comment | Pending push | |
| No Ready / merge / follow-up / implementation | Yes | |

---

## 4. Recommended Technical-Lead attacks

1. Confirm `git diff --name-only origin/main...HEAD` is slice-local.  
2. Decide TA-R2 is real or accepted-protection noise.  
3. Do not treat 479 local tests as E2E or Production.  
4. Do not dispatch legal/SMTP/TW-8 from this PR.  
5. Re-fetch `origin/main` before merge; report drift, do not auto-rebase if unrelated.

---

## 5. Stop

This self-review is not PASS.

**STOP FOR TECHNICAL-LEAD FUNCTIONAL REVIEW.**
