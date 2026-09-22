# HBX Hotels Adapter Foundation 1 — Handoff

Stand: 22. September 2026  
Status: **FINAL MAIN-SYNC AFTER #545 / STOP FOR TL FINAL RE-GATING / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**

Binding task: `docs/HBX_HOTELS_ADAPTER_FOUNDATION_1_TASK_2026-09-22.md`  
Status: `docs/HBX_HOTELS_ADAPTER_FOUNDATION_1_STATUS_2026-09-22.md`  
Self-review: `docs/HBX_HOTELS_ADAPTER_FOUNDATION_1_SELF_REVIEW_2026-09-22.md`  
Evidence: `docs/evidence/hbx-hotels-adapter-foundation-1/`

This document is enough for a new Technical Lead chat to review without the implementation session.

---

## 1. Where the work lives

| | |
| --- | --- |
| Draft PR | #548 |
| Branch | `feat/hbx-hotels-adapter-foundation-1` |
| Task seed | `91270eafc00887bc24b345924b22239af3cc94a4` |
| Task baseline | `9dc8926ef859bcde2dc31dc8b96f2e61e1948f74` |
| Live main / merge-base | `8fcccd6475f41703bd2a31deecb3067391f330b4` |
| Invalidated previous freeze | `2542a95b2c5de066e355a66ade920bd0846f3cea` |
| Authorized final merge | `78b2e22069beb3cc416fe16dacb728bec72c7ec7` |
| Ahead / behind before this persist | 8 ahead / 0 behind |
| Rebase / force-push | not done |
| Agent | Jetnity HBX hotels adapter foundation 1, Generation 1 |
| Model | Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`) |
| Session | `bc-c538c2b5-3cc6-4f9f-8f00-2ccac1bb9cf1` |
| TL session ack | comment `5779757780` |

Read first:

1. this branch’s exact HEAD after the freeze commit
2. binding Task v1 (not the 29 August proposal)
3. `lib/providers/hotelbeds/hotels/{contracts,adapter,adapter.test}.ts`
4. existing `HotelOption` / `hotelOptionLesen` as read-only contracts
5. STATUS, SELF_REVIEW, evidence
6. live PR #548 CI / Auth / Vercel on the **frozen HEAD**

---

## 2. What was implemented

- Adapter-local fixture schema `jetnity.hbx.hotels.availability.normalized.v1`.
- Explicit stay/pricing/currency context for fixture tests only.
- Fail-closed pricing matrix, date/identity/shape validation, opaque rate IDs.
- **R1:** `rateKeyLesen` validates nonblank/length and hashes original bytes. `'rate-A'` and `' rate-A '` are distinct; whitespace-only still rejects; raw keys stay out of output.
- Tests for pricing, malformed input, leap/DST nights, multi-rate identity, partial semantics and forbidden truth fields.
- No runtime factory, HTTP, secrets, DB, UI or global-doc edits.
- **Final main sync:** TL-authorized `git merge` of `8fcccd64` (#545 search after #547 indexing). HBX files unchanged vs `2542a95b`. Admin search and `IndexingStatus` remain. No extra implementation.

---

## 3. What the next reviewer must not do

- Do not treat fixture tests as HBX API or live-price proof.
- Do not treat Vercel Preview as HBX access evidence.
- Do not rebase. #545 and #547 are already on this merge-base. Do not start a follow-up slice.
- Do not mark Ready or merge from Cursor.
- Do not start Viator, TEST-transport, signup, keys, mTLS or HotelProvider wiring.

Immediate CHANGES REQUIRED return to this same agent/session.

---

## 4. Suggested TL review focus

1. Unknown pricing model never mints a consumer price.
2. Net is never displayed; `hotelMandatory` and `packaging` are strict booleans.
3. `rateKey` opacity: original bytes hashed; padded keys no longer collapse onto the trimmed digest `c2b264a5ce7dae15d4716be4e65c2e12`.
4. Invalid dates/context empty the whole result; offer defects drop only that offer.
5. No production import / factory registration / shared-domain edit.
6. Cancellation/breakfast/stars remain null in this slice, even when fixture fields exist.
