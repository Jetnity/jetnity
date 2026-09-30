# Jetnity Official Logo 1 — Report

Stand: 30 September 2026
Status: **IMPLEMENTED / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TL REVIEW**

Issue: #650
Draft PR: #651
Branch: `feat/official-jetnity-logo-1`
Baseline at dispatch: `main@5ed4a9e3abb5a2920cee21359f5efb703a090a72`
Current `main` after this delivery re-fetch: `7f2dcdbc211d32a0affa323fba822521535e7bb9` (Merge #649)
Agent: **Jetnity official logo 1**, Generation 1
Session: https://cursor.com/agents/bc-2eacb5a8-6476-4b48-bec0-9b73bd96a656
`originalModelName`: `grok-4.7-high-fast`

Required model Grok 4.7 High Fast was available. No Auto substitution. No second session.

## 1. What changed

The temporary CSS diamond and the word `Jetnity` are gone from the public navbar and footer. Both now render the canonical file `public/brand/jetnity-logo.png`.

- Blob SHA `bfcbb46da7e87d5ef03e7e6457b06957df12359f`
- 384×128, 8-bit RGBA
- Geometry, lettering, route, pins and colors are the supplied asset. This slice does not redraw it.

`next/image` is used with `unoptimized`, intrinsic `width={384}` `height={128}`, and `style={{ width: 'auto' }}` so the browser keeps the 3:1 ratio. `unoptimized` serves that PNG directly. The default image optimizer only allows quality 75 and would re-encode the mark. Changing `images.qualities` is outside this slice. The file is 25KB.

The home link keeps `href="/"` and `aria-label="Jetnity Startseite"`. The image `alt` is empty because the link already names the destination.

Navbar display size is 48px tall (144px wide) below `md` and from `lg` upward. Between 768px and 1023px it is 32px tall (96px wide). At 768px the hydrated guest row is logo + Entdecken / Meine Reisen / Jetnity Pro + Anmelden + Reise planen. A 144px-wide logo pushed that row onto a second line (header 113px). The previous mark stayed on the 72px row (header 73px). The smaller tablet size puts the header back to 73px. The artwork is the same file, only scaled. From 1024px the 48px size fits on one row.

The footer wordmark is dark green, about `rgb(0, 48, 40)`. On the footer green `rgb(15, 48, 42)` the contrast is about 1.02. On white it is about 14.45. The footer link is a compact white rounded surface. The logo is not filtered, inverted or recolored. Navbar contrast on cream `#f5f4ee` is about 13.11, so the navbar has no extra chip.

Session, navigation, sign-out, focus ring, mobile disclosure and `GastCreateLink` are unchanged aside from the brand import and brand JSX.

## 2. Parallel safety

PR #649 was open at the start on `feat/final-homepage-premium-experience-2` @ `e076f20839c8e793a748299729a930f547dba33d`. Its 66 files did not include `PublicNavbar.tsx` or `Footer.tsx`.

Before this report, #649 had merged. Re-fetch of `origin/main` is `7f2dcdbc211d32a0affa323fba822521535e7bb9`. `git diff 5ed4a9e3 origin/main -- components/layout/PublicNavbar.tsx components/layout/Footer.tsx` is empty. This branch merged that main. No collision stop.

This slice does not edit `app/(public)/page.tsx`, `components/home/**`, `lib/seo/final-homepage.ts`, or `lib/auth/oeffentliche-navigation.ts`. It does not edit `docs/ACTIVE_WORK_STATUS.md`. The task forbids global current-state docs.

## 3. Evidence

Directory: `docs/evidence/official-jetnity-logo-1/`

Before: `next dev` on `http://localhost:3000`, placeholder components from `cedacff3`, captured `2026-09-30` before the render commit. Dev chunks are blocked on `127.0.0.1`, so the audit used `localhost`. This is the placeholder record, not the production server.

After: `npm run build` then `next start` on `http://127.0.0.1:3456`. Final pass `2026-09-30T17:38:41.102Z` is the production build of this tree after the #649 merge and the tablet size fix. Result: **PASS**. No console errors, no page errors, no foreign origins, no horizontal overflow.

| Viewport | Header | Navbar logo | Home-link height | Footer link |
| --- | --- | --- | --- | --- |
| 360×800 | 73 | 144×48 | 48 | 168×60 |
| 390×844 | 73 | 144×48 | 48 | 168×60 |
| 768×1024 | 73 | 96×32 | 44 | 168×60 |
| 1024×768 | 73 | 144×48 | 48 | 168×60 |
| 1440×900 | 73 | 144×48 | 48 | 168×60 |
| 1920×1080 | 73 | 144×48 | 48 | 168×60 |
| 200% text, 360×800 | 121 | 144×48 | 88 | 192×88 |
| 200% text, 1024×768 | 217 | 144×48 | 88 | 192×88 |

200% text is `html { font-size: 32px }`, not an operating-system text zoom. The logo stays a fixed pixel size. Touch targets grow with `rem`. At 200% on 1024 the header is 217px. The placeholder capture was also 217px, so that wrap is the existing rem-based nav, not a new logo overflow. Scroll width equals client width in every pass. Mobile menu opens at 360, 390 and 200% 360, then closes with Escape. Focus screenshots exist for the home link.

The production browser showed guest chrome (`Anmelden`, `Reise planen`) because this environment's public Supabase variables were present at build time and there was no session. Signed-in chrome was not exercised in the browser. Guest / unknown / account behavior remains the source contract in `lib/auth/oeffentliche-navigation.test.ts`.

## 4. Gates run here

| Gate | Result |
| --- | --- |
| Focused logo, navbar and footer tests | pass, before the full suite |
| `npm test` after the #649 merge | 4089 pass, 0 fail |
| `npm run typecheck` after the merge | pass |
| `npm run lint` | exit 0, 149 warnings, 0 errors |
| `npm run build` on the merged tree | pass, compiled successfully |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` | pass |

The lint warning in `PublicNavbar.tsx` at the pathname effect that closes the mobile menu is pre-existing. This slice does not change that effect.

No database, RLS, Auth logic, provider, payment, dependency or indexing change.

## 5. Exact-head CI, Auth and Vercel

Read after push, on `4a0df6d402c4c9ca45129633a2a0480d9b723d50`, run `36753124511`:

| Check | Result |
| --- | --- |
| Typecheck, Lint & Build | success, job `110016502148`, completed `2026-09-30T17:43:11Z` |
| Auth-Konfiguration gegen config.toml | success, job `110016502417`, completed `2026-09-30T17:41:50Z` |
| Vercel commit status | success, deployment completed, inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/FTz5j1sqbDfTCkQiKcNmcwkbJVFr` |

Review threads on #651 at that read: none. Reviews: none. The PR was still Draft.

A later docs commit that only records this paragraph is not `4a0df6d4`. Re-read CI on the branch tip before treating a newer SHA as the gate.

## 6. Not proven

- Physical device, VoiceOver or TalkBack.
- A signed-in account in the browser.
- Preview HTML behind the Vercel inspector. The status says the deployment completed. This session did not browse the preview alias.
- Favicon, apple touch icon and PWA manifest. They still use the previous mark. This task forbids that work.

## 7. Recommendation

Leave favicon and manifest icons for a later Product-Owner-authorized slice. Do not start it from this PR.

If the tablet logo at 32px is too small, the alternative is to let the 768px guest row wrap. That brings the header from 73px to about 113px. This delivery keeps the existing one-row bar.

Cursor does not Ready or merge. No follow-up slice. Stop for independent main-chat Technical-Lead review.
