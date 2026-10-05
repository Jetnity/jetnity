# Jetnity – V1 Account / Privacy / Operations Minimum Audit 1 (Generation 2) — ADVERSARIAL SELF-REVIEW

Stand: 17. September 2026
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Canonical issue: #438
Draft PR: #449
Reviewed artefact: `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_GAP_MATRIX_2026-09-17.md`

This document exists to argue against the audit, not to endorse it. Per `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md` and the binding task, a feature/audit author's own review cannot substitute for an independent Technical-Lead PASS.

---

## 1. Where this audit is most likely to be wrong

### 1.1 Severity assignments are judgement, not evidence

The states (`BUILT` / `PARTIAL` / `MISSING`) rest on verifiable evidence. The severities (P0–P3) do not — they are my interpretation of "V1 = production ready for real travellers" applied to each row. A Technical Lead may legitimately reassign several. The ones most open to challenge:

- **3.4 admin MFA lockout marked "operational P0".** This is arguably overstated. Anyone with Supabase project access can remove a factor from the console, so recovery *is* possible — it is simply undocumented and unrehearsed. The honest defect is the missing procedure, not an absolute lockout. I kept P0 because during an incident the admin area is exactly what you need and "someone probably has console access" is not a recovery plan, but P1 is a defensible alternative reading and the recommended fix (a runbook) is the same either way.
- **5.5 no error tracking marked P0.** This P0 derives from `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md` §G/§H, which I treated as binding. That document is a repository document, not a recorded Product-Owner decision that I verified as still current. If the Technical Lead considers the release gate advisory, 5.5 becomes P1.
- **2.1 / 2.2 marked P0.** These are P0 *for public launch with real users* and explicitly not for continued development. I stated that inline, but a reader skimming the consolidated table could mistake them for blockers on current work. They are not.
- **6.x marked P3.** I judged that V1 does not require revenue. If the Product Owner considers monetisation part of V1, several Section 6 rows rise sharply. `ROADMAP.md` §27 lists monetisation before launch readiness, which is evidence against my reading; I weighed the V1 definition in `docs/ACTIVE_WORK_STATUS.md` §2 ("production ready for real travellers") more heavily. This is a genuine interpretive fork and the Product Owner should settle it.

### 1.2 The main sweep missed a P0, which says something about the method

Row **3.8** (no production SMTP; project-wide two emails per hour) was found only in the adversarial pass, by asking what the auth flows silently depend on. The main sweep saw the symptom — I recorded `email_sent = 2/hour` in 3.7 and called it "tight for real users" — and did not follow it to the cause. Worse, the information was already sitting in `docs/AUTH.md` L265 in plain language ("Für den Launch reicht das nicht").

The lesson generalises, and I state it against my own work: **a capability-by-capability sweep finds missing capabilities but is weak at finding broken shared dependencies.** Everything in Section 3 assumed email delivery works; nothing in the matrix's structure forced that assumption to be stated. Other shared dependencies I did *not* systematically test the same way, and which a reviewer should probe:

- **Backup and restore.** Release gate §H requires verified Supabase backup/restore capability and a documented recovery procedure. I did not audit this at all. It is plausibly another P0 and it is **not** in my matrix. This is the clearest known coverage hole.
- **Deliverability beyond rate limits** — sender domain, SPF/DKIM/DMARC. Not audited. Even with SMTP configured, mail landing in spam would reproduce 3.8's user impact.
- **Canonical domain, HSTS, CSP and related web-security configuration** (release gate §F). Not audited; out of the six named domains but arguably inside "other release-critical trust gaps".

I have not silently expanded the matrix to cover these. I am naming them as gaps in the audit rather than gaps in the product, because asserting a state I did not verify would be exactly the failure this audit criticises elsewhere.

### 1.3 Evidence depth is uneven between absence and presence claims

I re-verified **every load-bearing absence claim** myself with direct searches at the audit head: missing legal/support/export/delete route directories, `CookieConsent` having no runtime importer, `deleteUser` appearing nowhere, no backup/recovery codes, `security_events` having no application writer, `blocked_ips` not being checked in `proxy.ts`, no payment or analytics or error-tracking dependency in `package.json`, the exact set of error boundaries, the `AdminFolgtSeite` usage set, and the persistent cost guard not being exported. Those I stand behind.

**Presence claims are weaker.** Many cited line numbers for code that exists came from delegated exploration passes and were verified selectively rather than exhaustively — I read `AdminStatsStrip`, `ehrliche-zustaende.ts`, the register/login legal copy, `config.toml` auth blocks and the release gate directly, but not, for example, every line reference inside `SecurityMFA.tsx` or `account-logout-scopes.ts`. The *substance* of those rows (TOTP lifecycle exists; scoped logout exists) is corroborated by multiple independent signals, but **individual line numbers in `BUILT` rows may be off**, and I would not want a reviewer to treat a precise line citation there as personally verified. The matrix already notes that symbol names are the durable anchor.

### 1.4 A structural asymmetry worth flagging

An audit that classifies gaps rewards finding problems. Two rows may be inflated by that pressure:

