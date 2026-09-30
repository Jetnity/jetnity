# Jetnity Final Homepage Product 1 — REPORT

Stand: 30. September 2026  
Status: **R1 APPLIED / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**

Issue: #643  
Draft PR: #644  
Branch: `feat/final-homepage-product-1`  
Original baseline: `main@91ab08bb9163444fcbce4a5303c1522c5ad5498c`  
Integrated main and merge-base: `c1eae921a37db1d1f661af4b5d58139d3dc752ec`  
Ahead/behind vs that main, after this CI note: **9 ahead / 0 behind**  
Reviewed head this R1 answers: `c7e6e7d654cf2e6c89dccc5ce3d5e30d9a7cc9ee`  
Review: Technical-Lead R1 `5368008966`  
Agent: Jetnity final homepage product 1, Generation 1  
Session: https://cursor.com/agents/bc-051f68b2-ac7c-4bbc-9055-e63466e955a2  
`originalModelName=grok-4.7-high-fast`

This report is not a Technical-Lead PASS. Cursor does not Ready or merge.

The review head is the branch tip after this persist. Re-read `git rev-parse HEAD`. Local gates below belong to the working tree that produced them. A later commit invalidates them until they are repeated.

## 1. What shipped

The public homepage at `/` now tells the Product-Owner-approved final story, with non-live capabilities visibly labelled.

1. Hero H1: **Deine ganze Reise. Intelligent an einem Ort.**
2. The existing confirmed-place trip entry (`StartzielForm`) is in the first screen.
3. **Eine Reise statt fünf getrennte Tools.**
4. A synthetic product window labelled **Produktvorschau**, showing the live modes **Übersicht / Reiseplan / Organisieren / Vorbereitung**, without prices, availability or official results.
5. **So begleitet Jetnity deine Reise.**
6. **Warum Jetnity anders ist.**
7. Inspiration still hands off through `zielHref` and the existing place IDs.
8. **Deine Reise. Deine Entscheidungen.** plus the capability inventory.
9. Navbar anchors `#entdecken` and `#pro` remain.
10. Closing action **Reise starten** through the existing `GastCreateLink`.

Page-local metadata, canonical, Open Graph, Twitter and a JSON-LD `@graph` of `Organization`, `WebSite` and `SoftwareApplication` use the same visible definition. There is no `sameAs`, rating, review, offer, award or user count. `llms.txt` was not added. Robots and the indexing gate were not changed.

## 2. Capability inventory

Canonical data: `HOMEPAGE_FAEHIGKEITEN` in `lib/seo/final-homepage.ts`, rechecked against integrated `main@c1eae921a37db1d1f661af4b5d58139d3dc752ec` after accepted #642. Trip Workspace runtime was not edited.

| Claim | Stand | Visible label |
| --- | --- | --- |
| Confirm a place and start a draft without an account | LIVE | Heute nutzbar |
| Several confirmed places stay one ordered route | LIVE | Heute nutzbar |
| Four modes of one trip: Übersicht, Reiseplan, Organisieren, Vorbereitung | LIVE | Heute nutzbar |
| Open steps from data already on the trip | PARTIAL | Soweit Daten vorliegen |
| Provider prices and availability | PLANNED | In Vorbereitung |
| Official entry and safety results | PLANNED | In Vorbereitung |
| Automatic consequences of a route change | PLANNED | Produktvorschau |
| Planning together | PLANNED | Kommt später |
| Jetnity Pro, live alerts, offline, document reminders | PLANNED | Kommt später |

Übersicht holds what is important now. Reiseplan holds days and order. Organisieren holds flights, stay, activities and mobility without live offers. Vorbereitung holds open preparation from known trip data and does not show an official result. The sample trip in the product window stays **Produktvorschau**.

## 3. Preserved entry

- Inspiration place IDs and order: Bali `geonames:1650535`, Lissabon `geonames:2267057`, Zermatt `geonames:2657915`, Amsterdam `geonames:2759794`.
- `zielHref` still carries `zielId` and optional `idee`.
- `StartzielForm` parser, handoff and route truth were not edited.
- `GastCreateLink` remains the generic create. A guest with an active draft still sees the existing **Reise fortsetzen** label.

## 4. Search and indexing

Built homepage HTML:

- title: `Deine ganze Reise. Intelligent an einem Ort. – Jetnity`
- robots: `noindex, nofollow`
- canonical link: `https://jetnity.com` (Next omits the trailing slash while `trailingSlash` is off)
- JSON-LD `url`: `https://jetnity.com/` via `kanonischeUrl('/')`

Built `robots.txt`: `User-Agent: *` / `Disallow: /`.

The slash difference between the link tag and JSON-LD is the existing `kanonischeUrl('/')` contract under Next's default slash handling. It is not an indexing activation.

## 5. Local gates

