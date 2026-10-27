# 12Go Mobility Affiliate Linkout V1 — HANDOFF

**Session to keep for review fixes:** `bc-c5928faa-840d-41e3-a855-39c560b49754`  
https://cursor.com/agents/bc-c5928faa-840d-41e3-a855-39c560b49754  
Display name: Jetnity 12Go Mobility Affiliate Linkout 1 — Cursor Generation 1.  
`originalModelName`: `grok-4.7-high-fast`.

Draft PR #1057, branch `feat/provider-12go-affiliate-linkout-1`. R1-F1 fix `ae7b499934968f86167c2be0e8a5e2fbc78b8660`, tree `28820d9eb3ed3dda87a1f15be4a8e69c057b0383`. Prior head `8ec966f2` is invalidated. Author does not Ready or merge. Stop for independent TL R2.

## What landed

`TwelveGoAffiliateLinks` is mounted inside the existing Verbindungen segment of `components/trips/MobilitaetBereich.tsx`, after Bestand and before the unchanged native search. The pure helper is `lib/providers/twelve-go/affiliate/`. It builds only `https://12go.asia` URLs with `z=17323861` and `sub_id=jetnity-mobility-route`.

Edges are consecutive stage occurrences. Origin and return are not invented. A planned date is shown only when that directed place pair occurs on exactly one adjacent edge and exactly one transfer matches it. Repeated X→Y stays undated. `stageId` does not choose an occurrence. The date is not a `date=` query.

## Reviewer notes

- The example path `/de/travel/Bangkok/Koh-Chang/` is accepted by the URL builder and covered by a test-only registry. The UI never receives that registry.
- `lib/mobility/kanten.ts`, provider search, nachweis, and factory were not modified. Search stays off until the existing button is pressed, and that path still has no provider.
- Do not edit #1051–#1054 or #1043 files from this branch.
- `docs/ACTIVE_WORK_STATUS.md` is Root-owned and was not updated.
- External click, attribution, CHF, and passenger count remain unverified. No purchase.

## Next actor

Root Technical Lead: independent exact-head review after native CI/Auth and Preview. Work: isolated browser click on the generic URL, without booking. Production provider activation stays a Product-Owner gate.
