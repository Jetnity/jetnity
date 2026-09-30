# Jetnity Final Homepage Premium Experience 2 — Report

Date: 30 September 2026
Issue: #648
Pull request: Draft #649
Branch: `feat/final-homepage-premium-experience-2`
Baseline: `main@5ed4a9e3abb5a2920cee21359f5efb703a090a72`
Task: `docs/FINAL_HOMEPAGE_PREMIUM_EXPERIENCE_2_TASK_2026-09-30.md`
Task seed: `633c03ba36d5db2ae7991d6887752d71c6f4113a` — not the review head

Logical agent: **Jetnity final homepage premium experience 2**, Generation 1
Session: https://cursor.com/agents/bc-abf9d9b1-5328-44c0-9fa9-b6c0262251fd
`originalModelName`: `grok-4.7-high-fast` (Grok 4.7 High Fast). Not Auto. Recorded from this run before editing.

Status: **HOMEPAGE PRESENTATION DELIVERED / DRAFT / NO TL PASS / NO READY / NO MERGE**

## 1. What changed

The accepted #644 homepage truth, H1, definition, metadata, canonical, JSON-LD and fail-closed indexing stay. The page below the hero is no longer a repeated card matrix.

- Hero is unchanged, including `StartzielForm` and the Bali image.
- The five tools are one connected trip rail beside a single trip identity. There is no 3+2 card grid.
- Lissabon/Porto is a labelled `Produktvorschau` workspace: example route, Jetzt wichtig, the four real modes, and the non-live boundaries. No prices, availability, bookings, official results, live alerts or collaboration.
- “So begleitet Jetnity deine Reise” is a connected three-step sequence.
- “Warum Jetnity anders ist” stays the dark contrast section, now asymmetrical.
- Inspiration images, place IDs, order and `zielHref` are unchanged.
- Trust is a compact status list. Every capability sentence remains in server HTML inside a native `<details>`.
- A few lines of inline script open that disclosure and scroll to `#pro` when the existing navbar link is used. Next.js same-page hash navigation does not open `<details>` by itself in the tested Chrome.

## 2. Live reconstruction before editing

| Fact | Result |
| --- | --- |
| Required model | Available. `originalModelName=grok-4.7-high-fast`. |
| Machine mode | `NORMAL`. Operating-mode file was not edited. |
| Branch tip before editing | Task seed `633c03ba36d5db2ae7991d6887752d71c6f4113a`. |
| Merge-base with fetched `origin/main` | `5ed4a9e3abb5a2920cee21359f5efb703a090a72`. |
| Ahead / behind before this delivery | 1 ahead / 0 behind. The ahead commit was the task seed. |
| #644 / #647 | Closed and merged, as recorded in the task and in `docs/FINAL_HOMEPAGE_PRODUCT_1_HANDOFF_2026-09-30.md` plus `docs/POST_TRIP_HOMEPAGE_CONTINUITY_RECONCILIATION_1_REPORT_2026-09-30.md`. Global continuity files were not edited. |
| Public navbar | Read only. No contradictory guest state was reproduced. No scope amendment. |

## 3. Search / truth

Preserved: one H1, the visible definition, canonical `https://jetnity.com/`, Organization / WebSite / SoftwareApplication JSON-LD with the same description, `noindex, nofollow`, and the live / partial / planned capability sentences.

The full sentences are in the server HTML of the `<details>` body. They are not `display:none` and not `sr-only`. The status groups above the disclosure only repeat the existing titles and kennzeichnungen.

No `llms.txt`, indexing activation, ratings, reviews, offers, user counts, partners or prices.

## 4. Public navigation audit

Source contract in `lib/auth/oeffentliche-navigation.ts` was not edited. Existing unit tests passed.

Production browser, no account credentials:

- Server HTML of `/` contains neither `Anmelden` nor `Abmelden`. That matches the initial `unbekannt` state.
- After hydration on 1440, the header shows `Anmelden` and does not show `Abmelden` or `Konto`.
- After opening the compact menu on 390, the same guest result holds.

No signed-in browser proof was fabricated.

`/#pro` click opens the disclosure and brings the Jetnity-Pro sentence into view. Evidence: `docs/evidence/final-homepage-premium-experience-2/after/anchor-pro-1440.png`.

## 5. Validation in this session

| Check | Result |
| --- | --- |
| `lib/seo/final-homepage.test.ts` and `lib/auth/oeffentliche-navigation.test.ts` | Pass |
| `npm test` | Pass. 4082 tests, 0 fail. |
| `npm run typecheck` | Pass |
| `npm run lint` | Exit 0. 0 errors, 149 pre-existing warnings. None in the files this slice edited. |
| `npm run build` | Pass. Production server `next start` on `127.0.0.1:3456`. |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode` | Pass |
| `node scripts/final-homepage-premium-experience-2-audit.mjs` with `AUDIT_BROWSER=1` | Pass. Report `docs/evidence/final-homepage-premium-experience-2/audit.json`. |
| Before evidence | `docs/evidence/final-homepage-premium-experience-2/before/` from the same production-like runtime, before the presentation edit. |
| Account browser | Not run. No credentials. |

Fresh GitHub CI, Auth and Vercel on the delivery head are not claimed in this section. A green local build is not that gate.

## 6. Boundaries held

No PublicNavbar, auth navigation, StartzielForm, Trip Workspace, provider, Supabase, Auth, RLS, payment, dependency, #626, PrivacyBee, tracking, i18n, robots, indexing or launch edit. No global continuity pointer edit. No new dependency. No Ready. No merge. No follow-up slice.
