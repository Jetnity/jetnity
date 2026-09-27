# PrivacyBee integration 1 — Handoff

Date: 2026-09-27
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**
Logical writer: **Jetnity PrivacyBee integration 1**, Generation **1**
Session: https://cursor.com/agents/bc-a147647d-4bb1-4136-a0a2-045e201f5c6a
Session id: `bc-a147647d-4bb1-4136-a0a2-045e201f5c6a`
Actual model: `grok-4.7-high-fast` from `cursor-cloud run-info` field `originalModelName`, checked before code writes. Required binding was Grok 4.7 High Fast, never Auto. No substitute was used.
Branch: `feat/privacybee-integration-1`
Draft PR: https://github.com/Jetnity/jetnity/pull/579
Base: `4d1888f95aec3395e35c785bcb3e0d83301d5cec`
Task seed: `5277b53ebd0ad7b4591df44dd177c19164211867`
Preparation #578 head, read-only: `7cf597d0d4564b37ee1f064939b7499c0fa43cff`
Mode: `NORMAL`

Cursor does not mark Ready, does not merge, and does not start a follow-up slice.

## What landed

`/privacy` and `/impressum` are German pages in `app/(public)`. Titles are `Datenschutzerklärung` and `Impressum`. Canonicals are `https://jetnity.com/privacy` and `https://jetnity.com/impressum`. Both set `noindex, nofollow`. `robots.txt` stays disallow-all. Sitemap paths stay `/` and `/planen`; with indexing off the live sitemap is empty.

Vendor scripts:

- `https://app.privacybee.io/widget.js` on `<privacybee-widget website-id="cmuj24t7p05512zwul6dghfhu" type="dsgvo" lang="de">`
- `https://app.privacybee.io/imprint-widget.js` on `<imprint-widget website-id="cmuj24t7p05512zwul6dghfhu" lang="de">`

The public id is an embed identifier, not a secret. No `NEXT_PUBLIC_` variable was added.

Reviewed activation `PRIVACYBEE_GEPRUEFTE_AKTIVIERUNG` is `true`. Server kill switch: `PRIVACYBEE_KILL_SWITCH=aus` (trimmed exact value). Missing env keeps the reviewed activation. Host restriction is mandatory: request `Host` and `location.hostname` must both be exactly `jetnity.com`. `www`, localhost, `*.vercel.app` and every other host get no script.

Script insertion is route-local, once per tag, and refused when `customElements.get` already has the tag or the script node already exists. Remount reuses the defined element. `onload` is not treated as rendered content.

Readiness comes from the official widgets as read on 27 September 2026. Both are react-to-webcomponent builds and paint into the light DOM, not an iframe and not a shadow root. Privacy loading text is `Loading...`. Privacy errors are the three German sentences in `widget.js`, or a `p.text-slate-900` with no heading. Imprint loading text is `Wird geladen...`. Imprint errors include `Fehler beim Laden des Impressums`. A heading that is not an error, or a body of at least 240 characters, counts as ready. Empty or still-loading markup after 12 seconds becomes Jetnity's own error. Our code does not call `/api/widgets` or `/api/imprints`.

Fallbacks: privacy links to `https://app.privacybee.io/v/cmuj24t7p05512zwul6dghfhu?lang=de&type=dsgvo` and says this page does not copy that statement. Imprint says it is unavailable and links `mailto:info@jetnity.ch`. No hosted imprint URL was invented. No draft policy text is used. `<noscript>` carries the same fallback on a licensed embed.

The footer Jetnity column links Datenschutzerklärung and Impressum with the existing touch and focus classes. Navbar and `/terms` are unchanged. `/terms` remains 404.

## Files

- `app/(public)/privacy/page.tsx`
- `app/(public)/impressum/page.tsx`
- `components/legal/PrivacyBeeEinbettung.tsx`
- `components/layout/Footer.tsx`
- `lib/legal/privacybee-vertrag.ts`
- `lib/legal/privacybee-integration.test.ts`
- `lib/legal/ap6a-gate0-vertrag.ts`
- `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts`
- `ARCHITECTURE.md`
- `DECISIONS.md` ADR-0213
- `docs/ACTIVE_WORK_STATUS.md`
- this status, handoff and self-review

