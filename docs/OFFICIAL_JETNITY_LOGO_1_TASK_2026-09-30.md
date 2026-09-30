# Jetnity Official Logo 1 — TASK

Stand: 30 September 2026
Status: **BOUNDED BRAND-ASSET REPLACEMENT / EXACT PRODUCT-OWNER LOGO / PARALLEL SAFE WITH #649**

Issue: #650
Branch: `feat/official-jetnity-logo-1`
Baseline: `main@5ed4a9e3abb5a2920cee21359f5efb703a090a72`

## 1. Product-Owner decision

The Product Owner supplied the official Jetnity logo and requires it to replace the temporary website mark.

Hard visual constraint:
- do **not** redesign or reinterpret the logo;
- preserve exact geometry, lettering, route, pins and proportions;
- only sharpen and make the existing colors fuller/richer.

The Technical Lead prepared a canonical optimized transparent raster from the supplied source with only bounded image-quality adjustments. The file placed at `public/brand/jetnity-logo.png` is the binding asset. Do not redraw it.

## 2. Parallel ownership

PR #649 owns homepage presentation and may run in parallel.

This slice may edit only:
- `public/brand/jetnity-logo.png`
- `components/layout/PublicNavbar.tsx` — brand rendering only
- `components/layout/Footer.tsx` — brand rendering only
- own task/report/handoff/self-review/evidence/test files if needed

Do not touch:
- `app/(public)/page.tsx`
- `components/home/**`
- `lib/seo/final-homepage.ts`
- `lib/auth/oeffentliche-navigation.ts`
- Auth/session behavior
- global current-state docs

If #649 unexpectedly edits PublicNavbar/Footer, STOP for TL collision resolution.

## 3. Implementation contract

### Navbar
Replace the temporary CSS icon + text `Jetnity` brand treatment with the official full logo image.

Requirements:
- use `next/image`;
- no distortion;
- preserve natural aspect ratio;
- visually crisp on retina;
- appropriate width/height so the 72px navbar remains balanced;
- link still targets `/`;
- keep `aria-label="Jetnity Startseite"`;
- keep focus treatment;
- do not change session/nav behavior.

### Footer
Replace the temporary CSS icon + text with the same official logo.

Because the logo's wordmark is dark green:
- never recolor/invert the supplied logo;
- if needed, render it on a restrained light/white backing surface within the dark footer;
- keep it premium, compact and accessible;
- link remains `/` and retains an accessible label.

## 4. Responsive and accessibility

Verify:
- 360×800;
- 390×844;
- 768×1024;
- 1024×768;
- 1440×900;
- 1920×1080;
- 200% text at 360 and 1024 where relevant;
- no horizontal overflow;
- logo never clips;
- mobile menu still fits;
- touch/focus target >=44px;
- dark-footer contrast is adequate;
- no layout shift that breaks navbar/header;
- image has an intentional `alt` contract: because the link already has an accessible label, use empty alt for the decorative-in-link logo image.

## 5. Performance

- no new dependency;
- one optimized transparent PNG;
- `next/image` only;
- do not add JavaScript;
- no external image host.

## 6. Hard boundaries

No homepage #649 files.
No Auth/session logic.
No Supabase/RLS/schema.
No provider.
No payment.
No dependency/lockfile.
No tracking.
No legal/privacy text.
No indexing/robots/launch.
No PWA/icon/favicons in this slice unless separately authorized later.

## 7. Evidence and gates

Before/after:
- navbar desktop;
- navbar 360/390;
- footer desktop;
- footer 360/390;
- 200% reflow;
- guest/unknown source contract unchanged;
- focused PublicNavbar/Footer tests;
- full test suite;
- typecheck;
- lint;
- build;
- exact-head CI/Auth/Vercel;
- changed-path manifest;
- merge-base/ahead/behind;
- review threads.

Remain Draft.
Cursor never Ready/merge.
No follow-up slice.
STOP for independent Technical-Lead review.
