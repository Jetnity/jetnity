# Jetnity – Shared Widget Consent Foundation 1 — PLAN

**Stand:** 29 October 2026. **Author:** Jetnity Shared Widget Consent Foundation 1 — Cursor Generation 1.
**Tracking:** https://github.com/Jetnity/jetnity/issues/1088
**PO gate:** APPROVE B development only, https://github.com/Jetnity/jetnity/issues/1087#issuecomment-6508391917
**Immutable task:** `docs/JETNITY_WIDGET_CONSENT_FOUNDATION_1_TASK_V1_2026-10-29.md` (unchanged).

This plan was posted on PR #1089 before any product source change. The PRE-CODE comment is the record of that order.

## Session proof

- `originalModelName`: `grok-4.7-high-fast`
- `bcId`: `bc-dc782027-b7e1-4592-a7ae-b4f709161135`
- Session: https://cursor.com/agents/bc-dc782027-b7e1-4592-a7ae-b4f709161135
- Stored display name after rename: `Jetnity Shared Widget Consent Foundation 1 — Cursor Generation 1`
- Before rename, run-info `name` was `Shared widget consent foundation`.

## Git at start of implementation

- Branch `feat/shared-widget-consent-foundation-1`
- Task-only HEAD `b9d596f3836f591f67ead7c2cd16a11ab3d50740`
- Tree at that HEAD `ffd7497040dfe1c8a6da4c5b2a7fd15d9060d87f`
- `origin/main` and merge-base `e462cf7c5910ce75fa6350928326c04e33d94eee`
- Ahead/behind vs `origin/main`: 1 / 0
- Mode: `NORMAL`
- Uncommitted `next-env.d.ts` dev-path noise was reverted and is not part of this slice.

## Competing ownership

No shared writes with #1084 or #1086. Those PRs keep `components/trips/**`, `lib/providers/discovercars/widget/**`, `lib/providers/twelve-go/widget/**`, and their scripts. This slice adds only new paths under `lib/privacy/widget-consent/**`, `components/privacy/WidgetConsentChoice.tsx`, `scripts/widget-consent-foundation-1/**`, and these task-owned docs.

`/privacy`, PrivacyBee, GetYourGuide copy, Trip Workspace, Auth, SQL, CI, `package.json`, and `docs/ACTIVE_WORK_STATUS.md` stay read-only. The immutable task forbids the active-work file, so continuity for this slice lives here.

## Contract that was implemented

1. Closed provider ids `discovercars` and `twelvego`. Default `not_decided`. No inferred permission.
2. Purposes exist in the model. Individual checkboxes are not shown, because repository purpose-separation proof is `false` for both providers.
3. `vendorScriptMayExecute` returns the literal `false`, including when the caller passes `{ enabled: true }` and when the in-memory choice is `granted`.
4. Generation invalidates stale refuse/grant/close/reopen/withdraw/reorder/scope commands. No cookie, web storage, or account/trip/document persistence.
5. Controlled choice UI with equal-weight Ablehnen and Zustimmen, withdrawal, close, and reopen. Official privacy links only. No script, iframe, or provider request from the component. Not mounted on a production route.
6. Synthetic browser harness for 320, 390, 768, 1440, root 32px, and CSS zoom 2. Third-party requests aborted and counted.

## Out of scope

No vendor script, GTM, Consent Mode, PrivacyBee edit, legal publication, database, package, CI, cost, Ready, or merge. No follow-up slice from this author.