#578 preparation files were not modified.

## Commands and results

| Command | Result |
| --- | --- |
| `npx tsc -p tsconfig.json --noEmit --incremental false` | exit 0 |
| `npm run lint` | exit 0. 146 pre-existing warnings, none in this slice |
| `npm test` | 3944 pass, 0 fail, 703 suites |
| `npm run build` | exit 0. Routes `/privacy` and `/impressum` are dynamic (`ƒ`) |
| `node scripts/exporte.mjs` | pass |
| `node scripts/erreichbarkeit.mjs` | pass, 0 orphans |
| `node scripts/api-schutz.mjs` | pass |
| `node scripts/pakete.mjs` | pass |
| `node scripts/db/verwendung.mjs --pruefen` | pass |
| `git diff --check` | pass |
| Playwright Chromium against `npx next start -p 3000` | see below |

Local browser, host `127.0.0.1`:

- `/privacy` and `/impressum`, 390px and 1280px: HTTP 200, zero requests whose URL contains `privacybee`, zero `script[src*="privacybee"]`, zero `privacybee-widget` / `imprint-widget`.
- Privacy shows the hosted-statement link. Imprint shows the unavailable text and `info@jetnity.ch`.
- Footer click from `/` lands on `/privacy` and still issues no vendor request.
- `/planen`, `/` and `/reisen` HTML contain no vendor script.
- `/terms` is 404.
- HTML canonical is `https://jetnity.com/privacy`. Robots meta is `noindex, nofollow`. `robots.txt` is `Disallow: /`. Sitemap urlset is empty while indexing is off.

Screenshots from that local run are attached on the PR. They show the unlicensed fallback, not the live widget.

## Kill switch and rollback

1. Set server env `PRIVACYBEE_KILL_SWITCH` to `aus` and redeploy or restart. No new secret. This writer did not change Production env.
2. Or set `PRIVACYBEE_GEPRUEFTE_AKTIVIERUNG` to `false` and ship that commit.
3. Either path removes `app.privacybee.io` scripts. The pages stay up with the hosted privacy link or the imprint contact. They do not render an empty success.

## Security and cost

Third-party script origin is `https://app.privacybee.io` for `widget.js`, `imprint-widget.js`, and the stylesheets those scripts insert (`widget.css`, `imprint-widget.css`). The widgets then fetch their own content from that origin. No SRI hash was supplied; none was invented. No CSP rewrite. The repository has no CSP. A later platform CSP would need that origin for script, style and connect. Not done here.

The privacy widget sets `--custom-title-color` and `--custom-body-color` on `documentElement`. Leaving `/privacy` removes those two properties. That does not edit vendor paragraphs.

No account, trip, traveller, document or session payload is passed to PrivacyBee. The embed is absent from account and trip routes. No cookie banner, no consent store, no DB, no auth change.

Existing CHF 59.35/year continuation stays as already approved. No new service cost. No support contact. No billing change.

## Residuals

- Known vendor wording (banner sentence while the banner is disabled, unsupported session-end log deletion, generic analytics/pixels) stays a content question. Not a support blocker. No legal conformity claim.
- `/terms` is still 404. Register still links it.
- Real licensed-host proof is the Technical Lead's post-merge check. Local and Preview success are not Production proof.
- Vendor error copy can change. The 12-second timeout and the structural error classes are the backstop. A long unrecognized error that includes an `h1` could be classified as ready; the vendor text would still be visible.
- No-JS on the licensed host sees the fallback inside `<noscript>`. The empty custom element does not by itself request the vendor.
- `ROADMAP.md` still describes the pre-integration 404 state. This slice's current-state notes are ADR-0213, `ARCHITECTURE.md` and `docs/ACTIVE_WORK_STATUS.md`. Roadmap refresh belongs with merge, not a second writer slice.
- `npm run lint` passed locally. CI remains the independent gate.

## Next owner

Technical Lead. Review this exact head. If it passes, Ready and merge are yours, then verify existing prelaunch `https://jetnity.com`. Do not treat this handoff as that review.
