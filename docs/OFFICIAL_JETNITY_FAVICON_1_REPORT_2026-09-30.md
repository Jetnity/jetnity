# Jetnity Official Favicon 1 — Report

Stand: 30 September 2026
Status: **R1 CORRECTION / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TL REVIEW**

Issue: #658
Draft PR: #659
Branch: `brand/official-jetnity-favicon-1`
Reviewed head: `2e309a4248778e757db84f398700eee843d7683c`
Review: Technical-Lead R1 `5371422991`
Integrated `main`: `1ea6ddd03a290683d3d787823621c535a611a90f` (Merge #655, Next.js 16.3.8)
Agent: **Jetnity official favicon 1**, Generation 1
Session: https://cursor.com/agents/bc-b8063b84-3b6a-41f2-a519-d0bdd4328a2d
`originalModelName`: `grok-4.7-high-fast`

## 1. R1-F1 — crop

The first crop was a rectangle from x 36 to 158. That rectangle included the stylized signet and the separate bold J of the wordmark. R1 rejected it.

The corrected extract copies only the 8-connected component of source pixels with alpha ≥ 1 whose box is the leftmost large component:

- Box: left 34, top 16, width 103, height 90.
- 2713 source pixels, copied unchanged.
- 213 opaque wordmark pixels sit inside that box, on the hook of the bold J. They are left transparent.
- The bold J and the rest of the wordmark are a different component and are not copied.

`public/brand/jetnity-logo.png` is unchanged. Blob SHA remains `bfcbb46da7e87d5ef03e7e6457b06957df12359f`. The signet file blob is `2db7371f3514618059c90389376c69feee16fb5d`.

Square icons still use `#f5f4ee`, Lanczos3, and 84% content width. No sharpening. Maskable stays inside the 40% radius and is more padded than the 512 any-icon. Measured maskable max radius 168 against a safe radius of 204.8.

| File | Size | PNG color type | Blob SHA |
| --- | --- | --- | --- |
| `app/icon.png` | 48×48 | 6 RGBA | `31b8daea2c365c0f49aad87dd7dae17b5dc351e6` |
| `app/apple-icon.png` | 180×180 | 6 RGBA | `9f7996483f0a75d856415d3242224ee4094455f7` |
| `public/icons/jetnity-192.png` | 192×192 | 6 RGBA | `db5a89ed626b10e84753cf1db4ff3cf13ad17ed4` |
| `public/icons/jetnity-512.png` | 512×512 | 6 RGBA | `4c28d164da7deec818153f0702290e70b20205bc` |
| `public/icons/jetnity-512-maskable.png` | 512×512 | 2 RGB | `2c61669ead572382f1fb518bca32ea0b78cc13ef` |

`app/manifest.ts` is unchanged. `app/icon.svg` stays deleted.

The focused test now rebuilds the same component and requires every signet pixel to match that component. Opaque wordmark pixels inside the box must be absent. A transparent gap after a wide rectangle is no longer the proof.

## 2. R1-F2 — main

`origin/main` `1ea6ddd03a290683d3d787823621c535a611a90f` is merged. Behind count is 0. `next` and `eslint-config-next` are `16.3.8`. `package.json` and `package-lock.json` match that main. `Footer.tsx` and `PublicNavbar.tsx` were not edited. The footer remains the merged white full logo.

## 3. Evidence

`docs/evidence/official-jetnity-favicon-1/`

- `signet-4x.png` and `micro-contact-light.png` / `micro-contact-dark.png` are the corrected crop.
- `12-icon-r1.webp` is `/icon.png` on local `next start` after the Next.js 16.3.8 rebuild.
- `13-tab-favicon-r1.webp` is the browser tab.
- `14-navbar-r1.webp` and `15-footer-r1.webp` show the full logo in the navbar and the white full logo in the footer.

Local production HTML, Next.js 16.3.8:

- icon link sizes 48×48
- apple touch sizes 180×180
- four `/brand/jetnity-logo.png` references
- `brightness-0 invert` still present
- `noindex`
- `/icon.svg` returns 404

At 16px the route and J form remain. The pins are not separately crisp. The geometry was not simplified.

## 4. Gates run here

| Gate | Result |
| --- | --- |
| Focused PWA, logo, footer, and Next 16.3.8 tests | 25 pass, 0 fail |
| `npx eslint` on the touched tests and render script | exit 0 |
| `npm run build` after `npm ci` | pass, banner `Next.js 16.3.8` |

No new dependency. No Auth, provider, payment, or indexing change.

## 5. Exact-head CI, Auth and Vercel

The corrected icon family is on `44457fc7c1d24c9c13421c272bff54509ab87485`. That commit is 0 behind `main` `1ea6ddd03a290683d3d787823621c535a611a90f`. The green CI on `2e309a42` does not gate this crop.

| Gate | Result |
| --- | --- |
| CI run `36771991010` | success, head `44457fc7` |
| Typecheck, Lint & Build job `110080410488` | success, completed 2026-09-30T20:23:46Z |
| Auth job `110080410932` | success, completed 2026-09-30T20:21:41Z |
| Vercel commit status | success, “Deployment has completed” |
| Vercel inspector | https://vercel.com/jetnity-e1b93c82/jetnity-app/Ei3m6V2s44dvcS6UXJWN1m16ktfi |
| GitHub Preview deployment `6769316242` | success |
| Preview target | https://jetnity-by5vfpqoy-jetnity-e1b93c82.vercel.app |
| PR #659 | OPEN, Draft, no review threads |

This section is written after that gate. The commit that records it is a newer head. Its own CI, Auth, and Vercel status must be read before that newer head is treated as the gated tip. Preview HTML was not read.

## 6. Not proven

- Physical device or screen reader.
- Preview HTML. Deployment `6769316242` is success. The alias was not read.
- A signed-in navbar.
- CI on the docs commit that records this section.

## 7. Recommendation

Stop for an independent Technical-Lead review of the corrected crop. The PR stays Draft. Cursor does not Ready or merge. No follow-up slice.
