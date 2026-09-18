# Jetnity – V1 Cookie Consent Hygiene 1 STATUS

Stand: 18. September 2026  
Status: **IMPLEMENTATION + LOCAL GATES + EXACT-HEAD CI/PREVIEW ON `121d4d66` / THIS EVIDENCE PERSIST INVALIDATES THAT EXACT-HEAD / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #475  
Draft PR: #477  
Branch: `fix/v1-cookie-consent-hygiene-1`  
Binding task: `docs/V1_COOKIE_CONSENT_HYGIENE_1_TASK_2026-09-18.md`  
Source audit: #438 / merged PR #449 / finding 1.2(a)  
Canonical base / live `origin/main`: `main@854045a0f37e07d783115dd3a0ee6b302f79bfa1`  
Dispatch head: `f1a7b82296f72215fb32d2b4c2a43d8d311fd97c`  
Implementation head (gated below): `121d4d66c2d8dee82289aecab31e8305456c72cf`

Cursor-Agent: **Jetnity V1 cookie consent hygiene 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast** — confirmed on this run (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-a4bf118d-c750-45d1-8a2a-ff90836c397b`

This file is point-in-time evidence. Every new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS.

---

## 1. Goal

Remove the stale orphaned CookieConsent component and the repository exceptions/tests that preserved its false processing claim. Keep the truthful current runtime state: no non-essential tracker and therefore no mounted consent banner.

This slice removes an untrue unmounted artefact. It does **not** invent legal text, mount a banner, or decide future consent UX.

## 2. Required precheck

Verified on the dispatch head before deletion:

| Check | Result |
| --- | --- |
| Runtime importer of `components/layout/CookieConsent.tsx` | **None.** The only TypeScript/JavaScript references were the file itself, `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts`, `lib/project-sanitation/closure-invariants.test.ts` and the dedicated `scripts/erreichbarkeit.mjs` exception. `app/**` and other `components/**` had no import. Root layout does not mount a banner. |
| Non-essential tracking/analytics SDK or injected tracking script added since the audit | **None.** `package.json` has no analytics/tracker dependency. No Sentry / PostHog / Plausible / Mixpanel / Hotjar / Vercel Analytics package. |
| Dead-code/test exceptions that existed solely for this component | `scripts/erreichbarkeit.mjs` `ABSICHTLICH` entry; AP-6a inventory test locking orphan + `/privacy` + Views/Likes; sanitation closure invariant locking file existence. |

No real runtime importer or non-essential tracker existed, so deletion proceeded.

## 3. Implemented

1. Deleted `components/layout/CookieConsent.tsx`.
2. `scripts/erreichbarkeit.mjs` — removed the dedicated CookieConsent `ABSICHTLICH` exception. The map is now empty. Comment records that a later tracker is a separate consent/legal gate, not a dead-code exception.
3. `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` — inverted the CookieConsent lock from “orphan exists and claims Views/Likes” to “file gone, no importer, no dead-code exception, no consent key, no Views/Likes claim, no known tracker package”.
4. `lib/project-sanitation/closure-invariants.test.ts` — CookieConsent existence lock inverted to absence. V1 image-host gates in `next.config.js` remain visible and unchanged.

No replacement banner, legal page, tracker, cookie or localStorage processing was added.

## 4. Traveller-context check

Not relevant. This slice only removes an unmounted stale consent artefact. It does not collect, infer or present citizenship, document, residence or route facts.

## 5. Hard exclusions held

Not touched:

- `/privacy`, `/terms`, imprint or invented legal content
- mounted replacement banner
- tracker / analytics SDK
- cookie / localStorage processing expansion
- Data Export files (sibling PR #476)
- Supabase / Auth / RLS / migration / provider / secret / cost
- global continuity documents (`docs/ACTIVE_WORK_STATUS.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `JETNITY_HANDOFF.md`, `docs/CONTINUITY_STANDARD.md`)
- Ready / merge / follow-up slice

An environment-generated `next-env.d.ts` working-tree diff was discarded and is not part of this branch.

## 6. Invariant for a future tracker

If a non-essential tracker is ever introduced, consent/legal handling becomes a **separate explicit Product-Owner / Legal gate**. This slice must not be read as permission to mount a banner, invent copy, or add analytics.

## 7. Live git comparison

Fetched `origin/main` after local gates.

| | |
| --- | --- |
| `origin/main` | `854045a0f37e07d783115dd3a0ee6b302f79bfa1` |
| Merge-base | **`854045a0`** (canonical base, current main) |
| Ahead / behind vs `origin/main` at `121d4d66` | **2 / 0** |
| Files vs `origin/main` | only this slice: CookieConsent delete, `erreichbarkeit.mjs`, two focused tests, four slice docs |

No sibling-branch merge or rebase was performed. Sibling draft PR #476 (Account Data Export 1) was not touched.

## 8. Gates

### 8.1 Local on implementation head `121d4d66`

| Gate | Result |
| --- | --- |
| Focused legal + sanitation tests | PASS – 15/15 |
| `npm test` | PASS – **3460** tests, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS – 0 errors, 138 pre-existing warnings |
| `npm run build` | PASS |
| `check:dead` | PASS – 435 start points, 979 reachable, **0** orphans |
| `check:exports` | PASS – 845 files, 0 unused exports |
| `check:deps` | PASS |
| `check:api-schutz` | PASS – 12/12 |
| `check:schema-bezug` | PASS |

Local production server (`npm start` on the same build) rendered `/`, `/login`, `/register` and `/planen` **without** `CookieConsent`, `jetnity:cookie-consent:v1`, `Views/Likes` or the stale Cookies/LocalStorage measurement sentence.

No Supabase verification is required or claimed: this slice does not touch DB/Auth configuration or Production.

### 8.2 Exact-head remote on `121d4d66`

| Gate | Result |
| --- | --- |
| GitHub Actions | **SUCCESS** – run **#1852** / `35336782908` on `121d4d66` |
| Auth-Konfiguration gegen config.toml | SUCCESS |
| Typecheck, Lint & Build | SUCCESS |
| Vercel Preview | **READY** – deployment `BV4sLNRvpiz9T8bdTE7VmYoh3kpK` / project `jetnity-app` |
| Preview URL | `https://jetnity-app-git-fix-v1-cookie-consent-h-890adb-jetnity-e1b93c82.vercel.app` |

Independent unauthenticated HTML fetch of that Preview hostname followed Vercel SSO (`vercel.com/login?next=/sso-api?...`). Live Preview HTML was therefore **not** independently scraped here. Preview readiness is taken from the Vercel GitHub status (`Deployment has completed`) and the updated Vercel bot comment. Runtime no-banner proof is the local production render above plus source/tests.

This evidence persist is a later head and **invalidates** the `121d4d66` exact-head pair. Re-gate the persist head before any Technical-Lead PASS.

## 9. GitHub / Vercel thread state

PR #477 remains **Draft**, **not Ready**, **not merged**. `mergeable_state=blocked` (draft). Reviews: none. Review comments: none.

Issue comments:
- dispatch from `@Jetnity`;
- Vercel bot, latest update Ready on `BV4sLNRvpiz9T8bdTE7VmYoh3kpK`;
- Cursor bot session acknowledgement.

Issue #475: open, no issue comments, closed-by-PR reference to #477.

No Ready. No merge. No follow-up slice.

## 10. Next step

Independent Technical-Lead exact-head review of the persist head after its CI + Preview. **STOP FOR TECHNICAL-LEAD REVIEW.** Do not Ready. Do not merge.
