# Mobile Accessibility 1 – Exact-Head Handoff

Stand: 16. September 2026  
Status: **STOP FOR TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Logical agent: **`Jetnity mobile accessibility 1`**  
Generation: **1**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/430  
Issue: https://github.com/Jetnity/jetnity/issues/429  
Multi-Agent: **SINGLE_AGENT**

Binding: `docs/MOBILE_ACCESSIBILITY_1_TASK_2026-09-02.md`  
Canonical base: `main@e31e57269e985cb73e1490a0ac6b8ad6bea87725`

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR.

---

## Zuerst lesen

1. Issue #429
2. `docs/MOBILE_ACCESSIBILITY_1_TASK_2026-09-02.md`
3. `docs/MOBILE_ACCESSIBILITY_1_STATUS_2026-09-02.md`
4. `docs/MOBILE_ACCESSIBILITY_1_SELF_REVIEW_2026-09-02.md`
5. `docs/evidence/MOBILE_ACCESSIBILITY_1_AUDIT_2026-09-02.json`
6. `docs/ACTIVE_WORK_STATUS.md`
7. `lib/layout/mobile-accessibility-1.test.ts`
8. `scripts/mobile-accessibility-1-audit.mjs`

Agent self-review is evidence, not Technical-Lead PASS.

---

## What a new chat must know

This is **SINGLE_AGENT** Generation 1. The slice audited the public/guest critical path and fixed only confirmed presentation defects. It is not a redesign and not a new product feature.

Runtime behavior:

- Skip-link focuses the content landmark and respects Reduced Motion.
- Public, account and admin content landmarks are focusable (`tabIndex={-1}`).
- Public mobile menu is a disclosure: `aria-expanded` / `aria-controls="oeffentliche-mobile-navigation"` / `hidden` / `inert`, Escape returns focus, CTAs stack at `min-h-11`.
- `scrollVerhalten()` makes JS `scrollTo` / `scrollIntoView` instant when `prefers-reduced-motion: reduce`.
- Footer links and the touched public/plan controls meet the 44px / visible-focus contract.
- BackToTop stays mounted, blurs before scrolling, clears a skip-link hash, and is `invisible`/`inert` when not shown.
- Guest workspace evidence uses `localStorage` key `jetnity:reise:v3` and a schema-valid trip `trip-a11y-1`. `/ui-audit/trip-workspace` is 404 unless `JETNITY_UI_AUDIT` is set; this slice did not reopen that fixture path.

Hard boundaries held: no DB/Auth/Traveller/Route/Provider/PWA-1/Assistant/payment/indexing change. CookieConsent stays an intentional orphan.

## Transport at handoff write

| Item | Value |
| --- | --- |
| Canonical base | `main@e31e57269e985cb73e1490a0ac6b8ad6bea87725` |
| Task commit | `a49293f8` |
| First implementation | `47425e16` |
| Audit host / fixture harness | `d08490d6` |
| BackToTop mount fix | `d73c4f22` |
| Reduced-motion evidence stabilize | `9aa1a3f8` |
| Final head | **read live on PR #430** |
| Ahead / behind `origin/main` | **re-check live** after this docs tip |
| Draft | stays Draft |

## Changed files versus `origin/main`

| File | Role |
| --- | --- |
| `lib/formular/sicht.ts` + test | JS Reduced-Motion scroll contract |
| `components/layout/SkipToContentLink.tsx` | Skip-link focus + Reduced Motion |
| `app/(public)/layout.tsx`, `app/account/layout.tsx`, `app/(admin)/admin/layout.tsx` | Focusable content landmarks |
| `components/layout/PublicNavbar.tsx` | Mobile disclosure + 44px stack |
| `components/layout/BackToTop.tsx` | Reduced Motion, focus, no unmount |
| `components/layout/Footer.tsx`, `FooterSitzung.tsx` | 44px + focus |
| `TripPlanner.tsx`, `Reiseidee.tsx`, `StartzielForm.tsx`, `GastArbeitsbereich.tsx` | Visible focus / decorative `aria-hidden` |
| `lib/layout/mobile-accessibility-1.test.ts` | Source contracts |
| `scripts/mobile-accessibility-1-audit.mjs` | Chromium viewport/emulation evidence |
| this status / handoff / self-review / evidence / active status | continuity |

## Tests + exact outcomes

| Gate | Outcome |
| --- | --- |
| Targeted a11y + scroll contracts | **pass** |
| `npm test` | **3214/3214 pass** |
| `npm run typecheck` | **pass** |
| `npm run lint` | **0 errors / 138 warnings** |
| Hygiene (`dead` / `exports` / `deps` / `api-schutz` / `schema-bezug`) | **pass** |
| `npm run build` | **pass** |
| `audit:mobile-accessibility-1` | **21/21 pass**, method `browser viewport/emulation`, origin `http://localhost:3000` |
| GitHub Actions exact head `7d2bf376` | **FAILURE** [35140984076](https://github.com/Jetnity/jetnity/actions/runs/35140984076): Typecheck/Lint/Build SUCCESS; Auth-Konfiguration 401 |
| Real device | **not run** |

Exact-head Auth-Konfiguration is red because the Management API rejected `SUPABASE_PROJECT_REF` / `SUPABASE_ACCESS_TOKEN` with 401. Secrets exist in the job env; the ref is neither a readable project nor branch. This slice did not touch Auth or `supabase/config.toml`. Do not change Auth to make CI green. Token/ref repair is outside scope.

If the audit is pointed at `http://127.0.0.1:3000`, Next 16 blocks client chunks and menu / BackToTop / guest workspace fail. That is a harness/origin issue, not a product regression. A second `next dev` in this workspace is refused while the start-user server already owns `:3000`.

## Residual / not this slice

- Physical iPhone/Android Safari QA
- Authenticated account/admin flows beyond shared landmarks
- Cookie banner product decision
- PWA-1 reopen, service worker, offline, push
- Any provider / Production / Traveller / Route / Assistant slice

## Next step

Technical Lead: independent exact-head review of live Draft-PR #430. Cursor must not Ready, merge, or start a follow-up slice.
