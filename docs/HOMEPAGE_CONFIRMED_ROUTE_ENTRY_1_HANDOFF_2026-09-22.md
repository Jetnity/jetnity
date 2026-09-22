# Homepage Confirmed Route Entry 1 — HANDOFF

Date: 2026-09-22  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Draft PR: https://github.com/Jetnity/jetnity/pull/543  
Branch: `feat/homepage-confirmed-route-entry-1`  
Agent: Jetnity homepage confirmed route entry 1, Generation 1  
Session: `bc-63084de2-f351-4c8c-be85-c36cda45935e`  
Model: Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`)  
Baseline / merge-base: `35148a4ba065be1315dddf21174d7f272518d34c`  
`origin/main` re-read at handoff: same SHA, **0 behind**. Ahead count is this persist plus the three prior commits on the branch.

Re-read `git rev-parse HEAD` after this persist. That SHA is the freeze. Older exact-head gates do not apply.

## Changed files (runtime + owned docs)

- `components/places/StartzielForm.tsx`
- `components/places/RouteZielListe.tsx`
- `components/places/RouteZielHandoffFehler.tsx`
- `app/(public)/planen/page.tsx`
- `components/trips/TripPlanner.tsx`
- `lib/places/route-einstieg.ts` + `.test.ts`
- `lib/places/homepage-route-entry-1.test.ts`
- `lib/places/auswahl.ts` + `.test.ts`
- `lib/trips/create-entry.ts` + `.test.ts`
- `lib/seo/index-grenze.ts` + `.test.ts`
- `scripts/homepage-route-entry-1-verify.mjs`
- `docs/HOMEPAGE_CONFIRMED_ROUTE_ENTRY_1_{STATUS,HANDOFF,SELF_REVIEW}_2026-09-22.md`
- `docs/evidence/homepage-confirmed-route-entry-1/`

`OrtSuche.tsx` was not edited. Homepage hero layout / navbar / global docs / schema / Auth / providers were not edited. Parallel PR #544 paths were not touched.

## Contract

1. Single confirmed place → existing `/planen?zielId=…`
2. Two or more → `/planen?zielIds=…&zielIds=…` exact user order, canonical IDs only
3. `zielIds` present with `zielId` or `ziel` → conflict, no lookup, no prefill
4. Invalid / empty / oversized transport → reject before lookup
5. Any unconfirmed route place → no partial trip; recoverable error + Zur Startseite
6. Canonical server names only
7. Guest occupied/unreadable/corrupt/unobserved storage still blocks create; Account does not read guest storage
8. `zielIds` is noindex by key presence and is not a generic Create CTA

## Tests (working tree before this persist)

140 pass / 0 fail: route-einstieg, homepage-route-entry-1, auswahl, reiseziele, index-grenze, create-entry, create-stages, guest-active-draft-preservation.

`npm run typecheck` pass on `04b14b25`.  
CI on `04b14b25`: Typecheck/Lint/Build `35730542359` SUCCESS; Auth-Konfiguration SUCCESS. Those gates die with the next head.

## Preview

Vercel bot marked jetnity-app **READY** for `04b14b25` (`Gn2EPDv49K6gqUrrFuVddS8uQgbB`).  
Alias: https://jetnity-app-git-feat-homepage-confirmed-963d5b-jetnity-e1b93c82.vercel.app  

This Cloud-Agent fetch of that alias followed Vercel SSO (`vercel.com/login?next=/sso-api?...`) and never received the Jetnity HTML. That is **not** a direct unauthenticated Preview page PASS from this VM. Local `localhost:3000` evidence and CI build remain. Re-read the Preview after this persist; a logged-in reviewer can open the alias.

## Risks

- **P1** Local and this Cloud-Agent environment have an empty places search (`[]`). Confirmed multi-chip add was proven in rendered/unit tests, not against a populated local GeoNames table. Preview/physical device must re-check live suggestions.
- **P2** Chromium emulation is not real-device acceptance. 200% zoom was not a dedicated pass.
- **P3** A screen recording failed to finalize (ffmpeg stop timeout). Screenshots remain.
- **P3** `#110` NLP remainder is intentionally open.

## Next actor

Technical Lead exact-head review of the freeze SHA only. Cursor must not Ready, merge, or start a follow-up slice. Immediate review fixes stay in this session.
