# HBX Hotels Adapter Foundation 1 — Handoff

Stand: 22. September 2026  
Status: **R1 RATEKEY IDENTITY FIXED / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**

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
| Baseline / live main | `9dc8926ef859bcde2dc31dc8b96f2e61e1948f74` |
| Merge-base | same as live main |
| Invalidated freeze | `328464dfe26adff95a2a937e602b300994a0ef74` |
| TL CHANGES REQUIRED | review `5280919883` — P2 silent rateKey trim |
| R1 implementation | `ce11d9a83728f61d9b8653d41d7d6348f553ecc4` |
| Ahead / behind before this persist | 4 ahead / 0 behind |
| Rebase / sibling merge | not done |
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

---

## 3. What the next reviewer must not do

- Do not treat fixture tests as HBX API or live-price proof.
- Do not treat Vercel Preview as HBX access evidence.
- Do not rebase onto later main or merge sibling #545 / #547 from this writer.
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
