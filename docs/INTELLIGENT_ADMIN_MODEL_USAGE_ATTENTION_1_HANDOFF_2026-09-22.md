# Intelligent Admin Model Usage Attention 1 — Handoff

Stand: 22. September 2026  
Status: **MU-R1 CORRECTED / STOP FOR TECHNICAL-LEAD RE-REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**

Binding task: `docs/INTELLIGENT_ADMIN_MODEL_USAGE_ATTENTION_1_TASK_2026-09-22.md`  
Accepted contracts: Foundation 1 DECISION / SOURCE_MATRIX / RUNTIME_TASK §10  
Status: `docs/INTELLIGENT_ADMIN_MODEL_USAGE_ATTENTION_1_STATUS_2026-09-22.md`  
Self-review: `docs/INTELLIGENT_ADMIN_MODEL_USAGE_ATTENTION_1_SELF_REVIEW_2026-09-22.md`  
Evidence: `docs/evidence/intelligent-admin-model-usage-attention-1/`

This document is enough for a new Technical Lead chat to review without the implementation session.

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #537 |
| Draft PR | #538 |
| Branch | `feat/intelligent-admin-model-usage-attention-1` |
| Task baseline | `fb4c9ece0a139e2ceebc85dcba35effd0bb5ceee` |
| Task seed | `94843032d28cb94056224f2ed275b45c8e7874d4` |
| Live main at MU-R1 re-read | `fb4c9ece0a139e2ceebc85dcba35effd0bb5ceee` |
| Invalidated freeze | `7602a0acc53a69305397f0eabdb2523cad1496d3` |
| TL review | `5276325319` CHANGES REQUIRED — MU-R1 only |
| Ahead / behind vs live main before this persist | 3 ahead / 0 behind |
| Rebase / sibling merge | not done |
| Agent | Jetnity intelligent admin model usage attention 1, Generation 1 |
| Model | Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`) |
| Session | `bc-2c6673c9-be6c-4de3-a735-0516448e7fdd` |

Read first:

1. this branch’s exact HEAD after the freeze commit
2. binding task + accepted SOURCE_MATRIX model-usage row + RUNTIME_TASK §10
3. `lib/admin/analyst/model-usage-*.ts` and `components/admin/home/AdminModellnutzungHinweis.tsx`
4. STATUS, SELF_REVIEW, evidence README + manifest measurements
5. live PR #538 CI / Auth / Vercel on the **frozen HEAD**
6. existing #518 files only as unchanged regression surface

---

## 2. What was implemented

- Dedicated report types and closed-copy derivation `leiteModelUsageInsights`.
- Dependency-injected `ladeModelUsageBericht`: denied and break-glass never call `ladeProviderOpsBoardFuerSeite()`.
- One small composed card on `/admin` after the existing System Health hints.
- Additive honest copy only; #518 `aktuelleHinweise*` strings unchanged.
- Executable permission/truth/time/privacy/render tests.
- Compiled-product-CSS synthetic evidence, labelled BLOCKED_ACCESS.
- **MU-R1:** `parseEvidencedIsoInstant` matches the collector `toISOString()` contract and calendar before any timestamp is retained. Invalid/annotated/timezone-free/rollover strings are `null` in both fields and absent from JSON/render. Valid future instants stay retained and unknown.

---

## 3. What the next reviewer must not do

- Do not treat synthetic screenshots as authenticated Preview acceptance.
- Do not rebase or merge sibling branches from this writer.
- Do not mark Ready or merge from Cursor.
- Do not start a D–K expansion, a second source, a model seam, or Execute.

---

## 4. Suggested TL review focus

1. Gate-before-load for all five `AdminDenial`s and break-glass (`reachesDatabase === false`).
2. Empty ≠ null spend; unavailable ≠ empty; unknown ≠ empty.
3. Unique item selection: missing/duplicate/malformed ≠ first-match.
4. **MU-R1 first:** hostile/RFC-annotated/timezone-free/Feb-30 timestamps are null in both fields; valid ISO is preserved; future remains unknown.
5. 120s boundary and stale available/empty cannot become current all-clear.
6. A then B on the same cached snapshot keep original time and process-recent.
7. Hostile source strings/PII never appear in serialized report or render.
8. #518 runtime/tests unchanged.
9. Compiled-CSS overflow/focus measurements and honest BLOCKED_ACCESS.