| Check | Result |
| --- | --- |
| `lib/seo/final-homepage.test.ts` plus route-entry, create-entry and metadata tests | pass, included in the full run |
| `npm test` on the R1 tree | 4081 pass / 0 fail |
| `npx tsc -p tsconfig.json --noEmit` | pass |
| ESLint on owned homepage files | pass |
| `npm run build` | pass, Next.js 16.3.3, `/` static |
| `check:dead` | 0 orphaned |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass; pre-existing LOCAL/UNAPPLIED account-counts RPC note, not this slice |
| `check:operating-mode` | pass |
| Production audit `AUDIT_BROWSER=1 AUDIT_TEXT_200=1` against `next start` on `127.0.0.1:3456` | PASS. Report `docs/evidence/final-homepage-product-1/r1-audit.json` |
| Exact-head CI, Auth and Vercel on `9c8518c56801ba12dc0b3a08ef27b8775a00f34b` | CI `36734924583` SUCCESS. Auth job `109954010008` SUCCESS. Typecheck, Lint & Build job `109954010432` SUCCESS. Vercel SUCCESS, inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/AyBuLXGpNuc4jDahWcjJaea79rGL`. Preview HTML was not read: the alias still redirects to Vercel SSO. A docs note after that SHA needs its own re-read. |

## 6. Visual evidence

The dev-server captures in `before/` and `after/` stay as the first-pass record, including the 200% shot that split hero words. They are not the R1 proof.

R1 proof is a production server (`next build` then `next start` on `127.0.0.1:3456`):

- Captures: `docs/evidence/final-homepage-product-1/r1-after/`
- Machine report: `docs/evidence/final-homepage-product-1/r1-audit.json`
- Every viewport returned HTTP 200, `noindex, nofollow`, canonical `https://jetnity.com`, zero console errors, zero page errors, and network origin only `http://127.0.0.1:3456`.
- 360×800: form bottom 536px, inside the first screen. Input 16px. Submit control 48px. No horizontal overflow.
- 390×844: form bottom 537px. Same input and control sizes. No horizontal overflow.
- 768, 1024, 1280, 1440 and 1920: form in the first screen, no horizontal overflow.
- 200% root font on 360×800: scroll width 360. Eyebrow words, including `Zusammenhang`, and H1 words, including `Intelligent`, each occupy one line box. The supporting sentence no longer uses the unbreakable compound `Reisebegleitungsplattform`; the same sentence is the JSON-LD description. The form sits below the first screen (bottom 1529px). That is accepted. Input computes to 32px and the submit control to 96px.
- Keyboard from the top reaches the skip link, then `#travel-idea`, then **Reise planen**.
- `robots.txt` remains `User-Agent: *` / `Disallow: /`.

No physical device was used.

## 7. Scope

Changed or added:

- `app/(public)/page.tsx`
- `components/home/**`
- `lib/seo/final-homepage.ts`
- `lib/seo/final-homepage.test.ts`
- `scripts/final-homepage-product-1-audit.mjs`
- this report, the handoff, the self-review, the task record
- `docs/evidence/final-homepage-product-1/**`

`docs/ACTIVE_WORK_STATUS.md` was restored to `main@c1eae921a37db1d1f661af4b5d58139d3dc752ec` and is not part of the remaining homepage diff.

Not changed by this slice's own edits: Trip Workspace runtime (it arrived only through the merge of accepted #642), `StartzielForm` truth, providers, Supabase, Auth, payments, dependencies, robots, indexing gate, tracking, legal copy, i18n routing.

## 8. Security, cost, database

No new route, secret, provider call, payment or schema. The homepage stays static. Guest create behaviour is unchanged. No new ongoing cost.

## 9. R1 response

| Finding | Result |
| --- | --- |
| R1-F1 global status file | `docs/ACTIVE_WORK_STATUS.md` matches current main. This slice no longer claims that pointer. |
| R1-F2 integrate main | Merge of `c1eae921a37db1d1f661af4b5d58139d3dc752ec` is in this branch. Merge-base is that commit. Ahead/behind after this CI note: 9 / 0. Trip Workspace files were not hand-edited. |
| R1-F3 product window | The sample shows Übersicht, Reiseplan, Organisieren, Vorbereitung, Jetzt wichtig, and the next step **Eigenes Ziel bestätigen**. The sample stays Produktvorschau. |
| R1-F4 production runtime | The after pass is the production server. Console errors fail the audit. This pass has none, and no unexpected origin. |
| R1-F5 200% hero | Critical hero words stay whole at 360×800 with a 32px root. The page does not scroll sideways. |

## 10. Risks

- Organisieren and Vorbereitung are live views. Provider prices and official results inside them are not live. The homepage says so.
- Canonical slash form differs between the HTML link and JSON-LD, as described above. Indexing stays closed.
- Screen reader and physical-phone proof are not in this session.
- At 200% text, long words outside the hero may break inside the word so the page does not overflow. The hero eyebrow, H1 and definition do not.
- CI `36734924583`, Auth and Vercel are SUCCESS on `9c8518c56801ba12dc0b3a08ef27b8775a00f34b`. Preview HTML was not read because the alias redirects to Vercel SSO. A later docs-only tip needs its own re-read. Green CI is not a Technical-Lead PASS.

## 11. Next step

Independent main-chat Technical-Lead re-review of code, copy, truth, visual and search/AI on the exact head. No Ready, no merge, no follow-up slice from this agent.
