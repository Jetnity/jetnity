# Mobile Accessibility 1 – Status

Stand: 16. September 2026  
Status: **IMPLEMENTATION COMPLETE / GATES RECORDED / STOP FOR TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Logical agent: **`Jetnity mobile accessibility 1`**  
Generation: **1**  
PR: [#430](https://github.com/Jetnity/jetnity/pull/430)  
Issue: [#429](https://github.com/Jetnity/jetnity/issues/429)  
Canonical base: `main@e31e57269e985cb73e1490a0ac6b8ad6bea87725`  
Binding: `docs/MOBILE_ACCESSIBILITY_1_TASK_2026-09-02.md`

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR.

Agent self-review is **not** Technical-Lead PASS. Cursor does **not** Ready or merge. No follow-up slice.

---

## 1. Arbeitsblock

SINGLE_AGENT Generation 1. Audit first, then only confirmed P0/P1/P2 responsive/accessibility defects on the public/guest critical path.

Closed slices remain closed and were not reopened:

- Assistant Truth Context 1
- World Map 1
- Destination Essentials 1
- PWA-1 installability / Manifest / icons
- Provider selection, Production S6, gates A–E

## 2. Confirmed defects and fixes

Audit-first findings on the public/guest path, then bounded presentation fixes:

| Severity | Defect | Fix |
| --- | --- | --- |
| P1 | Skip-link activated the hash but did not focus `#public-content` | Click focuses the landmark (`tabIndex={-1}`), `preventDefault`, `replaceState` hash, Reduced-Motion-aware `scrollIntoView` |
| P2 | Mobile menu was not a keyboard-safe disclosure | Always-mounted nav with `aria-expanded` / `aria-controls` / `hidden` / `inert`, Escape + focus return, stacked 44px CTAs |
| P2 | JS `scrollTo` / `scrollIntoView` ignored Reduced Motion | Shared `scrollVerhalten()` in `lib/formular/sicht.ts` |
| P2 | Footer / session footer links were `min-h-10` | `min-h-11` + visible focus |
| P2 | Public/plan controls lacked a visible focus ring | Shared `focus-visible:ring-4` on the touched public/plan controls |
| P2 | Decorative icons were unnamed noise | `aria-hidden="true"` on the touched decorative Lucide icons |
| P2 | BackToTop unmounted while focused and could resettle the page | Stays mounted, blurs before scroll, clears skip-link hash, `invisible`/`inert` when hidden |

`components/layout/CookieConsent.tsx` remains the intentional orphan. It was not wired.

## 3. Gates

Recorded on this working tree before the docs tip. The docs commit moves HEAD; re-check live on PR #430.

| Gate | Outcome |
| --- | --- |
| Targeted contracts `lib/layout/mobile-accessibility-1.test.ts` + `lib/formular/sicht.test.ts` | **pass** |
| `npm test` | **3214/3214 pass** |
| `npm run typecheck` | **pass** |
| `npm run lint` | **0 errors / 138 warnings** (pre-existing; no new errors) |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | **pass** |
| `npm run build` | **pass** |
| Browser audit `npm run audit:mobile-accessibility-1` | **21/21 pass** — Chromium viewport/emulation, origin `http://localhost:3000`, reused existing Next 16.3.3 dev server |
| Physical real-device | **not run** |

Evidence: `docs/evidence/MOBILE_ACCESSIBILITY_1_AUDIT_2026-09-02.json`.

Method is explicitly `browser viewport/emulation`. Do not treat this as a real-device pass.

Harness notes that are **not** product defects:

- Playwright must use `localhost`, not `127.0.0.1`. Next 16 blocks `/_next/static` from `127.0.0.1` when the dev server advertises `localhost` (`allowedDevOrigins`). Without hydration the menu, BackToTop and guest workspace look empty.
- A second `next dev` in the same workspace is refused while PID 1757 already serves `:3000`. The audit reuses that server.
- Reduced-motion BackToTop evidence must emulate `prefers-reduced-motion` **before** an instant downward scroll. A leftover CSS smooth scroll to 1200 can resettle the page after `scrollTo(0)`.

## 4. Traveller Context

Not relevant. This slice does not collect, choose or evaluate citizenships, documents, residence or route.

## 5. Explicit non-touch

Confirmed from the branch diff versus `origin/main`:

- no DB / Supabase / RLS / Auth / session / MFA / AAL change
- no Traveller / Citizenship / Document contract change
- no Route, Official, Provider, secret, paid or live call
- no Production S6 / Commercial Provenance writer
- no Assistant / OpenAI / `Modellfunktion`
- no service worker / offline / push / PWA-1 reopen
- no payments, indexing or public launch
- no new recurring cost

## 6. Nächster Schritt

Independent Technical-Lead exact-head review of live Draft-PR #430.

- **DO NOT MARK READY.**
- **DO NOT MERGE.**
- **DO NOT START A FOLLOW-UP SLICE.**
