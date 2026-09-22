# Homepage Confirmed Route Entry 1 — HANDOFF

Date: 2026-09-22  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**  
Draft PR: https://github.com/Jetnity/jetnity/pull/543  
Branch: `feat/homepage-confirmed-route-entry-1`  
Agent: Jetnity homepage confirmed route entry 1, Generation 1  
Session: `bc-63084de2-f351-4c8c-be85-c36cda45935e`  
Model: Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`)  
Baseline / merge-base: `35148a4ba065be1315dddf21174d7f272518d34c`  
`origin/main` re-read at handoff: same SHA, **0 behind**. Ahead count is this persist plus the prior commits on the branch.

Previous independently reviewed head `676d64b44db3080744b5ccda1354a7f3dd0590f5` received CHANGES REQUIRED (R1/R2/R3). Those items were fixed in this same session. Re-read `git rev-parse HEAD` after this persist. That SHA is the freeze. Older exact-head gates do not apply.

## Changed files this review-fix

- `components/places/OrtSuche.tsx` — narrow null-value/`initialText` sync only
- `components/places/StartzielForm.tsx`
- `components/trips/TripPlanner.tsx`
- `lib/places/route-einstieg.ts` + `.test.ts`
- `lib/places/homepage-route-entry-1.test.ts`
- `scripts/homepage-route-entry-1-verify.mjs`
- `scripts/homepage-route-entry-1-hydrated.mjs`
- `docs/HOMEPAGE_CONFIRMED_ROUTE_ENTRY_1_{STATUS,HANDOFF,SELF_REVIEW}_2026-09-22.md`
- `docs/evidence/homepage-confirmed-route-entry-1/` (harness, stubs, hydrated screenshots, NOTES)

Homepage hero layout / navbar / global docs / schema / Auth / providers / #544 remaining-build paths were not edited.

## Contract (unchanged)

1. Single confirmed place → existing `/planen?zielId=…`
2. Two or more → `/planen?zielIds=…&zielIds=…` exact user order, canonical IDs only
3. `zielIds` present with `zielId` or `ziel` → conflict, no lookup, no prefill
4. Invalid / empty / oversized transport → reject before lookup
5. Any unconfirmed route place → no partial trip; recoverable error + Zur Startseite
6. Canonical server names only
7. Guest occupied/unreadable/corrupt/unobserved storage still blocks create; Account does not read guest storage
8. `zielIds` is noindex by key presence and is not a generic Create CTA
9. Pending unconfirmed text is preserved across chip replace/remove/replace-target switch unless explicitly discarded
10. TripPlanner primary↔extra reorder keeps occurrence identity and visible text, including pending/empty/duplicates

## Tests (working tree before this persist)

146 pass / 0 fail: route-einstieg, homepage-route-entry-1, auswahl, reiseziele, index-grenze, create-entry, create-stages, guest-active-draft-preservation.

Hydrated: 6 PASS via `scripts/homepage-route-entry-1-hydrated.mjs` (actual bundled components; Next router/link and server actions stubbed; synthetic places search).

`npm run typecheck` pass. `check:exports` / `check:dead` pass.

## Preview / CI

Previous exact-head CI/Preview on `676d64b4` is invalidated. Re-read Typecheck/Lint/Build, Auth-Konfiguration and Vercel READY against the freeze SHA after push. This VM previously followed Vercel SSO on the Preview alias and did not receive Jetnity HTML; that limitation is unchanged until a reviewer opens the alias authenticated or a later unauthenticated fetch succeeds.

## Risks

- **P2** Chromium harness/emulation is not physical-device acceptance. Device evidence remains pending.
- **P2** Hydrated create used a stubbed `reiseAnlegen` / `reiseorteBestaetigen` boundary. It is component/browser regression evidence, not authenticated Preview E2E and not Production.
- **P3** Isolated harness screenshots do not load the Next font pipeline; use them for controller state, not brand-font QA.
- **P3** `#110` NLP remainder is intentionally open.

## Next actor

Technical Lead exact-head re-review of the freeze SHA only. Cursor must not Ready, merge, or start a follow-up slice.
