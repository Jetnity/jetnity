# V1 Protected Item Date Attention 1 — Status

Stand: 21. September 2026  
Status: **IMPLEMENTATION IN PROGRESS / DRAFT / NOT READY / NOT MERGED / NOT TL-REVIEWED**

Issue: #519  
Draft PR: #520  
Branch: `fix/v1-protected-item-date-attention-1`  
Binding task: `docs/V1_PROTECTED_ITEM_DATE_ATTENTION_1_TASK_2026-09-21.md`  
Assigned baseline: `main@1103407ba2a9e5fa76f4a8e588ab210934b955e3`  
Versioned task seed: `408b5ee99c3f74485950e9b86fcfdcd3b95ffd49`

Cursor-Agent: **Jetnity V1 protected item date attention 1**, Generation 1  
Required model: **Cursor Grok 4.6 High Fast** — confirmed (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-47c25f91-3af3-43ff-ab82-5c5c2fee04ae`

This file is point-in-time evidence. Exact-head CI / Auth / Vercel IDs belong in the final PR comment after freeze. Agent self-review is not Technical-Lead PASS.

## Already implemented locally

- `lib/trips/attention.ts` derives `item.date_mismatch` for a commercially protected item on an existing owning day when both `startsOn` and `dayDate` are valid calendar dates and differ.
- Canonical `istKommerziell` is reused unchanged. Missing/invalid/unassigned dates do not become this mismatch.
- Existing Jetzt-wichtig surface is reused (`aktion: null`). No shared AttentionAktion / navigation contract change.
- Focused shift-to-attention tests and attention regressions are in place.

## Still open in this writer

- Synthetic phone390 / desktop1024 render of the actual component with compiled product CSS
- Own HANDOFF / SELF_REVIEW
- Full repository gates
- Final freeze SHA and STOP receipt

## Scope held

Allowed files only. No apply-engine, protection-predicate, schema, UX, Admin, storage, provider, package or `ACTIVE_WORK_STATUS` edit.

Traveller context is not relevant: no citizenship, document or credential collection was added.

## Next step

Commit the projection and tests, bind synthetic evidence to that source tree, run gates, freeze once, then **STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**.
