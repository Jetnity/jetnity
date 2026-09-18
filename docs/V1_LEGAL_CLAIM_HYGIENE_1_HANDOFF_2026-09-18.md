# Jetnity – V1 Legal Claim Hygiene 1 HANDOFF

Stand: 18. September 2026  
Status: **IMPLEMENTATION COMMITTED / GATES PENDING / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**

Binding task: `docs/V1_LEGAL_CLAIM_HYGIENE_1_TASK_2026-09-18.md`  
Detailed status: `docs/V1_LEGAL_CLAIM_HYGIENE_1_STATUS_2026-09-18.md`  
Self-review: `docs/V1_LEGAL_CLAIM_HYGIENE_1_SELF_REVIEW_2026-09-18.md`

This document is enough for a new agent or Technical Lead to continue without the chat.

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #456 |
| Draft PR | #457 |
| Branch | `fix/v1-legal-claim-hygiene-1` |
| Canonical base | `main@004dae4d672b9b386fd24ded0babe7ff8d5d5fad` |
| Dispatch head | `fabaa54f1705ce68058c26a9fca9ef743c8a188f` |
| Source audit | #438 / merged PR #449 / finding 1.4 |
| Agent | Jetnity V1 legal claim hygiene 1, Generation 1 |
| Parent model | Cursor Grok 4.6 High Fast (confirmed) |
| Session | `bc-26131993-3a68-46a6-8e54-2752c0dbcce0` |

Read first:

1. `docs/V1_LEGAL_CLAIM_HYGIENE_1_TASK_2026-09-18.md`
2. finding 1.4 in `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_GAP_MATRIX_2026-09-17.md`
3. this handoff and the STATUS / SELF_REVIEW for the same slice
4. live PR #457, live `origin/main`, live CI and Vercel Preview

Do not treat this file as current exact-head truth after a later commit.

## 2. What changed

Two standalone auth footers that asserted `Datenschutz: DSGVO & CH-DSG konform.` are gone.

- Register still requires the terms/privacy checkbox and still links `/terms` and `/privacy`.
- Login still has no terms checkbox and no legal links.
- No replacement conformity wording was added.

The AP-6a legal-foundation inventory test now fails if the prohibited claim returns.

## 3. What a reviewer should verify first

1. Exact prohibited assertion absent from both auth source files.
2. Register checkbox, labels, links, validation and submit gating unchanged.
3. Login gained no consent/legal semantics.
4. Focused inventory test now locks absence, not presence.
5. Local gates, exact-head CI and exact-head Preview after they exist.
6. `origin/main` re-fetch: exact head, merge-base, ahead/behind, drift.

## 4. What this slice does not mean

Removing the claim does **not** make Jetnity DSGVO- or CH-DSG-compliant. Findings 1.1, 1.5, 2.1 and 2.2 remain open and are out of scope.

## 5. Next step

Complete required local and exact-head gates, then **STOP FOR TECHNICAL-LEAD REVIEW**.
