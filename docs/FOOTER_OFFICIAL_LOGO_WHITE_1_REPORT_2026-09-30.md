# Jetnity Footer Official Logo White 1 — Report

Stand: 30 September 2026
Status: **IMPLEMENTED / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TL REVIEW**

Issue: #656
Draft PR: #657
Branch: `fix/footer-official-logo-white-1`
Baseline: `main@8571db776bb58042a8107e341052a36cbbe9a50c`
Agent: **Jetnity footer official logo white 1**, Generation 1
Session: https://cursor.com/agents/bc-1bca3163-eb77-42b8-972c-a77099fe4416
`originalModelName`: `grok-4.7-high-fast`

Required model Grok 4.7 High Fast was available. No Auto substitution. No second session.

## 1. What changed

The white rounded backing behind the footer logo is gone. The footer still uses the exact file `public/brand/jetnity-logo.png`.

Presentation only, on the footer image:

- Tailwind `brightness-0 invert`, which computes to `brightness(0) invert(1)`
- natural 3:1 ratio kept (`width: auto`, height 48px, rendered 144×48)
- home link remains `/` with `aria-label="Jetnity Startseite"`
- focus ring remains `focus-visible:ring-4 focus-visible:ring-white/25`
- no new logo file, no crop, no redraw

The navbar logo is untouched and stays full color. Favicon, apple icon, manifest icons and the PNG blob are untouched.

Blob SHA of `public/brand/jetnity-logo.png` remains `bfcbb46da7e87d5ef03e7e6457b06957df12359f`.

## 2. Parallel safety

PR #655 / branch `chore/next-16-3-8-security-upgrade-1` was re-fetched immediately before this report. Its diff against `origin/main` is only `docs/NEXT_16_3_8_SECURITY_UPGRADE_1_TASK_2026-09-30.md`. It does not edit `components/layout/Footer.tsx`. No collision stop.

`origin/main` at this re-fetch is still `8571db776bb58042a8107e341052a36cbbe9a50c`. This branch is based on that SHA.

This slice does not edit `PublicNavbar.tsx`, the logo PNG, `app/icon.svg`, manifest/PWA icons, package files, homepage/search files, Auth/session logic, or global continuity pointers including `docs/ACTIVE_WORK_STATUS.md`.

## 3. Evidence

Directory: `docs/evidence/footer-official-logo-white-1/`

Local production server after `npm run build`: `next start` on `http://127.0.0.1:3456`. Audit script: `scripts/footer-official-logo-white-1-audit.mjs`. Result: **PASS**. Recorded head at audit time: `55afaffbf05f915cee4a3f94d611f33909937a93`. This report commit is newer. Re-read the branch tip.

| Viewport | Footer logo | Link box | Link background | Filter | Overflow | Focus |
| --- | --- | --- | --- | --- | --- | --- |
| 360×800 | 144×48 | 168×60 | transparent | `brightness(0) invert(1)` | 360/360 | visible |
| 390×844 | 144×48 | 168×60 | transparent | `brightness(0) invert(1)` | 390/390 | visible |
| 1440×900 | 144×48 | 168×60 | transparent | `brightness(0) invert(1)` | 1440/1440 | visible |
| 200% text, 360×800 | 144×48 | 192×88 | transparent | `brightness(0) invert(1)` | 360/360 | visible |
| 200% text, 1440×900 | 144×48 | 192×88 | transparent | `brightness(0) invert(1)` | 1440/1440 | visible |

200% text is `html { font-size: 32px }`, not an operating-system text zoom. The logo stays 48px. The link grows with `rem`. Footer ground is `rgb(15, 48, 42)`. Every opaque source pixel of the footer image samples as white (`7407/7407`, channels ≥ 248). The unfiltered asset still has 7050 dark pixels, so the file itself was not recolored. Navbar filter is `none`, navbar link background is transparent, and the navbar sample stays the dark full-color asset (`7050/7407` dark). No console errors, no page errors, no foreign origins. H1 remains **Deine ganze Reise. Intelligent an einem Ort.**

Served `http://127.0.0.1:3456/icon.svg` is blob SHA `c16821657b3a086e3f3ac827f10e4e567b79eb02`, identical to `app/icon.svg`.

The historical script `scripts/official-jetnity-logo-1-audit.mjs` still expects a white footer chip and `filter: none`. It is not a CI job. It is the acceptance record of the merged logo slice. This slice does not rewrite it. The current footer contract is the new audit.

## 4. Gates run here

| Gate | Result |
| --- | --- |
| Focused footer and official-logo tests | pass |
| `npm test` | 4092 pass, 0 fail |
| `npm run typecheck` | pass |
| `npm run lint` | exit 0, 149 warnings, 0 errors |
| `npm run build` | pass, compiled successfully |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode` | pass |
| Local production footer audit | PASS |

Lint warnings match the previous logo delivery count. This slice adds no new lint finding.

No database, RLS, Auth logic, provider, payment, dependency or indexing change. No new running cost.

## 5. Exact-head CI / Vercel

Not yet observed for the commit that contains this report. Do not treat implementation head `55afaffb` as the review head once this file is on the branch. The reviewer uses the branch tip. Cursor does not Ready and does not merge.

## 6. Residual

If a browser drops CSS filters, the dark-green wordmark would sit on the dark-green footer again. The accessible name stays on the link. The Product Owner chose presentation filtering of the existing PNG. No second asset was added.

Signed-in chrome was not opened. Guest homepage chrome is what this server rendered. Physical-device proof was not run.
