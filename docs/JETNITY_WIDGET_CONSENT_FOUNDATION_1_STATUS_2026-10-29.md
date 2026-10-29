# Jetnity – Shared Widget Consent Foundation 1 — STATUS

**Stand:** 29 October 2026. **Author state:** implementation delivered, **not** a Technical Lead PASS.
**PR:** https://github.com/Jetnity/jetnity/pull/1089 (remains draft).
**Tracking:** #1088. **PO gate:** APPROVE B development only.

## Result

A reusable in-memory choice model and a controlled UI exist for `discovercars` and `twelvego`. Default is `not_decided`. Ablehnen and Zustimmen have the same visual weight. Zustimmen is informative only. `vendorScriptMayExecute` returns `false` even if a caller passes `{ enabled: true }`. Purpose checkboxes are absent because separation is not proved. Nothing is stored. The UI is not mounted in the Trip Workspace or on `/privacy`.

There is **no live tracker** in this slice.

## Exact head

Code evidence and these docs are committed together. The SHA stamp commit, if present, only updates the lines below. Re-check `git rev-parse HEAD` and `git rev-parse HEAD^{tree}` on the PR. A newer head invalidates this note.

- Evidence commit (filled by stamp): `PENDING_EVIDENCE_SHA`
- Evidence tree (filled by stamp): `PENDING_EVIDENCE_TREE`
- `origin/main` at implementation: `e462cf7c5910ce75fa6350928326c04e33d94eee`
- Merge-base at implementation: `e462cf7c5910ce75fa6350928326c04e33d94eee`
- Ahead/behind at implementation start: 1 / 0, plus this slice's commits

## Files

- `lib/privacy/widget-consent/vertrag.ts`
- `lib/privacy/widget-consent/entscheidung.ts`
- `lib/privacy/widget-consent/vertrag.test.ts`
- `lib/privacy/widget-consent/entscheidung.test.ts`
- `lib/privacy/widget-consent/oberflaeche.test.ts`
- `components/privacy/WidgetConsentChoice.tsx`
- `scripts/widget-consent-foundation-1/einbindung.tsx`
- `scripts/widget-consent-foundation-1/harness.ts`
- `docs/JETNITY_WIDGET_CONSENT_FOUNDATION_1_PLAN_2026-10-29.md`
- `docs/JETNITY_WIDGET_CONSENT_FOUNDATION_1_PROPOSED_PRIVACY_2026-10-29.md`
- `docs/JETNITY_WIDGET_CONSENT_FOUNDATION_1_STATUS_2026-10-29.md`
- `docs/JETNITY_WIDGET_CONSENT_FOUNDATION_1_REPORT_2026-10-29.md`
- `docs/JETNITY_WIDGET_CONSENT_FOUNDATION_1_SELF_REVIEW_2026-10-29.md`
- `docs/JETNITY_WIDGET_CONSENT_FOUNDATION_1_HANDOFF_2026-10-29.md`

Immutable task file unchanged. `docs/ACTIVE_WORK_STATUS.md` intentionally not edited.

## Verification on this working tree

| Check | Result |
| --- | --- |
| Focused tests `lib/privacy/widget-consent/*.test.ts` | 18/18 pass |
| Harness `scripts/widget-consent-foundation-1/harness.ts` | exit 0. Viewports 320, 390, 768, 1440. Root 32px at 320. CSS zoom 2 at 390. Keyboard Escape, Tab, Enter through refuse, reopen, informative grant, withdraw, stale grant, reorder, scope change. Foreign requests 0. Horizontal overflow 0 on the non-zoom cases |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0. Same `eslint .` run reports 178 pre-existing warnings and 0 errors. New files are clean at `--max-warnings 0` |
| `npm run check:dead` | 0 ungrounded orphans |
| `npm run check:exports` | 0 ungrounded exports |
| `npm run check:deps` | 0 unused declared packages |
| `npm run check:schema-bezug` | pass |
| `npm run build` | exit 0. Next.js 16.4.1 compiled, TypeScript finished, 26 static pages. Setup check warning: no `.env` / `.env.local` in this environment |

Native GitHub CI and Vercel Preview were **not** observed yet for the final head. They start after push. This author does not treat a green check as a merge reason.

## Boundaries held

No provider script, iframe, GTM, cookie, Consent Mode, database, Auth, package, CI, secret, or paid call. PrivacyBee and `/privacy` untouched. PR stays draft. No Ready. No merge. No follow-up agent.
