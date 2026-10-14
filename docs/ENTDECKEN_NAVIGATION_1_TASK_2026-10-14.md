# Entdecken Navigation 1 — binding TASK NAV-1

14 October 2026. Issue #946; follow-up to completed #942/#943.

## 1. Assignment and baseline

The Owner reports that the existing header item Entdecken still opens /#entdecken instead of the newly released /entdecken page. TL independently confirmed the exact source. Implement only this navigation correction, not another Inspiration feature or a general redesign.

Baseline main: `93b48f239a82e872465cdd6e5693bc5c8defbc71`; tree `7d21935e79ca792a4fd70eee2f0db4473eba5b5b`; mode NORMAL. Branch: `fix/entdecken-navigation-1`. Fresh startup documents, mode and #751/later scoped #748 material take precedence over historical wording.

TL expressly reuses the existing sole writer **Jetnity Reise-Inspiration Explorer 1 — Codex Generation 1**, session `01a1399d-7921-70d3-81b0-1974081a4852`, for this NAV-1 task. This is an explicitly selected follow-up, not autonomous author continuation. Use a separate owned checkout/worktree on this new branch; do not change or append commits to the already merged #943 branch. No new or parallel coding agent. Missing actual session access is a limitation to report, not permission to impersonate it.

## 2. Required result

1. Existing desktop and mobile header Entdecken links go directly to `/entdecken`, with no hash. Preserve the label, ordering, other menu entries, session display, login/logout and plan-entry behavior.
2. Footer product entry Entdecken also goes directly to `/entdecken`.
3. On pathname `/entdecken` (including its query variants), mark that header item as current accessibly (`aria-current="page"`) and with existing active-state styling in both variants. It is not current on `/` or unrelated paths. Preserve existing active behavior of other routes.
4. Selecting the mobile link closes the mobile menu, including selection while already on /entdecken. Preserve Escape/focus restoration, hidden/inert handling, keyboard and ordinary scroll behavior.
5. Keep the homepage `id="entdecken"`, its four direct plan links, the added discovery CTA, and the discovery page's genuine `Zur Startseite` return link to `/#entdecken`. No blanket replacement of anchors. `/entdecken` content, images and plan handoff remain unchanged.

## 3. Exact permitted changes / shared-file approval

Runtime changes are limited to:
- `lib/auth/oeffentliche-navigation.ts`: ONLY the Entdecken href in HAUPTNAVIGATION. Despite its directory name this is a public navigation destination correction, not an Auth capability change. No session functions/types or permission behavior edits.
- `components/layout/PublicNavbar.tsx`: ONLY current-page detection/presentation for Entdecken, aria-current on the existing mapped menu links, and correction of the outdated anchor example comment if necessary. Keep all session/logout and menu-control logic unchanged unless a directly demonstrated task regression needs a TL-approved correction.
- `components/layout/Footer.tsx`: ONLY the Entdecken href in productLinks.

Tests/evidence allowed:
- `lib/auth/oeffentliche-navigation.test.ts`: change the intended route expectation and add narrow navigation regressions; retain all guest/account/unknown/logout assertions.
- New `lib/navigation/entdecken-navigation-1.test.ts` and/or `lib/navigation/entdecken-navigation-1.test.tsx` for focused rendered/header/footer/current-state cases using existing test tooling; no runtime module or dependency platform.
- Optional `scripts/entdecken-navigation-1-audit.mjs` for a small reproducible local navigation check using already installed browser tooling.
- `docs/ENTDECKEN_NAVIGATION_1_REPORT_2026-10-14.md` for consolidated plan/result/self-review/handoff, and sanitized JSON under `docs/evidence/entdecken-navigation-1/`.

This TASK is immutable. No other tracked paths, historical reports or generic test inventories are pre-approved. Read-only inspection is allowed; report exact additional necessary edits rather than broadening the scope.

## 4. Evidence and finish

Record the short implementation plan before coding in the one REPORT. Prove the old/new route expectation, rendered desktop/mobile/footer hrefs, current-page semantics on /entdecken versus /, and preservation of session invariants. One bounded local desktop and mobile navigation exercise must show home -> menu -> actual Entdecken heading/URL, menu close and keyboard operation, with synthetic session doubles when needed. Do not use or modify personal data. Distinguish actual browser execution from static/mocked checks.

Use focused checks while implementing, then required existing final gates and fresh exact-final-HEAD CI/Auth/Preview. No workflow/timeout/assertion relaxation, hidden skips or unnecessary intermediate commits/retries. Existing local PG environment limitations stay documented; no OS/DB setup campaign for this link correction. Do not repeat the nine already-accepted Inspiration image checks or the entire old feature audit. No new screenshot archive is required; sanitized interaction results suffice if they prove the stated scope.

Deliver exact HEAD/tree/parent/base/ahead/behind/diff, task blob unchanged, test failures and successes, original CI/Auth references and exact Preview identity in the consolidated handoff; publish and read back. Raw local logs, private filesystem paths, tokens, personal data and uninspected archives/images are prohibited in public evidence. Retain original failures privately and publish only sanitized summaries/digests.

Only TL marks Ready/merges and checks the actual merged-main deployment/domain, including the corrected header/footer links. The previous missing automatic deployment remains an operational risk, not permission for author redeployment.

## 5. Exclusions and STOP

No Supabase action, blocked DEV-PREP-1 replay/readback workaround/second apply, Official-Truth/BP1/Bern/source request or activation, App/key/backup/credential work, privacy cleanup or history rewriting. No Auth/session/RLS/MFA change, new package/lock/workflow, layout/asset/SEO/noindex/provider/payment change or new recurring service. #913/#626 safety stops and #937 pause remain binding. Own durable Official-Truth database remains the primary unfinished objective, unchanged by NAV-1.

Author commits/pushes only the assigned new branch. No Ready, merge, force-push, new agent or further follow-up. STOP for independent exact-head Technical-Lead review.
