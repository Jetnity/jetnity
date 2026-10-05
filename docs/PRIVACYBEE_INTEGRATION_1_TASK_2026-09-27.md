# PrivacyBee integration 1 — Task

Date: 2026-09-27
Owner: ChatGPT Technical Lead
Logical writer: **Jetnity PrivacyBee integration 1**, Generation **1**
New Cursor model: **Grok 4.7 High Fast**, never Auto. Verify actual binding before code writes; if unavailable STOP, do not substitute.
Baseline main: `4d1888f95aec3395e35c785bcb3e0d83301d5cec`
Branch: `feat/privacybee-integration-1`
Canonical issue: #577
Preparation #578 head: `7cf597d0d4564b37ee1f064939b7499c0fa43cff` (read-only).

## Authority and goal
PO explicitly directed: “Wir schliessen auch komplett privacybee ab. Wir warten nicht auf den Support. Diese 2 aufgaben müssen erledigt sein”. Receipt: https://github.com/Jetnity/jetnity/issues/577#issuecomment-5855045581
Complete official vendor-managed German privacy and imprint integration on existing prelaunch https://jetnity.com. Domain Gate A already passed; TL rechecks after merge. This instruction supersedes older docs-only/default-off-publication/wait-for-support restrictions for this bounded implementation and TL-reviewed activation, not public indexing/launch.
PrivacyBee generates and maintains the content. Never create a substitute policy, copy the vendor policy into the repo, or hide/edit vendor paragraphs. Known template statements (banner while disabled, unsupported session-end log deletion, generic analytics/pixels) remain documented residual content questions, not support blockers for this technical delivery. No legal conformity claim.

## Mandatory discovery
Read AGENTS.md, current mode, START_HERE, TL/Multi-Agent standards, vision/architecture/roadmap/decisions/design/quality/continuity and relevant tests. Read existing PrivacyBee contract and preparation REPORT §4 at stated #578 head; this newer task wins where older publication scope conflicts. Read actual widget behavior before readiness detection. Official scripts only, no reverse-engineered content API/proxy.

## Multi-Agent suitability
Mode NORMAL. Decision SINGLE_AGENT: closely coupled pages share lifecycle, footer, metadata and inventory. One Cursor writer, no subordinate writer/review agents. TL independently reviews. #578 six documents are read-only; writer delivered/stopped. No dependency on merging #578. Do not touch another workstream.

## Scope and ownership
- New app/(public)/privacy/page.tsx and app/(public)/impressum/page.tsx.
- Focused components/legal/** and lib/legal/privacybee* modules/types/tests as needed.
- components/layout/Footer.tsx: two legal links with existing styling/accessibility.
- lib/legal/ap6a-gate0-vertrag.ts and inventory test: update only these two route/footer expectations; preserve unrelated auth/consent/indexing/missing /terms assertions.
- lib/seo/oeffentlicher-origin.ts and focused tests only if canonical path typing requires extension; preserve behavior.
- New docs/PRIVACYBEE_INTEGRATION_1_{STATUS,HANDOFF,SELF_REVIEW}_2026-09-27.md.
- Minimal current-state entries in ARCHITECTURE.md, DECISIONS.md, docs/ACTIVE_WORK_STATUS.md for this integration, with pending merge/Production status. No broad rewrite.
No dependency changes expected. Explain needed extra paths before widening. Do not modify CI/rulesets/guards or this TL-owned task.

## Acceptance
1. Both German routes in existing public layout, correct titles/canonical. Preserve noindex/nofollow, robots disallow-all and sitemap paths. No auth needed, no user/account/trip payload to PrivacyBee.
2. Public ID `cmuj24t7p05512zwul6dghfhu`. Official snippets:
```html
<script src="https://app.privacybee.io/widget.js" defer></script>
<privacybee-widget website-id="cmuj24t7p05512zwul6dghfhu" type="dsgvo" lang="de"></privacybee-widget>
```
```html
<script src="https://app.privacybee.io/imprint-widget.js"></script>
<imprint-widget website-id="cmuj24t7p05512zwul6dghfhu" lang="de"></imprint-widget>
```
3. Vendor scripts only on exact browser/request host jetnity.com, route-local, not global. No scripts on localhost, Preview or alternate host. Robust Next16/React19 lifecycle and return/remount, no duplicate custom-element registration. No injection on account/trip routes.
4. Enabled integration on licensed host is authorized after TL merge. Use clearly named reviewed activation constant in scoped config plus simple documented kill switch. No new secret or unperformed Production env change required to work. If server disable-env override is used, missing env matches explicit reviewed activation. Host restriction mandatory.
5. Visible loading, genuine error/timeout/empty-payload handling. Script onLoad alone does not prove content rendered. Inspect vendor DOM/iframe readiness/error signals. Avoid nested main and duplicate h1 where feasible without altering vendor content.
6. Privacy fallback/no-JS/off-host link: https://app.privacybee.io/v/cmuj24t7p05512zwul6dghfhu?lang=de&type=dsgvo . Imprint unavailable/error/no-JS: honest text plus info@jetnity.ch. No invented hosted imprint URL or superseded draft fallback.
7. Preserve vendor content and updates. No SRI hash on mutable script unless officially supplied; document origins/security surface honestly, no broad CSP rewrite.
8. Existing footer touch/focus tokens; usable mobile/desktop width, no new design system.
9. /terms and /datenschutz stay unbuilt. Register /terms gap documented, no fake AGB or expansion into account privacy operations.

## Boundaries/cost
No cookie-banner.js, analytics, ads, consent persistence, DB/migrations/RLS, auth/session changes, provider/model activation, new contracts/DPA acceptance, billing, DNS/mail changes, public indexing or launch. No private rows/secrets. Existing CHF59.35/year continuation approved; no new service cost. No support contact. Writer cannot mutate Production env or manually deploy.

## Verification
Focused meaningful tests for host/activation boundary, route/footer, loading/error/fallback and navigation/remount; update only intentional inventory assertions. Run required typecheck/lint/build and relevant CI gates. Report exact commands/results.
Browser local/Preview proves no vendor scripts on unlicensed host. Controlled request interception may simulate readiness/failure at isolated test origin, never real vendor calls from unlicensed host. Real licensed-host visual/network proof is TL postmerge responsibility. No Preview success as Production proof. Full diff and git diff --check. Keep data boundary explicit.

## Deliverables / STOP
Push this branch and existing Draft PR. Handoff: exact base/head, files, logical name/generation, actual session/model evidence, commands/results, actual visual evidence, unchecked evidence, kill-switch/rollback, residuals, next owner TL.
**Do not mark Ready. Do not merge. Do not start a follow-up slice. STOP for independent TL review.**
TL alone reviews, marks Ready, merges and verifies Production under PO direction above.