- **5.3 (IP blocklist not enforced)** — the code discloses this in its own success messages ("nicht enforced"). Calling it a P2 gap is defensible, but it could equally be recorded as a correctly-labelled non-capability.
- **6.3 (admin overview lacks the payments caveat)** — the payments *page* is honest; only the overview strip lacks the caveat, and in practice the 30-day window has almost certainly aged out the handful of legacy rows, so the tiles probably render zero today. I described this conditionally ("if any legacy row falls inside the window") rather than asserting a live misstatement, which I believe is the honest framing, but a reviewer may consider the row not worth a P2.

---

## 2. Where I believe the audit is solid

- **Absence claims** — independently re-verified, as listed in 1.3.
- **5.2 (nothing writes `security_events`)** — verified directly and unambiguous: three readers, zero application writers.
- **3.3 (Production AAL2 contradiction)** — I did not resolve it and explicitly did not pretend to. Both documents are cited with line numbers; the honest state recorded is *unknown*, which is what the binding task demands.
- **Refusal to claim Production parity** — every Production statement is either marked unknown or attributed to a repository declaration. No credentialed access was attempted.
- **Refusal to claim green gates** — no test, typecheck, lint or build was run, and this is recorded as *not run* rather than passed, per `AGENTS.md` §25.
- **7.6 (what is genuinely strong)** — deliberately included so the audit does not misrepresent the state by listing only failures. The data minimisation, RLS coverage, MFA lifecycle, honest empty-vs-error discipline and DB-enforced AI quota are real and should not be re-litigated.

---

## 3. Compliance with the binding task

| Requirement | Met? | Note |
|---|---|---|
| Audit all seven areas | Yes | Areas 1–6 as Sections 1–6; area 7 as Section 7 cross-cutting |
| Record evidence / state / V1 necessity / gap / severity / gate / next slice per capability | Yes | 32 rows |
| Live evidence outranks stale plans | Yes | Five stale/conflicting items identified in 7.4 |
| No compliance inferred from UI copy | Yes | 1.4 is the inverse finding — copy contradicted by absent capability |
| No Production parity claimed without evidence | Yes | 3.3, 3.6, 3.7, 3.8 and 2.6 all record *unknown* or *declared-only* |
| Bounded passes | Yes | Six domain passes |
| Early checkpoint after 2–3 sections | Yes | `5b989a8c`, Sections 1–3 |
| Second checkpoint for remainder | Yes | `2c2fd792`, Sections 4–7 |
| Final STATUS / HANDOFF / SELF_REVIEW commit | Yes | This commit |
| No unnecessary full test suite | Yes | None run; reasoning recorded in STATUS §3 |
| Write only slice-specific docs | Yes | Four new files, all `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_*` |
| No runtime / schema / dependency / CI / Vercel change | Yes | Docs-only diff proven in STATUS §2.2 |
| No global continuity docs | Yes | `ROADMAP.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md` untouched |
| No collision with #435 or #448 | Yes | No file of either slice read into scope or written |
| Re-fetch `origin/main`, report head / merge-base / drift | Yes | STATUS §2 — zero drift |
| Docs-only proof | Yes | STATUS §2.2 |
| PO gates classified, not implemented | Yes | 7.5, ten gated items |
| Do not mark Ready / merge / remediate | Yes | None done |

Two requirements I want to flag as *arguably* rather than cleanly met:

- **"Complete evidence-backed gap matrix."** Complete for the six named domains. Section 7 (other release-critical gaps) is where completeness is inherently unbounded, and 1.2 above names three areas I did not cover. I judge the matrix complete against the task's enumerated scope and incomplete against the broader release gate — and I would rather say so than claim completeness.
- **"Perform adversarial self-review."** This document is that. Its own weakness is that it is written by the same agent that produced the matrix, so it shares the matrix's blind spots by construction. The 3.8 discovery shows the pass had some value; it does not show the pass was sufficient.

---

## 4. What I would ask a reviewer to check first

1. **Is row 3.8 correct, and is anything else in that class missing?** Specifically: verify backup/restore (release gate §H), which I did not audit at all and which may be another P0.
2. **Do you accept the P0/P1 line?** In particular 3.4 (P0 vs P1), 5.5 (does the release gate bind?), and the Section 6 reading of whether V1 includes revenue.
3. **Spot-check three `BUILT` rows against the code**, since presence claims are the weakest evidence class (1.3). I would suggest 2.5 (guest migration), 3.5 (logout scopes) and 5.7 (model quota).
4. **Decide who corrects the five stale documents in 7.4.** I recorded them and edited none, because correcting another slice's documents is outside this audit's write scope. The Production AAL2 contradiction in particular cannot be resolved without credentialed access and should not be left as two mutually exclusive statements in the repository.
5. **Decide whether this audit propagates into the global continuity documents.** The binding task forbade me touching `ROADMAP.md`, `JETNITY_HANDOFF.md` and `docs/ACTIVE_WORK_STATUS.md`, so this audit currently exists only in its own files. Under `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md` that is the one loose end in the persistence chain that this slice could not close itself.

---

## 5. Governance

- Ready: **not set.**
- Merge: **not performed.**
- Remediation: **not started.**
- This self-review is **not** a Technical-Lead PASS and must not be treated as one.
- Final state: **STOP FOR TECHNICAL-LEAD REVIEW.**
