# V1 Protected Item Date Attention 1 — Handoff

Stand: 21. September 2026  
Status: **FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGE-SLICE**

Binding task: `docs/V1_PROTECTED_ITEM_DATE_ATTENTION_1_TASK_2026-09-21.md`  
Detailed status: `docs/V1_PROTECTED_ITEM_DATE_ATTENTION_1_STATUS_2026-09-21.md`  
Self-review: `docs/V1_PROTECTED_ITEM_DATE_ATTENTION_1_SELF_REVIEW_2026-09-21.md`

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #519 |
| Draft PR | #520 |
| Branch | `fix/v1-protected-item-date-attention-1` |
| Assigned dispatch base | `main@1103407ba2a9e5fa76f4a8e588ab210934b955e3` |
| Dispatch seed | `408b5ee99c3f74485950e9b86fcfdcd3b95ffd49` |
| Product tree for screenshots | `948ad2fcffd7cc170feebd19fe0a94baed54fc72` (clean) |
| Re-read `origin/main` | `1103407ba2a9e5fa76f4a8e588ab210934b955e3` — matches baseline; behind 0 |
| Agent | Jetnity V1 protected item date attention 1, Generation 1 |
| Session | `bc-47c25f91-3af3-43ff-ab82-5c5c2fee04ae` |
| Required model | Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`) |

Exact freeze SHA is in the STOP PR comment on this head.

## 2. What a reviewer should verify first

1. Diff vs baseline is only `lib/trips/attention.ts`, its tests, this prefix’s docs, and synthetic evidence. No apply-engine, `geschuetzt.ts`, schema, workspace component, Admin, package or global-continuity edit.
2. `operationenAnwenden` `zeitraum_verschieben +7` and `stammdaten.startdatum` still leave protected `startsOn` in place; `attentionAbleiten` then emits `item.date_mismatch` for that item only.
3. `istKommerziell` is imported, not copied. Zero price and booked-only still match that predicate.
4. Missing/invalid/unassigned dates, non-commercial moved dates and same-date protected items do not emit this signal. Calendar checks use `kalenderdatumLesen`, not `Date.parse`.
5. Input graph deep-equals after derivation. No provenance/date write.
6. Safety-critical stays first. Visible/weitere limit still splits. Active mismatch suppresses `nichts_dringend_geprueft`.
7. Screenshots are the actual `TripWorkspaceJetztWichtig` with compiled product CSS, labelled SYNTHETIC, bound to clean `948ad2fc`. Not Preview, not real-device.
8. This self-review is not Technical-Lead PASS.

## 3. What this slice does not mean

- Dates are not auto-corrected. There is no item-jump action (`aktion: null` is the tasked contract).
- `endsOn` is not compared. Unassigned commercial items get no second “ungeplant” signal here.
- Guest storage, Admin, TW-8, Foundation-E fallback and sibling #516/#517/#518 writers were not reopened.
- Source/unit/synthetic-render proof is not authenticated E2E.

## 4. Next Cursor/Guardian action

**STOP FOR TECHNICAL-LEAD REVIEW.** No Ready. No merge. No follow-up slice.
