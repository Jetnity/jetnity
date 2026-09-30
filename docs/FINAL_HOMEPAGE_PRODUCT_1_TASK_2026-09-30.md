# Jetnity Final Homepage Product 1 — TASK

Stand: 30 September 2026
Status: **R1 APPLIED ON DRAFT PR #644 / STOP FOR INDEPENDENT TL RE-REVIEW / NO PUBLIC-INDEXING AUTHORITY**

Issue: #643  
Branch: `feat/final-homepage-product-1`  
Baseline: `main@91ab08bb9163444fcbce4a5303c1522c5ad5498c`

Read first:
- `docs/FINAL_HOMEPAGE_PRODUCT_SPEC_2026-09-30.md`
- `docs/FINAL_HOMEPAGE_POSITIONING_OPTIMIZATION_POLICY.md`
- `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
- `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`
- current homepage and accepted homepage route-entry evidence

## Objective

Implement the new final homepage product surface now, while preserving strict live-vs-coming truth.

A visitor should see the intended final Jetnity homepage today. Non-live capabilities may appear only as explicitly labelled product preview/coming states.

## Required visible sections

1. Hero
2. One trip instead of separate tools
3. Product window / truthful synthetic trip preview
4. How Jetnity works
5. Why Jetnity is different
6. Inspiration
7. Trust/truth section
8. capability truth framing where needed
9. final CTA

## Search / AI

Add or refine:
- page-local metadata
- canonical
- OpenGraph/Twitter
- truthful JSON-LD graph for appropriate `Organization`, `WebSite`, and application entity types
- visible concise Jetnity definition
- semantic headings/landmarks
- crawlable internal links

Do NOT:
- enable public indexing
- modify robots/indexing launch gate
- add fake sameAs/reviews/ratings/offers/users/awards/partners
- add tracking/ads/pixels
- create thin SEO pages
- add llms.txt in this slice

## Truth

Inventory every major homepage capability used in copy against current main.

For each:
- LIVE
- PARTIAL
- PLANNED

Copy must reflect the state. If uncertain, downgrade language instead of guessing.

Examples:
- existing route/trip entry may be live
- Trip Workspace may be shown using truthful synthetic UI
- provider-dependent live comparison/availability must not be shown as live without evidence
- official/readiness automation must not be represented as live if provider truth is unavailable
- collaboration/group planning must be labelled planned if not live
- native app claims are forbidden until real

## Mobile-first

Primary acceptance:
- 360×800
- 390×844

Also:
- 768×1024
- 1024×768
- 1280×800
- 1440×900
- 1920×1080

No giant desktop composition merely stacked on phone.

## Preserve current functional entry

Keep the existing canonical homepage trip/destination entry and its confirmed-place/multi-destination truth contract.

Do not change route-intent/canonical-place semantics unless a presentation-only seam is required.

## Expected write ownership

Allowed:
- `app/(public)/page.tsx`
- NEW `components/home/**`
- `components/places/StartzielForm.tsx` presentation-only seam if strictly necessary; no truth/parser/handoff changes
- NEW `lib/seo/final-homepage.ts`
- focused homepage tests under `lib/seo/` or `lib/home/`
- bounded audit script `scripts/final-homepage-product-1-audit.mjs`
- `docs/FINAL_HOMEPAGE_PRODUCT_SPEC_2026-09-30.md`
- this task
- own report/handoff/self-review
- `docs/evidence/final-homepage-product-1/**`

No other runtime path without STOP + TL approval.

## Hard boundaries

No Trip Workspace files owned by active PR #642.
No provider activation/call.
No Supabase/Auth/RLS/schema.
No payment.
No dependency/lockfile.
No #626.
No public indexing/robots launch change.
No tracking/ads/analytics activation.
No legal-copy rewrite.
No i18n routing migration.
No new external map/media/vendor service.
No fake evidence.

## Required evidence

Before/after:
- all required viewports
- first-screen hero
- full-page mobile
- full-page desktop
- keyboard navigation
- 200% text where feasible
- no horizontal overflow
- no console/runtime errors
- no unexpected network origin
- visible live/planned labels
- structured-data parse/contract
- metadata/canonical
- current indexing remains fail-closed

Run:
- focused tests
- full tests
- typecheck
- lint
- build
- standard hygiene checks
- exact-head CI/Auth
- Vercel Preview

Record exact final head, merge-base/ahead/behind, changed-file manifest, actual Cursor session URL and `originalModelName`.

Required model: **Grok 4.7 High Fast**, not Auto.

Remain Draft.
No Ready.
No merge.
No follow-up slice.
STOP for independent main-chat TL **code + copy + truth + visual + search/AI** review.

## Implementation record

Generation 1 implemented the visible homepage on this branch. Session: https://cursor.com/agents/bc-051f68b2-ac7c-4bbc-9055-e63466e955a2. `originalModelName=grok-4.7-high-fast`.

Canonical inventory: `HOMEPAGE_FAEHIGKEITEN` in `lib/seo/final-homepage.ts`. Report: `docs/FINAL_HOMEPAGE_PRODUCT_1_REPORT_2026-09-30.md`.

R1 `5368008966` is applied on this same session. `docs/ACTIVE_WORK_STATUS.md` matches integrated main `c1eae921a37db1d1f661af4b5d58139d3dc752ec`. That commit is the merge-base. The product window names Übersicht, Reiseplan, Organisieren and Vorbereitung. The R1 browser proof is the production audit in `docs/evidence/final-homepage-product-1/r1-audit.json`. The review head is the branch tip after this persist. Re-read `git rev-parse HEAD`. This record is not a Technical-Lead PASS.
