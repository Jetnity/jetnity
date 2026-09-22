# Registration Consent Interaction 1 — STATUS

Date: 2026-09-22  
Status: **IMPLEMENTED / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**  
Issue: #539  
Draft PR: #540  
Branch: `fix/registration-consent-interaction-1`  
Agent: Jetnity registration consent interaction 1, Generation 1  
Model: Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`)  
Session: `bc-76b92d07-81a0-42b4-9b87-9827d868cadc`  
Baseline: `main@fb4c9ece0a139e2ceebc85dcba35effd0bb5ceee`  
Task seed: `824286f69e8eae560999a9f4d0e0869390c280cc`

## What was delivered

- Hydrated before/after Playwright proof against the actual `Checkbox` plus a RegisterForm-shaped consent row.
- One user action now toggles one native checkbox. Visible, accessible and form state stay aligned.
- Register submit stays disabled until explicit accept; revoke disables it again.
- Legal links still go to `/terms` and `/privacy` and do not toggle consent.
- No signup, email, identity, role, Auth or DB writes.

## Root cause (runtime, not source-only)

On the seed head, one real click on the visible box produced **two** `onCheckedChange` calls (`true` then `false`). Native and visual state stayed unchecked. Two accessible checkboxes existed: a custom `role="checkbox"` span and a 1×1 `sr-only` input inside a wrapping `<label>`.

That matches the competing custom toggle + native label activation. It is emulated Chromium evidence, not a physical iPhone/Safari PASS.

## After correction (settled state)

Chromium desktop / 390 touch / 320: one mouse click, one touch tap, one external-label click and Tab+Space each change native+visual state once. Callback count is 1. Hit area is 44×44. One accessible checkbox. Default remains unchecked.

## Commands

```text
CONSENT_PHASE=before node docs/evidence/registration-consent-interaction-1/interact.mjs
# reproduced=true; one click → callbacks [true, false]; nativeChecked stayed false

CONSENT_PHASE=after node docs/evidence/registration-consent-interaction-1/interact.mjs
# pass=true on chromium-desktop, chromium-iphone-390, chromium-320

node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/ui/checkbox-interaction.test.ts \
  lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts \
  lib/auth/register-meldung.test.ts
# 21/21 pass

npx eslint components/ui/checkbox.tsx components/auth/RegisterForm.tsx lib/ui/checkbox-interaction.test.ts
# 0 errors; 2 pre-existing RegisterForm `any` warnings untouched

npx tsc -p tsconfig.json --noEmit
# pass
```

## Main drift (no merge performed)

Live `origin/main` at handoff read: `5fee5f664e72a5fb946c050cc1f07efdbd50a6ec`  
Merge-base with this branch: `fb4c9ece0a139e2ceebc85dcba35effd0bb5ceee`  
Ahead/behind vs `origin/main`: this branch is 1 commit ahead of the seed and 5 behind later main (`#538` Admin model-usage attention). Disjoint. Not merged.

## Residual limitations

- Playwright WebKit did not launch (host libraries missing). Not real iPhone/Safari evidence.
- Full Next `/register` route was not hydrated here (no local Supabase env; page calls `getUser()`). Harness uses the actual Checkbox/Label and a RegisterForm-identical consent row.
- Exact-head CI / Auth / Vercel Preview / independent TL visual review remain open.

## Next actor

Technical Lead: independent exact-head review. Cursor will not Ready, merge or start a follow-up. Immediate review fixes reuse this session.
