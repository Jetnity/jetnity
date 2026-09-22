# Homepage Confirmed Route Entry 1 — HANDOFF

Date: 2026-09-22  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**  
Draft PR: https://github.com/Jetnity/jetnity/pull/543  
Branch: `feat/homepage-confirmed-route-entry-1`  
Agent: Jetnity homepage confirmed route entry 1, Generation 1  
Session: `bc-63084de2-f351-4c8c-be85-c36cda45935e`  
Model: Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`)  
Original baseline: `35148a4ba065be1315dddf21174d7f272518d34c`  
`origin/main` re-read: `0b0c7bccae4a8803d780bec798dae3e49b6bba5a` (PR #544 merged, docs-only).  
Merge-base still `35148a4`. **No merge/rebase/force.** Behind is disjoint remaining-build documentation.

Previous independently reviewed head `0a66982c20c17f665f3d985bb9ff9387a3322f12` received CHANGES REQUIRED R4. Re-read `git rev-parse HEAD` after this persist. That SHA is the freeze. Older exact-head gates do not apply.

## Changed files this R4 fix

- `components/places/OrtSuche.tsx` — seed vs selection-invalidation sync
- `lib/places/homepage-route-entry-1.test.ts`
- `scripts/homepage-route-entry-1-hydrated.mjs`
- `docs/evidence/homepage-confirmed-route-entry-1/harness.tsx`
- owned STATUS/HANDOFF/SELF_REVIEW/NOTES and R4 screenshots

AccountBesuchFormular was not edited. No #544 paths, schema, Auth, providers, or global docs.

## R4 contract

- Omitted `initialText` is not an empty reset.
- Explicit `initialText=""` remains a parent-driven clear.
- Parent seed changes (replace/swap) still update the visible input.
- Editing a confirmed origin/destination or a consumer without `initialText` keeps the typed/pasted text.
- Canonical re-selection still overwrites the input with the selected name.

## Tests (working tree before this persist)

148 node:test PASS / 0 fail. Hydrated 9 PASS, including R1/R2 plus R4 origin edit, minimal OrtSuche without seed, and parent seed/reset. `typecheck` / `check:exports` / `check:dead` pass.

## Next actor

Technical Lead exact-head re-review of the freeze SHA only. Cursor must not Ready, merge, or start a follow-up slice. Do not rebase onto #544 from this session unless TL assigns that.
