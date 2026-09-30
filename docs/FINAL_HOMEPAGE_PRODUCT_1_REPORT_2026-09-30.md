# Jetnity Final Homepage Product 1 — REPORT

Stand: 30. September 2026  
Status: **IMPLEMENTED / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**

Issue: #643  
Draft PR: #644  
Branch: `feat/final-homepage-product-1`  
Baseline: `main@91ab08bb9163444fcbce4a5303c1522c5ad5498c`  
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
4. A synthetic product window labelled **Produktvorschau**, without prices or availability.
5. **So begleitet Jetnity deine Reise.**
6. **Warum Jetnity anders ist.**
7. Inspiration still hands off through `zielHref` and the existing place IDs.
8. **Deine Reise. Deine Entscheidungen.** plus the capability inventory.
9. Navbar anchors `#entdecken` and `#pro` remain.
10. Closing action **Reise starten** through the existing `GastCreateLink`.

Page-local metadata, canonical, Open Graph, Twitter and a JSON-LD `@graph` of `Organization`, `WebSite` and `SoftwareApplication` use the same visible definition. There is no `sameAs`, rating, review, offer, award or user count. `llms.txt` was not added. Robots and the indexing gate were not changed.

## 2. Capability inventory

Canonical data: `HOMEPAGE_FAEHIGKEITEN` in `lib/seo/final-homepage.ts`, judged against baseline main, not against unmerged Trip Workspace PR #642.

| Claim | Stand | Visible label |
| --- | --- | --- |
| Confirm a place and start a draft without an account | LIVE | Heute nutzbar |
| Several confirmed places stay one ordered route | LIVE | Heute nutzbar |
| One trip workspace with overview and day context | LIVE | Heute nutzbar |
| Open steps from data already on the trip | PARTIAL | Soweit Daten vorliegen |
| Provider prices and availability | PLANNED | In Vorbereitung |
| Official entry and safety results | PLANNED | In Vorbereitung |
| Automatic consequences of a route change | PLANNED | Produktvorschau |
| Planning together | PLANNED | Kommt später |
| Jetnity Pro, live alerts, offline, document reminders | PLANNED | Kommt später |

Flight, stay, activity and mobility areas exist on the trip. The homepage does not call them live offers. Uncertain provider and official-truth behaviour was downgraded.

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
| `npm test` | 4074 pass / 0 fail |
| `npx tsc -p tsconfig.json --noEmit` | pass |
| ESLint on owned homepage files | pass |
| `npm run build` | pass, Next.js 16.3.3, `/` static |
| `check:dead` | 0 orphaned |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass; pre-existing LOCAL/UNAPPLIED account-counts RPC note, not this slice |
| `check:operating-mode` | pass |
| `node scripts/final-homepage-product-1-audit.mjs` with browser | PASS |
| Auth configuration, GitHub CI, Vercel status on `fd2dfe2650930f9ec9dcda5f864017f542445c78` | CI `36729992149` SUCCESS. Auth job SUCCESS. Typecheck, Lint & Build SUCCESS. Vercel status SUCCESS, inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/8jHnbpTKqrf1mHodH5jBMbCLDmHg`. Preview HTML was not read: the alias redirects to Vercel SSO. |

## 6. Visual evidence

`docs/evidence/final-homepage-product-1/before/` and `after/` hold first-screen and full-page captures for 360×800, 390×844, 768×1024, 1024×768, 1280×800, 1440×900 and 1920×1080. `audit.json` records overflow, canonical, robots, JSON-LD and network origin.

Mobile-first, measured on the dev server:

- 360×800: form bottom at 563px, inside the 800px viewport, no horizontal overflow.
- 390×844: form bottom at 535px, no horizontal overflow.
- Input `#travel-idea` computed font size 16px.
- Hero primary control and menu button are at least 44px.
- Keyboard from the top reaches skip link, logo, menu, the place field, **Reise planen**, then the preview link and inspiration cards. Focus outline is visible.
- `#pro` lands on Jetnity Pro / Kommt später. `#entdecken` remains the inspiration section.
- Bali inspiration opens `/planen?zielId=geonames%3A1650535` plus the existing idea.
- 200% root font on 360×800: no horizontal overflow after `break-words` on `main`. The form is below the first screen because the text itself is taller than 800px. That is recorded, not hidden.
- Network origins during the audit: `http://127.0.0.1:3000` only.
- Dev console 403s on some `/_next/static/chunks/*` files and the HMR websocket were already present on the before capture. They are not a new homepage claim. The production build compiled the page.

No physical device was used.

## 7. Scope

Changed or added:

- `app/(public)/page.tsx`
- `components/home/**`
- `lib/seo/final-homepage.ts`
- `lib/seo/final-homepage.test.ts`
- `scripts/final-homepage-product-1-audit.mjs`
- this report, the handoff, the self-review, the task record
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/evidence/final-homepage-product-1/**`

Not changed: Trip Workspace runtime, `StartzielForm` truth, providers, Supabase, Auth, payments, dependencies, robots, indexing gate, tracking, legal copy, i18n routing.

## 8. Security, cost, database

No new route, secret, provider call, payment or schema. The homepage stays static. Guest create behaviour is unchanged. No new ongoing cost.

## 9. Risks

- A visitor can still open flight, stay, activity and mobility areas inside a trip. Those areas are not live offer engines. The homepage says so. The workspace itself is outside this slice.
- Dev-server chunk 403s were not root-caused here. They predate the copy change and the production build succeeded.
- Canonical slash form differs between the HTML link and JSON-LD, as described above.
- Screen reader and physical-phone proof are not in this session.
- CI `36729992149` is SUCCESS on product head `fd2dfe2650930f9ec9dcda5f864017f542445c78`. A later docs-only tip needs its own re-read. Preview HTML was not read because the alias redirects to Vercel SSO. The Vercel status on that product head was SUCCESS. Green CI is not a Technical-Lead PASS.

## 10. Next step

Independent main-chat Technical-Lead review of code, copy, truth, visual and search/AI on the exact head. No Ready, no merge, no follow-up slice from this agent.
