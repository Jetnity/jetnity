# Jetnity – Shared Widget Consent Foundation 1 — STATUS

**Stand:** 29 October 2026. **Author state:** implementation delivered, **not** a Technical Lead PASS.
**PR:** https://github.com/Jetnity/jetnity/pull/1089 (remains draft).
**Tracking:** #1088. **PO gate:** APPROVE B development only.

## Result

A reusable in-memory choice model and a controlled UI exist for `discovercars` and `twelvego`. Default is `not_decided`. Ablehnen and Zustimmen have the same visual weight. Zustimmen sets only `informative: 'granted'`. It does not set `functional_load`, `nonessential_analytics`, or `advertising_marketing` to `granted`. Those purpose fields stay `not_decided` while separation is unverified. Refuse still sets every purpose to `refused`. `vendorScriptMayExecute` returns `false` even if a caller passes `{ enabled: true }`. Purpose checkboxes are absent. Nothing is stored. The UI is not mounted in the Trip Workspace or on `/privacy`.

R1-F1 corrects head `5edff201f83b46787c829f749765163daf203b69`, which had copied `granted` into all three purpose fields. That head is not the review head.

There is **no live tracker** in this slice.

## Exact head

R1-F1 supersedes review head `5edff201f83b46787c829f749765163daf203b69` (tree `557a417082968a6df3d13f24a1ea4b1e5b8a0a42`). That head's purpose map wrote `granted` into analytics and marketing. The correction commit and tree below are the new review head. A later head invalidates this note.

- R1 correction commit: `8d6f18c74fde610c848147210eea7292181824a9`
- R1 correction tree: `48662af750e5f7d60053896bf94969b4e06a4de1`
- `origin/main` and merge-base: `e462cf7c5910ce75fa6350928326c04e33d94eee`
- Ahead/behind after the SHA stamp: 5 / 0

Focused tests, harness, typecheck, lint of the changed files, dead/exports/schema-bezug, and production build were run on `8d6f18c74fde610c848147210eea7292181824a9` before these two hashes were written. The stamp commit changes only this status block. Focused tests were run again on the stamp head before push.

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
