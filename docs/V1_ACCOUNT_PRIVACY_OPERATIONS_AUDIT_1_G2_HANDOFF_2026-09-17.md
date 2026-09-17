# Jetnity – V1 Account / Privacy / Operations Minimum Audit 1 (Generation 2) — HANDOFF

Stand: 17. September 2026
Status: **HANDOFF TO TECHNICAL LEAD / DRAFT / NOT READY / NOT MERGED / NO REMEDIATION STARTED**

Canonical issue: #438
Draft PR: #449
Branch: `audit/v1-account-privacy-ops-1-g2`
Canonical base: `main@69f3b206fc87bf4a3ff9e3c275cf55d244c0a9a6` (live `origin/main` identical at handoff — no drift)

---

## 1. What a new agent or chat must read, in this order

1. `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_TASK_2026-09-17.md` — the binding task.
2. `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_GAP_MATRIX_2026-09-17.md` — the audit result. This is the substance; everything else is process.
3. `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_STATUS_2026-09-17.md` — git evidence, what was and was not verified.
4. `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_SELF_REVIEW_2026-09-17.md` — adversarial self-review, including where this audit could be wrong.
5. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md` and `docs/ACTIVE_WORK_STATUS.md` — current governance and programme state.

Read the matrix's "Audit boundaries" section before acting on any row. Several rows are deliberately marked *unknown* rather than passed or failed.

---

## 2. Current state in one paragraph

The audit is finished and persisted. Nothing was remediated. The V1 blocking set for this domain is seven P0 items and eight P1 items. The most concrete of them is that Jetnity has no production email sender, so registration confirmation and password recovery break at any real volume (3.8) — the repository already knew this and this audit moves it into the blocking set. The most important structural finding is that five of the seven P0 items are blocked on Product-Owner input rather than on engineering capacity — legal content, a destructive-deletion decision, an email provider and an error-tracking vendor — while a separate cluster of high-value items is completely ungated, free and currently unclaimed. The branch is docs-only on top of an unchanged `main`, working tree clean, Ready not set, no merge.

---

## 3. Recommended next step

**Technical-Lead review of the gap matrix, then decide the remediation order.** Do not start remediation from this document; the binding task ends at review.

If remediation is authorised, the audit's own recommendation is to take the ungated cluster first, because it closes one P0 and mitigates a second at zero cost and zero gate risk:

| Order | Item | Why first |
|---|---|---|
| 1 | **1.4** — remove the unproven "DSGVO & CH-DSG konform" assertion from `RegisterForm.tsx` L386 and `LoginForm.tsx` L288 | A P0 that is a two-line copy change. It is a false statement to users on a regulatory matter, already flagged on 29 August 2026 and still live. |
| 2 | **3.4 (operational half)** — write the admin MFA-loss recovery runbook | Closes an operational P0 with documentation only. Admin access is hard-gated on AAL2, so a single admin losing a TOTP device currently locks the admin area with no in-product path back. Break-glass does not help: `reachesDatabase()` is false for it. |
| 3 | **5.5 (process half)** — write the incident process: who notices, how, escalation, kill-switch procedure | Satisfies part of release-gate §H at zero cost and turns the later tooling decision into a concrete one. |
| 4 | **4.1 (process half)** — define the support process behind `info@jetnity.ch` | Three other gaps silently assume a support channel exists. |
| 5 | **4.2** — add `app/account/error.tsx` | Small runtime slice mirroring an existing pattern; the authenticated area currently has no error boundary at all. |
| 6 | **6.3** — extend the admin overview caveat, or suppress the monetary tiles and conversion ratio | Prevents an admin revenue figure with no revenue behind it. |
| 7 | **3.3** — one credentialed Production auth verification pass | Resolves the AAL2 contradiction and, in the same pass, the unverified items in 3.6 and 3.7 (redirect allow-list, rate limits, HIBP). Highest information gain per unit of effort in the whole matrix. |

In parallel and independently of that order, **3.8 (email provider) should go to the Product Owner immediately**, because it is a launch blocker that requires only a decision plus configuration — no application code — and because every other auth-related row in the matrix implicitly assumes it is solved.

Then the remaining PO-gated cluster: legal content (1.1), export scope (2.1), deletion decision (2.2), retention decision (2.4).

Each of items 1–6 should be its own small slice with its own PR. Do not bundle them.

---

## 4. Explicit Product-Owner decisions this audit surfaces

These are presented for decision, not implemented:

1. **An email-sending provider (SMTP) for Production.** Launch-blocking (3.8). Requires a provider choice and a secret; volume is currently low so cost should be minimal, and several providers have free tiers. `ARCHITECTURE.md` L361 records that earlier Infomaniak mail automation was removed in the V2 cleanup, so this is a deliberate re-introduction rather than a new dependency class.
2. **Legal content for `/privacy` and `/terms`.** Blocked by design: `lib/legal/ap6a-gate0-vertrag.ts` L31 forbids agent-generated legal text, and `docs/PRIVACYBEE_PRODUCT_OWNER_BINDING_DECISION_2026-08-30.md` L111 authorises no vendor activation. Nothing in this P0 can move without this input.
3. **Account deletion semantics.** Immediate hard delete or grace period? What is retained for legal or accounting reasons? Destructive and reversal-hard, therefore gated.
4. **Retention periods per data class.** Needed before a truthful retention statement can appear in the privacy notice. Documenting the decision is cheap and unblocks 1.1; enforcing it is a Production migration and gated.
5. **Whether to introduce error tracking / alerting, and with which vendor.** New provider, new data-processor relationship, potential recurring cost. Note that this also feeds the privacy notice.
6. **Whether to introduce any product analytics.** Would activate the consent obligation in 1.2(b), which is currently moot precisely because no tracker exists.
7. **Whether to keep the orphan `components/layout/CookieConsent.tsx`.** It contains an untrue processing claim and a dead link. The audit recommends deletion with an ADR recording why no banner exists.

---

## 5. Deliberately not done

- No remediation of any gap.
- No edit to the five stale/conflicting documents identified in matrix Section 7.4. They are recorded, not corrected: correcting another slice's documents is outside this audit's write scope, and the most important one cannot be resolved without credentialed access.
- No update to `ROADMAP.md`, `JETNITY_HANDOFF.md` or `docs/ACTIVE_WORK_STATUS.md`. The binding task forbids touching them. **Propagating this audit into the global continuity documents is a Technical-Lead follow-up** and is the one loose end in the progress-persistence chain that this slice could not close itself.
- No test, typecheck, lint or build run. See STATUS §3 for the reasoning and for the explicit statement that nothing here is claimed as green.
- No live Production, Preview, Supabase, Vercel or provider access.

---

## 6. Session / generation record

- Cursor agent: `Jetnity V1 account privacy operations audit 1`, Generation **2**.
- Generation 1 (Draft PR #439) failed repeatedly at the Cursor runtime/provider/tool level and persisted **no** audit output. This generation exists to force a fresh container/session.
- The reliability protocol from §"Reliability protocol" of the binding task was followed: bounded domain passes; early checkpoint commit after Sections 1–3 (`5b989a8c`); second checkpoint for Sections 4–7 (`2c2fd792`); final STATUS/HANDOFF/SELF_REVIEW commit; no whole-repository test suite run.
- Per `docs/JETNITY_AGENT_SESSION_ROTATION_STANDARD.md`: an immediate review fix on this same slice and PR stays in this session. A new logical slice — including any remediation of a gap listed here — must start a fresh numbered generation.

---

## 7. Governance

- **Do not mark Ready.** Not set by this agent.
- **Do not merge.** Only ChatGPT / Technical Lead may set Ready or merge, and only after independent exact-head review. Cursor agents never merge.
- **Do not start remediation** from this handoff without an explicit new task.
- Agent self-review is **not** a Technical-Lead PASS.
- Final state: **STOP FOR TECHNICAL-LEAD REVIEW.**
