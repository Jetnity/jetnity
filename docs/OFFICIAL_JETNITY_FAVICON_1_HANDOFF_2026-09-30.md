# Jetnity Official Favicon 1 — Handoff

Stand: 30 September 2026
Status: **DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**

Session: https://cursor.com/agents/bc-b8063b84-3b6a-41f2-a519-d0bdd4328a2d
`originalModelName`: `grok-4.7-high-fast`
Logical agent: **Jetnity official favicon 1**, Generation 1

## Read next

1. `docs/OFFICIAL_JETNITY_FAVICON_1_TASK_2026-09-30.md`
2. `docs/OFFICIAL_JETNITY_FAVICON_1_REPORT_2026-09-30.md`
3. `docs/OFFICIAL_JETNITY_FAVICON_1_SELF_REVIEW_2026-09-30.md`
4. `docs/evidence/official-jetnity-favicon-1/extraction.json`

Do not treat `docs/ACTIVE_WORK_STATUS.md` as updated by this slice. Re-fetch `main` and PR #659 before review. R1 review `5371422991` rejected the crop on `2e309a42`. Current integrated main is `1ea6ddd03a290683d3d787823621c535a611a90f`.

## What the next reviewer checks

- Draft PR #659 stays Draft. Cursor did not Ready and did not merge.
- The signet is the leftmost large 8-connected component, box left 34, top 16, 103×90. The bold J is not copied. 213 opaque wordmark pixels inside that box stay transparent.
- `app/icon.svg` is gone. `app/icon.png` is 48×48 RGBA. Apple is 180×180 RGBA. PWA icons are 192, 512 RGBA, and 512 RGB maskable.
- Manifest paths are unchanged.
- Navbar and footer still use `/brand/jetnity-logo.png`. Footer whiteness comes from merged #657, not from an edit in this slice.
- The only edit to a #657 file is the icon byte pin in `lib/layout/footer-official-logo-white-1.test.ts`.
- #655 does not own these icon paths.
- Exact-head CI for `2e309a42` does not gate the R1 crop. Re-read CI, Auth, and Vercel on the correction tip.

## Do not continue

- No navbar or footer presentation work.
- No package, Auth, provider, Supabase, payment, tracking, privacy, indexing, or launch work.
- No follow-up slice from this writer.

Same session only for a head-bound fix on this same Draft PR. A new slice needs a new generation.
