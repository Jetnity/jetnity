# Jetnity – V1 Cookie Consent Hygiene 1 STATUS

Stand: 18. September 2026  
Status: **IMPLEMENTATION COMMITTED / LOCAL AND EXACT-HEAD GATES PENDING / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #475  
Draft PR: #477  
Branch: `fix/v1-cookie-consent-hygiene-1`  
Binding task: `docs/V1_COOKIE_CONSENT_HYGIENE_1_TASK_2026-09-18.md`  
Source audit: #438 / merged PR #449 / finding 1.2(a)  
Canonical base: `main@854045a0f37e07d783115dd3a0ee6b302f79bfa1`  
Dispatch head: `f1a7b82296f72215fb32d2b4c2a43d8d311fd97c`

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
| Non-essential tracking/analytics SDK or injected tracking script added since the audit | **None.** `package.json` has no analytics/tracker dependency. No `gtag` / Sentry / PostHog / Plausible / Mixpanel / Hotjar / Vercel Analytics package. |
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
- Data Export files
- Supabase / Auth / RLS / migration / provider / secret / cost
- global continuity documents (`docs/ACTIVE_WORK_STATUS.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `JETNITY_HANDOFF.md`, `docs/CONTINUITY_STANDARD.md`)
- Ready / merge / follow-up slice

An environment-generated `next-env.d.ts` working-tree diff was discarded and is not part of this branch.

## 6. Invariant for a future tracker

If a non-essential tracker is ever introduced, consent/legal handling becomes a **separate explicit Product-Owner / Legal gate**. This slice must not be read as permission to mount a banner, invent copy, or add analytics.

## 7. Gates

Local and exact-head GitHub CI / Vercel Preview are **pending** on this implementation commit. Results will be written after they exist. No gate is claimed green here.

No Supabase verification is required or claimed: this slice does not touch DB/Auth configuration or Production.

## 8. Next step

1. Run the required local gates on this implementation head.
2. Persist exact-head CI / Preview / `origin/main` drift evidence.
3. Stop for independent Technical-Lead review.
4. Do not Ready. Do not merge.
