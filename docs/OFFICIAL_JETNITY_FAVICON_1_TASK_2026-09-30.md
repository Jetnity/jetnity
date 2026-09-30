# Jetnity Official Favicon 1 — TASK

Stand: 30 September 2026
Status: **BOUNDED BRAND ICON FAMILY REPLACEMENT / OFFICIAL SIGNET SOURCE / PARALLEL SAFE**

Issue: #658
Branch: `brand/official-jetnity-favicon-1`
Baseline: `main@8571db776bb58042a8107e341052a36cbbe9a50c`

## 1. Product-Owner decision

The favicon and app/PWA icon family must use the **left signet of the official Jetnity logo**:
- stylized Jetnity J;
- route/swoosh;
- two location pins;
- original dark-green / green / lime treatment.

The full `Jetnity` wordmark must not be present in the favicon.

## 2. Source of truth

Canonical source:
`public/brand/jetnity-logo.png`

Do not use the old placeholder icon family as design input.

Before editing:
- prove the source PNG is the official logo currently used by navbar/footer;
- inspect the alpha/content bounds and isolate the left signet without capturing any part of the `Jetnity` wordmark;
- record the extraction bounds/method in the report.

Save a reusable canonical extracted signet:
`public/brand/jetnity-signet.png`

The signet asset must preserve exact source geometry and colors. Do not redraw or vector-trace it.

## 3. Allowed visual optimization

Allowed:
- crop around the signet;
- transparent padding;
- proportional scaling;
- high-quality resampling;
- bounded sharpening after downsampling;
- a neutral Jetnity light surface (prefer existing `#f5f4ee` or white when technically appropriate) behind square Apple/PWA icons so all original dark-green signet details remain visible;
- safe-area placement for maskable icons.

Forbidden:
- changing the signet silhouette;
- moving/removing pins;
- changing the route/swoosh;
- changing original signet colors;
- adding text;
- adding new decorative elements;
- redesigning into a simpler symbol.

## 4. Required icon family

Replace the current placeholder family:

1. Browser/App Router favicon:
   - remove `app/icon.svg`;
   - add a PNG metadata icon based on the official signet (for example `app/icon.png`) using a size appropriate for Next.js metadata and browser downsampling;
   - verify generated page metadata points to the new icon route.

2. Apple touch:
   - replace `app/apple-icon.png`;
   - retain appropriate square dimensions / Apple compatibility.

3. PWA icons:
   - replace `public/icons/jetnity-192.png` at exact 192×192;
   - replace `public/icons/jetnity-512.png` at exact 512×512;
   - replace `public/icons/jetnity-512-maskable.png` at exact 512×512 with a safe maskable composition.

4. Manifest:
   - preserve `app/manifest.ts` paths and semantic content if no code change is required;
   - only edit manifest if evidence shows a technical necessity.

## 5. Micro-size quality

The official signet has fine lines and small pins.

Required:
- inspect rendered equivalents at 16×16, 24×24, 32×32, 48×48, 64×64;
- do not simplify geometry to “fake” sharpness;
- tune only crop/padding/resampling/sharpening;
- choose the source/icon canvas so the signet remains recognisable in both light and dark browser chrome;
- no fuzzy fringe/halo from transparency or sharpening.

Produce a contact sheet/evidence or individual screenshots showing micro sizes.

## 6. Parallel ownership

Active parallel work:
- PR #655 — Next.js 16.3.8 security upgrade;
- PR #657 — Footer official logo white.

This slice may edit only:
- `app/icon.svg` (delete)
- `app/icon.png` (new)
- `app/apple-icon.png`
- `public/icons/jetnity-192.png`
- `public/icons/jetnity-512.png`
- `public/icons/jetnity-512-maskable.png`
- `public/brand/jetnity-signet.png`
- `app/manifest.ts` only if technically required
- focused tests/audit/evidence
- own task/report/handoff/self-review

Do not edit:
- `components/layout/Footer.tsx`
- `components/layout/PublicNavbar.tsx`
- `public/brand/jetnity-logo.png`
- package/lock files
- homepage/search files
- Auth/session
- global continuity pointers

If #655 or #657 begins touching these icon-family paths, STOP for TL collision resolution.

## 7. Tests / evidence

Verify:
- exact dimensions and PNG color/alpha characteristics;
- official signet source extraction does not contain wordmark pixels;
- app metadata/icon route responds 200;
- Apple icon route responds 200;
- manifest returns the expected three PWA icon paths;
- PWA icon paths respond 200;
- maskable safe-area composition;
- homepage still uses the official full logo in navbar (read-only check);
- footer change from #657 is not modified;
- no horizontal/layout effect;
- production build;
- focused tests;
- full relevant CI/Auth;
- exact-head Vercel Preview READY;
- no review threads.

## 8. Hard boundaries

No new dependency.
No Auth/Supabase/RLS/schema.
No provider.
No payment.
No #626.
No PrivacyBee/legal text.
No tracking.
No public indexing/robots/launch.
No Production configuration.
No feature work.

## 9. Writer identity

Logical agent: **Jetnity official favicon 1**
Generation: **1**
Required model: **Grok 4.7 High Fast**, not Auto.

Record actual session URL and `originalModelName`. If the required model is unavailable, STOP.

## 10. Stop

Stay Draft.
No Ready.
No merge.
No follow-up slice.
STOP for independent main-chat Technical-Lead visual + asset + metadata review.
