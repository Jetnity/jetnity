# Jetnity Official Favicon 1 — Report

Stand: 30 September 2026
Status: **IMPLEMENTED / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TL REVIEW**

Issue: #658
Draft PR: #659
Branch: `brand/official-jetnity-favicon-1`
Baseline at dispatch: `main@8571db776bb58042a8107e341052a36cbbe9a50c`
Integrated `main` in this session: `a2685812022258610e0cf34d926695b7067e55df` (Merge #657)
Agent: **Jetnity official favicon 1**, Generation 1
Session: https://cursor.com/agents/bc-b8063b84-3b6a-41f2-a519-d0bdd4328a2d
`originalModelName`: `grok-4.7-high-fast`

Required model Grok 4.7 High Fast was available. No Auto substitution. No second session.

## 1. What changed

The placeholder favicon family is replaced by the left signet of `public/brand/jetnity-logo.png`.

The canonical logo file is unchanged. Blob SHA remains `bfcbb46da7e87d5ef03e7e6457b06957df12359f`. Navbar and footer still reference that full logo. This slice does not redraw the signet.

Extraction, recorded in `docs/evidence/official-jetnity-favicon-1/extraction.json`:

- Opaque bounds of the left component: x 36–158, y 18–103.
- Crop: left 36, top 18, width 123, height 86.
- Columns 159 and 160 are fully transparent. The wordmark starts at x 161.
- `public/brand/jetnity-signet.png` is those source pixels with no resampling. Blob SHA `a2f91e16b2b21d910de534c6e72a8124fd821ac2`.

Square icons use the existing surface `#f5f4ee`, Lanczos3, and a content width of 84% of the canvas. A sigma-0.5 sharpen trial did not separate the pins and was not applied. Maskable content is scaled to a 0.36 radius budget so the signet stays inside the 40% safe-zone radius and is more padded than the 512 any-icon.

| File | Size | PNG color type | Blob SHA |
| --- | --- | --- | --- |
| `app/icon.png` | 48×48 | 6 RGBA | `93902bdacac943091ee6e0f7c3e12cf90a4aa04d` |
| `app/apple-icon.png` | 180×180 | 6 RGBA | `23afd15e5e7c29cb9b3289612867abdb5298c994` |
| `public/icons/jetnity-192.png` | 192×192 | 6 RGBA | `a08d34b69328ab6958dd1040f8cd2a18cff2d301` |
| `public/icons/jetnity-512.png` | 512×512 | 6 RGBA | `ca5a9440e492b422eefd29185f571d76d8054d80` |
| `public/icons/jetnity-512-maskable.png` | 512×512 | 2 RGB | `eff07c1a18753f8c611d681bd8c1f271fd4adb54` |

`app/icon.svg` is removed. `app/manifest.ts` is unchanged. Paths remain `/icons/jetnity-192.png`, `/icons/jetnity-512.png`, and `/icons/jetnity-512-maskable.png`.

At 16px and 24px, which are Lanczos3 downsamples of the 48px icon, the J and the route remain. The two pins are not separately crisp at 16px. That is the real geometry at that size. It was not simplified.

## 2. Parallel safety

PR #655 still owns the Next.js security upgrade. Its changed paths are package files, its own test/audit/docs, and `lib/next/framework-bump-contract.test.ts`. It does not edit the icon family. No collision stop.

PR #657 merged as `a2685812` while this slice was open. Its diff does not edit icon asset paths. It does pin the old placeholder bytes in `lib/layout/footer-official-logo-white-1.test.ts`, including `app/icon.svg`. After the merge that pin failed on the deleted SVG. This slice updates only that pin to the new signet bytes. `Footer.tsx` was not edited here. It arrived with the merge. The footer still uses `/brand/jetnity-logo.png` with `brightness-0 invert`.

This slice does not edit `docs/ACTIVE_WORK_STATUS.md`.

## 3. Evidence

Directory: `docs/evidence/official-jetnity-favicon-1/`

- `extraction-bounds.png` marks the crop on the canonical logo.
- `signet-4x.png` is the extracted signet, nearest-neighbor, on `#f5f4ee`.
- `micro-16.png` through `micro-64.png` and both contact sheets.
- `family-preview.png` shows the five square icons. The maskable icon is the smaller one.
- `04`–`08` are browser captures of the icon routes and the tab favicon on local `next start` at `http://127.0.0.1:3456`.
- `01`–`03` were captured before the main merge and still show the earlier footer chip.
- `09`–`11` were captured after the merge. Navbar is the full-color logo. Footer is the full white logo on the dark footer, with no white chip. No horizontal overflow at 1440 or 390.

Local production HTML includes:

- `<link rel="icon" href="/icon.png?…" sizes="48x48" type="image/png">`
- `<link rel="apple-touch-icon" href="/apple-icon.png?…" sizes="180x180" type="image/png">`
- four `/brand/jetnity-logo.png` references
- no `icon.svg`
- no `/brand/jetnity-signet.png` in the page
- H1 **Deine ganze Reise. Intelligent an einem Ort.**
- `noindex`

Route checks on that server: `/icon.png`, `/apple-icon.png`, `/manifest.webmanifest`, the three PWA icons, `/brand/jetnity-logo.png`, and `/brand/jetnity-signet.png` returned HTTP 200. `/icon.svg` returned 404. The manifest JSON still names the three PWA paths. Served PNG dimensions and color types match the table above.

## 4. Gates run here

| Gate | Result |
| --- | --- |
| Focused PWA, logo, and footer tests before the pin update | 16 pass, 1 fail: the merged #657 pin still expected `app/icon.svg` |
| Same tests after the pin update | 17 pass, 0 fail |
| `npx eslint` on the touched tests and the render script | exit 0 |
| `npm run build` before the main merge | pass, `/icon.png` and `/apple-icon.png` in the route table |
| `npm run build` after the main merge | pass |

No database, RLS, Auth logic, provider, payment, dependency, or indexing change. `sharp` was already installed through Next.js. It is not a new package dependency.

## 5. Exact-head CI, Auth and Vercel

Not yet recorded in this file. The next commit that adds the run ids is a new head. Re-read CI on the branch tip before treating an older SHA as the gate.

## 6. Not proven

- Physical device, VoiceOver, or TalkBack.
- A signed-in navbar.
- That 16px pins would survive a further simplification. They were left as the downsampled signet.

## 7. Recommendation

Stop for an independent main-chat Technical-Lead review of the signet crop, the micro sizes, and the metadata routes. The PR stays Draft. Cursor does not Ready or merge. No follow-up slice.
