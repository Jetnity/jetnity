# Jetnity – V1 Core Regression Hunter 1 — ADVERSARIAL SELF-REVIEW

Stand: 21. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Canonical issue: #496  
Draft PR: #498  
Reviewed artefact: `docs/V1_CORE_REGRESSION_HUNTER_1_REPORT_2026-09-21.md`

This document exists to argue against the hunter, not to endorse it. A feature/audit author's own review cannot substitute for an independent Technical-Lead PASS.

---

## 1. Where this audit is most likely to be wrong

### 1.1 Severity is judgement

The line citations are verifiable. P2 vs P3 is not.

Most open to challenge:

- **RH-1.1 as P2.** The code comment says “Nicht prüfbar heisst nicht freigegeben.” Fail-closed redirect is an accepted security posture. A reviewer may call this a NON-FINDING or P3 UX residue because access is not granted. I kept P2 because the API path already distinguishes `lookup-failed` and `AGENTS.md` §15 forbids labelling failure as a benign state.
- **RH-3.1 as P2.** Account `reiseAus()` sorts stages. If every live graph is sorted before `kanten.ts` runs, this is latent P3. I kept P2 because `reise-orte.test.ts` treats unsorted arrays as a real case and mobility tests do not.
- **RH-10.1 as P2.** With no application writer, both KPIs are usually empty. The taxonomy split is still a real contract disagreement and will matter as soon as any readable row exists (`login_failed` fixtures). A reviewer may call it P3 until ingestion exists.
- **RH-12.1 as P2.** #480 already closed finding 3.3 for AUTH.md. Leftover ARCHITECTURE/DATENBANK sentences are continuity hygiene. I kept P2 because a second apply is an operational hazard, not because Production AAL2 is unknown to this hunter.
- **RH-6.1 / RH-5.1 as P3.** I did **not** promote them to P2 because the official provider is `null` and the traveller helper is unused in `components/`. If a reviewer has evidence of live mixed `current` official rows, RH-6.1 rises.

I found **no P0/P1**. That can be under-severity if the Technical Lead treats leftover “Production lacks AAL2” sentences as an active security-truth P1.

### 1.2 Method is weaker on presence than on absence

Absence claims I re-checked directly: no `autoApply` / `auto-apply` symbol; no production `primaryCitizenship` / `defaultPassport` inference; hotel/activity factories `null`; assistant action has no apply counterpart; `commercialBesteQuelleWaehlen` returns `null`; world-map does not read `account_visits`.

Presence claims (exact line numbers inside large files, “all 12 admin routes use `requireAdminApi`”) were sampled, not exhaustively re-read after the explore pass. Symbol names are the durable anchor.

### 1.3 I did not run the product

No test suite, no Preview click-through, no Production SQL. A hunter that only reads code will miss runtime-only regressions (hydration, proxy cookie edge cases, Preview env flags). I state that as an audit-coverage hole, not as a product hole.

### 1.4 Domain 12 can look like PR #497

RH-12.1 restates a leftover of historical finding 3.3. I limited it to the two documents #480 did **not** correct, and I did not emit a CLOSED/STILL_OPEN matrix. If the Technical Lead wants a single owner for AAL2-doc drift, that owner is a continuity slice or #497 — not a second closeout from this PR.

RH-12.3 records leftover HOLD/#487-parked fields. Correcting them is explicitly forbidden to this writer. Treating that leftover as live HOLD would be the opposite error.

### 1.5 Explore-agent contamination

One explore pass claimed workspace HEAD was `main@4a223d34` and that `npm test` was 3509/3509. Both are rejected:

- live `origin/main` after fetch is `4169c5b4`
- this writer did not run `npm test`

If any sentence in the report depended only on that pass, it was dropped or re-verified.

---

## 2. Where I believe the hunter is solid

- **No P0 invented.** I did not elevate residuals to launch blockers.
- **Happy-path traveller / assistant / provider / planned≠visited / empty≠error** are corroborated by multiple independent files and existing tests-as-source.
- **Docs-only / ownership boundary** is mechanically checkable.
- **Unknown stays unknown** for live Production SQL and for post-merge verification of #492.

---

## 3. Compliance with the binding task

| Requirement | Met? | Note |
| --- | --- | --- |
| Attack all 12 domains | Yes | Report §1–§2 |
| Binding invariants attacked | Yes | Report §3 scorecard |
| FACT / INFERENCE / RISK / RECOMMENDATION | Yes | Every finding |
| Exact file/function evidence | Yes | Paths + symbols + lines |
| Explicit non-finding when clean | Yes | Report §2 |
| Allowed files only | Yes | Task + REPORT + STATUS + HANDOFF + SELF_REVIEW |
| No runtime / scripts/db / package.json | Yes | STATUS §2.1 |
| No global continuity edits | Yes | ACTIVE_WORK / ROADMAP / HANDOFF / operating-mode untouched |
| No implementation / Ready / merge / follow-up | Yes | |
| No overlap with #494 / #497 | Yes | Those files not written |
| Validation: docs-only, exact main, behind=0 | Yes at persist time; re-check live HEAD |
| CI/Vercel if triggered | Dispatch-head recorded; content-head must be re-fetched |
| Review threads 0 | Yes at persist start |
| Freeze head + PR comment + STOP | This persist + PR comment |

Arguably, not cleanly:

- **“Attack accepted contracts.”** Some P3s attack *latent* helpers, not currently rendered UX. I marked them latent rather than dropping them, because the task asked to attack the invariant, not only the current paint.
- **Progress persistence vs forbidden global continuity.** The binding task wins. ACTIVE_WORK_STATUS was not updated. That is the same loose end the G2 audit recorded.

---

## 4. What I would ask a reviewer to check first

1. Is RH-1.1 a real honesty defect or accepted fail-closed UX?  
2. Can any live trip graph reach `benoetigteKanten` with array order ≠ `position`? If no, drop RH-3.1 to P3.  
3. Spot-check three non-findings: assistant no-apply, flight Production hard-off, planned≠visited.  
4. Do not let this PR become a stealth continuity update of ARCHITECTURE.md.

---

## 5. Governance

- Ready: **not set.**  
- Merge: **not performed.**  
- Remediation: **not started.**  
- This self-review is **not** a Technical-Lead PASS.  
- Final state: **STOP FOR TECHNICAL-LEAD REVIEW.**
